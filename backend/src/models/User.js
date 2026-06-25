const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "team"],
      default: "free",
    },
    credits: {
      type: Number,
      default: 50,
    },
    creditsResetAt: {
      type: Date,
      default: Date.now,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["none", "active", "past_due", "canceled"],
      default: "none",
    },
    planRenewsAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.password;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.stripeCustomerId;
        delete ret.stripeSubscriptionId;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("User", userSchema);
