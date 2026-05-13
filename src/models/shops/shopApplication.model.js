import ShopApplicationSchema from "./shopApplication.schema.js";

export const createShopApplicationDB = (obj) =>
  ShopApplicationSchema(obj).save();

export const getShopApplicationsDB = (filter = {}) =>
  ShopApplicationSchema.find(filter).sort({ createdAt: -1 });

export const getShopApplicationByIdDB = (id, includePassword = false) => {
  const query = ShopApplicationSchema.findById(id);
  return includePassword ? query.select("+adminPasswordHash") : query;
};

export const updateShopApplicationDB = (id, obj) =>
  ShopApplicationSchema.findByIdAndUpdate(id, { $set: obj }, { new: true });

export const hasPendingShopApplicationDB = (ownerEmail) =>
  ShopApplicationSchema.exists({ ownerEmail, status: "pending" });
