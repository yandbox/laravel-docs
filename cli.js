const get = require('./lib/get')
const download = require('./lib/download')
const writeFile = require('./lib/write-file')
const editFile = require('./lib/edit-file')
const pMap = require('p-map')

const origin = 'https://laravel.com'
// url 包含 version，后续更新修改 version 并删除缓存
const onlineBase = '/docs/5.5'
const localBase = '/laravel'
const links = new Map()
const assets = new Map()

async function fetchPage(page, returned) {
  let { content: html } = await get(page.url)
  if (!html) return

  html = html
    // 删除 fonts
    .replace(/<link .+?fonts.+?>/g, '')
    // 注意不要匹配 <link rel="canonical" href=
    .replace(/(<link .*?href=")(.+?css)"/g, (m, p1, p2) => {
      return p1 + add(p2) + '"'
    })
    .replace(/<script .+?carbon.+?script>/, '')
    .replace(/(<script .*?src=")(.+?)"/g, (m, p1, p2) => {
      return p1 + add(p2, 'js') + '"'
    })
    .replace(/(a .*?href=")(\/.+?)"/g, (m, p1, p2) => {
      return p1 + mapLink(p2) + '"'
    })
    .replace(/(src=")(\/assets\/.+?)"/g, (m, p1, p2) => {
      return p1 + mapAsset(p2) + '"'
    })
    .replace('</head>',
      `<link rel="stylesheet" href="${localBase}/assets-custom/style.css">$&`)

  let i = html.lastIndexOf('<script>')
  html = html.slice(0, i) + '</body>\n</html>'

  writeFile(page.file, html)
}

function add(href, type = 'css') {
  let data = assets.get(href)
  if (data) return data.localUrl

  let url = href
  if (href[0] === '/') {
    if (href[1] === '/') {
      url = 'https:' + href
    } else {
      url = origin + href
    }
  }

  const p = '/assets/' + type + href.slice(href.lastIndexOf('/'))
  const localUrl = localBase + p
  data = {
    url,
    localUrl,
    file: resolvePath(p)
  }
  assets.set(href, data)
  return localUrl
}

function mapLink(p) {
  if (!p.startsWith('/docs')) {
    return origin + p
  }

  if (p === '/docs') {
    return localBase + '/'
  }

  const { pathname, suffix } = parseUrl(p)
  let data = links.get(pathname)
  if (data) return data.localUrl

  const p2 = pathname.slice(onlineBase.length) +
    (pathname.endsWith('/') ? 'index' : '') + '.html'
  data = {
    url: origin + pathname,
    localUrl: localBase + p2 + suffix,
    file: resolvePath(p2)
  }
  links.set(p, data)
  return data.localUrl
}

function parseUrl(p) {
  // strip querystring and hash
  let suffix = ''
  let pathname = p
  let i = p.indexOf('?')
  if (i === -1) {
    i = p.indexOf('#')
  }

  if (i > -1) {
    suffix = p.slice(i)
    pathname = p.slice(0, i)
  }

  return { pathname, suffix }
}

function mapAsset(p) {
  let data = assets.get(p)
  if (data) return data.localUrl

  const localUrl = localBase + p
  assets.set(p, {
    url: origin + p,
    localUrl,
    file: resolvePath(p)
  })
  return localUrl
}

function resolvePath(name) {
  return __dirname + '/public/' + name
}

async function run() {
  let p = onlineBase + '/'
  mapLink(p)
  await fetchPage(links.get(p))

  await pMap(links, arr => {
    return fetchPage(arr[1])
  }, { concurrency: 5 })

  mapAsset('/assets/img/cloud-bar.png')

  await pMap(assets, arr => {
    const { url, file } = arr[1]
    return download(url, file)
  }, { concurrency: 5 })

  assets.forEach(item => {
    const { file } = item
    if (file.includes('laravel-')) {
      editFile(file, content => content.replace('/assets/', '../'))
    }
  })
}

run().catch(console.error)
