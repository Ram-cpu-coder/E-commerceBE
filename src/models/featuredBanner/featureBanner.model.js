import FeatureBannerModel from "./featureBanner.schema.js"

export const createFeatureBanner = (obj) => {
    return new FeatureBannerModel(obj).save()
}

export const fetchFeatureBanner = () => {
    return FeatureBannerModel.find({})
        .sort({ _id: -1 })
        // .limit(5)
        .select("status featureBannerImgUrl title subTitle products createdAt expiresAt promoType")
        .lean()
}

export const deleteFeatureBanner = (id) => {
    return FeatureBannerModel.findByIdAndDelete(id)
}

export const updateFeatureBanner = (id, updateObj) => {
    return FeatureBannerModel.findOneAndUpdate({ _id: id }, updateObj, { new: true })
}
