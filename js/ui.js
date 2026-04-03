// ===== UI MODULE =====
const UI = {
    currentScreen: 'scanner',

    elements: {},

    init() {
        this.cacheElements();
        this.bindNavigation();
        this.bindBackButton();
    },

    cacheElements() {
        this.elements = {
            screens: {
                scanner: document.getElementById('screenScanner'),
                species: document.getElementById('screenSpecies'),
                detail: document.getElementById('screenDetail'),
                pheromones: document.getElementById('screenPheromones'),
                data: document.getElementById('screenData')
            },
            scanner: {
                frame: document.getElementById('scannerFrame'),
                scanLine: document.getElementById('scanLine'),
                trackingStatus: document.getElementById('trackingStatus'),
                coordinates: document.getElementById('coordinates'),
                bioMatch: document.getElementById('bioMatch'),
                bioMatchValue: document.getElementById('bioMatchValue'),
                scanProgress: document.getElementById('scanProgress'),
                scanProgressFill: document.getElementById('scanProgressFill'),
                infoPanel: document.getElementById('infoPanel'),
                antName: document.getElementById('antName'),
                antRole: document.getElementById('antRole'),
                antRarity: document.getElementById('antRarity'),
                antDiet: document.getElementById('antDiet'),
                targetLost: document.getElementById('targetLost'),
                subtitleText: document.getElementById('subtitleText'),
                scanBtn: document.getElementById('scanBtn')
            },
            header: {
                coinsValue: document.querySelector('.header__coins-value'),
                playerLevel: document.getElementById('playerLevel'),
                bioCredits: document.getElementById('bioCredits')
            },
            species: {
                grid: document.getElementById('speciesGrid'),
                scannedCount: document.getElementById('scannedCount'),
                totalSpecies: document.getElementById('totalSpecies')
            },
            detail: {
                content: document.getElementById('detailContent')
            },
            pheromones: {
                log: document.getElementById('pheromoneLog')
            },
            data: {
                totalScans: document.getElementById('totalScans'),
                uniqueSpecies: document.getElementById('uniqueSpecies'),
                totalCoinsEarned: document.getElementById('totalCoinsEarned'),
                rarestFind: document.getElementById('rarestFind'),
                historyList: document.getElementById('historyList'),
                buySuperScanner: document.getElementById('buySuperScanner')
            },
            coinPopup: document.getElementById('coinPopup'),
            coinPopupAmount: document.getElementById('coinPopupAmount'),
            coinPopupText: document.getElementById('coinPopupText'),
            notification: document.getElementById('notification'),
            notificationText: document.getElementById('notificationText')
        };
    },

    bindNavigation() {
        document.querySelectorAll('.bottom-nav__item').forEach(btn => {
            btn.addEventListener('click', () => {
                const screen = btn.dataset.screen;
                this.switchScreen(screen);
            });
        });
    },

    bindBackButton() {
        document.getElementById('backToSpecies').addEventListener('click', () => {
            this.switchScreen('species');
        });
    },

    switchScreen(screen) {
        // Hide all screens
        Object.values(this.elements.screens).forEach(s => s.classList.remove('active'));

        // Show target screen
        const targetScreen = this.elements.screens[screen];
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        // Update nav
        document.querySelectorAll('.bottom-nav__item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screen);
        });

        // Show/hide scan button
        const scanBtn = this.elements.scanner.scanBtn;
        scanBtn.style.display = screen === 'scanner' ? 'flex' : 'none';

        this.currentScreen = screen;

        // Trigger screen-specific updates
        if (screen === 'species') App.updateSpeciesGrid();
        if (screen === 'data') App.updateDataScreen();
    },

    // Scanner UI updates
    showScanStart() {
        const s = this.elements.scanner;
        s.frame.classList.add('active');
        s.scanLine.classList.add('active');
        s.scanProgress.classList.add('active');
        s.scanProgressFill.style.width = '0%';
        s.scanBtn.classList.add('scanning');
        s.targetLost.classList.remove('active');
        s.infoPanel.classList.remove('active');
        s.bioMatch.classList.remove('active');

        this.updateTrackingStatus('scanning');
        s.subtitleText.textContent = 'Анализ биометрических данных...';

        // Animate coordinates
        this.animateCoordinates();
    },

    showScanComplete(ant) {
        const s = this.elements.scanner;
        s.scanLine.classList.remove('active');
        s.scanProgress.classList.remove('active');
        s.scanBtn.classList.remove('scanning');

        // Show bio match
        s.bioMatch.classList.add('active');
        this.animateBioMatch(85 + Math.random() * 14);

        // Show info panel
        s.antName.textContent = ant.name;
        s.antRole.textContent = ant.role;
        s.antDiet.textContent = ant.diet;

        const rarityConfig = RARITY_CONFIG[ant.rarity];
        s.antRarity.textContent = `${rarityConfig.label} (+${ant.coins} монет)`;
        s.antRarity.className = 'info-panel__item-value info-panel__item-value--rarity';
        if (rarityConfig.cssClass) s.antRarity.classList.add(rarityConfig.cssClass);

        s.infoPanel.classList.add('active');
        this.updateTrackingStatus('found');

        // Show translation
        s.subtitleText.textContent = `"${Scanner.getRandomPhrase(ant)}"`;
    },

    showTargetLost() {
        const s = this.elements.scanner;
        s.frame.classList.remove('active');
        s.scanLine.classList.remove('active');
        s.scanProgress.classList.remove('active');
        s.scanBtn.classList.remove('scanning');
        s.infoPanel.classList.remove('active');
        s.bioMatch.classList.remove('active');
        s.targetLost.classList.add('active');

        this.updateTrackingStatus('lost');
        s.subtitleText.textContent = 'Сигнал потерян. Усики не видны - перевод невозможен.';

        setTimeout(() => {
            s.targetLost.classList.remove('active');
            this.resetScannerUI();
        }, 2500);
    },

    resetScannerUI() {
        const s = this.elements.scanner;
        s.frame.classList.remove('active');
        s.scanLine.classList.remove('active');
        s.scanProgress.classList.remove('active');
        s.scanBtn.classList.remove('scanning');
        s.infoPanel.classList.remove('active');
        s.bioMatch.classList.remove('active');
        s.targetLost.classList.remove('active');
        s.scanProgressFill.style.width = '0%';

        this.updateTrackingStatus('idle');
        s.subtitleText.textContent = IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)];
    },

    updateTrackingStatus(state) {
        const el = this.elements.scanner.trackingStatus;
        const textEl = el.querySelector('.tracking-status__text');

        el.className = 'tracking-status';
        switch (state) {
            case 'idle':
                textEl.textContent = 'ПОИСК ЦЕЛИ...';
                break;
            case 'scanning':
                textEl.textContent = 'ОТСЛЕЖИВАНИЕ АКТИВНО';
                el.classList.add('found');
                break;
            case 'found':
                textEl.textContent = 'ЦЕЛЬ ИДЕНТИФИЦИРОВАНА';
                el.classList.add('found');
                break;
            case 'lost':
                textEl.textContent = 'ЦЕЛЬ ПОТЕРЯНА';
                el.classList.add('lost');
                break;
        }
    },

    animateCoordinates() {
        const el = this.elements.scanner.coordinates;
        const lat = (30 + Math.random() * 30).toFixed(4);
        const lon = (100 + Math.random() * 80).toFixed(4);
        el.querySelector('span').textContent = `ШИР: ${lat}\u00B0 С | ДОЛ: ${lon}\u00B0 В`;
    },

    animateBioMatch(targetValue) {
        const el = this.elements.scanner.bioMatchValue;
        let current = 0;
        const step = targetValue / 30;
        const interval = setInterval(() => {
            current += step;
            if (current >= targetValue) {
                current = targetValue;
                clearInterval(interval);
            }
            el.textContent = current.toFixed(1);
        }, 30);
    },

    // Coins
    updateCoins(coins) {
        this.elements.header.coinsValue.textContent = coins;
    },

    showCoinPopup(amount, text) {
        const popup = this.elements.coinPopup;
        this.elements.coinPopupAmount.textContent = `+${amount}`;
        this.elements.coinPopupText.textContent = text;
        popup.classList.add('active');

        setTimeout(() => popup.classList.remove('active'), 1500);
    },

    updateLevel(level) {
        this.elements.header.playerLevel.textContent = level;
    },

    updateBioCredits(credits) {
        this.elements.header.bioCredits.textContent = credits;
    },

    // Species Grid
    renderSpeciesGrid(database, discovered) {
        const grid = this.elements.species.grid;
        grid.innerHTML = '';

        this.elements.species.totalSpecies.textContent = database.length;
        this.elements.species.scannedCount.textContent = discovered.size;

        database.forEach(ant => {
            const isDiscovered = discovered.has(ant.id);
            const card = document.createElement('div');
            card.className = `species-card ${isDiscovered ? 'discovered' : 'locked'} animate-in`;

            const rarityClass = `species-card__rarity-badge--${ant.rarity}`;

            card.innerHTML = `
                <span class="species-card__emoji">${isDiscovered ? ant.emoji : '?'}</span>
                <div class="species-card__name">${isDiscovered ? ant.name : '???'}</div>
                <div class="species-card__latin">${isDiscovered ? ant.latinName : 'НЕ ОБНАРУЖЕН'}</div>
                <span class="species-card__rarity-badge ${rarityClass}">
                    ${isDiscovered ? RARITY_CONFIG[ant.rarity].label.toUpperCase() : '???'}
                </span>
            `;

            if (isDiscovered) {
                card.addEventListener('click', () => {
                    this.showSpeciesDetail(ant);
                });
            }

            grid.appendChild(card);
        });
    },

    showSpeciesDetail(ant) {
        const container = this.elements.detail.content;
        const rarityConfig = RARITY_CONFIG[ant.rarity];

        // Build aggression bars
        let aggrBars = '';
        for (let i = 1; i <= 5; i++) {
            const filled = i <= ant.aggression ? 'filled' : '';
            const high = i <= ant.aggression && ant.aggression >= 4 ? 'high' : '';
            aggrBars += `<div class="detail__aggression-bar ${filled} ${high}"></div>`;
        }

        const aggrLabel = ant.aggression >= 4 ? 'Высокая' : ant.aggression >= 3 ? 'Средняя' : 'Низкая';

        container.innerHTML = `
            <div class="detail__emoji">${ant.emoji}</div>
            <h2 class="detail__name">${ant.name}</h2>
            <p class="detail__latin">(${ant.latinName})</p>

            <div class="detail__section">
                <div class="detail__section-title">БИОЛОГИЧЕСКИЙ ПРОФИЛЬ</div>
                <div class="detail__info-grid">
                    <div class="detail__info-item">
                        <div class="detail__info-label">ОСНОВНАЯ РОЛЬ</div>
                        <div class="detail__info-value">${ant.role}</div>
                    </div>
                    <div class="detail__info-item">
                        <div class="detail__info-label">ДИЕТА</div>
                        <div class="detail__info-value">${ant.diet}</div>
                    </div>
                </div>
            </div>

            <div class="detail__section">
                <div class="detail__section-title">АГРЕССИЯ</div>
                <div class="detail__aggression">
                    ${aggrBars}
                    <span class="detail__aggression-label">${aggrLabel}</span>
                </div>
            </div>

            <div class="detail__section">
                <div class="detail__section-title">СИЛА СИГНАЛА</div>
                <div class="detail__signal">
                    <div class="detail__signal-bar"></div>
                    <div class="detail__signal-bar"></div>
                    <div class="detail__signal-bar"></div>
                    <div class="detail__signal-bar"></div>
                    <div class="detail__signal-bar"></div>
                    <span class="detail__signal-text">Активен</span>
                </div>
            </div>

            <div class="detail__behavior">
                <div class="detail__behavior-title">ПОВЕДЕНЧЕСКИЙ АНАЛИЗ</div>
                <p class="detail__behavior-text">${ant.description}</p>
            </div>
        `;

        this.switchScreen('detail');
    },

    // Pheromone Log
    addPheromoneEntry(ant, phrase) {
        const log = this.elements.pheromones.log;

        // Remove empty state
        const empty = log.querySelector('.pheromone-empty');
        if (empty) empty.remove();

        const now = new Date();
        const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const entry = document.createElement('div');
        entry.className = 'pheromone-entry animate-in';
        entry.innerHTML = `
            <div class="pheromone-entry__header">
                <span class="pheromone-entry__species">${ant.emoji} ${ant.name}</span>
                <span class="pheromone-entry__time">${time}</span>
            </div>
            <p class="pheromone-entry__text">"${phrase}"</p>
            <span class="pheromone-entry__label">ЖИВОЙ ПЕРЕВОД ФЕРОМОНОВ</span>
        `;

        log.insertBefore(entry, log.firstChild);

        // Keep max 50 entries
        while (log.children.length > 50) {
            log.removeChild(log.lastChild);
        }
    },

    // Data Screen
    updateDataStats(stats) {
        this.elements.data.totalScans.textContent = stats.totalScans;
        this.elements.data.uniqueSpecies.textContent = stats.uniqueSpecies;
        this.elements.data.totalCoinsEarned.textContent = stats.totalCoinsEarned;
        this.elements.data.rarestFind.textContent = stats.rarestFind || '--';
    },

    renderHistory(history) {
        const list = this.elements.data.historyList;
        if (history.length === 0) {
            list.innerHTML = '<div class="history__empty">Нет данных</div>';
            return;
        }

        list.innerHTML = '';
        history.slice(-20).reverse().forEach(entry => {
            const item = document.createElement('div');
            item.className = 'history__item';
            item.innerHTML = `
                <div class="history__item-left">
                    <span class="history__item-emoji">${entry.emoji}</span>
                    <div class="history__item-info">
                        <span class="history__item-name">${entry.name}</span>
                        <span class="history__item-time">${entry.time}</span>
                    </div>
                </div>
                <span class="history__item-coins">+${entry.coins}</span>
            `;
            list.appendChild(item);
        });
    },

    updateShopButton(coins) {
        const btn = this.elements.data.buySuperScanner;
        btn.disabled = coins < 1000;
    },

    // Notifications
    showNotification(text, duration = 2000) {
        const el = this.elements.notification;
        this.elements.notificationText.textContent = text;
        el.classList.add('active');
        setTimeout(() => el.classList.remove('active'), duration);
    }
};
