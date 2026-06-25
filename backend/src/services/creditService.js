const mongoose = require("mongoose");
const User = require("../models/User");
const CreditLedger = require("../models/CreditLedger");
const { getPlan } = require("../config/plans");
const logger = require("../utils/logger");

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function isDbAvailable() {
  return mongoose.connection.readyState === 1;
}

function isResolvableUserId(userId) {
  return Boolean(userId) && mongoose.isValidObjectId(userId);
}

async function getBillingStatus(userId) {
  if (!isDbAvailable() || !isResolvableUserId(userId)) return null;
  const user = await User.findById(userId);
  if (!user) return null;

  // Lazily refill the free tier's monthly allowance — no cron needed.
  if (user.plan === "free" && (!user.creditsResetAt || Date.now() - user.creditsResetAt.getTime() > ONE_MONTH_MS)) {
    const freePlan = getPlan("free");
    user.credits = freePlan.monthlyCredits;
    user.creditsResetAt = new Date();
    await user.save();
  }

  return {
    plan: user.plan,
    credits: user.credits,
    subscriptionStatus: user.subscriptionStatus,
    planRenewsAt: user.planRenewsAt,
  };
}

async function grantCredits(userId, amount, reason, meta = {}) {
  if (!isDbAvailable() || !isResolvableUserId(userId)) return null;
  const user = await User.findByIdAndUpdate(userId, { $inc: { credits: amount } }, { new: true });
  if (!user) return null;
  await CreditLedger.create({ userId, type: "grant", amount, balanceAfter: user.credits, reason, meta });
  return user.credits;
}

// Atomic — only succeeds if the user currently has enough balance, so two
// concurrent requests can never both deduct past zero.
async function consumeCredit(userId, amount = 1, reason = "chat_message", meta = {}) {
  if (!isDbAvailable() || !isResolvableUserId(userId)) return { ok: true, skipped: true };
  try {
    const user = await User.findOneAndUpdate(
      { _id: userId, credits: { $gte: amount } },
      { $inc: { credits: -amount } },
      { new: true }
    );
    if (!user) return { ok: false, reason: "insufficient_credits" };
    await CreditLedger.create({ userId, type: "consume", amount: -amount, balanceAfter: user.credits, reason, meta });
    return { ok: true, balance: user.credits };
  } catch (err) {
    logger.warn("creditService.consumeCredit.failed", { userId, error: err.message });
    return { ok: true, skipped: true, error: err.message };
  }
}

async function setPlan(userId, planId, { stripeCustomerId, stripeSubscriptionId, subscriptionStatus, renewCredits = true } = {}) {
  if (!isDbAvailable() || !isResolvableUserId(userId)) return null;
  const plan = getPlan(planId);
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const update = {
    plan: plan.id,
    subscriptionStatus: subscriptionStatus || "active",
    planRenewsAt: new Date(Date.now() + ONE_MONTH_MS),
  };
  if (stripeCustomerId) update.stripeCustomerId = stripeCustomerId;
  if (stripeSubscriptionId) update.stripeSubscriptionId = stripeSubscriptionId;

  const user = await User.findByIdAndUpdate(userId, update, { new: true });
  if (!user) return null;
  if (renewCredits) await grantCredits(userId, plan.monthlyCredits, `plan_change:${plan.id}`);
  return user;
}

async function downgradeToFree(userId) {
  if (!isDbAvailable() || !isResolvableUserId(userId)) return null;
  return User.findByIdAndUpdate(
    userId,
    { plan: "free", subscriptionStatus: "none", stripeSubscriptionId: null },
    { new: true }
  );
}

module.exports = {
  isDbAvailable,
  isResolvableUserId,
  getBillingStatus,
  grantCredits,
  consumeCredit,
  setPlan,
  downgradeToFree,
};
