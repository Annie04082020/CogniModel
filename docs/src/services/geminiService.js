// geminiService.js - 處理抽象筆記長文、音訊檔案、YouTube 影片與截圖的 AI 認知解構與心智模型推演

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

const SYSTEM_INSTRUCTION = `你是一位認知學習科學與第一性原理教學專家，專門輔導理工背景（電機、資工、機械工程）跨入智慧醫療生醫領域的頂尖研究生。
【學生背景畫像】：
- 學生目前就讀國立臺灣大學智慧健康創新碩士學程（NTU Smart MHI），全英語授課環境。
- 大學具備扎實的理工根基（熟悉電路學、訊號與系統、狀態機、演算法、自動控制 PID、機械結構）。
- 學生並非生物生化純科班出身，對海量冗長、無規律感的全英語生醫醫學名詞感到陌生。
- 學生非常反感「機械化無腦刷題」，核心目標是：
  1. 用【理工工程直覺（電路/狀態機/訊號處理/閉迴路控制）】來理解生醫底層運作機轉。
  2. 強化【全英生醫專有名詞的存在感與辨識度】，必須看懂英文術語、掌握詞根與工程對等概念，從容應對全英考試與文獻。

請務必返回嚴格符合以下 JSON 格式的數據（不要加入額外的 markdown 標記外文字）：
{
  "deckName": "建議的心智模型主題名稱（簡短精準，例如：神經動作電位與離子動力學）",
  "summary": "一句話第一性原理總結：這個生醫系統在解決什麼問題？",
  "glossary": [
    {
      "term_en": "英文標準學術專有名詞（例如：Depolarization）",
      "term_zh": "繁體中文學術譯名（例如：去極化）",
      "engineeringAnchor": "理工工程直覺對等概念（例如：電容急速充電 / 上升沿觸發 Rising Edge）",
      "etymology": "希臘/拉丁詞根詞綴拆解助記（例如：de- [去除/反轉] + polar [極性] + -ization [名詞化過程]）",
      "definition_en": "全英一語中的學術定義（幫助習慣全英考題與原文書閱讀）",
      "visualCue": "適合視覺圖解或檢索的架構關鍵詞（例如：RC charging curve, Na+ voltage-gated influx）"
    }
  ],
  "cards": [
    {
      "term_en": "核心英文專有名詞（例如：Action Potential）",
      "title": "核心機制英文與中文名稱（例如：Action Potential (動作電位)）",
      "text_en": "【極度重要】全英文精讀段落！嚴禁翻譯為中文！必須提供完整、高質量的純英文學術課文段落（保留原文教材精華或原汁原味全英段落），供學生直接閱讀訓練全英考題語感，並自然融入該專有名詞。",
      "translation_zh": "對應的繁體中文輔助翻譯（供學生在需要時點擊展開對照，嚴禁覆蓋英文原文）",
      "engineeringAnalogy": "精準理工工程類比（以電路、狀態機、中斷、PID反饋或機械閥門類比生醫機制）",
      "description": "核心英文課文段落（可附帶中文重點提示）"
    }
  ],
  "mechanismChains": [
    {
      "chainTitle": "動態因果骨牌流程名稱（例如：去極化觸發動作電位鏈）",
      "steps": [
        "步驟 1: 觸發輸入或初期刺激 (Input / Trigger)",
        "步驟 2: 關鍵開關啟動與信號放大 (Gating & Amplification)",
        "步驟 3: 臨界閾值突破與現象爆發 (Threshold Breach)",
        "步驟 4: 系統反饋、死區保護或復原 (Feedback & Reset)"
      ],
      "perturbation": {
        "condition": "植入一個外在干擾或極端工程假設（例如：若使用河豚毒素阻斷電位敏感型鈉通道）",
        "impactStep": 2,
        "outcome": "系統會在第 2 步斷裂，無法達成後續連鎖",
        "analysis": "機制深層解析：為什麼會在這個環節受阻？下游會產生什麼連帶效應？以電路/系統觀點分析代償或崩潰。"
      }
    }
  ],
  "socraticQuestions": [
    {
      "paradox": "一個深層為什麼或反直覺現象（例如：既然鈉離子順濃度差內流會去極化，為何電位不會無限上升到 +100mV 甚至更高？）",
      "hints": [
        "思考線索 1（工程/物理層面）：通道本身的構型是否有時間依賴性的開關限制？（類似單穩態觸發超時自鎖）",
        "思考線索 2（電磁/熱力學層面）：當電位由負轉正時，電化學驅動力（Driving Force）與能斯特電位會發生什麼變化？"
      ],
      "deepInsight": "專家思維解析：深度闡述背後的物理/生理阻抗與失活門限制，對齊頂層心智模型。"
    }
  ],
  "logicPairs": [
    {
      "cause": "因果起點 / 觸發條件（例如：膜電位跨過閾值 -55mV）",
      "effect": "後續必然反應 / 系統現象（例如：電位敏感型鈉通道快速導通）",
      "explanation": "因果推導邏輯解說（結合理工直覺）"
    }
  ],
  "mythBusters": [
    {
      "statement": "一個針對此抽象知識的論述（設計常見直覺盲點或易混淆推論）",
      "isCorrect": true,
      "explanation": "深度剖析：為什麼符合或違背原理？思考關鍵分界點是什麼？",
      "concept": "涉及的核心概念"
    }
  ],
  "scenarios": [
    {
      "scenario": "具體臨床或極端邊界測試情境",
      "question": "根據底層原理推演，系統會發生什麼狀態變化？",
      "options": ["選項 A", "選項 B", "選項 C", "選項 D"],
      "correctIndex": 0,
      "explanation": "推導鏈條與原理驗證"
    }
  ]
}

注意事項：
1. 【嚴禁直接翻譯英文文本】：學生就讀 NTU Smart MHI 全英學程，考試與論文皆為全英！cards 的 text_en 必須保持【純英文學術課文段落】，嚴禁把學習正文直接翻成中文！學生需要直接閱讀英文原文，透過標註單字與理工類比來輔助理解。
2. 數量建議：glossary 4~8 個核心生醫英文術語，cards 4~8 張，mechanismChains 2~4 組，socraticQuestions 2~4 組，logicPairs 3~5 組，mythBusters 3~5 題，scenarios 2~3 題。
3. 類比必須「精確對齊理工（EE/CS/ME）」，切忌空泛；英文術語務必提供標準英文學術單字。
4. 絕不產生死背名詞的記憶題，所有內容務必圍繞「動態因果」、「干擾推演」與「專有名詞實質理解」。
5. 除 text_en 保持純英文外，其他解析以繁體中文搭配英文專有名詞。`;

