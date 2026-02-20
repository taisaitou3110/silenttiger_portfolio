
# Bookshelfアプリ 概要設計書 (Phase 1)

## 1. 概要

本設計書は、「読書を資産に変える」をコンセプトとしたBookshelfアプリのPhase 1開発に関する概要設計を定義する。
Phase 1では、認証不要の「ゲストモード」に焦点を当て、ユーザーが手軽にアプリのコア機能を体験できることを目指す。

**スコープ:**
- スマートフォンカメラを用いた書籍のISBNバーコードスキャン機能。
- スキャンした書籍情報のローカル（ブラウザのLocalStorage）への保存。
- 指定された図書館（呉市・東広島市）における書籍の蔵書状況をカーリルAPIで確認する機能。

## 2. フォルダ構成

`@/app/bookshelf` 以下に、本機能に関する画面・コンポーネント・ロジックを配置する。

```
app/
└── bookshelf/
    ├── components/
    │   ├── BookCard.tsx       # 書籍情報を表示するカード
    │   ├── ScanResult.tsx     # スキャン結果と図書館在庫を表示
    │   └── CameraView.tsx       # カメラ映像を表示するコンポーネント
    ├── scan/
    │   ├── page.tsx           # ISBNスキャン画面
    │   └── actions.ts         # Server Actions (API連携)
    ├── book/
    │   └── [isbn]/
    │       ├── page.tsx       # 書籍詳細・在庫確認画面
    │       └── loading.tsx    # ローディングUI
    └── utils/
        ├── localStorage.ts    # LocalStorageへのアクセサ
        └── type.ts            # アプリケーション固有の型定義
```

## 3. 画面仕様・画面遷移

### 3.1. ISBNスキャン画面

- **URL:** `/bookshelf/scan`
- **概要:**
  - アプリの初期画面。カメラを起動し、ユーザーに書籍のバーコードをスキャンさせる。
  - スキャンが成功すると、書籍情報を取得し、書籍詳細画面へ遷移する。
- **レイアウト:**
  - **共通ヘッダー:** `@/components/AppIcons.tsx` のコンポーネントを配置。
  - **メインコンテンツ:**
    - `CameraView.tsx`: カメラ映像を画面全体に表示。
    - スキャンを促すメッセージを `FFMessageBox` で表示。
- **コンポーネント:**
  - `CameraView.tsx`: `react-qr-scanner` 等のライブラリを利用したカメラコンポーネント。
  - `FFMessageBox.tsx`: 「本のバーコードをかざしてください」等の案内メッセージを表示。
  - `ErrorHandler.tsx`: カメラのパーミッションエラーや、スキャン時のエラーを`MessageMst.ts`の定義に従って表示。
- **画面遷移:**
  - バーコードのスキャンに成功すると、取得したISBNコードをパスパラメータとして、書籍詳細画面 `/bookshelf/book/[isbn]` へ遷移する。

### 3.2. 書籍詳細・在庫確認画面

- **URL:** `/bookshelf/book/[isbn]`
- **概要:**
  - スキャン画面から渡されたISBNコードを元に、Google Books APIとカーリルAPIへ問い合わせを行う。
  - 書籍の基本情報（タイトル、著者、画像）と、指定図書館での蔵書状況を表示する。
  - 情報をLocalStorageに保存する。
- **レイアウト:**
  - **共通ヘッダー**
  - **メインコンテンツ:**
    - 上段: `BookCard.tsx` を用いて書籍の書影、タイトル、著者を表示。
    - 下段: `ScanResult.tsx` を用いて、各図書館の蔵書状況（貸出可、蔵書なし等）をリスト表示。
  - **フッター:**
    - `ActionButton.tsx`: 「別の本をスキャンする」ボタンを配置。押下で `/bookshelf/scan` へ遷移。
- **コンポーネント:**
  - `BookCard.tsx`: 書籍情報をpropsとして受け取り表示する。
  - `ScanResult.tsx`: 図書館の在庫情報をpropsとして受け取り表示する。
  - `ActionButton.tsx`: ローディング状態を管理し、非同期処理（API連携）の実行中や完了を示す。`useTransition`と併用する。
  - `MessageBox.tsx`: APIエラー発生時に、`@/components/MessageMst.ts`のメッセージを表示。

## 4. データ構造 (LocalStorage)

ゲストモードでスキャンした書籍情報は、以下の構造でブラウザのLocalStorageに保存する。キーは `bookshelf_guest_data` とする。

```json
[
  {
    "isbn": "9784041234567",
    "title": "すごい本",
    "author": "山田太郎",
    "imageUrl": "https://example.com/image.jpg",
    "addedAt": "2026-02-20T10:00:00.000Z",
    "rereadScore": 3 // Phase1では固定値または手動設定（今回はAPIから取得したものをそのまま保存）
  }
]
```

`@/app/bookshelf/utils/localStorage.ts` に、このデータ構造を操作するための`getBooks()`, `addBook()`といった関数を定義する。

## 5. 利用するAPI

### 5.1. Google Books API

- **目的:** ISBNコードから書籍の基本情報を取得する。
- **エンドポイント:** `https://www.googleapis.com/books/v1/volumes`
- **リクエスト (Server Action内から実行):**
  - `q`: `isbn:<ISBNコード>`
  - `key`: APIキー（環境変数から取得）
- **主要なレスポンスフィールド:**
  - `items[0].volumeInfo.title`: 書籍タイトル
  - `items[0].volumeInfo.authors`: 著者（配列）
  - `items[0].volumeInfo.imageLinks.thumbnail`: 書影URL

### 5.2. カーリルAPI

- **目的:** 書籍の図書館における蔵書状況を確認する。
- **エンドポイント:** `https://api.calil.jp/check`
- **リクエスト (Server Action内から実行):**
  - `appkey`: APIキー（環境変数から取得）
  - `isbn`: ISBNコード
  - `systemid`: `Hiroshima_Kure`, `Hiroshima_Higashihiroshima`（複数指定）
  - `format`: `json`
  - `callback`: `no`
- **主要なレスポンスフィールド:**
  - `books.<ISBN>.<SYSTEMID>.status`: 在庫ステータス（例: "Cache"）
  - `books.<ISBN>.<SYSTEMID>.libkey`: 各館の在庫状況（例: `{"県立図書館":"貸出可"}`）

## 6. 共通部品の利用

`@/docs/standard-spec.md` に基づき、以下の共通部品を積極的に利用する。

- **`@/components/ActionButton.tsx`**: 非同期処理を伴うすべてのボタン操作で使用。
- **`@/components/MessageBox.tsx`**: APIエラーや成功メッセージの表示で使用。
- **`@/components/ErrorHandler.tsx`**: カメラパーミッションなど、予期せぬエラーのハンドリングで使用。
- **`@/components/FFMessageBox.tsx`**: ユーザーへの操作案内（例：「バーコードをかざしてください」）で使用。
- **`@/components/MessageMst.ts`**: 画面に表示するすべてのメッセージをこのマスタファイルで管理する。
- **パスエイリアス `@/`**: すべてのインポートパスで利用し、相対パス (`../`) は使用しない。
- **エラーハンドリング**: すべてのエラーは `getFriendlyErrorMessage` 関数を通してユーザーフレンドリーなメッセージに変換してから表示する。
