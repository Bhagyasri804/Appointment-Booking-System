package com.appointment.repository;

import com.appointment.entity.ServiceEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceEntityRepository extends JpaRepository<ServiceEntity, Long> {

    List<ServiceEntity> findByActiveTrue();

    List<ServiceEntity> findByCategoryId(Long categoryId);

    long countByActiveTrue();

    @Query("SELECT s FROM ServiceEntity s WHERE " +
           "(:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.description) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:categoryId IS NULL OR s.category.id = :categoryId) AND " +
           "(:active IS NULL OR s.active = :active)")
    Page<ServiceEntity> findFiltered(
            @Param("search") String search,
            @Param("categoryId") Long categoryId,
            @Param("active") Boolean active,
            Pageable pageable
    );
}
