/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.5.1 PRO - BN1 SAFE | Module: Dashboard UI    │
 * ╰──────────────────────────────────────────────────╯
 * Description: Interface de monitoring en temps réel.
 * Patch: Sécurisation stricte des calculs de RAM contre les NaN.
 */

import { CONFIG } from "/lib/constants.js";
import { Network } from "/lib/network.js";
import { Capabilities } from "/lib/capabilities.js";
import { PortHandler } from "/core/port-handler.js";

/** * Point d'entrée principal du Dashboard.
 * @param {NS} ns - L'API Netscript de Bitburner.
 */
export async function main(ns) {
    // Initialisation de l'interface
    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.ui.moveTail(10, 10);
    ns.ui.resizeTail(520, 560);

    // Instanciation des classes utilitaires
    const caps = new Capabilities(ns);
    const net = new Network(ns, caps);
    const ph = new PortHandler(ns);
    
    // Initialisation des métriques de session
    const startMoney = Number(ns.getPlayer().money) || 0;
    const startTime = Date.now();
    let lastXp = Number(ns.getPlayer().exp.hacking) || 0;
    let maxProfit = 0;

    // Cache pour limiter l'impact CPU des itérations lourdes (ex: ns.ps())
    let tick = 0;
    let cachedTH = 0, cachedTG = 0, cachedTW = 0, cachedTS = 0;
    let cachedUsedRam = 0, cachedMaxRam = 0;

    /**
     * Formate les millisecondes en un temps lisible (Jours, Heures, Minutes, Secondes).
     * @param {number} ms - Le temps en millisecondes.
     * @returns {string} Le temps formaté.
     */
    const formatTimeShort = (ms) => {
        let s = Math.floor(ms / 1000);
        const d = Math.floor(s / 86400); s %= 86400;
        const h = Math.floor(s / 3600); s %= 3600;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${d > 0 ? d + 'd ' : ''}${h > 0 ? h + 'h ' : ''}${m}m ${sec}s`;
    };

    /**
     * Formate un ETA (Estimated Time of Arrival) strict.
     * @param {number} ms - Le temps en millisecondes.
     * @returns {string} Format MMm SSs.
     */
    const formatEta = (ms) => {
        if (!ms || ms <= 0) return "00m 00s";
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        return `${(m % 60).toString().padStart(2, '0')}m ${(s % 60).toString().padStart(2, '0')}s`;
    };

    // Boucle principale du dashboard
    while (true) {
        ns.clearLog();
        caps.update(); // Met à jour les capacités dynamiques (ex: achat d'API)
        
        const player = ns.getPlayer();
        const allServers = net.refresh();
        // Sécurisation de la récupération du préfixe des serveurs persos
        const pservPrefix = CONFIG?.MANAGERS?.PSERV_PREFIX || "pserv";
        const pservs = allServers.filter(s => s.startsWith(pservPrefix));
        
        // Rafraîchissement des processus lourds 1 fois sur 5 (Optimisation CPU)
        if (tick % 5 === 0) {
            cachedUsedRam = 0; 
            cachedMaxRam = 0;
            cachedTH = 0; cachedTG = 0; cachedTW = 0; cachedTS = 0;

            for (const host of allServers) {
                if (!ns.hasRootAccess(host)) continue;
                
                // Sécurisation stricte de la RAM (prévention des NaN)
                let sMax = Number(ns.getServerMaxRam(host)) || 0;
                let sUsed = Number(ns.getServerUsedRam(host)) || 0;
                
                if (host === "home") {
                    const reservedHomeRam = Number(CONFIG?.HACKING?.RESERVED_HOME_RAM) || 0;
                    sMax = Math.max(0, sMax - reservedHomeRam);
                }

                cachedUsedRam += sUsed;
                cachedMaxRam += sMax;
                
                // Comptage des threads avec protection contre les processus mal formés
                const processes = ns.ps(host) || [];
                processes.forEach(p => {
                    const fname = (p.filename || "").toLowerCase();
                    const threads = Number(p.threads) || 0;
                    
                    if (fname.includes("hack.js")) cachedTH += threads;
                    else if (fname.includes("grow.js")) cachedTG += threads;
                    else if (fname.includes("weaken.js")) cachedTW += threads;
                    else if (fname.includes("share.js")) cachedTS += threads;
                });
            }
        }
        tick++;

        // Calculs des métriques dynamiques (Profits et XP)
        const runtime = (Date.now() - startTime) / 1000;
        const currentMoney = Number(player.money) || 0;
        const currentProfit = (currentMoney - startMoney) / Math.max(1, runtime);
        if (currentProfit > maxProfit) maxProfit = currentProfit;

        const currentXp = Number(player.exp.hacking) || 0;
        const xpRate = Math.max(0, currentXp - lastXp);
        lastXp = currentXp;
        
        const safeMaxRam = Math.max(1, cachedMaxRam); // Evite la division par zéro
        const ramPerc = (cachedMaxRam > 0) ? (cachedUsedRam / safeMaxRam) * 100 : 0;
        const shareBoost = 1 + (Math.pow(cachedTS, 0.7) * 0.05);

        // --- LECTURE BOURSIÈRE DEPUIS LE PORT 5 ---
        let stockValue = 0;
        let stockCount = 0;
        const portId = Number(CONFIG?.PORTS?.STOCK_DATA) || 5;
        const stockRaw = ph.peek(portId);
        
        if (stockRaw && stockRaw !== "NULL PORT DATA") {
            try { 
                const sData = JSON.parse(stockRaw);
                stockValue = Number(sData.value) || 0;
                stockCount = Number(sData.active) || 0;
            } catch (e) {
                // Ignorer silencieusement les erreurs de parsing
            }
        }

        // --- AFFICHAGE (Rendu de l'UI) ---
        const cInfo = CONFIG?.COLORS?.INFO || "";
        const cReset = CONFIG?.COLORS?.RESET || "";
        const cDebug = CONFIG?.COLORS?.DEBUG || "";
        const cWarn = CONFIG?.COLORS?.WARN || "";
        const version = CONFIG?.VERSION || "50.5.1";
        
        ns.print(`┌    ${cInfo}NEXUS-APEX V${version}${cReset}  ─  ${new Date().toLocaleTimeString()}  ─  LVL ${player.skills.hacking}    ┐`);
        ns.print(`  💰 CAPITAL : ${ns.nFormat(currentMoney, "$0.000a")}`);
        ns.print(`  📈 PROFIT  : ${ns.nFormat(currentProfit, "$0.000a")}/s [REC: ${ns.nFormat(maxProfit, "$0.000a")}/s]`);
        
        // Affichage dynamique de la Bourse
        if (caps.tix) {
            ns.print(`  💹 BOURSE  : ${ns.nFormat(stockValue, "$0.000a")} (${stockCount} Trks)`);
        } else {
            ns.print(`  💹 BOURSE  : ${cDebug}LOCKED (TIX API Requise)${cReset}`);
        }
        
        ns.print(`  ✨ XP RATE : ${ns.nFormat(xpRate, "0.000a")}k/s`);
        ns.print(`├──────────────────────────────────────────────────┤`);
        ns.print(`  🌐 NODES     : ${pservs.length} / ${CONFIG?.MANAGERS?.MAX_SERVERS || 25} Online`);
        ns.print(`  💾 NETWORK   : ${ns.formatRam(cachedUsedRam)} / ${ns.formatRam(cachedMaxRam)} (${ramPerc.toFixed(1)}%)`);
        
        // Rendu de la barre de progression RAM
        const bars = Math.floor(ramPerc / 2.5);
        const fill = "█".repeat(Math.max(0, Math.min(40, bars)));
        const empty = "░".repeat(Math.max(0, 40 - fill.length));
        ns.print(`  [${cWarn}${fill}${empty}${cReset}]`);
        
        ns.print(`  ⚙️ THREADS   : 💸H:${ns.nFormat(cachedTH, "0.0a")}  💪G:${ns.nFormat(cachedTG, "0.0a")}  🛡️W:${ns.nFormat(cachedTW, "0.0a")}`);
        ns.print(`  ✨ REP BOOST : x${shareBoost.toFixed(3)} (${cachedTS} threads)`);
        
        ns.print(`├────────────────── TARGET STATUS ─────────────────┤`);
        const targets = net.getTopTargets(5) || [];
        for (const t of targets) {
            const s = ns.getServer(t);
            const mAvail = Number(s.moneyAvailable) || 0;
            const mMax = Math.max(1, Number(s.moneyMax) || 1);
            const mPerc = ((mAvail / mMax) * 100).toFixed(0);
            
            const diff = Number(s.hackDifficulty) || 0;
            const minDiff = Number(s.minDifficulty) || 0;
            const sDiff = Math.max(0, diff - minDiff).toFixed(1);
            
            let icon = "🛡️"; 
            if (mPerc >= 98 && sDiff <= 0.5) icon = "💸"; 
            
            const nameTag = t.substring(0, 10).toUpperCase().padEnd(10);
            ns.print(`  ${icon} ${nameTag} | M:${mPerc.padStart(3)}% S:+${sDiff.padEnd(4)} | ETA: ${formatEta(ns.getWeakenTime(t))}`);
        }
        
        ns.print(`├──────────────────────────────────────────────────┤`);
        ns.print(`  ⏳ TIME PLAYED : ${formatTimeShort(player.playtimeSinceLastAug)}`);
        ns.print(`└──────────────────────────────────────────────────┘`);

        await ns.sleep(1000); 
    }
}