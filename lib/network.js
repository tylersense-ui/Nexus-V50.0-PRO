/**
 * ╭──────────────────────────────────────────────────╮
 * │  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗     │
 * │  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝     │
 * │  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗     │
 * │  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║     │
 * │  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║     │
 * │  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     │
 * ├──────────────────────────────────────────────────┤
 * │ V50.0 PRO - BN1 SAFE | Module: Network Scanner   │
 * ╰──────────────────────────────────────────────────╯
 * Description: Cartographie, cracking et scoring mathématique des cibles.
 */

import { CONFIG } from "/lib/constants.js";

export class Network {
    /** @param {NS} ns @param {Capabilities} caps **/
    constructor(ns, caps) {
        this.ns = ns;
        this.caps = caps;
    }

    refresh() {
        let servers = ["home"];
        for (let i = 0; i < servers.length; i++) {
            let neighbors = this.ns.scan(servers[i]);
            for (let next of neighbors) {
                if (!servers.includes(next)) servers.push(next);
            }
        }
        return servers;
    }

    calculateScore(hostname) {
        const s = this.ns.getServer(hostname);
        const player = this.ns.getPlayer();

        if (hostname === "home" || s.purchasedByPlayer || s.moneyMax === 0) return 0;
        if (s.requiredHackingSkill > player.skills.hacking) return 0;
        if (s.minDifficulty > CONFIG.HACKING.MAX_TARGET_DIFFICULTY) return 0;

        // Si Formulas est disponible et activé
        if (this.caps.formulas && CONFIG.HACKING.PREFER_FORMULAS) {
            try {
                const t = this.ns.formulas.hacking.weakenTime(s, player);
                return (s.moneyMax / t);
            } catch (e) { /* Repli silencieux sur le calcul natif */ }
        }

        // Calcul natif (BN1 Safe) : Ratio argent max / difficulté minimale
        return s.moneyMax / s.minDifficulty;
    }

    crack(hostname) {
        if (this.ns.hasRootAccess(hostname)) return true;

        if (this.caps.brutessh) this.ns.brutessh(hostname);
        if (this.caps.ftpcrack) this.ns.ftpcrack(hostname);
        if (this.caps.relaysmtp) this.ns.relaysmtp(hostname);
        if (this.caps.httpworm) this.ns.httpworm(hostname);
        if (this.caps.sqlinject) this.ns.sqlinject(hostname);

        try {
            this.ns.nuke(hostname);
            return true;
        } catch (e) {
            return false;
        }
    }

    getBestTarget() {
        const top = this.getTopTargets(1);
        return top.length > 0 ? top[0] : "n00dles";
    }

    getTopTargets(count = 5) {
        const allServers = this.refresh();
        let targets = [];

        for (const host of allServers) {
            const score = this.calculateScore(host);
            if (score > 0) targets.push({ name: host, score: score });
        }

        return targets
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(t => t.name);
    }
}