import {
  clearShopAdminDB,
  createShopDB,
  deleteShopDB,
  getShopByIdDB,
  getShopsDB,
  updateShopDB,
} from "../models/shops/shop.model.js";
import {
  createShopApplicationDB,
  getShopApplicationByIdDB,
  getShopApplicationsDB,
  hasPendingShopApplicationDB,
  updateShopApplicationDB,
} from "../models/shops/shopApplication.model.js";
import OrderSchema from "../models/orders/order.schema.js";
import ProductSchema from "../models/products/product.schema.js";
import {
  findUserById,
  getAllUsers,
  getUserByEmail,
  registerUserModel,
  updateUser,
  updateUsers,
} from "../models/users/user.model.js";
import { encryptPassword } from "../utils/bcrypt.js";
import { toPublicUser } from "../utils/userPublic.js";
import { writeAuditLog } from "./platform.controller.js";

const publicShop = (shop) => {
  if (!shop) return null;
  return typeof shop.toObject === "function" ? shop.toObject() : shop;
};

const buildAdminFields = async (adminId) => {
  if (!adminId) {
    return { adminId: null, adminName: "", adminEmail: "" };
  }

  const admin = await findUserById(adminId);
  if (!admin) {
    const error = new Error("Assigned Shop Admin was not found.");
    error.statusCode = 404;
    throw error;
  }

  if (admin.role === "superadmin") {
    const error = new Error("Super Admin accounts cannot be assigned as Shop Admin.");
    error.statusCode = 400;
    throw error;
  }

  return {
    adminId: admin._id,
    adminName: [admin.fName, admin.lName].filter(Boolean).join(" "),
    adminEmail: admin.email,
  };
};

const syncShopAdmin = async (shop, previousAdminId = null) => {
  if (previousAdminId && String(previousAdminId) !== String(shop.adminId || "")) {
    await updateUser(
      { _id: previousAdminId, role: "admin", shopId: String(shop._id) },
      { role: "customer", shopId: "", shopName: "" }
    );
  }

  if (shop.adminId) {
    await clearShopAdminDB(shop.adminId, shop._id);
    await updateUser(
      { _id: shop.adminId },
      {
        role: "admin",
        shopId: String(shop._id),
        shopName: shop.name,
      }
    );
  }
};

const sanitizeShopPayload = (body = {}) => ({
  name: body.name,
  description: body.description || "",
  status: body.status || "active",
  contactEmail: body.contactEmail || "",
  phone: body.phone || "",
  address: body.address || "",
  paymentProvider: body.paymentProvider || "manual",
  payoutAccountName: body.payoutAccountName || "",
  payoutAccountEmail: body.payoutAccountEmail || "",
  payoutAccountId: body.payoutAccountId || "",
  bankName: body.bankName || "",
  bankAccountLast4: body.bankAccountLast4 || "",
  payoutCurrency: body.payoutCurrency || "AUD",
  paymentSetupStatus: body.paymentSetupStatus || "pending",
});

const toCurrency = (value) => Number(value || 0);

const formatApplication = (application) => {
  const data = publicShop(application);
  if (!data) return null;
  delete data.adminPasswordHash;
  return data;
};

const sanitizeShopApplicationPayload = (body = {}) => ({
  shopName: body.shopName?.trim(),
  description: body.description || "",
  businessCategory: body.businessCategory || "",
  businessType: body.businessType || "",
  ownerFirstName: body.ownerFirstName?.trim(),
  ownerLastName: body.ownerLastName?.trim(),
  ownerEmail: body.ownerEmail?.trim()?.toLowerCase(),
  ownerPhone: body.ownerPhone?.trim(),
  contactEmail: body.contactEmail || body.ownerEmail || "",
  phone: body.phone || body.ownerPhone || "",
  address: body.address?.trim(),
  city: body.city || "",
  country: body.country || "",
  taxId: body.taxId || "",
  registrationNumber: body.registrationNumber || "",
  paymentProvider: body.paymentProvider || "manual",
  payoutAccountName: body.payoutAccountName?.trim(),
  payoutAccountEmail: body.payoutAccountEmail?.trim()?.toLowerCase(),
  payoutAccountId: body.payoutAccountId || "",
  bankName: body.bankName || "",
  bankAccountLast4: body.bankAccountLast4 || "",
  payoutCurrency: body.payoutCurrency || "AUD",
});

