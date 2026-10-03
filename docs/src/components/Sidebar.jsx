import { useState } from 'react';
import { Menu, X, BookOpen, Gamepad2, Search, Library, BarChart2, AlertCircle, Upload, ChevronLeft, ChevronRight, Sparkles, Brain, BookOpenCheck } from 'lucide-react';

const Sidebar = ({ topics, currentTopic, onSelectTopic, currentMode, onSelectMode, isOpen, setIsOpen }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const modes = [
        { id: 'understand', label: '心智模型推演', icon: Brain, badge: 'PRO' },
        { id: 'reader', label: '分段精讀複習', icon: BookOpenCheck, badge: 'NEW' },
        { id: 'search', label: '雙語術語工作台', icon: Search, badge: 'MHI' },
        { id: 'review', label: '概念翻卡速覽', icon: BookOpen },
        { id: 'quiz', label: '邏輯推演校準', icon: Gamepad2 },
        { id: 'stats', label: '認知分析儀表', icon: BarChart2 },
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg shadow-lg text-white"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed md:static inset-y-0 left-0 z-40
                bg-gray-900 border-r border-gray-800
                transform transition-all duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isCollapsed ? 'md:w-20' : 'md:w-64'}
                w-64
                flex flex-col h-full
            `}>
                {/* Logo / Header */}
                <div className={`p-6 border-b border-gray-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <div>
                            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 whitespace-nowrap">
                                CogniModel
                            </h1>
                            <span className="text-[10px] text-gray-500 font-mono tracking-wider font-bold block">
                                NTU SMART MHI
                            </span>
                        </div>
                    )}
                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden md:block text-gray-400 hover:text-white transition-colors"
                        title={isCollapsed ? "展開側邊欄" : "收合側邊欄"}
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                    {/* Modes Section */}
                    <div>
                        {!isCollapsed && (
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2 fade-in">
                                模式選擇
                            </h3>
                        )}
                        <div className="space-y-1.5">
                            {modes.map((mode) => {
                                const Icon = mode.icon;
                                const isActive = currentMode === mode.id;
                                return (
                                    <button
                                        key={mode.id}
                                        onClick={() => {
                                            onSelectMode(mode.id);
                                            setIsOpen(false);
                                        }}
                                        className={`
                                            w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl transition-all
                                            ${isActive
                                                ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 border border-indigo-500/30 shadow-md font-bold'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                                        `}
                                        title={isCollapsed ? mode.label : ''}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Icon size={18} className="shrink-0" />
                                            {!isCollapsed && <span className="truncate text-sm">{mode.label}</span>}
                                        </div>
                                        {!isCollapsed && mode.badge && (
                                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                {mode.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Topics Section */}
                    {(currentMode === 'review' || currentMode === 'quiz' || currentMode === 'understand' || currentMode === 'reader') && (
                        <div>
                            {!isCollapsed && (
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2 fade-in">
                                    主題與章節
                                </h3>
                            )}
                            <div className="space-y-1">
                                <button
                                    onClick={() => {
                                        onSelectTopic("All");
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition-colors
                                        ${currentTopic === "All"
                                            ? 'bg-purple-600/20 text-purple-400 font-bold'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                                    `}
                                    title="全部卡片"
                                >
                                    <Library size={18} className="shrink-0" />
                                    {!isCollapsed && <span className="truncate text-sm">全部卡片</span>}
                                </button>

                                <button
                                    onClick={() => {
                                        onSelectTopic("Mistakes");
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition-colors
                                        ${currentTopic === "Mistakes"
                                            ? 'bg-red-600/20 text-red-400 font-bold'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                                    `}
                                    title="思維盲點庫"
                                >
                                    <AlertCircle size={18} className="shrink-0 text-red-400" />
                                    {!isCollapsed && <span className="truncate text-sm">思維盲點庫</span>}
                                </button>

                                {!isCollapsed && (
                                    <>
                                        <div className="h-px bg-gray-800 my-2 mx-2"></div>
                                        {topics.map((topic) => (
                                            <button
                                                key={topic}
                                                onClick={() => {
                                                    onSelectTopic(topic);
                                                    setIsOpen(false);
                                                }}
                                                className={`
                                                    w-full text-left px-3 py-1.5 rounded-lg transition-colors text-xs truncate
                                                    ${currentTopic === topic
                                                        ? 'bg-purple-600/20 text-purple-400 font-bold'
                                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                                                `}
                                                title={topic}
                                            >
                                                {topic}
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Import Button */}
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={() => {
                            onSelectMode('import');
                            setIsOpen(false);
                        }}
                        className={`
                            w-full p-3 rounded-xl flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} transition-all 
                            ${currentMode === 'import'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                : 'hover:bg-gray-800 text-gray-300'}
                        `}
                        title="知識匯入與提煉"
                    >
                        <Sparkles size={18} className="shrink-0 text-yellow-300" />
                        {!isCollapsed && <span className="font-bold text-sm truncate">知識匯入與提煉</span>}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
