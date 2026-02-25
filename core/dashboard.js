/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Dashboard UI      │
 * ╰──────────────────────────────────────────────────╯
 * Description: Interface de monitoring en temps réel.
 */

import { CONFIG } from "/lib/constants.js";
import { Network } from "/lib/network.js";
import { Capabilities } from "/lib/capabilities.js";

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.ui.moveTail(10, 10);
    ns.ui.resizeTail(520, 560); // Légèrement agrandi pour l'ASCII

    const caps = new Capabilities(ns);
    const net = new Network(ns, caps);
    
    const startMoney = ns.getPlayer().money;
    const startTime = Date.now();
    let lastXp = ns.getPlayer().exp.hacking;
    let maxProfit = 0;

    // Cache pour limiter l'impact CPU des `ns.ps()`
    let tick = 0;
    let cachedTH = 0, cachedTG = 0, cachedTW = 0, cachedTS = 0;
    let cachedUsedRam = 0, cachedMaxRam = 0;

    const formatTimeShort = (ms) => {
        let s = Math.floor(ms / 1000);
        const d = Math.floor(s / 86400); s %= 86400;
        const h = Math.floor(s / 3600); s %= 3600;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${d > 0 ? d + 'd ' : ''}${h > 0 ? h + 'h ' : ''}${m}m ${sec}s`;
    };

    const formatEta = (ms) => {
        if (ms <= 0) return "00m 00s";
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        return `${(m % 60).toString().padStart(2, '0')}m ${(s % 60).toString().padStart(2, '0')}s`;
    };

    while (true) {
        ns.clearLog();
        const player = ns.getPlayer();
        const allServers = net.refresh();
        const pservs = allServers.filter(s => s.startsWith(CONFIG.MANAGERS.PSERV_PREFIX));
        
        // Rafraîchissement des processus lourds 1 fois sur 5
        if (tick % 5 === 0) {
            cachedUsedRam = 0; cachedMaxRam = 0;
            cachedTH = 0; cachedTG = 0; cachedTW = 0; cachedTS = 0;

            for (const host of allServers) {
                if (!ns.hasRootAccess(host)) continue;
                
                let sMax = ns.getServerMaxRam(host);
                if (host === "home") sMax = Math.max(0, sMax - CONFIG.HACKING.RESERVED_HOME_RAM);

                cachedUsedRam += ns.getServerUsedRam(host);
                cachedMaxRam += sMax;
                
                ns.ps(host).forEach(p => {
                    const fname = p.filename.toLowerCase();
                    if (fname.includes("hack.js")) cachedTH += p.threads;
                    else if (fname.includes("grow.js")) cachedTG += p.threads;
                    else if (fname.includes("weaken.js")) cachedTW += p.threads;
                    else if (fname.includes("share.js")) cachedTS += p.threads;
                });
            }
        }
        tick++;

        const runtime = (Date.now() - startTime) / 1000;
        const currentProfit = (player.money - startMoney) / Math.max(1, runtime);
        if (currentProfit > maxProfit) maxProfit = currentProfit;

        const xpRate = (player.exp.hacking - lastXp);
        lastXp = player.exp.hacking;
        const ramPerc = (cachedMaxRam > 0) ? (cachedUsedRam / cachedMaxRam) * 100 : 0;
        
        // Formule de boost de réputation par le Share
        const shareBoost = 1 + (Math.pow(cachedTS, 0.7) * 0.05);

        // --- AFFICHAGE ---
        ns.print(`┌    ${CONFIG.COLORS.INFO}NEXUS-APEX V${CONFIG.VERSION}${CONFIG.COLORS.RESET}  ─  ${new Date().toLocaleTimeString()}  ─  LVL ${player.skills.hacking}    ┐`);
        ns.print(`  💰 CAPITAL : ${ns.nFormat(player.money || 0, "$0.000a")}`);
        ns.print(`  📈 PROFIT  : ${ns.nFormat(currentProfit || 0, "$0.000a")}/s [REC: ${ns.nFormat(maxProfit || 0, "$0.000a")}/s]`);
        
        if (caps.tix) {
            let totalStock = 0; let count = 0;
            try { 
                ns.stock.getSymbols().forEach(s => { 
                    const [sh] = ns.stock.getPosition(s); 
                    if(sh > 0) { totalStock += sh * ns.stock.getBidPrice(s); count++; }
                }); 
                ns.print(`  💹 BOURSE  : ${ns.nFormat(totalStock, "$0.000a")} (${count} Trks)`);
            } catch(e) { /* Silencieux si TIX plante en cours de route */ }
        }
        
        ns.print(`  ✨ XP RATE : ${ns.nFormat(xpRate || 0, "0.000a")}k/s`);
        ns.print(`├──────────────────────────────────────────────────┤`);
        ns.print(`  🌐 NODES     : ${pservs.length} / ${CONFIG.MANAGERS.MAX_SERVERS} Online`);
        ns.print(`  💾 NETWORK   : ${ns.formatRam(cachedUsedRam)} / ${ns.formatRam(cachedMaxRam)} (${ramPerc.toFixed(1)}%)`);
        
        // Barre de progression RAM visuelle
        const bars = Math.floor(ramPerc / 2.5);
        const fill = "█".repeat(Math.max(0, bars));
        const empty = "░".repeat(Math.max(0, 40 - bars));
        ns.print(`  [${CONFIG.COLORS.WARN}${fill}${empty}${CONFIG.COLORS.RESET}]`);
        
        ns.print(`  ⚙️ THREADS   : 💸H:${ns.nFormat(cachedTH, "0.0a")}  💪G:${ns.nFormat(cachedTG, "0.0a")}  🛡️W:${ns.nFormat(cachedTW, "0.0a")}`);
        ns.print(`  ✨ REP BOOST : x${shareBoost.toFixed(3)} (${cachedTS} threads)`);
        
        ns.print(`├────────────────── TARGET STATUS ─────────────────┤`);
        const targets = net.getTopTargets(5);
        for (const t of targets) {
            const s = ns.getServer(t);
            const mPerc = ((s.moneyAvailable / Math.max(1, s.moneyMax)) * 100).toFixed(0);
            const sDiff = (s.hackDifficulty - s.minDifficulty).toFixed(1);
            
            let icon = "🛡️"; // En préparation (Weaken/Grow)
            if (mPerc >= 98 && sDiff <= 0.5) icon = "💸"; // Prêt à être Hacké (Batch)
            
            const nameTag = t.substring(0, 10).toUpperCase().padEnd(10);
            ns.print(`  ${icon} ${nameTag} | M:${mPerc.padStart(3)}% S:+${sDiff.padEnd(4)} | ETA: ${formatEta(ns.getWeakenTime(t))}`);
        }
        
        ns.print(`├──────────────────────────────────────────────────┤`);
        ns.print(`  ⏳ TIME PLAYED : ${formatTimeShort(player.playtimeSinceLastAug)}`);
        ns.print(`└──────────────────────────────────────────────────┘`);

        await ns.sleep(1000); // Remplacement de ns.asleep
    }
}