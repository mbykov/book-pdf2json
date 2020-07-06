'use strict'

const path = require("path")
const log = console.log

import { pdf2js } from "./index";

let bpath = '../test/text-only.pdf'
// bpath = '../test/images.pdf'
// bpath = '../test/lakatos.pdf'
// bpath = '../test/diathesis.pdf'

bpath = path.resolve(__dirname, bpath)
log('RUN: BPATH', bpath)


pdf2js(bpath)
  .then(res=> {
    log('_B-res', res)
    if (!res.docs) return
    log(res.docs.slice(-1))
    log('_docs', res.docs.length)
    res.docs.forEach(doc=> {
      if (doc.level > -1) log('_title:', doc)
    })
  })
