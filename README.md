const allowedExtensions = [".pdf", ".pptx", ".ppt", ".docx", ".doc"];

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
        country: cleanDocument(file.Country), //csv row 18
        strategyArea: cleanDocument(file.StrategyArea),
      }));
    console.log(accessibleFilesByFilters.length);
    res
      .status(200)
      .json({
        files: accessibleFilesByFilters,
        message: "documents retrieved",
      });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
