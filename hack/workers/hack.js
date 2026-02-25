/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Worker: Hack              │
 * ╰──────────────────────────────────────────────────╯
 * Description: Script atomique de prélèvement d'argent.
 */

/** @param {NS} ns */
export async function main(ns) {
    const [target, delay] = ns.args;
    
    // Garde de sécurité
    if (!target || typeof target !== "string") {
        ns.print("❌ Cible invalide ou manquante.");
        return;
    }

    const d = Math.max(0, Math.floor(Number(delay) || 0));
    if (d > 0) await ns.sleep(d);
    
    try {
        await ns.hack(target);
    } catch (e) {
        ns.print(`Erreur Hack sur ${target}`);
    }
}