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
 * Fix: Tri global croissant (Runs), Tri interne décroissant (Ordre d'achat) + Prérequis.
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
        try { data = JSON.parse(ns.read(FILE_PATH)); } catch (e) { await ns.sleep(2000); continue; }
        
        const cash = ns.getServerMoneyAvailable("home");
        let stockValue = 0;
        const stockRaw = ph.peek(STOCK_PORT);
        if (stockRaw !== "NULL PORT DATA") {
            try { stockValue = JSON.parse(stockRaw).value || 0; } catch (e) {}
        }

        const totalCapital = cash + stockValue;
        
        ns.print(`====== 🚀 PRE-FLIGHT CHECKS (CAPITAL: $${ns.nFormat(totalCapital, "0.00a")}) ======`);
        
        let pending = data.filter(a => !a.bought && !a.name.includes("NeuroFlux"));
        
        // 1. TRI GLOBAL : Du moins cher au plus cher (pour les placer dans les premiers Runs)
        pending.sort((a, b) => a.price - b.price);

        // 2. DÉCOUPAGE EN RUNS
        let runs = [];
        for (let i = 0; i < pending.length; i += AUG_PER_RUN) {
            runs.push(pending.slice(i, i + AUG_PER_RUN));
        }

        let runCount = 1;

        for (let run of runs) {
            ns.print(`──────|────|─── RUN ${runCount} (Acheter de haut en bas) ────|────────|─────────────`);
            
            // 3. TRI INTERNE : Du plus cher au moins cher (pour limiter l'inflation)
            run.sort((a, b) => b.price - a.price);
            
            let cumulativeCost = 0;

            for (let i = 0; i < run.length; i++) {
                let aug = run[i];
                let adjustedPrice = aug.price * Math.pow(MULTIPLIER, i);
                cumulativeCost += adjustedPrice;

                const hasRep = (aug.currentRep || 0) >= aug.rep; 
                const hasMoney = totalCapital >= cumulativeCost;
                
                // Vérification des prérequis manquants
                let prereqMissing = false;
                if (aug.prereqs && aug.prereqs.length > 0) {
                    prereqMissing = aug.prereqs.some(pReq => {
                        const p = data.find(x => x.name === pReq);
                        return p && !p.bought; 
                    });
                }

                let statusIcon = "❌";
                if (prereqMissing) statusIcon = "🔒";
                else if (hasRep && hasMoney) statusIcon = "✅";
                else if (hasRep && !hasMoney) statusIcon = "💰";
                else if (!hasRep && hasMoney) statusIcon = "📜";

                const id = `#${(i + 1).toString().padStart(2, '0')}`;
                const nameStr = aug.name.substring(0, 31);
                const namePad = nameStr.padEnd(32);
                const prereqTag = prereqMissing ? "*" : " ";
                const rep = ns.nFormat(aug.rep || 0, "0.00a").padEnd(8);
                const price = `$${ns.nFormat(adjustedPrice, "0.00a")}`;

                ns.print(`  ${statusIcon}  | ${id} | ${namePad}${prereqTag}| ${rep} | ${price}`);
            }
            
            ns.print(`  ${" ".repeat(48)} Total : $${ns.nFormat(cumulativeCost, "0.00a")}`);
            runCount++;
        }

        ns.print(`\n  Légende : ✅ Prêt | 💰 Manque Cash | 📜 Manque Rep | 🔒 Prérequis manquant`);
        await ns.sleep(2000);
    }
}