/**
 * PumpModel.js — Carregamento da bomba centrífuga (SolidWorks → GLB)
 *
 * Mapeamento de nomes SolidWorks → chaves internas:
 *   "Pump Casin"        → carcaca
 *   "Coil type spiral"  → voluta_espiral
 *   "Pump impellar"     → rotor
 *   "shaft"             → eixo
 *   "House Bearing"     → mancal
 *   "bearing cover"     → tampa_mancal
 *   "din3760..."        → rolamento_diant
 *   "din_71412..."      → rolamento_tras
 *   "pump packing gland"→ gaxeta
 *   "pump packing set"  → conjunto_vedacao
 *   "seal chamber"      → camara_selo
 *   "wear ring"         → anel_desgaste
 *   "pump lantern ring" → anel_lanterna
 *   "pump protection"   → protecao
 *   "support"           → base
 *   "ac motor-1"        → motor
 *   "Pump Coupling"     → acoplamento
 *   "coupling part 2"   → acoplamento_p2
 *   "coupling pert 1"   → acoplamento_p1
 */

import * as BABYLON from '@babylonjs/core'
import '@babylonjs/loaders/glTF'

// ── Metadados de cada componente ─────────────────────────────────────────────
export const PUMP_PARTS_META = {
  // ── Corpo hidráulico ──────────────────────────────────────────────────────
  carcaca: {
    label: 'Carcaça (Pump Casing)',
    desc:  'Corpo principal da bomba. Voluta converte velocidade em pressão. Ferro fundido GG-25. Flanges PN16.',
    color: [0.15, 0.25, 0.50],
    group: 'hidraulico',
    interactive: true,
  },
  voluta_espiral: {
    label: 'Espiral / Coil Spiral',
    desc:  'Canal espiral interno que direciona o fluxo do rotor para a saída. Integrado à carcaça.',
    color: [0.10, 0.30, 0.55],
    group: 'hidraulico',
    interactive: true,
  },
  rotor: {
    label: 'Rotor / Impeller',
    desc:  'Peça rotativa central. Pás curvas transferem energia cinética ao fluido. Aço inox AISI 316. Balanceado dinamicamente.',
    color: [0.65, 0.52, 0.10],
    group: 'hidraulico',
    interactive: true,
  },
  anel_desgaste: {
    label: 'Anel de Desgaste (Wear Ring)',
    desc:  'Reduz recirculação interna entre rotor e carcaça. Peça de sacrifício — verificar folga a cada revisão.',
    color: [0.20, 0.22, 0.25],
    group: 'hidraulico',
    interactive: true,
  },

  // ── Eixo e transmissão ────────────────────────────────────────────────────
  eixo: {
    label: 'Eixo (Shaft)',
    desc:  'Transmite torque do motor ao rotor. Aço 1045 retificado. Ø35 mm. Comprimento ~400 mm.',
    color: [0.25, 0.55, 0.60],
    group: 'transmissao',
    interactive: true,
  },
  acoplamento: {
    label: 'Acoplamento (Pump Coupling)',
    desc:  'Acoplamento elástico de mandíbulas. Absorve vibrações e desalinhamentos entre eixo da bomba e motor.',
    color: [0.18, 0.18, 0.20],
    group: 'transmissao',
    interactive: true,
  },
  acoplamento_p1: {
    label: 'Acoplamento — Parte 1',
    desc:  'Metade do acoplamento lado bomba. Fixada ao eixo com chaveta e porca de trava.',
    color: [0.18, 0.18, 0.20],
    group: 'transmissao',
    interactive: true,
  },
  acoplamento_p2: {
    label: 'Acoplamento — Parte 2',
    desc:  'Metade do acoplamento lado motor. Elemento elastomérico vermelho no centro.',
    color: [0.60, 0.10, 0.10],
    group: 'transmissao',
    interactive: true,
  },

  // ── Mancal e rolamentos ───────────────────────────────────────────────────
  mancal: {
    label: 'Mancal (House Bearing)',
    desc:  'Carcaça de suporte dos rolamentos. Fundido em ferro cinzento. Lubrificação por banho de óleo.',
    color: [0.15, 0.25, 0.50],
    group: 'mancal',
    interactive: true,
  },
  tampa_mancal: {
    label: 'Tampa do Mancal (Bearing Cover)',
    desc:  'Fecha o mancal e retém lubrificante. Lábio de vedação em NBR. Verificar a cada 4000h.',
    color: [0.15, 0.22, 0.48],
    group: 'mancal',
    interactive: true,
  },
  rolamento_diant: {
    label: 'Rolamento Dianteiro (DIN 3760)',
    desc:  'Vedação de eixo DIN 3760-A 35×50×7 NBR. Lado do rotor. Suporta carga axial do fluido.',
    color: [0.22, 0.22, 0.25],
    group: 'mancal',
    interactive: true,
  },
  rolamento_tras: {
    label: 'Rolamento Traseiro (DIN 71412)',
    desc:  'Rolamento de esferas DIN 71412-A 1/4-28. Lado do acoplamento. Carga radial predominante.',
    color: [0.22, 0.22, 0.25],
    group: 'mancal',
    interactive: true,
  },

  // ── Sistema de vedação ────────────────────────────────────────────────────
  gaxeta: {
    label: 'Gaxeta (Packing Gland)',
    desc:  'Prensa-gaxeta que comprime o material de vedação contra o eixo. Ajuste fino do gotejamento.',
    color: [0.50, 0.50, 0.55],
    group: 'vedacao',
    interactive: true,
  },
  conjunto_vedacao: {
    label: 'Conjunto de Vedação (Packing Set)',
    desc:  'Anéis de gaxeta trançada em PTFE/grafite. Empilhados na caixa de gaxeta. Substituir a cada 2000h.',
    color: [0.60, 0.58, 0.20],
    group: 'vedacao',
    interactive: true,
  },
  camara_selo: {
    label: 'Câmara de Selo (Seal Chamber)',
    desc:  'Aloja o sistema de vedação e o anel lanterna. Permite injeção de líquido de barreira.',
    color: [0.20, 0.40, 0.55],
    group: 'vedacao',
    interactive: true,
  },
  anel_lanterna: {
    label: 'Anel Lanterna (Lantern Ring)',
    desc:  'Distribui o líquido de barreira ao redor do eixo dentro da câmara de vedação.',
    color: [0.55, 0.55, 0.58],
    group: 'vedacao',
    interactive: true,
  },

  // ── Proteção e estrutura ──────────────────────────────────────────────────
  protecao: {
    label: 'Proteção do Acoplamento (Pump Protection)',
    desc:  'Guarda de segurança NR-12 sobre o acoplamento. Remoção obrigatória antes da manutenção.',
    color: [0.15, 0.25, 0.50],
    group: 'estrutura',
    interactive: true,
  },
  base: {
    label: 'Base / Chassi (Support)',
    desc:  'Estrutura de aço soldada. Suporta bomba e motor alinhados. Furos para fixação no piso com chumbadores.',
    color: [0.12, 0.20, 0.45],
    group: 'estrutura',
    interactive: false,   // estática — não entra na sequência de desmontagem
  },
  motor: {
    label: 'Motor Elétrico CA (AC Motor)',
    desc:  'Motor trifásico 7,5 kW / 4 pólos / 1750 RPM. IP55. Classe de isolamento F. Alimentação 380V/60Hz.',
    color: [0.12, 0.30, 0.40],
    group: 'motor',
    interactive: true,
  },
}

