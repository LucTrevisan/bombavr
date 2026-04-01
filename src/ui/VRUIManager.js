/**
 * VRUIManager.js — Interface 3D dentro do espaço VR
 * Painéis flutuantes com informações e controles
 */

import * as BABYLON from '@babylonjs/core'
import * as GUI     from '@babylonjs/gui'
import { PUMP_PARTS_META, PUMP_PARTS_META as META } from '../core/PumpModel.js'
import { DISASSEMBLY_SEQUENCE } from '../assembly/AssemblyManager.js'

export class VRUIManager {
  constructor(scene, assemblyManager) {
    this.scene           = scene
    this.assemblyManager = assemblyManager
    this._panels         = {}
  }

  init() {
    this._buildMainPanel()
    this._buildStepPanel()
    this._buildInfoPanel()
  }

  // ── Painel principal: modo e controles ───────────────────────────────────
  _buildMainPanel() {
    const plane = BABYLON.MeshBuilder.CreatePlane('ui_main', { width: 0.6, height: 0.4 }, this.scene)
    plane.position = new BABYLON.Vector3(-0.55, 0.0, 1.5)
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y
    plane.isPickable = false

    const tex = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 600, 400)

    const bg = new GUI.Rectangle()
    bg.background = '#0D1117CC'
    bg.cornerRadius = 16
    bg.thickness = 1
    bg.color = '#00979D'
    tex.addControl(bg)

    const stack = new GUI.StackPanel()
    stack.isVertical = true
    stack.paddingTop = '16px'
    bg.addControl(stack)

    // Título
    const title = new GUI.TextBlock()
    title.text      = 'BOMBA CENTRÍFUGA'
    title.color     = '#00979D'
    title.fontSize  = 22
    title.fontFamily = 'monospace'
    title.height    = '36px'
    stack.addControl(title)

    const subtitle = new GUI.TextBlock()
    subtitle.text     = 'Simulador VR — Mecatrônica'
    subtitle.color    = '#8A9AB0'
    subtitle.fontSize = 14
    subtitle.height   = '24px'
    stack.addControl(subtitle)

    // Separador
    const sep = new GUI.Rectangle()
    sep.height     = '1px'
    sep.width      = '90%'
    sep.background = '#00979D'
    sep.thickness  = 0
    sep.paddingTop = '8px'
    stack.addControl(sep)

    // Botões de modo
    const modes = [
      { id: 'visualizacao',    label: '👁  Visualizar' },
      { id: 'desmontagem',     label: '🔧  Desmontar' },
      { id: 'montagem_guiada', label: '📋  Guiada' },
      { id: 'desafio',         label: '🏆  Desafio' },
    ]

    modes.forEach(({ id, label }) => {
      const btn = GUI.Button.CreateSimpleButton(`btn_${id}`, label)
      btn.width       = '90%'
      btn.height      = '44px'
      btn.color       = '#E0E8F0'
      btn.background  = '#1A2030'
      btn.cornerRadius = 8
      btn.fontSize    = 14
      btn.paddingTop  = '4px'
      btn.onPointerClickObservable.add(() => {
        this.assemblyManager.setMode(id)
        this._updateModeButtons(modes.map(m => m.id), id, stack)
      })
      stack.addControl(btn)
      this._panels[`btn_${id}`] = btn
    })

