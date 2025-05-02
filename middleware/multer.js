const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)) {
            cb(null, './public/uploadsIMG');
        } else if (['application/pdf'].includes(file.mimetype)) {
            cb(null, './public/uploadsPDF');
        } else {
            cb(new Error('Invalid file type'));
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

module.exports =  upload;