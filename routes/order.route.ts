import express from "express";
import {
  createOrder,
  getAllOrders,
  newPayment,
  sendStripePublishableKey,
} from "../controllers/order.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { updateAccessToken } from "../controllers/user.controller";

const router = express.Router();

router.post("/create-order", isAuthenticated, createOrder);
router.get(
  "/get-orders",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrders
);

router.get("/payment/stripe-publishable-key", sendStripePublishableKey);
router.post("/payment", isAuthenticated, newPayment);

export default router;
