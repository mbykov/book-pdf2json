'use strict'

import _ from 'lodash'
const path = require("path")
const log = console.log
const fse = require('fs-extra')


const pdf = require("pdf-extraction");

let options = {
  pagerender: render_page,
};

function render_page(pageData) {
  let render_options = {
    normalizeWhitespace: false,
    disableCombineTextItems: false,
  };

  return pageData.getTextContent(render_options)
    .then(function (textContent) {
      let lastY,
          text = "PAGE_BREAK";
      for (let item of textContent.items) {
        // log('_I', item)
        if (lastY == item.transform[5] || !lastY) {
          text += item.str;
        } else {
          text += "\n" + item.str;
        }
        lastY = item.transform[5];
      }
      return text;
    })
    .catch(err=> {
      log('_ERR-text', err)
    })
}

export async function pdf2json(bpath) {
  let dataBuffer = fse.readFileSync(bpath)
  return pdf(dataBuffer, options)
    .then(function (data) {
      // log('__data', _.keys(data));
      let descr = {title: data.info.Title, author: data.info.Author}
      let docs = parseText(data.text)
      log('___docs', docs.length)
      let res = {descr, docs, imgs: []}
      return res
    })
    .catch(err=> {
      log('_ERR', err)
    })
}

function parseText(str) {
  let pages = str.split('PAGE_BREAK')
  // pages = pages.map(page=> page.split('\n\n'))
  let cpages = []
  pages.forEach(page=> {
    let pars = page.trim().replace(/ \n/g, '\n').split('\n\n')
    log('___PAGE___', pars)
    let cpars = _.flatten(pars.map(par=> parsePar(par)))
  })
  // let docs = data.text //.slice(20000, 20001)
  return cpages
}

function parsePar(str) {
  // log('___PAR___', str)
  return []
}

export async function pdf2json_(bpath) {
  return new Promise(function (resolve, reject) {
    let pdfParser = new PDFParser(this, 1)
    pdfParser.on("pdfParser_dataReady", function(evtData) {
      // let meta = pdfParser.prototype.loadMetaData ()
      // log('__M', meta)
      let str = pdfParser.getRawTextContent()
      str = str.replace(/\r/g, '')
      let rows = str.split('\n')
      let pages = [], page = [], clean
      rows.forEach(row=> {
        if (/Page.*Break/.test(row)) {
          if (page.length) pages.push(page)
          page = []
        } else {
          clean = row.trim()
          if (!clean) return
          clean = cleanStr(clean)
          page.push(clean)
        }
      })
      // pages = pages.slice(68, 71)

      // remove digits-only colons:
      let cleans = [], test
      for (let page of pages) {
        test = page[0].replace(/-/g, '').trim()
        if (/^\d+$/.test(test)) page = page.slice(1)
        test = page[page.length-1].replace(/-/g, '').trim()
        if (/^\d+$/.test(test)) page = page.slice(0, -1)
        cleans.push(page)
      }

      // remove possible colons:
      let has_colon = false
      let singles = cleans.map(page=> page[0])
      let uniq = _.uniq(singles)
      if (singles.length/uniq.length > 10) has_colon = true
      // log('_HAS_COLON_', singles.length, uniq.length, has_colon)
      let freqs = []
      if (has_colon) {
        for (let colon of uniq) {
          freqs.push({colon, freq: countInArray(singles, colon)})
        }
        let max = _.max(freqs, 'freq')
        let colon = max.colon

        pages = []
        for (let clean of cleans) {
          if (clean[0] == colon) page = clean.slice(1)
          pages.push(page)
        }
      } else {
        pages = cleans
      }
      pages.forEach(page=> {
        page[0] = 'HEAD-' + page[0]
      })
      let strs = _.flatten(pages)
      let text = strs.join('\n')

      let pars = breakRow(text)
      let titles = pars.filter(par=> /HEAD/.test(par) && par.length < 50)
      let docs = pars.map(par=> {
        let doc = {md: par}
        if (/HEAD/.test(par) && par.length < 50) {
          doc.level = 2
          doc.md = par.slice(5)
        }
        return doc
      })
      let descr = {title: 'xxx', auth: 'xxx'}
      let res = {descr, docs, imgs: []}
      resolve(res)
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
