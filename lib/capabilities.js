/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Capabilities      │
 * ╰──────────────────────────────────────────────────╯
 * Description: Détection dynamique et sécurisée des accès API.
 */

export class Capabilities {
    /** @param {NS} ns **/
    constructor(ns) {
        this.ns = ns;
        this._singularityDetected = null;
        this.update();
    }

    update() {
        const ns = this.ns;

        // Logiciels de crack de base
        this.brutessh  = ns.fileExists("BruteSSH.exe",  "home");
        this.ftpcrack  = ns.fileExists("FTPCrack.exe",  "home");
        this.relaysmtp = ns.fileExists("relaySMTP.exe", "home");
        this.httpworm  = ns.fileExists("HTTPWorm.exe",  "home");
        this.sqlinject = ns.fileExists("SQLInject.exe", "home");
        this.formulas  = ns.fileExists("Formulas.exe",  "home");

        // Bourse (Vérification silencieuse)
        this.tix = false;
        this.has4S = false;
        try {
            if (ns.stock) {
                this.tix = ns.stock.hasTIXAPIAccess();
                this.has4S = ns.stock.has4SDataAPIAccess();
            }
        } catch (e) { /* API non débloquée */ }

        // Singularity (Vérification une seule fois pour économiser du CPU)
        if (this._singularityDetected === null) {
            try {
                // Tenter un appel inoffensif pour vérifier l'accès
                ns.singularity.getOwnedAugmentations();
                this._singularityDetected = true;
            } catch (e) {
                this._singularityDetected = false;
            }
        }
        this.singularity = this._singularityDetected;
    }
}