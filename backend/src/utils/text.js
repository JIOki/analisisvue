const clean = (s) =>
  s
    .replace(/\s+/g, " ")
    .replace(/\u0000/g, "")
    .trim();

module.exports = { clean };