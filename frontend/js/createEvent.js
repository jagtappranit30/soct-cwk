/**
 * createEvent.js
 * 
 * Handles event creation form with:
 *  - Location autocomplete (calls backend, falls back to direct GeoNames)
 *  - Leaflet map preview of selected location
 *  - Date validation (must be in the future)
 *  - Latitude/longitude storage with event submission
 */

// Uses API_BASE_URL from api.js


let debounceTimer = null;
let previewMap = null;

// Auto-populate publisherId from localStorage if logged in
document.addEventListener('DOMContentLoaded', () => {
    const publisherInput = document.getElementById('publisherId');
    const savedId = localStorage.getItem('studentId');
    if (publisherInput && savedId) {
        publisherInput.value = savedId;
    }
});
let previewMarker = null;

// GeoNames username for direct frontend calls (fallback)
const GEONAMES_USERNAME = 'jagtappranit30';

// -----------------------------------------------------------------
// LOCATION AUTOCOMPLETE
// Primary: GET /api/location/search?q=...
// Fallback: Direct GeoNames API call
// -----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const venueInput = document.getElementById('venue');
    const suggestionsBox = document.getElementById('venue-suggestions');
    const latField = document.getElementById('latitude');
    const lngField = document.getElementById('longitude');
    const venueStatus = document.getElementById('venue-status');

    if (!venueInput || !suggestionsBox) {
        console.error('Venue input or suggestions box not found in DOM');
        return;
    }

    console.log('Location autocomplete initialized');

    // Listen for keystrokes in the venue input
    venueInput.addEventListener('input', () => {
        const query = venueInput.value.trim();

        // Clear previous timer
        if (debounceTimer) clearTimeout(debounceTimer);

        // Need at least 3 characters to search
        if (query.length < 3) {
            suggestionsBox.classList.add('d-none');
            suggestionsBox.innerHTML = '';
            if (venueStatus) venueStatus.textContent = 'Type at least 3 characters to search for locations via GeoNames API.';
            return;
        }

        // Debounce: wait 300ms after user stops typing before calling API
        debounceTimer = setTimeout(() => {
            searchLocations(query, venueInput, suggestionsBox, latField, lngField, venueStatus);
        }, 300);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!venueInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.classList.add('d-none');
        }
    });

    // -----------------------------------------------------------------
    // FORM SUBMISSION — with validation and coordinate storage
    // -----------------------------------------------------------------
    const form = document.getElementById('create-event-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Bootstrap validation
            if (!form.checkValidity()) {
                e.stopPropagation();
                form.classList.add('was-validated');
                return;
            }

            // Date validation — must be today or in the future
            const dateValue = document.getElementById('date').value;
            const selectedDate = new Date(dateValue);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                alert('Please select a date that is today or in the future.');
                return;
            }

            // Collect data from form
            const eventData = {
                publisherId: document.getElementById('publisherId').value,
                title: document.getElementById('title').value,
                type: document.getElementById('type').value,
                date: dateValue,
                time: document.getElementById('time').value,
                venue: venueInput.value,
                cost: parseFloat(document.getElementById('cost').value),
                maxAttendees: parseInt(document.getElementById('maxParticipants').value),
                currentAttendees: 0,
                attendees: []
            };

            // Add coordinates if user selected from autocomplete
            if (latField && latField.value) eventData.latitude = parseFloat(latField.value);
            if (lngField && lngField.value) eventData.longitude = parseFloat(lngField.value);

            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Publishing...';

            try {
                const result = await createEvent(eventData);
                if (result) {
                    document.querySelector('.form-container').classList.add('d-none');
                    document.getElementById('status-message').classList.remove('d-none');
                    setTimeout(() => { window.location.href = 'index.html'; }, 2500);
                }
            } catch (error) {
                alert('Failed to create event: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.innerText = 'Publish Event Now';
            }
        });
    }
});

