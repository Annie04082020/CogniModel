import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Sparkles, Sliders, CheckCircle2, RotateCcw, Loader, Headphones } from 'lucide-react';
import { createDenoiseFilterNodes, processAudioOffline } from '../services/audioDenoiseService';

const AudioDenoisePlayer = ({ file, onConfirmDenoised, isAnalyzing }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isDenoiseActive, setIsDenoiseActive] = useState(true); // 預設開啟降噪
    const [isRendering, setIsRendering] = useState(false);

    // 降噪強度配置
    const [denoiseLevel, setDenoiseLevel] = useState('classroom'); // 'mild', 'classroom', 'strong'

    const audioRef = useRef(null);
    const audioCtxRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const filterInputRef = useRef(null);
    const filterOutputRef = useRef(null);
    const rawGainNodeRef = useRef(null);
    const audioUrlRef = useRef(null);

    // 取得當前濾波參數
    const getFilterOptions = (level) => {
        switch (level) {
            case 'mild':
                return { highPassFreq: 80, lowPassFreq: 8500, voiceBoostFreq: 2000, voiceBoostGain: 2.5, volumeGain: 1.1 };
            case 'strong':
                return { highPassFreq: 150, lowPassFreq: 6500, voiceBoostFreq: 2400, voiceBoostGain: 5.5, volumeGain: 1.4 };
            case 'classroom':
            default:
                return { highPassFreq: 110, lowPassFreq: 7500, voiceBoostFreq: 2200, voiceBoostGain: 4.0, volumeGain: 1.25 };
        }
    };

    // 初始化 Web Audio API Graph
    useEffect(() => {
        if (!file) return;

        const audio = new Audio();
        const url = URL.createObjectURL(file);
        audio.src = url;
        audioRef.current = audio;
        audioUrlRef.current = url;

        audio.onloadedmetadata = () => {
            setDuration(audio.duration || 0);
        };

        audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime || 0);
        };

        audio.onended = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        // 建立 AudioContext
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaElementSource(audio);
        sourceNodeRef.current = source;

        // 建立降噪濾波鏈
        const filters = createDenoiseFilterNodes(ctx, getFilterOptions(denoiseLevel));
        filterInputRef.current = filters.inputNode;
        filterOutputRef.current = filters.outputNode;

        // 建立直通路徑 Gain (原始聲音)
        const rawGain = ctx.createGain();
        rawGainNodeRef.current = rawGain;

        // 預設路由：
        // 降噪開啟：source -> filterInput ... filterOutput -> destination
        // 降噪關閉：source -> rawGain -> destination
        source.connect(filters.inputNode);
        filters.outputNode.connect(ctx.destination);

        source.connect(rawGain);
        rawGain.gain.value = 0; // 靜音直通路徑

        return () => {
            audio.pause();
            if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
            ctx.close();
        };
    }, [file]);

    // 切換降噪開關
    const toggleDenoise = () => {
        const nextState = !isDenoiseActive;
        setIsDenoiseActive(nextState);

        if (!filterOutputRef.current || !rawGainNodeRef.current || !audioCtxRef.current) return;

        const ctx = audioCtxRef.current;
        if (nextState) {
            // 切換為降噪路徑
            filterOutputRef.current.connect(ctx.destination);
            rawGainNodeRef.current.gain.value = 0;
        } else {
            // 切換為原始原音路徑
            filterOutputRef.current.disconnect();
            rawGainNodeRef.current.connect(ctx.destination);
            rawGainNodeRef.current.gain.value = 1;
        }
    };

    const togglePlay = async () => {
        if (!audioRef.current || !audioCtxRef.current) return;

        if (audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(e => console.error("Play error:", e));
            setIsPlaying(true);
        }
    };

    const handleSeek = (e) => {
        if (!audioRef.current) return;
        const newTime = parseFloat(e.target.value);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    // 格式化秒數
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // 確認降噪並處理音訊送出
    const handleConfirmAndProcess = async () => {
        if (!file) return;

        setIsRendering(true);
        try {
            // 透過離線 Context 生成降噪後的乾淨音訊
            const cleanWavFile = await processAudioOffline(file, getFilterOptions(denoiseLevel));
            // 傳遞給父元件進行 AI 提煉
            onConfirmDenoised(cleanWavFile);
        } catch (err) {
            console.error("Denoise processing error:", err);
            // 若離線處理失敗，降級使用原檔
            onConfirmDenoised(file);
        } finally {
            setIsRendering(false);
        }
    };

    return (
        <div className="bg-gray-900/95 p-6 rounded-3xl border border-purple-500/30 shadow-2xl flex flex-col gap-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
                        <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                            <span>錄音降噪與人聲增強監聽室</span>
                        </h4>
                        <p className="text-xs text-gray-400">
                            檔案：{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                    </div>
                </div>

                {/* 降噪模式切換紐 */}
                <div className="flex items-center gap-2 bg-gray-800/90 p-1 rounded-2xl border border-gray-700/60">
                    <button
                        onClick={toggleDenoise}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isDenoiseActive
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>✨ 人聲增強 & 降噪</span>
                    </button>
                    <button
                        onClick={toggleDenoise}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            !isDenoiseActive
                                ? 'bg-gray-700 text-white shadow-md'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>🔈 原始原音</span>
                    </button>
                </div>
            </div>

            {/* 播放進度控制條 */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all shrink-0"
                    >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>

                    <div className="flex-1 flex flex-col gap-1">
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            step="0.1"
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-gray-700 rounded-lg appearance-none"
                        />
                        <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                </div>

                {/* 聲學指示器提示 */}
                <div className="flex justify-between items-center text-xs text-gray-400 bg-gray-850 px-3.5 py-2 rounded-xl border border-gray-800">
                    <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isDenoiseActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></span>
                        {isDenoiseActive ? "已啟用：高通濾波 (切除空調轟鳴) + 2.2kHz 人聲共振增強 + 動態平衝" : "播放中：原始無濾波原音"}
                    </span>
                    <span className="text-[11px] text-purple-300">戴上耳機試聽對比效果最佳 🎧</span>
                </div>
            </div>

            {/* 降噪強度微調 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-gray-800 text-xs">
                <div className="flex items-center gap-2 text-gray-400">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>降噪濾波等級：</span>
                    <div className="flex gap-1">
                        {[
                            { id: 'mild', label: '溫和濾波' },
                            { id: 'classroom', label: '課堂人聲增強 (推薦)' },
                            { id: 'strong', label: '強力去噪' }
                        ].map((lvl) => (
                            <button
                                key={lvl.id}
                                onClick={() => setDenoiseLevel(lvl.id)}
                                className={`px-2.5 py-1 rounded-lg transition-all ${
                                    denoiseLevel === lvl.id
                                        ? 'bg-purple-600/40 text-purple-200 border border-purple-500/50 font-bold'
                                        : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                {lvl.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 確認清晰，送交 AI */}
                <button
                    disabled={isRendering || isAnalyzing}
                    onClick={handleConfirmAndProcess}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isRendering || isAnalyzing ? (
                        <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>{isRendering ? "正在渲染純淨音訊..." : "AI 深度理解提煉中..."}</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>試聽確認更清晰，開始 AI 轉譯提煉</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default AudioDenoisePlayer;
