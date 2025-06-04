# FRONTEND 專案

這是一個使用 **[Quasar Framework](https://quasar.dev)** + **Vue 3** + **TypeScript** 建構的前端專案，支援元件化開發、模組化路由、SCSS 樣式與多語系處理。

## 📁 專案結構說明

```bash
    ├── .vscode/ # VSCode 編輯器設定（如 Peacock 色彩）
    ├── public/ # 靜態資源目錄（不經 Webpack 處理）
    ├── src/ # 專案核心程式碼
    │ ├── assets/ # 圖片、字體等靜態資源
    │ ├── boot/ # Quasar boot 檔，用來初始化插件等
    │ ├── components/ # 共用元件（如 GridLottery.vue, LoginDialog.vue）
    │ ├── composables/ # 可重用的 Composition API 函數
    │ ├── css/ # SCSS 樣式（全域與變數）
    │ ├── i18n/ # 多語系設定與翻譯檔
    │ ├── layouts/ # 頁面框架（如 MainLayout.vue）
    │ ├── pages/ # 各個路由頁面元件
    │ ├── router/ # Vue Router 設定
    │ ├── stores/ # Pinia 狀態管理模組
    │ ├── App.vue # 應用程式進入點元件
    │ ├── env.d.ts # TypeScript 類型宣告補充
    │ └── models.ts # 資料模型定義（如介面、型別）
    ├── quasar.config.ts # Quasar 專案設定檔
    ├── tsconfig.json # TypeScript 設定檔
    ├── package.json # NPM 套件管理設定
    ├── README.md # 本說明文件
```

### 安裝相依套件

```bash
npm install
```

### 開發模式

```bash
quasar dev
```

### 編譯為正式版本

```bash
quasar build
```

### 🌐 技術棧

Vue 3

Quasar Framework

TypeScript

Pinia — 狀態管理

Vue I18n — 多語系支援

SCSS — 樣式擴充語言

### 如需進一步調整 Quasar 設定，請參考：

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
