package com.appointment.repository;

import com.appointment.entity.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByStatus(String status);

    long countByStatus(String status);

    List<Appointment> findByCustomerId(Long customerId);

    long countByCustomerId(Long customerId);

    long countByCustomerIdAndStatus(Long customerId, String status);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.customer.id = :customerId AND a.appointmentTime >= :now AND UPPER(a.status) != 'CANCELLED'")
    long countUpcomingAppointments(@Param("customerId") Long customerId, @Param("now") LocalDateTime now);

    List<Appointment> findTop5ByCustomerIdOrderByAppointmentTimeDesc(Long customerId);

    List<Appointment> findByCustomerIdAndAppointmentTimeBetween(
            Long customerId,
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("SELECT a FROM Appointment a WHERE a.customer.id = :customerId AND " +
           "(:search IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "(a.serviceProvider IS NOT NULL AND (LOWER(a.serviceProvider.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.serviceProvider.email) LIKE LOWER(CONCAT('%', :search, '%')))) OR " +
           "(a.service IS NOT NULL AND LOWER(a.service.name) LIKE LOWER(CONCAT('%', :search, '%')))) AND " +
           "(:status IS NULL OR UPPER(a.status) = UPPER(:status)) AND " +
           "(:startDate IS NULL OR a.appointmentTime >= :startDate) AND " +
           "(:endDate IS NULL OR a.appointmentTime <= :endDate)")
    Page<Appointment> findCustomerFiltered(
            @Param("customerId") Long customerId,
            @Param("search") String search,
            @Param("status") String status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT a FROM Appointment a WHERE a.customer.id = :customerId AND " +
           "(UPPER(a.status) IN ('COMPLETED', 'CANCELLED') OR a.appointmentTime < :now) AND " +
           "(:search IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "(a.serviceProvider IS NOT NULL AND (LOWER(a.serviceProvider.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.serviceProvider.email) LIKE LOWER(CONCAT('%', :search, '%')))) OR " +
           "(a.service IS NOT NULL AND LOWER(a.service.name) LIKE LOWER(CONCAT('%', :search, '%')))) AND " +
           "(:status IS NULL OR UPPER(a.status) = UPPER(:status)) AND " +
           "(:startDate IS NULL OR a.appointmentTime >= :startDate) AND " +
           "(:endDate IS NULL OR a.appointmentTime <= :endDate)")
    Page<Appointment> findCustomerHistory(
            @Param("customerId") Long customerId,
            @Param("now") LocalDateTime now,
            @Param("search") String search,
            @Param("status") String status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    List<Appointment> findByServiceProviderId(Long serviceProviderId);

    long countByServiceProviderId(Long serviceProviderId);

    long countByServiceProviderIdAndStatus(Long serviceProviderId, String status);

    @Query("SELECT a FROM Appointment a WHERE " +
           "(:search IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "(a.customer IS NOT NULL AND (LOWER(a.customer.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.customer.email) LIKE LOWER(CONCAT('%', :search, '%')))) OR " +
           "(a.serviceProvider IS NOT NULL AND (LOWER(a.serviceProvider.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.serviceProvider.email) LIKE LOWER(CONCAT('%', :search, '%'))))) AND " +
           "(:status IS NULL OR UPPER(a.status) = UPPER(:status)) AND " +
           "(:startDate IS NULL OR a.appointmentTime >= :startDate) AND " +
           "(:endDate IS NULL OR a.appointmentTime <= :endDate)")
    Page<Appointment> findFiltered(
            @Param("search") String search,
            @Param("status") String status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT a FROM Appointment a WHERE a.serviceProvider.id = :providerId AND " +
           "(:search IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "(a.customer IS NOT NULL AND (LOWER(a.customer.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.customer.email) LIKE LOWER(CONCAT('%', :search, '%')))) OR " +
           "(a.service IS NOT NULL AND LOWER(a.service.name) LIKE LOWER(CONCAT('%', :search, '%')))) AND " +
           "(:status IS NULL OR UPPER(a.status) = UPPER(:status)) AND " +
           "(:startDate IS NULL OR a.appointmentTime >= :startDate) AND " +
           "(:endDate IS NULL OR a.appointmentTime <= :endDate)")
    Page<Appointment> findProviderFiltered(
            @Param("providerId") Long providerId,
            @Param("search") String search,
            @Param("status") String status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.serviceProvider.id = :providerId AND a.appointmentTime >= :startOfDay AND a.appointmentTime <= :endOfDay")
    long countTodayAppointments(
            @Param("providerId") Long providerId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );

    @Query("SELECT COALESCE(SUM(s.price), 0) FROM Appointment a JOIN a.service s WHERE a.serviceProvider.id = :providerId AND UPPER(a.status) = 'COMPLETED'")
    BigDecimal calculateTotalEarnings(@Param("providerId") Long providerId);

    @Query("SELECT COALESCE(SUM(s.price), 0) FROM Appointment a JOIN a.service s WHERE a.serviceProvider.id = :providerId AND UPPER(a.status) = 'COMPLETED' AND a.appointmentTime >= :startOfMonth AND a.appointmentTime <= :endOfMonth")
    BigDecimal calculateMonthlyEarnings(
            @Param("providerId") Long providerId,
            @Param("startOfMonth") LocalDateTime startOfMonth,
            @Param("endOfMonth") LocalDateTime endOfMonth
    );

    List<Appointment> findByServiceProviderIdAndAppointmentTimeBetween(
            Long serviceProviderId,
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("SELECT a.status, COUNT(a) FROM Appointment a GROUP BY a.status")
    List<Object[]> countAppointmentsByStatusGroup();

    @Query("SELECT s.name, COUNT(a), SUM(s.price) FROM Appointment a JOIN a.service s GROUP BY s.id, s.name ORDER BY COUNT(a) DESC")
    List<Object[]> findServicePopularity();
}
