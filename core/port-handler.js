/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Port Handler      │
 * ╰──────────────────────────────────────────────────╯
 * Description: API de communication réseau sécurisée (Netscript Ports).
 */

export class PortHandler {
    /** @param {NS} ns */
    constructor(ns) {
        this.ns = ns;
    }

    peek(portId) { return this.ns.peek(portId); }
    read(portId) { return this.ns.readPort(portId); }
    
    // tryWritePort prévient les deadlocks si un port est surchargé
    write(portId, data) { return this.ns.tryWritePort(portId, data); }
    
    clear(portId) { this.ns.clearPort(portId); }
    isEmpty(portId) { return this.ns.peek(portId) === "NULL PORT DATA"; }

    /**
     * @param {number} portId 
     * @param {Object} obj 
     * @returns {boolean} Succès de l'écriture
     */
    writeJSON(portId, obj) {
        try {
            return this.write(portId, JSON.stringify(obj));
        } catch (e) {
            return false;
        }
    }

    /**
     * @param {number} portId 
     * @returns {Object|null}
     */
    readJSON(portId) {
        const data = this.read(portId);
        if (data === "NULL PORT DATA" || !data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            // Évite de crasher si la donnée corrompue n'est pas un JSON valide
            return null;
        }
    }
}