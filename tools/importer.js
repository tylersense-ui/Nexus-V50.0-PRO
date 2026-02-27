/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V51.0 PRO - BN1 SAFE | Tool: Importer            │
 * ╰──────────────────────────────────────────────────╯
 * Description: Générateur du plan de vol Daedalus (Filtre dynamique + Prérequis).
 * Usage: run /tools/importer.js [Faction1] [Faction2] ...
 */

/** @param {NS} ns **/
export async function main(ns) {
    const INPUT_FILE = "Liste_Cannonique_augmentations_bitburner.txt";
    const OUTPUT_FILE = "data/todo.json";
    
    // Factions par défaut si aucun argument n'est fourni
    let TARGET_FACTIONS = ["CyberSec", "NiteSec", "The Black Hand", "BitRunners"];
    
    if (ns.args.length > 0) {
        TARGET_FACTIONS = ns.args.map(a => a.toString());
    }

    if (!ns.fileExists(INPUT_FILE)) {
        ns.tprint(`❌ Erreur : ${INPUT_FILE} introuvable.`);
        return;
    }

    const content = ns.read(INPUT_FILE);
    const lines = content.split("\n");
    const todo = [];

    ns.tprint(`🔍 Filtrage du manifeste pour : ${TARGET_FACTIONS.join(", ")}...`);

    for (let line of lines) {
        if (!line.includes("|") || line.startsWith("Légende") || line.startsWith("╭") || line.startsWith("│") || line.startsWith("╰") || line.startsWith("├")) continue;

        const parts = line.split("|").map(p => p.trim());
        const name = parts[0];
        let priceRaw = parts[1];
        let repRaw = parts[2];
        const factionsStr = parts[3] || "";
        // Support de la nouvelle colonne : si vide, on considère "Aucun"
        const prereqRaw = parts[4] || "Aucun"; 
        
        const factions = factionsStr.split(",").map(f => f.trim());
        const isNFG = name.includes("NeuroFlux Governor");
        
        const isTarget = isNFG || factions.some(f => TARGET_FACTIONS.includes(f));
        
        if (isTarget) {
            const parseNexusVal = (str) => {
                if (!str) return 0;
                let val = str.replace(/[$,\s]/g, "").toLowerCase();
                let multiplier = 1;
                if (val.endsWith("k"))      { multiplier = 1e3;  val = val.slice(0, -1); }
                else if (val.endsWith("m")) { multiplier = 1e6;  val = val.slice(0, -1); }
                else if (val.endsWith("b")) { multiplier = 1e9;  val = val.slice(0, -1); }
                else if (val.endsWith("t")) { multiplier = 1e12; val = val.slice(0, -1); }
                return parseFloat(val.replace(",", "")) * multiplier || 0;
            };

            const prereqs = (prereqRaw.toLowerCase() === "aucun" || prereqRaw === "") ? [] : prereqRaw.split(",").map(s => s.trim());

            todo.push({
                name: name,
                price: parseNexusVal(priceRaw),
                rep: parseNexusVal(repRaw),
                bought: false,
                faction: isNFG ? "All" : factions.find(f => TARGET_FACTIONS.includes(f)),
                prereqs: prereqs
            });
        }
    }

    const uniqueTodo = [];
    const seen = new Set();
    for (const item of todo) {
        if (!seen.has(item.name)) {
            seen.add(item.name);
            uniqueTodo.push(item);
        }
    }

    await ns.write(OUTPUT_FILE, JSON.stringify(uniqueTodo, null, 2), "w");
    ns.tprint(`✅ Succès : ${uniqueTodo.length} augmentations importées dans ${OUTPUT_FILE}.`);
}