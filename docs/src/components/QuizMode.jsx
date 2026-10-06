import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QuizMode = ({ cards, allCards, topic, onExit }) => {
    const [gameState, setGameState] = useState('menu'); // menu, playing, feedback, result
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [timeLeft, setTimeLeft] = useState(15);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(false);

    // Typing Mode State
    const [settings, setSettings] = useState({
        questionCount: 10,
        timeLimit: 15,
        inputMode: 'choice' // 'choice' or 'type'
    });
    const [attempts, setAttempts] = useState(0);
    const [revealedIndices, setRevealedIndices] = useState([]); // Array of indices to reveal
    const [typedAnswer, setTypedAnswer] = useState('');
    const inputRef = useRef(null);

    // Detailed Session Tracking
    const [sessionHistory, setSessionHistory] = useState([]);
    const [quizDeck, setQuizDeck] = useState([]);

    // Initialize Settings when cards change
    useEffect(() => {
        if (cards && cards.length > 0) {
            setSettings(prev => ({
                ...prev,
                questionCount: Math.min(10, cards.length)
            }));
        }
    }, [cards]);

    // Timer Auto-Switch based on Mode
    useEffect(() => {
        if (settings.inputMode === 'type') {
            setSettings(s => ({ ...s, timeLimit: 20 }));
        } else {
            setSettings(s => ({ ...s, timeLimit: 15 }));
        }
    }, [settings.inputMode]);

    // Auto-Focus Input Logic
    useEffect(() => {
        if (gameState === 'playing' && settings.inputMode === 'type') {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [gameState, round, attempts, settings.inputMode]);

    // Start Game
    const startGame = () => {
        const distractorSource = allCards || cards;
        if (settings.inputMode === 'choice' && (!distractorSource || distractorSource.length < 4)) {
            alert("Not enough cards in the library to generate options! Need at least 4.");
            return;
        }
        if (!cards || cards.length < 1) {
            alert("No cards in this deck to test!");
            return;
        }

        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        const selectedDeck = shuffled.slice(0, Math.min(settings.questionCount, cards.length));
        setQuizDeck(selectedDeck);

        setScore(0);
        setRound(1);
        setSessionHistory([]);
        setGameState('playing');

        generateQuestion(selectedDeck[0], selectedDeck, 1);
    };

    // Generate Question
    const generateQuestion = (cardOverride = null, deckOverride = null, roundOverride = null) => {
        const activeDeck = deckOverride || quizDeck;
        const currentRound = roundOverride || round;
        const cardIndex = cardOverride ? 0 : (currentRound - 1);

        const questionCard = cardOverride || activeDeck[cardIndex];

        if (!questionCard) {
            setGameState('result');
            return;
        }

        let shuffledOptions = [];
        if (settings.inputMode === 'choice') {
            const distractors = [];
            const fullDeck = allCards || cards;
            while (distractors.length < 3) {
                const idx = Math.floor(Math.random() * fullDeck.length);
                const distractor = fullDeck[idx];
                if (distractor.title !== questionCard.title && !distractors.some(d => d.title === distractor.title)) {
                    distractors.push(distractor);
                }
            }
            const optionCards = [...distractors, questionCard];
            shuffledOptions = optionCards.sort(() => Math.random() - 0.5);
        }

        setCurrentQuestion(questionCard);
        setOptions(shuffledOptions);
        setTimeLeft(settings.timeLimit);
        setSelectedOption(null);
        setIsCorrect(false);

        // Reset Typing State
        setAttempts(0);
        setRevealedIndices([]);
        setTypedAnswer('');
    };

    // Timer
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (gameState === 'playing' && timeLeft === 0) {
            handleAnswer(null);
        }
    }, [timeLeft, gameState]);

    // Handle Answer
    const handleAnswer = (option) => {
        if (!option) {
            finishQuestion(false, 0);
            return;
        }

        setSelectedOption(option);

        if (settings.inputMode === 'type') {
            const target = currentQuestion.title.split('-')[0].trim();
            const targetLower = target.toLowerCase();
            const input = option.title.trim().toLowerCase();
            const isMatch = input === targetLower;

            console.log("Handle Answer:", { input, target, attempts });

            setTypedAnswer('');

            if (isMatch) {
                // Correct
                const points = attempts === 0 ? (10 + Math.ceil(timeLeft / 2)) : 5;
                setIsCorrect(attempts === 0 ? true : 'partial');
                finishQuestion(true, points);
            } else {
                // Wrong
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                console.log("Wrong! New Attempts:", newAttempts);

                if (newAttempts < 3) {
                    // Update: 1st fail -> 1 char. 2nd fail -> up to 3 chars.
                    const validIndices = target.split('').map((c, i) => c !== ' ' ? i : -1).filter(i => i !== -1);

                    let needed = 1;
                    if (newAttempts === 2) {
                        // Reveal up to 3 chars, but capping at length
                        needed = Math.min(validIndices.length, 3);
                    }

                    // Logic: Ensure we reveal AT LEAST 'needed' amount.
                    let current = [...revealedIndices];
                    console.log("Gen Clue. Needed:", needed, "Current:", current, "Valid:", validIndices);

                    while (current.length < needed && current.length < validIndices.length) {
                        const remaining = validIndices.filter(i => !current.includes(i));
                        if (remaining.length === 0) break;
                        const randIndex = Math.floor(Math.random() * remaining.length);
                        current.push(remaining[randIndex]);
                    }
                    console.log("New Revealed:", current);
                    setRevealedIndices(current);
                    return;
                } else {
                    finishQuestion(false, 0);
                }
            }
        } else {
            const correct = option.title === currentQuestion.title;
            const points = correct ? (10 + Math.ceil(timeLeft / 2)) : 0;
            setIsCorrect(correct);
            finishQuestion(correct, points);
        }
    };

    const finishQuestion = (outcomeCorrect, points) => {
        if (outcomeCorrect) {
            setScore(score + points);
        }

        const mistakes = JSON.parse(localStorage.getItem('quiz_mistakes')) || [];
        const cardId = currentQuestion.id || currentQuestion.imagePath || currentQuestion.title;

        if (!outcomeCorrect) {
            if (!mistakes.includes(cardId)) {
                mistakes.push(cardId);
            }
        } else {
            const index = mistakes.indexOf(cardId);
            if (index > -1) {
                mistakes.splice(index, 1);
            }
        }
        localStorage.setItem('quiz_mistakes', JSON.stringify(mistakes));

        setSessionHistory(prev => [...prev, {
            question: currentQuestion.title,
            image: currentQuestion.imagePath,
            source: currentQuestion.source,
            isCorrect: outcomeCorrect,
            selected: selectedOption ? selectedOption.title : "Time Out/Fail",
            points: points,
            timeTaken: settings.timeLimit - timeLeft
        }]);

        setGameState('feedback');

        setTimeout(() => {
            if (round >= settings.questionCount) {
                setGameState('result');
            } else {
                const nextRound = round + 1;
                setRound(nextRound);
                setGameState('playing');
                generateQuestion(null, null, nextRound);
            }
        }, 1500);
    };

    useEffect(() => {
        if (gameState === 'result') {
            const stats = JSON.parse(localStorage.getItem('quiz_stats')) || { gamesPlayed: 0, totalScore: 0, history: [] };
            stats.gamesPlayed += 1;
            stats.totalScore += score;
            stats.history.push({
                score: score,
                date: new Date().toISOString(),
                topic: topic || "Mixed",
                details: sessionHistory
            });
            localStorage.setItem('quiz_stats', JSON.stringify(stats));
            localStorage.setItem('last_session_details', JSON.stringify(sessionHistory));
        }
    }, [gameState]);

    if (gameState === 'menu') {
        return (
            <div className="flex flex-col items-center justify-center p-5 sm:p-6 space-y-6 text-center w-full max-w-2xl bg-gray-800/50 rounded-xl border border-gray-700 shadow-2xl backdrop-blur-sm m-auto">
                <div className="space-y-1.5">
                    <h2 className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                        Quiz Challenge
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base">Test your knowledge</p>
                </div>
                {/* Length and Timer Settings remain same */}
                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="bg-gray-900/50 p-3.5 sm:p-4 rounded-lg border border-gray-700 flex flex-col gap-2.5">
                        <label className="text-gray-300 text-xs font-bold uppercase tracking-wider">Length</label>
                        <div className="flex items-center justify-between">
                            <button onClick={() => setSettings(s => ({ ...s, questionCount: Math.max(1, s.questionCount - 1) }))} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm">-</button>
                            <input
                                type="number"
                                className="w-16 bg-transparent text-2xl font-mono font-bold text-white text-center focus:outline-none border-b-2 border-transparent focus:border-blue-500 transition-colors"
                                value={settings.questionCount}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) setSettings(s => ({ ...s, questionCount: val }));
                                    else if (e.target.value === '') setSettings(s => ({ ...s, questionCount: '' }));
                                }}
                                onBlur={() => {
                                    let val = settings.questionCount;
                                    if (val === '' || val < 1) val = 1;
                                    if (val > cards.length) val = cards.length;
                                    setSettings(s => ({ ...s, questionCount: val }));
                                }}
                            />
                            <button onClick={() => setSettings(s => ({ ...s, questionCount: Math.min(cards.length, s.questionCount + 1) }))} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm">+</button>
                        </div>
                        <p className="text-[11px] text-gray-500">questions (max: {cards.length})</p>
                    </div>

                    <div className="bg-gray-900/50 p-3.5 sm:p-4 rounded-lg border border-gray-700 flex flex-col gap-2.5">
                        <label className="text-gray-300 text-xs font-bold uppercase tracking-wider">Timer</label>
                        <div className="flex items-center justify-between">
                            <button onClick={() => setSettings(s => ({ ...s, timeLimit: Math.max(5, s.timeLimit - 5) }))} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm">-</button>
                            <input
                                type="number"
                                className="w-16 bg-transparent text-2xl font-mono font-bold text-white text-center focus:outline-none border-b-2 border-transparent focus:border-blue-500 transition-colors"
                                value={settings.timeLimit}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) setSettings(s => ({ ...s, timeLimit: val }));
                                    else if (e.target.value === '') setSettings(s => ({ ...s, timeLimit: '' }));
                                }}
                                onBlur={() => {
                                    let val = settings.timeLimit;
                                    if (val === '' || val < 5) val = 5;
                                    if (val > 300) val = 300;
                                    setSettings(s => ({ ...s, timeLimit: val }));
                                }}
                            />
                            <button onClick={() => setSettings(s => ({ ...s, timeLimit: Math.min(300, s.timeLimit + 5) }))} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm">+</button>
                        </div>
                        <p className="text-[11px] text-gray-500">seconds / q</p>
                    </div>

                    <div className="bg-gray-900/50 p-3.5 sm:p-4 rounded-lg border border-gray-700 flex flex-col gap-2.5">
                        <label className="text-gray-300 text-xs font-bold uppercase tracking-wider">Answer Mode</label>
                        <div className="flex items-center justify-center h-full">
                            <div className="bg-gray-800 p-1 rounded-lg flex w-full">
                                <button onClick={() => setSettings(s => ({ ...s, inputMode: 'choice' }))} className={`flex-1 py-1.5 rounded-md font-bold text-xs sm:text-sm transition-all ${!settings.inputMode || settings.inputMode === 'choice' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Choices</button>
                                <button onClick={() => setSettings(s => ({ ...s, inputMode: 'type' }))} className={`flex-1 py-1.5 rounded-md font-bold text-xs sm:text-sm transition-all ${settings.inputMode === 'type' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Type</button>
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-500">{settings.inputMode === 'type' ? 'Type exact answer' : 'Select from 4 options'}</p>
                    </div>
                </div>

                <div className="w-full pt-2">
                    <button onClick={startGame} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg text-white font-bold text-base sm:text-lg shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.01] active:scale-[0.99]">Start Quiz</button>
                    <p className="text-xs text-gray-500 mt-3"> Deck size: {cards ? cards.length : 0} cards available</p>
                </div>
            </div>
        );
    }

    if (gameState === 'result') {
        return (
            <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center animate-fade-in bg-gray-900/90 rounded-xl border border-gray-800 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-white">Game Over!</h2>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">{score}</div>
                <p className="text-gray-400 text-sm">Final Score</p>
                <div className="flex gap-3">
                    <button onClick={() => setGameState('menu')} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium text-xs sm:text-sm">Menu</button>
                    <button onClick={startGame} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium text-xs sm:text-sm">Play Again</button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl h-full flex flex-col p-3 sm:p-4">
            <div className="flex justify-between items-center mb-3.5 bg-gray-900/50 p-3 sm:p-3.5 rounded-lg border border-gray-700">
                <div className="flex flex-col"><span className="text-[11px] text-gray-500 uppercase font-bold">Progress</span><span className="text-base sm:text-lg font-bold text-white">{round} <span className="text-gray-500 text-xs">/ {settings.questionCount}</span></span></div>
                <div className="flex flex-col items-center"><span className={`text-2xl sm:text-3xl font-mono font-black ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>{timeLeft}</span></div>
                <div className="flex flex-col items-end"><span className="text-[11px] text-gray-500 uppercase font-bold">Score</span><span className="text-base sm:text-lg font-bold text-yellow-500">{score}</span></div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 items-center justify-center w-full">
                <div className="flex-1 w-full max-w-2xl aspect-video lg:h-[480px] bg-gray-900 rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-700 relative group flex items-center justify-center p-4 sm:p-5">
                    {currentQuestion.imagePath ? (
                        <img src={currentQuestion.imagePath} alt="Quiz Question" className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full flex flex-col justify-between p-3.5 md:p-6 bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 rounded-lg border border-gray-750">
                            <div>
                                <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 block mb-1.5">
                                    {currentQuestion.source || "概念測驗"}
                                </span>
                                {currentQuestion.analogy && (
                                    <div className="text-xs text-amber-300 bg-amber-950/20 p-2 rounded-md border border-amber-500/20 mb-2.5">
                                        💡 思考提示：{currentQuestion.analogy}
                                    </div>
                                )}
                            </div>
                            <div className="overflow-y-auto custom-scrollbar my-auto">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">機制特徵與描述</h4>
                                <p className="text-gray-100 text-sm sm:text-base md:text-lg font-medium leading-relaxed whitespace-pre-wrap">
                                    {currentQuestion.description || "請根據上述線索推導正確答案。"}
                                </p>
                            </div>
                            <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-800">
                                請在右側選擇對應的核心概念或機制名詞
                            </div>
                        </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur px-2.5 py-0.5 rounded text-[11px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">source: {currentQuestion.source}</div>
                </div>

                <div className="w-full lg:w-1/3 flex flex-col gap-3">
                    {settings.inputMode === 'type' ? (
                        <div className="flex flex-col gap-3 w-full">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Type your answer..."
                                className={`w-full p-3 bg-gray-800 border-2 rounded-lg text-white text-base focus:outline-none placeholder-gray-500 ${attempts > 0 ? 'border-red-400/50 animate-shake' : 'border-gray-700 focus:border-blue-500'}`}
                                autoFocus
                                value={typedAnswer}
                                onChange={(e) => setTypedAnswer(e.target.value)}
                                disabled={gameState === 'feedback'}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (typedAnswer.trim()) {
                                            handleAnswer({ title: typedAnswer.trim(), isTyped: true });
                                        }
                                    }
                                }}
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>tries: {3 - attempts} left</span>
                                <span></span>
                            </div>

                            {/* Character Clue UI */}
                            {attempts > 0 && (
                                <div className="p-3 bg-gray-900 rounded-lg border border-gray-700 text-center animate-fade-in">
                                    <span className="text-xs text-gray-500 uppercase font-bold tracking-widest block mb-1.5">{attempts === 2 ? 'Final Clue' : 'Hint'}</span>
                                    <p className="text-2xl font-mono tracking-[0.4em] text-yellow-400 font-bold break-all">
                                        {currentQuestion.title.split('-')[0].trim().split('').map((char, i) =>
                                            (revealedIndices.includes(i) || char === ' ') ? char : '_'
                                        ).join(' ')}
                                    </p>
                                    <p className="text-[11px] text-gray-600 mt-1.5">({currentQuestion.title.split('-')[0].trim().length} letters)</p>
                                </div>
                            )}

                            {gameState === 'feedback' && (
                                <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                                    <p className="text-[11px] text-gray-400 uppercase font-bold mb-1">Correct Answer</p>
                                    <p className="text-base font-bold text-green-400">{currentQuestion.title}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        options.map((option, idx) => {
                            let btnClass = "bg-gray-800 hover:bg-gray-750 border-gray-700 text-gray-200";
                            if (gameState === 'feedback') {
                                if (option.title === currentQuestion.title) {
                                    btnClass = "bg-green-600 border-green-500 text-white ring-2 ring-green-500/20";
                                } else if (option === selectedOption) {
                                    btnClass = "bg-red-600 border-red-500 text-white";
                                } else {
                                    btnClass = "bg-gray-800 opacity-30";
                                }
                            }
                            return (
                                <button key={idx} disabled={gameState === 'feedback'} onClick={() => handleAnswer(option)} className={`w-full p-3.5 sm:p-4 rounded-lg text-left border transition-all duration-200 shadow-md ${btnClass} ${gameState !== 'feedback' ? 'hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0' : ''}`}>
                                    <span className="text-xs sm:text-sm font-bold block">{option.title}</span>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            <AnimatePresence>
                {gameState === 'feedback' && (
                    <motion.div initial={{ opacity: 0, scale: 0.8, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 px-6 py-2.5 rounded-lg font-bold text-base shadow-xl z-50 backdrop-blur-md border border-white/10 ${isCorrect === true ? 'bg-green-500/90 text-white' : isCorrect === 'partial' ? 'bg-blue-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                        {isCorrect === true ? 'Correct! 🎉' : isCorrect === 'partial' ? 'Close Call! 😅' : 'Oops! ❌'}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuizMode;
