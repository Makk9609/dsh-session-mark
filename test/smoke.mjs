import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
let loaded
let dictionaries
let menu
const icons = []
const rows = []
const style = { dataset: {}, textContent: '' }
const listeners = new Map()
const storage = new Map()

const document = {
  head: { appendChild() {} },
  createElement(tag) {
    assert.equal(tag, 'style')
    return style
  }
}
const localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null },
  setItem(key, value) { storage.set(key, value) }
}
const window = {
  __ModuleLoader__: { load(entry) { loaded = entry } },
  addEventListener(type, fn) { listeners.set(type, fn) },
  removeEventListener(type, fn) { listeners.delete(type) }
}
const ctx = {
  effect(fn) {
    const dispose = fn()
    return () => { if (typeof dispose === 'function') dispose() }
  },
  locale: {
    register(ns, dicts) { dictionaries = dicts; return () => {} },
    bind() { return (key) => dictionaries?.zh?.[key] ?? key }
  },
  slots: {
    inject(name, factory) {
      if (name === 'contextMenu.icon') {
        for (const _entry of factory()) { /* collected by register */ }
      } else if (name === 'sidebar.session.row.leading') {
        factory()
      } else {
        throw new Error(`unexpected slot ${name}`)
      }
      return () => {}
    },
    register(registration, component) {
      if (registration.name === 'contextMenu.icon') icons.push({ registration, component })
      else if (registration.name === 'sidebar.session.row.leading') rows.push({ registration, component })
      else throw new Error(`unexpected registration ${registration.name}`)
      return () => {}
    }
  },
  contextMenus: {
    register(contribution) { menu = contribution; return () => {} },
    notify() {}
  }
}

vm.runInNewContext(source, { window, document, localStorage, console })

assert.equal(loaded.id, 'dsh-session-mark')
const plugin = loaded.factory((name) => {
  assert.equal(name, 'react')
  return {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useSyncExternalStore(subscribe, getSnapshot) { return getSnapshot() }
  }
})
assert.ok(plugin.inject.includes('contextMenus'))
plugin.apply(ctx)

assert.match(style.textContent, /--dsh-session-mark-wine:/)
assert.match(style.textContent, /linear-gradient\(90deg/)
assert.match(style.textContent, /rgba\(122, 51, 65, 0\.34\) 50%/)
assert.equal(icons.length, 1)
assert.equal(rows.length, 1)
assert.equal(rows[0].registration.id, 'session-mark.pattern')
assert.equal(menu.target, 'session')
assert.equal(menu.order, 500)

const action = menu.resolve({ sessionId: 'session-1' })[0]
assert.equal(action.label, '会话标记')
assert.equal(action.children.length, 12)
assert.equal(action.icon.key, 'session-mark.none')

const wine = action.children.find((child) => child.id === 'wine')
assert.ok(wine)
assert.equal(wine.icon, undefined)
assert.equal(wine.label.children[0].props.style.height, 18)
assert.match(String(wine.label.children[0].props.style.backgroundImage), /0\.92/)
assert.match(String(wine.label.children[0].props.style.backgroundImage), /0\.92\) 50%/)
assert.match(String(wine.label.children[0].props.style.backgroundImage), /linear-gradient\(90deg/)
assert.equal(wine.label.children[1].children[0], '绛红渐变')

const none = action.children.find((child) => child.id === 'none')
assert.ok(none)
assert.equal(none.label.children[0].props.style.backgroundImage, 'none')
assert.equal(none.label.children[0].props.style.backgroundColor, 'transparent')
assert.equal(none.label.children[0].props.style.boxShadow, undefined)

const star = action.children.find((child) => child.id === 'star')
assert.ok(star)
assert.equal(star.icon, undefined)
assert.equal(star.label.children[1].children[0], '星星')

const renderPattern = (sessionId) => {
  const element = rows[0].component({ sessionId })
  return element.type(element.props)
}
assert.equal(renderPattern('session-1'), null)

const noneIcon = icons.find((entry) => entry.registration.key === 'session-mark.none')
const noneElement = noneIcon.component({})
const noneSvg = noneElement.type(noneElement.props)
assert.equal(noneSvg.type, 'svg')
assert.equal(noneSvg.children.length, 2)

wine.run()
assert.match(style.textContent, /\[data-row-key="session:session-1"\]\{background-image:var\(--dsh-session-mark-wine\)\}/)
assert.equal(JSON.parse(storage.get('dsh.session-marks.v1')).marks['session-1'], 'wine')
assert.equal(menu.resolve({ sessionId: 'session-1' })[0].icon.key, 'session-mark.none')
assert.equal(renderPattern('session-1'), null)

star.run()
assert.doesNotMatch(style.textContent, /\[data-row-key="session:session-1"\]/)
const pattern = renderPattern('session-1')
assert.ok(pattern)
const patternSvg = pattern.type(pattern.props)
assert.equal(patternSvg.type, 'svg')

none.run()
assert.doesNotMatch(style.textContent, /\[data-row-key="session:session-1"\]/)
assert.equal(JSON.parse(storage.get('dsh.session-marks.v1')).marks['session-1'], undefined)
assert.equal(renderPattern('session-1'), null)

storage.set('dsh.session-marks.v1', JSON.stringify({ v: 1, marks: { 'session-2': 'teal' } }))
listeners.get('storage')({ key: 'dsh.session-marks.v1' })
assert.match(style.textContent, /\[data-row-key="session:session-2"\]\{background-image:var\(--dsh-session-mark-teal\)\}/)

console.log('smoke ok')
