/**
 * AssemblyManager.js — Lógica de desmontagem, snap e montagem guiada
 * Atualizado para os componentes reais do SolidWorks
 */

import * as BABYLON from '@babylonjs/core'
import { PUMP_PARTS_META } from '../core/PumpModel.js'

// ── Sequência de desmontagem (ordem mecânica real da bomba) ──────────────────
// Regra geral: do externo para o interno, protocolos de segurança primeiro
export const DISASSEMBLY_SEQUENCE = [
  'protecao',           // 1. Retirar guarda de segurança NR-12
  'acoplamento_p2',     // 2. Soltar metade do acoplamento lado motor
  'acoplamento_p1',     // 3. Soltar metade do acoplamento lado bomba
  'acoplamento',        // 4. Remover conjunto do acoplamento
  'motor',              // 5. Desconectar e afastar motor
  'tampa_mancal',       // 6. Retirar tampa do mancal
  'rolamento_tras',     // 7. Extrair rolamento traseiro
  'gaxeta',             // 8. Afrouxar prensa-gaxeta
  'anel_lanterna',      // 9. Retirar anel lanterna
  'conjunto_vedacao',   // 10. Retirar anéis de gaxeta
  'camara_selo',        // 11. Remover câmara de selo
  'mancal',             // 12. Separar mancal da carcaça
  'rolamento_diant',    // 13. Extrair rolamento dianteiro
  'eixo',               // 14. Puxar eixo
  'anel_desgaste',      // 15. Retirar anel de desgaste
  'rotor',              // 16. Remover rotor/impeller
  'voluta_espiral',     // 17. Separar espiral
  'carcaca',            // 18. Carcaça fica na base
]

// ── Offsets de explosão (posições relativas ao origin de cada peça) ───────────
const EXPLODE_OFFSETS = {
  // Corpo hidráulico — explodir para a esquerda/frente
  carcaca:          new BABYLON.Vector3(-0.20,  0,     0),
  voluta_espiral:   new BABYLON.Vector3(-0.10,  0.40,  0),
  rotor:            new BABYLON.Vector3(-0.40,  0.35,  0),
  anel_desgaste:    new BABYLON.Vector3(-0.30,  0.55,  0),

  // Eixo — explodir para cima
  eixo:             new BABYLON.Vector3( 0,     0.55,  0),

  // Mancal — explodir para cima/direita
  mancal:           new BABYLON.Vector3( 0.10,  0.50,  0),
  tampa_mancal:     new BABYLON.Vector3( 0.20,  0.55,  0),
  rolamento_diant:  new BABYLON.Vector3( 0,     0.65,  0.25),
  rolamento_tras:   new BABYLON.Vector3( 0,     0.65, -0.25),

  // Vedação — explodir para baixo/frente
  camara_selo:      new BABYLON.Vector3( 0,    -0.40,  0.35),
  gaxeta:           new BABYLON.Vector3( 0,    -0.50,  0.25),
  conjunto_vedacao: new BABYLON.Vector3( 0,    -0.60,  0.20),
  anel_lanterna:    new BABYLON.Vector3( 0,    -0.55,  0.30),

  // Transmissão — explodir para a direita
  acoplamento:      new BABYLON.Vector3( 0.55,  0.30,  0),
  acoplamento_p1:   new BABYLON.Vector3( 0.55,  0.20,  0.20),
  acoplamento_p2:   new BABYLON.Vector3( 0.55,  0.20, -0.20),
  protecao:         new BABYLON.Vector3( 0.40,  0.55,  0),

  // Motor — explodir para a direita
  motor:            new BABYLON.Vector3( 0.60,  0,     0),

  // Base fica estática
  base:             new BABYLON.Vector3( 0,     0,     0),
}

const SNAP_RADIUS = 0.10  // metros — um pouco maior para facilitar no VR

export class AssemblyManager {
  constructor(scene, pumpModel) {
    this.scene     = scene
    this.pumpModel = pumpModel

    this.isExploded        = false
    this.currentMode       = 'visualizacao'
    this.assembledParts    = new Set()
    this.guidedStep        = 0
    this.challengeScore    = 0
    this.onStepChange      = null
    this.onAssemblyComplete = null
  }

