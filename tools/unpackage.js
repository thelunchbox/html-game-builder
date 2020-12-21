const fs = require('fs');
const path = require('path');
const { atob } = require('./base64');
const dir = process.argv[2];

const entries = fs.readdirSync(dir);
if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');
entries.forEach(file => {
  const contents = fs.readFileSync(path.resolve(dir, file), 'utf-8');
  const decoded = atob(contents);
  fs.writeFileSync(path.resolve('./temp', file.replace('.gm', '.json')), decoded);
});