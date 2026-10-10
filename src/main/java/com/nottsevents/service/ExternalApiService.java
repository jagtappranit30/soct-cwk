package com.nottsevents.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class ExternalApiService {

    private static final Logger logger = LoggerFactory.getLogger(ExternalApiService.class);
    private final RestTemplate restTemplate;

    @Value("${skiddle.api.key}")
    private String skiddleApiKey;

    @Value("${weather.api.key}")
    private String weatherApiKey;

    @Value("${geonames.username:demo}")
    private String geoNamesUsername;

    @Autowired
    public ExternalApiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Gets nearby public events from the Skiddle API using provided coordinates.
     */
    public Map<String, Object> getPublicEventsFromSkiddle(double lat, double lon) {
        String url = String.format(
                "https://www.skiddle.com/api/v1/events/search/?api_key=%s&latitude=%f&longitude=%f&radius=5&eventcode=CLUB",
                skiddleApiKey, lat, lon);
        
        logger.info("Fetching Skiddle events for coordinates: {}, {}", lat, lon);
        
        try {
            return restTemplate.getForObject(url, Map.class);
        } catch (RestClientException e) {
            logger.error("Error fetching Skiddle events for coordinates: {}, {}. Error: {}", lat, lon, e.getMessage());
            return null;
        }
    }

    /**
     * Gets nearby public events in Nottingham from the Skiddle API (default coordinates)
     */
    public Map<String, Object> getPublicEventsFromSkiddle() {
        // Fallback to Nottingham coordinates
        return getPublicEventsFromSkiddle(52.9548, -1.1581);
    }

    /**
     * Gets weather from OpenWeatherMap for given coordinates
     */
    public Map<String, Object> getWeatherForLocation(double lat, double lon) {
        String url = String.format(
                "https://api.openweathermap.org/data/2.5/forecast?lat=%f&lon=%f&appid=%s&units=metric",
                lat, lon, weatherApiKey);
        try {
            return restTemplate.getForObject(url, Map.class);
        } catch (RestClientException e) {
            logger.error("Error fetching weather for coordinates: {}, {}. Error: {}", lat, lon, e.getMessage());
            return null;
        }
    }

    /**
     * Gets Wikipedia information for a specific location using GeoNames API
     */
    public Map<String, Object> getWikipediaInfoForLocation(String location) {
        String url = String.format(
                "http://api.geonames.org/wikipediaSearchJSON?q=%s&maxRows=1&username=%s",
                location, geoNamesUsername);
        try {
            return restTemplate.getForObject(url, Map.class);
        } catch (RestClientException e) {
            logger.error("Error fetching Wikipedia info for location: {}. Error: {}", location, e.getMessage());
            return null;
        }
    }
}
