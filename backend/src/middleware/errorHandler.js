const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  const response = {
    success: false,
    message,
    ...(stack && { stack }),
  };

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
