import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { set as setIDB, get as getIDB } from 'idb-keyval';
import {
    Upload, FileText, CheckCircle, AlertCircle, Loader, Trash2, Database,
    Sparkles, Mic, Key, Edit3, Plus, ArrowRight, HelpCircle, FileAudio, Layers,
    Youtube, Video, ExternalLink
} from 'lucide-react';
import {
    getGeminiApiKey, setGeminiApiKey, analyzeTextWithGemini, analyzeAudioWithGemini,
    analyzeYouTubeWithGemini, extractYouTubeVideoId, parseOfflineText
} from '../services/geminiService';

// Configure PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ImportMode = ({ onDeckUpdate }) => {
    const [activeTab, setActiveTab] = useState('youtube'); // 'youtube', 'text', 'audio', 'pdf'

    // Status & Common States
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("ideal"); // ideal, success, error
    const [statusMsg, setStatusMsg] = useState("");
    const [storedDecks, setStoredDecks] = useState([]);

    // API Key State
    const [apiKey, setApiKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);

    // Text Tab States
    const [inputText, setInputText] = useState('');
    const [customDeckName, setCustomDeckName] = useState('');

    // Audio Tab States
    const [audioFile, setAudioFile] = useState(null);
    const audioInputRef = useRef(null);

    // YouTube Tab States
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const detectedVideoId = extractYouTubeVideoId(youtubeUrl);

    // PDF Drag State
    const [isDragging, setIsDragging] = useState(false);

    // AI 提煉後的預覽與編輯資料
    const [extractedData, setExtractedData] = useState(null); // { deckName, summary, cards, logicPairs, mythBusters, scenarios, videoId, videoUrl }

    useEffect(() => {
        setApiKey(getGeminiApiKey());
        fetchStoredDecks();
    }, []);

    const fetchStoredDecks = async () => {
        const customCards = await getIDB('custom_cards');
        if (customCards && Array.isArray(customCards)) {
            const deckMap = {};
            customCards.forEach(card => {
                deckMap[card.source] = (deckMap[card.source] || 0) + 1;
            });
            setStoredDecks(Object.entries(deckMap).map(([name, count]) => ({ name, count })));
        } else {
            setStoredDecks([]);
        }
    };

    const handleSaveApiKey = () => {
        setGeminiApiKey(apiKey);
        setShowKeyInput(false);
        setStatus("success");
        setStatusMsg("API Key 已成功保存於本機瀏覽器。");
    };

    const handleDeleteDeck = async (deckName) => {
        if (!confirm(`確定要刪除牌組「${deckName}」嗎？`)) return;

        try {
            const customCards = await getIDB('custom_cards') || [];
            const updatedCards = customCards.filter(card => card.source !== deckName);
            await setIDB('custom_cards', updatedCards);

            setStatus("success");
            setStatusMsg(`已刪除牌組：${deckName}`);
            fetchStoredDecks();
            if (onDeckUpdate) onDeckUpdate();
        } catch (error) {
            console.error("Delete Error:", error);
            setStatus("error");
            setStatusMsg("刪除失敗");
        }
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
            if (customDeckName.trim()) {
                result.deckName = customDeckName.trim();
            }
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

            if (customDeckName.trim()) {
                result.deckName = customDeckName.trim();
            }

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
    const handleAnalyzeAudio = async () => {
        if (!audioFile) {
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
        setStatusMsg("正在傳送音訊進行深度轉錄與理解解構，請稍候...");

        try {
            const result = await analyzeAudioWithGemini(audioFile, apiKey);
            if (customDeckName.trim()) {
                result.deckName = customDeckName.trim();
            }
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

    // 儲存提取出的資料至 IndexedDB
    const handleCommitToLibrary = async () => {
        if (!extractedData || !extractedData.cards || extractedData.cards.length === 0) {
            setStatus("error");
            setStatusMsg("沒有可保存的卡片資料。");
            return;
        }

        try {
            const timestamp = Date.now();
            const deckName = extractedData.deckName || `自訂牌組_${new Date().toLocaleDateString()}`;

            // 若來自 YouTube，使用其縮圖做為可選展示
            const youtubeThumb = extractedData.videoId
                ? `https://img.youtube.com/vi/${extractedData.videoId}/hqdefault.jpg`
                : '';

            const newCards = extractedData.cards.map((card, idx) => ({
                id: `custom_${timestamp}_${idx}`,
                title: card.title,
                description: card.description,
                analogy: card.analogy || '',
                imagePath: youtubeThumb, // YouTube 縮圖或空字串
                videoUrl: extractedData.videoUrl || '',
                source: deckName,
                isCustom: true,
                // 第一張卡片攜帶全部附屬理解題目，確保各模式都能調用
                logicPairs: idx === 0 ? (extractedData.logicPairs || []) : [],
                mythBusters: idx === 0 ? (extractedData.mythBusters || []) : [],
                scenarios: idx === 0 ? (extractedData.scenarios || []) : []
            }));

            const existingCustomCards = (await getIDB('custom_cards')) || [];
            const mergedCards = [...existingCustomCards, ...newCards];
            await setIDB('custom_cards', mergedCards);

            setStatus("success");
            setStatusMsg(`🎉 成功匯入「${deckName}」，共建立 ${newCards.length} 張概念卡片與配套理解題！`);
            setExtractedData(null);
            setInputText('');
            setAudioFile(null);
            setYoutubeUrl('');
            setCustomDeckName('');

            fetchStoredDecks();
            if (onDeckUpdate) onDeckUpdate();
        } catch (error) {
            console.error("Save Error:", error);
            setStatus("error");
            setStatusMsg("寫入牌組庫失敗。");
        }
    };

    // 原有的 PDF 處理邏輯
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
            const sourceName = file.name.replace('.pdf', '');

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
                    source: sourceName,
                    page: i,
                    isCustom: true
                });

                setProgress(Math.round((i / totalPages) * 100));
            }

            const existingCustomCards = (await getIDB('custom_cards')) || [];
            const mergedCards = [...existingCustomCards, ...newCards];
            await setIDB('custom_cards', mergedCards);

            setStatus("success");
            setStatusMsg(`🎉 成功從 PDF 匯入 ${newCards.length} 張簡報卡片！`);
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-purple-300 to-indigo-400">
                        知識卡片與理解遊戲生成中心
                    </h1>
                    <p className="text-gray-400 text-xs md:text-sm mt-1">
                        支援 YouTube 教學影片、抽象課文筆記、錄音檔音訊與投影片 PDF 匯入
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
                <div className="mb-6 p-4 bg-gray-850 rounded-2xl border border-yellow-500/30 flex flex-col gap-3 animate-fade-in">
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

            {/* 匯入來源 Tab 選單 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-gray-900/80 p-1.5 rounded-2xl border border-gray-800 mb-6">
                <button
                    onClick={() => { setActiveTab('youtube'); setExtractedData(null); }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'youtube'
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Youtube className="w-4 h-4 text-red-300" /> YouTube 影片
                </button>
                <button
                    onClick={() => { setActiveTab('text'); setExtractedData(null); }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'text'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <FileText className="w-4 h-4 text-indigo-300" /> 文字筆記段落
                </button>
                <button
                    onClick={() => { setActiveTab('audio'); setExtractedData(null); }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'audio'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <FileAudio className="w-4 h-4 text-purple-300" /> 錄音筆記音訊
                </button>
                <button
                    onClick={() => { setActiveTab('pdf'); setExtractedData(null); }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${
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
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm ${
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div>
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <Youtube className="w-5 h-5 text-red-500" /> 貼上 YouTube 影片網址
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                專為「老師指定 YouTube 影片考試內容」打造！Gemini 2.5 直接觀看影片、聽取講解並提煉核心考點。
                            </p>
                        </div>
                        <input
                            type="text"
                            placeholder="自訂牌組名稱 (選填)"
                            value={customDeckName}
                            onChange={(e) => setCustomDeckName(e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 w-full md:w-56"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="貼上 YouTube 連結，例如: https://www.youtube.com/watch?v=... 或 https://youtu.be/..."
                                className="flex-1 p-3.5 bg-gray-900 border border-gray-700/80 rounded-2xl text-gray-100 text-sm focus:outline-none focus:border-red-500 font-mono"
                            />
                        </div>

                        {/* 即時影片預覽 */}
                        {detectedVideoId && (
                            <div className="mt-2 p-4 bg-gray-900/90 rounded-2xl border border-gray-750 flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
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
                                        準備好解析本影片中的關鍵概念、因果機制與易混淆考點
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div>
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-400" /> 貼上抽象筆記或課文長文
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                系統將進行認知解構，提煉出核心機制、生活比喻、因果鏈、迷思是非題與情境推導。
                            </p>
                        </div>
                        <input
                            type="text"
                            placeholder="自訂牌組名稱 (選填)"
                            value={customDeckName}
                            onChange={(e) => setCustomDeckName(e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-full md:w-56"
                        />
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div>
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <FileAudio className="w-4 h-4 text-purple-400" /> 上傳手機 / 錄音筆音訊檔案
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                支援 mp3, m4a, wav, aac 檔案。Gemini 多模態直接聆聽課堂錄音並提煉理解遊戲。
                            </p>
                        </div>
                        <input
                            type="text"
                            placeholder="自訂牌組名稱 (選填)"
                            value={customDeckName}
                            onChange={(e) => setCustomDeckName(e.target.value)}
                            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 w-full md:w-56"
                        />
                    </div>

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
                            {audioFile ? `已選擇：${audioFile.name}` : "點擊此處選擇或拖曳音訊檔"}
                        </p>
                        <p className="text-xs text-gray-500">
                            {audioFile ? `大小: ${(audioFile.size / 1024 / 1024).toFixed(2)} MB` : "支援常見格式：.mp3, .m4a, .wav, .aac"}
                        </p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            disabled={processing || !audioFile}
                            onClick={handleAnalyzeAudio}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                !audioFile
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20'
                            }`}
                        >
                            {processing ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    <span>AI 聆聽與解構分析中...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-yellow-300" />
                                    <span>開始 AI 語音理解提煉</span>
                                </>
                            )}
                        </button>
                    </div>
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
                        <p className="text-gray-400 text-xs mb-4">拖曳或點選以解析投影片截圖與大綱</p>
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

            {/* ================= 預覽與編輯區塊 (Extracted Preview) ================= */}
            {extractedData && (
                <div className="mt-6 flex flex-col gap-6 bg-gray-850 p-6 md:p-8 rounded-3xl border border-indigo-500/40 shadow-2xl animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-700">
                        <div>
                            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 flex items-center gap-1.5">
                                {extractedData.videoId && <Youtube className="w-4 h-4 text-red-400" />}
                                提煉預覽與微調
                            </span>
                            <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
                                {extractedData.deckName}
                            </h2>
                            {extractedData.summary && (
                                <p className="text-xs text-indigo-200 mt-1 italic">
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

                    {/* 卡片清單預覽 */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                            <span>🗂️ 核心概念卡片 ({extractedData.cards?.length || 0})</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {extractedData.cards?.map((card, idx) => (
                                <div key={idx} className="bg-gray-900/90 p-4 rounded-2xl border border-gray-750 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-indigo-400">#{idx + 1} 概念</span>
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
                                        {card.analogy && (
                                            <p className="text-xs text-amber-300/90 mt-1 bg-amber-950/20 p-2 rounded-lg border border-amber-500/20">
                                                💡 {card.analogy}
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

                    {/* 配套練習題摘要 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="bg-indigo-950/30 p-4 rounded-2xl border border-indigo-500/20">
                            <span className="text-xs font-bold text-indigo-400 block mb-1">🧩 因果連連看題目</span>
                            <span className="text-2xl font-black text-white">{extractedData.logicPairs?.length || 0}</span>
                            <p className="text-[11px] text-gray-400 mt-1">用於打通機制因果關係</p>
                        </div>
                        <div className="bg-purple-950/30 p-4 rounded-2xl border border-purple-500/20">
                            <span className="text-xs font-bold text-purple-400 block mb-1">🛡️ 迷思辨析是非題</span>
                            <span className="text-2xl font-black text-white">{extractedData.mythBusters?.length || 0}</span>
                            <p className="text-[11px] text-gray-400 mt-1">破解易混淆盲點概念</p>
                        </div>
                        <div className="bg-pink-950/30 p-4 rounded-2xl border border-pink-500/20">
                            <span className="text-xs font-bold text-pink-400 block mb-1">🎯 情境應用推導題</span>
                            <span className="text-2xl font-black text-white">{extractedData.scenarios?.length || 0}</span>
                            <p className="text-[11px] text-gray-400 mt-1">測試原理在具體案例中的遷移</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= 本地自訂牌組管理清單 (Local Decks) ================= */}
            <div className="mt-10 pt-6 border-t border-gray-800">
                <div className="flex items-center gap-2 mb-4 text-gray-300 font-bold text-sm">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span>本機牌組庫管理 ({storedDecks.length} 個自訂主題)</span>
                </div>

                {storedDecks.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">尚無自訂牌組。請貼上 YouTube 連結、筆記、上傳錄音或匯入 PDF 建立您的第一個牌組！</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {storedDecks.map((deck) => (
                            <div
                                key={deck.name}
                                className="bg-gray-850 p-4 rounded-2xl border border-gray-750 flex items-center justify-between group hover:border-gray-650 transition-all"
                            >
                                <div className="truncate pr-2">
                                    <h4 className="font-bold text-white text-sm truncate" title={deck.name}>{deck.name}</h4>
                                    <p className="text-[11px] text-gray-400">{deck.count} 張卡片與理解題目</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteDeck(deck.name)}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-xl transition-colors"
                                    title="刪除此牌組"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportMode;
