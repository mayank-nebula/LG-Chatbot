const express = require("express");

const documentsController = require("../controller/accessibleDocuments");

const router = express.Router();

router.get(
  "/getUserAccessibleDocuments",
  documentsController.getAccessibleDocuments
);

module.exports = router;
