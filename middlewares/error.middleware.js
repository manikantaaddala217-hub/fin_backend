const errorMiddleware = (err, req, res, next) => {
    console.error("Global Error Handler:", err);

    const status = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};

module.exports = errorMiddleware;
