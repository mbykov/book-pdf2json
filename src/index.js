'use strict'

const fse = require('fs-extra')
const path = require("path")
const log = console.log

const PDFParser = require("pdf2json")
// const pdfParser = new PDFParser()
let pdfParser = new PDFParser(this, 1)


export async function pdf2js(bpath) {
  log('_into', bpath)
  pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
  pdfParser.on("pdfParser_dataReady", pdfData => {
    // fse.writeFile("./pdf2json/test/F1040EZ.json", JSON.stringify(pdfData));
    // let pages = pdfData.formImage.Pages
    // let texts = pages[0].Texts
    // texts = texts.slice(0,100)
    log('_PDF', pdfParser.getRawTextContent())
  })


  pdfParser.loadPDF(bpath);

  let res = 'kuku'
  return res
}
