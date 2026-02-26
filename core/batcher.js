/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.3 PRO - BN1 SAFE | Module: Giga-Batcher      │
 * ╰──────────────────────────────────────────────────╯
 * Description: Moteur de profit HWGW dynamique et optimisé.
 * Fix: In-Flight Tracker & Perfect Timing HWGW.
 */

import { CONFIG } from "/lib/constants.js";
import { Network } from "/lib/network.js";
import { Capabilities } from "/lib/capabilities.js";
import { PortHandler } from "/core/port-handler.js";

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const net = new Network(ns, new Capabilities(ns));
    const ph = new PortHandler(ns);
    const SHARE_PORT = CONFIG.PORTS.SHARE_RATIO || 6;
    const spacer = CONFIG.HACKING.BATCH_SPACING;

    const RAM_COSTS = {
        SHARE: ns.getScriptRam("/hack/workers/share.js") || 4.0,
        HACK: ns.getScriptRam("/hack/workers/hack.js") || 1.7,
        GROW: ns.getScriptRam("/hack/workers/grow.js") || 1.75,
        WEAKEN: ns.getScriptRam("/hack/workers/weaken.js") || 1.75
    };
    
    let lastRatio = 0;
    ns.tprint(`🚀 [${CONFIG.COLORS.INFO}GIGA-BATCHER V50.3${CONFIG.COLORS.RESET}] : In-Flight Tracker activé.`);

    while (true) {
        let currentRatio = lastRatio;
        while (!ph.isEmpty(SHARE_PORT)) {
            const config = ph.readJSON(SHARE_PORT);
            if (config && config.shareRatio !== undefined) currentRatio = Number(config.shareRatio);
        }
        ph.writeJSON(SHARE_PORT, { shareRatio: currentRatio });

        const nodes = net.refresh().filter(n => ns.hasRootAccess(n) && ns.getServerMaxRam(n) > 0).sort((a, b) => a === "home" ? -1 : 1);

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

        // --- 3. PROFIT DEPLOYMENT ---
        if (currentRatio < 1.0) {
            const targets = net.getTopTargets(5);
            for (const targetName of targets) {
                const server = ns.getServer(targetName);
                if (server.hackDifficulty <= server.minDifficulty + 0.1 && server.moneyAvailable >= server.moneyMax * 0.99) {
                    dispatchHwgwBatch(ns, ph, nodes, server, spacer, RAM_COSTS, networkRam, inFlight);
                } else {
                    dispatchPreparation(ns, ph, nodes, server, RAM_COSTS, networkRam, inFlight);
                }
            }
        }
        await ns.sleep(spacer * 5); 
    }
}

function dispatchPreparation(ns, ph, nodes, target, RAM_COSTS, networkRam, inFlight) {
    let runningW = inFlight[target.hostname]?.w || 0;
    let runningG = inFlight[target.hostname]?.g || 0;

    let simulatedSec = target.hackDifficulty - (runningW * 0.05);
    let secDiff = Math.max(0, simulatedSec - target.minDifficulty);
    
    let neededW = Math.ceil(secDiff / 0.05);
    let neededG = 0;

    if (secDiff <= 0.5 && target.moneyAvailable < target.moneyMax * 0.99) {
        let deficit = target.moneyMax / Math.max(1, target.moneyAvailable);
        let totalG = Math.ceil(ns.growthAnalyze(target.hostname, Math.max(1.1, deficit)));
        neededG = Math.max(0, totalG - runningG);
        neededW += Math.ceil(ns.growthAnalyzeSecurity(neededG) / 0.05);
    }

    if (neededW <= 0 && neededG <= 0) return;

    for (const node of nodes) {
        if (neededW <= 0 && neededG <= 0) break;
        let state = networkRam[node];
        let freeForProfit = Math.min(state.free, Math.max(0, state.limitProfit - state.usedProfit));
        if (freeForProfit <= 0) continue;

        if (neededW > 0) {
            let toSend = Math.min(Math.floor(freeForProfit / RAM_COSTS.WEAKEN), neededW);
            if (toSend > 0) {
                ph.writeJSON(CONFIG.PORTS.COMMANDS, { type: 'weaken', host: node, target: target.hostname, threads: toSend });
                state.free -= (toSend * RAM_COSTS.WEAKEN);
                freeForProfit -= (toSend * RAM_COSTS.WEAKEN);
                neededW -= toSend;
            }
        }

        if (neededG > 0 && freeForProfit > 0) {
            let toSend = Math.min(Math.floor(freeForProfit / RAM_COSTS.GROW), neededG);
            if (toSend > 0) {
                ph.writeJSON(CONFIG.PORTS.COMMANDS, { type: 'grow', host: node, target: target.hostname, threads: toSend });
                state.free -= (toSend * RAM_COSTS.GROW);
                neededG -= toSend;
            }
        }
    }
}

function dispatchHwgwBatch(ns, ph, nodes, target, spacer, RAM_COSTS, networkRam, inFlight) {
    if ((inFlight[target.hostname]?.h || 0) > 0) return;

    const hackPct = 0.10; 
    const hT = Math.max(1, Math.floor(ns.hackAnalyzeThreads(target.hostname, target.moneyMax * hackPct)));
    const w1T = Math.ceil(ns.hackAnalyzeSecurity(hT) / 0.05); 
    const gT = Math.ceil(ns.growthAnalyze(target.hostname, 1 / (1 - hackPct)));
    const w2T = Math.ceil(ns.growthAnalyzeSecurity(gT) / 0.05);

    let wTime = ns.getWeakenTime(target.hostname);
    let gTime = ns.getGrowTime(target.hostname);
    let hTime = ns.getHackTime(target.hostname);

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

    for (const job of batch) {
        let remaining = job.t;
        let nodeIdx = 0; 
        while (remaining > 0 && nodeIdx < nodes.length) {
            let node = nodes[nodeIdx];
            let state = networkRam[node];
            let freeForProfit = Math.min(state.free, Math.max(0, state.limitProfit - state.usedProfit));
            let possibleThreads = Math.floor(freeForProfit / job.cost);
            
            if (possibleThreads > 0) {
                let toSend = Math.min(remaining, possibleThreads);
                ph.writeJSON(CONFIG.PORTS.COMMANDS, { type: job.type, host: node, target: target.hostname, threads: toSend, delay: job.d });
                state.free -= (toSend * job.cost);
                state.usedProfit += (toSend * job.cost);
                remaining -= toSend;
            }
            nodeIdx++; 
        }
    }
}