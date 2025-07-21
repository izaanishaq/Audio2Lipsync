// Main Lip-Sync Generator - Simplified and Modular
console.log('script-main.js loaded');

class LipSyncGenerator {
    constructor() {
        console.log('LipSyncGenerator constructor called');
        this.audioFile = null;
        this.imageFiles = [];
        this.imageDataURLs = []; // Store data URLs for video export
        this.animationFrames = [];
        this.isGenerating = false;
        this.previewInterval = null;
        this.currentFrame = 0;
        this.isExporting = false;
        this.mouthShapeMap = null;
        this.uploadedMouthShapes = {};
        
        try {
            // Initialize modules
            console.log('Initializing modules...');
            this.audioProcessor = new AudioProcessor();
            this.phonemeDetector = new PhonemeDetectorNatural();
            this.uiController = new UIController();
            console.log('Modules initialized successfully');
            
            // Initialize predefined mouth shapes
            this.initializePredefinedMouthShapes();
            
            // Initialize event listeners
            this.initializeEventListeners();
            this.initializeAudioContext();
            this.checkBrowserSupport();
            
            // Initialize button states
            this.updatePlaybackButtons(false);
            
            console.log('LipSyncGenerator initialization complete');
        } catch (error) {
            console.error('Error during LipSyncGenerator initialization:', error);
        }
    }

    async initializeAudioContext() {
        const success = await this.audioProcessor.initializeAudioContext();
        if (!success) {
            this.uiController.showError('Failed to initialize audio context. Some features may not work.');
        }
    }

