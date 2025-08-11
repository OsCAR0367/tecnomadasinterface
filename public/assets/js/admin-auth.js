// Admin Authentication System
class AdminAuth {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check if user is already logged in
        await this.checkAuth();
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            
            if (error) {
                console.error('Error checking auth:', error);
                return false;
            }

            if (user) {
                this.currentUser = user;
                // If we're on login page and user is authenticated, redirect to dashboard
                if (window.location.pathname.includes('login.html')) {
                    window.location.href = './dashboard.html';
                    return true;
                }
            } else {
                // If we're not on login page and user is not authenticated, redirect to login
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = './login.html';
                    return false;
                }
            }

            return !!user;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', this.handleLogout.bind(this));
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!email || !password) {
            this.showError('Por favor, completa todos los campos');
            return;
        }

        this.setLoading(true);

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            if (data.user) {
                this.currentUser = data.user;
                
                // Store remember preference
                if (rememberMe) {
                    localStorage.setItem('adminRememberMe', 'true');
                } else {
                    localStorage.removeItem('adminRememberMe');
                }

                console.log('Login successful:', data.user.email);
                
                // Redirect to dashboard
                window.location.href = './dashboard.html';
            }
        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Error de autenticación';
            
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Email o contraseña incorrectos';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Email no confirmado';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Demasiados intentos. Intenta más tarde';
            }
            
            this.showError(errorMessage);
        } finally {
            this.setLoading(false);
        }
    }

    async handleLogout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) {
                throw error;
            }

            this.currentUser = null;
            localStorage.removeItem('adminRememberMe');
            
            // Redirect to login
            window.location.href = './login.html';
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Error al cerrar sesión');
        }
    }

    setLoading(loading) {
        const submitButton = document.querySelector('.login-button');
        const buttonText = document.querySelector('.button-text');
        const loadingSpinner = document.querySelector('.loading-spinner');
        const formInputs = document.querySelectorAll('input');

        if (submitButton) {
            submitButton.disabled = loading;
        }

        if (buttonText && loadingSpinner) {
            if (loading) {
                buttonText.style.display = 'none';
                loadingSpinner.style.display = 'inline';
            } else {
                buttonText.style.display = 'inline';
                loadingSpinner.style.display = 'none';
            }
        }

        formInputs.forEach(input => {
            input.disabled = loading;
        });
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.querySelector('.error-text');
        
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideError();
            }, 5000);
        }
    }

    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // Utility function to check if user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.email === 'admin@example.com';
    }

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }
}

// Utility functions for password toggle
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.querySelector('.eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
    }
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Initialize auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminAuth = new AdminAuth();
});

// Export for use in other modules
window.AdminAuth = AdminAuth;
