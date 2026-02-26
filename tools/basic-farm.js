/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Tool: Basic Farm          │
 * ╰──────────────────────────────────────────────────╯
 * Description: Attaque séquentielle simple (Early Game).
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const target = ns.args[0] || "joesguns";
    
    ns.tprint(`🚀 Focus exclusif sur : ${target}`);

    while (true) {
        if (ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target)) {
            if (!ns.hasRootAccess(target)) {
                try { ns.nuke(target); } catch {}
            }

            // Stratégie simple : Sécurité d'abord, Argent ensuite
            if (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target) + 2) {
                await ns.weaken(target);
            } else if (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) * 0.9) {
                await ns.grow(target);
            } else {
                await ns.hack(target);
            }
        } else {
            ns.tprint(`❌ Niveau de hacking trop faible pour ${target}`);
            return;
        }
        await ns.sleep(100); // Correction sécurisée de l'API
    }
}