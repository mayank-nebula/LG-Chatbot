exports.postFilteredQuestion = async (req, res, next) => {
  try {

  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}
