// ===== SCANNER MODULE =====
const Scanner = {
    video: null,
    canvas: null,
    ctx: null,
    stream: null,
    isActive: false,
    isScanning: false,
    scanProgress: 0,
    scanInterval: null,
    currentAnt: null,
    motionDetected: false,
    lastFrame: null,
    motionThreshold: 15,
    motionCheckInterval: null,
    scanDuration: 3000, // 3 seconds to complete scan

    async init() {
        this.video = document.getElementById('cameraFeed');
        this.canvas = document.getElementById('scannerCanvas');
        this.ctx = this.canvas.getContext('2d');
        await this.startCamera();
    },

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            this.video.srcObject = this.stream;
            this.video.addEventListener('loadedmetadata', () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.isActive = true;
                this.startMotionDetection();
            });
        } catch (err) {
            console.warn('Camera not available, using simulation mode');
            this.startSimulationMode();
        }
    },

    startSimulationMode() {
        const container = document.querySelector('.camera-container');
        container.style.background = 'linear-gradient(135deg, #0a1a0a 0%, #0a0e14 50%, #0a140a 100%)';

        // Draw simulated environment on canvas
        this.canvas.width = 420;
        this.canvas.height = 600;
        this.drawSimulatedScene();
        this.isActive = true;

        // Simulate periodic motion
        setInterval(() => {
            this.motionDetected = Math.random() > 0.3;
        }, 2000);
    },

    drawSimulatedScene() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background - earth/grass
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1a2810');
        grad.addColorStop(0.3, '#0d1a08');
        grad.addColorStop(0.7, '#1a1408');
        grad.addColorStop(1, '#0f0a05');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Grass blades
        for (let i = 0; i < 30; i++) {
            ctx.strokeStyle = `rgba(34, ${80 + Math.random() * 60}, 20, ${0.3 + Math.random() * 0.4})`;
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.beginPath();
            const x = Math.random() * w;
            const y = Math.random() * h * 0.4;
            ctx.moveTo(x, y + 40);
            ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 30, y, x + (Math.random() - 0.5) * 20, y - 20);
            ctx.stroke();
        }

        // Small dirt particles
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(${60 + Math.random() * 40}, ${40 + Math.random() * 30}, ${20 + Math.random() * 20}, ${0.2 + Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.arc(Math.random() * w, h * 0.4 + Math.random() * h * 0.6, 1 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tiny twigs
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(100, 70, 40, ${0.3 + Math.random() * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            const tx = Math.random() * w;
            const ty = h * 0.5 + Math.random() * h * 0.4;
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + 20 + Math.random() * 30, ty + (Math.random() - 0.5) * 10);
            ctx.stroke();
        }

        // Scan grid overlay
        ctx.strokeStyle = 'rgba(0, 255, 213, 0.03)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < w; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    },

    startMotionDetection() {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        this.motionCheckInterval = setInterval(() => {
            if (!this.isActive || !this.video.videoWidth) return;

            tempCanvas.width = 64;
            tempCanvas.height = 48;
            tempCtx.drawImage(this.video, 0, 0, 64, 48);
            const frame = tempCtx.getImageData(0, 0, 64, 48);

            if (this.lastFrame) {
                let diff = 0;
                for (let i = 0; i < frame.data.length; i += 16) {
                    diff += Math.abs(frame.data[i] - this.lastFrame.data[i]);
                }
                const avgDiff = diff / (frame.data.length / 16);
                this.motionDetected = avgDiff > this.motionThreshold;
            }

            this.lastFrame = frame;
        }, 500);
    },

    startScan(callback) {
        if (this.isScanning) return;
        this.isScanning = true;
        this.scanProgress = 0;

        // Choose a random ant (weighted by rarity)
        this.currentAnt = this.chooseRandomAnt();

        const startTime = Date.now();
        const progressEl = document.getElementById('scanProgressFill');

        this.scanInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            this.scanProgress = Math.min(elapsed / this.scanDuration, 1);
            progressEl.style.width = (this.scanProgress * 100) + '%';

            // Simulate "target lost" if motion stops (10% chance per tick)
            if (Math.random() < 0.02 && this.scanProgress < 0.9 && this.scanProgress > 0.1) {
                this.targetLost(callback);
                return;
            }

            if (this.scanProgress >= 1) {
                clearInterval(this.scanInterval);
                this.scanInterval = null;
                this.isScanning = false;
                callback('complete', this.currentAnt);
            }
        }, 50);

        callback('start', this.currentAnt);
    },

    chooseRandomAnt() {
        // Weighted random selection
        const weights = ANT_DATABASE.map(ant => {
            if (ant.rarity === 'legendary') return 5;
            if (ant.rarity === 'rare') return 20;
            return 75;
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < ANT_DATABASE.length; i++) {
            random -= weights[i];
            if (random <= 0) return ANT_DATABASE[i];
        }
        return ANT_DATABASE[0];
    },

    targetLost(callback) {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
        this.isScanning = false;
        this.scanProgress = 0;
        callback('lost', null);
    },

    cancelScan() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        this.isScanning = false;
        this.scanProgress = 0;
    },

    getRandomPhrase(ant) {
        if (!ant) return IDLE_PHRASES[Math.floor(Math.random() * IDLE_PHRASES.length)];
        return ant.phrases[Math.floor(Math.random() * ant.phrases.length)];
    },

    destroy() {
        this.cancelScan();
        if (this.motionCheckInterval) {
            clearInterval(this.motionCheckInterval);
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.isActive = false;
    }
};
