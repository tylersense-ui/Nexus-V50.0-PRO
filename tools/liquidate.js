/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Tool: Panic Liquidate     │
 * ╰──────────────────────────────────────────────────╯
 * Description: Vente d'urgence du portefeuille boursier.
 */

/** @param {NS} ns */
export async function main(ns) {
    if (!ns.args.includes("--force")) {
        ns.tprint("⚠️ [ATTENTION] Cette action va vendre toutes vos actions immédiatement !");
        ns.tprint("Utilisez: run /tools/liquidate.js --force");
        return;
    }

    if (!ns.stock.hasTIXAPIAccess()) {
        ns.tprint("❌ Accès API TIX manquant. Impossible de liquider.");
        return;
    }
    
    let totalLiquidation = 0;
    for (const sym of ns.stock.getSymbols()) {
        const [shares] = ns.stock.getPosition(sym);
        if (shares > 0) {
            const price = ns.stock.sellStock(sym, shares);
            totalLiquidation += (shares * price);
            ns.tprint(`Vendu ${shares} de ${sym} pour $${ns.formatNumber(shares * price)}`);
        }
    }
    
    if (totalLiquidation > 0) {
        ns.tprint(`✅ Liquidation terminée. Total récupéré : $${ns.formatNumber(totalLiquidation)}`);
    } else {
        ns.tprint(`ℹ️ Portefeuille vide. Aucune action n'a été vendue.`);
    }
}