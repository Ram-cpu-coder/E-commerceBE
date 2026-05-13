import UserSchema from "./user.schema.js";

// create user model
export const registerUserModel = (formObj) => {
  return UserSchema(formObj).save();
};

// finding user by email
export const getUserByEmail = (email) => {
  return UserSchema.findOne(email);
};

export const getUsersForTimeFrame = (startTime, endTime, filter = {}) => {
  return UserSchema.find({ ...filter, createdAt: { $gte: new Date(startTime), $lt: new Date(endTime) } });
};

export const getAllUsers = (filter = {}) => {
  return UserSchema.find(filter).sort({ createdAt: -1 });
};

export const getAdminAccessRequests = () => {
  return UserSchema.find({ "adminRequest.status": "pending" }).sort({ "adminRequest.requestedAt": -1 });
};

//update user
export const updateUser = (filter, obj) => {
  return UserSchema.findOneAndUpdate(filter, { $set: obj }, { new: true });
};

export const updateUsers = (filter, updateObj) => {
  return UserSchema.updateMany(filter, updateObj);
};

export const addUserShopIds = (filter, shopIds = []) => {
  return UserSchema.findOneAndUpdate(
    filter,
    { $addToSet: { shopIds: { $each: shopIds } } },
    { new: true }
  );
};

//delete user by id
export const deleteUserById = (_id) => {
  return UserSchema.findByIdAndDelete(_id, { new: true });
};

//logout user by id
export const findUserById = (_id) => {
  return UserSchema.findById(_id);
};
