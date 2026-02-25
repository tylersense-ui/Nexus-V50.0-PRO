/** nexus-update.js
 *
 * Nexus-Aegis v45.1 — Auto-updater
 * Télécharge tous les fichiers du repo GitHub directement dans Bitburner.
 *
 * Usage:
 *   run nexus-update.js              → Télécharge tout le système (défaut)
 *   run nexus-update.js --all        → Idem (explicite)
 *   run nexus-update.js --core       → core/ uniquement
 *   run nexus-update.js --lib        → lib/ uniquement
 *   run nexus-update.js --hack       → hack/ + workers/ uniquement
 *   run nexus-update.js --managers   → managers/ uniquement
 *   run nexus-update.js --tools      → tools/ uniquement
 *   run nexus-update.js --root       → Fichiers racine uniquement (boot.js, global-kill.js, nexus-update.js)
 *   run nexus-update.js --core --lib → Combinaison possible
 */

/** @param {NS} ns */
export async function main(ns) {

    // ============================================================
    // CONFIGURATION — Modifiez uniquement cette section si besoin
    // ============================================================
    const GITHUB_USER   = "tylersense-ui";
    const GITHUB_REPO   = "Nexus-V50.0-PRO";
    const GITHUB_BRANCH = "main";
    const BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/refs/heads/${GITHUB_BRANCH}`;

    // ============================================================
    // CATALOGUE COMPLET DES FICHIERS DU REPO — v45.1
    // ============================================================
    const FILES = {

        // Fichiers racine
        root: [
            { remote: "boot.js",                                                          local: "boot.js" },
            { remote: "global-kill.js",                                                   local: "global-kill.js" },
            { remote: "nexus-update.js",                                                  local: "nexus-update.js" },
            { remote: "Liste_Cannonique_augmentations_bitburner.txt",                     local: "Liste_Cannonique_augmentations_bitburner.txt" }
        ],

        // Cerveau du système
        core: [
            { remote: "core/orchestrator.js",  local: "core/orchestrator.js" },
            { remote: "core/batcher.js",       local: "core/batcher.js" },
            { remote: "core/dashboard.js",     local: "core/dashboard.js" },
            { remote: "core/port-handler.js",  local: "core/port-handler.js" },
            { remote: "core/ram-manager.js",   local: "core/ram-manager.js" }
        ],

        // Bibliothèques partagées
        lib: [
            { remote: "lib/capabilities.js",  local: "lib/capabilities.js" },
            { remote: "lib/network.js",        local: "lib/network.js" },
            { remote: "lib/constants.js",      local: "lib/constants.js" },
            { remote: "lib/logger.js",         local: "lib/logger.js" }
        ],

        // Dispatcher + Workers HWGW
        hack: [
            { remote: "hack/controller.js",         local: "hack/controller.js" },
            { remote: "hack/watcher.js",             local: "hack/watcher.js" },
            { remote: "hack/workers/hack.js",        local: "hack/workers/hack.js" },
            { remote: "hack/workers/grow.js",        local: "hack/workers/grow.js" },
            { remote: "hack/workers/weaken.js",      local: "hack/workers/weaken.js" },
            { remote: "hack/workers/share.js",       local: "hack/workers/share.js" }
        ],

        // Modules d'automatisation
        managers: [
            { remote: "managers/singularity.js",     local: "managers/singularity.js" },
            { remote: "managers/server-manager.js",  local: "managers/server-manager.js" },
            { remote: "managers/gang-manager.js",    local: "managers/gang-manager.js" },
            { remote: "managers/corp-manager.js",    local: "managers/corp-manager.js" },
            { remote: "managers/hacknet-manager.js", local: "managers/hacknet-manager.js" },
            { remote: "managers/program-manager.js", local: "managers/program-manager.js" },
            { remote: "managers/stock-master.js",    local: "managers/stock-master.js" },
            { remote: "managers/sleeve-manager.js",  local: "managers/sleeve-manager.js" }
        ],

        // Outils manuels
        tools: [
            { remote: "tools/importer.js",          local: "tools/importer.js" },
            { remote: "tools/pre-flight.js",         local: "tools/pre-flight.js" },
            { remote: "tools/check-rep.js",          local: "tools/check-rep.js" },
            { remote: "tools/scanner.js",            local: "tools/scanner.js" },
            { remote: "tools/set-share.js",          local: "tools/set-share.js" },
            { remote: "tools/shop.js",               local: "tools/shop.js" },
            { remote: "tools/liquidate.js",          local: "tools/liquidate.js" },
            { remote: "tools/casino-predicter.js",   local: "tools/casino-predicter.js" }
        ]
    };

    // ============================================================
    // PARSING DES ARGUMENTS
    // ============================================================
    const args = ns.args.map(a => String(a).toLowerCase());
    const downloadAll      = args.includes("--all") || args.length === 0;
    const downloadRoot     = args.includes("--root");
    const downloadCore     = args.includes("--core");
    const downloadLib      = args.includes("--lib");
    const downloadHack     = args.includes("--hack");
    const downloadManagers = args.includes("--managers");
    const downloadTools    = args.includes("--tools");

    // Construction de la liste finale
    let filesToDownload = [];
    if (downloadAll) {
        filesToDownload = [
            ...FILES.root,
            ...FILES.core,
            ...FILES.lib,
            ...FILES.hack,
            ...FILES.managers,
            ...FILES.tools
        ];
    } else {
        if (downloadRoot)     filesToDownload.push(...FILES.root);
        if (downloadCore)     filesToDownload.push(...FILES.core);
        if (downloadLib)      filesToDownload.push(...FILES.lib);
        if (downloadHack)     filesToDownload.push(...FILES.hack);
        if (downloadManagers) filesToDownload.push(...FILES.managers);
        if (downloadTools)    filesToDownload.push(...FILES.tools);
    }

    // Dédoublonnage (au cas où des flags se recoupent)
    const seen = new Set();
    filesToDownload = filesToDownload.filter(f => {
        if (seen.has(f.local)) return false;
        seen.add(f.local);
        return true;
    });

    // ============================================================
    // TÉLÉCHARGEMENT
    // ============================================================
    ns.tprint("╔══════════════════════════════════════════════╗");
    ns.tprint("║    NEXUS-AEGIS — Auto-Updater v45.1          ║");
    ns.tprint("╚══════════════════════════════════════════════╝");
    ns.tprint(`📡 Source : ${BASE_URL}`);
    ns.tprint(`📦 Fichiers à télécharger : ${filesToDownload.length}\n`);

    let successful = 0;
    let failed     = 0;
    const failedFiles = [];

    for (const file of filesToDownload) {
        const url      = `${BASE_URL}/${file.remote}`;
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
                ns.tprint(`  ❌ ${file.local}  ← Échec du téléchargement`);
                failedFiles.push(file.local);
                failed++;
            }
        } catch (e) {
            ns.tprint(`  ❌ ${file.local}  ← Erreur : ${e}`);
            failedFiles.push(file.local);
            failed++;
        }

        await ns.sleep(80); // Petit délai pour ne pas saturer les requêtes
    }

    // ============================================================
    // RÉSUMÉ
    // ============================================================
    ns.tprint(`\n╔══════════════════════════════════════════════╗`);
    ns.tprint(`║  Mise à jour terminée — Nexus-Aegis v45.1    ║`);
    ns.tprint(`╚══════════════════════════════════════════════╝`);
    ns.tprint(`  ✅ Succès  : ${successful}`);
    ns.tprint(`  ❌ Échecs  : ${failed}`);
    ns.tprint(`  📦 Total   : ${filesToDownload.length}`);

    if (failedFiles.length > 0) {
        ns.tprint(`\n⚠️  Fichiers en échec :`);
        for (const f of failedFiles) ns.tprint(`     • ${f}`);
        ns.tprint(`\n🔧 Dépannage :`);
        ns.tprint(`   1. Vérifiez que le repo est PUBLIC sur GitHub`);
        ns.tprint(`   2. Vérifiez GITHUB_BRANCH (actuellement "${GITHUB_BRANCH}")`);
        ns.tprint(`   3. Vérifiez que les fichiers existent bien dans le repo`);
        ns.tprint(`   4. Noms de fichiers sensibles à la casse`);
    } else {
        ns.tprint(`\n🚀 Tout est à jour ! Lancez : run boot.js`);
    }
}
