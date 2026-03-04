/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Orchestrator      │
 * ╰──────────────────────────────────────────────────╯
 * Description: Démarreur système et gardien du réseau.
 */

import { CONFIG } from "/lib/constants.js";
import { Network } from "/lib/network.js";
import { Capabilities } from "/lib/capabilities.js";

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const caps = new Capabilities(ns);
    const net = new Network(ns, caps);

    ns.tprint(`🔧 [${CONFIG.COLORS.INFO}NEXUS-APEX V${CONFIG.VERSION}${CONFIG.COLORS.RESET}] : Initialisation du Kernel...`);

    // Liste dynamique des modules à lancer
    const modules = [
        { name: "CONTROLLER", path: "/hack/controller.js" },
        { name: "BATCHER",    path: "/core/batcher.js" },
        { name: "DASHBOARD",  path: "/core/dashboard.js" },
        { name: "STOCK",      path: "/managers/stock-master.js" },
        { name: "SERVER",     path: "/managers/server-manager.js" },
        { name: "HACKNET",    path: "/managers/hacknet-manager.js" }
    ];

    // Lancement de Singularity uniquement si l'API est débloquée et le fichier présent
    if (caps.singularity && ns.fileExists("/managers/singularity.js")) {
        modules.push({ name: "SINGULARITY", path: "/managers/singularity.js" });
    }

    for (const mod of modules) {
        if (ns.fileExists(mod.path)) {
            if (!ns.scriptRunning(mod.path, "home")) {
                ns.print(`🚀 Démarrage du module: ${mod.name}`);
                ns.run(mod.path, 1);
            }
        } else {
            ns.print(`❌ AVERTISSEMENT : Module ${mod.name} introuvable (${mod.path})`);
        }
    }

    ns.tprint(`✅ [${CONFIG.COLORS.SUCCESS}KERNEL EN LIGNE${CONFIG.COLORS.RESET}] Surveillance du réseau activée.`);

    // Boucle de maintien d'accès (Rooting persistant)
    while (true) {
        const targets = net.refresh().filter(n => !ns.hasRootAccess(n));
        for (const target of targets) {
            if (net.crack(target)) {
                ns.print(`🔓 ROOT OBTENU : Accès système sécurisé sur [${target}]`);
            }
        }
        await ns.sleep(60000); // Remplacement de ns.asleep
    }
}