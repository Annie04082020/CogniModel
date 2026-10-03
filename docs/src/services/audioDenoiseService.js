// audioDenoiseService.js - Web Audio API 降噪、人聲增強與離線音訊渲染

// 將 AudioBuffer 編碼為標準 16-bit PCM WAV Blob
export const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    let result;
    if (numChannels === 2) {
        result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
        result = buffer.getChannelData(0);
    }

    const dataLength = result.length * (bitDepth / 8);
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeUTFBytes(view, 8, 'WAVE');

    // fmt sub-chunk
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // 16 for PCM
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // byte rate
    view.setUint16(32, numChannels * (bitDepth / 8), true); // block align
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write samples
    floatTo16BitPCM(view, 44, result);

    return new Blob([arrayBuffer], { type: 'audio/wav' });
};

const writeUTFBytes = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

const interleave = (left, right) => {
    const length = left.length + right.length;
    const result = new Float32Array(length);
    let inputIndex = 0;
    for (let index = 0; index < length;) {
        result[index++] = left[inputIndex];
        result[index++] = right[inputIndex];
        inputIndex++;
    }
    return result;
};

const floatTo16BitPCM = (output, offset, input) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
};

// 建立降噪濾波器節點鏈
export const createDenoiseFilterNodes = (audioCtx, options = {}) => {
    const {
        highPassFreq = 100, // 濾除 100Hz 以下空調轟鳴與桌面震動
        lowPassFreq = 7500, // 濾除 7500Hz 以上高頻嘶嘶聲
        voiceBoostFreq = 2200, // 人聲頻段共振增益
        voiceBoostGain = 4, // +4dB
        volumeGain = 1.3 // 整體音量適度拉大
    } = options;

    // 1. 高通濾波器 (濾掉空調/風扇/低頻底噪)
    const highPass = audioCtx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = highPassFreq;
    highPass.Q.value = 0.7;

    // 2. 人聲清晰度峰值濾波器 (提升咬字清晰度)
    const voicePeak = audioCtx.createBiquadFilter();
    voicePeak.type = 'peaking';
    voicePeak.frequency.value = voiceBoostFreq;
    voicePeak.gain.value = voiceBoostGain;
    voicePeak.Q.value = 1.2;

    // 3. 低通濾波器 (濾掉高頻電流噪聲與刺耳雜訊)
    const lowPass = audioCtx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = lowPassFreq;
    lowPass.Q.value = 0.7;

    // 4. 動態範圍壓縮器 (壓低突發巨響，拉高弱小人聲)
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // 5. 總音量增益
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volumeGain;

    // 串聯各節點
    highPass.connect(voicePeak);
    voicePeak.connect(lowPass);
    lowPass.connect(compressor);
    compressor.connect(gainNode);

    return {
        inputNode: highPass,
        outputNode: gainNode
    };
};

// 離線渲染整個音訊檔，返回過濾後的 WAV 檔案
export const processAudioOffline = async (audioFile, options = {}) => {
    const arrayBuffer = await audioFile.arrayBuffer();
    const tempAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await tempAudioCtx.decodeAudioData(arrayBuffer);
    tempAudioCtx.close();

    // 建立離線 Context
    const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    const { inputNode, outputNode } = createDenoiseFilterNodes(offlineCtx, options);

    source.connect(inputNode);
    outputNode.connect(offlineCtx.destination);

    source.start(0);
    const renderedBuffer = await offlineCtx.startRendering();

    // 轉成 WAV Blob
    const wavBlob = audioBufferToWav(renderedBuffer);
    const cleanFileName = `denoised_${audioFile.name.replace(/\.[^/.]+$/, "")}.wav`;
    return new File([wavBlob], cleanFileName, { type: 'audio/wav' });
};
