import { Router } from "express";
import {
  sendReminders,
  testReminderEmail,
} from "../controllers/workflow.controller.js";
import { authorize } from "../middlewares/auth.middleware.js";

const workflowRouter = Router();

workflowRouter.post("/subscription/reminder", sendReminders);
// ✅ Add test route (protected by auth)
workflowRouter.post(
  "/subscription/:subscriptionId/test-email",
  authorize,
  testReminderEmail
);
export default workflowRouter;
