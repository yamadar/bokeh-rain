# bokeh-rain — アーキテクチャ

光の雨が降る様子を描く Canvas アニメーション SPA。Vite 6 / vanilla JS。
`index.html`（マークアップ）→ `src/main.js`（`./style.css` を import）。

## モジュール構成（`src/`）

| ファイル      | 役割                                                                                           | 主な export                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `config.js`   | 純粋な定数                                                                                     | `TAU` `BULB_HUE` `focalD` `depthMin/Max` `SPRITE_*` `RIPPLE_*` `DROP_COUNT` `RAIN_PALETTE` `SNOW_PALETTE` `INTENSITY_*` `SPEED_*` `SNOW_*` |
| `geometry.js` | **純粋**な遠近・ボケ計算                                                                       | `groundY` `vScale` `hScale` `blurOf` `depthFromUniform` `spriteRadius` `pickSpriteIndex` `pickRippleSpriteIndex`                           |
| `climate.js`  | **純粋**な天候（量・速度の増減 / 雪モード判定）                                                | `oscillate` `isSnowHour` `climateAt` `resolveSnow`                                                                                         |
| `sprites.js`  | スプライトキャッシュ生成（DOM 使用、`main.js` のみが import）。`palette` 引数で雨/雪の色を切替 | `buildSprites` `buildSplashSprite` `buildRippleSprites`                                                                                    |
| `drop.js`     | 雨粒エンティティ（`view.climate` で量・速度・雪モードに追従）                                  | `class Drop`                                                                                                                               |
| `splash.js`   | 着弾エンティティ                                                                               | `class Splash`                                                                                                                             |
| `ripple.js`   | 波紋エンティティ                                                                               | `class Ripple`                                                                                                                             |
| `main.js`     | 薄いエントリ（canvas 取得・resize 配線・天候更新・rAF ループ）                                 | —                                                                                                                                          |

## テスト

- `src/geometry.test.js` — 26 件。純粋関数のみ対象（境界値・単調性・クランプ・逆比例）。
- `src/climate.test.js` — 正弦往復の範囲・単調性、雪モード時間帯判定（日跨ぎ含む）。

## 天候（量・速度の増減 / 雪モード）

- `main.js` が毎フレーム `climateAt(経過ms, new Date())` を呼び `view.climate = { intensity, speed, snow }` を更新する。現状（全量・全速）を Max(=1.0) とし、`intensity` / `speed` は `min..1.0` を正弦的に往復。
- `Drop` は安定した `rank` を持ち、`rank < intensity` のときだけ活性。不活性の粒は着弾後に `parked` となり描画を止める（量がなめらかに増減）。
- 雪モード（時刻が `SNOW_START_HOUR`〜`SNOW_END_HOUR`）では `view` のスプライトを白い `snowKit` に差し替え、落下を `SNOW_FALL_FACTOR` 倍に減速し、横方向にヒラヒラ揺らす。
- 画面右上の `#snow-toggle` ボタンで雪モードを「自動 → 雪 → 雨」と巡回切替できる。`main.js` が選択中の override を `resolveSnow` に渡し、`auto` 時のみ時刻判定に従う。

## 注意点

- 純粋モジュール（`config` / `geometry` / `climate` / エンティティ）は import 時に DOM へ触れない。DOM・canvas・`requestAnimationFrame` は `main.js` と `sprites.js` のみ。
- `geometry.js` / `climate.js` の関数は `W` / `H` / `DPR` や時刻を引数で受け取る（クロージャ非依存のため単体テスト可能）。

## コマンド

`npm install`（初回）/ `npm run dev` / `npm test` / `npm run build` / `npm run format`
