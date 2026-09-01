import { AGENTS } from './agents.js';
import { state } from './state.js';
import { gateway } from './gateway-client.js';

/**
 * Gestionnaire d'interface utilisateur (UI)
 */
export class UIManager {
  constructor() {
    this.chatContainer = null;
    this.messagesList = null;
    this.inputField = null;
    this.sendBtn = null;
    this.quickActionsContainer = null;
    this.activeAgentHeader = null;
    this.sidebarAgentsList = null;
  }

  init() {
    this.cacheDomElements();
    this.bindEvents();
    this.renderSidebarAgents();
    this.renderActiveAgentHeader();
    this.renderQuickActions();
    this.renderMessages();
    this.renderOlympeBadge();

    // S'abonner aux changements d'état
    state.subscribe((event, data) => {
      if (event === 'agent_changed') {
        this.renderSidebarAgents();
        this.renderActiveAgentHeader();
        this.renderQuickActions();
        this.renderMessages();
        this.scrollToBottom();
      } else if (event === 'message_added' || event === 'message_updated') {
        if (data.agentId === state.activeAgentId) {
          this.renderMessages();
          this.scrollToBottom();
        }
      } else if (event === 'streaming_start' || event === 'streaming_end') {
        this.updateSendButtonState();
      } else if (event === 'thinking_visibility_changed') {
        this.renderMessages();
      }
    });
  }

  cacheDomElements() {
    this.chatContainer = document.getElementById('chat-scroll-area');
    this.messagesList = document.getElementById('messages-list');
    this.inputField = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('send-message-btn');
    this.quickActionsContainer = document.getElementById('quick-actions-container');
    this.activeAgentHeader = document.getElementById('active-agent-header');
    this.sidebarAgentsList = document.getElementById('sidebar-agents-list');
  }

