/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V51.0 PRO - BN1 SAFE | Module: Giga-Batcher      │
 * ╰──────────────────────────────────────────────────╯
 * Description: Moteur de profit HWGW ultime.
 * Features: First-Fit Decreasing, ns.formulas API, Dynamic EV/s, Safe Margins.
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
    
    let lastRatio = 0;
    
    ns.tprint(`\n===========================================================`);
    ns.tprint(`>> NEXUS v51.0 | GIGA-BATCHER | PROJECT DAEDALUS`);
    ns.tprint(`===========================================================`);
    
    if (caps.formulas) ns.tprint(`✨ [API FORMULAS] : Détectée. Mode Mathématique Précis Activé.`);
    else ns.tprint(`⚠️ [API FORMULAS] : Non détectée. Mode d'estimation classique.`);
    ns.tprint(`🧠 [PACKING] : Algorithme First-Fit Decreasing en ligne.`);

    while (true) {
        caps.update(); // Met à jour l'accès à Formulas en temps réel
        let currentRatio = lastRatio;
        
        while (!ph.isEmpty(SHARE_PORT)) {
            const config = ph.readJSON(SHARE_PORT);
            if (config && config.shareRatio !== undefined) currentRatio = Number(config.shareRatio);
        }
        ph.writeJSON(SHARE_PORT, { shareRatio: currentRatio });

        const nodes = net.refresh().filter(n => ns.hasRootAccess(n) && ns.getServerMaxRam(n) > 0);

        // Nettoyage si le ratio change
        if (currentRatio !== lastRatio) {
            for (const node of nodes) {
                ns.ps(node).forEach(p => {
                    const fname = p.filename.toLowerCase();
                    if ((currentRatio > lastRatio && !fname.includes("share")) || (currentRatio < lastRatio && fname.includes("share"))) ns.kill(p.pid);
                });
            }
            lastRatio = currentRatio;
            await ns.sleep(500);
        }

        // --- 1. STATE & IN-FLIGHT TRACKER ---
        let networkRam = {};
        let inFlight = {};

        for (const node of nodes) {
            let max = ns.getServerMaxRam(node);
            if (node === "home") max = Math.max(0, max - CONFIG.HACKING.RESERVED_HOME_RAM);
            let used = ns.getServerUsedRam(node);
            let usedProfit = 0, shareThreads = 0;

            ns.ps(node).forEach(p => {
                const fname = p.filename.toLowerCase();
                const target = p.args[0];

                if (fname.includes("share.js")) shareThreads += p.threads;
                else {
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
            networkRam[node] = { max, free: Math.max(0, max - used), limitProfit: max * (1 - currentRatio), usedProfit, shareThreads };
        }

        // --- 2. SHARE DEPLOYMENT ---
        if (currentRatio > 0) {
            for (const node of nodes) {
                let state = networkRam[node];
                let targetThreads = Math.floor((state.max * currentRatio) / RAM_COSTS.SHARE);
                if (state.shareThreads < targetThreads) {
                    let toSend = Math.min(targetThreads - state.shareThreads, Math.floor(state.free / RAM_COSTS.SHARE));
                    if (toSend > 0) {
                        ph.writeJSON(CONFIG.PORTS.COMMANDS, { type: 'share', host: node, threads: toSend });
                        state.free -= (toSend * RAM_COSTS.SHARE);
                        state.shareThreads += toSend;
                    }
                }
            }
        }

        // --- 3. PROFIT DEPLOYMENT (HWGW) ---
        if (currentRatio < 1.0) {
            const targets = net.getTopTargets(10);
            for (const targetName of targets) {
                const server = ns.getServer(targetName);
                if (server.hackDifficulty <= server.minDifficulty + 0.1 && server.moneyAvailable >= server.moneyMax * 0.99) {
                    dispatchHwgwBatch(ns, caps, ph, nodes, server, spacer, RAM_COSTS, networkRam, inFlight);
                } else {
                    dispatchPreparation(ns, caps, ph, nodes, server, RAM_COSTS, networkRam, inFlight);
                }
            }
        }
        await ns.sleep(spacer * 5); 
    }
}

/**
 * Fonction de distribution First-Fit Decreasing
 */
function allocateJobFFD(ns, ph, nodes, networkRam, type, targetName, totalThreads, cost, delay = 0) {
    if (totalThreads <= 0) return 0;
    
    // Tri des nœuds par RAM de profit libre décroissante (First-Fit Decreasing)
    let sortedNodes = [...nodes].sort((a, b) => {
        let freeA = Math.min(networkRam[a].free, Math.max(0, networkRam[a].limitProfit - networkRam[a].usedProfit));
        let freeB = Math.min(networkRam[b].free, Math.max(0, networkRam[b].limitProfit - networkRam[b].usedProfit));
        return freeB - freeA;
    });

    let remaining = totalThreads;
    for (const node of sortedNodes) {
        if (remaining <= 0) break;
        
        let state = networkRam[node];
        let freeForProfit = Math.min(state.free, Math.max(0, state.limitProfit - state.usedProfit));
        let possibleThreads = Math.floor(freeForProfit / cost);
        
        if (possibleThreads > 0) {
            let toSend = Math.min(remaining, possibleThreads);
            ph.writeJSON(CONFIG.PORTS.COMMANDS, { type: type, host: node, target: targetName, threads: toSend, delay: delay });
            
            state.free -= (toSend * cost);
            state.usedProfit += (toSend * cost);
            remaining -= toSend;
        }
    }
    return totalThreads - remaining; // Retourne le nombre de threads réellement envoyés
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
        
        // Utilisation de Formulas pour un calcul exact de Grow
        if (caps.formulas) {
            let player = ns.getPlayer();
            let so = ns.getServer(target.hostname);
            so.hackDifficulty = so.minDifficulty; // Simule qu'on le grow à secu min
            totalG = Math.ceil(ns.formulas.hacking.growThreads(so, player, so.moneyMax));
        } else {
            totalG = Math.ceil(ns.growthAnalyze(target.hostname, Math.max(1.1, moneyToGrow)));
        }
        
        neededG = Math.max(0, totalG - runningG);
        if (neededG > 0) {
            neededG += 1; // Marge de sécurité
            neededW += Math.ceil(ns.growthAnalyzeSecurity(neededG) / 0.05) + 1; // Compensation avec marge
        }
    }

    if (neededW > 0) allocateJobFFD(ns, ph, nodes, networkRam, 'weaken', target.hostname, neededW, RAM_COSTS.WEAKEN);
    if (neededG > 0) allocateJobFFD(ns, ph, nodes, networkRam, 'grow', target.hostname, neededG, RAM_COSTS.GROW);
}

/**
 * Algorithme HWGW Parfait (Dynamic EV & Perfect Timing)
 */
function dispatchHwgwBatch(ns, caps, ph, nodes, target, spacer, RAM_COSTS, networkRam, inFlight) {
    // Si un Hack est déjà en vol, on bloque pour ne pas briser la cible (Anti-Spam absolu)
    if ((inFlight[target.hostname]?.h || 0) > 0) return;

    let hT, w1T, gT, w2T;
    let wTime, gTime, hTime;

    if (caps.formulas) {
        let player = ns.getPlayer();
        let so = ns.getServer(target.hostname);
        so.hackDifficulty = so.minDifficulty;
        so.moneyAvailable = so.moneyMax;

        // CALCUL DYNAMIQUE DU POURCENTAGE OPTIMAL (EV/s)
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
            so.moneyAvailable = so.moneyMax; // reset

            let totalRam = (testHt * RAM_COSTS.HACK) + (testW1 * RAM_COSTS.WEAKEN) + (testGt * RAM_COSTS.GROW) + (testW2 * RAM_COSTS.WEAKEN);
            let ev = (so.moneyMax * pct * chance) / (wkTimeForm * totalRam); // Expected Value par cycle par GB
            
            if (ev > bestEV) { bestEV = ev; bestPct = pct; }
        }

        // APPLICATION DES CALCULS EXACTS
        hT = Math.max(1, Math.floor(bestPct / hackPctPerThread));
        w1T = Math.ceil(hT * 0.002 / 0.05) + 1; // +1 de marge
        
        so.moneyAvailable = Math.max(1, so.moneyMax * (1 - (hT * hackPctPerThread)));
        gT = Math.ceil(ns.formulas.hacking.growThreads(so, player, so.moneyMax)) + 1; // +1 de marge
        w2T = Math.ceil(gT * 0.004 / 0.05) + 1; // +1 de marge
        so.moneyAvailable = so.moneyMax; // restore
        
        wTime = wkTimeForm;
        gTime = ns.formulas.hacking.growTime(so, player);
        hTime = ns.formulas.hacking.hackTime(so, player);

    } else {
        // FALLBACK SI FORMULAS EST ABSENT
        const hackPct = 0.10; 
        hT = Math.max(1, Math.floor(ns.hackAnalyzeThreads(target.hostname, target.moneyMax * hackPct)));
        w1T = Math.ceil(ns.hackAnalyzeSecurity(hT) / 0.05) + 1; 
        gT = Math.ceil(ns.growthAnalyze(target.hostname, 1 / (1 - hackPct))) + 1;
        w2T = Math.ceil(ns.growthAnalyzeSecurity(gT) / 0.05) + 1;

        wTime = ns.getWeakenTime(target.hostname);
        gTime = ns.getGrowTime(target.hostname);
        hTime = ns.getHackTime(target.hostname);
    }

    // PERFECT TIMING HWGW CALCULATION
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

    // On vérifie d'abord si le réseau a assez de RAM libre pour le batch ENTIER
    let totalBatchCost = batch.reduce((sum, job) => sum + (job.t * job.cost), 0);
    let totalFreeProfitRam = nodes.reduce((sum, node) => sum + Math.min(networkRam[node].free, Math.max(0, networkRam[node].limitProfit - networkRam[node].usedProfit)), 0);

    if (totalFreeProfitRam >= totalBatchCost) {
        for (const job of batch) {
            allocateJobFFD(ns, ph, nodes, networkRam, job.type, target.hostname, job.t, job.cost, job.d);
        }
    }
}