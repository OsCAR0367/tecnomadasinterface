// Servicio para manejar operaciones de base de datos
class DatabaseService {
    constructor() {
        this.supabase = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized && this.supabase) {
            return this.supabase;
        }
        
        try {
            console.log('🔄 Inicializando Database Service...');
            
            // Esperar a que el cliente de Supabase esté listo
            let attempts = 0;
            while ((!window.supabaseClient || !window.supabaseClient.isReady()) && attempts < 100) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!window.supabaseClient || !window.supabaseClient.isReady()) {
                throw new Error('Supabase client no está disponible después de 10 segundos');
            }
            
            this.supabase = window.supabaseClient.getClient();
            
            if (!this.supabase) {
                throw new Error('No se pudo obtener el cliente de Supabase');
            }
            
            this.initialized = true;
            console.log('✅ Database service initialized');
            
            return this.supabase;
        } catch (error) {
            console.error('❌ Error inicializando Database Service:', error);
            throw error;
        }
    }

    // Obtener todas las propiedades con filtros opcionales
    async getProperties(filters = {}) {
        try {
            console.log('📊 Obteniendo propiedades...', filters);
            await this.init();
            
            let query = this.supabase
                .from('properties')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            // Aplicar filtros
            if (filters.propertyType && filters.propertyType !== 'all') {
                query = query.eq('property_type', filters.propertyType);
            }

            if (filters.district && filters.district !== 'all') {
                query = query.eq('district', filters.district);
            }

            if (filters.minPrice) {
                query = query.gte('price', filters.minPrice);
            }

            if (filters.maxPrice) {
                query = query.lte('price', filters.maxPrice);
            }

            if (filters.bedrooms && filters.bedrooms !== 'any') {
                if (filters.bedrooms === '4+') {
                    query = query.gte('bedrooms', 4);
                } else {
                    query = query.eq('bedrooms', parseInt(filters.bedrooms));
                }
            }

            if (filters.minArea) {
                query = query.gte('area', filters.minArea);
            }

            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%, location.ilike.%${filters.search}%, district.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Error fetching properties:', error);
                return { success: false, error: error.message };
            }

            console.log(`✅ ${data.length} propiedades encontradas`);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Database error:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener una propiedad específica por ID
    async getPropertyById(id) {
        try {
            console.log('🏠 Obteniendo propiedad por ID:', id);
            await this.init();
            
            const { data, error } = await this.supabase
                .from('properties')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('❌ Error fetching property:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Propiedad encontrada:', data.title);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Database error:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener propiedades destacadas
    async getFeaturedProperties(limit = 6) {
        try {
            console.log('⭐ Obteniendo propiedades destacadas...');
            await this.init();
            
            const { data, error } = await this.supabase
                .from('properties')
                .select('*')
                .eq('status', 'active')
                .eq('featured', true)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('❌ Error fetching featured properties:', error);
                return { success: false, error: error.message };
            }

            console.log(`✅ ${data.length} propiedades destacadas encontradas`);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Database error:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener propiedades similares
    async getSimilarProperties(propertyId, propertyType, district, limit = 3) {
        try {
            console.log('🔄 Obteniendo propiedades similares...');
            await this.init();
            
            const { data, error } = await this.supabase
                .from('properties')
                .select('*')
                .eq('status', 'active')
                .neq('id', propertyId)
                .or(`property_type.eq.${propertyType},district.eq.${district}`)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('❌ Error fetching similar properties:', error);
                return { success: false, error: error.message };
            }

            console.log(`✅ ${data.length} propiedades similares encontradas`);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Database error:', error);
            return { success: false, error: error.message };
        }
    }

    // Crear una consulta/inquiry
    async createInquiry(inquiryData) {
        try {
            console.log('📧 Creando consulta...', inquiryData);
            await this.init();
            
            const { data, error } = await this.supabase
                .from('inquiries')
                .insert([inquiryData])
                .select();

            if (error) {
                console.error('❌ Error creating inquiry:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Consulta creada exitosamente');
            return { success: true, data };
        } catch (error) {
            console.error('❌ Database error:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener agente por ID
    async getAgentById(id) {
        try {
            console.log('👤 Obteniendo agente por ID:', id);
            await this.init();
            
            const { data, error } = await this.supabase
                .from('agents')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('❌ Error fetching agent:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Agente encontrado:', data.name);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Database error:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener estadísticas generales
    async getStats() {
        try {
            console.log('📈 Obteniendo estadísticas...');
            await this.init();
            
            const { count: totalProperties } = await this.supabase
                .from('properties')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            const { count: totalInquiries } = await this.supabase
                .from('inquiries')
                .select('*', { count: 'exact', head: true });

            console.log('✅ Estadísticas obtenidas');
            return {
                success: true,
                data: {
                    totalProperties: totalProperties || 0,
                    totalInquiries: totalInquiries || 0
                }
            };
        } catch (error) {
            console.error('❌ Database error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Crear instancia global
console.log('🚀 Inicializando Database Service...');
const dbService = new DatabaseService();
window.dbService = dbService;
