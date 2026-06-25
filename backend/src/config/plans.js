const { config } = require("./env");

const PLANS = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    stripePriceId: null,
    monthlyCredits: 50,
    features: ["Basic AI models", "50 messages / month", "3 Spaces"],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 20,
    stripePriceId: config.stripePriceProMonthly || null,
    monthlyCredits: 2000,
    popular: true,
    features: [
      "Priority access to VetroAI's most capable models",
      "Unlimited messages",
      "Unlimited Spaces & Artifacts",
      "Full Computer Mode access",
    ],
  },
  {
    id: "team",
    name: "Team",
    priceMonthly: 40,
    stripePriceId: config.stripePriceTeamMonthly || null,
    monthlyCredits: 5000,
    perSeat: true,
    features: [
      "Everything in Pro",
      "Shared Team Spaces",
      "Collaborative Artifacts",
      "Admin Dashboard",
    ],
  },
];

function getPlan(planId) {
  return PLANS.find((p) => p.id === planId) || null;
}

module.exports = { PLANS, getPlan };
