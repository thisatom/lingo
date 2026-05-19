/** Decode mono 16-bit PCM WAV (as produced by the renderer recorder). */

export function decodeWav16Mono(buffer: Buffer): {
  samples: Float32Array
  sampleRate: number
} {
  if (buffer.length < 44) {
    throw new Error('INVALID_WAV')
  }

  const riff = buffer.toString('ascii', 0, 4)
  const wave = buffer.toString('ascii', 8, 12)
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new Error('INVALID_WAV')
  }

  let offset = 12
  let sampleRate = 16_000
  let numChannels = 1
  let bitsPerSample = 16
  let dataOffset = -1
  let dataSize = 0

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4)
    const chunkSize = buffer.readUInt32LE(offset + 4)
    const chunkDataStart = offset + 8

    if (chunkId === 'fmt ') {
      numChannels = buffer.readUInt16LE(chunkDataStart + 2)
      sampleRate = buffer.readUInt32LE(chunkDataStart + 4)
      bitsPerSample = buffer.readUInt16LE(chunkDataStart + 14)
    } else if (chunkId === 'data') {
      dataOffset = chunkDataStart
      dataSize = chunkSize
      break
    }

    offset = chunkDataStart + chunkSize + (chunkSize % 2)
  }

  if (dataOffset < 0 || bitsPerSample !== 16) {
    throw new Error('UNSUPPORTED_WAV_FORMAT')
  }

  const frameCount = Math.floor(dataSize / (bitsPerSample / 8) / numChannels)
  const samples = new Float32Array(frameCount)
  let read = dataOffset

  for (let i = 0; i < frameCount; i++) {
    let sample = 0
    for (let ch = 0; ch < numChannels; ch++) {
      const int16 = buffer.readInt16LE(read)
      read += 2
      sample += int16 / (int16 < 0 ? 0x8000 : 0x7fff)
    }
    samples[i] = sample / numChannels
  }

  return { samples, sampleRate }
}
