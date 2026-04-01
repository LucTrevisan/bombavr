/**
 * SnapIndicators.js — "Fantasmas" translúcidos que indicam onde cada peça deve ir
 * Aparecem quando a peça está sendo arrastada perto da posição correta
 */

import * as BABYLON from '@babylonjs/core'

const GHOST_NEAR_DIST  = 0.25  // começa a aparecer
const GHOST_SNAP_DIST  = 0.08  // snap zone (igual ao AssemblyManager)

export class SnapIndicators {
  constructor(scene, pumpModel) {
    this.scene     = scene
    this.pumpModel = pumpModel
    this._ghosts   = {}   // { partKey: TransformNode (clone translúcido) }
    this._rings    = {}   // { partKey: Mesh (anel de snap) }
  }

  init() {
    Object.entries(this.pumpModel.parts).forEach(([key, node]) => {
      this._createGhost(key, node)
      this._createSnapRing(key)
    })
  }

  _createGhost(key, sourceNode) {
    // Clonar geometria da peça
    const clones = []

    const processNode = (src) => {
      if (src instanceof BABYLON.AbstractMesh && src.getTotalVertices() > 0) {
        const clone = src.clone(`ghost_${key}_${src.name}`, null)
        clone.isPickable = false

        const mat = new BABYLON.StandardMaterial(`ghost_mat_${key}`, this.scene)
        mat.diffuseColor  = new BABYLON.Color3(0, 0.8, 1)
        mat.emissiveColor = new BABYLON.Color3(0, 0.3, 0.5)
        mat.alpha         = 0
        mat.wireframe     = false
        clone.material    = mat
        clone.visibility  = 0
        clones.push(clone)
      }
      if (src.getChildMeshes) {
        src.getChildMeshes(false).forEach(processNode)
      }
    }
    processNode(sourceNode)

    // Grupo raiz para posicionar
    const ghostRoot = new BABYLON.TransformNode(`ghostRoot_${key}`, this.scene)
    ghostRoot.position = this.pumpModel.originPos[key].clone()
    clones.forEach(c => { c.parent = ghostRoot })

    this._ghosts[key] = { root: ghostRoot, meshes: clones }
  }

  _createSnapRing(key) {
    const ring = BABYLON.MeshBuilder.CreateTorus(`snapRing_${key}`, {
      diameter:    0.18,
      thickness:   0.008,
      tessellation: 48,
    }, this.scene)
    ring.position   = this.pumpModel.originPos[key].clone()
    ring.isPickable = false
    ring.visibility = 0

    const mat = new BABYLON.StandardMaterial(`ringMat_${key}`, this.scene)
    mat.emissiveColor = new BABYLON.Color3(0, 1, 0.6)
    mat.disableLighting = true
    ring.material = mat

    // Animação de pulso
    const anim = new BABYLON.Animation(
      `pulse_${key}`, 'scaling', 30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    )
    anim.setKeys([
      { frame: 0,  value: new BABYLON.Vector3(1.0, 1.0, 1.0) },
      { frame: 15, value: new BABYLON.Vector3(1.3, 1.3, 1.3) },
      { frame: 30, value: new BABYLON.Vector3(1.0, 1.0, 1.0) },
    ])
    ring.animations = [anim]
    this.scene.beginAnimation(ring, 0, 30, true)

    this._rings[key] = ring
  }

  // Chamar a cada frame quando uma peça está sendo arrastada
  update(draggingKey) {
    Object.keys(this.pumpModel.parts).forEach(key => {
      const ghost = this._ghosts[key]
      const ring  = this._rings[key]
      if (!ghost || !ring) return

      if (key !== draggingKey) {
        // Esconder fantasmas de peças não selecionadas
        ghost.meshes.forEach(m => m.visibility = 0)
        ring.visibility = 0
        return
      }

      const partNode = this.pumpModel.parts[key]
      const origin   = this.pumpModel.originPos[key]
      const dist     = BABYLON.Vector3.Distance(partNode.position, origin)

      if (dist < GHOST_NEAR_DIST) {
        const t = 1 - (dist / GHOST_NEAR_DIST)
        const alpha = t * 0.35

        ghost.meshes.forEach(m => {
          m.visibility = alpha
          if (m.material) m.material.alpha = alpha
        })

        // Mudar cor do anel conforme proximidade
        const snapT    = 1 - Math.min(dist / GHOST_SNAP_DIST, 1)
        const snapColor = BABYLON.Color3.Lerp(
          new BABYLON.Color3(0, 0.8, 1),   // azul = longe
          new BABYLON.Color3(0, 1, 0.3),   // verde = perto
          snapT
        )
        if (ring.material) ring.material.emissiveColor = snapColor
        ring.visibility = Math.min(t * 2, 1)
      } else {
        ghost.meshes.forEach(m => m.visibility = 0)
        ring.visibility = 0
      }
    })
  }

  // Flash de sucesso quando a peça encaixa
  flashSnap(key) {
    const ring = this._rings[key]
    if (!ring) return

    ring.visibility = 1
    if (ring.material) ring.material.emissiveColor = new BABYLON.Color3(0.2, 1, 0.4)

    let count = 0
    const iv = setInterval(() => {
      ring.visibility = count % 2 === 0 ? 0.9 : 0
      count++
      if (count >= 8) {
        clearInterval(iv)
        ring.visibility = 0
      }
    }, 80)
  }

  hideAll() {
    Object.values(this._ghosts).forEach(g => g.meshes.forEach(m => m.visibility = 0))
    Object.values(this._rings).forEach(r => r.visibility = 0)
  }
}
