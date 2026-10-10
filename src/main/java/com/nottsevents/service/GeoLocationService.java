package com.nottsevents.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * GeoLocationService — converts a venue name (e.g. "Nottingham") into
 * geographic coordinates using the free GeoNames searchJSON API.
 *
 * Also provides a searchLocations() method for the autocomplete endpoint.
 */
@Service
public class GeoLocationService {

    private final RestTemplate restTemplate;

    // Injected from application.properties: geonames.username
    @Value("${geonames.username}")
    private String geoNamesUsername;

    @Autowired
    public GeoLocationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Convert a venue / place name to latitude & longitude.
     *
     * @param venue the venue name (e.g. "Nottingham", "Rock City")
     * @return double[] { latitude, longitude }
     */
    public double[] getCoordinates(String venue) {
        try {
            String url = String.format(
                    "http://api.geonames.org/searchJSON?q=%s&maxRows=1&country=GB&username=%s",
                    venue.replace(" ", "+"), geoNamesUsername);

            Map<?, ?> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("geonames")) {
                List<?> results = (List<?>) response.get("geonames");
                if (results != null && !results.isEmpty()) {
                    Map<?, ?> first = (Map<?, ?>) results.get(0);
                    double lat = Double.parseDouble(first.get("lat").toString());
                    double lng = Double.parseDouble(first.get("lng").toString());
                    System.out.println("GeoNames resolved '" + venue + "' → lat=" + lat + ", lon=" + lng);
                    return new double[]{lat, lng};
                }
            }
        } catch (Exception e) {
            System.err.println("GeoNames lookup failed for '" + venue + "': " + e.getMessage());
        }

        // Fallback — Nottingham city centre for demo purposes
        System.out.println("Using fallback coordinates (Nottingham) for venue: " + venue);
        return new double[]{52.9548, -1.1581};
    }

    /**
     * Search for locations matching a query string.
     * Used by the location autocomplete endpoint.
     *
     * @param query the search text (e.g. "Nottingh")
     * @return List of location results with name, lat, lng, country
     */
    public List<Map<String, Object>> searchLocations(String query) {
        List<Map<String, Object>> locations = new ArrayList<>();

        try {
            String url = String.format(
                    "http://api.geonames.org/searchJSON?q=%s&maxRows=5&country=GB&username=%s",
                    query.replace(" ", "+"), geoNamesUsername);

            Map<?, ?> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("geonames")) {
                List<?> results = (List<?>) response.get("geonames");
                if (results != null) {
                    for (Object item : results) {
                        Map<?, ?> raw = (Map<?, ?>) item;
                        Map<String, Object> location = new HashMap<>();
                        location.put("name", raw.get("name") + ", " + raw.get("countryName"));
                        location.put("lat", Double.parseDouble(raw.get("lat").toString()));
                        location.put("lng", Double.parseDouble(raw.get("lng").toString()));
                        location.put("country", raw.get("countryName"));
                        locations.add(location);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("GeoNames search failed for '" + query + "': " + e.getMessage());
        }

        return locations;
    }
}
