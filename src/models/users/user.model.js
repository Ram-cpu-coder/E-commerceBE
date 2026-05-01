import UserSchema from "./user.schema.js";

// create user model
export const registerUserModel = (formObj) => {
  return UserSchema(formObj).save();
};

// finding user by email
export const getUserByEmail = (email) => {
  return UserSchema.findOne(email);
};

export const getUsersForTimeFrame = (startTime, endTime) => {
  return UserSchema.find({ createdAt: { $gte: new Date(startTime), $lt: new Date(endTime) } });
};

//update user
export const updateUser = (filter, obj) => {
  return UserSchema.findOneAndUpdate(filter, { $set: obj }, { new: true });
};

//delete user by id
export const deleteUserById = (_id) => {
  return UserSchema.findByIdAndDelete(_id, { new: true });
};

//logout user by id
export const findUserById = (_id) => {
  return UserSchema.findById(_id);
};
