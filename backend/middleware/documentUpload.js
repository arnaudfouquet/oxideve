const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

function fileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(extension)) {
    const error = new Error("Format non supporté. Utilisez un PDF ou un document Word.");
    error.statusCode = 400;
    error.expose = true;
    return callback(error);
  }

  return callback(null, true);
}

/**
 * Verifie la signature binaire : l'extension et le type annonce par le
 * navigateur sont declaratifs, seul l'en-tete prouve la nature du fichier.
 */
function hasDocumentSignature(buffer) {
  if (buffer.length < 8) return false;

  // PDF : "%PDF"
  if (buffer.subarray(0, 4).toString("latin1") === "%PDF") return true;

  // DOCX : archive ZIP, signature "PK"
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) return true;

  // DOC : document composite OLE2
  const OLE2 = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
  if (OLE2.every((octet, index) => buffer[index] === octet)) return true;

  return false;
}

function rejectIfNotADocument(req, res, next) {
  if (!req.file) return next();

  let descripteur;

  try {
    const entete = Buffer.alloc(8);
    descripteur = fs.openSync(req.file.path, "r");
    fs.readSync(descripteur, entete, 0, 8, 0);
    fs.closeSync(descripteur);
    descripteur = undefined;

    if (!hasDocumentSignature(entete)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Ce fichier n'est pas un document valide (PDF, DOC ou DOCX)." });
    }
  } catch (error) {
    if (descripteur !== undefined) {
      try {
        fs.closeSync(descripteur);
      } catch (closeError) {
        /* rien a faire */
      }
    }
    return next(error);
  }

  return next();
}

const uploadDir = path.join(__dirname, "..", "uploads", "documents");

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    fs.mkdirSync(uploadDir, { recursive: true });
    callback(null, uploadDir);
  },
  filename(_req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

function handleDocumentUpload(req, res, next) {
  upload.single("document")(req, res, (error) => {
    if (!error) {
      return rejectIfNotADocument(req, res, next);
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Le document dépasse la taille maximale autorisée (10 Mo)." });
    }

    if (error.expose) {
      return res.status(error.statusCode || 400).json({ error: error.message });
    }

    return next(error);
  });
}

module.exports = { handleDocumentUpload };
