function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
}

export async function convertAudioBlobToWav(source: Blob) {
  const AudioContextClass = window.AudioContext;
  const context = new AudioContextClass();
  try {
    const decoded = await context.decodeAudioData(await source.arrayBuffer());
    const frameCount = decoded.length;
    const mono = new Float32Array(frameCount);
    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const samples = decoded.getChannelData(channel);
      for (let index = 0; index < frameCount; index += 1) mono[index] += samples[index] / decoded.numberOfChannels;
    }

    const buffer = new ArrayBuffer(44 + frameCount * 2);
    const view = new DataView(buffer);
    writeAscii(view, 0, "RIFF");
    view.setUint32(4, 36 + frameCount * 2, true);
    writeAscii(view, 8, "WAVE");
    writeAscii(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, decoded.sampleRate, true);
    view.setUint32(28, decoded.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeAscii(view, 36, "data");
    view.setUint32(40, frameCount * 2, true);
    for (let index = 0; index < frameCount; index += 1) {
      const sample = Math.max(-1, Math.min(1, mono[index]));
      view.setInt16(44 + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return new Blob([buffer], { type: "audio/wav" });
  } finally {
    await context.close();
  }
}
