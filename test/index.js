'use strict'

const chai = require('chai')
const expect = chai.expect
const hotpot = require('../lib')
const path = require('path')
const fs = require('fs')
const cwd = process.cwd()

describe('hotpot', function () {
  it('should return an object', function () {
    expect(hotpot).to.be.an.instanceOf(Object)
  })
})

describe('build-js', function () {
  this.timeout(0)
  let buildTest = {
    in: path.join(cwd, '/client/src/index.js'),
    out: path.join(cwd, '/client/www/js/index.min.js')
  }
  let outfile = false
  before(function (done) {
    try {
      fs.unlinkSync(buildTest.out)
      done()
    } catch (e) {
      done()
    }
  })
  before(function (done) {
    hotpot.buildJs(null, buildTest).then(done)
  })
  it('should create index.min.js', function () {
    outfile = fs.statSync(buildTest.out)
    expect(outfile).to.be.an.instanceOf(Object)
  })
})

describe('build-sass', function () {
  this.timeout(0)
  let buildTest = {
    in: path.join(cwd, '/client/src/scss/index.scss'),
    out: path.join(cwd, '/client/www/css/index.css')
  }
  let outfile = false
  before(function (done) {
    try {
      fs.unlinkSync(buildTest.out)
      done()
    } catch (e) {
      done()
    }
  })
  before(function (done) {
    hotpot.buildSass(buildTest).then(done)
  })
  it('should create index.css', function () {
    outfile = fs.statSync(buildTest.out)
    expect(outfile).to.be.an.instanceOf(Object)
  })
})

describe('build-pug', function () {
  this.timeout(0)
  let buildTest = {
    in: path.join(cwd, '/client/src/index.pug'),
    out: path.join(cwd, '/client/www/index.html')
  }
  let outfile = false
  before(function (done) {
    try {
      fs.unlinkSync(buildTest.out)
      done()
    } catch (e) {
      done()
    }
  })
  before(function (done) {
    hotpot.buildPug({}, buildTest).then(done)
  })
  it('should create index.html', function () {
    outfile = fs.statSync(buildTest.out)
    expect(outfile).to.be.an.instanceOf(Object)
  })
})

describe('build-specs', function (done) {
  let buildTest = {
    in: path.join(cwd, '/client/src/index.specs.js'),
    out: path.join(cwd, '/client/www/js/index.specs.js')
  }
  let outfile = false
  before(function (done) {
    try {
      fs.unlinkSync(buildTest.out)
      done()
    } catch (e) {
      done()
    }
  })
  before(function (done) {
    hotpot.buildSpecs(buildTest).then(done)
  })
  it('should create index.specs.js', function () {
    outfile = fs.statSync(buildTest.out)
    expect(outfile).to.be.an.instanceOf(Object)
  })
})
