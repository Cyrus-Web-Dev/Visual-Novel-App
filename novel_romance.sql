-- ============================================================
-- Database: novel_romance
-- Import file ini di phpMyAdmin (XAMPP) atau via mysql CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS `novel_romance`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `novel_romance`;

-- Tabel akun pemain (login biasa: username/email + password)
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(100) NOT NULL,
  `email`         VARCHAR(255) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `mc_name`       VARCHAR(100) NOT NULL DEFAULT 'Ahmad',
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_username` (`username`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Progres permainan per akun
CREATE TABLE IF NOT EXISTS `game_progress` (
  `user_id`             INT UNSIGNED NOT NULL,
  `current_chapter`     INT NOT NULL DEFAULT 1,
  `current_line`        INT NOT NULL DEFAULT 0,
  `unlocked_chapter_6`  TINYINT(1) NOT NULL DEFAULT 0,
  `ichika_aff`          INT NOT NULL DEFAULT 0,
  `nino_aff`            INT NOT NULL DEFAULT 0,
  `miku_aff`            INT NOT NULL DEFAULT 0,
  `yotsuba_aff`         INT NOT NULL DEFAULT 0,
  `itsuki_aff`          INT NOT NULL DEFAULT 0,
  `last_saved`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_progress_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
