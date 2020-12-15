'use strict'

const path = require("path")
const log = console.log
const fse = require('fs-extra')

let write = process.argv.slice(2)[0] || false

import { pdf2json } from "./index";

let bpath = 'text-only.pdf'
// bpath = 'images.pdf'
// bpath = 'lakatos.pdf'
// bpath = 'bofre.pdf'
// bpath = 'warriors.pdf'
// bpath = 'typescript.pdf'
// bpath = 'the name of the rose.pdf'
// bpath = '05.Harry Potter und der Orden des Phönix.pdf'
// bpath = '1984.pdf'

bpath = path.resolve(__dirname, '../test/', bpath)
log('RUN BPATH:', bpath)

async function start(bpath, write) {
  let {descr, docs, imgs} = await pdf2json(bpath)
  if (!docs) {
    log('_ERR-start:', descr)
    return
  }

  log('_descr:', descr)
  // log('_docs:', docs)
  log('_docs:', docs.length)
  log('_imgs', imgs.length)
  // log('_slice', mds.slice(-10))

  return

  let fns = docs.filter(doc=> doc.footnote)
  let refs = docs.filter(doc=> doc.refnote)
  log('_fns:', fns.length)
  log('_refs:', refs.length)
  log('RUN: BPATH', bpath)

  let headers = docs.filter(doc=> doc.level)
  log('_headers', headers)

  let tmps = refs.slice(0,2)
  tmps.forEach(doc=> {
    // if (doc.level) log('_title:', doc)
    // log('_d', doc)
  })

  if (write) {
    log('___WRITING', bpath)
    writeFiles(bpath, descr, docs)
  } else {
    return {descr, docs, imgs}
  }
}

start(bpath, write)
