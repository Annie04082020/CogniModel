// geminiService.js - 處理抽象筆記長文與音訊檔案的 AI 認知解構

const API_KEY_STORAGE_KEY = 'gemini_api_key';

export const getGeminiApiKey = () => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
};

export const setGeminiApiKey = (key) => {
    if (key) {
        localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
};

const SYSTEM_INSTRUCTION = `你是一位認知學習科學與深度教學專家。
用戶正在學習難度較高、抽象且不容易一眼看懂的課程內容。
你的任務是將用戶提供的【抽象筆記/課文長文/課堂錄音】進行深度解構，幫助用戶建立真正的理解，而不是死記硬背名詞。

請務必返回嚴格符合以下 JSON 格式的數據（不要加入額外的 markdown 程式碼區塊標記外文字）：
{
  "deckName": "建議的牌組主題名稱（簡短精準，例如：神經元動作電位機制）",
  "summary": "一句話白話總結這段知識的核心本質",
  "cards": [
    {
      "title": "概念名稱或核心機制",
      "analogy": "生活化直觀比喻（幫助快速聯想與理解本質）",
      "description": "深入淺出的機制解釋、為什麼會這樣、核心要點（請條理分明）"
    }
  ],
  "logicPairs": [
    {
      "cause": "觸發條件 / 前提 / 原因（例如：細胞膜去極化達閾值）",
      "effect": "結果 / 後續反應 / 現象（例如：電位敏感型鈉離子通道瞬間大量開啟）",
      "explanation": "因果邏輯解說（為何 A 會導致 B）"
    }
  ],
  "mythBusters": [
    {
      "statement": "一個針對此抽象知識的論述（請設計常見易混淆盲點或直覺陷阱）",
      "isCorrect": true,
      "explanation": "深度解析：為什麼對或為什麼錯？關鍵分界點是什麼？",
      "concept": "涉及的核心概念"
    }
  ],
  "scenarios": [
    {
      "scenario": "一個具體的應用情境或假設狀況（例如：若使用河豚毒素阻斷電位敏感型鈉離子通道...）",
      "question": "根據原理，會發生下列哪種現象？",
      "options": ["選項 A", "選項 B", "選項 C", "選項 D"],
      "correctIndex": 0,
      "explanation": "答案解析與推導過程"
    }
  ]
}

注意事項：
1. 數量建議：cards 生成 3~8 張，logicPairs 生成 3~6 組，mythBusters 生成 3~6 題，scenarios 生成 2~4 題。
2. 題目與解釋請務必注重「因果關聯」、「運作機制」與「概念辨析」，避免純背誦瑣碎定義。
3. 語言請以繁體中文（台灣習慣用詞）輸出。
`;

export const analyzeTextWithGemini = async (text, apiKey = null) => {
    const key = apiKey || getGeminiApiKey();
    if (!key) {
        throw new Error("請先填入 Gemini API Key 才能進行 AI 深度理解提煉。");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

    const prompt = `請分析以下抽象學習內容，並按照指令輸出結構化的深度學習遊戲資料：\n\n${text}`;

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ],
        systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        generationConfig: {
            responseMimeType: "application/json"
        }
    };

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API 請求失敗 (狀態碼: ${response.status})`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
        throw new Error("Gemini API 未回傳有效內容");
    }

    try {
        return JSON.parse(candidateText);
    } catch (e) {
        const cleaned = candidateText.replace(/^```json/m, '').replace(/^```/m, '').trim();
        return JSON.parse(cleaned);
    }
};

export const analyzeAudioWithGemini = async (audioFile, apiKey = null) => {
    const key = apiKey || getGeminiApiKey();
    if (!key) {
        throw new Error("請先填入 Gemini API Key 才能進行音訊辨識與深度理解提煉。");
    }

    // Convert file to base64
    const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
    });

    const mimeType = audioFile.type || 'audio/mp3';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

    const prompt = "這是課堂或學習錄音，請聽取內容並進行深度理解解構，整理出核心概念卡片、因果配對、迷思破解與情境應用題。";

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    },
                    { text: prompt }
                ]
            }
        ],
        systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        generationConfig: {
            responseMimeType: "application/json"
        }
    };

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `音訊解析失敗 (狀態碼: ${response.status})。若音檔較大請確保格式為 mp3/wav/m4a。`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
        throw new Error("Gemini API 未回傳有效內容");
    }

    try {
        return JSON.parse(candidateText);
    } catch (e) {
        const cleaned = candidateText.replace(/^```json/m, '').replace(/^```/m, '').trim();
        return JSON.parse(cleaned);
    }
};

// 免 API 的離線降級解析規則（當用戶沒填 API key 時）
export const parseOfflineText = (rawText) => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const cards = [];
    const logicPairs = [];

    let currentTitle = '';
    let currentDesc = [];

    lines.forEach((line) => {
        // 判斷是否為因果句 "A -> B" 或定義句 "A : B"
        if (line.includes('->') || line.includes('→')) {
            const parts = line.split(/->|→/);
            if (parts.length >= 2) {
                logicPairs.push({
                    cause: parts[0].trim(),
                    effect: parts[1].trim(),
                    explanation: `當【${parts[0].trim()}】發生時，引發【${parts[1].trim()}】`
                });
            }
        }

        if (line.includes('：') || line.includes(':') || line.includes(' - ')) {
            const parts = line.split(/[：:]| - /);
            if (parts.length >= 2) {
                cards.push({
                    title: parts[0].trim(),
                    analogy: "",
                    description: parts.slice(1).join('：').trim()
                });
                return;
            }
        }

        // 段落式處理：如果遇到以 # 開頭或字數較短的行，當作標題
        if (line.startsWith('#') || (line.length < 25 && !line.endsWith('。') && !line.endsWith('.'))) {
            if (currentTitle) {
                cards.push({
                    title: currentTitle,
                    analogy: "",
                    description: currentDesc.join('\n') || "核心概念探討"
                });
            }
            currentTitle = line.replace(/^#+\s*/, '');
            currentDesc = [];
        } else {
            if (!currentTitle) {
                currentTitle = line.slice(0, 20) + '...';
            }
            currentDesc.push(line);
        }
    });

    if (currentTitle) {
        cards.push({
            title: currentTitle,
            analogy: "",
            description: currentDesc.join('\n') || "核心概念探討"
        });
    }

    return {
        deckName: "抽象筆記提取",
        summary: "基於規則解析的筆記內容",
        cards: cards.length > 0 ? cards : [{ title: "重點整理", analogy: "", description: rawText }],
        logicPairs: logicPairs,
        mythBusters: [],
        scenarios: []
    };
};
