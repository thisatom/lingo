import { useEffect, useRef, useState } from 'react'
import {
  acquireMicrophoneStream,
  releaseMicrophoneStream
} from '@/shared/lib/microphone'

const BAR_COUNT = 36
const RECEIVE_THRESHOLD = 0.04

export interface UseAudioLevelMonitorOptions {
  active: boolean
  deviceId?: string
  deviceLabel?: string
  /** Reuse an existing stream (e.g. from MediaRecorder) instead of opening a second one. */
  stream?: MediaStream | null
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function buildLevels(frequencyData: Uint8Array, barCount: number): number[] {
  const step = Math.max(1, Math.floor(frequencyData.length / barCount))
  const levels: number[] = []
  for (let i = 0; i < barCount; i++) {
    const start = i * step
    let sum = 0
    let count = 0
    for (let j = start; j < start + step && j < frequencyData.length; j++) {
      sum += frequencyData[j] ?? 0
      count++
    }
    const avg = count > 0 ? sum / count / 255 : 0
    levels.push(Math.min(1, avg * 1.8))
  }
  return levels
}

export function useAudioLevelMonitor({
  active,
  deviceId = '',
  deviceLabel = '',
  stream: externalStream = null
}: UseAudioLevelMonitorOptions) {
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0))
  const [peakLevel, setPeakLevel] = useState(0)
  const [isReceiving, setIsReceiving] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [durationSec, setDurationSec] = useState(0)

  const ownStreamRef = useRef(false)

  useEffect(() => {
    if (!active) {
      setLevels(Array(BAR_COUNT).fill(0))
      setPeakLevel(0)
      setIsReceiving(false)
      setPermissionDenied(false)
      setDurationSec(0)
      return
    }

    let cancelled = false
    let rafId = 0
    let stream: MediaStream | null = externalStream
    let audioContext: AudioContext | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let durationTimer: ReturnType<typeof setInterval> | null = null

    const start = async () => {
      if (!stream) {
        stream = await acquireMicrophoneStream(deviceId, deviceLabel)
        ownStreamRef.current = Boolean(stream)
      } else {
        ownStreamRef.current = false
      }

      if (cancelled) {
        if (ownStreamRef.current) releaseMicrophoneStream(stream)
        return
      }

      if (!stream || stream.getAudioTracks().length === 0) {
        setPermissionDenied(true)
        return
      }

      setPermissionDenied(false)

      audioContext = new AudioContext()
      try {
        if (audioContext.state === 'suspended') {
          await audioContext.resume()
        }
      } catch {
        // ignore
      }

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.65

      source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      const frequencyData = new Uint8Array(analyser.frequencyBinCount)

      const tick = () => {
        if (cancelled) return
        analyser.getByteFrequencyData(frequencyData)
        const nextLevels = buildLevels(frequencyData, BAR_COUNT)
        const peak = Math.max(...nextLevels, 0)
        setLevels(nextLevels)
        setPeakLevel(peak)
        setIsReceiving(peak >= RECEIVE_THRESHOLD)
        rafId = requestAnimationFrame(tick)
      }

      rafId = requestAnimationFrame(tick)
      durationTimer = setInterval(() => {
        setDurationSec((s) => s + 1)
      }, 1000)
    }

    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      if (durationTimer) clearInterval(durationTimer)
      try {
        source?.disconnect()
      } catch {
        // ignore
      }
      void audioContext?.close().catch(() => undefined)
      if (ownStreamRef.current) {
        releaseMicrophoneStream(stream)
        ownStreamRef.current = false
      }
    }
  }, [active, deviceId, deviceLabel, externalStream])

  return {
    levels,
    peakLevel,
    isReceiving,
    permissionDenied,
    durationSec,
    durationLabel: formatDuration(durationSec)
  }
}
