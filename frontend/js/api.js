// When served via Nginx (Docker), use relative /api path — Nginx proxies to backend.
// When opened directly as a local file (development), fall back to localhost:8080.
const API_BASE_URL = window.location.protocol === 'file:'
    ? 'http://localhost:8080/api'
    : '/api';

/**
 * Fetches all events from the backend.
 * @returns {Promise<Array>} List of event objects.
 */
async function getEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        if (!response.ok) throw new Error('Failed to fetch events');
        return await response.json();
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}


/**
 * Fetches a single event by its ID.
 * @param {string} id - The event ID.
 * @returns {Promise<Object|null>} The event object or null if not found.
 */
async function getEventById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${id}`);
        if (!response.ok) throw new Error('Event not found');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching event ${id}:`, error);
        return null;
    }
}

/**
 * Creates a new event on the backend.
 * @param {Object} eventData - The event data to send.
 * @returns {Promise<Object|null>} The created event or null on failure.
 */
async function createEvent(eventData) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to create event');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
}

/**
 * Registers a new student.
 * @param {Object} studentData - { studentId, name, email, password }
 * @returns {Promise<Object>} The saved student object.
 */
async function registerStudent(studentData) {
    try {
        const response = await fetch(`${API_BASE_URL}/students/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Registration failed';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error) {
        console.error('Error registering student:', error);
        throw error;
    }
}

/**
 * Logs in a student using Student ID and Password.
 * @param {Object} credentials - { studentId, password }
 * @returns {Promise<Object>} The student object.
 */
async function loginStudent(credentials) {
    try {
        const response = await fetch(`${API_BASE_URL}/students/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Login failed';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}

/**
 * Registers a student for an event.
 * @param {string} id - The event ID.
 * @param {string} studentId - The student ID.
 * @returns {Promise<Object|null>} The updated event or null on failure.
 */
async function registerForEvent(id, studentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${id}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ studentId })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to register');
        }
        return await response.json();
    } catch (error) {
        console.error(`Error registering for event ${id}:`, error);
        throw error;
    }
}

/**
 * Searches for events based on filters.
 * @param {Object} filters - Search filters (type, venue, date).
 * @returns {Promise<Array>} List of filtered event objects.
 */
async function searchEvents(filters) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_BASE_URL}/events?${queryParams}`);
        if (!response.ok) throw new Error('Search failed');
        return await response.json();
    } catch (error) {
        console.error('Error searching events:', error);
        return [];
    }
}

/**
 * Fetches all events booked by a specific student.
 * @param {string} studentId - The student's ID.
 * @returns {Promise<Array>} List of booked event objects.
 */
async function getBookedEvents(studentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/booked?studentId=${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch booked events');
        return await response.json();
    } catch (error) {
        console.error('Error fetching booked events:', error);
        return [];
    }
}

/**
 * Updates the global navigation bar based on authentication state.
 */
function updateNavbar() {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;
    
    const studentId = localStorage.getItem('studentId');
    const studentName = localStorage.getItem('studentName');
    const path = window.location.pathname;
    
    let html = `
        <li class="nav-item"><a class="nav-link ${path.endsWith('index.html') || path.endsWith('/') ? 'active' : ''}" href="index.html">Home</a></li>
        <li class="nav-item"><a class="nav-link ${path.endsWith('search.html') ? 'active' : ''}" href="search.html">Search</a></li>
        <li class="nav-item"><a class="nav-link ${path.endsWith('create-event.html') ? 'active' : ''}" href="create-event.html">Create Event</a></li>
    `;
    
    if (studentId) {
        html += `
            <li class="nav-item"><a class="nav-link ${path.endsWith('my-bookings.html') ? 'active' : ''}" href="my-bookings.html">My Bookings</a></li>
            <li class="nav-item">
                <a class="nav-link fw-bold text-warning" href="#" id="logout-link">Logout (${studentName || studentId})</a>
            </li>
        `;
    } else {
        html += `
            <li class="nav-item"><a class="nav-link ${path.endsWith('register.html') ? 'active' : ''}" href="register.html">Register</a></li>
            <li class="nav-item"><a class="nav-link ${path.endsWith('login.html') ? 'active' : ''}" href="login.html">Login</a></li>
        `;
    }
    
    navLinks.innerHTML = html;
    
    const logoutBtn = document.getElementById('logout-link');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('studentId');
            localStorage.removeItem('studentName');
            window.location.href = 'index.html';
        });
    }
}

// Auto-run on all pages that include api.js
document.addEventListener('DOMContentLoaded', updateNavbar);

