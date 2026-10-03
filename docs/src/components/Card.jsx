import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lightbulb, Compass, RotateCw } from 'lucide-react';

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

    return (
        <div className="relative w-full max-w-[90%] md:max-w-4xl aspect-[16/10] md:aspect-video cursor-pointer perspective-1000 select-none" onClick={handleFlip}>
            <motion.div
                className="w-full h-full relative preserve-3d"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* ================= 正面 (Front) ================= */}
                <div className="absolute w-full h-full backface-hidden bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700/80 flex flex-col md:flex-row">
                    {hasImage ? (
                        <>
                            {/* 傳統簡報圖片版面 */}
                            <div className="w-full h-2/3 md:w-2/3 md:h-full bg-black flex items-center justify-center relative">
                                <img
                                    src={card.imagePath}
                                    alt="Card Content"
                                    className="max-w-full max-h-full object-contain"
                                />
                                <div className="absolute bottom-2 right-2 md:hidden bg-black/60 text-white text-[10px] px-2 py-1 rounded-full opacity-60">
                                    投影片
                                </div>
                            </div>
                            <div className="w-full h-1/3 md:w-1/3 md:h-full p-4 md:p-6 flex flex-col justify-center bg-gray-850 border-t md:border-t-0 md:border-l border-gray-750">
                                <h3 className="text-xs md:text-sm uppercase tracking-wider text-gray-400 mb-1 md:mb-2 font-bold flex items-center gap-1.5">
                                    <Compass className="w-4 h-4 text-blue-400" /> 機制與描述
                                </h3>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <p className="text-gray-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                                        {card.description || "暫無詳細說明。"}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* 純文字/抽象概念專屬優化版面 */
                        <div className="w-full h-full p-6 md:p-10 flex flex-col justify-between bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 relative overflow-hidden">
                            {/* 裝飾性光暈底紋 */}
                            <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

                            {/* 頂部標籤列 */}
                            <div className="flex justify-between items-center z-10">
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" /> {card.source || "抽象概念解析"}
                                    </span>
                                    {card.analogy && (
                                        <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 items-center gap-1">
                                            <Lightbulb className="w-3 h-3" /> 直觀比喻助記
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400 opacity-70">
                                    <RotateCw className="w-3.5 h-3.5" /> 點擊翻轉看答案
                                </div>
                            </div>

                            {/* 中間主要理解內容 */}
                            <div className="my-auto z-10 flex flex-col gap-4 overflow-y-auto custom-scrollbar max-h-[70%] pr-2">
                                {card.analogy && (
                                    <div className="bg-amber-950/30 border border-amber-500/25 rounded-xl p-3.5 text-amber-200 text-xs md:text-sm leading-relaxed flex items-start gap-2.5">
                                        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold block text-amber-400 mb-0.5">直觀比喻：</span>
                                            {card.analogy}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-800/80 rounded-2xl p-5 md:p-6 border border-gray-700/80 shadow-inner">
                                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-indigo-400 mb-2">
                                        核心機制 / 概念解析
                                    </h4>
                                    <p className="text-gray-100 text-sm md:text-lg leading-relaxed whitespace-pre-wrap font-normal">
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
                    className="absolute w-full h-full backface-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 text-center"
                    style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                >
                    <div className="max-w-xl flex flex-col items-center gap-3">
                        <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white/20 text-white/90 backdrop-blur">
                            概念 / 機制解答
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-xl tracking-wide leading-tight">
                            {card.title || "未命名概念"}
                        </h2>
                        {card.analogy && (
                            <p className="text-xs md:text-sm text-purple-200 mt-2 bg-black/20 px-4 py-1.5 rounded-full backdrop-blur">
                                💡 {card.analogy}
                            </p>
                        )}
                        <span className="text-xs text-white/50 mt-4 flex items-center gap-1">
                            <RotateCw className="w-3.5 h-3.5" /> 點擊翻回正面複習
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Card;
