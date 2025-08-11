// Servicio para operaciones de base de datos
class DatabaseService {
    constructor() {
        this.tableName = 'properties';
    }

    // Obtener todas las propiedades con filtros
    async getProperties(filters = {}) {
        try {
            let query = supabaseClient
                .from(this.tableName)
                .select('*');

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
                query = query.eq('bedrooms', filters.bedrooms);
            }

            if (filters.minArea) {
                query = query.gte('area', filters.minArea);
            }

            if (filters.status) {
                query = query.eq('status', filters.status);
            } else {
                query = query.eq('status', 'active');
            }

            // Búsqueda por texto
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
            }

            // Ordenamiento
            if (filters.sortBy) {
                const [field, direction] = filters.sortBy.split(':');
                query = query.order(field, { ascending: direction === 'asc' });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            // Paginación
            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
            }

            const { data, error } = await query;

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error fetching properties:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener una propiedad por ID
    async getPropertyById(id) {
        try {
            const { data, error } = await supabaseClient
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error fetching property:', error);
            return { success: false, error: error.message };
        }
    }

    // Crear nueva propiedad
    async createProperty(propertyData) {
        try {
            const { data, error } = await supabaseClient
                .from(this.tableName)
                .insert([propertyData])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error creating property:', error);
            return { success: false, error: error.message };
        }
    }

    // Actualizar propiedad
    async updateProperty(id, propertyData) {
        try {
            const { data, error } = await supabaseClient
                .from(this.tableName)
                .update({ ...propertyData, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error updating property:', error);
            return { success: false, error: error.message };
        }
    }

    // Eliminar propiedad
    async deleteProperty(id) {
        try {
            const { error } = await supabaseClient
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error deleting property:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener propiedades destacadas
    async getFeaturedProperties(limit = 6) {
        try {
            const { data, error } = await supabaseClient
                .from(this.tableName)
                .select('*')
                .eq('featured', true)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error fetching featured properties:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener propiedades similares
    async getSimilarProperties(propertyId, propertyType, district, limit = 3) {
        try {
            const { data, error } = await supabaseClient
                .from(this.tableName)
                .select('*')
                .neq('id', propertyId)
                .eq('status', 'active')
                .or(`property_type.eq.${propertyType},district.eq.${district}`)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error fetching similar properties:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener estadísticas para dashboard
    async getStats() {
        try {
            const { data: totalProperties, error: error1 } = await supabaseClient
                .from(this.tableName)
                .select('id', { count: 'exact' });

            const { data: activeProperties, error: error2 } = await supabaseClient
                .from(this.tableName)
                .select('id', { count: 'exact' })
                .eq('status', 'active');

            const { data: featuredProperties, error: error3 } = await supabaseClient
                .from(this.tableName)
                .select('id', { count: 'exact' })
                .eq('featured', true);

            if (error1 || error2 || error3) {
                throw error1 || error2 || error3;
            }

            return {
                success: true,
                data: {
                    total: totalProperties?.length || 0,
                    active: activeProperties?.length || 0,
                    featured: featuredProperties?.length || 0
                }
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { success: false, error: error.message };
        }
    }

    // Subir imagen a Supabase Storage
    async uploadImage(file, folder = 'properties') {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { data, error } = await supabaseClient.storage
                .from('property-images')
                .upload(filePath, file);

            if (error) throw error;

            // Obtener URL pública
            const { data: { publicUrl } } = supabaseClient.storage
                .from('property-images')
                .getPublicUrl(filePath);

            return { success: true, url: publicUrl, path: filePath };
        } catch (error) {
            console.error('Error uploading image:', error);
            return { success: false, error: error.message };
        }
    }

    // Eliminar imagen de Supabase Storage
    async deleteImage(filePath) {
        try {
            const { error } = await supabaseClient.storage
                .from('property-images')
                .remove([filePath]);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error deleting image:', error);
            return { success: false, error: error.message };
        }
    }

    // Crear consulta
    async createInquiry(inquiryData) {
        try {
            const { data, error } = await supabaseClient
                .from('inquiries')
                .insert([inquiryData])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error creating inquiry:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener consultas
    async getInquiries(filters = {}) {
        try {
            let query = supabaseClient
                .from('inquiries')
                .select(`
                    *,
                    properties (
                        title,
                        price,
                        location
                    )
                `);

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.propertyId) {
                query = query.eq('property_id', filters.propertyId);
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error fetching inquiries:', error);
            return { success: false, error: error.message };
        }
    }
}

// Crear instancia global del servicio de base de datos
const dbService = new DatabaseService();

// Export para otros módulos
window.dbService = dbService;
