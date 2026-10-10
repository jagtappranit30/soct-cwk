/**
 * register.js
 * 
 * Handles the student registration form using the registerStudent API.
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const statusMsg = document.getElementById('status-message');
    const submitBtn = document.getElementById('submit-btn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Bootstrap validation
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        // Collect data
        const studentData = {
            studentId: document.getElementById('studentId').value.trim(),
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };

        // UI Feedback
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating Account...';
        statusMsg.classList.add('d-none');

        try {
            const result = await registerStudent(studentData);
            
            // Show success
            statusMsg.innerText = 'Registration successful! Redirecting to login...';
            statusMsg.className = 'alert alert-success mt-4 text-center rounded-4 shadow-sm border-0';
            statusMsg.classList.remove('d-none');
            form.classList.add('d-none');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            // Show error
            statusMsg.innerText = 'Error: ' + error.message;
            statusMsg.className = 'alert alert-danger mt-4 text-center rounded-4 shadow-sm border-0';
            statusMsg.classList.remove('d-none');
            submitBtn.disabled = false;
            submitBtn.innerText = 'Register Now';
        }
    });
});
