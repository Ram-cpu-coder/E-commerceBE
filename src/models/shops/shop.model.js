import ShopSchema from "./shop.schema.js";

export const createShopDB = (obj) => ShopSchema(obj).save();

export const getShopsDB = (filter = {}) =>
  ShopSchema.find(filter).sort({ createdAt: -1 });

export const getShopByIdDB = (id) => ShopSchema.findById(id);

export const updateShopDB = (id, obj) =>
  ShopSchema.findByIdAndUpdate(id, { $set: obj }, { new: true });

export const deleteShopDB = (id) => ShopSchema.findByIdAndDelete(id);

export const clearShopAdminDB = (adminId, exceptShopId) =>
  ShopSchema.updateMany(
    { adminId, _id: { $ne: exceptShopId } },
    { $set: { adminId: null, adminName: "", adminEmail: "" } }
  );
