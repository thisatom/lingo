/** Mono 16-bit PCM WAV at 16 kHz — reliable input for Whisper. */

const TARGET_SAMPLE_RATE = 16_000



const WORKLET_PROCESSOR = 'lingo-pcm-recorder'



/** Served from /public — must not use blob: URLs (blocked by CSP). */

function getWorkletModuleUrl(): string {
  const relative = `audio/${WORKLET_PROCESSOR}.worklet.js`
  if (typeof window !== 'undefined' && window.location.href) {
    return new URL(relative, window.location.href).href
  }
  return `/${relative}`
}



export interface WavRecorderSession {

  stop: () => Promise<{ audioBase64: string; format: 'wav'; byteLength: number } | null>

  abort: () => void

}



function encodeWav16Mono(samples: Float32Array, sampleRate: number): ArrayBuffer {

  const numSamples = samples.length

  const dataSize = numSamples * 2

  const buffer = new ArrayBuffer(44 + dataSize)

  const view = new DataView(buffer)



  const writeString = (offset: number, value: string) => {

    for (let i = 0; i < value.length; i++) {

      view.setUint8(offset + i, value.charCodeAt(i))

    }

  }



  writeString(0, 'RIFF')

  view.setUint32(4, 36 + dataSize, true)

  writeString(8, 'WAVE')

  writeString(12, 'fmt ')

  view.setUint32(16, 16, true)

  view.setUint16(20, 1, true)

  view.setUint16(22, 1, true)

  view.setUint32(24, sampleRate, true)

  view.setUint32(28, sampleRate * 2, true)

  view.setUint16(32, 2, true)

  view.setUint16(34, 16, true)

  writeString(36, 'data')

  view.setUint32(40, dataSize, true)



  let offset = 44

  for (let i = 0; i < numSamples; i++) {

    const sample = Math.max(-1, Math.min(1, samples[i] ?? 0))

    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)

    offset += 2

  }



  return buffer

}



function downsampleToMono(

  input: Float32Array,

  inputSampleRate: number,

  targetSampleRate: number

): Float32Array {

  if (inputSampleRate === targetSampleRate) return input

  const ratio = inputSampleRate / targetSampleRate

  const length = Math.max(1, Math.round(input.length / ratio))

  const output = new Float32Array(length)

  for (let i = 0; i < length; i++) {

    const start = Math.floor(i * ratio)

    const end = Math.min(input.length, Math.floor((i + 1) * ratio))

    let sum = 0

    let count = 0

    for (let j = start; j < end; j++) {

      sum += input[j] ?? 0

      count++

    }

    output[i] = count > 0 ? sum / count : 0

  }

  return output

}



function mergeChunks(chunks: Float32Array[]): Float32Array {

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)

  const merged = new Float32Array(total)

  let offset = 0

  for (const chunk of chunks) {

    merged.set(chunk, offset)

    offset += chunk.length

  }

  return merged

}



function arrayBufferToBase64(buffer: ArrayBuffer): string {

  const bytes = new Uint8Array(buffer)

  let binary = ''

  for (let i = 0; i < bytes.length; i++) {

    binary += String.fromCharCode(bytes[i]!)

  }

  return btoa(binary)

}



async function loadWorkletModule(audioContext: AudioContext): Promise<void> {
  const url = getWorkletModuleUrl()
  await audioContext.audioWorklet.addModule(url)
}



export function isWavRecorderSupported(): boolean {

  return (

    typeof AudioContext !== 'undefined' &&

    typeof MediaStream !== 'undefined' &&

    typeof AudioWorkletNode !== 'undefined'

  )

}



export async function startWavRecorder(

  stream: MediaStream

): Promise<WavRecorderSession | null> {

  const audioTracks = stream.getAudioTracks()

  if (audioTracks.length === 0) return null



  const audioContext = new AudioContext()

  try {

    await loadWorkletModule(audioContext)

    if (audioContext.state === 'suspended') {

      await audioContext.resume()

    }

  } catch (err) {

    console.warn('[lingo wav] AudioWorklet failed:', err)

    await audioContext.close().catch(() => undefined)

    return null

  }



  const chunks: Float32Array[] = []

  let aborted = false

  const startedAt = Date.now()



  const source = audioContext.createMediaStreamSource(stream)

  const worklet = new AudioWorkletNode(audioContext, WORKLET_PROCESSOR)

  const silentGain = audioContext.createGain()

  silentGain.gain.value = 0



  worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {

    if (aborted) return

    const data = event.data

    if (data instanceof Float32Array && data.length > 0) {

      chunks.push(new Float32Array(data))

    }

  }



  source.connect(worklet)

  worklet.connect(silentGain)

  silentGain.connect(audioContext.destination)



  const teardown = () => {

    worklet.port.onmessage = null

    source.disconnect()

    worklet.disconnect()

    silentGain.disconnect()

  }



  const finalize = async (): Promise<{ audioBase64: string; format: 'wav'; byteLength: number } | null> => {

    aborted = true

    teardown()



    const merged = mergeChunks(chunks)

    const sampleRate = audioContext.sampleRate

    await audioContext.close().catch(() => undefined)



    const durationMs = Date.now() - startedAt

    if (durationMs < 350 || merged.length < sampleRate * 0.25) {

      return null

    }



    const mono = downsampleToMono(merged, sampleRate, TARGET_SAMPLE_RATE)

    const wav = encodeWav16Mono(mono, TARGET_SAMPLE_RATE)

    if (wav.byteLength < 1000) {

      return null

    }



    return {

      audioBase64: arrayBufferToBase64(wav),

      format: 'wav',

      byteLength: wav.byteLength

    }

  }



  return {

    stop: () => finalize(),

    abort: () => {

      aborted = true

      teardown()

      void audioContext.close()

    }

  }

}