// ── Mapa de nomes SolidWorks → chave interna ─────────────────────────────────
// Chave: fragmento do nome que vem no GLB (case-insensitive, parcial)
const SW_NAME_MAP = [
  { fragment: 'pump casin',        key: 'carcaca'          },
  { fragment: 'coil type spiral',  key: 'voluta_espiral'   },
  { fragment: 'pump impellar',     key: 'rotor'            },
  { fragment: 'pump impeller',     key: 'rotor'            }, // typo alternativo
  { fragment: 'shaft',             key: 'eixo'             },
  { fragment: 'house bearing',     key: 'mancal'           },
  { fragment: 'bearing cover',     key: 'tampa_mancal'     },
  { fragment: 'din3760',           key: 'rolamento_diant'  },
  { fragment: 'din_71412',         key: 'rolamento_tras'   },
  { fragment: 'din 71412',         key: 'rolamento_tras'   },
  { fragment: 'pump packing gland',key: 'gaxeta'           },
  { fragment: 'packing gland',     key: 'gaxeta'           },
  { fragment: 'pump packing set',  key: 'conjunto_vedacao' },
  { fragment: 'packing set',       key: 'conjunto_vedacao' },
  { fragment: 'seal chamber',      key: 'camara_selo'      },
  { fragment: 'wear ring',         key: 'anel_desgaste'    },
  { fragment: 'lantern ring',      key: 'anel_lanterna'    },
  { fragment: 'lentern ring',      key: 'anel_lanterna'    }, // typo do FreeCAD
  { fragment: 'pump lentern',      key: 'anel_lanterna'    }, // variante com primitive
  { fragment: 'pump protection',   key: 'protecao'         },
  { fragment: 'support',           key: 'base'             },
  { fragment: 'ac motor',          key: 'motor'            },
  { fragment: 'pump coupling',     key: 'acoplamento'      },
  { fragment: 'coupling part 2',   key: 'acoplamento_p2'   },
  { fragment: 'coupling pert 1',   key: 'acoplamento_p1'   },
  { fragment: 'coupling part 1',   key: 'acoplamento_p1'   },
]

