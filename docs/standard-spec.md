# Development Standard Specifications / 開発標準仕様書

## 1. Core Library Specifications / 主要ライブラリ仕様
- **Jimp**: 
  - Version: ^1.6.0 (Strictly follow v1.x API)
  - Rule (JP): 必ず `import { Jimp } from 'jimp'` を使用し、破壊的変更（qualityメソッドの廃止等）を反映すること。
  - Rule (EN): Always use `import { Jimp } from 'jimp'`. Follow v1.x breaking changes (e.g., image.quality is deprecated).

- **Next.js**:
  - Version: 15.x (App Router)
  - Rule (JP): App Router仕様を前提とし、Server Actionsを活用すること。
  - Rule (EN): Assume App Router specifications and utilize Server Actions.
  - Version: 15.x (App Router / React 19)
  - Rule (JP): **React 19の最新フックを使用すること。**
    - `useFormState` は廃止。必ず `import { useActionState } from 'react'` を使用すること。
    - `useFormStatus` も必要に応じて `react` からインポートすること。
  - Rule (EN): Use the latest React 19 hooks. Replace `useFormState` with `useActionState` imported from 'react'.

## 2. Shared Components / 共通部品
- **Image Processing**:
  - Function: `processImage(base64EncodedImage, mimeType)`
  - Rule (JP): 画像処理には必ずこの共通関数を通すこと。
  - Rule (EN): All image processing must pass through this shared function.
  
  
  ## 4. Responsive & Common Message Box / レスポンシブ・共通メッセージ仕様

### 4.1 Responsive Messaging (画面サイズ対応)
- **Text Adaptation**: モバイル端末（< 640px）では、メッセージの文字サイズを一段階下げ、視認性を確保すること。
  - **Rule (EN)**: On mobile devices (< 640px), reduce font size for messages to ensure readability.
- **Placement**: デスクトップでは右上にトースト表示し、モバイルでは画面下部中央にバナー表示することを推奨する。
  - **Rule (JP)**: デバイスの画面幅に応じて、メッセージの表示位置と幅を自動調整（Tailwind CSSの sm: や md: プレフィックスを活用）すること。

### 4.2 Common Message Box Component (共通メッセージボックス)
- **Unified Interface**: プロジェクト専用の `MessageBox` コンポーネント、または `useMessage` フックを必ず使用すること。直接 `window.alert` や `window.confirm` を使用することは禁止。
  - **Rule (EN)**: Use the project's custom `MessageBox` or `useMessage` hook. `window.alert` or `window.confirm` are strictly prohibited.
- **Mandatory Props**:
  - `status`: 'success' | 'error' | 'warning' | 'info'
  - `title`: 短く簡潔なタイトル (Short, concise title)
  - `description`: ユーザーが次に取るべき行動を含む説明 (Description with call-to-action)
- **Mobile Interaction**: モバイルの場合、ボタンなどのクリック領域は最低 44px x 44px を確保し、誤タップを防ぐこと。

### 4.3 Error Mapping Reference (エラー表示の変換)
- **Rule (JP)**: 技術的なエラーをユーザー向けの言葉に翻訳して表示する。
  - `ERR_INVALID_ARG_TYPE` (Jimp等) → 「画像の形式が正しく読み取れませんでした。別の画像をお試しください。」
  - `MAX_BASE64_IMAGE_SIZE_BYTES` 超過 → 「画像の容量が大きすぎます。自動的に縮小して処理します。」（または「容量を小さくしてください」）

  ### 4.4 Vercel/Next.js Error Handling
- **Digest Errors**: Vercel環境で `digest` エラーが発生した場合、それは未処理の例外を意味する。
- **Rule (JP)**: ユーザーには `digest` IDを見せず、必ず `error.js` または `try-catch` を用いて、日本語の「次にとるべき行動」を含むメッセージを表示すること。
- **Fallback**: 万が一解析に失敗した場合は、ボタン一つで「リトライ（再実行）」ができるUIを提供すること。