const requireShopApplicationFields = (payload, password) => {
  const requiredFields = [
    "shopName",
    "ownerFirstName",
    "ownerLastName",
    "ownerEmail",
    "ownerPhone",
    "address",
    "payoutAccountName",
    "payoutAccountEmail",
  ];
  const missing = requiredFields.filter((field) => !payload[field]);
  if (!password) missing.push("password");
  if (missing.length) {
    const error = new Error(`Missing required shop registration fields: ${missing.join(", ")}.`);
    error.statusCode = 400;
    throw error;
  }
};

const buildShopPerformance = (shops, products, orders, users) => {
  const shopMap = new Map(
    shops.map((shop) => [
      String(shop._id),
      {
        ...publicShop(shop),
        revenue: 0,
        orders: 0,
        products: 0,
        deliveredOrders: 0,
        pendingOrders: 0,
      },
    ])
  );

  products.forEach((product) => {
    const shop = shopMap.get(String(product.shopId || ""));
    if (shop) shop.products += 1;
  });

  orders.forEach((order) => {
    const fulfillments = order.fulfillments || [];
    if (!fulfillments.length && order.products?.length) {
      order.products.forEach((product) => {
        const shop = shopMap.get(String(product.shopId || ""));
        if (!shop) return;
        shop.revenue += toCurrency(product.totalAmount || (Number(product.price || 0) * Number(product.quantity || 1)));
        shop.orders += 1;
        if (order.status === "delivered") shop.deliveredOrders += 1;
        if (["pending", "confirmed"].includes(order.status)) shop.pendingOrders += 1;
      });
      return;
    }
    fulfillments.forEach((fulfillment) => {
      const shop = shopMap.get(String(fulfillment.shopId || ""));
      if (!shop) return;
      shop.revenue += toCurrency(fulfillment.totalAmount);
      shop.orders += 1;
      if (fulfillment.status === "delivered") shop.deliveredOrders += 1;
      if (["pending", "confirmed"].includes(fulfillment.status)) shop.pendingOrders += 1;
    });
  });

  return [...shopMap.values()].sort((a, b) => b.revenue - a.revenue);
};

export const createShopController = async (req, res, next) => {
  try {
    const adminFields = await buildAdminFields(req.body.adminId);
    const shop = await createShopDB({
      ...sanitizeShopPayload(req.body),
      ...adminFields,
    });

    await syncShopAdmin(shop);

    return res.status(201).json({
      status: "success",
      message: "Shop created successfully.",
      shop: publicShop(shop),
    });
  } catch (error) {
    next({
      statusCode: error.statusCode || 500,
      message: error.message || "Error while creating shop",
      errorMessage: error.message,
    });
  }
};

export const getShopsController = async (_req, res, next) => {
  try {
    const [shops, products, orders] = await Promise.all([
      getShopsDB(),
      ProductSchema.find({}).select("shopId").lean(),
      OrderSchema.find({}).select("products fulfillments status").lean(),
    ]);
    const performanceByShop = new Map(
      buildShopPerformance(shops, products, orders).map((shop) => [String(shop._id), shop])
    );
    return res.status(200).json({
      status: "success",
      message: "Shops listed successfully.",
      shops: shops.map((shop) => ({
        ...publicShop(shop),
        revenue: performanceByShop.get(String(shop._id))?.revenue || 0,
        orders: performanceByShop.get(String(shop._id))?.orders || 0,
        products: performanceByShop.get(String(shop._id))?.products || 0,
        deliveredOrders: performanceByShop.get(String(shop._id))?.deliveredOrders || 0,
        pendingOrders: performanceByShop.get(String(shop._id))?.pendingOrders || 0,
      })),
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while listing shops",
      errorMessage: error.message,
    });
  }
};

export const getMyShopController = async (req, res, next) => {
  try {
    const shop = req.userData?.shopId
      ? await getShopByIdDB(req.userData.shopId)
      : null;

    return res.status(200).json({
      status: "success",
      message: shop ? "Shop found." : "No shop assigned.",
      shop: publicShop(shop),
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while fetching shop",
      errorMessage: error.message,
    });
  }
};

