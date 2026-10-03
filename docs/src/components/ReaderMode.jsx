import { useState, useEffect, useMemo, useRef } from 'react';
import { get as getIDB } from 'idb-keyval';
import {
    BookOpenCheck, Highlighter, Volume2, VolumeX, Sparkles, ChevronLeft,
    ChevronRight, Zap, Bookmark, Layers, Search, Cpu, Check, HelpCircle,
    FileText, ArrowRight, X, Play, Pause
} from 'lucide-react';

// NTU Smart MHI 基礎名詞對照庫
const DEFAULT_GLOSSARY_MAP = {
    "action potential": {
        term_en: "Action Potential",
        term_zh: "動作電位",
        engineeringAnchor: "單穩態脈衝觸發器 (Monostable Pulse) / 施密特觸發器",
        etymology: "Action (主動/觸發) + Potential (位能/電位)",
        definition_en: "A rapid, all-or-none voltage spike across the excitable membrane initiated once threshold potential is breached."
    },
    "depolarization": {
        term_en: "Depolarization",
        term_zh: "去極化",
        engineeringAnchor: "電容急速充電 / 上升沿觸發 (Rising Edge Trigger)",
        etymology: "de- [去除/逆轉] + polar [極性] + -ization [名詞化過程]",
        definition_en: "A shift in membrane potential toward zero or positive values due to rapid Na+ influx."
    },
    "repolarization": {
        term_en: "Repolarization",
        term_zh: "再極化",
        engineeringAnchor: "電容放電復位 / 下降沿復歸 (Falling Edge Reset)",
        etymology: "re- [重新] + polar [極性] + -ization [過程]",
        definition_en: "Return of the membrane potential to resting value driven by K+ ion efflux."
    },
    "hyperpolarization": {
        term_en: "Hyperpolarization",
        term_zh: "過極化",
        engineeringAnchor: "電位下衝超調 (Undershoot / Negative Surge)",
        etymology: "hyper- [過量/過度] + polar [極性] + -ization",
        definition_en: "Membrane potential becoming temporarily more negative than resting membrane potential due to delayed K+ channel closing."
    },
    "refractory period": {
        term_en: "Refractory Period",
        term_zh: "不反應期",
        engineeringAnchor: "防彈跳延遲死區 (Debounce Dead Time) / 防反向短路迴流",
        etymology: "refractory [抗拒的/無效的] + period [時段]",
        definition_en: "Time window following an action potential during which an excitable cell cannot fire another impulse."
    },
    "resting membrane potential": {
        term_en: "Resting Membrane Potential",
        term_zh: "靜止膜電位",
        engineeringAnchor: "系統靜態偏壓 (DC Bias) / 基準地電位 (GND Offset, ~ -70mV)",
        etymology: "Resting [休止] + Membrane [介電質] + Potential [電位差]",
        definition_en: "The baseline electrical potential difference maintained across an unexcited cell membrane."
    },
    "voltage-gated sodium channel": {
        term_en: "Voltage-Gated Sodium Channel",
        term_zh: "電位敏感型鈉離子通道",
        engineeringAnchor: "壓控開關 (Voltage-Controlled Switch) 自帶超時自鎖 (Inactivation Gate)",
        etymology: "Voltage-Gated [電壓門控] + Sodium (Na+) + Channel [導通孔道]",
        definition_en: "Transmembrane protein that selectively conducts Na+ into the cell when the membrane depolarizes."
    },
    "ligand-gated ion channel": {
        term_en: "Ligand-Gated Ion Channel",
        term_zh: "配體門控離子通道",
        engineeringAnchor: "API 端點密鑰校驗導通 / 外部硬體中斷接腳 (External Interrupt Pin)",
        etymology: "Ligand [拉丁語ligare綁紮/結合分子] + Gated [門控] + Channel",
        definition_en: "Ion channel that opens or closes in response to chemical messenger binding."
    },
    "g-protein coupled receptor": {
        term_en: "G-Protein Coupled Receptor (GPCR)",
        term_zh: "G蛋白偶聯受體",
        engineeringAnchor: "非同步中繼代理 / 訊息佇列轉發器 (Message Broker & Relay)",
        etymology: "Guanine nucleotide-binding + Coupled [偶聯] + Receptor",
        definition_en: "Large family of 7-transmembrane receptors that transduce signals via G proteins."
    },
    "gpcr": {
        term_en: "GPCR",
        term_zh: "G蛋白偶聯受體",
        engineeringAnchor: "非同步中繼代理 / 訊息佇列轉發器 (Message Broker)",
        etymology: "G-Protein Coupled Receptor 縮寫",
        definition_en: "7-transmembrane cell-surface receptor mediating cellular responses to hormones and neurotransmitters."
    },
    "negative feedback": {
        term_en: "Negative Feedback Loop",
        term_zh: "負回饋調節迴路",
        engineeringAnchor: "運算放大器負反饋 (Op-Amp Feedback) / PID 閉迴路穩態",
        etymology: "Negative [反向] + Feedback [反饋] + Loop [迴路]",
        definition_en: "Control mechanism where output counteracts initial perturbation to maintain homeostasis."
    },
    "saltatory conduction": {
        term_en: "Saltatory Conduction",
        term_zh: "跳躍傳導",
        engineeringAnchor: "低電容同軸電纜中繼放大 / RC 時間常數最佳化",
        etymology: "Saltatory [跳躍的, 來自拉丁語saltare跳] + Conduction [傳導]",
        definition_en: "Propagation of action potentials jumping from node to node along myelinated axons."
    },
    "threshold": {
        term_en: "Threshold Potential",
        term_zh: "閾電位 (門檻電位)",
        engineeringAnchor: "邏輯閘切換閾值 (Logic Gate High-Level Trigger, ~ -55mV)",
        etymology: "Threshold [門檻/臨界點]",
        definition_en: "The critical membrane potential required to trigger a regenerative action potential."
    }
};

