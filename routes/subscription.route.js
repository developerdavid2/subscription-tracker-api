import { Router } from "express";
import { authorize } from "./../middlewares/auth.middleware.js";
import {
  getAllSubscriptions,
  createSubscription,
  deleteSubscription,
  getSubscription,
  cancelSubscription,
  updateSubscription,
} from "./../controllers/subscription.controller.js";

const subscriptionRouter = Router();

// Apply authentication middleware to all subscription routes
subscriptionRouter.use(authorize);

// GET all subscriptions
subscriptionRouter.get("/", getAllSubscriptions);

// GET subscription details
subscriptionRouter.get("/:id", getSubscription);

// CREATE a new subscription
subscriptionRouter.post("/", createSubscription);

// UPDATE subscription details
subscriptionRouter.put("/:id", updateSubscription);

// DELETE a subscription
subscriptionRouter.delete("/:id", deleteSubscription);

// CANCEL a subscription
subscriptionRouter.patch("/:id/cancel", cancelSubscription);

export default subscriptionRouter;
