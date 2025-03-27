class ApiService {
    constructor() {
        // 后端API的基础URL
        this.baseUrl = 'http://localhost:8080/api';
    }

    // 处理API错误
    handleError(response) {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response;
    }

    // 获取所有用户
    async getUsers() {
        try {
            const response = await fetch(`${this.baseUrl}/users`);
            return this.handleError(response).json();
        } catch (error) {
            console.error('Failed to fetch users:', error);
            throw error;
        }
    }

    // 根据ID获取用户
    async getUserById(userId) {
        try {
            const response = await fetch(`${this.baseUrl}/users/${userId}`);
            return this.handleError(response).json();
        } catch (error) {
            console.error(`Failed to fetch user with ID ${userId}:`, error);
            throw error;
        }
    }

    // 根据用户名获取用户
    async getUserByUsername(username) {
        try {
            const response = await fetch(`${this.baseUrl}/users/username/${username}`);
            return this.handleError(response).json();
        } catch (error) {
            console.error(`Failed to fetch user with username ${username}:`, error);
            throw error;
        }
    }

    // 创建新用户
    async createUser(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            return this.handleError(response).json();
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    }

    // 保存游戏分数
    async saveScore(scoreData) {
        try {
            const response = await fetch(`${this.baseUrl}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scoreData)
            });
            return this.handleError(response).json();
        } catch (error) {
            console.error('Failed to save score:', error);
            throw error;
        }
    }

    // 获取用户的所有分数
    async getUserScores(userId) {
        try {
            console.log(`Fetching scores for user ID: ${userId}`);
            const response = await fetch(`${this.baseUrl}/scores/user/${userId}`);
            
            if (!response.ok) {
                console.error(`Error fetching scores: ${response.status} ${response.statusText}`);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Received ${data.length} scores from server:`, data);
            return data;
        } catch (error) {
            console.error(`Failed to fetch scores for user ${userId}:`, error);
            throw error;
        }
    }

    // 获取排行榜分数
    async getTopScores(limit = 10) {
        try {
            const response = await fetch(`${this.baseUrl}/scores/top?limit=${limit}`);
            return this.handleError(response).json();
        } catch (error) {
            console.error('Failed to fetch top scores:', error);
            throw error;
        }
    }

    // 获取特定难度的排行榜分数
    async getTopScoresByLevel(level, limit = 10) {
        try {
            const response = await fetch(`${this.baseUrl}/scores/top/level/${this.mapDifficultyToLevel(level)}?limit=${limit}`);
            return this.handleError(response).json();
        } catch (error) {
            console.error(`Failed to fetch top scores for level ${level}:`, error);
            throw error;
        }
    }

    // 将前端难度映射到后端级别数字
    mapDifficultyToLevel(difficulty) {
        switch(difficulty) {
            case 'easy': return 1;
            case 'medium': return 2;
            case 'hard': return 3;
            default: return 1;
        }
    }

    // 将后端级别数字映射回前端难度字符串
    mapLevelToDifficulty(level) {
        switch(level) {
            case 1: return 'easy';
            case 2: return 'medium';
            case 3: return 'hard';
            default: return 'easy';
        }
    }
}
