/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Tool: Set Share Ratio     │
 * ╰──────────────────────────────────────────────────╯
 * Description: Outil de pilotage manuel du ratio de partage.
 */

import { CONFIG } from "/lib/constants.js";
import { PortHandler } from "/core/port-handler.js";

/** @param {NS} ns **/
export async function main(ns) {
    const ratioStr = ns.args[0];
    if (ratioStr === undefined) {
        ns.tprint("❌ Usage: run tools/set-share.js [0-100]");
        return;
    }

    const ratio = parseInt(ratioStr) / 100;
    const SHARE_PORT = CONFIG.PORTS.SHARE_RATIO || 6;
    const ph = new PortHandler(ns);

    ph.clear(SHARE_PORT);
    
    // Logique de Retry demandée par l'audit d'optimisation
    let success = false;
    for (let i = 0; i < 3; i++) {
        if (ph.writeJSON(SHARE_PORT, { shareRatio: ratio })) {
            success = true;
            break;
        }
        await ns.sleep(50);
    }

    if (success) {
        ns.tprint(`✅ Nexus-Apex : Ratio de Share réglé sur ${(ratio * 100).toFixed(0)}% du réseau.`);
    } else {
        ns.tprint("❌ Erreur : Impossible d'écrire sur le port (Bus saturé).");
    }
}