import { AuthSessionSchema, OtpSessionSchema } from "./session.schema.js";

export const insertAuthSession = (token) => {
    return AuthSessionSchema(token).save();
};

export const findAuthSessionById = (filter) => {
    return AuthSessionSchema.findById(filter);
};

export const findAuthSession = (filter) => {
    return AuthSessionSchema.findOne(filter)
}

export const findAuthSessionAndDelete = (filter) => {
    return AuthSessionSchema.findOneAndDelete(filter)
}

export const findAuthSessionByIdandDelete = (filter) => {
    return AuthSessionSchema.findByIdAndDelete(filter);
};

//  for OTP
export const insertOTP = (otp) => {
    return OtpSessionSchema(otp).save()
}

export const findOTP = (filter) => {
    return OtpSessionSchema.findOne(filter);
}

export const findOTPAndDelete = (filter) => {
    return OtpSessionSchema.findOneAndDelete(filter, { new: true })
}