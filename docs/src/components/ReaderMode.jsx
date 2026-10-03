import { useState, useEffect, useMemo, useRef } from 'react';
import { get as getIDB } from 'idb-keyval';
import {
    BookOpenCheck, Highlighter, Volume2, VolumeX, Sparkles, ChevronLeft,
    ChevronRight, Zap, Bookmark, Layers, Search, Cpu, Check, HelpCircle,
    FileText, ArrowRight, X, Play, Pause, Languages, ChevronDown, ChevronUp
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
    "voltage-gated sodium channels": {
        term_en: "Voltage-Gated Sodium Channels",
        term_zh: "電位敏感型鈉離子通道",
        engineeringAnchor: "壓控開關 (Voltage-Controlled Switch) 自帶超時自鎖 (Inactivation Gate)",
        etymology: "Voltage-Gated [電壓門控] + Sodium (Na+) + Channel [導通孔道]",
        definition_en: "Transmembrane proteins that selectively conduct Na+ into the cell when the membrane depolarizes."
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
    "g-protein coupled receptors": {
        term_en: "G-Protein Coupled Receptors (GPCRs)",
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
    "gpcrs": {
        term_en: "GPCRs",
        term_zh: "G蛋白偶聯受體",
        engineeringAnchor: "非同步中繼代理 / 訊息佇列轉發器 (Message Broker)",
        etymology: "G-Protein Coupled Receptor 縮寫",
        definition_en: "7-transmembrane cell-surface receptors mediating cellular responses to hormones and neurotransmitters."
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
    "threshold potential": {
        term_en: "Threshold Potential",
        term_zh: "閾電位 (門檻電位)",
        engineeringAnchor: "邏輯閘切換閾值 (Logic Gate High-Level Trigger, ~ -55mV)",
        etymology: "Threshold [門檻/臨界點]",
        definition_en: "The critical membrane potential required to trigger a regenerative action potential."
    },
    "nernst equation": {
        term_en: "Nernst Equation",
        term_zh: "能斯特方程式",
        engineeringAnchor: "濃度差與電位差之物理熱力學平衡公式",
        etymology: "Walther Nernst [物理化學家姓氏]",
        definition_en: "Equation relating the reduction potential of an electrochemical reaction to the standard electrode potential, temperature, and activities of the chemical species."
    }
};

// 專屬 NTU Smart MHI 的高品質全英精讀範例篇章（開箱即用）
const DEFAULT_MHI_CHUNKS = [
    {
        id: "mhi_en_1",
        term_en: "Resting Membrane Potential & Nernst Equation",
        title: "1. Resting Membrane Potential & The Nernst Equilibrium",
        text_en: "In excitable cells such as neurons and cardiomyocytes, the Resting Membrane Potential (typically around -70 mV) is established predominantly by the selective permeability of the plasma membrane to potassium ions via leak channels, combined with the electrogenic action of the Na+/K+-ATPase pump. From an electrical engineering perspective, this state represents a stable DC bias or ground offset maintained across the lipid bilayer, which behaves as a biological capacitor. The electrochemical equilibrium potential for each individual ion species can be precisely calculated using the Nernst equation.",
        translation_zh: "在神經元與心肌細胞等可興奮細胞中，靜止膜電位（通常約為 -70 mV）主要是由細胞膜對鉀離子的選擇性通透性（透過洩漏通道）以及鈉鉀幫浦（Na+/K+-ATPase）的生電活性共同建立的。從電機工程的角度來看，這種狀態代表跨過脂質雙層介電質維持的穩定直流偏壓（DC Bias）或基準地電位。每種離子的電化學平衡電位皆可藉由能斯特方程式精確計算。",
        analogy: "系統靜態偏壓 (DC Bias) 與介電質電容儲能 (RC 基準面，約 -70mV)",
        source: "NTU Smart MHI: Cellular Bioelectricity"
    },
    {
        id: "mhi_en_2",
        term_en: "Action Potential & Voltage-Gated Sodium Channels",
        title: "2. Threshold Breach & Regenerative Depolarization",
        text_en: "When an excitatory stimulus causes the membrane potential to cross the critical Threshold Potential (approximately -55 mV), Voltage-Gated Sodium Channels undergo a conformational shift and rapidly open. This permits a massive, regenerative influx of Na+ driven by both concentration and electrical gradients, resulting in explosive Depolarization where the membrane potential surges toward +30 mV. In circuit theory, this positive feedback behavior is equivalent to a Schmitt Trigger or monostable multivibrator transitioning across its threshold voltage to generate an all-or-none digital pulse.",
        translation_zh: "當興奮性刺激導致膜電位跨過臨界閾電位（約 -55 mV）時，電位敏感型鈉離子通道會發生構型改變並迅速開啟。這會引發受濃度差與電位差共同驅動的大量再生性鈉離子內流，造成爆發性的去極化，使膜電位迅速上升至 +30 mV。在電路理論中，這種正回饋行為等效於施密特觸發器或單穩態多諧振盪器跨過閾值電壓，產生全有或全無的數位脈衝。",
        analogy: "施密特觸發器上升沿導通 (Rising Edge) / 電容急速充電 (RC 躍遷)",
        source: "NTU Smart MHI: Cellular Bioelectricity"
    },
    {
        id: "mhi_en_3",
        term_en: "Refractory Period & Inactivation Gates",
        title: "3. Inactivation Gates & The Refractory Period",
        text_en: "Shortly after opening, Voltage-Gated Sodium Channels close automatically via a tethered cytoplasmic peptide block known as the inactivation gate. During this absolute Refractory Period, the channel cannot be reactivated regardless of the stimulus intensity. This refractory state functions exactly like a hardware debounce timer or non-overlapping dead time in power electronics, preventing bidirectional signal feedback loops and guaranteeing that the Action Potential propagates strictly in a single forward direction along the axon.",
        translation_zh: "在開啟後不久，電位敏感型鈉通道會透過細胞質端的失活門（Inactivation Gate）自動堵塞關閉。在此絕對不反應期期間，無論刺激強度多大，通道都無法再次被活化。這種不反應狀態的功能完全如同電力電子學中的硬體防彈跳定時器（Debounce）或死區時間（Dead Time），防止信號產生雙向反饋迴路，確保動作電位嚴格沿著軸突單向向前傳播。",
        analogy: "硬體超時自鎖與防抖延遲死區 (Debounce Dead Time / 避免反向震盪短路)",
        source: "NTU Smart MHI: Cellular Bioelectricity"
    },
    {
        id: "mhi_en_4",
        term_en: "G-Protein Coupled Receptors (GPCR)",
        title: "4. GPCR Transduction & Intracellular Signal Amplification",
        text_en: "G-Protein Coupled Receptors (GPCRs) represent the largest class of cell-surface signal transducers in human physiology and modern pharmacology. Upon extracellular ligand binding, the GPCR undergoes a conformational change that catalyzes GDP-GTP exchange on the associated heterotrimeric G protein alpha subunit. In software architecture, this mechanism operates as an asynchronous Message Broker or pub-sub relay: the surface receptor acts as an API endpoint, while downstream second messengers (such as cAMP and IP3) serve as multi-threaded worker queues orchestrating physiological responses.",
        translation_zh: "G蛋白偶聯受體（GPCR）是人體生理學與現代藥理學中最大的一類細胞表面信號轉導分子。當細胞外配體結合時，GPCR 會發生構型改變，催化其偶聯的異三聚體 G 蛋白 α 次單元進行 GDP-GTP 交換。在軟體架構中，此機制的運作如同非同步訊息佇列代理（Message Broker）或發布-訂閱中繼：表面受體如同 API 端點，而下游第二傳訊者（如 cAMP 與 IP3）則如同多執行緒工作佇列，協調全域生理反應。",
        analogy: "API 端點交握與非同步訊息佇列轉發器 (Message Broker & Queue Relay)",
        source: "NTU Smart MHI: Cellular Bioelectricity"
    }
];

const ReaderMode = ({ cards = [], topic = 'All' }) => {
    const [currentChunkIdx, setCurrentChunkIdx] = useState(0);
    const [activeTermModal, setActiveTermModal] = useState(null);
    const [glossaryDict, setGlossaryDict] = useState(DEFAULT_GLOSSARY_MAP);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [customText, setCustomText] = useState('');
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [highlightTerms, setHighlightTerms] = useState(true);
    const [showTranslation, setShowTranslation] = useState(false);

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
                title: `Section ${idx + 1}: Guided Reading Passage`,
                text_en: p,
                text: p,
                translation_zh: '',
                analogy: '',
                source: '自訂全英課文'
            }));
        }

        // 若無自訂卡片，或選取 All 且卡片全為植物藥用時，自動提供 NTU Smart MHI 專業全英範例
        const isPlantDeck = cards.some(c => c.source && c.source.includes('藥用植物'));
        if (!cards || cards.length === 0 || (isPlantDeck && topic === 'All')) {
            return DEFAULT_MHI_CHUNKS;
        }

        return cards.map((card, idx) => {
            // 判斷是否有儲存純英文段落 text_en
            const hasEnglishText = Boolean(card.text_en && card.text_en.length > 10);
            const englishPassage = hasEnglishText
                ? card.text_en
                : (/[a-zA-Z]{20,}/.test(card.description) ? card.description : null);

            return {
                id: card.id || `chunk_${idx}`,
                term_en: card.term_en || '',
                title: card.title || `Section ${idx + 1}`,
                text_en: englishPassage,
                text: englishPassage || card.description || 'No reading text available.',
                translation_zh: card.translation_zh || (!englishPassage ? '' : card.description),
                analogy: card.engineeringAnalogy || card.analogy || '',
                source: card.source || '課程講義',
                imagePath: card.imagePath || ''
            };
        });
    }, [cards, isCustomMode, customText, topic]);

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
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold font-mono text-sm cursor-pointer hover:bg-emerald-600 hover:text-white hover:border-emerald-400 transition-all shadow-sm"
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
        setShowTranslation(false);
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
                                NTU Smart MHI All-English Guided Study
                            </span>
                            <span className="text-xs text-gray-500">
                                來源：{currentChunk.source}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                            全英文分段精讀複習工作台
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">
                            正文嚴格保持純英文教材段落！專業生醫術語直接在文中標記，點擊即可對齊理工直覺，拒絕全文機翻破壞語感。
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
                            <span>{isCustomMode ? "返回牌組精讀" : "貼上自訂英文課文"}</span>
                        </button>
                    </div>
                </div>

                {/* 自訂文本輸入區 (若處於自訂模式) */}
                {isCustomMode && (
                    <div className="p-4 bg-gray-850 rounded-2xl border border-purple-500/30 flex flex-col gap-3 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                                <FileText className="w-4 h-4" /> 貼上您想精讀的原汁原味全英課文（段落間請空一行）：
                            </span>
                            <span className="text-[11px] text-gray-500">
                                系統將保留純英文段落，並自動為您標出專有名詞
                            </span>
                        </div>
                        <textarea
                            rows={6}
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
                            <h2 className="text-xl md:text-2xl font-black text-white font-mono">
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
                            <span>{isSpeaking ? "停止朗讀" : "全英文朗讀本段"}</span>
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

                    {/* 純英文學術正文（標註專有名詞） */}
                    <div className="text-gray-100 text-sm md:text-base leading-relaxed tracking-wide whitespace-pre-wrap font-sans bg-gray-900/60 p-5 rounded-2xl border border-gray-800/80 shadow-inner">
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

                    {/* 可折疊之繁體中文對照翻譯 (輔助理解，不覆蓋原文) */}
                    {currentChunk.translation_zh && (
                        <div className="border border-gray-800 rounded-2xl overflow-hidden bg-gray-900/40">
                            <button
                                onClick={() => setShowTranslation(!showTranslation)}
                                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                            >
                                <span className="flex items-center gap-1.5">
                                    <Languages className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>{showTranslation ? "隱藏中文對照翻譯" : "📖 看不懂？點擊展開繁體中文對照翻譯"}</span>
                                </span>
                                {showTranslation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            {showTranslation && (
                                <div className="p-4 pt-2 text-xs md:text-sm text-gray-300 leading-relaxed border-t border-gray-800 bg-gray-950/30 font-sans">
                                    {currentChunk.translation_zh}
                                </div>
                            )}
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
