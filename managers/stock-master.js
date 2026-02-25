/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Stock Master      │
 * ╰──────────────────────────────────────────────────╯
 * Description: Gestionnaire autonome du marché boursier (TIX/4S).
 */

import { CONFIG } from "/lib/constants.js";
import { PortHandler } from "/core/port-handler.js";

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const ph = new PortHandler(ns);
    const DATA_PORT = CONFIG.PORTS.STOCK_DATA || 5; 

    // Vérification propre sans générer d'erreurs en BN1
    try {
        if (!ns.stock.hasTIXAPIAccess()) {
            ns.print("❌ Accès API TIX manquant. Le Stock Master se met en veille.");
            return;
        }
    } catch (e) {
        return; // Le module Bourse n'est pas débloqué dans le jeu
    }

    let has4S = false;
    try { 
        ns.stock.getForecast("FSIG"); 
        has4S = true; 
    } catch {}

    async function waitForMarketTick() {
        const sym = "FSIG";
        const initialPrice = ns.stock.getPrice(sym);
        while (ns.stock.getPrice(sym) === initialPrice) {
            await ns.sleep(200);
        }
    }

    ns.print(`📈 Nexus Stock-Master V50.0 (4S: ${has4S ? "OUI" : "NON"})`);

    while (true) {
        let totalValue = 0;
        let activePositions = 0;
        const reserve = 50e6; // Garde 50M de liquidités minimum

        const symbols = ns.stock.getSymbols();

        for (const sym of symbols) {
            const [shares] = ns.stock.getPosition(sym);
            const currentPrice = ns.stock.getBidPrice(sym);
            
            if (shares > 0) {
                totalValue += (shares * currentPrice);
                activePositions++;
            }

            if (!has4S) continue; // Sans 4S, on fait juste du monitoring

            const forecast = ns.stock.getForecast(sym);
            
            if (shares > 0 && forecast < 0.5) {
                ns.stock.sellStock(sym, shares);
            }
            
            if (forecast >= 0.6) {
                const cashAvailable = ns.getServerMoneyAvailable("home") - reserve;
                if (cashAvailable > 0) {
                    const maxShares = ns.stock.getMaxShares(sym);
                    const canBuy = Math.min(maxShares - shares, Math.floor(cashAvailable / ns.stock.getAskPrice(sym)));
                    
                    if (canBuy > 0 && (canBuy * ns.stock.getAskPrice(sym)) > 5e6) {
                        ns.stock.buyStock(sym, canBuy);
                    }
                }
            }
        }

        // Diffusion de la valeur pour le Dashboard
        ph.clear(DATA_PORT);
        ph.writeJSON(DATA_PORT, { value: totalValue, active: activePositions });

        await waitForMarketTick();
    }
}