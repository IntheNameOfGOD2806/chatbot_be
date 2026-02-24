const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Cloudinary config is automatically picked up from process.env.CLOUDINARY_URL
// But just in case, let's make sure it's valid
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'chatbot_files',
        resource_type: 'auto', // Allows uploading non-image files like pdfs and audios safely
    },
});

const upload = multer({ storage: storage });

module.exports = { upload, cloudinary };
