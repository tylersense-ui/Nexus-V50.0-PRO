/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Tool: Network Scanner     │
 * ╰──────────────────────────────────────────────────╯
 * Description: Radar tactique autonome du réseau.
 */

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.ui.resizeTail(700, 500);

    while (true) {
        ns.clearLog();
        let servers = new Set(["home"]);
        function scanAll(node) {
            for (const neighbor of ns.scan(node)) {
                if (!servers.has(neighbor)) {
                    servers.add(neighbor);
                    scanAll(neighbor);
                }
            }
        }
        scanAll("home");

        let myLevel = ns.getHackingLevel();
        let analysis = [];

        for (const s of servers) {
            if (s === "home" || s.includes("pserv") || s.includes("nexus-node")) continue;
            
            const maxMoney = ns.getServerMaxMoney(s);
            if (maxMoney <= 0) continue;

            const reqLevel = ns.getServerRequiredHackingLevel(s);
            if (reqLevel > myLevel) continue;

            const chance = ns.hackAnalyzeChance(s);
            const hackTime = ns.getHackTime(s);
            const score = (maxMoney * chance) / (hackTime / 1000);
            
            const secDiff = ns.getServerSecurityLevel(s) - ns.getServerMinSecurityLevel(s);
            const weakenTime = ns.getWeakenTime(s);

            analysis.push({
                name: s,
                score: score,
                money: maxMoney,
                time: hackTime / 1000,
                prep: secDiff,
                wTime: weakenTime / 1000
            });
        }

        analysis.sort((a, b) => b.score - a.score);

        ns.print(`┌── ANALYSE DE RENTABILITÉ (LVL ${myLevel}) ──────────────┐`);
        ns.print(`| ${"SERVEUR".padEnd(15)} | ${"SCORE/s".padEnd(10)} | ${"TIME".padEnd(8)} | ${"PREP".padEnd(8)} |`);
        ns.print(`├─────────────────┼────────────┼──────────┼──────────┤`);

        analysis.slice(0, 15).forEach(a => {
            const scoreStr = ns.formatNumber(a.score, 1).padStart(10);
            const timeStr = (ns.tFormat(a.time * 1000, true)).padStart(8);
            const prepStr = a.prep > 0.5 ? `⚠️ +${a.prep.toFixed(1)}`.padStart(8) : "✅ OK".padStart(8);
            
            ns.print(`| ${a.name.padEnd(15)} | ${scoreStr} | ${timeStr} | ${prepStr} |`);
        });
        
        ns.print(`└──────────────────────────────────────────────────────┘`);
        ns.print(` Note: Le score est l'argent max théorique gagné par seconde.`);
        ns.print(` Les serveurs marqués ⚠️ demandent une phase de Weaken.`);

        await ns.sleep(2000); // FIX: Remplacement du ns.asleep
    }
}