// -----------------------------------------------------------------
// SEARCH LOCATIONS — tries backend first, falls back to direct GeoNames
// -----------------------------------------------------------------
async function searchLocations(query, venueInput, suggestionsBox, latField, lngField, venueStatus) {
    if (venueStatus) venueStatus.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Searching locations...';

    let locations = [];

    // Try 1: Backend endpoint (proxied through Nginx)
    try {
        const response = await fetch(`${API_BASE_URL}/location/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
            locations = await response.json();
            console.log('Backend location search returned', locations.length, 'results');
        } else {
            throw new Error('Backend returned ' + response.status);
        }
    } catch (backendError) {
        console.warn('Backend search failed, trying GeoNames directly:', backendError.message);

        // Try 2: Direct GeoNames API call (no backend needed)
        try {
            const geoUrl = `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=5&country=GB&username=${GEONAMES_USERNAME}`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            if (geoData.geonames && geoData.geonames.length > 0) {
                locations = geoData.geonames.map(place => ({
                    name: place.name + ', ' + place.countryName,
                    lat: parseFloat(place.lat),
                    lng: parseFloat(place.lng),
                    country: place.countryName
                }));
                console.log('Direct GeoNames search returned', locations.length, 'results');
            }
        } catch (geoError) {
            console.error('Direct GeoNames search also failed:', geoError.message);
        }
    }

    // No results found
    if (locations.length === 0) {
        suggestionsBox.innerHTML = '<div class="autocomplete-item text-muted">No locations found</div>';
        suggestionsBox.classList.remove('d-none');
        if (venueStatus) venueStatus.textContent = 'No results found. Try a different search.';
        return;
    }

    // Render the dropdown suggestion list
    suggestionsBox.innerHTML = locations.map((loc, i) => `
        <div class="autocomplete-item" data-index="${i}" 
             data-name="${loc.name}" data-lat="${loc.lat}" data-lng="${loc.lng}">
            <div class="name">📍 ${loc.name}</div>
            <div class="coords">Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)}</div>
        </div>
    `).join('');

    suggestionsBox.classList.remove('d-none');
    if (venueStatus) venueStatus.textContent = `${locations.length} location(s) found via GeoNames API`;

    // Handle click on each suggestion
    suggestionsBox.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const name = item.dataset.name;
            const lat = parseFloat(item.dataset.lat);
            const lng = parseFloat(item.dataset.lng);

            // Populate form fields
            venueInput.value = name;
            if (latField) latField.value = lat;
            if (lngField) lngField.value = lng;

            // Hide the dropdown
            suggestionsBox.classList.add('d-none');

            // Update status with success indicator
            if (venueStatus) {
                venueStatus.innerHTML = `✅ Selected: <strong>${name}</strong> &nbsp; <span class="coord-badge">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</span>`;
            }

            // Show map preview
            showMapPreview(lat, lng, name);
        });
    });
}

// -----------------------------------------------------------------
// MAP PREVIEW — Shows selected location on a small Leaflet map
// -----------------------------------------------------------------
function showMapPreview(lat, lng, name) {
    const container = document.getElementById('map-preview-container');
    const mapDiv = document.getElementById('map-preview');

    if (!container || !mapDiv) return;

    // Check if Leaflet is available
    if (typeof L === 'undefined') {
        console.warn('Leaflet not loaded, skipping map preview');
        return;
    }

    container.style.display = 'block';

    if (!previewMap) {
        previewMap = L.map('map-preview').setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(previewMap);
        previewMarker = L.marker([lat, lng]).addTo(previewMap)
            .bindPopup(`<b>${name}</b>`).openPopup();
    } else {
        previewMap.setView([lat, lng], 14);
        previewMarker.setLatLng([lat, lng])
            .bindPopup(`<b>${name}</b>`).openPopup();
    }

    setTimeout(() => { previewMap.invalidateSize(); }, 100);
}
