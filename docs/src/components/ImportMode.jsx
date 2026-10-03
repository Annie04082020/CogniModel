import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { set as setIDB, get as getIDB } from 'idb-keyval';
import {
    Upload, FileText, CheckCircle, AlertCircle, Loader, Trash2, Database,
    Sparkles, Mic, Key, Edit3, Plus, ArrowRight, HelpCircle, FileAudio, Layers,
    Youtube, Video, ExternalLink, FolderPlus, FolderCheck, Tag,
    Camera, Image as ImageIcon, Clipboard, GitMerge, RefreshCw, X, CheckSquare, Square,
    Globe, BookOpenCheck
} from 'lucide-react';
import {
    getGeminiApiKey, setGeminiApiKey, analyzeTextWithGemini, analyzeAudioWithGemini,
    analyzeYouTubeWithGemini, analyzeImageWithGemini, extractYouTubeVideoId, parseOfflineText,
    fetchOpenAccessPaper
} from '../services/geminiService';
import AudioDenoisePlayer from './AudioDenoisePlayer';
import cardsData from '../data/cards.json';

// Configure PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ImportMode = ({ onDeckUpdate }) => {
    const [activeTab, setActiveTab] = useState('youtube'); // 'youtube', 'text', 'audio', 'pdf', 'image', 'paper'

    // Status & Common States
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("ideal"); // ideal, success, error
    const [statusMsg, setStatusMsg] = useState("");
    const [storedDecks, setStoredDecks] = useState([]);
    const [deletedDecksCount, setDeletedDecksCount] = useState(0);

    // Merge Modal States
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [selectedDecksToMerge, setSelectedDecksToMerge] = useState([]);
    const [mergedTargetName, setMergedTargetName] = useState('');
    const [deleteOriginalsAfterMerge, setDeleteOriginalsAfterMerge] = useState(true);
    const [mergeProcessing, setMergeProcessing] = useState(false);

    // API Key State
    const [apiKey, setApiKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);

    // ================= 分類與牌組歸屬狀態 =================
    const [categoryMode, setCategoryMode] = useState('new'); // 'existing' | 'new'
    const [selectedExistingDeck, setSelectedExistingDeck] = useState('');
    const [newDeckName, setNewDeckName] = useState('');

    // Text Tab States
    const [inputText, setInputText] = useState('');

    // Audio Tab States
    const [audioFile, setAudioFile] = useState(null);
    const audioInputRef = useRef(null);

    // YouTube Tab States
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const detectedVideoId = extractYouTubeVideoId(youtubeUrl);

    // Image / Screenshot Tab States
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imagePromptContext, setImagePromptContext] = useState('');
    const imageInputRef = useRef(null);

    // Paper Tab States (arXiv / PubMed / DOI / Europe PMC)
    const [paperInput, setPaperInput] = useState('');
    const [fetchingPaper, setFetchingPaper] = useState(false);
    const [fetchedPaper, setFetchedPaper] = useState(null);
    const [paperNotes, setPaperNotes] = useState('');

    // PDF Drag State
    const [isDragging, setIsDragging] = useState(false);

    // AI 提煉後的預覽與編輯資料
    const [extractedData, setExtractedData] = useState(null); // { deckName, summary, cards, logicPairs, mythBusters, scenarios, mechanismChains, socraticQuestions, videoId, videoUrl }

    useEffect(() => {
        setApiKey(getGeminiApiKey());
        fetchStoredDecks();

        // 監聽 Ctrl+V 剪貼簿截圖直接貼上
        const handleGlobalPaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type && items[i].type.startsWith('image/')) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        setImageFile(blob);
                        setImagePreview(URL.createObjectURL(blob));
                        setActiveTab('image');
                        setStatus("ideal");
                        setStatusMsg("📸 已成功從剪貼簿捕捉截圖！可輸入補充說明後點擊「開始認知解構」。");
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handleGlobalPaste);
        return () => window.removeEventListener('paste', handleGlobalPaste);
    }, []);

    const fetchStoredDecks = async () => {
        try {
            const customCards = (await getIDB('custom_cards')) || [];
            const deletedDecks = (await getIDB('deleted_decks')) || [];
            setDeletedDecksCount(deletedDecks.length);

            const deckMap = {};

            // 1. Static decks (excluding deleted)
            cardsData.forEach(card => {
                if (!deletedDecks.includes(card.source)) {
                    if (!deckMap[card.source]) {
                        deckMap[card.source] = { name: card.source, count: 0, isCustom: false, glossaryCount: 0 };
                    }
                    deckMap[card.source].count += 1;
                }
            });

            // 2. Custom cards (excluding deleted)
            if (Array.isArray(customCards)) {
                customCards.forEach(card => {
                    if (!deletedDecks.includes(card.source)) {
                        if (!deckMap[card.source]) {
                            deckMap[card.source] = { name: card.source, count: 0, isCustom: true, glossaryCount: 0 };
                        }
                        deckMap[card.source].count += 1;
                        if (card.glossary && Array.isArray(card.glossary)) {
                            deckMap[card.source].glossaryCount += card.glossary.length;
                        }
                    }
                });
            }

            const decks = Object.values(deckMap);
            setStoredDecks(decks);

            if (decks.length > 0) {
                if (!selectedExistingDeck || !decks.some(d => d.name === selectedExistingDeck)) {
                    setSelectedExistingDeck(decks[0].name);
                }
                setCategoryMode('existing');
            } else {
                setCategoryMode('new');
            }
        } catch (err) {
            console.error("fetchStoredDecks error:", err);
            setStoredDecks([]);
            setCategoryMode('new');
        }
    };

    const handleSaveApiKey = () => {
        setGeminiApiKey(apiKey);
        setShowKeyInput(false);
        setStatus("success");
        setStatusMsg("API Key 已成功保存於本機瀏覽器。");
    };

    const handleDeleteDeck = async (deckName) => {
        const deck = storedDecks.find(d => d.name === deckName);
        const countInfo = deck ? `（內含 ${deck.count} 張卡片與相關推演模型）` : '';
        if (!confirm(`確定要刪除「${deckName}」模組嗎？${countInfo}\n此動作將從認知庫中永久移除。`)) return;

        try {
            const customCards = (await getIDB('custom_cards')) || [];
            const updatedCards = customCards.filter(card => card.source !== deckName);
            await setIDB('custom_cards', updatedCards);

            const deletedDecks = (await getIDB('deleted_decks')) || [];
            if (!deletedDecks.includes(deckName)) {
                await setIDB('deleted_decks', [...deletedDecks, deckName]);
            }

            setStatus("success");
            setStatusMsg(`🗑️ 已成功刪除模組「${deckName}」！`);
            await fetchStoredDecks();
            if (onDeckUpdate) onDeckUpdate();
        } catch (error) {
            console.error("Delete Error:", error);
            setStatus("error");
            setStatusMsg("刪除模組失敗，請稍後再試。");
        }
    };

    const handleRestoreDefaultDecks = async () => {
        if (!confirm("確定要還原所有被刪除的內建預設模組嗎？")) return;
        try {
            await setIDB('deleted_decks', []);
            setStatus("success");
            setStatusMsg("🔄 已成功還原內建預設模組！");
            await fetchStoredDecks();
            if (onDeckUpdate) onDeckUpdate();
        } catch (error) {
            console.error("Restore Error:", error);
            setStatus("error");
            setStatusMsg("還原失敗。");
        }
    };

    // 模組合併處理
    const openMergeModal = (initialDeckName = null) => {
        if (initialDeckName) {
            setSelectedDecksToMerge([initialDeckName]);
            setMergedTargetName(initialDeckName + ' (整合)');
        } else {
            setSelectedDecksToMerge([]);
            setMergedTargetName('');
        }
        setDeleteOriginalsAfterMerge(true);
        setIsMergeModalOpen(true);
    };

    const toggleDeckSelectionForMerge = (deckName) => {
        setSelectedDecksToMerge(prev => {
            const next = prev.includes(deckName)
                ? prev.filter(n => n !== deckName)
                : [...prev, deckName];

            if (next.length >= 2) {
                setMergedTargetName(next.join(' + '));
            } else if (next.length === 1) {
                setMergedTargetName(next[0] + ' (整合)');
            }
            return next;
        });
    };

    const handleExecuteMerge = async () => {
        if (selectedDecksToMerge.length < 2) {
            alert("請至少勾選 2 個模組以進行合併！");
            return;
        }
        const targetName = mergedTargetName.trim();
        if (!targetName) {
            alert("請輸入合併後的模組名稱！");
            return;
        }

        setMergeProcessing(true);
        try {
            const customCards = (await getIDB('custom_cards')) || [];
            const deletedDecks = (await getIDB('deleted_decks')) || [];

            const cardsToMerge = [];
            const glossaryMap = new Map();
            const mechanismChains = [];
            const socraticQuestions = [];
            const logicPairs = [];
            const mythBusters = [];
            const scenarios = [];
            const readingChunks = [];

            // 1. 從內建靜態卡片收集
            cardsData.forEach(card => {
                if (selectedDecksToMerge.includes(card.source)) {
                    cardsToMerge.push({ ...card, isCustom: true });
                }
            });

            // 2. 從自訂卡片收集與彙整中繼資料
            customCards.forEach(card => {
                if (selectedDecksToMerge.includes(card.source)) {
                    cardsToMerge.push({ ...card });
                    if (card.glossary && Array.isArray(card.glossary)) {
                        card.glossary.forEach(g => {
                            const key = (g.term_en || '').toLowerCase().trim();
                            if (key && !glossaryMap.has(key)) {
                                glossaryMap.set(key, g);
                            }
                        });
                    }
                    if (card.mechanismChains && Array.isArray(card.mechanismChains)) {
                        mechanismChains.push(...card.mechanismChains);
                    }
                    if (card.socraticQuestions && Array.isArray(card.socraticQuestions)) {
                        socraticQuestions.push(...card.socraticQuestions);
                    }
                    if (card.logicPairs && Array.isArray(card.logicPairs)) {
                        logicPairs.push(...card.logicPairs);
                    }
                    if (card.mythBusters && Array.isArray(card.mythBusters)) {
                        mythBusters.push(...card.mythBusters);
                    }
                    if (card.scenarios && Array.isArray(card.scenarios)) {
                        scenarios.push(...card.scenarios);
                    }
                    if (card.readingChunks && Array.isArray(card.readingChunks)) {
                        readingChunks.push(...card.readingChunks);
                    }
                }
            });

            if (cardsToMerge.length === 0) {
                alert("所選的模組中沒有任何可合併的卡片。");
                setMergeProcessing(false);
                return;
            }

            const timestamp = Date.now();
            const consolidatedGlossary = Array.from(glossaryMap.values());

            // 建立合併後的新卡片組，將整合後的元資料集中存放於第 0 張卡
            const newMergedCards = cardsToMerge.map((card, idx) => ({
                ...card,
                id: `merged_${timestamp}_${idx}`,
                source: targetName,
                isCustom: true,
                glossary: idx === 0 ? consolidatedGlossary : [],
                mechanismChains: idx === 0 ? mechanismChains : [],
                socraticQuestions: idx === 0 ? socraticQuestions : [],
                logicPairs: idx === 0 ? logicPairs : [],
                mythBusters: idx === 0 ? mythBusters : [],
                scenarios: idx === 0 ? scenarios : [],
                readingChunks: idx === 0 ? readingChunks : []
            }));

            let updatedCustom = [...customCards];
            let updatedDeleted = [...deletedDecks];

            if (deleteOriginalsAfterMerge) {
                // 從自訂卡片中移除被合併的原始模組
                updatedCustom = updatedCustom.filter(c => !selectedDecksToMerge.includes(c.source));
                // 將原始模組名稱加入 deletedDecks，以確保靜態預設模組也被隱藏
                selectedDecksToMerge.forEach(d => {
                    if (d !== targetName && !updatedDeleted.includes(d)) {
                        updatedDeleted.push(d);
                    }
                });
            }

            // 確保目標模組名稱不在刪除清單中
            updatedDeleted = updatedDeleted.filter(d => d !== targetName);

            // 追加合併後卡片
            updatedCustom = [...updatedCustom, ...newMergedCards];

            await setIDB('custom_cards', updatedCustom);
            await setIDB('deleted_decks', updatedDeleted);

            setIsMergeModalOpen(false);
            setStatus("success");
            setStatusMsg(`🎉 成功整合 ${selectedDecksToMerge.length} 個模組！共 ${newMergedCards.length} 張卡片與 ${consolidatedGlossary.length} 個全英名詞已匯入「${targetName}」！`);

            await fetchStoredDecks();
            if (onDeckUpdate) onDeckUpdate();
        } catch (err) {
            console.error("Merge error:", err);
            alert("模組合併失敗：" + err.message);
        } finally {
            setMergeProcessing(false);
        }
    };

    // 取得當前設定的牌組分類名稱
    const resolveTargetDeckName = (defaultAiName = '') => {
        if (categoryMode === 'existing' && selectedExistingDeck) {
            return selectedExistingDeck;
        }
        if (categoryMode === 'new' && newDeckName.trim()) {
            return newDeckName.trim();
        }
        return defaultAiName || `自訂牌組_${new Date().toLocaleDateString()}`;
    };

    // 處理 YouTube 影片分析
    const handleAnalyzeYouTube = async () => {
        if (!youtubeUrl.trim() || !detectedVideoId) {
            setStatus("error");
            setStatusMsg("請輸入有效的公開 YouTube 影片連結。");
            return;
        }

        if (!apiKey) {
            setShowKeyInput(true);
            setStatus("error");
            setStatusMsg("YouTube 影片認知解構需要使用 Gemini API，請先輸入 API Key。");
            return;
        }

        setProcessing(true);
        setStatus("ideal");
        setStatusMsg("Gemini 正在深入觀看與分析 YouTube 影片內容，請稍候...");

        try {
            const result = await analyzeYouTubeWithGemini(youtubeUrl, apiKey);
            result.deckName = resolveTargetDeckName(result.deckName);
            setExtractedData(result);
            setStatus("success");
            setStatusMsg("🎉 YouTube 影片分析完成！已為您提煉出核心考點與理解遊戲。");
        } catch (err) {
            console.error("YouTube Analysis Error:", err);
            setStatus("error");
            setStatusMsg(err.message || "YouTube 影片分析失敗，請檢查該影片是否為公開影片。");
        } finally {
            setProcessing(false);
        }
    };

    // 處理文字分析
    const handleAnalyzeText = async (useAI = true) => {
        if (!inputText.trim()) {
            setStatus("error");
            setStatusMsg("請先貼上學習筆記或課文段落。");
            return;
        }

        setProcessing(true);
        setStatus("ideal");
        setStatusMsg("");

        try {
            let result;
            if (useAI) {
                if (!apiKey) {
                    setShowKeyInput(true);
                    throw new Error("請先設定 Gemini API Key 才能進行深度 AI 理解提煉。");
                }
                result = await analyzeTextWithGemini(inputText, apiKey);
            } else {
                result = parseOfflineText(inputText);
            }

            result.deckName = resolveTargetDeckName(result.deckName);
            setExtractedData(result);
            setStatus("success");
            setStatusMsg("知識解構完成！請在下方預覽與微調後保存。");
        } catch (err) {
            console.error("Analysis Error:", err);
            setStatus("error");
            setStatusMsg(err.message || "分析過程中發生錯誤。");
        } finally {
            setProcessing(false);
        }
    };

    // 處理音訊分析
    const handleAnalyzeAudio = async (cleanAudioFile = null) => {
        const targetFile = cleanAudioFile || audioFile;
        if (!targetFile) {
            setStatus("error");
            setStatusMsg("請先選擇或上傳錄音檔案。");
            return;
        }

        if (!apiKey) {
            setShowKeyInput(true);
            setStatus("error");
            setStatusMsg("音訊辨識與解構需要使用 Gemini API，請先輸入 API Key。");
            return;
        }

        setProcessing(true);
        setStatus("ideal");
        setStatusMsg("正在傳送降噪後的純淨音訊進行深度轉錄與理解解構，請稍候...");

        try {
            const result = await analyzeAudioWithGemini(targetFile, apiKey);
            result.deckName = resolveTargetDeckName(result.deckName);
            setExtractedData(result);
            setStatus("success");
            setStatusMsg("錄音分析完成！已為您整理出核心概念與理解遊戲。");
        } catch (err) {
            console.error("Audio Analysis Error:", err);
            setStatus("error");
            setStatusMsg(err.message || "音訊分析失敗，請檢查檔案格式或網路連線。");
        } finally {
            setProcessing(false);
        }
    };

    // 處理圖片/黑板圖表認知解構
    const handleAnalyzeImage = async () => {
        if (!imageFile) {
            setStatus("error");
            setStatusMsg("請先選取圖片檔案或直接按下 Ctrl+V 貼上截圖。");
            return;
        }

        if (!apiKey) {
            setShowKeyInput(true);
            setStatus("error");
            setStatusMsg("圖片多模態認知解構需要使用 Gemini API，請先輸入 API Key。");
            return;
        }

        setProcessing(true);
        setStatus("ideal");
        setStatusMsg("Gemini 多模態視覺神經正在深度解析圖表中的機制箭頭、迴路與因果關係，請稍候...");

        try {
            const result = await analyzeImageWithGemini(imageFile, imagePromptContext, apiKey);
            result.deckName = resolveTargetDeckName(result.deckName);
            setExtractedData(result);
            setStatus("success");
            setStatusMsg("🎉 圖表認知解構完成！已提煉出因果鏈條與心智模型推演題。");
        } catch (err) {
            console.error("Image Analysis Error:", err);
            setStatus("error");
            setStatusMsg(err.message || "圖片解析失敗，請確認圖檔格式或重試。");
        } finally {
            setProcessing(false);
        }
    };

    // 處理開源論文擷取 (arXiv / PubMed / Europe PMC / DOI)
    const handleFetchPaper = async (customQuery = null) => {
        const query = (customQuery || paperInput || '').trim();
        if (!query) {
            setStatus("error");
            setStatusMsg("請輸入開源論文網址、DOI、PubMed ID、arXiv ID 或主題關鍵字。");
            return;
        }

        setFetchingPaper(true);
        setStatus("ideal");
        setStatusMsg("");

        try {
            const paper = await fetchOpenAccessPaper(query);
            setFetchedPaper(paper);
            if (customQuery) {
                setPaperInput(customQuery);
            }
            setStatus("success");
            setStatusMsg(`📄 已成功擷取論文：「${paper.title}」！`);
        } catch (err) {
            console.error("Paper Fetch Error:", err);
            setStatus("error");
            setStatusMsg(err.message || "論文擷取失敗，請確認輸入格式或網路狀態。");
        } finally {
            setFetchingPaper(false);
        }
    };

    // 處理開源論文認知解構與題庫生成
    const handleAnalyzePaper = async (useAI = true) => {
        if (!fetchedPaper) {
            setStatus("error");
            setStatusMsg("請先抓取論文內容。");
            return;
        }

        setProcessing(true);
        setStatus("ideal");
        setStatusMsg("正在以 NTU Smart MHI 理工心智模型進行全英文論文機制解構...");

        try {
            const paperContent = `${fetchedPaper.fullContentText}${paperNotes.trim() ? `\n\n[學生補充筆記 / 研討重點]:\n${paperNotes}` : ''}`;
            let result;
            if (useAI) {
                if (!apiKey) {
                    setShowKeyInput(true);
                    throw new Error("請先設定 Gemini API Key 才能進行深度 AI 理工直覺認知解構。");
                }
                result = await analyzeTextWithGemini(paperContent, apiKey);
            } else {
                result = parseOfflineText(paperContent);
            }

            // Suggest clean deck name based on paper
            const cleanTitle = fetchedPaper.title.replace(/^[^a-zA-Z0-9\u4e00-\u9fa5]+/, '').slice(0, 32);
            result.deckName = resolveTargetDeckName(cleanTitle);

            setExtractedData(result);
            setStatus("success");
            setStatusMsg("🎉 論文認知解構完成！已生成全英精讀段落、理工工程類比與機制題庫。");
        } catch (err) {
            console.error("Paper Analysis Error:", err);
            setStatus("error");
            setStatusMsg(err.message || "論文解構過程中發生錯誤。");
        } finally {
            setProcessing(false);
        }
    };

    // 儲存提取出的資料至 IndexedDB
    const handleCommitToLibrary = async () => {
        if (!extractedData || !extractedData.cards || extractedData.cards.length === 0) {
            setStatus("error");
            setStatusMsg("沒有可保存的卡片資料。");
            return;
        }

        try {
            const timestamp = Date.now();
            const deckName = extractedData.deckName || resolveTargetDeckName();

            const youtubeThumb = extractedData.videoId
                ? `https://img.youtube.com/vi/${extractedData.videoId}/hqdefault.jpg`
                : '';

            const newCards = extractedData.cards.map((card, idx) => ({
                id: `custom_${timestamp}_${idx}`,
                term_en: card.term_en || '',
                title: card.title,
                text_en: card.text_en || card.description,
                translation_zh: card.translation_zh || '',
                description: card.text_en || card.description,
                analogy: card.engineeringAnalogy || card.analogy || '',
                engineeringAnalogy: card.engineeringAnalogy || '',
                imagePath: (idx === 0 && imagePreview) ? imagePreview : youtubeThumb,
                videoUrl: extractedData.videoUrl || '',
                source: deckName,
                isCustom: true,
                glossary: idx === 0 ? (extractedData.glossary || []) : [],
                logicPairs: idx === 0 ? (extractedData.logicPairs || []) : [],
                mythBusters: idx === 0 ? (extractedData.mythBusters || []) : [],
                scenarios: idx === 0 ? (extractedData.scenarios || []) : [],
                mechanismChains: idx === 0 ? (extractedData.mechanismChains || []) : [],
                socraticQuestions: idx === 0 ? (extractedData.socraticQuestions || []) : []
            }));

            const existingCustomCards = (await getIDB('custom_cards')) || [];
            const previousCount = existingCustomCards.filter(c => c.source === deckName).length;
            const mergedCards = [...existingCustomCards, ...newCards];
            await setIDB('custom_cards', mergedCards);

            const isAppended = previousCount > 0;
            setStatus("success");
            setStatusMsg(
                isAppended
                    ? `🎉 成功追加 ${newCards.length} 張卡片至「${deckName}」！（目前該分類累計 ${previousCount + newCards.length} 張）`
                    : `🎉 成功建立新牌組「${deckName}」，共匯入 ${newCards.length} 張概念卡片與配套理解題！`
            );

            setExtractedData(null);
            setInputText('');
            setAudioFile(null);
            setYoutubeUrl('');
            setImageFile(null);
            setImagePreview(null);
            setImagePromptContext('');
            setNewDeckName('');

            fetchStoredDecks();
            if (onDeckUpdate) onDeckUpdate();
        } catch (error) {
            console.error("Save Error:", error);
            setStatus("error");
            setStatusMsg("寫入牌組庫失敗。");
        }
    };

    // PDF 處理邏輯 (支援自選分類)
    const processPdfFile = async (file) => {
        if (file.type !== 'application/pdf') {
            setStatus("error");
            setStatusMsg("請上傳有效的 PDF 簡報檔案。");
            return;
        }

        try {
            setProcessing(true);
            setProgress(0);
            setStatus("ideal");
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument(arrayBuffer);
            const pdf = await loadingTask.promise;

            const totalPages = pdf.numPages;
            const newCards = [];
            const timestamp = Date.now();
            const defaultSource = file.name.replace('.pdf', '');
            const deckName = resolveTargetDeckName(defaultSource);

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const lines = textContent.items.map(item => item.str).filter(line => line.trim().length > 0);

                const title = lines.length > 0 ? lines[0] : `Page ${i}`;
                const description = lines.length > 1 ? lines.slice(1).join('\n') : "未提取到文字說明。";

                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;
                const imagePath = canvas.toDataURL('image/jpeg', 0.8);

                newCards.push({
                    id: `custom_${timestamp}_${i}`,
                    title: title,
                    description: description,
                    imagePath: imagePath,
                    source: deckName,
                    page: i,
                    isCustom: true
                });

                setProgress(Math.round((i / totalPages) * 100));
            }

            const existingCustomCards = (await getIDB('custom_cards')) || [];
            const previousCount = existingCustomCards.filter(c => c.source === deckName).length;
            const mergedCards = [...existingCustomCards, ...newCards];
            await setIDB('custom_cards', mergedCards);

            setStatus("success");
            setStatusMsg(
                previousCount > 0
                    ? `🎉 成功追加 ${newCards.length} 張 PDF 卡片至「${deckName}」！（累計 ${previousCount + newCards.length} 張）`
                    : `🎉 成功從 PDF 建立「${deckName}」，共匯入 ${newCards.length} 張簡報卡片！`
            );
            fetchStoredDecks();
            if (onDeckUpdate) onDeckUpdate();
        } catch (err) {
            console.error("PDF Processing Error:", err);
            setStatus("error");
            setStatusMsg("PDF 解析失敗，請確認檔案格式是否受損。");
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    };

    return (
        <div className="w-full max-w-5xl h-full flex flex-col p-4 overflow-y-auto custom-scrollbar">
            {/* 頂部標題與 API Key 設定 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-purple-300 to-indigo-400">
                        知識卡片與理解遊戲生成中心
                    </h1>
                    <p className="text-gray-400 text-xs md:text-sm mt-1">
                        可按課程分類上傳 YouTube 影片、課堂錄音、文字筆記或投影片簡報，累積屬於您的考科題庫
                    </p>
                </div>

                <button
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-xs text-gray-300 transition-colors"
                >
                    <Key className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{apiKey ? "Gemini Key 已設定" : "設定 Gemini API Key"}</span>
                </button>
            </div>

            {/* API Key 輸入彈窗/展開條 */}
            {showKeyInput && (
                <div className="mb-5 p-4 bg-gray-850 rounded-2xl border border-yellow-500/30 flex flex-col gap-3 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
                            <Key className="w-4 h-4" /> Google Gemini API Key
                        </span>
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-400 hover:underline"
                        >
                            免費取得 API Key ↗
                        </a>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            placeholder="貼上您的 Gemini API Key (例如：AIzaSy...)"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                        />
                        <button
                            onClick={handleSaveApiKey}
                            className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold text-xs rounded-xl transition-all"
                        >
                            保存
                        </button>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-normal">
                        Key 只會保存在您的本機瀏覽器中，直接呼叫 Google API，不會傳送至任何第三方伺服器。
                    </p>
                </div>
            )}

            {/* ================= 智慧分類選擇面板 (Deck Category Selector) ================= */}
            <div className="mb-5 p-4 bg-gradient-to-r from-gray-850 via-gray-900 to-gray-850 rounded-2xl border border-indigo-500/30 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-300">
                            目標牌組分類 (指定本次內容存入哪個科目/單元)
                        </span>
                    </div>

                    {storedDecks.length > 0 && (
                        <div className="flex items-center bg-gray-800 p-0.5 rounded-xl border border-gray-700 text-xs">
                            <button
                                onClick={() => setCategoryMode('existing')}
                                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                    categoryMode === 'existing'
                                        ? 'bg-indigo-600 text-white shadow'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <FolderCheck className="w-3.5 h-3.5" />
                                <span>追加至現有牌組</span>
                            </button>
                            <button
                                onClick={() => setCategoryMode('new')}
                                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                    categoryMode === 'new'
                                        ? 'bg-purple-600 text-white shadow'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <FolderPlus className="w-3.5 h-3.5" />
                                <span>＋ 建立新牌組</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* 模式 A：追加至現有分類 */}
                {categoryMode === 'existing' && storedDecks.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <select
                            value={selectedExistingDeck}
                            onChange={(e) => setSelectedExistingDeck(e.target.value)}
                            className="bg-gray-800 border border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 flex-1 font-bold"
                        >
                            {storedDecks.map((deck) => (
                                <option key={deck.name} value={deck.name}>
                                    📂 {deck.name}（目前已有 {deck.count} 張卡片與題目）
                                </option>
                            ))}
                        </select>
                        <span className="text-xs text-indigo-300/80 bg-indigo-950/40 px-3 py-2 rounded-xl border border-indigo-500/20 whitespace-nowrap">
                            ⚡ 上傳後將自動與該牌組既有題庫合併
                        </span>
                    </div>
                ) : (
                    /* 模式 B：新建分類 */
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input
                            type="text"
                            placeholder="輸入新的牌組或課程名稱（例如：神經生理學期中考、生物化學第二章...）"
                            value={newDeckName}
                            onChange={(e) => setNewDeckName(e.target.value)}
                            className="flex-1 bg-gray-800 border border-purple-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 placeholder-gray-500"
                        />
                        <span className="text-xs text-purple-300/80 bg-purple-950/40 px-3 py-2 rounded-xl border border-purple-500/20 whitespace-nowrap">
                            ✨ 若留空將由 AI 自動根據內容命名
                        </span>
                    </div>
                )}
            </div>

            {/* 匯入來源 Tab 選單 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-gray-900/80 p-1.5 rounded-2xl border border-gray-800 mb-5">
                <button
                    onClick={() => { setActiveTab('youtube'); setExtractedData(null); }}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'youtube'
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Youtube className="w-4 h-4 text-red-300" /> YouTube
                </button>
                <button
                    onClick={() => { setActiveTab('paper'); setExtractedData(null); }}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'paper'
                            ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <BookOpenCheck className="w-4 h-4 text-amber-300" /> 📜 開源論文
                </button>
                <button
                    onClick={() => { setActiveTab('image'); setExtractedData(null); }}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'image'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Camera className="w-4 h-4 text-emerald-300" /> 📸 截圖/圖表
                </button>
                <button
                    onClick={() => { setActiveTab('text'); setExtractedData(null); }}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'text'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <FileText className="w-4 h-4 text-indigo-300" /> 文字筆記
                </button>
                <button
                    onClick={() => { setActiveTab('audio'); setExtractedData(null); }}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'audio'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <FileAudio className="w-4 h-4 text-purple-300" /> 錄音降噪
                </button>
                <button
                    onClick={() => { setActiveTab('pdf'); setExtractedData(null); }}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'pdf'
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Layers className="w-4 h-4 text-blue-300" /> 投影片 PDF
                </button>
            </div>

            {/* 狀態訊息提示 */}
            {status !== 'ideal' && (
                <div className={`mb-5 p-4 rounded-xl border flex items-center gap-3 text-sm ${
                    status === 'success'
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                    {status === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    <span>{statusMsg}</span>
                </div>
            )}

            {/* ================= Tab 1: YouTube 影片提煉 ================= */}
            {activeTab === 'youtube' && !extractedData && (
                <div className="flex flex-col gap-4 bg-gray-850 p-6 rounded-3xl border border-gray-800">
                    <div>
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                            <Youtube className="w-5 h-5 text-red-500" /> 貼上 YouTube 影片網址
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            專為「老師指定 YouTube 影片考試內容」打造！Gemini 直接觀看影片、聽取講解並提煉考點。
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="貼上 YouTube 連結，例如: https://www.youtube.com/watch?v=... 或 https://youtu.be/..."
                            className="p-3.5 bg-gray-900 border border-gray-700/80 rounded-2xl text-gray-100 text-sm focus:outline-none focus:border-red-500 font-mono"
                        />

                        {detectedVideoId && (
                            <div className="p-4 bg-gray-900/90 rounded-2xl border border-gray-750 flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
                                <div className="relative w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-black shrink-0 border border-gray-700">
                                    <img
                                        src={`https://img.youtube.com/vi/${detectedVideoId}/hqdefault.jpg`}
                                        alt="YouTube 縮圖"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center text-white shadow-lg">
                                            <Video className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-1">
                                        已識別 YouTube 影片 ID: {detectedVideoId}
                                    </span>
                                    <p className="text-sm font-semibold text-white">
                                        目標牌組：【{resolveTargetDeckName("AI 建議名稱")}】
                                    </p>
                                    <a
                                        href={youtubeUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-blue-400 hover:underline mt-1.5 inline-flex items-center gap-1"
                                    >
                                        在新分頁開啟影片確認 ↗
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            disabled={processing || !detectedVideoId}
                            onClick={handleAnalyzeYouTube}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                !detectedVideoId
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white shadow-lg shadow-red-500/20'
                            }`}
                        >
                            {processing ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    <span>AI 觀看影片與深入解構中...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-yellow-300" />
                                    <span>AI 影片考點解構與生成遊戲</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ================= Tab 2: 文字段落提取 ================= */}
            {activeTab === 'text' && !extractedData && (
                <div className="flex flex-col gap-4 bg-gray-850 p-6 rounded-3xl border border-gray-800">
                    <div>
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-400" /> 貼上抽象筆記或課文長文
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            目標牌組：【{resolveTargetDeckName("AI 建議名稱")}】。系統將進行認知解構並提煉因果鏈與迷思題。
                        </p>
                    </div>

                    <textarea
                        rows={8}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="請在此貼上課文段落、講義文字或你的抽象筆記..."
                        className="w-full p-4 bg-gray-900 border border-gray-700/80 rounded-2xl text-gray-100 text-sm focus:outline-none focus:border-indigo-500 leading-relaxed font-mono custom-scrollbar"
                    />

                    <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                        <button
                            disabled={processing}
                            onClick={() => handleAnalyzeText(false)}
                            className="px-5 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 text-gray-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                            <span>離線基礎提取 (免 API)</span>
                        </button>
                        <button
                            disabled={processing}
                            onClick={() => handleAnalyzeText(true)}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    <span>AI 深度解構中...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-yellow-300" />
                                    <span>AI 認知解構與生成遊戲</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ================= Tab 3: 錄音檔上傳 ================= */}
            {activeTab === 'audio' && !extractedData && (
                <div className="flex flex-col gap-4 bg-gray-850 p-6 rounded-3xl border border-gray-800">
                    <div>
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                            <FileAudio className="w-4 h-4 text-purple-400" /> 上傳手機 / 錄音筆音訊檔案
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            目標牌組：【{resolveTargetDeckName("AI 建議名稱")}】。內建降噪播放器，先試聽更清晰再送出提煉。
                        </p>
                    </div>

                    {!audioFile ? (
                        <div
                            onClick={() => audioInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-700 hover:border-purple-500/60 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all bg-gray-900/50 hover:bg-gray-900 group"
                        >
                            <input
                                ref={audioInputRef}
                                type="file"
                                accept="audio/*,.mp3,.m4a,.wav,.aac,.webm,.ogg"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setAudioFile(e.target.files[0]);
                                    }
                                }}
                            />
                            <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-600/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                                <Mic className="w-8 h-8" />
                            </div>
                            <p className="text-white font-bold text-base mb-1">
                                點擊此處選擇或拖曳課堂錄音檔
                            </p>
                            <p className="text-xs text-gray-500">
                                支援常見格式：.mp3, .m4a, .wav, .aac (內建空調雜訊濾除與人聲增強試聽)
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <input
                                ref={audioInputRef}
                                type="file"
                                accept="audio/*,.mp3,.m4a,.wav,.aac,.webm,.ogg"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setAudioFile(e.target.files[0]);
                                    }
                                }}
                            />
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-purple-300 font-bold">
                                    💡 提示：點擊下方播放鍵試聽，可隨時切換「降噪」與「原音」親耳確認清晰度。
                                </span>
                                <button
                                    onClick={() => audioInputRef.current?.click()}
                                    className="text-xs text-gray-400 hover:text-white underline"
                                >
                                    更換音訊檔案
                                </button>
                            </div>

                            <AudioDenoisePlayer
                                file={audioFile}
                                onConfirmDenoised={handleAnalyzeAudio}
                                isAnalyzing={processing}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ================= Tab 4: PDF 講義簡報 ================= */}
            {activeTab === 'pdf' && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            processPdfFile(e.dataTransfer.files[0]);
                        }
                    }}
                    className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all ${
                        isDragging
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 bg-gray-850 hover:border-gray-600'
                    }`}
                >
                    <input
                        type="file"
                        accept="application/pdf"
                        id="pdf-upload"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                processPdfFile(e.target.files[0]);
                            }
                        }}
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-blue-950/60 border border-blue-600/30 flex items-center justify-center text-blue-400 mb-4">
                            <Upload className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">上傳講義 / 簡報 PDF</h3>
                        <p className="text-gray-400 text-xs mb-2">
                            目標牌組：【{resolveTargetDeckName("預設以 PDF 檔名為準")}】
                        </p>
                        <p className="text-gray-500 text-[11px] mb-4">拖曳或點選以解析投影片截圖與大綱</p>
                        <span className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all">
                            選擇 PDF 檔案
                        </span>
                    </label>

                    {processing && progress > 0 && (
                        <div className="w-full max-w-md mt-6">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>投影片頁面擷取中...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ================= Tab 5: 截圖/黑板圖表認知解構 (支援 Ctrl+V) ================= */}
            {activeTab === 'image' && !extractedData && (
                <div className="flex flex-col gap-4 bg-gray-850 p-6 rounded-3xl border border-gray-800">
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <Camera className="w-4 h-4 text-emerald-400" /> 📸 課堂黑板圖表 / 講義截圖認知解構
                            </h3>
                            <span className="text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1 font-mono">
                                <Clipboard className="w-3.5 h-3.5" /> 支援 Ctrl + V 剪貼簿直接貼上
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            目標牌組：【{resolveTargetDeckName("AI 視覺解構圖表")}】。Gemini 多模態神經網路將自動逆向解析圖中箭頭、受體迴路與因果關係，轉譯為理工心智模型。
                        </p>
                    </div>

                    {imagePreview ? (
                        <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-900 rounded-2xl border border-emerald-500/30">
                            <div className="md:w-1/2 flex flex-col items-center justify-center bg-gray-950 rounded-xl p-2 border border-gray-800">
                                <img
                                    src={imagePreview}
                                    alt="Pasted/Uploaded"
                                    className="max-h-64 object-contain rounded-lg shadow-md"
                                />
                                <button
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    className="mt-2 text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> 移除重新選取
                                </button>
                            </div>

                            <div className="md:w-1/2 flex flex-col justify-between gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-300 block mb-1">
                                        補充提示說明（選填，加強特定焦點）：
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={imagePromptContext}
                                        onChange={(e) => setImagePromptContext(e.target.value)}
                                        placeholder="例如：這是動作電位傳導與離子通道開閉的機制圖，請著重解構電位敏感型鈉/鉀通道與 RC 充放電類比..."
                                        className="w-full p-3 bg-gray-850 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 placeholder-gray-500 custom-scrollbar"
                                    />
                                </div>

                                <button
                                    disabled={processing}
                                    onClick={handleAnalyzeImage}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            <span>AI 多模態視覺神經深度解構中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 text-yellow-300" />
                                            <span>開始認知解構與推演提煉</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => imageInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-700 hover:border-emerald-500/60 bg-gray-900/60 hover:bg-emerald-950/10 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all"
                        >
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        setImageFile(file);
                                        setImagePreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                            <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                                <Camera className="w-7 h-7" />
                            </div>
                            <h4 className="text-white font-bold text-sm mb-1">點擊上傳圖片，或在任何位置直接按下 Ctrl + V 貼上螢幕截圖</h4>
                            <p className="text-gray-400 text-xs text-center max-w-md">
                                適用於老師黑板上的手繪機制圖、教材架構圖、投影片流程圖或醫學文獻示意圖
                            </p>
                            <span className="mt-4 px-4 py-1.5 bg-gray-800 hover:bg-gray-750 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all">
                                選擇圖片檔案
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ================= Tab 6: 開源論文與文獻自動抓取 (arXiv / Europe PMC / PubMed / DOI) ================= */}
            {activeTab === 'paper' && !extractedData && (
                <div className="flex flex-col gap-4 bg-gray-850 p-6 rounded-3xl border border-gray-800">
                    <div>
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                            <BookOpenCheck className="w-5 h-5 text-amber-400" /> 貼上開源論文連結、DOI 或 PubMed ID
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            支援 arXiv、PubMed (PMID)、Europe PMC (PMCID)、DOI、bioRxiv 等開源論文。系統自動抓取純英文學術摘要與機轉，並轉化為全英精讀段落與理工工程直覺題庫！
                        </p>
                    </div>

                    {/* 快速示範選鈕 (Quick Example Pills) */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-gray-500">快速試用經典範例：</span>
                        <button
                            type="button"
                            onClick={() => handleFetchPaper("28285215")}
                            className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-750 text-amber-300 border border-amber-500/30 text-xs font-mono transition-colors"
                            title="PubMed ID: 28285215"
                        >
                            🧬 TET1 去甲基化機制 (PubMed)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFetchPaper("10.1038/s41586-024-07487-w")}
                            className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-750 text-cyan-300 border border-cyan-500/30 text-xs font-mono transition-colors"
                            title="DOI: 10.1038/s41586-024-07487-w"
                        >
                            ⚡ AlphaFold 3 全分子對接 (DOI)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFetchPaper("1706.03762")}
                            className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-750 text-purple-300 border border-purple-500/30 text-xs font-mono transition-colors"
                            title="arXiv ID: 1706.03762"
                        >
                            🤖 Attention Is All You Need (arXiv)
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={paperInput}
                            onChange={(e) => setPaperInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleFetchPaper();
                                }
                            }}
                            placeholder="貼上論文網址、DOI (例如 10.1038/...)、PMID、arXiv ID 或主題關鍵字..."
                            className="flex-1 p-3.5 bg-gray-900 border border-gray-700/80 rounded-2xl text-gray-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
                        />
                        <button
                            disabled={fetchingPaper || !paperInput.trim()}
                            onClick={() => handleFetchPaper()}
                            className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs md:text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
                        >
                            {fetchingPaper ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    <span>抓取開源論文中...</span>
                                </>
                            ) : (
                                <>
                                    <Globe className="w-4 h-4" />
                                    <span>抓取論文資料</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* 論文擷取成果卡片 (Fetched Paper Card) */}
                    {fetchedPaper && (
                        <div className="p-5 bg-gray-900/90 rounded-2xl border border-amber-500/40 flex flex-col gap-4 animate-fade-in shadow-xl">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-gray-800 pb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/50 text-amber-300">
                                            來源：{fetchedPaper.source}
                                        </span>
                                        {fetchedPaper.doi && (
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-800 text-gray-300">
                                                DOI: {fetchedPaper.doi}
                                            </span>
                                        )}
                                        {fetchedPaper.pmid && (
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-800 text-gray-300">
                                                PMID: {fetchedPaper.pmid}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-base md:text-lg font-black text-white font-mono leading-snug">
                                        {fetchedPaper.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {fetchedPaper.authors} {fetchedPaper.journal ? `· ${fetchedPaper.journal}` : ''} {fetchedPaper.year ? `(${fetchedPaper.year})` : ''}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setFetchedPaper(null)}
                                    className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                                    title="清除重新輸入"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* 論文純英文學術摘要 (Abstract) */}
                            <div>
                                <span className="text-xs font-bold text-amber-300 block mb-1">
                                    全英文學術摘要 (Academic Abstract)：
                                </span>
                                <div className="p-3.5 bg-gray-950/60 rounded-xl border border-gray-800 text-xs md:text-sm text-gray-200 leading-relaxed font-sans max-h-56 overflow-y-auto custom-scrollbar select-text">
                                    {fetchedPaper.abstract || "已取得論文元資料，未含獨立摘要文字。"}
                                </div>
                            </div>

                            {/* 學生補充筆記 / 研討會提問 (可選) */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-1">
                                    課堂補充筆記 / 指定研討重點（可選，將一併納入心智模型分析）：
                                </label>
                                <textarea
                                    rows={2}
                                    value={paperNotes}
                                    onChange={(e) => setPaperNotes(e.target.value)}
                                    placeholder="例如：請著重以電機反饋迴路類比酵素活性調控；特別標註 TET1 與 TDG 的因果關係..."
                                    className="w-full p-2.5 bg-gray-950/80 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2 border-t border-gray-800">
                                <button
                                    disabled={processing}
                                    onClick={() => handleAnalyzePaper(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 text-gray-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <span>離線基礎提取 (免 API)</span>
                                </button>
                                <button
                                    disabled={processing}
                                    onClick={() => handleAnalyzePaper(true)}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            <span>AI 理工直覺深度解構論文中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 text-yellow-300" />
                                            <span>開始理工直覺認知解構 (含純英文精讀段落)</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ================= 預覽與編輯區塊 (Extracted Preview) ================= */}
            {extractedData && (
                <div className="mt-6 flex flex-col gap-6 bg-gray-850 p-6 md:p-8 rounded-3xl border border-indigo-500/40 shadow-2xl animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-700">
                        <div className="flex-1">
                            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 flex items-center gap-1.5">
                                {extractedData.videoId && <Youtube className="w-4 h-4 text-red-400" />}
                                提煉預覽與微調
                            </span>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="text-xs text-gray-400 font-bold">歸屬牌組：</span>
                                <input
                                    type="text"
                                    value={extractedData.deckName}
                                    onChange={(e) => setExtractedData({ ...extractedData, deckName: e.target.value })}
                                    className="bg-gray-900 border border-indigo-500/60 rounded-xl px-3 py-1 text-sm font-bold text-white focus:outline-none focus:border-indigo-400"
                                    title="點擊可直接修改存入的牌組名稱"
                                />
                                {storedDecks.some(d => d.name === extractedData.deckName) && (
                                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                                        ⚡ 將追加至現有分類中
                                    </span>
                                )}
                            </div>
                            {extractedData.summary && (
                                <p className="text-xs text-indigo-200 mt-2 italic">
                                    「{extractedData.summary}」
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={() => setExtractedData(null)}
                                className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-gray-700 hover:bg-gray-800 text-xs font-bold text-gray-300"
                            >
                                放棄重來
                            </button>
                            <button
                                onClick={handleCommitToLibrary}
                                className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs md:text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> 確認存入牌組庫
                            </button>
                        </div>
                    </div>

                    {/* NTU Smart MHI 全英專有名詞庫預覽 */}
                    {extractedData.glossary && extractedData.glossary.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2">
                                <span>🔤 NTU Smart MHI 全英專有名詞高頻錨定 ({extractedData.glossary.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {extractedData.glossary.map((term, gIdx) => (
                                    <div key={gIdx} className="bg-gray-900/90 p-4 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="font-extrabold text-white text-base font-mono text-emerald-300">
                                                    {term.term_en}
                                                </h4>
                                                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 font-bold whitespace-nowrap">
                                                    {term.term_zh}
                                                </span>
                                            </div>
                                            {term.engineeringAnchor && (
                                                <div className="mt-2 text-xs text-cyan-300 bg-cyan-950/30 p-2 rounded-xl border border-cyan-500/20 font-mono">
                                                    ⚡ 理工對等：{term.engineeringAnchor}
                                                </div>
                                            )}
                                            {term.etymology && (
                                                <p className="text-[11px] text-amber-300/80 mt-1.5 italic">
                                                    🌱 詞根拆解：{term.etymology}
                                                </p>
                                            )}
                                            {term.definition_en && (
                                                <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                                                    {term.definition_en}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 卡片清單預覽 */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                            <span>🗂️ 理工心智模型推演卡 ({extractedData.cards?.length || 0})</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {extractedData.cards?.map((card, idx) => (
                                <div key={idx} className="bg-gray-900/90 p-4 rounded-2xl border border-gray-750 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-indigo-400">
                                                {card.term_en ? `${card.term_en} · ` : ''}#{idx + 1} 機制
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const updated = extractedData.cards.filter((_, i) => i !== idx);
                                                    setExtractedData({ ...extractedData, cards: updated });
                                                }}
                                                className="text-gray-500 hover:text-red-400 p-1"
                                                title="刪除此張"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <h4 className="font-bold text-white text-base mt-1">{card.title}</h4>
                                        {(card.engineeringAnalogy || card.analogy) && (
                                            <p className="text-xs text-cyan-300 mt-1 bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/20 font-mono">
                                                ⚡ 理工工程類比：{card.engineeringAnalogy || card.analogy}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-300 mt-2 leading-relaxed whitespace-pre-wrap">
                                            {card.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 配套深層推演指標摘要 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                        <div className="bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-500/20">
                            <span className="text-xs font-bold text-emerald-400 block mb-1">🔤 英文專有名詞</span>
                            <span className="text-xl font-black text-white">{extractedData.glossary?.length || 0}</span>
                            <p className="text-[10px] text-gray-400 mt-0.5">全英考試眼熟度</p>
                        </div>
                        <div className="bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-500/20">
                            <span className="text-xs font-bold text-indigo-400 block mb-1">⛓️ 因果骨牌鏈</span>
                            <span className="text-xl font-black text-white">{extractedData.mechanismChains?.length || 0}</span>
                            <p className="text-[10px] text-gray-400 mt-0.5">步進干擾模擬</p>
                        </div>
                        <div className="bg-purple-950/30 p-3.5 rounded-2xl border border-purple-500/20">
                            <span className="text-xs font-bold text-purple-400 block mb-1">🏛️ 蘇格拉底探究</span>
                            <span className="text-xl font-black text-white">{extractedData.socraticQuestions?.length || 0}</span>
                            <p className="text-[10px] text-gray-400 mt-0.5">思維鷹架指引</p>
                        </div>
                        <div className="bg-pink-950/30 p-3.5 rounded-2xl border border-pink-500/20">
                            <span className="text-xs font-bold text-pink-400 block mb-1">🛡️ 思維盲點校準</span>
                            <span className="text-xl font-black text-white">{extractedData.mythBusters?.length || 0}</span>
                            <p className="text-[10px] text-gray-400 mt-0.5">直覺誤區剖析</p>
                        </div>
                        <div className="bg-cyan-950/30 p-3.5 rounded-2xl border border-cyan-500/20">
                            <span className="text-xs font-bold text-cyan-400 block mb-1">🧩 因果邏輯連鎖</span>
                            <span className="text-xl font-black text-white">{extractedData.logicPairs?.length || 0}</span>
                            <p className="text-[10px] text-gray-400 mt-0.5">條件配對推導</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= 模組與知識庫管理中心 (Module Management & Consolidation Hub) ================= */}
            <div className="mt-12 pt-8 border-t border-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                                <Database className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                                    <span>模組知識庫管理中心</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-mono">
                                        {storedDecks.length} 個模組單元
                                    </span>
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    可獨立刪除任何自訂或預設模組，或將多個章節內容一鍵合併為大單元整合模組
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
                        {deletedDecksCount > 0 && (
                            <button
                                onClick={handleRestoreDefaultDecks}
                                className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-xs font-bold text-gray-300 flex items-center gap-1.5 transition-all"
                                title="還原被刪除的內建預設模組"
                            >
                                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                                <span>還原預設模組 ({deletedDecksCount})</span>
                            </button>
                        )}
                        <button
                            onClick={() => openMergeModal()}
                            disabled={storedDecks.length < 2}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                                storedDecks.length >= 2
                                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-500/20 hover:scale-[1.02]'
                                    : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                            }`}
                            title={storedDecks.length < 2 ? "需要至少 2 個模組才能進行合併" : "勾選多個模組進行深層整合"}
                        >
                            <GitMerge className="w-4 h-4 text-cyan-300" />
                            <span>合併模組內容</span>
                        </button>
                    </div>
                </div>

                {storedDecks.length === 0 ? (
                    <div className="p-8 text-center bg-gray-850/60 rounded-2xl border border-gray-800">
                        <Database className="w-10 h-10 text-gray-600 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-bold text-gray-400">目前題庫中暫無任何模組</p>
                        <p className="text-xs text-gray-500 mt-1">
                            可點擊上方上傳 YouTube 影片、貼上講義文本、錄音或 PDF，或點擊「還原預設模組」重新載入。
                        </p>
                        {deletedDecksCount > 0 && (
                            <button
                                onClick={handleRestoreDefaultDecks}
                                className="mt-4 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                            >
                                立即還原預設牌組
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        {storedDecks.map((deck) => (
                            <div
                                key={deck.name}
                                className="bg-gray-850/90 hover:bg-gray-800 p-4 rounded-2xl border border-gray-750 hover:border-indigo-500/50 flex flex-col justify-between group transition-all shadow-md"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                                deck.isCustom
                                                    ? 'bg-purple-950/70 text-purple-300 border-purple-500/30'
                                                    : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
                                            }`}>
                                                {deck.isCustom ? "自訂匯入" : "內建預設"}
                                            </span>
                                            {deck.glossaryCount > 0 && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-500/20">
                                                    🔤 {deck.glossaryCount} 專有名詞
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <h4 className="font-extrabold text-white text-sm leading-snug line-clamp-2" title={deck.name}>
                                        {deck.name}
                                    </h4>
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        共 <span className="font-mono text-gray-200 font-bold">{deck.count}</span> 張卡片與心智推演
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-750 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => openMergeModal(deck.name)}
                                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/20 flex items-center gap-1 transition-all"
                                        title="以此模組為基礎與其他模組合併"
                                    >
                                        <GitMerge className="w-3.5 h-3.5" />
                                        <span>合併</span>
                                    </button>

                                    <button
                                        onClick={() => handleDeleteDeck(deck.name)}
                                        className="text-xs font-bold text-gray-500 hover:text-red-400 hover:bg-red-950/30 p-1.5 rounded-lg transition-all"
                                        title={`刪除「${deck.name}」模組`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ================= 合併模組彈跳視窗 (Merge Modules Modal) ================= */}
            {isMergeModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-gray-900 border border-indigo-500/40 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        {/* 彈窗頂部 */}
                        <div className="flex justify-between items-start pb-4 border-b border-gray-800">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                                    <GitMerge className="w-5 h-5 text-cyan-400" />
                                    <span>合併模組內容 (Consolidate Modules)</span>
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    將所選模組的卡片、全英專有名詞庫與因果推演模型深度融合為單一整合模組
                                </p>
                            </div>
                            <button
                                onClick={() => setIsMergeModalOpen(false)}
                                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 步驟一：選擇模組 */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                                    1. 勾選要合併的模組（已勾選 {selectedDecksToMerge.length} 個）
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const allNames = storedDecks.map(d => d.name);
                                            setSelectedDecksToMerge(allNames);
                                            setMergedTargetName(allNames.slice(0, 3).join(' + ') + (allNames.length > 3 ? '...' : ''));
                                        }}
                                        className="text-[11px] text-cyan-400 hover:underline font-bold"
                                    >
                                        全選
                                    </button>
                                    <span className="text-gray-600 text-xs">|</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedDecksToMerge([]);
                                            setMergedTargetName('');
                                        }}
                                        className="text-[11px] text-gray-400 hover:underline"
                                    >
                                        清空
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar p-2 bg-gray-950/70 rounded-2xl border border-gray-800">
                                {storedDecks.map((deck) => {
                                    const isChecked = selectedDecksToMerge.includes(deck.name);
                                    return (
                                        <div
                                            key={deck.name}
                                            onClick={() => toggleDeckSelectionForMerge(deck.name)}
                                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                                isChecked
                                                    ? 'bg-indigo-950/40 border-indigo-500/60 text-white'
                                                    : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:border-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                <div className="shrink-0 text-indigo-400">
                                                    {isChecked ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4 text-gray-500" />}
                                                </div>
                                                <div className="truncate">
                                                    <span className="text-sm font-bold truncate block">{deck.name}</span>
                                                    <span className="text-[11px] text-gray-400">
                                                        {deck.count} 張卡片 {deck.glossaryCount > 0 ? `· ${deck.glossaryCount} 詞彙` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 shrink-0 font-mono">
                                                {deck.isCustom ? '自訂' : '預設'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 步驟二：指定合併後模組名稱 */}
                        <div>
                            <label className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 block mb-1.5">
                                2. 合併後新模組名稱
                            </label>
                            <input
                                type="text"
                                value={mergedTargetName}
                                onChange={(e) => setMergedTargetName(e.target.value)}
                                placeholder="例如：NTU MHI 期中整合複習模組"
                                className="w-full bg-gray-950 border border-gray-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                            />
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                                <span className="text-[11px] text-gray-400">快速填入：</span>
                                {selectedDecksToMerge.map(deckName => (
                                    <button
                                        key={deckName}
                                        type="button"
                                        onClick={() => setMergedTargetName(deckName)}
                                        className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-750 text-cyan-300 border border-gray-700 transition-colors"
                                        title={`以此現有模組名稱覆蓋合併`}
                                    >
                                        合併至「{deckName}」
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 步驟三：選項 */}
                        <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800">
                            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300 select-none">
                                <input
                                    type="checkbox"
                                    checked={deleteOriginalsAfterMerge}
                                    onChange={(e) => setDeleteOriginalsAfterMerge(e.target.checked)}
                                    className="w-4 h-4 rounded text-cyan-500 bg-gray-900 border-gray-700 focus:ring-0 focus:ring-offset-0"
                                />
                                <span>
                                    合併後刪除/隱藏原本被合併的個別模組 <span className="text-gray-400 font-normal">（推薦勾選，保持模組清單簡潔）</span>
                                </span>
                            </label>
                        </div>

                        {/* 底部按鈕 */}
                        <div className="flex gap-3 justify-end pt-3 border-t border-gray-800">
                            <button
                                type="button"
                                onClick={() => setIsMergeModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 text-xs font-bold text-gray-300 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteMerge}
                                disabled={selectedDecksToMerge.length < 2 || !mergedTargetName.trim() || mergeProcessing}
                                className={`px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg transition-all ${
                                    selectedDecksToMerge.length >= 2 && mergedTargetName.trim() && !mergeProcessing
                                        ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-cyan-500/20 hover:scale-[1.02]'
                                        : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                                }`}
                            >
                                {mergeProcessing ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        <span>正在執行深層融合...</span>
                                    </>
                                ) : (
                                    <>
                                        <GitMerge className="w-4 h-4 text-cyan-300" />
                                        <span>確認執行模組合併</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportMode;
