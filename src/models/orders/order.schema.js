
import mongoose, { mongo } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2"

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shopIds: {
      type: [String],
      default: [],
      index: true,
    },
    fulfillments: {
      type: [
        {
          shopId: { type: String, required: true, index: true },
          shopName: { type: String, default: "" },
          paymentAccount: {
            provider: { type: String, default: "manual" },
            payoutAccountId: { type: String, default: "" },
            payoutAccountEmail: { type: String, default: "" },
            payoutCurrency: { type: String, default: "AUD" },
            setupStatus: { type: String, default: "pending" },
          },
          products: [
            {
              _id: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
              name: { type: String, required: true },
              quantity: { type: Number, required: true, min: 1 },
              price: { type: Number, min: 1 },
              totalAmount: { type: Number, min: 1 },
              images: [String],
              shopId: { type: String, default: "" },
              shopName: { type: String, default: "" },
            },
          ],
          totalAmount: { type: Number, required: true, default: 0 },
          status: {
            type: String,
            enum: ["pending", "confirmed", "shipped", "inTransit", "outForDelivery", "delivered", "cancelled", "canceled"],
            default: "pending",
          },
          status_history: {
            type: [
              {
                status: {
                  type: String,
                  enum: ["pending", "confirmed", "shipped", "inTransit", "outForDelivery", "delivered", "cancelled", "canceled"],
                  required: true,
                },
                date: { type: Date, default: Date.now },
                description: { type: String, default: "" },
              },
            ],
            default: [],
          },
          courier: { type: String, default: null },
          tracking_number: { type: String, default: null },
          expectedDeliveryDate: { type: Date },
        },
      ],
      default: [],
    },
    products: [
      {
        _id: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          min: 1
        },
        totalAmount: {
          type: Number,
          min: 1,
        },
        images: [String]
        ,
        shopId: {
          type: String,
          default: "",
        },
        shopName: {
          type: String,
          default: "",
        }

      },
    ],
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "inTransit", "outForDelivery", "delivered", "cancelled", "canceled"],
      default: "pending"
    },
    status_history: {
      type: [
        {
          status: {
            type: String,
            enum: ["pending", "confirmed", "shipped", "inTransit", "outForDelivery", "delivered", "cancelled", "canceled"],
            required: true,
          },
          date: { type: Date, default: Date.now },
          description: { type: String, default: "" },
        }
      ],
      default: [],
    },
    courier: {
      type: String,
      default: null
    },
    tracking_number: {
      type: String,
      default: null
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      type: String,
      required: true
    },
    expectedDeliveryDate: {
      type: Date
    },
    invoiceId: {
      type: mongoose.Types.ObjectId,
      ref: "Invoice"
    }
  },
  { timestamps: true }
);

OrderSchema.plugin(mongoosePaginate)

OrderSchema.pre("save", function (next) {
  if (!this.expectedDeliveryDate) {
    const deliveryBufferDays = 5;
    const baseDate = this.createdAt || new Date();
    const expectedDate = new Date(baseDate);
    expectedDate.setDate(baseDate.getDate() + deliveryBufferDays)
    this.expectedDeliveryDate = expectedDate;
  }
  if (this.fulfillments?.length) {
    this.fulfillments.forEach((fulfillment) => {
      if (!fulfillment.expectedDeliveryDate) {
        fulfillment.expectedDeliveryDate = this.expectedDeliveryDate;
      }
    });
  }
  next()
})

export default mongoose.model("Order", OrderSchema);
