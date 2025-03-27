package com.numbermaze.controller;

import com.numbermaze.dto.ScoreDTO;
import com.numbermaze.model.Score;
import com.numbermaze.model.User;
import com.numbermaze.service.ScoreService;
import com.numbermaze.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/scores")
@CrossOrigin(origins = "*")
public class ScoreController {
    
    private static final Logger logger = LoggerFactory.getLogger(ScoreController.class);
    private final ScoreService scoreService;
    private final UserService userService;
    
    @Autowired
    public ScoreController(ScoreService scoreService, UserService userService) {
        this.scoreService = scoreService;
        this.userService = userService;
    }
    
    @PostMapping
    public ResponseEntity<ScoreDTO> saveScore(@RequestBody ScoreDTO scoreDTO) {
        logger.debug("接收到保存分数请求: {}", scoreDTO);
        
        // Ensure user exists
        Long userId = scoreDTO.getUser().getId();
        Optional<User> userOpt = userService.getUserById(userId);
        
        if (!userOpt.isPresent()) {
            logger.warn("保存分数失败: 用户ID {} 不存在", userId);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        
        // Convert DTO to entity
        Score score = scoreDTO.toEntity();
        score.setUser(userOpt.get());
        
        try {
            Score savedScore = scoreService.saveScore(score);
            
            // Convert back to DTO
            ScoreDTO savedScoreDTO = ScoreDTO.fromEntity(savedScore);
            
            logger.debug("分数保存成功: ID={}, 用户={}, 分数={}", 
                    savedScore.getId(), userOpt.get().getUsername(), savedScore.getScore());
            return new ResponseEntity<>(savedScoreDTO, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("保存分数时发生错误: {}", e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ScoreDTO> getScoreById(@PathVariable Long id) {
        logger.debug("获取分数请求: ID={}", id);
        return scoreService.getScoreById(id)
                .map(score -> {
                    ScoreDTO dto = ScoreDTO.fromEntity(score);
                    logger.debug("找到分数记录: {}", dto);
                    return new ResponseEntity<>(dto, HttpStatus.OK);
                })
                .orElseGet(() -> {
                    logger.warn("分数不存在: ID={}", id);
                    return new ResponseEntity<>(HttpStatus.NOT_FOUND);
                });
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ScoreDTO>> getUserScores(@PathVariable Long userId) {
        logger.debug("获取用户分数请求: 用户ID={}", userId);
        
        if (!userService.getUserById(userId).isPresent()) {
            logger.warn("用户不存在: ID={}", userId);
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        
        try {
            List<Score> scores = scoreService.getUserScores(userId);
            List<ScoreDTO> scoreDTOs = scores.stream()
                    .map(ScoreDTO::fromEntity)
                    .collect(Collectors.toList());
            
            logger.debug("获取到用户 {} 的 {} 条分数记录", userId, scores.size());
            return new ResponseEntity<>(scoreDTOs, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("获取用户分数时发生错误: 用户ID={}, 错误={}", userId, e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/top")
    public ResponseEntity<List<ScoreDTO>> getTopScores(@RequestParam(defaultValue = "10") int limit) {
        logger.debug("获取前 {} 名分数记录请求", limit);
        
        try {
            List<Score> topScores = scoreService.getTopScores(limit);
            List<ScoreDTO> scoreDTOs = topScores.stream()
                    .map(ScoreDTO::fromEntity)
                    .collect(Collectors.toList());
            
            logger.debug("获取到 {} 条最高分记录", scoreDTOs.size());
            return new ResponseEntity<>(scoreDTOs, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("获取最高分列表时发生错误: {}", e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/top/level/{level}")
    public ResponseEntity<List<ScoreDTO>> getTopScoresByLevel(
            @PathVariable Integer level, 
            @RequestParam(defaultValue = "10") int limit) {
        logger.debug("获取难度等级 {} 的前 {} 名分数记录请求", level, limit);
        
        try {
            List<Score> topScores = scoreService.getTopScoresByLevel(level, limit);
            List<ScoreDTO> scoreDTOs = topScores.stream()
                    .map(ScoreDTO::fromEntity)
                    .collect(Collectors.toList());
            
            logger.debug("获取到难度等级 {} 的 {} 条最高分记录", level, scoreDTOs.size());
            return new ResponseEntity<>(scoreDTOs, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("获取难度等级 {} 的最高分列表时发生错误: {}", level, e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/player/{playerName}")
    public ResponseEntity<?> getPlayerScores(@PathVariable String playerName) {
        logger.debug("获取玩家 '{}' 的分数记录请求", playerName);
        
        try {
            List<Score> scores = scoreService.getScoresByPlayer(playerName);
            logger.debug("获取到玩家 '{}' 的 {} 条分数记录", playerName, scores.size());
            return ResponseEntity.ok(scores);
        } catch (Exception e) {
            logger.error("获取玩家 '{}' 的分数记录时发生错误: {}", playerName, e.getMessage(), e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error retrieving scores for player: " + playerName + ", " + e.getMessage());
        }
    }
}
