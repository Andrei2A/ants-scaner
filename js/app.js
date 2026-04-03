// ===== MAIN APP CONTROLLER =====
const App = {
    state: {
        coins: 0,
        totalCoinsEarned: 0,
        totalScans: 0,
        level: 1,
        bioCredits: 0,
        discoveredSpecies: new Set(),
        scanHistory: [],
        pheromoneLog: [],
        superScannerUnlocked: false
    },

    async init() {
        this.loadState();
        UI.init();
        await Scanner.init();
        this.bindEvents();
        this.updateUI();
        this.startIdlePhraseRotation();
    },

    bindEvents() {
        // Scan button
        const scanBtn = document.getElementById('scanBtn');
        scanBtn.addEventListener('click', () => this.handleScan());

        // Buy super scanner
        document.getElementById('buySuperScanner').addEventListener('click', () => {
            this.buySuperScanner();
        });

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && UI.currentScreen === 'scanner') {
                e.preventDefault();
                this.handleScan();
            }
        });
    },

    handleScan() {
        if (Scanner.isScanning) {
            Scanner.cancelScan();
            UI.resetScannerUI();
            return;
        }

        Scanner.startScan((event, ant) => {
            switch (event) {
                case 'start':
                    UI.showScanStart();
                    break;
                case 'complete':
                    this.onScanComplete(ant);
                    break;
                case 'lost':
                    UI.showTargetLost();
                    break;
            }
        });
    },

    onScanComplete(ant) {
        UI.showScanComplete(ant);

        // Add coins
        this.state.coins += ant.coins;
        this.state.totalCoinsEarned += ant.coins;
        this.state.totalScans++;

        // Discover species
        const isNew = !this.state.discoveredSpecies.has(ant.id);
        this.state.discoveredSpecies.add(ant.id);

        // Add bio credits
        this.state.bioCredits += Math.floor(ant.coins / 2);

        // Calculate level
        this.state.level = Math.floor(this.state.totalScans / 5) + 1;

        // Show coin popup
        UI.showCoinPopup(ant.coins, ant.rarityLabel);

        if (isNew) {
            setTimeout(() => {
                UI.showNotification(`НОВЫЙ ВИД ОБНАРУЖЕН: ${ant.name}!`, 3000);
            }, 1600);
        }

        // Add to history
        const now = new Date();
        const historyEntry = {
            id: ant.id,
            name: ant.name,
            emoji: ant.emoji,
            coins: ant.coins,
            rarity: ant.rarity,
            time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        };
        this.state.scanHistory.push(historyEntry);

        // Add pheromone entry
        const phrase = Scanner.getRandomPhrase(ant);
        UI.addPheromoneEntry(ant, phrase);
        this.state.pheromoneLog.push({
            species: ant.name,
            phrase: phrase,
            time: historyEntry.time
        });

        this.updateUI();
        this.saveState();

        // Auto-reset scanner after delay
        setTimeout(() => {
            UI.resetScannerUI();
        }, 5000);
    },

    buySuperScanner() {
        if (this.state.coins >= 1000 && !this.state.superScannerUnlocked) {
            this.state.coins -= 1000;
            this.state.superScannerUnlocked = true;
            UI.showNotification('СУПЕР-СКАНЕР РАЗБЛОКИРОВАН! Доступ к новым видам открыт!', 4000);
            this.updateUI();
            this.saveState();
        }
    },

    updateUI() {
        UI.updateCoins(this.state.coins);
        UI.updateLevel(this.state.level);
        UI.updateBioCredits(this.state.bioCredits);
        UI.updateShopButton(this.state.coins);
    },

    updateSpeciesGrid() {
        UI.renderSpeciesGrid(ANT_DATABASE, this.state.discoveredSpecies);
    },

    updateDataScreen() {
        // Find rarest
        let rarestFind = null;
        const rarityOrder = { legendary: 3, rare: 2, common: 1 };
        this.state.scanHistory.forEach(entry => {
            if (!rarestFind || rarityOrder[entry.rarity] > rarityOrder[rarestFind.rarity]) {
                rarestFind = entry;
            }
        });

        UI.updateDataStats({
            totalScans: this.state.totalScans,
            uniqueSpecies: this.state.discoveredSpecies.size,
            totalCoinsEarned: this.state.totalCoinsEarned,
            rarestFind: rarestFind ? rarestFind.name : null
        });

        UI.renderHistory(this.state.scanHistory);
    },

    startIdlePhraseRotation() {
        setInterval(() => {
            if (UI.currentScreen === 'scanner' && !Scanner.isScanning) {
                const subtitleText = document.getElementById('subtitleText');
                if (!document.getElementById('infoPanel').classList.contains('active')) {
                    subtitleText.textContent = IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)];
                }
            }
        }, 4000);
    },

    // Persistence
    saveState() {
        const data = {
            coins: this.state.coins,
            totalCoinsEarned: this.state.totalCoinsEarned,
            totalScans: this.state.totalScans,
            level: this.state.level,
            bioCredits: this.state.bioCredits,
            discoveredSpecies: [...this.state.discoveredSpecies],
            scanHistory: this.state.scanHistory.slice(-100),
            superScannerUnlocked: this.state.superScannerUnlocked
        };
        try {
            localStorage.setItem('antTranslatorPro', JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save state:', e);
        }
    },

    loadState() {
        try {
            const data = JSON.parse(localStorage.getItem('antTranslatorPro'));
            if (data) {
                this.state.coins = data.coins || 0;
                this.state.totalCoinsEarned = data.totalCoinsEarned || 0;
                this.state.totalScans = data.totalScans || 0;
                this.state.level = data.level || 1;
                this.state.bioCredits = data.bioCredits || 0;
                this.state.discoveredSpecies = new Set(data.discoveredSpecies || []);
                this.state.scanHistory = data.scanHistory || [];
                this.state.superScannerUnlocked = data.superScannerUnlocked || false;
            }
        } catch (e) {
            console.warn('Could not load state:', e);
        }
    }
};

// ===== START =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
