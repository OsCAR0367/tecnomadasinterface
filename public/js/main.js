ush // JavaScript principal para la página de propiedades
class PropertyApp {
    constructor() {
        this.properties = [];
        this.filteredProperties = [];
        this.currentFilters = {};
        this.init();
    }

    async init() {
        this.showLoading(true);
        await this.loadProperties();
        this.setupEventListeners();
        this.showLoading(false);
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    async loadProperties() {
        try {
            console.log('🔄 Cargando propiedades...');
            const result = await window.dbService.getProperties();
            console.log('📊 Resultado de getProperties:', result);
            
            if (result.success) {
                this.properties = result.data;
                this.filteredProperties = [...this.properties];
                console.log(`✅ ${this.properties.length} propiedades cargadas:`, this.properties);
                this.renderProperties();
                this.updateResultsCount();
            } else {
                console.error('❌ Error loading properties:', result.error);
                this.showError('Error cargando las propiedades');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            this.showError('Error de conexión');
        }
    }

    setupEventListeners() {
        // Filtros
        document.getElementById('filterBtn').addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        
        // Búsqueda
        document.getElementById('searchBtn').addEventListener('click', () => this.applyFilters());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyFilters();
            }
        });

        // Ordenamiento
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortProperties(e.target.value);
        });

        // Auto-aplicar filtros cuando cambian los selects
        ['propertyType', 'district', 'bedrooms'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                setTimeout(() => this.applyFilters(), 100);
            });
        });
    }

    async applyFilters() {
        this.showLoading(true);
        
        // Recopilar filtros
        const filters = {
            search: document.getElementById('searchInput').value.trim(),
            propertyType: document.getElementById('propertyType').value,
            district: document.getElementById('district').value,
            bedrooms: document.getElementById('bedrooms').value,
            minPrice: parseFloat(document.getElementById('minPrice').value) || null,
            maxPrice: parseFloat(document.getElementById('maxPrice').value) || null,
            minArea: parseFloat(document.getElementById('minArea').value) || null
        };

        // Limpiar filtros vacíos
        Object.keys(filters).forEach(key => {
            if (!filters[key] || filters[key] === 'all' || filters[key] === 'any') {
                delete filters[key];
            }
        });

        this.currentFilters = filters;

        try {
            const result = await window.dbService.getProperties(filters);
            
            if (result.success) {
                this.filteredProperties = result.data;
                this.renderProperties();
                this.updateResultsCount();
            } else {
                console.error('Error filtering properties:', result.error);
                this.showError('Error aplicando filtros');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error de conexión');
        }

        this.showLoading(false);
    }

    clearFilters() {
        // Limpiar formulario
        document.getElementById('searchInput').value = '';
        document.getElementById('propertyType').value = 'all';
        document.getElementById('district').value = 'all';
        document.getElementById('bedrooms').value = 'any';
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.getElementById('minArea').value = '';

        // Resetear propiedades
        this.filteredProperties = [...this.properties];
        this.currentFilters = {};
        this.renderProperties();
        this.updateResultsCount();
    }

    sortProperties(sortBy) {
        switch (sortBy) {
            case 'price_asc':
                this.filteredProperties.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                this.filteredProperties.sort((a, b) => b.price - a.price);
                break;
            case 'area_desc':
                this.filteredProperties.sort((a, b) => (b.area || 0) - (a.area || 0));
                break;
            case 'newest':
            default:
                this.filteredProperties.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }
        this.renderProperties();
    }

    renderProperties() {
        const grid = document.getElementById('propertiesGrid');
        const noResults = document.getElementById('noResults');
        
        console.log(`🎨 Renderizando ${this.filteredProperties.length} propiedades...`);

        if (this.filteredProperties.length === 0) {
            grid.style.display = 'none';
            noResults.style.display = 'block';
            console.log('ℹ️ No hay propiedades para mostrar');
            return;
        }

        grid.style.display = 'grid';
        noResults.style.display = 'none';

        grid.innerHTML = this.filteredProperties.map(property => this.createPropertyCard(property)).join('');
        console.log('✅ Propiedades renderizadas en el DOM');

        // Agregar event listeners a las tarjetas
        this.setupPropertyCardEvents();
    }

    createPropertyCard(property) {
        // Parsear features de manera segura
        let features = [];
        try {
            if (property.features) {
                if (typeof property.features === 'string') {
                    features = JSON.parse(property.features);
                } else if (Array.isArray(property.features)) {
                    features = property.features;
                } else {
                    features = [];
                }
            }
        } catch (error) {
            console.warn('Error parsing features:', error);
            features = [];
        }

        // Parsear imágenes de manera segura
        let images = [];
        try {
            if (property.images) {
                if (typeof property.images === 'string') {
                    images = JSON.parse(property.images);
                } else if (Array.isArray(property.images)) {
                    images = property.images;
                } else {
                    images = [];
                }
            }
        } catch (error) {
            console.warn('Error parsing images:', error);
            images = [];
        }

        // Función para generar imágenes aleatorias de propiedades
        const getRandomPropertyImage = () => {
            const propertyImages = [
                'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=400&h=250&fit=crop&q=80',
                'https://images.unsplash.com/photo-1600047507796-157d0ac8b66a?w=400&h=250&fit=crop&q=80'
            ];
            return propertyImages[Math.floor(Math.random() * propertyImages.length)];
        };

        // Imagen principal - siempre usar imagen aleatoria de internet para mayor variedad
        const mainImage = getRandomPropertyImage();
        console.log(`🖼️ Imagen generada para propiedad ${property.id}:`, mainImage);
        
        const badge = property.featured ? '<div class="property-badge">Destacado</div>' : '';
        
        return `
            <div class="property-card" data-property-id="${property.id}">
                <div class="property-image" style="background-image: url('${mainImage}');">
                    ${badge}
                    <button class="favorite-btn" data-property-id="${property.id}">♡</button>
                </div>
                <div class="property-info">
                    <div class="property-type">${property.property_type || 'Propiedad'}</div>
                    <div class="property-title">${property.title || 'Sin título'}</div>
                    <div class="property-location">${property.location || 'Ubicación no especificada'}</div>
                    <div class="property-details">
                        ${property.area ? `<div class="property-detail">🏠 ${property.area} m²</div>` : ''}
                        ${property.bedrooms ? `<div class="property-detail">🛏 ${property.bedrooms} dorm</div>` : ''}
                        ${property.parking_spots ? `<div class="property-detail">🚗 ${property.parking_spots} est</div>` : ''}
                    </div>
                    <div class="property-price">S/ ${this.formatNumber(property.price || 0)}</div>
                    ${property.price_usd ? `<div class="property-price-usd">USD ${this.formatNumber(property.price_usd)}</div>` : ''}
                    <div class="property-actions">
                        <button class="action-btn whatsapp-btn" data-property-id="${property.id}">WhatsApp</button>
                        <button class="action-btn contact-btn" data-property-id="${property.id}">Contactar</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupPropertyCardEvents() {
        // Click en tarjetas para ver detalles
        document.querySelectorAll('.property-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const propertyId = card.dataset.propertyId;
                    window.location.href = `/property/${propertyId}`;
                }
            });
        });

        // Botón de favoritos
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(btn);
            });
        });

        // Botones de WhatsApp y contacto
        document.querySelectorAll('.whatsapp-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const propertyId = btn.dataset.propertyId;
                this.contactWhatsApp(propertyId);
            });
        });

        document.querySelectorAll('.contact-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const propertyId = btn.dataset.propertyId;
                this.showContactForm(propertyId);
            });
        });
    }

    toggleFavorite(btn) {
        btn.textContent = btn.textContent === '♡' ? '♥' : '♡';
        btn.style.color = btn.textContent === '♥' ? '#dc2626' : '#666';
        
        // Aquí podrías agregar lógica para guardar favoritos
        const propertyId = btn.dataset.propertyId;
        console.log('Toggle favorite for property:', propertyId);
    }

    contactWhatsApp(propertyId) {
        const property = this.filteredProperties.find(p => p.id === propertyId);
        if (property) {
            const message = `Hola, estoy interesado en la propiedad: ${property.title} - S/ ${this.formatNumber(property.price)}`;
            const whatsappUrl = `https://wa.me/51954123456?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    }

    showContactForm(propertyId) {
        const property = this.filteredProperties.find(p => p.id === propertyId);
        if (property) {
            // Mostrar modal de contacto o redirigir
            alert(`Formulario de contacto para: ${property.title}`);
            // Aquí podrías implementar un modal real
        }
    }

    updateResultsCount() {
        const count = this.filteredProperties.length;
        const countElement = document.getElementById('resultsCount');
        
        if (count === 0) {
            countElement.textContent = 'No se encontraron propiedades';
        } else if (count === 1) {
            countElement.textContent = '1 Propiedad encontrada';
        } else {
            countElement.textContent = `${count} Propiedades encontradas`;
        }
    }

    formatNumber(number) {
        return new Intl.NumberFormat('es-PE').format(number);
    }

    showError(message) {
        // Ocultar loading
        this.showLoading(false);
        
        // Mostrar mensaje de error
        console.error('Error:', message);
        
        // Crear elemento de error si no existe
        let errorElement = document.getElementById('errorMessage');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'errorMessage';
            errorElement.style.cssText = `
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #991b1b;
                padding: 16px;
                border-radius: 8px;
                margin: 20px;
                text-align: center;
            `;
            document.querySelector('.main-content').prepend(errorElement);
        }
        
        errorElement.innerHTML = `
            <strong>⚠️ Error de conexión</strong><br>
            ${message}<br>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">
                🔄 Reintentar
            </button>
        `;
        
        errorElement.style.display = 'block';
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new PropertyApp();
});
