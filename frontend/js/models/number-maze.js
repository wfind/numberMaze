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

class NumberMaze {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.hexagons = [];
        this.start = null;
        this.end = null;
        this.path = null;
        this.missingNumbers = new Set();
        this.diamonds = []; // Store diamond shapes between adjacent hidden numbers
        this.statusDisplay = document.getElementById('status');

        this.difficultySettings = {
            [DIFFICULTY.EASY]: { sideLength: 2, hiddenNumbersRange: [3, 4], totalHexagons: 7, diamondRange: [1, 1] },
            [DIFFICULTY.MEDIUM]: { sideLength: 3, hiddenNumbersRange: [8, 12], totalHexagons: 19, diamondRange: [2, 3] },
            [DIFFICULTY.HARD]: { sideLength: 4, hiddenNumbersRange: [25, 33], totalHexagons: 37, diamondRange: [4, 5] }
        };

        this.startTime = 0;
        this.elapsedTime = 0;
        this.steps = 0;
        this.score = 0;
        this.timerInterval = null;

        this.timeDisplay = document.getElementById('timeDisplay');
        this.stepsDisplay = document.getElementById('stepsDisplay');
        this.scoreDisplay = document.getElementById('scoreDisplay');

        // Initialize user manager
        this.userManager = new UserManager();
        
        this.setupEventListeners();
        this.resizeCanvas();

        this.pathAnimation = null;
        this.celebrationAnimation = null;

        this.gravity = 0.3;

