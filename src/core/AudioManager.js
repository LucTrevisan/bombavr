/**
 * AudioManager.js — Áudio 3D espacial para interações
 * Usa Web Audio API diretamente (sem dependência extra)
 * Sons gerados proceduralmente (sem arquivos externos)
 */

export class AudioManager {
  constructor() {
    this._ctx   = null
    this._muted = false
  }

  async init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)()
      // Desbloquear contexto em mobile/VR com interação do usuário
      document.addEventListener('pointerdown', () => {
        if (this._ctx?.state === 'suspended') this._ctx.resume()
      }, { once: true })
      console.log('🔊 AudioManager iniciado')
    } catch (e) {
      console.warn('Áudio não disponível:', e)
    }
  }

  // ── Sons procedurais ────────────────────────────────────────────────────

  // Peça selecionada — clique metálico leve
  playSelect(position) {
    this._metalClick(800, 0.06, 0.08, position)
  }

  // Snap correto — confirmação dupla agradável
  playSnap(position) {
    this._metalClick(1200, 0.12, 0.15, position)
    setTimeout(() => this._metalClick(1600, 0.08, 0.10, position), 80)
  }

  // Erro — som abafado descendente
  playError(position) {
    this._buzz(200, 120, 0.10, 0.18, position)
  }

  // Montagem completa — fanfarra curta
  playComplete() {
    const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      setTimeout(() => this._tone(freq, 0.15, 0.18), i * 110)
    })
  }

  // Arrastar peça — som suave de deslizamento
  playDragStart() {
    this._noise(0.04, 0.12)
  }

  // ── Geradores de som ────────────────────────────────────────────────────

  _metalClick(freq, gain, duration, pos) {
    if (!this._ctx || this._muted) return
    const ctx = this._ctx

    const osc    = ctx.createOscillator()
    const gainN  = ctx.createGain()
    const panner = ctx.createPanner()

    osc.type      = 'triangle'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, ctx.currentTime + duration)

    gainN.gain.setValueAtTime(gain, ctx.currentTime)
    gainN.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    if (pos) {
      panner.panningModel    = 'HRTF'
      panner.positionX.value = pos.x ?? 0
      panner.positionY.value = pos.y ?? 0
      panner.positionZ.value = pos.z ?? 0
    }

    osc.connect(gainN)
    gainN.connect(panner)
    panner.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }

  _buzz(startFreq, endFreq, gain, duration, pos) {
    if (!this._ctx || this._muted) return
    const ctx = this._ctx

    const osc   = ctx.createOscillator()
    const gainN = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration)

    gainN.gain.setValueAtTime(gain, ctx.currentTime)
    gainN.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.connect(gainN)
    gainN.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }

  _tone(freq, gain, duration) {
    if (!this._ctx || this._muted) return
    const ctx = this._ctx

    const osc   = ctx.createOscillator()
    const gainN = ctx.createGain()

    osc.type      = 'sine'
    osc.frequency.value = freq

    gainN.gain.setValueAtTime(gain, ctx.currentTime)
    gainN.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.connect(gainN)
    gainN.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }

  _noise(gain, duration) {
    if (!this._ctx || this._muted) return
    const ctx = this._ctx

    const bufferSize = ctx.sampleRate * duration
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data       = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3

    const src   = ctx.createBufferSource()
    const gainN = ctx.createGain()
    const filt  = ctx.createBiquadFilter()

    src.buffer = buffer
    filt.type  = 'bandpass'
    filt.frequency.value = 2000
    filt.Q.value         = 0.5

    gainN.gain.setValueAtTime(gain, ctx.currentTime)
    gainN.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    src.connect(filt)
    filt.connect(gainN)
    gainN.connect(ctx.destination)
    src.start(ctx.currentTime)
    src.stop(ctx.currentTime + duration)
  }

  toggleMute() {
    this._muted = !this._muted
    return this._muted
  }
}
