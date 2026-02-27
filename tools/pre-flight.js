import { CONFIG } from "/lib/constants.js";
import { PortHandler } from "/core/port-handler.js";

/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V51.0 PRO - BN1 SAFE | Tool: Pre-Flight Monitor  │
 * ╰──────────────────────────────────────────────────╯
 * Description: Moniteur de progression d'augmentations.
 * Fix: Colonnes 45 chars, Branding "NEXUS", Correctif Reputation.
 */

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.ui.resizeTail(1050, 750);

    const FILE_PATH = "data/todo.json";
    const STOCK_PORT = CONFIG.PORTS.STOCK_DATA || 5;
    const MULTIPLIER = 1.9;
    const AUG_PER_RUN = 10; 
    const ph = new PortHandler(ns);

    const banner = `
    ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
    ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
    ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
    ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
    ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
    ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
    >> NEXUS v51.0 | PRE-FLIGHT MONITOR | PROJECT DAEDALUS <<
    `;

    if (!ns.fileExists(FILE_PATH)) {
        ns.print("❌ ERREUR: data/todo.json manquant.");
        return;
    }

    while (true) {
        ns.clearLog();
        ns.print(banner);

        let data;
        try { data = JSON.parse(ns.read(FILE_PATH)); } catch (e) { await ns.sleep(2000); continue; }
        
        const cash = ns.getServerMoneyAvailable("home");
        let stockValue = 0;
        const stockRaw = ph.peek(STOCK_PORT);
        if (stockRaw !== "NULL PORT DATA") {
            try { stockValue = JSON.parse(stockRaw).value || 0; } catch (e) {}
        }
        const totalCapital = cash + stockValue;

        ns.print(`====== 🚀 CAPITAUX DISPONIBLES : $${ns.formatNumber(totalCapital)} ======`);
        ns.print(`       (Cash: $${ns.formatNumber(cash)} | Bourse: $${ns.formatNumber(stockValue)})`);
        ns.print("");
        
        const header = ` STATUT | ID  | ${"NOM DE L'AUGMENTATION".padEnd(45)} | REPUTATION   | PRIX ESTIMÉ `;
        const sep    = `--------|-----|-${"-".repeat(45)}-|--------------|-------------`;
        
        ns.print(header);
        ns.print(sep);
        
        let pending = data.filter(a => !a.bought && !a.name.includes("NeuroFlux")).sort((a,b) => a.price - b.price);
        let runs = [];
        for (let i = 0; i < pending.length; i += AUG_PER_RUN) runs.push(pending.slice(i, i + AUG_PER_RUN));

        let runCount = 1;
        for (let run of runs) {
            ns.print(`──────|─────|─── 🌀 RUN #${runCount} ───|──────────────|─────────────`);
            run.sort((a, b) => b.price - a.price);
            let cumulativeCost = 0;

            for (let i = 0; i < run.length; i++) {
                let aug = run[i];
                let adjustedPrice = aug.price * Math.pow(MULTIPLIER, i);
                cumulativeCost += adjustedPrice;

                let prereqMissing = (aug.prereqs || []).some(pReq => {
                    const p = data.find(x => x.name === pReq);
                    return p && !p.bought;
                });

                let statusIcon = prereqMissing ? "  🔒  " : (totalCapital >= cumulativeCost ? "  ✅  " : "  ❌  ");
                const id = `#${(i + 1).toString().padStart(2, '0')}`;
                const nameStr = aug.name.substring(0, 44).padEnd(44) + (prereqMissing ? "*" : " ");
                const rep = ns.formatNumber(aug.rep, 2).padStart(12);
                const price = `$${ns.formatNumber(adjustedPrice, 2)}`.padStart(11);

                ns.print(`${statusIcon} | ${id} | ${nameStr} | ${rep} | ${price}`);
            }
            ns.print(`  ${" ".repeat(60)} Total Run : $${ns.formatNumber(cumulativeCost, 2)}`);
            runCount++;
        }
        ns.print(sep);
        ns.print(` Légende : ✅ Prêt | ❌ Trop cher | 🔒 Prérequis manquant `);
        await ns.sleep(2000);
    }
}