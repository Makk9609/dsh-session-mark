# dsh-session-mark

A right-click color mark for sessions in the DeepSeek Harness left session list.
Pick one of eight low-saturation gradient washes; the row keeps its text, layout,
and normal hover/selected feedback.

English | [中文](README.zh.md)

## What it does

- Right-click a session in the left session list, choose **会话标记**
  (Session mark), then click one of eight gradient bars. The last, blank bar
  removes the mark.
- The menu entry itself shows a neutral tag when the session is unmarked and the
  current color chip when it is marked.
- The mark is a single `background-image` on that session row. It adds no text,
  badge, border, shadow, animation, or layout shift.
- The wash stays visible while the row is hovered, selected, busy, or archived;
  the harness's own state feedback still shows underneath.
- Eight presets: 绛红 `#7A3341`, 朱砂 `#8A4A32`, 橄榄 `#6E6233`, 松绿 `#3E5C46`,
  黛青 `#236B66`, 靛蓝 `#33456E`, 紫檀 `#5A3E6E`, 玄灰 `#4A4F57`.
- Light and dark themes are both supported.
- Marks live in `localStorage`; they survive reloads and synchronize between tabs
  of the same origin.

## Install

From GitHub:

```sh
dsh plugin --profile web add github:Makk9609/dsh-session-mark
```

Then restart `dsh web`. Installing from the Plugin Manager also works and applies
the bundle to the running profile.

## Usage

1. Right-click a session row in the left session list.
2. Choose **会话标记** (Session mark).
3. Click a gradient bar. The row updates immediately; the blank bar at the end
   removes the mark.

The item sits after the built-in session actions so the menu's autofocus does not
open the color submenu by itself. Open the submenu with the pointer or keyboard.

## How it works

- The package is a host no-op plus one browser module. There is no build step and
  no runtime dependency; React comes from the harness module table.
- It registers one `session` contribution through `ctx.contextMenus` and keyed
  gradient icons through `contextMenu.icon`.
- The submenu rows are full-width gradient labels rather than text, so the native
  submenu width is filled edge to edge.
- Each mark becomes a rule in one `<style>` element:
  `[data-row-key="session:<id>"] { background-image: ... }`. The host's
  `background-color` still paints hover and selection underneath.
- The state key is `dsh.session-marks.v1`; a `storage` listener keeps other tabs
  in sync. No host state, session event, or model context is touched.
- The row keeps its existing 3px inset and rounded corners; only the background
  image is added.

## Limits

- The plugin marks the left session list only.
- The native submenu has a minimum width of 163px; the gradient bars fill it.
- Marks are per browser origin. Clearing site data removes them.
- The style rules use the row's `data-row-key` attribute. If a future harness
  release changes it, the washes stop applying without affecting the rest of the
  app.
- No animations and no custom color picker; the eight presets are fixed.

## Development

```sh
npm test
```

The test loads `client.js` with stubs for React, the module loader, the document,
`localStorage`, and the client context. It checks the menu shape, the nine
submenu rows, the blank reset, the tag icon, the row rule, persistence, and
cross-tab sync.

## License

MIT
