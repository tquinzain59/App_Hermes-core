import { APP_CONFIG } from './config.js';
import { AGENTS } from './agents.js';

/**
 * Gestionnaire d'état de l'application cliente
 */
class AppState {
  constructor() {
    this.activeAgentId = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_AGENT) || 'recouvrement';
    this.chatHistories = this.loadChatHistories();
    this.clientProfile = this.loadClientProfile();
    this.olympeDirectives = this.loadOlympeDirectives();
    this.isThinkingVisible = localStorage.getItem('hermes_app_show_thinking') !== 'false';
    this.isStreaming = false;
    this.wsConnected = false;
    this.listeners = new Set();
  }

  loadClientProfile() {
    const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CLIENT_PROFILE);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      companyName: 'Groupe Novatech SAS',
      siren: '844952084',
      userName: 'Alexandre Martin',
      userRole: 'Directeur Général & ADV',
      email: 'a.martin@novatech-group.fr',
      plan: 'Hermès Enterprise Suite (4 Agents Actifs)',
      token: 'hm_live_sec_89201fa87e14'
    };
  }

  loadOlympeDirectives() {
    const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.OLYMPE_DIRECTIVES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'ol-dir-104',
        source: 'Olympe Superviseur',
        type: 'compliance', // 'compliance' | 'security' | 'update'
        timestamp: new Date().toISOString(),
        title: 'Consigne Transverse : Pénalités L.441-10',
        content: 'Mise à jour automatique du taux légal des pénalités de retard (BCE + 10 points) appliquée à tous vos agents du parc.',
        read: false
      },
      {
        id: 'ol-dir-103',
        source: 'Olympe Superviseur',
        type: 'security',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        title: 'Audit de Sécurité Hebdomadaire',
        content: 'Tous les conteneurs du parc sont conformes. Masquage des données sensibles et chiffrement des tokens opérationnels.',
        read: true
      }
    ];
  }

  loadChatHistories() {
    const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CHAT_HISTORY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.error('Erreur chargement historique chat:', e);
      }
    }
    // Fallback avec les messages initiaux par défaut
    const initial = {};
    for (const [id, agent] of Object.entries(AGENTS)) {
      initial[id] = [...agent.initialMessages];
    }
    return initial;
  }

  saveChatHistories() {
    try {
      localStorage.setItem(APP_CONFIG.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(this.chatHistories));
    } catch (e) {
      console.warn('Impossible de sauvegarder l’historique dans le localStorage:', e);
    }
  }

  getActiveAgent() {
    return AGENTS[this.activeAgentId] || AGENTS.recouvrement;
  }

  setActiveAgent(agentId) {
    if (!AGENTS[agentId]) return;
    this.activeAgentId = agentId;
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.ACTIVE_AGENT, agentId);
    this.notify('agent_changed', agentId);
  }

  getCurrentMessages() {
    if (!this.chatHistories[this.activeAgentId]) {
      this.chatHistories[this.activeAgentId] = [...(AGENTS[this.activeAgentId]?.initialMessages || [])];
    }
    return this.chatHistories[this.activeAgentId];
  }

  addMessage(agentId, message) {
    if (!this.chatHistories[agentId]) {
      this.chatHistories[agentId] = [];
    }
    const fullMessage = {
      id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: message.timestamp || new Date().toISOString(),
      ...message
    };
    this.chatHistories[agentId].push(fullMessage);
    this.saveChatHistories();
    this.notify('message_added', { agentId, message: fullMessage });
    return fullMessage;
  }

  updateMessage(agentId, messageId, updates) {
    const list = this.chatHistories[agentId];
    if (!list) return;
    const msg = list.find(m => m.id === messageId);
    if (msg) {
      Object.assign(msg, updates);
      this.saveChatHistories();
      this.notify('message_updated', { agentId, messageId, updates });
    }
  }

  clearAgentHistory(agentId) {
    if (AGENTS[agentId]) {
      this.chatHistories[agentId] = [...AGENTS[agentId].initialMessages];
      this.saveChatHistories();
      this.notify('history_cleared', agentId);
    }
  }

  toggleThinkingVisibility() {
    this.isThinkingVisible = !this.isThinkingVisible;
    localStorage.setItem('hermes_app_show_thinking', this.isThinkingVisible);
    this.notify('thinking_visibility_changed', this.isThinkingVisible);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, data) {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (err) {
        console.error('Erreur listener AppState:', err);
      }
    }
  }
}

export const state = new AppState();
