package com.appointment.service.impl;

import com.appointment.dto.CategoryRequest;
import com.appointment.dto.PageResponse;
import com.appointment.dto.ServiceCategoryDto;
import com.appointment.dto.ServiceDto;
import com.appointment.dto.ServiceRequest;
import com.appointment.entity.ServiceCategory;
import com.appointment.entity.ServiceEntity;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.ServiceCategoryRepository;
import com.appointment.repository.ServiceEntityRepository;
import com.appointment.service.ServiceManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ServiceManagementServiceImpl implements ServiceManagementService {

    private final ServiceEntityRepository serviceEntityRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ServiceDto> getServices(String search, Long categoryId, Boolean active, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<ServiceEntity> pageResult = serviceEntityRepository.findFiltered(searchParam, categoryId, active, pageable);

        return PageResponse.of(pageResult, ServiceDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceDto> getAllActiveServices() {
        return serviceEntityRepository.findByActiveTrue().stream()
                .map(ServiceDto::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceDto getServiceById(Long id) {
        ServiceEntity service = serviceEntityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + id));
        return ServiceDto.fromEntity(service);
    }

    @Override
    @Transactional
    public ServiceDto createService(ServiceRequest request) {
        log.info("Creating new service: {}", request.getName());

        ServiceCategory category = serviceCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Service category not found with ID: " + request.getCategoryId()));

        ServiceEntity service = ServiceEntity.builder()
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .category(category)
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .active(request.isActive())
                .build();

        ServiceEntity saved = serviceEntityRepository.save(service);
        log.info("Service created successfully with ID: {}", saved.getId());
        return ServiceDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public ServiceDto updateService(Long id, ServiceRequest request) {
        log.info("Updating service ID: {}", id);

        ServiceEntity service = serviceEntityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + id));

        ServiceCategory category = serviceCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Service category not found with ID: " + request.getCategoryId()));

        service.setName(request.getName().trim());
        service.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        service.setCategory(category);
        service.setDurationMinutes(request.getDurationMinutes());
        service.setPrice(request.getPrice());
        service.setActive(request.isActive());

        ServiceEntity updated = serviceEntityRepository.save(service);
        return ServiceDto.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteService(Long id) {
        log.info("Deleting service ID: {}", id);
        if (!serviceEntityRepository.existsById(id)) {
            throw new ResourceNotFoundException("Service not found with ID: " + id);
        }
        serviceEntityRepository.deleteById(id);
    }

    @Override
    @Transactional
    public ServiceDto toggleServiceStatus(Long id, boolean active) {
        ServiceEntity service = serviceEntityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + id));
        service.setActive(active);
        ServiceEntity updated = serviceEntityRepository.save(service);
        return ServiceDto.fromEntity(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceCategoryDto> getAllCategories() {
        return serviceCategoryRepository.findAll().stream()
                .map(ServiceCategoryDto::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public ServiceCategoryDto createCategory(CategoryRequest request) {
        String name = request.getName().trim();
        if (serviceCategoryRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Service category already exists with name: " + name);
        }

        ServiceCategory category = ServiceCategory.builder()
                .name(name)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .active(request.isActive())
                .build();

        ServiceCategory saved = serviceCategoryRepository.save(category);
        return ServiceCategoryDto.fromEntity(saved);
    }
}
