/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Giga-Batcher      │
 * ╰──────────────────────────────────────────────────╯
 * Description: Moteur de profit HWGW dynamique et optimisé.
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

    // Calcul dynamique de la RAM requise pour chaque script travailleur
    const RAM_COSTS = {
        SHARE: ns.getScriptRam("/hack/workers/share.js") || 4.0,
        HACK: ns.getScriptRam("/hack/workers/hack.js") || 1.7,
        GROW: ns.getScriptRam("/hack/workers/grow.js") || 1.75,
        WEAKEN: ns.getScriptRam("/hack/workers/weaken.js") || 1.75
    };
    
    // Pour simplifier l'estimation de RAM lors du calcul de la place disponible pour le profit
    const AVERAGE_PROFIT_RAM = (RAM_COSTS.HACK + RAM_COSTS.GROW + RAM_COSTS.WEAKEN) / 3;

    let lastRatio = 0;
    ns.tprint(`🚀 [${CONFIG.COLORS.INFO}GIGA-BATCHER V${CONFIG.VERSION}${CONFIG.COLORS.RESET}] : Synchronisation HWGW active.`);

    while (true) {
        let currentRatio = lastRatio;
        let foundNewData = false;

        // Lecture sécurisée du port pour mettre à jour le ratio de Share
        while (!ph.isEmpty(SHARE_PORT)) {
            const config = ph.readJSON(SHARE_PORT);
            if (config && config.shareRatio !== undefined) {
                currentRatio = Number(config.shareRatio);
                foundNewData = true;
            }
        }

        if (foundNewData) {
            ph.writeJSON(SHARE_PORT, { shareRatio: currentRatio });
        }

        // Récupération des serveurs utilisables
        const nodes = net.refresh()
            .filter(n => ns.hasRootAccess(n) && ns.getServerMaxRam(n) > 0)
            .sort((a, b) => a === "home" ? -1 : b === "home" ? 1 : 0);

        // Si le ratio change, on procède à un nettoyage (KILL) des anciens jobs
        if (currentRatio !== lastRatio) {
            ns.print(`🔄 Ratio mis à jour : ${(lastRatio * 100).toFixed(0)}% -> ${(currentRatio * 100).toFixed(0)}%`);
            
            for (const node of nodes) {
                const processes = ns.ps(node);
                for (const p of processes) {
                    const fname = p.filename.toLowerCase();
                    const isProfit = ["hack.js", "grow.js", "weaken.js"].some(f => fname.includes(f));
                    const isShare = fname.includes("share.js");

                    if (currentRatio > lastRatio && isProfit) ns.kill(p.pid);
                    if (currentRatio < lastRatio && isShare) ns.kill(p.pid);
                }
            }
            lastRatio = currentRatio;
        }

        // --- PHASE 1 : DEPLOIEMENT DU SHARE ---
        if (currentRatio > 0) {
            for (const node of nodes) {
                let max = ns.getServerMaxRam(node);
                if (node === "home") max = Math.max(0, max - CONFIG.HACKING.RESERVED_HOME_RAM);
                
                let targetThreads = Math.floor((max * currentRatio) / RAM_COSTS.SHARE);
                let currentThreads = 0;
                
                ns.ps(node).forEach(p => {
                    if (p.filename.includes("share.js")) currentThreads += p.threads;
                });

                if (currentThreads < targetThreads) {
                    let free = max - ns.getServerUsedRam(node);
                    let toSend = Math.min(targetThreads - currentThreads, Math.floor(free / RAM_COSTS.SHARE));
                    if (toSend > 0) {
                        ph.writeJSON(CONFIG.PORTS.COMMANDS, { type: 'share', host: node, threads: toSend });
                    }
                }
            }
        }

        // --- PHASE 2 : GESTION DU PROFIT (HWGW) ---
        if (currentRatio < 1.0) {
            const targets = net.getTopTargets(5);
            for (const targetName of targets) {
                const server = ns.getServer(targetName);
                
                // Si le serveur est préparé (Sécu Min & Argent Max), on lance un Batch
                if (server.hackDifficulty <= server.minDifficulty + 0.1 && server.moneyAvailable >= server.moneyMax * 0.99) {
                    dispatchHwgwBatch(ns, ph, nodes, server, spacer, currentRatio, RAM_COSTS);
                } else {
                    // Sinon, on le prépare (Weaken/Grow)
                    dispatchPreparation(ns, ph, nodes, server, currentRatio, RAM_COSTS, AVERAGE_PROFIT_RAM);
                }
            }
        }
        
        await ns.sleep(spacer * 5); // Remplace ns.asleep
    }
}

