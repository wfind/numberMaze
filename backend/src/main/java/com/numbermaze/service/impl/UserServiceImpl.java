package com.numbermaze.service.impl;

import com.numbermaze.model.User;
import com.numbermaze.repository.UserRepository;
import com.numbermaze.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    
    @Autowired
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Override
    public User createUser(User user) {
        return userRepository.save(user);
    }
    
    @Override
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
    
    @Override
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    @Override
    public User updateUser(User user) {
        return userRepository.save(user);
    }
    
    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
