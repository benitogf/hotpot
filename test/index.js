'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
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
  this.timeout(0);
  let buildTest = {
    in: path.join(cwd, '/client/src/index.js'),
    out: path.join(cwd, '/client/www/js/index.min.js')
  }
  let outfile = false
  before(function(done){
    try {
      fs.unlinkSync(buildTest.out)
      done()
    } catch(e) {
      done()
    }
  })
  before(function (done) {
    hotpot.buildJs(buildTest).then(done)
  })
  it('should create index.min.js', function () {
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
  before(function(done){
    try {
      fs.unlinkSync(buildTest.out)
      done()
    } catch(e) {
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
