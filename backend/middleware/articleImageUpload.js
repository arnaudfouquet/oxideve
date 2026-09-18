const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "articles");
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    callback(null, UPLOAD_DIR);
  },
  filename(_req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

function fileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(extension)) {
    const error = new Error("Format d'image non supporté. Utilisez JPG, PNG ou WEBP.");
    error.statusCode = 400;
    error.expose = true;
    return callback(error);
  }

  return callback(null, true);
}

const articleImageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

function handleArticleImageUpload(req, res, next) {
  articleImageUpload.single("image")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "L'image dépasse la taille maximale autorisée (5 Mo)." });
    }

    if (error.expose) {
      return res.status(error.statusCode || 400).json({ error: error.message });
    }

    return next(error);
  });
}

module.exports = {
  articleImageUpload,
  handleArticleImageUpload,
};
