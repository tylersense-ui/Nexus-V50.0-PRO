/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Worker: HACK              │
 * ╰──────────────────────────────────────────────────╯
 * Description: Script atomique de prélèvement financier.
 */

/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];
    const delay = ns.args[1] || 0;
    // ns.args[2] est le UUID, on n'a pas besoin de l'utiliser dans le code, 
    // il sert juste à Bitburner pour différencier les processus.

    if (delay > 0) await ns.sleep(delay); // Correction critique: ns.sleep()
    await ns.hack(target);
}