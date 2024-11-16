"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const order_controller_1 = require("../controllers/order.controller");
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.default.Router();
router.post("/create-order", auth_1.isAuthenticated, order_controller_1.createOrder);
router.get("/get-orders", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), order_controller_1.getAllOrders);
router.get("/payment/stripe-publishable-key", order_controller_1.sendStripePublishableKey);
router.post("/payment", auth_1.isAuthenticated, order_controller_1.newPayment);
exports.default = router;
