'use strict'

module.exports = (component) => makeLogger(component)

// Default logger is the console
let makeLogger = (component) => console
module.exports.setLogger = function (logFactory) {
  makeLogger = logFactory
}
