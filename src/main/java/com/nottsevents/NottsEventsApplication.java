package com.nottsevents;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class NottsEventsApplication {

	public static void main(String[] args) {
		SpringApplication.run(NottsEventsApplication.class, args);
	}

}
