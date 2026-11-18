# GapStyle for OpenIDEA

## 简介

OpenIDEA 版 GapStyle。纯数据主题插件，安装无需构建。界面不覆盖任何 token，继续用 _Islands Dark_（IDEA 外观）



## 用法

- **安装**：`Settings › Plugins › ⚙ › Install Plugin from Disk…` 选本目录
  （或 `.oiplugin/.zip` 走 _Install Plugin from Package
  File…_）。
- **应用**：`Settings › Appearance & Behavior › Appearance › Theme`，方案选 **GapStyle**；
- **开发**：把目录放进项目的 `.openidea/plugins/gapstyle/`，点 _Reload_ 即可看到改动。



## 打包

```sh
cd openidea
zip -r gapstyle-5.1.0.zip . -x '*.DS_Store' -x '*.zip'
```

包就是目录本身，`.oiplugin` 是它的 zip，`plugin.toml` 必须在压缩包根目录（`.` 决定这点）。
