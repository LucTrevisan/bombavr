/**
 * Environment360.js — v4
 * Não bloqueia o loading se a foto falhar
 */

import * as BABYLON from '@babylonjs/core'

export class Environment360 {
  constructor(scene) {
    this.scene     = scene
    this._dome     = null
    this._isLoaded = false
  }

  // Nunca rejeita — sempre resolve, com ou sem foto
  async init(photoPath = '/assets/ambiente360.jpg') {
    try {
      await this._tryPhotoDome(photoPath)
    } catch (e) {
      console.warn('⚠️ Ambiente 360° falhou, usando fundo escuro:', e.message)
      this._buildFallbackSky()
    }
    this._isLoaded = true
    console.log('✅ Ambiente 360° inicializado')
  }

  _tryPhotoDome(photoPath) {
    return new Promise((resolve) => {
      // Timeout de segurança: se não carregar em 8s, continua sem a foto
      const timeout = setTimeout(() => {
        console.warn('⚠️ Timeout ao carregar foto 360°')
        this._buildFallbackSky()
        resolve()
      }, 8000)

      try {
        this._dome = new BABYLON.PhotoDome(
          'env360',
          photoPath,
          {
            resolution:       32,
            size:             600,
            useDirectMapping: false,
          },
          this.scene,
          // onLoad — sucesso
          () => {
            clearTimeout(timeout)
            if (this._dome?.mesh) {
              this._dome.mesh.isPickable = false
            }
            console.log('✅ Foto 360° carregada:', photoPath)
            resolve()
          }
        )
      } catch (e) {
        clearTimeout(timeout)
        console.warn('⚠️ PhotoDome erro:', e.message)
        this._buildFallbackSky()
        resolve()
      }
    })
  }

  _buildFallbackSky() {
    // Dispose dome se existir
    try { this._dome?.dispose() } catch {}
    this._dome = null

    const sky = BABYLON.MeshBuilder.CreateSphere('skyFallback',
      { diameter: 600, sideOrientation: BABYLON.Mesh.BACKSIDE }, this.scene)
    const mat = new BABYLON.StandardMaterial('skyFallbackMat', this.scene)
    mat.emissiveColor   = new BABYLON.Color3(0.04, 0.06, 0.10)
    mat.backFaceCulling = false
    mat.disableLighting = true
    sky.material   = mat
    sky.isPickable = false
  }

  setRotation(degrees) {
    if (this._dome?.mesh) {
      this._dome.mesh.rotation.y = (degrees * Math.PI) / 180
    }
  }

  setVisible(visible) {
    this._dome?.mesh?.setEnabled(visible)
  }

  dispose() {
    try { this._dome?.dispose() } catch {}
  }
}
