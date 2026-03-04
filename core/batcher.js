/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V51.0.3 PRO - BN1 SAFE | Module: Giga-Batcher    │
 * ╰──────────────────────────────────────────────────╯
 * Description: Moteur de profit HWGW ultime (Version Modulaire).
 * Features: First-Fit Decreasing Sliced, ns.formulas API, Dynamic EV/s.
 */

import { CONFIG } from "/lib/constants.js";
import { Network } from "/lib/network.js";
import { Capabilities } from "/lib/capabilities.js";
import { PortHandler } from "/core/port-handler.js";

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const caps = new Capabilities(ns);
    const net = new Network(ns, caps);
    const ph = new PortHandler(ns);
    
    const SHARE_PORT = CONFIG.PORTS.SHARE_RATIO || 6;
    const spacer = CONFIG.HACKING.BATCH_SPACING;

    // Lecture dynamique des coûts en RAM
    const RAM_COSTS = {
        SHARE: ns.getScriptRam("/hack/workers/share.js") || 4.0,
        HACK: ns.getScriptRam("/hack/workers/hack.js") || 1.7,
        GROW: ns.getScriptRam("/hack/workers/grow.js") || 1.75,
        WEAKEN: ns.getScriptRam("/hack/workers/weaken.js") || 1.75
    };

    ns.tprint(`\n===========================================================`);
    ns.tprint(`>> NEXUS v51.0 | GIGA-BATCHER | PROJECT DAEDALUS`);
    ns.tprint(`===========================================================`);
    if (caps.formulas) ns.tprint(`✨ [API FORMULAS] : Détectée. Mode Mathématique Précis Activé.`);
    else ns.tprint(`⚠️ [API FORMULAS] : Non détectée. Mode d'estimation classique.`);
    ns.tprint(`🧠 [PACKING] : Algorithme First-Fit Decreasing Sliced (Modulaire) en ligne.`);

    while (true) {
        caps.update();

        // --- 1. STATE & IN-FLIGHT TRACKER ---
        const nodes = net.refresh().filter(n => ns.hasRootAccess(n) && ns.getServerMaxRam(n) > 0);
        let networkRam = {};
        let inFlight = {};

        for (const node of nodes) {
            let max = ns.getServerMaxRam(node);
            if (node === "home") max = Math.max(0, max - CONFIG.HACKING.RESERVED_HOME_RAM);
            let used = ns.getServerUsedRam(node);
            let usedProfit = 0;

            ns.ps(node).forEach(p => {
                const fname = p.filename.toLowerCase();
                const target = p.args[0];

                if (!fname.includes("share.js")) {
                    if (fname.includes("hack.js")) usedProfit += (p.threads * RAM_COSTS.HACK);
                    if (fname.includes("grow.js")) usedProfit += (p.threads * RAM_COSTS.GROW);
                    if (fname.includes("weaken.js")) usedProfit += (p.threads * RAM_COSTS.WEAKEN);

                    if (target && typeof target === "string") {
                        if (!inFlight[target]) inFlight[target] = { h: 0, g: 0, w: 0 };
                        if (fname.includes("hack.js")) inFlight[target].h += p.threads;
                        if (fname.includes("grow.js")) inFlight[target].g += p.threads;
                        if (fname.includes("weaken.js")) inFlight[target].w += p.threads;
                    }
                }
            });
            networkRam[node] = { max, free: Math.max(0, max - used), usedProfit };
        }

        // --- 2. PROFIT DEPLOYMENT (HWGW) ---
        const targets = net.getTopTargets(10);
        for (const targetName of targets) {
            const server = ns.getServer(targetName);
            if (server.hackDifficulty <= server.minDifficulty + 0.1 && server.moneyAvailable >= server.moneyMax * 0.99) {
                dispatchHwgwBatch(ns, caps, ph, nodes, server, spacer, RAM_COSTS, networkRam, inFlight);
            } else {
                dispatchPreparation(ns, caps, ph, nodes, server, RAM_COSTS, networkRam, inFlight);
            }
        }
        
        await ns.sleep(spacer * 5);
    }
}

/**
 * Fonction de distribution First-Fit Decreasing Sliced (MODULAIRE)
 */
function allocateJobFFD(ns, ph, nodes, networkRam, type, targetName, totalThreads, cost, delay = 0) {
    if (totalThreads <= 0) return 0;

    // Tri des nœuds par RAM libre décroissante
    let sortedNodes = [...nodes].sort((a, b) => networkRam[b].free - networkRam[a].free);
    let remaining = totalThreads;

    for (const node of sortedNodes) {
        if (remaining <= 0) break;
        let state = networkRam[node];
        
        let possibleThreads = Math.floor(state.free / cost);
        if (possibleThreads > 0) {
            let toSend = Math.min(remaining, possibleThreads);
            
            // Envoi au port pour le Controller V50.3
            ph.writeJSON(CONFIG.PORTS.COMMANDS, { 
                type: type, 
                host: node, 
                target: targetName, 
                threads: toSend, 
                delay: delay 
            });
            
            state.free -= (toSend * cost);
            state.usedProfit += (toSend * cost);
            remaining -= toSend;
        }
    }
    return totalThreads - remaining;
}

/**
 * Préparation du serveur (Weaken / Grow)
 */