  bindEvents() {
    // Envoi via clic bouton
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.handleSendMessage());
    }

    // Envoi via touche Entrée (Maj+Entrée pour nouvelle ligne)
    if (this.inputField) {
      this.inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
      // Auto-resize de la zone de texte
      this.inputField.addEventListener('input', () => {
        this.inputField.style.height = 'auto';
        this.inputField.style.height = Math.min(this.inputField.scrollHeight, 140) + 'px';
      });
    }

    // Délégation d'événements pour les boutons d'action dans le chat
    if (this.messagesList) {
      this.messagesList.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action-type]');
        if (btn) {
          const actionType = btn.dataset.actionType;
          const messageId = btn.dataset.messageId;
          const clientName = btn.dataset.clientName;
          const amount = btn.dataset.amount;
          gateway.handleActionClick(state.activeAgentId, actionType, { clientName, amount }, messageId);
        }

        // Accordéon des pensées / reasoning
        const thoughtToggle = e.target.closest('.thought-toggle-btn');
        if (thoughtToggle) {
          const content = thoughtToggle.nextElementSibling;
          if (content) {
            content.classList.toggle('hidden');
            const icon = thoughtToggle.querySelector('.thought-chevron');
            if (icon) icon.classList.toggle('rotate-180');
          }
        }
      });
    }
  }

  handleSendMessage() {
    if (state.isStreaming || !this.inputField) return;
    const text = this.inputField.value.trim();
    if (!text) return;

    this.inputField.value = '';
    this.inputField.style.height = 'auto';
    gateway.sendMessage(state.activeAgentId, text);
    this.scrollToBottom();
  }

  renderSidebarAgents() {
    if (!this.sidebarAgentsList) return;
    const activeAgent = state.getActiveAgent();

    this.sidebarAgentsList.innerHTML = Object.values(AGENTS).map(agent => {
      const isActive = agent.id === activeAgent.id;
      const glowClass = isActive ? `glow-${agent.accentClass} border-${agent.accentClass}-500/50 bg-[#161F30]` : 'border-slate-800/80 bg-[#111827]/40 hover:bg-[#111827]/80';
      const indicatorColor = agent.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400';

      return `
        <button 
          onclick="window.hermesApp.switchAgent('${agent.id}')"
          class="w-full text-left p-3.5 rounded-2xl border ${glowClass} transition-all duration-200 flex items-center gap-3.5 group relative overflow-hidden"
        >
          <!-- Indicateur d'accent latéral -->
          ${isActive ? `<div class="absolute left-0 top-0 bottom-0 w-1 bg-${agent.accentClass}-500"></div>` : ''}

          <!-- Avatar / Photo -->
          <div class="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 flex-shrink-0">
            <img src="${agent.avatar}" alt="${agent.name}" class="w-full h-full object-cover">
            <span class="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full ${indicatorColor} ring-2 ring-[#090D16]"></span>
          </div>

          <!-- Détails -->
          <div class="flex-grow min-w-0">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-bold text-slate-100 truncate group-hover:text-blue-400 transition-colors">${agent.name}</h4>
              <span class="text-[10px] text-slate-500 font-mono">:${agent.dockerPort}</span>
            </div>
            <p class="text-xs text-slate-400 truncate mt-0.5">${agent.role}</p>
          </div>
        </button>
      `;
    }).join('');
  }

  renderActiveAgentHeader() {
    if (!this.activeAgentHeader) return;
    const agent = state.getActiveAgent();

    this.activeAgentHeader.innerHTML = `
      <div class="flex items-center gap-3.5">
        <div class="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-md">
          <img src="${agent.avatar}" alt="${agent.name}" class="w-full h-full object-cover">
          <span class="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#090D16]"></span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-base font-bold text-white">${agent.name}</h2>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-${agent.accentClass}-500/10 text-${agent.accentClass}-400 border border-${agent.accentClass}-500/20">
              ${agent.alias}
            </span>
          </div>
          <p class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ${agent.statusText}
            <span class="text-slate-600">•</span>
            <span class="text-slate-500 text-[11px] font-mono">${agent.model}</span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Bouton compétences de l'agent -->
        <button 
          onclick="window.hermesApp.openSkillsModal()"
          class="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          title="Consulter les compétences installées"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span class="hidden sm:inline">Compétences (${agent.skills.length})</span>
        </button>

        <!-- Effacer l'historique de l'agent -->
        <button 
          onclick="window.hermesApp.clearCurrentHistory()"
          class="p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 text-slate-400 text-xs transition-all"
          title="Réinitialiser la conversation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;
  }

  renderQuickActions() {
    if (!this.quickActionsContainer) return;
    const agent = state.getActiveAgent();

    this.quickActionsContainer.innerHTML = agent.quickActions.map(action => `
      <button 
        onclick="window.hermesApp.sendQuickPrompt('${escape(action.prompt)}')"
        class="px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-blue-300 text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 shadow-sm"
      >
        ${action.label}
      </button>
    `).join('');
  }

  renderMessages() {
    if (!this.messagesList) return;
    const messages = state.getCurrentMessages();
    const activeAgent = state.getActiveAgent();

    if (messages.length === 0) {
      this.messagesList.innerHTML = `
        <div class="text-center py-16 text-slate-500 text-sm">
          Aucun message dans cette session. Posez votre première question ci-dessous.
        </div>
      `;
      return;
    }

    this.messagesList.innerHTML = messages.map(msg => {
      const isUser = msg.role === 'user';
      const formattedContent = this.formatMarkdown(msg.content);

      if (isUser) {
        return `
          <div class="flex items-start justify-end gap-3 mb-6">
            <div class="max-w-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-lg shadow-blue-600/10 text-sm leading-relaxed">
              ${formattedContent}
            </div>
            <div class="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0">
              ADV
            </div>
          </div>
        `;
      }

      // Message Assistant
      return `
        <div class="flex items-start gap-3.5 mb-6 group">
          <!-- Avatar -->
          <div class="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-700/80 flex-shrink-0 mt-1">
            <img src="${activeAgent.avatar}" alt="${activeAgent.name}" class="w-full h-full object-cover">
          </div>

          <!-- Contenu du message -->
          <div class="max-w-3xl flex-grow min-w-0">
            <!-- Bloc Réflexion / Reasoning (si activé) -->
            ${msg.thoughts && msg.thoughts.length > 0 && state.isThinkingVisible ? `
              <div class="mb-2.5 rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
                <button class="thought-toggle-btn w-full px-3 py-1.5 text-left text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-between bg-slate-900/60 transition-colors">
                  <span class="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Processus de réflexion et compétences exécutées (${msg.thoughts.length})
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="thought-chevron h-3 w-3 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="px-3.5 py-2 space-y-1 text-[11px] font-mono text-slate-400 bg-slate-950/30 border-t border-slate-800/60">
                  ${msg.thoughts.map(t => `<div class="flex items-center gap-2"><span class="w-1 h-1 rounded-full bg-blue-400"></span>${t}</div>`).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Bulle principale -->
            <div class="bg-[#111827]/70 border border-slate-800/80 rounded-2xl rounded-tl-sm p-4 text-slate-200 shadow-md prose-hermes">
              ${formattedContent || '<div class="flex items-center gap-1.5 py-1 text-slate-400 text-xs font-mono"><span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-typing-dot-1"></span><span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-typing-dot-2"></span><span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-typing-dot-3"></span> Réflexion en cours...</div>'}
            </div>

            <!-- Cartes d'action interactives -->
            ${this.renderActionCard(msg)}
          </div>
        </div>
      `;
    }).join('');
  }

  renderActionCard(msg) {
    if (!msg.hasActionCard || !msg.actionCard) return '';
    const card = msg.actionCard;

    if (card.type === 'relance_approval') {
      if (msg.actionStatus === 'approved') {
        return `
          <div class="mt-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>${msg.actionStatusText}</span>
          </div>
        `;
      }
      if (msg.actionStatus === 'delayed') {
        return `
          <div class="mt-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>${msg.actionStatusText}</span>
          </div>
        `;
      }

      return `
        <div class="mt-3 rounded-2xl border border-blue-500/30 bg-[#161F30]/90 p-4.5 shadow-xl action-card">
          <div class="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <h4 class="text-xs font-bold uppercase tracking-wider text-blue-300">Action Requise : Validation de Relance</h4>
            </div>
            <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">${card.invoiceNumber}</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3 text-xs">
            <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span class="block text-[10px] text-slate-500 uppercase font-semibold">Débiteur</span>
              <span class="font-bold text-slate-200">${card.clientName}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span class="block text-[10px] text-slate-500 uppercase font-semibold">Montant TTC</span>
              <span class="font-extrabold text-amber-400">${card.amount}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
              <span class="block text-[10px] text-slate-500 uppercase font-semibold">Retard</span>
              <span class="font-bold text-red-400">J + ${card.delayDays} jours</span>
            </div>
          </div>

          <!-- Aperçu du message -->
          <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4 text-xs font-sans text-slate-300 space-y-1.5">
            <div class="text-slate-400 font-semibold text-[11px] border-b border-slate-800 pb-1">Objet : ${card.previewSubject}</div>
            <div class="text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">${card.previewBody}</div>
          </div>

          <!-- Boutons d'action -->
          <div class="flex flex-wrap items-center gap-2">
            <button 
              data-action-type="approve_relance"
              data-message-id="${msg.id}"
              data-client-name="${card.clientName}"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Approuver et envoyer
            </button>
            <button 
              data-action-type="delay_relance"
              data-message-id="${msg.id}"
              class="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Reporter 48h
            </button>
          </div>
        </div>
      `;
    }

    if (card.type === 'balance_overview') {
      return `
        <div class="mt-3 p-4 rounded-2xl border border-slate-800 bg-[#161F30]/80 shadow-lg">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300">Indicateurs Trésorerie</h4>
            <span class="text-[10px] text-slate-400">MàJ à l'instant</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span class="block text-[10px] text-slate-500">Total impayé</span>
              <span class="font-extrabold text-blue-400">${card.totalOverdue}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span class="block text-[10px] text-slate-500">Critique (>60j)</span>
              <span class="font-extrabold text-red-400">${card.criticalAmount}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span class="block text-[10px] text-slate-500">Clients relancés</span>
              <span class="font-extrabold text-slate-200">${card.clientsCount}</span>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  renderOlympeBadge() {
    const badge = document.getElementById('olympe-unread-badge');
    if (!badge) return;
    const unreadCount = state.olympeDirectives.filter(d => !d.read).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  updateSendButtonState() {
    if (!this.sendBtn) return;
    if (state.isStreaming) {
      this.sendBtn.disabled = true;
      this.sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      this.sendBtn.disabled = false;
      this.sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  scrollToBottom() {
    if (this.chatContainer) {
      setTimeout(() => {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
      }, 30);
    }
  }

  formatMarkdown(text) {
    if (!text) return '';
    // Parser Markdown basique robuste sans dépendance externe obligatoire
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Tableaux Markdown
    html = html.replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
      if (cells.some(c => c.trim().startsWith('---') || c.trim().startsWith(':---'))) {
        return '';
      }
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    });
    if (html.includes('<tr>')) {
      html = html.replace(/(<tr>[\s\S]*?<\/tr>)+/g, '<div class="overflow-x-auto"><table class="w-full">$1</table></div>');
    }

    // Titres
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-white mt-3 mb-1.5">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-extrabold text-white mt-4 mb-2">$1</h2>');

    // Gras / Italique
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code inline
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Listes à puces
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, '<ul>$1</ul>');

    // Sauts de lignes
    html = html.replace(/\n\n/g, '<p></p>');

    return html;
  }
}

export const ui = new UIManager();
