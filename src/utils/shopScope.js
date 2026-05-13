export const isSuperAdminUser = (user) => user?.role === "superadmin";

export const isShopAdminUser = (user) => user?.role === "admin";

export const getUserShopId = (user) => {
  if (!user) return null;
  return user.shopId || String(user._id || "");
};

export const getUserShopName = (user) => {
  if (!user) return "";
  return user.shopName || `${user.fName || "Shop"} ${user.lName || "Admin"}`.trim();
};

export const getShopScopedFilter = (user, field = "shopId") => {
  if (isSuperAdminUser(user)) return {};
  if (!isShopAdminUser(user)) return {};

  const shopId = getUserShopId(user);
  return shopId ? { [field]: shopId } : {};
};

export const canAccessShopOwnedDoc = (user, doc, field = "shopId") => {
  if (isSuperAdminUser(user)) return true;
  if (!isShopAdminUser(user)) return false;

  const shopId = getUserShopId(user);
  if (!shopId) return false;

  const value = doc?.[field];
  if (Array.isArray(value)) {
    return value.map(String).includes(String(shopId));
  }
  return String(value || "") === String(shopId);
};
