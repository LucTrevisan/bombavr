/**
 * loading.js — Atualiza a barra de progresso do overlay de carregamento
 */

export function updateLoading(percent, status) {
  const bar = document.getElementById('loading-bar')
  const txt = document.getElementById('loading-status')
  if (bar) bar.style.width = `${percent}%`
  if (txt) txt.textContent = status
}
