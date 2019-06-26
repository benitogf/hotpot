'use strict'

const minimist = require('minimist')
const hotpot = require('./')
const invalid = 'oh no! option not recognized, try hotpot help to get a list of commands'

function parseTargets(target) {
  if (target !== undefined) {
    if (Array.isArray(target)) {
      return target
    } else {
      return [target]
    }
  } else {
    return ['es6']
  }
}

module.exports = function (args) {
  let argv = minimist(args.slice(2))
  let targets = parseTargets(argv.t)
  if (argv._.length === 1) {
    switch (argv._[0]) {
      case 'help':
        hotpot.help()
        break
      case 'copy-hook':
        hotpot.copyHook()
        break
      default:
        throw new Error(invalid)
    }
  } else {
    if (argv._.length === 0) {
      hotpot.startBundle(targets)
    } else {
      throw new Error(invalid)
    }
  }
}
