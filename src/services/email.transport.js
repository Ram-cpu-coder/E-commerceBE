import nodemailer from "nodemailer"
export const eTransporter = () => {
    const transporter = nodemailer.createTransport({
        // service: "gmail",
        host: process.env.SMTP_HOST,
        port: +process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASS,
        },
    })
    return transporter;
}