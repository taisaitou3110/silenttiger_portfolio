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

### 5.1 Digest Error Handling
* **Constraint**: Vercel上で発生する `digest` エラーを直接ユーザーに見せない。
* **Rule (JP)**: 全てのエラーを `getFriendlyErrorMessage` 関数を通してからUIに表示し、「次にとるべき行動」を提示すること。

### 5.2 Specific Capture Targets
1. **Timeout**: Vercelの制限による停止。
2. **Quota**: APIの無料枠超過。
3. **Payload**: 画像送信サイズ(4.5MB)超過。
4. **Safety**: AIによる回答拒否。

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

## 9. Screen Type Specifics / 画面タイプ別標準

### 9.1 Dashboard / Home
* **Standard Elements**: サマリーカードを最上部に配置。主要アクションボタンを中央に配置。画面左上に上位のメニューに戻るボタンを配置。

### 9.2 Feature / Input Screen
* **AI Integration**: 音声・画像・テキスト入力には `AIAssistantDrawer` を使用。

### 9.3 Game Interface
* **Immersive Design**: ナビゲーションを最小化。メッセージは常に下部中央に配置。

## 10. List & Row Interactions / 一覧画面・行操作仕様

### 10.1 Row Layout
* **Grip (Left)**: 並び替え用アイコン `GripVertical` (Lucide)。
* **Content**: 中央に主要データ。
* **Delete (Right)**: 赤色の `Trash2` アイコン (Lucide)。

### 10.2 Interaction
* **Confirmation**: 削除時は即時実行せず、必ず `FFMessageBox` 等で確認を挟むこと。

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


---
作成日: 2024-xx-xx
バージョン: v1.4.0 (Full Standard Integrated)