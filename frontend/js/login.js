/**
 * login.js
 * 
 * Handles the student login form, stores studentId in localStorage,
 * and redirects to the home page on success.
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const statusMsg = document.getElementById('status-message');
    const loginBtn = document.getElementById('login-btn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const studentId = document.getElementById('studentId').value.trim();
        const password = document.getElementById('password').value;

        // UI Feedback
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
        statusMsg.classList.add('d-none');

        try {
            const result = await loginStudent({ studentId, password });
            
            // Success! Store studentId in localStorage
            localStorage.setItem('studentId', result.studentId);
            localStorage.setItem('studentName', result.name);

            // Show success
            statusMsg.innerText = 'Login successful! Welcome back, ' + result.name;
            statusMsg.className = 'alert alert-success mt-4 text-center rounded-4 shadow-sm border-0';
            statusMsg.classList.remove('d-none');
            form.classList.add('d-none');

            // Redirect to home after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            // Show error
            statusMsg.innerText = 'Login Failed: ' + error.message;
            statusMsg.className = 'alert alert-danger mt-4 text-center rounded-4 shadow-sm border-0';
            statusMsg.classList.remove('d-none');
            loginBtn.disabled = false;
            loginBtn.innerText = 'Login Now';
        }
    });
});