  init() {
    Object.keys(this.pumpModel.parts).forEach(k => this.assembledParts.add(k))
  }

  // ── Animação de explosão ───────────────────────────────────────────────
  async explode(animated = true) {
    this.isExploded = true
    const promises = []

    Object.entries(this.pumpModel.parts).forEach(([key, node]) => {
      const offset = EXPLODE_OFFSETS[key] ?? new BABYLON.Vector3(0, 0.4, 0)
      const target = this.pumpModel.originPos[key].add(offset)
      const delay  = DISASSEMBLY_SEQUENCE.indexOf(key) * 60

      if (animated) promises.push(this._animateTo(node, target, 550, delay))
      else node.position = target
    })

    await Promise.all(promises)
  }

  async assemble(animated = true) {
    this.isExploded = false
    const promises = []

    Object.entries(this.pumpModel.parts).forEach(([key, node]) => {
      const target = this.pumpModel.originPos[key].clone()
      const delay  = (DISASSEMBLY_SEQUENCE.length - DISASSEMBLY_SEQUENCE.indexOf(key)) * 40

      if (animated) promises.push(this._animateTo(node, target, 600, delay))
      else node.position = target
    })

    await Promise.all(promises)
  }

  // ── Montagem guiada: um passo por vez ─────────────────────────────────
  async guidedAssembleNext() {
    const seq = [...DISASSEMBLY_SEQUENCE].reverse()
    if (this.guidedStep >= seq.length) {
      this.onAssemblyComplete?.()
      return false
    }

    const key  = seq[this.guidedStep]
    const node = this.pumpModel.parts[key]
    if (!node) { this.guidedStep++; return this.guidedAssembleNext() }

    this.onStepChange?.(key, this.guidedStep, seq.length)

    const target = this.pumpModel.originPos[key].clone()
    await this._animateTo(node, target, 700)
    this.assembledParts.add(key)
    this.guidedStep++
    return true
  }

  resetGuided() {
    this.guidedStep = 0
    this.assembledParts.clear()
  }

  // ── Snap automático ────────────────────────────────────────────────────
  trySnap(key) {
    const node   = this.pumpModel.parts[key]
    if (!node) return false

    const meta = PUMP_PARTS_META[key]
    if (!meta?.interactive) return false

    const origin = this.pumpModel.originPos[key]
    const dist   = BABYLON.Vector3.Distance(node.position, origin)

    if (dist < SNAP_RADIUS) {
      this._animateTo(node, origin.clone(), 220)
      this.assembledParts.add(key)
      this._updateChallengeScore(key, true)
      return true
    }

    if (this.currentMode === 'desafio') {
      this._updateChallengeScore(key, false)
    }
    return false
  }

  // ── Controle de modos ──────────────────────────────────────────────────
  setMode(mode) {
    this.currentMode = mode
    switch (mode) {
      case 'visualizacao':
        this.assemble(true)
        break
      case 'desmontagem':
        this.explode(true)
        break
      case 'montagem_guiada':
        this.explode(false).then(() => {
          this.resetGuided()
          this.guidedAssembleNext()
        })
        break
      case 'desafio':
        this.explode(true)
        this.resetGuided()
        this.challengeScore = 0
        break
    }
  }

  getNextExpectedPart() {
    const seq = [...DISASSEMBLY_SEQUENCE].reverse()
    return seq[this.guidedStep] ?? null
  }

  getInteractiveParts() {
    return DISASSEMBLY_SEQUENCE.filter(k => PUMP_PARTS_META[k]?.interactive)
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  _animateTo(node, target, durationMs, delayMs = 0) {
    return new Promise(resolve => {
      setTimeout(() => {
        const start  = node.position.clone()
        const startT = performance.now()
        const tick   = () => {
          const t = Math.min((performance.now() - startT) / durationMs, 1)
          const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2
          node.position = BABYLON.Vector3.Lerp(start, target, e)
          t < 1 ? requestAnimationFrame(tick) : (node.position = target, resolve())
        }
        requestAnimationFrame(tick)
      }, delayMs)
    })
  }

  _updateChallengeScore(key, correct) {
    if (this.currentMode !== 'desafio') return
    if (correct) this.challengeScore += 10
  }
}