// 支援的備選模型清單（優先使用速度極快、額度超高且免費的 Flash 模型）
const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

const sendGeminiRequest = async (parts, apiKey) => {
    let lastError = null;

    for (const model of CANDIDATE_MODELS) {
        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const requestBody = {
                contents: [
                    {
                        role: "user",
                        parts: parts
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
                const errMsg = errorData.error?.message || `狀態碼: ${response.status}`;
                if (errMsg.includes('not available') || errMsg.includes('not found') || response.status === 404) {
                    console.warn(`Model ${model} 不可用，嘗試下一個模型...`, errMsg);
                    lastError = new Error(errMsg);
                    continue;
                }
                throw new Error(errMsg);
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
        } catch (err) {
            lastError = err;
            if (err.message && (err.message.includes('not available') || err.message.includes('not found'))) {
                continue;
            }
            throw err;
        }
    }

    throw lastError || new Error("呼叫 Gemini 模型失敗，請確認 API Key 是否正確。");
};

// 1. 分析長篇文字
export const analyzeTextWithGemini = async (text, apiKey = null) => {
    const key = apiKey || getGeminiApiKey();
    if (!key) {
        throw new Error("請先填入 Gemini API Key 才能進行 AI 深度理解提煉。");
    }

    const prompt = `請深度分析以下抽象學習內容，並按照指令輸出結構化的心智模型推演資料：\n\n${text}`;
    return await sendGeminiRequest([{ text: prompt }], key);
};

// 2. 分析錄音檔
export const analyzeAudioWithGemini = async (audioFile, apiKey = null) => {
    const key = apiKey || getGeminiApiKey();
    if (!key) {
        throw new Error("請先填入 Gemini API Key 才能進行音訊辨識與深度理解提煉。");
    }

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
    const prompt = "這是課堂或學習錄音，請聽取內容並進行深度心智模型解構，整理出因果骨牌流程鏈、蘇格拉底深度探究與機制解析。";

    return await sendGeminiRequest([
        {
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        },
        { text: prompt }
    ], key);
};

// 3. 分析圖片 / 截圖 (Ctrl+V 拍照支援)
export const analyzeImageWithGemini = async (imageFile, apiKey = null) => {
    const key = apiKey || getGeminiApiKey();
    if (!key) {
        throw new Error("請先填入 Gemini API Key 才能進行圖片/截圖 AI 認知解構。");
    }

    const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });

    const mimeType = imageFile.type || 'image/jpeg';
    const prompt = "這是學習圖表/黑板筆記/機制示意圖，請深入辨識圖中的動態箭頭、因果關係與核心原理，輸出結構化的心智模型推演資料。";

    return await sendGeminiRequest([
        {
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        },
        { text: prompt }
    ], key);
};

