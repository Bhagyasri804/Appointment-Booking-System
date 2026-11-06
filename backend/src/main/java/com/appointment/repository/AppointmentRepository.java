package com.appointment.repository;

import com.appointment.entity.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByStatus(String status);

    long countByStatus(String status);

    List<Appointment> findByCustomerId(Long customerId);

    List<Appointment> findByServiceProviderId(Long serviceProviderId);

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

    @Query("SELECT a.status, COUNT(a) FROM Appointment a GROUP BY a.status")
    List<Object[]> countAppointmentsByStatusGroup();

    @Query("SELECT s.name, COUNT(a), SUM(s.price) FROM Appointment a JOIN a.service s GROUP BY s.id, s.name ORDER BY COUNT(a) DESC")
    List<Object[]> findServicePopularity();
}
