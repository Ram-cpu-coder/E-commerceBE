
import cron from "node-cron";
import FeatureBannerModel from "../models/featuredBanner/featureBanner.schema.js";

export const startCronJobs = () => {
    cron.schedule("0 0 * * *", async () => {
        try {
            const now = new Date();
            const result = await FeatureBannerModel.updateMany(
                { expiresAt: { $lt: now }, status: "active" },
                { $set: { status: "inactive" } }
            );
            if (result.modifiedCount > 0) {
                console.log(`[Cron] Marked ${result.modifiedCount} expired banners inactive at ${now.toISOString()}`);
            }
        } catch (error) {
            console.error("[Cron] Error marking expired banners inactive:", error);
        }
    });
};
