package com.appointment.repository;

import com.appointment.entity.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {

    Optional<ServiceCategory> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<ServiceCategory> findByActiveTrue();
}
