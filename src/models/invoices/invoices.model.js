import invoiceModel from "./invoices.schema.js"

export const createInvoice = (invoiceObj) => {
    return invoicesSchema(invoiceObj).save()
}

export const getInvoice = (filter) => {
    return invoicesSchema.findOne(filter)
}