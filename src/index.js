'use strict'

import _ from 'lodash'
const path = require("path")
const log = console.log
const fse = require('fs-extra')

const pdf = require("pdf-extraction")

let options = {
  pagerender: render_page,
}

function render_page(pageData) {
  let render_options = {
    normalizeWhitespace: true,
    disableCombineTextItems: false,
  }

  return pageData.getTextContent(render_options)
    .then(function (textContent) {
      let lastY,
          text = "PAGE_BREAK\n"
      // log('_TC', textContent.items)
      for (let item of textContent.items) {
        if (lastY == item.transform[5] || !lastY) {
          text += item.str
        } else {
          text += "\n" + item.str
        }
        lastY = item.transform[5]
      }
      return text.trim()
    })
    .catch(err=> {
      log('_ERR-text', err)
    })
}

export async function pdf2json(bpath) {
  let dataBuffer = fse.readFileSync(bpath)
  return pdf(dataBuffer, options)
    .then(function (data) {
      let descr = {title: data.info.Title || 'title', author: data.info.Author || 'author'}
      let docs = parseText(data.text)
      let title = {md: descr.title, level: 1}
      docs.unshift(title)
      let res = {descr, docs, imgs: []}
      return res
    })
    .catch(err=> {
      log('_ERR PDF', err)
    })
}

/*
  считаю к-во строк на стр, длинну строки
  убираю колонтитулы
  ставлю заголовки

*/

function removeSimpleColonTitle(pages) {
  return pages
}

function removeColonTitle(pages) {
  return pages
}

function parseText(str) {
  str = str.replace(/\n\n+/g, '\n')
  let pages = str.split('PAGE_BREAK')
  let pagerows = pages.map(page=> page.split('\n').map(row=> row.trim()).filter(row=> row)).filter(page=> page.length)

  let testpages = pagerows.slice(25, pages.length-25)
  let pagesize = _.round(_.sum(testpages.map(testrows=> testrows.length))/testpages.length)
  let rows = _.flatten(testpages.map(testrows=> testrows)).filter(row=> row)
  let rowsize = _.round(_.sum(rows.map(row=> row.length))/rows.length)
  log('_PS', pagesize)
  log('_RS', rowsize)
  let parbr = _.round(rowsize*0.75)
  log('_PBR', parbr)
  pages = removeSimpleColonTitle(pages)
  pages = removeColonTitle(pages)

  let docs = []
  let parsigns = '.?:]!0123456789'.split('')
  let nonheaders = '–'.split('')
  let prev = ''
  let doc = {}
  let mds = []
  pagerows.forEach((rows, idy)=> {
    // if (idy < 4) return
    // if (idy > 20) return
    // log('_PAGE-rows:', idy, rows, '______end-rows')
    rows.forEach((row, idx)=> {
      if (prev.length <= parbr) {
        doc.md = mds.join(' ')
        if (mds.length) docs.push(doc)
        doc = {}
        mds = [row]
        // if (!idx) docs.push({pb__________________: idy})
        if (!idx && rows.length <= pagesize/1.5 && row.length <= rowsize/2) doc.level = 2
      } else {
        mds.push(row)
      }
      prev = row
    })
  })
  // docs = docs.slice(50,60)
  let headers = docs.filter(doc=> doc.level)
  // log('_BPS', docs)
  return docs
}



function parseText_(str) {
  str = str.replace(/\n\n+/g, '\n')
  // log('__str__', str)

  return []

  str = cleanStr(str)
  let rebreak = new RegExp('\n\n+')
  str = str.replace(/ \n/g, '\n').replace(/\n+PAGE_BREAK/g, '\nPAGE_BREAK').trim()
  log('_____str', str.length)

  // PAGE_BREAK - before - . : ? " ] ! \d * ;
  // return []

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
  // pages = pages.map(page=> {
  //   return page.filter(par=> par.length)
  // })

  pages = _.flatten(pages.filter(page=> page.length))

  log('_____pages', pages)

  return []

  pages.forEach(page=> {
    page[0][0] = 'HEAD-' + page[0][0]
  })

  log('_____pages', pages)

  return []

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
