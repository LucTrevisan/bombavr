# 🔧 Simulador VR — Bomba Centrífuga
### Babylon.js + WebXR · Meta Quest Pro

---

## 📁 Estrutura do Projeto

```
vr-bomba/
├── index.html                    # Entrada HTML + overlay + HUD
├── package.json
├── vite.config.js                # Build + headers CORS para WebXR
├── public/
│   └── assets/
│       └── bomba.glb             # ← COLOQUE SEU MODELO AQUI
└── src/
    ├── main.js                   # Orquestrador principal
    ├── core/
    │   ├── SceneManager.js       # Engine, câmera, luzes, ambiente
    │   ├── XRManager.js          # WebXR, Hand Tracking, controladores
    │   ├── PumpModel.js          # Carregamento GLB + modelo procedural
    │   └── ModeController.js     # Controle de modos via HUD HTML
    ├── interaction/
    │   └── InteractionManager.js # Seleção, highlight, drag (mouse/XR)
    ├── assembly/
    │   └── AssemblyManager.js    # Explosão, snap, sequência de montagem
    ├── ui/
    │   └── VRUIManager.js        # Painéis 3D GUI dentro do VR
    └── utils/
        └── loading.js            # Utilitário da barra de progresso
```

---

## 🚀 Instalação e Execução

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar servidor de desenvolvimento
```bash
npm run dev
```

### 3. Tunel HTTPS com ngrok (obrigatório para WebXR no Quest)
```bash
ngrok http 5173
```
> Copie a URL `https://xxxx.ngrok.io` e acesse no **Meta Browser** do Quest.

---

## 🤖 Configurando o Modelo 3D (Autodesk Inventor → Babylon.js)

### Passo 1 — Exportar do Inventor
1. Abra o assembly (`.iam`) no Autodesk Inventor
2. Salve uma cópia como **STEP** (`.stp`) ou **OBJ**
   - *File → Export → CAD Format → STEP*

### Passo 2 — Converter no Blender
1. Abra o Blender
2. *File → Import → STEP / FBX / OBJ*
3. Organize a hierarquia:
   - Renomeie cada objeto com os nomes exatos:
     `carcaca`, `tampa_frontal`, `rotor`, `eixo`,
     `rolamento_diant`, `rolamento_tras`, `gaxeta`,
     `tampa_traseira`, `parafusos`
4. Exporte: *File → Export → glTF 2.0 (.glb)*
   - ✅ Include: Selected Objects, Apply Modifiers
   - ✅ Format: glTF Binary (.glb)
   - ✅ Geometry: UVs, Normals, Vertex Colors

### Passo 3 — Colocar no projeto
```bash
cp bomba.glb vr-bomba/public/assets/bomba.glb
```

> **Sem o GLB?** A aplicação usa um modelo procedural automático de demonstração.

---

## 🎮 Modos de Operação

| Modo | Descrição |
|------|-----------|
| **👁 Visualizar** | Rotacionar e explorar a bomba montada |
| **🔧 Desmontar** | Peças se separam em vista explodida; arraste-as |
| **📋 Guiada** | Montagem passo a passo com indicações |
| **🏆 Desafio** | Monte livremente — sistema verifica ordem e snap |

---

## ✋ Interação no Meta Quest Pro

### Hand Tracking (recomendado)
- **Pinch** (polegar + indicador) sobre uma peça → segura
- **Soltar** pinch → tenta snap automático
- Pinch em botão da UI → ativa modo

### Controladores (fallback)
- **Gatilho** sobre uma peça → seleciona e arrasta
- **Soltar gatilho** → tenta snap

### Desktop (desenvolvimento)
- **Click** → seleciona peça
- **Arrastar** → move peça no plano da câmera
- **Soltar** → tenta snap automático

---

## 🏗️ Arquitetura — Fluxo Principal

```
main.js
  ├── SceneManager    → engine + cena + câmera + iluminação
  ├── PumpModel       → carrega GLB ou gera modelo procedural
  ├── AssemblyManager → explode / snap / sequências de montagem
  ├── InteractionManager → pointer events + highlight + drag
  ├── XRManager       → WebXR session + hand tracking
  ├── VRUIManager     → painéis GUI 3D no espaço virtual
  └── ModeController  → sincroniza HUD HTML ↔ estado da app
```

---

## 🔌 Configuração Meta Quest Pro

1. **Ativar Modo Desenvolvedor** no app Meta Horizon (celular)
2. **Conectar ADB** via USB ou Wi-Fi
3. No headset: *Settings → Developer → USB Debugging: On*
4. Abrir **Meta Browser** → navegar para a URL ngrok
5. Tocar **"Enter VR"** → experiência imersiva

---

## 📦 Build para Produção

```bash
npm run build
# Arquivos em /dist — hospedar com HTTPS obrigatório
```

---

## 🔮 Próximas Evoluções

- [ ] Física real de colisão entre peças (ammo.js)
- [ ] Audio 3D: sons de encaixe, torque de parafusos
- [ ] Labels flutuantes nas peças (setas de anotação)
- [ ] Exportar relatório de montagem em PDF
- [ ] Modo multiplayer (dois usuários montando juntos)
- [ ] Raio-X: ver interior da bomba com corte transversal
- [ ] Animação de funcionamento (rotor girando + fluido)

---

## 🛠️ Dependências

| Pacote | Versão | Uso |
|--------|--------|-----|
| `@babylonjs/core` | ^7 | Engine 3D principal |
| `@babylonjs/loaders` | ^7 | Importar GLB/GLTF |
| `@babylonjs/gui` | ^7 | UI 3D no espaço VR |
| `@babylonjs/materials` | ^7 | PBR e materiais avançados |
| `vite` | ^5 | Build + hot reload |
