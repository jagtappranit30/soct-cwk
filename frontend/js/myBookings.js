/**
 * myBookings.js
 * 
 * Fetches and displays events booked by the current student.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const studentId = localStorage.getItem('studentId');
    const studentName = localStorage.getItem('studentName');
    
    // Redirect if not logged in
    if (!studentId) {
        window.location.href = 'login.html';
        return;
    }

    // Update greeting
    if (studentName) {
        document.getElementById('user-greeting').innerText = `Welcome back, ${studentName}! Here are your booked events.`;
    }

    const bookingsList = document.getElementById('bookings-list');
    const bookingsTable = document.getElementById('bookings-table');
    const emptyState = document.getElementById('empty-state');

    try {
        const events = await getBookedEvents(studentId);

        if (!events || events.length === 0) {
            bookingsTable.parentElement.classList.add('d-none');
            emptyState.classList.remove('d-none');
            return;
        }

        bookingsList.innerHTML = events.map(event => `
            <tr>
                <td class="ps-4 fw-600">${event.title}</td>
                <td><span class="badge bg-light text-dark border">${event.type}</span></td>
                <td>${event.date}</td>
                <td>${event.venue}</td>
                <td><span class="fw-bold">${event.cost === 0 ? 'FREE' : '£' + event.cost}</span></td>
                <td class="text-center">
                    <a href="event-details.html?id=${event.id}" class="btn btn-outline-primary btn-sm rounded-pill px-3">View Details</a>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        bookingsList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5 text-danger">
                    Failed to load bookings. Please try again later.
                </td>
            </tr>
        `;
    }
});
