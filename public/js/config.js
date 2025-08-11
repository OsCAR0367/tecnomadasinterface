// Configuración de Supabase
const SUPABASE_CONFIG = {
    url: 'https://inzqnrrgvnoipprpiyuj.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluenFucnJndm5vaXBwcnBpeXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODA3NTYsImV4cCI6MjA3MDQ1Njc1Nn0.blVu8cAgJ1_a-0it1zEOdaBw4rFCga__pHpS7Hnt_4s'
};

// Cliente de Supabase simplificado
class SupabaseClient {
    constructor() {
        this.client = null;
        this.initialized = false;
        this.initPromise = null;
        this.init();
    }

    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this.createClient();
        return this.initPromise;
    }

    async createClient() {
        try {
            console.log('🔄 Inicializando cliente Supabase...');
            
            // Esperar a que el script de Supabase esté disponible
            let attempts = 0;
            while (!window.supabase && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!window.supabase) {
                throw new Error('Supabase no está disponible después de 5 segundos');
            }

            // Crear cliente
            this.client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            this.initialized = true;
            
            console.log('✅ Cliente Supabase inicializado correctamente');
            
            // Probar conexión
            await this.testConnection();
            
            return this.client;
        } catch (error) {
            console.error('❌ Error inicializando Supabase:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            console.log('🔗 Probando conexión...');
            const { data, error } = await this.client
                .from('properties')
                .select('count')
                .limit(1);
            
            if (error) {
                console.warn('⚠️ Warning en test:', error.message);
            } else {
                console.log('✅ Conexión exitosa');
            }
        } catch (error) {
            console.error('❌ Error en test:', error);
        }
    }

    getClient() {
        return this.client;
    }

    isReady() {
        return this.initialized && this.client;
    }

    async waitForReady() {
        if (this.isReady()) {
            return this.client;
        }
        
        await this.init();
        return this.client;
    }
}

// Crear instancia global después de que el DOM esté listo
let supabaseClient = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Supabase Client...');
    supabaseClient = new SupabaseClient();
    window.supabaseClient = supabaseClient;
});

// Función para obtener el cliente
window.getSupabaseClient = () => {
    return supabaseClient;
};

window.SUPABASE_CONFIG = SUPABASE_CONFIG;
