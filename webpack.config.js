const path = require('path');

module.exports = {
  entry: './src/pdf.mjs', // Your main script file
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};