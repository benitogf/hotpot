# Hotpot

[![npm][npm-image]][npm-url]
[![standardjs][standardjs-image]][standardjs-url]

[npm-image]: https://img.shields.io/npm/v/hotpot.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/hotpot
[standardjs-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standardjs-url]: http://standardjs.com/
Cordova livereload server for Pug, SASS and Browserify

## requirements

[Create a cordova app](http://cordova.apache.org/#getstarted)
Create a [src](https://github.com/benitogf/hotpot/tree/master/client/src) folder in your app directory

## installation

if there is no package.json:

```bash
npm init
```

then:

```bash
npm install --save hotpot
```

add the commands as [scripts](https://docs.npmjs.com/misc/scripts) entries

## cli commands

```bash
hotpot
```
Will run the server in livereload mode


```bash
hotpot help
```
Will show the command list

```bash
hotpot build-js
```
  Will build the minified js

```bash
hotpot build-specs
```
  Will build the specs

```bash
hotpot copy-hook
```
  Will copy a build cordova hook
