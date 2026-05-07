import React from "react"
import Invoice from "./invoiceTemplate.js"
import ReactPDF from '@react-pdf/renderer';
import { findUserById } from "../models/users/user.model.js";


export const generateInvoice = async (order, invoiceNumber) => {
    if (!order) throw new Error("Missing order details")
    const customer = await findUserById(order.userId)
    const customerName = customer ? `${customer.fName || ""} ${customer.lName || ""}`.trim() : "N/A"
    const element = React.createElement(Invoice, { order, customerName, invoiceNumber })
    try {
        const stream = await ReactPDF.renderToStream(element);
        return stream;
    } catch (error) {
        console.error("Error generating PDF stream:", error);
        throw new Error("Failed to generate PDF");
    }

}