## 5. Error Capturing & User Feedback / エラーキャプチャーとフィードバック

### 5.1 Digest Error Handling
- **Constraint**: Vercel上で `digest` が発生するあらゆる例外を `try-catch` または `error.js` で捕捉すること。
- **Rule (JP)**: 全てのエラーを `getFriendlyErrorMessage` 関数を通してからUIに表示し、`digest` IDそのものを直接ユーザーに見せない。

### 5.2 Specific Capture Targets (キャプチャー対象)
1. **Timeout**: VercelのHobbyプラン制限(10s)による停止。
2. **Quota**: APIの無料枠超過。
3. **Payload**: 画像送信サイズ(4.5MB)超過。
4. **Safety**: AIのガードレールによる回答拒否。

## 6. Components Utilization / 既存コンポーネントの強制利用

### 6.1 Component Folder Policy
- **Rule (JP)**: UI実装時、`components/` フォルダ内の既存コンポーネントを優先的に再利用すること。独自の `alert` や `div` による即席メッセージ作成は禁止。
- **Core Components**:
  - `MessageBox.tsx`: 全ての通知・警告・確認ダイアログに使用。
  - `ErrorHandler.tsx`: `try-catch` 内でのエラー表示に必ず使用。

### 6.2 Error Routine Usage (エラールーチン)
- **Implementation (EN)**: When catching an error in a page or component, use `getFriendlyErrorMessage` to translate the error and pass it to `ErrorHandler`.
- **Reference Code**:
  ```tsx
  try {
    // 処理
  } catch (e) {
    setError(e); // ErrorHandlerに渡す
  }
- **Mandatory Props**: `ErrorHandler` を呼び出す際は、必ず `error` と `onClose` をセットで渡すこと。
- **Standard Action**: `onClose` には、当該エラーのステートを `null` に戻す関数（例: `() => setError(null)`）を必ず指定すること。
  - **Rule (JP)**: `onClose` を省略したり、空の関数を渡して「閉じられない」状態にすることを禁止する。

### 6.3 Import Path Policy (インポートパスの記述ルール)
- **Path Alias**: フォルダ階層の深さに関わらず、必ずパス・エイリアス `@/` を使用してインポートすること。
  - **Rule (JP)**: 相対パス（`../../` 等）は使用禁止。プロジェクトのルートディレクトリを起点とする `@/` 表記を強制する。
  - **Rule (EN)**: Do not use relative paths (e.g., `../../`). Always use the path alias `@/` to reference the root directory.

- **Case Sensitivity**: ファイル名の大文字小文字を厳密に区別すること。
  - **Rule (JP)**: ローカル（Windows/Mac）で動いても、本番（Linux/Vercel）でビルドエラーになるのを防ぐため、実際のファイル名と完全に一致させること。

- **Example**:
  - **Bad**: `import MessageBox from '../components/MessageBox';`
  - **Good**: `import MessageBox from '@/components/MessageBox';`
  - **Good**: `import { getFriendlyErrorMessage } from '@/lib/errorUtils';`

- **Function Calls**: 関数を呼び出す際は、定義された引数の型と個数を厳密に守ること。
- **Rule (JP)**: TypeScriptのエラー（赤波線）を無視して `git push` することを禁止する。
- **Rule (EN)**: Strictly follow function signatures. Do not ignore TypeScript errors during development.

  ## 7. Responsive & Message Implementation Rules

### 7.1 Unified Responsive Logic
- **Constraint**: `lib/responsive-config.ts` で定義されたブレイクポイントとスタイルを厳守すること。
- **Rule (JP)**: モバイル(<640px)での操作性を最優先し、ボタンの高さ（min 44px）やフォントサイズの切り替えを自動で行うこと。

### 7.2 Message Component Usage
- **Requirement**: 全ての通知は `components/MessageBox.tsx` を使用すること。
- **Rule (EN)**: Do not create custom dialogs or use browser native alerts. Pass data through the `MessageBox` component using the defined status types.

