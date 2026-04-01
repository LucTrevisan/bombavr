/**
 * XRManager.js — Configuração WebXR com Hand Tracking
 * Compatível com Meta Quest Pro (navegador Meta Browser)
 */

import * as BABYLON from '@babylonjs/core'

export class XRManager {
  constructor(scene, interactionManager, assemblyManager) {
    this.scene              = scene
    this.interactionManager = interactionManager
    this.assemblyManager    = assemblyManager
    this.xrHelper           = null
    this.handTracking       = null
    this.isInXR             = false
  }

  async init() {
    // Verifica suporte a WebXR
    const supported = await BABYLON.WebXRSessionManager.IsSessionSupportedAsync('immersive-vr')
    if (!supported) {
      console.warn('⚠️ WebXR imersivo não suportado neste navegador.')
      this._showDesktopWarning()
      return
    }

    try {
      // ── Criar experiência XR padrão ────────────────────────────────────
      this.xrHelper = await this.scene.createDefaultXRExperienceAsync({
        floorMeshes: [], // sem teleporte por padrão
        uiOptions: {
          sessionMode: 'immersive-vr',
          referenceSpaceType: 'local-floor',
        },
        optionalFeatures: true,
      })

      // ── Configurar câmera VR ────────────────────────────────────────────
      const xrCam = this.xrHelper.baseExperience.camera
      xrCam.position = new BABYLON.Vector3(0, 1.6, -1.2) // altura média de pé
      xrCam.setTarget(BABYLON.Vector3.Zero())

      // ── Ativar Hand Tracking ────────────────────────────────────────────
      const featManager = this.xrHelper.baseExperience.featuresManager
      try {
        this.handTracking = featManager.enableFeature(
          BABYLON.WebXRFeatureName.HAND_TRACKING, 'latest', {
            xrInput: this.xrHelper.input,
            jointMeshes: {
              enablePhysics: false,
              // Mostrar malhas articulares semi-transparentes
              riggedMeshConfig: {
                jointMeshFactory: (id) => {
                  const s = BABYLON.MeshBuilder.CreateSphere(`joint_${id}`, { diameter: 0.012 }, this.scene)
                  const mat = new BABYLON.StandardMaterial(`jmat_${id}`, this.scene)
                  mat.diffuseColor = new BABYLON.Color3(0.4, 0.8, 1)
                  mat.alpha = 0.5
                  s.material = mat
                  return s
                },
              },
            },
          }
        )
        console.log('✅ Hand Tracking ativado')
        this._setupHandInteraction()
      } catch (htErr) {
        console.warn('Hand Tracking não disponível, usando controladores físicos:', htErr)
        this._setupControllerInteraction()
      }

      // ── Eventos de sessão XR ───────────────────────────────────────────
      this.xrHelper.baseExperience.onStateChangedObservable.add((state) => {
        this.isInXR = (state === BABYLON.WebXRState.IN_XR)
        console.log('XR State:', state)
      })

      // ── Botão de entrada XR no HUD ─────────────────────────────────────
      this._positionXRButton()

      console.log('✅ WebXR inicializado com sucesso')
    } catch (err) {
      console.error('Erro ao inicializar WebXR:', err)
    }
  }

  // ── Hand Tracking: pinch para selecionar/mover peças ────────────────────
  _setupHandInteraction() {
    const hands = [
      this.xrHelper.input.getControllerByInputSource('left',  'hand'),
      this.xrHelper.input.getControllerByInputSource('right', 'hand'),
    ].filter(Boolean)

    // Observar adição de mãos dinamicamente
    this.xrHelper.input.onControllerAddedObservable.add((ctrl) => {
      if (ctrl.inputSource.hand) {
        this._attachHandBehavior(ctrl)
      }
    })
  }

