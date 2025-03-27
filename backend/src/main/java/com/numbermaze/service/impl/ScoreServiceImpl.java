package com.numbermaze.service.impl;

import com.numbermaze.model.Score;
import com.numbermaze.repository.ScoreRepository;
import com.numbermaze.service.ScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ScoreServiceImpl implements ScoreService {
    
    private final ScoreRepository scoreRepository;
    
    @Autowired
    public ScoreServiceImpl(ScoreRepository scoreRepository) {
        this.scoreRepository = scoreRepository;
    }
    
    @Override
    public Score saveScore(Score score) {
        return scoreRepository.save(score);
    }
    
    @Override
    public Optional<Score> getScoreById(Long id) {
        return scoreRepository.findById(id);
    }
    
    @Override
    public List<Score> getUserScores(Long userId) {
        return scoreRepository.findByUserIdOrderByScoreDesc(userId);
    }
    
    @Override
    public List<Score> getTopScores(int limit) {
        return scoreRepository.findTopScores(PageRequest.of(0, limit));
    }
    
    @Override
    public List<Score> getTopScoresByLevel(Integer level, int limit) {
        return scoreRepository.findTopScoresByLevel(level, PageRequest.of(0, limit));
    }
    
    @Override
    public List<Score> getScoresByPlayer(String playerName) {
        return scoreRepository.findByPlayerNameOrderByScoreValueDesc(playerName);
    }
}
