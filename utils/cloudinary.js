// utils/fileUploader.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const fileUploadInCloudinary = async (localFile) => {
  try {
    if (!localFile) return null;

    // Check extension
    const isPDF = localFile.endsWith('.pdf');

    const response = await cloudinary.uploader.upload(localFile, {
      resource_type: 'auto',
      access_mode: 'public', // ✅ Make PDF public
    });

    console.log("File uploaded successfully", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFile);
    return null;
  }
};

module.exports = {fileUploadInCloudinary} ;