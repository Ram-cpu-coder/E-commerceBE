import React from "react"
import Invoice from "./invoiceTemplate.js"
import ReactPDF from '@react-pdf/renderer';
import { findUserById } from "../models/users/user.model.js";


export const generateInvoice = async (order, invoiceNumber) => {
    console.log("order", order)
    if (!order) throw new Error("Missing order details")
    const customer = await findUserById({ _id: order.userId })
    console.log(customer.fName + " " + customer.lName, 9999)
    const customerName = customer.fName + " " + customer.lName
    console.log(typeof (customerName))
    const element = React.createElement(Invoice, { order, customerName, invoiceNumber })
    try {
        const stream = await ReactPDF.renderToStream(element);
        return stream;
    } catch (error) {
        console.error("Error generating PDF stream:", error);
        throw new Error("Failed to generate PDF");
    }

}