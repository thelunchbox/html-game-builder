const express = require('express');
const { exec } = require('child_process');
const server = express();
const port = 4000;

server.get("/", (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.use(express.static('.'));

server.listen(port, () => {
  console.log(`Server listening at ${port}`);

  switch (process.platform) {
    case 'win32':
      exec('start http://localhost:4000');
      break;
    case 'darwin':
      exec('open http://localhost:4000');
      break;
  }
});

process.on('exit', () => {
  server.close();
});
