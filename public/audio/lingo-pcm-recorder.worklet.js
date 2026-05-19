class LingoPcmRecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0]
    if (channel && channel.length > 0) {
      this.port.postMessage(channel)
    }
    return true
  }
}

registerProcessor('lingo-pcm-recorder', LingoPcmRecorderProcessor)
