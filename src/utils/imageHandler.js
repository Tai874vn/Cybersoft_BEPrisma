/**
 * Validate base64 image string
 */
const validateBase64Image = (base64String) => {
  if (!base64String) return false;
  
  // Check if it's a valid base64 data URI
  const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
  return base64Regex.test(base64String);
};

/**
 * Extract image format from base64 string
 */
const getImageFormat = (base64String) => {
  const match = base64String.match(/^data:image\/([a-zA-Z]+);base64,/);
  return match ? match[1] : null;
};

/**
 * Validate image size (in bytes)
 * @param {string} base64String - Base64 encoded image
 * @param {number} maxSizeMB - Maximum size in MB (default: 5MB)
 */
const validateImageSize = (base64String, maxSizeMB = 5) => {
  // Remove data URI prefix to get pure base64
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  
  // Calculate size in bytes (base64 is ~33% larger than original)
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  return sizeInMB <= maxSizeMB;
};

/**
 * Process and validate image upload
 */
const processImageUpload = (base64String) => {
  if (!validateBase64Image(base64String)) {
    throw new Error('Invalid image format. Must be a valid base64 data URI.');
  }
  
  if (!validateImageSize(base64String, 5)) {
    throw new Error('Image size exceeds 5MB limit.');
  }
  
  return base64String;
};

module.exports = {
  validateBase64Image,
  getImageFormat,
  validateImageSize,
  processImageUpload,
};
