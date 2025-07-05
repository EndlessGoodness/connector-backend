const multer = require('multer');
const path = require('path');

// Define allowed image MIME types
const allowedMimes = [
  'image/png',
  'image/jpeg',
  'image/gif',
];

// Set up Multer for local file handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder to temporarily store files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // File name with timestamp
  },
});

// File filter function to accept only specific image types
const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Invalid file type'), false); // Reject the file
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
  },
});

module.exports = upload;