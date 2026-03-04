/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: RAM Manager       │
 * ╰──────────────────────────────────────────────────╯
 * Description: Analyse et gestion de l'espace mémoire réseau.
 */

import { CONFIG } from "/lib/constants.js";

export class RamManager {
    /** @param {NS} ns */
    constructor(ns) {
        this.ns = ns;
    }

    /**
     * Calcule la RAM disponible sur le réseau rooté (Home exclu de sa réserve).
     * @param {string[]} networkList
     * @returns {Object} { total, used, free } en GB.
     */
    getGlobalRam(networkList) {
        let total = 0;
        let used = 0;

        for (const host of networkList) {
            if (this.ns.hasRootAccess(host)) {
                const server = this.ns.getServer(host);
                let ramMax = server.maxRam;
                
                // Soustraction de la réserve critique pour la Home
                if (host === "home") {
                    ramMax = Math.max(0, ramMax - CONFIG.HACKING.RESERVED_HOME_RAM);
                }

                total += ramMax;
                used += server.ramUsed;
            }
        }

        return {
            total: total,
            used: used,
            free: Math.max(0, total - used)
        };
    }

    /**
     * Trouve un hôte avec suffisamment de RAM disponible.
     * @param {string[]} networkList 
     * @param {number} ramRequired 
     * @returns {string|null} Hostname ou null
     */
    findBestHost(networkList, ramRequired) {
        for (const host of networkList) {
            if (this.ns.hasRootAccess(host)) {
                const server = this.ns.getServer(host);
                let available = server.maxRam - server.ramUsed;
                
                if (host === "home") {
                    available -= CONFIG.HACKING.RESERVED_HOME_RAM;
                }

                if (available >= ramRequired) return host;
            }
        }
        return null;
    }

    /**
     * @param {string[]} networkList 
     * @param {string} scriptPath 
     * @returns {number} Nombre de threads max possible globalement
     */
    calculateMaxThreads(networkList, scriptPath) {
        const cost = this.ns.getScriptRam(scriptPath);
        if (cost <= 0) return 0; // Sécurité si le fichier n'existe pas encore
        const global = this.getGlobalRam(networkList);
        return Math.floor(global.free / cost);
    }
}