    this._panels.mainTex = tex
    this._panels.mainPlane = plane
  }

  // ── Painel de passo (montagem guiada) ────────────────────────────────────
  _buildStepPanel() {
    const plane = BABYLON.MeshBuilder.CreatePlane('ui_step', { width: 0.55, height: 0.28 }, this.scene)
    plane.position    = new BABYLON.Vector3(0.55, 0.0, 1.5)
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y
    plane.isPickable  = false
    plane.setEnabled(false)

    const tex = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 550, 280)

    const bg = new GUI.Rectangle()
    bg.background   = '#0D1117E0'
    bg.cornerRadius = 14
    bg.thickness    = 1
    bg.color        = '#E8AB00'
    tex.addControl(bg)

    const stack = new GUI.StackPanel()
    stack.paddingTop = '12px'
    bg.addControl(stack)

    const stepLabel = new GUI.TextBlock()
    stepLabel.text     = 'PASSO 1 / 9'
    stepLabel.color    = '#E8AB00'
    stepLabel.fontSize = 18
    stepLabel.height   = '30px'
    stack.addControl(stepLabel)

    const stepName = new GUI.TextBlock()
    stepName.text     = '—'
    stepName.color    = '#E0E8F0'
    stepName.fontSize = 20
    stepName.height   = '34px'
    stepName.fontStyle = 'bold'
    stack.addControl(stepName)

    const stepDesc = new GUI.TextBlock()
    stepDesc.text         = 'Selecione a peça indicada e posicione-a corretamente.'
    stepDesc.color        = '#8A9AB0'
    stepDesc.fontSize     = 13
    stepDesc.height       = '48px'
    stepDesc.textWrapping = true
    stepDesc.width        = '90%'
    stack.addControl(stepDesc)

    const nextBtn = GUI.Button.CreateSimpleButton('btn_next', '▶  Próximo Passo')
    nextBtn.width       = '85%'
    nextBtn.height      = '40px'
    nextBtn.color       = '#0D1117'
    nextBtn.background  = '#E8AB00'
    nextBtn.cornerRadius = 8
    nextBtn.fontSize    = 14
    nextBtn.onPointerClickObservable.add(() => {
      this.assemblyManager.guidedAssembleNext()
    })
    stack.addControl(nextBtn)

    this._panels.stepPlane   = plane
    this._panels.stepLabel   = stepLabel
    this._panels.stepName    = stepName
    this._panels.stepDesc    = stepDesc
    this._panels.stepTex     = tex

    // Conectar callback ao AssemblyManager
    this.assemblyManager.onStepChange = (key, idx, total) => {
      this.showGuidedStep(key, idx, total)
    }
    this.assemblyManager.onAssemblyComplete = () => {
      this.showComplete()
    }
  }

  // ── Painel de info de peça ────────────────────────────────────────────────
  _buildInfoPanel() {
    const plane = BABYLON.MeshBuilder.CreatePlane('ui_info', { width: 0.50, height: 0.22 }, this.scene)
    plane.position    = new BABYLON.Vector3(0, 0.40, 1.2)
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL
    plane.isPickable  = false
    plane.setEnabled(false)

    const tex = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 500, 220)

    const bg = new GUI.Rectangle()
    bg.background   = '#0A0E1AE8'
    bg.cornerRadius = 12
    bg.thickness    = 1
    bg.color        = '#00979D55'
    tex.addControl(bg)

    const stack = new GUI.StackPanel()
    stack.paddingTop = '10px'
    bg.addControl(stack)

    const name = new GUI.TextBlock()
    name.color    = '#00979D'
    name.fontSize = 18
    name.height   = '30px'
    stack.addControl(name)

    const desc = new GUI.TextBlock()
    desc.color        = '#8A9AB0'
    desc.fontSize     = 12
    desc.height       = '70px'
    desc.textWrapping = true
    desc.width        = '90%'
    stack.addControl(desc)

    this._panels.infoPlane = plane
    this._panels.infoName  = name
    this._panels.infoDesc  = desc
    this._panels.infoTex   = tex
  }

  // ── API pública ──────────────────────────────────────────────────────────
  showPartInfo(key, worldPos) {
    const meta = PUMP_PARTS_META[key]
    if (!meta) return
    this._panels.infoName.text = meta.label
    this._panels.infoDesc.text = meta.desc
    if (worldPos) {
      this._panels.infoPlane.position = worldPos.add(new BABYLON.Vector3(0, 0.2, 0))
    }
    this._panels.infoPlane.setEnabled(true)
  }

  hidePartInfo() {
    this._panels.infoPlane?.setEnabled(false)
  }

  showGuidedStep(key, idx, total) {
    const meta = PUMP_PARTS_META[key]
    this._panels.stepLabel.text = `PASSO ${idx + 1} / ${total}`
    this._panels.stepName.text  = meta?.label ?? key
    this._panels.stepDesc.text  = `Encontre a peça "${meta?.label}" e posicione-a na bomba.`
    this._panels.stepPlane.setEnabled(true)
  }

  showComplete() {
    this._panels.stepLabel.text = '✅  CONCLUÍDO!'
    this._panels.stepName.text  = 'Bomba montada com sucesso'
    this._panels.stepDesc.text  = 'Parabéns! Você completou a montagem da bomba centrífuga.'
  }

  setMode(mode) {
    const isGuided = mode === 'montagem_guiada'
    const isDesafio = mode === 'desafio'
    this._panels.stepPlane?.setEnabled(isGuided || isDesafio)
  }

  _updateModeButtons(ids, activeId, stack) {
    ids.forEach(id => {
      const btn = this._panels[`btn_${id}`]
      if (!btn) return
      btn.background = id === activeId ? '#00979D' : '#1A2030'
      btn.color      = id === activeId ? '#FFFFFF'  : '#E0E8F0'
    })
  }
}
