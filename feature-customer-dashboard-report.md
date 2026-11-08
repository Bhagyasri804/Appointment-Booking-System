# Feature 5: Customer Dashboard Implementation Report

## 1. Feature Implementation Summary

This report documents the end-to-end implementation of **Feature 5: Complete Customer Dashboard Implementation** for the Appointment Booking System.

The Customer Dashboard provides authenticated customers with a self-service experience to:
- Review overview analytics, upcoming bookings, and recent appointments.
- Browse active healthcare and professional services with real-time category filtering and price sorting.
- Search and discover licensed specialists and service providers, inspecting their profiles, specialization, and working hours.
- Schedule consultations through a multi-step booking workflow with real-time available time slot generation, provider working hours validation, break time exclusion, customer conflict prevention, and thread-synchronized concurrency protection against double-booking.
- Manage existing appointments with filtering, full detail modal inspection, secure cancellations with audit reasons, and rescheduling to future slots.
- Browse completed and cancelled consultation history with date-range filters.
- Maintain their customer profile (name, phone, personal notes) while keeping email securely read-only.
- Receive and interact with appointment lifecycle notifications (confirmation, rescheduling, cancellation).

All backend services, repository queries, DTOs, controllers, and tests were integrated cleanly into the existing Spring Boot architecture, preserving existing Admin and Service Provider functionality. The frontend was implemented with React 18 and Vite, matching the existing dashboard shell navigation and design language.

---

## 2. All Completed Customer Dashboard Features

### A. Customer Overview (`CustomerOverviewView.jsx`)
- Metric telemetry cards displaying: Total Appointments, Upcoming Sessions, Pending Approval, Confirmed Bookings, Completed Sessions, and Cancelled Records.
- Banner welcome card with authenticated user's name and quick action triggers.
- Interactive quick-action hub tiles for one-click navigation to booking, browsing services, finding specialists, and notifications.
- Recent booking activity table listing latest appointment records with status badges, price, scheduled time, and management action buttons.

### B. Browse Services (`CustomerServicesView.jsx`)
- Displays all active services in clean cards.
- Live keyword search across service name and description.
- Category filter dropdown powered by `GET /api/customer/categories`.
- Dynamic sorting by price (Ascending/Descending) and name (A-Z/Z-A).
- Active-only service guard (inactive services are excluded automatically).
- "Book This Service" action that pre-selects the chosen service directly in the booking workflow.

### C. Browse Service Providers (`CustomerProvidersView.jsx`)
- Displays verified and active service providers (`role = SERVICE_PROVIDER`, `enabled = true`).
- Search specialists by doctor name, specialization, or description keywords.
- Specialist cards showing full name, specialization pill, contact info (email, phone), and summary of active working days.
- Interactive "Working Hours" modal presenting the provider's weekly schedule and lunch/break periods.
- "Book Now" action that pre-selects the specialist in the booking workflow.

### D. Book an Appointment (`CustomerBookAppointmentView.jsx`)
- Step-by-step booking workflow:
  1. Service selection with duration and fee display.
  2. Specialist / Provider selection with specialization and contact details.
  3. Appointment date selection with past-date prevention (`min={today}`).
  4. Real-time time slot generation via `GET /api/customer/available-slots`.
  5. Interactive time slot selector indicating Available, Booked, Break, and Past status.
  6. Optional intake notes and symptom description.
  7. Transparent booking summary displaying service, provider, date, slot time, duration, and consultation fee.
  8. Submission with loading spinner and double-booking concurrency locking.
  9. Booking confirmation screen displaying reference ID, status (PENDING), appointment summary, and quick navigation.

### E. My Appointments (`CustomerAppointmentsView.jsx`)
- Tabbed management page: All Records, Upcoming, Pending Approval, Confirmed, Completed, and Cancelled.
- Keyword search and pagination controls.
- Full appointment details modal.
- Reschedule modal with new date picker, dynamic slot generator, slot picker, and reason capture.
- Cancellation modal with mandatory cancellation reason capture.
- Strict business rule enforcement: only future, non-cancelled, non-completed appointments can be cancelled or rescheduled.

