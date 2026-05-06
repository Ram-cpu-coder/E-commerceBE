import {
    userActivatedEmailTempalate,
    OTPemailTemplate,
    orderCreated,
    orderUpdate,
    inquiryForm,
} from "./email.template.js";
import { eTransporter } from "./email.transport.js";

const getFromAddress = () => {
    const fromEmail = process.env.SMTP_FROM;

    if (!fromEmail) {
        throw new Error("SMTP_FROM is not configured");
    }

    return `${process.env.COMPANY_NAME || "NepaStore"} <${fromEmail}>`;
};

const sendEmail = async ({ to, subject, html, text }) => {
    if (!to) {
        throw new Error("Email recipient is required");
    }

    const info = await eTransporter().sendMail({
        from: getFromAddress(),
        to,
        subject,
        html,
        text,
    });

    return info.messageId;
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
