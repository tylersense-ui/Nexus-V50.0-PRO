/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Singularity       │
 * ╰──────────────────────────────────────────────────╯
 * Description: Pilote l'avatar du joueur (Travail, Factions, Crimes).
 */

import { Logger } from "/lib/logger.js";
import { CONFIG } from "/lib/constants.js";

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    const log = new Logger(ns, "SINGULARITY");

    try {
        ns.singularity.getOwnedAugmentations();
    } catch (e) {
        log.error("API Singularity (SF4) non disponible. Arrêt du manager.");
        return;
    }
    
    log.info("Manager Singularity V50.0 actif.");

    while (true) {
        // 1. Gestion des Factions (Acceptation automatique)
        const invites = ns.singularity.checkFactionInvitations();
        for (const faction of invites) {
            if (CONFIG.MANAGERS.AUTO_JOIN_FACTIONS) {
                ns.singularity.joinFaction(faction);
                log.success(`Nouvelle faction rejointe : ${faction}`);
            }
        }

        // 2. Logique d'activité (Priorité : Stats > Réputation)
        const player = ns.getPlayer();
        const currentWork = ns.singularity.getCurrentWork();

        if (!currentWork) {
            if (player.skills.hacking < 50) {
                ns.singularity.commitCrime("Mug");
            } else {
                const factions = player.factions;
                if (factions.length > 0) {
                    ns.singularity.workForFaction(factions[factions.length - 1], "Hacking Contracts", false);
                } else {
                    ns.singularity.commitCrime("Homicide"); 
                }
            }
        }

        // 3. Achat d'Augmentations (Mise en file d'attente)
        autoBuyAugmentations(ns, log);

        await ns.sleep(10000); // Correction du ns.asleep
    }
}

/**
 * Tente d'acheter les augmentations disponibles.
 * @param {NS} ns 
 * @param {Logger} log 
 */
function autoBuyAugmentations(ns, log) {
    const player = ns.getPlayer();
    for (const faction of player.factions) {
        const augs = ns.singularity.getAugmentationsFromFaction(faction);
        for (const aug of augs) {
            if (aug === "NeuroFlux Governor") continue; 
            
            const cost = ns.singularity.getAugmentationPrice(aug);
            const repNeeded = ns.singularity.getAugmentationRepReq(aug);
            const currentRep = ns.singularity.getFactionRep(faction);

            if (player.money >= cost && currentRep >= repNeeded) {
                const owned = ns.singularity.getOwnedAugmentations(true);
                if (!owned.includes(aug)) {
                    if (ns.singularity.purchaseAugmentation(faction, aug)) {
                        log.success(`Augmentation achetée : ${aug} chez ${faction}`);
                    }
                }
            }
        }
    }
}