const { readFile, writeFile } = require('fs/promises');
const path = require('path');

module.exports = {
  /**
   * @param {String} filePath
   * @returns {Object} data
   */
  readFile: async (filePath) => {
    // TODO: rewrite this to use fs/promises
    const realFilePath = path.join(__dirname, '..', filePath);
    const file = await readFile(realFilePath);
    const data = await JSON.parse(file);
    return data;
  },
  /**
   * @param {Object} jsonData
   * @param {String} filePath
   * @returns {String} data
   */
  writeFile: async (jsonData, filePath) => {
    // TODO: rewrite this to use fs/promises
    const realFilePath = path.join(__dirname, '..', filePath);
    const data = JSON.stringify(jsonData);
    await writeFile(realFilePath, data);
    return data;
  }
};
