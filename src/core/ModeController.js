/**
 * ModeController.js — Conecta botões HTML a todos os sistemas da aplicação
 * Versão 2: integra áudio, animações, challenge UI, etiquetas, raio-X
 */

import { PUMP_PARTS_META } from '../core/PumpModel.js'

export class ModeController {
  constructor(
    assemblyManager, interactionManager, vrUI, pumpModel,
    challengeUI, animController, partLabels, xrayView, audioManager,
    snapIndicators
  ) {
    this.assemblyManager    = assemblyManager
    this.interactionManager = interactionManager
    this.vrUI               = vrUI
    this.pumpModel          = pumpModel
    this.challengeUI        = challengeUI
    this.animController     = animController
    this.partLabels         = partLabels
    this.xrayView           = xrayView
    this.audioManager       = audioManager
    this.snapIndicators     = snapIndicators
    this.currentMode        = 'visualizacao'
    this._rotorSpinning     = false
  }

  init() {
    const buttons = document.querySelectorAll('.mode-btn')
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        this._switchMode(btn.dataset.mode, buttons, btn)
      })
    })

    this._buildToolbar()

    this.assemblyManager.onAssemblyComplete = () => {
      if (this.currentMode === 'desafio') {
        this.challengeUI.showResult()
        this.animController.playShowcase(3000)
      }
    }

    const origStep = this.assemblyManager.onStepChange
    this.assemblyManager.onStepChange = (key, idx, total) => {
      origStep?.(key, idx, total)
      this.partLabels.highlight(key, true)
      const meta = PUMP_PARTS_META[key]
      if (this.currentMode === 'desafio') {
        this.challengeUI.setNextPart(meta?.label)
        this.challengeUI.setFeedback('Monte: ' + (meta?.label ?? key), '#E8AB00')
      }
    }
  }

  _switchMode(mode, allBtns, activeBtn) {
    if (mode === this.currentMode) return
    const prev = this.currentMode
    this.currentMode = mode
    this._exitMode(prev)
    allBtns.forEach(b => b.classList.remove('active'))
    activeBtn?.classList.add('active')
    this._enterMode(mode)
    this.assemblyManager.setMode(mode)
    this.vrUI.setMode(mode)
    this.interactionManager.deselectPart()
    this.snapIndicators?.hideAll()
  }

  _exitMode(mode) {
    if (mode === 'desafio') this.challengeUI.hide()
    if (mode === 'visualizacao') this.animController.stopRotorSpin()
    this.partLabels.hide()
  }

  _enterMode(mode) {
    switch (mode) {
      case 'visualizacao':
        this.partLabels.show()
        setTimeout(() => this.animController.playShowcase(3500), 800)
        break
      case 'desmontagem':
        this.partLabels.show()
        if (window._app?.sceneManager?.camera) window._app.sceneManager.camera.radius = 3.5
        break
      case 'montagem_guiada':
        this.partLabels.show()
        this.audioManager?.playSelect()
        break
      case 'desafio':
        this.challengeUI.show()
        this.challengeUI.setFeedback('Inicie a montagem!', '#00979D')
        setTimeout(() => this.challengeUI.setFeedback(''), 2000)
        break
    }
  }

  _buildToolbar() {
    const bar = document.createElement('div')
    bar.id = 'toolbar'
    bar.style.cssText = `
      position:fixed;bottom:24px;right:20px;
      display:flex;flex-direction:column;gap:8px;z-index:55;
    `

    const mkBtn = (icon, label, action) => {
      const btn = document.createElement('button')
      btn.title = label
      btn.textContent = icon
      btn.style.cssText = `
        width:42px;height:42px;border-radius:50%;
        background:rgba(10,14,26,0.90);backdrop-filter:blur(10px);
        border:1px solid rgba(0,151,157,0.30);color:#e0e8f0;
        font-size:18px;cursor:pointer;transition:all 0.2s;
        display:flex;align-items:center;justify-content:center;
      `
      btn.addEventListener('click', () => action(btn))
      btn.addEventListener('mouseenter', () => {
        btn.style.borderColor = '#00979D'
        btn.style.background  = 'rgba(0,151,157,0.15)'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.borderColor = 'rgba(0,151,157,0.30)'
        btn.style.background  = 'rgba(10,14,26,0.90)'
      })
      return btn
    }

    bar.appendChild(mkBtn('🏷️', 'Etiquetas',   () => this.partLabels.toggle()))
    bar.appendChild(mkBtn('✂️', 'Corte',       () => this.xrayView.toggle()))
    bar.appendChild(mkBtn('⚙️', 'Rotor ON/OFF',() => this._toggleRotor()))
    bar.appendChild(mkBtn('🎬', 'Cinemática',  () => this._playCinematic()))
    bar.appendChild(mkBtn('🔊', 'Áudio ON/OFF',(btn) => {
      const muted = this.audioManager?.toggleMute()
      btn.style.opacity = muted ? '0.4' : '1'
      btn.title = muted ? '🔇 Mudo' : '🔊 Áudio'
    }))

    document.body.appendChild(bar)
  }

  _toggleRotor() {
    this._rotorSpinning = !this._rotorSpinning
    this._rotorSpinning
      ? this.animController.startRotorSpin(1450)
      : this.animController.stopRotorSpin()
  }

  async _playCinematic() {
    if (this.animController._isPlaying) return
    if (this.currentMode === 'desmontagem') {
      await this.animController.playDisassemblyMovie()
    } else {
      await this.animController.playAssemblyMovie()
    }
  }
}