/** * Fonction d'aide pour préparer un serveur (Weaken puis Grow).
 */
function dispatchPreparation(ns, ph, nodes, target, ratio, RAM_COSTS, AVERAGE_PROFIT_RAM) {
    let secDiff = target.hackDifficulty - target.minDifficulty;
    
    for (const node of nodes) {
        if (secDiff <= 0 && target.moneyAvailable >= target.moneyMax) break;

        let max = ns.getServerMaxRam(node);
        if (node === "home") max = Math.max(0, max - CONFIG.HACKING.RESERVED_HOME_RAM);
        
        let limit = max * (1 - ratio);
        let usedByProfit = 0;
        
        ns.ps(node).forEach(p => {
            const fname = p.filename.toLowerCase();
            if (fname.includes("hack.js")) usedByProfit += (p.threads * RAM_COSTS.HACK);
            if (fname.includes("grow.js")) usedByProfit += (p.threads * RAM_COSTS.GROW);
            if (fname.includes("weaken.js")) usedByProfit += (p.threads * RAM_COSTS.WEAKEN);
        });
        
        let freeForProfit = limit - usedByProfit;
        if (freeForProfit <= 0) continue;

        // Choix du type de préparation prioritaire
        const type = (secDiff > 0.5) ? 'weaken' : 'grow';
        const cost = RAM_COSTS[type.toUpperCase()];
        let threads = Math.floor(freeForProfit / cost);
        
        if (threads > 0) {
            ph.writeJSON(CONFIG.PORTS.COMMANDS, { type: type, host: node, target: target.hostname, threads: threads });
            
            // Mise à jour de la difficulté simulée pour ne pas sur-allouer
            if (type === 'weaken') secDiff -= ns.weakenAnalyze(threads);
            // Simplification : on ne simule pas l'argent gagné par Grow ici pour éviter des calculs trop lourds en boucle rapide.
        }
    }
}

/**
 * Fonction d'aide pour lancer une séquence HWGW synchronisée.
 */
function dispatchHwgwBatch(ns, ph, nodes, target, spacer, ratio, RAM_COSTS) {
    const hackPercent = 0.10; // On vole 10% par cycle
    
    // Calcul précis des threads nécessaires pour ce batch
    const hThreads  = Math.max(1, Math.floor(ns.hackAnalyzeThreads(target.hostname, target.moneyMax * hackPercent)));
    const w1Threads = Math.ceil(ns.hackAnalyzeSecurity(hThreads) / 0.05); // 0.05 est la sécu enlevée par 1 thread weaken
    const gThreads  = Math.ceil(ns.growthAnalyze(target.hostname, 1 / (1 - hackPercent)));
    const w2Threads = Math.ceil(ns.growthAnalyzeSecurity(gThreads) / 0.05);

    const batch = [
        { type: 'hack',   t: hThreads,  d: 0,            cost: RAM_COSTS.HACK },
        { type: 'weaken', t: w1Threads, d: spacer,       cost: RAM_COSTS.WEAKEN },
        { type: 'grow',   t: gThreads,  d: spacer * 2,   cost: RAM_COSTS.GROW },
        { type: 'weaken', t: w2Threads, d: spacer * 3,   cost: RAM_COSTS.WEAKEN }
    ];

    for (const job of batch) {
        let remaining = job.t;
        let nodeIdx = 0; // CORRECTION : On réinitialise l'index des nodes pour CHAQUE job du batch

        while (remaining > 0 && nodeIdx < nodes.length) {
            let node = nodes[nodeIdx];
            let max = ns.getServerMaxRam(node);
            if (node === "home") max = Math.max(0, max - CONFIG.HACKING.RESERVED_HOME_RAM);
            
            let limit = max * (1 - ratio);
            let free = Math.min(limit, max - ns.getServerUsedRam(node));
            
            let possibleThreads = Math.floor(free / job.cost);
            
            if (possibleThreads > 0) {
                let toSend = Math.min(remaining, possibleThreads);
                ph.writeJSON(CONFIG.PORTS.COMMANDS, { 
                    type: job.type, 
                    host: node, 
                    target: target.hostname, 
                    threads: toSend, 
                    delay: job.d 
                });
                remaining -= toSend;
            }
            nodeIdx++; // On passe au node suivant si le job n'est pas terminé
        }
    }
}