const fs = require('fs-extra')

module.exports = async function (file, callback) {
  const content = await fs.readFile(file, 'utf8')
  const newContent = callback(content)
  if (newContent !== content) {
    return fs.writeFile(file, newContent, 'utf8')
  }
}
