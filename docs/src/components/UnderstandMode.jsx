import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, CheckCircle2, XCircle, ArrowRight, Sparkles, HelpCircle, Shuffle, RotateCcw } from 'lucide-react';

const UnderstandMode = ({ cards, topic, onExit, onOpenImport }) => {
    // 取得當前主題卡片中夾帶的理解遊戲資料
    const [subMode, setSubMode] = useState('match'); // 'match' (因果配對), 'myth' (迷思破解), 'scenario' (情境推導)

    // 從 cards 提取 logicPairs, mythBusters, scenarios
    const [logicPairs, setLogicPairs] = useState([]);
    const [mythBusters, setMythBusters] = useState([]);
    const [scenarios, setScenarios] = useState([]);

    // Logic Match State
    const [leftItems, setLeftItems] = useState([]);
    const [rightItems, setRightItems] = useState([]);
    const [selectedLeft, setSelectedLeft] = useState(null);
    const [selectedRight, setSelectedRight] = useState(null);
    const [matchedIds, setMatchedIds] = useState([]);
    const [matchFeedback, setMatchFeedback] = useState(null);

    // Myth Buster State
    const [currentMythIndex, setCurrentMythIndex] = useState(0);
    const [userMythChoice, setUserMythChoice] = useState(null);
    const [showMythExplanation, setShowMythExplanation] = useState(false);
    const [mythScore, setMythScore] = useState({ correct: 0, total: 0 });

    // Scenario State
    const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
    const [userScenarioChoice, setUserScenarioChoice] = useState(null);
    const [showScenarioExplanation, setShowScenarioExplanation] = useState(false);
    const [scenarioScore, setScenarioScore] = useState({ correct: 0, total: 0 });

    useEffect(() => {
        if (!cards || cards.length === 0) return;

        // 收集所有附加的理解數據
        const aggregatedLogic = [];
        const aggregatedMyths = [];
        const aggregatedScenarios = [];

        cards.forEach(card => {
            if (card.logicPairs && Array.isArray(card.logicPairs)) {
                aggregatedLogic.push(...card.logicPairs);
            }
            if (card.mythBusters && Array.isArray(card.mythBusters)) {
                aggregatedMyths.push(...card.mythBusters);
            }
            if (card.scenarios && Array.isArray(card.scenarios)) {
                aggregatedScenarios.push(...card.scenarios);
            }
        });

        // 假如卡片沒有特別的理解數據，自動從卡片衍生合成一組基礎因果/問答
        if (aggregatedLogic.length === 0 && aggregatedMyths.length === 0 && aggregatedScenarios.length === 0) {
            cards.forEach((card, idx) => {
                if (card.title && card.description) {
                    aggregatedLogic.push({
                        id: `gen_logic_${idx}`,
                        cause: card.title,
                        effect: card.description.slice(0, 60) + (card.description.length > 60 ? '...' : ''),
                        explanation: card.description
                    });
                    aggregatedMyths.push({
                        id: `gen_myth_${idx}`,
                        statement: `${card.title} 的核心特徵或機制為：${card.description.slice(0, 70)}...`,
                        isCorrect: true,
                        explanation: card.description,
                        concept: card.title
                    });
                }
            });
        }

        // 去重
        const uniqueLogic = aggregatedLogic.filter((item, index, self) =>
            index === self.findIndex((t) => t.cause === item.cause && t.effect === item.effect)
        ).map((item, idx) => ({ ...item, id: item.id || `lp_${idx}` }));

        const uniqueMyths = aggregatedMyths.filter((item, index, self) =>
            index === self.findIndex((t) => t.statement === item.statement)
        ).map((item, idx) => ({ ...item, id: item.id || `mb_${idx}` }));

        const uniqueScenarios = aggregatedScenarios.filter((item, index, self) =>
            index === self.findIndex((t) => t.scenario === item.scenario)
        ).map((item, idx) => ({ ...item, id: item.id || `sc_${idx}` }));

        setLogicPairs(uniqueLogic);
        setMythBusters(uniqueMyths);
        setScenarios(uniqueScenarios);

        // 初始化 Logic Match
        initMatchGame(uniqueLogic);

        // 如果沒有配對題但有迷思題，自動切換
        if (uniqueLogic.length === 0 && uniqueMyths.length > 0) {
            setSubMode('myth');
        } else if (uniqueLogic.length === 0 && uniqueScenarios.length > 0) {
            setSubMode('scenario');
        }
    }, [cards, topic]);

    const initMatchGame = (pairs) => {
        const pool = [...pairs].slice(0, 5); // 一輪取最多 5 組配對
        const left = pool.map(p => ({ id: p.id, text: p.cause, pair: p }));
        const right = pool.map(p => ({ id: p.id, text: p.effect, pair: p }));

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
        if (selectedRight) {
            checkMatch(item, selectedRight);
        }
    };

    const handleSelectRight = (item) => {
        if (matchedIds.includes(item.id)) return;
        setSelectedRight(item);
        if (selectedLeft) {
            checkMatch(selectedLeft, item);
        }
    };

    const checkMatch = (left, right) => {
        if (left.id === right.id) {
            // 配對成功！
            setMatchedIds(prev => [...prev, left.id]);
            setMatchFeedback({
                success: true,
                title: "機制連通成功！",
                explanation: left.pair.explanation || `【${left.text}】與【${right.text}】具有直接因果關聯。`
            });
            setSelectedLeft(null);
            setSelectedRight(null);
        } else {
            // 配對錯誤
            setMatchFeedback({
                success: false,
                title: "因果未對應",
                explanation: "試著思考觸發條件與後續生理/邏輯反應的先後順序。"
            });
            setTimeout(() => {
                setSelectedLeft(null);
                setSelectedRight(null);
            }, 800);
        }
    };

    // 處理迷思破解
    const handleMythAnswer = (answer) => {
        if (showMythExplanation) return;
        setUserMythChoice(answer);
        setShowMythExplanation(true);
        const current = mythBusters[currentMythIndex];
        const isRight = answer === current.isCorrect;
        setMythScore(prev => ({
            correct: isRight ? prev.correct + 1 : prev.correct,
            total: prev.total + 1
        }));
    };

    const nextMyth = () => {
        setUserMythChoice(null);
        setShowMythExplanation(false);
        setCurrentMythIndex((prev) => (prev + 1) % mythBusters.length);
    };

    // 處理情境應用
    const handleScenarioAnswer = (index) => {
        if (showScenarioExplanation) return;
        setUserScenarioChoice(index);
        setShowScenarioExplanation(true);
        const current = scenarios[currentScenarioIndex];
        const isRight = index === current.correctIndex;
        setScenarioScore(prev => ({
            correct: isRight ? prev.correct + 1 : prev.correct,
            total: prev.total + 1
        }));
    };

    const nextScenario = () => {
        setUserScenarioChoice(null);
        setShowScenarioExplanation(false);
        setCurrentScenarioIndex((prev) => (prev + 1) % scenarios.length);
    };

    // 檢查是否有足夠題目
    const hasData = logicPairs.length > 0 || mythBusters.length > 0 || scenarios.length > 0;

    if (!hasData) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 bg-purple-900/40 rounded-2xl flex items-center justify-center mb-4 text-purple-400 border border-purple-700/50">
                    <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">尚無深度理解題目</h2>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    傳統的投影片只包含標題與圖片。現在您可以前往「匯入中心」，貼上整段抽象筆記或上傳錄音檔，讓 AI 自動提煉因果配對、迷思破解與情境題目！
                </p>
                <button
                    onClick={onOpenImport}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                    <Sparkles className="w-5 h-5" /> 前往匯入筆記/錄音提煉
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl h-full flex flex-col p-4 overflow-y-auto custom-scrollbar">
            {/* 頂部模式導航 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-gray-900/60 p-4 rounded-2xl border border-gray-800 backdrop-blur">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            深度理解模式
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-wide">
                            {topic === "All" ? "全庫綜合理解練習" : topic}
                        </h2>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">打通因果機制與易混淆概念，不只是死記硬背</p>
                </div>

                <div className="flex items-center bg-gray-800/80 p-1 rounded-xl border border-gray-700/60 self-stretch md:self-auto">
                    <button
                        onClick={() => setSubMode('match')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${subMode === 'match' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <span>🧩</span> 因果機制連連看 ({logicPairs.length})
                    </button>
                    <button
                        onClick={() => setSubMode('myth')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${subMode === 'myth' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <span>🛡️</span> 迷思破解辨析 ({mythBusters.length})
                    </button>
                    {scenarios.length > 0 && (
                        <button
                            onClick={() => setSubMode('scenario')}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${subMode === 'scenario' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <span>🎯</span> 情境推導 ({scenarios.length})
                        </button>
                    )}
                </div>
            </div>

            {/* 內容區塊 1：因果機制連連看 (Logic Match) */}
            {subMode === 'match' && (
                <div className="flex-1 flex flex-col gap-6">
                    <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 p-4 rounded-xl border border-indigo-500/20 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Lightbulb className="w-5 h-5 text-indigo-400" />
                            <p className="text-sm text-indigo-200">
                                點選左側【機制/觸發條件】，再點選右側對應的【反應/結果】進行配對。
                            </p>
                        </div>
                        <button
                            onClick={() => initMatchGame(logicPairs)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                            title="重新洗牌"
                        >
                            <RotateCcw className="w-4 h-4" /> 重新洗牌
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 左側：原因/條件 */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-xs uppercase font-bold tracking-wider text-indigo-300 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> 原因 / 觸發條件 (Cause & Mechanism)
                            </h3>
                            {leftItems.map((item) => {
                                const isMatched = matchedIds.includes(item.id);
                                const isSelected = selectedLeft?.id === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        disabled={isMatched}
                                        onClick={() => handleSelectLeft(item)}
                                        className={`p-4 rounded-xl text-left border-2 transition-all duration-200 shadow-md ${
                                            isMatched
                                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300/60 line-through opacity-60'
                                                : isSelected
                                                ? 'bg-indigo-600 border-indigo-400 text-white ring-4 ring-indigo-500/30 -translate-y-0.5'
                                                : 'bg-gray-800/90 hover:bg-gray-750 border-gray-700/80 text-gray-200 hover:border-indigo-500/50'
                                        }`}
                                    >
                                        <p className="font-semibold text-sm md:text-base leading-relaxed">{item.text}</p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* 右側：結果/反應 */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-xs uppercase font-bold tracking-wider text-purple-300 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span> 結果 / 後續現象 (Effect & Consequence)
                            </h3>
                            {rightItems.map((item) => {
                                const isMatched = matchedIds.includes(item.id);
                                const isSelected = selectedRight?.id === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        disabled={isMatched}
                                        onClick={() => handleSelectRight(item)}
                                        className={`p-4 rounded-xl text-left border-2 transition-all duration-200 shadow-md ${
                                            isMatched
                                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300/60 line-through opacity-60'
                                                : isSelected
                                                ? 'bg-purple-600 border-purple-400 text-white ring-4 ring-purple-500/30 -translate-y-0.5'
                                                : 'bg-gray-800/90 hover:bg-gray-750 border-gray-700/80 text-gray-200 hover:border-purple-500/50'
                                        }`}
                                    >
                                        <p className="font-semibold text-sm md:text-base leading-relaxed">{item.text}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 配對解析回饋卡片 */}
                    <AnimatePresence>
                        {matchFeedback && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`p-5 rounded-2xl border ${
                                    matchFeedback.success
                                        ? 'bg-emerald-950/50 border-emerald-600/60 text-emerald-200'
                                        : 'bg-amber-950/50 border-amber-600/60 text-amber-200'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5 font-bold text-base">
                                    {matchFeedback.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-amber-400" />}
                                    <span>{matchFeedback.title}</span>
                                </div>
                                <p className="text-sm leading-relaxed opacity-90">{matchFeedback.explanation}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {matchedIds.length === leftItems.length && leftItems.length > 0 && (
                        <div className="p-6 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-2xl border border-emerald-500/30 text-center animate-fade-in">
                            <h4 className="text-xl font-bold text-emerald-300 mb-2">🎉 太棒了！全部機制皆順利打通！</h4>
                            <p className="text-sm text-gray-300 mb-4">您已經掌握這組因果鏈的內在邏輯。</p>
                            <button
                                onClick={() => initMatchGame(logicPairs)}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all"
                            >
                                再練一輪
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 內容區塊 2：迷思破解辨析 (Myth Buster) */}
            {subMode === 'myth' && mythBusters.length > 0 && (
                <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-6">
                    <div className="w-full flex justify-between items-center text-xs text-gray-400">
                        <span>觀念辨析 {currentMythIndex + 1} / {mythBusters.length}</span>
                        <span>準確率: {mythScore.total > 0 ? Math.round((mythScore.correct / mythScore.total) * 100) : 0}%</span>
                    </div>

                    {/* 題目卡片 */}
                    <div className="w-full bg-gray-800/90 p-8 rounded-3xl border border-gray-700 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                        <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400 block mb-3">
                            {mythBusters[currentMythIndex].concept || "核心觀念辨析"}
                        </span>
                        <h3 className="text-xl md:text-2xl font-bold text-white leading-relaxed mb-6">
                            「{mythBusters[currentMythIndex].statement}」
                        </h3>

                        {/* 是非選擇按鈕 */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                disabled={showMythExplanation}
                                onClick={() => handleMythAnswer(true)}
                                className={`py-4 px-6 rounded-2xl font-bold text-lg border-2 transition-all flex items-center justify-center gap-2 ${
                                    showMythExplanation
                                        ? mythBusters[currentMythIndex].isCorrect === true
                                            ? 'bg-emerald-600 border-emerald-400 text-white ring-4 ring-emerald-500/20'
                                            : userMythChoice === true
                                            ? 'bg-rose-600 border-rose-400 text-white'
                                            : 'bg-gray-800 border-gray-700 opacity-40 text-gray-400'
                                        : 'bg-gray-800/90 hover:bg-emerald-600/30 hover:border-emerald-500/50 border-gray-700 text-white hover:scale-[1.02]'
                                }`}
                            >
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" /> 正確 (True)
                            </button>

                            <button
                                disabled={showMythExplanation}
                                onClick={() => handleMythAnswer(false)}
                                className={`py-4 px-6 rounded-2xl font-bold text-lg border-2 transition-all flex items-center justify-center gap-2 ${
                                    showMythExplanation
                                        ? mythBusters[currentMythIndex].isCorrect === false
                                            ? 'bg-emerald-600 border-emerald-400 text-white ring-4 ring-emerald-500/20'
                                            : userMythChoice === false
                                            ? 'bg-rose-600 border-rose-400 text-white'
                                            : 'bg-gray-800 border-gray-700 opacity-40 text-gray-400'
                                        : 'bg-gray-800/90 hover:bg-rose-600/30 hover:border-rose-500/50 border-gray-700 text-white hover:scale-[1.02]'
                                }`}
                            >
                                <XCircle className="w-6 h-6 text-rose-400" /> 錯誤 (False)
                            </button>
                        </div>
                    </div>

                    {/* 答案解析 */}
                    <AnimatePresence>
                        {showMythExplanation && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="w-full bg-gray-850 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col gap-4"
                            >
                                <div className="flex items-center gap-2">
                                    {userMythChoice === mythBusters[currentMythIndex].isCorrect ? (
                                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-xs flex items-center gap-1 border border-emerald-500/30">
                                            <CheckCircle2 className="w-4 h-4" /> 判斷正確！
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-rose-500/20 text-rose-300 font-bold rounded-full text-xs flex items-center gap-1 border border-rose-500/30">
                                            <XCircle className="w-4 h-4" /> 掉入常見迷思陷阱！
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400">
                                        正解：本句敘述為【{mythBusters[currentMythIndex].isCorrect ? '正確' : '錯誤'}】
                                    </span>
                                </div>

                                <div className="text-gray-200 text-sm md:text-base leading-relaxed bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                                    <p className="font-semibold text-purple-300 mb-1 text-xs uppercase tracking-wider">💡 深度邏輯解剖</p>
                                    <p className="whitespace-pre-wrap">{mythBusters[currentMythIndex].explanation}</p>
                                </div>

                                <button
                                    onClick={nextMyth}
                                    className="self-end px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all"
                                >
                                    下一題 <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* 內容區塊 3：情境應用推導 (Scenario Quest) */}
            {subMode === 'scenario' && scenarios.length > 0 && (
                <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-6">
                    <div className="w-full flex justify-between items-center text-xs text-gray-400">
                        <span>情境應用 {currentScenarioIndex + 1} / {scenarios.length}</span>
                        <span>答對率: {scenarioScore.total > 0 ? Math.round((scenarioScore.correct / scenarioScore.total) * 100) : 0}%</span>
                    </div>

                    <div className="w-full bg-gray-800/90 p-8 rounded-3xl border border-gray-700 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 to-indigo-500"></div>
                        <div className="mb-4 bg-pink-950/40 p-4 rounded-xl border border-pink-500/20 text-pink-200 text-sm leading-relaxed">
                            <span className="font-bold block text-xs uppercase tracking-wider text-pink-400 mb-1">情境假設</span>
                            {scenarios[currentScenarioIndex].scenario}
                        </div>

                        <h3 className="text-lg md:text-xl font-bold text-white mb-6 leading-relaxed">
                            {scenarios[currentScenarioIndex].question}
                        </h3>

                        <div className="flex flex-col gap-3">
                            {scenarios[currentScenarioIndex].options.map((option, idx) => {
                                const isCorrectOpt = idx === scenarios[currentScenarioIndex].correctIndex;
                                const isUserPick = userScenarioChoice === idx;
                                let btnClass = "bg-gray-800 hover:bg-gray-750 border-gray-700 text-gray-200";

                                if (showScenarioExplanation) {
                                    if (isCorrectOpt) {
                                        btnClass = "bg-emerald-600 border-emerald-400 text-white ring-4 ring-emerald-500/20";
                                    } else if (isUserPick) {
                                        btnClass = "bg-rose-600 border-rose-400 text-white";
                                    } else {
                                        btnClass = "bg-gray-800 opacity-40 border-gray-700";
                                    }
                                }

                                return (
                                    <button
                                        key={idx}
                                        disabled={showScenarioExplanation}
                                        onClick={() => handleScenarioAnswer(idx)}
                                        className={`w-full p-4 rounded-xl text-left border-2 transition-all duration-200 ${btnClass} ${!showScenarioExplanation ? 'hover:scale-[1.01]' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-xs font-bold font-mono">
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="font-medium text-sm md:text-base">{option}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <AnimatePresence>
                        {showScenarioExplanation && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="w-full bg-gray-850 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col gap-4"
                            >
                                <div className="text-gray-200 text-sm md:text-base leading-relaxed bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                                    <p className="font-semibold text-pink-300 mb-1 text-xs uppercase tracking-wider">🎯 原理推導分析</p>
                                    <p className="whitespace-pre-wrap">{scenarios[currentScenarioIndex].explanation}</p>
                                </div>

                                <button
                                    onClick={nextScenario}
                                    className="self-end px-6 py-2.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all"
                                >
                                    下一題 <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default UnderstandMode;