// 4. 分析 YouTube 影片
export const extractYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const normalizeYouTubeUrl = (url) => {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return url;
};

export const analyzeYouTubeWithGemini = async (youtubeUrl, apiKey = null) => {
    const key = apiKey || getGeminiApiKey();
    if (!key) {
        throw new Error("請先填入 Gemini API Key 才能進行 YouTube 影片 AI 認知解構。");
    }

    const normalizedUrl = normalizeYouTubeUrl(youtubeUrl);
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
        throw new Error("請輸入有效的 YouTube 影片網址 (例如: https://www.youtube.com/watch?v=... 或 https://youtu.be/...)");
    }

    const prompt = `這是老師指定的考試範圍 YouTube 影片。請深入觀看與聆聽此影片內容，掌握影片中講解的核心概念、原理機制、重點公式或因果邏輯，並按照指令輸出結構化的深度學習與心智模型推演資料。`;

    const parsed = await sendGeminiRequest([
        {
            fileData: {
                fileUri: normalizedUrl,
                mimeType: "video/mp4"
            }
        },
        { text: prompt }
    ], key);

    parsed.videoId = videoId;
    parsed.videoUrl = normalizedUrl;
    return parsed;
};

// 5. 免 API 離線降級解析規則
export const parseOfflineText = (rawText) => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const cards = [];
    const logicPairs = [];

    let currentTitle = '';
    let currentDesc = [];

    lines.forEach((line) => {
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
        mechanismChains: [],
        socraticQuestions: [],
        logicPairs: logicPairs,
        mythBusters: [],
        scenarios: []
    };
};

// ================= 開源論文提取服務 (arXiv / Europe PMC / PubMed / DOI / OpenAlex) =================

function reconstructAbstract(invertedIndex) {
    if (!invertedIndex || typeof invertedIndex !== 'object') return '';
    const wordList = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const pos of positions) {
            wordList[pos] = word;
        }
    }
    return wordList.filter(Boolean).join(' ');
}

