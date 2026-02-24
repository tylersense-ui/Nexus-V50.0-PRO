/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Logger            │
 * ╰──────────────────────────────────────────────────╯
 * Description: Système de logging standardisé avec codes couleurs.
 */

import { CONFIG } from "/lib/constants.js";

export class Logger {
    /** @param {NS} ns @param {string} moduleName **/
    constructor(ns, moduleName) {
        this.ns = ns;
        this.module = moduleName.toUpperCase();
        this.colors = CONFIG.COLORS;
        this.debugEnabled = CONFIG.SYSTEM.DEBUG_MODE;
    }

    info(msg) { this._print("INFO", this.colors.INFO, msg); }
    success(msg) { this._print("SUCCESS", this.colors.SUCCESS, msg); }
    warn(msg) { this._print("WARN", this.colors.WARN, msg); }
    
    error(msg) {
        this._print("ERROR", this.colors.ERROR, msg);
        this.ns.toast(`[${this.module}] ERROR: ${msg}`, "error", 5000);
    }

    debug(msg) {
        if (this.debugEnabled) this._print("DEBUG", this.colors.DEBUG, msg);
    }

    _print(level, color, msg) {
        const timestamp = new Date().toLocaleTimeString([], { hour12: false });
        const output = `${color}[${timestamp}][${this.module}][${level}] ${msg}${this.colors.RESET}`;
        this.ns.print(output);
    }
}