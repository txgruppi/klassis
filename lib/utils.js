exports.notEmpty = function notEmpty(value) {
  return !!value;
}

exports.getCallback = function getCallback(args) {
  var cb = args[args.length - 1];
  return typeof cb === 'function' ? cb : (arguments[1] || null);
}
