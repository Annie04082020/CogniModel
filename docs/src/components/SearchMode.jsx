import { useState, useEffect, useMemo, useRef } from 'react';
import { get as getIDB } from 'idb-keyval';
import {
    Search, Sparkles, BookOpen, Download, Copy, Printer, Check,
    Filter, Zap, Layers, Cpu, Compass, Globe, Eye, EyeOff, Gamepad2,
    RotateCcw, Award, ArrowRight, ShieldCheck, Flame, Puzzle
} from 'lucide-react';

// NTU Smart MHI 理工跨界生醫基礎名詞庫（開箱即用，結合電機/資工/機械工程類比）
const DEFAULT_MHI_TERMS = [
    {
        term_en: "Action Potential",
        term_zh: "動作電位",
        engineeringAnchor: "單穩態觸發脈衝 (Monostable Pulse) / 施密特觸發器",
        etymology: "Action (主動/觸發) + Potential (位能/電位)",
        definition_en: "A rapid, all-or-none voltage spike across the excitable cell membrane initiated once threshold potential is breached.",
        deck: "神經電氣動力學"
    },
    {
        term_en: "Depolarization",
        term_zh: "去極化",
        engineeringAnchor: "電容急速充電 / 上升沿觸發 (Rising Edge Trigger)",
        etymology: "de- [去除/逆轉] + polar [極性] + -ization [名詞化過程]",
        definition_en: "A decrease in the absolute electrical potential difference across a cell membrane, driving voltage towards zero and positive values.",
        deck: "神經電氣動力學"
    },
    {
        term_en: "Repolarization",
        term_zh: "再極化",
        engineeringAnchor: "電容放電復位 / 下降沿復歸 (Falling Edge Reset)",
        etymology: "re- [重新] + polar [極性] + -ization [過程]",
        definition_en: "Return of the membrane potential to resting value driven by K+ ion efflux.",
        deck: "神經電氣動力學"
    },
    {
        term_en: "Refractory Period",
        term_zh: "不反應期",
        engineeringAnchor: "防彈跳延遲死區 (Debounce Dead Time) / 防反向短路迴流",
        etymology: "refractory [抗拒的/無效的] + period [時段]",
        definition_en: "A transient time window during or after an action potential during which the excitable membrane cannot trigger another spike.",
        deck: "神經電氣動力學"
    },
    {
        term_en: "Resting Membrane Potential",
        term_zh: "靜止膜電位",
        engineeringAnchor: "系統靜態偏壓 (DC Bias) / 基準地電位 (GND Offset, ~ -70mV)",
        etymology: "Resting [休止] + Membrane [介電質脂質雙層] + Potential [電位差]",
        definition_en: "The electrical potential difference maintained across the plasma membrane of an unexcited cell by active ion pumps and passive leak channels.",
        deck: "細胞生物物理"
    },
    {
        term_en: "Voltage-Gated Sodium Channel",
        term_zh: "電位敏感型鈉離子通道",
        engineeringAnchor: "壓控開關 (Voltage-Controlled Switch) 自帶定時自鎖 (Inactivation Gate)",
        etymology: "Voltage-Gated [電壓門控] + Sodium (Na+) + Channel [導通孔道]",
        definition_en: "Transmembrane protein that selectively allows rapid Na+ influx upon membrane depolarization, responsible for the action potential upstroke.",
        deck: "細胞生物物理"
    },
    {
        term_en: "Ligand-Gated Ion Channel",
        term_zh: "配體門控離子通道 (離子型受體)",
        engineeringAnchor: "API 端點密鑰校驗導通 / 外部硬體中斷接腳 (External Interrupt Pin)",
        etymology: "Ligand [拉丁語ligare綁紮/結合分子] + Gated [門控開關] + Channel",
        definition_en: "Integral membrane proteins that open a central pore in response to the specific binding of a chemical messenger (e.g. neurotransmitter).",
        deck: "神經傳導與突觸"
    },
    {
        term_en: "G-Protein Coupled Receptor (GPCR)",
        term_zh: "G蛋白偶聯受體 (代謝型受體)",
        engineeringAnchor: "非同步中繼代理 / 訊息佇列轉發器 (Message Broker & Queue Relay)",
        etymology: "Guanine nucleotide-binding + Coupled [偶聯交握] + Receptor [接收器]",
        definition_en: "A diverse family of 7-transmembrane domain receptors that activate intracellular signaling cascades through heterotrimeric G proteins.",
        deck: "細胞傳訊與藥理"
    },
    {
        term_en: "Negative Feedback Loop",
        term_zh: "負回饋調節迴路",
        engineeringAnchor: "運算放大器負反饋 (Op-Amp Negative Feedback) / PID 穩態閉迴路",
        etymology: "Negative [反向] + Feedback [反饋輸入] + Loop [封閉迴圈]",
        definition_en: "A primary physiological regulatory loop where the downstream system output counteracts deviations to maintain dynamic homeostasis.",
        deck: "系統生理學"
    },
    {
        term_en: "Saltatory Conduction",
        term_zh: "跳躍傳導",
        engineeringAnchor: "低電容同軸電纜中繼放大 / RC 時間常數最佳化",
        etymology: "Saltatory [跳躍的, 來自拉丁語saltare跳舞] + Conduction [傳播導電]",
        definition_en: "Rapid transmission of action potentials jumping from one Node of Ranvier to the next along myelinated axons.",
        deck: "神經電氣動力學"
    },
    {
        term_en: "Allosteric Regulation",
        term_zh: "別構調節 (變構效應)",
        engineeringAnchor: "輔助控制接腳 (Auxiliary Control Pin) / 運行時構型熱切換",
        etymology: "Allo- [其他/相異] + steric [空間立體構型] + Regulation [調控]",
        definition_en: "The modification of protein or enzyme activity by an effector molecule binding to a site distinct from the active catalytic site.",
        deck: "生物化學"
    },
    {
        term_en: "Threshold Potential",
        term_zh: "閾電位 (門檻電位)",
        engineeringAnchor: "邏輯閘高電位切換閾值 (Logic Gate High-Level Trigger, ~ -55mV)",
        etymology: "Threshold [臨界門檻]",
        definition_en: "The critical membrane potential value required to trigger an explosive, all-or-none action potential.",
        deck: "神經電氣動力學"
    }
];

