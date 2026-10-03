# CogniModel (NTU Smart MHI 理工跨界生醫心智模型推演工作台)

> **專為工程跨界生醫（NTU Smart MHI 全英學程）打造的認知解構與推演工作台。**  
> 堅決摒棄機械化「無腦刷題」，專注於**「抽象機制的底層因果推導」**、**「全英專有名詞高頻曝光與詞根拆解」**以及**「電機/資工/機械第一性原理直覺映射」**！

---

## 🌟 核心特色功能

### 1. 🧠 心智模型推演工作台 (Mental Model Workbench)
- ⛓️ **因果骨牌流程鏈 (Mechanism Domino Chains)**：視覺化步進拆解動態反應（刺激輸入 ➔ 離子流 ➔ 臨界閾值 ➔ 通道開啟）。
- ⚡ **干擾變數模擬 (Perturbation Stress Simulation)**：植入破壞性條件（如阻斷劑、基因突變、低溫），推導骨牌鏈斷裂點與系統代償反應。
- 🏛️ **蘇格拉底階梯探究 (Socratic Inquiry)**：反直覺矛盾現象 + 漸進式思維鷹架線索，不直接給答案，引導大腦自主完成邏輯閉環。
- 🛡️ **思維盲點校準 (Blindspot Buster)**：直擊直覺常見誤區，深度對比底層真理。

### 2. 📖 全英分段精讀複習工作台 (Guided Chunked Reader)
- 🔤 **純英文學術課文沉浸精讀**：正文嚴格保留高質量全英教材段落，拒絕全文機翻破壞語感。
- 🏷️ **專有名詞即時標註**：內文中出現的生醫核心術語自動以綠色徽章標註，點擊即彈出中文譯名、⚡理工工程類比、🌱拉丁/希臘詞根拆解與全英定義。
- 📖 **可折疊繁中對照翻譯**：提供折疊式安全網，卡關時隨時點開對照。
- 🔊 **全英發音朗讀**：調用原生 Web Speech API 朗讀段落與單字。

### 3. 🔤 雙語術語工作台 & 熟悉單字小遊戲 (Bilingual Anchor & Mini-Games)
- ⚡ **理工生醫連連看**：將全英醫學單字（*Action Potential, Depolarization, Refractory Period, GPCR*）與理工直覺（*單穩態脈衝, 電容充電上升沿, 防抖死區, 訊息佇列代理*）進行點選配對，建立瞬間神經反射！
- 🌱 **詞根解構拼圖**：解構拉丁/希臘積木公式（如 `de- + polar + -ization` 或 `Hyper- + kal- + -emia`），拼出全英專有名詞。
- 📄 **一鍵匯出雙語 Cheatsheet**：支援一鍵產生 A4 列印 / PDF 友善排版、複製 Markdown 表格或匯出 CSV 試算表。

### 4. 📸 課堂黑板截圖 / 講義即時逆向解構 (Ctrl+V Paste)
- 支援直接按 `Ctrl + V` 貼上螢幕截圖或照片，Gemini 多模態神經網路自動逆向解析圖中箭頭與迴路，轉譯為因果骨牌鏈。

### 5. 🎙️ 課堂錄音 Web Audio DSP 即時降噪試聽台
- 內建高通濾波（消除冷氣嗡嗡低頻）、低通濾波（濾除高頻嘯叫）、2.2kHz 人聲共振峰增益與動態壓縮器，支援 A/B 盲聽試聽，匯出純淨人聲音訊後再送轉譯。

---

## 🚀 線上即時體驗

🔗 **[https://annie04082020.github.io/CogniModel/](https://annie04082020.github.io/CogniModel/)**  
*(亦可透過舊網址 `https://annie04082020.github.io/ReviewCardMaker/` 自動重定向訪問)*

---

## 💻 本機開發與建置

```bash
# 進入前端目錄
cd docs

# 安裝相依套件
npm install

# 啟動本機開發伺服器
npm run dev

# 建置生產環境版本
npm run build
```
