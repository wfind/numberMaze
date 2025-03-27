package com.numbermaze.dto;

import com.numbermaze.model.Score;
import lombok.Data;

@Data
public class ScoreDTO {
    private Long id;
    private UserDTO user;
    private Integer score;
    private Integer level;
    private Integer time;
    private Integer steps;
    
    // Convert DTO to Entity
    public Score toEntity() {
        Score score = new Score();
        score.setId(this.id);
        score.setScore(this.score);
        score.setLevel(this.level);
        score.setTime(this.time);
        score.setSteps(this.steps);
        // User will be set separately
        return score;
    }
    
    // Convert Entity to DTO
    public static ScoreDTO fromEntity(Score score) {
        ScoreDTO dto = new ScoreDTO();
        dto.setId(score.getId());
        dto.setScore(score.getScore());
        dto.setLevel(score.getLevel());
        dto.setTime(score.getTime());
        dto.setSteps(score.getSteps());
        
        // Convert User entity to UserDTO
        if (score.getUser() != null) {
            UserDTO userDTO = new UserDTO();
            userDTO.setId(score.getUser().getId());
            userDTO.setUsername(score.getUser().getUsername());
            dto.setUser(userDTO);
        }
        
        return dto;
    }
}