const ReaderMode = ({ cards = [], topic = 'All' }) => {
    const [currentChunkIdx, setCurrentChunkIdx] = useState(0);
    const [activeTermModal, setActiveTermModal] = useState(null);
    const [glossaryDict, setGlossaryDict] = useState(DEFAULT_GLOSSARY_MAP);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [customText, setCustomText] = useState('');
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [highlightTerms, setHighlightTerms] = useState(true);

    // 載入自訂 glossary
    useEffect(() => {
        const fetchCustomGlossary = async () => {
            try {
                const customCards = await getIDB('custom_cards');
                const merged = { ...DEFAULT_GLOSSARY_MAP };

                if (customCards && Array.isArray(customCards)) {
                    customCards.forEach(c => {
                        if (c.glossary && Array.isArray(c.glossary)) {
                            c.glossary.forEach(g => {
                                if (g.term_en) {
                                    merged[g.term_en.toLowerCase().trim()] = {
                                        term_en: g.term_en,
                                        term_zh: g.term_zh || '',
                                        engineeringAnchor: g.engineeringAnchor || '',
                                        etymology: g.etymology || '',
                                        definition_en: g.definition_en || ''
                                    };
                                }
                            });
                        }
                        if (c.term_en) {
                            merged[c.term_en.toLowerCase().trim()] = {
                                term_en: c.term_en,
                                term_zh: c.title || '',
                                engineeringAnchor: c.engineeringAnalogy || c.analogy || '',
                                etymology: '',
                                definition_en: c.description || ''
                            };
                        }
                    });
                }
                setGlossaryDict(merged);
            } catch (err) {
                console.error("ReaderMode glossary load error:", err);
            }
        };

        fetchCustomGlossary();
    }, []);

    // 構建精讀段落清單 (Chunks)
    const chunks = useMemo(() => {
        if (isCustomMode && customText.trim()) {
            // 分割自訂文本為段落
            const rawParagraphs = customText
                .split(/\n\s*\n/)
                .map(p => p.trim())
                .filter(p => p.length > 0);

            return rawParagraphs.map((p, idx) => ({
                id: `custom_p_${idx}`,
                title: `段落 ${idx + 1}：文本精讀`,
                text: p,
                analogy: '',
                source: '自訂文本'
            }));
        }

        if (!cards || cards.length === 0) return [];

        return cards.map((card, idx) => ({
            id: card.id || `chunk_${idx}`,
            term_en: card.term_en || '',
            title: card.title || `第 ${idx + 1} 單元`,
            text: card.description || '無文字段落。',
            analogy: card.engineeringAnalogy || card.analogy || '',
            source: card.source || '課程講義',
            imagePath: card.imagePath || ''
        }));
    }, [cards, isCustomMode, customText]);

    // 取得當前段落
    const currentChunk = chunks[currentChunkIdx] || chunks[0];

    // 全英專有名詞高亮解析引擎
    const renderAnnotatedText = (text) => {
        if (!text || !highlightTerms) return text;

        const termKeys = Object.keys(glossaryDict).sort((a, b) => b.length - a.length);
        if (termKeys.length === 0) return text;

        // 轉義正則特殊字符
        const escapedTerms = termKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi');

        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const start = match.index;
            const end = regex.lastIndex;
            const matchedWord = match[0];
            const lowerWord = matchedWord.toLowerCase();
            const termInfo = glossaryDict[lowerWord];

            // 推進普通文本
            if (start > lastIndex) {
                parts.push(text.slice(lastIndex, start));
            }

            // 推進高亮單字元素
            parts.push(
                <span
                    key={`${start}-${end}`}
                    onClick={() => setActiveTermModal(termInfo || { term_en: matchedWord })}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold font-mono text-xs cursor-pointer hover:bg-emerald-600 hover:text-white hover:border-emerald-400 transition-all shadow-sm"
                    title="點擊查看中文翻譯與理工工程類比"
                >
                    <span>{matchedWord}</span>
                    <Sparkles className="w-2.5 h-2.5 text-yellow-300 shrink-0" />
                </span>
            );

            lastIndex = end;
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts;
    };

    // 瀏覽器英文語音朗讀 (Web Speech API)
    const speakText = (textToSpeak) => {
        if (!('speechSynthesis' in window)) {
            alert("您的瀏覽器暫不支援語音合成功能。");
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US';
        utterance.rate = 0.95; // 稍微放慢，便於聽清全英醫學名詞

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    const stopSpeech = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    useEffect(() => {
        return () => stopSpeech();
    }, [currentChunkIdx]);

    if (!chunks || chunks.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center text-gray-400">
                <BookOpenCheck className="w-12 h-12 text-indigo-400 mb-3 opacity-60" />
                <h3 className="text-xl font-bold text-white mb-2">此主題暫無可閱讀的文字段落</h3>
                <p className="text-xs text-gray-500 mb-4 max-w-md">
                    您可以切換主題，或切換至「自訂文本精讀」直接貼上一段全英教科書或講義進行即時標註！
                </p>
                <button
                    onClick={() => setIsCustomMode(true)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                    貼上自訂課文精讀
                </button>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-4xl space-y-6 animate-fade-in pb-20">

                {/* 頂部標題與工具列 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 font-mono">
                                NTU Smart MHI Guided Study
                            </span>
                            <span className="text-xs text-gray-500">
                                來源：{currentChunk.source}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                            分段精讀複習工作台
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">
                            純粹閱讀與消化。特別的生醫英文單字已為您即時標出，點擊即可對齊理工直覺與詞根。
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setHighlightTerms(!highlightTerms)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                highlightTerms
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-sm'
                                    : 'bg-gray-800 text-gray-400 border-gray-700'
                            }`}
                            title="切換是否高亮標註專業生醫詞彙"
                        >
                            <Highlighter className="w-3.5 h-3.5" />
                            <span>{highlightTerms ? "專有名詞標註：開" : "標註：關"}</span>
                        </button>

                        <button
                            onClick={() => {
                                setIsCustomMode(!isCustomMode);
                                setCurrentChunkIdx(0);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                isCustomMode
                                    ? 'bg-purple-600 text-white border-purple-400 shadow'
                                    : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isCustomMode ? "返回牌組精讀" : "自訂文本段落"}</span>
                        </button>
                    </div>
                </div>

                {/* 自訂文本輸入區 (若處於自訂模式) */}
                {isCustomMode && (
                    <div className="p-4 bg-gray-850 rounded-2xl border border-purple-500/30 flex flex-col gap-3 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                                <FileText className="w-4 h-4" /> 貼上您想分段精讀的全英課文或筆記：
                            </span>
                            <span className="text-[11px] text-gray-500">
                                系統將以空行（段落）自動切分，並自動標註出現的所有專有名詞
                            </span>
                        </div>
                        <textarea
                            rows={5}
                            value={customText}
                            onChange={(e) => {
                                setCustomText(e.target.value);
                                setCurrentChunkIdx(0);
                            }}
                            placeholder="在此貼上全英文學術論文摘要、講義段落（例如：Action potential propagation involves rapid depolarization...）"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 font-mono leading-relaxed"
                        />
                    </div>
                )}

                {/* 段落導航進度條 */}
                <div className="flex items-center justify-between bg-gray-850/80 px-4 py-2.5 rounded-2xl border border-gray-800">
                    <button
                        disabled={currentChunkIdx === 0}
                        onClick={() => setCurrentChunkIdx(prev => Math.max(0, prev - 1))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            currentChunkIdx === 0
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        }`}
                    >
                        <ChevronLeft className="w-4 h-4" /> 上一段
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-300">
                            段落 {currentChunkIdx + 1} / {chunks.length}
                        </span>
                        <div className="w-24 sm:w-40 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
                                style={{ width: `${((currentChunkIdx + 1) / chunks.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    <button
                        disabled={currentChunkIdx === chunks.length - 1}
                        onClick={() => setCurrentChunkIdx(prev => Math.min(chunks.length - 1, prev + 1))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            currentChunkIdx === chunks.length - 1
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        }`}
                    >
                        下一段 <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* 核心分段閱讀卡片 */}
                <div className="bg-gradient-to-b from-gray-850 to-gray-900 rounded-3xl border border-indigo-500/20 shadow-2xl p-6 md:p-8 flex flex-col gap-6">

                    {/* 段落標題與發音朗讀 */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-800 pb-4">
                        <div>
                            {currentChunk.term_en && (
                                <span className="text-xs font-mono font-bold text-indigo-400 block mb-0.5">
                                    {currentChunk.term_en}
                                </span>
                            )}
                            <h2 className="text-xl md:text-2xl font-black text-white">
                                {currentChunk.title}
                            </h2>
                        </div>

                        <button
                            onClick={() => speakText(`${currentChunk.title}. ${currentChunk.text}`)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                                isSpeaking
                                    ? 'bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse'
                                    : 'bg-gray-800 hover:bg-gray-750 text-indigo-300 border-gray-700'
                            }`}
                            title="點擊聆聽全英發音朗讀"
                        >
                            {isSpeaking ? <Pause className="w-3.5 h-3.5 text-rose-400" /> : <Play className="w-3.5 h-3.5 text-indigo-400" />}
                            <span>{isSpeaking ? "停止朗讀" : "朗讀本段 (英文)"}</span>
                        </button>
                    </div>

                    {/* 附帶圖解（若有講義截圖或架構圖） */}
                    {currentChunk.imagePath && (
                        <div className="w-full max-h-72 rounded-2xl overflow-hidden bg-black/60 border border-gray-800 flex items-center justify-center p-2">
                            <img
                                src={currentChunk.imagePath}
                                alt={currentChunk.title}
                                className="max-h-68 object-contain rounded-xl"
                            />
                        </div>
                    )}

                    {/* 標註後正文文本 */}
                    <div className="text-gray-200 text-sm md:text-base leading-relaxed tracking-wide whitespace-pre-wrap font-sans">
                        {renderAnnotatedText(currentChunk.text)}
                    </div>

                    {/* 理工心智錨點註解框 (Engineering Analogy Callout) */}
                    {currentChunk.analogy && (
                        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3 shadow-inner">
                            <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 font-mono mb-1">
                                    ⚡ 理工工程直覺心智模型 (Engineering Analogy)
                                </h4>
                                <p className="text-xs text-gray-200 leading-relaxed font-mono">
                                    {currentChunk.analogy}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 底部段落切換快捷列 */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                        <span className="text-[11px] text-gray-500">
                            提示：滑鼠點擊內文中的綠色單字即可彈出詳細中英對照
                        </span>

                        <button
                            onClick={() => {
                                if (currentChunkIdx < chunks.length - 1) {
                                    setCurrentChunkIdx(prev => prev + 1);
                                }
                            }}
                            disabled={currentChunkIdx === chunks.length - 1}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                currentChunkIdx === chunks.length - 1
                                    ? 'opacity-30 cursor-not-allowed text-gray-500'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                            }`}
                        >
                            <span>讀完進入下一段</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* 彈出式生醫專有名詞解析卡 (Active Term Modal) */}
                {activeTermModal && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-gray-900 border border-emerald-500/40 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative space-y-4">
                            <button
                                onClick={() => setActiveTermModal(null)}
                                className="absolute top-5 right-5 p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-start justify-between gap-3 pr-8">
                                <div>
                                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">
                                        專有名詞即時標註
                                    </span>
                                    <h3 className="text-xl md:text-2xl font-black text-white font-mono text-emerald-300">
                                        {activeTermModal.term_en}
                                    </h3>
                                </div>
                                {activeTermModal.term_zh && (
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 whitespace-nowrap">
                                        {activeTermModal.term_zh}
                                    </span>
                                )}
                            </div>

                            {/* 理工直覺對等概念 */}
                            {activeTermModal.engineeringAnchor && (
                                <div className="p-3 bg-cyan-950/40 rounded-xl border border-cyan-500/30 text-xs text-cyan-200 font-mono flex items-start gap-2 shadow-inner">
                                    <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-cyan-300">⚡ 理工直覺：</strong>
                                        <span>{activeTermModal.engineeringAnchor}</span>
                                    </div>
                                </div>
                            )}

                            {/* 詞根拆解 */}
                            {activeTermModal.etymology && (
                                <div className="p-2.5 bg-amber-950/20 rounded-xl border border-amber-500/20 text-xs text-amber-300/90 italic">
                                    🌱 詞根拆解：{activeTermModal.etymology}
                                </div>
                            )}

                            {/* 全英簡明定義 */}
                            {activeTermModal.definition_en && (
                                <div className="text-xs text-gray-300 leading-relaxed border-t border-gray-800 pt-3">
                                    <span className="font-bold text-gray-400 block mb-1">學術定義 (Definition)：</span>
                                    {activeTermModal.definition_en}
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2">
                                <button
                                    onClick={() => speakText(activeTermModal.term_en)}
                                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-750 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                >
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span>聽發音</span>
                                </button>

                                <button
                                    onClick={() => setActiveTermModal(null)}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                                >
                                    了解，繼續閱讀
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReaderMode;
