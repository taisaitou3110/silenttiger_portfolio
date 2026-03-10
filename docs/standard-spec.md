# Development Standard Specifications / 開発標準仕様書

## 1. Core Library Specifications / 主要ライブラリ仕様

* **Jimp**:
  * Version: ^1.6.0 (Strictly follow v1.x API)
  * Rule (JP): 必ず `import { Jimp } from 'jimp'` を使用し、破壊的変更（qualityメソッドの廃止等）を反映すること。
  * Rule (EN): Always use `import { Jimp } from 'jimp'`. Follow v1.x breaking changes (e.g., image.quality is deprecated).

* **Next.js**:
  * Version: 15.x (App Router / React 19)
  * Rule (JP): **React 19の最新フックを使用すること。**
    * `useFormState` は廃止。必ず `import { useActionState } from 'react'` を使用すること。
    * `useFormStatus` も必要に応じて `react` からインポートすること。
  * Rule (EN): Use the latest React 19 hooks. Replace `useFormState` with `useActionState` imported from 'react'.

## 2. Shared Components / 共通部品

* **Image Processing**:
  * Function: `processImage(base64EncodedImage, mimeType)`
  * Rule (JP): 画像処理には必ずこの共通関数を通すこと。
  * Rule (EN): All image processing must pass through this shared function.

## 3. Layout & Navigation / レイアウト・ナビゲーション標準

### 3.1 Basic Structure (基本構造)
* **Desktop (PC/Tablet)**:
  * **Sidebar (Left)**: メニューリスト。幅 240px〜280px。アプリ間移動用。
  * **Main Content (Right)**: 機能画面。背景は `slate-50` 等の淡い色を推奨。
* **Mobile (< 640px)**:
  * **Single Column**: サイドバーは非表示にし、ハンバーガーメニューまたはボトムドロワー（`AIAssistantDrawer` 連携）に集約する。

### 3.2 Responsive Sizing (サイズ制御)
* **Button Size**:
  * **Mobile (Portrait)**: 高さ最低 44px、幅は `w-full` を基本とする。
  * **Mobile (Landscape) / Tablet**: 高さをやや抑え（`py-3`）、要素を横に並べる。
  * **PC**: マウス操作用に最適化したコンパクトなサイズ（`py-2 px-6`）。
* **Safe Area**: モバイル端末のノッチやホームバーを考慮し、最下部要素には `pb-safe` または十分な余白を設定すること。

## 4. Responsive & Common Message Box / レスポンシブ・共通メッセージ仕様

### 4.1 FFMessageBox (RPG Style Message)
* **Placement**: 画面下部に固定配置。
* **Rule (JP)**: ゲーム的な演出や重要な通知、AIの聞き返しには必ず `FFMessageBox` を使用すること。
* **Visual**: 青色のグラデーション背景、白の二重枠線を維持。タイピングアニメーションを付与すること。

### 4.2 Common Message Box Component
* **Unified Interface**: `MessageBox` または `useMessage` を使用し、`window.alert` 等のネイティブ機能は使用禁止。
* **Status Types**: 'success' | 'error' | 'warning' | 'info'
### 4.3 Message Master (Mandatory):
* Path: @/components/MessageMst.ts
* Rule (JP): エラーメッセージは、直接ソースコードに書き込まず、必ず MESSAGE_MASTER から取得すること。
* Rule (EN): Error Messages displayed to the user must be retrieved from MESSAGE_MASTER, not written directly into the source code.

## 5. Error Capturing & User Feedback / エラーキャプチャーとフィードバック

### 1. 基本思想：エラーの「翻訳」
システムが発生させる「生のエラー（インフラエラー、APIエラー、バリデーションエラー）」をそのまま表示せず、ユーザーが次に取るべき行動（解決策）を提示する「ユーザーフレンドリーなナレッジ」へと翻訳する。

