'use strict'

import _ from 'lodash'
const path = require("path")
const log = console.log
const fse = require('fs-extra')

// let PDFParser = require("pdf2json")
// const PDFExtract = require('pdf.js-extract').PDFExtract;
// const pdfExtract = new PDFExtract();

const pdf = require("pdf-extraction");

export async function pdf2json(bpath) {
  let dataBuffer = fse.readFileSync(bpath)
  return pdf(dataBuffer)
    .then(function (data) {
      log('data.numpages', data.numpages);
      log('data.numrender', data.numrender);
      log('data.info', data.info);
      // log('data.metadata', data.metadata);
      log('data.version', data.version);
      log('data.text', data.text.slice(0,100));
      let res = {descr: data.info, docs:[], imgs: []}
      return res
    })
    .catch(err=> {
      log('_ERR', err)
    })
}

// export async function pdf2json__() {
//   const options = {}; /* see below */
//   let pdfpath = path.resolve(__dirname, '../test/text-only.pdf')
//   return new Promise(function (resolve, reject) {
//     pdfExtract.extract(pdfpath, options, (err, data) => {
//       if (err) return log(err);
//       // log('_DATA', data);
//       let docs = data.pages[0].content.slice(0,1)
//       let res = {descr: {}, docs, imgs: []}
//       resolve(res)
//     })
//   })
//   // return new Promise(function (resolve, reject) {
//   //   resolve({descr: {}, docs: [], imgs: []})
//   // })
// }

// export async function pdf2json_(bpath) {
//   return new Promise(function (resolve, reject) {
//     let pdfParser = new PDFParser(this, 1)
//     pdfParser.on("pdfParser_dataReady", function(evtData) {
//       // let meta = pdfParser.prototype.loadMetaData ()
//       // log('__M', meta)
//       let str = pdfParser.getRawTextContent()
//       str = str.replace(/\r/g, '')
//       let rows = str.split('\n')
//       let pages = [], page = [], clean
//       rows.forEach(row=> {
//         if (/Page.*Break/.test(row)) {
//           if (page.length) pages.push(page)
//           page = []
//         } else {
//           clean = row.trim()
//           if (!clean) return
//           clean = cleanStr(clean)
//           page.push(clean)
//         }
//       })
//       // pages = pages.slice(68, 71)

//       // remove digits-only colons:
//       let cleans = [], test
//       for (let page of pages) {
//         test = page[0].replace(/-/g, '').trim()
//         if (/^\d+$/.test(test)) page = page.slice(1)
//         test = page[page.length-1].replace(/-/g, '').trim()
//         if (/^\d+$/.test(test)) page = page.slice(0, -1)
//         cleans.push(page)
//       }

//       // remove possible colons:
//       let has_colon = false
//       let singles = cleans.map(page=> page[0])
//       let uniq = _.uniq(singles)
//       if (singles.length/uniq.length > 10) has_colon = true
//       // log('_HAS_COLON_', singles.length, uniq.length, has_colon)
//       let freqs = []
//       if (has_colon) {
//         for (let colon of uniq) {
//           freqs.push({colon, freq: countInArray(singles, colon)})
//         }
//         let max = _.max(freqs, 'freq')
//         let colon = max.colon

//         pages = []
//         for (let clean of cleans) {
//           if (clean[0] == colon) page = clean.slice(1)
//           pages.push(page)
//         }
//       } else {
//         pages = cleans
//       }
//       pages.forEach(page=> {
//         page[0] = 'HEAD-' + page[0]
//       })
//       let strs = _.flatten(pages)
//       let text = strs.join('\n')

//       let pars = breakRow(text)
//       let titles = pars.filter(par=> /HEAD/.test(par) && par.length < 50)
//       let docs = pars.map(par=> {
//         let doc = {md: par}
//         if (/HEAD/.test(par) && par.length < 50) {
//           doc.level = 2
//           doc.md = par.slice(5)
//         }
//         return doc
//       })
//       let descr = {title: 'xxx', auth: 'xxx'}
//       let res = {descr, docs, imgs: []}
//       resolve(res)
//     })
//     pdfParser.on("pdfParser_dataError", function(evtData) {
//       log('____ERR:')
//     })
//     pdfParser.loadPDF(bpath)
//   })
// }

function cleanStr(str) {
  if (!str) return ''
  let clean = str.trim().replace(/\s\s+/g, ' ')
  clean = clean.replace(/“/g, '"').replace(/”/g, '"').replace(/»/g, '"').replace(/«/g, '"')
  return clean
}

function countInArray(array, value) {
  return array.reduce((n, x) => n + (x === value), 0)
}

function breakRow(row) {
  row = row.replace(/\"\n\"/g, '"BREAK"')
  row = row.replace(/([A-Z])\n([A-Z])/g, "$1BREAK$2")
  row = row.replace(/\.\n\"/g, '.BREAK"').replace(/\?\n\"/g, '?BREAK"')
  row = row.replace(/\"\n([A-Z])/g, "\"BREAK$1")
  row = row.replace(/\.\n([A-Z])/g, ".BREAK$1")
  row = row.replace(/\?\n([A-Z])/g, "?BREAK$1")
  row = row.replace(/\n/g, " ")
  let strs = row.split('BREAK')
  // return row
  return strs
}
