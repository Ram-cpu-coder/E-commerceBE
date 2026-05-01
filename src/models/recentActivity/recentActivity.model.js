import { RecentActivitySchema } from "./recentActivity.schema.js"
// Create a new activity
export const createRecentActivity = async (activityObj) => {
    try {
        const activity = new RecentActivitySchema(activityObj);
        return await activity.save();
    } catch (err) {
        console.error("Error creating recent activity:", err);
        throw err;
    }
};

// Get all recent activities (pagination)
export const getRecentActivity = async (page) => {
    try {
        return await RecentActivitySchema.find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .skip((page - 1) * 20);
    } catch (err) {
        console.error("Error fetching recent activities:", err);
        throw err;
    }
};

// get all the recent activities filtered by user Id (pagination)
export const getRecentActivityForUser = async (id, page) => {
    try {
        return await RecentActivitySchema.find({ "userDetail.userId": id })
            .sort({ createdAt: -1 })
            .limit(20)
            .skip((page - 1) * 20);
    } catch (err) {
        console.error("Error fetching recent activities:", err);
        throw err;
    }
}
