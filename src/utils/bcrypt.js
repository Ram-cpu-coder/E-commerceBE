import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

// encrypting the password 
export const encryptPassword = async (plainText) => {
    return bcrypt.hash(plainText, SALT_ROUNDS)
}
// comparing the password
export const comparePassword = async (plainText, encryptText) => {
    return bcrypt.compare(plainText, encryptText)
}
