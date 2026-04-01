/**
 * InteractionManager.js — Seleção, highlight e arrastar peças
 * Funciona tanto em desktop (mouse) quanto em VR (hand tracking)
 */

import * as BABYLON from '@babylonjs/core'
import { PUMP_PARTS_META } from '../core/PumpModel.js'

export class InteractionManager {
  constructor(scene, pumpModel, assemblyManager) {
    this.scene           = scene
    this.pumpModel       = pumpModel
    this.assemblyManager = assemblyManager

    this.selectedPartKey   = null
    this.hoveredPartKey    = null
    this._highlightLayer   = null
    this._outlineLayer     = null
    this._dragPlane        = null
    this._isDragging       = false
    this._dragOffset       = null

    this._infoPanel = document.getElementById('info-panel')
    this._partName  = document.getElementById('part-name')
    this._partDesc  = document.getElementById('part-desc')
  }

  init() {
    // Guardar referência ao canvas para controle do cursor
    this._canvas = this.scene.getEngine().getRenderingCanvas()

    // ── Camadas de highlight ────────────────────────────────────────────────
    this._highlightLayer = new BABYLON.HighlightLayer('hl', this.scene)
    this._highlightLayer.innerGlow = false
    this._highlightLayer.outerGlow = true
    this._highlightLayer.blurHorizontalSize = 0.8
    this._highlightLayer.blurVerticalSize   = 0.8

    // ── Plano invisível para drag no desktop ────────────────────────────────
    this._dragPlane = BABYLON.MeshBuilder.CreatePlane('dragPlane',
      { size: 20 }, this.scene)
    this._dragPlane.isPickable = false
    this._dragPlane.isVisible  = false
    this._dragPlane.setEnabled(false)

    // ── Eventos de mouse/touch ──────────────────────────────────────────────
    this._setupDesktopEvents()
  }

  _setupDesktopEvents() {
    const scene  = this.scene
    const canvas = scene.getEngine().getRenderingCanvas()

    // Hover
    scene.onPointerObservable.add((info) => {
      if (info.type === BABYLON.PointerEventTypes.POINTERMOVE) {
        this._onPointerMove(info)
      }
    })

    // Click / Pointer Down
    scene.onPointerObservable.add((info) => {
      if (info.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        this._onPointerDown(info)
      }
    })

    // Pointer Up
    scene.onPointerObservable.add((info) => {
      if (info.type === BABYLON.PointerEventTypes.POINTERUP) {
        this._onPointerUp(info)
      }
    })
  }

  _onPointerMove(info) {
    if (this._isDragging && this.selectedPartKey) {
      // Mover peça no plano de arrasto
      const pick = this.scene.pick(
        this.scene.pointerX, this.scene.pointerY,
        m => m === this._dragPlane
      )
      if (pick.hit && pick.pickedPoint) {
        const partNode = this.pumpModel.parts[this.selectedPartKey]
        if (partNode) {
          partNode.position = pick.pickedPoint.subtract(this._dragOffset)
        }
      }
      return
    }

    // Hover highlight
    const pick = this.scene.pick(
      this.scene.pointerX, this.scene.pointerY,
      m => m.isPickable && m.metadata?.partKey
    )
    const key = pick.hit ? pick.pickedMesh?.metadata?.partKey : null
    if (key !== this.hoveredPartKey) {
      if (this.hoveredPartKey && this.hoveredPartKey !== this.selectedPartKey) {
        this._removeHighlight(this.hoveredPartKey)
      }
      this.hoveredPartKey = key
      if (key && key !== this.selectedPartKey) {
        this._addHighlight(key, new BABYLON.Color3(0.4, 0.8, 1.0))
        this._canvas.style.cursor = 'pointer'
      } else {
        this._canvas.style.cursor = 'default'
      }
    }
  }

