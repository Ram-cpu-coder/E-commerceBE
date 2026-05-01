import ReviewSchema from "./review.schema.js";

export const getActiveReview = () => {
    return ReviewSchema.find({ approved: true });
};

export const getAllReview = () => {
    return ReviewSchema.find({});
};

export const insertReview = (reviewObj) => {
    return ReviewSchema(reviewObj).save();
};

export const updateReview = (filter, updateObj) => {
    return ReviewSchema.findByIdAndUpdate(filter, updateObj, { new: true });
};

export const deleteReview = (id) => {
    return ReviewSchema.findByIdAndDelete(id, { new: true });
};

export const deleteMultipleReview = (idsToDelete) => {
    return ReviewSchema.deleteMany({ _id: { $in: idsToDelete } });
};
