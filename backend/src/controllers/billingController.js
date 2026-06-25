const mongoose = require("mongoose");
const ApiError = require("../utils/apiError");
const { successResponse } = require("../utils/response");
const { config } = require("../config/env");
const { PLANS, getPlan } = require("../config/plans");
const creditService = require("../services/creditService");
const User = require("../models/User");
const logger = require("../utils/logger");

const stripe = config.stripeSecretKey ? require("stripe")(config.stripeSecretKey) : null;

function isStripeConfigured() {
  return Boolean(stripe);
}

function resolveUserId(req) {
  const id = req.user?._id || req.user?.id;
  return creditService.isResolvableUserId(id) ? id : null;
}

async function getPlans(_req, res) {
  return successResponse(res, "Plans fetched", {
    plans: PLANS.map(({ stripePriceId, ...rest }) => ({ ...rest, purchasable: Boolean(stripePriceId) || rest.id === "free" })),
    paymentsEnabled: isStripeConfigured(),
  });
}

async function getMe(req, res) {
  const userId = resolveUserId(req);
  const offlineStatus = { plan: "free", credits: null, subscriptionStatus: "none", planRenewsAt: null, offline: true };
  if (!userId) return successResponse(res, "Billing status (offline)", offlineStatus);

  const status = await creditService.getBillingStatus(userId);
  if (!status) return successResponse(res, "Billing status (offline)", offlineStatus);
  return successResponse(res, "Billing status", { ...status, offline: false, paymentsEnabled: isStripeConfigured() });
}

async function createCheckoutSession(req, res) {
  const { planId } = req.body || {};
  const plan = getPlan(planId);
  if (!plan || plan.id === "free") throw new ApiError(400, "Invalid plan selected");
  if (!isStripeConfigured()) throw new ApiError(503, "Payments are not configured yet. Please contact support.");
  if (!plan.stripePriceId) throw new ApiError(503, `${plan.name} plan is not available for purchase yet.`);

  const userId = resolveUserId(req);
  if (!userId) throw new ApiError(400, "Please sign in with an account (not offline mode) to upgrade your plan.");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: String(user._id) },
    });
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${config.frontendUrl}/?billing=success&plan=${plan.id}`,
    cancel_url: `${config.frontendUrl}/?billing=cancel`,
    metadata: { userId: String(user._id), planId: plan.id },
    subscription_data: { metadata: { userId: String(user._id), planId: plan.id } },
  });

  return successResponse(res, "Checkout session created", { url: session.url });
}

async function createPortalSession(req, res) {
  if (!isStripeConfigured()) throw new ApiError(503, "Payments are not configured yet.");
  const userId = resolveUserId(req);
  if (!userId) throw new ApiError(400, "Sign in required.");

  const user = await User.findById(userId);
  if (!user?.stripeCustomerId) throw new ApiError(400, "No billing account found yet.");

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${config.frontendUrl}/`,
  });
  return successResponse(res, "Portal session created", { url: session.url });
}

async function webhook(req, res) {
  if (!isStripeConfigured()) return res.status(503).send("Stripe not configured");

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    if (!config.stripeWebhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not set");
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
  } catch (err) {
    logger.error("billing.webhook.invalid_signature", { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        if (userId && planId) {
          await creditService.setPlan(userId, planId, {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: "active",
          });
          logger.info("billing.webhook.plan_activated", { userId, planId });
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = sub.metadata?.userId;
          const planId = sub.metadata?.planId;
          if (userId && planId) {
            await creditService.setPlan(userId, planId, { subscriptionStatus: "active", renewCredits: true });
          }
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (userId && mongoose.isValidObjectId(userId)) {
          await User.findByIdAndUpdate(userId, {
            subscriptionStatus: sub.status === "active" ? "active" : sub.status,
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (userId) await creditService.downgradeToFree(userId);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    logger.error("billing.webhook.handler_failed", { type: event.type, error: err.message });
  }

  return res.json({ received: true });
}

module.exports = { getPlans, getMe, createCheckoutSession, createPortalSession, webhook, isStripeConfigured };
