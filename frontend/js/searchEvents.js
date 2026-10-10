document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await performSearch();
});

document.getElementById('reset-btn').addEventListener('click', () => {
    // Let the reset happen, then search
    setTimeout(performSearch, 50);
});

async function performSearch() {
    const filters = {};
    const type = document.getElementById('search-type').value;
    const venue = document.getElementById('search-venue').value;
    const date = document.getElementById('search-date').value;
    
    if (type) filters.type = type;
    if (venue) filters.venue = venue;
    if (date) filters.date = date;
    
    const resultsContainer = document.getElementById('results-container');
    const resultsCount = document.getElementById('results-count');
    
    // Show spinner
    resultsContainer.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted">Filtering events...</p>
        </div>
    `;
    
    try {
        const results = await searchEvents(filters);
        
        resultsContainer.innerHTML = '';
        resultsCount.innerText = `${results.length} ${results.length === 1 ? 'event' : 'events'} found`;
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="fs-1 mb-3">🔎</div>
                    <h4 class="text-muted fw-bold">No events match your criteria</h4>
                    <p class="text-secondary">Try adjusting your filters or search terms.</p>
                </div>
            `;
            return;
        }
        
        results.forEach(event => {
            const cardCol = document.createElement('div');
            cardCol.className = 'col-md-6';
            
            const availableSeats = event.maxAttendees - (event.currentAttendees || 0);
            const isFull = availableSeats <= 0;
            
            cardCol.innerHTML = `
                <div class="card event-card shadow-sm border-0 h-100">
                    <div class="card-header-img"></div>
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="badge-type">${event.type}</span>
                            <span class="price-tag small">${event.cost === 0 ? 'FREE' : '£' + event.cost}</span>
                        </div>
                        <h5 class="card-title h6 fw-bold mb-3">${event.title}</h5>
                        <div class="event-meta small mb-2">
                            <span>📍</span> ${event.venue}
                        </div>
                        <div class="event-meta small mb-3">
                            <span>📅</span> ${event.date}
                        </div>
                        <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                            <span class="small ${isFull ? 'text-danger fw-bold' : 'text-muted'}">
                                ${isFull ? 'Sold Out' : availableSeats + ' seats left'}
                            </span>
                            <a href="event-details.html?id=${event.id}" class="btn btn-primary btn-sm px-3">Details</a>
                        </div>
                    </div>
                </div>
            `;
            resultsContainer.appendChild(cardCol);
        });
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="alert alert-warning border-0 shadow-sm p-4 rounded-4 text-center">
                <p class="mb-0">Unable to perform search. Please check your connection.</p>
            </div>
        `;
    }
}

// Perform initial search on load
document.addEventListener('DOMContentLoaded', performSearch);
