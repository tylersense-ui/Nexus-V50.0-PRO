/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V51.0 PRO - BN1 SAFE | Module: Server Manager    │
 * ╰──────────────────────────────────────────────────╯
 * Description: Gestionnaire d'infrastructure matérielle (Achat et Upgrade).
 * Fix: Seuils de sécurité dynamiques scalables pour l'Early Game.
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    const log = new Logger(ns, "INFRA");
    
    // Fallback au cas où PSERV_PREFIX manque dans la config
    const PSERV_PREFIX = (CONFIG.MANAGERS && CONFIG.MANAGERS.PSERV_PREFIX) ? CONFIG.MANAGERS.PSERV_PREFIX : "nexus-node-";
    const MAX_SERVERS = ns.getPurchasedServerLimit();
    const GLOBAL_MAX_RAM = ns.getPurchasedServerMaxRam();

    log.info("Lancement du Server Manager dynamique.");

    while (true) {
        const cash = ns.getServerMoneyAvailable("home");
        let safetyMargin = 0;
        let budgetMultiplier = 0.5; // On utilise 50% du surplus par défaut

        // --- NOUVEAUX SEUILS DYNAMIQUES ---
        if (cash > 1e15) {
            // Late Game (> 1 Quadrillion) : On protège 90% pour la bourse/Daedalus
            safetyMargin = cash * 0.90;
            budgetMultiplier = 0.1;
        } else if (cash > 1e11) {
            // Mid Game (> 100 Milliards) : On garde 10 Milliards de sécurité fixes
            safetyMargin = 10e9; 
            budgetMultiplier = 0.2;
        } else {
            // Early Game : On garde 1 Million ou 20% de notre cash (le plus grand des deux)
            safetyMargin = Math.max(1e6, cash * 0.20);
            budgetMultiplier = 0.5; // On investit 50% du reste de façon agressive
        }

        let budget = Math.max(0, (cash - safetyMargin) * budgetMultiplier); 

        if (budget <= 0) {
            await ns.sleep(10000);
            continue;
        }

        let pservs = ns.getPurchasedServers();

        // 1. ACHAT INITIAL (Remplir les slots vides d'abord)
        if (pservs.length < MAX_SERVERS) {
            const cost = ns.getPurchasedServerCost(8); // Le strict minimum pour démarrer
            if (budget >= cost) {
                let name = `${PSERV_PREFIX}${pservs.length}`;
                if (ns.purchaseServer(name, 8)) {
                    log.success(`Nouveau node : ${name} (8GB)`);
                }
            }
        } 
        // 2. UPGRADE (Améliorer le plus faible)
        else {
            let target = pservs
                .map(s => ({ name: s, ram: ns.getServerMaxRam(s) }))
                .filter(s => s.ram < GLOBAL_MAX_RAM)
                .sort((a, b) => a.ram - b.ram)[0]; 

            if (target) {
                const nextRam = target.ram * 2;
                const upgradeCost = ns.getPurchasedServerUpgradeCost(target.name, nextRam);

                if (budget >= upgradeCost) {
                    if (ns.upgradePurchasedServer(target.name, nextRam)) {
                        log.info(`Node ${target.name} amélioré à ${ns.formatRam(nextRam)}`);
                    }
                }
            }
        }
        
        // Boucle courte (1s) pour enchaîner les achats si on a beaucoup d'argent d'un coup
        // Sinon, la condition `budget <= 0` gérera la longue attente de 10s.
        await ns.sleep(1000); 
    }
}