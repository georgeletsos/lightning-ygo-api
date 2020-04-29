const escapeRegExp = function(str) {
  return str.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

module.exports = {
  escapeRegExp
};
