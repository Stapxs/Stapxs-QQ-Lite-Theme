const fs = require('fs')
const path = require('path')
const { BrowserWindow, ipcMain, dialog } = require('electron')

const pluginPath = LiteLoader.plugins['border-card-ui-theme'].path.plugin.replaceAll('\\', '/')
const dataPath = LiteLoader.plugins['border-card-ui-theme'].path.data.replaceAll('\\', '/')
const settingPath = path.join(dataPath, 'setting.json').replaceAll('\\', '/')

const log = (...args) => {
    console.log('\x1b[36m[bcui-theme]\x1b[0m', ...args)
}
const error = (...args) => {
    console.log('\x1b[31m[bcui-theme]\x1b[0m', ...args)
}

// 获取当前有哪些css
const cssPath = path.join(__dirname, 'css')
// 寻找这个文件夹下所有的 .css 后缀文件（包括子文件夹）
function getAllCssFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []

    files.forEach((file) => {
        const filePath = path.join(dirPath, file)
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllCssFiles(filePath, arrayOfFiles)
        } else if (file.endsWith('.css')) {
            arrayOfFiles.push(filePath)
        }
    })

    return arrayOfFiles
}

const cssFiles = getAllCssFiles(cssPath)

/*
    主线程方法 ==============================================
*/

// 更新样式
function updateStyle(webContents) {
    cssFiles.forEach((filePath) => {
        const data = fs.readFileSync(filePath, 'utf-8')
        const id = filePath.substring(filePath.lastIndexOf('\\') + 1, filePath.lastIndexOf('.'))
        webContents.send('LiteLoader.bcui_theme.updateStyle', id, data)
    })
}

// 获取设置
function getSetting() {
    try {
        log('正在获取全量设置……')
        let rawdata = fs.readFileSync(settingPath)
        return JSON.parse(rawdata)
    } catch (err) {
        error('获取全量设置失败：', err.toString())
        return null
    }
}
// 设置设置
function setSetting(k, v) {
    try {
        if (!k || v === undefined) {
            throw Error('k 或 v 为空')
        }
        let data = fs.readFileSync(settingPath, 'utf8')
        let setting = JSON.parse(data)
        setting[k] = v
        const updatedData = JSON.stringify(setting, null, 4)
        fs.writeFileSync(settingPath, updatedData, 'utf8')
        log('保存设置：' + k + ' -> ' + v + ' 成功')

        const nowConfig = getSetting()
        const window = BrowserWindow.getAllWindows()
        window.forEach((win) => {
            win.webContents.send('LiteLoader.bcui_theme.updateTheme', nowConfig)
        })
    } catch (err) {
        error('设置设置失败：', err.toString())
    }
}

function chooseImage() {
    dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        })
        .then((result) => {
            try {
                let imagePath = result.filePaths[0]
                if (!imagePath) {
                    return
                }
                // 将文件复制到 dataPath，名称固定为 bg.*
                const fileName = path.basename(imagePath)
                const image = fs.readFileSync(imagePath)
                const ext = path.extname(imagePath)
                const bgPath = path.join(dataPath, 'bg' + ext)
                // 如果文件存在就删掉它
                if (fs.existsSync(bgPath)) {
                    fs.unlinkSync(bgPath)
                }
                fs.writeFileSync(bgPath, image)
                setSetting('bg', 'url("local:///' + bgPath + '")')
                setSetting('bgName', fileName)
            } catch (err) {
                error('chooseImage error', err.toString())
            }
        })
        .catch((err) => {
            error('chooseImage, error', err.toString())
        })
}

/*
    主线程 IPC 事件 ==============================================
*/

ipcMain.on('LiteLoader.bcui_theme.rendererReady', (event, message) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    updateStyle(window.webContents)
})
ipcMain.on('LiteLoader.bcui_theme.logToMain', (_, ...args) => {
    log('[renderer]', ...args)
})
ipcMain.on('LiteLoader.bcui_theme.logToError', (_, ...args) => {
    error('[renderer]', ...args)
})

ipcMain.handle('LiteLoader.bcui_theme.getVersion', async () => {
    const data = fs.readFileSync(`${pluginPath}/manifest.json`, 'utf-8')
    return await JSON.parse(data).version
})
ipcMain.handle('LiteLoader.bcui_theme.getSetting', async () => {
    return await getSetting()
})
ipcMain.on('LiteLoader.bcui_theme.setSetting', (_, k, v) => {
    setSetting(k, v)
})
ipcMain.handle('LiteLoader.bcui_theme.getSettingHTML', async () => {
    return fs.readFileSync(`${pluginPath}/src/config.html`, 'utf-8')
})
ipcMain.on('LiteLoader.bcui_theme.chooseImage', () => {
    chooseImage()
})

/*
    主线程事件 ==============================================
*/

module.exports.onBrowserWindowCreated = (window) => {
    log('设置目录：' + settingPath)
    try {
        // 创建设置文件
        // 判断 setting.json 是否存在，不存在则创建
        if (!fs.existsSync(settingPath)) {
            log('初始化设置 -> ' + settingPath)
            fs.mkdirSync(dataPath, { recursive: true })
            fs.copyFileSync(`${pluginPath}/src/setting.json`, settingPath)
        }
    } catch(ex) {
        error('初始化设置失败：', ex.toString())
    }
}
