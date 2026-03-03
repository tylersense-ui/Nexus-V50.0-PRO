/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Auto-Updater      │
 * ╰──────────────────────────────────────────────────╯
 * Description: Synchronisation GitHub vers Bitburner.
 */

/** @param {NS} ns */
export async function main(ns) {
    const GITHUB_USER   = "tylersense-ui";
    const GITHUB_REPO   = "Nexus-V50.0-PRO";
    const GITHUB_BRANCH = "main";
    const BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

    const FILES = {
        root: [
            { remote: "boot.js", local: "boot.js" },
            { remote: "global-kill.js", local: "global-kill.js" },
            { remote: "Liste_Cannonique_augmentations_bitburner.txt", local: "Liste_Cannonique_augmentations_bitburner.txt"}
        ],
        core: [
            { remote: "core/orchestrator.js", local: "core/orchestrator.js" },
            { remote: "core/batcher.js", local: "core/batcher.js" },
            { remote: "core/dashboard.js", local: "core/dashboard.js" },
            { remote: "core/port-handler.js", local: "core/port-handler.js" },
            { remote: "core/ram-manager.js", local: "core/ram-manager.js" }
        ],
        lib: [
            { remote: "lib/capabilities.js", local: "lib/capabilities.js" },
            { remote: "lib/network.js", local: "lib/network.js" },
            { remote: "lib/constants.js", local: "lib/constants.js" },
            { remote: "lib/logger.js", local: "lib/logger.js" }
        ],
        hack: [
            { remote: "hack/controller.js", local: "hack/controller.js" },
            { remote: "hack/watcher.js", local: "hack/watcher.js" },
            { remote: "hack/workers/hack.js", local: "hack/workers/hack.js" },
            { remote: "hack/workers/grow.js", local: "hack/workers/grow.js" },
            { remote: "hack/workers/weaken.js", local: "hack/workers/weaken.js" },
            { remote: "hack/workers/share.js", local: "hack/workers/share.js" }
        ],
        managers: [
            { remote: "managers/singularity.js", local: "managers/singularity.js" },
            { remote: "managers/server-manager.js", local: "managers/server-manager.js" },
            { remote: "managers/gang-manager.js", local: "managers/gang-manager.js" },
            { remote: "managers/corp-manager.js", local: "managers/corp-manager.js" },
            { remote: "managers/hacknet-manager.js", local: "managers/hacknet-manager.js" },
            { remote: "managers/program-manager.js", local: "managers/program-manager.js" },
            { remote: "managers/stock-master.js", local: "managers/stock-master.js" },
            { remote: "managers/sleeve-manager.js", local: "managers/sleeve-manager.js" }
        ],
        tools: [
            { remote: "tools/importer.js", local: "tools/importer.js" },
            { remote: "tools/pre-flight.js", local: "tools/pre-flight.js" },
            { remote: "tools/check-rep.js", local: "tools/check-rep.js" },
            { remote: "tools/scanner.js", local: "tools/scanner.js" },
            { remote: "tools/set-share.js", local: "tools/set-share.js" },
            { remote: "tools/shop.js", local: "tools/shop.js" },
            { remote: "tools/liquidate.js", local: "tools/liquidate.js" },
            { remote: "tools/nexus-greedy-swarm-v2.js", local: "tools/nexus-greedy-swarm-v2.js"}
        ]
    };

    const args = ns.args.map(a => String(a).toLowerCase());
    const downloadAll = args.includes("--all") || args.length === 0;
    
    let filesToDownload = [];
    if (downloadAll) {
        filesToDownload = [...FILES.root, ...FILES.core, ...FILES.lib, ...FILES.hack, ...FILES.managers, ...FILES.tools];
    } else {
        if (args.includes("--root")) filesToDownload.push(...FILES.root);
        if (args.includes("--core")) filesToDownload.push(...FILES.core);
        if (args.includes("--lib"))  filesToDownload.push(...FILES.lib);
        if (args.includes("--hack")) filesToDownload.push(...FILES.hack);
        if (args.includes("--managers")) filesToDownload.push(...FILES.managers);
        if (args.includes("--tools")) filesToDownload.push(...FILES.tools);
    }

    const seen = new Set();
    filesToDownload = filesToDownload.filter(f => {
        if (seen.has(f.local)) return false;
        seen.add(f.local);
        return true;
    });

    ns.tprint("╔══════════════════════════════════════════════╗");
    ns.tprint("║    NEXUS-APEX — Auto-Updater V50.0 PRO       ║");
    ns.tprint("╚══════════════════════════════════════════════╝");
    ns.tprint(`📡 Source : ${BASE_URL}`);
    ns.tprint(`📦 Fichiers à télécharger : ${filesToDownload.length}\n`);

    let successful = 0;
    let failed = 0;
    const failedFiles = [];

    for (const file of filesToDownload) {
        const url = `${BASE_URL}/${file.remote}`;
        const tempFile = `_nexus_tmp_${file.remote.replace(/\//g, "_")}`;

        try {
            const ok = await ns.wget(url, tempFile);
            if (ok) {
                const content = ns.read(tempFile);
                ns.write(file.local, content, "w");
                ns.rm(tempFile);
                ns.tprint(`  ✅ ${file.local}`);
                successful++;
            } else {
                ns.tprint(`  ❌ ${file.local}  ← Échec`);
                failedFiles.push(file.local);
                failed++;
            }
        } catch (e) {
            ns.tprint(`  ❌ ${file.local}  ← Erreur : ${e}`);
            failedFiles.push(file.local);
            failed++;
        }
        await ns.sleep(80);
    }

    ns.tprint(`\n╔══════════════════════════════════════════════╗`);
    ns.tprint(`║  Mise à jour terminée                        ║`);
    ns.tprint(`╚══════════════════════════════════════════════╝`);
    ns.tprint(`  ✅ Succès  : ${successful} / ❌ Échecs  : ${failed}`);

    if (failedFiles.length === 0) {
        ns.tprint(`\n🚀 Tout est à jour ! Lancez : run boot.js`);
    }
}