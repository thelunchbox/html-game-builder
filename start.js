const express = require('express');
const { spawn } = require('child_process');
const server = express();
const port = 4000;

server.get("/", (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.use(express.static('.'));

server.listen(port, () => {
  console.log(`Server listening at ${port}`);
  spawn('open', ['http://localhost:4000']);
});

process.on('exit', () => {
  server.close();
});
