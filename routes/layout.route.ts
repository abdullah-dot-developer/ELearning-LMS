import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  createLayout,
  editLayout,
  getLayoutByType,
} from "../controllers/layout.controller";
import { updateAccessToken } from "../controllers/user.controller";

const router = express.Router();
router.post(
  "/create-layout",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  createLayout
);
router.put(
  "/edit-layout",
  updateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  editLayout
);
router.get("/get-layout/:type", getLayoutByType);

export default router;
