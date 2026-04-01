/**
 * PartLabels.js — Etiquetas flutuantes 3D sobre cada peça
 * Usando Babylon.js GUI on-mesh textures + linhas de referência
 */

import * as BABYLON from '@babylonjs/core'
import * as GUI     from '@babylonjs/gui'
import { PUMP_PARTS_META } from '../core/PumpModel.js'

export class PartLabels {
  constructor(scene, pumpModel) {
    this.scene     = scene
    this.pumpModel = pumpModel
    this._labels   = {}   // { partKey: { plane, line } }
    this._visible  = false
  }

  init() {
    Object.entries(this.pumpModel.parts).forEach(([key, node]) => {
      this._createLabel(key, node)
    })
  }

  _createLabel(key, node) {
    const meta = PUMP_PARTS_META[key]
    if (!meta) return

    // Posição da etiqueta: levemente acima e afastada da peça
    const labelOffset = new BABYLON.Vector3(0, 0.25, 0)

    // Plano da etiqueta
    const plane = BABYLON.MeshBuilder.CreatePlane(`label_${key}`, {
      width: 0.28, height: 0.09,
    }, this.scene)
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL
    plane.isPickable    = false
    plane.setEnabled(false)

    // Texture com texto
    const tex  = GUI.AdvancedDynamicTexture.CreateForMesh(plane, 280, 90)
    const bg   = new GUI.Rectangle()
    bg.background   = '#0D1117DD'
    bg.cornerRadius = 10
    bg.thickness    = 1
    bg.color        = '#00979D'
    tex.addControl(bg)

    const stack = new GUI.StackPanel()
    stack.isVertical = true
    bg.addControl(stack)

    const nameText = new GUI.TextBlock()
    nameText.text      = meta.label
    nameText.color     = '#E0E8F0'
    nameText.fontSize  = 18
    nameText.height    = '34px'
    nameText.fontStyle = 'bold'
    stack.addControl(nameText)

    // Linha conectando etiqueta à peça
    const lineSystem = BABYLON.MeshBuilder.CreateLineSystem(`labelLine_${key}`, {
      lines: [[BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()]],
      updatable: true,
    }, this.scene)
    lineSystem.color      = new BABYLON.Color3(0, 0.6, 0.7)
    lineSystem.isPickable = false
    lineSystem.setEnabled(false)

    this._labels[key] = { plane, tex, lineSystem, nameText }

    // Atualizar posição a cada frame
    this.scene.registerBeforeRender(() => {
      if (!this._visible) return
      const partNode = this.pumpModel.parts[key]
      const partPos  = this._getNodeCenter(partNode)
      const labelPos = partPos.add(labelOffset)

      plane.position = labelPos

      // Atualizar linha
      BABYLON.MeshBuilder.CreateLineSystem(`labelLine_${key}`, {
        lines: [[partPos, labelPos.subtract(new BABYLON.Vector3(0, 0.04, 0))]],
        instance: lineSystem,
      })
    })
  }

  show() {
    this._visible = true
    Object.values(this._labels).forEach(({ plane, lineSystem }) => {
      plane.setEnabled(true)
      lineSystem.setEnabled(true)
    })
  }

  hide() {
    this._visible = false
    Object.values(this._labels).forEach(({ plane, lineSystem }) => {
      plane.setEnabled(false)
      lineSystem.setEnabled(false)
    })
  }

  toggle() {
    this._visible ? this.hide() : this.show()
    return this._visible
  }

  // Destacar etiqueta de uma peça específica
  highlight(key, active = true) {
    const label = this._labels[key]
    if (!label) return
    const bg = label.tex.getControlByName?.('') ?? label.tex.rootContainer?.children?.[0]
    if (bg) {
      bg.color     = active ? '#E8AB00' : '#00979D'
      bg.thickness = active ? 2 : 1
    }
    label.nameText.color = active ? '#E8AB00' : '#E0E8F0'
  }

  _getNodeCenter(node) {
    if (!node) return BABYLON.Vector3.Zero()
    if (node.getAbsolutePosition) return node.getAbsolutePosition().clone()
    if (node.position) return node.position.clone()
    return BABYLON.Vector3.Zero()
  }
}
