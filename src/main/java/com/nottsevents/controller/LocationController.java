package com.nottsevents.controller;

import com.nottsevents.service.GeoLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * LocationController — provides a location search / autocomplete endpoint.
 * Used by the frontend when creating events to suggest venue names
 * and automatically store latitude + longitude.
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/location")
public class LocationController {

    private final GeoLocationService geoLocationService;

    @Autowired
    public LocationController(GeoLocationService geoLocationService) {
        this.geoLocationService = geoLocationService;
    }

    /**
     * Search for locations by name.
     * Example: GET /api/location/search?q=Nottingham
     *
     * Returns a list of matching places with coordinates.
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchLocations(@RequestParam String q) {
        if (q == null || q.trim().length() < 2) {
            return new ResponseEntity<>("Query must be at least 2 characters", HttpStatus.BAD_REQUEST);
        }

        List<Map<String, Object>> results = geoLocationService.searchLocations(q.trim());
        return new ResponseEntity<>(results, HttpStatus.OK);
    }
}