  _onPointerDown(info) {
    const pick = this.scene.pick(
      this.scene.pointerX, this.scene.pointerY,
      m => m.isPickable && m.metadata?.partKey
    )

    if (pick.hit && pick.pickedMesh?.metadata?.partKey) {
      const key      = pick.pickedMesh.metadata.partKey
      const partNode = this.pumpModel.parts[key]

      this.selectPart(key)

      // Iniciar drag: orientar plano perpendicular à câmera
      const camForward = this.scene.activeCamera.getForwardRay().direction
      this._dragPlane.setEnabled(true)
      this._dragPlane.isPickable = true
      BABYLON.Quaternion.FromUnitVectorsToRef(
        BABYLON.Vector3.Forward(), camForward.negate(),
        this._dragPlane.rotationQuaternion ?? (this._dragPlane.rotationQuaternion = new BABYLON.Quaternion())
      )
      this._dragPlane.position  = pick.pickedPoint.clone()
      this._isDragging  = true
      this._dragOffset  = pick.pickedPoint.subtract(partNode.position)
    } else {
      // Clique no vazio: desselecionar
      this.deselectPart()
    }
  }

  _onPointerUp() {
    if (this._isDragging && this.selectedPartKey) {
      this.assemblyManager.trySnap(this.selectedPartKey)
    }
    this._isDragging = false
    this._dragPlane.setEnabled(false)
    this._dragPlane.isPickable = false
  }

  // ── API pública ─────────────────────────────────────────────────────────
  selectPart(key) {
    if (this.selectedPartKey && this.selectedPartKey !== key) {
      this._removeHighlight(this.selectedPartKey)
    }
    this.selectedPartKey = key
    this._addHighlight(key, new BABYLON.Color3(0, 1.0, 0.8))
    this._showPartInfo(key)
    console.log(`📌 Selecionado: ${key}`)
  }

  deselectPart() {
    if (this.selectedPartKey) {
      this._removeHighlight(this.selectedPartKey)
      this.selectedPartKey = null
    }
    this._hidePartInfo()
  }

  // ── Highlight helpers ────────────────────────────────────────────────────
  _addHighlight(key, color) {
    const meshes = this._getMeshesForKey(key)
    meshes.forEach(m => this._highlightLayer.addMesh(m, color))
  }

  _removeHighlight(key) {
    const meshes = this._getMeshesForKey(key)
    meshes.forEach(m => {
      try { this._highlightLayer.removeMesh(m) } catch {}
    })
  }

  _getMeshesForKey(key) {
    const node  = this.pumpModel.parts[key]
    if (!node) return []
    const children = node.getChildMeshes ? node.getChildMeshes(false) : []
    if (children.length > 0) return children
    if (node instanceof BABYLON.AbstractMesh) return [node]
    return []
  }

  // ── Info panel 2D ────────────────────────────────────────────────────────
  _showPartInfo(key) {
    const meta = PUMP_PARTS_META[key]
    if (!meta) return
    this._partName.textContent = meta.label
    this._partDesc.textContent = meta.desc
    this._infoPanel.classList.add('visible')
  }

  _hidePartInfo() {
    this._infoPanel.classList.remove('visible')
  }

  // ── Feedback visual: peça corretamente encaixada ─────────────────────────
  flashSuccess(key) {
    const meshes = this._getMeshesForKey(key)
    let count = 0
    const interval = setInterval(() => {
      if (count % 2 === 0) this._addHighlight(key, new BABYLON.Color3(0.2, 1, 0.4))
      else this._removeHighlight(key)
      count++
      if (count >= 6) {
        clearInterval(interval)
        this._removeHighlight(key)
      }
    }, 120)
  }

  // ── Feedback visual: peça na posição errada ──────────────────────────────
  flashError(key) {
    const meshes = this._getMeshesForKey(key)
    let count = 0
    const interval = setInterval(() => {
      if (count % 2 === 0) this._addHighlight(key, new BABYLON.Color3(1, 0.2, 0.2))
      else this._removeHighlight(key)
      count++
      if (count >= 4) {
        clearInterval(interval)
        this._removeHighlight(key)
      }
    }, 100)
  }
}
