-- --------------------------------------------------------
-- Host:                         us-cdbr-iron-east-02.cleardb.net
-- Server version:               5.5.62-log - MySQL Community Server (GPL)
-- Server OS:                    Linux
-- HeidiSQL Version:             10.1.0.5464
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Dumping database structure for heroku_7697c875dc5b5f3
CREATE DATABASE IF NOT EXISTS `heroku_7697c875dc5b5f3` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `heroku_7697c875dc5b5f3`;

-- Dumping structure for table heroku_7697c875dc5b5f3.channels
CREATE TABLE IF NOT EXISTS `channels` (
  `channel_id` varchar(50) DEFAULT NULL,
  `channel_name` varchar(50) DEFAULT NULL,
  `server_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.
-- Dumping structure for table heroku_7697c875dc5b5f3.messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `channel_id` varchar(50) DEFAULT NULL,
  `user_name` varchar(50) DEFAULT NULL,
  `msg` text,
  `date` varchar(50) DEFAULT NULL,
  KEY `Primary Key` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12012 DEFAULT CHARSET=utf8;

-- Data exporting was unselected.
-- Dumping structure for table heroku_7697c875dc5b5f3.serveradmins
CREATE TABLE IF NOT EXISTS `serveradmins` (
  `server_id` varchar(50) DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.
-- Dumping structure for table heroku_7697c875dc5b5f3.servers
CREATE TABLE IF NOT EXISTS `servers` (
  `server_id` varchar(50) NOT NULL,
  `server_name` varchar(50) NOT NULL,
  `owner_id` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.
-- Dumping structure for table heroku_7697c875dc5b5f3.users
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` varchar(50) NOT NULL,
  `user_name` varchar(45) DEFAULT NULL,
  `user_pass` varchar(100) DEFAULT NULL,
  `user_last_active` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.
-- Dumping structure for table heroku_7697c875dc5b5f3.userservers
CREATE TABLE IF NOT EXISTS `userservers` (
  `user_id` varchar(50) DEFAULT NULL,
  `server_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.
-- Dumping structure for table heroku_7697c875dc5b5f3.user_messages
CREATE TABLE IF NOT EXISTS `user_messages` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `user_from` varchar(50) DEFAULT NULL,
  `user_to` varchar(50) DEFAULT NULL,
  `msg` text,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8;

-- Data exporting was unselected.
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
