const { getAccessibleFiles } = require("../utils/userPermissions");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const allowedExtensions = [".pdf", ".pptx", ".ppt", ".docx", ".doc"];
const extensionMapping = {
  ".pdf": "PDF Document",
  ".pptx": "PowerPoint Presentation",
  ".ppt": "PowerPoint Presentation",
  ".docx": "Word Document",
  ".doc": "Word Document",
};

exports.getAccessibleDocuments = async (req, res, next) => {
  try {
    const userLookupId = req.query.userLookupId;
    const userPermissionCSV = path.join(
      __dirname,
      "..",
      "utils",
      "users_permission.csv"
    );
    const deliverablesListCSV = path.join(
      __dirname,
      "..",
      "utils",
      "deliverables_list.csv"
    );
    const accessibleFiles = await getAccessibleFiles(
      userPermissionCSV,
      deliverablesListCSV,
      "194"
    );
    const accessibleFilesByFilters = accessibleFiles
      .filter((file) =>
        allowedExtensions.includes(
          path.extname(file.ExtractedName).toLowerCase()
        )
      )
      .map((file) => ({
        title: path.parse(file.ExtractedName).name,
        region: cleanDocument(file.Region),
        country: cleanDocument(file.Country),
        strategyArea: cleanDocument(file.StrategyArea),
        documentType:
          extensionMapping[path.extname(file.ExtractedName).toLowerCase()],
      }));
    console.log(accessibleFilesByFilters.length);
    res.status(200).json({
      files: accessibleFilesByFilters,
      message: "documents retrieved",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getFilters = async (req, res, next) => {
  try {
    const deliverablesListCSV = path.join(
      __dirname,
      "..",
      "utils",
      "deliverables_list.csv"
    );
    const filters = await fetchFilters(deliverablesListCSV, [
      "Region",
      "Country",
      "StrategyArea",
    ]);
    res.status(200).json({ filters: filters, message: "filters retrieved" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const cleanDocument = (document) => {
  if (document) {
    try {
      const jsonString = document.replace(/'/g, '"').replace(/"s/g, "'s");
      const cellValueArray = JSON.parse(jsonString);
      return cellValueArray;
    } catch (error) {
      console.log(`Error parsing JSON in column: `, error);
    }
  }
};

const fetchFilters = async (filepath, columnNames) => {
  return new Promise((resolve, reject) => {
    const uniqueValues = {};

    columnNames.forEach((columnName) => {
      uniqueValues[columnName] = new Set();
    });

    fs.createReadStream(filepath)
      .pipe(csv())
      .on("data", (row) => {
        columnNames.forEach((columnName) => {
          if (row[columnName]) {
            try {
              const jsonString = row[columnName].replace(/'/g, '"');
              const cellValueArray = JSON.parse(jsonString);
              if (Array.isArray(cellValueArray)) {
                cellValueArray.forEach((item) => {
                  if (item.LookupValue) {
                    uniqueValues[columnName].add(item.LookupValue);
                  }
                });
              } else
                console.log(
                  `Invalid JSON array structure in column ${columnName}:`,
                  row[columnName]
                );
            } catch (error) {
              console.log(`Error parsing JSON in column ${columnName}:`, error);
            }
          }
        });
      })
      .on("end", () => {
        const filters = columnNames.map((columnName) => ({
          column: columnName,
          values: Array.from(uniqueValues[columnName]),
        }));
        resolve(filters);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};
