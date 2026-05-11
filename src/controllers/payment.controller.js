import Stripe from "stripe";
import { findCart } from "../models/cart/cart.model.js";
import { createOrderDB, getOrderDB, updateOrderDB } from "../models/orders/order.model.js";
import { findUserById } from "../models/users/user.model.js";
import { createOrderEmail } from "../services/email.service.js";
import { updateProductDB } from "../models/products/product.model.js";
import ProductSchema from "../models/products/product.schema.js";
import { generateRandomInvoiceNumber } from "./invoice.controller.js";
import { createInvoice, getInvoice } from "../models/invoices/invoices.model.js";
import { generateInvoice } from "../services/generateInvoice.js";
import { streamToBuffer } from "../utils/streamToBuffer.js";

let stripeClient;

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required for payment processing.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
};

const buildStockError = (issues) => ({
  status: "error",
  message:
    issues.length === 1
      ? issues[0].message
      : "Some items in your cart are unavailable or exceed available stock.",
  stockIssues: issues,
});

const validateCartStock = async (cart) => {
  if (!cart || !cart.cartItems?.length) {
    return {
      ok: false,
      issues: [{ message: "Cart is empty." }],
      items: [],
      totalAmount: 0,
    };
  }

  const issues = [];
  const items = [];

  for (const item of cart.cartItems) {
    const product = await ProductSchema.findById(item._id).lean();
    const quantity = Number(item.quantity || 0);

    if (!product) {
      issues.push({
        productId: item._id,
        productName: item.name || "Product",
        requested: quantity,
        available: 0,
        message: `${item.name || "This product"} is no longer available.`,
      });
      continue;
    }

    if (product.status !== "active") {
      issues.push({
        productId: item._id,
        productName: product.name,
        requested: quantity,
        available: product.stock,
        message: `${product.name} is currently inactive.`,
      });
      continue;
    }

    if (quantity < 1 || product.stock < quantity) {
      issues.push({
        productId: item._id,
        productName: product.name,
        requested: quantity,
        available: product.stock,
        message: `${product.name} has only ${product.stock} item${product.stock === 1 ? "" : "s"} available.`,
      });
      continue;
    }

    items.push({
      _id: product._id,
      name: product.name,
      quantity,
      price: product.price,
      totalAmount: product.price * quantity,
      images: product.images || [],
      category: product.category,
    });
  }

  const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

  return {
    ok: issues.length === 0,
    issues,
    items,
    totalAmount,
  };
};

const deductStockForItems = async (items) => {
  const deducted = [];

  for (const item of items) {
    const updatedProduct = await ProductSchema.findOneAndUpdate(
      { _id: item._id, status: "active", stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );

    if (!updatedProduct) {
      await rollbackStock(deducted);
      throw new Error(`${item.name} does not have enough stock available.`);
    }

    deducted.push({ _id: item._id, quantity: item.quantity });

    if (updatedProduct.stock <= 0) {
      await updateProductDB(updatedProduct._id, { status: "inactive" });
    }
  }

  return deducted;
};

const rollbackStock = async (items) => {
  for (const item of items) {
    await ProductSchema.findByIdAndUpdate(item._id, {
      $inc: { stock: item.quantity },
      $set: { status: "active" },
    });
  }
};


export const initiatePayment = async (req, res, next) => {
  try {
    const user = req.userData;
    const cart = await findCart(user._id);

    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ status: "error", message: "Cart is empty" });
    }

    const stockCheck = await validateCartStock(cart);

    if (!stockCheck.ok) {
      return res.status(409).json(buildStockError(stockCheck.issues));
    }

    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount: Math.round(stockCheck.totalAmount * 100),
      currency: "aud",
      metadata: { userId: user._id.toString() }
    })

    return res.status(200).json({
      status: "success",
      message: "Payment intent created successfully",
      paymentIntent: paymentIntent,
      cart: {
        ...cart.toObject(),
        cartItems: stockCheck.items,
      }
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    next({
      statusCode: 500,
      message: error?.message,
      errorMessage: error?.message,
    });
  }
}

