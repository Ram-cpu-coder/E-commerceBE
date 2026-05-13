import {
  createAuditLogDB,
  getAuditLogsDB,
  getPlatformSettingsDB,
  updatePlatformSettingsDB,
} from "../models/platform/platform.model.js";

const publicSettings = (settings) =>
  typeof settings?.toObject === "function" ? settings.toObject() : settings;

const actorName = (user) => [user?.fName, user?.lName].filter(Boolean).join(" ");

export const writeAuditLog = async (user, action, entityType, entityId, description, metadata = {}) => {
  try {
    await createAuditLogDB({
      actorId: user?._id || null,
      actorName: actorName(user),
      actorEmail: user?.email || "",
      action,
      entityType,
      entityId: entityId ? String(entityId) : "",
      description,
      metadata,
    });
  } catch (error) {
    console.error("Audit log write failed:", error.message);
  }
};

export const getPlatformSettingsController = async (_req, res, next) => {
  try {
    const settings = await getPlatformSettingsDB();
    return res.status(200).json({
      status: "success",
      message: "Platform settings loaded.",
      settings: publicSettings(settings),
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while loading platform settings",
      errorMessage: error.message,
    });
  }
};

export const updatePlatformSettingsController = async (req, res, next) => {
  try {
    const allowed = [
      "commissionRate",
      "payoutHoldDays",
      "lowStockThreshold",
      "defaultCurrency",
      "sellerApprovalMode",
      "reviewModerationMode",
      "allowShopSelfRegistration",
      "requireVerifiedPayoutBeforeSelling",
    ];
    const updateObj = allowed.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        acc[key] = req.body[key];
      }
      return acc;
    }, {});

    const settings = await updatePlatformSettingsDB({
      ...updateObj,
      updatedBy: req.userData?._id,
    });

    await writeAuditLog(
      req.userData,
      "platform_settings_updated",
      "platform_settings",
      settings._id,
      "Updated platform commerce settings.",
      updateObj
    );

    return res.status(200).json({
      status: "success",
      message: "Platform settings updated.",
      settings: publicSettings(settings),
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while updating platform settings",
      errorMessage: error.message,
    });
  }
};

export const getAuditLogsController = async (_req, res, next) => {
  try {
    const logs = await getAuditLogsDB();
    return res.status(200).json({
      status: "success",
      message: "Audit logs loaded.",
      logs,
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Error while loading audit logs",
      errorMessage: error.message,
    });
  }
};
