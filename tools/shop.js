/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Tool: Shop Editor         │
 * ╰──────────────────────────────────────────────────╯
 * Description: Éditeur manuel de la base de données Todo.
 */

/** @param {NS} ns **/
export async function main(ns) {
    const augName = ns.args.join(" ");
    const FILE_PATH = "data/todo.json";

    if (!augName || augName.trim() === "") {
        ns.tprint("❌ Usage: run tools/shop.js [Nom de l'augmentation]");
        return;
    }

    if (!ns.fileExists(FILE_PATH)) {
        ns.tprint("❌ Erreur : data/todo.json n'existe pas. Utilisez importer.js d'abord.");
        return;
    }

    let data;
    try {
        data = JSON.parse(ns.read(FILE_PATH));
    } catch (e) {
        ns.tprint("❌ Erreur : Impossible de lire la base de données Todo.");
        return;
    }

    let found = false;

    data = data.map(aug => {
        if (aug.name.toLowerCase() === augName.toLowerCase()) {
            aug.bought = true;
            found = true;
        }
        return aug;
    });

    if (found) {
        await ns.write(FILE_PATH, JSON.stringify(data, null, 2), "w");
        ns.tprint(`✅ Nexus-Apex : '${augName}' marqué comme ACHETÉ.`);
    } else {
        ns.tprint(`❓ Erreur : '${augName}' introuvable dans la liste.`);
    }
}