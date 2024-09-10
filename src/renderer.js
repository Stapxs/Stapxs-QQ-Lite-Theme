const log = (...args) => {
    console.log('[bcui-theme]', ...args)
    bcui_theme.logToMain(...args)
}
const error = (...args) => {
    console.error('[bcui-theme]', ...args)
    bcui_theme.logToError(...args)
}

/*
    渲染线程 IPC 事件 ==============================================
*/

// 刷新样式
bcui_theme.updateStyle( async (event, id, data) => {
    let style = document.querySelector(`style[id="${id}"]`)

    if (!style) {
        style = document.createElement('style')
        style.id = id
        document.head.appendChild(style)
    }

    style.textContent = data
})
bcui_theme.updateTheme( async (event, config) => {
    updateTheme(config)
})

function updateTheme(config) {
    log('更新主题：' + JSON.stringify(config))
    try {
        if(config) {
            if(config.color != undefined) {
                document.documentElement.style.setProperty('--color-main', 'var(--color-main-' + config.color + ')')
                const meta = document.getElementsByName('theme-color')[0]
                if(meta) {
                    meta.content = getComputedStyle(document.documentElement)
                        .getPropertyValue('--color-main-' + config.color)
                }
            }
            if(config.bg != undefined && config.bg.indexOf('url("local:///') == 0) {
                if(document.getElementsByClassName('two-col-layout__main')[0])
                    document.getElementsByClassName('two-col-layout__main')[0].style
                        .background = config.bg
            } else {
                if(document.getElementsByClassName('two-col-layout__main')[0])
                    document.getElementsByClassName('two-col-layout__main')[0].style
                        .background = 'var(--color-card)'
            }
            if(config.opacity && typeof config.opacity == 'number') {
                const list = [
                    document.getElementsByClassName('aio')[0],
                    document.getElementsByClassName('empty-aio')[0],
                ]
                list.forEach((item) => {
                    if(item)
                        item.style.backdropFilter = `blur(${config.opacity}px)`
                })
            }
        }
    } catch (err) {
        error('更新主题失败：', err.toString() + '\n' + err.stack)
        
    }
}

// 渲染线程初始化完成
log('渲染线程初始化完成')
error('渲染线程初始化完成')
bcui_theme.rendererReady()

try {
    if (location.pathname === '/renderer/index.html') {
        if (location.hash === '#/blank') {
            navigation.addEventListener(
                'navigatesuccess',
                () => {
                    if (location.hash.includes('#/main') || location.hash.includes('#/chat')) {
                        onMessageCreate()
                    }
                },
                { once: true },
            )
        } else if (location.hash.includes('#/main') || location.hash.includes('#/chat')) {
            onMessageCreate()
        }
    }
} catch (err) {
    error('main, ERROR', err.toString())
}

/*
    渲染线程事件 ==============================================
*/

export const onSettingWindowCreated = (view) => {
    onSettingCreate(view)
}

const onMessageCreate = async () => {
    const configs = await bcui_theme.getSetting()
    updateTheme(configs)
}

// 创建设置页面
const onSettingCreate = async (view) => {
    log('创建设置页面')
    const version = await bcui_theme.getVersion()
    // 创建顶图
    const topHtml = `<div class="ss-card main-card">
                        <div class="bg-left"></div>
                        <div class="info-card">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                <path
                                    d="M256 32c12.5 0 24.1 6.4 30.7 17L503.4 394.4c5.6 8.9 8.6 19.2 8.6 29.7c0 30.9-25 55.9-55.9 55.9H55.9C25 480 0 455 0 424.1c0-10.5 3-20.8 8.6-29.7L225.2 49c6.6-10.6 18.3-17 30.8-17zm65 192L256 120.4 176.9 246.5 208 288l48-64h65z" />
                            </svg>
                            <span class="title">
                                Border Card UI
                                <span>for LiteLoaderQQNT</span>
                            </span>
                            <span>一个更加轻便简洁的 LiteLoaderQQNT 主题</span>
                            <a>${version}</a>
                        </div>
                        <div class="bg-right"></div>
                    </div>
                    <div class="info-copy"><span>Copyright (C) ${new Date().getFullYear()} Stapx Steve [林槐]</span></div>`
    const topView = document.createElement('div')
    topView.innerHTML = topHtml
    view.appendChild(topView)
    try {
        // 添加设置主体
        const settingHtml = await bcui_theme.getSettingHTML()
        const configs = await bcui_theme.getSetting()
        updateTheme(configs)
        const settingView = document.createElement('div')
        settingView.innerHTML = settingHtml
        // 设置元素和保存操作
        Object.keys(configs).forEach(key => {
            const value = configs[key]
            const dom = settingView.querySelector(`[name="bcui-${key}"]`)
            log('设置元素：' + key + ' : ' + dom.type)
            // 设置元素值
            switch (dom.type) {
                case 'submit': {
                    break
                }
                default: {
                    dom.value = value
                    break
                }
            }
            // 保存操作
            switch (dom.type) {
                case 'range':
                case 'select-one': {
                    dom.addEventListener('change', () => {
                        try {
                            bcui_theme.setSetting(key, Number(dom.value))
                            updateSettingPage(view)
                        } catch (err) {
                            error('设置设置失败：', err.toString())
                        }
                    })
                    break
                }
                case 'submit': {
                    dom.addEventListener('click', () => {
                        try {
                            if(key == 'bg') {
                                bcui_theme.chooseImage()
                            }
                            if(key == 'bgName') {
                                bcui_theme.setSetting('bg', '')
                                bcui_theme.setSetting('bgName', '')
                            }
                            updateSettingPage(view)
                        } catch (err) {
                            error('设置设置失败：', err.toString())
                        }
                    })
                    break
                }
            }
        })

        view.appendChild(settingView)
        updateSettingPage(view)
    } catch (err) {
        error('创建设置页面失败：', err.toString())
    }
}

async function updateSettingPage(view) {
    const configs = await bcui_theme.getSetting()
    const bgName = view.getElementsByClassName('bcui-bg-name')[0]
    if(configs.bgName && configs.bgName != '') {
        bgName.innerText = configs.bgName
        view.getElementsByClassName('bcui-bgName')[0].style.display = 'block'
    } else {
        bgName.style.display = 'none'
        view.getElementsByClassName('bcui-bgName')[0].style.display = 'none'
    }
}