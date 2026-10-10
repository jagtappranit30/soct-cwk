document.addEventListener('DOMContentLoaded', async () => {
    const eventListContainer = document.getElementById('event-list');
    
    // Render events helper
    const renderEvents = (events) => {
        // Clear container (removes spinner)
        eventListContainer.innerHTML = '';
        
        if (events.length === 0) {
            eventListContainer.innerHTML = `
                <div class="empty-state col-12">
                    <div class="display-1 mb-4">📅</div>
                    <h3>No events found.</h3>
                    <p>Check back later or <a href="create-event.html" class="text-primary fw-bold">host your own event</a>.</p>
                </div>
            `;
            return;
        }
        
        // Display each event in a card
        events.forEach(event => {
            const cardCol = document.createElement('div');
            cardCol.className = 'col-md-6 col-lg-4';
            
            const availableSeats = event.maxAttendees - (event.currentAttendees || 0);
            const isFull = availableSeats <= 0;
            
            // Generate star rating HTML
            const avgRating = event.averageRating || 0;
            const fullStars = Math.floor(avgRating);
            const starsHtml = '⭐'.repeat(fullStars) + (avgRating > 0 ? ` <span class="small text-muted">(${avgRating.toFixed(1)})</span>` : ' <span class="small text-muted">no ratings</span>');

            const GENERIC_EVENT_IMG = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000&auto=format&fit=crop';

            cardCol.innerHTML = `
                <div class="card event-card">
                    <img src="${GENERIC_EVENT_IMG}" class="card-img-top" alt="${event.title}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge-type">${event.type}</span>
                            <span class="price-tag">${event.cost === 0 ? 'FREE' : '£' + event.cost}</span>
                        </div>
                        <h4 class="card-title mb-1">${event.title}</h4>
                        <div class="mb-3 small">${starsHtml}</div>
                        
                        <div class="event-meta">
                            <span>📍</span> ${event.venue}
                        </div>
                        <div class="event-meta">
                            <span>📅</span> ${event.date} ${event.time ? 'at ' + event.time : ''}
                        </div>
                        
                        <div class="mt-4 pt-3 border-top">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="small text-muted">
                                    ${isFull ? 
                                        '<span class="text-danger fw-bold">Fully Booked</span>' : 
                                        `<strong>${availableSeats}</strong> seats left`}
                                </span>
                                <span class="small text-muted">${event.currentAttendees || 0} / ${event.maxAttendees}</span>
                            </div>
                            <a href="event-details.html?id=${event.id}" class="btn btn-primary w-100">View Details</a>
                        </div>
                    </div>
                </div>
            `;
            
            eventListContainer.appendChild(cardCol);
        });
    };

    // Initial load
    const initialEvents = await getEvents();
    renderEvents(initialEvents);

});