export const fetchOpenAccessPaper = async (queryOrUrl) => {
    const raw = (queryOrUrl || '').trim();
    if (!raw) throw new Error("請輸入論文網址、DOI、PubMed ID、arXiv ID 或關鍵字。");

    // 1. Detect arXiv ID (e.g. 1706.03762 or https://arxiv.org/abs/1706.03762)
    const arxivMatch = raw.match(/(\d{4}\.\d{4,5}(v\d+)?)/i);
    const isArxiv = raw.toLowerCase().includes('arxiv') || (arxivMatch && (raw.includes('/') || raw.startsWith('arxiv:')));

    // 2. Detect PMID (e.g. 28285215 or https://pubmed.ncbi.nlm.nih.gov/28285215/)
    const pmidMatch = raw.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i) || raw.match(/pmid:?\s*(\d+)/i) || (/^\d{7,9}$/.test(raw) ? [null, raw] : null);

    // 3. Detect PMCID (e.g. PMC8323875 or ncbi.nlm.nih.gov/pmc/articles/PMC8323875)
    const pmcMatch = raw.match(/(PMC\d+)/i);

    // 4. Detect DOI (e.g. 10.1038/s41586-024-07487-w or https://doi.org/...)
    const doiMatch = raw.match(/(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i);

    // Flow A: arXiv
    if (isArxiv && arxivMatch) {
        const arxivId = arxivMatch[1];
        // Try OpenAlex search
        try {
            const oaRes = await fetch(`https://api.openalex.org/works?filter=default.search:${encodeURIComponent(arxivId)}`);
            if (oaRes.ok) {
                const oaData = await oaRes.json();
                if (oaData.results && oaData.results.length > 0) {
                    const paper = oaData.results[0];
                    const abstract = reconstructAbstract(paper.abstract_inverted_index) || '';
                    const authors = (paper.authorships || []).map(a => a.author?.display_name).filter(Boolean).join(', ');
                    return {
                        title: paper.title || `arXiv Paper ${arxivId}`,
                        authors: authors || 'Unknown Authors',
                        journal: paper.primary_location?.source?.display_name || 'arXiv',
                        year: paper.publication_year || '',
                        doi: paper.doi || `https://doi.org/10.48550/arXiv.${arxivId}`,
                        arxivId: arxivId,
                        abstract: abstract,
                        rawUrl: raw,
                        source: 'arXiv / OpenAlex',
                        fullContentText: `Academic Paper: ${paper.title}\nAuthors: ${authors}\nPublished in: ${paper.primary_location?.source?.display_name || 'arXiv'} (${paper.publication_year || ''})\narXiv ID: ${arxivId}\nDOI: ${paper.doi || ''}\n\n[Abstract / Academic Summary]:\n${abstract}`
                    };
                }
            }
        } catch (e) {
            console.warn("OpenAlex arXiv search failed:", e);
        }
    }

    // Flow B: PMID
    if (pmidMatch) {
        const pmid = pmidMatch[1];
        try {
            const res = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=ext_id:${pmid}&format=json&resultType=core`);
            if (res.ok) {
                const data = await res.json();
                if (data.resultList?.result?.length > 0) {
                    const p = data.resultList.result[0];
                    const cleanTitle = (p.title || '').replace(/<[^>]+>/g, '').trim();
                    const cleanAbstract = (p.abstractText || '').replace(/<[^>]+>/g, '').trim();
                    return {
                        title: cleanTitle || `PubMed Paper ${pmid}`,
                        authors: p.authorString || '',
                        journal: p.journalTitle || '',
                        year: p.pubYear || '',
                        doi: p.doi || '',
                        pmid: pmid,
                        pmcid: p.pmcid || '',
                        abstract: cleanAbstract,
                        rawUrl: raw,
                        source: 'Europe PMC (PubMed)',
                        fullContentText: `Academic Paper: ${cleanTitle}\nAuthors: ${p.authorString || ''}\nJournal: ${p.journalTitle || ''} (${p.pubYear || ''})\nPMID: ${pmid} | DOI: ${p.doi || ''}\n\n[Abstract / Academic Summary]:\n${cleanAbstract}`
                    };
                }
            }
        } catch (e) {
            console.warn("Europe PMC PMID search failed:", e);
        }
    }

    // Flow C: PMCID
    if (pmcMatch) {
        const pmcid = pmcMatch[1].toUpperCase();
        try {
            const res = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=pmcid:${pmcid}&format=json&resultType=core`);
            if (res.ok) {
                const data = await res.json();
                if (data.resultList?.result?.length > 0) {
                    const p = data.resultList.result[0];
                    const cleanTitle = (p.title || '').replace(/<[^>]+>/g, '').trim();
                    const cleanAbstract = (p.abstractText || '').replace(/<[^>]+>/g, '').trim();
                    return {
                        title: cleanTitle || `PMC Paper ${pmcid}`,
                        authors: p.authorString || '',
                        journal: p.journalTitle || '',
                        year: p.pubYear || '',
                        doi: p.doi || '',
                        pmcid: pmcid,
                        abstract: cleanAbstract,
                        rawUrl: raw,
                        source: 'Europe PMC',
                        fullContentText: `Academic Paper: ${cleanTitle}\nAuthors: ${p.authorString || ''}\nJournal: ${p.journalTitle || ''} (${p.pubYear || ''})\nPMCID: ${pmcid}\n\n[Abstract / Academic Summary]:\n${cleanAbstract}`
                    };
                }
            }
        } catch (e) {
            console.warn("Europe PMC PMCID search failed:", e);
        }
    }

    // Flow D: DOI
    if (doiMatch) {
        const cleanDoi = doiMatch[1].replace(/[.,;)]+$/, '');
        // 1. Try OpenAlex first
        try {
            const oaRes = await fetch(`https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDoi)}`);
            if (oaRes.ok) {
                const paper = await oaRes.json();
                const abstract = reconstructAbstract(paper.abstract_inverted_index) || '';
                const authors = (paper.authorships || []).map(a => a.author?.display_name).filter(Boolean).join(', ');
                if (paper.title) {
                    return {
                        title: paper.title,
                        authors: authors || '',
                        journal: paper.primary_location?.source?.display_name || '',
                        year: paper.publication_year || '',
                        doi: cleanDoi,
                        abstract: abstract,
                        rawUrl: raw,
                        source: 'OpenAlex',
                        fullContentText: `Academic Paper: ${paper.title}\nAuthors: ${authors}\nPublished in: ${paper.primary_location?.source?.display_name || ''} (${paper.publication_year || ''})\nDOI: ${cleanDoi}\n\n[Abstract / Academic Summary]:\n${abstract}`
                    };
                }
            }
        } catch (e) {
            console.warn("OpenAlex DOI lookup failed:", e);
        }

        // 2. Try Europe PMC for DOI
        try {
            const res = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:"${encodeURIComponent(cleanDoi)}"&format=json&resultType=core`);
            if (res.ok) {
                const data = await res.json();
                if (data.resultList?.result?.length > 0) {
                    const p = data.resultList.result[0];
                    const cleanTitle = (p.title || '').replace(/<[^>]+>/g, '').trim();
                    const cleanAbstract = (p.abstractText || '').replace(/<[^>]+>/g, '').trim();
                    return {
                        title: cleanTitle || `Paper DOI: ${cleanDoi}`,
                        authors: p.authorString || '',
                        journal: p.journalTitle || '',
                        year: p.pubYear || '',
                        doi: cleanDoi,
                        abstract: cleanAbstract,
                        rawUrl: raw,
                        source: 'Europe PMC',
                        fullContentText: `Academic Paper: ${cleanTitle}\nAuthors: ${p.authorString || ''}\nJournal: ${p.journalTitle || ''} (${p.pubYear || ''})\nDOI: ${cleanDoi}\n\n[Abstract / Academic Summary]:\n${cleanAbstract}`
                    };
                }
            }
        } catch (e) {
            console.warn("Europe PMC DOI lookup failed:", e);
        }
    }

    // Flow E: General query (e.g. title or topic search)
    // 1. Try Europe PMC
    try {
        const res = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(raw)}&format=json&resultType=core`);
        if (res.ok) {
            const data = await res.json();
            if (data.resultList?.result?.length > 0) {
                const p = data.resultList.result[0];
                const cleanTitle = (p.title || '').replace(/<[^>]+>/g, '').trim();
                const cleanAbstract = (p.abstractText || '').replace(/<[^>]+>/g, '').trim();
                return {
                    title: cleanTitle || raw,
                    authors: p.authorString || '',
                    journal: p.journalTitle || '',
                    year: p.pubYear || '',
                    doi: p.doi || '',
                    pmid: p.pmid || '',
                    abstract: cleanAbstract,
                    rawUrl: raw,
                    source: 'Europe PMC Search',
                    fullContentText: `Academic Paper: ${cleanTitle}\nAuthors: ${p.authorString || ''}\nJournal: ${p.journalTitle || ''} (${p.pubYear || ''})\n\n[Abstract / Academic Summary]:\n${cleanAbstract}`
                };
            }
        }
    } catch (e) {
        console.warn("Europe PMC general search failed:", e);
    }

    // 2. Try OpenAlex search
    try {
        const oaRes = await fetch(`https://api.openalex.org/works?filter=default.search:${encodeURIComponent(raw)}`);
        if (oaRes.ok) {
            const oaData = await oaRes.json();
            if (oaData.results && oaData.results.length > 0) {
                const paper = oaData.results[0];
                const abstract = reconstructAbstract(paper.abstract_inverted_index) || '';
                const authors = (paper.authorships || []).map(a => a.author?.display_name).filter(Boolean).join(', ');
                return {
                    title: paper.title,
                    authors: authors,
                    journal: paper.primary_location?.source?.display_name || '',
                    year: paper.publication_year || '',
                    doi: paper.doi || '',
                    abstract: abstract,
                    rawUrl: raw,
                    source: 'OpenAlex Search',
                    fullContentText: `Academic Paper: ${paper.title}\nAuthors: ${authors}\nPublished in: ${paper.primary_location?.source?.display_name || ''} (${paper.publication_year || ''})\n\n[Abstract / Academic Summary]:\n${abstract}`
                };
            }
        }
    } catch (e) {
        console.warn("OpenAlex general search failed:", e);
    }

    throw new Error(`找不到與「${raw}」相關的開源論文資料。請確認網址、DOI、PMID 是否正確，或嘗試輸入更完整的論文英文名稱。`);
};

