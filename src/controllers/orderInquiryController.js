import { inquiryFormEmail } from "../services/email.service.js";

export const createOrderInquiry = async (req, res, next) => {
    try {
        const { customer_name, customer_email, customer_message, orderNumber } = req.body;

        // Basic validation
        if (!customer_name || customer_name.trim().length < 2) {
            return res.status(400).json({
                status: "error",
                message: "Please provide a valid name.",
            });
        }

        if (!customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
            return res.status(400).json({
                status: "error",
                message: "Please provide a valid email address.",
            });
        }
        if (!customer_message || customer_message.trim().length < 10) {
            return res.status(400).json({
                status: "error",
                message: "Message should be at least 10 characters long.",
            });
        }

        // Compose object for email service
        const inquiryData = {
            customer_name,
            customer_email,
            customer_message,
            orderNumber,
        };

        const response = await inquiryFormEmail(inquiryData);

        if (!response) {
            return res.status(500).json({
                status: "error",
                message: "Form could not be submitted. Please try again later.",
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Inquiry submitted successfully!",
        });
    } catch (error) {
        next({
            message: "Error while submitting the inquiry!",
            errorMessage: error.message,
        });
    }
};


