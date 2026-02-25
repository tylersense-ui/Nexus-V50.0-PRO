/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Hacknet Manager   │
 * ╰──────────────────────────────────────────────────╯
 * Description: Gestionnaire des nœuds Hacknet pour revenu passif.
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    const log = new Logger(ns, "HNET");
    
    log.info("Manager Hacknet V50.0 actif.");

    while (true) {
        const cash = ns.getServerMoneyAvailable("home");
        const income = ns.getTotalScriptIncome()[0] || 0;
        
        // Budget de sécurité
        const safetyMargin = (income > 1e9) ? 10e9 : 1e6;
        const budget = Math.max(0, (cash - safetyMargin) * 0.3); // 30% du surplus

        if (budget <= 0) {
            await ns.sleep(10000);
            continue;
        }

        const numNodes = ns.hacknet.numNodes();

        // 1. ACHAT DE NOUVEAUX NOEUDS (Max 25 pour l'instant)
        if (numNodes < 25) {
            const cost = ns.hacknet.getPurchaseNodeCost();
            if (budget >= cost) {
                const index = ns.hacknet.purchaseNode();
                if (index !== -1) log.success(`Nouveau node acheté : hacknet-node-${index}`);
            }
        }

        // 2. OPTIMISATION DES UPGRADES (Recherche de l'amélioration la moins chère)
        let bestUpgrade = null;
        let minCost = Infinity;

        for (let i = 0; i < numNodes; i++) {
            const upgrades = [
                { type: "level", cost: ns.hacknet.getLevelUpgradeCost(i, 10) },
                { type: "ram", cost: ns.hacknet.getRamUpgradeCost(i, 2) },
                { type: "cores", cost: ns.hacknet.getCoreUpgradeCost(i, 1) }
            ];

            for (const up of upgrades) {
                if (up.cost < budget && up.cost < minCost) {
                    minCost = up.cost;
                    bestUpgrade = { id: i, type: up.type };
                }
            }
        }

        if (bestUpgrade) {
            if (bestUpgrade.type === "level") ns.hacknet.upgradeLevel(bestUpgrade.id, 10);
            else if (bestUpgrade.type === "ram") ns.hacknet.upgradeRam(bestUpgrade.id, 2);
            else if (bestUpgrade.type === "cores") ns.hacknet.upgradeCore(bestUpgrade.id, 1);
        }

        await ns.sleep(2000); // Boucle de vérification
    }
}