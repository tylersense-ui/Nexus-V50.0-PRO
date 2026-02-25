/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Server Manager    │
 * ╰──────────────────────────────────────────────────╯
 * Description: Gestionnaire d'infrastructure matérielle (Achat et Upgrade).
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    const log = new Logger(ns, "INFRA");
    
    const PSERV_PREFIX = CONFIG.MANAGERS.PSERV_PREFIX || "nexus-node-";
    const MAX_SERVERS = 25;
    const GLOBAL_MAX_RAM = ns.getPurchasedServerMaxRam();

    log.info("Manager d'infrastructure V50.0 actif.");

    while (true) {
        const pservs = ns.getPurchasedServers();
        const cash = ns.getServerMoneyAvailable("home");
        
        // Marge de sécurité
        let safetyMargin = (cash > 1e15) ? cash * 0.9 : 100e9; 
        let budget = Math.max(0, (cash - safetyMargin) * 0.1); 

        if (budget <= 0) {
            await ns.sleep(10000);
            continue;
        }

        // ACHAT
        if (pservs.length < MAX_SERVERS) {
            const cost = ns.getPurchasedServerCost(8); // On commence doucement à 8GB
            if (budget >= cost) {
                let name = `${PSERV_PREFIX}${pservs.length}`;
                if (ns.purchaseServer(name, 8)) {
                    log.success(`Nouveau node : ${name} (8GB)`);
                }
            }
        } 
        // UPGRADE
        else {
            let target = pservs
                .map(s => ({ name: s, ram: ns.getServerMaxRam(s) }))
                .filter(s => s.ram < GLOBAL_MAX_RAM)
                .sort((a, b) => a.ram - b.ram)[0]; // Prends le plus faible

            if (target) {
                const nextRam = target.ram * 2;
                const upgradeCost = ns.getPurchasedServerUpgradeCost(target.name, nextRam);

                if (budget >= upgradeCost) {
                    if (ns.upgradePurchasedServer(target.name, nextRam)) {
                        log.info(`Node ${target.name} amélioré à ${ns.formatRam(nextRam)}`);
                    }
                }
            } else {
                log.success("Tous les serveurs sont au maximum de leurs capacités !");
                return; // Auto-fermeture pour économiser la RAM
            }
        }
        await ns.sleep(5000);
    }
}