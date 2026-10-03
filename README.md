# Review Card & Deep Understanding Maker

一個結合**深度概念理解**與**互動遊戲**的現代化學習工具。不再只是死記硬背名詞，而是能從抽象課文長文、筆記、手機錄音或簡報投影片中，深度解構知識因果脈絡，透過多元遊戲進行深度練習！

## ✨ 核心特色與遊戲模式

### 1. 深度理解遊戲模式 (Understand Mode) 【NEW! 🚀】
專為高難度、抽象、需理解原理與機制的課程設計：
- 🧩 **因果/機制連連看 (Logic Match)**：左側「觸發條件/機制原因」，右側「現象/生理結果」，點選匹配，打通因果鏈並即時獲得深層邏輯解析。
- 🛡️ **迷思破解是非辨析 (Myth Buster)**：針對易混淆盲點進行判斷，答題後展開 AI 深度解剖，理清核心分界點。
- 🎯 **情境應用推導 (Scenario Quest)**：在具體案例或假設條件下推導結果，訓練知識遷移與應用。

### 2. 多元資料來源匯入中心 (Import & Extract Center) 【NEW! 🚀】
- ✍️ **長篇抽象文字段落提取**：直接貼上課文段落、講義文字或個人筆記，一鍵由 Gemini AI 進行認知解構。
- 🎙️ **錄音筆記 / 音訊檔案上傳**：支援上傳手機錄音筆錄音檔（`.mp3`, `.m4a`, `.wav`, `.aac` 等），AI 直接聆聽並提煉知識點與理解題目。
- 📄 **投影片 PDF 簡報解析**：保留原有 PDF.js 投影片自動抓圖與排版功能。
- 🗂️ **即時預覽與微調**：提取完成後可先微調卡片、自訂牌組名稱，確認後一鍵加入本機牌組庫。

### 3. 純文字概念卡片美化 (Enhanced Cards) 【NEW! 🚀】
- 無圖片時自動適配高質感全寬版面，支援「生活化直觀比喻 (Analogy)」、「機制特徵剖析」與流暢翻卡互動。

### 4. 經典複習與測驗模式
- **Review Mode (翻卡複習)**：支援洗牌、隨機翻轉、記憶進度追蹤。
- **Quiz Mode (測驗挑戰)**：四選一測驗、拼字填空模式、速度分析與錯題本追蹤。
- **Stats Dashboard**：視覺化學習曲線與弱點牌組分析。
- **Dictionary Mode**：專業詞彙字典與每日推薦。

---

## 🚀 快速開始

### 1. 啟動網頁應用
```bash
cd docs
npm install
npm run dev
```
打開瀏覽器（預設為 `http://localhost:5173`）即可開始使用！

### 2. 設定 Google Gemini API Key（選填，強力推薦）
1. 在應用程式側邊欄點選 **「知識匯入與提煉」**。
2. 點擊右上角 **「設定 Gemini API Key」**（可免費於 [Google AI Studio](https://aistudio.google.com/app/apikey) 取得）。
3. 貼上後即安全保存在本機瀏覽器中，隨即可一鍵對長篇抽象文字或錄音檔進行深度提煉！

---

## 🛠️ 命令列工具 (CLI Method)

除了直接在網頁介面操作外，也提供本機 Python 批次腳本：

### 1. 深度提煉抽象筆記或錄音檔
```bash
# 提煉文字檔 (.txt, .md) 或錄音檔 (.mp3, .wav, .m4a)
python extract_knowledge.py 筆記.txt "神經生物學" YOUR_API_KEY
```

### 2. 傳統 PDF 投影片簡報截圖提取
```bash
python pdf_to_data.py pdfs
```

---

## 📦 部署到 GitHub Pages

```bash
cd docs
npm run build
cd dist
git init
git add .
git commit -m "Deploy update"
git push -f https://github.com/Annie04082020/ReviewCardMaker.git gh-pages
```
