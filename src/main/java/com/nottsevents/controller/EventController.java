package com.nottsevents.controller;

import com.nottsevents.model.Event;
import com.nottsevents.repository.EventRepository;
import com.nottsevents.repository.StudentRepository;
import com.nottsevents.service.ExternalApiService;
import com.nottsevents.service.GeoLocationService;
import com.nottsevents.service.WeatherService;
import com.nottsevents.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository eventRepository;
    private final StudentRepository studentRepository;
    private final ExternalApiService externalApiService;
    private final GeoLocationService geoLocationService;
    private final WeatherService weatherService;
    private final EventService eventService;

    // Inject all required services
    @Autowired
    public EventController(EventRepository eventRepository,
                           StudentRepository studentRepository,
                           ExternalApiService externalApiService,
                           GeoLocationService geoLocationService,
                           WeatherService weatherService,
                           EventService eventService) {
        this.eventRepository = eventRepository;
        this.studentRepository = studentRepository;
        this.externalApiService = externalApiService;
        this.geoLocationService = geoLocationService;
        this.weatherService = weatherService;
        this.eventService = eventService;
    }

    // ------------------------------------------------------------------
    // FEATURE 1 — EVENT CRUD
    // ------------------------------------------------------------------

    // This method allows users to add a new event to the database.
    // After saving, it geocodes the venue using GeoNames and saves coordinates.
    @PostMapping("/add")
    public ResponseEntity<?> addEvent(@RequestBody Event event) {
        // Validate publisher (Subscription Requirement)
        String publisherId = event.getPublisherId();
        if (publisherId == null || studentRepository.findByStudentId(publisherId).isEmpty()) {
            return new ResponseEntity<>("Publisher not registered. Please subscribe to the system first.", HttpStatus.FORBIDDEN);
        }

        // Set initial attendees to 0 when a new event is created
        event.setCurrentAttendees(0);

        // Save the event to MongoDB first so it gets an ID
        Event savedEvent = eventRepository.save(event);

        // Geocode the venue and store coordinates
        if (savedEvent.getVenue() != null && !savedEvent.getVenue().isEmpty()) {
            double[] coords = geoLocationService.getCoordinates(savedEvent.getVenue());
            savedEvent.setLatitude(coords[0]);
            savedEvent.setLongitude(coords[1]);
            
            savedEvent = eventRepository.save(savedEvent);
        }

        return new ResponseEntity<>(savedEvent, HttpStatus.CREATED);
    }

    // This method gets a single event by its ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable String id) {
        Optional<Event> optionalEvent = eventRepository.findById(id);
        if (optionalEvent.isPresent()) {
            return new ResponseEntity<>(optionalEvent.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Event not found with ID: " + id, HttpStatus.NOT_FOUND);
        }
    }

    // This method returns a list of all events, or filters by type/venue/date if provided
    @GetMapping
    public List<Event> getEvents(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String venue,
            @RequestParam(required = false) String date) {

        if (type == null && venue == null && date == null) {
            return eventRepository.findAll();
        }

        String searchType = type != null ? type : "";
        String searchVenue = venue != null ? venue : "";
        String searchDate = date != null ? date : "";

        return eventRepository.searchEvents(searchType, searchVenue, searchDate);
    }

    // ------------------------------------------------------------------
    // BACKFILL — Geocode all existing events that are missing coordinates
    // ------------------------------------------------------------------

    // One-time utility: call POST /api/events/geocode-all to add lat/lon to
    // every event that was created before GeoNames integration was added.
    // This enables Weather and Google Maps for ALL existing events.
    @PostMapping("/geocode-all")
    public ResponseEntity<?> geocodeAllEvents() {
        List<Event> allEvents = eventRepository.findAll();
        int updated = 0;
        int skipped = 0;

        for (Event event : allEvents) {
            // Skip events that already have coordinates
            if (event.getLatitude() != null && event.getLongitude() != null) {
                skipped++;
                continue;
            }

            // Skip events with no venue set
            if (event.getVenue() == null || event.getVenue().isEmpty()) {
                skipped++;
                continue;
            }

            // Geocode the venue and save
            double[] coords = geoLocationService.getCoordinates(event.getVenue());
            event.setLatitude(coords[0]);
            event.setLongitude(coords[1]);
            eventRepository.save(event);
            updated++;

            // Small pause to avoid hammering the GeoNames API rate limit
            try { Thread.sleep(300); } catch (InterruptedException ignored) {}
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Geocoding complete");
        result.put("updated", updated);
        result.put("skipped", skipped);
        result.put("total", allEvents.size());
        return new ResponseEntity<>(result, HttpStatus.OK);
    }



    // Returns current weather conditions for a specific event.
    // Uses coordinates stored on the event document (set at creation time).
    // Get the weather forecast for this event's location (uses OpenWeatherMap indirectly)
    @GetMapping("/{id}/weather")
    public ResponseEntity<?> getWeatherForEvent(@PathVariable String id) {
        Optional<Event> optionalEvent = eventRepository.findById(id);
        if (optionalEvent.isEmpty()) {
            return new ResponseEntity<>("Event not found with ID: " + id, HttpStatus.NOT_FOUND);
        }

        Event event = optionalEvent.get();

        // Get the weather from our Weather Service and send it straight to the frontend
        Map<String, Object> weatherData = weatherService.getWeatherForEvent(event);
        return new ResponseEntity<>(weatherData, HttpStatus.OK);
    }

    // ------------------------------------------------------------------
    // FEATURE 3 — NEARBY PUBLIC EVENTS (Skiddle API)
    // ------------------------------------------------------------------

    // Finds public events happening near our student event's venue
    @GetMapping("/{id}/nearby-events")
    public ResponseEntity<?> getNearbyEvents(@PathVariable String id) {
        Optional<Event> optionalEvent = eventRepository.findById(id);
        if (optionalEvent.isEmpty()) {
            return new ResponseEntity<>("Event not found with ID: " + id, HttpStatus.NOT_FOUND);
        }

        Event event = optionalEvent.get();

        // Check if the event has venue coordinates. If it doesn't, we can't find nearby events.
        if (event.getLatitude() == null || event.getLongitude() == null) {
            throw new IllegalArgumentException("Venue coordinates missing. Cannot fetch nearby events.");
        }

        double lat = event.getLatitude();
        double lon = event.getLongitude();

        // Ask Skiddle for events near these coordinates
        Map<String, Object> skiddleResponse = externalApiService.getPublicEventsFromSkiddle(lat, lon);

        // Clean up the Skiddle data so our frontend only gets what it needs (title, date, price, venue)
        List<Map<String, String>> nearbyEvents = new ArrayList<>();
        if (skiddleResponse != null && skiddleResponse.containsKey("results")) {
            List<?> results = (List<?>) skiddleResponse.get("results");
            for (Object item : results) {
                if (item instanceof Map) {
                    Map<?, ?> rawEvent = (Map<?, ?>) item;
                    Map<String, String> cleanEvent = new HashMap<>();

                    cleanEvent.put("title", getString(rawEvent, "eventname"));
                    String eventLink = getString(rawEvent, "link");
                    if (eventLink.isEmpty()) eventLink = getString(rawEvent, "url");
                    if (eventLink.isEmpty()) eventLink = getString(rawEvent, "ticketUrl");
                    cleanEvent.put("link", eventLink);
                    cleanEvent.put("imageUrl", getString(rawEvent, "imageurl"));
                    cleanEvent.put("date", getString(rawEvent, "date"));
                    cleanEvent.put("entryPrice", getString(rawEvent, "entryprice"));

                    // Get the venue name, or use 'Venue TBC' if it's missing
                    Object venueObj = rawEvent.get("venue");
                    if (venueObj instanceof Map) {
                        Map<?, ?> venueMap = (Map<?, ?>) venueObj;
                        cleanEvent.put("venue", getString(venueMap, "name"));
                        cleanEvent.put("town", getString(venueMap, "town"));
                    } else {
                        cleanEvent.put("venue", "Venue TBC");
                        cleanEvent.put("town", "");
                    }

                    nearbyEvents.add(cleanEvent);
                }
            }
        }

        return new ResponseEntity<>(nearbyEvents, HttpStatus.OK);
    }

    // ------------------------------------------------------------------
    // GEOSPATIAL SEARCH ENDPOINT
    // ------------------------------------------------------------------

    // Finds events within a specific radius (in km) from a given latitude and longitude
    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyEventsGeo(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "10.0") double radiusKm) {
        
        List<Event> allEvents = eventRepository.findAll();
        List<Event> nearbyEvents = new ArrayList<>();

        for (Event event : allEvents) {
            if (event.getLatitude() != null && event.getLongitude() != null) {
                double distance = calculateHaversineDistance(lat, lon, event.getLatitude(), event.getLongitude());
                if (distance <= radiusKm) {
                    // Optional: You could attach the distance to the event or wrap it in a DTO,
                    // but returning the event directly is simpler for the frontend.
                    nearbyEvents.add(event);
                }
            }
        }
        return new ResponseEntity<>(nearbyEvents, HttpStatus.OK);
    }

    // Haversine formula to calculate distance between two lat/lon points in kilometers
    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // ------------------------------------------------------------------
    // LEGACY ENDPOINTS — kept for backward compatibility
    // ------------------------------------------------------------------

    // Get global public events from Skiddle (not event-specific)
    @GetMapping("/public")
    public ResponseEntity<?> getPublicEvents() {
        Object publicEvents = externalApiService.getPublicEventsFromSkiddle();
        if (publicEvents != null) {
            return new ResponseEntity<>(publicEvents, HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Failed to fetch public events from Skiddle", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get weather by raw coordinates (useful for quick manual testing)
    @GetMapping("/weather")
    public ResponseEntity<?> getWeatherByCoords(@RequestParam double lat, @RequestParam double lon) {
        Object weatherData = externalApiService.getWeatherForLocation(lat, lon);
        if (weatherData != null) {
            return new ResponseEntity<>(weatherData, HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Failed to fetch weather data", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Get Wikipedia info for a place name (GeoNames Wikipedia search)
    @GetMapping("/wikipedia")
    public ResponseEntity<?> getWikipediaInfo(@RequestParam String location) {
        Object wikiData = externalApiService.getWikipediaInfoForLocation(location);
        if (wikiData != null) {
            return new ResponseEntity<>(wikiData, HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Failed to fetch Wikipedia data", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ------------------------------------------------------------------
    // BOOKING ENDPOINTS
    // ------------------------------------------------------------------

    // This method lets a student book an event by checking if space is available
    @PutMapping("/book")
    public ResponseEntity<?> bookEvent(@RequestBody Map<String, String> payload) {
        String eventId = payload.get("eventId");
        String studentId = payload.get("studentId");

        if (eventId == null || studentId == null) {
            return new ResponseEntity<>("Missing eventId or studentId", HttpStatus.BAD_REQUEST);
        }

        // Validate student (Subscription Requirement)
        if (studentRepository.findByStudentId(studentId).isEmpty()) {
            return new ResponseEntity<>("Student not found. Please subscribe to the system first.", HttpStatus.FORBIDDEN);
        }

        Optional<Event> optionalEvent = eventRepository.findById(eventId);
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();

            if (event.getAttendees().contains(studentId)) {
                return new ResponseEntity<>("Student has already booked this event.", HttpStatus.BAD_REQUEST);
            }

            if (event.getCurrentAttendees() >= event.getMaxAttendees()) {
                return new ResponseEntity<>("Event is fully booked. Capacity reached.", HttpStatus.CONFLICT);
            }

            event.setCurrentAttendees(event.getCurrentAttendees() + 1);
            event.getAttendees().add(studentId);
            
            Event updatedEvent = eventRepository.save(event);
            return new ResponseEntity<>(updatedEvent, HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Event not found with ID: " + eventId, HttpStatus.NOT_FOUND);
        }
    }

    // This method allows students to register for an event by ID
    @PostMapping("/{id}/register")
    public ResponseEntity<?> registerForEvent(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String studentId = payload.get("studentId");
        if (studentId == null) {
            return new ResponseEntity<>("Missing studentId", HttpStatus.BAD_REQUEST);
        }

        // Validate student (Subscription Requirement)
        if (studentRepository.findByStudentId(studentId).isEmpty()) {
            return new ResponseEntity<>("Student not found. Please subscribe to the system first.", HttpStatus.FORBIDDEN);
        }

        Optional<Event> optionalEvent = eventRepository.findById(id);
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();

            if (event.getAttendees().contains(studentId)) {
                return new ResponseEntity<>("Student has already booked this event.", HttpStatus.BAD_REQUEST);
            }

            if (event.getCurrentAttendees() >= event.getMaxAttendees()) {
                return new ResponseEntity<>("Event is fully booked.", HttpStatus.CONFLICT);
            }

            event.setCurrentAttendees(event.getCurrentAttendees() + 1);
            event.getAttendees().add(studentId);
            Event updatedEvent = eventRepository.save(event);
            return new ResponseEntity<>(updatedEvent, HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Event not found", HttpStatus.NOT_FOUND);
        }
    }

    // This method returns all events that a specific student has booked
    @GetMapping("/booked")
    public List<Event> getBookedEvents(@RequestParam String studentId) {
        return eventRepository.findByAttendeesContaining(studentId);
    }

    // ------------------------------------------------------------------
    // RATING ENDPOINT
    // ------------------------------------------------------------------

    // Allows a student to rate an event between 1 and 5 stars.
    @PostMapping("/{id}/rate")
    public ResponseEntity<?> rateEvent(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        String studentId = (String) payload.get("studentId");
        Integer ratingValue = (Integer) payload.get("rating");

        if (studentId == null || ratingValue == null) {
            return new ResponseEntity<>("Missing studentId or rating", HttpStatus.BAD_REQUEST);
        }

        try {
            Event updatedEvent = eventService.rateEvent(id, studentId, ratingValue);
            return new ResponseEntity<>(updatedEvent, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            // Includes invalid rating range and event not found
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (IllegalStateException e) {
            // Student not registered
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (RuntimeException e) {
            // Student already rated (using RuntimeException for Conflict here as a simple mapping)
            if (e.getMessage().contains("already rated")) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
            }
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ------------------------------------------------------------------
    // UTILITY
    // ------------------------------------------------------------------

    // Helper — safely extract a String value from a raw Map
    private String getString(Map<?, ?> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : "";
    }

}
