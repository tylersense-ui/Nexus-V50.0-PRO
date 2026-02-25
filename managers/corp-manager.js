/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Corporation       │
 * ╰──────────────────────────────────────────────────╯
 * Description: Automatisation de la Mégacorporation.
 */

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    
    // Vérification de sécurité BN-Safe
    try {
        if (!ns.corporation.hasCorporation()) {
            try {
                ns.corporation.createCorporation("Nexus-Global", false); 
                ns.tprint("🏢 Nexus Global Corporation fondée !");
            } catch {
                ns.print("❌ Fonds insuffisants (150b) ou API Corp verrouillée. Arrêt du manager.");
                return;
            }
        }
    } catch (e) {
        ns.print("❌ API Corporation non disponible dans cette BitNode.");
        return;
    }

    const c = ns.corporation;
    const divisionName = "Nexus-Agro";
    
    if (!c.getCorporation().divisions.includes(divisionName)) {
        c.expandIndustry("Agriculture", divisionName);
    }

    ns.print("🚀 Nexus Corp-Master V50.0 : Gestion active...");

    while (true) {
        const corp = c.getCorporation();
        const division = c.getDivision(divisionName);

        for (const city of division.cities) {
            const office = c.getOffice(divisionName, city);
            
            // Assignation intelligente des employés
            if (office.size > office.numEmployees) {
                for (let i = office.numEmployees; i < office.size; i++) {
                    c.hireEmployee(divisionName, city);
                }
                await c.setAutoJobAssignment(divisionName, city, "Operations", Math.floor(office.size * 0.4));
                await c.setAutoJobAssignment(divisionName, city, "Engineer",   Math.floor(office.size * 0.3));
                await c.setAutoJobAssignment(divisionName, city, "Business",   Math.floor(office.size * 0.2));
                await c.setAutoJobAssignment(divisionName, city, "Management", Math.ceil(office.size  * 0.1));
            }

            // Upgrade de la taille du bureau
            if (corp.funds > c.getOfficeSizeUpgradeCost(divisionName, city, 3)) {
                c.upgradeOfficeSize(divisionName, city, 3);
            }
        }

        if (c.hasUnlock("Smart Supply")) {
            for (const city of division.cities) {
                c.setSmartSupply(divisionName, city, true);
            }
        }

        // Vente globale
        for (const city of division.cities) {
            c.sellMaterial(divisionName, city, "Plants", "MAX", "MP");
            c.sellMaterial(divisionName, city, "Food",   "MAX", "MP");
        }

        const upgrades = ["Smart Factories", "Neural Accelerators", "FocusWires", "ABC Sales"];
        for (const upgrade of upgrades) {
            if (corp.funds > c.getUpgradeLevelCost(upgrade)) {
                c.levelUpgrade(upgrade);
            }
        }

        await ns.sleep(5000); // FIX VITAL : Empêche le jeu de crasher (Timeout Loop)
    }
}