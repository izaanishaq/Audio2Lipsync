// Simple File-Based Library Manager
class FileLibraryManager {
    constructor() {
        this.libraries = {};
        this.initializeUI();
        this.loadAvailableLibrariesOnStartup();
    }

    initializeUI() {
        // Always show library section
        const librarySection = document.getElementById('librarySection');
        if (librarySection) {
            librarySection.classList.remove('hidden');
        }
        
        this.setupEventListeners();
        this.updateLibraryButtons();
    }

    setupEventListeners() {
        // Export library button
        const exportLibraryBtn = document.getElementById('exportLibraryBtn');
        if (exportLibraryBtn) {
            exportLibraryBtn.addEventListener('click', () => this.exportCurrentLibrary());
        }

        // Import library button  
        const importLibraryBtn = document.getElementById('importLibraryBtn');
        if (importLibraryBtn) {
            importLibraryBtn.addEventListener('click', () => this.importLibrary());
        }

        // Load library dropdown
        const librarySelect = document.getElementById('librarySelect');
        if (librarySelect) {
            librarySelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadLibrary(e.target.value);
                }
            });
        }

        // Delete library button
        const deleteLibraryBtn = document.getElementById('deleteLibraryBtn');
        if (deleteLibraryBtn) {
            deleteLibraryBtn.addEventListener('click', () => {
                const librarySelect = document.getElementById('librarySelect');
                if (librarySelect && librarySelect.value) {
                    this.deleteLibrary(librarySelect.value);
                }
            });
        }
    }

    async loadAvailableLibrariesOnStartup() {
        try {
            console.log('🔍 Loading libraries on startup...');
            
            // First try to load from API (if server is running)
            await this.loadLibrariesFromAPI();
            
            // If no libraries from API, check localStorage cache
            if (Object.keys(this.libraries).length === 0) {
                console.log('📦 Checking localStorage cache...');
                const storedLibraries = localStorage.getItem('fileLibraries');
                if (storedLibraries) {
                    this.libraries = JSON.parse(storedLibraries);
                    console.log(`📚 Found ${Object.keys(this.libraries).length} libraries in cache`);
                    this.populateLibrarySelect();
                }
            }
            
            // If still no libraries, show instructions
            if (Object.keys(this.libraries).length === 0) {
                console.log('📁 No libraries found - showing instructions');
                this.showLibraryLoadInstructions();
            }
            
        } catch (error) {
            console.warn('❌ Error loading libraries:', error.message);
            this.showLibraryLoadInstructions();
        }
    }

    async loadLibrariesFromAPI() {
        // Try to load libraries from API server
        try {
            console.log('📡 Attempting to connect to API server at http://localhost:3001...');
            const response = await fetch('http://localhost:3001/api/file-libraries');
            
            if (response.ok) {
                this.libraries = await response.json();
                const libraryCount = Object.keys(this.libraries).length;
                console.log(`✅ Successfully loaded ${libraryCount} libraries from API`);
                
                if (libraryCount > 0) {
                    console.log('📚 Available libraries:', Object.keys(this.libraries));
                    this.populateLibrarySelect();
                    
                    // Cache in localStorage for offline use
                    localStorage.setItem('fileLibraries', JSON.stringify(this.libraries));
                    console.log('💾 Libraries cached to localStorage');
                    
                    // Remove instructions if they exist
                    const instructions = document.getElementById('libraryInstructions');
                    if (instructions) {
                        instructions.remove();
                    }
                } else {
                    console.log('📁 No libraries found on server');
                }
            } else {
                console.log(`⚠️ API server responded with status: ${response.status}`);
            }
        } catch (error) {
            console.log('⚠️ Cannot connect to API server - working in offline mode');
            console.log('💡 To enable online features, start the API server: cd api && node server.js');
        }
    }

    populateLibrarySelect() {
        const select = document.getElementById('librarySelect');
        if (!select) {
            console.warn('⚠️ Library select element not found!');
            return;
        }

        console.log('🔄 Populating library select with', Object.keys(this.libraries).length, 'libraries');

        // Clear existing options
        select.innerHTML = '<option value="">-- Select a library --</option>';

        // Add available libraries
        Object.keys(this.libraries).forEach(name => {
            const library = this.libraries[name];
            console.log('➕ Adding library to select:', name, library);
            const option = document.createElement('option');
            option.value = name;
            option.textContent = `${library.displayName || name} (${library.imageCount} shapes)`;
            select.appendChild(option);
        });
        
        console.log('✅ Library select populated. Total options:', select.options.length);
    }

    async loadLibrary(libraryName) {
        if (!libraryName) return;

        try {
            let libraryData = null;
            
            // First try to load from cached file data
            const library = this.libraries[libraryName];
            if (library && library.fileData) {
                console.log(`📁 Loading library '${libraryName}' from cache...`);
                libraryData = await this.loadLibraryFromCachedData(library.fileData);
            } else {
                // Fallback: Try to load from API if available
                console.log(`📡 Loading library '${libraryName}' from API...`);
                try {
                    const response = await fetch(`http://localhost:3001/api/file-library/${encodeURIComponent(libraryName)}`);
                    if (response.ok) {
                        const apiData = await response.json();
                        console.log(`✅ Library '${libraryName}' loaded from API`);
                        
                        // Convert API response to expected format
                        libraryData = await this.convertAPIResponseToLibraryData(apiData);
                    }
                } catch (apiError) {
                    console.warn('API not available for library loading');
                }
            }

            if (!libraryData) {
                alert(`Cannot load library '${libraryName}'. Please import the library file.`);
                return;
            }

            // Apply the library to the lip sync generator
            if (window.lipSyncGenerator) {
                window.lipSyncGenerator.imageFiles = libraryData.imageFiles || [];
                window.lipSyncGenerator.imageDataURLs = libraryData.imageDataURLs || [];
                
                // If imageDataURLs is missing or incomplete, generate them from imageFiles
                if (!libraryData.imageDataURLs || libraryData.imageDataURLs.length !== libraryData.imageFiles.length) {
                    console.log('Generating missing imageDataURLs for library...');
                    window.lipSyncGenerator.imageDataURLs = [];
                    
                    const loadPromises = libraryData.imageFiles.map((file, index) => {
                        return new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                window.lipSyncGenerator.imageDataURLs[index] = e.target.result;
                                resolve();
                            };
                            reader.readAsDataURL(file);
                        });
                    });
                    
                    // Continue processing after all data URLs are loaded
                    Promise.all(loadPromises).then(() => {
                        console.log(`✅ Generated ${window.lipSyncGenerator.imageDataURLs.length} image data URLs for library`);
                        this.finishLibraryLoading(libraryName, libraryData);
                    });
                    return;
                }
                
                this.finishLibraryLoading(libraryName, libraryData);
            } else {
                console.error('LipSyncGenerator not available');
                alert('Error: Application not fully loaded');
            }

        } catch (error) {
            console.error('Error loading library:', error);
            alert(`Error loading library '${libraryName}': ${error.message}`);
        }
    }
    
    finishLibraryLoading(libraryName, libraryData) {
        try {
            // Reset and rebuild uploaded mouth shapes mapping
            window.lipSyncGenerator.uploadedMouthShapes = {};
            
            // Validate and categorize mouth shapes (similar to handleImageFiles)
            libraryData.imageFiles.forEach(file => {
                const shapeName = window.lipSyncGenerator.validateMouthShapeFile(file);
                if (shapeName) {
                    window.lipSyncGenerator.uploadedMouthShapes[shapeName] = file;
                }
            });
            
            // Create standardized mapping (this is crucial for animation generation)
            window.lipSyncGenerator.createStandardizedMapping();
            
            // Update the UI
            if (window.lipSyncGenerator.updateImageGallery) {
                window.lipSyncGenerator.updateImageGallery();
            }
            window.lipSyncGenerator.updateImagesUI();
            window.lipSyncGenerator.showStandardizedMapping();
            
            // Enable steps 3 and 4, and check generate button
            window.lipSyncGenerator.uiController.completeStep(2);
            window.lipSyncGenerator.uiController.showStep(3);
            window.lipSyncGenerator.uiController.showStep(4);
            window.lipSyncGenerator.checkGenerateButton();
            
            console.log(`✅ Library '${libraryName}' loaded successfully (${libraryData.imageFiles.length} images)`);
            alert(`Library '${libraryName}' loaded successfully!`);
        } catch (error) {
            console.error('Error finishing library load:', error);
            alert(`Error loading library '${libraryName}': ${error.message}`);
        }
    }

    async loadLibraryFromCachedData(fileData) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(fileData);
        
        const imageFiles = [];
        const imageDataURLs = [];
        
        // Get images folder
        const imagesFolder = zipContent.folder('images');
        if (!imagesFolder) {
            throw new Error('Library does not contain an images folder');
        }
        
        // Process each image file
        const imageFilenames = Object.keys(imagesFolder.files)
            .filter(filename => !filename.endsWith('/') && this.isImageFile(filename.replace('images/', '')))
            .sort(); // Sort to maintain order
        
        for (const filename of imageFilenames) {
            const file = imagesFolder.files[filename];
            const arrayBuffer = await file.async('arraybuffer');
            const blob = new Blob([arrayBuffer], { type: this.getMimeType(filename) });
            
            // Create File object
            const imageFile = new File([blob], filename.replace('images/', ''), { type: blob.type });
            imageFiles.push(imageFile);
            
            // Create data URL for preview
            const dataURL = await this.blobToDataURL(blob);
            imageDataURLs.push(dataURL);
        }
        
        return { imageFiles, imageDataURLs };
    }

    async exportCurrentLibrary() {
        if (!window.lipSyncGenerator || !window.lipSyncGenerator.imageFiles || window.lipSyncGenerator.imageFiles.length === 0) {
            alert('Please upload mouth shapes first before exporting a library.');
            return;
        }

        const libraryName = prompt('Enter a name for this library:');
        if (!libraryName || !libraryName.trim()) {
            return;
        }

        const cleanName = libraryName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        
        try {
            const zip = new JSZip();
            
            // Create library metadata
            const libraryData = {
                name: cleanName,
                displayName: libraryName.trim(),
                created: new Date().toISOString(),
                imageCount: window.lipSyncGenerator.imageFiles.length
            };
            
            zip.file('library.json', JSON.stringify(libraryData, null, 2));
            
            // Add image files
            const imagesFolder = zip.folder('images');
            for (let i = 0; i < window.lipSyncGenerator.imageFiles.length; i++) {
                const file = window.lipSyncGenerator.imageFiles[i];
                const fileName = `shape_${i.toString().padStart(2, '0')}.${this.getFileExtension(file.name)}`;
                imagesFolder.file(fileName, file);
            }
            
            // Generate and download the ZIP
            const content = await zip.generateAsync({type: 'blob'});
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cleanName}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            
            // Add to local library list
            this.libraries[cleanName] = {
                name: cleanName,
                displayName: libraryData.displayName,
                imageCount: libraryData.imageCount,
                created: libraryData.created,
                fileData: content // Store the ZIP data for later use
            };
            
            // Update localStorage
            localStorage.setItem('fileLibraries', JSON.stringify(this.libraries));
            this.populateLibrarySelect();
            
            alert(`Library "${libraryName}" exported successfully!`);
            
        } catch (error) {
            console.error('Export error:', error);
            alert('Error exporting library. Please try again.');
        }
    }

    async importLibrary() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.multiple = true;
        
        input.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            try {
                for (const file of files) {
                    await this.processLibraryFile(file);
                }
                
                this.populateLibrarySelect();
                
                // Save to localStorage cache
                localStorage.setItem('fileLibraries', JSON.stringify(this.libraries));
                
                // Remove instructions if they exist
                const instructions = document.getElementById('libraryInstructions');
                if (instructions) {
                    instructions.remove();
                }
                
                alert(`Successfully imported ${files.length} library file(s)!`);
                
            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing libraries. Please check the file format.');
            }
        });

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    async processLibraryFile(file) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        
        // Read library metadata
        const libraryJsonFile = zipContent.file('library.json');
        if (!libraryJsonFile) {
            throw new Error(`Invalid library file: ${file.name} - missing library.json`);
        }
        
        const libraryData = JSON.parse(await libraryJsonFile.async('text'));
        const libraryName = libraryData.name || file.name.replace('.zip', '');
        
        // Count actual image files
        let imageCount = 0;
        const imagesFolder = zipContent.folder('images');
        if (imagesFolder) {
            imageCount = Object.keys(imagesFolder.files).filter(filename => {
                const name = filename.replace('images/', '');
                return !filename.endsWith('/') && name !== 'library.json' && 
                       !name.startsWith('.') && this.isImageFile(name);
            }).length;
        }
        
        // Add to libraries list
        this.libraries[libraryName] = {
            name: libraryName,
            displayName: libraryData.displayName || libraryName,
            imageCount: imageCount,
            created: libraryData.created || new Date().toISOString(),
            fileData: file // Store the original file for later loading
        };
        
        console.log(`✅ Imported library: ${libraryName} (${imageCount} images)`);
    }

    async deleteLibrary(libraryName) {
        if (!confirm(`Are you sure you want to delete the library '${libraryName}'?`)) {
            return;
        }

        // Remove from local storage
        delete this.libraries[libraryName];
        localStorage.setItem('fileLibraries', JSON.stringify(this.libraries));
        
        // Update UI
        this.populateLibrarySelect();
        
        // Reset selection
        const librarySelect = document.getElementById('librarySelect');
        if (librarySelect) {
            librarySelect.value = '';
        }
        
        console.log(`🗑️ Library '${libraryName}' deleted`);
        alert(`Library '${libraryName}' deleted successfully.`);
    }

    showLibraryLoadInstructions() {
        // Add a helpful message to the library section
        const librarySection = document.getElementById('librarySection');
        if (!librarySection) return;

        // Remove existing instructions
        const existingInstructions = document.getElementById('libraryInstructions');
        if (existingInstructions) {
            existingInstructions.remove();
        }

        // Create instructions div
        const instructions = document.createElement('div');
        instructions.id = 'libraryInstructions';
        instructions.className = 'library-instructions';
        instructions.innerHTML = `
            <div class="instruction-card">
                <h4>📚 Getting Started with Mouth Shape Libraries</h4>
                <p>No libraries found. Here's how to get started:</p>
                <ul>
                    <li><strong>Import existing libraries:</strong> Click "Import Library" to load .zip library files</li>
                    <li><strong>Create new library:</strong> Upload mouth shapes above, then click "Export Library" to save</li>
                    <li><strong>API Server:</strong> Start the API server to auto-load libraries from the save-lib folder</li>
                </ul>
                <div class="instruction-note">
                    💡 <strong>Tip:</strong> The app works offline! Import libraries and they'll be saved locally.
                </div>
            </div>
        `;

        // Insert after the library controls
        const libraryControls = librarySection.querySelector('.library-controls');
        if (libraryControls) {
            libraryControls.parentNode.insertBefore(instructions, libraryControls.nextSibling);
        } else {
            librarySection.appendChild(instructions);
        }
    }

    updateLibraryButtons() {
        const exportBtn = document.getElementById('exportLibraryBtn');
        const deleteBtn = document.getElementById('deleteLibraryBtn');
        const librarySelect = document.getElementById('librarySelect');
        
        if (exportBtn) {
            exportBtn.disabled = !window.lipSyncGenerator || !window.lipSyncGenerator.imageFiles || window.lipSyncGenerator.imageFiles.length === 0;
        }
        
        if (deleteBtn && librarySelect) {
            deleteBtn.disabled = !librarySelect.value;
        }
    }

    // Utility methods
    isImageFile(filename) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }

    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    getMimeType(filename) {
        const ext = this.getFileExtension(filename);
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'webp': 'image/webp'
        };
        return mimeTypes[ext] || 'image/jpeg';
    }

    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async convertAPIResponseToLibraryData(apiData) {
        console.log('🔄 Converting API response to library data...');
        
        const imageFiles = [];
        const imageDataURLs = apiData.imageDataURLs || [];
        
        // Convert API file objects to actual File objects
        if (apiData.imageFiles && Array.isArray(apiData.imageFiles)) {
            for (const apiFile of apiData.imageFiles) {
                try {
                    // Convert data URL to blob
                    const dataURL = apiFile.data || imageDataURLs[imageFiles.length];
                    if (dataURL) {
                        const response = await fetch(dataURL);
                        const blob = await response.blob();
                        
                        // Create actual File object
                        const file = new File([blob], apiFile.name, { type: apiFile.type });
                        imageFiles.push(file);
                    }
                } catch (error) {
                    console.warn('Error converting file:', apiFile.name, error);
                }
            }
        }
        
        console.log(`✅ Converted ${imageFiles.length} files`);
        
        return {
            imageFiles: imageFiles,
            imageDataURLs: imageDataURLs
        };
    }
}

// Auto-instantiate when included
if (typeof window !== 'undefined') {
    window.fileLibraryManager = new FileLibraryManager();
}
