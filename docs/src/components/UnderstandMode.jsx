import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lightbulb, CheckCircle2, XCircle, ArrowRight, Sparkles, HelpCircle,
    RotateCcw, GitBranch, Compass, AlertTriangle, Layers, Eye, EyeOff
} from 'lucide-react';

const UnderstandMode = ({ cards, topic, onExit, onOpenImport }) => {
    // subMode: 'chain' (動態因果鏈與干擾模擬), 'socratic' (蘇格拉底深度探究), 'blindspot' (思維盲點校準), 'match' (基礎因果連連看)
    const [subMode, setSubMode] = useState('chain');

    const [mechanismChains, setMechanismChains] = useState([]);
    const [socraticQuestions, setSocraticQuestions] = useState([]);
    const [logicPairs, setLogicPairs] = useState([]);
    const [mythBusters, setMythBusters] = useState([]);

    // 1. Mechanism Chain States
    const [currentChainIdx, setCurrentChainIdx] = useState(0);
    const [isPerturbationApplied, setIsPerturbationApplied] = useState(false);

    // 2. Socratic States
    const [currentSocraticIdx, setCurrentSocraticIdx] = useState(0);
    const [revealedHintCount, setRevealedHintCount] = useState(0);
    const [showSocraticInsight, setShowSocraticInsight] = useState(false);

    // 3. Blindspot Buster States
    const [currentBlindspotIdx, setCurrentBlindspotIdx] = useState(0);
    const [userBlindspotChoice, setUserBlindspotChoice] = useState(null);
    const [showBlindspotAnalysis, setShowBlindspotAnalysis] = useState(false);

    // 4. Logic Match States
    const [leftItems, setLeftItems] = useState([]);
    const [rightItems, setRightItems] = useState([]);
    const [selectedLeft, setSelectedLeft] = useState(null);
    const [selectedRight, setSelectedRight] = useState(null);
    const [matchedIds, setMatchedIds] = useState([]);
    const [matchFeedback, setMatchFeedback] = useState(null);

    useEffect(() => {
        if (!cards || cards.length === 0) return;

        const aggChains = [];
        const aggSocratic = [];
        const aggLogic = [];
        const aggMyths = [];

        cards.forEach(card => {
            if (card.mechanismChains && Array.isArray(card.mechanismChains)) {
                aggChains.push(...card.mechanismChains);
            }
            if (card.socraticQuestions && Array.isArray(card.socraticQuestions)) {
                aggSocratic.push(...card.socraticQuestions);
            }
            if (card.logicPairs && Array.isArray(card.logicPairs)) {
                aggLogic.push(...card.logicPairs);
            }
            if (card.mythBusters && Array.isArray(card.mythBusters)) {
                aggMyths.push(...card.mythBusters);
            }
        });

        // 降級兼容：如果沒有特定因果鏈，由現有卡片自動產生基礎鏈
        if (aggChains.length === 0 && cards.length >= 2) {
            const stepList = cards.slice(0, 4).map((c, i) => `步驟 ${i + 1}：${c.title}（${c.description.slice(0, 45)}...）`);
            aggChains.push({
                chainTitle: `${topic === "All" ? "核心系統" : topic} 運作機制連鎖`,
                steps: stepList,
                perturbation: {
                    condition: `假設系統中的關鍵環節「${cards[0].title}」受到外力抑制或突發干擾`,
                    impactStep: 1,
                    outcome: "初期觸發鏈中斷，導致後續所有骨牌效應無法被啟動",
                    analysis: `深層原理：${cards[0].title} 是整體動態因果的關鍵起點，一旦此環節受阻，後續反應無法達成臨界閾值。`
                }
            });
        }

        if (aggSocratic.length === 0 && cards.length > 0) {
            cards.slice(0, 3).forEach(c => {
                aggSocratic.push({
                    paradox: `關於【${c.title}】，為什麼大自然或系統會設計成這樣，而不是採用更直接的方式？`,
                    hints: [
                        `思考線索 1：觀察其生活化比喻「${c.analogy || "能量與穩定性權衡"}」`,
                        `思考線索 2：注意它背後的限制條件：${c.description.slice(0, 50)}...`
                    ],
                    deepInsight: `心智模型本質：${c.description}`
                });
            });
        }

        setMechanismChains(aggChains);
        setSocraticQuestions(aggSocratic);
        setLogicPairs(aggLogic);
        setMythBusters(aggMyths);

        // 初始化 Match
        if (aggLogic.length > 0) {
            initMatchGame(aggLogic);
        }

        // 自動優先顯示有資料的頂級模式
        if (aggChains.length > 0) {
            setSubMode('chain');
        } else if (aggSocratic.length > 0) {
            setSubMode('socratic');
        } else if (aggMyths.length > 0) {
            setSubMode('blindspot');
        } else {
            setSubMode('match');
        }
    }, [cards, topic]);

    const initMatchGame = (pairs) => {
        const pool = [...pairs].slice(0, 5);
        const left = pool.map((p, idx) => ({ id: `p_${idx}`, text: p.cause, pair: p }));
        const right = pool.map((p, idx) => ({ id: `p_${idx}`, text: p.effect, pair: p }));
        setLeftItems(left.sort(() => Math.random() - 0.5));
        setRightItems(right.sort(() => Math.random() - 0.5));
        setSelectedLeft(null);
        setSelectedRight(null);
        setMatchedIds([]);
        setMatchFeedback(null);
    };

    const handleSelectLeft = (item) => {
        if (matchedIds.includes(item.id)) return;
        setSelectedLeft(item);
        if (selectedRight) checkMatch(item, selectedRight);
    };

    const handleSelectRight = (item) => {
        if (matchedIds.includes(item.id)) return;
        setSelectedRight(item);
        if (selectedLeft) checkMatch(selectedLeft, item);
    };

    const checkMatch = (left, right) => {
        if (left.id === right.id) {
            setMatchedIds(prev => [...prev, left.id]);
            setMatchFeedback({
                success: true,
                title: "因果機制吻合！",
                explanation: left.pair.explanation || `【${left.text}】必然引發【${right.text}】`
            });
            setSelectedLeft(null);
            setSelectedRight(null);
        } else {
            setMatchFeedback({
                success: false,
                title: "因果未對應",
                explanation: "試著推敲先後啟動的機制因果鏈。"
            });
            setTimeout(() => {
                setSelectedLeft(null);
                setSelectedRight(null);
            }, 800);
        }
    };

    const handleBlindspotAnswer = (answer) => {
        if (showBlindspotAnalysis) return;
        setUserBlindspotChoice(answer);
        setShowBlindspotAnalysis(true);
    };

    const nextBlindspot = () => {
        setUserBlindspotChoice(null);
        setShowBlindspotAnalysis(false);
        setCurrentBlindspotIdx(prev => (prev + 1) % mythBusters.length);
    };

    const currentChain = mechanismChains[currentChainIdx];
    const currentSocratic = socraticQuestions[currentSocraticIdx];
    const currentBlindspot = mythBusters[currentBlindspotIdx];

    return (
        <div className="w-full max-w-5xl h-full flex flex-col p-2 sm:p-3 md:p-4 overflow-y-auto custom-scrollbar">
            {/* 頂部心智推演標題列 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 sm:gap-2.5 mb-3 bg-gray-900/80 p-2.5 sm:p-3 rounded-lg border border-gray-800">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/20">
                            心智模型推演工作台
                        </span>
                        <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                            {topic === "All" ? "全庫綜合心智推演" : topic}
                        </h2>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                        徹底拒絕無腦刷題，專注於「因果骨牌連鎖」、「干擾模擬」與「蘇格拉底探究」
                    </p>
                </div>

                {/* 模式切換按鈕 (行動端支援順暢橫向滑動) */}
                <div className="flex items-center bg-gray-850 p-1 rounded-md border border-gray-800 overflow-x-auto no-scrollbar flex-nowrap w-full md:w-auto shrink-0">
                    {mechanismChains.length > 0 && (
                        <button
                            onClick={() => { setSubMode('chain'); setIsPerturbationApplied(false); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                                subMode === 'chain' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <GitBranch className="w-3.5 h-3.5 text-blue-300" />
                            <span>因果骨牌鏈 ({mechanismChains.length})</span>
                        </button>
                    )}
                    {socraticQuestions.length > 0 && (
                        <button
                            onClick={() => { setSubMode('socratic'); setRevealedHintCount(0); setShowSocraticInsight(false); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                                subMode === 'socratic' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Compass className="w-3.5 h-3.5 text-purple-300" />
                            <span>蘇格拉底探究 ({socraticQuestions.length})</span>
                        </button>
                    )}
                    {mythBusters.length > 0 && (
                        <button
                            onClick={() => setSubMode('blindspot')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                                subMode === 'blindspot' ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <AlertTriangle className="w-3.5 h-3.5 text-yellow-300" />
                            <span>思維盲點 ({mythBusters.length})</span>
                        </button>
                    )}
                    {logicPairs.length > 0 && (
                        <button
                            onClick={() => setSubMode('match')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                                subMode === 'match' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <span>🧩 因果連連看 ({logicPairs.length})</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ================= 模式 1：因果骨牌鏈與干擾模擬 (Mechanism Flow) ================= */}
            {subMode === 'chain' && currentChain && (
                <div className="flex-1 flex flex-col gap-3.5 animate-fade-in">
                    <div className="bg-gray-850 p-3.5 sm:p-4 rounded-lg border border-gray-800 shadow-lg flex flex-col gap-3.5">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-800">
                            <div>
                                <span className="text-[11px] uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1.5">
                                    <GitBranch className="w-3.5 h-3.5" /> 動態因果骨牌流程 ({currentChainIdx + 1} / {mechanismChains.length})
                                </span>
                                <h3 className="text-base md:text-lg font-bold text-white mt-1">
                                    {currentChain.chainTitle}
                                </h3>
                            </div>

                            {mechanismChains.length > 1 && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setCurrentChainIdx(prev => (prev + 1) % mechanismChains.length);
                                            setIsPerturbationApplied(false);
                                        }}
                                        className="px-3 py-1 rounded-lg border border-gray-750 hover:bg-gray-800 text-xs font-semibold text-gray-300 transition-colors"
                                    >
                                        切換下一組因果鏈 ➔
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 步驟骨牌鏈條展示 */}
                        <div className="flex flex-col gap-2.5">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                系統正向運作鏈條：
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                {currentChain.steps?.map((step, idx) => {
                                    const stepNum = idx + 1;
                                    const isBroken = isPerturbationApplied && stepNum >= (currentChain.perturbation?.impactStep || 1);
                                    return (
                                        <div
                                            key={idx}
                                            className={`p-3 sm:p-3.5 rounded-lg border transition-all relative flex flex-col justify-between ${
                                                isBroken
                                                    ? 'bg-rose-950/30 border-rose-500/50 text-rose-200 line-through opacity-70'
                                                    : 'bg-gray-900 border-gray-750 text-gray-100 shadow-sm'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold ${
                                                    isBroken ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                                                }`}>
                                                    {stepNum}
                                                </span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                                                    Step {stepNum}
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm font-medium leading-relaxed">
                                                {step}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 干擾變數推演區域 (Perturbation Challenge) */}
                        {currentChain.perturbation && (
                            <div className="mt-1 p-3 sm:p-3.5 bg-gray-900 rounded-lg border border-gray-800 flex flex-col gap-2.5">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="flex items-center gap-2 text-purple-300">
                                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                        <span className="font-bold text-xs sm:text-sm">
                                            系統干擾變數模擬（Perturbation Stress Test）
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setIsPerturbationApplied(!isPerturbationApplied)}
                                        className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                                            isPerturbationApplied
                                                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                                : 'bg-amber-500 hover:bg-amber-400 text-gray-950'
                                        }`}
                                    >
                                        {isPerturbationApplied ? <RotateCcw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        <span>{isPerturbationApplied ? "復原正常鏈條" : "⚡ 植入干擾變數推演"}</span>
                                    </button>
                                </div>

                                <div className="bg-gray-850 p-2.5 rounded-md border border-gray-800 text-xs sm:text-sm leading-relaxed text-gray-200">
                                    <span className="text-[11px] font-bold text-amber-400 block mb-0.5">外在干擾情境：</span>
                                    {currentChain.perturbation.condition}
                                </div>

                                <AnimatePresence>
                                    {isPerturbationApplied && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="p-2.5 bg-rose-950/25 rounded-md border border-rose-500/40 text-rose-200 text-xs sm:text-sm leading-relaxed flex flex-col gap-2"
                                        >
                                            <div className="font-bold text-rose-300 flex items-center gap-1.5 text-xs sm:text-sm">
                                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                                <span>連鎖中斷與崩潰：{currentChain.perturbation.outcome}</span>
                                            </div>
                                            <p className="text-xs text-gray-300 bg-gray-900/80 p-2.5 rounded-md border border-gray-800">
                                                💡 {currentChain.perturbation.analysis}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= 模式 2：蘇格拉底深度探究 (Socratic Inquiry) ================= */}
            {subMode === 'socratic' && currentSocratic && (
                <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-3.5 animate-fade-in">
                    <div className="w-full flex justify-between items-center text-xs text-gray-400">
                        <span>蘇格拉底探究 {currentSocraticIdx + 1} / {socraticQuestions.length}</span>
                        <span>思維階梯</span>
                    </div>

                    <div className="w-full bg-gray-850 p-3.5 sm:p-4.5 rounded-lg border border-gray-800 shadow-xl relative overflow-hidden flex flex-col gap-3.5">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>

                        <div>
                            <span className="text-[11px] uppercase font-bold tracking-wider text-purple-400 block mb-1">
                                🏛️ 反直覺現象 / 核心深層提問
                            </span>
                            <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
                                「{currentSocratic.paradox}」
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                試著在大腦中推導背後的物理限制或生理機轉，不急著看解答。
                            </p>
                        </div>

                        {/* 思維階梯線索 */}
                        <div className="flex flex-col gap-2.5">
                            {currentSocratic.hints?.map((hint, idx) => {
                                const isRevealed = idx < revealedHintCount;
                                return (
                                    <div
                                        key={idx}
                                        className={`p-3 sm:p-3.5 rounded-lg border transition-all ${
                                            isRevealed
                                                ? 'bg-purple-950/20 border-purple-500/30 text-purple-200'
                                                : 'bg-gray-900/60 border-gray-800 text-gray-500'
                                        }`}
                                    >
                                        {isRevealed ? (
                                            <p className="text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-2">
                                                <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                                                <span>{hint}</span>
                                            </p>
                                        ) : (
                                            <button
                                                onClick={() => setRevealedHintCount(idx + 1)}
                                                className="w-full text-left text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center justify-between"
                                            >
                                                <span>🔒 解開第 {idx + 1} 階思考線索</span>
                                                <span className="text-[11px] underline">點擊解鎖 ➔</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 揭曉專家深層推演 */}
                        <div className="pt-2 border-t border-gray-800 flex flex-col gap-3">
                            {!showSocraticInsight ? (
                                <button
                                    onClick={() => setShowSocraticInsight(true)}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-3.5 h-3.5" /> 揭曉深層原理心智模型
                                </button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3.5 sm:p-4 bg-gray-900 rounded-lg border border-gray-750 text-gray-200 text-xs sm:text-sm leading-relaxed flex flex-col gap-2.5"
                                >
                                    <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                                        <Compass className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>專家思維解析心智模型</span>
                                    </div>
                                    <p className="whitespace-pre-wrap leading-relaxed">
                                        {currentSocratic.deepInsight}
                                    </p>
                                </motion.div>
                            )}

                            {socraticQuestions.length > 1 && (
                                <button
                                    onClick={() => {
                                        setCurrentSocraticIdx(prev => (prev + 1) % socraticQuestions.length);
                                        setRevealedHintCount(0);
                                        setShowSocraticInsight(false);
                                    }}
                                    className="self-end px-3.5 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                                >
                                    下一個探究 ➔
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ================= 模式 3：思維盲點校準 (Blindspot Buster) ================= */}
            {subMode === 'blindspot' && currentBlindspot && (
                <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-4 animate-fade-in">
                    <div className="w-full flex justify-between items-center text-xs text-gray-400">
                        <span>思維盲點校準 {currentBlindspotIdx + 1} / {mythBusters.length}</span>
                        <span>打破直覺陷阱</span>
                    </div>

                    <div className="w-full bg-gray-850 p-3.5 sm:p-4.5 rounded-lg border border-gray-800 shadow-xl relative overflow-hidden flex flex-col gap-3.5">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-amber-500"></div>
                        <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400 block mb-0.5">
                            {currentBlindspot.concept || "概念推演校準"}
                        </span>
                        <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
                            「{currentBlindspot.statement}」
                        </h3>

                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                disabled={showBlindspotAnalysis}
                                onClick={() => handleBlindspotAnswer(true)}
                                className={`py-2 sm:py-2.5 px-3 rounded-md font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-1.5 ${
                                    showBlindspotAnalysis
                                        ? currentBlindspot.isCorrect === true
                                            ? 'bg-emerald-600 border-emerald-400 text-white'
                                            : userBlindspotChoice === true
                                            ? 'bg-rose-600 border-rose-400 text-white'
                                            : 'bg-gray-800 opacity-40 text-gray-500'
                                        : 'bg-gray-800/90 hover:bg-emerald-600/20 hover:border-emerald-500/40 border-gray-750 text-white'
                                }`}
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 符合原理 (True)
                            </button>

                            <button
                                disabled={showBlindspotAnalysis}
                                onClick={() => handleBlindspotAnswer(false)}
                                className={`py-2 sm:py-2.5 px-3 rounded-md font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-1.5 ${
                                    showBlindspotAnalysis
                                        ? currentBlindspot.isCorrect === false
                                            ? 'bg-emerald-600 border-emerald-400 text-white'
                                            : userBlindspotChoice === false
                                            ? 'bg-rose-600 border-rose-400 text-white'
                                            : 'bg-gray-800 opacity-40 text-gray-500'
                                        : 'bg-gray-800/90 hover:bg-rose-600/20 hover:border-rose-500/40 border-gray-750 text-white'
                                }`}
                            >
                                <XCircle className="w-4 h-4 text-rose-400" /> 邏輯陷阱 (False)
                            </button>
                        </div>

                        {showBlindspotAnalysis && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 sm:p-3.5 bg-gray-900 rounded-md border border-gray-750 text-xs sm:text-sm flex flex-col gap-2"
                            >
                                <span className="font-bold text-indigo-300 text-xs uppercase tracking-wider">
                                    💡 深度心智邏輯剖析
                                </span>
                                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                                    {currentBlindspot.explanation}
                                </p>
                                <button
                                    onClick={nextBlindspot}
                                    className="self-end px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-md text-xs flex items-center gap-1.5 transition-all"
                                >
                                    下一項盲點校準 ➔
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= 模式 4：基礎因果連連看 (Logic Match) ================= */}
            {subMode === 'match' && logicPairs.length > 0 && (
                <div className="flex-1 flex flex-col gap-3.5 animate-fade-in">
                    <div className="bg-gray-850 p-2.5 sm:p-3 rounded-lg border border-gray-800 flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                            <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0" />
                            <p className="text-xs sm:text-sm text-gray-300">
                                點選左側【機制觸發條件】，再點選右側對應的【必然結果】進行因果連通。
                            </p>
                        </div>
                        <button
                            onClick={() => initMatchGame(logicPairs)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1 text-xs shrink-0"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> 重新洗牌
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-[11px] uppercase font-bold tracking-wider text-indigo-300">
                                因果起點 (Cause & Condition)
                            </h3>
                            {leftItems.map((item) => {
                                const isMatched = matchedIds.includes(item.id);
                                const isSelected = selectedLeft?.id === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        disabled={isMatched}
                                        onClick={() => handleSelectLeft(item)}
                                        className={`p-3 rounded-lg text-left border transition-all ${
                                            isMatched
                                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300/60 line-through opacity-60'
                                                : isSelected
                                                ? 'bg-indigo-600 border-indigo-400 text-white ring-2 ring-indigo-500/30'
                                                : 'bg-gray-850 hover:bg-gray-800 border-gray-750 text-gray-200'
                                        }`}
                                    >
                                        <p className="font-medium text-xs sm:text-sm leading-relaxed">{item.text}</p>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex flex-col gap-2">
                            <h3 className="text-[11px] uppercase font-bold tracking-wider text-purple-300">
                                後續必然結果 (Consequence & Outcome)
                            </h3>
                            {rightItems.map((item) => {
                                const isMatched = matchedIds.includes(item.id);
                                const isSelected = selectedRight?.id === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        disabled={isMatched}
                                        onClick={() => handleSelectRight(item)}
                                        className={`p-3 rounded-lg text-left border transition-all ${
                                            isMatched
                                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300/60 line-through opacity-60'
                                                : isSelected
                                                ? 'bg-purple-600 border-purple-400 text-white ring-2 ring-purple-500/30'
                                                : 'bg-gray-850 hover:bg-gray-800 border-gray-750 text-gray-200'
                                        }`}
                                    >
                                        <p className="font-medium text-xs sm:text-sm leading-relaxed">{item.text}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <AnimatePresence>
                        {matchFeedback && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`p-3 rounded-lg border text-xs sm:text-sm leading-relaxed ${
                                    matchFeedback.success
                                        ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                                        : 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                                }`}
                            >
                                <span className="font-bold block mb-0.5">{matchFeedback.title}</span>
                                {matchFeedback.explanation}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default UnderstandMode;
