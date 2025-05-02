const multer = require('multer');

const storage = multer.memoryStorage(); // ✅ Keep files in memory

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Optional: Limit to 10MB per file
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

module.exports = upload;
