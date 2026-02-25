/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Hack Controller   │
 * ╰──────────────────────────────────────────────────╯
 * Description: Dispatcher central écoutant le Giga-Batcher.
 */

import { CONFIG } from "/lib/constants.js";
import { PortHandler } from "/core/port-handler.js";

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const ph = new PortHandler(ns);
    const cmdPort = CONFIG.PORTS.COMMANDS;
    
    ns.print(`📡 [CONTROLLER V${CONFIG.VERSION}] Écoute sur le port ${cmdPort}...`);

    while (true) {
        while (!ph.isEmpty(cmdPort)) {
            const job = ph.readJSON(cmdPort);
            if (!job) continue;

            const scriptPath = `/hack/workers/${job.type}.js`;
            const host = job.host;
            const target = job.target || "network";
            const threads = job.threads;
            const delay = job.delay || 0;
            const uuid = crypto.randomUUID(); // Évite l'écrasement des processus identiques

            // Vérification et copie du script worker si absent sur le node
            if (host !== "home" && !ns.fileExists(scriptPath, host)) {
                ns.scp(scriptPath, host, "home");
            }

            // Exécution du job (le Try/Catch évite le crash si la RAM a été consommée entre temps)
            try {
                ns.exec(scriptPath, host, threads, target, delay, uuid);
            } catch (e) {
                ns.print(`⚠️ Échec de l'assignation sur ${host} (${threads}t de ${job.type})`);
            }
        }
        await ns.sleep(10); // Boucle ultra-rapide pour ne pas désynchroniser les batchs
    }
}