export const submitShopApplicationController = async (req, res, next) => {
  try {
    const payload = sanitizeShopApplicationPayload(req.body);
    requireShopApplicationFields(payload, req.body?.password);

    const existingUser = await getUserByEmail({ email: payload.ownerEmail });
    if (existingUser) {
      return next({
        statusCode: 409,
        message: "This email already belongs to an account. Please log in and contact support to attach a shop.",
      });
    }

    const pendingApplication = await hasPendingShopApplicationDB(payload.ownerEmail);
    if (pendingApplication) {
      return next({
        statusCode: 409,
        message: "A shop registration from this email is already waiting for review.",
      });
    }

    const adminPasswordHash = await encryptPassword(req.body.password);
    const application = await createShopApplicationDB({
      ...payload,
      adminPasswordHash,
      status: "pending",
    });

    return res.status(201).json({
      status: "success",
      message: "Shop registration submitted. Super Admin will review it before the shop goes live.",
      application: formatApplication(application),
    });
  } catch (error) {
    next({
      statusCode: error.statusCode || 500,
      message: error.message || "Error while submitting shop registration",
      errorMessage: error.message,
    });
  }
};

export const getShopApplicationsController = async (req, res, next) => {
  try {
    const filter = req.query.status && req.query.status !== "all"
      ? { status: req.query.status }
      : {};
    const applications = await getShopApplicationsDB(filter);
    return res.status(200).json({
      status: "success",
      message: "Shop registrations listed successfully.",
      applications: applications.map(formatApplication),
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while listing shop registrations",
      errorMessage: error.message,
    });
  }
};

export const respondShopApplicationController = async (req, res, next) => {
  try {
    const { decision, responseMessage = "" } = req.body;
    const isApproved = decision === "approved";
    const isRejected = decision === "rejected";

    if (!isApproved && !isRejected) {
      return next({
        statusCode: 400,
        message: "Decision must be approved or rejected.",
      });
    }

    const application = await getShopApplicationByIdDB(req.params.id, true);
    if (!application) {
      return next({ statusCode: 404, message: "Shop registration not found." });
    }

    if (application.status !== "pending") {
      return next({
        statusCode: 400,
        message: "This shop registration has already been reviewed.",
      });
    }

    if (isRejected) {
      const rejected = await updateShopApplicationDB(application._id, {
        status: "rejected",
        responseMessage,
        reviewedBy: req.userData?._id,
        reviewedAt: new Date(),
      });

      await writeAuditLog(
        req.userData,
        "shop_application_rejected",
        "shop_application",
        rejected._id,
        `Rejected shop application for ${rejected.shopName}.`,
        { responseMessage }
      );

      return res.status(200).json({
        status: "success",
        message: "Shop registration rejected.",
        application: formatApplication(rejected),
      });
    }

    const existingUser = await getUserByEmail({ email: application.ownerEmail });
    if (existingUser) {
      return next({
        statusCode: 409,
        message: "An account with this email now exists. Reject this request and ask the owner to contact support.",
      });
    }

    const admin = await registerUserModel({
      fName: application.ownerFirstName,
      lName: application.ownerLastName,
      email: application.ownerEmail,
      phone: Number(application.ownerPhone) || 0,
      password: application.adminPasswordHash,
      role: "admin",
      verified: true,
      address: application.address,
      adminRequest: {
        status: "approved",
        message: "Approved through shop registration.",
        requestedAt: application.createdAt,
        respondedAt: new Date(),
        responseMessage,
      },
    });

    const shop = await createShopDB({
      name: application.shopName,
      description: application.description,
      status: "active",
      adminId: admin._id,
      adminName: [admin.fName, admin.lName].filter(Boolean).join(" "),
      adminEmail: admin.email,
      contactEmail: application.contactEmail || application.ownerEmail,
      phone: application.phone || application.ownerPhone,
      address: [application.address, application.city, application.country].filter(Boolean).join(", "),
      paymentProvider: application.paymentProvider,
      payoutAccountName: application.payoutAccountName,
      payoutAccountEmail: application.payoutAccountEmail,
      payoutAccountId: application.payoutAccountId,
      bankName: application.bankName,
      bankAccountLast4: application.bankAccountLast4,
      payoutCurrency: application.payoutCurrency,
      paymentSetupStatus: "pending",
    });

    await updateUser(
      { _id: admin._id },
      {
        shopId: String(shop._id),
        shopName: shop.name,
      }
    );

    const approved = await updateShopApplicationDB(application._id, {
      status: "approved",
      responseMessage,
      reviewedBy: req.userData?._id,
      reviewedAt: new Date(),
      createdShopId: shop._id,
      createdAdminId: admin._id,
    });

    await writeAuditLog(
      req.userData,
      "shop_application_approved",
      "shop_application",
      approved._id,
      `Approved shop application for ${approved.shopName}.`,
      { shopId: String(shop._id), adminId: String(admin._id) }
    );

    return res.status(200).json({
      status: "success",
      message: "Shop registration approved. Shop and Shop Admin account are ready.",
      application: formatApplication(approved),
      shop: publicShop(shop),
      admin: toPublicUser(admin),
    });
  } catch (error) {
    next({
      statusCode: error.statusCode || 500,
      message: error.message || "Error while reviewing shop registration",
      errorMessage: error.message,
    });
  }
};

