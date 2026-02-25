/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Sleeve Manager    │
 * ╰──────────────────────────────────────────────────╯
 * Description: Pilotage optimisé des Clones (SF10).
 */

import { CONFIG } from "/lib/constants.js";

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    
    try { 
        ns.sleeve.getNumSleeves(); 
    } 
    catch { 
        ns.print("❌ Erreur : API Sleeve non disponible. (SF10 requis)"); 
        return; 
    }

    const numSleeves = ns.sleeve.getNumSleeves();
    ns.print(`🚀 Nexus Sleeve-Master V50.0 : Gestion de ${numSleeves} unités.`);

    while (true) {
        for (let i = 0; i < numSleeves; i++) {
            const stats = ns.sleeve.getSleeve(i);

            // 1. RÉDUCTION DU SHOCK (Priorité absolue)
            if (stats.shock > 0) {
                ns.sleeve.setToShockRecovery(i);
                continue;
            }

            // 2. SYNCHRONISATION (Priorité 2)
            if (stats.sync < 100) {
                ns.sleeve.setToSynchronize(i);
                continue;
            }

            // 3. ACHAT D'AUGMENTATIONS (Si beaucoup de cash)
            const purchasable = ns.sleeve.getSleevePurchasableAugs(i);
            for (const aug of purchasable) {
                if (ns.getServerMoneyAvailable("home") > aug.cost * 50) { 
                    ns.sleeve.purchaseSleeveAug(i, aug.name);
                }
            }

            // 4. ASSIGNATION À LA RÉPUTATION OU CRIMES (Une fois Shock/Sync réglés)
            // Assigne par défaut au crime "Homicide" si en attente
            if (ns.sleeve.getTask(i) === null) {
                ns.sleeve.setToCommitCrime(i, "Homicide");
            }
        }

        await ns.sleep(5000); // FIX VITAL : Empêche la boucle infinie
    }
}