/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Boot Sequence     │
 * ╰──────────────────────────────────────────────────╯
 * Description: Point d'entrée de l'architecture.
 */

import { CONFIG } from "/lib/constants.js";

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tprint(`─── INITIATION SÉQUENCE NEXUS-APEX V${CONFIG.VERSION} ───`);

    // 1. Nettoyage ciblé des ports utilisés
    Object.values(CONFIG.PORTS).forEach(port => ns.clearPort(port));
    ns.tprint(`[${CONFIG.COLORS.SUCCESS}CLEAN${CONFIG.COLORS.RESET}] Ports de communication Nexus réinitialisés.`);

    // 2. Global Kill (Réseau complet sécurisé)
    ns.tprint(`[${CONFIG.COLORS.WARN}CLEAN${CONFIG.COLORS.RESET}] Arrêt de tous les processus sur le réseau...`);
    
    const getNetworkNodes = () => {
        const visited = new Set();
        const queue = ["home"];
        while (queue.length > 0) {
            const node = queue.shift();
            if (!visited.has(node)) {
                visited.add(node);
                const neighbors = ns.scan(node);
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) queue.push(neighbor);
                }
            }
        }
        return Array.from(visited);
    };

    const allNodes = getNetworkNodes();
    const currentScript = ns.getScriptName();

    for (const node of allNodes) {
        ns.ps(node).forEach(p => {
            // Ne pas se suicider en plein vol
            if (node === "home" && p.filename === currentScript) return;
            try {
                ns.kill(p.pid, node);
            } catch (e) {
                // Silencieux si le processus est déjà mort
            }
        });
    }
    
    await ns.sleep(1000); // Correction critique : ns.sleep au lieu de ns.asleep

    // 3. Lancement de l'Orchestrateur
    if (ns.fileExists("/core/orchestrator.js")) {
        ns.tprint(`🚀 Lancement du Kernel Orchestrateur...`);
        ns.run("/core/orchestrator.js");
    } else {
        ns.tprint(`❌ [${CONFIG.COLORS.ERROR}ERREUR${CONFIG.COLORS.RESET}]: /core/orchestrator.js introuvable !`);
    }
}