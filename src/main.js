/**
 * main.js — versão atualizada com ambiente 360°
 * Substitui o src/main.js original
 *
 * Adiciona Environment360 ao fluxo de inicialização
 */

import { SceneManager }        from './core/SceneManager.js'
import { XRManager }           from './core/XRManager.js'
import { PumpModel }           from './core/PumpModel.js'
import { AudioManager }        from './core/AudioManager.js'
import { AnimationController } from './core/AnimationController.js'
import { XRayView }            from './core/XRayView.js'
import { Environment360 }      from './core/Environment360.js'   // ← NOVO
import { InteractionManager }  from './interaction/InteractionManager.js'
import { SnapIndicators }      from './interaction/SnapIndicators.js'
import { AssemblyManager }     from './assembly/AssemblyManager.js'
import { VRUIManager }         from './ui/VRUIManager.js'
import { PartLabels }          from './ui/PartLabels.js'
import { ChallengeUI }         from './ui/ChallengeUI.js'
import { ModeController }      from './core/ModeController.js'
import { updateLoading }       from './utils/loading.js'

async function init() {
  const canvas = document.getElementById('renderCanvas')

  // ── 1. Cena ────────────────────────────────────────────────────────────────
  updateLoading(6, 'Criando cena 3D...')
  const sceneManager = new SceneManager(canvas)
  await sceneManager.init()

  // ── 2. Ambiente 360° ───────────────────────────────────────────────────────
  updateLoading(14, 'Carregando ambiente 360°...')
  const environment = new Environment360(sceneManager.scene)
  await environment.init('/assets/ambiente360.jpg')

  // ── 3. Áudio ───────────────────────────────────────────────────────────────
  updateLoading(20, 'Inicializando áudio...')
  const audioManager = new AudioManager()
  await audioManager.init()

  // ── 4. Modelo da bomba ─────────────────────────────────────────────────────
  updateLoading(32, 'Carregando modelo da bomba...')
  const pumpModel = new PumpModel(sceneManager.scene)
  await pumpModel.load()

  // ── 5. Montagem ────────────────────────────────────────────────────────────
  updateLoading(48, 'Configurando lógica de montagem...')
  const assemblyManager = new AssemblyManager(sceneManager.scene, pumpModel)
  assemblyManager.init()

  // ── 6. Interação ───────────────────────────────────────────────────────────
  updateLoading(58, 'Preparando interação...')
  const interactionManager = new InteractionManager(
    sceneManager.scene, pumpModel, assemblyManager
  )
  interactionManager.init()

  // ── 7. Indicadores de snap ─────────────────────────────────────────────────
  updateLoading(65, 'Criando indicadores de posição...')
  const snapIndicators = new SnapIndicators(sceneManager.scene, pumpModel)
  snapIndicators.init()

  sceneManager.scene.registerBeforeRender(() => {
    if (interactionManager.selectedPartKey) {
      snapIndicators.update(interactionManager.selectedPartKey)
    }
  })

  // ── 8. Etiquetas 3D ────────────────────────────────────────────────────────
  updateLoading(72, 'Criando etiquetas das peças...')
  const partLabels = new PartLabels(sceneManager.scene, pumpModel)
  partLabels.init()

  // ── 9. WebXR ───────────────────────────────────────────────────────────────
  updateLoading(80, 'Configurando WebXR...')
  const xrManager = new XRManager(
    sceneManager.scene, interactionManager, assemblyManager
  )
  await xrManager.init()

  // ── 10. UI VR ──────────────────────────────────────────────────────────────
  updateLoading(87, 'Construindo interface VR...')
  const vrUI = new VRUIManager(sceneManager.scene, assemblyManager)
  vrUI.init()

  // ── 11. Challenge UI ───────────────────────────────────────────────────────
  updateLoading(90, 'Preparando modo desafio...')
  const challengeUI = new ChallengeUI()

  // ── 12. Animações ──────────────────────────────────────────────────────────
  updateLoading(93, 'Preparando animações...')
  const animController = new AnimationController(
    sceneManager.scene, pumpModel, sceneManager
  )

  // ── 13. Raio-X ─────────────────────────────────────────────────────────────
  updateLoading(95, 'Preparando vista de corte...')
  const xrayView = new XRayView(sceneManager.scene, pumpModel)
  xrayView.init()

  // ── 14. Controlador de modos ───────────────────────────────────────────────
  updateLoading(97, 'Finalizando...')
  const modeController = new ModeController(
    assemblyManager, interactionManager, vrUI, pumpModel,
    challengeUI, animController, partLabels, xrayView,
    audioManager, snapIndicators
  )
  modeController.init()

  // ── Conectar áudio ao snap ─────────────────────────────────────────────────
  const origTrySnap = assemblyManager.trySnap.bind(assemblyManager)
  assemblyManager.trySnap = (key) => {
    const snapped = origTrySnap(key)
    if (snapped) {
      audioManager.playSnap()
      snapIndicators.flashSnap(key)
      if (assemblyManager.currentMode === 'desafio') challengeUI.addScore(10)
    } else if (assemblyManager.currentMode === 'desafio') {
      audioManager.playError()
      challengeUI.addError()
    }
    return snapped
  }

  const origSelect = interactionManager.selectPart.bind(interactionManager)
  interactionManager.selectPart = (key) => {
    audioManager.playSelect()
    origSelect(key)
  }

  // ── Loading done ───────────────────────────────────────────────────────────
  updateLoading(100, 'Pronto!')
  setTimeout(() => {
    const overlay = document.getElementById('loading-overlay')
    overlay.classList.add('hidden')
    setTimeout(() => overlay.remove(), 700)
  }, 400)

  // ── Expor globalmente ──────────────────────────────────────────────────────
  window._app = {
    sceneManager, environment, pumpModel, assemblyManager,
    interactionManager, xrManager, vrUI, modeController,
    audioManager, animController, snapIndicators,
    partLabels, challengeUI, xrayView,
  }

  console.log('✅ Simulador VR com ambiente 360° iniciado.')
}

init().catch(err => {
  console.error('Erro ao inicializar:', err)
  document.getElementById('loading-status').textContent = '❌ ' + err.message
})
