package com.numbermaze.service;

import com.numbermaze.model.Score;
import java.util.List;
import java.util.Optional;

public interface ScoreService {
    Score saveScore(Score score);
    Optional<Score> getScoreById(Long id);
    List<Score> getUserScores(Long userId);
    List<Score> getTopScores(int limit);
    List<Score> getTopScoresByLevel(Integer level, int limit);
    List<Score> getScoresByPlayer(String playerName);
}
