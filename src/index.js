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
      let str = pdfParser.getRawTextContent()
      let rows = str.split('\n')
      let docs = []
      let text = []
      let skip = 2
      let doc, old
      rows.forEach((row, idx)=> {
        if (/Page.*Break/.test(row)) return
        row = row.replace('\r', '').trim()
        log('_R:', skip, JSON.stringify(row), ':r')
        if (row) text.push(row)
        if (!row) {skip++; return}
        if (skip > 0) {
          doc = {idx: idx, md: text.join(' ')}
          docs.push(doc)
          text = []
        }
        if (skip > 1) {
          doc.level = 1
        }
        skip = 0
        old = doc
      })

      if (text.length) {
        doc = {last: true, idx: docs.length, md: text.join(' ')}
        // docs.push(doc)
      }
      let info = {author: 'author', title: 'title', lang: 'lang'}
      let result = {info: info, docs: docs}
      resolve(result)
    })
    pdfParser.on("pdfParser_dataError", function(evtData) {
      log('____ERR-2')
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
