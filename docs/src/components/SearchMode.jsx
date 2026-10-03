import { useState, useEffect, useMemo } from 'react';
import { get as getIDB } from 'idb-keyval';
import {
    Search, Sparkles, BookOpen, Download, Copy, Printer, Check,
    Filter, Zap, Layers, Cpu, Compass, Globe, Eye, EyeOff
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
    }
];

const SearchMode = () => {
    const [query, setQuery] = useState('');
    const [selectedDeck, setSelectedDeck] = useState('All');
    const [allTerms, setAllTerms] = useState(DEFAULT_MHI_TERMS);
    const [isGlanceMode, setIsGlanceMode] = useState(false);
    const [revealedIds, setRevealedIds] = useState({});
    const [copied, setCopied] = useState(false);

    // 載入自訂牌組中儲存的 glossary
    useEffect(() => {
        const loadCustomGlossary = async () => {
            try {
                const customCards = await getIDB('custom_cards');
                if (customCards && Array.isArray(customCards)) {
                    const customTerms = [];
                    customCards.forEach(c => {
                        // 從第一張卡上的 glossary 提取
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
                        // 從卡片本身的 term_en 與 engineeringAnalogy 提取
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
                        // 合併並依 term_en 去重
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

    // 提取牌組分類清單
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
                            理工生醫雙語術語工作台 (Bilingual Anchor)
                        </h1>
                        <p className="text-gray-400 text-xs md:text-sm mt-1">
                            以電機、資工、機械工程直覺解構生醫全英術語。刷存在感的是看不懂的專有名詞，而非題目。
                        </p>
                    </div>

                    {/* 匯出動作工具列 */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setIsGlanceMode(!isGlanceMode)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                isGlanceMode
                                    ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-md'
                                    : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700'
                            }`}
                            title="遮蔽中文與類比，專門測試自己看見英文能不能一眼辨識"
                        >
                            {isGlanceMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{isGlanceMode ? "遮蔽模式 (測英文眼熟度)" : "術語遮蔽測試"}</span>
                        </button>

                        <button
                            onClick={handleCopyMarkdown}
                            className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-xs text-gray-200 font-bold transition-colors flex items-center gap-1.5"
                            title="複製為 Markdown 表格貼至 Notion 或個人筆記"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                            <span>{copied ? "已複製表格" : "複製 MD 表格"}</span>
                        </button>

                        <button
                            onClick={handleDownloadCSV}
                            className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-xs text-gray-200 font-bold transition-colors flex items-center gap-1.5"
                            title="匯出為 CSV 試算表"
                        >
                            <Download className="w-3.5 h-3.5 text-cyan-400" />
                            <span>匯出 CSV</span>
                        </button>

                        <button
                            onClick={handlePrintWindow}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                            title="開啟 A4 列印或存成 PDF 速查 Cheatsheet"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>列印 / 存為 PDF</span>
                        </button>
                    </div>
                </div>

                {/* 搜尋與分類過濾列 */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="搜尋英文術語 (Action Potential)、中文 (去極化)、或理工概念 (RC、狀態機、開關)..."
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

                    {availableDecks.length > 1 && (
                        <div className="flex items-center gap-2 bg-gray-900 border border-gray-700/80 rounded-2xl px-3 py-2">
                            <Filter className="w-4 h-4 text-emerald-400 shrink-0" />
                            <select
                                value={selectedDeck}
                                onChange={(e) => setSelectedDeck(e.target.value)}
                                className="bg-transparent text-xs text-gray-300 font-bold focus:outline-none cursor-pointer"
                            >
                                {availableDecks.map(deck => (
                                    <option key={deck} value={deck} className="bg-gray-900 text-white">
                                        {deck === 'All' ? '📂 所有學程單元' : `📂 ${deck}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
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
                    {filteredTerms.length === 0 ? (
                        <div className="col-span-full py-16 text-center text-gray-500 bg-gray-900/40 rounded-3xl border border-dashed border-gray-800">
                            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-400" />
                            <p className="text-sm">未找到符合「{query}」的專有名詞。</p>
                            <p className="text-xs text-gray-600 mt-1">您可切換上方牌組分類，或在「生成中心」上傳全新全英講義與 YouTube 影片！</p>
                        </div>
                    ) : (
                        filteredTerms.map((term, idx) => {
                            const isRevealed = !isGlanceMode || revealedIds[idx];

                            return (
                                <div
                                    key={idx}
                                    className="bg-gray-850/90 hover:bg-gray-800/90 border border-gray-750 hover:border-emerald-500/40 rounded-3xl p-5 transition-all shadow-lg flex flex-col justify-between group"
                                >
                                    <div>
                                        {/* 英文主標題與中文譯名 */}
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

                                        {/* 理工工程直覺對等概念 */}
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

                                        {/* 詞根詞綴拆解 */}
                                        {term.etymology && isRevealed && (
                                            <p className="text-xs text-amber-300/90 mt-2.5 bg-amber-950/20 p-2 rounded-xl border border-amber-500/20 italic">
                                                🌱 詞根拆解助記：{term.etymology}
                                            </p>
                                        )}

                                        {/* 全英簡明定義 */}
                                        {term.definition_en && (
                                            <p className="text-xs text-gray-300 mt-3 leading-relaxed border-t border-gray-800 pt-2.5">
                                                {term.definition_en}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchMode;
