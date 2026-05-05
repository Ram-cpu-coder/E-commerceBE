
import {
    userActivatedEmailTempalate,
    OTPemailTemplate,
} from "./email.template.js";

const sendBrevoEmail = async ({ to, subject, html, text }) => {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            sender: {
                name: process.env.COMPANY_NAME || "NepaStore",
                email: process.env.EMAIL_FROM,
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            textContent: text || "",
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Brevo Error:", data);
        throw new Error(data.message || "Brevo email failed");
    }

    return data;
};

// ✅ Activation email
export const userActivatedEmail = async (obj) => {
    const { subject, html, text } = userActivatedEmailTempalate(obj);

    return sendBrevoEmail({
        to: obj.email,
        subject,
        html,
        text,
    });
};

// ✅ OTP email
export const OTPemail = async (obj) => {
    const { subject, html, text } = OTPemailTemplate(obj);

    return sendBrevoEmail({
        to: obj.email,
        subject,
        html,
        text,
    });
};


export const createOrderEmail = async (obj) => {
    const info = await eTransporter().sendMail(orderCreated(obj))
    return info.messageId;
}

export const shipOrderEmail = async (obj) => {
    const info = await eTransporter().sendMail(orderUpdate(obj))
    return info.messageId;
}

export const deliveredOrderEmail = async (obj) => {
    const info = await eTransporter().sendMail(orderUpdate(obj))
    return info.messageId;
}

export const inquiryFormEmail = async (obj) => {
    const info = await eTransporter().sendMail(inquiryForm(obj))
    return info.messageId;
}