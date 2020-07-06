'use strict'

const fse = require('fs-extra')
const path = require("path")
const log = console.log

let PDFParser = require("pdf2json")
// const pdfParser = new PDFParser()


export function pdf2json(bpath) {
  return new Promise(function (resolve, reject) {
    let pdfParser = new PDFParser(this, 1)
    pdfParser.on("pdfParser_dataReady", function(evtData) {
      let text = pdfParser.getRawTextContent()
      log('____SUCCSESS', text.length)
      resolve(text);
    })
    pdfParser.on("pdfParser_dataError", function(evtData) {
      log('____ERR-2')
    })
    log('_pdf:_', bpath)
    pdfParser.loadPDF(bpath)
  })

}
