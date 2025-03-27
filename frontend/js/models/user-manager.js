class UserManager {
    constructor() {
        this.apiService = new ApiService();
        this.users = [];
        this.currentUser = { id: -1, username: '访客' }; // 默认用户
        
        this.init();
    }

    async init() {
        try {
            // 先从本地存储加载当前用户ID
            const savedUserId = localStorage.getItem('currentMazeUser');
            
            // 从后端加载所有用户
            await this.loadUsers();
            
            // 如果有已保存的用户ID，尝试设置当前用户
            if (savedUserId && savedUserId !== '-1') {
                const user = this.users.find(u => u.id === parseInt(savedUserId));
                if (user) {
                    this.currentUser = user;
                }
            }
            
            this.updateUserDisplay();
        } catch (error) {
            console.error('Error initializing user manager:', error);
        }
    }

    async loadUsers() {
        try {
            this.users = await this.apiService.getUsers();
            return this.users;
        } catch (error) {
            console.error('Failed to load users:', error);
            this.users = [];
            return [];
        }
    }

    setCurrentUser(userId) {
        const parsedId = parseInt(userId);
        if (parsedId === -1) {
            this.currentUser = { id: -1, username: '访客' };
            localStorage.setItem('currentMazeUser', '-1');
            this.updateUserDisplay();
            return true;
        }
        
        const user = this.users.find(u => u.id === parsedId);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentMazeUser', user.id);
            this.updateUserDisplay();
            return true;
        }
        return false;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateUserDisplay() {
        const currentUserDisplay = document.getElementById('currentUserDisplay');
        if (currentUserDisplay) {
            currentUserDisplay.textContent = `当前用户: ${this.currentUser.username}`;
        }
    }

    async addUser(name) {
        if (!name || name.trim() === '') return null;
        
        try {
            const userData = {
                username: name.trim(),
                email: ""  // 可选项
            };
            
            const newUser = await this.apiService.createUser(userData);
            // 重新加载用户列表以保持同步
            await this.loadUsers();
            return newUser.id;
        } catch (error) {
            console.error('Error creating user:', error);
            return null;
        }
    }

    async populateUserList() {
        const userList = document.getElementById('userList');
        if (!userList) return;
        
        userList.innerHTML = '<li class="loading">加载中...</li>';
        
        try {
            await this.loadUsers();
            userList.innerHTML = '';
            
            // 添加访客选项
            const guestItem = document.createElement('li');
            guestItem.textContent = '访客';
            guestItem.dataset.id = -1;
            if (this.currentUser.id === -1) {
                guestItem.classList.add('active');
            }
            guestItem.addEventListener('click', () => this.handleUserSelection(guestItem));
            userList.appendChild(guestItem);
            
            // 添加所有正式用户
            this.users.forEach(user => {
                const li = document.createElement('li');
                li.textContent = user.username;
                li.dataset.id = user.id;
                if (user.id === this.currentUser.id) {
                    li.classList.add('active');
                }
                li.addEventListener('click', () => this.handleUserSelection(li));
                userList.appendChild(li);
            });
        } catch (error) {
            userList.innerHTML = '<li class="error">加载用户失败</li>';
        }
    }

    handleUserSelection(element) {
        const userId = element.dataset.id;
        this.setCurrentUser(userId);
        
        // 更新UI
        document.querySelectorAll('#userList li').forEach(item => {
            item.classList.remove('active');
        });
        element.classList.add('active');
    }

    async saveScore(difficulty, score, time, steps) {
        if (this.currentUser.id === -1) {
            console.log('Guest user cannot save scores');
            return null;
        }
        
        try {
            console.log(`Attempting to save score: ${score} for user ${this.currentUser.id} (${this.currentUser.username})`);
            
            const scoreData = {
                user: {
                    id: this.currentUser.id
                },
                score: score,
                level: this.apiService.mapDifficultyToLevel(difficulty),
                time: time,
                steps: steps
            };
            
            console.log('Score data to send:', JSON.stringify(scoreData));
            
            const result = await this.apiService.saveScore(scoreData);
            console.log('Score saved successfully:', result);
            return result;
        } catch (error) {
            console.error('Error saving score:', error);
            throw error;
        }
    }

    async getUserScores() {
        if (this.currentUser.id === -1) {
            console.log('Guest user has no scores to retrieve');
            return []; // 访客没有分数记录
        }
        
        try {
            console.log(`Retrieving scores for user ${this.currentUser.id} (${this.currentUser.username})`);
            
            const scores = await this.apiService.getUserScores(this.currentUser.id);
            console.log(`Retrieved ${scores ? scores.length : 0} scores for user`);
            
            if (!scores || !Array.isArray(scores)) {
                console.warn('Invalid scores data returned from API:', scores);
                return [];
            }
            
            return scores.map(score => ({
                ...score,
                difficulty: this.apiService.mapLevelToDifficulty(score.level)
            }));
        } catch (error) {
            console.error('Error getting user scores:', error);
            return []; // Return empty array on error
        }
    }

    async getLeaderboardScores(difficulty, limit) {
        try {
            let scores;
            
            if (difficulty === 'all') {
                scores = await this.apiService.getTopScores(limit);
            } else {
                const level = this.apiService.mapDifficultyToLevel(difficulty);
                scores = await this.apiService.getTopScoresByLevel(level, limit);
            }
            
            return scores.map(score => ({
                ...score,
                difficulty: this.apiService.mapLevelToDifficulty(score.level)
            }));
        } catch (error) {
            console.error('Error getting leaderboard scores:', error);
            return [];
        }
    }
}
