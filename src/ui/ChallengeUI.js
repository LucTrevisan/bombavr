/**
 * ChallengeUI.js — HUD 2D do modo desafio: timer, score, feedback
 */

export class ChallengeUI {
  constructor() {
    this._el      = null
    this._timer   = null
    this._seconds = 0
    this._score   = 0
    this._errors  = 0
    this._running = false
    this._build()
  }

  _build() {
    this._el = document.createElement('div')
    this._el.id = 'challenge-hud'
    this._el.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 200px;
      background: rgba(10,14,26,0.90);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(232,171,0,0.35);
      border-radius: 14px;
      padding: 16px 18px;
      color: #e0e8f0;
      font-family: 'Courier New', monospace;
      display: none;
      z-index: 60;
    `
    this._el.innerHTML = `
      <div style="font-size:10px;letter-spacing:3px;color:#E8AB00;margin-bottom:10px">MODO DESAFIO</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:11px;color:#8A9AB0">TEMPO</span>
        <span id="ch-time" style="font-size:20px;font-weight:bold;color:#E8AB00">00:00</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:11px;color:#8A9AB0">PONTOS</span>
        <span id="ch-score" style="font-size:20px;font-weight:bold;color:#00979D">000</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span style="font-size:11px;color:#8A9AB0">ERROS</span>
        <span id="ch-errors" style="font-size:20px;font-weight:bold;color:#FF5060">0</span>
      </div>
      <div style="height:1px;background:rgba(232,171,0,0.2);margin-bottom:10px"></div>
      <div id="ch-feedback" style="font-size:12px;color:#8A9AB0;min-height:18px;text-align:center"></div>
      <div id="ch-next" style="font-size:11px;color:#E8AB00;margin-top:6px;text-align:center"></div>
    `
    document.body.appendChild(this._el)
  }

  show() {
    this._el.style.display = 'block'
    this._score   = 0
    this._errors  = 0
    this._seconds = 0
    this._running = true
    this._update()
    this._timer = setInterval(() => {
      if (!this._running) return
      this._seconds++
      this._update()
    }, 1000)
  }

  hide() {
    this._el.style.display = 'none'
    this._running = false
    clearInterval(this._timer)
  }

  addScore(pts) {
    this._score += pts
    this._flashEl('ch-score', '#00979D')
    this._update()
  }

  addError() {
    this._errors++
    this._flashEl('ch-errors', '#FF5060')
    this._update()
  }

  setFeedback(text, color = '#8A9AB0') {
    const el = document.getElementById('ch-feedback')
    if (el) { el.textContent = text; el.style.color = color }
  }

  setNextPart(label) {
    const el = document.getElementById('ch-next')
    if (el) el.textContent = label ? `→ ${label}` : ''
  }

  showResult() {
    this._running = false
    clearInterval(this._timer)

    const time = this._formatTime(this._seconds)
    const bonus = Math.max(0, 300 - this._seconds) * 2
    const total = this._score + bonus

    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.85);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      z-index:200;gap:16px;font-family:'Courier New',monospace;
    `
    overlay.innerHTML = `
      <div style="font-size:11px;letter-spacing:4px;color:#E8AB00">DESAFIO CONCLUÍDO</div>
      <div style="font-size:52px;font-weight:bold;color:#00979D">${total}</div>
      <div style="font-size:13px;color:#8A9AB0">pontos totais</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin:8px 0">
        ${this._statBox('Tempo', time, '#E8AB00')}
        ${this._statBox('Acertos', `${(this._score/10)|0}/${9}`, '#00979D')}
        ${this._statBox('Erros', this._errors, '#FF5060')}
      </div>
      <div style="font-size:11px;color:#4a6080">Bônus de velocidade: +${bonus} pts</div>
      <button onclick="this.parentNode.remove();window._app?.modeController?._switchMode('visualizacao',document.querySelectorAll('.mode-btn'),document.querySelector('.mode-btn'))"
        style="margin-top:12px;padding:10px 28px;background:#00979D;border:none;
               border-radius:8px;color:#fff;font-size:13px;cursor:pointer;letter-spacing:1px">
        CONTINUAR
      </button>
    `
    document.body.appendChild(overlay)
  }

  _statBox(label, value, color) {
    return `<div style="text-align:center">
      <div style="font-size:26px;font-weight:bold;color:${color}">${value}</div>
      <div style="font-size:10px;color:#4a6080;letter-spacing:2px">${label}</div>
    </div>`
  }

  _update() {
    const t = document.getElementById('ch-time')
    const s = document.getElementById('ch-score')
    const e = document.getElementById('ch-errors')
    if (t) t.textContent = this._formatTime(this._seconds)
    if (s) s.textContent = String(this._score).padStart(3, '0')
    if (e) e.textContent = this._errors
  }

  _formatTime(s) {
    return `${String((s/60)|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  }

  _flashEl(id, color) {
    const el = document.getElementById(id)
    if (!el) return
    const orig = el.style.color
    el.style.color = '#fff'
    el.style.textShadow = `0 0 12px ${color}`
    setTimeout(() => { el.style.color = orig; el.style.textShadow = '' }, 300)
  }
}
