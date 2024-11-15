import express from "express";
import {
  coursesAnalytics,
  orderAnalytics,
  userAnalytics,
} from "../controllers/analytics.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { updateAccessToken } from "../controllers/user.controller";

const router = express.Router();
router.get(
  "/get-users-analytics",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  userAnalytics
);
router.get(
  "/get-courses-analytics",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  coursesAnalytics
);
router.get(
  "/get-orders-analytics",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  orderAnalytics
);

export default router;
