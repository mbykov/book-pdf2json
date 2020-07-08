'use strict'

const path = require("path")
const log = console.log

import { pdf2json } from "./index";

let bpath = '../test/text-only.pdf'
// bpath = '../test/images.pdf'
// bpath = '../test/lakatos.pdf'
bpath = '../test/bofre.pdf'

bpath = path.resolve(__dirname, bpath)
log('RUN BPATH:', bpath)

pdf2json(bpath)
  .then(res=> {
    if (!res) return
    log('_B-res', res.docs.length)
    if (!res.docs) return
    log('_LAST', res.docs.slice(-1))
    res.docs.forEach(doc=> {
      if (doc.level > -1) log('_title:', doc)
    })
  })
