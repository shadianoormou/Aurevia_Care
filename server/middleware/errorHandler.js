// Catches 404 for unmatched API routes
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized error handler - keeps error responses consistent
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || "Server Error";

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "Uploaded file is larger than the allowed limit";
  }

  // SQL Server unique-constraint and foreign-key errors should not leak schema details.
  if (err.number === 2627 || err.number === 2601) {
    statusCode = 409;
    message = "A record with those details already exists";
  }
  if (err.number === 547) {
    statusCode = 409;
    message = "This change conflicts with data already in use";
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
