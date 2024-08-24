const dev = true

const fs = require('fs')
const path = require('path')
const { BrowserWindow, ipcMain } = require('electron')

// 获取当前有哪些css
const cssPath = path.join(__dirname, 'css')
// 寻找这个文件夹下所有的 .css 后缀文件（包括子文件夹
function getAllCssFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllCssFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.css')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

const cssFiles = getAllCssFiles(cssPath);

// 更新样式
function updateStyle(webContents) {
  cssFiles.forEach((filePath) => {
    const data = fs.readFileSync(filePath, 'utf-8')
    const id = filePath.substring(filePath.lastIndexOf('\\') + 1, filePath.lastIndexOf('.'))
    webContents.send('LiteLoader.hk_theme.updateStyle', id, data)
  })
}

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

// 监听CSS修改-开发时候用的
function watchCSSChange(webContents) {
  cssFiles.forEach((filePath) => {
    fs.watch(
      filePath,
      'utf-8',
      debounce(() => updateStyle(webContents), 100)
    )
  })
}

ipcMain.on('LiteLoader.hk_theme.rendererReady', (event, message) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  updateStyle(window.webContents)
})

module.exports.onBrowserWindowCreated = (window) => {
  // 開發模式監控文件更新
  if (dev) {
    const url = window.webContents.getURL()
    if (url.includes('app://./renderer/index.html')) watchCSSChange(window.webContents)
  }
}
