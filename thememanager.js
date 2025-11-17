// Theme Manager
const themePresets = {
    default: {
        primaryColor: '#d4a5c4',
        secondaryColor: '#e8c9dd',
        accentColor: '#c89bb8',
        textColor: '#8b6f7d',
        cardColor: '#fef7fc',
        cardOpacity: 85
    },
    lavender: {
        primaryColor: '#b8a4d4',
        secondaryColor: '#d4c4e8',
        accentColor: '#9b89c8',
        textColor: '#6f5d8b',
        cardColor: '#f9f7fe',
        cardOpacity: 85
    },
    mint: {
        primaryColor: '#a4d4b8',
        secondaryColor: '#c4e8d4',
        accentColor: '#89c89b',
        textColor: '#5d8b6f',
        cardColor: '#f7fef9',
        cardOpacity: 85
    },
    peach: {
        primaryColor: '#f4b8a4',
        secondaryColor: '#fdd4c4',
        accentColor: '#e89b89',
        textColor: '#8b6f5d',
        cardColor: '#fef9f7',
        cardOpacity: 85
    },
    ocean: {
        primaryColor: '#a4c4d4',
        secondaryColor: '#c4d8e8',
        accentColor: '#89b8c8',
        textColor: '#5d7a8b',
        cardColor: '#f7fbfe',
        cardOpacity: 85
    },
    sunset: {
        primaryColor: '#e8a4b8',
        secondaryColor: '#f4c4d4',
        accentColor: '#d4899b',
        textColor: '#8b5d6f',
        cardColor: '#fef7f9',
        cardOpacity: 85
    }
};

