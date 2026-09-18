package com.airguard.config;

import com.airguard.entity.City;
import com.airguard.entity.User;
import com.airguard.repository.CityRepository;
import com.airguard.repository.UserRepository;
import com.airguard.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CityRepository cityRepository;

    public DataInitializer(UserRepository userRepository, CityRepository cityRepository) {
        this.userRepository = userRepository;
        this.cityRepository = cityRepository;
    }

    @Override
    public void run(String... args) {
        try {
            seedDemoUser();
            seedDefaultCities();
        } catch (Exception e) {
            log.error("Data initialization error: ", e);
        }
    }

    private void seedDemoUser() {
        String demoEmail = "demo@airguard.ai";
        if (!userRepository.existsByEmailIgnoreCase(demoEmail)) {
            String passwordHash = AuthService.hashPassword("airguard123", null);
            User demoUser = new User("Placement Evaluator", demoEmail, passwordHash, "ROLE_EVALUATOR");
            userRepository.save(demoUser);
            log.info("Successfully seeded demo user: {}", demoEmail);
        }
    }

    private void seedDefaultCities() {
        if (cityRepository.count() == 0) {
            List<City> initialCities = List.of(
                    new City("Delhi", "Delhi", "India", 28.6139, 77.2090, "Asia/Kolkata"),
                    new City("Mumbai", "Maharashtra", "India", 19.0760, 72.8777, "Asia/Kolkata"),
                    new City("Bengaluru", "Karnataka", "India", 12.9716, 77.5946, "Asia/Kolkata"),
                    new City("London", "England", "United Kingdom", 51.5074, -0.1278, "Europe/London"),
                    new City("New York", "New York", "United States", 40.7128, -74.0060, "America/New_York"),
                    new City("Tokyo", "Tokyo", "Japan", 35.6762, 139.6503, "Asia/Tokyo")
            );
            cityRepository.saveAll(initialCities);
            log.info("Successfully seeded {} default cities.", initialCities.size());
        }
    }
}
