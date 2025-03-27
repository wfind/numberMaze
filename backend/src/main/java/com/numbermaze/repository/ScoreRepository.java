package com.numbermaze.repository;

import com.numbermaze.model.Score;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    // Find top 10 scores ordered by score value in descending order
    List<Score> findTop10ByOrderByScoreValueDesc();
    
    // Find scores by player name
    List<Score> findByPlayerNameOrderByScoreValueDesc(String playerName);
    
    // Find scores by user ID using the User entity relationship
    @Query("SELECT s FROM Score s WHERE s.user.id = :userId ORDER BY s.score DESC")
    List<Score> findByUserIdOrderByScoreDesc(@Param("userId") Long userId);
    
    // Find top scores ordered by score
    @Query("SELECT s FROM Score s ORDER BY s.score DESC")
    List<Score> findTopScores(Pageable pageable);
    
    // Find top scores by level ordered by score
    @Query("SELECT s FROM Score s WHERE s.level = :level ORDER BY s.score DESC")
    List<Score> findTopScoresByLevel(@Param("level") Integer level, Pageable pageable);
}
