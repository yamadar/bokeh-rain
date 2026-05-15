# Bokeh Rain

光の雨が降る様子を描画する Canvas アニメーション SPA。

## 起動

```bash
npm install        # リポジトリルートで一度だけ
npm run dev -w bokeh-rain
```

`http://localhost:5181/` が自動で開きます。

## ビルド

```bash
npm run build -w bokeh-rain
```

## 構成

```
bokeh-rain/
├── index.html      # マークアップのみ
├── vite.config.js
├── package.json
└── src/
    ├── main.js     # ロジック（style.css を import）
    └── style.css   # スタイル
```
