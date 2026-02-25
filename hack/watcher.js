/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Network Watcher   │
 * ╰──────────────────────────────────────────────────╯
 * Description: Moniteur visuel secondaire de l'état des serveurs.
 */

import { CONFIG } from "/lib/constants.js";
import { Network } from "/lib/network.js";
import { Capabilities } from "/lib/capabilities.js";

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const caps = new Capabilities(ns);
    const net = new Network(ns, caps);

    ns.ui.openTail();
    ns.ui.moveTail(10, 500);
    ns.ui.resizeTail(538, 200);

    while (true) {
        ns.clearLog();
        const targets = net.getTopTargets(5);
        
        ns.print(`--- ${CONFIG.COLORS.INFO}NEXUS MONITORING${CONFIG.COLORS.RESET} ---`);
        for (const t of targets) {
            const s = ns.getServer(t);
            const secDiff = s.hackDifficulty - s.minDifficulty;
            const sec = secDiff.toFixed(2);
            const cash = ((s.moneyAvailable / Math.max(1, s.moneyMax)) * 100).toFixed(1);
            
            let status = secDiff > 1 ? `${CONFIG.COLORS.WARN}⚠️ PREP${CONFIG.COLORS.RESET}` : `${CONFIG.COLORS.SUCCESS}💰 BATCH${CONFIG.COLORS.RESET}`;
            ns.print(`[${status}] ${t.padEnd(15)} | Sec: +${sec.padEnd(5)} | Cash: ${cash}%`);
        }
        
        await ns.sleep(2000); 
    }
}