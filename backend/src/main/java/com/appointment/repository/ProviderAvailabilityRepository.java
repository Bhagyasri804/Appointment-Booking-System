package com.appointment.repository;

import com.appointment.entity.ProviderAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface ProviderAvailabilityRepository extends JpaRepository<ProviderAvailability, Long> {

    List<ProviderAvailability> findByProviderId(Long providerId);

    List<ProviderAvailability> findByProviderIdOrderByDayOfWeekAscStartTimeAsc(Long providerId);

    List<ProviderAvailability> findByProviderIdAndDayOfWeek(Long providerId, DayOfWeek dayOfWeek);

    List<ProviderAvailability> findByProviderIdAndDayOfWeekAndActiveTrue(Long providerId, DayOfWeek dayOfWeek);

    List<ProviderAvailability> findByProviderIdAndActiveTrue(Long providerId);

    boolean existsByProviderId(Long providerId);
}
