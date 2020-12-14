'use strict'

const path = require("path")
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const options = {}; /* see below */
const log = console.log
let pdfpath = path.resolve(__dirname, '../test/text-only.pdf')

pdfExtract.extract(pdfpath, options, (err, data) => {
  if (err) return console.log(err);
  log(data);
    // .slice(0,3)
  log(data.pages[0].content.slice(0,1));
});