const SearchMode = () => {
    const [subTab, setSubTab] = useState('list'); // 'list' | 'matchGame' | 'etymologyGame'
    const [query, setQuery] = useState('');
    const [selectedDeck, setSelectedDeck] = useState('All');
    const [allTerms, setAllTerms] = useState(DEFAULT_MHI_TERMS);
    const [isGlanceMode, setIsGlanceMode] = useState(false);
    const [revealedIds, setRevealedIds] = useState({});
    const [copied, setCopied] = useState(false);

    // ================= 小遊戲 1: 理工生醫連連看狀態 =================
    const [matchRound, setMatchRound] = useState(1);
    const [selectedTermEn, setSelectedTermEn] = useState(null);
    const [selectedAnalogy, setSelectedAnalogy] = useState(null);
    const [matchedPairs, setMatchedPairs] = useState(new Set());
    const [wrongPair, setWrongPair] = useState(null);
    const [matchStreak, setMatchStreak] = useState(0);

    // ================= 小遊戲 2: 詞根拆解拼圖狀態 =================
    const [etymQuestionIdx, setEtymQuestionIdx] = useState(0);
    const [etymScore, setEtymScore] = useState(0);
    const [selectedEtymChoice, setSelectedEtymChoice] = useState(null);
    const [isEtymAnswered, setIsEtymAnswered] = useState(false);

    // 載入自訂牌組中儲存的 glossary
    useEffect(() => {
        const loadCustomGlossary = async () => {
            try {
                const customCards = await getIDB('custom_cards');
                if (customCards && Array.isArray(customCards)) {
                    const customTerms = [];
                    customCards.forEach(c => {
                        if (c.glossary && Array.isArray(c.glossary)) {
                            c.glossary.forEach(g => {
                                if (g.term_en) {
                                    customTerms.push({
                                        term_en: g.term_en,
                                        term_zh: g.term_zh || '',
                                        engineeringAnchor: g.engineeringAnchor || '',
                                        etymology: g.etymology || '',
                                        definition_en: g.definition_en || '',
                                        deck: c.source || '自訂牌組'
                                    });
                                }
                            });
                        }
                        if (c.term_en && c.engineeringAnalogy) {
                            customTerms.push({
                                term_en: c.term_en,
                                term_zh: c.title || '',
                                engineeringAnchor: c.engineeringAnalogy || c.analogy || '',
                                etymology: '',
                                definition_en: c.description || '',
                                deck: c.source || '自訂牌組'
                            });
                        }
                    });

                    if (customTerms.length > 0) {
                        const termMap = new Map();
                        [...DEFAULT_MHI_TERMS, ...customTerms].forEach(item => {
                            const key = item.term_en.trim().toLowerCase();
                            if (!termMap.has(key)) {
                                termMap.set(key, item);
                            }
                        });
                        setAllTerms(Array.from(termMap.values()));
                    }
                }
            } catch (err) {
                console.error("Load glossary error:", err);
            }
        };

        loadCustomGlossary();
    }, []);

    // 牌組分類清單
    const availableDecks = useMemo(() => {
        const deckSet = new Set(allTerms.map(t => t.deck).filter(Boolean));
        return ['All', ...Array.from(deckSet)];
    }, [allTerms]);

    // 搜尋與篩選邏輯
    const filteredTerms = useMemo(() => {
        let results = allTerms;

        if (selectedDeck !== 'All') {
            results = results.filter(t => t.deck === selectedDeck);
        }

        if (query.trim()) {
            const q = query.toLowerCase();
            results = results.filter(t =>
                t.term_en.toLowerCase().includes(q) ||
                (t.term_zh && t.term_zh.toLowerCase().includes(q)) ||
                (t.engineeringAnchor && t.engineeringAnchor.toLowerCase().includes(q)) ||
                (t.etymology && t.etymology.toLowerCase().includes(q)) ||
                (t.definition_en && t.definition_en.toLowerCase().includes(q))
            );
        }

        return results;
    }, [allTerms, selectedDeck, query]);

    // ================= 小遊戲 1：動態連連看題目生成 =================
    const currentMatchPool = useMemo(() => {
        // 從當前術語庫挑選 5 個具備 engineeringAnchor 的術語
        const pool = allTerms.filter(t => t.engineeringAnchor);
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5);

        const leftItems = selected.map(t => ({
            id: t.term_en,
            term_en: t.term_en,
            term_zh: t.term_zh
        })).sort(() => 0.5 - Math.random());

        const rightItems = selected.map(t => ({
            id: t.term_en,
            engineeringAnchor: t.engineeringAnchor
        })).sort(() => 0.5 - Math.random());

        return { leftItems, rightItems, total: selected.length };
    }, [matchRound, allTerms]);

    // 處理連連看配對
    const handleMatchSelect = (type, item) => {
        if (type === 'left') {
            setSelectedTermEn(item.id);
            if (selectedAnalogy) {
                checkPair(item.id, selectedAnalogy);
            }
        } else {
            setSelectedAnalogy(item.id);
            if (selectedTermEn) {
                checkPair(selectedTermEn, item.id);
            }
        }
    };

    const checkPair = (termId, analogyId) => {
        if (termId === analogyId) {
            // 配對成功！
            setMatchedPairs(prev => new Set([...prev, termId]));
            setSelectedTermEn(null);
            setSelectedAnalogy(null);
            setMatchStreak(s => s + 1);
        } else {
            // 配對失敗
            setWrongPair({ termId, analogyId });
            setTimeout(() => {
                setWrongPair(null);
                setSelectedTermEn(null);
                setSelectedAnalogy(null);
            }, 600);
        }
    };

    const resetMatchGame = () => {
        setMatchedPairs(new Set());
        setSelectedTermEn(null);
        setSelectedAnalogy(null);
        setMatchRound(r => r + 1);
    };

    // ================= 小遊戲 2：詞根解構題庫生成 =================
    const etymologyPool = useMemo(() => {
        const pool = allTerms.filter(t => t.etymology);
        return pool.map(item => {
            // 找 3 個干擾選項
            const others = allTerms
                .filter(o => o.term_en !== item.term_en)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
            const options = [...others, item].sort(() => 0.5 - Math.random());
            return {
                correctTerm: item.term_en,
                term_zh: item.term_zh,
                etymology: item.etymology,
                options: options.map(o => o.term_en)
            };
        });
    }, [allTerms]);

    const currentEtymQuestion = etymologyPool[etymQuestionIdx % etymologyPool.length];

    const handleEtymChoice = (choice) => {
        if (isEtymAnswered) return;
        setSelectedEtymChoice(choice);
        setIsEtymAnswered(true);
        if (choice === currentEtymQuestion.correctTerm) {
            setEtymScore(s => s + 1);
        }
    };

    const nextEtymQuestion = () => {
        setSelectedEtymChoice(null);
        setIsEtymAnswered(false);
        setEtymQuestionIdx(idx => idx + 1);
    };

    // 切換眼熟遮蔽狀態
    const toggleReveal = (idx) => {
        setRevealedIds(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    // 複製為 Markdown 表格
    const handleCopyMarkdown = () => {
        const header = "| 英文專有名詞 (Term EN) | 中文學術譯名 | ⚡ 理工工程直覺 (Engineering Analogy) | 希臘/拉丁詞根拆解 (Etymology) | 全英學術定義 (Definition) |\n| :--- | :--- | :--- | :--- | :--- |\n";
        const rows = filteredTerms.map(t =>
            `| **${t.term_en}** | ${t.term_zh || '-'} | \`${t.engineeringAnchor || '-'}\` | ${t.etymology || '-'} | ${t.definition_en || '-'} |`
        ).join('\n');

        navigator.clipboard.writeText(header + rows);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // 下載為 CSV 檔案
    const handleDownloadCSV = () => {
        const csvRows = [
            ["Term (English)", "Term (Chinese)", "Engineering Analogy", "Etymology", "Definition (English)", "Deck"].map(v => `"${v}"`).join(",")
        ];

        filteredTerms.forEach(t => {
            csvRows.push([
                t.term_en,
                t.term_zh || '',
                t.engineeringAnchor || '',
                t.etymology || '',
                t.definition_en || '',
                t.deck || ''
            ].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(","));
        });

        const blob = new Blob(["\ufeff" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `NTU_Smart_MHI_Bilingual_Glossary_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 列印 / PDF 友善排版視窗
    const handlePrintWindow = () => {
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>NTU Smart MHI 理工生醫雙語術語速查 Cheatsheet</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; }
                    h1 { margin-bottom: 4px; font-size: 20px; }
                    p.sub { font-size: 12px; color: #555; margin-top: 0; margin-bottom: 16px; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; vertical-align: top; }
                    th { background-color: #f2f4f8; font-weight: bold; }
                    .term-en { font-weight: bold; font-size: 13px; color: #0f4c81; }
                    .analog { color: #026773; font-family: monospace; font-weight: bold; }
                    .etym { color: #885500; font-size: 11px; font-style: italic; }
                </style>
            </head>
            <body>
                <h1>NTU Smart MHI 全英生醫專有名詞 × 理工直覺對照表</h1>
                <p class="sub">建立日期：${new Date().toLocaleDateString()} | 術語總計：${filteredTerms.length} 個 | 專供全英課程術語眼熟度強化與考前快速錨定</p>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 22%;">英文術語 (English Term)</th>
                            <th style="width: 14%;">中文譯名</th>
                            <th style="width: 28%;">⚡ 理工工程直覺 (Engineering Analogy)</th>
                            <th style="width: 36%;">詞根拆解與學術定義 (Etymology & Definition)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredTerms.map(t => `
                            <tr>
                                <td><span class="term-en">${t.term_en}</span></td>
                                <td>${t.term_zh || '-'}</td>
                                <td><span class="analog">${t.engineeringAnchor || '-'}</span></td>
                                <td>
                                    ${t.etymology ? `<div class="etym">🌱 ${t.etymology}</div>` : ''}
                                    <div>${t.definition_en || '-'}</div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 300);
        }
    };

    return (
        <div className="h-full w-full flex flex-col items-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-5xl space-y-6 animate-fade-in pb-20">

                {/* 頂部標題 */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-800 pb-5">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-2">
                            <Cpu className="w-3.5 h-3.5" /> NTU Smart MHI 全英語跨域特化
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                            雙語術語工作台 & 熟悉單字小遊戲
                        </h1>
                        <p className="text-gray-400 text-xs md:text-sm mt-1">
                            以電機、資工、機械工程直覺解構生醫全英術語。刷存在感的是看不懂的專有名詞，而非做選擇題。
                        </p>
                    </div>

                    {/* 主次分頁切換按鈕 */}
                    <div className="flex bg-gray-900 p-1 rounded-2xl border border-gray-800">
                        <button
                            onClick={() => setSubTab('list')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                subTab === 'list'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <BookOpen className="w-3.5 h-3.5" /> 術語清單與匯出
                        </button>

                        <button
                            onClick={() => setSubTab('matchGame')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                subTab === 'matchGame'
                                    ? 'bg-cyan-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Zap className="w-3.5 h-3.5 text-yellow-300" /> 理工連連看
                        </button>

                        <button
                            onClick={() => setSubTab('etymologyGame')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                subTab === 'etymologyGame'
                                    ? 'bg-amber-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Puzzle className="w-3.5 h-3.5 text-amber-200" /> 詞根解構拼圖
                        </button>
                    </div>
                </div>

                {/* ================= MODE 1: 術語清單與匯出 (List View) ================= */}
                {subTab === 'list' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* 工具列與搜尋 */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="搜尋英文術語 (Action Potential)、中文 (去極化)、或理工概念 (RC、狀態機)..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700/80 rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 shadow-inner"
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white bg-gray-800 px-2 py-0.5 rounded-lg"
                                    >
                                        清除
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar flex-nowrap w-full md:w-auto shrink-0 py-0.5">
                                <button
                                    onClick={() => setIsGlanceMode(!isGlanceMode)}
                                    className={`px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shrink-0 whitespace-nowrap ${
                                        isGlanceMode
                                            ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-md'
                                            : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700'
                                    }`}
                                    title="遮蔽中文與類比，專門測試自己看見英文能不能一眼辨識"
                                >
                                    {isGlanceMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    <span>{isGlanceMode ? "遮蔽測試中" : "術語遮蔽測試"}</span>
                                </button>

                                <button
                                    onClick={handleCopyMarkdown}
                                    className="px-3 py-2 sm:py-2.5 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-xs text-gray-200 font-bold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                                    title="複製為 Markdown 表格貼至 Notion 或個人筆記"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                                    <span>{copied ? "已複製表格" : "複製 MD 表格"}</span>
                                </button>

                                <button
                                    onClick={handleDownloadCSV}
                                    className="px-3 py-2 sm:py-2.5 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-xs text-gray-200 font-bold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                                    title="匯出為 CSV 試算表"
                                >
                                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>匯出 CSV</span>
                                </button>

                                <button
                                    onClick={handlePrintWindow}
                                    className="px-3.5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                                    title="開啟 A4 列印或存成 PDF 速查 Cheatsheet"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>列印 / 存為 PDF</span>
                                </button>
                            </div>
                        </div>

                        {/* 統計與提示徽章 */}
                        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                            <span>
                                共篩選出 <strong className="text-emerald-400">{filteredTerms.length}</strong> 個核心生醫英文專有名詞
                            </span>
                            <span className="text-[11px] text-gray-500">
                                提示：點擊任何卡片上的「⚡ 理工類比」可放大體會底層物理機制
                            </span>
                        </div>

                        {/* 術語卡片清單 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredTerms.map((term, idx) => {
                                const isRevealed = !isGlanceMode || revealedIds[idx];

                                return (
                                    <div
                                        key={idx}
                                        className="bg-gray-850/90 hover:bg-gray-800/90 border border-gray-750 hover:border-emerald-500/40 rounded-3xl p-5 transition-all shadow-lg flex flex-col justify-between group"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block mb-0.5">
                                                        {term.deck}
                                                    </span>
                                                    <h3 className="text-lg md:text-xl font-black text-white font-mono tracking-tight text-emerald-300">
                                                        {term.term_en}
                                                    </h3>
                                                </div>

                                                {isRevealed ? (
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 whitespace-nowrap">
                                                        {term.term_zh || "學術名詞"}
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => toggleReveal(idx)}
                                                        className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:bg-amber-900/50 transition-colors"
                                                    >
                                                        點擊揭曉中文
                                                    </button>
                                                )}
                                            </div>

                                            {term.engineeringAnchor && (
                                                <div className="mt-3">
                                                    {isRevealed ? (
                                                        <div className="text-xs text-cyan-300 bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/30 font-mono flex items-start gap-2 shadow-inner">
                                                            <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                                            <div>
                                                                <strong className="text-cyan-200">理工對等直覺：</strong>
                                                                <span>{term.engineeringAnchor}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            onClick={() => toggleReveal(idx)}
                                                            className="text-xs text-gray-500 bg-gray-900 p-2.5 rounded-xl border border-gray-800 cursor-pointer hover:border-gray-700 transition-colors font-mono"
                                                        >
                                                            🔒 點擊揭曉理工工程直覺類比...
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {term.etymology && isRevealed && (
                                                <p className="text-xs text-amber-300/90 mt-2.5 bg-amber-950/20 p-2 rounded-xl border border-amber-500/20 italic">
                                                    🌱 詞根拆解助記：{term.etymology}
                                                </p>
                                            )}

                                            {term.definition_en && (
                                                <p className="text-xs text-gray-300 mt-3 leading-relaxed border-t border-gray-800 pt-2.5">
                                                    {term.definition_en}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ================= MODE 2: 理工生醫連連看 (Match Game) ================= */}
                {subTab === 'matchGame' && (
                    <div className="bg-gray-850 p-6 md:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl flex flex-col gap-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-750 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-400" />
                                    <h2 className="text-xl font-black text-white">⚡ 理工生醫直覺連連看 (Round #{matchRound})</h2>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    點選左側【全英生醫術語】，再點選右側【理工工程對等直覺】，打通兩者心智神經連結！
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-500/30 flex items-center gap-1.5">
                                    <Flame className="w-3.5 h-3.5 text-amber-400" /> 連續配對：{matchStreak}
                                </span>
                                <button
                                    onClick={resetMatchGame}
                                    className="px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-bold transition-all flex items-center gap-1"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> 換一輪
                                </button>
                            </div>
                        </div>

                        {/* 配對遊戲主盤 */}
                        {matchedPairs.size === currentMatchPool.total ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center gap-4 bg-emerald-950/20 rounded-2xl border border-emerald-500/30 animate-fade-in">
                                <Award className="w-16 h-16 text-yellow-400 animate-bounce" />
                                <h3 className="text-2xl font-black text-emerald-300">🎉 本輪全數配對成功！</h3>
                                <p className="text-xs text-gray-300 max-w-md">
                                    太棒了！您已經能將這些全英文學術名詞，瞬間映射到相應的電氣、控制與資訊系統模型！
                                </p>
                                <button
                                    onClick={resetMatchGame}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                                >
                                    <span>挑戰下一輪新術語</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 左側：全英生醫術語 */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 font-mono">
                                        [A] 全英生醫術語 (BioMed English)
                                    </h4>
                                    {currentMatchPool.leftItems.map(item => {
                                        const isMatched = matchedPairs.has(item.id);
                                        const isSelected = selectedTermEn === item.id;
                                        const isWrong = wrongPair && wrongPair.termId === item.id;

                                        return (
                                            <button
                                                key={item.id}
                                                disabled={isMatched}
                                                onClick={() => handleMatchSelect('left', item)}
                                                className={`w-full p-4 rounded-2xl text-left transition-all border flex items-center justify-between ${
                                                    isMatched
                                                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 opacity-60 cursor-default'
                                                        : isWrong
                                                        ? 'bg-rose-950/50 border-rose-500 text-rose-300 animate-shake'
                                                        : isSelected
                                                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg scale-[1.02]'
                                                        : 'bg-gray-900 border-gray-750 text-white hover:border-indigo-500/60 hover:bg-gray-800'
                                                }`}
                                            >
                                                <div>
                                                    <span className="font-mono font-black text-sm block">
                                                        {item.term_en}
                                                    </span>
                                                    {isMatched && (
                                                        <span className="text-[11px] text-emerald-300 font-bold">
                                                            ✓ {item.term_zh}
                                                        </span>
                                                    )}
                                                </div>
                                                {isMatched && <Check className="w-4 h-4 text-emerald-400" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* 右側：理工工程直覺對等 */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 font-mono">
                                        [B] 理工工程直覺 (Engineering Analogy)
                                    </h4>
                                    {currentMatchPool.rightItems.map(item => {
                                        const isMatched = matchedPairs.has(item.id);
                                        const isSelected = selectedAnalogy === item.id;
                                        const isWrong = wrongPair && wrongPair.analogyId === item.id;

                                        return (
                                            <button
                                                key={item.id}
                                                disabled={isMatched}
                                                onClick={() => handleMatchSelect('right', item)}
                                                className={`w-full p-4 rounded-2xl text-left transition-all border flex items-center justify-between ${
                                                    isMatched
                                                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 opacity-60 cursor-default'
                                                        : isWrong
                                                        ? 'bg-rose-950/50 border-rose-500 text-rose-300 animate-shake'
                                                        : isSelected
                                                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg scale-[1.02]'
                                                        : 'bg-gray-900 border-gray-750 text-gray-200 hover:border-cyan-500/60 hover:bg-gray-800'
                                                }`}
                                            >
                                                <span className="font-mono text-xs font-medium leading-relaxed">
                                                    ⚡ {item.engineeringAnchor}
                                                </span>
                                                {isMatched && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ================= MODE 3: 詞根解構拼圖小遊戲 (Etymology Slicer) ================= */}
                {subTab === 'etymologyGame' && (
                    <div className="bg-gray-850 p-6 md:p-8 rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col gap-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-750 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Puzzle className="w-5 h-5 text-amber-400" />
                                    <h2 className="text-xl font-black text-white">🌱 希臘/拉丁詞根解構大挑戰</h2>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    生醫名詞不是死背硬記，而是像樂高積木一樣由詞根組合而成！根據解構公式，辨識出是哪個全英專有名詞。
                                </p>
                            </div>

                            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-500/30">
                                累計答對：{etymScore} 題
                            </span>
                        </div>

                        {currentEtymQuestion ? (
                            <div className="flex flex-col gap-6">
                                {/* 詞根積木展示板 */}
                                <div className="p-6 bg-gradient-to-r from-amber-950/40 via-gray-900 to-amber-950/40 rounded-2xl border border-amber-500/40 text-center space-y-2">
                                    <span className="text-xs text-amber-300 font-extrabold uppercase tracking-widest font-mono">
                                        拆解積木公式 (Etymology Formula)
                                    </span>
                                    <p className="text-lg md:text-xl font-black text-white font-mono leading-relaxed">
                                        {currentEtymQuestion.etymology}
                                    </p>
                                    <span className="text-xs text-gray-400 block pt-1">
                                        中文線索：{currentEtymQuestion.term_zh}
                                    </span>
                                </div>

                                {/* 四選一選項卡片 */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {currentEtymQuestion.options.map((opt, i) => {
                                        const isCorrect = opt === currentEtymQuestion.correctTerm;
                                        const isChosen = selectedEtymChoice === opt;

                                        let btnClass = "bg-gray-900 border-gray-750 text-white hover:bg-gray-800 hover:border-amber-500/40";
                                        if (isEtymAnswered) {
                                            if (isCorrect) {
                                                btnClass = "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md font-bold";
                                            } else if (isChosen) {
                                                btnClass = "bg-rose-950/80 border-rose-500 text-rose-300";
                                            } else {
                                                btnClass = "opacity-40 border-gray-800 text-gray-500";
                                            }
                                        }

                                        return (
                                            <button
                                                key={i}
                                                disabled={isEtymAnswered}
                                                onClick={() => handleEtymChoice(opt)}
                                                className={`p-4 rounded-2xl text-left border transition-all flex items-center justify-between font-mono text-sm ${btnClass}`}
                                            >
                                                <span>{opt}</span>
                                                {isEtymAnswered && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                {isEtymAnswered && (
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-800 animate-fade-in">
                                        <span className="text-xs text-gray-300">
                                            {selectedEtymChoice === currentEtymQuestion.correctTerm ? (
                                                <strong className="text-emerald-400">✓ 恭喜答對！正確辨識出該名詞！</strong>
                                            ) : (
                                                <span className="text-rose-400">
                                                    正確答案是：<strong>{currentEtymQuestion.correctTerm}</strong>
                                                </span>
                                            )}
                                        </span>

                                        <button
                                            onClick={nextEtymQuestion}
                                            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                                        >
                                            <span>下一題</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 italic">詞根庫載入中...</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchMode;
