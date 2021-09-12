// Flattens nested objects
/* eslint-disable */

export const flatten = (obj = {}) => {
  var flattened = {};

  var circlular = [];
  var circLoc = [];

  function _route(prefix, value) {
    var i, len, keys, circularCheck, loc;

    if (value == null) {
      if (prefix === '') {
        return;
      }
      flattened[prefix] = null;
      return;
    }
    if (typeof value === 'object') {
      circularCheck = circlular.indexOf(value);
      if (circularCheck >= 0) {
        loc = circLoc[circularCheck] || 'this';
        flattened[prefix] = `[Circular (${loc})]`;
        return;
      }
      circlular.push(value);
      circLoc.push(prefix);

      if (Array.isArray(value)) {
        len = value.length;
        if (len === 0) _route(`${prefix}[]`, null);
        for (i = 0; i < len; i++) {
          _route(`${prefix}[${i}]`, value[i]);
        }
        return;
      }
      keys = Object.keys(value);
      len = keys.length;
      if (prefix) prefix = `${prefix}.`;
      if (len === 0) _route(prefix, null);
      for (i = 0; i < len; i++) {
        _route(prefix + keys[i], value[keys[i]]);
      }
      return;
    }
    flattened[prefix] = value;
  }

  _route('', obj);

  return flattened;
};

export const unflatten = (data: any) => {
  if (Object(data) !== data || Array.isArray(data)) return data;
  const regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
    resultholder = {};
  for (var p in data) {
    var cur = resultholder,
      prop = '',
      m;
    while ((m = regex.exec(p))) {
      cur = cur[prop] || (cur[prop] = m[2] ? [] : {});
      prop = m[2] || m[1];
    }
    cur[prop] = data[p];
  }
  return resultholder[''] || resultholder;
};
