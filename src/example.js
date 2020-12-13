'use strict'

const path = require("path")
const log = console.log

import { pdf2json } from "./index";

let bpath = 'text-only.pdf'
// bpath = 'images.pdf'
bpath = 'lakatos.pdf'
// bpath = 'bofre.pdf'
bpath = 'warriors.pdf'
// bpath = 'typescript.pdf'
bpath = 'the name of the rose.pdf'
// bpath = '05.Harry Potter und der Orden des Phönix.pdf'
// bpath = '1984.pdf'

bpath = path.resolve(__dirname, '../test/', bpath)
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
