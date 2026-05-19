import { WHISPER_SAMPLE_RATE } from './speech-audio-constants'

function viewFor(bytes: ArrayBuffer | Uint8Array): DataView {
  if (bytes instanceof ArrayBuffer) {
    return new DataView(bytes)
  }
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}

function ascii(view: DataView, start: number, len: number): string {
  let s = ''
  for (let i = 0; i < len; i++) {
    s += String.fromCharCode(view.getUint8(start + i))
  }
  return s
}

/** Decode 16-bit PCM WAV to mono Float32 in [-1, 1]. */
export function decodeWavPcm16ToFloat32(
  bytes: ArrayBuffer | Uint8Array,
  expectedSampleRate = WHISPER_SAMPLE_RATE
): Float32Array {
  const view = viewFor(bytes)
  if (view.byteLength < 44) throw new Error('INVALID_WAV')
  if (ascii(view, 0, 4) !== 'RIFF' || ascii(view, 8, 4) !== 'WAVE') {
    throw new Error('INVALID_WAV')
  }

  let offset = 12
  let sampleRate = expectedSampleRate
  let numChannels = 1
  let bitsPerSample = 16
  let dataOffset = -1
  let dataSize = 0

  while (offset + 8 <= view.byteLength) {
    const chunkId = ascii(view, offset, 4)
    const chunkSize = view.getUint32(offset + 4, true)
    const chunkDataStart = offset + 8

    if (chunkId === 'fmt ') {
      const audioFormat = view.getUint16(chunkDataStart, true)
      numChannels = view.getUint16(chunkDataStart + 2, true)
      sampleRate = view.getUint32(chunkDataStart + 4, true)
      bitsPerSample = view.getUint16(chunkDataStart + 14, true)
      if (audioFormat !== 1) throw new Error('UNSUPPORTED_WAV_ENCODING')
    } else if (chunkId === 'data') {
      dataOffset = chunkDataStart
      dataSize = chunkSize
    }

    offset = chunkDataStart + chunkSize + (chunkSize % 2)
  }

  if (dataOffset < 0 || bitsPerSample !== 16) throw new Error('INVALID_WAV')
  if (sampleRate !== expectedSampleRate) throw new Error('UNSUPPORTED_SAMPLE_RATE')

  const frameSize = (bitsPerSample / 8) * numChannels
  const numSamples = Math.floor(dataSize / frameSize)
  const samples = new Float32Array(numSamples)

  let pos = dataOffset
  for (let i = 0; i < numSamples; i++) {
    if (numChannels === 1) {
      const pcm = view.getInt16(pos, true)
      samples[i] = pcm / (pcm < 0 ? 0x8000 : 0x7fff)
      pos += 2
    } else {
      let sum = 0
      for (let ch = 0; ch < numChannels; ch++) {
        const pcm = view.getInt16(pos, true)
        sum += pcm / (pcm < 0 ? 0x8000 : 0x7fff)
        pos += 2
      }
      samples[i] = sum / numChannels
    }
  }

  return samples
}

export function encodeWav16Mono(samples: Float32Array, sampleRate: number): ArrayBuffer {
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
