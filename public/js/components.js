// Componentes JavaScript reutilizables

// Componente de Loading/Spinner
class LoadingComponent {
    static show(message = 'Cargando...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const text = overlay.querySelector('p');
            if (text) text.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    static hide() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
}

// Componente de Notificaciones/Toasts
class NotificationComponent {
    static show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Estilos inline para el componente
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1001;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Event listener para cerrar
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.remove(notification);
        });

        // Auto-remove después del tiempo especificado
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    }

    static getBackgroundColor(type) {
        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    static remove(notification) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    static success(message, duration) {
        return this.show(message, 'success', duration);
    }

    static error(message, duration) {
        return this.show(message, 'error', duration);
    }

    static warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    static info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Componente Modal
class ModalComponent {
    constructor(options = {}) {
        this.options = {
            title: options.title || '',
            body: options.body || '',
            footer: options.footer || '',
            closable: options.closable !== false,
            size: options.size || 'medium', // small, medium, large
            ...options
        };
        this.modal = null;
        this.overlay = null;
    }

    create() {
        // Crear overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        `;

        // Crear modal
        this.modal = document.createElement('div');
        this.modal.className = `modal modal-${this.options.size}`;
        this.modal.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            width: 100%;
            max-width: ${this.getMaxWidth()};
            max-height: 90vh;
            overflow-y: auto;
        `;

        let modalContent = '';

        if (this.options.title) {
            modalContent += `
                <div class="modal-header" style="padding: 24px 24px 0; border-bottom: 1px solid #e9ecef;">
                    <h3 class="modal-title" style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">${this.options.title}</h3>
                    ${this.options.closable ? '<button class="modal-close" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>' : ''}
                </div>
            `;
        }

        if (this.options.body) {
            modalContent += `
                <div class="modal-body" style="padding: 24px;">
                    ${this.options.body}
                </div>
            `;
        }

        if (this.options.footer) {
            modalContent += `
                <div class="modal-footer" style="padding: 0 24px 24px; display: flex; gap: 12px; justify-content: flex-end;">
                    ${this.options.footer}
                </div>
            `;
        }

        this.modal.innerHTML = modalContent;
        this.overlay.appendChild(this.modal);

        return this;
    }

    getMaxWidth() {
        const sizes = {
            small: '400px',
            medium: '600px',
            large: '800px'
        };
        return sizes[this.options.size] || sizes.medium;
    }

    show() {
        if (!this.modal) {
            this.create();
        }

        document.body.appendChild(this.overlay);

        // Event listeners
        if (this.options.closable) {
            const closeBtn = this.modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hide());
            }

            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hide();
                }
            });
        }

        // Llamar callback onShow si existe
        if (this.options.onShow) {
            this.options.onShow(this);
        }

        return this;
    }

    hide() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }

        // Llamar callback onHide si existe
        if (this.options.onHide) {
            this.options.onHide(this);
        }

        return this;
    }

    destroy() {
        this.hide();
        this.modal = null;
        this.overlay = null;
        return this;
    }
}

// Utilidades de formateo
class FormatUtils {
    static formatNumber(number, locale = 'es-PE') {
        return new Intl.NumberFormat(locale).format(number);
    }

    static formatCurrency(amount, currency = 'PEN', locale = 'es-PE') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Intl.DateTimeFormat('es-PE', { ...defaultOptions, ...options }).format(date);
    }

    static truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
}

// Validaciones de formulario
class ValidationUtils {
    static isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isPhone(phone) {
        const phoneRegex = /^(\+51|51)?[9][0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    static isEmpty(value) {
        return !value || value.trim().length === 0;
    }

    static minLength(value, min) {
        return value && value.length >= min;
    }

    static maxLength(value, max) {
        return !value || value.length <= max;
    }

    static isNumeric(value) {
        return !isNaN(value) && !isNaN(parseFloat(value));
    }
}

// Exportar para uso global
window.LoadingComponent = LoadingComponent;
window.NotificationComponent = NotificationComponent;
window.ModalComponent = ModalComponent;
window.FormatUtils = FormatUtils;
window.ValidationUtils = ValidationUtils;

// Agregar estilos CSS para animaciones
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
    }

    .notification-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .notification-close:hover {
        opacity: 0.7;
    }
`;

document.head.appendChild(animationStyles);
