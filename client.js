/**
 * dsh-session-mark browser half: adds a low-saturation gradient wash to session
 * rows through the session context menu. State stays in localStorage.
 */
window.__ModuleLoader__.load({
  id: 'dsh-session-mark',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'dshSessionMark'
    const PACKAGE = 'dsh-session-mark'
    const STORAGE_KEY = 'dsh.session-marks.v1'
    const SAFE_ID = /^[A-Za-z0-9._:-]+$/

    const STYLES = [
      { id: 'wine', rgb: '122, 51, 65' },
      { id: 'brick', rgb: '138, 74, 50' },
      { id: 'olive', rgb: '110, 98, 51' },
      { id: 'pine', rgb: '62, 92, 70' },
      { id: 'teal', rgb: '35, 107, 102' },
      { id: 'indigo', rgb: '51, 69, 110' },
      { id: 'plum', rgb: '90, 62, 110' },
      { id: 'graphite', rgb: '74, 79, 87' }
    ]
    const STYLE_BY_ID = new Map(STYLES.map((style) => [style.id, style]))
    const STOPS = [0, 30, 58, 80, 100]
    const ALPHA = {
      light: [0.34, 0.20, 0.08, 0.02, 0],
      dark: [0.62, 0.38, 0.16, 0.04, 0]
    }
    const PREVIEW_ALPHA = [0.92, 0.72, 0.36, 0.06, 0]

    const DICTS = {
      zh: {
        'menu.label': '会话标记',
        'save.failed': '标记未能保存',
        'style.wine': '绛红渐变',
        'style.brick': '朱砂渐变',
        'style.olive': '橄榄渐变',
        'style.pine': '松绿渐变',
        'style.teal': '黛青渐变',
        'style.indigo': '靛蓝渐变',
        'style.plum': '紫檀渐变',
        'style.graphite': '玄灰渐变',
        'style.none': '无标记'
      },
      en: {
        'menu.label': 'Session mark',
        'save.failed': 'The mark could not be saved',
        'style.wine': 'Wine gradient',
        'style.brick': 'Brick gradient',
        'style.olive': 'Olive gradient',
        'style.pine': 'Pine gradient',
        'style.teal': 'Teal gradient',
        'style.indigo': 'Indigo gradient',
        'style.plum': 'Plum gradient',
        'style.graphite': 'Graphite gradient',
        'style.none': 'No mark'
      }
    }

    function gradient(style, mode) {
      const alpha = ALPHA[mode]
      const stops = STOPS.map((stop, index) => `rgba(${style.rgb}, ${alpha[index]}) ${stop}%`)
      return `linear-gradient(90deg, ${stops.join(', ')})`
    }

    function previewGradient(style) {
      const stops = STOPS.map((stop, index) => `rgba(${style.rgb}, ${PREVIEW_ALPHA[index]}) ${stop}%`)
      return `linear-gradient(90deg, ${stops.join(', ')})`
    }

    const BASE_CSS = (() => {
      const light = STYLES.map((style) => `--dsh-session-mark-${style.id}:${gradient(style, 'light')};`).join('')
      const dark = STYLES.map((style) => `--dsh-session-mark-${style.id}:${gradient(style, 'dark')};`).join('')
      return `:root{${light}}body[data-ds-dark-theme]{${dark}}`
    })()

    function rowCss(marks) {
      let css = ''
      for (const [sessionId, styleId] of Object.entries(marks)) {
        if (!SAFE_ID.test(sessionId) || !STYLE_BY_ID.has(styleId)) continue
        css += `[data-row-key="session:${sessionId}"]{background-image:var(--dsh-session-mark-${styleId})}\n`
      }
      return css
    }

    function readMarks() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw === null) return { marks: {}, error: null }
        const parsed = JSON.parse(raw)
        if (parsed === null || typeof parsed !== 'object' || parsed.v !== 1 || parsed.marks === null || typeof parsed.marks !== 'object') {
          return { marks: {}, error: null }
        }
        const marks = {}
        for (const [sessionId, styleId] of Object.entries(parsed.marks)) {
          if (SAFE_ID.test(sessionId) && STYLE_BY_ID.has(styleId)) marks[sessionId] = styleId
        }
        return { marks, error: null }
      } catch (error) {
        return { marks: {}, error }
      }
    }

    function writeMarks(marks) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, marks }))
    }

    function MenuTag() {
      return h('svg', {
        viewBox: '0 0 16 16',
        width: 14,
        height: 14,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        style: { display: 'block' }
      },
        h('path', { d: 'M2.5 2.5h5l6 6-5.5 5.5-6-6z' }),
        h('circle', { cx: 5.5, cy: 5.5, r: 1, fill: 'currentColor', stroke: 'none' })
      )
    }

    const VISUALLY_HIDDEN = {
      position: 'absolute',
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      border: 0,
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)',
      clipPath: 'inset(50%)',
      whiteSpace: 'nowrap'
    }

    function labelBar(backgroundImage, label, baseColor) {
      return h('span', {
        style: { display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }
      },
        h('span', {
          key: 'bar',
          style: {
            flex: '1 1 auto',
            width: '100%',
            height: 18,
            borderRadius: 4,
            backgroundColor: baseColor,
            backgroundImage
          }
        }),
        h('span', { key: 'label', style: VISUALLY_HIDDEN }, label)
      )
    }

    function styleLabel(styleDef, label) {
      return labelBar(previewGradient(styleDef), label, 'transparent')
    }

    function clearLabel(label) {
      return labelBar('none', label, 'transparent')
    }

    return {
      inject: ['contextMenus', 'locale', 'slots'],
      apply(ctx) {
        const t = ctx.locale.bind(NS)
        ctx.effect(() => ctx.locale.register(NS, DICTS), 'session mark: dictionaries')

        let { marks, error: readError } = readMarks()
        if (readError !== null) console.warn('[dsh-session-mark] cannot read marks', readError)

        const style = document.createElement('style')
        style.dataset.plugin = PACKAGE
        style.dataset.pluginCss = `${PACKAGE}/session-marks.css`
        ctx.effect(() => {
          document.head.appendChild(style)
          return () => style.remove()
        }, 'session mark: styles')

        const render = () => {
          style.textContent = `${BASE_CSS}${rowCss(marks)}`
        }
        render()

        const setMark = (sessionId, styleId) => {
          if (!SAFE_ID.test(sessionId)) return
          if (styleId === null) delete marks[sessionId]
          else if (STYLE_BY_ID.has(styleId)) marks[sessionId] = styleId
          else return
          try {
            writeMarks(marks)
          } catch (error) {
            console.warn('[dsh-session-mark] cannot save marks', error)
            ctx.contextMenus.notify(t('save.failed'), false)
          }
          render()
        }

        ctx.effect(() => {
          const onStorage = (event) => {
            if (event.key !== STORAGE_KEY && event.key !== null) return
            const next = readMarks()
            marks = next.marks
            if (next.error !== null) console.warn('[dsh-session-mark] cannot reload marks', next.error)
            render()
          }
          window.addEventListener('storage', onStorage)
          return () => window.removeEventListener('storage', onStorage)
        }, 'session mark: storage sync')

        ctx.slots.inject('contextMenu.icon', function* () {
          yield ctx.slots.register(
            { name: 'contextMenu.icon', key: 'session-mark.none' },
            () => h(MenuTag)
          )
        })

        ctx.effect(() => ctx.contextMenus.register({
          id: 'session-mark',
          target: 'session',
          order: 500,
          resolve: ({ sessionId }) => {
            return [{
              id: 'mark',
              label: t('menu.label'),
              icon: { key: 'session-mark.none' },
              children: [
                ...STYLES.map((styleDef) => ({
                  id: styleDef.id,
                  label: styleLabel(styleDef, t(`style.${styleDef.id}`)),
                  run: () => setMark(sessionId, styleDef.id)
                })),
                {
                  id: 'none',
                  label: clearLabel(t('style.none')),
                  run: () => setMark(sessionId, null)
                }
              ]
            }]
          }
        }), 'session mark: menu')
      }
    }
  }
})
