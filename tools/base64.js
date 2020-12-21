function atob(encoded) {
  return Buffer.from(encoded, 'base64').toString();
}

function btoa(text) {
  return Buffer.from(text).toString('base64');
}

module.exports = {
  atob,
  btoa,
};
