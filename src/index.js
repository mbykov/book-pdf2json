'use strict'

import _ from 'lodash'
const fse = require('fs-extra')
const path = require("path")
const log = console.log
const franc = require('franc')

let PDFParser = require("pdf2json")

export function pdf2json(bpath) {
  return new Promise(function (resolve, reject) {
    let pdfParser = new PDFParser(this, 1)
    pdfParser.on("pdfParser_dataReady", function(evtData) {
      // log('_AG', pdfParser.Agency)
      let str = pdfParser.getRawTextContent()
      str = str.replace(/\r/g, '')
      let rows = str.split('\n')
      let pages = [], page = [], clean
      rows.forEach(row=> {
        if (/Page.*Break/.test(row)) {
          if (page.length) pages.push(page)
          page = []
        } else {
          clean = cleanStr(row.trim())
          page.push(clean)
        }
      })
      // let res = pages.slice(100, 110)

      // remove colons as digit only:
      let cleans = []
      for (let page of pages) {
        if (/^\d+$/.test(page[0])) page = page.slice(1)
        if (/^\d+$/.test(page[page.length-1])) page = page.slice(0, -1)
        cleans.push(page)
      }
      // log('_P', cleans)

      // remove possible colons:
      let has_colon = false
      let singles = cleans.map(page=> page[0])
      let uniq = _.uniq(singles)
      if (singles.length/uniq.length > 10) has_colon = true
      log('_HAS_COLON_', singles.length, uniq.length, has_colon)
      let freqs = []
      if (has_colon) {
        for (let colon of uniq) {
          freqs.push({colon, freq: countInArray(singles, colon)})
        }
        let max = _.max(freqs, 'freq')
        let colon = max.colon
        log('_COLON', colon)

        pages = []
        for (let clean of cleans) {
          if (clean[0] == colon) page = clean.slice(1)
          pages.push(page)
        }
      } else {
        pages = cleans
      }
      let strs = _.flatten(pages)
      let text = strs.join('\n')

      let pars = breakRow(text)
      resolve(pars)
      return

    })
    pdfParser.on("pdfParser_dataError", function(evtData) {
      log('____ERR:')
    })
    pdfParser.loadPDF(bpath)
  })
}

function cleanStr(str) {
  if (!str) return ''
  let clean = str.trim().replace(/\s\s+/g, ' ')
  clean = clean.replace(/“/g, '"').replace(/”/g, '"')
  return clean
}

function guessLang(docs) {
  let test = docs.map(doc=> doc._id).join(' ')
  return franc(test)
}

function countInArray(array, value) {
  return array.reduce((n, x) => n + (x === value), 0);
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
