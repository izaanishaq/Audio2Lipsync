// UI Controller Module
class UIController {
    constructor() {
        this.initializeEventListeners();
        this.initializeSteps();
    }

    initializeEventListeners() {
        // Hold/Pause control
        const holdPauseEl = document.getElementById('holdPause');
        const holdPauseValueEl = document.getElementById('holdPauseValue');
        if (holdPauseEl && holdPauseValueEl) {
            holdPauseEl.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                let label = 'Quick';
                if (value <= 1) {
                    label = 'Ultra-Fast';
                } else if (value <= 3) {
                    label = 'Quick';
                } else if (value <= 6) {
                    label = 'Balanced';
                }
                holdPauseValueEl.textContent = `${value} (${label})`;
                setTimeout(() => this.updateDefaultButtonsState(), 100);
            });
        }
        
        // Phoneme bias control
        const phonemeBiasEl = document.getElementById('phonemeBias');
        const phonemeBiasValueEl = document.getElementById('phonemeBiasValue');
        if (phonemeBiasEl && phonemeBiasValueEl) {
            phonemeBiasEl.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                let label = 'Balanced';
                if (value <= 0.2) {
                    label = 'Low Sensitivity';
                } else if (value <= 0.4) {
                    label = 'Moderate';
                } else if (value <= 0.6) {
                    label = 'Balanced';
                } else if (value <= 0.8) {
                    label = 'High Sensitivity';
                } else {
                    label = 'Very High';
                }
                phonemeBiasValueEl.textContent = `${value} (${label})`;
                setTimeout(() => this.updateDefaultButtonsState(), 100);
            });
        }

        // Individual shape bias controls
        const shapeBiasIds = ['biasAa', 'biasEe', 'biasOh', 'biasUh', 'biasD', 'biasS', 'biasM', 'biasL', 'biasR', 'biasF'];
        shapeBiasIds.forEach(id => {
            const slider = document.getElementById(id);
            const valueDisplay = document.getElementById(id + 'Value');
            if (slider && valueDisplay) {
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    valueDisplay.textContent = value.toFixed(1);
                    console.log(`Shape bias updated: ${id} = ${value}`);
                    // Update button states when settings change
                    setTimeout(() => this.updateDefaultButtonsState(), 100);
                });
            }
        });

        // Preset button handlers
        this.setupPresetButtons();
        
        // Additional advanced setting controls
        this.setupAdvancedControls();
    }

    setupPresetButtons() {
        const presetNatural = document.getElementById('presetNatural');
        const presetBoostDES = document.getElementById('presetBoostDES');
        const presetBalanced = document.getElementById('presetBalanced');
        const presetVowelFocus = document.getElementById('presetVowelFocus');
        const presetConsonantFocus = document.getElementById('presetConsonantFocus');

        if (presetNatural) {
            presetNatural.addEventListener('click', () => {
                console.log('Applying Natural Speech preset...');
                // Based on English language natural frequencies
                this.setShapeBias('biasUh', 1.5);  // Most common
                this.setShapeBias('biasAa', 1.2);  // Common open vowel
                this.setShapeBias('biasEe', 1.8);  // Boost for visibility
                this.setShapeBias('biasOh', 1.1);  // Moderate
                this.setShapeBias('biasS', 1.6);   // Boost sibilants
                this.setShapeBias('biasM', 1.3);   // Moderate bilabials
                this.setShapeBias('biasD', 1.7);   // Boost plosives
                this.setShapeBias('biasL', 1.2);   // Moderate liquids
                this.setShapeBias('biasR', 1.2);   // Moderate rhotics
                this.setShapeBias('biasF', 1.0);   // Keep fricatives normal
                console.log('Natural speech distribution applied!');
                setTimeout(() => this.updateDefaultButtonsState(), 200);
            });
        }

        if (presetBoostDES) {
            presetBoostDES.addEventListener('click', () => {
                console.log('Applying Boost D, Ee, S preset...');
                this.setShapeBias('biasD', 2.2);
                this.setShapeBias('biasEe', 2.0);
                this.setShapeBias('biasS', 2.1);
                // Reduce others slightly to balance
                this.setShapeBias('biasAa', 0.8);
                this.setShapeBias('biasUh', 0.8);
                this.setShapeBias('biasOh', 0.8);
                console.log('D, Ee, S shapes boosted!');
                setTimeout(() => this.updateDefaultButtonsState(), 200);
            });
        }

        if (presetBalanced) {
            presetBalanced.addEventListener('click', () => {
                console.log('Resetting all shape biases to 1.0...');
                const shapeBiasIds = ['biasAa', 'biasEe', 'biasOh', 'biasUh', 'biasD', 'biasS', 'biasM', 'biasL', 'biasR', 'biasF'];
                shapeBiasIds.forEach(id => this.setShapeBias(id, 1.0));
                setTimeout(() => this.updateDefaultButtonsState(), 200);
            });
        }

        if (presetVowelFocus) {
            presetVowelFocus.addEventListener('click', () => {
                console.log('Applying Vowel Focus preset...');
                this.setShapeBias('biasAa', 1.8);
                this.setShapeBias('biasEe', 1.6);
                this.setShapeBias('biasOh', 1.7);
                this.setShapeBias('biasUh', 1.5);
                // Reduce consonants
                this.setShapeBias('biasD', 0.7);
                this.setShapeBias('biasS', 0.6);
                this.setShapeBias('biasM', 0.8);
                this.setShapeBias('biasL', 0.7);
                this.setShapeBias('biasR', 0.7);
                this.setShapeBias('biasF', 0.6);
                setTimeout(() => this.updateDefaultButtonsState(), 200);
            });
        }

        if (presetConsonantFocus) {
            presetConsonantFocus.addEventListener('click', () => {
                console.log('Applying Consonant Focus preset...');
                this.setShapeBias('biasD', 1.8);
                this.setShapeBias('biasS', 1.6);
                this.setShapeBias('biasM', 1.7);
                this.setShapeBias('biasL', 1.5);
                this.setShapeBias('biasR', 1.6);
                this.setShapeBias('biasF', 1.4);
                // Reduce vowels
                this.setShapeBias('biasAa', 0.8);
                this.setShapeBias('biasEe', 0.7);
                this.setShapeBias('biasOh', 0.8);
                this.setShapeBias('biasUh', 0.7);
                setTimeout(() => this.updateDefaultButtonsState(), 200);
            });
        }
    }

    setupAdvancedControls() {
        // Audio Sensitivity control
        const sensitivityEl = document.getElementById('sensitivity');
        const sensitivityValueEl = document.getElementById('sensitivityValue');
        if (sensitivityEl && sensitivityValueEl) {
            sensitivityEl.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                sensitivityValueEl.textContent = value.toFixed(1);
                console.log(`Audio sensitivity updated: ${value}`);
                setTimeout(() => this.updateDefaultButtonsState(), 100);
            });
        }

        // Smoothing control
        const smoothingEl = document.getElementById('smoothing');
        const smoothingValueEl = document.getElementById('smoothingValue');
        if (smoothingEl && smoothingValueEl) {
            smoothingEl.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                smoothingValueEl.textContent = value;
                console.log(`Smoothing updated: ${value}`);
                setTimeout(() => this.updateDefaultButtonsState(), 100);
            });
        }

        // Background color control
        const videoBgColorEl = document.getElementById('videoBgColor');
        if (videoBgColorEl) {
            videoBgColorEl.addEventListener('input', (e) => {
                const color = e.target.value;
                this.updateColorPreview(color);
                console.log(`Background color updated: ${color}`);
                setTimeout(() => this.updateDefaultButtonsState(), 100);
            });
        }

        // Video quality control
        const videoQualityEl = document.getElementById('videoQuality');
        if (videoQualityEl) {
            videoQualityEl.addEventListener('change', (e) => {
                const quality = e.target.value;
                console.log(`Video quality updated: ${quality}`);
                setTimeout(() => this.updateDefaultButtonsState(), 100);
            });
        }
        
        // Set as Default and Load Default buttons
        this.setupDefaultsButtons();
        
        // Initialize default values display
        this.updateAdvancedSettingsDisplay();
    }

    updateAdvancedSettingsDisplay() {
        // Update initial display values for all controls
        const sensitivityEl = document.getElementById('sensitivity');
        const sensitivityValueEl = document.getElementById('sensitivityValue');
        if (sensitivityEl && sensitivityValueEl) {
            sensitivityValueEl.textContent = parseFloat(sensitivityEl.value).toFixed(1);
        }

        const smoothingEl = document.getElementById('smoothing');
        const smoothingValueEl = document.getElementById('smoothingValue');
        if (smoothingEl && smoothingValueEl) {
            smoothingValueEl.textContent = smoothingEl.value;
        }

        const holdPauseEl = document.getElementById('holdPause');
        const holdPauseValueEl = document.getElementById('holdPauseValue');
        if (holdPauseEl && holdPauseValueEl) {
            const value = parseInt(holdPauseEl.value);
            let label = 'Quick';
            if (value <= 1) label = 'Ultra-Fast';
            else if (value <= 3) label = 'Quick';
            else if (value <= 6) label = 'Balanced';
            holdPauseValueEl.textContent = `${value} (${label})`;
        }

        const phonemeBiasEl = document.getElementById('phonemeBias');
        const phonemeBiasValueEl = document.getElementById('phonemeBiasValue');
        if (phonemeBiasEl && phonemeBiasValueEl) {
            const value = parseFloat(phonemeBiasEl.value);
            let label = 'Balanced';
            if (value <= 0.2) label = 'Low Sensitivity';
            else if (value <= 0.4) label = 'Moderate';
            else if (value <= 0.6) label = 'Balanced';
            else if (value <= 0.8) label = 'High Sensitivity';
            else label = 'Very High';
            phonemeBiasValueEl.textContent = `${value} (${label})`;
        }
        
        // Update default buttons state
        this.updateDefaultButtonsState();
    }

    updateDefaultButtonsState() {
        const loadDefaultBtn = document.getElementById('loadDefaultBtn');
        const hasSavedDefaults = localStorage.getItem('lipSyncDefaultSettings') !== null;
        
        if (loadDefaultBtn) {
            loadDefaultBtn.disabled = !hasSavedDefaults;
            if (hasSavedDefaults) {
                const hasChanges = this.hasUnsavedChanges();
                loadDefaultBtn.innerHTML = hasChanges 
                    ? '<i class="fas fa-exclamation-triangle"></i> Load Saved' 
                    : '<i class="fas fa-check"></i> Current';
                loadDefaultBtn.className = hasChanges 
                    ? 'btn btn-warning' 
                    : 'btn btn-success';
                loadDefaultBtn.style.fontSize = '0.8rem';
                loadDefaultBtn.style.padding = '0.4rem 0.8rem';
            } else {
                loadDefaultBtn.innerHTML = '<i class="fas fa-times"></i> No Saved';
                loadDefaultBtn.className = 'btn btn-secondary';
                loadDefaultBtn.style.fontSize = '0.8rem';
                loadDefaultBtn.style.padding = '0.4rem 0.8rem';
            }
        }
    }

    setShapeBias(id, value) {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(id + 'Value');
        if (slider && valueDisplay) {
            slider.value = value;
            valueDisplay.textContent = value.toFixed(1);
            console.log(`Set ${id} to ${value}`);
        }
    }

    initializeSteps() {
        // Show step 1 initially
        this.showStep(1);
    }

    updateColorPreview(color) {
        const colorPreview = document.getElementById('colorPreview');
        if (colorPreview) {
            colorPreview.style.backgroundColor = color;
            colorPreview.textContent = color.toUpperCase();
            colorPreview.style.color = this.getContrastColor(color);
        }
    }

    getContrastColor(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        // Calculate brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        // Return black or white based on brightness
        return brightness > 128 ? '#000000' : '#ffffff';
    }

    // Progressive disclosure methods
    showStep(stepNumber) {
        const step = document.getElementById(`step${stepNumber}`);
        const indicator = document.getElementById(`indicator${stepNumber}`);
        
        if (step) {
            step.classList.remove('step-hidden');
            step.classList.add('step-active');
        }
        if (indicator) {
            indicator.classList.add('active');
        }
    }

    completeStep(stepNumber) {
        const indicator = document.getElementById(`indicator${stepNumber}`);
        if (indicator) {
            indicator.classList.remove('active');
            indicator.classList.add('completed');
            indicator.innerHTML = '<i class="fas fa-check"></i>';
        }
    }

    showResultSections() {
        const previewSection = document.getElementById('previewSection');
        const downloadSection = document.getElementById('downloadSection');
        
        if (previewSection) {
            previewSection.classList.remove('hidden');
        }
        if (downloadSection) {
            downloadSection.classList.remove('hidden');
        }
        
        // Enable download buttons
        const downloadFramesBtn = document.getElementById('downloadFramesBtn');
        const downloadVideoBtn = document.getElementById('downloadVideoBtn');
        
        if (downloadFramesBtn) {
            downloadFramesBtn.disabled = false;
        }
        if (downloadVideoBtn) {
            downloadVideoBtn.disabled = false;
        }
    }

    updateProgress(percent, message) {
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressContainer) {
            progressContainer.classList.remove('hidden');
        }
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        if (progressText) {
            progressText.textContent = message;
        }
    }

    hideProgress() {
        const progressContainer = document.getElementById('progressContainer');
        if (progressContainer) {
            progressContainer.classList.add('hidden');
        }
    }

    updateGenerateButton(enabled, text = null) {
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.disabled = !enabled;
            if (text) {
                generateBtn.innerHTML = text;
            }
        }
    }

    showError(message) {
        alert(message); // Simple alert for now, can be enhanced later
        console.error(message);
    }

    showSuccess(message) {
        alert(message); // Simple alert for now, can be enhanced later
        console.log(message);
    }

    // Advanced settings helpers
    getAdvancedSettings() {
        return {
            sensitivity: parseFloat(document.getElementById('sensitivity')?.value || 1.4),
            smoothing: parseInt(document.getElementById('smoothing')?.value || 3),
            holdPause: parseInt(document.getElementById('holdPause')?.value || 1),
            phonemeBias: parseFloat(document.getElementById('phonemeBias')?.value || 0.5),
            videoBgColor: document.getElementById('videoBgColor')?.value || '#000000',
            videoQuality: document.getElementById('videoQuality')?.value || 'HD',
            shapeBiases: {
                Aa: parseFloat(document.getElementById('biasAa')?.value || 1.0),
                Ee: parseFloat(document.getElementById('biasEe')?.value || 1.0),
                Oh: parseFloat(document.getElementById('biasOh')?.value || 1.0),
                Uh: parseFloat(document.getElementById('biasUh')?.value || 1.0),
                D: parseFloat(document.getElementById('biasD')?.value || 1.0),
                S: parseFloat(document.getElementById('biasS')?.value || 1.0),
                M: parseFloat(document.getElementById('biasM')?.value || 1.0),
                L: parseFloat(document.getElementById('biasL')?.value || 1.0),
                R: parseFloat(document.getElementById('biasR')?.value || 1.0),
                F: parseFloat(document.getElementById('biasF')?.value || 1.0)
            }
        };
    }

    validateSettings() {
        const settings = this.getAdvancedSettings();
        const warnings = [];

        // Check for extreme values
        if (settings.sensitivity < 0.5 || settings.sensitivity > 2.0) {
            warnings.push(`Audio sensitivity (${settings.sensitivity}) is at an extreme value`);
        }

        if (settings.smoothing > 8) {
            warnings.push(`High smoothing (${settings.smoothing}) may cause overly slow animation`);
        }

        // Check if all shape biases are too low
        const avgBias = Object.values(settings.shapeBiases).reduce((a, b) => a + b, 0) / 10;
        if (avgBias < 0.6) {
            warnings.push(`Very low average shape bias (${avgBias.toFixed(1)}) may reduce detection quality`);
        }

        // Check if there are saved defaults
        const hasSavedDefaults = localStorage.getItem('lipSyncDefaultSettings') !== null;

        if (warnings.length > 0) {
            console.warn('Advanced Settings Warnings:', warnings);
            return { valid: true, warnings, hasSavedDefaults };
        }

        console.log('Advanced settings validated successfully');
        return { valid: true, warnings: [], hasSavedDefaults };
    }

    // Helper method to check if current settings differ from defaults
    hasUnsavedChanges() {
        try {
            const savedSettings = localStorage.getItem('lipSyncDefaultSettings');
            if (!savedSettings) return false;

            const currentSettings = this.getAdvancedSettings();
            const defaultSettings = JSON.parse(savedSettings);

            // Deep comparison
            return JSON.stringify(currentSettings) !== JSON.stringify(defaultSettings);
        } catch (error) {
            return false;
        }
    }

    // Get settings summary for display
    getSettingsSummary() {
        const settings = this.getAdvancedSettings();
        const shapeBiasesAbove1 = Object.values(settings.shapeBiases).filter(v => v > 1.0).length;
        const shapeBiasesBelow1 = Object.values(settings.shapeBiases).filter(v => v < 1.0).length;
        
        return {
            audioSensitivity: settings.sensitivity,
            smoothingLevel: settings.smoothing,
            timingSpeed: settings.holdPause <= 4 ? 'Fast' : settings.holdPause <= 6 ? 'Normal' : 'Slow',
            shapeBiasesModified: shapeBiasesAbove1 + shapeBiasesBelow1,
            backgroundCustomized: settings.videoBgColor !== '#000000',
            qualityMode: settings.videoQuality
        };
    }

    setupDefaultsButtons() {
        const setAsDefaultBtn = document.getElementById('setAsDefaultBtn');
        const loadDefaultBtn = document.getElementById('loadDefaultBtn');

        if (setAsDefaultBtn) {
            setAsDefaultBtn.addEventListener('click', () => {
                this.saveCurrentAsDefault();
            });
        }

        if (loadDefaultBtn) {
            loadDefaultBtn.addEventListener('click', () => {
                this.loadSavedDefaults();
            });
        }
        
        // Load saved defaults on initialization if they exist
        this.loadSavedDefaults(true); // Silent load on startup
    }

    saveCurrentAsDefault() {
        try {
            const currentSettings = this.getAdvancedSettings();
            
            // Save to localStorage
            localStorage.setItem('lipSyncDefaultSettings', JSON.stringify(currentSettings));
            
            console.log('Current settings saved as default:', currentSettings);
            
            // Show success message with details
            const settingsCount = Object.keys(currentSettings.shapeBiases).length + 6; // 6 other settings + shape biases
            this.showSuccess(`✅ Settings Saved!\n\nYour current ${settingsCount} advanced settings have been saved as the new default.\n\nThese will be loaded automatically when you visit this page.`);
            
            // Update button states
            const loadDefaultBtn = document.getElementById('loadDefaultBtn');
            if (loadDefaultBtn) {
                loadDefaultBtn.disabled = false;
                loadDefaultBtn.innerHTML = '<i class="fas fa-undo"></i> Load Saved';
            }
            
        } catch (error) {
            console.error('Failed to save default settings:', error);
            this.showError('Failed to save settings. Please try again.');
        }
    }

    loadSavedDefaults(silent = false) {
        try {
            const savedSettings = localStorage.getItem('lipSyncDefaultSettings');
            
            if (!savedSettings) {
                if (!silent) {
                    this.showError('No saved default settings found. Use "Set Current as Default" first.');
                }
                return false;
            }

            const settings = JSON.parse(savedSettings);
            
            // Apply all saved settings
            this.applyAdvancedSettings(settings);
            
            if (!silent) {
                console.log('Loaded saved default settings:', settings);
                this.showSuccess('✅ Default Settings Loaded!\n\nYour saved settings have been restored.');
            }
            
            return true;
            
        } catch (error) {
            console.error('Failed to load default settings:', error);
            if (!silent) {
                this.showError('Failed to load saved settings. They may be corrupted.');
            }
            return false;
        }
    }

    applyAdvancedSettings(settings) {
        // Apply basic settings
        this.setElementValue('sensitivity', settings.sensitivity, (val) => val.toFixed(1));
        this.setElementValue('smoothing', settings.smoothing);
        this.setElementValue('holdPause', settings.holdPause, (val) => {
            let label = 'Quick';
            if (val <= 1) label = 'Ultra-Fast';
            else if (val <= 3) label = 'Quick';
            else if (val <= 6) label = 'Balanced';
            return `${val} (${label})`;
        });
        this.setElementValue('phonemeBias', settings.phonemeBias, (val) => {
            let label = 'Balanced';
            if (val <= 0.2) label = 'Low Sensitivity';
            else if (val <= 0.4) label = 'Moderate';
            else if (val <= 0.6) label = 'Balanced';
            else if (val <= 0.8) label = 'High Sensitivity';
            else label = 'Very High';
            return `${val} (${label})`;
        });
        this.setElementValue('videoBgColor', settings.videoBgColor);
        this.setElementValue('videoQuality', settings.videoQuality);
        
        // Apply shape biases
        Object.keys(settings.shapeBiases).forEach(shapeName => {
            const biasId = `bias${shapeName}`;
            const value = settings.shapeBiases[shapeName];
            this.setShapeBias(biasId, value);
        });
        
        // Update color preview
        if (settings.videoBgColor) {
            this.updateColorPreview(settings.videoBgColor);
        }
        
        console.log('All settings applied successfully');
    }

    setElementValue(elementId, value, formatter = null) {
        const element = document.getElementById(elementId);
        const valueElement = document.getElementById(elementId + 'Value');
        
        if (element) {
            element.value = value;
            
            if (valueElement && formatter) {
                valueElement.textContent = formatter(value);
            } else if (valueElement) {
                valueElement.textContent = value;
            }
        }
    }
}

// Export for use in main script
window.UIController = UIController;
