'use strict'

const shell = require('shelljs')
const cwd = process.cwd()

function listTags () {
  var tags = shell.ls(cwd + '/src/tags')['stdout'].split('\n')
  tags.splice(tags.indexOf(''), 1)
  return tags
}

module.exports = {
  listTags
}
