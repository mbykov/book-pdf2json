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
      let pages = [], page = []
      rows.forEach(row=> {
        if (/Page.*Break/.test(row)) {
          if (page.length) pages.push(page)
          page = []
        } else {
          page.push(row.trim())
        }
      })
      let res = pages.slice(100, 110)

      // remove colons as digit only:
      let cleans = [], clean
      for (let page of pages) {
        if (/^\d+$/.test(page[0])) clean = page.slice(1)
        if (/^\d+$/.test(page[page.length-1])) clean = page.slice(0, -1)
        cleans.push(clean)
      }

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
      // Paracelsus
      resolve(strs)
      return



      // let docs = []
      // let text = []
      // let skip = 2
      // let doc, old
      // rows.forEach((row, idx)=> {
      //   if (/Page.*Break/.test(row)) return
      //   row = row.replace('\r', '').trim()
      //   log('_R:', skip, JSON.stringify(row))
      //   if (row) text.push(row)
      //   if (!row) {skip++; return}
      //   if (skip > 0) {
      //     doc = {idx: idx, md: text.join(' ')}
      //     docs.push(doc)
      //     text = []
      //   }
      //   if (skip > 1) {
      //     doc.level = 1
      //   }
      //   skip = 0
      //   old = doc
      // })

      // if (text.length) {
      //   doc = {last: true, idx: docs.length, md: text.join(' ')}
      //   // docs.push(doc)
      // }
      // let info = {author: 'author', title: 'title', lang: 'lang'}
      // let result = {info: info, docs: docs}
      // resolve(result)
    })
    pdfParser.on("pdfParser_dataError", function(evtData) {
      log('____ERR:')
    })
    pdfParser.loadPDF(bpath)
  })
}

function cleanText(str) {
  if (!str) return ''
  let clean = str.replace(/\s\s+/g, ' ')
  return clean
}

function guessLang(docs) {
  let test = docs.map(doc=> doc._id).join(' ')
  return franc(test)
}

function countInArray(array, value) {
  return array.reduce((n, x) => n + (x === value), 0);
}
