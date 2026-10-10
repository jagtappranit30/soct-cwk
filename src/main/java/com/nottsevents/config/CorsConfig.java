package com.nottsevents.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Allow all endpoints ("/api/**")
                registry.addMapping("/**")
                        // Allow requests from any origin (e.g., local HTML files or a deployed
                        // frontend)
                        .allowedOrigins("*")
                        // Allow standard REST methods
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        // Allow any headers in the request
                        .allowedHeaders("*");
            }
        };
    }
}
