
import mongoose, { mongo } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2"

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
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

      },
    ],
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "inTransit", "outForDelivery", "delivered"],
      default: "pending"
    },
    status_history: {
      type: [
        {
          status: {
            type: String,
            enum: ["pending", "confirmed", "shipped", "inTransit", "outForDelivery", "delivered"],
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
  next()
})

export default mongoose.model("Order", OrderSchema);
