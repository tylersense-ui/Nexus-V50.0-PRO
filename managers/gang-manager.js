/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Gang Manager      │
 * ╰──────────────────────────────────────────────────╯
 * Description: Gestionnaire autonome du Syndicat.
 */

import { CONFIG } from "/lib/constants.js";

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    
    try {
        if (!ns.gang.inGang()) {
            ns.print("❌ Pas encore dans un gang. (BN2 requis ou Karma insuffisant)");
            return;
        }
    } catch (e) {
        ns.print("❌ API Gang non disponible dans cette BitNode.");
        return;
    }

    ns.print("🚀 Nexus Gang-Master V50.0 : Initialisation...");
    const isHackingGang = ns.gang.getGangInformation().isHacking;

    while (true) {
        const myGang = ns.gang.getGangInformation();
        const memberNames = ns.gang.getMemberNames();

        // 1. RECRUTEMENT AUTOMATIQUE
        if (ns.gang.canRecruitMember()) {
            const newName = `Nexus-${memberNames.length + 1}`;
            if (ns.gang.recruitMember(newName)) {
                ns.print(`[RECRUTEMENT] Bienvenue à ${newName}`);
            }
        }

        // 2. GESTION INDIVIDUELLE DES MEMBRES
        for (const name of memberNames) {
            const info = ns.gang.getMemberInformation(name);

            // ASSIGNATION DES TÂCHES
            if (myGang.wantedLevel > 1.1 && (myGang.wantedPenalty < 0.85)) {
                ns.gang.setMemberTask(name, isHackingGang ? "Ethical Hacking" : "Vigilante Justice");
            } 
            else if ((isHackingGang ? info.hack : info.str) < 50) {
                ns.gang.setMemberTask(name, isHackingGang ? "Train Hacking" : "Train Combat");
            }
            else {
                const idx = memberNames.indexOf(name);
                if (idx < 3) {
                    ns.gang.setMemberTask(name, isHackingGang ? "Cyberterrorism" : "Terrorism");
                } else {
                    ns.gang.setMemberTask(name, isHackingGang ? "Money Laundering" : "Human Trafficking");
                }
            }
        }

        // 3. GUERRE DE TERRITOIRE (> 85% de chances de gagner)
        const others = ns.gang.getOtherGangInformation();
        let canWinWar = true;
        for (const otherGang in others) {
            if (otherGang === myGang.faction) continue;
            if (ns.gang.getChanceToWinClash(otherGang) < 0.85) {
                canWinWar = false;
                break;
            }
        }
        ns.gang.setTerritoryWarfare(canWinWar);

        await ns.sleep(5000); // FIX VITAL : Empêche la boucle infinie
    }
}