export class PumpModel {
  constructor(scene) {
    this.scene     = scene
    this.rootMesh  = null
    this.parts     = {}    // { chave: BABYLON.Node }
    this.originPos = {}
    this.originRot = {}
    this.loaded    = false
    this._unmapped = []    // nomes que não bateram com SW_NAME_MAP (para debug)
  }

  async load() {
    const glbPath = '/assets/bomba.glb'
    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync('', glbPath, '', this.scene)
      this._parseGLBHierarchy(result.meshes)
      console.log('✅ GLB carregado. Peças mapeadas:', Object.keys(this.parts))
      if (this._unmapped.length) {
        console.warn('⚠️  Meshes não mapeadas (verifique SW_NAME_MAP):', this._unmapped)
      }
    } catch (e) {
      console.warn('⚠️  GLB não encontrado — modelo procedural ativo.\n', e.message)
      this._buildProceduralModel()
    }
    this._storeOriginTransforms()
    this._applyShadows()
    this.loaded = true
  }

  // ── Parser do GLB gerado pelo SolidWorks / FreeCAD ──────────────────────
  _parseGLBHierarchy(meshes) {
    // Primeiro mesh costuma ser o nó raiz vazio
    this.rootMesh = meshes[0]

    // Corrigir orientação: bomba horizontal
    // Ajuste fino via console: window._app.pumpModel.setRotation(x, y, z)
    if (this.rootMesh) {
      // SolidWorks/FreeCAD: eixo da bomba geralmente vem em Y
      // Rotacionar -90° em X coloca o eixo ao longo de Z (horizontal)
      this.rootMesh.rotation = new BABYLON.Vector3(-Math.PI / 2, 0, 0)
      this.rootMesh.position = new BABYLON.Vector3(0, 0, 0)
      this.rootMesh.scaling  = new BABYLON.Vector3(1, 1, 1)
    }

    meshes.forEach(mesh => {
      if (!mesh.name || mesh.name === '__root__') return

      // Remover sufixo _primitive0, _primitive1... gerado pelo FreeCAD
      // Ex: "pump lentern ring_primitive5" → "pump lentern ring"
      const cleanName = mesh.name.replace(/_primitive\d+$/i, '').trim()

      const key = this._matchSWName(cleanName) ?? this._matchSWName(mesh.name)

      if (key) {
        // Agrupar múltiplos meshes da mesma peça sob um TransformNode
        if (this.parts[key]) {
          if (!this.parts[key]._isGroup) {
            const group = new BABYLON.TransformNode(`group_${key}`, this.scene)
            group.position = this.parts[key].position.clone()
            this.parts[key].parent = group
            this.parts[key] = group
            group._isGroup = true
          }
          mesh.parent = this.parts[key]
        } else {
          this.parts[key] = mesh
        }
        mesh.metadata = { ...(mesh.metadata ?? {}), partKey: key }
      } else {
        this._unmapped.push(mesh.name)
      }
    })
  }

  // ── Corresponde nome do SolidWorks à chave interna ───────────────────────
  _matchSWName(rawName) {
    const lower = rawName.toLowerCase().trim()

    // 1. Tentar correspondência direta pelo mapa
    for (const { fragment, key } of SW_NAME_MAP) {
      if (lower.includes(fragment.toLowerCase())) return key
    }

    // 2. Tentar normalização simples (espaços → underscore, sem chars especiais)
    const normalized = lower.replace(/[\s-]/g, '_').replace(/[^a-z0-9_]/g, '')
    if (PUMP_PARTS_META[normalized]) return normalized

    return null
  }

  // ── Modelo procedural de demonstração ────────────────────────────────────
  // Representa visualmente a montagem da imagem enviada
  _buildProceduralModel() {
    this.rootMesh = new BABYLON.TransformNode('bomba_root', this.scene)
    this.rootMesh.position = new BABYLON.Vector3(0, -0.3, 0)

    const s = this.scene
    const r = this.rootMesh

    const pbr = (name, rgb, metallic = 0.85, roughness = 0.25) => {
      const m = new BABYLON.PBRMaterial(name, s)
      m.albedoColor = new BABYLON.Color3(...rgb)
      m.metallic    = metallic
      m.roughness   = roughness
      m.usePhysicalLightFalloff = false
      return m
    }

    const azul    = pbr('mat_azul',    [0.12, 0.22, 0.55])
    const azulEsc = pbr('mat_azulEsc', [0.08, 0.15, 0.42])
    const dourado  = pbr('mat_dourado', [0.65, 0.52, 0.10], 0.9, 0.15)
    const teal     = pbr('mat_teal',   [0.15, 0.55, 0.60])
    const preto    = pbr('mat_preto',  [0.12, 0.12, 0.14], 0.7, 0.5)
    const cinza    = pbr('mat_cinza',  [0.45, 0.45, 0.48], 0.8, 0.3)

    // ── Base / chassi ──────────────────────────────────────────────────────
    const base = BABYLON.MeshBuilder.CreateBox('base', { width: 1.4, height: 0.08, depth: 0.55 }, s)
    base.parent = r; base.position.y = -0.30; base.material = azulEsc
    this.parts.base = base

    // Pés da base
    for (const [x, z] of [[-0.6,0.22],[-0.6,-0.22],[0.6,0.22],[0.6,-0.22]]) {
      const p = BABYLON.MeshBuilder.CreateBox('pe', { width: 0.06, height: 0.06, depth: 0.06 }, s)
      p.parent = r; p.position.set(x, -0.36, z); p.material = azulEsc
    }

    // ── Carcaça principal ──────────────────────────────────────────────────
    const carcaca = BABYLON.MeshBuilder.CreateCylinder('carcaca',
      { diameter: 0.55, height: 0.30, tessellation: 48 }, s)
    carcaca.parent = r; carcaca.position.set(-0.35, 0.02, 0)
    carcaca.rotation.z = Math.PI / 2; carcaca.material = azul
    this.parts.carcaca = carcaca

    // Bocal sucção (flange esquerda)
    const flangeSucc = BABYLON.MeshBuilder.CreateCylinder('flange_succ',
      { diameter: 0.28, height: 0.06, tessellation: 32 }, s)
    flangeSucc.parent = r; flangeSucc.position.set(-0.67, 0.02, 0)
    flangeSucc.rotation.z = Math.PI / 2; flangeSucc.material = azul

    // Bocal recalque (saída superior)
    const flangeRec = BABYLON.MeshBuilder.CreateCylinder('flange_rec',
      { diameter: 0.14, height: 0.18, tessellation: 24 }, s)
    flangeRec.parent = r; flangeRec.position.set(-0.35, 0.28, 0); flangeRec.material = azul

    // ── Voluta espiral ─────────────────────────────────────────────────────
    const voluta = BABYLON.MeshBuilder.CreateTorus('voluta_espiral',
      { diameter: 0.40, thickness: 0.10, tessellation: 48 }, s)
    voluta.parent = r; voluta.position.set(-0.35, 0.02, 0)
    voluta.rotation.y = Math.PI / 2; voluta.material = pbr('mat_vol', [0.10, 0.28, 0.58])
    this.parts.voluta_espiral = voluta

    // ── Rotor / Impeller (dourado) ─────────────────────────────────────────
    const rotorNode = new BABYLON.TransformNode('rotor', s)
    rotorNode.parent = r; rotorNode.position.set(-0.35, 0.02, 0)

    const disco = BABYLON.MeshBuilder.CreateCylinder('rotor_disco',
      { diameter: 0.38, height: 0.12, tessellation: 48 }, s)
    disco.parent = rotorNode; disco.material = dourado

    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2
      const pa  = BABYLON.MeshBuilder.CreateBox('pa', { width: 0.035, height: 0.08, depth: 0.15 }, s)
      pa.parent = rotorNode
      pa.position.set(Math.cos(ang) * 0.14, 0, Math.sin(ang) * 0.14)
      pa.rotation.y = ang + 0.35; pa.material = dourado
    }
    this.parts.rotor = rotorNode

    // ── Eixo (teal longo) ──────────────────────────────────────────────────
    const eixo = BABYLON.MeshBuilder.CreateCylinder('eixo',
      { diameter: 0.045, height: 0.85, tessellation: 24 }, s)
    eixo.parent = r; eixo.position.set(0.08, 0.02, 0)
    eixo.rotation.z = Math.PI / 2; eixo.material = teal
    this.parts.eixo = eixo

    // ── Mancal (caixa azul central) ───────────────────────────────────────
    const mancal = BABYLON.MeshBuilder.CreateBox('mancal',
      { width: 0.22, height: 0.28, depth: 0.28 }, s)
    mancal.parent = r; mancal.position.set(0.15, 0.02, 0); mancal.material = azul
    this.parts.mancal = mancal

    // ── Tampa do mancal ───────────────────────────────────────────────────
    const tampMancal = BABYLON.MeshBuilder.CreateCylinder('tampa_mancal',
      { diameter: 0.22, height: 0.05, tessellation: 32 }, s)
    tampMancal.parent = r; tampMancal.position.set(0.28, 0.02, 0)
    tampMancal.rotation.z = Math.PI / 2; tampMancal.material = azul
    this.parts.tampa_mancal = tampMancal

    // ── Rolamentos DIN ────────────────────────────────────────────────────
    const mkRolamento = (name, x) => {
      const node = new BABYLON.TransformNode(name, s)
      node.parent = r; node.position.set(x, 0.02, 0)
      node.rotation.z = Math.PI / 2
      const outer = BABYLON.MeshBuilder.CreateTorus(`${name}_o`,
        { diameter: 0.14, thickness: 0.03, tessellation: 32 }, s)
      outer.parent = node; outer.material = preto
      const inner = BABYLON.MeshBuilder.CreateTorus(`${name}_i`,
        { diameter: 0.08, thickness: 0.025, tessellation: 32 }, s)
      inner.parent = node; inner.material = cinza
      return node
    }
    this.parts.rolamento_diant = mkRolamento('rolamento_diant', -0.08)
    this.parts.rolamento_tras  = mkRolamento('rolamento_tras',  0.25)

    // ── Sistema de vedação ────────────────────────────────────────────────
    const camaraS = BABYLON.MeshBuilder.CreateCylinder('camara_selo',
      { diameter: 0.16, height: 0.09, tessellation: 32 }, s)
    camaraS.parent = r; camaraS.position.set(-0.10, 0.02, 0)
    camaraS.rotation.z = Math.PI / 2; camaraS.material = pbr('mat_cs', [0.18, 0.38, 0.55])
    this.parts.camara_selo = camaraS

    const gaxeta = BABYLON.MeshBuilder.CreateTorus('gaxeta',
      { diameter: 0.10, thickness: 0.022, tessellation: 32 }, s)
    gaxeta.parent = r; gaxeta.position.set(-0.14, 0.02, 0)
    gaxeta.rotation.z = Math.PI / 2; gaxeta.material = cinza
    this.parts.gaxeta = gaxeta

    const conjVed = BABYLON.MeshBuilder.CreateTorus('conjunto_vedacao',
      { diameter: 0.12, thickness: 0.018, tessellation: 32 }, s)
    conjVed.parent = r; conjVed.position.set(-0.17, 0.02, 0)
    conjVed.rotation.z = Math.PI / 2; conjVed.material = pbr('mat_ptfe', [0.85, 0.85, 0.60], 0.1, 0.9)
    this.parts.conjunto_vedacao = conjVed

    const anelLant = BABYLON.MeshBuilder.CreateTorus('anel_lanterna',
      { diameter: 0.10, thickness: 0.015, tessellation: 32 }, s)
    anelLant.parent = r; anelLant.position.set(-0.20, 0.02, 0)
    anelLant.rotation.z = Math.PI / 2; anelLant.material = cinza
    this.parts.anel_lanterna = anelLant

    const anelDesg = BABYLON.MeshBuilder.CreateTorus('anel_desgaste',
      { diameter: 0.42, thickness: 0.015, tessellation: 48 }, s)
    anelDesg.parent = r; anelDesg.position.set(-0.35, 0.02, 0)
    anelDesg.rotation.z = Math.PI / 2; anelDesg.material = preto
    this.parts.anel_desgaste = anelDesg

    // ── Acoplamento (preto + vermelho) ────────────────────────────────────
    const acoplNode = new BABYLON.TransformNode('acoplamento', s)
    acoplNode.parent = r; acoplNode.position.set(0.42, 0.02, 0)
    acoplNode.rotation.z = Math.PI / 2

    const acopl1 = BABYLON.MeshBuilder.CreateCylinder('acopl_p1',
      { diameter: 0.14, height: 0.07, tessellation: 6 }, s)
    acopl1.parent = acoplNode; acopl1.position.z = -0.04; acopl1.material = preto

    const acopl2 = BABYLON.MeshBuilder.CreateCylinder('acopl_p2',
      { diameter: 0.14, height: 0.07, tessellation: 6 }, s)
    acopl2.parent = acoplNode; acopl2.position.z = 0.04
    acopl2.material = pbr('mat_acopl2', [0.55, 0.08, 0.08], 0.7, 0.5)

    this.parts.acoplamento  = acoplNode
    this.parts.acoplamento_p1 = acopl1
    this.parts.acoplamento_p2 = acopl2

    // ── Proteção do acoplamento ───────────────────────────────────────────
    const prot = BABYLON.MeshBuilder.CreateCylinder('protecao',
      { diameter: 0.20, height: 0.18, tessellation: 32 }, s)
    prot.parent = r; prot.position.set(0.42, 0.12, 0)
    prot.rotation.z = Math.PI / 2; prot.material = azulEsc
    this.parts.protecao = prot

    // ── Motor elétrico ────────────────────────────────────────────────────
    const motorNode = new BABYLON.TransformNode('motor', s)
    motorNode.parent = r; motorNode.position.set(0.68, 0.02, 0)

    const motorCorpo = BABYLON.MeshBuilder.CreateCylinder('motor_corpo',
      { diameter: 0.22, height: 0.35, tessellation: 32 }, s)
    motorCorpo.parent = motorNode; motorCorpo.rotation.z = Math.PI / 2
    motorCorpo.material = pbr('mat_motor', [0.10, 0.28, 0.38], 0.6, 0.45)

    const motorAleta = BABYLON.MeshBuilder.CreateBox('motor_caixa',
      { width: 0.12, height: 0.10, depth: 0.14 }, s)
    motorAleta.parent = motorNode; motorAleta.position.set(0, 0.14, 0)
    motorAleta.material = pbr('mat_motorc', [0.08, 0.22, 0.35], 0.6, 0.5)

    this.parts.motor = motorNode
  }

  _storeOriginTransforms() {
    Object.entries(this.parts).forEach(([key, mesh]) => {
      this.originPos[key] = mesh.position.clone()
      this.originRot[key] = mesh.rotation
        ? mesh.rotation.clone()
        : BABYLON.Vector3.Zero()
    })
  }

  _applyShadows() {
    const gen = this.scene._shadowGenerator
    if (!gen) return
    const addMesh = m => { try { gen.addShadowCaster(m, true) } catch {} }
    Object.values(this.parts).forEach(node => {
      if (node.getChildMeshes) node.getChildMeshes().forEach(addMesh)
      else addMesh(node)
    })
  }

  getAllSelectableMeshes() {
    const result = []
    Object.entries(this.parts).forEach(([key, node]) => {
      const meta = PUMP_PARTS_META[key]
      if (!meta?.interactive) return
      if (node.getChildMeshes) {
        const ch = node.getChildMeshes(false)
        if (ch.length > 0) {
          ch.forEach(m => { m.metadata = { ...(m.metadata ?? {}), partKey: key }; result.push(m) })
          return
        }
      }
      if (node instanceof BABYLON.AbstractMesh) {
        node.metadata = { ...(node.metadata ?? {}), partKey: key }
        result.push(node)
      }
    })
    return result
  }

  // Ajustar rotação em tempo real via console do navegador
  // Exemplo: window._app.pumpModel.setRotation(-90, 0, 0)
  setRotation(x, y, z) {
    if (!this.rootMesh) return
    this.rootMesh.rotation = new BABYLON.Vector3(
      (x * Math.PI) / 180,
      (y * Math.PI) / 180,
      (z * Math.PI) / 180
    )
    console.log(`🔄 Rotação: X=${x}° Y=${y}° Z=${z}°`)
  }

  // Ajustar escala (útil se o modelo vier muito grande ou pequeno)
  setScale(s) {
    if (!this.rootMesh) return
    this.rootMesh.scaling = new BABYLON.Vector3(s, s, s)
    console.log(`📐 Escala: ${s}`)
  }

  // Utilitário: imprime no console todos os nomes de mesh do GLB
  // Use window._app.pumpModel.debugMeshNames() após carregar
  debugMeshNames() {
    console.table(
      this.scene.meshes
        .filter(m => m.name && m.name !== '__root__')
        .map(m => ({ name: m.name, matched: this._matchSWName(m.name) ?? '❌ NÃO MAPEADO' }))
    )
  }
}
