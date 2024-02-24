const { readFile, writeFile } = require('fs/promises');
const path = require('path');

module.exports = {
  /**
   * @param {String} filePath
   * @returns {Promise<Object>} data
   */
  readFile: async (filePath) => {
    return new Promise(async (resolve) => {
      const realFilePath = path.join(__dirname, '..', filePath);
      const file = await readFile(realFilePath);
      const data = await JSON.parse(file);
      resolve(data);
    });
  },
  /**
   * @param {Object} jsonData
   * @param {String} filePath
   * @returns {Promise<String>} data
   */
  writeFile: async (jsonData, filePath) => {
    return new Promise(async (resolve) => {
      const realFilePath = path.join(__dirname, '..', filePath);
      const data = JSON.stringify(jsonData);
      await writeFile(realFilePath, data);
      resolve(data);
    });
  }
};
