const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    req.validatedData = value;
    next();
  };
};

const validateFiles = (requiredFiles = []) => {
  return (req, res, next) => {
    // If no files at all and some are required
    if (!req.files && !req.file && requiredFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Required files are missing",
        requiredFiles,
      });
    }

    const missingFiles = [];
    for (const fieldName of requiredFiles) {
      let present = false;
      // multer.fields() -> req.files is an object: { fieldName: [file] }
      if (req.files && !Array.isArray(req.files) && req.files[fieldName])
        present = true;
      // multer.any() -> req.files is an array: [{ fieldname, ... }]
      if (
        Array.isArray(req.files) &&
        req.files.some((f) => f.fieldname === fieldName)
      )
        present = true;
      // multer.single() -> req.file is a single file
      if (req.file && req.file.fieldname === fieldName) present = true;
      if (!present) missingFiles.push(fieldName);
    }

    if (missingFiles.length > 0) {
      const uploadedFiles = req.files
        ? Object.keys(req.files)
        : req.file
        ? [req.file.fieldname]
        : [];

      return res.status(400).json({
        success: false,
        message: "Required files are missing",
        missingFiles,
        uploadedFiles,
      });
    }

    next();
  };
};

const checkEmailExists = (Model) => {
  return async (req, res, next) => {
    try {
      const { email } = req.validatedData || req.body;

      const existingUser = await Model.findOne({
        email: email.toLowerCase(),
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error checking email",
        error: error.message,
      });
    }
  };
};

module.exports = {
  validate,
  validateFiles,
  checkEmailExists,
};
