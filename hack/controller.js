/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Unified Controller│
 * ╰──────────────────────────────────────────────────╯
 * Description: Dispatcher central des threads d'exécution.
 */

import { PortHandler } from "/core/port-handler.js";
import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const log = new Logger(ns, "CONTROLLER");
    const ph = new PortHandler(ns);
    const COMMAND_PORT = CONFIG.PORTS.COMMANDS;
    
    const deployedNodes = new Set();
    const WORKER_FILES = [
        "/hack/workers/hack.js", 
        "/hack/workers/grow.js", 
        "/hack/workers/weaken.js", 
        "/hack/workers/share.js"
    ];

    log.info(`Écoute active sur le Port ${COMMAND_PORT}...`);

    while (true) {
        let job = ph.readJSON(COMMAND_PORT);
        
        if (job && job.threads > 0) {
            const scriptPath = `/hack/workers/${job.type}.js`;

            // Garde de sécurité : on ignore si on a pas les droits d'administration
            if (job.host !== "home" && !ns.hasRootAccess(job.host)) {
                log.warn(`Accès root manquant sur ${job.host}. Job ignoré.`);
                continue;
            }

            // Déploiement paresseux (lazy deployment)
            if (job.host !== "home" && !deployedNodes.has(job.host)) {
                await ns.scp(WORKER_FILES, job.host, "home");
                deployedNodes.add(job.host);
            }

            // Exécution avec Salt pour autoriser le multi-threading simultané
            let pid = ns.exec(scriptPath, job.host, job.threads, job.target || "network", job.delay || 0, Math.random());

            // Backoff adaptatif limité pour éviter le busy-wait
            let retries = 0;
            const MAX_RETRIES = 5;
            while (pid === 0 && retries < MAX_RETRIES) {
                await ns.sleep(100); 
                pid = ns.exec(scriptPath, job.host, job.threads, job.target || "network", job.delay || 0, Math.random());
                retries++;
            }

            if (pid === 0) {
                log.warn(`Job droppé après ${MAX_RETRIES} tentatives : [${job.type}] sur ${job.host} (${job.threads}t) → RAM insuffisante ?`);
            }
        }
        await ns.sleep(50); // Boucle optimisée pour le CPU
    }
}