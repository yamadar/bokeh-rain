# bokeh-rain — アーキテクチャ

光の雨が降る様子を描く Canvas アニメーション SPA。Vite 6 / vanilla JS。
`index.html`（マークアップ）→ `src/main.js`（`./style.css` を import）。

## モジュール構成（`src/`）

| ファイル | 役割 | 主な export |
| --- | --- | --- |
| `config.js` | 純粋な定数 | `TAU` `BULB_HUE` `focalD` `depthMin/Max` `SPRITE_*` `RIPPLE_*` `DROP_COUNT` |
| `geometry.js` | **純粋**な遠近・ボケ計算 | `groundY` `vScale` `hScale` `blurOf` `depthFromUniform` `spriteRadius` `pickSpriteIndex` `pickRippleSpriteIndex` |
| `sprites.js` | スプライトキャッシュ生成（DOM 使用、`main.js` のみが import） | `buildSprites` `buildSplashSprite` `buildRippleSprites` |
| `drop.js` | 雨粒エンティティ | `class Drop` |
| `splash.js` | 着弾エンティティ | `class Splash` |
| `ripple.js` | 波紋エンティティ | `class Ripple` |
| `main.js` | 薄いエントリ（canvas 取得・resize 配線・rAF ループ） | — |

## テスト

- `src/geometry.test.js` — 26 件。純粋関数のみ対象（境界値・単調性・クランプ・逆比例）。

## 注意点

- 純粋モジュール（`config` / `geometry` / エンティティ）は import 時に DOM へ触れない。DOM・canvas・`requestAnimationFrame` は `main.js` と `sprites.js` のみ。
- `geometry.js` の関数は `W` / `H` / `DPR` を引数で受け取る（クロージャ非依存のため単体テスト可能）。

## コマンド

`npm run dev|test|build -w bokeh-rain`
