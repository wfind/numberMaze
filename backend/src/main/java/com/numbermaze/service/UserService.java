package com.numbermaze.service;

import com.numbermaze.model.User;

import java.util.List;
import java.util.Optional;

public interface UserService {
    User createUser(User user);
    Optional<User> getUserById(Long id);
    Optional<User> getUserByUsername(String username);
    User updateUser(User user);
    List<User> getAllUsers(); // Add this method
}
