const http = require('https');
const sizeOf = require('image-size');

const ALLOWED_FILE_TYPES = [
  'jpeg',
  'jpg',
  'png',
  'gif',
];
const MAX_SIZE = 256;

module.exports = (imageUrl) => {
  return new Promise((resolve) => {
    try {
      http.get(imageUrl, (response) => {
        const chunks = [];
        response.on('data', (chunk) => {
          chunks.push(chunk);
        }).on('end', () => {
          const buffer = Buffer.concat(chunks);
          try {
            const imageSize = sizeOf(buffer);
            if (!ALLOWED_FILE_TYPES.includes(imageSize.type)) {
              resolve({
                status: false,
                message: '🚫 The emoji is not a supported file type.  Supported file types are **JPEG**, **PNG**, and **GIF**.'
              });
            }
            if (imageSize.height > MAX_SIZE || imageSize.width > MAX_SIZE) {
              resolve({
                status: false,
                message: '🚫 The emoji is too large.  Max size is **256x256** pixels.',
              });
            }
          } catch (error) {
            if (error.message === 'unsupported file type: undefined (file: undefined)') {
              resolve({
                status: false,
                message: '🚫 The url provided is not a valid image.',
              });
            }
            console.log(error);
            resolve({
              status: false,
              message: `🚫 Error: ${error.message}`
            });
          }
          resolve({
            status: true,
            message: '✅ The emoji has been verified.'
          });
        });
      });
    } catch (error) {
      if (error.code === 'ERR_INVALID_URL') {
        resolve({
          status: false,
          message: '🚫 The url provided is not a valid image.',
        });
      }
      console.log(error);
      resolve({
        status: false,
        message: `🚫 Error: ${error.message}`
      });
    }
  });
};