function rgbaToHex(rgba) {
    if (!rgba) return '#ffffff';
    
    // If it's already a hex color
    if (rgba.startsWith('#')) return rgba;
    
    // Extract RGB values
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#ffffff';
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function hexToRgba(hex, opacity) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(255, 255, 255, ${opacity / 100})`;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

function applyTheme(theme) {
    const root = document.documentElement;
    
    // Apply colors with CSS variables
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--text-color', theme.textColor);
    
    // Apply card color with opacity
    const cardColorRgba = hexToRgba(theme.cardColor, theme.cardOpacity);
    root.style.setProperty('--card-color', cardColorRgba);
    
    // Update all elements that use these colors dynamically
    updateDynamicColors(theme);
}

function updateDynamicColors(theme) {
    // Update elements that directly use inline styles or specific classes
    const style = document.createElement('style');
    style.id = 'dynamic-theme-style';
    
    // Remove old dynamic style if exists
    const oldStyle = document.getElementById('dynamic-theme-style');
    if (oldStyle) oldStyle.remove();
    
    style.textContent = `
        :root {
            --primary-color: ${theme.primaryColor};
            --secondary-color: ${theme.secondaryColor};
            --accent-color: ${theme.accentColor};
            --text-color: ${theme.textColor};
            --card-color: ${hexToRgba(theme.cardColor, theme.cardOpacity)};
        }
        
        /* Apply theme colors to all relevant elements */
        .main-card {
            background: var(--card-color) !important;
        }
        
        .download-btn {
            background: var(--primary-color) !important;
        }
        
        .download-btn:hover:not(:disabled) {
            background: var(--accent-color) !important;
        }
        
        .toggle-switch.checked {
            background: var(--primary-color) !important;
        }
        
        .progress-fill {
            background: linear-gradient(90deg, var(--primary-color), var(--accent-color)) !important;
        }
        
        .page-btn.active {
            background: var(--primary-color) !important;
            border-color: var(--primary-color) !important;
        }
        
        .notification-icon {
            color: var(--primary-color) !important;
        }
        
        .history-item-badge {
            background: ${hexToRgba(theme.primaryColor, 20)} !important;
            color: var(--text-color) !important;
        }
        
        .opacity-slider::-webkit-slider-thumb {
            background: var(--primary-color) !important;
        }
        
        .opacity-slider::-webkit-slider-thumb:hover {
            background: var(--accent-color) !important;
        }
        
        .opacity-slider::-moz-range-thumb {
            background: var(--primary-color) !important;
        }
        
        .opacity-slider::-moz-range-thumb:hover {
            background: var(--accent-color) !important;
        }
        
        /* Text colors */
        .header h1,
        .settings-header h3,
        .history-header h3 {
            color: var(--text-color) !important;
        }
        
        .input-group label,
        .color-group > label {
            color: ${adjustBrightness(theme.textColor, 30)} !important;
        }
        
        .url-input,
        .path-input,
        .quality-select,
        .color-text-input {
            color: ${adjustBrightness(theme.textColor, -10)} !important;
        }
        
        .toggle-label {
            color: var(--text-color) !important;
        }
    `;
    
    document.head.appendChild(style);
}

function adjustBrightness(hex, percent) {
    // Convert hex to RGB
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) + percent;
    const g = ((num >> 8) & 0x00FF) + percent;
    const b = (num & 0x0000FF) + percent;
    
    // Ensure values are within 0-255
    const newR = Math.max(0, Math.min(255, r));
    const newG = Math.max(0, Math.min(255, g));
    const newB = Math.max(0, Math.min(255, b));
    
    return '#' + (0x1000000 + newR * 0x10000 + newG * 0x100 + newB).toString(16).slice(1);
}

function saveTheme(theme) {
    localStorage.setItem('customTheme', JSON.stringify(theme));
}

function loadSavedTheme() {
    const saved = localStorage.getItem('customTheme');
    if (saved) {
        return JSON.parse(saved);
    }
    return themePresets.default;
}

function initializeThemeInputs(theme) {
    // Primary Color
    document.getElementById('primaryColorInput').value = theme.primaryColor;
    document.getElementById('primaryColorText').value = theme.primaryColor.toUpperCase();
    
    // Secondary Color
    document.getElementById('secondaryColorInput').value = theme.secondaryColor;
    document.getElementById('secondaryColorText').value = theme.secondaryColor.toUpperCase();
    
    // Accent Color
    document.getElementById('accentColorInput').value = theme.accentColor;
    document.getElementById('accentColorText').value = theme.accentColor.toUpperCase();
    
    // Text Color
    document.getElementById('textColorInput').value = theme.textColor;
    document.getElementById('textColorText').value = theme.textColor.toUpperCase();
    
    // Card Color
    document.getElementById('cardColorInput').value = theme.cardColor;
    document.getElementById('cardColorText').value = theme.cardColor.toUpperCase();
    
    // Card Opacity
    document.getElementById('cardOpacityInput').value = theme.cardOpacity;
    document.getElementById('cardOpacityValue').textContent = theme.cardOpacity + '%';
}

function setupThemeListeners() {
    // Color pickers sync with text inputs
    const colorInputs = [
        { picker: 'primaryColorInput', text: 'primaryColorText', key: 'primaryColor' },
        { picker: 'secondaryColorInput', text: 'secondaryColorText', key: 'secondaryColor' },
        { picker: 'accentColorInput', text: 'accentColorText', key: 'accentColor' },
        { picker: 'textColorInput', text: 'textColorText', key: 'textColor' },
        { picker: 'cardColorInput', text: 'cardColorText', key: 'cardColor' }
    ];
    
    colorInputs.forEach(({ picker, text, key }) => {
        const pickerEl = document.getElementById(picker);
        const textEl = document.getElementById(text);
        
        pickerEl.addEventListener('input', (e) => {
            const color = e.target.value;
            textEl.value = color.toUpperCase();
            updateThemeColor(key, color);
        });
        
        textEl.addEventListener('input', (e) => {
            let value = e.target.value;
            if (!value.startsWith('#')) value = '#' + value;
            
            // Validate hex color
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                pickerEl.value = value;
                updateThemeColor(key, value);
            }
        });
    });
    
    // Opacity slider
    const opacitySlider = document.getElementById('cardOpacityInput');
    const opacityValue = document.getElementById('cardOpacityValue');
    
    opacitySlider.addEventListener('input', (e) => {
        const value = e.target.value;
        opacityValue.textContent = value + '%';
        updateThemeOpacity(value);
    });
    
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetName = btn.dataset.preset;
            const preset = themePresets[presetName];
            if (preset) {
                applyTheme(preset);
                initializeThemeInputs(preset);
                saveTheme(preset);
                showNotification(`${presetName} theme applied ♡`);
            }
        });
    });
    
    // Reset button
    document.getElementById('resetThemeBtn').addEventListener('click', () => {
        const defaultTheme = themePresets.default;
        applyTheme(defaultTheme);
        initializeThemeInputs(defaultTheme);
        saveTheme(defaultTheme);
        showNotification('theme reset to default ♡');
    });
}

function updateThemeColor(key, value) {
    const currentTheme = loadSavedTheme();
    currentTheme[key] = value;
    applyTheme(currentTheme);
    saveTheme(currentTheme);
}

function updateThemeOpacity(value) {
    const currentTheme = loadSavedTheme();
    currentTheme.cardOpacity = parseInt(value);
    applyTheme(currentTheme);
    saveTheme(currentTheme);
}

// Export functions for use in renderer.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        applyTheme,
        loadSavedTheme,
        initializeThemeInputs,
        setupThemeListeners,
        themePresets
    };
}