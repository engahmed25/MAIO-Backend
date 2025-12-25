const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "uploads/";

    // Create specific folders based on file field
    if (file.fieldname === "phdCertificate") {
      folder += "PHDCertificate/";
    } else if (file.fieldname === "medicalLicense") {
      folder += "MedicalLicense/";
    } else if (file.fieldname === "idProof") {
      folder += "IDProof/";
    } else if (file.fieldname === "profilePicture") {
      folder += "ProfilePicture/";
    } else if (file.fieldname === "medicalDocument") {
      folder += "MedicalDocuments/";
    }

    // Create folder if it doesn't exist
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },
  filename: function (req, file, cb) {
    // Create unique filename: fieldname-timestamp-randomstring.ext
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    phdCertificate: /pdf|doc|docx/,
    medicalLicense: /pdf|doc|docx/,
    idProof: /jpg|jpeg|png/,
    profilePicture: /jpg|jpeg|png/,
    medicalDocument: /pdf|doc|docx|jpg|jpeg|png/,
  };

  const extname = path
    .extname(file.originalname)
    .toLowerCase()
    .replace(".", "");
  const fieldAllowedTypes = allowedTypes[file.fieldname];

  if (fieldAllowedTypes && fieldAllowedTypes.test(extname)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type for ${file.fieldname}. Allowed: ${fieldAllowedTypes}`
      )
    );
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// In-memory upload (useful for validating before persisting to disk)
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

// attach memory upload to main export for convenience
upload.memory = memoryUpload;

module.exports = upload;
