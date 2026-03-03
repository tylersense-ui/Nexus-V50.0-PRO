# Audit PRO V2 – Architecture / Perf / Refactor

## Vue d’ensemble

- Fichiers scripts JS/TS analysés : **34**
- Total lignes de code : **2586**

## Fichiers les plus volumineux (complexité potentielle)

- Nexus-V50.0-PRO-main/core/batcher.js → 226 lignes
- Nexus-V50.0-PRO-main/core/dashboard.js → 157 lignes
- Nexus-V50.0-PRO-main/nexus-update.js → 136 lignes
- Nexus-V50.0-PRO-main/tools/nexus-greedy-swarm-v2.js → 136 lignes
- Nexus-V50.0-PRO-main/tools/pre-flight.js → 106 lignes
- Nexus-V50.0-PRO-main/managers/server-manager.js → 93 lignes
- Nexus-V50.0-PRO-main/managers/stock-master.js → 93 lignes
- Nexus-V50.0-PRO-main/managers/singularity.js → 92 lignes
- Nexus-V50.0-PRO-main/lib/network.js → 91 lignes
- Nexus-V50.0-PRO-main/managers/corp-manager.js → 89 lignes

## Scripts les plus coûteux potentiellement (Bitburner RAM/CPU estimée)

- Nexus-V50.0-PRO-main/tools/nexus-greedy-swarm-v2.js → score opérations H/G/W/sleep = 6
- Nexus-V50.0-PRO-main/core/batcher.js → score opérations H/G/W/sleep = 3
- Nexus-V50.0-PRO-main/hack/workers/grow.js → score opérations H/G/W/sleep = 2
- Nexus-V50.0-PRO-main/hack/workers/hack.js → score opérations H/G/W/sleep = 2
- Nexus-V50.0-PRO-main/hack/workers/weaken.js → score opérations H/G/W/sleep = 2
- Nexus-V50.0-PRO-main/managers/hacknet-manager.js → score opérations H/G/W/sleep = 2
- Nexus-V50.0-PRO-main/managers/server-manager.js → score opérations H/G/W/sleep = 2
- Nexus-V50.0-PRO-main/tools/pre-flight.js → score opérations H/G/W/sleep = 2
- Nexus-V50.0-PRO-main/boot.js → score opérations H/G/W/sleep = 1
- Nexus-V50.0-PRO-main/nexus-update.js → score opérations H/G/W/sleep = 1

## Dépendances croisées (imports détectés)

- Nexus-V50.0-PRO-main/boot.js → /lib/constants.js
- Nexus-V50.0-PRO-main/global-kill.js → /lib/constants.js
- Nexus-V50.0-PRO-main/core/batcher.js → /lib/constants.js, /lib/network.js, /lib/capabilities.js, /lib/logger.js
- Nexus-V50.0-PRO-main/core/dashboard.js → /lib/constants.js, /lib/network.js, /lib/capabilities.js, /core/port-handler.js
- Nexus-V50.0-PRO-main/core/orchestrator.js → /lib/constants.js, /lib/network.js, /lib/capabilities.js
- Nexus-V50.0-PRO-main/core/ram-manager.js → /lib/constants.js
- Nexus-V50.0-PRO-main/hack/controller.js → /core/port-handler.js, /lib/constants.js
- Nexus-V50.0-PRO-main/hack/watcher.js → /lib/constants.js, /lib/network.js, /lib/capabilities.js
- Nexus-V50.0-PRO-main/lib/logger.js → /lib/constants.js
- Nexus-V50.0-PRO-main/lib/network.js → /lib/constants.js
- Nexus-V50.0-PRO-main/managers/gang-manager.js → /lib/constants.js
- Nexus-V50.0-PRO-main/managers/hacknet-manager.js → /lib/constants.js, /lib/logger.js
- Nexus-V50.0-PRO-main/managers/program-manager.js → /lib/constants.js, /lib/logger.js, /lib/capabilities.js
- Nexus-V50.0-PRO-main/managers/server-manager.js → /lib/constants.js, /lib/logger.js
- Nexus-V50.0-PRO-main/managers/singularity.js → /lib/logger.js, /lib/constants.js
- Nexus-V50.0-PRO-main/managers/sleeve-manager.js → /lib/constants.js
- Nexus-V50.0-PRO-main/managers/stock-master.js → /lib/constants.js, /core/port-handler.js
- Nexus-V50.0-PRO-main/tools/pre-flight.js → /lib/constants.js, /core/port-handler.js
- Nexus-V50.0-PRO-main/tools/set-share.js → /lib/constants.js, /core/port-handler.js

## Duplication exacte détectée
- Aucune duplication binaire exacte

## Recommandations architecture (Bitburner oriented)


- Centraliser hack/grow/weaken dans un **core batch-engine** unique
- Mutualiser utils (format, log, math, net-scan) dans `/lib`
- Éviter scripts monolithiques > 400 lignes → découper modules
- Remplacer appels répétés sleep/boucles par scheduler unique
- Cache des scans réseau pour éviter rescan constant
- Paramétrage global via config.json


## Refactor proposé (structure cible)


/core
  scheduler.js
  batch-engine.js
  worker-hack.js
  worker-grow.js
  worker-weaken.js

/lib
  net.js
  format.js
  logger.js
  formulas.js
  ram-profiler.js

/features
  gang/
  stock/
  factions/
