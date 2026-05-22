const jwt = require('jsonwebtoken');
const Worker = require('../models/worker.model');
const { error } = require('../helpers/response.helper');

const authenticateWorker = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return error(res, 'Unauthorized', 401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'worker') return error(res, 'Forbidden', 403);
    const worker = await Worker.findByPk(decoded.id);
    if (!worker || worker.is_blocked) return error(res, 'Account blocked or not found', 403);
    req.worker = worker;
    next();
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }
};

module.exports = { authenticateWorker };
