const fs = require('fs');
const path = require('path');
const { btoa } = require('./base64');
const dir = process.argv[2];

const entries = fs.readdirSync('./temp');
entries.forEach(file => {
  const contents = fs.readFileSync(path.resolve(dir, file), 'utf-8');
  const decoded = btoa(contents);
  fs.writeFileSync(path.resolve(dir, file.replace('.json', '.gm')), decoded);
});