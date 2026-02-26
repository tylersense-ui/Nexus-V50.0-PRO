/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Tool: Pre-Flight Monitor  │
 * ╰──────────────────────────────────────────────────╯
 * Description: Moniteur de progression d'augmentations.
 */

import { CONFIG } from "/lib/constants.js";
import { PortHandler } from "/core/port-handler.js";

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.ui.resizeTail(755, 680);

    const FILE_PATH = "data/todo.json";
    const STOCK_PORT = CONFIG.PORTS.STOCK_DATA || 5;
    const MULTIPLIER = 1.9;
    const AUG_PER_RUN = 10; 
    const ph = new PortHandler(ns);

    if (!ns.fileExists(FILE_PATH)) {
        ns.print("❌ ERREUR: data/todo.json manquant. Lancez l'importer d'abord.");
        return;
    }

    while (true) {
        ns.clearLog();
        
        let data;
        try {
            data = JSON.parse(ns.read(FILE_PATH));
        } catch (e) {
            ns.print("❌ ERREUR: Fichier todo.json corrompu.");
            await ns.sleep(2000);
            continue;
        }

        const cash = ns.getServerMoneyAvailable("home");
        let stockValue = 0;
        
        const stockRaw = ph.peek(STOCK_PORT);
        if (stockRaw !== "NULL PORT DATA") {
            try { stockValue = JSON.parse(stockRaw).value || 0; } catch (e) { }
        }
        const totalCapital = cash + stockValue;

        let pending = data.filter(aug => !aug.bought);
        let boughtCount = data.length - pending.length;
        
        pending.sort((a, b) => b.price - a.price);

        const progress = (boughtCount / data.length) * 100;
        const barSize = 30;
        const fill = Math.round((progress / 100) * barSize);
        const bar = `[${"█".repeat(fill)}${"░".repeat(barSize - fill)}]`;

        ns.print(`─── NEXUS-APEX PRE-FLIGHT V50.0 ────────────────────────────────`);
        ns.print(`📊 PROGRESSION BN : ${bar} ${boughtCount}/${data.length} (${progress.toFixed(1)}%)`);
        ns.print(`─────────────────────────────────────────────────────────────────────────────`);
        ns.print(` STAT | ID | ${"NOM DE L'AUGMENTATION".padEnd(35)} | RÉP. REQ     | PRIX AJUSTÉ`);
        ns.print(`──────|────|─────────────────────────────────────|──────────────|─────────────`);

        let cumulativeCost = 0;
        let runCount = 1;
        
        for (let i = 0; i < pending.length; i++) {
            let indexInRun = i % AUG_PER_RUN;
            if (i > 0 && indexInRun === 0) {
                ns.print(`──────|────|─── COUPURE RUN ${runCount} (INFLATION MAX) ───|──────────────|─────────────`);
                runCount++;
            }

            let adjustedPrice = pending[i].price * Math.pow(MULTIPLIER, indexInRun);
            cumulativeCost += adjustedPrice;

            const hasRep = (pending[i].currentRep || 0) >= pending[i].rep;
            const hasMoney = totalCapital >= cumulativeCost;
            
            let statusIcon = "❌";
            if (hasRep && hasMoney) statusIcon = "✅";
            else if (hasRep && !hasMoney) statusIcon = "💰";
            else if (!hasRep && hasMoney) statusIcon = "📜";

            const id = `#${(i + 1).toString().padStart(2, '0')}`;
            const name = pending[i].name.substring(0, 34).padEnd(35);
            const rep = ns.nFormat(pending[i].rep || 0, "0.00a").padEnd(12);
            const price = `$${ns.nFormat(adjustedPrice, "0.00a")}`;

            ns.print(`  ${statusIcon}  | ${id} | ${name} | ${rep} | ${price}`);
        }

        ns.print(`─────────────────────────────────────────────────────────────────────────────`);
        ns.print(`💰 CAPITAL GLOBAL : ${ns.nFormat(totalCapital, "$0.000a")} (Bourse incluse)`);
        ns.print(`🎯 CONSEIL : Ne dépasse pas 10 augmentations par installation.`);
        
        await ns.sleep(2000); // FIX: Remplacement du ns.asleep
    }
}