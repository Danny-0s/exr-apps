import multer from "multer";
import path from "path";
import fs from "fs";

/* ===============================
   ENSURE UPLOADS FOLDER EXISTS
================================ */
const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

/* ===============================
   STORAGE
================================ */
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        cb(
            null,
            Date.now() + "-" + file.originalname.replace(/\s+/g, "")
        );
    },
});

/* ===============================
   FILE FILTER
================================ */
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Images only"), false);
    }
};

/* ===============================
   EXPORT
================================ */
export default multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});