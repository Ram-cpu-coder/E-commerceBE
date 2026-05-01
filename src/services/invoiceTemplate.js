import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
// Styles
const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 12, fontFamily: "Helvetica", minHeight: "100vh" },
    header: { fontSize: 20, marginBottom: 10, textAlign: "left" },
    subHeader: { fontSize: 10, textAlign: "left", marginBottom: 20 },
    mainHeader: { fontSize: 25, marginBottom: 10, textAlign: "center" },
    section: { marginBottom: 10 },
    date: { marginBottom: 10, textAlign: 'right' },
    bold: { fontWeight: "bold" },
    row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
    tableHeader: {
        flexDirection: "row",
        borderBottom: "1pt solid black",
        paddingBottom: 4,
        marginTop: 10,
        fontWeight: "bold",
    },
    tableRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
    footer: { marginTop: 20, fontSize: 10 },
});


// Component
const Invoice = ({ order, customerName, invoiceNumber }) => {

    const productRows = order.products.map((product, index) => {
        const rate = product.totalAmount / product.quantity;

        return React.createElement(
            View,
            { key: index, style: styles.tableRow },
            React.createElement(Text, { style: { width: "40%" } }, product.name),
            React.createElement(Text, { style: { width: "20%", textAlign: "right" } }, product.quantity),
            React.createElement(Text, { style: { width: "20%", textAlign: "right" } }, `$${(rate / 100).toFixed(2)}`),
            React.createElement(Text, { style: { width: "20%", textAlign: "right" } }, `$${(product.amount_total / 100).toFixed(2)}`)
        );
    });

    return React.createElement(
        Document,
        null,
        React.createElement(
            Page,
            { style: styles.page },
            // company logo 
            React.createElement(
                View,
                { style: styles.mainHeader },
                React.createElement(Text, null, "Company Name"),

            ),

            // Header
            React.createElement(
                View,
                { invoiceNumber },
                React.createElement(Text, { style: styles.header }, "Invoice"),
                React.createElement(Text, { style: styles.subHeader }, `#INV-${invoiceNumber}`)
            ),

            // Order info
            React.createElement(
                View,
                { style: styles.date },
                React.createElement(Text, null, `Date: ${new Date(order.createdAt).toDateString()}`)
            ),

            // Billing info
            React.createElement(
                View,
                { style: styles.section },
                React.createElement(Text, { style: styles.bold }, "Bill To:"),
                React.createElement(Text, null, `${customerName}`)
            ),

            // Table headers
            React.createElement(
                View,
                { style: styles.tableHeader },
                React.createElement(Text, { style: { width: "40%" } }, "Item"),
                React.createElement(Text, { style: { width: "20%", textAlign: "right" } }, "Qty"),
                React.createElement(Text, { style: { width: "20%", textAlign: "right" } }, "Rate"),
                React.createElement(Text, { style: { width: "20%", textAlign: "right" } }, "Amount")
            ),

            // Product rows
            ...productRows,

            // Total row
            React.createElement(
                View,
                { style: { ...styles.row, marginTop: 10 } },
                React.createElement(Text, null, "Total:"),
                React.createElement(Text, { style: styles.bold }, `$${order.totalAmount}`)
            ),

            // Footer
            React.createElement(
                View,
                { style: styles.footer },
                React.createElement(Text, null, "Thanks for being an awesome customer!"),
                React.createElement(
                    Text,
                    null,
                    "This invoice is auto generated. If there is any issue, contact provider."
                )
            )
        )
    );
};

export default Invoice;
