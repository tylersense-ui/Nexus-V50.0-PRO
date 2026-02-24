/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Constants         │
 * ╰──────────────────────────────────────────────────╯
 * Description: Configuration centrale du système Nexus.
 */

export const CONFIG = {
    VERSION: "50.0",
    
    // Ports de communication (Netscript Ports 1-20)
    PORTS: {
        NETWORK_MAP: 1,
        TARGET_QUEUE: 2,
        LOG_STREAM: 3,
        COMMANDS: 4,
        STOCK_DATA: 5,
        SHARE_RATIO: 6
    },

    // Paramètres du système de Hacking
    HACKING: {
        MIN_SECURITY_THRESHOLD: 5,        
        MAX_MONEY_PERCENTAGE: 0.90,       
        BATCH_SPACING: 30,                
        RESERVED_HOME_RAM: 64,            // Réduit à 64GB pour le early BN1
        MAX_TARGET_DIFFICULTY: 50
    },

    // Paramètres des Managers
    MANAGERS: {
        PSERV_PREFIX: "nexus-node-",      
        AUTO_JOIN_FACTIONS: true,
        MAX_SERVERS: 25
    },

    // Configuration Système
    SYSTEM: {
        DEBUG_MODE: false,                // Désactivé par défaut pour la propreté des logs
        REFRESH_RATE: 2000
    },

    // Palette de couleurs pour l'UI et les terminaux
    COLORS: {
        INFO: "\u001b[38;5;14m",   // Cyan clair
        WARN: "\u001b[38;5;214m",  // Orange
        ERROR: "\u001b[38;5;196m", // Rouge vif
        DEBUG: "\u001b[38;5;245m", // Gris
        SUCCESS: "\u001b[38;5;46m",// Vert fluo
        RESET: "\u001b[0m"
    }
};