### 2. 技術的制約（旧5.1節 継承）
* **Vercel Digestの隠蔽**: Vercel環境で内部エラーが発生した際に発行される `digest` IDや、暗号化されたエラーメッセージを直接ユーザーに見せてはならない。
* **AppErrorへの集約**: 全てのエラーは `lib/error.ts` で定義された `AppError` クラスを経由し、一意の `ErrorCode`（合言葉）に変換してフロントエンドへ伝える。

### 3. 三層の管理構造
情報は以下の3ファイルに分離し、各コンポーネント内へのメッセージ直書き（ハードコード）を厳禁とする。

| ファイル | 役割 | 記述内容の例 |
| :--- | :--- | :--- |
| `constants/config.ts` | **定数管理** | `MAX_FILE_SIZE_BYTES`, `BYTES_PER_MB` 等の数値設定 |
| `constants/errorMessages.ts` | **メッセージ辞書** | `title`, `description` (具体的な解決策), `actionText` |
| `lib/error.ts` | **ロジック管理** | `AppError` クラスの定義およびエラー変換・判定ロジック |

### 4. 具体的なエラーキャプチャー対象と対応（旧5.2節 統合）
VercelおよびAI APIの制限・特性に合わせ、以下のErrorCodeを適切に投げ分ける。

| 対象 | 発生原因 | 対応ErrorCode | description（フィードバック指針） |
| :--- | :--- | :--- | :--- |
| **1. Timeout** | Vercelの実行時間制限 | `INFRA_TIMEOUT` | 通信環境の確認と再試行を具体的に促す。 |
| **2. Quota** | API無料枠の超過 | `AI_RATE_LIMIT` | 「1分程度の待機が必要」な旨を明記する。 |
| **3. Payload** | 送信サイズ超過 | `VALIDATION_IMAGE_SIZE` | 「3MB以下」という具体的な制限値を提示する。 |
| **4. Safety** | AIによる回答拒否 | `AI_SAFETY_REJECT` | 食べ物の写真であることを確認するよう誘導する。 |
| **5. Response** | AIの出力形式不正 | `AI_RESPONSE_INVALID` | 解析失敗を伝え、撮り直しや別角度での撮影を提案する。 |



### 5. 実装ガイドライン

#### 5.1 サーバー側（Actions / API Routes）：例外スローの作法
エラー時は必ず `AppError` を throw する。`catch` ブロック内では情報の損失を防ぐため、既に `AppError` である場合はそのまま再スローし、未知のエラーのみ汎用コードへ変換する。

