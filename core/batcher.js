/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V51.0.2 PRO - BN1 SAFE | Module: Giga-Batcher    │
 * ╰──────────────────────────────────────────────────╯
 * Description: Moteur de profit HWGW ultime.
 * Features: First-Fit Decreasing, ns.formulas API, Dynamic EV/s, Safe Margins.
 */

import { CONFIG } from "/lib/constants.js";
import { Network } from "/lib/network.js";
import { Capabilities } from "/lib/capabilities.js";
import { Logger } from "/lib/logger.js";

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const caps = new Capabilities(ns);
    const net = new Network(ns, caps);
    const log = new Logger(ns, "BATCHER");

    const WORKERS = {
        HACK: "/hack/workers/hack.js",
        WEAKEN: "/hack/workers/weaken.js",
        GROW: "/hack/workers/grow.js"
    };

    // 1. Calcul dynamique de la RAM réelle des scripts
    const RAM = {
        HACK: ns.getScriptRam(WORKERS.HACK),
        WEAKEN: ns.getScriptRam(WORKERS.WEAKEN),
        GROW: ns.getScriptRam(WORKERS.GROW)
    };

    log.info(`Initialisation K-CORE avec ${caps.formulas ? "FORMULAS.EXE" : "Calculs Natifs"}`);

    while (true) {
        const targetName = net.getBestTarget();
        const target = ns.getServer(targetName);
        const player = ns.getPlayer();

        // 2. Préparation de la cible (Security & Money)
        // On n'attaque pas une cible qui n'est pas parfaite
        if (target.hackDifficulty > target.minDifficulty + 0.5 || target.moneyAvailable < target.moneyMax * 0.95) {
            await prepTarget(ns, target, player, caps, RAM, WORKERS, net);
            await ns.sleep(1000); // Pause pendant la préparation
            continue;
        }

        // 3. Calcul du Hack Percent optimal via EV/s
        const hackPct = calculateOptimalHackPct(ns, target, player, caps);
        
        // 4. Calcul des threads du batch HWGW
        const batch = calculateHWGW(ns, target, player, hackPct, caps, RAM);
        
        // 5. Dispatch via First-Fit Decreasing (FFD) avec Slicing
        const networkList = net.refresh().filter(h => ns.hasRootAccess(h));
        const success = dispatchBatchFFDSliced(ns, targetName, batch, networkList, WORKERS);

        if (success) {
            log.debug(`Batch lancé sur ${targetName} (Hack: ${Math.round(hackPct * 100)}%)`);
            await ns.sleep(CONFIG.HACKING.BATCH_SPACING || 100);
        } else {
            log.warn(`RAM réseau insuffisante pour un batch complet sur ${targetName}. Attente...`);
            await ns.sleep(2000);
        }
    }
}

/** * Algorithme First-Fit Decreasing AVEC SCINDAGE (Thread Slicing)
 * Règle le problème du "Réseau Fantôme" en autorisant la fragmentation des tâches.
 * @param {NS} ns @param {string} target @param {Array} batch @param {string[]} hosts @param {Object} workers
 */
function dispatchBatchFFDSliced(ns, target, batch, hosts, workers) {
    // Trier les hôtes par RAM libre décroissante
    const sortedHosts = hosts
        .map(h => ({ name: h, free: ns.getServerMaxRam(h) - ns.getServerUsedRam(h) - (h === "home" ? CONFIG.HACKING.getHomeReservedRam(ns) : 0) }))
        .sort((a, b) => b.free - a.free);

    const jobs = [];
    let batchValid = true;

    // Simulation de l'allocation pour vérifier si le batch entier passe
    for (const task of batch) {
        let threadsRemaining = task.t;

        for (const host of sortedHosts) {
            if (threadsRemaining <= 0) break; 
            if (host.free < task.cost) continue; 

            let possibleThreads = Math.floor(host.free / task.cost);
            let threadsToAssign = Math.min(threadsRemaining, possibleThreads);

            jobs.push({ 
                host: host.name, 
                type: task.type, 
                t: threadsToAssign, 
                d: task.d 
            });
            
            host.free -= threadsToAssign * task.cost;
            threadsRemaining -= threadsToAssign;
        }

        if (threadsRemaining > 0) { 
            batchValid = false; 
            break; 
        }
    }

    // Exécution réelle si l'allocation virtuelle a réussi
    if (batchValid) {
        for (const job of jobs) {
            const script = workers[job.type.toUpperCase()];
            
            // AUTO-DEPLOYMENT: Le réveil du réseau fantôme
            if (!ns.fileExists(script, job.host)) {
                ns.scp(script, job.host, "home");
            }
            
            // Math.random() garantit un PID unique même si les arguments sont identiques (requis pour le slicing)
            ns.exec(script, job.host, job.t, target, job.d, Math.random());
        }
        return true;
    }
    return false;
}

