package com.appointment.service;

import com.appointment.dto.ProviderOverviewDto;

public interface ProviderDashboardService {

    ProviderOverviewDto getProviderOverview(String providerEmail);
}
