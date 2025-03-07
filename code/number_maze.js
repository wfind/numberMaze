const DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

const COLOR = {
    START: 'rgba(76, 175, 80, 0.8)',
    END: 'rgba(244, 67, 54, 0.8)',
    PATH: 'rgba(255, 235, 59, 0.7)',
    EMPTY: 'rgba(255, 255, 255, 0.8)',
    BORDER: 'rgba(0, 0, 0, 0.2)',
    TEXT: {
        NORMAL: 'rgba(0, 0, 0, 0.8)',
        ENDPOINT: 'rgba(255, 255, 255, 1)'
    }
};

class Firework {
    constructor(canvasWidth, canvasHeight) {
        const launchAreaWidth = canvasWidth * 0.2;
        this.x = (canvasWidth - launchAreaWidth) / 2 + Math.random() * launchAreaWidth;
        this.y = canvasHeight;
        this.color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        this.velocity = {
            x: Math.random() * 6 - 3,
            y: Math.random() * -3 - 3
        };
        this.particles = [];
        this.life = 60;
    }

    update(ctx) {
        this.life--;

        if (this.life > 0) {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.velocity.y += 0.05; // Gravity effect

            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.particles.length === 0) {
            this.explode();
        }

        this.particles.forEach((particle, index) => {
            particle.update();
            particle.draw(ctx);
            if (particle.alpha <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }

    explode() {
        for (let i = 0; i < 100; i++) {
            this.particles.push(new Particle(this.x, this.y, this.color));
        }
    }

    isDead() {
        return this.life <= 0 && this.particles.length === 0;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.015;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.05;
        this.alpha -= this.decay;
    }

    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class NumberMaze {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.hexagons = [];
        this.start = null;
        this.end = null;
        this.path = null;
        this.missingNumbers = new Set();
        this.statusDisplay = document.getElementById('status');

        this.difficultySettings = {
            [DIFFICULTY.EASY]: { sideLength: 2, hiddenNumbersRange: [3, 4], totalHexagons: 7 },
            [DIFFICULTY.MEDIUM]: { sideLength: 3, hiddenNumbersRange: [7, 10], totalHexagons: 19 },
            [DIFFICULTY.HARD]: { sideLength: 4, hiddenNumbersRange: [7, 20], totalHexagons: 37 }
        };

        this.startTime = 0;
        this.elapsedTime = 0;
        this.steps = 0;
        this.score = 0;
        this.timerInterval = null;

        this.timeDisplay = document.getElementById('timeDisplay');
        this.stepsDisplay = document.getElementById('stepsDisplay');
        this.scoreDisplay = document.getElementById('scoreDisplay');

        this.setupEventListeners();
        this.resizeCanvas();

        this.pathAnimation = null;
        this.celebrationAnimation = null;

        this.gravity = 0.3;

        this.moveHistory = [];
    }

    resizeCanvas = () => {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const aspectRatio = 3 / 4;
        let width, height;

        if (containerWidth / containerHeight > aspectRatio) {
            height = containerHeight;
            width = height * aspectRatio;
        } else {
            width = containerWidth;
            height = width / aspectRatio;
        }

        this.canvas.width = width;
        this.canvas.height = height;

        if (this.hexagons.length > 0) {
            this.updateHexagonSizes();
            this.drawPath();
        }
    };

    setupEventListeners = () => {
        document.getElementById('newGame').addEventListener('click', this.startNewGame);
        document.getElementById('undoButton').addEventListener('click', this.undoMove);
        this.canvas.addEventListener('click', this.handleClick);
        window.addEventListener('resize', this.resizeCanvas);
    };

    startNewGame = () => {
        if (this.pathAnimation) cancelAnimationFrame(this.pathAnimation);
        if (this.celebrationAnimation) cancelAnimationFrame(this.celebrationAnimation);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.steps = 0;
        this.score = 0;
        this.moveHistory = [];

        this.updateUndoButton();
        this.updateDisplays();

        this.startTimer();

        const difficulty = document.getElementById('difficultySelect').value;
        const settings = this.difficultySettings[difficulty];
        this.sideLength = settings.sideLength;
        this.hiddenNumbersRange = settings.hiddenNumbersRange;
        this.totalHexagons = settings.totalHexagons;

        this.resizeCanvas();
        this.drawPattern();

        this.generatePath();
        this.hideRandomNumbers();
        this.drawPath();
        this.statusDisplay.textContent = "Game started! Fill in the missing numbers.";
    };

    hideRandomNumbers() {
        this.missingNumbers.clear();
        const pathWithoutEnds = this.path.slice(1, -1);
        const shuffled = pathWithoutEnds.sort(() => 0.5 - Math.random());

        const hiddenCount = Math.floor(Math.random() * (this.hiddenNumbersRange[1] - this.hiddenNumbersRange[0] + 1)) + this.hiddenNumbersRange[0];

        shuffled.slice(0, hiddenCount).forEach(hexagon => {
            this.missingNumbers.add(hexagon.value);
            delete hexagon.value;
        });
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateDisplays();
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    updateDisplays() {
        this.timeDisplay.textContent = `Time: ${this.elapsedTime}s`;
        this.stepsDisplay.textContent = `Steps: ${this.steps}`;
        this.scoreDisplay.textContent = `Score: ${this.score}`;
    }

    drawPattern() {
        this.hexagons = [];
        const size = this.calculateHexagonSize();
        const horizontalSpacing = size * Math.sqrt(3);
        const verticalSpacing = size * 1.5;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        for (let q = -this.sideLength + 1; q < this.sideLength; q++) {
            for (let r = -this.sideLength + 1; r < this.sideLength; r++) {
                const s = -q - r;
                if (Math.abs(s) < this.sideLength) {
                    const x = centerX + horizontalSpacing * (q + r / 2);
                    const y = centerY + verticalSpacing * r;
                    const vertices = this.calculateHexagonVertices(x, y, size);
                    this.hexagons.push({ x, y, q, r, s, size, vertices });
                }
            }
        }
    }

    calculateHexagonSize() {
        const minDimension = Math.min(this.canvas.width, this.canvas.height);
        const totalHexagons = this.difficultySettings[document.getElementById('difficultySelect').value].totalHexagons;
        return Math.floor(minDimension / (Math.sqrt(totalHexagons) * 2.5));
    }

    updateHexagonSizes() {
        const newSize = this.calculateHexagonSize();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const horizontalSpacing = newSize * Math.sqrt(3);
        const verticalSpacing = newSize * 1.5;

        this.hexagons.forEach(hexagon => {
            hexagon.size = newSize;
            hexagon.x = centerX + horizontalSpacing * (hexagon.q + hexagon.r / 2);
            hexagon.y = centerY + verticalSpacing * hexagon.r;
            hexagon.vertices = this.calculateHexagonVertices(hexagon.x, hexagon.y, newSize);
        });
    }

    calculateHexagonVertices(x, y, size) {
        const vertices = [];
        for (let i = 0; i < 6; i++) {
            const angle = 2 * Math.PI / 6 * (i + 0.5);
            vertices.push({
                x: x + size * Math.cos(angle),
                y: y + size * Math.sin(angle)
            });
        }
        return vertices;
    }

    generatePath() {
        this.start = this.hexagons[Math.floor(Math.random() * this.hexagons.length)];
        this.path = this.findHamiltonianPath();
        this.assignNumbers();
    }

    findHamiltonianPath() {
        const stack = [{ hexagon: this.start, visited: new Set([this.start]) }];

        while (stack.length > 0) {
            const { hexagon, visited } = stack.pop();
            const path = Array.from(visited);

            if (path.length === this.hexagons.length) {
                return path;
            }

            const neighbors = this.getNeighbors(hexagon);
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    const newVisited = new Set(visited);
                    newVisited.add(neighbor);
                    stack.push({ hexagon: neighbor, visited: newVisited });
                }
            }
        }

        return this.findHamiltonianPath();
    }

    getNeighbors(hexagon) {
        return this.hexagons.filter(h =>
            Math.abs(h.q - hexagon.q) + Math.abs(h.r - hexagon.r) + Math.abs(h.s - hexagon.s) === 2
        );
    }

    assignNumbers() {
        this.path.forEach((hexagon, index) => {
            hexagon.value = index + 1;
        });
        this.end = this.path[this.path.length - 1];
    }

    drawPath() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hexagons.forEach(this.drawHexagon);
    }

    drawHexagon = (hexagon) => {
        const color = this.getHexagonColor(hexagon);
        const gradient = this.ctx.createRadialGradient(
            hexagon.x, hexagon.y, 0,
            hexagon.x, hexagon.y, hexagon.size
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.adjustColor(color, -30));

        this.ctx.beginPath();
        hexagon.vertices.forEach((vertex, i) => {
            this.ctx[i === 0 ? 'moveTo' : 'lineTo'](vertex.x, vertex.y);
        });
        this.ctx.closePath();

        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.strokeStyle = COLOR.BORDER;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        if (hexagon.value !== undefined) {
            const textColor = (hexagon === this.start || hexagon === this.end) ? COLOR.TEXT.ENDPOINT : COLOR.TEXT.NORMAL;
            this.drawText(hexagon.x, hexagon.y, hexagon.value.toString(), textColor);
        }
    };

    drawText(x, y, text, color) {
        const fontSize = Math.max(10, Math.floor(this.hexagons[0].size / 2));
        this.ctx.fillStyle = color;
        this.ctx.font = `bold ${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
    }

    adjustColor(color, amount) {
        const rgba = color.match(/[\d.]+/g).map(Number);
        const adjustedRgb = rgba.slice(0, 3).map(c => Math.max(0, Math.min(255, c + amount)));
        return `rgba(${adjustedRgb.join(',')},${rgba[3]})`;
    }

    getHexagonColor(hexagon) {
        if (hexagon === this.start) return COLOR.START;
        if (hexagon === this.end) return COLOR.END;
        if (hexagon.value !== undefined) return COLOR.PATH;
        return COLOR.EMPTY;
    }

    handleClick = (event) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const clickedHexagon = this.findClickedHexagon(x, y);
        if (clickedHexagon && clickedHexagon.value === undefined) {
            this.fillMissingNumber(clickedHexagon);
            this.moveHistory.push(clickedHexagon);
            this.updateUndoButton();
        }
    };

    undoMove = () => {
        if (this.moveHistory.length > 0) {
            const previousHexagon = this.moveHistory.pop();
            this.missingNumbers.add(previousHexagon.value);
            delete previousHexagon.value;
            this.steps--;
            this.drawPath();
        }

        this.updateUndoButton();
    };

    updateUndoButton() {
        const undoButton = document.getElementById('undoButton');
        undoButton.disabled = this.moveHistory.length === 0;
    }

    findClickedHexagon(x, y) {
        return this.hexagons.find(hexagon => {
            const dx = x - hexagon.x;
            const dy = y - hexagon.y;
            return (dx * dx + dy * dy) <= (hexagon.size * hexagon.size);
        });
    }

    fillMissingNumber(hexagon) {
        if (this.missingNumbers.size === 0) return;

        const smallestMissing = Math.min(...this.missingNumbers);
        hexagon.value = smallestMissing;
        this.missingNumbers.delete(smallestMissing);

        this.steps++;
        this.updateDisplays();

        this.drawPath();

        if (this.missingNumbers.size === 0) {
            this.verifyPath();
        }
    }

    verifyPath() {
        let currentHexagon = this.start;
        let currentValue = 1;
        let pathFound = true;
        let path = [currentHexagon];

        while (currentHexagon !== this.end) {
            const neighbors = this.getNeighbors(currentHexagon);
            const nextHexagon = neighbors.find(h => h.value === currentValue + 1);

            if (!nextHexagon) {
                pathFound = false;
                break;
            }

            path.push(nextHexagon);
            currentHexagon = nextHexagon;
            currentValue++;
        }

        this.stopTimer();

        if (pathFound && currentValue === this.totalHexagons) {
            this.calculateScore();
            this.statusDisplay.textContent = `Congratulations! You completed the number maze! Score: ${this.score}`;
            this.animatePath(path, pathFound);
        } else {
            this.animatePath(path, pathFound);
            this.statusDisplay.textContent = "Path is incorrect. Please check your answers.";
        }
    }

    animatePath(path, pathFound) {
        let i = 0;
        const animate = () => {
            if (i < path.length - 1) {
                this.drawLine(path[i], path[i + 1]);
                i++;
                requestAnimationFrame(animate);
            } else if (pathFound) {
                this.startFireworks();
                setTimeout(() => this.stopFireworks(), 10000);
            }
        };
        animate();
    }

    drawLine(hexagon1, hexagon2) {
        const angle = Math.atan2(hexagon2.y - hexagon1.y, hexagon2.x - hexagon1.x);
        const distance = Math.sqrt(Math.pow(hexagon2.x - hexagon1.x, 2) + Math.pow(hexagon2.y - hexagon1.y, 2));
        const shortenBy = hexagon1.size * 0.3;

        const startX = hexagon1.x + Math.cos(angle) * shortenBy;
        const startY = hexagon1.y + Math.sin(angle) * shortenBy;
        const endX = hexagon2.x - Math.cos(angle) * shortenBy;
        const endY = hexagon2.y - Math.sin(angle) * shortenBy;

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = 'rgb(40,144,121)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    calculateScore() {
        const difficultyMultiplier = {
            [DIFFICULTY.EASY]: 1,
            [DIFFICULTY.MEDIUM]: 2,
            [DIFFICULTY.HARD]: 3
        };
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = 'rgb(40,144,121)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    calculateScore() {
        const difficultyMultiplier = {
            [DIFFICULTY.EASY]: 1,
            [DIFFICULTY.MEDIUM]: 2,
            [DIFFICULTY.HARD]: 3
        };
        const difficulty = document.getElementById('difficultySelect').value;
        const baseScore = 1000 * difficultyMultiplier[difficulty];
        const timeDeduction = this.elapsedTime * 2;
        const stepsDeduction = this.steps * 10;
        this.score = Math.max(0, baseScore - timeDeduction - stepsDeduction);
        this.updateDisplays();
    }

    startFireworks() {
        this.isFireworksActive = true;
        this.fireworks = [];
        this.animateFireworks();
    }

    animateFireworks() {
        if (!this.isFireworksActive) return;

        // 创建一个离屏画布来绘制烟花
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = this.canvas.width;
        offscreenCanvas.height = this.canvas.height;
        const offscreenCtx = offscreenCanvas.getContext('2d');

        offscreenCtx.fillStyle = 'rgba(6,16,25, 0.9)';
        offscreenCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);


        // 清除主画布并重绘游戏状态
        this.drawPath(); // 重绘游戏状态

        // 随机添加新的烟花
        if (Math.random() < 0.1) {
            this.fireworks.push(new Firework(this.canvas.width, this.canvas.height));
        }

        // 在离屏画布上更新和绘制所有烟花
        this.fireworks.forEach((firework, index) => {
            firework.update(offscreenCtx);
            if (firework.isDead()) {
                this.fireworks.splice(index, 1);
            }
        });

        // 将离屏画布的内容叠加到主画布上
        this.ctx.globalAlpha = 0.7; // 设置透明度
        this.ctx.drawImage(offscreenCanvas, 0, 0);
        this.ctx.globalAlpha = 1.0; // 重置透明度

        requestAnimationFrame(() => this.animateFireworks());
    }

    stopFireworks() {
        this.isFireworksActive = false;
        this.fireworks = [];
        // 重绘游戏画布，清除烟花效果
        this.drawPath();
    }
}


const game = new NumberMaze('hexagonCanvas');
game.startNewGame();
