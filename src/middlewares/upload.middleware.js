const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const UPLOAD_PATH = process.env.UPLOAD_PATH || './src/uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_PATH)) fs.mkdirSync(UPLOAD_PATH, { recursive: true });

// Use memory storage — file comes in as buffer, we convert then save
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|bmp|tiff/;
  const nonImage = /pdf|mp4/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.test(ext) || nonImage.test(ext)) return cb(null, true);
  cb(new Error(`File type .${ext} not allowed`), false);
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 20971520 },
});

// Convert image buffer to WebP and save to disk
const convertToWebP = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

  // Non-image files (pdf, mp4) — save as-is
  if (/pdf|mp4/.test(ext)) {
    const filename = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    const filepath = path.join(UPLOAD_PATH, filename);
    fs.writeFileSync(filepath, file.buffer);
    file.filename = filename;
    file.path = filepath;
    return;
  }

  // Image files — convert to WebP
  const filename = `${Date.now()}-${path.basename(file.originalname, path.extname(file.originalname)).replace(/\s/g, '_')}.webp`;
  const filepath = path.join(UPLOAD_PATH, filename);

  await sharp(file.buffer)
    .webp({ quality: 82 })
    .toFile(filepath);

  file.filename = filename;
  file.path = filepath;
};

// Middleware wrapper that processes files after multer
const processFiles = async (req, res, next) => {
  try {
    const files = [];
    if (req.file)  files.push(req.file);
    if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files);
      } else {
        Object.values(req.files).forEach(arr => files.push(...arr));
      }
    }
    await Promise.all(files.map(convertToWebP));
    next();
  } catch (e) {
    next(e);
  }
};

// Wrap multer methods to inject processFiles after upload
const wrap = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err) return next(err);
    processFiles(req, res, next);
  });
};

const upload = {
  single:  (field)         => wrap(multerUpload.single(field)),
  array:   (field, max)    => wrap(multerUpload.array(field, max)),
  fields:  (fields)        => wrap(multerUpload.fields(fields)),
  none:    ()              => multerUpload.none(),
};

module.exports = upload;
