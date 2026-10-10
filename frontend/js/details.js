const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!eventId) {
        window.location.href = 'index.html';
        return;
    }
    
    const content = document.getElementById('event-details-content');
    
    // Fetch event details from the API
    const event = await getEventById(eventId);
    
    if (!event) {
        content.innerHTML = `
            <div class="alert alert-danger shadow border-0 p-5 rounded-4 text-center">
                <h3 class="fw-bold">Event Not Found</h3>
                <p class="text-muted">The event details could not be retrieved.</p>
                <div class="mt-4">
                    <a href="index.html" class="btn btn-primary px-4 py-2">Return to Events</a>
                </div>
            </div>
        `;
        return;
    }
    
    const availableSeats = event.maxAttendees - (event.currentAttendees || 0);
    const isFull = availableSeats <= 0;

    // Build Google Maps link if coordinates exist
    const mapsLink = (event.latitude && event.longitude)
        ? `<a href="https://maps.google.com/?q=${event.latitude},${event.longitude}"
              target="_blank" rel="noopener noreferrer"
              class="btn btn-outline-secondary btn-sm mt-2">
              🗺️ Open in Google Maps
           </a>`
        : '';
    
    // Render event details card
    content.innerHTML = `
        <div class="card shadow-lg border-0 overflow-hidden rounded-4">
            <div class="card-header bg-white py-4 px-5 border-bottom">
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item"><a href="index.html" class="text-decoration-none">Home</a></li>
                        <li class="breadcrumb-item active" aria-current="page">${event.title}</li>
                    </ol>
                </nav>
            </div>
            <div class="card-body p-lg-5">
                <div class="row g-5">
                    <div class="col-md-7">
                        <span class="badge-type mb-3 d-inline-block">${event.type}</span>
                        <h1 class="display-4 fw-800 mb-4">${event.title}</h1>
                        <p class="text-muted mb-5">
                            Hosted by: <span class="fw-600 text-dark">${event.publisherId}</span>
                        </p>
                        
                        <div class="mb-5">
                            <h4 class="fw-bold mb-3 border-start border-4 border-primary ps-3">Event Description</h4>
                            <p class="text-secondary fs-5">
                                Join us for this exciting <strong>${event.type}</strong> held at the <strong>${event.venue}</strong>. 
                                This event brings together students for networking, learning, and collaboration. 
                                Secure your spot early as capacity is limited!
                            </p>
                        </div>

                        <div class="row g-4 mt-2">
                            <div class="col-sm-6">
                                <div class="p-3 bg-light rounded-3 d-flex align-items-center">
                                    <div class="fs-2 me-3">📍</div>
                                    <div>
                                        <div class="small text-muted">Location</div>
                                        <div class="fw-bold">${event.venue}</div>
                                        ${mapsLink}
                                    </div>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="p-3 bg-light rounded-3 d-flex align-items-center">
                                    <div class="fs-2 me-3">📅</div>
                                    <div>
                                        <div class="small text-muted">Date & Time</div>
                                        <div class="fw-bold">${event.date} ${event.time ? '@ ' + event.time : ''}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-5">
                        <div class="bg-white p-4 p-lg-5 rounded-4 shadow-sm border border-light">
                            <h4 class="fw-bold mb-4">Registration Details</h4>
                            
                            <div class="mb-4">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-secondary">Admission Cost</span>
                                    <span class="fw-bold fs-4 ${event.cost === 0 ? 'text-success' : ''}">${event.cost === 0 ? 'FREE' : '£' + event.cost}</span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span class="text-secondary">Available Capacity</span>
                                    <span class="fw-bold">${event.currentAttendees || 0} / ${event.maxAttendees}</span>
                                </div>
                            </div>

                            <!-- RATING DISPLAY -->
                            <div class="mb-4 pt-3 border-top">
                                <h6 class="text-muted fw-bold small text-uppercase mb-2">Student Feedback</h6>
                                <div class="d-flex align-items-center">
                                    <div class="fs-4 text-warning me-2">
                                        ${'⭐'.repeat(Math.round(event.averageRating || 0)) || 'No ratings yet'}
                                    </div>
                                    <div class="fw-bold fs-5">${event.averageRating ? event.averageRating.toFixed(1) : ''}</div>
                                    <div class="ms-2 text-muted small">(${event.ratingCount || 0} reviews)</div>
                                </div>
                            </div>

                            <div class="mb-4">
                                <div class="progress" style="height: 10px;">
                                    <div class="progress-bar ${isFull ? 'bg-danger' : 'bg-primary'}" role="progressbar" 
                                         style="width: ${(event.currentAttendees / event.maxAttendees) * 100}%"></div>
                                </div>
                                <div class="mt-2 text-center small text-muted">
                                    ${isFull ? 'Waitlist only - reach out to organizer' : `${availableSeats} spots remaining`}
                                </div>
                            </div>
                            
                            <div class="d-grid gap-3">
                                ${isFull ? 
                                    '<button class="btn btn-secondary btn-lg py-3" disabled>Fully Booked</button>' : 
                                    '<button class="btn btn-primary btn-lg py-3" data-bs-toggle="modal" data-bs-target="#registerModal">Register for Event</button>'}
                                
                                <!-- RATE BUTTON (hidden if not registered or already rated) -->
                                <div id="rating-section" class="mt-4 p-3 bg-light rounded-3 text-center d-none">
                                    <p class="small fw-bold text-muted mb-2">HOW WAS THE EVENT?</p>
                                    <div class="star-rating fs-3">
                                        <span class="star" data-value="1" style="cursor: pointer;">☆</span>
                                        <span class="star" data-value="2" style="cursor: pointer;">☆</span>
                                        <span class="star" data-value="3" style="cursor: pointer;">☆</span>
                                        <span class="star" data-value="4" style="cursor: pointer;">☆</span>
                                        <span class="star" data-value="5" style="cursor: pointer;">☆</span>
                                    </div>
                                    <div id="rating-message" class="text-muted small mt-1">Click a star to rate</div>
                                </div>

                                <a href="index.html" class="btn btn-outline-secondary py-2 mt-2">← Back to List</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Handle registration form
    const studentIdInput = document.getElementById('studentId');
    const savedStudentId = localStorage.getItem('studentId');
    if (studentIdInput && savedStudentId) {
        studentIdInput.value = savedStudentId;
    }

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('studentId').value;
        const confirmBtn = document.getElementById('confirm-register-btn');
        
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
        
        try {
            const result = await registerForEvent(eventId, studentId);
            if (result) {
                const modalElement = document.getElementById('registerModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                modal.hide();
                alert('Success! You have been registered for ' + event.title);
                window.location.reload();
            }
        } catch (error) {
            alert('Registration failed: ' + error.message);
            confirmBtn.disabled = false;
            confirmBtn.innerText = 'Register Now';
        }
    });

    // -----------------------------------------------------------------
    // LEAFLET MAP — Interactive map with marker and popup
    // -----------------------------------------------------------------
    const mapDiv = document.getElementById('map');
    const mapError = document.getElementById('map-error');

    if (mapDiv) {
        const lat = event.latitude || 52.9548;
        const lon = event.longitude || -1.1581;

        try {
            const map = L.map('map').setView([lat, lon], 14);

            // OpenStreetMap tiles — free, no API key needed
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            // Add a marker with popup showing event name + venue
            L.marker([lat, lon]).addTo(map)
                .bindPopup(`<b>${event.title}</b><br>${event.venue}`)
                .openPopup();

            // Fix for map tiles not loading in dynamically rendered containers
            setTimeout(() => { map.invalidateSize(); }, 200);
        } catch (err) {
            console.error('Leaflet map error:', err);
            mapDiv.classList.add('d-none');
            if (mapError) mapError.classList.remove('d-none');
        }
    }

    // -----------------------------------------------------------------
    // WEATHER + NEARBY EVENTS — fetched from backend
    // -----------------------------------------------------------------
    getWeather(eventId);
    getNearbyEvents(eventId);

    // -----------------------------------------------------------------
    // RATING LOGIC
    // -----------------------------------------------------------------
    const ratingSection = document.getElementById('rating-section');
    const studentId = localStorage.getItem('studentId');

    // Only show rating if student is registered and hasn't rated yet
    if (studentId && event.attendees.includes(studentId)) {
        if (!event.ratedStudents || !event.ratedStudents.includes(studentId)) {
            ratingSection.classList.remove('d-none');
        } else {
            ratingSection.classList.remove('d-none');
            ratingSection.innerHTML = `
                <div class="text-success small fw-bold">
                    ✅ You have rated this event: ${'★'.repeat(Math.round(event.averageRating || 0))}
                </div>
            `;
        }
    }

    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const val = parseInt(this.getAttribute('data-value'));
            stars.forEach((s, idx) => {
                s.innerText = idx < val ? '★' : '☆';
                s.style.color = idx < val ? '#ffc107' : '#6c757d';
            });
        });

        star.addEventListener('mouseout', function() {
            stars.forEach(s => {
                s.innerText = '☆';
                s.style.color = '#6c757d';
            });
        });

        star.addEventListener('click', async function() {
            const rating = parseInt(this.getAttribute('data-value'));
            const message = document.getElementById('rating-message');
            
            message.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Submitting...';
            
            try {
                const response = await fetch(`/api/events/${eventId}/rate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId, rating })
                });

                if (response.ok) {
                    message.innerHTML = '✅ Thank you for your feedback!';
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    const errorText = await response.text();
                    message.innerHTML = `<span class="text-danger">Failed: ${errorText}</span>`;
                }
            } catch (err) {
                console.error('Rating error:', err);
                message.innerHTML = '<span class="text-danger">Service unavailable</span>';
            }
        });
    });
});
