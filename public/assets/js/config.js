// Configuración de Supabase
const SUPABASE_CONFIG = {
    url: 'https://inzqnrrgvnoipprpiyuj.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluenFucnJndm5vaXBwcnBpeXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODA3NTYsImV4cCI6MjA3MDQ1Njc1Nn0.blVu8cAgJ1_a-0it1zEOdaBw4rFCga__pHpS7Hnt_4s'
};

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Configuración de la aplicación
const APP_CONFIG = {
    currency: {
        sol: 'S/',
        usd: 'USD',
        exchangeRate: 3.76 // Tasa de cambio Sol a USD
    },
    pagination: {
        itemsPerPage: 12
    },
    upload: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    }
};

// Export para módulos
window.supabaseClient = supabase;
window.appConfig = APP_CONFIG;
