/**
 * Définitions et spécifications des Agents de la flotte Hermès
 */
export const AGENTS = {
  recouvrement: {
    id: 'recouvrement',
    name: 'Hermès Recouvrement',
    alias: 'Jérôme',
    role: 'Assistant ADV & Credit Manager',
    category: 'Finance & Trésorerie',
    status: 'online', // 'online' | 'busy' | 'offline'
    statusText: '🟢 En ligne — Credit Manager',
    avatar: 'assets/recouvrement.jpeg',
    accentColor: '#3B82F6', // Blue
    accentClass: 'blue',
    dockerPort: 9229,
    containerName: 'hermes_recouvrement_agent',
    model: 'deepseek/deepseek-v4-flash',
    description: 'Expert en relances préventives et curatives, négociation d’échéanciers et analyse du risque client selon le droit commercial français.',
    skills: [
      { name: 'check_overdue.py', desc: 'Analyse de la balance âgée et détection des retards critiques' },
      { name: 'bodacc_lookup', desc: 'Vérification légale des procédures collectives et alertes SIREN' },
      { name: 'negotiate_schedule', desc: 'Calcul et proposition d’échéanciers personnalisés avec pénalités L.441-10' },
      { name: 'relance_multicanal', desc: 'Génération de relances adaptées (Email, SMS, WhatsApp Business)' }
    ],
    quickActions: [
      { label: '📊 État de la balance âgée', prompt: '/balance' },
      { label: '🚨 Retards critiques (> 30j)', prompt: '/retards' },
      { label: '🔍 Vérifier un SIREN', prompt: '/check 844952084' },
      { label: '✉️ Préparer relances du jour', prompt: 'Génère la liste des 3 relances prioritaires à envoyer aujourd’hui.' }
    ],
    initialMessages: [
      {
        id: 'init-rec-1',
        role: 'assistant',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        content: `Bonjour ! Je suis **Jérôme**, votre Credit Manager autonome **Hermès Recouvrement**.\n\nJe surveille actuellement votre trésorerie et la balance âgée de vos clients.\n\nVous pouvez me demander un état des créances (/balance), la vérification d'une entreprise (/check <siren>) ou me demander de préparer vos relances de factures. Que souhaitez-vous vérifier ?`,
        hasActionCard: false
      }
    ]
  },

  commercial: {
    id: 'commercial',
    name: 'Hermès Commercial',
    alias: 'Lucas',
    role: 'Business Developer & CRM',
    category: 'Ventes & Prospection',
    status: 'online',
    statusText: '🟢 En ligne — Pipeline actif',
    avatar: 'assets/commercial.jpeg',
    accentColor: '#6366F1', // Indigo
    accentClass: 'indigo',
    dockerPort: 9231,
    containerName: 'hermes_commercial_agent',
    model: 'deepseek/deepseek-chat',
    description: 'Qualifie vos leads entrants, réactive les contacts froids et synchronise les opportunités de vente avec votre CRM.',
    skills: [
      { name: 'lead_enrichment', desc: 'Enrichissement de profils prospects via LinkedIn & SIRENE' },
      { name: 'crm_sync', desc: 'Mise à jour en temps réel des deals et probabilités de closing' },
      { name: 'email_outreach', desc: 'Rédaction d’e-mails d’accroche personnalisés et séquençage' }
    ],
    quickActions: [
      { label: '🎯 Nouveaux leads qualifiés', prompt: '/leads' },
      { label: '📈 Pipeline & Prévisions', prompt: '/pipeline' },
      { label: '✍️ Rédiger une proposition', prompt: 'Rédige une proposition commerciale d’accompagnement IA pour un prospect PME.' }
    ],
    initialMessages: [
      {
        id: 'init-com-1',
        role: 'assistant',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        content: `Bonjour ! Je suis **Lucas**, votre agent **Hermès Commercial**.\n\nMon rôle est d'accélérer votre cycle de vente, qualifier vos opportunités et assurer un suivi sans faille de vos prospects.\n\nConsultez vos leads du jour ou demandez-moi de préparer une séquence de prospection ciblée.`,
        hasActionCard: false
      }
    ]
  },

  support: {
    id: 'support',
    name: 'Hermès Support Client',
    alias: 'Clara',
    role: 'Responsable Support & Escalade 24/7',
    category: 'Relation Client',
    status: 'online',
    statusText: '🟢 En ligne — 0 ticket en attente',
    avatar: 'assets/support_client.jpeg',
    accentColor: '#10B981', // Emerald
    accentClass: 'emerald',
    dockerPort: 9232,
    containerName: 'hermes_support_agent',
    model: 'deepseek/deepseek-chat',
    description: 'Fournit une assistance instantanée aux utilisateurs, interroge la base de connaissances et escalade intelligemment les anomalies.',
    skills: [
      { name: 'kb_search', desc: 'Recherche sémantique vectorielle dans vos documentations et FAQ' },
      { name: 'ticket_manager', desc: 'Création, suivi et clôture de tickets' },
      { name: 'smart_escalation', desc: 'Détection du niveau de criticité et alerte des équipes d’astreinte' }
    ],
    quickActions: [
      { label: '🎫 Tickets ouverts', prompt: '/tickets' },
      { label: '📊 Taux de satisfaction', prompt: '/satisfaction' },
      { label: '❓ Poser une question support', prompt: 'Comment configurer l’accès Webhook pour les notifications ?' }
    ],
    initialMessages: [
      {
        id: 'init-sup-1',
        role: 'assistant',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        content: `Bonjour ! Je suis **Clara**, votre agent **Hermès Support Client**.\n\nJe traite les demandes d'assistance 24h/24 et veille à la satisfaction de vos utilisateurs.\n\nComment puis-je vous aider aujourd'hui ?`,
        hasActionCard: false
      }
    ]
  },

  ao: {
    id: 'ao',
    name: 'Hermès Appel d’Offre',
    alias: 'Victor',
    role: 'Expert Marchés & Mémoires Techniques',
    category: 'Développement Stratégique',
    status: 'online',
    statusText: '🟢 En ligne — Veille active BOAMP/TED',
    avatar: 'assets/AO.jpeg',
    accentColor: '#F59E0B', // Amber
    accentClass: 'amber',
    dockerPort: 9233,
    containerName: 'hermes_ao_agent',
    model: 'anthropic/claude-sonnet-4',
    description: 'Détecte les consultations publiques pertinentes, dissèque les cahiers des charges (DCE) et structure vos réponses techniques.',
    skills: [
      { name: 'boamp_scraper', desc: 'Veille automatisée sur les plateformes de marchés publics' },
      { name: 'dce_analyzer', desc: 'Extraction des critères de notation et exigences du RC' },
      { name: 'technical_pitch', desc: 'Rédaction assistée des chapitres du mémoire technique' }
    ],
    quickActions: [
      { label: '📢 Nouvelles opportunités AO', prompt: '/ao_list' },
      { label: '📑 Analyser un cahier des charges', prompt: '/dce_analyze' },
      { label: '📝 Rédiger note méthodologique', prompt: 'Génère un plan de mémoire technique pour un marché de maintenance logicielle.' }
    ],
    initialMessages: [
      {
        id: 'init-ao-1',
        role: 'assistant',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        content: `Bonjour ! Je suis **Victor**, votre spécialiste **Hermès Appels d’Offres**.\n\nJe scrute les consultations sur le BOAMP et le JOUE pour vous faire gagner de nouveaux marchés et optimiser vos mémoires techniques.\n\nSouhaitez-vous voir les consultations récemment identifiées pour votre secteur ?`,
        hasActionCard: false
      }
    ]
  }
};