        this.moveHistory = [];
    }

    resizeCanvas = () => {
        // 存储窗口当前尺寸
        const currentWindowWidth = window.innerWidth;
        const currentWindowHeight = window.innerHeight;

        // 如果这是首次调用或者窗口尺寸已更改
        if (!this.lastWindowWidth || !this.lastWindowHeight ||
            this.lastWindowWidth !== currentWindowWidth || 
            this.lastWindowHeight !== currentWindowHeight) {
            
            // 更新存储的窗口尺寸
            this.lastWindowWidth = currentWindowWidth;
            this.lastWindowHeight = currentWindowHeight;

            const container = this.canvas.parentElement;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            const aspectRatio = 4 / 4; // 保持4:4的宽高比
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
        }

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

        // Score modal handling
        document.getElementById('showScores').addEventListener('click', () => {
            this.displayScores();
            document.getElementById('scoreModal').style.display = 'block';
        });

        document.getElementById('closeScores').addEventListener('click', () => {
            document.getElementById('scoreModal').style.display = 'none';
        });

        // Leaderboard handling
        document.getElementById('showLeaderboard').addEventListener('click', () => {
            this.displayLeaderboard();
            document.getElementById('leaderboardModal').style.display = 'block';
        });

        document.getElementById('closeLeaderboard').addEventListener('click', () => {
            document.getElementById('leaderboardModal').style.display = 'none';
        });

        // Leaderboard filters
        document.getElementById('leaderboardDifficultyFilter').addEventListener('change', () => {
            this.displayLeaderboard();
        });

        document.getElementById('leaderboardLimitFilter').addEventListener('change', () => {
            this.displayLeaderboard();
        });

        // User management
        document.getElementById('manageUsers').addEventListener('click', () => {
            this.userManager.populateUserList();
            document.getElementById('userModal').style.display = 'block';
        });

        document.getElementById('closeUserModal').addEventListener('click', () => {
            document.getElementById('userModal').style.display = 'none';
        });

        document.getElementById('addUser').addEventListener('click', () => {
            const newUserNameInput = document.getElementById('newUserName');
            const name = newUserNameInput.value.trim();
            
            if (name) {
                const userId = this.userManager.addUser(name);
                if (userId) {
                    this.userManager.setCurrentUser(userId);
                    this.userManager.populateUserList();
                    newUserNameInput.value = '';
                }
            }
        });

        // Allow pressing Enter to add a new user
        document.getElementById('newUserName').addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                document.getElementById('addUser').click();
            }
        });
    };

    displayScores = async () => {
        const scoreList = document.getElementById('scoreList');
        scoreList.innerHTML = '<li class="loading">加载中...</li>';
        
        try {
            // 从后端获取分数
            const userScores = await this.userManager.getUserScores();
            
            if (!userScores || userScores.length === 0) {
                scoreList.innerHTML = '<li>暂无分数记录</li>';
                return;
            }
            
            // 确保数据结构正确并进行排序
            const validScores = userScores
                .filter(score => score && typeof score.score === 'number')
                .sort((a, b) => b.score - a.score);
            
            if (validScores.length === 0) {
                scoreList.innerHTML = '<li>暂无有效分数记录</li>';
                return;
            }
            
            scoreList.innerHTML = '';
            validScores.forEach(score => {
                const li = document.createElement('li');
                // 确保有效性检查，提供默认值
                const diffText = score.difficulty ? this.getDifficultyText(score.difficulty) : '未知';
                const scoreValue = score.score || 0;
                const timeValue = score.time || 0;
                const stepsValue = score.steps || 0;
                
                li.innerHTML = `
                    <span class="score-difficulty">${diffText}</span>
                    <span class="score-value">${scoreValue}分</span>
                    <span class="score-details">用时${timeValue}秒 | ${stepsValue}步</span>
                `;
                scoreList.appendChild(li);
            });
            
            console.log('Scores displayed successfully:', validScores);
        } catch (error) {
            console.error('Error loading scores:', error);
            scoreList.innerHTML = '<li class="error">加载分数失败: ' + (error.message || '未知错误') + '</li>';
        }
    };

    displayLeaderboard = async () => {
        const leaderboardBody = document.getElementById('leaderboardBody');
        leaderboardBody.innerHTML = '<tr><td colspan="6" class="loading">加载中...</td></tr>';
        
        try {
            // 获取筛选条件
            const difficulty = document.getElementById('leaderboardDifficultyFilter').value;
            const limit = parseInt(document.getElementById('leaderboardLimitFilter').value);
            
            console.log('Fetching leaderboard with difficulty:', difficulty, 'limit:', limit);
            
            // 从后端获取排行榜数据
            const leaderboardScores = await this.userManager.getLeaderboardScores(difficulty, limit);
            console.log('Raw leaderboard data:', leaderboardScores);
            
            if (!leaderboardScores || !Array.isArray(leaderboardScores) || leaderboardScores.length === 0) {
                console.warn('No leaderboard data returned or invalid format');
                leaderboardBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">暂无分数记录</td></tr>';
                return;
            }
            
            leaderboardBody.innerHTML = '';
            leaderboardScores.forEach((score, index) => {
                try {
                    // 验证数据结构
                    if (!score) {
                        console.warn('Invalid score entry (null or undefined):', score);
                        return; // 跳过无效数据
                    }
                    
                    const tr = document.createElement('tr');
                    
                    // 设置排名单元格
                    const rankTd = document.createElement('td');
                    rankTd.textContent = index + 1;
                    rankTd.className = 'rank';
                    if (index < 3) {
                        rankTd.classList.add(`rank-${index + 1}`);
                    }
                    tr.appendChild(rankTd);
                    
                    // 安全地获取用户名
                    let username = '未知用户';
                    if (score.user) {
                        // 处理用户对象可能有不同结构的情况
                        if (typeof score.user === 'object') {
                            username = score.user.username || score.user.name || '未命名用户';
                        } else if (typeof score.user === 'string') {
                            username = score.user;
                        }
                    } else if (score.userName) {
                        username = score.userName;
                    } else if (score.username) {
                        username = score.username;
                    }
                    
                    // 安全地访问其他字段，提供默认值
                    const scoreValue = typeof score.score === 'number' ? score.score : 0;
                    const timeValue = typeof score.time === 'number' ? score.time : 0;
                    const stepsValue = typeof score.steps === 'number' ? score.steps : 0;
                    const difficultyText = score.difficulty ? this.getDifficultyText(score.difficulty) : '未知';
                    
                    // 添加其他列
                    tr.innerHTML += `
                        <td>${username}</td>
                        <td>${difficultyText}</td>
                        <td>${scoreValue}</td>
                        <td>${timeValue}秒</td>
                        <td>${stepsValue}步</td>
                    `;
                    
                    leaderboardBody.appendChild(tr);
                } catch (entryError) {
                    console.error('Error processing leaderboard entry:', entryError, 'Entry:', score);
                }
            });
            
            console.log('Leaderboard displayed successfully with', leaderboardScores.length, 'entries');
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            leaderboardBody.innerHTML = `<tr><td colspan="6" class="error">加载排行榜失败: ${error.message || '未知错误'}</td></tr>`;
        }
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

        this.resizeCanvas(); // Ensure canvas is resized properly
        this.drawPattern();

        this.generatePath();
        this.hideRandomNumbers();
        this.drawPath();
        this.statusDisplay.textContent = "Game started! Fill in the missing numbers.";
    };

    hideRandomNumbers() {
        this.missingNumbers.clear();
        this.diamonds = []; // Clear any existing diamonds
        const pathWithoutEnds = this.path.slice(1, -1);
        const shuffled = pathWithoutEnds.sort(() => 0.5 - Math.random());
        const hiddenCount = Math.floor(Math.random() * (this.hiddenNumbersRange[1] - this.hiddenNumbersRange[0] + 1)) + this.hiddenNumbersRange[0];
        
        // Hide random numbers
        const hiddenHexagons = shuffled.slice(0, hiddenCount);
        hiddenHexagons.forEach(hexagon => {
            this.missingNumbers.add(hexagon.value);
            delete hexagon.value;
        });
        
        // Identify pairs of hidden hexagons that are consecutive in the correct path
        const hiddenPairsOnPath = [];
        
        // Find consecutive hidden hexagons on the path
        for (let i = 0; i < this.path.length - 1; i++) {
            const hex1 = this.path[i];
            const hex2 = this.path[i + 1];
            
            // Check if both hexagons have hidden values (no value property)
            if (hex1.value === undefined && hex2.value === undefined) {
                // These hexagons are consecutive in the path AND both hidden
                hiddenPairsOnPath.push([hex1, hex2]);
            }
        }
        
        // Get diamond count limits based on difficulty from settings
        const difficulty = document.getElementById('difficultySelect').value;
        const diamondRange = this.difficultySettings[difficulty].diamondRange;
        
        // Calculate maximum diamonds based on settings range
        let maxDiamonds = 0;
        if (hiddenPairsOnPath.length > 0) {
            // Random value between min and max of diamondRange, constrained by available pairs
            maxDiamonds = Math.min(
                Math.floor(Math.random() * (diamondRange[1] - diamondRange[0] + 1)) + diamondRange[0], 
                hiddenPairsOnPath.length
            );
        }
        
        // Randomly select pairs to place diamonds
        if (hiddenPairsOnPath.length > 0 && maxDiamonds > 0) {
            const shuffledPairs = hiddenPairsOnPath.sort(() => 0.5 - Math.random()).slice(0, maxDiamonds);
            
            // Add diamonds between the selected pairs
            shuffledPairs.forEach(pair => {
                const [hex1, hex2] = pair;
                // Calculate the angle between the two hexagons
                const angle = Math.atan2(hex2.y - hex1.y, hex2.x - hex1.x);
                
                // Add a diamond between them
                this.diamonds.push({
                    x: (hex1.x + hex2.x) / 2,
                    y: (hex1.y + hex2.y) / 2,
                    size: hex1.size * 0.12, // Slightly larger size for better visibility
                    hex1: hex1,
                    hex2: hex2,
                    angle: angle // Store the angle for proper orientation
                });
            });
        }
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
        
        // Draw diamonds after drawing hexagons
        this.diamonds.forEach(this.drawDiamond);
    }
    
    drawDiamond = (diamond) => {
        this.ctx.save();
        
        this.ctx.translate(diamond.x, diamond.y);
        
        // If we have the angle between hexagons, use it to align the diamond
        // Otherwise fall back to the default 45-degree rotation
        if (diamond.angle !== undefined) {
            // Rotate perpendicular to the line between hexagons
            this.ctx.rotate(diamond.angle + Math.PI/2);
        } else {
            this.ctx.rotate(Math.PI / 4);
        }
        
        // Create a diamond shape gradient
        const gradient = this.ctx.createLinearGradient(-diamond.size, 0, diamond.size, 0);
        gradient.addColorStop(0, 'rgba(64, 196, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(30, 144, 255, 0.9)');
        
        // Draw diamond with smaller width
        const width = diamond.size * 1.2;
        const height = diamond.size * 0.8;
        
        this.ctx.beginPath();
        this.ctx.rect(-width, -height, width * 2, height * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Draw border
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        
        this.ctx.restore();
    };

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
        
        // Check diamond constraints before filling the number
        const connectedDiamonds = this.diamonds.filter(d => d.hex1 === hexagon || d.hex2 === hexagon);
        
        // For each diamond this hexagon is connected to
        for (const diamond of connectedDiamonds) {
            const otherHex = diamond.hex1 === hexagon ? diamond.hex2 : diamond.hex1;
            
            // If the other hexagon has a value, we need to check if filling this hexagon
            // with smallestMissing would satisfy the constraint (consecutive numbers)
            if (otherHex.value !== undefined) {
                const diff = Math.abs(otherHex.value - smallestMissing);
                
                if (diff !== 1) {
                    // Diamond constraint not satisfied - the numbers aren't consecutive
                    this.statusDisplay.textContent = "Diamond constraint: numbers must be consecutive!";
                    // Shake the diamond to indicate the constraint
                    this.animateDiamondShake(diamond);
                    return; // Don't fill the number
                }
            }
        }
        
        // If we get here, either there are no diamond constraints or all are satisfied
        hexagon.value = smallestMissing;
        this.missingNumbers.delete(smallestMissing);

        this.steps++;
        this.updateDisplays();

        this.drawPath();

        if (this.missingNumbers.size === 0) {
            this.verifyPath();
        }
    }
    
    animateDiamondShake(diamond) {
        const originalX = diamond.x;
        const originalY = diamond.y;
        let frameCount = 0;
        
        const shake = () => {
            if (frameCount >= 12) {
                // Animation complete, reset position
                diamond.x = originalX;
                diamond.y = originalY;
                this.drawPath();
                return;
            }
            
            // Shake effect - move slightly in random direction
            const shakeAmount = 3 * Math.sin(frameCount);
            diamond.x = originalX + shakeAmount;
            diamond.y = originalY + shakeAmount * (frameCount % 2 ? 1 : -1);
            
            this.drawPath();
            frameCount++;
            requestAnimationFrame(shake);
        };
        
        shake();
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
            this.saveScoreToBackend(); // 修改为使用后端保存分数
            this.statusDisplay.textContent = `Congratulations! You completed the number maze! Score: ${this.score}`;
            this.animatePath(path, pathFound);
        } else {
            this.animatePath(path, pathFound);
            this.statusDisplay.textContent = "Path is incorrect. Please check your answers.";
        }
    }

    // 添加新方法将分数保存到后端
    async saveScoreToBackend() {
        const difficulty = document.getElementById('difficultySelect').value;
        const currentUser = this.userManager.getCurrentUser();
        
        if (currentUser.id === -1) {
            this.statusDisplay.textContent += " (登录后可保存分数)";
            return;
        }
        
        try {
            await this.userManager.saveScore(
                difficulty,
                this.score,
                this.elapsedTime,
                this.steps
            );
            this.statusDisplay.textContent += " (分数已保存)";
        } catch (error) {
            console.error('Error saving score to backend:', error);
            this.statusDisplay.textContent += " (分数保存失败)";
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
        const difficulty = document.getElementById('difficultySelect').value;
        const baseScore = 1000 * difficultyMultiplier[difficulty];
        const timeDeduction = this.elapsedTime * 2;
        const stepsDeduction = this.steps * 10;
        this.score = Math.max(0, baseScore - timeDeduction - stepsDeduction);
        this.updateDisplays();
    }

    saveScore() {
        const scores = JSON.parse(localStorage.getItem('numberMazeScores')) || [];
        const difficulty = document.getElementById('difficultySelect').value;
        const currentUser = this.userManager.currentUser;
        const currentUserObj = this.userManager.getCurrentUser();
        
        scores.push({
            userId: currentUser,
            userName: currentUserObj.name, // Save user name for easier access
            difficulty,
            score: this.score,
            time: this.elapsedTime,
            steps: this.steps,
            date: new Date().toISOString()
        });
        
        localStorage.setItem('numberMazeScores', JSON.stringify(scores));
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

    areAdjacent(hex1, hex2) {
        // Two hexagons are adjacent if the sum of the absolute differences of their coordinates is 2
        return Math.abs(hex1.q - hex2.q) + Math.abs(hex1.r - hex2.r) + Math.abs(hex1.s - hex2.s) === 2;
    }

    // 添加辅助方法
    getDifficultyText(difficulty) {
        switch(difficulty) {
            case 'easy': return '简单';
            case 'medium': return '中等';
            case 'hard': return '复杂';
            default: return difficulty;
        }
    }
}
