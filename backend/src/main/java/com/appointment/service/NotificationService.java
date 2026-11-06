package com.appointment.service;

import com.appointment.dto.NotificationDto;
import com.appointment.entity.User;

import java.util.List;

public interface NotificationService {

    List<NotificationDto> getNotifications(String userEmail);

    long getUnreadCount(String userEmail);

    NotificationDto markAsRead(String userEmail, Long notificationId);

    void markAllAsRead(String userEmail);

    void createNotification(User user, String title, String message, String type, Long relatedAppointmentId);
}