### F. Appointment History (`CustomerHistoryView.jsx`)
- Dedicated archive view for historical and past appointments (`COMPLETED`, `CANCELLED`, or past appointment dates).
- Date-range filtering (From Date and To Date).
- Search by service or provider name.
- Status filter and full archive details modal.

### G. Customer Profile Management (`CustomerProfileView.jsx`)
- Displays registered customer profile, user ID, and member join date.
- Full name editing with validation (2–120 characters).
- Phone number editing with character limits.
- Preferences and medical/consultation notes textarea (1000 characters).
- Registered email locked as read-only with security badge.

### H. Notifications & Alerts (`CustomerNotificationsView.jsx`)
- Real-time customer notification feed for booking creation, provider confirmations, cancellations, and reschedules.
- Unread badge counter displayed on the topbar and sidebar navigation.
- Mark individual notifications as read.
- "Mark All as Read" bulk action.
- Direct navigation shortcut to related appointment records (`relatedAppointmentId`).

---

## 3. Backend Files Created and Modified

### Created Files:
1. `backend/src/main/java/com/appointment/dto/CustomerDashboardDto.java`
2. `backend/src/main/java/com/appointment/dto/CustomerProfileDto.java`
3. `backend/src/main/java/com/appointment/dto/CustomerProviderDto.java`
4. `backend/src/main/java/com/appointment/dto/BookAppointmentRequest.java`
5. `backend/src/main/java/com/appointment/dto/RescheduleAppointmentRequest.java`
6. `backend/src/main/java/com/appointment/dto/UpdateCustomerProfileRequest.java`
7. `backend/src/main/java/com/appointment/service/CustomerService.java`
8. `backend/src/main/java/com/appointment/service/impl/CustomerServiceImpl.java`
9. `backend/src/test/java/com/appointment/service/CustomerServiceTest.java`
10. `backend/src/test/java/com/appointment/controller/CustomerControllerTest.java`

### Modified Files:
1. `backend/src/main/java/com/appointment/controller/CustomerController.java` (implemented all customer endpoints)
2. `backend/src/main/java/com/appointment/repository/AppointmentRepository.java` (added customer queries and count aggregations)
3. `backend/src/main/java/com/appointment/repository/UserRepository.java` (added active provider queries and provider search)
4. `backend/src/main/java/com/appointment/repository/ServiceEntityRepository.java` (added customer service search and sorting query)
5. `backend/src/test/java/com/appointment/service/AdminServiceTest.java` (updated repository test doubles)
6. `backend/src/test/java/com/appointment/service/AuthServiceTest.java` (updated repository test doubles)
7. `backend/src/test/java/com/appointment/service/ProviderServiceTest.java` (updated repository test doubles)

---

## 4. Frontend Files Created and Modified

### Created Files:
1. `frontend/src/pages/customer/CustomerOverviewView.jsx`
2. `frontend/src/pages/customer/CustomerServicesView.jsx`
3. `frontend/src/pages/customer/CustomerProvidersView.jsx`
4. `frontend/src/pages/customer/CustomerBookAppointmentView.jsx`
5. `frontend/src/pages/customer/CustomerAppointmentsView.jsx`
6. `frontend/src/pages/customer/CustomerHistoryView.jsx`
7. `frontend/src/pages/customer/CustomerNotificationsView.jsx`
8. `frontend/src/pages/customer/CustomerProfileView.jsx`

### Modified Files:
1. `frontend/src/pages/CustomerDashboard.jsx` (replaced placeholder with layout, sidebar, topbar, and view switching)
2. `frontend/src/services/api.js` (added 20 customer portal API methods)
3. `frontend/src/App.css` (enhanced badge and status classes)

---

## 5. REST API Endpoints

All customer endpoints reside under `/api/customer/**` and require role `ROLE_CUSTOMER`.

