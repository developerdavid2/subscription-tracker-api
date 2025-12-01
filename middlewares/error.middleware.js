const errorMiddleware = (err, req, res, next) => {
  try {
    console.error(err);

    let statusCode = err.statusCode || 500;
    let message = err.message || "Server Error";

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
      statusCode = 404;
      message = "Resource not found";
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      statusCode = 400;
      const field = Object.keys(err.keyValue)[0];
      message = `${field} already exists`;
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
      statusCode = 400;
      message = Object.values(err.errors)
        .map((val) => val.message)
        .join(", ");
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
      statusCode = 401;
      message = "Invalid token";
    }

    if (err.name === "TokenExpiredError") {
      statusCode = 401;
      message = "Token expired";
    }

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
