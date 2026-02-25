/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Global Kill       │
 * ╰──────────────────────────────────────────────────╯
 * Description: Arrêt d'urgence du système.
 * Usage: run /global-kill.js --confirm
 */

import { CONFIG } from "/lib/constants.js";

/** @param {NS} ns **/
export async function main(ns) {
    if (!ns.args.includes("--confirm")) {
        ns.tprint(`⚠️ [ATTENTION] Cette action va arrêter tous les processus du réseau !`);
        ns.tprint(`Utilisez: run /global-kill.js --confirm`);
        return;
    }

    ns.tprint(`🛑 [${CONFIG.COLORS.ERROR}ARRÊT D'URGENCE GLOBAL DÉCLENCHÉ${CONFIG.COLORS.RESET}]`);

    // 1. Nettoyage strict des ports définis uniquement
    Object.values(CONFIG.PORTS).forEach(port => ns.clearPort(port));

    // 2. Tuer tous les scripts sur tous les serveurs
    let allNodes = new Set(["home"]);
    function scanAll(node) {
        for (const neighbor of ns.scan(node)) {
            if (!allNodes.has(neighbor)) { 
                allNodes.add(neighbor); 
                scanAll(neighbor); 
            }
        }
    }
    scanAll("home");

    for (const host of allNodes) {
        ns.killall(host);
    }
    ns.tprint(`✅ Réseau entièrement purgé et silencieux.`);
}