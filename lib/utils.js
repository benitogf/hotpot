'use strict'

const shell = require('shelljs')
const cwd = process.cwd()

function listSpecs () {
  let tags = shell.ls(cwd + '/test/specs')
  tags.splice(tags.indexOf('setup.js'), 1)
  tags.splice(tags.indexOf('utils.js'), 1)
  return tags
}

function listTags () {
  var tags = shell.ls(cwd + '/src/tags')
  return tags
}

module.exports = {
  listTags,
  listSpecs
}
