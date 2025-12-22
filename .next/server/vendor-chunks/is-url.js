/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/is-url";
exports.ids = ["vendor-chunks/is-url"];
exports.modules = {

/***/ "(ssr)/./node_modules/is-url/index.js":
/*!**************************************!*\
  !*** ./node_modules/is-url/index.js ***!
  \**************************************/
/***/ ((module) => {

eval("\n/**\n * Expose `isUrl`.\n */\n\nmodule.exports = isUrl;\n\n/**\n * RegExps.\n * A URL must match #1 and then at least one of #2/#3.\n * Use two levels of REs to avoid REDOS.\n */\n\nvar protocolAndDomainRE = /^(?:\\w+:)?\\/\\/(\\S+)$/;\n\nvar localhostDomainRE = /^localhost[\\:?\\d]*(?:[^\\:?\\d]\\S*)?$/\nvar nonLocalhostDomainRE = /^[^\\s\\.]+\\.\\S{2,}$/;\n\n/**\n * Loosely validate a URL `string`.\n *\n * @param {String} string\n * @return {Boolean}\n */\n\nfunction isUrl(string){\n  if (typeof string !== 'string') {\n    return false;\n  }\n\n  var match = string.match(protocolAndDomainRE);\n  if (!match) {\n    return false;\n  }\n\n  var everythingAfterProtocol = match[1];\n  if (!everythingAfterProtocol) {\n    return false;\n  }\n\n  if (localhostDomainRE.test(everythingAfterProtocol) ||\n      nonLocalhostDomainRE.test(everythingAfterProtocol)) {\n    return true;\n  }\n\n  return false;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvaXMtdXJsL2luZGV4LmpzIiwibWFwcGluZ3MiOiI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBLDBDQUEwQyxHQUFHOztBQUU3QztBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkIsWUFBWTtBQUNaOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9uZXh0anMtYXBwLy4vbm9kZV9tb2R1bGVzL2lzLXVybC9pbmRleC5qcz9lM2VmIl0sInNvdXJjZXNDb250ZW50IjpbIlxuLyoqXG4gKiBFeHBvc2UgYGlzVXJsYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzVXJsO1xuXG4vKipcbiAqIFJlZ0V4cHMuXG4gKiBBIFVSTCBtdXN0IG1hdGNoICMxIGFuZCB0aGVuIGF0IGxlYXN0IG9uZSBvZiAjMi8jMy5cbiAqIFVzZSB0d28gbGV2ZWxzIG9mIFJFcyB0byBhdm9pZCBSRURPUy5cbiAqL1xuXG52YXIgcHJvdG9jb2xBbmREb21haW5SRSA9IC9eKD86XFx3KzopP1xcL1xcLyhcXFMrKSQvO1xuXG52YXIgbG9jYWxob3N0RG9tYWluUkUgPSAvXmxvY2FsaG9zdFtcXDo/XFxkXSooPzpbXlxcOj9cXGRdXFxTKik/JC9cbnZhciBub25Mb2NhbGhvc3REb21haW5SRSA9IC9eW15cXHNcXC5dK1xcLlxcU3syLH0kLztcblxuLyoqXG4gKiBMb29zZWx5IHZhbGlkYXRlIGEgVVJMIGBzdHJpbmdgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmdcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cblxuZnVuY3Rpb24gaXNVcmwoc3RyaW5nKXtcbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFyIG1hdGNoID0gc3RyaW5nLm1hdGNoKHByb3RvY29sQW5kRG9tYWluUkUpO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFyIGV2ZXJ5dGhpbmdBZnRlclByb3RvY29sID0gbWF0Y2hbMV07XG4gIGlmICghZXZlcnl0aGluZ0FmdGVyUHJvdG9jb2wpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAobG9jYWxob3N0RG9tYWluUkUudGVzdChldmVyeXRoaW5nQWZ0ZXJQcm90b2NvbCkgfHxcbiAgICAgIG5vbkxvY2FsaG9zdERvbWFpblJFLnRlc3QoZXZlcnl0aGluZ0FmdGVyUHJvdG9jb2wpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/is-url/index.js\n");

/***/ })

};
;