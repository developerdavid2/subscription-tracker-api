import aj from "../config/arcjet.js";

const arcjetMiddleware = async (req, res, next) => {
  try {
    const decision = await aj.protect(req, { requested: 1 });

    // If denied, log the reason
    if (decision.isDenied()) {
      console.log("Denial Reason:", decision.reason);

      // Rate limit exceeded
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({
          error: "Rate Limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: decision.reason.reset,
        });
      }

      // Bot detected
      if (decision.reason.isBot()) {
        return res.status(403).json({
          error: "Bot detected",
          message: "Automated access is not allowed.",
        });
      }

      return res.status(403).json({
        error: "Access denied",
        message: "Your request was blocked by our security system.",
      });
    }

    next();
  } catch (error) {
    console.error("❌ Arcjet Middleware Error:", error.message);
    // Pass error to error handling middleware
    next(error);
  }
};

export default arcjetMiddleware;
