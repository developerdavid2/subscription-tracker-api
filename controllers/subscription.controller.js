import { SERVER_URL } from "../config/env.js";
import { workflowClient } from "../config/upstash.js";
import Subscription, {
  calculateRenewalDate,
} from "../models/subscription.model.js";

export const createSubscription = async (req, res, next) => {
  try {
    const {
      name,
      price,
      currency,
      frequency,
      category,
      paymentMethod,
      startDate,
    } = req.body;

    // Validate required fields
    if (!name || !price || !frequency || !category || !paymentMethod) {
      const error = new Error("Missing required fields");
      error.statusCode = 400;
      throw error;
    }

    // Check if user already has an active subscription with the same name
    const existingSubscription = await Subscription.findOne({
      user: req.user._id,
      name: name,
      status: "active",
    });

    if (existingSubscription) {
      if (existingSubscription.frequency === frequency) {
        const error = new Error(
          `You already have an active ${frequency} subscription for ${name}`
        );
        error.statusCode = 409;
        throw error;
      }

      const error = new Error(
        `You already have an active ${existingSubscription.frequency} subscription for ${name}. ` +
          `Please update your existing subscription or cancel it first.`
      );
      error.statusCode = 409;
      error.existingSubscriptionId = existingSubscription._id;
      throw error;
    }

    // Calculate dates
    const start = startDate ? new Date(startDate) : new Date();
    const renewalDate = calculateRenewalDate(start, frequency);

    // Create the subscription
    const subscription = await Subscription.create({
      name,
      price,
      currency: currency || "USD",
      frequency,
      category,
      paymentMethod,
      startDate: start,
      renewalDate,
      status: "active",
      user: req.user._id,
    });

    // ✅ Trigger workflow and capture the response
    let workflowRunId = null;
    try {
      const workflowResponse = await workflowClient.trigger({
        url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
        body: {
          subscriptionId: subscription._id.toString(),
        },
      });

      workflowRunId = workflowResponse.workflowRunId;
      console.log("✅ Workflow triggered successfully:", workflowRunId);
    } catch (workflowError) {
      console.error("⚠️ Workflow trigger failed:", workflowError.message);
      // Don't fail subscription creation if workflow fails
    }

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: subscription,
      workflow: {
        triggered: !!workflowRunId,
        runId: workflowRunId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find the subscription
    const subscription = await Subscription.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    // If frequency is being changed, recalculate renewal date
    if (updates.frequency && updates.frequency !== subscription.frequency) {
      // Option 1: Apply immediately
      updates.renewalDate = calculateRenewalDate(
        subscription.startDate,
        updates.frequency
      );

      console.log(
        `Frequency changed from ${subscription.frequency} to ${updates.frequency}. ` +
          `New renewal date: ${updates.renewalDate}`
      );
    }

    // Update the subscription
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: updatedSubscription,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Subscription deleted successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    if (subscription.status === "cancelled") {
      const error = new Error("Subscription is already cancelled");
      error.statusCode = 400;
      throw error;
    }

    subscription.status = "cancelled";
    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};
