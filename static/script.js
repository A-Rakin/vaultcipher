// Initialize clipboard
const clipboard = new ClipboardJS('.btn-copy', {
    text: function(trigger) {
        return trigger.getAttribute('data-password');
    }
});

// Toast notification
function showToast(message, isSuccess = true) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('i');

    toastMessage.textContent = message;
    toastIcon.className = isSuccess ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    toastIcon.style.color = isSuccess ? 'var(--dark)' : '#ff4444';

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Copy to clipboard handler
clipboard.on('success', function(e) {
    showToast('Password copied to clipboard!');
    e.clearSelection();
});

clipboard.on('error', function(e) {
    showToast('Failed to copy password!', false);
});

// Load passwords on page load
document.addEventListener('DOMContentLoaded', function() {
    loadPasswords();
});

// Save password
document.getElementById('saveBtn').addEventListener('click', async function() {
    const website = document.getElementById('website').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!website || !username || !password) {
        showToast('Please fill all fields!', false);
        return;
    }

    const response = await fetch('/api/passwords', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ website, username, password })
    });

    if (response.ok) {
        showToast('Password encrypted and saved!');
        document.getElementById('website').value = '';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        loadPasswords();
    }
});

// Generate password
document.getElementById('generateBtn').addEventListener('click', async function() {
    const response = await fetch('/api/generate-password?length=16');
    const data = await response.json();
    document.getElementById('password').value = data.password;
    document.getElementById('password').type = 'text';

    // Show toast with generated password
    showToast('Strong password generated!');
});

// Search functionality
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', function(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        const query = e.target.value;
        if (query.length > 0) {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const passwords = await response.json();
            displayPasswords(passwords);
        } else {
            loadPasswords();
        }
    }, 300);
});

// Load all passwords
async function loadPasswords() {
    const passwordList = document.getElementById('passwordList');
    passwordList.innerHTML = '<div class="loading"><i class="fas fa-circle-notch"></i><p>Decrypting vault...</p></div>';

    const response = await fetch('/api/passwords');
    const passwords = await response.json();

    setTimeout(() => {
        displayPasswords(passwords);
    }, 800); // Dramatic delay for cyber effect
}

// Display passwords
function displayPasswords(passwords) {
    const passwordList = document.getElementById('passwordList');

    if (passwords.length === 0) {
        passwordList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-vault"></i>
                <h3>Vault is empty</h3>
                <p>Add your first password to secure it</p>
            </div>
        `;
        return;
    }

    passwordList.innerHTML = passwords.map(pwd => `
        <div class="password-item" data-id="${pwd.id}">
            <div class="website-info">
                <i class="fas fa-globe"></i>
                <h3>${escapeHtml(pwd.website)}</h3>
            </div>
            <div class="password-details">
                <div class="detail-item">
                    <i class="fas fa-user"></i>
                    <span>${escapeHtml(pwd.username)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-key"></i>
                    <span class="password-value">••••••••</span>
                </div>
            </div>
            <div class="password-actions">
                <button class="btn-copy" data-password="${escapeHtml(pwd.password)}">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <button class="btn-delete" onclick="deletePassword('${pwd.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');

    // Reinitialize clipboard for new buttons
    setTimeout(() => {
        new ClipboardJS('.btn-copy', {
            text: function(trigger) {
                return trigger.getAttribute('data-password');
            }
        });
    }, 100);
}

// Delete password
async function deletePassword(id) {
    if (confirm('Are you sure you want to delete this password?')) {
        const response = await fetch(`/api/passwords/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Password deleted!');
            loadPasswords();
        }
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add some cyberpunk effects
document.addEventListener('mousemove', function(e) {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    document.body.style.background = `
        radial-gradient(circle at ${x * 100}% ${y * 100}%, #1a1a1a, #000000)
    `;
});

// Matrix-like text effect on header
const glitchChars = '!<>-_\\/[]{}—=+*^?#________';
let glitchInterval;

document.querySelector('.glitch').addEventListener('mouseenter', function() {
    const originalText = '_';
    let iteration = 0;

    clearInterval(glitchInterval);
    glitchInterval = setInterval(() => {
        this.textContent = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        iteration += 1;

        if (iteration > 10) {
            this.textContent = originalText;
            clearInterval(glitchInterval);
        }
    }, 30);
});