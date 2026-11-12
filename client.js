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
    const STOPS = [0, 25, 50, 75, 100]
    const ALPHA = {
      light: [0, 0.10, 0.34, 0.10, 0],
      dark: [0, 0.18, 0.62, 0.18, 0]
    }
    const PREVIEW_ALPHA = [0, 0.30, 0.92, 0.30, 0]

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
        'pattern.star': '星星',
        'pattern.cat': '猫',
        'pattern.dog': '狗',
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
        'pattern.star': 'Star',
        'pattern.cat': 'Cat',
        'pattern.dog': 'Dog',
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
          if (SAFE_ID.test(sessionId) && MARK_BY_ID.has(styleId)) marks[sessionId] = styleId
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

    const PATTERN_SVG = {
      viewBox: '0 0 16 16',
      width: 14,
      height: 14,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.3,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
      style: { display: 'block' }
    }

    function StarPattern() {
      return h('svg', PATTERN_SVG,
        h('path', { d: 'M8 1.8 9.6 5.9 14 6.3 10.8 9 11.8 13.1 8 10.8 4.2 13.1 5.2 9 2 6.3 6.4 5.9Z' })
      )
    }

    function CatPattern() {
      return h('svg', PATTERN_SVG,
        h('path', { d: 'M3.2 8.3c0-2.7 2.1-4.6 4.8-4.6s4.8 1.9 4.8 4.6-2.1 4.7-4.8 4.7-4.8-2-4.8-4.7Z' }),
        h('path', { d: 'M3.5 6.2 4 2.7 6.5 4.5' }),
        h('path', { d: 'M12.5 6.2 12 2.7 9.5 4.5' }),
        h('path', { d: 'M6.2 7.8h.01', strokeWidth: 1.9 }),
        h('path', { d: 'M9.8 7.8h.01', strokeWidth: 1.9 }),
        h('path', { d: 'M8 9.2v.7' }),
        h('path', { d: 'M7.2 10.1c.2.3.5.5.8.5s.6-.2.8-.5' })
      )
    }

    function DogPattern() {
      return h('svg', PATTERN_SVG,
        h('path', { d: 'M3.2 8.3c0-2.6 2.1-4.5 4.8-4.5s4.8 1.9 4.8 4.5-2.1 4.8-4.8 4.8-4.8-2.2-4.8-4.8Z' }),
        h('path', { d: 'M3.4 6.3C1.8 6.3 1.8 9 3.1 10c.6.4 1.4.2 1.8-.4' }),
        h('path', { d: 'M12.6 6.3C14.2 6.3 14.2 9 12.9 10c-.6.4-1.4.2-1.8-.4' }),
        h('path', { d: 'M6.2 7.9h.01', strokeWidth: 1.9 }),
        h('path', { d: 'M9.8 7.9h.01', strokeWidth: 1.9 }),
        h('path', { d: 'M7.3 9.3h1.4l-.7 1Z', fill: 'currentColor', stroke: 'none' })
      )
    }

    const PATTERN_STYLES = [
      { id: 'star', Component: StarPattern },
      { id: 'cat', Component: CatPattern },
      { id: 'dog', Component: DogPattern }
    ]
    const PATTERN_BY_ID = new Map(PATTERN_STYLES.map((pattern) => [pattern.id, pattern]))
    const MARK_BY_ID = new Map([...STYLES, ...PATTERN_STYLES].map((style) => [style.id, style]))

    function SessionPattern({ sessionId, subscribe, getMark }) {
      const mark = React.useSyncExternalStore(subscribe, () => getMark(sessionId))
      const pattern = PATTERN_BY_ID.get(mark)
      if (pattern === undefined) return null
      return h(pattern.Component)
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

    function patternLabel(patternDef, label) {
      return h('span', {
        style: { display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }
      },
        h('span', {
          style: {
            flex: '1 1 auto',
            width: '100%',
            height: 18,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--dsw-alias-label-secondary)',
            backgroundColor: 'var(--dsw-alias-bg-layer-2)'
          }
        }, h(patternDef.Component)),
        h('span', { key: 'label', style: VISUALLY_HIDDEN }, label)
      )
    }

    return {
      inject: ['contextMenus', 'locale', 'slots'],
      apply(ctx) {
        const t = ctx.locale.bind(NS)
        ctx.effect(() => ctx.locale.register(NS, DICTS), 'session mark: dictionaries')

        let { marks, error: readError } = readMarks()
        if (readError !== null) console.warn('[dsh-session-mark] cannot read marks', readError)

        const markListeners = new Set()
        const subscribe = (listener) => {
          markListeners.add(listener)
          return () => { markListeners.delete(listener) }
        }
        const getMark = (sessionId) => marks[sessionId]
        const notifyMarks = () => {
          for (const listener of markListeners) listener()
        }

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
          else if (MARK_BY_ID.has(styleId)) marks[sessionId] = styleId
          else return
          try {
            writeMarks(marks)
          } catch (error) {
            console.warn('[dsh-session-mark] cannot save marks', error)
            ctx.contextMenus.notify(t('save.failed'), false)
          }
          render()
          notifyMarks()
        }

        ctx.effect(() => {
          const onStorage = (event) => {
            if (event.key !== STORAGE_KEY && event.key !== null) return
            const next = readMarks()
            marks = next.marks
            if (next.error !== null) console.warn('[dsh-session-mark] cannot reload marks', next.error)
            render()
            notifyMarks()
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

        ctx.slots.inject('sidebar.session.row.leading', () => ctx.slots.register(
          { name: 'sidebar.session.row.leading', id: 'session-mark.pattern', order: 50 },
          ({ sessionId }) => h(SessionPattern, { sessionId, subscribe, getMark })
        ))

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
                ...PATTERN_STYLES.map((patternDef) => ({
                  id: patternDef.id,
                  label: patternLabel(patternDef, t(`pattern.${patternDef.id}`)),
                  run: () => setMark(sessionId, patternDef.id)
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
