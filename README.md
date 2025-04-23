# Solana 區塊鏈應用開發專案

[查看 Demo](https://solana-starter-kit.vercel.app/)

這是一個基於 Solana 區塊鏈技術的現代化 Web 應用程式，使用 Vue 3 和 TypeScript 開發。該專案展示了如何構建一個與 Solana 區塊鏈互動的完整應用程式。

## 🚀 技術棧

### 前端技術

- Vue 3 + TypeScript
- Vite 構建工具
- Pinia 狀態管理
- Vue Router 路由管理
- SASS 樣式處理

### 區塊鏈技術

- @solana/web3.js
- @solana/wallet-adapter-base
- @solana/wallet-adapter-wallets
- @solana-mobile/wallet-adapter-mobile

## 📁 專案結構

```
src/
├── assets/        # 靜態資源
├── components/    # 可重用組件
├── idl/          # Solana 程序接口定義
├── router/       # 路由配置
├── stores/       # Pinia 狀態管理
├── types/        # TypeScript 類型定義
└── views/        # 頁面組件
```

## 🛠️ 開發環境設置

### 推薦的 IDE 設置

- [VSCode](https://code.visualstudio.com/)
- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)（並禁用 Vetur）

### 專案設置

```bash
# 安裝依賴
npm install

# 開發環境運行
npm run dev

# 生產環境構建
npm run build

# 代碼檢查
npm run lint

# 代碼格式化
npm run format
```

## ⚙️ 環境要求

- Node.js
- npm 或 yarn
- Solana CLI（可選，用於本地開發）

## 🔧 開發工具

- ESLint 代碼檢查
- Prettier 代碼格式化
- TypeScript 類型檢查
- Vue DevTools 支持

## 📝 開發規範

- 使用 TypeScript 進行類型檢查
- 遵循 Vue 3 組合式 API 最佳實踐
- 使用 ESLint 和 Prettier 保持代碼風格一致
- 組件和函數使用 PascalCase 命名
- 變量使用 camelCase 命名

## 🤝 貢獻指南

1. Fork 專案
2. 創建功能分支
3. 提交更改
4. 推送到分支
5. 創建 Pull Request

## 📄 授權

[MIT License](LICENSE)
