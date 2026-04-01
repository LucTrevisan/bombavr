/**
 * XRayView.js — Vista de corte transversal da bomba (raio-X)
 * Usa clipping planes do Babylon.js para revelar o interior
 */

import * as BABYLON from '@babylonjs/core'

export class XRayView {
  constructor(scene, pumpModel) {
    this.scene     = scene
    this.pumpModel = pumpModel
    this._active   = false
    this._plane    = null
    this._cutMeshes = []
    this._slicePos = 0  // posição do corte (-1 a +1)
  }

  init() {
    // Plano de corte — cortará tudo à direita de X=0 por padrão
    this._plane = new BABYLON.Plane(1, 0, 0, 0)
  }

  enable() {
    if (this._active) return
    this._active = true

    // Aplicar clipping plane em todas as meshes da bomba
    const allMeshes = this._getAllMeshes()
    allMeshes.forEach(mesh => {
      mesh.onBeforeRenderObservable.add(() => {
        this.scene.clipPlane = this._plane
      })
      mesh.onAfterRenderObservable.add(() => {
        this.scene.clipPlane = null
      })
      this._cutMeshes.push(mesh)

      // Material de corte (mostrar interior)
      if (mesh.material) {
        mesh.material.backFaceCulling = false
        mesh.material.twoSidedLighting = true
      }
    })

    // UI slider para mover o corte
    this._buildSlider()
    console.log('🔬 Vista de corte ativada')
  }

  disable() {
    if (!this._active) return
    this._active = false

    this._cutMeshes.forEach(mesh => {
      mesh.onBeforeRenderObservable.clear()
      mesh.onAfterRenderObservable.clear()
      if (mesh.material) {
        mesh.material.backFaceCulling = true
        mesh.material.twoSidedLighting = false
      }
    })
    this._cutMeshes = []
    this.scene.clipPlane = null

    document.getElementById('xray-slider-wrap')?.remove()
    console.log('🔬 Vista de corte desativada')
  }

  toggle() {
    this._active ? this.disable() : this.enable()
    return this._active
  }

  setSlicePosition(val) {
    // val: -0.5 a +0.5 (posição do corte no eixo X)
    this._slicePos  = val
    this._plane.d   = -val
  }

  _buildSlider() {
    const wrap = document.createElement('div')
    wrap.id = 'xray-slider-wrap'
    wrap.style.cssText = `
      position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
      background:rgba(10,14,26,0.88);backdrop-filter:blur(12px);
      border:1px solid rgba(0,151,157,0.3);border-radius:40px;
      padding:10px 20px;display:flex;align-items:center;gap:12px;z-index:55;
    `
    wrap.innerHTML = `
      <span style="font-size:11px;color:#00979D;letter-spacing:1px">✂ CORTE</span>
      <input type="range" min="-50" max="50" value="0" id="xray-range"
        style="width:180px;accent-color:#00979D">
      <button id="xray-close" style="
        background:#1a2030;border:1px solid #00979D;color:#00979D;
        border-radius:20px;padding:4px 12px;font-size:11px;cursor:pointer
      ">✕</button>
    `
    document.body.appendChild(wrap)

    document.getElementById('xray-range').addEventListener('input', (e) => {
      this.setSlicePosition(e.target.value / 100)
    })
    document.getElementById('xray-close').addEventListener('click', () => {
      this.disable()
    })
  }

  _getAllMeshes() {
    const result = []
    Object.values(this.pumpModel.parts).forEach(node => {
      if (node instanceof BABYLON.AbstractMesh) result.push(node)
      if (node.getChildMeshes) result.push(...node.getChildMeshes(false))
    })
    return result
  }
}
