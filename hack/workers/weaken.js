/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Worker: Weaken            │
 * ╰──────────────────────────────────────────────────╯
 * Description: Script atomique de réduction de sécurité.
 */

/** @param {NS} ns */
export async function main(ns) {
    const [target, delay] = ns.args;
    
    if (!target || typeof target !== "string") {
        ns.print("❌ Cible invalide ou manquante.");
        return;
    }

    const d = Math.max(0, Math.floor(Number(delay) || 0));
    if (d > 0) await ns.sleep(d);
    
    try {
        await ns.weaken(target);
    } catch (e) {
        ns.print(`Erreur Weaken sur ${target}`);
    }
}