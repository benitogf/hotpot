#!/usr/bin/env node

'use strict'

const minimist = require('minimist')
const hotpot = require('../lib')

let argv = minimist(process.argv.slice(2))
if (argv._.length === 1) {
  switch (argv._[0]) {
    case 'help':
      hotpot.help()
      break
    case 'build-js':
      hotpot.buildJs()
      break
    case 'build-specs':
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
    hotpot.startBundle()
  } else {
    throw new Error('oh no! option not recognized, try hotpot help to get a list of commands')
  }
}
