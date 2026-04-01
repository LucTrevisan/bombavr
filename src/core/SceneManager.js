/**
 * SceneManager.js — Gerencia a cena Babylon.js
 * Câmera, luzes, ambiente e render loop
 */

import * as BABYLON from '@babylonjs/core'

export class SceneManager {
  constructor(canvas) {
    this.canvas  = canvas
    this.engine  = null
    this.scene   = null
    this.camera  = null
  }

  async init() {
    // ── Engine ──────────────────────────────────────────────────────────────
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
      xrCompatible: true,   // ← obrigatório para WebXR
    })

    // ── Cena ────────────────────────────────────────────────────────────────
    this.scene = new BABYLON.Scene(this.engine)
    this.scene.clearColor = new BABYLON.Color4(0.04, 0.06, 0.10, 1)

    // Habilitar fog leve para profundidade
    this.scene.fogMode    = BABYLON.Scene.FOGMODE_LINEAR
    this.scene.fogColor   = new BABYLON.Color3(0.04, 0.06, 0.10)
    this.scene.fogStart   = 15
    this.scene.fogEnd     = 40

    // ── Câmera Desktop (ArcRotate) ───────────────────────────────────────
    this.camera = new BABYLON.ArcRotateCamera(
      'cam', -Math.PI / 2, Math.PI / 3, 3.5,
      BABYLON.Vector3.Zero(), this.scene
    )
    this.camera.lowerRadiusLimit = 0.5
    this.camera.upperRadiusLimit = 8
    this.camera.attachControl(this.canvas, true)
    this.camera.wheelPrecision   = 50

    // ── Iluminação ──────────────────────────────────────────────────────────
    this._setupLighting()

    // ── Post-processing ─────────────────────────────────────────────────────
    this._setupPostProcessing()

    // ── Ambiente de chão ────────────────────────────────────────────────────
    this._buildEnvironment()

    // ── Render Loop ─────────────────────────────────────────────────────────
    this.engine.runRenderLoop(() => this.scene.render())
    window.addEventListener('resize', () => this.engine.resize())
  }

  _setupLighting() {
    // Luz ambiente hemisférica
    const hemi = new BABYLON.HemisphericLight(
      'hemi', new BABYLON.Vector3(0, 1, 0), this.scene
    )
    hemi.intensity   = 0.4
    hemi.groundColor = new BABYLON.Color3(0.05, 0.08, 0.12)
    hemi.diffuse     = new BABYLON.Color3(0.6, 0.75, 0.9)

    // Luz direcional principal (simula luz industrial)
    const dir = new BABYLON.DirectionalLight(
      'dir', new BABYLON.Vector3(-1, -2, -1), this.scene
    )
    dir.intensity = 0.9
    dir.diffuse   = new BABYLON.Color3(1, 0.95, 0.85)

    // Sombras
    const shadowGen = new BABYLON.ShadowGenerator(1024, dir)
    shadowGen.useBlurExponentialShadowMap = true
    shadowGen.blurKernel = 16
    this.shadowGenerator = shadowGen

    // Luz de preenchimento azul (rim light)
    const rim = new BABYLON.PointLight(
      'rim', new BABYLON.Vector3(2, 1, -2), this.scene
    )
    rim.intensity = 0.3
    rim.diffuse   = new BABYLON.Color3(0.3, 0.6, 1.0)
  }

  _setupPostProcessing() {
    // Pipeline de rendering (SSA0, glow, etc.)
    const pipeline = new BABYLON.DefaultRenderingPipeline(
      'pipeline', true, this.scene, [this.camera]
    )
    pipeline.bloomEnabled    = true
    pipeline.bloomThreshold  = 0.7
    pipeline.bloomWeight     = 0.3
    pipeline.bloomKernel     = 64
    pipeline.bloomScale      = 0.5
    pipeline.imageProcessingEnabled = true
    pipeline.imageProcessing.contrast   = 1.1
    pipeline.imageProcessing.exposure   = 1.0
    pipeline.imageProcessing.vignetteEnabled = true
    pipeline.imageProcessing.vignetteWeight  = 2.5
    this.pipeline = pipeline
  }

  _buildEnvironment() {
    // Plataforma / mesa de trabalho
    const ground = BABYLON.MeshBuilder.CreateCylinder(
      'ground', { diameter: 3, height: 0.04, tessellation: 64 }, this.scene
    )
    ground.position.y = -0.7
    ground.receiveShadows = true

    const mat = new BABYLON.StandardMaterial('groundMat', this.scene)
    mat.diffuseColor  = new BABYLON.Color3(0.08, 0.10, 0.14)
    mat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.4)
    mat.specularPower = 64
    ground.material   = mat

    // Grade de linhas no chão (referência espacial para VR)
    const gridLines = []
    for (let i = -5; i <= 5; i++) {
      gridLines.push([
        new BABYLON.Vector3(i * 0.5, -0.68, -2.5),
        new BABYLON.Vector3(i * 0.5, -0.68,  2.5),
      ])
      gridLines.push([
        new BABYLON.Vector3(-2.5, -0.68, i * 0.5),
        new BABYLON.Vector3( 2.5, -0.68, i * 0.5),
      ])
    }
    const grid = BABYLON.MeshBuilder.CreateLineSystem('grid', { lines: gridLines }, this.scene)
    grid.color   = new BABYLON.Color3(0.1, 0.2, 0.3)
    grid.alpha   = 0.4
    grid.isPickable = false
  }
}
