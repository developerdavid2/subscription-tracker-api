import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subscription name is required"],
      trim: true,
      minLength: 2,
      maxLength: 100,
    },
    price: {
      type: Number,
      required: [true, "Subscription price is required"],
      min: [0, "Price must be greater than 0"],
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP"],
      default: "USD",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    pendingFrequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      default: null,
    },
    category: {
      type: String,
      enum: [
        "sports",
        "news",
        "entertainment",
        "lifestyle",
        "technology",
        "finance",
        "politics",
        "other",
      ],
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
      // validate: {
      //   validator: (value) => value <= new Date(),
      //   message: "Start date cannot be in the future",
      // },
    },
    renewalDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          if (!this.startDate) return true;
          return value > this.startDate;
        },
        message: "Renewal date must be after the start date",
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// ✅ Helper function to calculate renewal date
export const calculateRenewalDate = (startDate, frequency) => {
  const renewal = new Date(startDate);

  switch (frequency) {
    case "daily":
      renewal.setDate(renewal.getDate() + 1);
      break;
    case "weekly":
      renewal.setDate(renewal.getDate() + 7);
      break;
    case "monthly":
      renewal.setMonth(renewal.getMonth() + 1);
      break;
    case "yearly":
      renewal.setFullYear(renewal.getFullYear() + 1);
      break;
    default:
      throw new Error("Invalid frequency");
  }

  return renewal;
};

// Pre-save hook - async style
subscriptionSchema.pre("save", async function () {
  if (!this.renewalDate && this.startDate && this.frequency) {
    this.renewalDate = calculateRenewalDate(this.startDate, this.frequency);
  }

  if (this.renewalDate && this.renewalDate < new Date()) {
    this.status = "expired";
  }
});

// Static method to get all active subscriptions for a user
subscriptionSchema.statics.getActiveSubscriptions = function (userId) {
  return this.find({ user: userId, status: "active" });
};

// Instance method to check if subscription needs renewal
subscriptionSchema.methods.needsRenewal = function () {
  return this.renewalDate <= new Date();
};

// Instance method to renew subscription
subscriptionSchema.methods.renew = async function () {
  this.startDate = this.renewalDate;
  this.renewalDate = calculateRenewalDate(this.renewalDate, this.frequency);

  // If there's a pending frequency change, apply it
  if (this.pendingFrequency) {
    this.frequency = this.pendingFrequency;
    this.pendingFrequency = null;
    this.renewalDate = calculateRenewalDate(this.startDate, this.frequency);
  }

  return await this.save();
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