// ================= 理工學伴即時問答 (CogniTutor：極省 Token AI 與 0 額度離線檢索) =================

export const searchOfflineKnowledge = ({
    question,
    contextChunk,
    glossary = [],
    mechanismChains = [],
    logicPairs = []
}) => {
    const qLower = (question || '').toLowerCase().trim();

    // 1. 檢索專有名詞庫
    const matchedTerms = (glossary || []).filter(g => {
        const en = (g.term_en || '').toLowerCase();
        const zh = (g.term_zh || '').toLowerCase();
        if (!en && !zh) return false;
        return (en && qLower.includes(en)) || (zh && qLower.includes(zh)) ||
               qLower.split(/[\s,，、]+/).some(word => word.length >= 2 && (en.includes(word) || zh.includes(word)));
    });

    // 2. 檢索機制骨牌鏈
    const matchedChains = (mechanismChains || []).filter(chain => {
        const title = (chain.chainTitle || '').toLowerCase();
        return title && (qLower.includes(title) || title.includes(qLower));
    });

    // 3. 檢索因果邏輯對
    const matchedPairs = (logicPairs || []).filter(p => {
        const c = (p.cause || '').toLowerCase();
        const e = (p.effect || '').toLowerCase();
        return (c && qLower.includes(c)) || (e && qLower.includes(e));
    });

    let answer = "";
    if (matchedTerms.length > 0) {
        answer += `🔍 **本機知識庫命中專有名詞**：\n\n`;
        matchedTerms.slice(0, 3).forEach(t => {
            answer += `• **${t.term_en}** ${t.term_zh ? `(${t.term_zh})` : ''}\n`;
            if (t.engineeringAnchor) {
                answer += `  ⚡ **理工直覺對齊**：${t.engineeringAnchor}\n`;
            }
            if (t.etymology) {
                answer += `  🌱 **詞根拆解**：${t.etymology}\n`;
            }
            if (t.definition_en) {
                answer += `  📖 **學術定義**：${t.definition_en}\n`;
            }
            answer += `\n`;
        });
    }

    if (matchedPairs.length > 0) {
        answer += `⚡ **因果推導關係**：\n`;
        matchedPairs.slice(0, 3).forEach(p => {
            answer += `• 【${p.cause}】 ➔ 【${p.effect}】\n  _${p.explanation || ''}_\n`;
        });
        answer += `\n`;
    }

    if (matchedChains.length > 0) {
        answer += `⛓️ **動態機制連鎖**：\n`;
        matchedChains.slice(0, 2).forEach(c => {
            answer += `• **${c.chainTitle}**：\n`;
            (c.steps || []).forEach((s, idx) => {
                answer += `  ${idx + 1}. ${s}\n`;
            });
            if (c.perturbation) {
                answer += `  ⚠️ **異常干擾推演**：${c.perturbation.condition} ➔ ${c.perturbation.outcome}\n`;
            }
        });
        answer += `\n`;
    }

    if (!answer) {
        answer = `💡 **根據當前研讀段落重點解析**：\n\n`;
        if (contextChunk?.analogy) {
            answer += `⚡ **理工工程心智模型**：\n${contextChunk.analogy}\n\n`;
        }
        if (contextChunk?.text) {
            answer += `📄 **原文核心英文字段**：\n"${contextChunk.text.slice(0, 200)}..."\n\n`;
        }
        if (contextChunk?.translation_zh) {
            answer += `📖 **中文輔助參考**：\n${contextChunk.translation_zh.slice(0, 160)}...\n\n`;
        }
        answer += `_（💡 提示：本回答由本機離線知識庫直接產出，耗費 0 API 額度。若需更深層自由追問，可啟用 Gemini Flash AI 模式。）_`;
    }

    return {
        answer: answer.trim(),
        mode: 'offline',
        model: 'Local Zero-Cost RAG'
    };
};