```typescript
try {
  // ロジック
} catch (error: any) {
  if (error.code) throw error; // 既存のAppError（バリデーション等）はそのまま通す
  console.error("Internal Error:", error);
  throw new AppError("DATA_SAVE_FAILED", 500); // 未定義のエラーを翻訳
}

## 6. Components Utilization / 既存コンポーネンの強制利用

### 6.1 Component Folder Policy
* **Rule (JP)**: UI実装時、`components/` フォルダ内の既存コンポーネントを優先的に再利用すること。独自の `alert` や `div` による即席メッセージ作成は禁止。
* **Core Components**: `MessageBox.tsx`, `ErrorHandler.tsx`, `ActionButton.tsx`.

### 6.2 Import Path Policy
* **Path Alias**: 必ず `@/` を使用してインポートすること。相対パス（`../../` 等）は使用禁止。

## 7. Currency & Reward System (Gold System) / 通貨・報酬システム仕様

### 7.1 Currency Definition
* **Symbol**: 🪙
* **Storage**: `gold` フィールド（全アプリ共通指標）。
* **Rule (JP)**: 数値表示には必ず `Intl.NumberFormat('ja-JP')` を使用し、カンマ区切りにすること。

### 7.2 GoldStatus Component
* **Requirement**: ゴールド表示には必ず `@/components/GoldStatus.tsx` を使用すること。

## 8. Standard ActionButton / 標準ボタン仕様

### 8.1 Unified Implementation
* **Rule (JP)**: 非同期処理を伴う操作には、`useTransition` と併用した `@/components/ActionButton` を使用すること。
* **Loading States**: ボタンが `disabled` の間、ユーザーに「解析中...」などの明確な視覚的フィードバックを与えること。

# 第9章・第10章：画面標準仕様（2026-02-22 改訂）

## 第9章：画面種別と構成の定義

アプリケーションを構成する各画面を以下の通り分類し、一貫したUI/UXを提供する。

### 9.1 GlobalPortal 画面（ポータル）
システム全体の入り口。カード型ナビゲーションを採用し、視覚的なわかりやすさを提供する。
* **対象**: `@/app/page.tsx`
* **構成**: `GUIDE_CONTENTS` に基づくカード型 UI。各カードには「コンセプトイラスト」「タイトル」「キャッチコピー（tagline）」を表示。
* **背景**: システム共通の壁紙（`toppage_wheel_labo.png`）を `opacity-10` で配置し、コンテンツの可読性を最優先する。
* **ナビゲーション**: ルート画面のため戻るボタンは不要。

### 9.2 AppPortal 画面（各アプリの拠点）
各アプリ機能（カロリー、Shogi等）の拠点。
* **対象**: `@/app/(各アプリ)/page.tsx`
* **標準構成**: 当該アプリのステータスサマリーを最上部に配置。
* **ナビゲーション**: 画面左上に **「ポータルへ戻る」**（GlobalPortal へのリンク）を配置。
* **ヘルプ機能**: 戻るボタンのすぐ右隣に「？」アイコン（ヘルプボタン）を配置し、第10章の WelcomeGuide をいつでも呼び出せるようにすること。

### 9.3 List 画面
履歴、保存データ、検索結果などを羅列する画面。
* **ナビゲーション**: 画面左上に **「アプリポータルへ戻る」**（AppPortal へのリンク）を配置。
* **行操作仕様**:
    * **Grip (Left)**: 並び替え用アイコン `GripVertical` (Lucide) を配置。
    * **Content**: 中央に主要データを配置。
    * **Delete (Right)**: 赤色の `Trash2` アイコン (Lucide) を配置。
    * **Interaction**: 削除時は即時実行せず、必ず `FFMessageBox` 等で確認を挟むこと。

### 9.4 Action 画面
AI解析、テキスト入力、撮影など、能動的な操作を伴う画面。
* **AI Integration**: 音声・画像・テキスト入力には `AIAssistantDrawer` を使用。
* **ナビゲーション**: 画面左上に **「アプリポータルへ戻る」**（AppPortal へのリンク）を配置。

### 9.5 Play 画面
ロケットゲームや将棋など、インタラクティブな操作が主の画面。
* **Immersive Design**: ナビゲーションを最小化。メッセージは常に下部中央に配置。
* **ナビゲーション**: 画面左上に **「アプリポータルへ戻る」**（AppPortal へのリンク）を配置。
* **ステータス表示**: 画面**右上**に現在保持している「ゴールド（通貨）」を常時表示すること。

### 9.6 Result 画面
AIの推定結果詳細や、ゲームのスコアなどを表示する専用画面。
* **ナビゲーション**: 画面左上に **「アプリポータルへ戻る」**（AppPortal へのリンク）を配置。

## 第10章：画面共通デザイン・インタラクション
ユーザーが現在地を見失わず、一貫した操作感を得るために以下の配置ルールを厳守する。

### 10.1 戻るボタンの配置
画面の左上に、上位階層または遷移元へ戻るためのボタンを配置する。
* **AppPortal画面**: 画面左上に **「ポータルへ戻る」**（GlobalPortalへのリンク）を配置。
* **List / Action / Result / Play画面**: 画面左上に **「アプリポータルへ戻る」**（当該AppPortalへのリンク）を配置。
* **命名規則**: ユーザーの混乱を防ぐため、「ポータル」または「アプリポータル」という呼称を正確に使い分けること。

### 10.2 チュートリアル表示と既読管理
ユーザーの初訪時の離脱を防ぎ、スムーズな体験を提供するためのガイド表示および管理を行う。
* **WelcomeGuideコンポーネント**: 
    * **形状**: 画面中央に表示される正方形のウィンドウ（aspect-square）。
    * **視覚効果**: 背景は backdrop-blur-sm で透過させ、フォーカスを高める。
    * **ビジュアル**: ガイドの最上部に、当該アプリのコンセプトを表すイラスト（image）を表示すること。画像下部には背景色へのグラデーションを重ね、テキストエリアへ滑らかに繋げるデザインとする。
    * **構成**: 「概要」「使いかた」「技術構成」の3セクションと、固定の完了ボタン。
* **既読管理ロジック (`useSessionFirstTime`)**:
    * `sessionStorage` を利用し、ブラウザのタブを閉じるまで既読状態を維持する。

### 10.3 ヘルプ（再表示）ボタンの配置
一度閉じたガイドをユーザーがいつでも呼び出せるよう、以下のルールでボタンを配置する。
* **配置場所**: 画面左上、「戻るボタン」の**すぐ右隣**に配置。
* **デザイン**: `HelpCircle` アイコン等を使用し、直感的にヘルプとわかるようにする。
* **実装**: `showAgain` 関数をトリガーし、`WelcomeGuide` を強制的に再表示させる。

### 10.4 Play画面特有のステータス表示
* **通貨表示**: Play画面に限り、画面**右上**に現在保持している「ゴールド（通貨）」を常時表示すること。

### 10.5 フィードバック表示
* **エラー対応**: `ErrorHandler` および `MessageBox` を使用し、解決策を提示する。
* **削除確認**: 削除時は即時実行せず、必ず `FFMessageBox` 等で確認を挟むこと。

### 10.6 視覚的演出と可読性標準（新規追加）
* **背景画像の透明度**: アプリポータルおよびプレイ画面の背景画像（Imageコンポーネント）は、UIの文字を読みやすくするため一律 **`opacity-10` (0.1)** を基準とすること。
* **カード演出**: ポータルのカード等は、ホバー時に `scale-105` や `shadow-xl` などのアニメーションを付与し、インタラクティブな感触をユーザーに与える。
* **オーバーレイ**: 背景画像の上には必要に応じて暗色のオーバーレイを重ね、UI要素が背景と混ざらないようにすること。


### 11. React Hooks & State Management / Reactフック・状態管理標準
## 11.1 Rules of Hooks (フックの絶対原則)
Rule (JP): 「フックの呼び出し順序」を固定するため、以下の構造を厳守すること。
Top Level Hooks: useState, useEffect, useMemo 等をコンポーネントの冒頭に記述する。
Early Returns: loading や error による条件分岐リターンは、必ず全てのフック呼び出しよりも後に記述すること。
Main Render: 正常系の JSX を最後に記述する。
Rule (EN): Strictly follow the Rules of Hooks to ensure consistent calling order.
Place all hooks at the top of the component.
Execute conditional early returns (e.g., loading, error) only after all hook declarations.

## 11.2 State Management Policy (状態管理方針)
Rule (JP): コンポーネント内の useState は最小限に留める。
Calculated Values: 他の State から計算可能な値（例：氏名から生成するフルネーム）は State に入れず、レンダリング時に計算すること。
Prop Mirroring: 親から受け取った Props をそのまま useState の初期値に設定しない（同期ズレ防止）。
Rule (EN): Minimize useState usage. Avoid storing values that can be derived from existing state or props.

ルール: ページ遷移（router.push）や重要な状態更新を伴うイベントハンドラーでは、必ず isPending または isNavigating フラグを用いて、重複実行をガードすること。

## 11.3 Guest Mode & Persistence Strategy (ゲストモードと保存の切り分け)
Concept: 「まず試す（Guest）」から「保存する（User）」への段階的移行を支援する。

Guest Mode:
ログイン前はブラウザの localStorage または Session に一時保存する。
個人情報（Gmail, 図書館ID等）を要求しない。
Login Mode:
ユーザー登録（名前・アイコン選択）後、localStorage のデータを Prisma を通じて DB へ一括移行する。
図書館パスワード等の機密情報は、必ず可逆的な暗号化（AES-256等）を施し、環境変数に秘匿された鍵を用いて管理すること。

### 12. Logic Separation (ロジックの分離)
## 12.1 Client vs Server Component
Rule (JP): 可能な限りサーバーコンポーネントを基本とし、"use client" を付与するファイルは「ボタン操作」や「State」が必要な最小単位に限定すること。
Rule (EN): Use Server Components as the default. Limit "use client" to the smallest possible unit that requires interactivity or state.

## 12.2 Action Separation
Rule (JP): API通信（Google Books API等）、スクレイピング、複雑なデータ加工ロジックはコンポーネント内に直接書かず、必ず actions.ts または utils/ フォルダへ分離すること。
Rule (EN): Separate business logic (API calls, data processing) from UI components into actions.ts or utils/.

# 第13章：AI実装標準 (AI Implementation Standards)

AI（Gemini API等）を組み込む際は、システムの透明性と臨場感を維持するため、以下の実装ルールを厳守すること。

### 13.1 モデルの選択と管理
* **環境変数の利用**: 使用するモデル名はハードコードせず、必ず環境変数（例：`GEMINI_MODEL`）から取得すること。
* **推奨モデル**: 診断リスト（`listModels`）に基づき、その時点で思考プロセス（Thinking）や詳細な使用量メタデータが取得可能な最新モデルを優先的に採用すること。

### 13.2 生成AI（対話・解析）におけるストリーミングの原則
* **UXの最大化**: チャットや長文解析などの対話型UXにおいては、全文待機による離脱を防ぐため、ストリーミング（`generateContentStream` 等）の実装を原則とする。
* **適用除外**: Embedding（ベクトル化）、一括バッチ処理、および内部的なデータ加工など、ユーザーへのリアルタイム表示を目的としない処理はこの限りではない。

### 13.3 AI Process Monitoring (UI/UX)
* **共通部品の利用**: AIのレスポンス待機中および生成中は、共通部品 **`AIProcessOverlay`** を必ず使用すること。
* **表示項目**:
    * **Model Badge**: 現在使用しているモデル名（フォールバック時は現在のモデル）を明示すること。
    * **Metrics**: Latency（待機時間）、Cognition Time（思考時間）、TPS（生成速度）、Tokens（消費量）をリアルタイムに表示すること。
* **演出**: 処理完了後は、結果を確認できるよう数秒間の待機（オートハイド）時間を設けること。

### 13.4 耐障害性とハンドリングの標準化
AI連携における耐障害性とスケーラビリティを確保するため、[AI処理・エラーハンドリング標準仕様](./standard-ai-handling.md) に厳格に従うこと。
* **リトライとフォールバック**: API制限（429）発生時の指数バックオフ、および代替モデルへの自動切り替えを必須とする。
* **戦略の選択**: データのサイズに応じた3つの階層（Standard/Intensive/Distributed）から最適な戦略を選択し、過剰または過少な実装を避けること。

---
# 第14章：バージョン管理 (Version Management)

開発における変更管理とリリースの透明性を維持するため、以下のバージョン更新ルールを厳守すること。

### 14.1 バージョン情報の管理場所
* **管理ファイル**: `app/version.json`
* **対象範囲**: 各アプリケーション（`dashboard`, `wordbook`, `calorie` 等）およびシステム全体のバージョン。

### 14.2 バージョンアップのルール
* **更新タイミング**: コードを更新・機能追加・バグ修正を行うたびに、必ずバージョンを更新すること。
* **カウントアップ規則**: 原則として、`version.json` 内の該当するアプリの **第3引数（パッチバージョン）を 1 カウントアップ** すること。
  * 例: `1.2.0` -> `1.2.1`
* **上位桁の更新**: 大規模な機能追加（マイナーアップデート）や、破壊的な変更（メジャーアップデート）を伴う場合は、第2引数または第1引数を繰り上げ、下位桁をリセットすること。

---
作成日: 2024-xx-xx
バージョン: v1.6.0 (Version Management Integrated)