| HTTP Method | Endpoint | Description | Request Body / Params | Response Data |
|---|---|---|---|---|
| `GET` | `/api/customer/dashboard` | Aggregated metrics & recent appointments | None | `CustomerDashboardDto` |
| `GET` | `/api/customer/services` | Active services catalog | `search`, `categoryId`, `sortBy`, `sortDir` | `List<ServiceDto>` |
| `GET` | `/api/customer/services/{id}` | Single active service details | Path variable `id` | `ServiceDto` |
| `GET` | `/api/customer/categories` | Active service categories | None | `List<ServiceCategoryDto>` |
| `GET` | `/api/customer/providers` | Available specialists | `search` | `List<CustomerProviderDto>` |
| `GET` | `/api/customer/providers/{id}` | Specialist profile | Path variable `id` | `CustomerProviderDto` |
| `GET` | `/api/customer/providers/{id}/availability` | Provider working hours | Path variable `id` | `List<AvailabilityDto>` |
| `GET` | `/api/customer/available-slots` | Available time slots calculation | `providerId`, `serviceId`, `date` | `List<TimeSlotDto>` |
| `POST` | `/api/customer/appointments` | Book new appointment | `BookAppointmentRequest` | `AppointmentResponse` (HTTP 201) |
| `GET` | `/api/customer/appointments` | Customer appointments (paged) | `search`, `status`, `startDate`, `endDate`, `page`, `size` | `PageResponse<AppointmentResponse>` |
| `GET` | `/api/customer/appointments/{id}` | Single appointment details | Path variable `id` | `AppointmentResponse` |
| `PUT` | `/api/customer/appointments/{id}/cancel` | Cancel eligible appointment | `CancelAppointmentRequest` | `AppointmentResponse` |
| `PUT` | `/api/customer/appointments/{id}/reschedule` | Reschedule appointment | `RescheduleAppointmentRequest` | `AppointmentResponse` |
| `GET` | `/api/customer/history` | Historical appointments | `search`, `status`, `startDate`, `endDate`, `page`, `size` | `PageResponse<AppointmentResponse>` |
| `GET` | `/api/customer/profile` | Current customer profile | None | `CustomerProfileDto` |
| `PUT` | `/api/customer/profile` | Update profile information | `UpdateCustomerProfileRequest` | `CustomerProfileDto` |
| `GET` | `/api/customer/notifications` | Notifications feed | None | `List<NotificationDto>` |
| `GET` | `/api/customer/notifications/unread-count` | Unread notifications count | None | `Long` |
| `PUT` | `/api/customer/notifications/{id}/read` | Mark notification read | Path variable `id` | `NotificationDto` |
| `PUT` | `/api/customer/notifications/read-all` | Mark all notifications read | None | `Void` |

---

## 6. Database Changes

- **No destructive schema changes**: Reused existing tables: `users`, `appointments`, `services`, `service_categories`, `provider_availabilities`, `notifications`.
- Enhanced JPA query methods on `AppointmentRepository`, `UserRepository`, and `ServiceEntityRepository` with parameterized queries (`@Param`) and index-friendly filters.

---

## 7. Security and Validation Details

1. **Role-Based Access Control (RBAC)**:
   - Configured in `SecurityConfig.java`: `.requestMatchers("/api/customer/**").hasRole("CUSTOMER")`.
   - Annotated on `CustomerController`: `@PreAuthorize("hasRole('CUSTOMER')")`.
2. **Customer Identity Isolation**:
   - Customer identity is retrieved strictly from the validated JWT subject (`userDetails.getUsername()`).
   - Customer IDs sent in request bodies or query parameters are never accepted as proof of ownership.
   - Any attempt to view, cancel, or reschedule another customer's appointment throws a `BadRequestException` ("Access denied: You do not have permission...").
3. **Double-Booking & Concurrency Protection**:
   - Backend availability re-validation occurs inside `@Transactional`.
   - String interning synchronization per provider (`synchronized (("provider_booking_lock_" + provider.getId()).intern())`) ensures atomic slot checks and prevents concurrent double-booking conflicts across threads.
   - Separate checks ensure:
     - Date/time is strictly in the future.
     - Requested slot falls within provider's active operating hours for the given day of the week.
     - Requested slot does not overlap provider lunch/break periods.
     - Provider does not have an overlapping non-cancelled appointment.
     - Customer does not have another overlapping appointment.
