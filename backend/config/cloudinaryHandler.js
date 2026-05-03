/**
 * Cloudinary Handler
 * Wrapper for Cloudinary uploads used by controllers
 */
const cloudinary = require('cloudinary').v2;

// Configure using env vars (already set in cloudinary.js, but ensure it's configured here too)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (filePath) => {
  try {
    // If Cloudinary is not configured, return the local file path as fallback
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
      console.warn('⚠️  Cloudinary not configured. Using local file path as URL.');
      return `/uploads/${filePath.split('/').pop()}`;
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'lms_uploads',
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    // Fallback: return local path instead of crashing
    return `/uploads/${filePath.split('/').pop()}`;
  }
};

module.exports = { uploadToCloudinary };
