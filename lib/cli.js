'use strict'

const minimist = require('minimist')
const hotpot = require('./')

module.exports = function (args) {
  let argv = minimist(args.slice(2))
  if (argv._.length === 1) {
    switch (argv._[0]) {
      case 'help':
        hotpot.help()
        break
      case 'specs':
        hotpot.buildSpecs()
        break
      case 'copy-hook':
        hotpot.copyHook()
        break
      default:
        throw new Error('oh no! option not recognized, try hotpot help to get a list of commands')
    }
  } else {
    if (argv._.length === 0) {
      switch (argv.t) {
        case 'riot':
          hotpot.startBundle('riot')
          break
        default:
          hotpot.startBundle()
      }
    } else {
      throw new Error('oh no! option not recognized, try hotpot help to get a list of commands')
    }
  }
}