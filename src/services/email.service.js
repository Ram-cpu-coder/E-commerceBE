import {
    userActivatedEmailTempalate,
    OTPemailTemplate,
    orderCreated,
    orderUpdate,
    inquiryForm,
    inquiryConfirmation,
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

const getInquiryRecipient = () => {
    return (
        getEnv("CONTACT_EMAIL") ||
        getEnv("SUPPORT_EMAIL") ||
        getEnv("SMTP_TO") ||
        getEnv("SMTP_FROM") ||
        getEnv("SMTP_EMAIL")
    );
};

const normalizeBrevoAttachments = (attachments = []) =>
    attachments.map((attachment) => ({
        name: attachment.filename || attachment.name,
        content: Buffer.isBuffer(attachment.content)
            ? attachment.content.toString("base64")
            : Buffer.from(String(attachment.content || "")).toString("base64"),
    }));

const sendBrevoApiEmail = async ({ to, subject, html, text, replyTo, attachments = [] }) => {
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
            ...(replyTo ? { replyTo: { email: replyTo } } : {}),
            ...(attachments.length ? { attachment: normalizeBrevoAttachments(attachments) } : {}),
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

const sendSmtpEmail = async ({ to, subject, html, text, replyTo, attachments = [] }) => {
    const info = await eTransporter().sendMail({
        from: getFromAddress(),
        to,
        replyTo,
        subject,
        html,
        text,
        attachments,
    });

    return info.messageId;
};

const sendEmail = async ({ to, subject, html, text, replyTo, attachments = [] }) => {
    if (!to) {
        throw new Error("Email recipient is required");
    }

    try {
        const apiMessageId = await sendBrevoApiEmail({ to, subject, html, text, replyTo, attachments });
        if (apiMessageId) {
            return apiMessageId;
        }
    } catch (error) {
        console.warn("Brevo email failed, falling back to SMTP:", error.message);
    }

    return sendSmtpEmail({ to, subject, html, text, replyTo, attachments });
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
    const { subject, html, text, attachments } = orderCreated(obj);
    return sendEmail({
        to: obj.email,
        subject,
        html,
        text,
        attachments,
    });
};

export const shipOrderEmail = async (obj) => {
    const { subject, html, text } = orderUpdate(obj);
    return sendEmail({
        to: obj.email,
        subject,
        html,
        text,
    });
};

export const deliveredOrderEmail = async (obj) => {
    const { subject, html, text } = orderUpdate(obj);
    return sendEmail({
        to: obj.email,
        subject,
        html,
        text,
    });
};

export const inquiryFormEmail = async (obj) => {
    const { subject, html, text } = inquiryForm(obj);
    const confirmation = inquiryConfirmation(obj);

    const storeMessageId = await sendEmail({
        to: getInquiryRecipient(),
        replyTo: obj.customer_email,
        subject,
        html,
        text,
    });

    const customerMessageId = await sendEmail({
        to: obj.customer_email,
        subject: confirmation.subject,
        html: confirmation.html,
        text: confirmation.text,
    });

    return {
        storeMessageId,
        customerMessageId,
    };
};
