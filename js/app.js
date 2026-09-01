import { state } from './state.js';
import { gateway } from './gateway-client.js';
import { ui } from './ui.js';
import { AGENTS } from './agents.js';

/**
 * Point d'entrée principal de l'application cliente Hermès Core
 */
class HermesApp {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    // 1. Initialiser le gestionnaire d'interface
    ui.init();

    // 2. Initialiser le client de passerelle temps réel
    await gateway.init();

    // 3. Enregistrer le Service Worker (PWA)
    this.registerServiceWorker();

    // 4. Exposer l'API globale pour les contrôles HTML
    window.hermesApp = {
      switchAgent: (id) => this.switchAgent(id),
      sendQuickPrompt: (prompt) => this.sendQuickPrompt(prompt),
      clearCurrentHistory: () => this.clearCurrentHistory(),
      openSkillsModal: () => this.openSkillsModal(),
      closeSkillsModal: () => this.closeSkillsModal(),
      openOlympeModal: () => this.openOlympeModal(),
      closeOlympeModal: () => this.closeOlympeModal(),
      openSettingsModal: () => this.openSettingsModal(),
      closeSettingsModal: () => this.closeSettingsModal(),
      toggleThinking: () => state.toggleThinkingVisibility()
    };

    this.isInitialized = true;
    console.log('🚀 Hermès Core Client App initialisée avec succès.');
  }

  switchAgent(agentId) {
    state.setActiveAgent(agentId);
    // Fermer le menu mobile si ouvert
    const mobileDrawer = document.getElementById('mobile-agent-drawer');
    if (mobileDrawer && !mobileDrawer.classList.contains('hidden')) {
      mobileDrawer.classList.add('hidden');
    }
  }

  sendQuickPrompt(escapedPrompt) {
    const prompt = unescape(escapedPrompt);
    gateway.sendMessage(state.activeAgentId, prompt);
  }

  clearCurrentHistory() {
    const active = state.getActiveAgent();
    if (confirm(`Voulez-vous réinitialiser la conversation avec ${active.name} ?`)) {
      state.clearAgentHistory(active.id);
    }
  }

  openSkillsModal() {
    const modal = document.getElementById('skills-modal');
    const content = document.getElementById('skills-modal-content');
    if (!modal || !content) return;

    const agent = state.getActiveAgent();
    content.innerHTML = `
      <div class="flex items-center gap-3 mb-5">
        <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 overflow-hidden">
          <img src="${agent.avatar}" alt="${agent.name}" class="w-full h-full object-cover">
        </div>
        <div>
          <h3 class="text-base font-bold text-white">${agent.name} (${agent.alias})</h3>
          <p class="text-xs text-slate-400">${agent.role}</p>
        </div>
      </div>

      <div class="mb-4">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description du Profil</h4>
        <p class="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          ${agent.description}
        </p>
      </div>

      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Compétences & Outils Actifs (${agent.skills.length})</h4>
        <div class="space-y-2">
          ${agent.skills.map(s => `
            <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5">
              <span class="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
              <div>
                <span class="font-mono text-xs font-bold text-blue-300">${s.name}</span>
                <p class="text-xs text-slate-400 mt-0.5">${s.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  closeSkillsModal() {
    const modal = document.getElementById('skills-modal');
    if (modal) modal.classList.add('hidden');
  }

  openOlympeModal() {
    const modal = document.getElementById('olympe-modal');
    const content = document.getElementById('olympe-modal-content');
    if (!modal || !content) return;

    // Marquer toutes les directives comme lues
    state.olympeDirectives.forEach(d => d.read = true);
    localStorage.setItem('hermes_app_olympe_directives', JSON.stringify(state.olympeDirectives));
    ui.renderOlympeBadge();

    content.innerHTML = `
      <div class="space-y-3">
        ${state.olympeDirectives.map(d => `
          <div class="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                ${d.title}
              </span>
              <span class="text-[10px] text-slate-500">${new Date(d.timestamp).toLocaleDateString('fr-FR')}</span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed">${d.content}</p>
            <div class="pt-1 text-[10px] text-slate-500 font-mono">Source : ${d.source} (Port 9230)</div>
          </div>
        `).join('')}
      </div>
    `;

    modal.classList.remove('hidden');
  }

  closeOlympeModal() {
    const modal = document.getElementById('olympe-modal');
    if (modal) modal.classList.add('hidden');
  }

  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden');
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          console.log('PWA Service Worker registered:', reg.scope);
        }).catch((err) => {
          console.warn('PWA Service Worker registration failed:', err);
        });
      });
    }
  }
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = new HermesApp();
  app.init();
});
