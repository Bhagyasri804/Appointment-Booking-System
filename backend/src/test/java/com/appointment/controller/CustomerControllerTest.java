package com.appointment.controller;

import com.appointment.dto.ApiResponse;
import com.appointment.dto.AppointmentResponse;
import com.appointment.dto.BookAppointmentRequest;
import com.appointment.dto.CancelAppointmentRequest;
import com.appointment.dto.CustomerDashboardDto;
import com.appointment.dto.CustomerProfileDto;
import com.appointment.dto.CustomerProviderDto;
import com.appointment.dto.NotificationDto;
import com.appointment.dto.PageResponse;
import com.appointment.dto.RescheduleAppointmentRequest;
import com.appointment.dto.ServiceDto;
import com.appointment.dto.TimeSlotDto;
import com.appointment.dto.UpdateCustomerProfileRequest;
import com.appointment.repository.ServiceCategoryRepository;
import com.appointment.service.CustomerService;
import com.appointment.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CustomerControllerTest {

    private CustomerService customerService;
    private NotificationService notificationService;
    private ServiceCategoryRepository categoryRepository;
    private CustomerController controller;

    private UserDetails customerUser;

    @BeforeEach
    void setUp() {
        customerService = Mockito.mock(CustomerService.class);
        notificationService = Mockito.mock(NotificationService.class);
        categoryRepository = Mockito.mock(ServiceCategoryRepository.class);
        controller = new CustomerController(customerService, notificationService, categoryRepository);

        customerUser = User.builder()
                .username("customer@appointment.com")
                .password("password")
                .roles("CUSTOMER")
                .build();
    }

    @Test
    @DisplayName("GET /api/customer/dashboard returns customer overview stats")
    void testGetDashboard() {
        CustomerDashboardDto dto = CustomerDashboardDto.builder()
                .totalAppointments(5)
                .upcomingAppointments(2)
                .pendingAppointments(1)
                .confirmedAppointments(1)
                .completedAppointments(2)
                .cancelledAppointments(1)
                .recentAppointments(Collections.emptyList())
                .build();

        when(customerService.getCustomerDashboard("customer@appointment.com")).thenReturn(dto);

        ResponseEntity<ApiResponse<CustomerDashboardDto>> res = controller.getCustomerDashboard(customerUser);
        assertNotNull(res);
        assertEquals(200, res.getStatusCode().value());
        assertTrue(res.getBody().isSuccess());
        assertEquals(5, res.getBody().getData().getTotalAppointments());
    }

    @Test
    @DisplayName("GET /api/customer/services returns service listings")
    void testGetServices() {
        ServiceDto service = ServiceDto.builder()
                .id(1L)
                .name("Checkup")
                .price(new BigDecimal("50.00"))
                .active(true)
                .build();

        when(customerService.getServices("check", 1L, "price", "asc"))
                .thenReturn(List.of(service));

        ResponseEntity<ApiResponse<List<ServiceDto>>> res = controller.getServices("check", 1L, "price", "asc");
        assertEquals(200, res.getStatusCode().value());
        assertEquals(1, res.getBody().getData().size());
        assertEquals("Checkup", res.getBody().getData().get(0).getName());
    }

    @Test
    @DisplayName("POST /api/customer/appointments creates appointment")
    void testBookAppointment() {
        BookAppointmentRequest request = BookAppointmentRequest.builder()
                .serviceId(1L)
                .providerId(2L)
                .appointmentTime(LocalDateTime.now().plusDays(2))
                .notes("New booking")
                .build();

        AppointmentResponse appt = AppointmentResponse.builder()
                .id(100L)
                .title("Checkup - Alice")
                .status("PENDING")
                .build();

        when(customerService.bookAppointment(eq("customer@appointment.com"), any(BookAppointmentRequest.class)))
                .thenReturn(appt);

        ResponseEntity<ApiResponse<AppointmentResponse>> res = controller.bookAppointment(customerUser, request);
        assertEquals(201, res.getStatusCode().value());
        assertEquals(100L, res.getBody().getData().getId());
    }

    @Test
    @DisplayName("PUT /api/customer/appointments/{id}/cancel cancels appointment")
    void testCancelAppointment() {
        CancelAppointmentRequest req = CancelAppointmentRequest.builder()
                .reason("Change of plans")
                .build();

        AppointmentResponse appt = AppointmentResponse.builder()
                .id(100L)
                .status("CANCELLED")
                .cancellationReason("Change of plans")
                .build();

        when(customerService.cancelAppointment(eq("customer@appointment.com"), eq(100L), any(CancelAppointmentRequest.class)))
                .thenReturn(appt);

        ResponseEntity<ApiResponse<AppointmentResponse>> res = controller.cancelAppointment(customerUser, 100L, req);
        assertEquals(200, res.getStatusCode().value());
        assertEquals("CANCELLED", res.getBody().getData().getStatus());
    }

    @Test
    @DisplayName("PUT /api/customer/appointments/{id}/reschedule reschedules appointment")
    void testRescheduleAppointment() {
        RescheduleAppointmentRequest req = RescheduleAppointmentRequest.builder()
                .newAppointmentTime(LocalDateTime.now().plusDays(3))
                .reason("Work conflict")
                .build();

        AppointmentResponse appt = AppointmentResponse.builder()
                .id(100L)
                .status("PENDING")
                .build();

        when(customerService.rescheduleAppointment(eq("customer@appointment.com"), eq(100L), any(RescheduleAppointmentRequest.class)))
                .thenReturn(appt);

        ResponseEntity<ApiResponse<AppointmentResponse>> res = controller.rescheduleAppointment(customerUser, 100L, req);
        assertEquals(200, res.getStatusCode().value());
        assertEquals(100L, res.getBody().getData().getId());
    }

    @Test
    @DisplayName("Customer Profile and Notifications endpoints respond correctly")
    void testProfileAndNotifications() {
        CustomerProfileDto profile = CustomerProfileDto.builder()
                .id(1L)
                .fullName("Alice")
                .email("customer@appointment.com")
                .build();

        when(customerService.getCustomerProfile("customer@appointment.com")).thenReturn(profile);
        when(notificationService.getUnreadCount("customer@appointment.com")).thenReturn(3L);

        ResponseEntity<ApiResponse<CustomerProfileDto>> pRes = controller.getProfile(customerUser);
        assertEquals(200, pRes.getStatusCode().value());
        assertEquals("Alice", pRes.getBody().getData().getFullName());

        ResponseEntity<ApiResponse<Long>> nRes = controller.getUnreadNotificationCount(customerUser);
        assertEquals(200, nRes.getStatusCode().value());
        assertEquals(3L, nRes.getBody().getData());

        controller.markAllNotificationsRead(customerUser);
        verify(notificationService).markAllAsRead("customer@appointment.com");
    }
}
