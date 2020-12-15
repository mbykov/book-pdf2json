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
  str = cleanStr(str)
  let pages = str.trim().split('PAGE_BREAK')
  pages = pages.slice(205, 210)
  let cpages = []

  for (let page of pages) {
    if (!page) continue
    let pars = page.trim().replace(/ \n/g, '\n').split('\n\n')
    pars = pars.filter(par=> par && par.length)

    // remove digits-only colons:
    let test = pars[pars.length-1]
    if (/^\d+$/.test(test)) pars = pars.slice(0, -1)
    test = pars[0]
    if (/^\d+$/.test(test)) pars = pars.slice(1)
    pars = _.flatten(pars)
    // page = pars.map(par=> par.split('\n'))
    cpages.push(pars.map(par=> par.split('\n')))
  }

  pages = cpages

  // remove possible colons:
  let has_colon = false
  let possibleheads = pages.map(page=> page[0][0])
  let uniq = _.uniq(possibleheads)
  if (possibleheads.length/uniq.length > 10) has_colon = true
  // log('_HAS_COLON_', possibleheads.length, uniq.length, has_colon)
  has_colon = true

  let freqs = []
  if (has_colon) {
    for (let colon of uniq) {
      freqs.push({colon, freq: countInArray(possibleheads, colon)})
    }
    let max = _.max(freqs, 'freq')
    let colon = max.colon
    // log('_COLON_', colon)

    for (let page of pages) {
      if (page[0][0] === colon) page[0] = page[0].slice(1)
    }
  }

  pages.forEach(page=> {
    page[0][0] = 'HEAD-' + page[0][0]
  })

  log('___PAGES___', pages.length)

  let cpars = [], row
  for (let page of pages) {
    for (let par of page) {
      // log('___PAR___', par)
      row = par.join('\n')
      cpars.push(...breakRow(row))
    }
  }
  cpars = _.flattenDeep(cpars)

  let text  = cpars.join('BREAK')
  text = text.replace(/BREAKHEAD-/, '')
  let mds = text.split('BREAK')
  return mds
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
  // let clean = str.trim().replace(/\s\s+/g, ' ')
  let clean = str.replace(/“/g, '"').replace(/”/g, '"').replace(/»/g, '"').replace(/«/g, '"')
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
