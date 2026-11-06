package com.appointment.service;

import com.appointment.dto.CategoryRequest;
import com.appointment.dto.PageResponse;
import com.appointment.dto.ServiceCategoryDto;
import com.appointment.dto.ServiceDto;
import com.appointment.dto.ServiceRequest;

import java.util.List;

public interface ServiceManagementService {

    PageResponse<ServiceDto> getServices(String search, Long categoryId, Boolean active, int page, int size, String sortBy, String sortDir);

    List<ServiceDto> getAllActiveServices();

    ServiceDto getServiceById(Long id);

    ServiceDto createService(ServiceRequest request);

    ServiceDto updateService(Long id, ServiceRequest request);

    void deleteService(Long id);

    ServiceDto toggleServiceStatus(Long id, boolean active);

    List<ServiceCategoryDto> getAllCategories();

    ServiceCategoryDto createCategory(CategoryRequest request);
}
