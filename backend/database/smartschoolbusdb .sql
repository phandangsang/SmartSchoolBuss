-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 20, 2025 lúc 03:51 PM
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
(8, '30A1-123456', 40, 'running');

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
(1, 11, 8, 1, '2025-11-20 14:00:11', NULL),
(2, 9, 2, 1, '2025-11-20 14:00:15', NULL),
(3, 8, 8, 2, '2025-11-20 14:01:12', NULL),
(4, 7, 7, 1, '2025-11-20 14:01:16', NULL),
(5, 6, 4, 2, '2025-11-20 14:01:18', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `routes`
--

CREATE TABLE `routes` (
  `RouteID` int(11) NOT NULL,
  `RouteName` varchar(100) NOT NULL,
  `Description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `routes`
--

INSERT INTO `routes` (`RouteID`, `RouteName`, `Description`) VALUES
(6, 'Từ điểm A đến B', '5 km'),
(7, 'Từ điểm A đến C', '8 km'),
(8, 'Từ điểm B đến C', '4 km'),
(9, 'Từ điểm C đến D', '7 km'),
(11, 'sgu to hcmute', '10km');

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
  `IsActive` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `students`
--

INSERT INTO `students` (`StudentID`, `FullName`, `DateOfBirth`, `ClassName`, `SchoolName`, `ParentID`, `IsActive`) VALUES
(1, 'Nguyễn Minh A', '2010-05-15', 'Lớp 8B', 'THCS Nguyễn Trãi', 1, 1),
(2, 'Trần Văn C', '2011-03-10', 'Lớp 7A', 'THCS Lê Lợi', 2, 1),
(3, 'Hoàng Thị E', '2010-07-08', 'Lớp 8B', 'THCS Trần Hưng Đạo', 3, 1),
(4, 'Võ Văn A', '2012-02-14', 'Lớp 6A', 'THCS Lý Thường Kiệt', 3, 1);

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
(1, '07:00:00', '08:00:00', 'scheduled', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tripstudents`
--

CREATE TABLE `tripstudents` (
  `TripStudentID` int(11) NOT NULL,
  `TripID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `PickupStopID` int(11) NOT NULL,
  `DropoffStopID` int(11) NOT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  ADD KEY `FK_Students_Parents` (`ParentID`);

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
  ADD KEY `FK_TripStudents_PickupStop` (`PickupStopID`),
  ADD KEY `FK_TripStudents_DropoffStop` (`DropoffStopID`);

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
  MODIFY `LocationID` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `drivers`
--
ALTER TABLE `drivers`
  MODIFY `DriverID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `messages`
--
ALTER TABLE `messages`
  MODIFY `MessageID` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `StopID` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `TripID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `tripstudents`
--
ALTER TABLE `tripstudents`
  MODIFY `TripStudentID` int(11) NOT NULL AUTO_INCREMENT;

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
  ADD CONSTRAINT `FK_Students_Parents` FOREIGN KEY (`ParentID`) REFERENCES `parents` (`ParentID`);

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
  ADD CONSTRAINT `FK_TripStudents_PickupStop` FOREIGN KEY (`PickupStopID`) REFERENCES `routestops` (`StopID`),
  ADD CONSTRAINT `FK_TripStudents_Students` FOREIGN KEY (`StudentID`) REFERENCES `students` (`StudentID`),
  ADD CONSTRAINT `FK_TripStudents_Trips` FOREIGN KEY (`TripID`) REFERENCES `trips` (`TripID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
