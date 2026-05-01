import Stripe from "stripe";
import { findCart } from "../models/cart/cart.model.js";
import { createOrderDB, getOrderDB, updateOrderDB } from "../models/orders/order.model.js";
import { findUserById } from "../models/users/user.model.js";
import { createOrderEmail } from "../services/email.service.js";
import { getSingleProduct, updateProductDB } from "../models/products/product.model.js";
import ProductSchema from "../models/products/product.schema.js";
import { generateRandomInvoiceNumber } from "./invoice.controller.js";
import { createInvoice, getInvoice } from "../models/invoices/invoices.model.js";
import { generateInvoice } from "../services/generateInvoice.js";
import { streamToBuffer } from "../utils/streamToBuffer.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const origin = process.env.ROOT_URL + "/payment-result"


export const initiatePayment = async (req, res, next) => {
  try {
    const user = req.userData;
    const cart = await findCart(user._id);

    console.log(cart.cartItems, "cart while making the payment")

    if (!cart || cart.cartItems.length === 0) {
      return res.status(400).json({ status: "error", message: "Cart is empty" });
    }

    // total amount
    const totalAmounts = cart?.cartItems.reduce((total, item) => total + item.totalAmount, 0)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(totalAmounts * 100, 10),
      currency: "aud",
      metadata: { userId: user._id.toString() }
    })

    return res.status(200).json({
      status: "success",
      message: "Payment intent created successfully",
      paymentIntent: paymentIntent,
      cart: cart
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    next({
      statusCode: 500,
      message: error?.message,
      errorMessage: error?.message,
    });
  }
}

export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, userId, paymentIntent } = req.body
    const user = await findUserById(userId)
    const cart = await findCart(user._id);
    let orderVerified = false;

    // handle the stock and price 
    // await stockHandling(cart)

    // create order
    const order = await createOrderDB({
      products: cart.cartItems,
      shippingAddress,
      userId,
      status: "pending",
      totalAmount: cart.cartItems.reduce(
        (sum, item) => sum + item.totalAmount,
        0
      ),
      paymentDetails: paymentIntent
    })

    console.log(order, cart)
    // creating the invoice
    const invoice = await invoiceCreation(order, user, userId)

    // Send confirmation email with PDF invoice
    await sendConfirmationEmail(user, order, invoice)

    orderVerified = true
    return res.status(200).json({
      verified: orderVerified,
      message: "Verified!",
      order
    });

  } catch (error) {
    console.log(error?.message)
    next({
      statusCode: 500,
      message: "Order Creation Failed!",
      errorMessage: error?.message,
    });
  }
}

// stock handling
export const stockHandling = async (req, res, next) => {
  const user = req.userData
  const cart = await findCart(user._id);
  try {
    if (!cart || cart.cartItems.length === 0) {
      return next({
        statusCode: 400,
        message: "Cart is empty!"
      });
    }

    // deducting the product stock acc to the product quantity ordered
    for (let item of cart.cartItems) {
      const product = await getSingleProduct(item._id);
      if (!product) {
        return next({
          statusCode: 400,
          message: `Product ${item._id} not found.`
        });
      }

      const updatedProduct = await ProductSchema.findOneAndUpdate(
        { _id: product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        return next({
          statusCode: 400,
          message: `Not enough stock for product ${item._id}`
        });
      }

      if (updatedProduct.stock <= 0) {
        await updateProductDB(updatedProduct._id, { status: "inactive" });
      }
    }
    return res.status(200).json({
      status: "success",
      message: "Stock Updated!"
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: "Stock Check Failed!",
      errorMessage: error?.message,
    });
  }
}

//  invoice Creation
const invoiceCreation = async (order, user, userId) => {
  const invoiceNumber = generateRandomInvoiceNumber();
  const existingInvoice = await getInvoice({ orderId: order._id });

  let invoiceRecord = existingInvoice;

  if (!existingInvoice) {
    // Create and store the invoice in DB
    invoiceRecord = await createInvoice({
      invoiceNumber,
      orderId: order._id,
      userId,
      userName: `${user.fName} ${user.lName}`,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      taxAmount: 0,
      status: "paid",
      products: order.products.map(key => ({
        id: key._id,
        name: key.name,
        quantity: key.quantity,
        totalAmount: key.totalAmount,
        productImages: key.images || []
      })),
      notes: order.notes || ""
    });

    await updateOrderDB(order._id, { invoiceId: invoiceRecord._id });
  }

  // Generate the PDF stream for email
  const invoiceStream = await generateInvoice(order, invoiceRecord.invoiceNumber);
  const invoiceBuffer = await streamToBuffer(invoiceStream);
  return { invoiceBuffer, invoiceRecord }
}

// send email
const sendConfirmationEmail = async (user, order, invoice) => {
  const { invoiceBuffer, invoiceRecord } = invoice
  await createOrderEmail({
    userName: `${user.fName} ${user.lName}`,
    email: user.email,
    order,
    attachments: [
      {
        filename: `invoice_${invoiceRecord.invoiceNumber}.pdf`,
        content: invoiceBuffer,
      },
    ],
  });

}

