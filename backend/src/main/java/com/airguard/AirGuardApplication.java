package com.airguard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AirGuardApplication {

    public static void main(String[] args) {
        SpringApplication.run(AirGuardApplication.class, args);
    }
}
