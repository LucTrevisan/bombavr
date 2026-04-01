/**
 * SceneManager.js — versão atualizada com suporte a ambiente 360°
 * Substitui o SceneManager.js original em src/core/
 *
 * Mudanças em relação ao original:
 *   - Remove skybox procedural (substituído pela esfera 360°)
 *   - Ajusta iluminação para complementar a foto real
 *   - Mantém grade de chão para referência espacial no VR
 *   - Iluminação mais suave para combinar com ambiente real
 */

import * as BABYLON from '@babylonjs/core'

export class SceneManager {
  constructor(canvas) {
    this.canvas  = canvas
    this.engine  = null
    this.scene   = null
    this.camera  = null
    this.shadowGenerator = null
  }

  async init() {
    // ── Engine ──────────────────────────────────────────────────────────────
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil:      true,
      antialias:    true,
      xrCompatible: true,
    })

    // ── Cena ────────────────────────────────────────────────────────────────
    this.scene = new BABYLON.Scene(this.engine)
    // Fundo transparente — a esfera 360° cobre tudo
    this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)

    // ── Câmera Desktop (ArcRotate) ───────────────────────────────────────────
    this.camera = new BABYLON.ArcRotateCamera(
      'cam', -Math.PI / 2, Math.PI / 3, 3.5,
      BABYLON.Vector3.Zero(), this.scene
    )
    this.camera.lowerRadiusLimit = 0.5
    this.camera.upperRadiusLimit = 8
    this.camera.attachControl(this.canvas, true)
    this.camera.wheelPrecision   = 50

    // ── Iluminação complementar ──────────────────────────────────────────────
    // Mais suave que o original para combinar com foto real
    this._setupLighting()

    // ── Post-processing ──────────────────────────────────────────────────────
    this._setupPostProcessing()

    // ── Grade de chão VR ────────────────────────────────────────────────────
    this._buildGroundGrid()

    // ── Render Loop ──────────────────────────────────────────────────────────
    this.engine.runRenderLoop(() => this.scene.render())
    window.addEventListener('resize', () => this.engine.resize())
  }

  _setupLighting() {
    // Luz hemisférica suave (preenche sombras sem competir com a foto)
    const hemi = new BABYLON.HemisphericLight(
      'hemi', new BABYLON.Vector3(0, 1, 0), this.scene
    )
    hemi.intensity   = 0.5   // reduzido — a foto já ilumina o ambiente
    hemi.groundColor = new BABYLON.Color3(0.1, 0.08, 0.06)
    hemi.diffuse     = new BABYLON.Color3(0.9, 0.88, 0.82)

    // Luz direcional principal
    const dir = new BABYLON.DirectionalLight(
      'dir', new BABYLON.Vector3(-1, -2, -1), this.scene
    )
    dir.intensity = 0.7
    dir.diffuse   = new BABYLON.Color3(1, 0.95, 0.85)
    dir.position  = new BABYLON.Vector3(5, 10, 5)

    // Sombras
    this.shadowGenerator = new BABYLON.ShadowGenerator(1024, dir)
    this.shadowGenerator.useBlurExponentialShadowMap = true
    this.shadowGenerator.blurKernel = 16
    // Expor para outros módulos usarem
    this.scene._shadowGenerator = this.shadowGenerator

    // Luz de preenchimento lateral
    const fill = new BABYLON.PointLight(
      'fill', new BABYLON.Vector3(2, 1, -2), this.scene
    )
    fill.intensity = 0.25
    fill.diffuse   = new BABYLON.Color3(0.4, 0.55, 0.8)
  }

  _setupPostProcessing() {
    const pipeline = new BABYLON.DefaultRenderingPipeline(
      'pipeline', true, this.scene, [this.camera]
    )
    // Bloom leve para efeito metálico
    pipeline.bloomEnabled   = true
    pipeline.bloomThreshold = 0.8
    pipeline.bloomWeight    = 0.2
    pipeline.bloomKernel    = 32

    // Processamento de imagem
    pipeline.imageProcessingEnabled = true
    pipeline.imageProcessing.contrast              = 1.05
    pipeline.imageProcessing.exposure              = 1.0
    pipeline.imageProcessing.vignetteEnabled       = true
    pipeline.imageProcessing.vignetteWeight        = 1.5
    pipeline.imageProcessing.toneMappingEnabled    = true
    pipeline.imageProcessing.toneMappingType       =
      BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES

    this.pipeline = pipeline
  }

  _buildGroundGrid() {
    // Grade sutil de referência espacial para VR
    const gridLines = []
    for (let i = -6; i <= 6; i++) {
      gridLines.push([
        new BABYLON.Vector3(i * 0.5, -0.70, -3),
        new BABYLON.Vector3(i * 0.5, -0.70,  3),
      ])
      gridLines.push([
        new BABYLON.Vector3(-3, -0.70, i * 0.5),
        new BABYLON.Vector3( 3, -0.70, i * 0.5),
      ])
    }
    const grid = BABYLON.MeshBuilder.CreateLineSystem(
      'grid', { lines: gridLines }, this.scene
    )
    grid.color      = new BABYLON.Color3(0.3, 0.35, 0.4)
    grid.alpha      = 0.25
    grid.isPickable = false
  }
}
