package com.airguard.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;

/**
 * Intelligent DataSource Configuration for AirGuard AI Backend.
 * Automatically adapts between:
 * 1. Render / Supabase / Neon / Railway cloud DATABASE_URL (postgres:// or postgresql://)
 * 2. Explicit DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD environment variables
 * 3. Localhost PostgreSQL service (if reachable)
 * 4. Zero-crash embedded in-memory H2 database fallback when deployed without an external DB
 */
@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${DATABASE_URL:#{null}}")
    private String databaseUrl;

    @Value("${DB_HOST:localhost}")
    private String dbHost;

    @Value("${DB_PORT:5432}")
    private int dbPort;

    @Value("${DB_NAME:airguard_db}")
    private String dbName;

    @Value("${DB_USER:postgres}")
    private String dbUser;

    @Value("${DB_PASSWORD:123456789}")
    private String dbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setConnectionTimeout(10000);

        // 1. Check for standard cloud DATABASE_URL (Render, Supabase, Neon, Railway)
        if (databaseUrl != null && !databaseUrl.trim().isEmpty()) {
            try {
                String cleanUrl = databaseUrl.trim();
                log.info("Configuring PostgreSQL DataSource from cloud DATABASE_URL");

                if (cleanUrl.startsWith("postgres://") || cleanUrl.startsWith("postgresql://")) {
                    URI uri = new URI(cleanUrl);
                    String userInfo = uri.getUserInfo();
                    String user = dbUser;
                    String pwd = dbPassword;
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        user = parts[0];
                        pwd = parts[1];
                    } else if (userInfo != null) {
                        user = userInfo;
                    }

                    int port = (uri.getPort() != -1) ? uri.getPort() : 5432;
                    String path = uri.getPath();
                    if (path != null && path.startsWith("/")) {
                        path = path.substring(1);
                    }
                    String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", uri.getHost(), port, path);

                    config.setDriverClassName("org.postgresql.Driver");
                    config.setJdbcUrl(jdbcUrl);
                    config.setUsername(user);
                    config.setPassword(pwd);
                    log.info("Successfully configured cloud PostgreSQL at host: {}", uri.getHost());
                    return new HikariDataSource(config);
                } else if (cleanUrl.startsWith("jdbc:")) {
                    config.setDriverClassName("org.postgresql.Driver");
                    config.setJdbcUrl(cleanUrl);
                    config.setUsername(dbUser);
                    config.setPassword(dbPassword);
                    return new HikariDataSource(config);
                }
            } catch (Exception e) {
                log.error("Failed to parse DATABASE_URL: {}. Attempting host-based connection...", e.getMessage());
            }
        }

        // 2. Check if a non-localhost host is explicitly provided
        boolean isExplicitRemoteHost = dbHost != null
                && !dbHost.equalsIgnoreCase("localhost")
                && !dbHost.equalsIgnoreCase("127.0.0.1");

        if (isExplicitRemoteHost) {
            String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", dbHost, dbPort, dbName);
            log.info("Configuring PostgreSQL DataSource with remote host: {}", jdbcUrl);
            config.setDriverClassName("org.postgresql.Driver");
            config.setJdbcUrl(jdbcUrl);
            config.setUsername(dbUser);
            config.setPassword(dbPassword);
            return new HikariDataSource(config);
        }

        // 3. Localhost: Test socket connectivity to localhost:dbPort
        boolean isLocalPostgresReachable = isPortReachable("127.0.0.1", dbPort, 1500);

        if (isLocalPostgresReachable) {
            String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", dbHost, dbPort, dbName);
            log.info("Local PostgreSQL instance is online at {}. Connecting...", jdbcUrl);
            config.setDriverClassName("org.postgresql.Driver");
            config.setJdbcUrl(jdbcUrl);
            config.setUsername(dbUser);
            config.setPassword(dbPassword);
            return new HikariDataSource(config);
        }

        // 4. If on cloud (Render) or localhost is unreachable, gracefully fallback to H2
        log.warn("==========================================================================");
        log.warn("PostgreSQL is NOT reachable at {}:{} and no cloud DATABASE_URL was provided!", dbHost, dbPort);
        log.warn("Activating embedded H2 database fallback (in PostgreSQL compatibility mode).");
        log.warn("To persist data in production, set DATABASE_URL or DB_HOST in your Render dashboard.");
        log.warn("==========================================================================");

        config.setDriverClassName("org.h2.Driver");
        config.setJdbcUrl("jdbc:h2:mem:airguard_db;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
        config.setUsername("sa");
        config.setPassword("");
        return new HikariDataSource(config);
    }

    private boolean isPortReachable(String host, int port, int timeoutMs) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