    initializeEventListeners() {
        console.log('Initializing event listeners...');
        
        // Audio upload
        const audioUpload = document.getElementById('audioUpload');
        const audioFileInput = document.getElementById('audioFile');
        
        console.log('Audio elements found:', { audioUpload: !!audioUpload, audioFileInput: !!audioFileInput });
        
        if (audioUpload && audioFileInput) {
            console.log('Setting up audio upload listeners...');
            audioUpload.addEventListener('click', () => {
                console.log('Audio upload clicked, triggering file input...');
                try {
                    audioFileInput.click();
                    console.log('File input click triggered successfully');
                } catch (error) {
                    console.error('Error triggering file input:', error);
                }
            });
            audioFileInput.addEventListener('change', (e) => {
                console.log('Audio file input changed:', e.target.files);
                this.handleAudioUpload(e);
            });
            console.log('Audio upload listeners set up successfully');
        } else {
            console.error('Audio upload elements not found!');
        }
        
        // Images upload
        const imagesUpload = document.getElementById('imagesUpload');
        const imageFilesInput = document.getElementById('imageFiles');
        
        if (imagesUpload && imageFilesInput) {
            imagesUpload.addEventListener('click', () => imageFilesInput.click());
            imageFilesInput.addEventListener('change', (e) => this.handleImagesUpload(e));
        }
        
        // Generate button
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateAnimation());
        }
        
        // Audio controls
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (playBtn) playBtn.addEventListener('click', () => this.playPreview());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pausePreview());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopPreview());
        
        // Download buttons
        const downloadFramesBtn = document.getElementById('downloadFramesBtn');
        const downloadVideoBtn = document.getElementById('downloadVideoBtn');
        
        if (downloadFramesBtn) downloadFramesBtn.addEventListener('click', () => this.downloadFrames());
        if (downloadVideoBtn) downloadVideoBtn.addEventListener('click', () => this.downloadVideo());
        
        // Modal buttons - add direct event listeners
        const expandGridBtn = document.getElementById('expandGridBtn');
        if (expandGridBtn) {
            expandGridBtn.addEventListener('click', () => this.openMouthShapesModal());
        }
        
        // Drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const audioUpload = document.getElementById('audioUpload');
        const imagesUpload = document.getElementById('imagesUpload');
        
        [audioUpload, imagesUpload].filter(element => element !== null).forEach(element => {
            element.addEventListener('dragover', (e) => {
                e.preventDefault();
                element.classList.add('drag-over');
            });
            
            element.addEventListener('dragleave', (e) => {
                e.preventDefault();
                element.classList.remove('drag-over');
            });
            
            element.addEventListener('drop', (e) => {
                e.preventDefault();
                element.classList.remove('drag-over');
                
                const files = Array.from(e.dataTransfer.files);
                if (element === audioUpload && files.length > 0 && files[0].type.startsWith('audio/')) {
                    this.handleAudioFile(files[0]);
                } else if (element === imagesUpload && files.length > 0) {
                    const imageFiles = files.filter(file => file.type === 'image/svg+xml');
                    if (imageFiles.length > 0) {
                        this.handleImageFiles(imageFiles);
                    }
                }
            });
        });
    }

    // Check browser support for required features
    checkBrowserSupport() {
        const checks = {
            audioContext: !!(window.AudioContext || window.webkitAudioContext),
            mediaRecorder: !!window.MediaRecorder,
            canvasStream: !!HTMLCanvasElement.prototype.captureStream,
            fileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
            webAudio: !!window.AudioContext
        };

        console.log('Browser compatibility:', checks);

        const unsupported = Object.entries(checks)
            .filter(([feature, supported]) => !supported)
            .map(([feature]) => feature);

        if (unsupported.length > 0) {
            console.warn('Unsupported features:', unsupported);
            if (!checks.audioContext) {
                this.uiController.showError('Web Audio API is not supported in this browser. Please use a modern browser.');
            }
        }
        
        // Check supported video formats
        if (checks.mediaRecorder) {
            const supportedFormats = this.checkSupportedVideoFormats();
            if (supportedFormats.length > 0) {
                const hasMP4 = supportedFormats.some(f => f.includes('mp4'));
                const formatInfo = hasMP4 ? 'MP4 and WebM' : 'WebM only';
                console.log(`Video export: ${formatInfo} formats available`);
                
                // Update UI with format information
                this.updateVideoFormatUI();
            }
        }
        
        return checks;
    }

    // Predefined mouth shapes initialization
    initializePredefinedMouthShapes() {
        this.predefinedMouthShapes = {
            'Neutral': { phonemes: ['silence', 'pause'], priority: 1, description: 'Closed mouth for silence' },
            'M': { phonemes: ['m', 'p', 'b'], priority: 2, description: 'Lips pressed together' },
            'S': { phonemes: ['s', 'z', 'th'], priority: 3, description: 'Tongue against teeth' },
            'D': { phonemes: ['d', 't', 'n', 'l'], priority: 4, description: 'Tongue to roof of mouth' },
            'Ee': { phonemes: ['ee', 'i', 'y'], priority: 5, description: 'Wide smile shape' },
            'Aa': { phonemes: ['aa', 'a', 'ah'], priority: 6, description: 'Open mouth for vowels' },
            'Uh': { phonemes: ['uh', 'u', 'er'], priority: 7, description: 'Neutral open mouth' },
            'Oh': { phonemes: ['oh', 'o', 'aw'], priority: 8, description: 'Rounded lips' },
            'R': { phonemes: ['r'], priority: 9, description: 'Pursed lips for R sound' },
            'W-Oo': { phonemes: ['w', 'oo', 'qu'], priority: 10, description: 'Very rounded lips' },
            'F': { phonemes: ['f', 'v'], priority: 11, description: 'Lower lip to upper teeth' },
            'L': { phonemes: ['l'], priority: 12, description: 'Tongue visible' },
            'Smile': { phonemes: ['smile', 'happy'], priority: 13, description: 'Happy expression' },
            'Surprised': { phonemes: ['surprised', 'shock'], priority: 14, description: 'Wide open mouth' }
        };
        
        this.requiredMouthShapes = Object.keys(this.predefinedMouthShapes);
        this.uploadedMouthShapes = {};
    }

    handleAudioUpload(event) {
        console.log('handleAudioUpload called with:', event);
        const file = event.target.files[0];
        console.log('Selected file:', file);
        if (file) {
            console.log('File details:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            });
            this.handleAudioFile(file);
        } else {
            console.warn('No file selected');
        }
    }

    async handleAudioFile(file) {
        try {
            console.log('handleAudioFile called with:', file);
            this.audioFile = file;
            
            // Load audio for processing
            console.log('Loading audio file for processing...');
            await this.audioProcessor.loadAudioFile(file);
            console.log('Audio processor loaded successfully');
            
            // Load audio for preview playback
            const audioPreview = document.getElementById('previewAudio');
            if (audioPreview) {
                console.log('Setting up audio preview...');
                // Revoke any existing object URL to prevent memory leaks
                if (audioPreview.src && audioPreview.src.startsWith('blob:')) {
                    URL.revokeObjectURL(audioPreview.src);
                }
                
                const audioURL = URL.createObjectURL(file);
                audioPreview.src = audioURL;
                
                // Wait for audio to load
                await new Promise((resolve, reject) => {
                    audioPreview.onloadedmetadata = () => {
                        console.log('Audio loaded for preview:', {
                            duration: audioPreview.duration,
                            src: audioPreview.src
                        });
                        resolve();
                    };
                    audioPreview.onerror = (err) => {
                        console.error('Audio preview error:', err);
                        reject(err);
                    };
                    audioPreview.load();
                });
                
                console.log('Audio preview setup complete');
            } else {
                console.warn('Audio preview element not found');
            }
            
            // Update UI
            const audioInfo = document.getElementById('audioInfo');
            const audioFileName = document.getElementById('audioFileName');
            const audioUpload = document.getElementById('audioUpload');
            
            if (audioInfo && audioFileName && audioUpload) {
                audioFileName.textContent = file.name;
                audioInfo.classList.remove('hidden');
                audioUpload.classList.add('hidden');
            }
            
            // Progress to next step
            this.uiController.completeStep(1);
            this.uiController.showStep(2);
            
            this.checkGenerateButton();
            
        } catch (error) {
            console.error('Error loading audio file:', error);
            this.uiController.showError('Failed to load audio file. Please try a different format.');
        }
    }

    handleImagesUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            this.handleImageFiles(files);
        }
    }

    handleImageFiles(files) {
        this.imageFiles = files;
        this.imageDataURLs = []; // Reset data URLs array
        this.uploadedMouthShapes = {};
        
        // Load all images as data URLs for video export
        const loadPromises = files.map((file, index) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.imageDataURLs[index] = e.target.result;
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        });
        
        // Wait for all images to load, then continue processing
        Promise.all(loadPromises).then(() => {
            console.log(`✅ Loaded ${this.imageDataURLs.length} image data URLs for video export`);
            
            // Validate and categorize mouth shapes
            files.forEach(file => {
                const shapeName = this.validateMouthShapeFile(file);
                if (shapeName) {
                    this.uploadedMouthShapes[shapeName] = file;
                }
            });
            
            // Create standardized mapping
            this.createStandardizedMapping();
            
            // Update UI
            this.updateImagesUI();
            this.showStandardizedMapping();
            
            // Update library manager
            if (window.fileLibraryManager) {
                window.fileLibraryManager.updateLibraryButtons();
            }
            
            // Progress to next step
            this.uiController.completeStep(2);
            this.uiController.showStep(3);
            this.uiController.showStep(4);
            
            this.checkGenerateButton();
        });
    }

    validateMouthShapeFile(file) {
        if (file.type !== 'image/svg+xml' && !file.name.toLowerCase().endsWith('.svg')) {
            return null;
        }
        
        const fileName = file.name.toLowerCase().replace(/\.svg$/i, '');
        const cleanFileName = fileName
            .replace(/^(mouth_?|shape_?|frame_?|phoneme_?)/i, '')
            .replace(/[-_]/g, '');
        
        const exactMatches = {
            'neutral': 'Neutral',
            'm': 'M',
            's': 'S',
            'd': 'D',
            'ee': 'Ee',
            'aa': 'Aa',
            'uh': 'Uh',
            'oh': 'Oh',
            'r': 'R',
            'woo': 'W-Oo',
            'w-oo': 'W-Oo',
            'f': 'F',
            'l': 'L',
            'smile': 'Smile',
            'surprised': 'Surprised'
        };
        
        return exactMatches[cleanFileName] || exactMatches[fileName.replace(/\.svg$/i, '')];
    }

    createStandardizedMapping() {
        this.mouthShapeMap = {
            silence: [],
            consonants: [],
            vowels: [],
            expressions: [],
            all: []
        };
        
        // Categorize uploaded shapes
        Object.keys(this.uploadedMouthShapes).forEach(shapeName => {
            const shapeInfo = this.predefinedMouthShapes[shapeName];
            const fileIndex = this.imageFiles.findIndex(f => f === this.uploadedMouthShapes[shapeName]);
            const shapeData = {
                name: shapeName,
                file: this.uploadedMouthShapes[shapeName],
                index: fileIndex,
                dataURL: this.imageDataURLs[fileIndex], // Add dataURL for video export
                phonemes: shapeInfo.phonemes,
                description: shapeInfo.description
            };
            
            // Categorize by type
            if (shapeName === 'Neutral') {
                this.mouthShapeMap.silence.push(shapeData);
            } else if (['Smile', 'Surprised'].includes(shapeName)) {
                this.mouthShapeMap.expressions.push(shapeData);
            } else if (['Ee', 'Aa', 'Uh', 'Oh'].includes(shapeName)) {
                this.mouthShapeMap.vowels.push(shapeData);
            } else {
                this.mouthShapeMap.consonants.push(shapeData);
            }
            
            this.mouthShapeMap.all.push(shapeData);
        });
    }

    updateImagesUI() {
        const imagesInfo = document.getElementById('imagesInfo');
        const imageCount = document.getElementById('imageCount');
        const imagesUpload = document.getElementById('imagesUpload');
        const imagesPreview = document.getElementById('imagesPreview');
        
        if (imagesInfo && imageCount && imagesUpload && imagesPreview) {
            imageCount.textContent = this.imageFiles.length;
            imagesInfo.classList.remove('hidden');
            imagesUpload.classList.add('hidden');
            imagesPreview.classList.remove('hidden');
        }
        
        this.updateImagesGrid();
    }

    // Alias for library manager compatibility
    updateImageGallery() {
        this.updateImagesUI();
    }

    updateImagesGrid() {
        const imagesGrid = document.getElementById('imagesGrid');
        const imagesGridContainer = document.getElementById('imagesGridContainer');
        if (!imagesGrid) return;
        
        imagesGrid.innerHTML = '';
        
        // Add has-images class for proper styling
        if (imagesGridContainer && this.imageFiles.length > 0) {
            imagesGridContainer.classList.add('has-images');
        }
        
        this.imageFiles.slice(0, 8).forEach((file, index) => {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-preview-container';
            imageContainer.addEventListener('click', () => this.openMouthShapesModal());
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgSrc = e.target.result;
                const shapeName = this.getShapeDisplayName(file.name);
                const shapeDescription = this.getShapeDescription(shapeName);
                
                imageContainer.innerHTML = `
                    <div class="svg-container" style="width: 45px; height: 45px; background: rgba(255, 255, 255, 0.95); border-radius: 4px; display: flex; align-items: center; justify-content: center; padding: 2px; border: 1px solid var(--border);">
                        <img src="${imgSrc}" alt="${file.name}" class="image-preview" style="max-width: 100%; max-height: 100%; object-fit: contain; filter: none; opacity: 1;" />
                    </div>
                    <div class="shape-label">${shapeName}</div>
                    <div class="shape-description">${shapeDescription}</div>
                `;
            };
            reader.readAsDataURL(file);
            
            imagesGrid.appendChild(imageContainer);
        });
        
        if (this.imageFiles.length > 8) {
            const moreIndicator = document.createElement('div');
            moreIndicator.className = 'more-images-indicator';
            moreIndicator.innerHTML = `
                <div class="more-count">
                    <i class="fas fa-plus"></i>
                    <span>${this.imageFiles.length - 8} more</span>
                </div>
            `;
            moreIndicator.addEventListener('click', () => this.openMouthShapesModal());
            imagesGrid.appendChild(moreIndicator);
        }
        
        this.updateShapeCountBadge();
    }

    getShapeDisplayName(filename) {
        const shapeName = this.validateMouthShapeFile({ name: filename, type: 'image/svg+xml' });
        return shapeName || filename.replace(/\.(svg|png|jpg)$/i, '');
    }

    getShapeDescription(shapeName) {
        const descriptions = {
            'Neutral': 'Closed mouth for silence',
            'M': 'Lips pressed together',
            'S': 'Tongue against teeth',
            'D': 'Tongue to roof of mouth',
            'Ee': 'Wide smile shape',
            'Aa': 'Open mouth for vowels',
            'Uh': 'Neutral open mouth',
            'Oh': 'Rounded lips',
            'R': 'Pursed lips for R sound',
            'W-Oo': 'Very rounded lips',
            'F': 'Lower lip to upper teeth',
            'L': 'Tongue visible',
            'Smile': 'Happy expression',
            'Surprised': 'Wide open mouth'
        };
        return descriptions[shapeName] || 'Mouth shape';
    }

    showStandardizedMapping() {
        // Implementation for showing mouth shape mapping
        console.log('Mouth shapes mapped:', this.mouthShapeMap);
    }

    updateShapeCountBadge() {
        const shapeCountBadge = document.getElementById('shapeCountBadge');
        if (shapeCountBadge) {
            const count = this.imageFiles.length;
            shapeCountBadge.textContent = `${count} shape${count !== 1 ? 's' : ''}`;
            shapeCountBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    openMouthShapesModal() {
        const modal = document.getElementById('mouthShapesModal');
        const modalGrid = document.getElementById('modalImagesGrid');
        
        if (!modal || !modalGrid) {
            alert('Modal elements not found!');
            return;
        }
        
        if (!this.imageFiles || this.imageFiles.length === 0) {
            alert('No mouth shape images uploaded yet.');
            return;
        }
        
        modalGrid.innerHTML = '';
        
        this.imageFiles.forEach((file, index) => {
            const modalItem = document.createElement('div');
            modalItem.className = 'modal-image-item';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgSrc = e.target.result;
                const shapeName = this.getShapeDisplayName(file.name);
                const shapeDescription = this.getShapeDescription(shapeName);
                
                modalItem.innerHTML = `
                    <div class="modal-image-wrapper">
                        <div style="width: 100px; height: 100px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 4px; border: 1px solid #ddd; margin: 0 auto 0.5rem auto;">
                            <img src="${imgSrc}" alt="${file.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                        </div>
                    </div>
                    <div class="modal-image-info">
                        <div style="font-weight: 600; color: #fff; margin-bottom: 0.25rem;">${shapeName}</div>
                        <div style="font-size: 0.75rem; color: #aaa;">${file.name}</div>
                        <div style="font-size: 0.65rem; color: #888; margin-top: 0.25rem;">${shapeDescription}</div>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
            
            modalGrid.appendChild(modalItem);
        });
        
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    checkGenerateButton() {
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            const canGenerate = this.audioFile && this.imageFiles.length > 0;
            generateBtn.disabled = !canGenerate;
        }
    }

    async generateAnimation() {
        if (this.isGenerating) return;
        
        try {
            this.isGenerating = true;
            this.uiController.updateGenerateButton(false, '<i class="fas fa-spinner fa-spin"></i> Generating...');
            
            // Get settings
            const fps = parseInt(document.getElementById('fps')?.value || '24');
            const sensitivity = parseFloat(document.getElementById('sensitivity')?.value || '1');
            const smoothing = parseInt(document.getElementById('smoothing')?.value || '2');
            const mappingMode = document.getElementById('mappingMode')?.value || 'intelligent';
            
            // Show progress and add delays for visibility
            this.uiController.updateProgress(5, 'Starting generation...');
            await this.delayWithProgress(500, 300);
            
            // Extract audio features
            this.uiController.updateProgress(15, 'Loading audio...');
            await this.delayWithProgress(800, 500);
            
            const channelData = this.audioProcessor.audioBuffer.getChannelData(0);
            const duration = this.audioProcessor.audioBuffer.duration;
            
            // Calculate frames with proper rounding to ensure full audio coverage
            // Add a small buffer (0.1 seconds) to ensure we don't cut off audio at the end
            const bufferDuration = 0.1; // 100ms buffer
            const totalDurationWithBuffer = duration + bufferDuration;
            
            // Use Math.ceil to ensure we have enough frames to cover the entire audio + buffer
            const totalFrames = Math.ceil(totalDurationWithBuffer * fps);
            
            // Calculate samples per frame, but ensure we don't exceed available samples
            const totalSamples = channelData.length;
            const samplesPerFrame = Math.floor(totalSamples / Math.ceil(duration * fps)); // Use original duration for audio processing
            
            // Verify we're covering the full audio duration
            const calculatedDuration = totalFrames / fps;
            const coveragePercentage = (calculatedDuration / duration) * 100;
            
            console.log(`Audio Analysis (Enhanced):`);
            console.log(`- Audio duration: ${duration.toFixed(3)}s`);
            console.log(`- Audio + buffer: ${totalDurationWithBuffer.toFixed(3)}s`);
            console.log(`- Sample rate: ${this.audioProcessor.audioBuffer.sampleRate}Hz`);
            console.log(`- Total samples: ${totalSamples}`);
            console.log(`- FPS: ${fps}`);
            console.log(`- Total frames: ${totalFrames}`);
            console.log(`- Samples per frame: ${samplesPerFrame}`);
            console.log(`- Calculated duration: ${calculatedDuration.toFixed(3)}s`);
            console.log(`- Audio coverage: ${coveragePercentage.toFixed(1)}%`);
            
            // Ensure we have adequate coverage
            if (coveragePercentage < 100) {
                console.error('Critical: Animation duration is shorter than audio duration!');
                throw new Error(`Animation too short: ${coveragePercentage.toFixed(1)}% coverage. Please report this bug.`);
            } else if (coveragePercentage > 110) {
                console.warn('Animation significantly longer than audio, but this is acceptable for preventing cutoff');
            } else {
                console.log('✅ Animation duration properly covers audio with buffer');
            }
            
            this.uiController.updateProgress(30, 'Extracting audio features...');
            await this.delayWithProgress(600, 400);
            
            // Extract audio features for the original audio duration (without buffer frames)
            const audioFramesCount = Math.ceil(duration * fps); // Use original duration for audio processing
            const audioSamplesPerFrame = Math.floor(totalSamples / audioFramesCount);
            
            this.audioProcessor.audioFeatures = this.audioProcessor.extractAudioFeatures(
                channelData, 
                audioFramesCount, // Use audio-only frame count for processing
                audioSamplesPerFrame, 
                sensitivity,
                (progress, message) => this.uiController.updateProgress(30 + (progress * 0.4), message)
            );
            
            // Smooth features if needed
            if (smoothing > 0) {
                this.uiController.updateProgress(75, 'Smoothing audio features...');
                await this.delayWithProgress(700, 500);
                this.audioProcessor.smoothAudioFeatures(smoothing);
            }
            
            // Generate animation frames
            this.uiController.updateProgress(85, 'Generating mouth shapes...');
            await this.delayWithProgress(800, 600);
            this.generateAnimationFrames(totalFrames, mappingMode, audioFramesCount);
            
            // Render animation
            this.uiController.updateProgress(95, 'Rendering animation...');
            await this.delayWithProgress(600, 400);
            await this.renderAnimation();
            
            this.uiController.updateProgress(100, 'Complete!');
            await this.delayWithProgress(800, 600);
            
            this.uiController.showResultSections();
            
        } catch (error) {
            console.error('Error generating animation:', error);
            this.uiController.showError('Failed to generate animation. Please try again.');
        } finally {
            this.isGenerating = false;
            this.uiController.updateGenerateButton(true, '<i class="fas fa-magic"></i> Generate Animation');
            setTimeout(() => {
                this.uiController.hideProgress();
            }, 1000);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Enhanced delay with minimum display time for progress
    async delayWithProgress(ms, minDisplayTime = 100) {
        const start = Date.now();
        await this.delay(Math.max(ms, minDisplayTime));
        const elapsed = Date.now() - start;
        if (elapsed < minDisplayTime) {
            await this.delay(minDisplayTime - elapsed);
        }
    }

    generateAnimationFrames(totalFrames, mappingMode, audioFramesCount = null) {
        this.animationFrames = [];
        this.phonemeDetector.phonemeCounters = {};
        
        // Use audioFramesCount for audio processing, totalFrames for final animation length
        const audioProcessingFrames = audioFramesCount || totalFrames;
        
        console.log(`Generating ${totalFrames} animation frames (${audioProcessingFrames} audio-based, ${totalFrames - audioProcessingFrames} buffer frames)`);
        
        for (let frame = 0; frame < totalFrames; frame++) {
            let audioFrame;
            
            // For frames within the audio duration, use actual audio data
            if (frame < audioProcessingFrames) {
                audioFrame = {
                    volume: this.audioProcessor.audioFeatures.volume[frame] || 0,
                    energy: this.audioProcessor.audioFeatures.energy[frame] || 0,
                    spectralCentroid: this.audioProcessor.audioFeatures.spectralCentroid[frame] || 0,
                    zeroCrossingRate: this.audioProcessor.audioFeatures.zeroCrossingRate[frame] || 0,
                    dynamics: this.audioProcessor.audioFeatures.dynamics[frame] || 0,
                    spectralRolloff: this.audioProcessor.audioFeatures.spectralRolloff[frame] || 0,
                    spectralFlux: this.audioProcessor.audioFeatures.spectralFlux[frame] || 0,
                    formantFrequencies: this.audioProcessor.audioFeatures.formantFrequencies[frame] || []
                };
            } else {
                // For buffer frames beyond audio duration, use silence/neutral values
                audioFrame = {
                    volume: 0,
                    energy: 0,
                    spectralCentroid: 0,
                    zeroCrossingRate: 0,
                    dynamics: 0,
                    spectralRolloff: 0,
                    spectralFlux: 0,
                    formantFrequencies: []
                };
            }
            
            let selectedShape;
            
            // For buffer frames beyond audio duration, always use neutral/silence shape
            if (frame >= audioProcessingFrames) {
                // Force neutral shape for buffer frames
                selectedShape = this.selectNeutralShape();
            } else if (mappingMode === 'intelligent') {
                this.phonemeDetector.audioFeatures = this.audioProcessor.audioFeatures;
                selectedShape = this.phonemeDetector.selectMouthShape(
                    audioFrame, 
                    frame, 
                    this.mouthShapeMap, 
                    this.uploadedMouthShapes,
                    this.audioProcessor.audioBuffer
                );
            } else {
                selectedShape = this.selectVolumeBasedShape(audioFrame.volume);
            }
            
            // Ensure the shape has a dataURL for video export
            if (selectedShape) {
                if (typeof selectedShape.index === 'number' && this.imageDataURLs[selectedShape.index]) {
                    selectedShape.dataURL = this.imageDataURLs[selectedShape.index];
                } else if (!selectedShape.dataURL) {
                    // Fallback: use first available image if no valid index
                    console.warn('Shape missing valid dataURL, using fallback:', selectedShape);
                    selectedShape.dataURL = this.imageDataURLs[0];
                    selectedShape.index = 0;
                }
                
                // Final validation
                if (!selectedShape.dataURL) {
                    console.error('Critical error: Shape still missing dataURL after fallback!', selectedShape);
                    console.error('Available imageDataURLs:', this.imageDataURLs);
                }
            }
            
            this.animationFrames.push(selectedShape);
        }
        
        console.log('Final phoneme distribution:', this.phonemeDetector.phonemeCounters);
    }

    selectVolumeBasedShape(volume) {
        const numShapes = this.imageFiles.length;
        const shapeIndex = Math.floor(volume * numShapes);
        const clampedIndex = Math.max(0, Math.min(shapeIndex, numShapes - 1));
        
        return {
            index: clampedIndex,
            name: this.imageFiles[clampedIndex].name,
            category: 'volume',
            dataURL: this.imageDataURLs[clampedIndex] // Add dataURL for video export
        };
    }
    
    selectNeutralShape() {
        // Try to find the Neutral shape first
        if (this.mouthShapeMap && this.mouthShapeMap.silence && this.mouthShapeMap.silence.length > 0) {
            const neutralShape = this.mouthShapeMap.silence[0];
            return {
                index: neutralShape.index,
                name: neutralShape.name,
                category: 'silence',
                dataURL: neutralShape.dataURL
            };
        }
        
        // Fallback to first available shape
        return {
            index: 0,
            name: this.imageFiles[0]?.name || 'Unknown',
            category: 'fallback',
            dataURL: this.imageDataURLs[0]
        };
    }

    async renderAnimation() {
        const canvas = document.getElementById('previewCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.display = 'block';
        
        // Load first frame
        if (this.animationFrames.length > 0) {
            await this.renderFrame(ctx, 0);
        }
        
        // Hide placeholder
        const placeholder = document.getElementById('previewPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    }

    async renderFrame(ctx, frameIndex) {
        const frame = this.animationFrames[frameIndex];
        if (!frame) return;
        
        const file = frame.index !== undefined ? this.imageFiles[frame.index] : this.uploadedMouthShapes[frame.name];
        if (!file) return;
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Clear canvas
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    
                    // Draw centered image
                    const scale = Math.min(ctx.canvas.width / img.width, ctx.canvas.height / img.height) * 0.8;
                    const width = img.width * scale;
                    const height = img.height * scale;
                    const x = (ctx.canvas.width - width) / 2;
                    const y = (ctx.canvas.height - height) / 2;
                    
                    ctx.drawImage(img, x, y, width, height);
                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    playPreview() {
        if (!this.animationFrames.length) {
            this.uiController.showError('No animation generated yet. Generate animation first.');
            return;
        }
        
        const audioPreview = document.getElementById('previewAudio');
        const fps = parseInt(document.getElementById('fps')?.value || '24');
        const frameInterval = 1000 / fps;
        
        console.log('Starting preview playback:', {
            audioElement: audioPreview,
            audioSrc: audioPreview?.src,
            audioFile: this.audioFile,
            framesCount: this.animationFrames.length
        });
        
        // Stop any existing playback
        this.stopPreview();
        
        // Start audio playback
        if (audioPreview && audioPreview.src) {
            audioPreview.currentTime = 0;
            
            // Handle play promise for better browser compatibility
            const playPromise = audioPreview.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Audio playback started successfully');
                }).catch(error => {
                    console.warn('Audio autoplay prevented by browser:', error);
                    this.uiController.showError('Audio autoplay was blocked. Click play again or check your browser settings.');
                    return;
                });
            }
        } else {
            console.warn('No audio available for preview:', {
                audioElement: audioPreview,
                audioSrc: audioPreview?.src
            });
        }
        
        this.currentFrame = 0;
        const canvas = document.getElementById('previewCanvas');
        const ctx = canvas.getContext('2d');
        
        // Show canvas if hidden
        canvas.style.display = 'block';
        const placeholder = document.getElementById('previewPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        this.previewInterval = setInterval(async () => {
            await this.renderFrame(ctx, this.currentFrame);
            this.currentFrame++;
            
            if (this.currentFrame >= this.animationFrames.length) {
                this.stopPreview();
            }
        }, frameInterval);
        
        // Update button states
        this.updatePlaybackButtons(true);
    }

    pausePreview() {
        if (this.previewInterval) {
            clearInterval(this.previewInterval);
            this.previewInterval = null;
        }
        
        // Pause audio
        const audioPreview = document.getElementById('previewAudio');
        if (audioPreview) {
            audioPreview.pause();
        }
        
        // Update button states
        this.updatePlaybackButtons(false);
    }

    stopPreview() {
        this.pausePreview();
        this.currentFrame = 0;
        
        // Stop and reset audio
        const audioPreview = document.getElementById('previewAudio');
        if (audioPreview) {
            audioPreview.pause();
            audioPreview.currentTime = 0;
        }
        
        if (this.animationFrames.length > 0) {
            const canvas = document.getElementById('previewCanvas');
            const ctx = canvas.getContext('2d');
            this.renderFrame(ctx, 0);
        }
        
        // Update button states
        this.updatePlaybackButtons(false);
    }

    updatePlaybackButtons(isPlaying) {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (playBtn) {
            playBtn.disabled = isPlaying;
        }
        if (pauseBtn) {
            pauseBtn.disabled = !isPlaying;
        }
        if (stopBtn) {
            stopBtn.disabled = false;
        }
    }

    // Improved remove audio function
    removeAudio() {
        // Stop any playing audio
        this.stopPreview();
        
        // Clear audio file reference
        this.audioFile = null;
        
        // Clear audio processor
        if (this.audioProcessor) {
            this.audioProcessor.audioBuffer = null;
            this.audioProcessor.audioFeatures = null;
        }
        
        // Clear preview audio
        const audioPreview = document.getElementById('previewAudio');
        if (audioPreview) {
            audioPreview.pause();
            audioPreview.currentTime = 0;
            if (audioPreview.src && audioPreview.src.startsWith('blob:')) {
                URL.revokeObjectURL(audioPreview.src);
            }
            audioPreview.src = '';
            audioPreview.removeAttribute('src');
        }
        
        // Reset file input
        const audioFileInput = document.getElementById('audioFile');
        if (audioFileInput) {
            audioFileInput.value = '';
        }
        
        // Update UI
        const audioInfo = document.getElementById('audioInfo');
        const audioUpload = document.getElementById('audioUpload');
        
        if (audioInfo) audioInfo.classList.add('hidden');
        if (audioUpload) audioUpload.classList.remove('hidden');
        
        // Update button states
        this.checkGenerateButton();
        this.updatePlaybackButtons(false);
        
        console.log('Audio removed and cleared');
    }

    removeImages() {
        this.imageFiles = [];
        this.uploadedMouthShapes = {};
        this.mouthShapeMap = null;
        
        const imagesInfo = document.getElementById('imagesInfo');
        const imagesUpload = document.getElementById('imagesUpload');
        const imagesPreview = document.getElementById('imagesPreview');
        
        if (imagesInfo && imagesUpload && imagesPreview) {
            imagesInfo.classList.add('hidden');
            imagesUpload.classList.remove('hidden');
            imagesPreview.classList.add('hidden');
        }
        
        this.checkGenerateButton();
    }

    async downloadFrames() {
        if (!this.animationFrames || this.animationFrames.length === 0) {
            this.uiController.showError('No animation frames to download. Generate animation first.');
            return;
        }

        try {
            this.uiController.updateProgress(0, 'Preparing frame export...');
            
            // Test PNG conversion capability first
            const conversionTest = await this.testPNGConversion();
            if (!conversionTest) {
                throw new Error('PNG conversion test failed - browser may not support required features');
            }
            
            // Create a new ZIP file
            const zip = new JSZip();
            const framesFolder = zip.folder("animation_frames");
            
            this.uiController.updateProgress(10, 'Converting frames to PNG...');
            
            // Process each frame
            for (let i = 0; i < this.animationFrames.length; i++) {
                const frame = this.animationFrames[i];
                const progress = 10 + (i / this.animationFrames.length) * 70;
                this.uiController.updateProgress(progress, `Processing frame ${i + 1}/${this.animationFrames.length}...`);
                
                if (frame.dataURL) {
                    try {
                        // Debug: Log the frame data type
                        const dataType = frame.dataURL.substring(5, frame.dataURL.indexOf(';'));
                        console.log(`Processing frame ${i + 1}: ${dataType}`);
                        
                        // Convert frame to proper PNG format
                        const pngDataURL = await this.convertFrameToPNG(frame.dataURL);
                        const base64Data = pngDataURL.split(',')[1];
                        const filename = `frame_${String(i + 1).padStart(4, '0')}.png`;
                        
                        // Validate base64 data
                        if (!base64Data || base64Data.length < 100) {
                            throw new Error('Generated PNG data is too small or invalid');
                        }
                        
                        // Add frame to ZIP
                        framesFolder.file(filename, base64Data, { base64: true });
                        
                        // Add frame info to metadata
                        const frameInfo = {
                            index: i,
                            name: frame.name || 'Unknown',
                            category: frame.category || 'Unknown',
                            timestamp: (i / fps).toFixed(3) + 's', // Use actual FPS setting
                            originalFormat: dataType,
                            pngSize: base64Data.length
                        };
                        
                        framesFolder.file(`frame_${String(i + 1).padStart(4, '0')}_info.json`, JSON.stringify(frameInfo, null, 2));
                    } catch (error) {
                        console.error(`Error processing frame ${i + 1}:`, error);
                        // Skip this frame but continue processing
                    }
                } else {
                    console.warn(`Frame ${i} missing dataURL, skipping...`);
                }
                
                // Small delay to prevent UI blocking
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }
            
            this.uiController.updateProgress(80, 'Creating animation metadata...');
            
            // Add animation metadata
            const fps = parseInt(document.getElementById('fps')?.value || '24');
            const metadata = {
                totalFrames: this.animationFrames.length,
                duration: this.animationFrames.length / fps, // Use actual FPS
                fps: fps, // Use actual FPS setting
                generatedAt: new Date().toISOString(),
                audioFile: this.audioFile ? this.audioFile.name : 'Unknown',
                libraryUsed: Object.keys(this.uploadedMouthShapes || {}).join(', ') || 'Unknown'
            };
            
            zip.file("animation_info.json", JSON.stringify(metadata, null, 2));
            
            // Add README file
            const readme = `# Lip-Sync Animation Frames Export

## Contents
- animation_frames/ - PNG images of each animation frame
- animation_info.json - Metadata about the animation
- frame_XXXX_info.json - Individual frame information

## Details
- Total Frames: ${metadata.totalFrames}
- Duration: ${metadata.duration.toFixed(2)} seconds
- Frame Rate: ${metadata.fps} FPS
- Generated: ${metadata.generatedAt}
- Audio File: ${metadata.audioFile}
- Library Used: ${metadata.libraryUsed}

## Usage
These frames can be used with video editing software, game engines, or other animation tools.
Import the sequence as numbered frames starting from frame_0001.png.
`;
            
            zip.file("README.md", readme);
            
            this.uiController.updateProgress(90, 'Generating ZIP file...');
            
            // Generate ZIP file
            const content = await zip.generateAsync({ type: "blob" });
            
            this.uiController.updateProgress(95, 'Downloading...');
            
            // Create download link
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lipsync-frames-${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.uiController.updateProgress(100, 'Frame export complete!');
            await this.delayWithProgress(800, 600);
            this.uiController.showSuccess(`Successfully exported ${this.animationFrames.length} frames as PNG images!`);
            
            console.log(`Frame export completed: ${this.animationFrames.length} frames, ${(content.size / 1024 / 1024).toFixed(2)} MB`);
            
        } catch (error) {
            console.error('Error exporting frames:', error);
            this.uiController.showError(`Failed to export frames: ${error.message}`);
        }
    }

    async downloadVideo() {
        if (!this.animationFrames || this.animationFrames.length === 0) {
            this.uiController.showError('No animation to download. Generate animation first.');
            return;
        }

        if (!this.audioFile) {
            this.uiController.showError('No audio file available. Please upload audio first.');
            return;
        }

        // Validate that all frames have dataURLs
        const invalidFrames = this.animationFrames.filter((frame, index) => !frame.dataURL);
        if (invalidFrames.length > 0) {
            console.error(`Found ${invalidFrames.length} frames without dataURL:`, invalidFrames);
            this.uiController.showError(`${invalidFrames.length} animation frames are missing image data. Please regenerate the animation.`);
            return;
        }

        if (this.isExporting) {
            this.uiController.showError('Export already in progress. Please wait.');
            return;
        }

        this.isExporting = true;
        
        try {
            // Show progress
            this.uiController.updateProgress(0, 'Preparing video export...');
            await this.delayWithProgress(400, 200);

            // Get settings
            const fps = parseInt(document.getElementById('fps')?.value || '24');
            const duration = this.audioProcessor.audioBuffer.duration;
            
            // Check for MediaRecorder support
            if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
                this.uiController.showError('Video export is not supported in this browser. Please use Chrome or Firefox.');
                return;
            }

            this.uiController.updateProgress(10, 'Setting up video recorder...');
            await this.delayWithProgress(600, 300);

            // Create a temporary canvas for video recording
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size based on the first frame
            if (this.animationFrames.length > 0) {
                const firstFrameImage = new Image();
                await new Promise((resolve, reject) => {
                    firstFrameImage.onload = () => {
                        canvas.width = firstFrameImage.naturalWidth || 800;
                        canvas.height = firstFrameImage.naturalHeight || 600;
                        console.log('Canvas size set to:', canvas.width, 'x', canvas.height);
                        resolve();
                    };
                    firstFrameImage.onerror = (e) => {
                        console.error('Failed to load first frame image');
                        // Use default size if image fails to load
                        canvas.width = 800;
                        canvas.height = 600;
                        resolve(); // Don't reject, just use defaults
                    };
                    firstFrameImage.src = this.animationFrames[0].dataURL;
                });
            } else {
                canvas.width = 800;
                canvas.height = 600;
            }

            // Create video stream from canvas - use manual capture for precise control
            const stream = canvas.captureStream();
            
            // Configure video track for better frame rate control
            const videoTrackForConfig = stream.getVideoTracks()[0];
            if (videoTrackForConfig && videoTrackForConfig.applyConstraints) {
                try {
                    await videoTrackForConfig.applyConstraints({
                        frameRate: { exact: fps },
                        width: canvas.width,
                        height: canvas.height
                    });
                    console.log(`Applied exact frame rate constraint: ${fps} FPS`);
                } catch (constraintError) {
                    console.warn('Could not apply exact frame rate constraint:', constraintError);
                    try {
                        await videoTrackForConfig.applyConstraints({
                            frameRate: { ideal: fps, min: fps - 1, max: fps + 1 }
                        });
                        console.log(`Applied ideal frame rate constraint: ${fps} FPS`);
                    } catch (idealError) {
                        console.warn('Could not apply ideal frame rate constraint:', idealError);
                    }
                }
            }
            
            console.log(`Created canvas stream with precise ${fps} FPS control`);
            
            // Add audio track to the stream
            let audioTrack = null;
            let audioSource = null;
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const audioDestination = audioContext.createMediaStreamDestination();
                
                // Load and connect audio
                const audioBuffer = await this.loadAudioBuffer(this.audioFile, audioContext);
                audioSource = audioContext.createBufferSource();
                audioSource.buffer = audioBuffer;
                audioSource.connect(audioDestination);
                
                audioTrack = audioDestination.stream.getAudioTracks()[0];
                console.log('Audio track created successfully');
            } catch (audioError) {
                console.warn('Failed to add audio to video:', audioError);
                // Continue without audio rather than failing completely
                audioSource = null;
            }

            // Combine video and audio streams
            const videoTrack = stream.getVideoTracks()[0];
            const tracks = [videoTrack];
            if (audioTrack) {
                tracks.push(audioTrack);
            }
            const combinedStream = new MediaStream(tracks);

            this.uiController.updateProgress(25, 'Starting recording...');
            await this.delayWithProgress(500, 300);

            // Set up MediaRecorder with simple, reliable settings
            const chunks = [];
            let mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2'; // H.264 + AAC for MP4
            
            // Check for supported formats with MP4 preference
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/mp4'; // Simple MP4
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'video/webm;codecs=vp9,opus'; // Fallback to WebM VP9
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = 'video/webm;codecs=vp8,opus'; // Fallback to WebM VP8
                        if (!MediaRecorder.isTypeSupported(mimeType)) {
                            mimeType = 'video/webm'; // Final fallback
                            if (!MediaRecorder.isTypeSupported(mimeType)) {
                                throw new Error('No supported video format found. Please use Chrome or Firefox.');
                            }
                        }
                    }
                }
            }
            
            console.log('Using MediaRecorder format:', mimeType);
            
            // Simple MediaRecorder options for reliability and precision
            const recordingOptions = { 
                mimeType: mimeType,
                // Keep bitrates reasonable for stability
                videoBitsPerSecond: 3000000, // 3 Mbps for better quality
                audioBitsPerSecond: audioTrack ? 128000 : undefined // 128 kbps
            };
            
            // Try to configure MediaRecorder for exact timing if supported
            if (mimeType.includes('webm')) {
                // WebM format supports more precise timing controls
                recordingOptions.videoBitsPerSecond = 4000000; // Higher bitrate for WebM
            }
            
            // Inform user about the format being used
            const isMP4 = mimeType.includes('mp4');
            const formatMessage = isMP4 ? 'MP4 format' : 'WebM format (MP4 not supported by browser)';
            console.log(`Exporting video in ${formatMessage}`);
            
            const mediaRecorder = new MediaRecorder(combinedStream, recordingOptions);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            // Start recording - begin audio and video simultaneously
            mediaRecorder.start();
            
            const recordingStartTime = Date.now();
            
            // Start audio immediately with video for best synchronization
            if (audioTrack && audioSource) {
                audioSource.start(0);
                console.log('Audio and video recording started simultaneously');
                
                // Monitor audio completion to ensure we don't stop recording too early
                audioSource.onended = () => {
                    const audioCompletedAt = Date.now() - recordingStartTime;
                    console.log(`Audio completed at ${audioCompletedAt}ms`);
                    
                    // Ensure we continue recording for at least the buffer duration after audio ends
                    const remainingBufferTime = Math.max(0, (totalAnimationDuration + audioBufferMs) - audioCompletedAt);
                    if (remainingBufferTime > 0) {
                        console.log(`Continuing recording for additional ${remainingBufferTime}ms buffer`);
                    }
                };
            }

            this.uiController.updateProgress(35, 'Recording video...');

            // Simplified recording approach for consistent frame rate
            const totalAnimationDuration = duration * 1000; // Convert to milliseconds
            const frameInterval = 1000 / fps; // Frame interval in milliseconds
            const expectedFrames = this.animationFrames.length;
            
            // Calculate total recording time with generous buffer to prevent audio cutoff
            const audioBufferMs = 1000; // 1 second buffer to ensure no audio cutoff
            const totalRecordingTime = totalAnimationDuration + audioBufferMs;
            
            // Calculate minimum frames needed to cover full audio + buffer
            const minFramesNeeded = Math.ceil((totalAnimationDuration + audioBufferMs) / frameInterval);
            
            // Extend animation frames if needed to cover the full recording duration
            let framesToRender = [...this.animationFrames];
            if (framesToRender.length < minFramesNeeded) {
                const lastFrame = framesToRender[framesToRender.length - 1];
                const additionalFrames = minFramesNeeded - framesToRender.length;
                console.log(`Extending animation by ${additionalFrames} frames to prevent audio cutoff`);
                
                for (let i = 0; i < additionalFrames; i++) {
                    framesToRender.push({...lastFrame}); // Duplicate last frame
                }
            }
            
            console.log(`Recording setup (robust approach):`);
            console.log(`- FPS: ${fps}`);
            console.log(`- Frame interval: ${frameInterval.toFixed(1)}ms`);
            console.log(`- Original frames: ${expectedFrames}`);
            console.log(`- Extended frames: ${framesToRender.length}`);
            console.log(`- Audio duration: ${totalAnimationDuration.toFixed(0)}ms`);
            console.log(`- Total recording time: ${totalRecordingTime.toFixed(0)}ms (with ${audioBufferMs}ms buffer)`);
            console.log(`- Minimum frames needed: ${minFramesNeeded}`);
            
            let currentFrame = 0;
            let frameRenderingInterval;
            
            // Precise frame rendering with manual stream capture triggering
            const renderFrame = () => {
                if (currentFrame < framesToRender.length) {
                    const frame = framesToRender[currentFrame];
                    
                    if (frame && frame.dataURL) {
                        const img = new Image();
                        img.onload = () => {
                            try {
                                // Clear canvas and draw frame
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                
                                // Manually trigger frame capture for more precise timing
                                // This helps ensure each frame is captured at the exact interval
                                if (stream.requestFrame) {
                                    stream.requestFrame();
                                }
                                
                                currentFrame++;
                                const progress = 35 + (currentFrame / framesToRender.length) * 45;
                                this.uiController.updateProgress(progress, `Recording frame ${currentFrame}/${framesToRender.length}...`);
                            } catch (drawError) {
                                console.error('Error drawing frame:', currentFrame, drawError);
                                currentFrame++; // Skip problematic frame
                            }
                        };
                        img.onerror = () => {
                            console.warn('Error loading frame image:', currentFrame);
                            currentFrame++; // Skip problematic frame
                        };
                        img.src = frame.dataURL;
                    } else {
                        console.warn('Invalid frame at index:', currentFrame);
                        currentFrame++;
                    }
                } else {
                    // All frames rendered, hold on last frame for remaining duration
                    const lastFrame = framesToRender[framesToRender.length - 1];
                    if (lastFrame && lastFrame.dataURL) {
                        const img = new Image();
                        img.onload = () => {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            
                            // Continue triggering frame captures to maintain stream
                            if (stream.requestFrame) {
                                stream.requestFrame();
                            }
                        };
                        img.src = lastFrame.dataURL;
                    }
                    // Don't log repeatedly for holding frame
                }
            };
            
            // Start rendering first frame immediately
            renderFrame();
            
            // Continue rendering at precise intervals
            frameRenderingInterval = setInterval(renderFrame, frameInterval);
            
            this.uiController.updateProgress(80, 'Recording in progress...');
            
            // Stop recording after the FULL duration to ensure complete audio capture
            // Use a longer timeout to absolutely ensure we don't cut off audio
            const recordingStopTimeout = setTimeout(() => {
                try {
                    clearInterval(frameRenderingInterval);
                    this.uiController.updateProgress(90, 'Finalizing video...');
                    
                    console.log('Stopping MediaRecorder after full audio duration + buffer');
                    mediaRecorder.stop();
                    
                    if (audioTrack && audioSource) {
                        try {
                            audioSource.stop();
                        } catch (e) {
                            console.warn('Audio source already stopped:', e);
                        }
                    }
                    
                    const actualRecordingTime = Date.now() - Date.now(); // This will be calculated in the stop handler
                    console.log(`Recording stopped after intended ${totalRecordingTime}ms`);
                } catch (stopError) {
                    console.error('Error stopping recording:', stopError);
                }
            }, totalRecordingTime);

            // Wait for the recording to complete
            await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Video recording timeout'));
                }, 30000); // 30 second timeout
                
                mediaRecorder.onstop = () => {
                    clearTimeout(timeoutId);
                    try {
                        const blob = new Blob(chunks, { type: mimeType });
                        
                        if (blob.size === 0) {
                            throw new Error('Generated video file is empty');
                        }
                        
                        // Determine file extension based on MIME type
                        const fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm';
                        
                        // Create download link
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `lipsync-animation-${Date.now()}.${fileExtension}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        console.log(`Video download completed (${fileExtension.toUpperCase()}), file size:`, blob.size, 'bytes');
                        resolve();
                    } catch (downloadError) {
                        reject(downloadError);
                    }
                };
                
                mediaRecorder.onerror = (event) => {
                    clearTimeout(timeoutId);
                    reject(new Error(`MediaRecorder error: ${event.error || 'Unknown error'}`));
                };
            });

            this.uiController.updateProgress(100, 'Video export complete!');
            await this.delayWithProgress(800, 600);
            
            // Show success message
            const successMessage = `Video exported successfully! ${this.animationFrames.length} frames at ${fps} FPS`;
            this.uiController.showSuccess(successMessage);
            
        } catch (error) {
            console.error('Error downloading video:', error);
            // Handle both Error objects and Event objects
            const errorMessage = error.message || error.type || 'Unknown error occurred';
            this.uiController.showError(`Failed to export video: ${errorMessage}`);
        } finally {
            this.isExporting = false;
            this.uiController.hideProgress();
        }
    }

    async loadAudioBuffer(audioFile, audioContext) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    resolve(audioBuffer);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(audioFile);
        });
    }

    // Convert any image dataURL to PNG format
    async convertFrameToPNG(dataURL, width = 512, height = 512) {
        return new Promise((resolve, reject) => {
            try {
                // Create a canvas element
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Create an image element
                const img = new Image();
                
                img.onload = () => {
                    try {
                        // Use image dimensions if available, otherwise use defaults
                        const imgWidth = img.naturalWidth || img.width || width;
                        const imgHeight = img.naturalHeight || img.height || height;
                        
                        canvas.width = imgWidth;
                        canvas.height = imgHeight;
                        
                        // Clear canvas with transparent background
                        ctx.clearRect(0, 0, imgWidth, imgHeight);
                        
                        // Draw the image onto the canvas
                        ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
                        
                        // Convert canvas to PNG dataURL with maximum quality
                        const pngDataURL = canvas.toDataURL('image/png');
                        
                        // Validate the PNG dataURL
                        if (!pngDataURL || !pngDataURL.startsWith('data:image/png')) {
                            throw new Error('Failed to generate valid PNG data');
                        }
                        
                        resolve(pngDataURL);
                    } catch (error) {
                        reject(new Error(`Canvas conversion error: ${error.message}`));
                    }
                };
                
                img.onerror = (error) => {
                    reject(new Error(`Failed to load image for PNG conversion: ${error}`));
                };
                
                // Handle CORS for SVG data URLs
                img.crossOrigin = 'anonymous';
                
                // Set the image source to the dataURL
                img.src = dataURL;
                
            } catch (error) {
                reject(new Error(`PNG conversion setup error: ${error.message}`));
            }
        });
    }

    // Test PNG conversion functionality
    async testPNGConversion() {
        try {
            // Create a simple test SVG
            const testSVG = `data:image/svg+xml;base64,${btoa(`
                <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="40" fill="red"/>
                    <text x="50" y="55" text-anchor="middle" fill="white">TEST</text>
                </svg>
            `)}`;
            
            console.log('Testing PNG conversion...');
            const pngResult = await this.convertFrameToPNG(testSVG);
            
            if (pngResult && pngResult.startsWith('data:image/png')) {
                console.log('✅ PNG conversion test successful');
                return true;
            } else {
                console.error('❌ PNG conversion test failed - invalid result');
                return false;
            }
        } catch (error) {
            console.error('❌ PNG conversion test failed:', error);
            return false;
        }
    }

    // Check what video formats are supported by the browser
    checkSupportedVideoFormats() {
        const formats = [
            'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
            'video/mp4',
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm'
        ];
        
        const supported = formats.filter(format => 
            window.MediaRecorder && MediaRecorder.isTypeSupported(format)
        );
        
        console.log('Supported video formats:', supported);
        return supported;
    }

    // Update UI with supported video format information
    updateVideoFormatUI() {
        const supportedFormats = this.checkSupportedVideoFormats();
        const hasMP4 = supportedFormats.some(f => f.includes('mp4'));
        
        const videoFormatLabel = document.getElementById('videoFormatLabel');
        const videoFormatDescription = document.getElementById('videoFormatDescription');
        const downloadVideoText = document.getElementById('downloadVideoText');
        const videoFormatNote = document.getElementById('videoFormatNote');
        
        if (hasMP4) {
            if (videoFormatLabel) videoFormatLabel.textContent = 'MP4 Video';
            if (videoFormatDescription) videoFormatDescription.textContent = 'Complete animation with audio (MP4 format)';
            if (downloadVideoText) downloadVideoText.textContent = 'Download MP4';
            if (videoFormatNote) videoFormatNote.style.display = 'none';
        } else {
            if (videoFormatLabel) videoFormatLabel.textContent = 'WebM Video';
            if (videoFormatDescription) videoFormatDescription.textContent = 'Complete animation with audio (WebM format)';
            if (downloadVideoText) downloadVideoText.textContent = 'Download WebM';
            if (videoFormatNote) videoFormatNote.style.display = 'block';
        }
        
        console.log(`Video export UI updated: ${hasMP4 ? 'MP4' : 'WebM'} format available`);
    }

    // Helper methods for testing and API access
    getFrames() {
        return this.animationFrames || [];
    }
    
    getDuration() {
        if (!this.audioProcessor || !this.audioProcessor.audioBuffer) {
            return 0;
        }
        return this.audioProcessor.audioBuffer.duration;
    }
    
    getFrameCount() {
        return this.animationFrames ? this.animationFrames.length : 0;
    }
    
    getAudioInfo() {
        if (!this.audioProcessor || !this.audioProcessor.audioBuffer) {
            return null;
        }
        
        const buffer = this.audioProcessor.audioBuffer;
        return {
            duration: buffer.duration,
            sampleRate: buffer.sampleRate,
            channels: buffer.numberOfChannels,
            length: buffer.length
        };
    }

    // Helper method to log video statistics for debugging
    logVideoStatistics(fps, expectedFrames, actualDuration, audioDuration) {
        const calculatedFPS = expectedFrames / (actualDuration / 1000);
        const fpsAccuracy = ((calculatedFPS / fps) * 100).toFixed(2);
        const durationAccuracy = ((actualDuration / (audioDuration * 1000)) * 100).toFixed(2);
        
        console.log('=== VIDEO EXPORT STATISTICS ===');
        console.log(`Target FPS: ${fps}`);
        console.log(`Calculated FPS: ${calculatedFPS.toFixed(3)}`);
        console.log(`FPS Accuracy: ${fpsAccuracy}%`);
        console.log(`Expected Duration: ${(audioDuration * 1000).toFixed(2)}ms`);
        console.log(`Actual Duration: ${actualDuration.toFixed(2)}ms`);
        console.log(`Duration Accuracy: ${durationAccuracy}%`);
        console.log(`Total Frames: ${expectedFrames}`);
        console.log('===============================');
        
        // Warn if accuracy is significantly off
        if (Math.abs(100 - parseFloat(fpsAccuracy)) > 5) {
            console.warn(`⚠️ FPS accuracy is ${fpsAccuracy}% - may indicate timing issues`);
        }
        if (Math.abs(100 - parseFloat(durationAccuracy)) > 2) {
            console.warn(`⚠️ Duration accuracy is ${durationAccuracy}% - may indicate audio cutoff`);
        }
    }

    // Helper method to get frame count for testing
    getFrameCount() {
        return this.animationFrames ? this.animationFrames.length : 0;
    }

    // Helper method to get animation duration for testing
    getAnimationDuration() {
        if (!this.audioProcessor.audioBuffer) return 0;
        return this.audioProcessor.audioBuffer.duration;
    }

    // Helper method to get current FPS setting
    getCurrentFPS() {
        return parseInt(document.getElementById('fps')?.value || '24');
    }
}

