const success = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ status: true, message, data });

const error = (res, message = 'Something went wrong', statusCode = 500, errors = null) =>
  res.status(statusCode).json({ status: false, message, ...(errors && { errors }) });

module.exports = { success, error };
