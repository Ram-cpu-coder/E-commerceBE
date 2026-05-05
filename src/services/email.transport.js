import nodemailer from "nodemailer";

let transporter;

export const eTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASS,
            },

            // connectionTimeout: 30000,
            // greetingTimeout: 30000,
            // socketTimeout: 30000,
        });
    }

    return transporter;
};