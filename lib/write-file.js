/**
 * 在写入文件之前需要判断这个文件所在的目录是否存在
 * 为了减少 IO 读取次数，缓存已存在的目录
 */

const fs = require('fs-extra')
const path = require('path')

const dirs = new Set()

async function ensureDir(file) {
  const dir = path.dirname(file)
  if (dirs.has(dir)) return
  await fs.ensureDir(dir)
  dirs.add(dir)
}

module.exports = async function (file, content) {
  await ensureDir(file)
  if (arguments.length === 1) return fs.createWriteStream(file)
  return fs.writeFile(file, content, 'utf8')
}
