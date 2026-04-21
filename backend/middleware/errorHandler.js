function notFoundHandler(_req, res) {
  res.status(404).json({ error: "Not found" });
}

function errorHandler(error, _req, res, _next) {
  console.error("Request failed", error);

  const statusCode = error.statusCode || 500;
  const message = error.expose ? error.message : "Internal server error";

  res.status(statusCode).json({ error: message });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
