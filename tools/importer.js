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
 * Description: Générateur du plan de vol (Filtre dynamique + Prérequis).
 * Fix: Correctif "Anti-Farfelu" pour la réputation et Brand "NEXUS".
 */

/** @param {NS} ns **/
export async function main(ns) {
    const INPUT_FILE = "Liste_Cannonique_augmentations_bitburner.txt";
    const OUTPUT_FILE = "data/todo.json";
    
    let TARGET_FACTIONS = ["CyberSec", "NiteSec", "The Black Hand", "BitRunners", "Tian Di Hui", "Slum Snakes"];
    if (ns.args.length > 0) TARGET_FACTIONS = ns.args.map(a => a.toString());

    if (!ns.fileExists(INPUT_FILE)) {
        ns.tprint(`❌ Erreur : ${INPUT_FILE} introuvable.`);
        return;
    }

    const lines = ns.read(INPUT_FILE).split("\n");
    const todo = [];

    ns.tprint(`\n===========================================================`);
    ns.tprint(`>> NEXUS v51.0 | IMPORTER | PROJECT DAEDALUS`);
    ns.tprint(`===========================================================`);

    for (let line of lines) {
        if (!line.includes("|") || line.startsWith("Légende") || line.startsWith("╭")) continue;

        const parts = line.split("|").map(p => p.trim());
        const name = parts[0];
        const priceRaw = parts[1];
        const repRaw = parts[2];
        const factionsStr = parts[3] || "";
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
                
                let parsedNumber = parseFloat(val);
                if (multiplier === 1e3 && parsedNumber >= 1000) multiplier = 1;
                return parsedNumber * multiplier || 0;
            };

            todo.push({
                name: name,
                price: parseNexusVal(priceRaw),
                rep: parseNexusVal(repRaw),
                bought: false,
                faction: isNFG ? "All" : factions.find(f => TARGET_FACTIONS.includes(f)),
                prereqs: (prereqRaw.toLowerCase() === "aucun") ? [] : prereqRaw.split(",").map(s => s.trim())
            });
        }
    }

    const finalData = Array.from(new Map(todo.map(item => [item.name, item])).values());
    await ns.write(OUTPUT_FILE, JSON.stringify(finalData, null, 2), "w");
    ns.tprint(`✅ Succès : ${finalData.length} augmentations Nexus dans ${OUTPUT_FILE}.`);
}