function dispatchPreparation(ns, caps, ph, nodes, target, RAM_COSTS, networkRam, inFlight) {
    let runningW = inFlight[target.hostname]?.w || 0;
    let runningG = inFlight[target.hostname]?.g || 0;

    let simulatedSec = target.hackDifficulty - (runningW * 0.05);
    let secDiff = Math.max(0, simulatedSec - target.minDifficulty);
    
    let neededW = Math.ceil(secDiff / 0.05);
    let neededG = 0;

    if (secDiff <= 0.5 && target.moneyAvailable < target.moneyMax * 0.99) {
        let moneyToGrow = target.moneyMax / Math.max(1, target.moneyAvailable);
        let totalG = 0;
        
        if (caps.formulas) {
            let player = ns.getPlayer();
            let so = ns.getServer(target.hostname);
            so.hackDifficulty = so.minDifficulty; 
            totalG = Math.ceil(ns.formulas.hacking.growThreads(so, player, so.moneyMax));
        } else {
            totalG = Math.ceil(ns.growthAnalyze(target.hostname, Math.max(1.1, moneyToGrow)));
        }
        
        neededG = Math.max(0, totalG - runningG);
        if (neededG > 0) {
            neededG += 1;
            neededW += Math.ceil(ns.growthAnalyzeSecurity(neededG) / 0.05) + 1;
        }
    }

    if (neededW > 0) allocateJobFFD(ns, ph, nodes, networkRam, 'weaken', target.hostname, neededW, RAM_COSTS.WEAKEN);
    if (neededG > 0) allocateJobFFD(ns, ph, nodes, networkRam, 'grow', target.hostname, neededG, RAM_COSTS.GROW);
}

/**
 * Algorithme HWGW Parfait (Dynamic EV & Perfect Timing)
 */
function dispatchHwgwBatch(ns, caps, ph, nodes, target, spacer, RAM_COSTS, networkRam, inFlight) {
    if ((inFlight[target.hostname]?.h || 0) > 0) return;

    let hT, w1T, gT, w2T;
    let wTime, gTime, hTime;

    if (caps.formulas) {
        let player = ns.getPlayer();
        let so = ns.getServer(target.hostname);
        so.hackDifficulty = so.minDifficulty;
        so.moneyAvailable = so.moneyMax;

        let bestPct = 0.10;
        let bestEV = 0;
        let chance = ns.formulas.hacking.hackChance(so, player);
        let wkTimeForm = ns.formulas.hacking.weakenTime(so, player);
        let hackPctPerThread = ns.formulas.hacking.hackPercent(so, player);

        for(let pct = 0.05; pct <= 0.50; pct += 0.05) {
            let testHt = Math.max(1, Math.floor(pct / hackPctPerThread));
            let testW1 = Math.ceil(testHt * 0.002 / 0.05) + 1;
            so.moneyAvailable = Math.max(1, so.moneyMax * (1 - pct));
            let testGt = Math.ceil(ns.formulas.hacking.growThreads(so, player, so.moneyMax)) + 1;
            let testW2 = Math.ceil(testGt * 0.004 / 0.05) + 1;
            so.moneyAvailable = so.moneyMax; 

            let totalRam = (testHt * RAM_COSTS.HACK) + (testW1 * RAM_COSTS.WEAKEN) + (testGt * RAM_COSTS.GROW) + (testW2 * RAM_COSTS.WEAKEN);
            let ev = (so.moneyMax * pct * chance) / (wkTimeForm * totalRam);
            
            if (ev > bestEV) { bestEV = ev; bestPct = pct; }
        }

        hT = Math.max(1, Math.floor(bestPct / hackPctPerThread));
        w1T = Math.ceil(hT * 0.002 / 0.05) + 1; 
        so.moneyAvailable = Math.max(1, so.moneyMax * (1 - (hT * hackPctPerThread)));
        gT = Math.ceil(ns.formulas.hacking.growThreads(so, player, so.moneyMax)) + 1; 
        w2T = Math.ceil(gT * 0.004 / 0.05) + 1;
        so.moneyAvailable = so.moneyMax;
        
        wTime = wkTimeForm;
        gTime = ns.formulas.hacking.growTime(so, player);
        hTime = ns.formulas.hacking.hackTime(so, player);

    } else {
        const hackPct = 0.10;
        hT = Math.max(1, Math.floor(ns.hackAnalyzeThreads(target.hostname, target.moneyMax * hackPct)));
        w1T = Math.ceil(ns.hackAnalyzeSecurity(hT) / 0.05) + 1;
        gT = Math.ceil(ns.growthAnalyze(target.hostname, 1 / (1 - hackPct))) + 1;
        w2T = Math.ceil(ns.growthAnalyzeSecurity(gT) / 0.05) + 1;

        wTime = ns.getWeakenTime(target.hostname);
        gTime = ns.getGrowTime(target.hostname);
        hTime = ns.getHackTime(target.hostname);
    }

    let dHack = (wTime - spacer) - hTime;
    let dWeaken1 = 0; 
    let dGrow = (wTime + spacer) - gTime;
    let dWeaken2 = spacer * 2;

    let minDelay = Math.min(dHack, dWeaken1, dGrow, dWeaken2);
    if (minDelay < 0) { dHack -= minDelay; dWeaken1 -= minDelay; dGrow -= minDelay; dWeaken2 -= minDelay; }

    const batch = [
        { type: 'hack', t: hT, d: dHack, cost: RAM_COSTS.HACK },
        { type: 'weaken', t: w1T, d: dWeaken1, cost: RAM_COSTS.WEAKEN },
        { type: 'grow', t: gT, d: dGrow, cost: RAM_COSTS.GROW },
        { type: 'weaken', t: w2T, d: dWeaken2, cost: RAM_COSTS.WEAKEN }
    ];

    let totalBatchCost = batch.reduce((sum, job) => sum + (job.t * job.cost), 0);
    let totalFreeProfitRam = nodes.reduce((sum, node) => sum + networkRam[node].free, 0);

    if (totalFreeProfitRam >= totalBatchCost) {
        for (const job of batch) {
            allocateJobFFD(ns, ph, nodes, networkRam, job.type, target.hostname, job.t, job.cost, job.d);
        }
    }
}