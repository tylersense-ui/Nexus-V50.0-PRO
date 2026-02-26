/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Tool: Farm V2 Deployer    │
 * ╰──────────────────────────────────────────────────╯
 * Description: Déploie le worker simple sur tout le réseau.
 */

import { CONFIG } from "/lib/constants.js";

/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0] || "n00dles";
    const workerScript = "/tools/worker-simple.js";

    if (!ns.fileExists(workerScript)) {
        ns.tprint(`❌ Fichier ${workerScript} introuvable.`);
        return;
    }

    // Scan complet du réseau
    let servers = ["home"];
    const scanAll = (h) => { 
        ns.scan(h).forEach(s => { 
            if (!servers.includes(s)) { servers.push(s); scanAll(s); } 
        }); 
    };
    scanAll("home");

    ns.tprint(`🧐 Analyse et déploiement tactique sur ${servers.length} serveurs...`);

    const scriptCost = ns.getScriptRam(workerScript);

    for (const s of servers) {
        if (!ns.hasRootAccess(s)) {
            try { ns.nuke(s); } catch(e) {}
        }

        if (ns.hasRootAccess(s)) {
            let ramMax = ns.getServerMaxRam(s);
            let ramUsed = ns.getServerUsedRam(s);
            let ramFree = (s === "home") ? Math.max(0, ramMax - ramUsed - CONFIG.HACKING.RESERVED_HOME_RAM) : (ramMax - ramUsed);

            let threads = Math.floor(ramFree / scriptCost);

            if (threads > 0) {
                await ns.scp(workerScript, s, "home");
                
                // Ne tue que les anciens workers simples pour ne pas briser l'Orchestrateur
                ns.ps(s).forEach(p => {
                    if (p.filename === workerScript) ns.kill(p.pid);
                });
                
                ns.exec(workerScript, s, threads, target);
                ns.tprint(`✅ [${s}] : ${threads} threads déployés sur ${target}`);
            }
        }
    }
}