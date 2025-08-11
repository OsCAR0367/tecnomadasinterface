// Sistema de autenticación con Supabase
class AuthService {
    constructor() {
        this.currentUser = null;
        this.onAuthStateChanged = this.onAuthStateChanged.bind(this);
        this.initAuthListener();
    }

    // Inicializar listener de cambios de autenticación
    initAuthListener() {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            this.currentUser = session?.user || null;
            this.handleAuthStateChange(event, session);
        });
    }

    // Manejar cambios de estado de autenticación
    handleAuthStateChange(event, session) {
        console.log('Auth state changed:', event, session);
        
        // Actualizar UI según el estado
        this.updateAuthUI();
        
        // Redirigir si es necesario
        if (event === 'SIGNED_IN') {
            this.onSignIn(session.user);
        } else if (event === 'SIGNED_OUT') {
            this.onSignOut();
        }
    }

    // Login con email y password
    async signIn(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Error signing in:', error);
            return { success: false, error: error.message };
        }
    }

    // Registro de nuevo usuario
    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });

            if (error) throw error;
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Error signing up:', error);
            return { success: false, error: error.message };
        }
    }

    // Cerrar sesión
    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('Error signing out:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }

    // Verificar si está autenticado
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Verificar si es admin
    isAdmin() {
        return this.currentUser?.user_metadata?.role === 'admin' || 
               this.currentUser?.app_metadata?.role === 'admin';
    }

    // Obtener sesión actual
    async getCurrentSession() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            return session;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }

    // Recuperar contraseña
    async resetPassword(email) {
        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/admin/reset-password.html`
            });

            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('Error resetting password:', error);
            return { success: false, error: error.message };
        }
    }

    // Actualizar contraseña
    async updatePassword(newPassword) {
        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('Error updating password:', error);
            return { success: false, error: error.message };
        }
    }

    // Callbacks para eventos de autenticación
    onSignIn(user) {
        console.log('User signed in:', user);
        
        // Redirigir según el rol
        if (this.isAdmin()) {
            window.location.href = '/admin/dashboard.html';
        } else {
            window.location.href = '/index.html';
        }
    }

    onSignOut() {
        console.log('User signed out');
        
        // Limpiar datos locales
        localStorage.removeItem('user_preferences');
        
        // Redirigir a login si estamos en área admin
        if (window.location.pathname.includes('/admin/')) {
            window.location.href = '/admin/login.html';
        }
    }

    // Actualizar UI según estado de autenticación
    updateAuthUI() {
        const authButtons = document.querySelectorAll('[data-auth]');
        const adminElements = document.querySelectorAll('[data-admin]');
        
        authButtons.forEach(button => {
            const authType = button.dataset.auth;
            
            if (authType === 'signed-in') {
                button.style.display = this.isAuthenticated() ? 'block' : 'none';
            } else if (authType === 'signed-out') {
                button.style.display = this.isAuthenticated() ? 'none' : 'block';
            }
        });

        adminElements.forEach(element => {
            element.style.display = this.isAdmin() ? 'block' : 'none';
        });
    }

    // Proteger rutas admin
    requireAuth(redirectTo = '/admin/login.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    requireAdmin(redirectTo = '/admin/login.html') {
        if (!this.isAuthenticated() || !this.isAdmin()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }
}

// Crear instancia global del servicio de autenticación
const authService = new AuthService();

// Export para otros módulos
window.authService = authService;
