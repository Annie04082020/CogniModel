import { motion } from 'framer-motion';

const DeckSelector = ({ topics, currentTopic, onSelectTopic }) => {
    return (
        <div className="w-full overflow-x-auto pb-4 pt-2 no-scrollbar">
            <div className="flex space-x-2 px-4">
                <button
                    onClick={() => onSelectTopic("All")}
                    className={`
                        px-3 py-1 rounded-md whitespace-nowrap text-xs font-semibold transition-all duration-200
                        ${currentTopic === "All"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400/50"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-gray-200"}
                    `}
                >
                    All Cards
                </button>
                {topics.map((topic) => (
                    <button
                        key={topic}
                        onClick={() => onSelectTopic(topic)}
                        className={`
                            px-3 py-1 rounded-md whitespace-nowrap text-xs font-semibold transition-all duration-200
                            ${currentTopic === topic
                                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20 ring-1 ring-purple-400/50"
                                : "bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-gray-200"}
                        `}
                    >
                        {topic}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DeckSelector;
