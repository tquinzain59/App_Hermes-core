import { APP_CONFIG } from './config.js';
import { state } from './state.js';
import { AGENTS } from './agents.js';

/**
 * Client de passerelle pour la communication avec les conteneurs Hermès
 * Gère le WebSocket temps réel et le moteur de simulation enrichie
 */
export class GatewayClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectTimer = null;
  }

  async init() {
    this.tryConnectWebSocket();
  }

  tryConnectWebSocket() {
    const activeAgent = state.getActiveAgent();
    const wsUrl = `ws://localhost:${activeAgent.dockerPort}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        state.wsConnected = true;
        state.notify('connection_status', { connected: true, agent: activeAgent.id });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncomingGatewayMessage(payload);
        } catch (e) {
          console.error('Erreur parsing message Gateway:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        state.wsConnected = false;
        state.notify('connection_status', { connected: false, agent: activeAgent.id });
      };

      this.ws.onerror = () => {
        // En cas d'échec de liaison directe conteneur, mode simulation actif
        this.isConnected = false;
        state.wsConnected = false;
      };
    } catch (err) {
      this.isConnected = false;
    }
  }

  /**
   * Envoi d'un message utilisateur à l'agent
   */
  async sendMessage(agentId, userText) {
    // 1. Ajouter le message utilisateur dans l'état
    const userMsg = state.addMessage(agentId, {
      role: 'user',
      content: userText
    });

    state.isStreaming = true;
    state.notify('streaming_start', { agentId });

    // 2. Si WebSocket actif, envoyer à l'agent réel
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'user_message',
        agent_id: agentId,
        content: userText,
        client_token: state.clientProfile.token
      }));
      return;
    }

    // 3. Sinon, utiliser le moteur de simulation intelligent Hermès
    await this.simulateAgentResponse(agentId, userText);
  }

  /**
   * Gestion d'une action interactive cliquée par l'utilisateur
   */
  async handleActionClick(agentId, actionType, actionPayload, messageId) {
    if (actionType === 'approve_relance') {
      state.updateMessage(agentId, messageId, {
        actionStatus: 'approved',
        actionStatusText: '✅ Relance validée et envoyée avec succès par e-mail et WhatsApp.'
      });

      // L'agent confirme en direct
      const confMsg = state.addMessage(agentId, {
        role: 'assistant',
        content: `C'est fait ! La relance niveau 2 a été transmise à **${actionPayload.clientName || 'la société'}** avec la copie de la facture en pièce jointe. Je surveille leur accusé de réception et vous préviens dès qu'une réponse est détectée.`
      });
    } else if (actionType === 'accept_schedule') {
      state.updateMessage(agentId, messageId, {
        actionStatus: 'approved',
        actionStatusText: '✅ Protocole d’échéancier signé et enregistré dans la base comptable.'
      });

      state.addMessage(agentId, {
        role: 'assistant',
        content: `Protocole d'accord validé ! Le premier prélèvement de **${actionPayload.amount || '1 616,66 €'}** est planifié au **15 du mois prochain**. Des rappels automatiques 48h avant chaque échéance ont été programmés.`
      });
    } else if (actionType === 'delay_relance') {
      state.updateMessage(agentId, messageId, {
        actionStatus: 'delayed',
        actionStatusText: '⏳ Relance mise en sommeil pour 48 heures.'
      });

      state.addMessage(agentId, {
        role: 'assistant',
        content: `Bien noté. J'ai reporté la relance à dans 48h. Si aucun règlement n'apparaît d'ici là, je vous proposerai à nouveau le projet de message.`
      });
    }
  }

  /**
   * Moteur de simulation réaliste pour les 4 agents Hermès
   */
  async simulateAgentResponse(agentId, userText) {
    const lower = userText.toLowerCase().trim();
    let thoughts = [];
    let responseText = '';
    let actionCard = null;

    if (agentId === 'recouvrement') {
      if (lower.includes('/balance') || lower.includes('balance')) {
        thoughts = [
          'Lecture de la table des factures dans SQLite state.db',
          'Calcul des tranches d’ancienneté (0-30j, 31-60j, >60j)',
          'Génération de la synthèse financière pour le dirigeant'
        ];
        responseText = `Voici l'état actuel de votre **balance âgée globale** au ${new Date().toLocaleDateString('fr-FR')} :\n\n` +
          `| Tranche d'ancienneté | Montant dû | Nombre de factures | Risque |\n` +
          `| :--- | :--- | :--- | :--- |\n` +
          `| **0 à 30 jours** (Échéance proche) | **14 250,00 €** | 6 factures | Faible 🟢 |\n` +
          `| **31 à 60 jours** (Retard avéré) | **8 920,00 €** | 3 factures | Moyen 🟡 |\n` +
          `| **> 60 jours** (Retard critique) | **4 850,00 €** | 1 facture | Élevé 🔴 |\n\n` +
          `💡 **Encours total en retard :** \`13 770,00 €\` sur un total facturé de \`28 020,00 €\`.\n` +
          `Le dossier le plus urgent concerne **Transports Durand SAS** (4 850 € à J+38). Souhaitez-vous que je prépare la mise en demeure ?`;

        actionCard = {
          type: 'balance_overview',
          totalOverdue: '13 770 €',
          criticalAmount: '4 850 €',
          clientsCount: 4
        };
      } else if (lower.includes('/check') || lower.includes('siren') || lower.includes('844952084') || lower.includes('vérifi')) {
        thoughts = [
          'Appel de la compétence bodacc_lookup & API SIRENE',
          'Vérification des annonces légales de procédures collectives',
          'Évaluation de la note de solvabilité'
        ];
        responseText = `### 🏢 Fiche de Solvabilité Express\n\n` +
          `* **Dénomination :** Transports Durand SAS\n` +
          `* **SIREN :** \`844 952 084\` (RCS Lyon)\n` +
          `* **Activité :** Transports routiers de fret interurbains (49.41A)\n` +
          `* **Santé financière :** Score de \`7.8 / 10\` (Risque modéré)\n` +
          `* **Procédures collectives (BODACC) :** Aucune procédure de sauvegarde, redressement ou liquidation enregistrée au cours des 24 derniers mois.\n\n` +
          `📌 **Recommandation Jérôme :** L'entreprise est solvable mais traverse un décalage de trésorerie ponctuel. Privilégier une relance ferme avec proposition d'échéancier en 2 ou 3 mensualités.`;
      } else if (lower.includes('relance') || lower.includes('/retards') || lower.includes('prioritaire')) {
        thoughts = [
          'Exécution du skill check_overdue.py',
          'Sélection de la facture #FAC-2026-089 (Retard 38j)',
          'Application de l’article L.441-10 du Code de commerce (indemnité forfaitaire de 40€)',
          'Rédaction du projet de courriel de relance niveau 2'
        ];
        responseText = `J'ai préparé la relance prioritaire pour le dossier critique **Transports Durand SAS** concernant la facture **#FAC-2026-089** d'un montant de **4 850,00 € TTC** (échéance dépassée de 38 jours).\n\nVoici le projet de relance que je m'apprête à envoyer :`;

        actionCard = {
          type: 'relance_approval',
          clientName: 'Transports Durand SAS',
          invoiceNumber: 'FAC-2026-089',
          amount: '4 850,00 €',
          delayDays: 38,
          channel: 'Email & WhatsApp Business',
          previewSubject: 'Rappel de paiement - Facture FAC-2026-089 en souffrance (Transports Durand)',
          previewBody: 'Madame, Monsieur,\nSauf erreur ou omission de notre part, le règlement de la facture FAC-2026-089 échue le 24 juillet 2026 pour un montant de 4 850,00 € ne nous est pas parvenu. Nous vous prions de bien vouloir procéder à son virement sous 48 heures ou nous transmettre votre justificatif...'
        };
      } else {
        thoughts = [
          'Analyse sémantique de la demande utilisateur',
          'Consultation du profil ADV de l’entreprise',
          'Génération de la réponse spécialisée'
        ];
        responseText = `J'ai bien pris en compte votre demande : *« ${userText} »*.\n\nEn tant que votre **Credit Manager ADV**, je peux :\n1. Analyser vos retards de paiement en temps réel (\`/balance\`)\n2. Rédiger et envoyer des relances diplomatiques ou fermes\n3. Négocier des accords d'échéanciers juridiquement conformes\n4. Vérifier la santé légale de n'importe quel partenaire via son SIREN (\`/check <siren>\`)\n\nQue souhaitez-vous exécuter ?`;
      }
    } else if (agentId === 'commercial') {
      thoughts = ['Interrogation du pipeline CRM', 'Calcul du score d’engagement des prospects'];
      responseText = `Voici le point sur vos opportunités commerciales actives :\n\n` +
        `* 🎯 **3 nouveaux prospects qualifiés** cette semaine (dont 2 PME du secteur BTP prêtes pour une démo).\n` +
        `* 📈 **Pipeline pondéré :** \`42 500 €\` de chiffre d'affaires potentiel sur les 30 prochains jours.\n` +
        `* ✉️ **Action suggérée :** Relancer la société *AéroTech Sud* dont la proposition commerciale a été ouverte hier.`;
    } else if (agentId === 'support') {
      thoughts = ['Recherche sémantique dans la base de connaissances FAQ', 'Vérification de la file d’attente des tickets'];
      responseText = `État du support client :\n\n` +
        `* 🟢 **0 ticket critique en attente.**\n` +
        `* ⏱️ **Temps moyen de première réponse IA :** \`1.4 seconde\`.\n` +
        `* 📚 **Taux de résolution automatisée au 1er contact :** \`87.4%\`.\n\n` +
        `Je reste en veille constante sur vos canaux pour assister vos clients.`;
    } else if (agentId === 'ao') {
      thoughts = ['Scraping des flux BOAMP et TED', 'Filtrage par mots-clés et géolocalisation'];
      responseText = `Veille Appels d'Offres & Marchés Publics :\n\n` +
        `* 📢 **2 nouvelles consultations identifiées** correspondant à vos critères :\n` +
        `  1. *Métropole de Lyon* : Prestations d'assistance et développement applicatif (Budget estimé : 90k€ - Date limite : 25/09).\n` +
        `  2. *Région AURA* : Déploiement d'outils d'optimisation numérique (Budget : 45k€).\n\n` +
        `Souhaitez-vous que je télécharge et analyse le Règlement de Consultation (RC) ?`;
    }

    // Créer le message de l'assistant dans l'état (vide au départ pour le streaming)
    const assistantMsg = state.addMessage(agentId, {
      role: 'assistant',
      content: '',
      thoughts: thoughts,
      hasActionCard: !!actionCard,
      actionCard: actionCard
    });

    // Simuler le streaming fluide mot à mot
    const words = responseText.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      state.updateMessage(agentId, assistantMsg.id, {
        content: currentText
      });
      await new Promise(r => setTimeout(r, APP_CONFIG.SIMULATE_STREAMING_SPEED_MS));
    }

    state.isStreaming = false;
    state.notify('streaming_end', { agentId, messageId: assistantMsg.id });
  }
}

export const gateway = new GatewayClient();
