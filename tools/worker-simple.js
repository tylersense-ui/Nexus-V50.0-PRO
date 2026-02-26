/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Tool: Worker Simple       │
 * ╰──────────────────────────────────────────────────╯
 * Description: Payload déployable pour la ferme basique.
 */

/** @param {NS} ns */
export async function main(ns) {
    const t = ns.args[0];
    if (!t) return;

    while(true) {
        if (ns.getServerSecurityLevel(t) > ns.getServerMinSecurityLevel(t) + 2) {
            await ns.weaken(t);
        } else if (ns.getServerMoneyAvailable(t) < ns.getServerMaxMoney(t) * 0.8) {
            await ns.grow(t);
        } else {
            await ns.hack(t);
        }
        await ns.sleep(50); // Empêche le blocage du thread principal
    }
}