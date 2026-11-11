# dsh-session-mark

给 DeepSeek Harness 左侧会话列表加颜色标记的插件。给会话行加一层渐变底纹，
方便区分会话，避免点错。

[English](README.md) | 中文

![会话标记菜单](assets/session-mark-menu.png)

![已标记的会话行](assets/session-mark-row.png)

## 安装

```sh
dsh plugin --profile web add github:Makk9609/dsh-session-mark
```

然后重启 `dsh web`。也可以从 Plugin Manager 安装。

## 使用

右键会话 → **会话标记** → 选一档渐变。最后一项是空白条，点它清除标记。

## 说明

- 八档低饱和渐变，支持亮/暗主题。
- 只改会话行的背景图，不加文字、徽章、边框，也不改变布局。
- 标记存在浏览器本地（`localStorage`），刷新后保留。
- 只作用于左侧会话列表。

## 许可证

MIT
