const fs = require('fs')
const path = require('path')
const { BrowserWindow, ipcMain } = require('electron')

const cssPath = path.join(__dirname, 'css')
const cssFiles = fs.readdirSync(cssPath)

// 防抖函数
function debounce(fn, time) {
  let timer = null
  return function (...args) {
    timer && clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, time)
  }
}

// 更新样式
function updateStyle(webContents) {
  let data = ''
  cssFiles.forEach(cssFileName => {
    const cssFilePath = path.join(cssPath, cssFileName)
    data += fs.readFileSync(cssFilePath, 'utf-8')
  })
  webContents.send('betterQQNT.HK_theme.updateStyle', data)
}

// 监听CSS修改-开发时候用的
function watchCSSChange(webContents) {
  cssFiles.forEach(cssFileName => {
    const cssFilePath = path.join(cssPath, cssFileName)
    fs.watch(
      cssFilePath,
      'utf-8',
      debounce(() => {
        updateStyle(webContents)
      }, 100)
    )
  })
}

function onLoad(plugin) {
  ipcMain.on('betterQQNT.HK_theme.rendererReady', (event, message) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    updateStyle(window.webContents)
  })
}

function onBrowserWindowCreated(window, plugin) {
  window.on('ready-to-show', () => {
    watchCSSChange(window.webContents)
  })
}

module.exports = {
  onLoad,
  onBrowserWindowCreated
}
