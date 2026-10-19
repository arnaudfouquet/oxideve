const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

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

/**
 * Contrôle la signature binaire du fichier. L'extension et le type annoncé par
 * le navigateur sont déclaratifs : un fichier texte renommé en .png les passe
 * sans difficulté. Seul l'en-tête réel prouve qu'il s'agit d'une image.
 */
function hasImageSignature(buffer) {
  if (buffer.length < 12) return false;

  // JPEG : FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;

  // PNG : 89 50 4E 47 0D 0A 1A 0A
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (PNG.every((byte, index) => buffer[index] === byte)) return true;

  // WEBP : "RIFF" .... "WEBP"
  if (buffer.subarray(0, 4).toString("latin1") === "RIFF" && buffer.subarray(8, 12).toString("latin1") === "WEBP") {
    return true;
  }

  return false;
}

/**
 * Vérifie le fichier déjà écrit sur disque et le supprime s'il ne s'agit pas
 * réellement d'une image.
 */
function rejectIfNotAnImage(req, res, next) {
  if (!req.file) return next();

  let handle;
  try {
    const header = Buffer.alloc(12);
    handle = fs.openSync(req.file.path, "r");
    fs.readSync(handle, header, 0, 12, 0);
    fs.closeSync(handle);
    handle = undefined;

    if (!hasImageSignature(header)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Ce fichier n'est pas une image valide (JPG, PNG ou WEBP)." });
    }
  } catch (error) {
    if (handle !== undefined) {
      try {
        fs.closeSync(handle);
      } catch (closeError) {
        /* rien à faire */
      }
    }
    return next(error);
  }

  return next();
}

/**
 * Construit un gestionnaire d'upload d'image pour un sous-dossier de
 * `backend/uploads` (servi publiquement sous /uploads).
 */
function createImageUploadHandler(folder) {
  const uploadDir = path.join(__dirname, "..", "uploads", folder);

  const storage = multer.diskStorage({
    destination(_req, _file, callback) {
      // Le dossier peut ne pas exister au premier upload.
      fs.mkdirSync(uploadDir, { recursive: true });
      callback(null, uploadDir);
    },
    filename(_req, file, callback) {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${extension}`);
    },
  });

  const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

  return function handleUpload(req, res, next) {
    upload.single("image")(req, res, (error) => {
      if (!error) {
        return rejectIfNotAnImage(req, res, next);
      }

      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "L'image dépasse la taille maximale autorisée (5 Mo)." });
      }

      if (error.expose) {
        return res.status(error.statusCode || 400).json({ error: error.message });
      }

      return next(error);
    });
  };
}

const handleArticleImageUpload = createImageUploadHandler("articles");
const handleFormationImageUpload = createImageUploadHandler("formations");

module.exports = {
  createImageUploadHandler,
  handleArticleImageUpload,
  handleFormationImageUpload,
};
