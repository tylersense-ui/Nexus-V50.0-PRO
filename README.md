# NEXUS v51.0 PRO - Automation Suite

NEXUS est un framework d'automatisation complet pour Bitburner. Conçu pour scaler du début de BitNode (Early Game) jusqu'au Late Game avec des Pétaoctets de RAM. Cette V51.0 intègre le Project Daedalus et prépare le terrain pour le Giga-Batcher optimisé.

## 🚀 Nouveautés de la V51.0
* **Project Daedalus (Pre-Flight & Importer)** : Refonte totale. Lecture correcte des valeurs de réputation (anti-kilo fix), interface élargie (1050x750), colonnes à taille fixe, tri intelligent en runs, et vérification stricte des prérequis.
* **Architecture Standardisée** : Mise à jour de tous les headers avec la nouvelle bannière ASCII "NEXUS" et le tag V51.0 PRO.
* **Préparation Batcher First-Fit** : Le cœur du système (`core/batcher.js`) est en cours de transition vers un algorithme d'allocation de RAM "First-Fit Decreasing" avec support `ns.formulas`.

## 🛠️ Démarrage Rapide
1. **Initialisation** : Exécutez `run tools/importer.js` pour générer votre base de données d'augmentations.
2. **Early Game** : Exécutez `run tools/tools/nexus-greedy-swarm-v2.js` pour lancer le Greedy Swarm sur la meilleure cible disponible.
3. **Transition** : Une fois la RAM suffisante et Formulas.exe acquis, exécutez `run global-kill.js --confirm`.
4. **Late Game** : Lancez `run boot.js` pour démarrer l'Orchestrateur, le Batcher avancé et les Managers.

5. **Achat d'Augmentations** : Surveillez vos finances avec `run tools/pre-flight.js`.