  _attachHandBehavior(controller) {
    const handedness = controller.inputSource.handedness // 'left' | 'right'
    let pinchActive  = false
    let grabbedPartKey = null
    let grabOffset   = null

    // Pinch threshold (distância polegar-indicador em metros)
    const PINCH_THRESHOLD  = 0.025
    const PINCH_RELEASE    = 0.045

    this.scene.registerBeforeRender(() => {
      if (!controller.inputSource.hand) return

      const hand = controller.inputSource.hand
      const thumb = hand.get('thumb-tip')
      const index = hand.get('index-finger-tip')
      if (!thumb || !index) return

      // Obter posições das juntas
      const tPos = this._getJointWorldPos(thumb)
      const iPos = this._getJointWorldPos(index)
      if (!tPos || !iPos) return

      const pinchDist = BABYLON.Vector3.Distance(tPos, iPos)
      const pinchCenter = BABYLON.Vector3.Lerp(tPos, iPos, 0.5)

      if (!pinchActive && pinchDist < PINCH_THRESHOLD) {
        // ── Início do pinch: tentar pegar peça ──────────────────────────
        pinchActive = true
        const hit   = this._raycastNear(pinchCenter, 0.08)
        if (hit) {
          grabbedPartKey = hit.metadata?.partKey
          if (grabbedPartKey) {
            const partNode = this._getPartNode(grabbedPartKey)
            grabOffset     = pinchCenter.subtract(partNode.position)
            this.interactionManager.selectPart(grabbedPartKey)
            console.log(`✋ Pinch: pegou [${grabbedPartKey}]`)
          }
        }
      } else if (pinchActive && pinnchDist > PINCH_RELEASE) {
        // ── Fim do pinch: soltar peça ────────────────────────────────────
        pinchActive = false
        if (grabbedPartKey) {
          this.assemblyManager.trySnap(grabbedPartKey)
          this.interactionManager.deselectPart()
          grabbedPartKey = null
          grabOffset     = null
        }
      }

      // ── Mover peça agarrada ─────────────────────────────────────────────
      if (pinchActive && grabbedPartKey && grabOffset) {
        const partNode = this._getPartNode(grabbedPartKey)
        if (partNode) {
          partNode.position = pinchCenter.subtract(grabOffset)
        }
      }
    })
  }

  _setupControllerInteraction() {
    this.xrHelper.input.onControllerAddedObservable.add((ctrl) => {
      ctrl.onMotionControllerInitObservable.add((mc) => {
        // Gatilho para selecionar
        const trigger = mc.getComponent('xr-standard-trigger')
        if (trigger) {
          trigger.onButtonStateChangedObservable.add((comp) => {
            if (comp.pressed) {
              // Ray casting a partir do controlador
              const ray  = ctrl.getWorldPointerRayToRef(new BABYLON.Ray())
              const pick = this.scene.pickWithRay(ray)
              if (pick.hit && pick.pickedMesh?.metadata?.partKey) {
                this.interactionManager.selectPart(pick.pickedMesh.metadata.partKey)
              }
            } else {
              const key = this.interactionManager.selectedPartKey
              if (key) this.assemblyManager.trySnap(key)
              this.interactionManager.deselectPart()
            }
          })
        }
      })
    })
  }

  _getJointWorldPos(joint) {
    try {
      const pose = this.xrHelper.baseExperience.sessionManager.currentFrame
        ?.getJointPose?.(joint, this.xrHelper.baseExperience.sessionManager.referenceSpace)
      if (!pose) return null
      const p = pose.transform.position
      return new BABYLON.Vector3(p.x, p.y, p.z)
    } catch { return null }
  }

  _raycastNear(center, radius) {
    const meshes = this.scene.meshes.filter(m => m.metadata?.partKey && m.isPickable)
    for (const m of meshes) {
      if (BABYLON.Vector3.Distance(center, m.getAbsolutePosition()) < radius) return m
    }
    return null
  }

  _getPartNode(key) {
    return window._app?.pumpModel?.parts?.[key] ?? null
  }

  _showDesktopWarning() {
    const div = document.createElement('div')
    div.style.cssText = `
      position:fixed; top:16px; left:50%; transform:translateX(-50%);
      background:rgba(232,171,0,0.15); border:1px solid #e8ab00;
      color:#e8ab00; padding:10px 20px; border-radius:8px;
      font-size:12px; letter-spacing:0.5px; z-index:200;
    `
    div.textContent = '⚠️  WebXR não disponível — modo desktop ativo. Use o Meta Browser no Quest.'
    document.body.appendChild(div)
  }

  _positionXRButton() {
    // O Babylon.js cria automaticamente o botão — ajustamos o estilo
    setTimeout(() => {
      const btn = document.querySelector('#babylonVRiconbtn, canvas ~ *')
      if (btn) {
        const container = document.getElementById('xr-button-container')
        if (container && btn.parentNode !== container) {
          container.appendChild(btn)
        }
      }
    }, 800)
  }
}
