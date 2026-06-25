const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const billingController = require("../controllers/billingController");

const router = express.Router();

router.get("/plans", asyncHandler(billingController.getPlans));
router.get("/me", authMiddleware, asyncHandler(billingController.getMe));
router.post("/checkout-session", authMiddleware, asyncHandler(billingController.createCheckoutSession));
router.post("/portal-session", authMiddleware, asyncHandler(billingController.createPortalSession));

module.exports = router;
