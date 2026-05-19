const BAR_COUNT = 10

type MeterListener = (levels: number[], isPlaying: boolean) => void

const listeners = new Set<MeterListener>()

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let connectedAudio: HTMLAudioElement | null = null
let rafId = 0

function idleLevels(): number[] {
  return Array(BAR_COUNT).fill(0.1)
}

function buildLevels(frequencyData: Uint8Array): number[] {
  const step = Math.max(1, Math.floor(frequencyData.length / BAR_COUNT))
  const levels: number[] = []
  for (let i = 0; i < BAR_COUNT; i++) {
    const start = i * step
    let sum = 0
    let count = 0
    for (let j = start; j < start + step && j < frequencyData.length; j++) {
      sum += frequencyData[j] ?? 0
      count++
    }
    const avg = count > 0 ? sum / count / 255 : 0
    levels.push(Math.min(1, avg * 2))
  }
  return levels
}

function notify(levels: number[], isPlaying: boolean): void {
  for (const listener of listeners) {
    listener(levels, isPlaying)
  }
}

function ensureGraph(audio: HTMLAudioElement): void {
  if (!audioContext) {
    audioContext = new AudioContext()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.65
    analyser.connect(audioContext.destination)
  }

  if (connectedAudio !== audio) {
    if (sourceNode) {
      try {
        sourceNode.disconnect()
      } catch {
        // ignore
      }
      sourceNode = null
    }
    sourceNode = audioContext.createMediaElementSource(audio)
    sourceNode.connect(analyser!)
    connectedAudio = audio
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }
}

function stopMeterLoop(): void {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  notify(idleLevels(), false)
}

function startMeterLoop(): void {
  if (!analyser) return
  stopMeterLoop()

  const data = new Uint8Array(analyser.frequencyBinCount)
  const tick = () => {
    if (!analyser) return
    analyser.getByteFrequencyData(data)
    notify(buildLevels(data), true)
    rafId = requestAnimationFrame(tick)
  }
  tick()
}

export function subscribeTtsPlaybackMeter(listener: MeterListener): () => void {
  listeners.add(listener)
  listener(idleLevels(), false)
  return () => {
    listeners.delete(listener)
  }
}

export function attachTtsPlaybackMeter(audio: HTMLAudioElement): void {
  ensureGraph(audio)
  startMeterLoop()
}

export function detachTtsPlaybackMeter(): void {
  stopMeterLoop()
  if (sourceNode) {
    try {
      sourceNode.disconnect()
    } catch {
      // ignore
    }
    sourceNode = null
  }
  connectedAudio = null
}
