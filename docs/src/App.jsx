import { useState, useEffect } from 'react'
import { get as getIDB } from 'idb-keyval'
import Deck from './components/Deck'
import Sidebar from './components/Sidebar'
import QuizMode from './components/QuizMode'
import StatsMode from './components/StatsMode'
import SearchMode from './components/SearchMode'
import ImportMode from './components/ImportMode'
import UnderstandMode from './components/UnderstandMode'
import ReaderMode from './components/ReaderMode'
import { Menu, Layers } from 'lucide-react'
import './index.css'
import cardsData from './data/cards.json'

const MODE_LABELS = {
    understand: '🧠 心智模型推演',
    reader: '📖 分段精讀複習',
    search: '🔍 雙語術語工作台',
    review: '🎴 概念翻卡速覽',
    quiz: '🎯 邏輯推演校準',
    stats: '📊 認知分析儀表',
    import: '📥 知識匯入中心'
};

function App() {
    const [cards, setCards] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentTopic, setCurrentTopic] = useState("All")
    const [currentMode, setCurrentMode] = useState("understand") // 預設推薦進入深度理解模式
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const refreshData = async () => {
        setLoading(true);
        try {
            // Load static cards
            let allCards = [...cardsData];

            // Load custom cards from IndexedDB
            const customCards = await getIDB('custom_cards');
            if (customCards && Array.isArray(customCards)) {
                allCards = [...allCards, ...customCards];
            }

            // Exclude decks user explicitly deleted
            const deletedDecks = (await getIDB('deleted_decks')) || [];
            allCards = allCards.filter(card => !deletedDecks.includes(card.source));

            setCards(allCards);
        } catch (err) {
            console.error("Failed to load cards", err);
            setCards(cardsData);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, [])

    // Extract unique topics
    const topics = [...new Set(cards.map(card => card.source))]

    useEffect(() => {
        if (currentTopic !== "All" && currentTopic !== "Mistakes" && topics.length > 0 && !topics.includes(currentTopic)) {
            setCurrentTopic("All");
        }
    }, [topics, currentTopic]);

    // 1. Get all valid cards suitable for quizzing (no cover pages)
    const validCards = cards.filter(card => !card.imagePath || !card.imagePath.includes('_p0.'));

    // 2. Filter for current topic/mode
    let filteredCards = validCards;

    if (currentTopic === "Mistakes") {
        try {
            const mistakes = JSON.parse(localStorage.getItem('quiz_mistakes')) || [];
            filteredCards = filteredCards.filter(card => mistakes.includes(card.id));
        } catch (e) {
            console.error("Error parsing mistakes", e);
            filteredCards = [];
        }
    } else if (currentTopic !== "All") {
        filteredCards = filteredCards.filter(card => card.source === currentTopic);
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400 text-sm">載入知識庫中...</span>
                </div>
            </div>
        )
    }

    // Allow empty cards if in Import mode (so user can import to fix empty state)
    if (cards.length === 0 && currentMode !== 'import') {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white p-6">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-3">尚未建立任何卡片</h1>
                    <p className="text-gray-400 mb-6 text-sm">
                        您可以貼上課文段落、筆記、上傳錄音檔，或是匯入 PDF 講義開始學習！
                    </p>
                    <button
                        onClick={() => setCurrentMode('import')}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-bold hover:scale-105 transition-all shadow-lg shadow-indigo-500/20 text-xs sm:text-sm"
                    >
                        前往知識匯入中心
                    </button>
                </div>
            </div>
        )
    }

    const renderContent = () => {
        if (currentMode === 'understand') {
            return (
                <div className="flex-grow flex items-center justify-center p-2 sm:p-3 relative w-full h-full overflow-hidden">
                    <UnderstandMode
                        key={currentTopic}
                        cards={filteredCards}
                        topic={currentTopic}
                        onOpenImport={() => setCurrentMode('import')}
                    />
                </div>
            )
        }
        if (currentMode === 'reader') {
            return (
                <div className="flex-grow flex items-center justify-center p-1.5 sm:p-2 relative w-full h-full overflow-hidden">
                    <ReaderMode
                        key={currentTopic}
                        cards={filteredCards}
                        topic={currentTopic}
                    />
                </div>
            )
        }
        if (currentMode === 'review') {
            return (
                <div className="flex-grow flex items-center justify-center p-2 sm:p-3 relative w-full h-full overflow-hidden">
                    {filteredCards.length > 0 ? (
                        <Deck key={currentTopic} cards={filteredCards} />
                    ) : (
                        <div className="text-gray-500 text-center">
                            <p className="text-xl mb-2">此主題暫無卡片</p>
                            {currentTopic === "Mistakes" && (
                                <p className="text-sm">太棒了！您目前沒有錯題（或已全數複習完成）。</p>
                            )}
                        </div>
                    )}
                </div>
            )
        }
        if (currentMode === 'quiz') {
            return (
                <div className="flex-grow flex items-center justify-center w-full h-full">
                    {filteredCards.length > 0 && validCards.length >= 4 ? (
                        <QuizMode cards={filteredCards} allCards={validCards} topic={currentTopic} />
                    ) : (
                        <div className="text-center p-8">
                            <h2 className="text-xl font-bold mb-2">卡片數量不足</h2>
                            <p className="text-gray-400 text-sm">
                                {filteredCards.length === 0
                                    ? "此牌組中暫無卡片。"
                                    : "測驗模式需要整個題庫至少 4 張卡片作為干擾選項。"
                                }
                            </p>
                        </div>
                    )}
                </div>
            )
        }
        if (currentMode === 'stats') {
            return <StatsMode />
        }
        if (currentMode === 'search') {
            return <SearchMode />
        }
        if (currentMode === 'import') {
            return <ImportMode onDeckUpdate={refreshData} />
        }
    }

    return (
        <div className="h-screen w-full bg-gray-900 text-white flex overflow-hidden">
            <Sidebar
                topics={topics}
                currentTopic={currentTopic}
                onSelectTopic={setCurrentTopic}
                currentMode={currentMode}
                onSelectMode={setCurrentMode}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-gray-900">
                {/* 行動裝置專屬優雅頂部導航列 (Mobile Header) */}
                <header className="md:hidden sticky top-0 z-30 h-14 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-3 flex items-center justify-between shrink-0 shadow-lg">
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-750 text-gray-200 hover:text-white transition-colors border border-gray-750 active:scale-95"
                            aria-label="打開選單"
                        >
                            <Menu size={18} />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 tracking-tight">
                                CogniModel
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {MODE_LABELS[currentMode] || '深度學習'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-800/90 border border-gray-750 text-xs text-gray-300 hover:text-white max-w-[140px] truncate shadow-sm active:scale-95"
                        title="切換牌組或主題"
                    >
                        <Layers className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate font-semibold">{currentTopic === "All" ? "全庫總覽" : currentTopic}</span>
                    </button>
                </header>

                <div className="flex-1 relative overflow-hidden flex flex-col">
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}

export default App
