/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V51.0 PRO - EARLY GAME | Tool: Greedy Swarm V2   │
 * ╰──────────────────────────────────────────────────╯
 * Description: Imprimante à billets autonome pour rush les premiers milliards.
 * Logic: Essaim auto-équilibré (10%H / 65%G / 25%W). Aucun port requis.
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const workerPath = "/tools/greedy-worker.js";
    const target = ns.args[0] || getBestEarlyTarget(ns);

    // 1. Génération du Worker Intelligent (Auto-balancé)
    const workerCode = `
    export async function main(ns) {
        const [target, role] = ns.args;
        // Petit délai aléatoire pour éviter que tous les serveurs frappent à la même milliseconde
        await ns.sleep(Math.random() * 1500);

        while(true) {
            let m = ns.getServerMoneyAvailable(target);
            let max = ns.getServerMaxMoney(target);
            let s = ns.getServerSecurityLevel(target);
            let min = ns.getServerMinSecurityLevel(target);

            if (role === "WEAKEN") {
                await ns.weaken(target);
            } 
            else if (role === "GROW") {
                // Si la sécurité dérape, l'équipe Grow vient aider à Weaken
                if (s > min + 5) await ns.weaken(target);
                else await ns.grow(target);
            } 
            else if (role === "HACK") {
                // Mode GREEDY : On ne vole QUE si le serveur est riche et vulnérable
                if (m > max * 0.75 && s < min + 2) {
                    await ns.hack(target);
                } else {
                    await ns.sleep(500); // On patiente pendant que Grow/Weaken font le travail
                }
            }
        }
    }`;
    await ns.write(workerPath, workerCode, "w");

    // 2. Cartographie et Cracking du réseau
    let servers = new Set(["home"]);
    const scanAll = (node) => {
        ns.scan(node).forEach(s => {
            if (!servers.has(s)) { servers.add(s); scanAll(s); }
        });
    };
    scanAll("home");

    const cost = ns.getScriptRam(workerPath); // ~1.75 GB
    let totalThreads = 0;

    ns.tprint(`\n🚀 [${target.toUpperCase()}] : Lancement de l'Essaim Greedy-Swarm...`);

    for (const s of servers) {
        // Cracking brutal (Early Game)
        if (!ns.hasRootAccess(s)) {
            try {
                if (ns.fileExists("BruteSSH.exe")) ns.brutessh(s);
                if (ns.fileExists("FTPCrack.exe")) ns.ftpcrack(s);
                if (ns.fileExists("relaySMTP.exe")) ns.relaysmtp(s);
                if (ns.fileExists("HTTPWorm.exe")) ns.httpworm(s);
                if (ns.fileExists("SQLInject.exe")) ns.sqlinject(s);
                ns.nuke(s);
            } catch {}
        }

        // Déploiement proportionnel
        if (ns.hasRootAccess(s)) {
            let maxRam = ns.getServerMaxRam(s);
            let usedRam = ns.getServerUsedRam(s);
            
            // On laisse de l'espace sur la Home en fonction de sa taille
            let reserve = 0;
            if (s === "home") reserve = maxRam < 64 ? 8 : 32; 
            
            let freeRam = Math.max(0, maxRam - usedRam - reserve);
            let possibleThreads = Math.floor(freeRam / cost);
            
            if (possibleThreads > 0) {
                await ns.scp(workerPath, s, "home");

                // Répartition tactique : 10% Hack | 65% Grow | 25% Weaken
                let tHack = Math.max(1, Math.floor(possibleThreads * 0.10));
                let tWeaken = Math.max(1, Math.floor(possibleThreads * 0.25));
                let tGrow = Math.max(1, possibleThreads - tHack - tWeaken);

                // Pour les tout petits serveurs (ex: 4GB = 2 threads), on priorise la préparation
                if (possibleThreads < 3) {
                    tHack = 0; tWeaken = 1; tGrow = possibleThreads - 1;
                }

                // Nettoyage des anciens workers
                ns.ps(s).forEach(p => {
                    if (p.filename === workerPath) ns.kill(p.pid);
                });

                // Lancement des escouades
                if (tHack > 0) ns.exec(workerPath, s, tHack, target, "HACK");
                if (tGrow > 0) ns.exec(workerPath, s, tGrow, target, "GROW");
                if (tWeaken > 0) ns.exec(workerPath, s, tWeaken, target, "WEAKEN");

                totalThreads += possibleThreads;
            }
        }
    }
    
    ns.tprint(`✅ [SUCCÈS] Déploiement terminé : ${totalThreads} threads actifs en boucle !`);
    ns.tprint(`💡 Astuce : Relance ce script de temps en temps quand ton niveau de Hacking monte.`);
}

/**
 * Sélectionne la cible la plus rentable du début de jeu selon ton niveau.
 */
function getBestEarlyTarget(ns) {
    const lvl = ns.getHackingLevel();
    if (lvl >= 300) return "the-hub";
    if (lvl >= 100) return "phantasy";
    if (lvl >= 80) return "max-hardware";
    if (lvl >= 10) return "joesguns";
    return "n00dles";
}