export const askCogniTutor = async ({
    question,
    contextChunk,
    glossary = [],
    mechanismChains = [],
    logicPairs = [],
    apiKey = null,
    forceOffline = false
}) => {
    const rawQ = (question || '').trim();
    if (!rawQ) throw new Error("請輸入您的提問。");

    const key = apiKey || getGeminiApiKey();

    // 若使用者選擇強制離線模式，或尚未填寫 API Key，使用零額度本機檢索
    if (forceOffline || !key) {
        return searchOfflineKnowledge({
            question: rawQ,
            contextChunk,
            glossary,
            mechanismChains,
            logicPairs
        });
    }

    // 線上模式：使用 Gemini Flash 極省 Token 架構（僅帶入當前段落，輸入 < 500 tokens，每天免費 1,500 次）
    const currentText = contextChunk?.text || '';
    const currentTitle = contextChunk?.title || '';
    const currentAnalogy = contextChunk?.analogy || '';
    const currentTerm = contextChunk?.term_en || '';

    const tutorSystemPrompt = `你是一位精通第一性原理的 AI 理工學伴，專門輔導理工背景（電機、資工、機械）攻讀臺大智慧醫療全英學程（NTU Smart MHI）的研究生。
【核心答題原則】：
1. 學生痛點是生物專有名詞無規律且缺乏工程直覺，請盡量用【理工工程直覺（電路、狀態機、訊號中斷、PID反饋、機械閥門）】給出一針見血的解答。
2. 緊扣【學生當前閱讀的課文段落】回答，幫助理解英文專有名詞背後的因果機轉。
3. 語氣簡潔俐落（150~300 字內），直擊本質，避免冗長的教科書廢話。
4. 使用繁體中文回答，專有名詞保留標準學術英文。`;

    const userPrompt = `【學生當前研讀的學術段落】：
標題: ${currentTitle} (${currentTerm})
課文: ${currentText}
${currentAnalogy ? `工程心智錨點: ${currentAnalogy}` : ''}

【學生提問】：
${rawQ}

請以理工工程直覺簡明扼要解答：`;

    for (const model of CANDIDATE_MODELS) {
        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            const requestBody = {
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: tutorSystemPrompt }] },
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 500
                }
            };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errMsg = errorData.error?.message || `狀態碼: ${response.status}`;
                if (errMsg.includes('not available') || errMsg.includes('not found') || response.status === 404) {
                    continue;
                }
                throw new Error(errMsg);
            }

            const data = await response.json();
            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (answer) {
                return {
                    answer: answer.trim(),
                    mode: 'ai',
                    model: model
                };
            }
        } catch (err) {
            console.warn(`Model ${model} failed in tutor:`, err);
        }
    }

    // 容錯備援：若 API 呼叫異常，自動回退至本機離線知識庫
    return searchOfflineKnowledge({
        question: rawQ,
        contextChunk,
        glossary,
        mechanismChains,
        logicPairs
    });
};
