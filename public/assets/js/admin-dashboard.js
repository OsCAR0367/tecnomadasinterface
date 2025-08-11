// Admin Dashboard System
class AdminDashboard {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentSection = 'properties';
        this.data = {
            properties: []
        };
        this.init();
    }

    async init() {
        // Check authentication first
        if (!window.adminAuth) {
            console.error('Auth system not loaded');
            return;
        }

        // Wait for auth check
        const isAuthenticated = await window.adminAuth.checkAuth();
        if (!isAuthenticated) {
            return; // Will redirect to login
        }

        this.setupEventListeners();
        this.loadInitialData();
        this.setupNavigation();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Menu toggle for mobile
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', this.toggleSidebar.bind(this));
        }

        // Add property button
        const addPropertyButton = document.getElementById('addPropertyButton');
        if (addPropertyButton) {
            addPropertyButton.addEventListener('click', () => {
                this.showPropertyModal(null);
            });
        }

        // Filter buttons for inquiries
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterInquiries(filter);
            });
        });

        // Modal close
        const modal = document.getElementById('propertyModal');
        const closeBtn = modal?.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', this.hidePropertyModal.bind(this));
        }

        // Click outside modal to close
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hidePropertyModal();
                }
            });
        }

        // Event delegation for action buttons in the table
        const propertiesTable = document.getElementById('propertiesTable');
        if (propertiesTable) {
            propertiesTable.addEventListener('click', (e) => {
                const button = e.target.closest('button[data-action]');
                if (button) {
                    const id = button.dataset.id; // Remove parseInt for UUID
                    const action = button.dataset.action;
                    
                    console.log('Button clicked:', { id, action }); // Debug log
                    
                    switch (action) {
                        case 'edit':
                            this.editProperty(id);
                            break;
                        case 'delete':
                            this.deleteProperty(id);
                            break;
                        case 'view':
                            this.viewProperty(id);
                            break;
                    }
                }
            });
        }
    }

    setupNavigation() {
        // Set user name
        const userName = document.getElementById('userName');
        const currentUser = window.adminAuth.getCurrentUser();
        if (userName && currentUser) {
            userName.textContent = currentUser.email.split('@')[0];
        }
    }

    switchSection(sectionName) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).parentElement.classList.add('active');

        // Update page title
        document.getElementById('pageTitle').textContent = 'Propiedades';

        this.currentSection = 'properties';
    }

    async loadInitialData() {
        this.showLoading(true);
        
        try {
            // Load only properties
            await this.loadProperties();
            this.renderPropertiesTable();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Error al cargar los datos');
        } finally {
            this.showLoading(false);
        }
    }

    async loadProperties() {
        try {
            console.log('Loading properties from database...'); // Debug log
            const { data, error } = await this.supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log('Properties loaded:', data); // Debug log
            this.data.properties = data || [];
            this.renderPropertiesTable();
        } catch (error) {
            console.error('Error loading properties:', error);
            this.showError('Error al cargar propiedades');
        }
    }

    renderPropertiesTable() {
        const tbody = document.querySelector('#propertiesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        console.log('Rendering properties:', this.data.properties); // Debug log

        this.data.properties.forEach(property => {
            console.log('Property ID:', property.id, 'Type:', typeof property.id); // Debug log
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${property.id}</td>
                <td>
                    <div class="property-title">
                        <strong>${property.title}</strong>
                        <div class="property-location">${property.location}</div>
                    </div>
                </td>
                <td>
                    <span class="type-badge type-${property.property_type?.toLowerCase() || 'casa'}">
                        ${property.property_type || 'Casa'}
                    </span>
                </td>
                <td>
                    <strong>S/ ${property.price.toLocaleString('es-PE')}</strong>
                    ${property.currency === 'USD' ? `<br><small>USD ${(property.price / 3.76).toLocaleString('en-US')}</small>` : ''}
                </td>
                <td>
                    <span class="status-badge status-${property.status?.toLowerCase() || 'available'}">
                        ${property.status || 'Disponible'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" data-id="${property.id}" data-action="edit" title="Editar">
                            <span>✏️</span> Editar
                        </button>
                        <button class="btn-delete" data-id="${property.id}" data-action="delete" title="Eliminar">
                            <span>🗑️</span> Eliminar
                        </button>
                        <button class="btn-view" data-id="${property.id}" data-action="view" title="Ver detalles">
                            <span>👁️</span> Ver
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add styles for new elements
        this.addTableStyles();
    }

    async loadInquiries() {
        try {
            const { data, error } = await this.supabase
                .from('inquiries')
                .select(`
                    *,
                    properties(title, location)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.data.inquiries = data || [];
        } catch (error) {
            console.error('Error loading inquiries:', error);
            this.showError('Error al cargar consultas');
        }
    }

    renderInquiriesList() {
        const container = document.getElementById('inquiriesList');
        if (!container) return;

        container.innerHTML = '';

        this.data.inquiries.forEach(inquiry => {
            const card = document.createElement('div');
            card.className = `inquiry-card ${inquiry.status || 'new'}`;
            
            const createdDate = new Date(inquiry.created_at).toLocaleDateString('es-PE');
            
            card.innerHTML = `
                <div class="inquiry-header">
                    <h4>${inquiry.name}</h4>
                    <span class="inquiry-date">${createdDate}</span>
                </div>
                <div class="inquiry-content">
                    <p><strong>Email:</strong> ${inquiry.email}</p>
                    <p><strong>Teléfono:</strong> ${inquiry.phone || 'No proporcionado'}</p>
                    <p><strong>Propiedad:</strong> ${inquiry.properties?.title || 'N/A'}</p>
                    <p><strong>Mensaje:</strong> ${inquiry.message}</p>
                </div>
                <div class="inquiry-actions">
                    <button class="btn-respond" onclick="respondInquiry(${inquiry.id})">Responder</button>
                    <button class="btn-mark-read" onclick="markAsRead(${inquiry.id})">Marcar como leída</button>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    filterInquiries(filter) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Filter inquiries
        const cards = document.querySelectorAll('.inquiry-card');
        cards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'block';
            } else {
                const hasClass = card.classList.contains(filter);
                card.style.display = hasClass ? 'block' : 'none';
            }
        });
    }

    async loadAgents() {
        try {
            const { data, error } = await this.supabase
                .from('agents')
                .select('*')
                .order('name');

            if (error) throw error;

            this.data.agents = data || [];
        } catch (error) {
            console.error('Error loading agents:', error);
            this.showError('Error al cargar agentes');
        }
    }

    renderAgentsGrid() {
        const container = document.getElementById('agentsGrid');
        if (!container) return;

        container.innerHTML = '';

        this.data.agents.forEach(agent => {
            const card = document.createElement('div');
            card.className = 'agent-card';
            
            card.innerHTML = `
                <div class="agent-avatar">
                    <img src="${agent.photo || '../assets/images/default-avatar.png'}" 
                         alt="${agent.name}" 
                         onerror="this.src='../assets/images/default-avatar.png'">
                </div>
                <h4>${agent.name}</h4>
                <p class="agent-specialization">${agent.specialization || 'Agente Inmobiliario'}</p>
                <div class="agent-contact">
                    <p>📧 ${agent.email}</p>
                    <p>📱 ${agent.phone}</p>
                </div>
                <div class="agent-stats">
                    <span>Propiedades: ${agent.properties_count || 0}</span>
                </div>
                <div class="agent-actions">
                    <button class="btn-edit" onclick="editAgent(${agent.id})">Editar</button>
                    <button class="btn-delete" onclick="deleteAgent(${agent.id})">Eliminar</button>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    showPropertyModal(propertyData = null) {
        const modal = document.getElementById('propertyModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (modal) {
            // Set modal title
            if (modalTitle) {
                modalTitle.textContent = propertyData ? 'Editar Propiedad' : 'Nueva Propiedad';
            }
            
            this.buildPropertyForm(propertyData);
            modal.style.display = 'block';
        }
    }

    hidePropertyModal() {
        const modal = document.getElementById('propertyModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    buildPropertyForm(propertyData = null) {
        const form = document.getElementById('propertyForm');
        if (!form) return;

        form.innerHTML = `
            <input type="hidden" name="id" value="${propertyData?.id || ''}">
            
            <div class="form-row">
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" name="title" value="${propertyData?.title || ''}" required>
                </div>
                <div class="form-group">
                    <label>Tipo</label>
                    <select name="property_type" required>
                        <option value="Departamento" ${propertyData?.property_type === 'Departamento' ? 'selected' : ''}>Departamento</option>
                        <option value="Casa" ${propertyData?.property_type === 'Casa' ? 'selected' : ''}>Casa</option>
                        <option value="Oficina" ${propertyData?.property_type === 'Oficina' ? 'selected' : ''}>Oficina</option>
                        <option value="Local Comercial" ${propertyData?.property_type === 'Local Comercial' ? 'selected' : ''}>Local Comercial</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Precio (S/)</label>
                    <input type="number" name="price" value="${propertyData?.price || ''}" required>
                </div>
                <div class="form-group">
                    <label>Área (m²)</label>
                    <input type="number" name="area" value="${propertyData?.area || ''}" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Ubicación</label>
                    <input type="text" name="location" value="${propertyData?.location || ''}" required>
                </div>
                <div class="form-group">
                    <label>Distrito</label>
                    <input type="text" name="district" value="${propertyData?.district || ''}" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>Descripción</label>
                <textarea name="description" rows="4" required>${propertyData?.description || ''}</textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Habitaciones</label>
                    <input type="number" name="bedrooms" value="${propertyData?.bedrooms || ''}" min="0">
                </div>
                <div class="form-group">
                    <label>Baños</label>
                    <input type="number" step="0.5" name="bathrooms" value="${propertyData?.bathrooms || ''}" min="0">
                </div>
                <div class="form-group">
                    <label>Estacionamientos</label>
                    <input type="number" name="parking_spots" value="${propertyData?.parking_spots || ''}" min="0">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Año de Construcción</label>
                    <input type="number" name="year_built" value="${propertyData?.year_built || ''}" min="1900" max="2030">
                </div>
                <div class="form-group">
                    <label>Pisos</label>
                    <input type="number" name="floors" value="${propertyData?.floors || ''}" min="1">
                </div>
                <div class="form-group">
                    <label>Estado</label>
                    <select name="status">
                        <option value="active" ${propertyData?.status === 'active' ? 'selected' : ''}>Activa</option>
                        <option value="sold" ${propertyData?.status === 'sold' ? 'selected' : ''}>Vendida</option>
                        <option value="rented" ${propertyData?.status === 'rented' ? 'selected' : ''}>Alquilada</option>
                        <option value="inactive" ${propertyData?.status === 'inactive' ? 'selected' : ''}>Inactiva</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="featured" ${propertyData?.featured ? 'checked' : ''}>
                    Propiedad Destacada
                </label>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-cancel-form">Cancelar</button>
                <button type="submit" class="btn-submit-form">${propertyData ? 'Actualizar' : 'Guardar'} Propiedad</button>
            </div>
        `;

        // Add form submit handler
        form.addEventListener('submit', this.handlePropertySubmit.bind(this));
        
        // Add cancel button handler
        const cancelBtn = form.querySelector('.btn-cancel-form');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hidePropertyModal();
            });
        }
    }

    async handlePropertySubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const propertyData = Object.fromEntries(formData.entries());
        
        // Convert numeric fields
        ['price', 'area', 'bedrooms', 'bathrooms', 'parking_spots', 'year_built', 'floors'].forEach(field => {
            if (propertyData[field] && propertyData[field] !== '') {
                propertyData[field] = parseFloat(propertyData[field]);
            } else {
                delete propertyData[field];
            }
        });
        
        // Convert boolean fields
        propertyData.featured = propertyData.featured === 'on';
        
        // Calculate USD price (approximate conversion)
        if (propertyData.price) {
            propertyData.price_usd = Math.round(propertyData.price / 3.8);
        }
        
        const isEdit = propertyData.id && propertyData.id !== '';
        const propertyId = propertyData.id;
        
        // Remove id from data for insert/update
        delete propertyData.id;
        
        try {
            this.showLoading(true);
            
            let result;
            if (isEdit) {
                // Update existing property
                result = await this.supabase
                    .from('properties')
                    .update({
                        ...propertyData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', propertyId);
            } else {
                // Create new property
                result = await this.supabase
                    .from('properties')
                    .insert([{
                        ...propertyData,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }]);
            }

            if (result.error) throw result.error;

            this.hidePropertyModal();
            await this.loadProperties();
            this.renderPropertiesTable();
            
            const message = isEdit ? 'Propiedad actualizada exitosamente' : 'Propiedad creada exitosamente';
            this.showSuccess(message);
            
        } catch (error) {
            console.error('Error saving property:', error);
            const message = isEdit ? 'Error al actualizar la propiedad' : 'Error al crear la propiedad';
            this.showError(message);
        } finally {
            this.showLoading(false);
        }
    }

    addTableStyles() {
        // Add dynamic styles for table elements
        const style = document.createElement('style');
        style.textContent = `
            .property-title strong { color: #1e293b; }
            .property-location { font-size: 12px; color: #64748b; }
            .type-badge { 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: 12px; 
                font-weight: 600; 
                text-transform: uppercase; 
            }
            .type-departamento { background: #dbeafe; color: #1e40af; }
            .type-casa { background: #dcfce7; color: #166534; }
            .type-oficina { background: #fef3c7; color: #92400e; }
            .type-local { background: #fce7f3; color: #be185d; }
            .status-badge { 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: 12px; 
                font-weight: 600; 
            }
            .status-disponible { background: #dcfce7; color: #166534; }
            .status-vendido { background: #fee2e2; color: #dc2626; }
            .action-buttons { display: flex; gap: 8px; justify-content: center; align-items: center; }
            .action-buttons button { 
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 70px;
                justify-content: center;
            }
            .action-buttons .btn-edit {
                background: #3b82f6;
                color: white;
            }
            .action-buttons .btn-edit:hover {
                background: #2563eb;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
            }
            .action-buttons .btn-delete {
                background: #ef4444;
                color: white;
            }
            .action-buttons .btn-delete:hover {
                background: #dc2626;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
            }
            .action-buttons .btn-view {
                background: #10b981;
                color: white;
            }
            .action-buttons .btn-view:hover {
                background: #059669;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('open');
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show with animation
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    showCustomConfirm(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
        return new Promise((resolve) => {
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'modal confirm-modal';
            modal.innerHTML = `
                <div class="modal-content confirm-content">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="confirm-buttons">
                        <button class="btn-cancel">${cancelText}</button>
                        <button class="btn-confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            // Add event listeners
            const btnCancel = modal.querySelector('.btn-cancel');
            const btnConfirm = modal.querySelector('.btn-confirm');

            btnCancel.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });

            btnConfirm.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });

            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false);
                }
            });

            // Add to page and show
            document.body.appendChild(modal);
            modal.style.display = 'block';
        });
    }

    // CRUD Methods
    async editProperty(id) {
        try {
            this.showLoading(true);
            
            const { data: property, error } = await this.supabase
                .from('properties')
                .select('*')
                .eq('id', id)
                .single();
                
            if (error) throw error;
            
            // Show modal and populate form
            this.showPropertyModal(property);
            
        } catch (error) {
            console.error('Error loading property:', error);
            this.showError('Error al cargar la propiedad');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteProperty(id) {
        // Create custom confirmation dialog
        const confirmed = await this.showCustomConfirm(
            '¿Eliminar Propiedad?',
            'Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar esta propiedad?',
            'Eliminar',
            'Cancelar'
        );

        if (confirmed) {
            try {
                this.showLoading(true);
                
                const { error } = await this.supabase
                    .from('properties')
                    .delete()
                    .eq('id', id);
                    
                if (error) throw error;
                
                // Reload properties table
                await this.loadProperties();
                this.renderPropertiesTable();
                this.showSuccess('Propiedad eliminada exitosamente');
                
            } catch (error) {
                console.error('Error deleting property:', error);
                this.showError('Error al eliminar la propiedad');
            } finally {
                this.showLoading(false);
            }
        }
    }

    viewProperty(id) {
        console.log('Viewing property with ID:', id); // Debug log
        
        // Find the property in our data
        const property = this.data.properties.find(p => p.id === id);
        if (!property) {
            this.showError('Propiedad no encontrada');
            return;
        }

        // Create a simple view modal
        this.showPropertyViewModal(property);
    }

    showPropertyViewModal(property) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal view-modal';
        modal.innerHTML = `
            <div class="modal-content view-content">
                <span class="close">&times;</span>
                <h2>Detalles de la Propiedad</h2>
                <div class="property-details">
                    <div class="detail-group">
                        <label>ID:</label>
                        <span>${property.id}</span>
                    </div>
                    <div class="detail-group">
                        <label>Título:</label>
                        <span>${property.title}</span>
                    </div>
                    <div class="detail-group">
                        <label>Tipo:</label>
                        <span>${property.property_type}</span>
                    </div>
                    <div class="detail-group">
                        <label>Precio:</label>
                        <span>S/ ${property.price?.toLocaleString('es-PE')}</span>
                    </div>
                    <div class="detail-group">
                        <label>Área:</label>
                        <span>${property.area} m²</span>
                    </div>
                    <div class="detail-group">
                        <label>Ubicación:</label>
                        <span>${property.location}, ${property.district}</span>
                    </div>
                    <div class="detail-group">
                        <label>Habitaciones:</label>
                        <span>${property.bedrooms || 'N/A'}</span>
                    </div>
                    <div class="detail-group">
                        <label>Baños:</label>
                        <span>${property.bathrooms || 'N/A'}</span>
                    </div>
                    <div class="detail-group">
                        <label>Estado:</label>
                        <span class="status-badge status-${property.status?.toLowerCase() || 'available'}">${property.status || 'Disponible'}</span>
                    </div>
                    <div class="detail-group full-width">
                        <label>Descripción:</label>
                        <p>${property.description || 'Sin descripción'}</p>
                    </div>
                </div>
                <div class="view-actions">
                    <button type="button" class="btn-close-view">Cerrar</button>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.close');
        const closeBtnFooter = modal.querySelector('.btn-close-view');

        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeModal);
        closeBtnFooter.addEventListener('click', closeModal);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Add to page and show
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
