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
    normalizeWhitespace: true,
    disableCombineTextItems: false,
  };

  return pageData.getTextContent(render_options)
    .then(function (textContent) {
      let lastY,
          text = "PAGE_BREAK\n";
      for (let item of textContent.items) {
        if (lastY == item.transform[5] || !lastY) {
          text += item.str.trim();
        } else {
          text += "\n" + item.str.trim();
        }
        lastY = item.transform[5];
      }
      return text.trim();
    })
    .catch(err=> {
      log('_ERR-text', err)
    })
}

export async function pdf2json(bpath) {
  let dataBuffer = fse.readFileSync(bpath)
  return pdf(dataBuffer, options)
    .then(function (data) {
      let descr = {title: data.info.Title, author: data.info.Author}
      let docs = parseText(data.text)
      let title = {md: data.info.Title, level: 1}
      docs.unshift(title)
      let res = {descr, docs, imgs: []}
      return res
    })
    .catch(err=> {
      log('_ERR PDF', err)
    })
}

function parseText(str) {
  str = cleanStr(str)
  let rebreak = new RegExp('\n\n+')
  str = str.replace(/ \n/g, '\n').replace(/\n+PAGE_BREAK/g, '\nPAGE_BREAK').trim()
  log('_____str', str)

  // PAGE_BREAK - before - . : ? " ] ! \d * ;
  return []

  let rpages = str.split('PAGE_BREAK')

  let strsize = 0
  let pages = []
  for (let rpage of rpages) {
    rpage = rpage.trim()
    if (!rpage) continue
    let pars = rpage.trim().replace(/ \n/g, '\n').split(rebreak)
    pars = pars.filter(par=> par)

    // remove digits-only colons:
    let test = pars[pars.length-1]
    if (/^\d+$/.test(test)) pars = pars.slice(0, -1)
    test = pars[0]
    if (/^\d+$/.test(test)) pars = pars.slice(1)

    let rows = pars.map(par=> par.trim().split('\n'))
    rows = rows.filter(row=> row)
    if (rows.length) pages.push(rows)
  }

  // remove possible colons:
  let has_colon = false
  let possibleheads = pages.map(page=> page[0][0])
  let uniq = _.uniq(possibleheads)
  if (possibleheads.length/uniq.length > 10) has_colon = true
  // has_colon = true

  if (has_colon) {
    let freqs = []
    for (let colon of uniq) {
      freqs.push({colon, freq: countInArray(possibleheads, colon)})
    }
    let max = _.max(freqs, 'freq')
    let colon = max.colon

    for (let page of pages) {
      if (page[0][0] === colon) page[0] = page[0].slice(1)
    }
  }

  // //compact pages
  pages = pages.map(page=> {
    return page.filter(par=> par.length)
  })

  pages = pages.filter(page=> page.length)

  pages.forEach(page=> {
    page[0][0] = 'HEAD-' + page[0][0]
  })

  log('_____pages', pages)

  let cpars = [], row
  for (let page of pages) {
    for (let par of page) {
      row = par.join('\n')
      cpars.push(...breakRow(row))
    }
  }

  cpars = _.flattenDeep(cpars)

  let text  = cpars.join('BREAK')
  // text = text.trim().replace(/\s\s+/g, ' ')
  text = text.replace(/BREAKHEAD-/, '')
  let mds = text.split('BREAK')
  let docs = mds.map(par=> {
    let doc = {md: par}
    if (/HEAD-/.test(par)) {
      doc.md = par.slice(5)
      if (par.length < 50) doc.level = 2
    }
    return doc
  })

  return docs
}

function cleanStr(str) {
  if (!str) return ''
  // let clean = str.trim().replace(/\s\s+/g, ' ')
  let clean = str.replace(/“/g, '"').replace(/”/g, '"').replace(/»/g, '"').replace(/«/g, '"').replace(/\t/g, ' ').replace(/ +/g, ' ')
  return clean
}

function countInArray(array, value) {
  return array.reduce((n, x) => n + (x === value), 0)
}

function breakRow(row) {
  row = row.replace(/\nPAGE_BREAK/g, 'PAGE_BREAK')
  row = row.replace(/\"\n\"/g, '"BREAK"')
  row = row.replace(/([A-Z])\n([A-Z])/g, "$1BREAK$2")
  row = row.replace(/\.\n\"/g, '.BREAK"').replace(/\?\n\"/g, '?BREAK"')
  row = row.replace(/\"\n([A-Z])/g, "\"BREAK$1")
  row = row.replace(/\.\n([A-Z])/g, ".BREAK$1")
  row = row.replace(/\?\n([A-Z])/g, "?BREAK$1")
  row = row.replace(/\n/g, " ")
  let strs = row.split('BREAK')
  return strs
}
