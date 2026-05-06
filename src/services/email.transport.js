import nodemailer from "nodemailer";

let transporter;

const getEnv = (key) => process.env[key]?.trim();

export const eTransporter = () => {
    if (!transporter) {
        const port = Number(getEnv("SMTP_PORT"));

        transporter = nodemailer.createTransport({
            host: getEnv("SMTP_HOST"),
            port,
            secure: port === 465,
            requireTLS: port === 587,
            auth: {
                user: getEnv("SMTP_EMAIL"),
                pass: getEnv("SMTP_PASS"),
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
        });
    }

    return transporter;
};
