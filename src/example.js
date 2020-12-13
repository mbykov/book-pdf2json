'use strict'

const path = require("path")
const log = console.log

import { pdf2json } from "./index";

let bpath = '../test/text-only.pdf'
// bpath = '../test/images.pdf'
bpath = '../test/lakatos.pdf'
// bpath = '../test/bofre.pdf'
bpath = '../test/warriors.pdf'
// bpath = '../test/typescript.pdf'
bpath = '../test/the name of the rose.pdf'


bpath = path.resolve(__dirname, bpath)
log('RUN BPATH:', bpath)

pdf2json(bpath)
  .then(res=> {
    res.forEach(str=> {
      log('_', str)
    })
    // log('_RES-rows', res)

    // if (!res) return
    // log('_B-res', res.docs.length)
    // if (!res.docs) return
    // log('_LAST', res.docs.slice(-1))
    // res.docs.forEach(doc=> {
    //   if (doc.level > -1) log('_title:', doc)
    // })
  })
  .catch(err=> {
    log('_ERR', err)
  })
