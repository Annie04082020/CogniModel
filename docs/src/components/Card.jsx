import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lightbulb, Compass, RotateCw, Youtube, ExternalLink } from 'lucide-react';

const Card = ({ card, isFlipped: externalIsFlipped, onFlip }) => {
    const [internalIsFlipped, setInternalIsFlipped] = useState(false);

    // Determine if controlled or uncontrolled
    const isControlled = externalIsFlipped !== undefined;
    const isFlipped = isControlled ? externalIsFlipped : internalIsFlipped;

    const handleFlip = () => {
        if (isControlled) {
            onFlip?.();
        } else {
            setInternalIsFlipped(!internalIsFlipped);
        }
    };

    const hasImage = Boolean(card.imagePath);
    const isYouTube = Boolean(card.videoUrl || (card.imagePath && card.imagePath.includes('youtube.com')));

    return (
        <div className="relative w-full max-w-[90%] md:max-w-4xl aspect-[16/10] md:aspect-video cursor-pointer perspective-1000 select-none" onClick={handleFlip}>
            <motion.div
                className="w-full h-full relative"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.55, type: "spring", stiffness: 220, damping: 22 }}
                style={{
                    transformStyle: 'preserve-3d',
                    WebkitTransformStyle: 'preserve-3d',
                }}
            >
                {/* ================= 正面 (Front) ================= */}
                <div
                    className="absolute inset-0 w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-750 flex flex-col md:flex-row transition-opacity duration-200"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)',
                        opacity: isFlipped ? 0 : 1,
                        pointerEvents: isFlipped ? 'none' : 'auto',
                        zIndex: isFlipped ? 0 : 10,
                    }}
                >
                    {hasImage ? (
                        <>
                            {/* 圖片/縮圖版面 */}
                            <div className="w-full h-2/3 md:w-2/3 md:h-full bg-black flex items-center justify-center relative group">
                                <img
                                    src={card.imagePath}
                                    alt="Card Content"
                                    className="max-w-full max-h-full object-contain"
                                />
                                {card.videoUrl && (
                                    <a
                                        href={card.videoUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute top-3 left-3 bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg backdrop-blur transition-all"
                                        title="開啟對應 YouTube 影片"
                                    >
                                        <Youtube className="w-4 h-4" />
                                        <span>觀看影片 ↗</span>
                                    </a>
                                )}
                                <div className="absolute bottom-2 right-2 md:hidden bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md opacity-60">
                                    {isYouTube ? "影片縮圖" : "投影片"}
                                </div>
                            </div>
                            <div className="w-full h-1/3 md:w-1/3 md:h-full p-3.5 md:p-4.5 flex flex-col justify-center bg-gray-850 border-t md:border-t-0 md:border-l border-gray-750">
                                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-1 md:mb-1.5 font-bold flex items-center gap-1.5">
                                    <Compass className="w-3.5 h-3.5 text-blue-400" /> 機制與描述
                                </h3>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <p className="text-gray-200 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                                        {card.description || "暫無詳細說明。"}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* 純文字/抽象概念專屬優化版面 */
                        <div className="w-full h-full p-4 sm:p-5 md:p-6 flex flex-col justify-between bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 relative overflow-hidden">
                            {/* 裝飾性光暈底紋 */}
                            <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

                            {/* 頂部標籤列 */}
                            <div className="flex justify-between items-center z-10">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" /> {card.source || "抽象概念解析"}
                                    </span>
                                    {card.videoUrl && (
                                        <a
                                            href={card.videoUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="px-2 py-0.5 rounded-md text-xs font-bold bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/40 flex items-center gap-1 transition-all"
                                        >
                                            <Youtube className="w-3.5 h-3.5 text-red-400" /> YouTube 影片 ↗
                                        </a>
                                    )}
                                    {card.analogy && (
                                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 items-center gap-1">
                                            <Lightbulb className="w-3 h-3" /> 直觀比喻助記
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400 opacity-70 shrink-0">
                                    <RotateCw className="w-3 h-3" /> 點擊翻轉
                                </div>
                            </div>

                            {/* 中間主要理解內容 */}
                            <div className="my-auto z-10 flex flex-col gap-3 overflow-y-auto custom-scrollbar max-h-[70%] pr-2">
                                {card.analogy && (
                                    <div className="bg-amber-950/30 border border-amber-500/25 rounded-lg p-2.5 sm:p-3 text-amber-200 text-xs md:text-sm leading-relaxed flex items-start gap-2.5">
                                        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold block text-amber-400 mb-0.5">直觀比喻：</span>
                                            {card.analogy}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-800/80 rounded-lg p-3.5 sm:p-4.5 border border-gray-700/80 shadow-inner">
                                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-indigo-400 mb-1.5">
                                        核心機制 / 概念解析
                                    </h4>
                                    <p className="text-gray-100 text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-wrap font-normal">
                                        {card.description || "暫無文字描述。"}
                                    </p>
                                </div>
                            </div>

                            {/* 底部引導提示 */}
                            <div className="z-10 flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-800">
                                <span>思考：這個機制解決了什麼核心問題？</span>
                                <span className="text-indigo-400 font-medium">翻開卡片對應名詞 ➔</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ================= 背面 (Back) ================= */}
                <div
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 rounded-xl shadow-2xl flex flex-col items-center justify-center p-5 sm:p-6 text-center transition-opacity duration-200"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        opacity: isFlipped ? 1 : 0,
                        pointerEvents: isFlipped ? 'auto' : 'none',
                        zIndex: isFlipped ? 10 : 0,
                    }}
                >
                    <div className="max-w-xl flex flex-col items-center gap-2.5">
                        <span className="px-3 py-0.5 rounded-md text-xs font-bold uppercase tracking-widest bg-white/20 text-white/90 backdrop-blur">
                            概念 / 機制解答
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white drop-shadow-xl tracking-wide leading-tight">
                            {card.title || "未命名概念"}
                        </h2>
                        {card.analogy && (
                            <p className="text-xs md:text-sm text-purple-200 mt-1.5 bg-black/20 px-3 py-1 rounded-md backdrop-blur">
                                💡 {card.analogy}
                            </p>
                        )}
                        <span className="text-xs text-white/50 mt-3 flex items-center gap-1">
                            <RotateCw className="w-3 h-3" /> 點擊翻回正面複習
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Card;
