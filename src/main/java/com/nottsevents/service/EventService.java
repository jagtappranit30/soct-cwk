package com.nottsevents.service;

import com.nottsevents.model.Event;
import com.nottsevents.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class EventService {

    private final EventRepository eventRepository;

    @Autowired
    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    /**
     * Rates an event and updates the average rating.
     * 
     * @param eventId   The ID of the event to rate.
     * @param studentId The ID of the student rating the event.
     * @param rating    The rating value (1-5).
     * @return The updated Event object.
     * @throws IllegalArgumentException if rating is invalid, student not registered, or already rated.
     */
    public Event rateEvent(String eventId, String studentId, int rating) {
        // 1. Fetch event
        Optional<Event> optionalEvent = eventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            throw new IllegalArgumentException("Event not found with ID: " + eventId);
        }
        Event event = optionalEvent.get();

        // 2. Validate rating range (1-5)
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }

        // 3. Validate student is registered for the event
        if (!event.getAttendees().contains(studentId)) {
            // Note: Controller will catch this and return 403 based on the message or specific exception
            throw new IllegalStateException("Student is not registered for this event.");
        }

        // 4. Check if student has already rated
        if (event.getRatedStudents().contains(studentId)) {
            throw new RuntimeException("Student has already rated this event.");
        }

        // 5. Add rating and update averages
        event.getRatings().add(rating);
        event.getRatedStudents().add(studentId);
        
        int count = event.getRatings().size();
        double sum = 0;
        for (int r : event.getRatings()) {
            sum += r;
        }
        
        event.setRatingCount(count);
        event.setAverageRating(sum / count);

        // 6. Save updated event
        return eventRepository.save(event);
    }
}