export const createOrder = async (req, res, next) => {
  let deductedItems = [];
  let shouldRollbackStock = true;

  try {
    const { shippingAddress, paymentIntent } = req.body
    const userId = req.userData._id;
    const user = await findUserById(userId)
    const cart = await findCart(user._id);
    let orderVerified = false;

    const stockCheck = await validateCartStock(cart);

    if (!stockCheck.ok) {
      return res.status(409).json(buildStockError(stockCheck.issues));
    }

    if (!paymentIntent?.id) {
      return res.status(400).json({
        status: "error",
        message: "Payment confirmation is required before placing an order.",
      });
    }

    const stripePaymentIntent = await getStripeClient().paymentIntents.retrieve(paymentIntent.id);
    if (
      stripePaymentIntent.status !== "succeeded" ||
      stripePaymentIntent.amount !== Math.round(stockCheck.totalAmount * 100) ||
      String(stripePaymentIntent.metadata?.userId || "") !== String(userId)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Payment could not be verified for the current cart total.",
      });
    }

    deductedItems = await deductStockForItems(stockCheck.items);

    // create order
    const order = await createOrderDB({
      products: stockCheck.items,
      shippingAddress,
      userId,
      status: "pending",
      totalAmount: stockCheck.totalAmount,
      paymentDetails: paymentIntent
    })
    shouldRollbackStock = false;

    // creating the invoice
    try {
      const invoice = await invoiceCreation(order, user, userId)

      // Send confirmation email with PDF invoice
      await sendConfirmationEmail(user, order, invoice)
    } catch (notificationError) {
      console.warn("Order invoice/email failed:", notificationError.message);
    }

    orderVerified = true
    return res.status(200).json({
      verified: orderVerified,
      message: "Verified!",
      order
    });

  } catch (error) {
    console.log(error?.message)
    if (shouldRollbackStock && deductedItems.length) {
      await rollbackStock(deductedItems);
    }
    next({
      statusCode: 500,
      message: "Order Creation Failed!",
      errorMessage: error?.message,
    });
  }
}

// stock handling
export const stockHandling = async (req, res, next) => {
  const user = req.userData
  const cart = await findCart(user._id);
  try {
    const stockCheck = await validateCartStock(cart);

    if (!stockCheck.ok) {
      return res.status(409).json(buildStockError(stockCheck.issues));
    }

    return res.status(200).json({
      status: "success",
      message: "Stock is available.",
      cartItems: stockCheck.items,
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Stock Check Failed!",
      errorMessage: error?.message,
    });
  }
}

//  invoice Creation
const invoiceCreation = async (order, user, userId) => {
  const invoiceNumber = generateRandomInvoiceNumber();
  const existingInvoice = await getInvoice({ orderId: order._id });

  let invoiceRecord = existingInvoice;

  if (!existingInvoice) {
    // Create and store the invoice in DB
    invoiceRecord = await createInvoice({
      invoiceNumber,
      orderId: order._id,
      userId,
      userName: `${user.fName} ${user.lName}`,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      taxAmount: 0,
      status: "paid",
      products: order.products.map(key => ({
        id: key._id,
        name: key.name,
        quantity: key.quantity,
        totalAmount: key.totalAmount,
        productImages: key.images || []
      })),
      notes: order.notes || ""
    });

    await updateOrderDB(order._id, { invoiceId: invoiceRecord._id });
  }

  // Generate the PDF stream for email
  const invoiceStream = await generateInvoice(order, invoiceRecord.invoiceNumber);
  const invoiceBuffer = await streamToBuffer(invoiceStream);
  return { invoiceBuffer, invoiceRecord }
}

// send email
const sendConfirmationEmail = async (user, order, invoice) => {
  const { invoiceBuffer, invoiceRecord } = invoice
  await createOrderEmail({
    userName: `${user.fName} ${user.lName}`,
    email: user.email,
    order,
    attachments: [
      {
        filename: `invoice_${invoiceRecord.invoiceNumber}.pdf`,
        content: invoiceBuffer,
      },
    ],
  });

}

