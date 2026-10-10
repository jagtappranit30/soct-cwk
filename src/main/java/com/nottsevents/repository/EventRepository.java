package com.nottsevents.repository;

import com.nottsevents.model.Event;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends MongoRepository<Event, String> {

    // Custom query to support searching by optional fields (type, venue, date)
    // using regex for partial matches
    @Query("{ 'type': { $regex: ?0, $options: 'i' }, 'venue': { $regex: ?1, $options: 'i' }, 'date': { $regex: ?2, $options: 'i' } }")
    List<Event> searchEvents(String type, String venue, String date);

    // Find all events where the attendees array contains the given studentId
    List<Event> findByAttendeesContaining(String studentId);
}
