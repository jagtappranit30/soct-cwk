package com.nottsevents.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "events")
public class Event {

    @Id
    private String id;
    private String publisherId;
    private String title;
    private String type;
    private String date; // E.g. "2026-03-25"
    private String time; // E.g. "19:00"
    private String venue;
    private double cost;
    private int maxAttendees;
    private int currentAttendees;
    private List<String> attendees;
    
    // Rating fields
    private List<Integer> ratings = new ArrayList<>();
    private double averageRating = 0.0;
    private int ratingCount = 0;
    private List<String> ratedStudents = new ArrayList<>();

    // Geolocation fields — populated by GeoLocationService on event creation
    private Double latitude;
    private Double longitude;
    public Event() {
        this.currentAttendees = 0;
        this.attendees = new ArrayList<>();
        this.ratings = new ArrayList<>();
        this.ratedStudents = new ArrayList<>();
    }

    public Event(String publisherId, String title, String type, String date, String time, String venue, double cost,
            int maxAttendees) {
        this.publisherId = publisherId;
        this.title = title;
        this.type = type;
        this.date = date;
        this.time = time;
        this.venue = venue;
        this.cost = cost;
        this.maxAttendees = maxAttendees;
        this.currentAttendees = 0;
        this.attendees = new ArrayList<>();
        this.ratings = new ArrayList<>();
        this.ratedStudents = new ArrayList<>();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPublisherId() {
        return publisherId;
    }

    public void setPublisherId(String publisherId) {
        this.publisherId = publisherId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }
    
    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public double getCost() {
        return cost;
    }

    public void setCost(double cost) {
        this.cost = cost;
    }

    public int getMaxAttendees() {
        return maxAttendees;
    }

    public void setMaxAttendees(int maxAttendees) {
        this.maxAttendees = maxAttendees;
    }

    public int getCurrentAttendees() {
        return currentAttendees;
    }

    public void setCurrentAttendees(int currentAttendees) {
        this.currentAttendees = currentAttendees;
    }

    public List<String> getAttendees() {
        return attendees;
    }

    public void setAttendees(List<String> attendees) {
        this.attendees = attendees;
    }

    // Latitude getter and setter — used for Weather and Nearby Events lookups
    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    // Longitude getter and setter — used for Weather and Nearby Events lookups
    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    // Rating Getters and Setters
    public List<Integer> getRatings() {
        return ratings;
    }

    public void setRatings(List<Integer> ratings) {
        this.ratings = ratings;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public int getRatingCount() {
        return ratingCount;
    }

    public void setRatingCount(int ratingCount) {
        this.ratingCount = ratingCount;
    }

    public List<String> getRatedStudents() {
        return ratedStudents;
    }

    public void setRatedStudents(List<String> ratedStudents) {
        this.ratedStudents = ratedStudents;
    }



}

