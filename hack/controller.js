/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.3 PRO - BN1 SAFE | Module: Unified Controller│
 * ╰──────────────────────────────────────────────────╯
 * Description: Dispatcher central des threads d'exécution.
 * Fix: Dépilement asynchrone total (No-Sleep Queueing).
 */

import { PortHandler } from "/core/port-handler.js";
import { CONFIG } from "/lib/constants.js";

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const ph = new PortHandler(ns);
    const COMMAND_PORT = CONFIG.PORTS.COMMANDS;
    const deployedNodes = new Set();
    const WORKER_FILES = [
        "/hack/workers/hack.js", 
        "/hack/workers/grow.js", 
        "/hack/workers/weaken.js", 
        "/hack/workers/share.js"
    ];

    ns.print(`🚀 [${CONFIG.COLORS.INFO}CONTROLLER V50.3${CONFIG.COLORS.RESET}] : Dépilement asynchrone activé.`);

    while (true) {
        // Vider intégralement la file d'attente AVANT de faire une pause
        while (!ph.isEmpty(COMMAND_PORT)) {
            let job = ph.readJSON(COMMAND_PORT);
            if (!job || job.threads <= 0) continue;

            if (job.host !== "home" && !ns.hasRootAccess(job.host)) continue;

            if (job.host !== "home" && !deployedNodes.has(job.host)) {
                await ns.scp(WORKER_FILES, job.host, "home");
                deployedNodes.add(job.host);
            }

            const scriptPath = `/hack/workers/${job.type}.js`;
            const pid = ns.exec(scriptPath, job.host, job.threads, job.target || "network", job.delay || 0, crypto.randomUUID());
            
            if (pid === 0) ns.print(`⚠️ RAM insuffisante sur ${job.host} pour ${job.threads}t ${job.type}`);
        }
        await ns.sleep(20); // Respiration ultra-courte quand le port est vide
    }
}