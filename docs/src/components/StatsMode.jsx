import { useState } from 'react';
import { BarChart2, PieChart, TrendingUp, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

const StatsMode = () => {
    const [selectedGameIdx, setSelectedGameIdx] = useState(null);

    // Load stats from local storage
    const getStats = () => {
        try {
            return JSON.parse(localStorage.getItem('quiz_stats')) || { gamesPlayed: 0, totalScore: 0, history: [] };
        } catch {
            return { gamesPlayed: 0, totalScore: 0, history: [] };
        }
    };

    const getLastSession = () => {
        try {
            return JSON.parse(localStorage.getItem('last_session_details')) || [];
        } catch {
            return [];
        }
    }

    const stats = getStats();

    // Determine which details to show: Selected game -> Last Session -> Nothing
    // Note: older history items might not have 'details' saved yet, so we handle that.
    const selectedGame = selectedGameIdx !== null ? stats.history[selectedGameIdx] : null;

    // Use selected game details if available, otherwise default to last session if no game selected
    // Note: We need to ensure quizMode saves 'details' into history for this to work for old games.
    // Since we just added that, only NEW games will have details.
    const displayDetails = selectedGame ? (selectedGame.details || []) : getLastSession();

    // Fallback: If viewing a specific game but it has no details (old data), warn user.
    const showDetailsWarning = selectedGame && !selectedGame.details;

    const averageScore = stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0;

    // Calculate Weakest Deck
    const lastSessionDetails = getLastSession();
    const weakTopics = lastSessionDetails.length > 0 ? lastSessionDetails.find(s => !s.isCorrect)?.source : "None Yet";

    return (
        <div className="w-full h-full flex flex-col p-3 sm:p-4 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl sm:text-2xl font-bold mb-3.5 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-500 shrink-0">
                Performance Stats
            </h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 shrink-0">
                <div className="bg-gray-800 p-3 sm:p-3.5 rounded-lg border border-gray-700 flex items-center gap-3 shadow-md">
                    <div className="p-2 bg-blue-600/20 text-blue-400 rounded-md">
                        <TrendingUp size={18} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Games Played</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">{stats.gamesPlayed}</p>
                    </div>
                </div>

                <div className="bg-gray-800 p-3 sm:p-3.5 rounded-lg border border-gray-700 flex items-center gap-3 shadow-md">
                    <div className="p-2 bg-purple-600/20 text-purple-400 rounded-md">
                        <BarChart2 size={18} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Average Score</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">{averageScore}</p>
                    </div>
                </div>

                <div className="bg-gray-800 p-3 sm:p-3.5 rounded-lg border border-gray-700 flex items-center gap-3 shadow-md">
                    <div className="p-2 bg-red-600/20 text-red-400 rounded-md">
                        <AlertCircle size={18} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Weakest Source</p>
                        <p className="text-base sm:text-lg font-bold text-white truncate max-w-[150px]" title="Play more to detect">
                            {weakTopics || "None Yet"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-3.5 flex-1 min-h-0">
                {/* History List */}
                <div className="lg:w-1/3 bg-gray-800 rounded-lg border border-gray-700 flex flex-col overflow-hidden max-h-[500px]">
                    <div className="p-3 sm:p-3.5 border-b border-gray-700 bg-gray-800 shrink-0">
                        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                            <Clock size={16} className="text-gray-400" />
                            History
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Click to view details</p>
                    </div>
                    <div className="overflow-y-auto p-2.5 space-y-1.5 flex-1 custom-scrollbar">
                        {stats.history.length === 0 ? (
                            <p className="text-gray-500 text-center py-4 text-xs">No games played yet.</p>
                        ) : (
                            [...stats.history].reverse().map((game, reverseIdx) => {
                                const realIdx = stats.history.length - 1 - reverseIdx;
                                const isSelected = selectedGameIdx === realIdx;
                                return (
                                    <button
                                        key={realIdx}
                                        onClick={() => setSelectedGameIdx(realIdx)}
                                        className={`w-full flex justify-between items-center p-2.5 rounded-md transition-all border text-xs
                                            ${isSelected
                                                ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50'
                                                : 'bg-gray-900/50 border-gray-700 hover:bg-gray-700 hover:border-gray-500'}
                                        `}
                                    >
                                        <div className="text-left">
                                            <p className={`font-bold ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                                                Score: {game.score}
                                            </p>
                                            <p className="text-[11px] text-gray-400">{new Date(game.date).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-md ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                            {game.topic}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Breakdown Table */}
                <div className="lg:w-2/3 bg-gray-800 rounded-lg border border-gray-700 flex flex-col overflow-hidden max-h-[500px]">
                    <div className="p-3 sm:p-3.5 border-b border-gray-700 bg-gray-800 shrink-0 flex justify-between items-center">
                        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-400" />
                            {selectedGame ? "Game Breakdown" : "Last Session Result"}
                        </h3>
                        {selectedGameIdx !== null && (
                            <button
                                onClick={() => setSelectedGameIdx(null)}
                                className="text-xs text-gray-400 hover:text-white underline"
                            >
                                Back to Last Session
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {showDetailsWarning ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center text-xs">
                                <AlertCircle size={36} className="mb-3 opacity-50" />
                                <p>Detailed breakdown not available for this legacy game.</p>
                                <p className="text-gray-600 mt-1">New games will have full details saved.</p>
                            </div>
                        ) : displayDetails && displayDetails.length > 0 ? (
                            <table className="w-full text-left text-xs sm:text-sm text-gray-400">
                                <thead className="bg-gray-900/50 text-gray-200 uppercase font-medium sticky top-0 backdrop-blur-sm z-10 text-[11px]">
                                    <tr>
                                        <th className="px-4 py-2.5">Question</th>
                                        <th className="px-4 py-2.5 text-center">Result</th>
                                        <th className="px-4 py-2.5 text-right">Time</th>
                                        <th className="px-4 py-2.5 text-right">Points</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {displayDetails.map((row, idx) => {
                                        const correctAnswers = displayDetails.filter(d => d.isCorrect);
                                        const fastestTime = Math.min(...correctAnswers.map(d => d.timeTaken || 999));
                                        const slowestTime = Math.max(...correctAnswers.map(d => d.timeTaken || 0));

                                        const isFastest = row.isCorrect && row.timeTaken === fastestTime;
                                        const isSlowest = row.isCorrect && row.timeTaken === slowestTime;

                                        return (
                                            <tr key={idx} className="hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-white max-w-[200px]">
                                                    <div className="truncate text-xs sm:text-sm" title={row.question}>{row.question}</div>
                                                    <div className="text-[10px] text-gray-500 truncate">{row.source}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {row.isCorrect === true ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-900/50 text-green-400 border border-green-800">
                                                            Correct
                                                        </span>
                                                    ) : row.isCorrect === 'partial' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-900/50 text-blue-400 border border-blue-800">
                                                            Close Call
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-900/50 text-red-400 border border-red-800">
                                                            Wrong
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 text-xs">
                                                        {isFastest && <span title="Fastest Answer" className="text-yellow-400">⚡</span>}
                                                        {isSlowest && <span title="Deep Thinker" className="text-blue-400">🧠</span>}
                                                        <span>{row.timeTaken ? `${row.timeTaken}s` : '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-white text-xs">
                                                    +{row.points}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                                No details available.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsMode;