4. **Input Validation**:
   - DTOs validated using Jakarta Bean Validation (`@NotNull`, `@NotBlank`, `@Size`).

---

## 8. Test Results

### Backend Test Execution (`mvn test -f backend/pom.xml`):
```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.appointment.controller.CustomerControllerTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0 -- in com.appointment.controller.CustomerControllerTest
[INFO] Running com.appointment.controller.HealthControllerTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 -- in com.appointment.controller.HealthControllerTest
[INFO] Running com.appointment.security.JwtTokenProviderTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 -- in com.appointment.security.JwtTokenProviderTest
[INFO] Running com.appointment.service.AdminServiceTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 -- in com.appointment.service.AdminServiceTest
[INFO] Running com.appointment.service.AuthServiceTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0 -- in com.appointment.service.AuthServiceTest
[INFO] Running com.appointment.service.CustomerServiceTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0 -- in com.appointment.service.CustomerServiceTest
[INFO] Running com.appointment.service.ProviderServiceTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0 -- in com.appointment.service.ProviderServiceTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 38, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Coverage of Customer Tests:
- `testCustomerDashboardStats`: Aggregates upcoming, pending, confirmed, completed, cancelled, and recent records.
- `testServiceAndProviderListing`: Service category filtering, price sorting, active guards, and provider listing.
- `testAppointmentCreation`: Successful booking, PENDING status assignment, customer/provider linkage, and dual notification generation.
- `testInvalidAndUnavailableTimeSlots`: Past dates, off-duty days, pre-opening hours, and break collisions properly rejected.
- `testDoubleBookingPrevention`: Overlapping slot rejection for provider and customer.
- `testConcurrentBookingAttempts`: Multi-threaded race condition test where exactly 1 of 4 concurrent threads succeeds and the remaining 3 receive conflict errors.
- `testCancellationAndRescheduling`: Cancellation reason persistence, status change, reschedule slot validation, and notification generation.
- `testCustomerDataIsolation`: Cross-customer appointment view, cancel, and reschedule attempts blocked.
- `testProfileManagement`: Profile updates and email immutability verified.
- `CustomerControllerTest`: Controller endpoints, authorization, and HTTP status codes verified.

---

## 9. Backend Package Result

### Maven Package Execution (`mvn package -f backend/pom.xml`):
```
[INFO] --- jar:3.4.2:jar (default-jar) @ appointment-booking-backend ---
[INFO] Building jar: C:\Projects\Appointment-Booking-System\backend\target\appointment-booking-backend-0.0.1-SNAPSHOT.jar
[INFO] 
[INFO] --- spring-boot:3.3.5:repackage (repackage) @ appointment-booking-backend ---
[INFO] Replacing main artifact with repackaged archive, adding nested dependencies in BOOT-INF/.
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Total time: 11.431 s
[INFO] ------------------------------------------------------------------------
```

---

## 10. Frontend Build Result

### Vite Build Execution (`npm run build --prefix frontend`):
```
> appointment-booking-frontend@0.1.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 129 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.68 kB │ gzip:   0.39 kB
dist/assets/index-AaGExXQu.css   38.03 kB │ gzip:   7.17 kB
dist/assets/index-DFvOyUSs.js   439.62 kB │ gzip: 119.76 kB
✓ built in 1.19s
```

---

## 11. Live Integration Verification Results

- **Routing & RBAC**: Customer routes protected by `<ProtectedRoute allowedRoles={['CUSTOMER']}>`. Unauthorized attempts redirect to `/unauthorized` or `/login`.
- **API Interceptors**: JWT Bearer token automatically attached from `localStorage`; 401 response handling clears expired sessions.
- **Cross-Dashboard Protection**: Existing Admin (`/admin/dashboard`) and Service Provider (`/provider/dashboard`) features remain untouched and operational.
- **Demo Users**: Default customer (`customer@appointment.com` / `Customer@123`) has seeded demonstration data.

---

## 12. Any Remaining Issues

- None. All requirements for Feature 5 are implemented, tested, verified, and passing cleanly.