// Global functions for modal interaction
function openMouthShapesModal() {
    if (window.lipSyncGenerator) {
        window.lipSyncGenerator.openMouthShapesModal();
    }
}

function closeMouthShapesModal() {
    const modal = document.getElementById('mouthShapesModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// Global functions for file removal
function removeAudio() {
    if (window.lipSyncGenerator) {
        window.lipSyncGenerator.removeAudio();
    }
}

function removeImages() {
    if (window.lipSyncGenerator) {
        window.lipSyncGenerator.removeImages();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main application immediately
    window.lipSyncGenerator = new LipSyncGenerator();
    // Note: FileLibraryManager auto-initializes itself
});

// Add a simple test function to verify the page is working
window.testAudioUpload = function() {
    console.log('Testing audio upload functionality...');
    const audioUpload = document.getElementById('audioUpload');
    const audioFileInput = document.getElementById('audioFile');
    
    console.log('Elements found:', {
        audioUpload: !!audioUpload,
        audioFileInput: !!audioFileInput,
        audioUploadVisible: audioUpload ? !audioUpload.classList.contains('hidden') : false
    });
    
    if (audioUpload && audioFileInput) {
        console.log('Manually triggering file input...');
        audioFileInput.click();
    }
};

// Add global function for removeAudio to fix the onclick error
window.removeAudio = function() {
    console.log('Remove audio called');
    if (window.lipSyncGenerator) {
        window.lipSyncGenerator.audioFile = null;
        const audioInfo = document.getElementById('audioInfo');
        const audioUpload = document.getElementById('audioUpload');
        
        if (audioInfo) audioInfo.classList.add('hidden');
        if (audioUpload) audioUpload.classList.remove('hidden');
        
        window.lipSyncGenerator.uiController.showStep(1);
        window.lipSyncGenerator.checkGenerateButton();
    }
};

console.log('script-main.js fully loaded. Test with: testAudioUpload()');
