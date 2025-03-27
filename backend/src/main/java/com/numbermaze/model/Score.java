package com.numbermaze.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Score {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    private Integer score;
    private Integer level;
    private Integer time;
    private Integer steps;
    private String playerName;
    private Integer scoreValue;
    private LocalDateTime timestamp = LocalDateTime.now();
    
    // Default constructor required by JPA
    public Score() {
        // Initialize scoreValue to same as score for compatibility with existing queries
        this.scoreValue = 0;
    }
    
    // Getters and setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
        // Set playerName from user for backward compatibility
        if (user != null) {
            this.playerName = user.getUsername();
        }
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
        // Keep scoreValue in sync with score for backward compatibility
        this.scoreValue = score;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public Integer getTime() {
        return time;
    }

    public void setTime(Integer time) {
        this.time = time;
    }

    public Integer getSteps() {
        return steps;
    }

    public void setSteps(Integer steps) {
        this.steps = steps;
    }
    
    public String getPlayerName() {
        return playerName;
    }
    
    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }
    
    public Integer getScoreValue() {
        return scoreValue;
    }
    
    public void setScoreValue(Integer scoreValue) {
        this.scoreValue = scoreValue;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