/** Calcul de l'EV/s pour trouver le pourcentage de hack optimal */
function calculateOptimalHackPct(ns, target, player, caps) {
    let bestPct = 0.05;
    let maxEV = 0;

    for (let p = 0.05; p <= 0.80; p += 0.05) {
        const hTime = caps.hasFormulas() ? ns.formulas.hacking.hackTime(target, player) : ns.getHackTime(target.hostname);
        const chance = caps.hasFormulas() ? ns.formulas.hacking.hackChance(target, player) : ns.hackAnalyzeChance(target.hostname);
        const ev = (p * target.moneyMax * chance) / hTime;
        
        if (ev > maxEV) {
            maxEV = ev;
            bestPct = p;
        }
    }
    return bestPct;
}

/** Calcul précis des threads et délais HWGW */
function calculateHWGW(ns, target, player, hackPct, caps, RAM) {
    const spacer = CONFIG.HACKING.BATCH_SPACING || 50;
    let hT, w1T, gT, w2T;

    if (caps.hasFormulas()) {
        const mockServer = { ...target, hackDifficulty: target.minDifficulty };
        hT = Math.max(1, Math.floor(hackPct / ns.formulas.hacking.hackPercent(mockServer, player)));
        
        mockServer.hackDifficulty += hT * 0.002;
        w1T = Math.ceil((mockServer.hackDifficulty - target.minDifficulty) / 0.05);
        
        mockServer.hackDifficulty = target.minDifficulty;
        mockServer.moneyAvailable = target.moneyMax * (1 - hackPct);
        gT = Math.ceil(ns.formulas.hacking.growThreads(mockServer, player, target.moneyMax));
        
        w2T = Math.ceil((gT * 0.004) / 0.05);
    } else {
        hT = Math.max(1, Math.ceil(ns.hackAnalyzeThreads(target.hostname, target.moneyMax * hackPct)));
        w1T = Math.ceil((hT * 0.002) / 0.05) + 1;
        gT = Math.ceil(ns.growthAnalyze(target.hostname, 1 / (1 - hackPct))) + 1;
        w2T = Math.ceil(ns.growthAnalyzeSecurity(gT) / 0.05) + 1;
    }

    // Marges de sécurité
    w1T += 1; gT += 2; w2T += 1;

    const wTime = caps.hasFormulas() ? ns.formulas.hacking.weakenTime(target, player) : ns.getWeakenTime(target.hostname);
    const gTime = caps.hasFormulas() ? ns.formulas.hacking.growTime(target, player) : ns.getGrowTime(target.hostname);
    const hTime = caps.hasFormulas() ? ns.formulas.hacking.hackTime(target, player) : ns.getHackTime(target.hostname);

    return [
        { type: 'weaken', t: w1T, d: 0, cost: RAM.WEAKEN },
        { type: 'hack',   t: hT,  d: wTime - spacer - hTime, cost: RAM.HACK },
        { type: 'weaken', t: w2T, d: spacer * 2, cost: RAM.WEAKEN },
        { type: 'grow',   t: gT,  d: wTime + spacer - gTime, cost: RAM.GROW }
    ];
}

/** * Prépare une cible qui n'est pas encore au Max Money / Min Sec.
 * Utilise la même logique de Slicing pour saturer le réseau de Weaken/Grow.
 */
async function prepTarget(ns, target, player, caps, RAM, WORKERS, net) {
    const networkList = net.refresh().filter(h => ns.hasRootAccess(h));
    const batch = [];
    
    let secDiff = target.hackDifficulty - target.minDifficulty;
    if (secDiff > 0.1) {
        let wThreads = Math.ceil(secDiff / 0.05);
        batch.push({ type: 'weaken', t: wThreads, d: 0, cost: RAM.WEAKEN });
    }

    if (target.moneyAvailable < target.moneyMax * 0.95 && secDiff <= 5) {
        let gThreads = 0;
        if (caps.hasFormulas()) {
            const mockServer = { ...target, hackDifficulty: target.minDifficulty };
            gThreads = Math.ceil(ns.formulas.hacking.growThreads(mockServer, player, target.moneyMax));
        } else {
            let multiplier = target.moneyMax / Math.max(1, target.moneyAvailable);
            gThreads = Math.ceil(ns.growthAnalyze(target.hostname, Math.max(1.1, multiplier)));
        }
        
        if (gThreads > 0) {
            batch.push({ type: 'grow', t: gThreads, d: 0, cost: RAM.GROW });
            // Compenser la sécurité du Grow
            let gwThreads = Math.ceil((gThreads * 0.004) / 0.05) + 1;
            batch.push({ type: 'weaken', t: gwThreads, d: 50, cost: RAM.WEAKEN });
        }
    }

    if (batch.length > 0) {
        dispatchBatchFFDSliced(ns, target.hostname, batch, networkList, WORKERS);
    }
}