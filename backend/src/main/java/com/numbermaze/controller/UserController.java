package com.numbermaze.controller;

import com.numbermaze.dto.UserDTO;
import com.numbermaze.model.User;
import com.numbermaze.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    private final UserService userService;
    
    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        logger.debug("获取所有用户请求");
        List<User> users = userService.getAllUsers();
        logger.debug("获取到 {} 个用户", users.size());
        return new ResponseEntity<>(users, HttpStatus.OK);
    }
    
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody UserDTO userDTO) {
        logger.debug("创建用户请求: {}", userDTO);
        
        User user = new User();
        user.setUsername(userDTO.getUsername());
        user.setEmail(userDTO.getEmail());
        
        try {
            User createdUser = userService.createUser(user);
            logger.debug("用户创建成功: ID={}, 用户名={}", createdUser.getId(), createdUser.getUsername());
            return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("创建用户失败: {}", e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        logger.debug("获取用户请求: ID={}", id);
        
        Optional<User> user = userService.getUserById(id);
        return user.map(value -> {
            logger.debug("用户找到: ID={}, 用户名={}", value.getId(), value.getUsername());
            return new ResponseEntity<>(value, HttpStatus.OK);
        }).orElseGet(() -> {
            logger.warn("用户不存在: ID={}", id);
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        });
    }
    
    @GetMapping("/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        logger.debug("通过用户名获取用户: 用户名={}", username);
        
        Optional<User> user = userService.getUserByUsername(username);
        return user.map(value -> {
            logger.debug("用户找到: ID={}, 用户名={}", value.getId(), value.getUsername());
            return new ResponseEntity<>(value, HttpStatus.OK);
        }).orElseGet(() -> {
            logger.warn("用户不存在: 用户名={}", username);
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        });
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        logger.debug("更新用户请求: ID={}, 数据={}", id, userDTO);
        
        Optional<User> existingUser = userService.getUserById(id);
        if (!existingUser.isPresent()) {
            logger.warn("更新失败: 用户ID {} 不存在", id);
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        
        User user = existingUser.get();
        user.setUsername(userDTO.getUsername());
        if (userDTO.getEmail() != null) {
            user.setEmail(userDTO.getEmail());
        }
        
        try {
            User updatedUser = userService.updateUser(user);
            logger.debug("用户更新成功: ID={}, 用户名={}", updatedUser.getId(), updatedUser.getUsername());
            return new ResponseEntity<>(updatedUser, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("更新用户失败: ID={}, 错误={}", id, e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
