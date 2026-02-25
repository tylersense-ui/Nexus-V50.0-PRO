/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Program Manager   │
 * ╰──────────────────────────────────────────────────╯
 * Description: Acquisition de l'arsenal de piratage.
 */

import { CONFIG } from "/lib/constants.js";
import { Logger } from "/lib/logger.js";
import { Capabilities } from "/lib/capabilities.js";

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    const log = new Logger(ns, "CRACK");
    const caps = new Capabilities(ns);

    const PROGRAMS = [
        { name: "BruteSSH.exe", price: 500000 },
        { name: "FTPCrack.exe", price: 1500000 },
        { name: "relaySMTP.exe", price: 5000000 },
        { name: "HTTPWorm.exe", price: 30000000 },
        { name: "SQLInject.exe", price: 250000000 },
        { name: "Formulas.exe", price: 5000000000 }
    ];

    log.info("Manager d'Arsenal V50.0 actif...");

    while (true) {
        caps.update();
        const cash = ns.getServerMoneyAvailable("home");
        const hasTor = ns.hasTorRouter(); // Fonction native plus propre

        // 1. ACHAT DU ROUTEUR TOR
        if (!hasTor && cash > 200000) {
            if (caps.singularity) {
                if (ns.singularity.purchaseTor()) log.success("Accès Darkweb (TOR) débloqué.");
            } else {
                log.warn("TOR manquant. Achetez-le manuellement sur le terminal urbain.");
            }
        }

        // 2. ACHAT DES PROGRAMMES
        if (hasTor) {
            for (const prog of PROGRAMS) {
                if (!ns.fileExists(prog.name, "home") && cash >= prog.price) {
                    if (caps.singularity) {
                        if (ns.singularity.purchaseProgram(prog.name)) log.success(`Programme ${prog.name} acquis.`);
                    }
                }
            }
        }

        // 3. AUTO-DESTRUCTION SI TOUT EST ACHETÉ
        const allBought = PROGRAMS.every(p => ns.fileExists(p.name, "home"));
        if (allBought) {
            log.success("Arsenal complet. Fin du processus.");
            return;
        }

        await ns.sleep(15000);
    }
}