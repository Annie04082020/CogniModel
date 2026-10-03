import { useState, useEffect, useMemo, useRef } from 'react';
import { get as getIDB, set as setIDB } from 'idb-keyval';
import {
    BookOpenCheck, Highlighter, Volume2, VolumeX, Sparkles, ChevronLeft,
    ChevronRight, Zap, Bookmark, Layers, Search, Cpu, Check, HelpCircle,
    FileText, ArrowRight, X, Play, Pause, Languages, ChevronDown, ChevronUp,
    Maximize2, Minimize2, ZoomIn, ZoomOut, Image as ImageIcon,
    Columns, UploadCloud, Copy, Sliders, Type, AlignJustify,
    Bot, Send, MessageSquare, RotateCcw, Loader
} from 'lucide-react';
import { askCogniTutor, getGeminiApiKey } from '../services/geminiService';

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
        etymology: "Ligand [配體/化學密鑰] + Gated [門控]",
        definition_en: "Ionotropic channel that opens in direct response to chemical messenger binding."
    },
    "g-protein coupled receptor": {
        term_en: "G-Protein Coupled Receptor (GPCR)",
        term_zh: "G蛋白偶聯受體",
        engineeringAnchor: "非同步訊息佇列代理器 (Message Broker) 與發布-訂閱中繼 (Pub-Sub Relay)",
        etymology: "GTP-binding Protein + Coupled + Receptor",
        definition_en: "Transmembrane receptor that senses extracellular molecules and activates internal signal transduction pathways."
    },
    "gpcr": {
        term_en: "GPCR",
        term_zh: "G蛋白偶聯受體",
        engineeringAnchor: "非同步訊息佇列代理器 (Message Broker) 與發布-訂閱中繼 (Pub-Sub Relay)",
        etymology: "G-Protein Coupled Receptor",
        definition_en: "7-transmembrane receptor family orchestrating cellular responses to external stimuli."
    },
    "dna demethylation": {
        term_en: "DNA Demethylation",
        term_zh: "DNA 去甲基化",
        engineeringAnchor: "快閃記憶體清除旗標 / 位元鎖定解封 (Flash Memory Bit Clear / Register Unlock)",
        etymology: "de- [去除] + methyl [甲基] + -ation [過程]",
        definition_en: "The enzymatic removal of methyl groups from DNA bases, often reactivating repressed transcriptional programs."
    },
    "tet1": {
        term_en: "TET1",
        term_zh: "易位蛋白 1 雙加氧酶",
        engineeringAnchor: "表觀遺傳覆寫驅動器 (Catalytic Overwrite Driver / Oxidation Engine)",
        etymology: "Ten-Eleven Translocation 1",
        definition_en: "A catalytic enzyme mediating the sequential oxidation of 5-methylcytosine to initiate active DNA demethylation."
    },
    "ten-eleven translocation": {
        term_en: "Ten-Eleven Translocation (TET)",
        term_zh: "10-11 易位家族雙加氧酶",
        engineeringAnchor: "表觀狀態步進轉換器 (Stepwise Epigenetic State Converter)",
        etymology: "Ten-Eleven Translocation",
        definition_en: "Family of Fe(II)/alpha-ketoglutarate-dependent dioxygenases that catalyze sequential oxidation of 5mC."
    },
    "5-methylcytosine": {
        term_en: "5-Methylcytosine (5mC)",
        term_zh: "5-甲基胞嘧啶",
        engineeringAnchor: "唯讀遮罩暫存器 (Read-Only Mask Flag)",
        etymology: "5th carbon + Methyl + Cytosine",
        definition_en: "A methylated form of DNA cytosine typically associated with gene silencing."
    },
    "5-hydroxymethylcytosine": {
        term_en: "5-Hydroxymethylcytosine (5hmC)",
        term_zh: "5-羥甲基胞嘧啶",
        engineeringAnchor: "中間暫存狀態暫留 (Intermediate Staging Buffer)",
        etymology: "Hydroxyl + Methyl + Cytosine",
        definition_en: "The first oxidation product of 5mC produced by TET dioxygenases."
    },
    "base excision repair": {
        term_en: "Base Excision Repair (BER)",
        term_zh: "鹼基切除修復",
        engineeringAnchor: "ECC 記憶體錯誤校驗與同位元覆寫機制 (Error Correction & Replacement)",
        etymology: "Base + Excision [切除] + Repair [修復]",
        definition_en: "Cellular mechanism that repairs damaged DNA bases through cleavage, gap filling, and ligation."
    },
    "threshold potential": {
        term_en: "Threshold Potential",
        term_zh: "閾電位",
        engineeringAnchor: "邏輯閘導通電壓 / 比較器切換臨界點 (Vth, ~ -55mV)",
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

    // ================= 閱讀舒適度設定 (Typography & Spacing Controls) =================
    const [lineSpacing, setLineSpacing] = useState('relaxed'); // 'comfortable' (2.0) | 'relaxed' (2.35) | 'spacious' (2.7)
    const [fontSize, setFontSize] = useState('lg'); // 'md' (16px) | 'lg' (18px) | 'xl' (20px)
    const [layoutMode, setLayoutMode] = useState('split'); // 'split' (圖文對照) | 'focus' (單欄沉浸)
    const [lightboxImage, setLightboxImage] = useState(null);
    const [lightboxZoom, setLightboxZoom] = useState(1);
    const fileInputRef = useRef(null);

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
                source: '自訂全英課文',
                imagePath: '',
                page: null
            }));
        }

        const isPlantDeck = cards.some(c => c.source && c.source.includes('藥用植物'));
        if (!cards || cards.length === 0 || (isPlantDeck && topic === 'All')) {
            return DEFAULT_MHI_CHUNKS;
        }

        return cards.map((card, idx) => {
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
                imagePath: card.imagePath || '',
                page: card.page || null,
                rawCard: card
            };
        });
    }, [cards, isCustomMode, customText, topic]);

    // 當前牌組內包含的所有投影片/圖片資源
    const deckSlides = useMemo(() => {
        const list = [];
        if (cards && Array.isArray(cards)) {
            cards.forEach((c, idx) => {
                if (c.imagePath) {
                    list.push({
                        id: c.id || `slide_${idx}`,
                        title: c.title || `Page ${c.page || idx + 1}`,
                        imagePath: c.imagePath,
                        page: c.page || (idx + 1),
                        cardIndex: idx,
                        term_en: c.term_en || ''
                    });
                }
            });
        }
        return list;
    }, [cards]);

    const [selectedSlideIdx, setSelectedSlideIdx] = useState(0);

    // 取得當前段落
    const currentChunk = chunks[currentChunkIdx] || chunks[0];

    // 切換段落時自動對齊投影片
    useEffect(() => {
        if (currentChunk && currentChunk.imagePath) {
            const found = deckSlides.findIndex(s => s.imagePath === currentChunk.imagePath);
            if (found !== -1) {
                setSelectedSlideIdx(found);
            }
        } else if (deckSlides.length > 0) {
            const target = Math.min(currentChunkIdx, deckSlides.length - 1);
            setSelectedSlideIdx(target);
        }
    }, [currentChunkIdx, currentChunk, deckSlides]);

    // 當前檢視之投影片
    const activeSlide = useMemo(() => {
        if (currentChunk?.imagePath) {
            return {
                imagePath: currentChunk.imagePath,
                title: currentChunk.title,
                page: currentChunk.page || currentChunkIdx + 1,
                isDirectMatch: true
            };
        }
        if (deckSlides.length > 0 && deckSlides[selectedSlideIdx]) {
            return {
                ...deckSlides[selectedSlideIdx],
                isDirectMatch: false
            };
        }
        return null;
    }, [currentChunk, deckSlides, selectedSlideIdx, currentChunkIdx]);

    // 監聽 Ctrl+V 貼上投影片截圖至當前卡片
    useEffect(() => {
        const handlePasteImage = async (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type && items[i].type.startsWith('image/')) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = async (evt) => {
                            const base64 = evt.target.result;
                            await attachImageToCurrentChunk(base64);
                        };
                        reader.readAsDataURL(blob);
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePasteImage);
        return () => window.removeEventListener('paste', handlePasteImage);
    }, [currentChunk]);

    const attachImageToCurrentChunk = async (base64) => {
        if (!currentChunk) return;
        try {
            const customCards = (await getIDB('custom_cards')) || [];
            const updated = customCards.map(c => {
                if (c.id === currentChunk.id) {
                    return { ...c, imagePath: base64 };
                }
                return c;
            });
            await setIDB('custom_cards', updated);
            currentChunk.imagePath = base64;
            setSelectedSlideIdx(0);
        } catch (err) {
            console.error("Failed to attach image to card", err);
        }
    };

    // ================= 理工學伴 (CogniTutor) 問答狀態 =================
    const [tutorQuestion, setTutorQuestion] = useState('');
    const [tutorHistory, setTutorHistory] = useState([]);
    const [tutorLoading, setTutorLoading] = useState(false);
    const [tutorForceOffline, setTutorForceOffline] = useState(false);
    const [isTutorOpen, setIsTutorOpen] = useState(true);

    const currentDeckGlossary = useMemo(() => {
        return Object.values(glossaryDict || {});
    }, [glossaryDict]);

    const currentDeckChains = useMemo(() => {
        const list = [];
        (cards || []).forEach(c => {
            if (c.mechanismChains && Array.isArray(c.mechanismChains)) {
                list.push(...c.mechanismChains);
            }
        });
        return list;
    }, [cards]);

    const currentDeckPairs = useMemo(() => {
        const list = [];
        (cards || []).forEach(c => {
            if (c.logicPairs && Array.isArray(c.logicPairs)) {
                list.push(...c.logicPairs);
            }
        });
        return list;
    }, [cards]);

    // 切換段落時，自動保留或附加該段落提示
    const handleAskTutor = async (promptText = null) => {
        const q = (promptText || tutorQuestion || '').trim();
        if (!q || tutorLoading) return;

        const userMsg = {
            id: `msg_${Date.now()}_u`,
            role: 'user',
            text: q,
            timestamp: Date.now()
        };

        setTutorHistory(prev => [...prev, userMsg]);
        setTutorQuestion('');
        setTutorLoading(true);

        try {
            const res = await askCogniTutor({
                question: q,
                contextChunk: currentChunk,
                glossary: currentDeckGlossary,
                mechanismChains: currentDeckChains,
                logicPairs: currentDeckPairs,
                apiKey: getGeminiApiKey(),
                forceOffline: tutorForceOffline
            });

            const botMsg = {
                id: `msg_${Date.now()}_b`,
                role: 'assistant',
                text: res.answer,
                mode: res.mode,
                model: res.model,
                timestamp: Date.now()
            };

            setTutorHistory(prev => [...prev, botMsg]);
        } catch (err) {
            console.error("Tutor Error:", err);
            setTutorHistory(prev => [
                ...prev,
                {
                    id: `msg_${Date.now()}_err`,
                    role: 'assistant',
                    text: `⚠️ 解答過程發生狀況：${err.message || '請確認網路或 API Key'}`,
                    mode: 'offline',
                    timestamp: Date.now()
                }
            ]);
        } finally {
            setTutorLoading(false);
        }
    };

    // 全英專有名詞高亮解析引擎
    const renderAnnotatedText = (text) => {
        if (!text || !highlightTerms) return text;

        const termKeys = Object.keys(glossaryDict).sort((a, b) => b.length - a.length);
        if (termKeys.length === 0) return text;

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

            if (start > lastIndex) {
                parts.push(text.slice(lastIndex, start));
            }

            parts.push(
                <span
                    key={`${start}-${end}`}
                    onClick={() => setActiveTermModal(termInfo || { term_en: matchedWord })}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 mx-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold font-mono text-[0.92em] cursor-pointer hover:bg-emerald-600 hover:text-white hover:border-emerald-300 transition-all shadow-sm align-baseline group"
                    title="點擊查看中文翻譯與理工工程類比"
                >
                    <span>{matchedWord}</span>
                    <Sparkles className="w-2.5 h-2.5 text-yellow-300 opacity-80 group-hover:scale-125 transition-transform shrink-0" />
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
        utterance.rate = 0.95;

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

    const getFontSizeClass = () => {
        switch (fontSize) {
            case 'md': return 'text-base md:text-lg';
            case 'xl': return 'text-xl md:text-2xl';
            case 'lg':
            default:
                return 'text-lg md:text-xl';
        }
    };

    const getLineSpacingClass = () => {
        switch (lineSpacing) {
            case 'comfortable': return 'leading-[2.0] tracking-[0.015em]';
            case 'spacious': return 'leading-[2.7] tracking-[0.035em]';
            case 'relaxed':
            default:
                return 'leading-[2.35] tracking-[0.025em]';
        }
    };

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
        <div className="h-full w-full flex flex-col items-center p-3 md:p-5 lg:p-6 overflow-y-auto custom-scrollbar">
            <div className={`w-full ${layoutMode === 'split' ? 'max-w-7xl' : 'max-w-4xl'} space-y-4 animate-fade-in pb-16 transition-all duration-300`}>

                {/* 頂部標題與閱讀控制條 */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-800/80 pb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 font-mono tracking-wider">
                                NTU Smart MHI All-English Guided Study
                            </span>
                            <span className="text-xs text-gray-400">
                                來源：<strong className="text-gray-200">{currentChunk.source}</strong>
                            </span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                            全英文分段精讀複習工作台
                        </h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            純英文段落寬鬆排版，搭配 PDF 投影片並排對照與理工工程類比，大幅提升全英專有名詞熟練度。
                        </p>
                    </div>

                    {/* 工具列控制按鈕組 */}
                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                        {/* 雙欄 / 單欄對照切換 */}
                        <button
                            onClick={() => setLayoutMode(layoutMode === 'split' ? 'focus' : 'split')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                layoutMode === 'split'
                                    ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40 shadow-sm'
                                    : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700'
                            }`}
                            title="切換雙欄投影片圖文對照或單欄專注沉浸閱讀"
                        >
                            <Columns className="w-3.5 h-3.5" />
                            <span>{layoutMode === 'split' ? '🖼️ 圖文對照模式' : '📄 單欄專注模式'}</span>
                        </button>

                        {/* 行距設定選單 */}
                        <div className="flex items-center bg-gray-800/90 rounded-xl border border-gray-700 p-0.5 text-xs">
                            <span className="text-[11px] text-gray-400 px-2 flex items-center gap-1 font-bold">
                                <AlignJustify className="w-3 h-3 text-indigo-400" /> 行距
                            </span>
                            <button
                                onClick={() => setLineSpacing('comfortable')}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    lineSpacing === 'comfortable' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                                }`}
                                title="行距 2.0x"
                            >
                                舒適
                            </button>
                            <button
                                onClick={() => setLineSpacing('relaxed')}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    lineSpacing === 'relaxed' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                                }`}
                                title="行距 2.35x（推薦）"
                            >
                                寬敞
                            </button>
                            <button
                                onClick={() => setLineSpacing('spacious')}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    lineSpacing === 'spacious' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                                }`}
                                title="行距 2.7x"
                            >
                                奢華
                            </button>
                        </div>

                        {/* 字級大小切換 */}
                        <div className="flex items-center bg-gray-800/90 rounded-xl border border-gray-700 p-0.5 text-xs">
                            <span className="text-[11px] text-gray-400 px-2 flex items-center gap-1 font-bold">
                                <Type className="w-3 h-3 text-indigo-400" /> 字級
                            </span>
                            <button
                                onClick={() => setFontSize('md')}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    fontSize === 'md' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                                title="標準字級 16px"
                            >
                                中
                            </button>
                            <button
                                onClick={() => setFontSize('lg')}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    fontSize === 'lg' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                                title="放大字級 18px（推薦）"
                            >
                                大
                            </button>
                            <button
                                onClick={() => setFontSize('xl')}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    fontSize === 'xl' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                                title="特大字級 20px"
                            >
                                特大
                            </button>
                        </div>

                        {/* 高亮開關 */}
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
                            <span>{highlightTerms ? "名詞標註：開" : "標註：關"}</span>
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
                            <span>{isCustomMode ? "返回牌組精讀" : "貼上自訂課文"}</span>
                        </button>
                    </div>
                </div>

                {/* 自訂文本輸入區 (若處於自訂模式) */}
                {isCustomMode && (
                    <div className="p-3.5 bg-gray-850 rounded-xl border border-purple-500/30 flex flex-col gap-2.5 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                                <FileText className="w-4 h-4" /> 貼上您想精讀的原汁原味全英課文（段落間請空一行）：
                            </span>
                            <span className="text-[11px] text-gray-500">
                                系統將保留純英文段落，並自動為您標出專有名詞
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
                <div className="flex items-center justify-between bg-gray-850/80 px-3.5 py-2 rounded-xl border border-gray-800/80 shadow-sm">
                    <button
                        disabled={currentChunkIdx === 0}
                        onClick={() => setCurrentChunkIdx(prev => Math.max(0, prev - 1))}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentChunkIdx === 0
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        }`}
                    >
                        <ChevronLeft className="w-4 h-4" /> 上一段
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-indigo-300">
                            段落 {currentChunkIdx + 1} / {chunks.length}
                        </span>
                        <div className="w-20 sm:w-44 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full transition-all duration-300 rounded-full"
                                style={{ width: `${((currentChunkIdx + 1) / chunks.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    <button
                        disabled={currentChunkIdx === chunks.length - 1}
                        onClick={() => setCurrentChunkIdx(prev => Math.min(chunks.length - 1, prev + 1))}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentChunkIdx === chunks.length - 1
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        }`}
                    >
                        下一段 <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* ================= 核心工作區：圖文對照並排佈局 (Split Layout Grid) ================= */}
                <div className={`grid grid-cols-1 ${layoutMode === 'split' ? 'lg:grid-cols-12 gap-5' : 'gap-4'} items-start`}>

                    {/* ===== 左側主欄：純英文學術正文與心智模型 ===== */}
                    <div className={`${layoutMode === 'split' ? 'lg:col-span-7' : 'w-full'} flex flex-col gap-4`}>
                        <div className="bg-gray-900/90 rounded-2xl border border-gray-800/80 shadow-xl p-4 sm:p-5 md:p-6 flex flex-col gap-4">

                            {/* 段落標題與發音朗讀 */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-800/70 pb-3">
                                <div>
                                    {currentChunk.term_en && (
                                        <span className="text-xs font-mono font-bold text-indigo-400 block mb-0.5">
                                            {currentChunk.term_en}
                                        </span>
                                    )}
                                    <h2 className="text-lg md:text-xl font-black text-white font-mono leading-snug">
                                        {currentChunk.title}
                                    </h2>
                                </div>

                                <button
                                    onClick={() => speakText(`${currentChunk.title}. ${currentChunk.text}`)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shrink-0 ${
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

                            {/* 純英文學術正文（間距放大、乾淨無重複包框、寬敞舒適可讀性） */}
                            <div className={`text-gray-100 ${getFontSizeClass()} ${getLineSpacingClass()} whitespace-pre-wrap font-sans leading-relaxed tracking-normal select-text py-1`}>
                                {renderAnnotatedText(currentChunk.text)}
                            </div>

                            {/* 理工心智錨點註解 (Sleek Engineering Analogy Callout) */}
                            {currentChunk.analogy && (
                                <div className="border-l-2 border-cyan-400 bg-cyan-950/20 pl-3.5 pr-3 py-2.5 rounded-r-xl flex items-start gap-2.5">
                                    <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300 font-mono mb-0.5">
                                            ⚡ 理工工程直覺心智模型 (Engineering Analogy)
                                        </h4>
                                        <p className="text-xs md:text-sm text-gray-200 leading-relaxed font-mono">
                                            {currentChunk.analogy}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 可折疊之繁體中文對照翻譯 (輔助理解，不覆蓋原文) */}
                            {currentChunk.translation_zh && (
                                <div className="border border-gray-800/70 rounded-xl overflow-hidden bg-gray-950/30">
                                    <button
                                        onClick={() => setShowTranslation(!showTranslation)}
                                        className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800/40 transition-colors"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Languages className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>{showTranslation ? "隱藏中文對照翻譯" : "📖 看不懂？點擊展開繁體中文對照翻譯"}</span>
                                        </span>
                                        {showTranslation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                    {showTranslation && (
                                        <div className="px-3.5 py-3 text-xs md:text-sm text-gray-300 leading-relaxed border-t border-gray-800/70 bg-gray-950/40 font-sans">
                                            {currentChunk.translation_zh}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ================= 理工心智學伴即時問答 (CogniTutor) ================= */}
                            <div className="border border-indigo-500/25 rounded-xl overflow-hidden bg-gradient-to-b from-gray-900/90 to-gray-950/90 shadow-lg flex flex-col">
                                {/* 學伴標題列與模式切換 */}
                                <div className="px-3.5 py-2.5 bg-gray-850/80 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                                            <Bot className="w-3.5 h-3.5" />
                                        </div>
                                        <h4 className="text-xs font-black text-white flex items-center gap-1.5 font-mono">
                                            <span>💡 理工學伴 (CogniTutor)</span>
                                            <span className="text-[10px] font-normal text-indigo-300">
                                                · 依當前課文答疑
                                            </span>
                                        </h4>
                                    </div>

                                    {/* 模式切換按鈕組 (AI 模式 vs 離線 0 額度模式) */}
                                    <div className="flex items-center gap-1 bg-gray-800/80 p-0.5 rounded-lg border border-gray-700 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setTutorForceOffline(false)}
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                                                !tutorForceOffline
                                                    ? 'bg-emerald-600 text-white shadow'
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                            title="使用 Gemini Flash 極輕量回答（每天 1,500 次免費額度，每次僅吃 ~300 tokens）"
                                        >
                                            <Sparkles className="w-3 h-3 text-emerald-200" />
                                            <span>AI 深度解讀</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTutorForceOffline(true)}
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                                                tutorForceOffline
                                                    ? 'bg-purple-600 text-white shadow'
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                            title="100% 離線檢索本機因果鏈與工程錨點，完全不消耗任何 API 額度"
                                        >
                                            <Cpu className="w-3 h-3 text-purple-200" />
                                            <span>⚡ 離線 0 額度</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 快速提問建議標籤 (One-Tap Prompts) */}
                                <div className="px-3 py-2 bg-gray-900/50 border-b border-gray-800/60 flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-gray-500">快速發問：</span>
                                    <button
                                        type="button"
                                        onClick={() => handleAskTutor("請用電機電路或狀態機的角度，再為我白話解釋一次這段機制。")}
                                        className="px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-750 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono transition-colors"
                                    >
                                        ⚡ 電機角度白話
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAskTutor("這段課文裡面的生醫專有名詞，核心因果連鎖關係是什麼？")}
                                        className="px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-750 text-cyan-300 border border-cyan-500/20 text-[11px] font-mono transition-colors"
                                    >
                                        ⛓️ 核心因果骨牌
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAskTutor("如果這個機轉被藥物或突變干擾阻斷，系統會發生什麼極端狀態變化？")}
                                        className="px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-750 text-amber-300 border border-amber-500/20 text-[11px] font-mono transition-colors"
                                    >
                                        ⚠️ 異常干擾推演
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAskTutor("請根據這段純英文內容，出一題臺大 Smart MHI 期末考風格的觀念選擇題考考我。")}
                                        className="px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-750 text-rose-300 border border-rose-500/20 text-[11px] font-mono transition-colors"
                                    >
                                        🎯 出 1 題英文測驗
                                    </button>
                                </div>

                                {/* 歷史問答對話泡泡 */}
                                <div className="p-3.5 flex flex-col gap-2.5 max-h-64 overflow-y-auto custom-scrollbar">
                                    {tutorHistory.length === 0 ? (
                                        <div className="py-2.5 text-center text-gray-500 text-xs">
                                            💬 讀不懂這段或想知道更多理工直覺類比？點擊上方快速標籤或在下方直接提問！
                                        </div>
                                    ) : (
                                        tutorHistory.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`flex gap-2 items-start ${
                                                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                                                }`}
                                            >
                                                {msg.role === 'assistant' && (
                                                    <div className="w-5 h-5 rounded-md bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                                                        <Bot className="w-3 h-3" />
                                                    </div>
                                                )}
                                                <div
                                                    className={`max-w-[88%] rounded-xl p-2.5 text-xs leading-relaxed ${
                                                        msg.role === 'user'
                                                            ? 'bg-indigo-600 text-white font-medium shadow-sm'
                                                            : 'bg-gray-850 border border-gray-750 text-gray-200 font-sans shadow-inner whitespace-pre-wrap'
                                                    }`}
                                                >
                                                    {msg.role === 'assistant' && (
                                                        <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-gray-750 text-[10px] text-gray-400">
                                                            <span>{msg.mode === 'ai' ? '🟢 Gemini Flash (極省額度)' : '⚡ 離線知識庫 (0 額度消耗)'}</span>
                                                        </div>
                                                    )}
                                                    <div>{msg.text}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {tutorLoading && (
                                        <div className="flex gap-2 items-center text-xs text-indigo-400 py-1">
                                            <Loader className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                            <span>理工學伴正在為您思考解答...</span>
                                        </div>
                                    )}
                                </div>

                                {/* 發問輸入框 */}
                                <div className="p-2.5 bg-gray-950/60 border-t border-gray-800 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={tutorQuestion}
                                        onChange={(e) => setTutorQuestion(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAskTutor();
                                            }
                                        }}
                                        placeholder="針對本段課文提問（例如：為什麼需要去極化？這和電容充電有何不同？）..."
                                        className="flex-1 bg-gray-900 border border-gray-750 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                    <button
                                        disabled={tutorLoading || !tutorQuestion.trim()}
                                        onClick={() => handleAskTutor()}
                                        className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-sm shrink-0"
                                        title="發送提問"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                    {tutorHistory.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setTutorHistory([])}
                                            className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white transition-colors shrink-0"
                                            title="清空問答紀錄"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 底部段落切換快捷列 */}
                            <div className="flex justify-between items-center pt-2.5 border-t border-gray-800/70">
                                <span className="text-[11px] text-gray-400">
                                    💡 提示：點擊綠色標籤即可查看理工工程類比與詞根拆解
                                </span>

                                <button
                                    onClick={() => {
                                        if (currentChunkIdx < chunks.length - 1) {
                                            setCurrentChunkIdx(prev => prev + 1);
                                        }
                                    }}
                                    disabled={currentChunkIdx === chunks.length - 1}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        currentChunkIdx === chunks.length - 1
                                            ? 'opacity-30 cursor-not-allowed text-gray-500'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 hover:scale-[1.02]'
                                    }`}
                                >
                                    <span>讀完進入下一段</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ===== 右側邊欄：相關 PDF 講義 / 投影片與圖解觀測區 ===== */}
                    {layoutMode === 'split' && (
                        <div className="lg:col-span-5 flex flex-col gap-3 lg:sticky lg:top-4">
                            <div className="bg-gray-900/90 rounded-2xl border border-gray-800/80 p-3.5 sm:p-4 shadow-xl flex flex-col gap-3 backdrop-blur-md">
                                <div className="flex items-center justify-between pb-2.5 border-b border-gray-800/70">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                            <ImageIcon className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                                                <span>相關講義 / PDF 投影片對照</span>
                                            </h3>
                                            <span className="text-[10px] text-gray-400">
                                                {activeSlide?.page ? `投影片第 ${activeSlide.page} 頁` : '講義示意圖'} {activeSlide?.isDirectMatch ? '· 本章直屬' : '· 牌組投影片'}
                                            </span>
                                        </div>
                                    </div>

                                    {activeSlide?.imagePath && (
                                        <button
                                            onClick={() => setLightboxImage(activeSlide)}
                                            className="px-2.5 py-1 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white border border-gray-700 text-xs font-bold flex items-center gap-1 transition-all"
                                            title="全螢幕放大查看高畫質投影片"
                                        >
                                            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>放大</span>
                                        </button>
                                    )}
                                </div>

                                {/* 投影片主畫面 */}
                                {activeSlide?.imagePath ? (
                                    <div
                                        onClick={() => setLightboxImage(activeSlide)}
                                        className="w-full relative rounded-2xl overflow-hidden bg-black/90 border border-gray-750 flex items-center justify-center cursor-zoom-in group shadow-inner min-h-[220px] max-h-[380px]"
                                    >
                                        <img
                                            src={activeSlide.imagePath}
                                            alt={activeSlide.title || "PDF Slide"}
                                            className="w-full h-full object-contain max-h-[380px] group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs backdrop-blur-[2px]">
                                            <ZoomIn className="w-5 h-5 text-cyan-400" />
                                            <span>點擊全螢幕放大檢視細節</span>
                                        </div>
                                    </div>
                                ) : (
                                    /* 若此段落暫無對應圖片，提供即時貼上/上傳插槽 */
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-750 hover:border-indigo-500/50 bg-gray-900/60 hover:bg-indigo-950/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[200px]"
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const reader = new FileReader();
                                                    reader.onload = (evt) => attachImageToCurrentChunk(evt.target.result);
                                                    reader.readAsDataURL(e.target.files[0]);
                                                }
                                            }}
                                        />
                                        <UploadCloud className="w-8 h-8 text-indigo-400 mb-2 opacity-70" />
                                        <h4 className="text-xs font-bold text-gray-300 mb-1">
                                            點擊上傳或按 Ctrl + V 貼上對應投影片
                                        </h4>
                                        <p className="text-[11px] text-gray-500 max-w-xs">
                                            可截圖 PDF 講義中的機制流程圖或投影片頁面，同步並排精讀
                                        </p>
                                    </div>
                                )}

                                {/* 投影片切換與縮圖列（若牌組有多張投影片） */}
                                {deckSlides.length > 1 && (
                                    <div className="pt-2 border-t border-gray-750">
                                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2 font-bold">
                                            <span>切換講義頁面 ({selectedSlideIdx + 1} / {deckSlides.length})</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    disabled={selectedSlideIdx === 0}
                                                    onClick={() => setSelectedSlideIdx(prev => Math.max(0, prev - 1))}
                                                    className="p-1 rounded-lg bg-gray-800 hover:bg-gray-750 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300"
                                                    title="上一張投影片"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    disabled={selectedSlideIdx === deckSlides.length - 1}
                                                    onClick={() => setSelectedSlideIdx(prev => Math.min(deckSlides.length - 1, prev + 1))}
                                                    className="p-1 rounded-lg bg-gray-800 hover:bg-gray-750 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300"
                                                    title="下一張投影片"
                                                >
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* 投影片縮圖條 */}
                                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                                            {deckSlides.map((slide, sIdx) => (
                                                <div
                                                    key={slide.id || sIdx}
                                                    onClick={() => setSelectedSlideIdx(sIdx)}
                                                    className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border cursor-pointer transition-all ${
                                                        sIdx === selectedSlideIdx
                                                            ? 'border-cyan-400 ring-2 ring-cyan-500/30 scale-105'
                                                            : 'border-gray-800 hover:border-gray-600 opacity-60 hover:opacity-100'
                                                    }`}
                                                    title={`第 ${slide.page || sIdx + 1} 頁: ${slide.title}`}
                                                >
                                                    <img src={slide.imagePath} alt="thumbnail" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ================= 全螢幕投影片放大檢視視窗 (Slide Lightbox Modal) ================= */}
                {lightboxImage && (
                    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 animate-fade-in">
                        <div className="flex justify-between items-center text-white pb-3 border-b border-gray-800">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                                    {lightboxImage.page ? `投影片第 ${lightboxImage.page} 頁` : '講義高畫質檢視'}
                                </span>
                                <h3 className="text-sm font-bold text-gray-200 truncate max-w-md">
                                    {lightboxImage.title}
                                </h3>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setLightboxZoom(prev => Math.max(0.75, prev - 0.25))}
                                    className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300"
                                    title="縮小"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-mono text-gray-400 min-w-[45px] text-center">
                                    {Math.round(lightboxZoom * 100)}%
                                </span>
                                <button
                                    onClick={() => setLightboxZoom(prev => Math.min(3, prev + 0.25))}
                                    className="p-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300"
                                    title="放大"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setLightboxZoom(1)}
                                    className="px-2.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-xs text-gray-400 font-bold"
                                >
                                    重設
                                </button>
                                <button
                                    onClick={() => {
                                        setLightboxImage(null);
                                        setLightboxZoom(1);
                                    }}
                                    className="p-2 rounded-xl bg-gray-800 hover:bg-red-900/60 text-gray-400 hover:text-white transition-colors ml-2"
                                    title="關閉"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                            <img
                                src={lightboxImage.imagePath}
                                alt="Full Slide"
                                style={{ transform: `scale(${lightboxZoom})`, transformOrigin: 'center center' }}
                                className="max-h-[85vh] max-w-[90vw] object-contain transition-transform duration-200 select-none shadow-2xl rounded-xl"
                            />
                        </div>
                    </div>
                )}

                {/* 彈出式生醫專有名詞解析卡 (Active Term Modal) */}
                {activeTermModal && (
                    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
                        <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 max-w-md w-full shadow-2xl relative space-y-3">
                            <button
                                onClick={() => setActiveTermModal(null)}
                                className="absolute top-4 right-4 p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-start justify-between gap-2 pr-7">
                                <div>
                                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">
                                        專有名詞即時標註
                                    </span>
                                    <h3 className="text-lg md:text-xl font-black text-white font-mono text-emerald-300">
                                        {activeTermModal.term_en}
                                    </h3>
                                </div>
                                {activeTermModal.term_zh && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 whitespace-nowrap">
                                        {activeTermModal.term_zh}
                                    </span>
                                )}
                            </div>

                            {/* 理工直覺對等概念 */}
                            {activeTermModal.engineeringAnchor && (
                                <div className="border-l-2 border-cyan-400 bg-cyan-950/30 pl-3 pr-2.5 py-2 rounded-r-lg text-xs text-cyan-200 font-mono flex items-start gap-2 shadow-inner">
                                    <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-cyan-300 block mb-0.5">⚡ 理工直覺對齊：</strong>
                                        <span>{activeTermModal.engineeringAnchor}</span>
                                    </div>
                                </div>
                            )}

                            {/* 詞根拆解 */}
                            {activeTermModal.etymology && (
                                <div className="p-2 bg-amber-950/20 rounded-lg border border-amber-500/20 text-[11px] text-amber-300/90 italic">
                                    🌱 詞根拆解：{activeTermModal.etymology}
                                </div>
                            )}

                            {/* 全英簡明定義 */}
                            {activeTermModal.definition_en && (
                                <div className="text-xs text-gray-300 leading-relaxed border-t border-gray-800/80 pt-2.5">
                                    <span className="font-bold text-gray-400 block mb-0.5 text-[11px]">學術定義 (Definition)：</span>
                                    {activeTermModal.definition_en}
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-1 border-t border-gray-800/60">
                                <button
                                    onClick={() => speakText(activeTermModal.term_en)}
                                    className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-750 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                >
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span>聽發音</span>
                                </button>

                                <button
                                    onClick={() => setActiveTermModal(null)}
                                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
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
