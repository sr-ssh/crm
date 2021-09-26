const multer = require('multer')
const path = require('path')
const storage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, `${path.resolve('./tmp')}`)
    },
    filename: (req, file, cb) => {
        cb(null, `user${req.decodedData.user_employer}${path.extname(file.originalname)}`)
    }
});

function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /xlsx|xls|csv/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    // const mimetype = filetypes.test(file.mimetype);
    if (extname) {
        return cb(null, true);
    } else {
        cb('Error: Only Excel File can be provide');
    }
}

const uploadExcel = multer({
    storage: storage,
    fileFilter: function (_req, file, cb) {
        checkFileType(file, cb);
    }
}).single('excel');

function uploadFile(req, res, next) {

    uploadExcel(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.json({ success: false, message: err })
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.json({ success: false, message: err })
        }
        // Everything went fine. 
        next()
    })
}


module.exports = uploadFile;

