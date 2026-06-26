// Dynamic Font Styling Controls for recommendation system
(function () {
    function initFontSettings() {
        const btnPrint = document.querySelector('.btn-print');
        if (!btnPrint) return; // Not a template page or panel not ready

        // 1. Get saved styling values or defaults (Size: 18pt, Italic: false, Color: black)
        const savedSize = localStorage.getItem('doc_font_size') || '18';
        const savedItalic = localStorage.getItem('doc_font_style') === 'italic';
        const savedColor = localStorage.getItem('doc_text_color') || '#000000';

        // 2. Inject Dynamic Style tag for preview controls
        let styleTag = document.getElementById('dynamic-font-settings-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'dynamic-font-settings-style';
            document.head.appendChild(styleTag);
        }

        // 3. Inject CSS styles for the Font Settings Card UI
        let cardStyleTag = document.getElementById('font-settings-ui-style');
        if (!cardStyleTag) {
            cardStyleTag = document.createElement('style');
            cardStyleTag.id = 'font-settings-ui-style';
            cardStyleTag.textContent = `
                .font-settings-card {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 16px;
                    margin: 15px 0 20px 0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .font-settings-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border-bottom: 1px dashed #cbd5e0;
                    padding-bottom: 8px;
                }
                .font-settings-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                }
                .font-settings-row:last-child {
                    margin-bottom: 0;
                }
                .font-settings-label {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #4a5568;
                }
                .font-settings-control {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                /* Slider styling */
                .font-settings-slider {
                    width: 120px;
                    accent-color: #2b6cb0;
                    cursor: pointer;
                    height: 6px;
                    border-radius: 3px;
                }
                .font-settings-val {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #2b6cb0;
                    min-width: 42px;
                    text-align: right;
                }
                /* Color Picker */
                .font-settings-color {
                    border: none;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    background: none;
                    padding: 0;
                }
                .font-settings-color::-webkit-color-swatch-wrapper {
                    padding: 0;
                }
                .font-settings-color::-webkit-color-swatch {
                    border: 2px solid #cbd5e0;
                    border-radius: 50%;
                }
                /* Presets */
                .color-presets {
                    display: flex;
                    gap: 6px;
                }
                .color-preset {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 1px solid #cbd5e0;
                    transition: transform 0.2s;
                }
                .color-preset:hover {
                    transform: scale(1.25);
                }
                /* Switch / Checkbox styling */
                .font-settings-switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                }
                .font-settings-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider-toggle {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #cbd5e0;
                    transition: .3s;
                    border-radius: 24px;
                }
                .slider-toggle:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .3s;
                    border-radius: 50%;
                }
                input:checked + .slider-toggle {
                    background-color: #2b6cb0;
                }
                input:checked + .slider-toggle:before {
                    transform: translateX(20px);
                }
            `;
            document.head.appendChild(cardStyleTag);
        }

        // 4. Function to apply styles to content elements dynamically
        function applyStyles(sz, it, col) {
            styleTag.textContent = `
                :root {
                    --doc-font-size: ${sz}pt;
                    --doc-font-style: ${it ? 'italic' : 'normal'};
                    --doc-text-color: ${col};
                }
                
                /* Apply Font size, Font style and color to document body elements */
                .a4-page {
                    font-size: var(--doc-font-size) !important;
                }
                
                .letter-body,
                .letter-body-para,
                .letter-body p,
                .letter-body-para p,
                .details-table td,
                .details-table th,
                .landuse-container,
                .address-to,
                .address-to span,
                .subject-container,
                .subject-title,
                .sig-name,
                .sig-title {
                    font-size: var(--doc-font-size) !important;
                    color: var(--doc-text-color) !important;
                }
                
                .subject-title span {
                    font-size: var(--doc-font-size) !important;
                }
                
                .letter-body,
                .letter-body-para,
                .details-table,
                .details-table td,
                .details-table th,
                .landuse-container,
                .address-to,
                .subject-container {
                    font-style: var(--doc-font-style) !important;
                }
                
                /* Explicit exclusions to protect standard styles */
                .letterhead-container,
                .letterhead-container *,
                .doc-header-wrapper,
                .doc-header-wrapper *,
                .meta-line,
                .meta-line *,
                .lh-right,
                .lh-right *,
                .lh-center,
                .lh-center *,
                .lh-left,
                .lh-left *,
                .subject-title,
                .subject-title *,
                .signature-block,
                .signature-block * {
                    font-style: normal !important;
                }
            `;
        }

        // Apply styles initially
        applyStyles(savedSize, savedItalic, savedColor);

        // 5. Create Controls UI widget
        const card = document.createElement('div');
        card.className = 'font-settings-card';
        card.innerHTML = `
            <div class="font-settings-title">
                🎨 अक्षर र सजावट सेटिङ (Font & Styling)
            </div>
            <div class="font-settings-row">
                <span class="font-settings-label">अक्षरको साइज (Size):</span>
                <div class="font-settings-control">
                    <input type="range" class="font-settings-slider" id="fsSlider" min="12" max="28" value="${savedSize}">
                    <span class="font-settings-val" id="fsVal">${savedSize} pt</span>
                </div>
            </div>
            <div class="font-settings-row">
                <span class="font-settings-label">छड्के अक्षर (Italic):</span>
                <div class="font-settings-control">
                    <label class="font-settings-switch">
                        <input type="checkbox" id="fsItalic" ${savedItalic ? 'checked' : ''}>
                        <span class="slider-toggle"></span>
                    </label>
                </div>
            </div>
            <div class="font-settings-row">
                <span class="font-settings-label">अक्षरको रङ्ग (Color):</span>
                <div class="font-settings-control">
                    <div class="color-presets">
                        <div class="color-preset" style="background-color: #000000;" data-color="#000000" title="Black"></div>
                        <div class="color-preset" style="background-color: #1e3a8a;" data-color="#1e3a8a" title="Dark Blue"></div>
                        <div class="color-preset" style="background-color: #7f1d1d;" data-color="#7f1d1d" title="Dark Red"></div>
                        <div class="color-preset" style="background-color: #064e3b;" data-color="#064e3b" title="Dark Green"></div>
                    </div>
                    <input type="color" class="font-settings-color" id="fsColor" value="${savedColor}">
                </div>
            </div>
        `;

        // Insert widget above print button in the sidebar panel
        if (btnPrint.parentNode) {
            btnPrint.parentNode.insertBefore(card, btnPrint);
        }

        // 6. Bind events
        const slider = document.getElementById('fsSlider');
        const valLabel = document.getElementById('fsVal');
        const italicCheckbox = document.getElementById('fsItalic');
        const colorPicker = document.getElementById('fsColor');

        slider.addEventListener('input', (e) => {
            const sz = e.target.value;
            valLabel.textContent = `${sz} pt`;
            localStorage.setItem('doc_font_size', sz);
            applyStyles(sz, italicCheckbox.checked, colorPicker.value);
        });

        italicCheckbox.addEventListener('change', (e) => {
            const it = e.target.checked;
            localStorage.setItem('doc_font_style', it ? 'italic' : 'normal');
            applyStyles(slider.value, it, colorPicker.value);
        });

        colorPicker.addEventListener('input', (e) => {
            const col = e.target.value;
            localStorage.setItem('doc_text_color', col);
            applyStyles(slider.value, italicCheckbox.checked, col);
        });

        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const col = preset.getAttribute('data-color');
                colorPicker.value = col;
                localStorage.setItem('doc_text_color', col);
                applyStyles(slider.value, italicCheckbox.checked, col);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFontSettings);
    } else {
        initFontSettings();
    }
})();
