package com.appointment.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseStartupVerifier implements CommandLineRunner {

    private final DataSource dataSource;

    @Override
    public void run(String... args) {
        log.info("Verifying MySQL database connection on startup...");
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            log.info("============================================================");
            log.info(" MySQL Database Connection Verified Successfully!");
            log.info(" Database Product: {}", metaData.getDatabaseProductName());
            log.info(" Database Version: {}", metaData.getDatabaseProductVersion());
            log.info(" Database Name:    {}", connection.getCatalog());
            log.info(" JDBC Driver:      {} ({})", metaData.getDriverName(), metaData.getDriverVersion());
            log.info(" Auto-commit mode: {}", connection.getAutoCommit());
            log.info("============================================================");
        } catch (Exception e) {
            log.error("============================================================");
            log.error(" FAILED to connect to MySQL database during startup!", e);
            log.error(" Check that MySQL is running on localhost:3306 and DB_USERNAME / DB_PASSWORD are set correctly.");
            log.error("============================================================");
        }
    }
}