export const getPlatformOverviewController = async (_req, res, next) => {
  try {
    const [shops, products, orders, users, applications] = await Promise.all([
      getShopsDB(),
      ProductSchema.find({})
        .select("shopId status stock createdAt")
        .lean(),
      OrderSchema.find({})
        .select("products fulfillments totalAmount status createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      getAllUsers({}),
      getShopApplicationsDB({}),
    ]);

    const shopPerformance = buildShopPerformance(shops, products, orders, users);
    const totalRevenue = shopPerformance.reduce((sum, shop) => sum + shop.revenue, 0);
    const totalShopOrders = shopPerformance.reduce((sum, shop) => sum + shop.orders, 0);
    const pendingApplications = applications.filter((item) => item.status === "pending");
    const paymentPendingShops = shops.filter((shop) => shop.paymentSetupStatus !== "verified");
    const activeShops = shops.filter((shop) => shop.status === "active");
    const lowPerformingShops = shopPerformance
      .filter((shop) => shop.status === "active" && shop.orders === 0)
      .slice(0, 5);

    return res.status(200).json({
      status: "success",
      message: "Platform overview loaded.",
      metrics: {
        totalRevenue,
        totalShopOrders,
        totalShops: shops.length,
        activeShops: activeShops.length,
        totalProducts: products.length,
        activeProducts: products.filter((product) => product.status === "active").length,
        lowStockProducts: products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) < 30).length,
        totalCustomers: users.filter((user) => user.role === "customer").length,
        totalShopAdmins: users.filter((user) => user.role === "admin").length,
        pendingApplications: pendingApplications.length,
        paymentPendingShops: paymentPendingShops.length,
      },
      shopPerformance,
      topShops: shopPerformance.slice(0, 5),
      lowPerformingShops,
      paymentPendingShops: paymentPendingShops.map(publicShop),
      recentApplications: applications.slice(0, 6).map(formatApplication),
      recentOrders: orders.slice(0, 6),
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while loading platform overview",
      errorMessage: error.message,
    });
  }
};

