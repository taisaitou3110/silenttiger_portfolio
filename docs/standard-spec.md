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

---
作成日: 2024-xx-xx
バージョン: v1.4.0 (Full Standard Integrated)