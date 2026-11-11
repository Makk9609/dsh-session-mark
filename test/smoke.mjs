import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
let loaded
let dictionaries
let menu
const icons = []
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
      assert.equal(name, 'contextMenu.icon')
      for (const _entry of factory()) { /* collected by register */ }
      return () => {}
    },
    register(registration, component) {
      icons.push({ registration, component })
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
  return { createElement: (type, props, ...children) => ({ type, props, children }) }
})
assert.ok(plugin.inject.includes('contextMenus'))
plugin.apply(ctx)

assert.match(style.textContent, /--dsh-session-mark-wine:/)
assert.equal(icons.length, 9)
assert.equal(menu.target, 'session')
assert.equal(menu.order, 500)

const action = menu.resolve({ sessionId: 'session-1' })[0]
assert.equal(action.label, '会话标记')
assert.equal(action.children.length, 9)
assert.equal(action.icon.key, 'session-mark.none')

const wine = action.children.find((child) => child.id === 'wine')
assert.ok(wine)
assert.equal(wine.icon, undefined)
assert.equal(wine.label.children[0].props.style.height, 18)
assert.match(String(wine.label.children[0].props.style.backgroundImage), /0\.92/)
assert.equal(wine.label.children[1].children[0], '绛红渐变')

const none = action.children.find((child) => child.id === 'none')
assert.ok(none)
assert.equal(none.label.children[0].props.style.backgroundImage, 'none')
assert.equal(none.label.children[0].props.style.backgroundColor, 'transparent')
assert.equal(none.label.children[0].props.style.boxShadow, undefined)

const noneIcon = icons.find((entry) => entry.registration.key === 'session-mark.none')
const noneElement = noneIcon.component({})
const noneSvg = noneElement.type(noneElement.props)
assert.equal(noneSvg.type, 'svg')
assert.equal(noneSvg.children.length, 2)

wine.run()
assert.match(style.textContent, /\[data-row-key="session:session-1"\]\{background-image:var\(--dsh-session-mark-wine\)\}/)
assert.equal(JSON.parse(storage.get('dsh.session-marks.v1')).marks['session-1'], 'wine')
assert.equal(menu.resolve({ sessionId: 'session-1' })[0].icon.key, 'session-mark.wine')

none.run()
assert.doesNotMatch(style.textContent, /\[data-row-key="session:session-1"\]/)
assert.equal(JSON.parse(storage.get('dsh.session-marks.v1')).marks['session-1'], undefined)

storage.set('dsh.session-marks.v1', JSON.stringify({ v: 1, marks: { 'session-2': 'teal' } }))
listeners.get('storage')({ key: 'dsh.session-marks.v1' })
assert.match(style.textContent, /\[data-row-key="session:session-2"\]\{background-image:var\(--dsh-session-mark-teal\)\}/)

console.log('smoke ok')
