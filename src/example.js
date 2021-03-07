'use strict'

const path = require("path")
const log = console.log
let write = process.argv.slice(2)[0] || false

import { pdf2json } from "./index";

let bpath = 'text-only.pdf'
bpath = path.resolve(__dirname, '../test/', bpath)
log('RUN BPATH:', bpath)

async function start(bpath) {
  let {descr, docs, imgs} = await pdf2json(bpath)
  log('_descr:', descr)
  log('_docs:', docs.length)
  log('_imgs', imgs.length)
}

start(bpath)
