-- ============================================================
-- Database: todo_app
-- Full-Stack Todo Application Schema
-- Character Set: utf8mb4 for full Unicode (emojis supported)
-- Storage Engine: InnoDB (supports ACID transactions & foreign keys)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `todo_app`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `todo_app`;

-- ------------------------------------------------------------
-- Table 1: users
-- Stores registered user accounts with hashed passwords
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `google_id` VARCHAR(100) DEFAULT NULL UNIQUE,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `password` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table 2: todos
-- Stores tasks associated with a specific user
-- ON DELETE CASCADE ensures if a user account is deleted,
-- all their tasks are automatically removed cleanly.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `todos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  `due_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign Key Constraint linking todo to users table
  CONSTRAINT `fk_todos_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Indexes for optimized querying, filtering, and sorting
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_user_completed` (`user_id`, `is_completed`),
  INDEX `idx_user_priority` (`user_id`, `priority`),
  INDEX `idx_user_due_date` (`user_id`, `due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
