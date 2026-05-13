import AuditLogSchema from "./auditLog.schema.js";
import PlatformSettingSchema from "./platformSetting.schema.js";

export const getPlatformSettingsDB = async () =>
  PlatformSettingSchema.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { new: true, upsert: true }
  );

export const updatePlatformSettingsDB = (obj) =>
  PlatformSettingSchema.findOneAndUpdate(
    { key: "default" },
    { $set: obj, $setOnInsert: { key: "default" } },
    { new: true, upsert: true }
  );

export const createAuditLogDB = (obj) => AuditLogSchema(obj).save();

export const getAuditLogsDB = (filter = {}) =>
  AuditLogSchema.find(filter).sort({ createdAt: -1 }).limit(200);
