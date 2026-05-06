import {
    userActivatedEmailTempalate,
    OTPemailTemplate,
    orderCreated,
    orderUpdate,
    inquiryForm,
} from "./email.template.js";
import { eTransporter } from "./email.transport.js";

const getEnv = (key) => process.env[key]?.trim();

const getFromAddress = () => {
    const fromEmail = getEnv("SMTP_FROM");

    if (!fromEmail) {
        throw new Error("SMTP_FROM is not configured");
    }

    return `${process.env.COMPANY_NAME || "NepaStore"} <${fromEmail}>`;
};

const sendBrevoApiEmail = async ({ to, subject, html, text }) => {
    const apiKey = getEnv("BREVO_API_KEY");
    const fromEmail = getEnv("SMTP_FROM");

    if (!apiKey) {
        return null;
    }

    if (!fromEmail) {
        throw new Error("SMTP_FROM is not configured");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            accept: "application/json",
            "api-key": apiKey,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            sender: {
                name: process.env.COMPANY_NAME || "NepaStore",
                email: fromEmail,
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            textContent: text || "",
        }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || `Brevo API email failed with status ${response.status}`);
    }

    return data.messageId;
};

const sendSmtpEmail = async ({ to, subject, html, text }) => {
    const info = await eTransporter().sendMail({
        from: getFromAddress(),
        to,
        subject,
        html,
        text,
    });

    return info.messageId;
};

const sendEmail = async ({ to, subject, html, text }) => {
    if (!to) {
        throw new Error("Email recipient is required");
    }

    const apiMessageId = await sendBrevoApiEmail({ to, subject, html, text });

    return apiMessageId || sendSmtpEmail({ to, subject, html, text });
};

// Activation email
export const userActivatedEmail = async (obj) => {
    const { subject, html, text } = userActivatedEmailTempalate(obj);

    return sendEmail({
        to: obj.email,
        subject,
        html,
        text,
    });
};

// OTP email
export const OTPemail = async (obj) => {
    const { subject, html, text } = OTPemailTemplate(obj);

    return sendEmail({
        to: obj.email,
        subject,
        html,
        text,
    });
};

export const createOrderEmail = async (obj) => {
    const info = await eTransporter().sendMail(orderCreated(obj));
    return info.messageId;
};

export const shipOrderEmail = async (obj) => {
    const info = await eTransporter().sendMail(orderUpdate(obj));
    return info.messageId;
};

export const deliveredOrderEmail = async (obj) => {
    const info = await eTransporter().sendMail(orderUpdate(obj));
    return info.messageId;
};

export const inquiryFormEmail = async (obj) => {
    const info = await eTransporter().sendMail(inquiryForm(obj));
    return info.messageId;
};