export const getShopOverviewController = async (req, res, next) => {
  try {
    const shop = await getShopByIdDB(req.params.id);
    if (!shop) {
      return next({ statusCode: 404, message: "Shop not found." });
    }

    const shopId = String(shop._id);
    const [users, products, orders] = await Promise.all([
      getAllUsers({ shopId }),
      ProductSchema.find({ shopId })
        .select("name price status images category stock ratings createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean(),
      OrderSchema.find({ shopIds: shopId })
        .select("userId products fulfillments shopIds totalAmount status shippingAddress createdAt updatedAt expectedDeliveryDate")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const publicUsers = users.map(toPublicUser);
    const admins = publicUsers.filter((user) => user.role === "admin" && String(user.shopId || "") === shopId);
    const shopFulfillments = orders.flatMap((order) => {
      const fulfillments = (order.fulfillments || []).filter((item) => String(item.shopId) === shopId);
      if (fulfillments.length) return fulfillments;
      const products = (order.products || []).filter((item) => String(item.shopId) === shopId);
      if (!products.length) return [];
      return [{
        shopId,
        shopName: products[0]?.shopName || shop.name,
        products,
        totalAmount: products.reduce((sum, item) => sum + Number(item.totalAmount || (Number(item.price || 0) * Number(item.quantity || 1))), 0),
        status: order.status,
      }];
    });
    const totalRevenue = shopFulfillments.reduce((sum, fulfillment) => sum + Number(fulfillment.totalAmount || 0), 0);
    const inventory = {
      totalProducts: products.length,
      totalStock: products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
      lowStock: products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) < 30).length,
      outOfStock: products.filter((product) => Number(product.stock || 0) <= 0).length,
      activeProducts: products.filter((product) => product.status === "active").length,
      inactiveProducts: products.filter((product) => product.status === "inactive").length,
    };
    const analytics = {
      totalOrders: shopFulfillments.length,
      totalRevenue,
      averageOrderValue: shopFulfillments.length ? totalRevenue / shopFulfillments.length : 0,
      pendingOrders: shopFulfillments.filter((item) => item.status === "pending").length,
      deliveredOrders: shopFulfillments.filter((item) => item.status === "delivered").length,
      cancelledOrders: shopFulfillments.filter((item) => ["cancelled", "canceled"].includes(item.status)).length,
    };
    const shopOrders = orders.map((order) => {
      let fulfillments = (order.fulfillments || []).filter((item) => String(item.shopId) === shopId);
      if (!fulfillments.length) {
        const products = (order.products || []).filter((item) => String(item.shopId) === shopId);
        if (products.length) {
          fulfillments = [{
            shopId,
            shopName: products[0]?.shopName || shop.name,
            products,
            totalAmount: products.reduce((sum, item) => sum + Number(item.totalAmount || (Number(item.price || 0) * Number(item.quantity || 1))), 0),
            status: order.status,
          }];
        }
      }
      return {
        ...order,
        fulfillments,
        products: fulfillments.flatMap((item) => item.products || []),
        totalAmount: fulfillments.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
        status: fulfillments.length === 1 ? fulfillments[0].status : order.status,
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Shop overview loaded.",
      shop: publicShop(shop),
      users: publicUsers,
      admins,
      products,
      orders: shopOrders,
      inventory,
      analytics,
      settings: {
        status: shop.status,
        contactEmail: shop.contactEmail,
        phone: shop.phone,
        address: shop.address,
        description: shop.description,
        paymentProvider: shop.paymentProvider,
        payoutAccountName: shop.payoutAccountName,
        payoutAccountEmail: shop.payoutAccountEmail,
        payoutAccountId: shop.payoutAccountId,
        bankName: shop.bankName,
        bankAccountLast4: shop.bankAccountLast4,
        payoutCurrency: shop.payoutCurrency,
        paymentSetupStatus: shop.paymentSetupStatus,
      },
      related: {
        recentProducts: products.slice(0, 5),
        recentOrders: shopOrders.slice(0, 5),
      },
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while loading shop overview",
      errorMessage: error.message,
    });
  }
};

export const updateShopController = async (req, res, next) => {
  try {
    const existingShop = await getShopByIdDB(req.params.id);
    if (!existingShop) {
      return next({ statusCode: 404, message: "Shop not found." });
    }

    const adminFields = Object.prototype.hasOwnProperty.call(req.body, "adminId")
      ? await buildAdminFields(req.body.adminId)
      : {};

    const updatedShop = await updateShopDB(req.params.id, {
      ...sanitizeShopPayload({ ...existingShop.toObject(), ...req.body }),
      ...adminFields,
    });

    await syncShopAdmin(updatedShop, existingShop.adminId);

    return res.status(200).json({
      status: "success",
      message: "Shop updated successfully.",
      shop: publicShop(updatedShop),
    });
  } catch (error) {
    next({
      statusCode: error.statusCode || 500,
      message: error.message || "Error while updating shop",
      errorMessage: error.message,
    });
  }
};

export const deleteShopController = async (req, res, next) => {
  try {
    const shop = await getShopByIdDB(req.params.id);
    if (!shop) {
      return next({ statusCode: 404, message: "Shop not found." });
    }

    await updateUsers(
      { shopId: String(shop._id), role: "admin" },
      { $set: { role: "customer", shopId: "", shopName: "" } }
    );
    const deletedShop = await deleteShopDB(req.params.id);

    return res.status(200).json({
      status: "success",
      message: "Shop deleted successfully.",
      shop: publicShop(deletedShop),
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while deleting shop",
      errorMessage: error.message,
    });
  }
};
