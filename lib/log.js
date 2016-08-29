'use strict'

const bole = require('bole')
const bistre = require('bistre')({ time: true })

function configLog (name) {
  let log = bole(name)
  bole.output([{
    level: 'info',
    stream: bistre
  },
  {
    level: 'err',
    stream: bistre
  }])
  bole.setFastTime(true)
  bistre.pipe(process.stdout)
  return log
}

module.exports = configLog
