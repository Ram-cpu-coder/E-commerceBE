
import mongoose from "mongoose";

const baseSessionSchema =
{
    token: {
        type: String,
        required: true
    },

    associate: {
        type: String,
        // required: true
    }

}

// login sessionschema
const Session = new mongoose.Schema(baseSessionSchema, { timestamps: true }
)

// verifying sessionschema
const AuthSession = new mongoose.Schema(
    {
        ...baseSessionSchema,
        expiresAt:
        {
            type: Date,
            default: new Date(Date.now() + 60000),
            expires: 0
        }
    }, { timestamps: true })

// otp sessionSchema
const OtpSession = new mongoose.Schema({
    Otp: {
        type: Number,
        required: true
    },
    associate: {
        type: String,
        required: true,
    },
    expiresAt:
    {
        type: Date, default: new Date(Date.now() + 3600000), expires: 0
    },
})

export const SessionSchema = mongoose.model("session", Session)
export const AuthSessionSchema = mongoose.model("authSession", AuthSession)
export const OtpSessionSchema = mongoose.model("Otp", OtpSession)

