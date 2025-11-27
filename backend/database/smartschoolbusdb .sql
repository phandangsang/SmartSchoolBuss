-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 27, 2025 lúc 09:00 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `smartschoolbusdb`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `buses`
--

CREATE TABLE `buses` (
  `BusID` int(11) NOT NULL,
  `PlateNumber` varchar(20) NOT NULL,
  `Capacity` int(11) NOT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `buses`
--

INSERT INTO `buses` (`BusID`, `PlateNumber`, `Capacity`, `Status`) VALUES
(2, '51B-678.90', 40, 'running'),
(4, '51D-555.77', 50, 'running'),
(7, '29A2-12345', 40, 'running'),
(8, '30A1-123456', 40, 'stopped');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `buslocations`
--

CREATE TABLE `buslocations` (
  `LocationID` bigint(20) NOT NULL,
  `TripID` int(11) DEFAULT NULL,
  `BusID` int(11) NOT NULL,
  `RecordedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `Latitude` decimal(9,6) NOT NULL,
  `Longitude` decimal(9,6) NOT NULL,
  `Speed` decimal(5,2) DEFAULT NULL,
  `Heading` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `buslocations`
--

INSERT INTO `buslocations` (`LocationID`, `TripID`, `BusID`, `RecordedAt`, `Latitude`, `Longitude`, `Speed`, `Heading`) VALUES
(4, 1, 8, '2025-11-27 11:53:59', 10.823100, 106.629700, 30.00, 0.00),
(5, 1, 8, '2025-11-27 11:56:04', 10.823100, 106.629700, 30.00, 0.00),
(6, 1, 8, '2025-11-27 11:56:07', 10.823100, 106.629700, 30.00, 0.00),
(7, 1, 8, '2025-11-27 11:56:09', 10.823100, 106.629700, 30.00, 0.00),
(8, 1, 8, '2025-11-27 11:56:10', 10.823100, 106.629700, 30.00, 0.00),
(9, 1, 8, '2025-11-27 11:56:13', 10.823100, 106.629700, 30.00, 0.00),
(10, 1, 8, '2025-11-27 11:56:16', 10.823100, 106.629700, 30.00, 0.00),
(11, 1, 8, '2025-11-27 11:56:19', 10.823100, 106.629700, 30.00, 0.00),
(12, 1, 8, '2025-11-27 11:56:22', 10.823100, 106.629700, 30.00, 0.00),
(13, 1, 8, '2025-11-27 11:56:25', 10.823100, 106.629700, 30.00, 0.00),
(14, 1, 8, '2025-11-27 11:56:28', 10.823100, 106.629700, 30.00, 0.00),
(15, 1, 8, '2025-11-27 11:56:31', 10.823100, 106.629700, 30.00, 0.00),
(16, 1, 8, '2025-11-27 11:56:34', 10.823100, 106.629700, 30.00, 0.00),
(17, 1, 8, '2025-11-27 11:56:37', 10.823100, 106.629700, 30.00, 0.00),
(18, 1, 8, '2025-11-27 11:56:40', 10.823100, 106.629700, 30.00, 0.00),
(19, 1, 8, '2025-11-27 11:56:43', 10.823100, 106.629700, 30.00, 0.00),
(20, 1, 8, '2025-11-27 11:56:46', 10.823100, 106.629700, 30.00, 0.00),
(21, 1, 8, '2025-11-27 11:56:49', 10.823100, 106.629700, 30.00, 0.00),
(22, 1, 8, '2025-11-27 11:59:07', 10.823100, 106.629700, 30.00, 0.00),
(23, 1, 8, '2025-11-27 11:59:09', 10.823100, 106.629700, 30.00, 0.00),
(24, 1, 8, '2025-11-27 11:59:12', 10.823100, 106.629700, 30.00, 0.00),
(25, 1, 8, '2025-11-27 11:59:15', 10.823100, 106.629700, 30.00, 0.00),
(26, 1, 8, '2025-11-27 11:59:18', 10.823100, 106.629700, 30.00, 0.00),
(27, 1, 8, '2025-11-27 11:59:21', 10.823100, 106.629700, 30.00, 0.00),
(28, 1, 8, '2025-11-27 11:59:24', 10.823100, 106.629700, 30.00, 0.00),
(29, 1, 8, '2025-11-27 11:59:27', 10.823100, 106.629700, 30.00, 0.00),
(30, 1, 8, '2025-11-27 11:59:30', 10.823100, 106.629700, 30.00, 0.00),
(31, 1, 8, '2025-11-27 12:00:37', 10.823100, 106.629700, 30.00, 0.00),
(32, 1, 8, '2025-11-27 12:00:38', 10.823100, 106.629700, 30.00, 0.00),
(33, 1, 8, '2025-11-27 12:00:39', 10.823100, 106.629700, 30.00, 0.00),
(34, 1, 8, '2025-11-27 12:00:42', 10.823100, 106.629700, 30.00, 0.00),
(35, 1, 8, '2025-11-27 12:00:45', 10.823100, 106.629700, 30.00, 0.00),
(36, 1, 8, '2025-11-27 12:00:48', 10.823100, 106.629700, 30.00, 0.00),
(37, 1, 8, '2025-11-27 12:00:56', 10.826078, 106.630218, 30.00, 0.00),
(38, 1, 8, '2025-11-27 12:24:59', 10.823100, 106.629700, 30.00, 0.00),
(39, 1, 8, '2025-11-27 12:25:04', 10.823100, 106.629700, 30.00, 0.00),
(40, 1, 8, '2025-11-27 12:25:09', 10.830000, 106.650000, 30.00, 0.00),
(41, 1, 8, '2025-11-27 12:25:14', 10.840000, 106.700000, 30.00, 0.00),
(42, 1, 8, '2025-11-27 12:25:19', 10.850800, 106.771700, 30.00, 0.00),
(43, 1, 8, '2025-11-27 12:25:24', 10.850800, 106.771700, 30.00, 0.00),
(44, 1, 8, '2025-11-27 12:25:52', 10.823100, 106.629700, 30.00, 0.00),
(45, 1, 8, '2025-11-27 12:25:57', 10.823100, 106.629700, 30.00, 0.00),
(46, 1, 8, '2025-11-27 12:26:02', 10.830000, 106.650000, 30.00, 0.00),
(47, 1, 8, '2025-11-27 12:26:07', 10.840000, 106.700000, 30.00, 0.00),
(48, 1, 8, '2025-11-27 12:26:12', 10.850800, 106.771700, 30.00, 0.00),
(49, 1, 8, '2025-11-27 12:26:17', 10.850800, 106.771700, 30.00, 0.00),
(50, 1, 8, '2025-11-27 12:27:12', 10.823100, 106.629700, 30.00, 0.00),
(51, 1, 8, '2025-11-27 12:27:17', 10.823100, 106.629700, 30.00, 0.00),
(52, 1, 8, '2025-11-27 12:27:22', 10.830000, 106.650000, 30.00, 0.00),
(53, 1, 8, '2025-11-27 12:27:27', 10.840000, 106.700000, 30.00, 0.00),
(54, 1, 8, '2025-11-27 12:27:32', 10.850800, 106.771700, 30.00, 0.00),
(55, 1, 8, '2025-11-27 12:27:37', 10.850800, 106.771700, 30.00, 0.00),
(56, 1, 8, '2025-11-27 12:33:38', 10.823100, 106.629700, 30.00, 0.00),
(57, 1, 8, '2025-11-27 12:33:43', 10.823100, 106.629700, 30.00, 0.00),
(58, 1, 8, '2025-11-27 12:33:48', 10.830000, 106.650000, 30.00, 0.00),
(59, 1, 8, '2025-11-27 12:34:39', 10.840000, 106.700000, 30.00, 0.00),
(60, 1, 8, '2025-11-27 12:34:43', 10.850800, 106.771700, 30.00, 0.00),
(61, 1, 8, '2025-11-27 12:34:48', 10.850800, 106.771700, 30.00, 0.00),
(62, 1, 8, '2025-11-27 12:35:44', 10.823100, 106.629700, 30.00, 0.00),
(63, 1, 8, '2025-11-27 12:35:49', 10.823100, 106.629700, 30.00, 0.00),
(64, 1, 8, '2025-11-27 12:35:54', 10.830000, 106.650000, 30.00, 0.00),
(65, 1, 8, '2025-11-27 12:35:59', 10.840000, 106.700000, 30.00, 0.00),
(66, 1, 8, '2025-11-27 12:36:42', 10.850800, 106.771700, 30.00, 0.00),
(67, 1, 8, '2025-11-27 12:43:12', 10.823100, 106.629700, 30.00, 0.00),
(68, 1, 8, '2025-11-27 12:43:17', 10.823100, 106.629700, 30.00, 0.00),
(69, 1, 8, '2025-11-27 12:43:22', 10.830000, 106.650000, 30.00, 0.00),
(70, 1, 8, '2025-11-27 12:43:27', 10.840000, 106.700000, 30.00, 0.00),
(71, 1, 8, '2025-11-27 12:43:33', 10.850800, 106.771700, 30.00, 0.00),
(72, 1, 8, '2025-11-27 12:44:24', 10.823100, 106.629700, 30.00, 0.00),
(73, 1, 8, '2025-11-27 12:44:29', 10.823100, 106.629700, 30.00, 0.00),
(74, 1, 8, '2025-11-27 12:44:34', 10.830000, 106.650000, 30.00, 0.00),
(75, 1, 8, '2025-11-27 12:44:39', 10.840000, 106.700000, 30.00, 0.00),
(76, 1, 8, '2025-11-27 12:44:44', 10.850800, 106.771700, 30.00, 0.00),
(77, 1, 8, '2025-11-27 12:44:50', 10.850800, 106.771700, 30.00, 0.00),
(78, 1, 8, '2025-11-27 12:48:31', 10.823100, 106.629700, 30.00, 0.00),
(79, 1, 8, '2025-11-27 12:48:36', 10.823100, 106.629700, 30.00, 0.00),
(80, 1, 8, '2025-11-27 12:48:41', 10.830000, 106.650000, 30.00, 0.00),
(81, 1, 8, '2025-11-27 12:48:46', 10.840000, 106.700000, 30.00, 0.00),
(82, 1, 8, '2025-11-27 12:48:51', 10.850800, 106.771700, 30.00, 0.00),
(83, 1, 8, '2025-11-27 12:48:56', 10.850800, 106.771700, 30.00, 0.00),
(84, 5, 7, '2025-11-27 12:49:44', 10.850000, 106.750000, 30.00, 0.00),
(85, 5, 7, '2025-11-27 12:49:49', 10.850000, 106.750000, 30.00, 0.00),
(86, 5, 7, '2025-11-27 12:49:54', 10.870000, 106.780000, 30.00, 0.00),
(87, 5, 7, '2025-11-27 12:49:59', 10.890000, 106.800000, 30.00, 0.00),
(88, 5, 7, '2025-11-27 12:50:04', 10.890000, 106.800000, 30.00, 0.00),
(89, NULL, 8, '2025-11-27 12:54:53', 10.749499, 106.650982, 30.00, 0.00),
(90, NULL, 8, '2025-11-27 12:54:54', 10.757013, 106.612034, 30.00, 0.00),
(91, 1, 8, '2025-11-27 12:56:12', 10.823100, 106.629700, 30.00, 0.00),
(92, 1, 8, '2025-11-27 12:56:15', 10.823100, 106.629700, 30.00, 0.00),
(93, 1, 8, '2025-11-27 12:56:20', 10.830000, 106.650000, 30.00, 0.00),
(94, 1, 8, '2025-11-27 12:56:25', 10.840000, 106.700000, 30.00, 0.00),
(95, 1, 8, '2025-11-27 12:56:30', 10.850800, 106.771700, 30.00, 0.00),
(96, 1, 8, '2025-11-27 12:59:19', 10.823100, 106.629700, 30.00, 0.00),
(97, 1, 8, '2025-11-27 12:59:24', 10.823100, 106.629700, 30.00, 0.00),
(98, 1, 8, '2025-11-27 12:59:29', 10.830000, 106.650000, 30.00, 0.00),
(99, 1, 8, '2025-11-27 12:59:34', 10.840000, 106.700000, 30.00, 0.00),
(100, 1, 8, '2025-11-27 12:59:39', 10.850800, 106.771700, 30.00, 0.00),
(101, 1, 8, '2025-11-27 13:10:36', 10.823100, 106.629700, 30.00, 0.00),
(102, 1, 8, '2025-11-27 13:10:41', 10.823100, 106.629700, 30.00, 0.00),
(103, 1, 8, '2025-11-27 13:10:46', 10.830000, 106.650000, 30.00, 0.00),
(104, 1, 8, '2025-11-27 13:10:51', 10.840000, 106.700000, 30.00, 0.00),
(105, 1, 8, '2025-11-27 13:10:56', 10.850800, 106.771700, 30.00, 0.00),
(106, 1, 8, '2025-11-27 13:11:01', 10.850800, 106.771700, 30.00, 0.00),
(107, 1, 8, '2025-11-27 13:13:53', 10.823100, 106.629700, 30.00, 0.00),
(108, 1, 8, '2025-11-27 13:13:58', 10.823100, 106.629700, 30.00, 0.00),
(109, 1, 8, '2025-11-27 13:14:03', 10.830000, 106.650000, 30.00, 0.00),
(110, 1, 8, '2025-11-27 13:14:08', 10.840000, 106.700000, 30.00, 0.00),
(111, 1, 8, '2025-11-27 13:14:13', 10.850800, 106.771700, 30.00, 0.00),
(112, 1, 8, '2025-11-27 13:14:18', 10.850800, 106.771700, 30.00, 0.00),
(113, 1, 8, '2025-11-27 13:28:42', 10.823100, 106.629700, 30.00, 0.00);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `drivers`
--

CREATE TABLE `drivers` (
  `DriverID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `FullName` varchar(100) NOT NULL,
  `Phone` varchar(20) NOT NULL,
  `LicenseNumber` varchar(50) DEFAULT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `drivers`
--

INSERT INTO `drivers` (`DriverID`, `UserID`, `FullName`, `Phone`, `LicenseNumber`, `Status`) VALUES
(1, 4, 'Lê Văn Tài', '09000000004', 'B2', 'ACTIVE'),
(2, 5, 'Phạm Văn Lái', '09000000005', 'B2', 'ACTIVE');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `messages`
--

CREATE TABLE `messages` (
  `MessageID` int(11) NOT NULL,
  `FromUserID` int(11) NOT NULL,
  `ToUserID` int(11) NOT NULL,
  `SentAt` datetime NOT NULL DEFAULT current_timestamp(),
  `Content` varchar(1000) NOT NULL,
  `MessageType` varchar(20) NOT NULL DEFAULT 'TEXT'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `messages`
--

INSERT INTO `messages` (`MessageID`, `FromUserID`, `ToUserID`, `SentAt`, `Content`, `MessageType`) VALUES
(5, 5, 2, '2025-11-23 11:17:28', 'Học sinh Nguyễn Minh A đã được đón ', 'NOTIFICATION'),
(6, 5, 2, '2025-11-23 11:56:01', 'hỏng xe rồi', 'ALERT'),
(7, 5, 6, '2025-11-23 11:56:01', 'hỏng xe rồi', 'ALERT'),
(8, 5, 3, '2025-11-23 11:56:01', 'hỏng xe rồi', 'ALERT'),
(9, 1, 2, '2025-11-23 11:59:28', 'chào', 'TEXT');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `NotificationID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `Type` varchar(50) NOT NULL,
  `Title` varchar(100) NOT NULL,
  `Content` varchar(500) NOT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `ReadAt` datetime DEFAULT NULL,
  `RelatedTripID` int(11) DEFAULT NULL,
  `RelatedStudentID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `parents`
--

CREATE TABLE `parents` (
  `ParentID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `FullName` varchar(100) NOT NULL,
  `Phone` varchar(20) NOT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Address` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `parents`
--

INSERT INTO `parents` (`ParentID`, `UserID`, `FullName`, `Phone`, `Email`, `Address`) VALUES
(1, 2, 'Nguyễn Văn A', '0900000002', 'ph1@ssb.com', '123 Đường A, Q1, TP.HCM'),
(2, 3, 'Trần Thị B', '0900000003', 'ph2@ssb.com', '456 Đường B, Q7, TP.HCM'),
(3, 6, 'Hoàng Văn E', '0923456789', 'hve@ssb.com', '654 Đường E, Q7, TP.HCM'),
(4, 7, 'Võ Thị F', '0934567890', 'vtf@ssb.com', '987 Đường F, Q9, TP.HCM');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `routeassignments`
--

CREATE TABLE `routeassignments` (
  `AssignmentID` int(11) NOT NULL,
  `RouteID` int(11) NOT NULL,
  `BusID` int(11) NOT NULL,
  `DriverID` int(11) NOT NULL,
  `AssignedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `Note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `routeassignments`
--

INSERT INTO `routeassignments` (`AssignmentID`, `RouteID`, `BusID`, `DriverID`, `AssignedAt`, `Note`) VALUES
(1, 11, 8, 2, '2025-11-20 14:00:11', NULL),
(2, 9, 7, 2, '2025-11-20 14:00:15', NULL),
(3, 8, 4, 2, '2025-11-20 14:01:12', NULL),
(4, 7, 2, 2, '2025-11-20 14:01:16', NULL),
(5, 6, 8, 2, '2025-11-20 14:01:18', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `routes`
--

CREATE TABLE `routes` (
  `RouteID` int(11) NOT NULL,
  `RouteName` varchar(100) NOT NULL,
  `Description` varchar(255) DEFAULT NULL,
  `StartPointName` varchar(100) DEFAULT NULL,
  `StartLatitude` decimal(9,6) DEFAULT NULL,
  `StartLongitude` decimal(9,6) DEFAULT NULL,
  `EndPointName` varchar(100) DEFAULT NULL,
  `EndLatitude` decimal(9,6) DEFAULT NULL,
  `EndLongitude` decimal(9,6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `routes`
--

INSERT INTO `routes` (`RouteID`, `RouteName`, `Description`, `StartPointName`, `StartLatitude`, `StartLongitude`, `EndPointName`, `EndLatitude`, `EndLongitude`) VALUES
(6, 'Từ điểm A đến B', '5 km', 'Điểm A - Xuất phát', 10.776900, 106.700900, 'Điểm B - Đích', 10.782900, 106.706900),
(7, 'Từ điểm A đến C', '8 km', 'Điểm A', 10.776900, 106.700900, 'Điểm C', 10.850000, 106.750000),
(8, 'Từ điểm B đến C', '4 km', 'Điểm B', 10.782900, 106.706900, 'Điểm C', 10.850000, 106.750000),
(9, 'Từ điểm C đến D', '7 km', 'Điểm C', 10.850000, 106.750000, 'Điểm D', 10.890000, 106.800000),
(11, 'sgu to hcmute', '10km', 'SGU - Đại học Sài Gòn', 10.823100, 106.629700, 'HCMUTE - Đại học Sư phạm Kỹ thuật', 10.850800, 106.771700);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `routestops`
--

CREATE TABLE `routestops` (
  `StopID` int(11) NOT NULL,
  `RouteID` int(11) NOT NULL,
  `StopName` varchar(100) NOT NULL,
  `Latitude` decimal(9,6) NOT NULL,
  `Longitude` decimal(9,6) NOT NULL,
  `StopOrder` int(11) NOT NULL,
  `ExpectedTime` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `routestops`
--

INSERT INTO `routestops` (`StopID`, `RouteID`, `StopName`, `Latitude`, `Longitude`, `StopOrder`, `ExpectedTime`) VALUES
(1, 11, 'SGU - Đại học Sài Gòn', 10.823100, 106.629700, 1, '07:00:00'),
(2, 11, 'Ngã tư Bình Phước', 10.830000, 106.650000, 2, '07:15:00'),
(3, 11, 'Chợ Bình Triệu', 10.840000, 106.700000, 3, '07:30:00'),
(4, 11, 'HCMUTE - ĐH Sư phạm Kỹ thuật', 10.850800, 106.771700, 4, '07:45:00'),
(5, 6, 'Điểm A - Xuất phát', 10.776900, 106.700900, 1, '07:00:00'),
(6, 6, 'Ngã ba Lê Văn Việt', 10.780000, 106.705000, 2, '07:10:00'),
(7, 6, 'Siêu thị Co.opMart', 10.782000, 106.706500, 3, '07:20:00'),
(8, 6, 'Điểm B - Đích', 10.782900, 106.706900, 4, '07:30:00'),
(9, 7, 'Điểm A', 10.776900, 106.700900, 1, '07:00:00'),
(10, 7, 'Bến xe Miền Đông', 10.815000, 106.713000, 2, '07:20:00'),
(11, 7, 'Điểm C', 10.850000, 106.750000, 3, '07:40:00'),
(12, 8, 'Điểm B', 10.782900, 106.706900, 1, '07:00:00'),
(13, 8, 'Chợ Thủ Đức', 10.800000, 106.720000, 2, '07:15:00'),
(14, 8, 'Điểm C', 10.850000, 106.750000, 3, '07:30:00'),
(15, 9, 'Điểm C', 10.850000, 106.750000, 1, '07:00:00'),
(16, 9, 'Khu công nghệ cao', 10.870000, 106.780000, 2, '07:15:00'),
(17, 9, 'Điểm D', 10.890000, 106.800000, 3, '07:30:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `students`
--

CREATE TABLE `students` (
  `StudentID` int(11) NOT NULL,
  `FullName` varchar(100) NOT NULL,
  `DateOfBirth` date DEFAULT NULL,
  `ClassName` varchar(50) DEFAULT NULL,
  `SchoolName` varchar(100) DEFAULT 'Trường DEF',
  `ParentID` int(11) NOT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT 1,
  `RouteID` int(11) DEFAULT NULL,
  `PickupStopID` int(11) DEFAULT NULL,
  `DropoffStopID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `students`
--

INSERT INTO `students` (`StudentID`, `FullName`, `DateOfBirth`, `ClassName`, `SchoolName`, `ParentID`, `IsActive`, `RouteID`, `PickupStopID`, `DropoffStopID`) VALUES
(1, 'Nguyễn Minh A', '2010-05-15', 'Lớp 8B', 'THCS Nguyễn Trãi', 1, 1, 11, 2, 4),
(2, 'Trần Văn C', '2011-03-10', 'Lớp 7A', 'THCS Lê Lợi', 2, 1, 11, NULL, NULL),
(3, 'Hoàng Thị E', '2010-07-08', 'Lớp 8B', 'THCS Trần Hưng Đạo', 3, 1, 11, NULL, NULL),
(4, 'Võ Văn A', '2012-02-14', 'Lớp 6A', 'THCS Lý Thường Kiệt', 3, 1, 11, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tripevents`
--

CREATE TABLE `tripevents` (
  `EventID` int(11) NOT NULL,
  `TripID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `EventType` varchar(20) NOT NULL,
  `EventTime` datetime NOT NULL DEFAULT current_timestamp(),
  `Status` varchar(20) NOT NULL DEFAULT 'SUCCESS',
  `Note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `trips`
--

CREATE TABLE `trips` (
  `TripID` int(11) NOT NULL,
  `StartTime` time NOT NULL,
  `EndTime` time DEFAULT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'SCHEDULED',
  `AssignmentID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `trips`
--

INSERT INTO `trips` (`TripID`, `StartTime`, `EndTime`, `Status`, `AssignmentID`) VALUES
(1, '07:00:00', '08:00:00', 'scheduled', 1),
(2, '10:00:00', '11:00:00', 'scheduled', 4),
(3, '06:00:00', '07:00:00', 'scheduled', 4),
(4, '14:00:00', '15:00:00', 'scheduled', 3),
(5, '16:00:00', '17:00:00', 'scheduled', 2),
(6, '10:00:00', '11:00:00', 'scheduled', 5);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tripstudents`
--

CREATE TABLE `tripstudents` (
  `TripStudentID` int(11) NOT NULL,
  `TripID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `PickupStopID` int(11) DEFAULT NULL,
  `DropoffStopID` int(11) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT 1,
  `Status` enum('waiting','picked','dropped','absent') DEFAULT 'waiting',
  `UpdatedTime` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `tripstudents`
--

INSERT INTO `tripstudents` (`TripStudentID`, `TripID`, `StudentID`, `PickupStopID`, `DropoffStopID`, `IsActive`, `Status`, `UpdatedTime`) VALUES
(27, 1, 1, NULL, NULL, 1, 'picked', '2025-11-23 11:17:28'),
(28, 1, 4, NULL, NULL, 1, 'dropped', '2025-11-23 11:07:15'),
(29, 6, 2, NULL, NULL, 1, 'picked', '2025-11-22 23:33:11'),
(30, 6, 3, NULL, NULL, 1, 'picked', '2025-11-22 23:33:12');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `Username` varchar(50) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `FullName` varchar(100) NOT NULL,
  `Phone` varchar(20) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Role` varchar(20) NOT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT 1,
  `CreatedAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`UserID`, `Username`, `PasswordHash`, `FullName`, `Phone`, `Email`, `Role`, `IsActive`, `CreatedAt`) VALUES
(1, 'admin', '123456', 'Quản trị hệ thống', '0900000001', 'admin@ssb.com', 'admin', 1, '2025-11-16 00:00:00'),
(2, 'phuhuynh1', '123456', 'Nguyễn Văn A', '0900000002', 'ph1@ssb.com', 'parent', 1, '2025-11-16 00:00:00'),
(3, 'phuhuynh2', '123456', 'Trần Thị B', '0900000003', 'ph2@ssb.com', 'parent', 1, '2025-11-16 00:00:00'),
(4, 'taixe1', '123456', 'Lê Văn Tài', '0900000004', 'driver1@ssb.com', 'driver', 1, '2025-11-16 00:00:00'),
(5, 'taixe2', '123456', 'Phạm Văn Lái', '0900000005', 'driver2@ssb.com', 'driver', 1, '2025-11-16 00:00:00'),
(6, 'phuhuynh3', '123456', 'Hoàng Văn E', '0923456789', 'hve@ssb.com', 'parent', 1, '2025-11-19 19:40:13'),
(7, 'phuhuynh4', '123456', 'Võ Thị F', '0934567890', 'vtf@ssb.com', 'parent', 1, '2025-11-19 19:40:13'),
(8, 'sangdzzz', '123456', 'phan dang nam', '0123456788', 'nam@gmail.com', 'parent', 1, '2025-11-19 22:06:02'),
(9, 'abc', '123456', 'nguyen van a', '0123456777', 'ab#@gmail.com', 'parent', 1, '2025-11-19 22:07:00'),
(10, 'sang2005', '123456', 'Phan Dang Sangg', '0365604327', 'phansang@gmail.com', 'parent', 1, '2025-11-19 22:08:27');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `buses`
--
ALTER TABLE `buses`
  ADD PRIMARY KEY (`BusID`),
  ADD UNIQUE KEY `PlateNumber` (`PlateNumber`);

--
-- Chỉ mục cho bảng `buslocations`
--
ALTER TABLE `buslocations`
  ADD PRIMARY KEY (`LocationID`),
  ADD KEY `FK_BusLocations_Trips` (`TripID`),
  ADD KEY `FK_BusLocations_Buses` (`BusID`);

--
-- Chỉ mục cho bảng `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`DriverID`),
  ADD UNIQUE KEY `UserID` (`UserID`);

--
-- Chỉ mục cho bảng `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`MessageID`),
  ADD KEY `FK_Messages_FromUser` (`FromUserID`),
  ADD KEY `FK_Messages_ToUser` (`ToUserID`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`NotificationID`),
  ADD KEY `FK_Notifications_Users` (`UserID`),
  ADD KEY `FK_Notifications_Trips` (`RelatedTripID`),
  ADD KEY `FK_Notifications_Students` (`RelatedStudentID`);

--
-- Chỉ mục cho bảng `parents`
--
ALTER TABLE `parents`
  ADD PRIMARY KEY (`ParentID`),
  ADD UNIQUE KEY `UserID` (`UserID`);

--
-- Chỉ mục cho bảng `routeassignments`
--
ALTER TABLE `routeassignments`
  ADD PRIMARY KEY (`AssignmentID`),
  ADD KEY `FK_Assignments_Route` (`RouteID`),
  ADD KEY `FK_Assignments_Bus` (`BusID`),
  ADD KEY `FK_Assignments_Driver` (`DriverID`);

--
-- Chỉ mục cho bảng `routes`
--
ALTER TABLE `routes`
  ADD PRIMARY KEY (`RouteID`);

--
-- Chỉ mục cho bảng `routestops`
--
ALTER TABLE `routestops`
  ADD PRIMARY KEY (`StopID`),
  ADD KEY `FK_RouteStops_Routes` (`RouteID`);

--
-- Chỉ mục cho bảng `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`StudentID`),
  ADD KEY `FK_Students_Parents` (`ParentID`),
  ADD KEY `FK_Students_Route` (`RouteID`),
  ADD KEY `FK_Students_PickupStop` (`PickupStopID`),
  ADD KEY `FK_Students_DropoffStop` (`DropoffStopID`);

--
-- Chỉ mục cho bảng `tripevents`
--
ALTER TABLE `tripevents`
  ADD PRIMARY KEY (`EventID`),
  ADD KEY `FK_TripEvents_Trips` (`TripID`),
  ADD KEY `FK_TripEvents_Students` (`StudentID`);

--
-- Chỉ mục cho bảng `trips`
--
ALTER TABLE `trips`
  ADD PRIMARY KEY (`TripID`),
  ADD KEY `FK_Trips_Assignments` (`AssignmentID`);

--
-- Chỉ mục cho bảng `tripstudents`
--
ALTER TABLE `tripstudents`
  ADD PRIMARY KEY (`TripStudentID`),
  ADD KEY `FK_TripStudents_Trips` (`TripID`),
  ADD KEY `FK_TripStudents_Students` (`StudentID`),
  ADD KEY `FK_TripStudents_PickupStops` (`PickupStopID`),
  ADD KEY `FK_TripStudents_DropoffStops` (`DropoffStopID`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Username` (`Username`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `buses`
--
ALTER TABLE `buses`
  MODIFY `BusID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `buslocations`
--
ALTER TABLE `buslocations`
  MODIFY `LocationID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=114;

--
-- AUTO_INCREMENT cho bảng `drivers`
--
ALTER TABLE `drivers`
  MODIFY `DriverID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `messages`
--
ALTER TABLE `messages`
  MODIFY `MessageID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `NotificationID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `parents`
--
ALTER TABLE `parents`
  MODIFY `ParentID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `routeassignments`
--
ALTER TABLE `routeassignments`
  MODIFY `AssignmentID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `routes`
--
ALTER TABLE `routes`
  MODIFY `RouteID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `routestops`
--
ALTER TABLE `routestops`
  MODIFY `StopID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT cho bảng `students`
--
ALTER TABLE `students`
  MODIFY `StudentID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `tripevents`
--
ALTER TABLE `tripevents`
  MODIFY `EventID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `trips`
--
ALTER TABLE `trips`
  MODIFY `TripID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `tripstudents`
--
ALTER TABLE `tripstudents`
  MODIFY `TripStudentID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `buslocations`
--
ALTER TABLE `buslocations`
  ADD CONSTRAINT `FK_BusLocations_Buses` FOREIGN KEY (`BusID`) REFERENCES `buses` (`BusID`),
  ADD CONSTRAINT `FK_BusLocations_Trips` FOREIGN KEY (`TripID`) REFERENCES `trips` (`TripID`);

--
-- Các ràng buộc cho bảng `drivers`
--
ALTER TABLE `drivers`
  ADD CONSTRAINT `FK_Drivers_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`);

--
-- Các ràng buộc cho bảng `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `FK_Messages_FromUser` FOREIGN KEY (`FromUserID`) REFERENCES `users` (`UserID`),
  ADD CONSTRAINT `FK_Messages_ToUser` FOREIGN KEY (`ToUserID`) REFERENCES `users` (`UserID`);

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `FK_Notifications_Students` FOREIGN KEY (`RelatedStudentID`) REFERENCES `students` (`StudentID`),
  ADD CONSTRAINT `FK_Notifications_Trips` FOREIGN KEY (`RelatedTripID`) REFERENCES `trips` (`TripID`),
  ADD CONSTRAINT `FK_Notifications_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`);

--
-- Các ràng buộc cho bảng `parents`
--
ALTER TABLE `parents`
  ADD CONSTRAINT `FK_Parents_Users` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`);

--
-- Các ràng buộc cho bảng `routeassignments`
--
ALTER TABLE `routeassignments`
  ADD CONSTRAINT `FK_Assignments_Bus` FOREIGN KEY (`BusID`) REFERENCES `buses` (`BusID`),
  ADD CONSTRAINT `FK_Assignments_Driver` FOREIGN KEY (`DriverID`) REFERENCES `drivers` (`DriverID`),
  ADD CONSTRAINT `FK_Assignments_Route` FOREIGN KEY (`RouteID`) REFERENCES `routes` (`RouteID`);

--
-- Các ràng buộc cho bảng `routestops`
--
ALTER TABLE `routestops`
  ADD CONSTRAINT `FK_RouteStops_Routes` FOREIGN KEY (`RouteID`) REFERENCES `routes` (`RouteID`);

--
-- Các ràng buộc cho bảng `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `FK_Students_DropoffStop` FOREIGN KEY (`DropoffStopID`) REFERENCES `routestops` (`StopID`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_Students_Parents` FOREIGN KEY (`ParentID`) REFERENCES `parents` (`ParentID`),
  ADD CONSTRAINT `FK_Students_PickupStop` FOREIGN KEY (`PickupStopID`) REFERENCES `routestops` (`StopID`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_Students_Route` FOREIGN KEY (`RouteID`) REFERENCES `routes` (`RouteID`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_Students_Routes` FOREIGN KEY (`RouteID`) REFERENCES `routes` (`RouteID`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `tripevents`
--
ALTER TABLE `tripevents`
  ADD CONSTRAINT `FK_TripEvents_Students` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`),
  ADD CONSTRAINT `FK_TripEvents_Trips` FOREIGN KEY (`TripID`) REFERENCES `trips` (`TripID`);

--
-- Các ràng buộc cho bảng `trips`
--
ALTER TABLE `trips`
  ADD CONSTRAINT `FK_Trips_Assignments` FOREIGN KEY (`AssignmentID`) REFERENCES `routeassignments` (`AssignmentID`);

--
-- Các ràng buộc cho bảng `tripstudents`
--
ALTER TABLE `tripstudents`
  ADD CONSTRAINT `FK_TripStudents_DropoffStop` FOREIGN KEY (`DropoffStopID`) REFERENCES `routestops` (`StopID`),
  ADD CONSTRAINT `FK_TripStudents_DropoffStops` FOREIGN KEY (`DropoffStopID`) REFERENCES `routestops` (`StopID`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_TripStudents_PickupStop` FOREIGN KEY (`PickupStopID`) REFERENCES `routestops` (`StopID`),
  ADD CONSTRAINT `FK_TripStudents_PickupStops` FOREIGN KEY (`PickupStopID`) REFERENCES `routestops` (`StopID`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_TripStudents_Students` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`),
  ADD CONSTRAINT `FK_TripStudents_Trips` FOREIGN KEY (`TripID`) REFERENCES `trips` (`TripID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
