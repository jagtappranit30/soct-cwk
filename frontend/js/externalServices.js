/**
 * externalServices.js
 *
 * Fetches weather and nearby events from the backend external API endpoints.
 * Called from details.js after the main event details have been rendered.
 */

const API_BASE = window.location.protocol === 'file:'
    ? 'http://localhost:8080/api'
    : '/api';

// ------------------------------------------------------------------
// FEATURE 2 — WEATHER FORECAST (with humidity + wind speed)
// ------------------------------------------------------------------
async function getWeather(eventId) {
    const section = document.getElementById('weather-section');
    if (!section) return;

    try {
        const response = await fetch(`${API_BASE}/events/${eventId}/weather`);
        const data = await response.json();

        // If the backend returned an error message
        if (data.error) {
            section.innerHTML = `
                <div class="text-center text-muted py-2">
                    🌍 ${data.error}
                </div>`;
            return;
        }

        section.innerHTML = `
            <div class="d-flex align-items-center mb-3">
                <div class="fs-1 me-3">${data.icon || '🌤️'}</div>
                <div>
                    <h5 class="fw-bold mb-0">${data.condition || 'N/A'}</h5>
                    <small class="text-muted">At ${data.location} · ${data.date}</small>
                </div>
            </div>
            <div class="row g-2 text-center">
                <div class="col-3">
                    <div class="bg-light rounded-3 p-2">
                        <div class="fs-4 fw-800 text-primary">${data.temperature || '—'}</div>
                        <small class="text-muted" style="font-size: 0.7rem;">Temp</small>
                    </div>
                </div>
                <div class="col-3">
                    <div class="bg-light rounded-3 p-2">
                        <div class="fs-4 fw-bold text-info">${data.humidity || 0}%</div>
                        <small class="text-muted" style="font-size: 0.7rem;">Humidity</small>
                    </div>
                </div>
                <div class="col-3">
                    <div class="bg-light rounded-3 p-2">
                        <div class="fs-4 fw-bold text-success">${data.windSpeed || 0}</div>
                        <small class="text-muted" style="font-size: 0.7rem;">Wind m/s</small>
                    </div>
                </div>
                <div class="col-3">
                    <div class="bg-light rounded-3 p-2">
                        <div class="fs-4">${data.icon || '🌤️'}</div>
                        <small class="text-muted" style="font-size: 0.7rem;">Sky</small>
                    </div>
                </div>
            </div>
            <div class="mt-3 text-center">
                <small class="text-muted">Powered by <strong>OpenWeatherMap API</strong></small>
            </div>
        `;
    } catch (error) {
        section.innerHTML = `
            <div class="text-center text-muted py-2">
                🌍 Weather information is currently unavailable.
            </div>`;
        console.warn('Weather fetch failed:', error.message);
    }
}

// ------------------------------------------------------------------
// FEATURE 3 — NEARBY PUBLIC EVENTS
// ------------------------------------------------------------------
async function getNearbyEvents(eventId) {
    const section = document.getElementById('nearby-events-section');
    if (!section) return;

    try {
        const response = await fetch(`${API_BASE}/events/${eventId}/nearby-events`);
        const events = await response.json();

        if (!events || events.length === 0) {
            section.innerHTML = `
                <div class="text-center text-muted py-2">
                    No nearby public events found in this area at this time.
                </div>`;
            return;
        }

        // Format a date string nicely
        const formatDate = (dateStr) => {
            if (!dateStr || dateStr === 'N/A') return 'Date TBC';
            try {
                return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            } catch { return dateStr; }
        };

        const rows = events.map(ev => `
            <div class="d-flex align-items-start py-3 border-bottom">
                <div class="me-3">
                    ${ev.imageUrl && ev.imageUrl.startsWith('http') 
                        ? `<img src="${ev.imageUrl}" alt="Event" class="rounded-3 shadow-sm" style="width: 50px; height: 50px; object-fit: cover; border: 1px solid #eee;">` 
                        : '<div class="fs-3">🎉</div>'}
                </div>
                <div class="flex-grow-1">
                    <div class="fw-bold">${ev.title || 'Event'}</div>
                    <div class="small text-muted">📍 ${ev.venue}${ev.town ? ', ' + ev.town : ''}</div>
                    <div class="small text-muted">📅 ${formatDate(ev.date)}</div>
                </div>
                <a href="${ev.link && ev.link.startsWith('http') ? ev.link : '#'}" target="_blank" class="badge rounded-pill ${ev.entryPrice === '0' || ev.entryPrice === 'Free' ? 'bg-success' : 'bg-light text-dark border'} align-self-center ms-2 text-decoration-none">
                    ${ev.entryPrice === '0' ? 'Free' : (ev.entryPrice || 'Check site')}
                </a>
            </div>`).join('');

        section.innerHTML = `
            <div>${rows}</div>
            <div class="mt-3 text-center">
                <small class="text-muted">Powered by <strong>Skiddle API</strong></small>
            </div>
        `;
    } catch (error) {
        section.innerHTML = `
            <div class="text-center text-muted py-2">
                🎟️ Nearby events information is currently unavailable.
            </div>`;
        console.warn('Nearby events fetch failed:', error.message);
    }
}
