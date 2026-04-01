/**
 * AnimationController.js — Animações cinemáticas automáticas
 * Desmontagem e montagem com câmera dramatizada
 */

import * as BABYLON from '@babylonjs/core'
import { DISASSEMBLY_SEQUENCE } from '../assembly/AssemblyManager.js'

export class AnimationController {
  constructor(scene, pumpModel, sceneManager) {
    this.scene        = scene
    this.pumpModel    = pumpModel
    this.sceneManager = sceneManager
    this._isPlaying   = false
  }

  // ── Animação cinemática de desmontagem ──────────────────────────────────
  async playDisassemblyMovie(onStepCallback) {
    if (this._isPlaying) return
    this._isPlaying = true

    const seq = DISASSEMBLY_SEQUENCE
    const offsets = window._app?.assemblyManager
      ? this._getExplodeOffsets()
      : {}

    for (let i = 0; i < seq.length; i++) {
      const key    = seq[i]
      const node   = this.pumpModel.parts[key]
      if (!node) continue

      // Mover câmera para focar na peça
      await this._orbitCameraTo(node.position, 0.8, 600)

      // Destacar peça
      window._app?.interactionManager?.selectPart(key)

      // Animar saída da peça
      const origin = this.pumpModel.originPos[key]
      const offset = offsets[key] ?? new BABYLON.Vector3(0, 0.4, 0)
      const target = origin.add(offset)

      await this._animateTo(node, target, 700)
      onStepCallback?.(key, i, seq.length)

      await this._wait(300)
      window._app?.interactionManager?.deselectPart()
    }

    // Câmera gira ao redor ao fim
    await this._spinCamera(2000)
    this._isPlaying = false
  }

  // ── Animação cinemática de montagem ────────────────────────────────────
  async playAssemblyMovie(onStepCallback) {
    if (this._isPlaying) return
    this._isPlaying = true

    const seq = [...DISASSEMBLY_SEQUENCE].reverse()

    for (let i = 0; i < seq.length; i++) {
      const key  = seq[i]
      const node = this.pumpModel.parts[key]
      if (!node) continue

      await this._orbitCameraTo(node.position, 0.9, 500)
      window._app?.interactionManager?.selectPart(key)

      const target = this.pumpModel.originPos[key].clone()
      await this._animateTo(node, target, 600)
      window._app?.audioManager?.playSnap()
      window._app?.snapIndicators?.flashSnap(key)

      onStepCallback?.(key, i, seq.length)
      await this._wait(200)
      window._app?.interactionManager?.deselectPart()
    }

    window._app?.audioManager?.playComplete()
    await this._spinCamera(1500)
    this._isPlaying = false
  }

  // ── Animação de rotação de 360° da bomba montada ────────────────────────
  async playShowcase(durationMs = 4000) {
    const root      = this.pumpModel.rootMesh
    if (!root) return

    const startY    = root.rotation?.y ?? 0
    const startTime = performance.now()

    return new Promise(resolve => {
      const tick = () => {
        const t = (performance.now() - startTime) / durationMs
        if (t >= 1) {
          root.rotation.y = startY
          resolve()
          return
        }
        root.rotation.y = startY + t * Math.PI * 2
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
  }

  // ── Animação de rotor girando (funcionamento) ───────────────────────────
  startRotorSpin(rpm = 1450) {
    const rotorNode = this.pumpModel.parts['rotor']
    if (!rotorNode) return

    const radsPerSec = (rpm / 60) * Math.PI * 2

    this._rotorObserver = this.scene.registerBeforeRender(() => {
      const dt = this.scene.getEngine().getDeltaTime() / 1000
      // Rotor gira no eixo Z (eixo de transmissão)
      rotorNode.rotation.z = (rotorNode.rotation.z ?? 0) + radsPerSec * dt
    })
    console.log(`⚙️ Rotor girando a ${rpm} RPM`)
  }

  stopRotorSpin() {
    if (this._rotorObserver) {
      this.scene.unregisterBeforeRender(this._rotorObserver)
      this._rotorObserver = null
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  _animateTo(node, target, durationMs) {
    return new Promise(resolve => {
      const start   = node.position.clone()
      const startT  = performance.now()
      const tick = () => {
        const t = Math.min((performance.now() - startT) / durationMs, 1)
        const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2
        node.position = BABYLON.Vector3.Lerp(start, target, e)
        t < 1 ? requestAnimationFrame(tick) : (node.position = target, resolve())
      }
      requestAnimationFrame(tick)
    })
  }

  _orbitCameraTo(targetPos, radius, durationMs) {
    const cam  = this.sceneManager.camera
    if (!cam)  return this._wait(durationMs)

    const start = cam.target.clone()
    const startR = cam.radius
    const startT = performance.now()

    return new Promise(resolve => {
      const tick = () => {
        const t = Math.min((performance.now() - startT) / durationMs, 1)
        const e = t < 0.5 ? 2*t*t : -1+(4-2*t)*t
        cam.target = BABYLON.Vector3.Lerp(start, targetPos, e)
        cam.radius = startR + (radius - startR) * e
        t < 1 ? requestAnimationFrame(tick) : resolve()
      }
      requestAnimationFrame(tick)
    })
  }

  _spinCamera(durationMs) {
    const cam    = this.sceneManager.camera
    if (!cam)    return this._wait(durationMs)

    const startAlpha = cam.alpha
    const startT     = performance.now()

    return new Promise(resolve => {
      const tick = () => {
        const t = Math.min((performance.now() - startT) / durationMs, 1)
        cam.alpha = startAlpha + t * Math.PI * 2
        t < 1 ? requestAnimationFrame(tick) : resolve()
      }
      requestAnimationFrame(tick)
    })
  }

  _wait(ms) {
    return new Promise(r => setTimeout(r, ms))
  }

  _getExplodeOffsets() {
    // Importação dinâmica para evitar circular
    return {
      carcaca:         new BABYLON.Vector3( 0,     0,     0),
      tampa_frontal:   new BABYLON.Vector3( 0,     0,     0.55),
      rotor:           new BABYLON.Vector3( 0,     0,     0.35),
      eixo:            new BABYLON.Vector3( 0.45,  0,     0),
      rolamento_diant: new BABYLON.Vector3( 0,     0,     0.75),
      rolamento_tras:  new BABYLON.Vector3( 0,     0,    -0.75),
      gaxeta:          new BABYLON.Vector3( 0,     0,     0.60),
      tampa_traseira:  new BABYLON.Vector3( 0,     0,    -0.90),
      parafusos:       new BABYLON.Vector3( 0,     0.70,  0),
    }
  }
}
