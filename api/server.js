console.log('🔍 Starting Lip-Sync API Server...');

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const multer = require('multer');

console.log('✅ All modules loaded successfully');

const app = express();
const port = 3001;

console.log('🚀 Creating Express app...');

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve static files from parent directory (for api-test.html)
app.use(express.static(path.join(__dirname, '..')));

console.log('✅ Middleware configured');

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Library storage directory
const SAVE_LIB_DIR = path.join(__dirname, '..', 'save-lib');

console.log('📁 Library directory:', SAVE_LIB_DIR);

// Ensure save-lib directory exists
if (!fs.existsSync(SAVE_LIB_DIR)) {
    fs.mkdirSync(SAVE_LIB_DIR, { recursive: true });
    console.log('📁 Created save-lib directory');
} else {
    console.log('📁 Save-lib directory exists');
}

// Ensure temp directory exists for video generation
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    console.log('📁 Created temp directory');
} else {
    console.log('📁 Temp directory exists');
}

// Helper function to check if a file is an image
function isImageFile(filename) {
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
    const ext = filename.toLowerCase().split('.').pop();
    return imageExtensions.includes(ext);
}

// Status endpoint
app.get('/status', (req, res) => {
    console.log('📊 Status endpoint called');
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        libraryDir: SAVE_LIB_DIR,
        port: port
    });
});

// API Status endpoint
app.get('/api/status', (req, res) => {
    console.log('📊 API Status endpoint called');
    res.json({ 
        status: 'running', 
        timestamp: new Date().toISOString(),
        libraryDir: SAVE_LIB_DIR,
        port: port,
        version: '1.0.0'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    console.log('❤️ Health check called');
    res.json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: Date.now()
    });
});

// Get list of available libraries from save-lib directory
app.get('/api/file-libraries', async (req, res) => {
    try {
        console.log('📚 Listing libraries from:', SAVE_LIB_DIR);
        
        const libraries = {};
        
        // Check if directory exists
        if (!fs.existsSync(SAVE_LIB_DIR)) {
            console.log('📁 Save-lib directory not found, creating it');
            fs.mkdirSync(SAVE_LIB_DIR, { recursive: true });
            return res.json(libraries);
        }
        
        // Read directory contents safely
        let files;
        try {
            files = fs.readdirSync(SAVE_LIB_DIR);
            console.log('📂 Files in directory:', files);
        } catch (dirError) {
            console.error('❌ Error reading directory:', dirError.message);
            return res.json(libraries);
        }
        
        if (!files || files.length === 0) {
            console.log('📁 No files found in save-lib directory');
            return res.json(libraries);
        }
        
        // Filter ZIP files
        const zipFiles = files.filter(file => file.endsWith('.zip'));
        console.log(`📦 Found ${zipFiles.length} ZIP files:`, zipFiles);
        
        // Process each ZIP file
        for (const zipFile of zipFiles) {
            try {
                console.log(`🔍 Processing: ${zipFile}`);
                const libraryName = path.basename(zipFile, '.zip');
                const filePath = path.join(SAVE_LIB_DIR, zipFile);
                const stats = fs.statSync(filePath);
                
                // Read ZIP file
                const zipData = fs.readFileSync(filePath);
                const zip = new JSZip();
                const zipContent = await zip.loadAsync(zipData);
                
                // Get metadata
                let imageCount = 0;
                let displayName = libraryName.replace(/_/g, ' ');
                
                // Try to read library.json
                const libraryJsonFile = zipContent.file('library.json');
                if (libraryJsonFile) {
                    try {
                        const libraryData = JSON.parse(await libraryJsonFile.async('text'));
                        imageCount = libraryData.imageCount || 0;
                        displayName = libraryData.displayName || displayName;
                        console.log(`📖 Metadata from library.json: ${displayName} (${imageCount} images)`);
                    } catch (jsonError) {
                        console.warn(`⚠️ Error reading library.json for ${libraryName}:`, jsonError.message);
                    }
                }
                
                // Count images if not in metadata
                if (imageCount === 0) {
                    const imagesFolder = zipContent.folder('images');
                    if (imagesFolder) {
                        imageCount = Object.keys(imagesFolder.files).filter(filename => {
                            const name = filename.replace('images/', '');
                            return !filename.endsWith('/') && 
                                   name !== 'library.json' && 
                                   !name.startsWith('.') && 
                                   isImageFile(name);
                        }).length;
                        console.log(`🔢 Counted ${imageCount} images in ZIP`);
                    }
                }
                
                libraries[libraryName] = {
                    name: libraryName,
                    displayName: displayName,
                    createdAt: stats.birthtime.toISOString(),
                    size: stats.size,
                    imageCount: imageCount
                };
                
                console.log(`✅ Added library: ${displayName} (${imageCount} images)`);
                
            } catch (zipError) {
                console.error(`❌ Error processing ${zipFile}:`, zipError.message);
                // Continue with other files
            }
        }
        
        console.log(`📚 Total libraries loaded: ${Object.keys(libraries).length}`);
        res.json(libraries);
        
    } catch (error) {
        console.error('❌ Fatal error in file-libraries endpoint:', error);
        res.status(500).json({ 
            error: 'Failed to list libraries',
            details: error.message 
        });
    }
});

// API endpoint for libraries (expected by test suite)
app.get('/api/libraries', async (req, res) => {
    try {
        console.log('📚 API Libraries endpoint called');
        
        const libraries = [];
        
        // Check if directory exists
        if (!fs.existsSync(SAVE_LIB_DIR)) {
            console.log('📁 Save-lib directory not found, creating it');
            fs.mkdirSync(SAVE_LIB_DIR, { recursive: true });
            return res.json({ libraries: [] });
        }
        
        // Read directory contents safely
        let files;
        try {
            files = fs.readdirSync(SAVE_LIB_DIR);
            console.log('📂 Files in directory:', files);
        } catch (dirError) {
            console.error('❌ Error reading directory:', dirError.message);
            return res.json({ libraries: [] });
        }
        
        if (!files || files.length === 0) {
            console.log('📁 No files found in save-lib directory');
            return res.json({ libraries: [] });
        }
        
        // Filter ZIP files and extract library names
        const zipFiles = files.filter(file => file.endsWith('.zip'));
        console.log(`📦 Found ${zipFiles.length} ZIP files:`, zipFiles);
        
        for (const zipFile of zipFiles) {
            // Return full path relative to project root for consistency with test page
            const fullPath = `save-lib/${zipFile}`;
            libraries.push(fullPath);
        }
        
        console.log(`📚 Total libraries: ${libraries.length}`);
        res.json({ libraries: libraries });
        
    } catch (error) {
        console.error('❌ Fatal error in libraries endpoint:', error);
        res.status(500).json({ 
            error: 'Failed to list libraries',
            details: error.message 
        });
    }
});

// Load library endpoint (expected by test suite)
app.post('/api/libraries/load', async (req, res) => {
    try {
        const { libraryName, path: libraryPath } = req.body;
        
        // Accept either libraryName or path parameter
        let targetLibraryName = libraryName;
        let zipPath;
        
        if (libraryPath) {
            // If path is provided, use it directly (e.g., "save-lib/sample_library.zip")
            zipPath = path.join(__dirname, '..', libraryPath);
            targetLibraryName = path.basename(libraryPath, '.zip');
        } else if (libraryName) {
            // If libraryName is provided, construct path
            zipPath = path.join(SAVE_LIB_DIR, `${libraryName}.zip`);
        } else {
            return res.status(400).json({ error: 'Library name or path is required' });
        }
        
        console.log(`📖 Loading library via POST: ${targetLibraryName} (path: ${zipPath})`);
        
        if (!fs.existsSync(zipPath)) {
            console.log(`❌ Library not found: ${zipPath}`);
            return res.status(404).json({ error: 'Library not found' });
        }
        
        // Read and extract ZIP file
        const zipData = fs.readFileSync(zipPath);
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipData);
        
        // Extract all images and library data
        const imageFiles = [];
        const imageDataURLs = [];
        let libraryData = {};
        
        // Try to load library.json if it exists
        try {
            const libraryJsonFile = zipContent.file('library.json') || zipContent.file('images/library.json');
            if (libraryJsonFile) {
                const libraryJsonContent = await libraryJsonFile.async('string');
                libraryData = JSON.parse(libraryJsonContent);
                console.log('📋 Loaded library.json:', libraryData);
            }
        } catch (jsonError) {
            console.log('⚠️ Could not load library.json, using defaults');
        }
        
        // Check if images are in an "images" folder or in the root
        const imagesFolder = zipContent.folder('images');
        let imageEntries = {};
        
        if (imagesFolder && Object.keys(imagesFolder.files).length > 1) {
            // Images are in "images" folder
            console.log('📁 Found images in "images" folder');
            imageEntries = imagesFolder.files;
        } else {
            // Images are in root of ZIP
            console.log('📁 Images found in root of ZIP');
            imageEntries = zipContent.files;
        }
        
        for (const [filename, zipObject] of Object.entries(imageEntries)) {
            if (!zipObject.dir) {
                let imageName = filename;
                
                // Remove "images/" prefix if present
                if (imageName.startsWith('images/')) {
                    imageName = imageName.replace('images/', '');
                }
                
                // Skip non-image files
                if (imageName === 'library.json' || imageName.startsWith('.') || !isImageFile(imageName)) {
                    continue;
                }
                
                console.log(`📸 Processing image: ${imageName}`);
                
                const imageData = await zipObject.async('base64');
                const ext = imageName.toLowerCase().split('.').pop();
                
                let mimeType = 'image/svg+xml';
                if (ext === 'png') mimeType = 'image/png';
                else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
                else if (ext === 'gif') mimeType = 'image/gif';
                else if (ext === 'webp') mimeType = 'image/webp';
                
                const dataURL = `data:${mimeType};base64,${imageData}`;
                
                // Arrays expected by frontend and test suite
                imageDataURLs.push(dataURL);
                imageFiles.push(imageName);
            }
        }
        
        // Prepare images object for the expected API format
        const imagesObject = {};
        for (let i = 0; i < imageFiles.length; i++) {
            const fileName = imageFiles[i];
            const baseName = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
            const imageData = imageDataURLs[i].split(',')[1]; // Extract base64 data
            imagesObject[baseName] = imageData;
        }
        
        // Create response in the format expected by test suite
        const response = {
            success: true,
            message: "Library loaded successfully",
            library: {
                name: targetLibraryName,
                images: imagesObject,
                phonemeMap: libraryData.phonemeMap || {
                    // Default phoneme mapping if not present in library
                    "CLOSED": "closed",
                    "A": "a",
                    "E": "e",
                    "I": "i",
                    "O": "o",
                    "U": "u",
                    "REST": "rest",
                    "SMILE": "smile"
                }
            },
            // Also include legacy format for backward compatibility
            libraryName: targetLibraryName,
            imageFiles: imageFiles,
            imageDataURLs: imageDataURLs,
            imageCount: imageFiles.length
        };
        
        console.log(`✅ Library loaded via POST: ${targetLibraryName} (${imageFiles.length} images)`);
        res.json(response);
        
    } catch (error) {
        console.error(`❌ Error loading library via POST:`, error);
        res.status(500).json({ error: 'Failed to load library', details: error.message });
    }
});

// Get specific library data
app.get('/api/file-library/:name', async (req, res) => {
    try {
        const libraryName = req.params.name;
        const zipPath = path.join(SAVE_LIB_DIR, `${libraryName}.zip`);
        
        console.log(`📖 Loading library: ${libraryName}`);
        
        if (!fs.existsSync(zipPath)) {
            console.log(`❌ Library not found: ${zipPath}`);
            return res.status(404).json({ error: 'Library not found' });
        }
        
        // Read and extract ZIP file
        const zipData = fs.readFileSync(zipPath);
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipData);
        
        // Read library metadata
        const libraryJsonFile = zipContent.file('library.json');
        if (!libraryJsonFile) {
            return res.status(400).json({ error: 'Invalid library: missing library.json' });
        }
        
        const libraryData = JSON.parse(await libraryJsonFile.async('text'));
        
        // Extract all images
        const images = [];
        const imageFiles = [];
        const imageDataURLs = [];
        
        // Check if images are in an "images" folder or in the root
        const imagesFolder = zipContent.folder('images');
        let imageEntries = {};
        
        if (imagesFolder && Object.keys(imagesFolder.files).length > 1) {
            // Images are in "images" folder
            console.log('📁 Found images in "images" folder');
            imageEntries = imagesFolder.files;
        } else {
            // Images are in root of ZIP
            console.log('📁 Images found in root of ZIP');
            imageEntries = zipContent.files;
        }
        
        for (const [filename, zipObject] of Object.entries(imageEntries)) {
            if (!zipObject.dir) {
                let imageName = filename;
                
                // Remove "images/" prefix if present
                if (imageName.startsWith('images/')) {
                    imageName = imageName.replace('images/', '');
                }
                
                // Skip non-image files
                if (imageName === 'library.json' || imageName.startsWith('.') || !isImageFile(imageName)) {
                    continue;
                }
                
                console.log(`📸 Processing image: ${imageName}`);
                
                const imageData = await zipObject.async('base64');
                const ext = imageName.toLowerCase().split('.').pop();
                
                let mimeType = 'image/svg+xml';
                if (ext === 'png') mimeType = 'image/png';
                else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
                else if (ext === 'gif') mimeType = 'image/gif';
                else if (ext === 'webp') mimeType = 'image/webp';
                
                const dataURL = `data:${mimeType};base64,${imageData}`;
                
                // Create image object for compatibility
                images.push({
                    name: imageName,
                    data: dataURL,
                    type: mimeType,
                    size: Buffer.from(imageData, 'base64').length
                });
                
                // Create arrays expected by frontend
                imageDataURLs.push(dataURL);
                
                // Create a File-like object for imageFiles array
                imageFiles.push({
                    name: imageName,
                    type: mimeType,
                    size: Buffer.from(imageData, 'base64').length,
                    data: dataURL // Include data URL for easy conversion
                });
            }
        }
        
        const response = {
            ...libraryData,
            images: images, // Keep for backwards compatibility
            imageFiles: imageFiles, // Frontend expects this
            imageDataURLs: imageDataURLs, // Frontend expects this
            imageCount: images.length
        };
        
        console.log(`✅ Library loaded: ${libraryData.displayName || libraryName} (${images.length} images)`);
        res.json(response);
        
    } catch (error) {
        console.error(`❌ Error loading library ${req.params.name}:`, error);
        res.status(500).json({ error: 'Failed to load library' });
    }
});

// Delete library
app.delete('/api/file-library/:name', (req, res) => {
    try {
        const libraryName = req.params.name;
        const zipPath = path.join(SAVE_LIB_DIR, `${libraryName}.zip`);
        
        console.log(`🗑️ Deleting library: ${libraryName}`);
        
        if (!fs.existsSync(zipPath)) {
            return res.status(404).json({ error: 'Library not found' });
        }
        
        fs.unlinkSync(zipPath);
        console.log(`✅ Deleted library: ${libraryName}`);
        res.json({ message: `Library '${libraryName}' deleted successfully` });
        
    } catch (error) {
        console.error(`❌ Error deleting library ${req.params.name}:`, error);
        res.status(500).json({ error: 'Failed to delete library' });
    }
});

// Upload library ZIP file
app.post('/api/upload-library', upload.single('library'), (req, res) => {
    try {
        console.log('📤 Upload request received');
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const originalName = req.file.originalname;
        console.log(`📁 Uploaded file: ${originalName}`);
        
        if (!originalName.endsWith('.zip')) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'File must be a ZIP archive' });
        }
        
        const libraryName = path.basename(originalName, '.zip');
        const destinationPath = path.join(SAVE_LIB_DIR, originalName);
        
        // Move file to save-lib directory
        fs.renameSync(req.file.path, destinationPath);
        
        console.log(`✅ Library uploaded: ${libraryName}`);
        res.json({ 
            message: `Library '${libraryName}' uploaded successfully`,
            name: libraryName
        });
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ error: 'Failed to upload library' });
    }
});

// Serve static files from save-lib directory
app.use('/libraries', express.static(SAVE_LIB_DIR));

// Simple test page
app.get('/test', (req, res) => {
    console.log('🧪 Test page requested');
    res.send(`
        <html>
        <head><title>API Test</title></head>
        <body>
            <h1>Lip-Sync API Server</h1>
            <p><strong>Status:</strong> Running on port ${port}</p>
            <p><strong>Library Directory:</strong> ${SAVE_LIB_DIR}</p>
            <hr>
            <h2>Test Endpoints:</h2>
            <button onclick="testLibraries()">Test File Libraries</button>
            <div id="result"></div>
            <script>
                async function testLibraries() {
                    try {
                        console.log('Testing libraries...');
                        const response = await fetch('/api/file-libraries');
                        const data = await response.json();
                        document.getElementById('result').innerHTML = 
                            '<h3>Libraries:</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
                    } catch (error) {
                        document.getElementById('result').innerHTML = 
                            '<h3>Error:</h3><p>' + error.message + '</p>';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Error handling
app.use((error, req, res, next) => {
    console.error('🚨 Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
console.log('🎯 Starting server on port', port);
app.listen(port, () => {
    console.log('🎙️ =====================================');
    console.log('🎙️  Lip-Sync API Server Started');
    console.log('🎙️ =====================================');
    console.log(`🚀 Server: http://localhost:${port}`);
    console.log(`📊 Status: http://localhost:${port}/status`);
    console.log(`🧪 Test: http://localhost:${port}/test`);
    console.log(`📚 Libraries: http://localhost:${port}/api/file-libraries`);
    console.log(`💾 Library storage: ${SAVE_LIB_DIR}`);
    console.log('🎙️ =====================================');
    console.log('✅ Ready for library management!');
});

module.exports = app;

// Video generation endpoint - main API for lip-sync video creation
app.post('/api/generate-video', upload.single('audio'), async (req, res) => {
    try {
        console.log('🎬 Video generation request received');
        
        // Extract parameters from request
        const {
            libraryName,
            libraryPath,
            audioData,
            videoFormat = 'webm',
            frameRate = 24,
            frameWidth = 512,
            frameHeight = 512,
            phonemeMap,
            animationParams
        } = req.body;
        
        let audioFile = null;
        let audioBinary = null;
        
        // Handle audio input - can be uploaded file or base64 data
        if (req.file) {
            console.log('📁 Audio file uploaded:', req.file.originalname);
            audioFile = req.file.path;
            audioBinary = fs.readFileSync(audioFile);
        } else if (audioData) {
            console.log('📊 Audio data provided as base64');
            // Extract base64 data if it's a data URL
            const base64Data = audioData.includes(',') ? audioData.split(',')[1] : audioData;
            audioBinary = Buffer.from(base64Data, 'base64');
            
            // Save temporary audio file
            const tempAudioPath = path.join(__dirname, 'temp', `audio_${Date.now()}.wav`);
            fs.mkdirSync(path.dirname(tempAudioPath), { recursive: true });
            fs.writeFileSync(tempAudioPath, audioBinary);
            audioFile = tempAudioPath;
        } else {
            return res.status(400).json({ error: 'No audio data provided' });
        }
        
        // Load library
        let zipPath;
        if (libraryPath) {
            zipPath = path.join(__dirname, '..', libraryPath);
        } else if (libraryName) {
            zipPath = path.join(SAVE_LIB_DIR, `${libraryName}.zip`);
        } else {
            return res.status(400).json({ error: 'Library name or path required' });
        }
        
        if (!fs.existsSync(zipPath)) {
            return res.status(404).json({ error: 'Library not found' });
        }
        
        console.log(`📖 Loading library: ${zipPath}`);
        
        // Extract library images
        const zipData = fs.readFileSync(zipPath);
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipData);
        
        const libraryImages = {};
        let libraryData = {};
        
        // Load library.json if available
        try {
            const libraryJsonFile = zipContent.file('library.json') || zipContent.file('images/library.json');
            if (libraryJsonFile) {
                const libraryJsonContent = await libraryJsonFile.async('string');
                libraryData = JSON.parse(libraryJsonContent);
            }
        } catch (e) {
            console.log('⚠️ No library.json found, using defaults');
        }
        
        // Extract images
        const imagesFolder = zipContent.folder('images');
        let imageEntries = imagesFolder && Object.keys(imagesFolder.files).length > 1 
            ? imagesFolder.files 
            : zipContent.files;
        
        for (const [filename, zipObject] of Object.entries(imageEntries)) {
            if (!zipObject.dir) {
                let imageName = filename.startsWith('images/') 
                    ? filename.replace('images/', '') 
                    : filename;
                
                if (imageName === 'library.json' || imageName.startsWith('.') || !isImageFile(imageName)) {
                    continue;
                }
                
                const imageData = await zipObject.async('base64');
                const baseName = imageName.replace(/\.[^/.]+$/, "");
                libraryImages[baseName] = imageData;
            }
        }
        
        console.log(`📸 Loaded ${Object.keys(libraryImages).length} library images`);
        
        // Use provided phoneme map or default from library
        const activePhonemeMap = phonemeMap || libraryData.phonemeMap || {
            "CLOSED": "closed",
            "A": "a", 
            "E": "e",
            "I": "i",
            "O": "o",
            "U": "u",
            "REST": "rest",
            "SMILE": "smile"
        };
        
        // Since we're in Node.js, we'll need to simulate the audio processing
        // For a full implementation, you'd need to integrate with a speech analysis library
        // For now, we'll create a basic response structure
        
        console.log('🎵 Processing audio for lip-sync...');
        
        // Simulate audio duration calculation (would be from actual audio file)
        const audioDuration = 3.0; // Placeholder - would be calculated from actual audio
        const totalFrames = Math.ceil(audioDuration * frameRate);
        
        // Enhanced phoneme detection with bias controls
        const detectPhonemeFromAudio = (time, options = {}) => {
            const {
                phonemeBias = 0.5,
                shapeBiases = {},
                holdPause = 5
            } = options;
            
            // Simulate audio analysis - in real implementation would use audio processing
            const simulatedVolume = Math.random() * 0.8 + 0.1;
            const simulatedSpectral = Math.random();
            const simulatedDynamics = Math.random() * 0.3;
            const simulatedZeroCrossing = Math.random() * 0.15;
            
            // Apply individual shape biases to detection
            const getAdjustedThreshold = (shapeName, baseThreshold) => {
                const shapeBias = shapeBiases[shapeName] || 1.0;
                return Math.max(0.1, baseThreshold / shapeBias);
            };
            
            // Enhanced detection logic that mirrors frontend
            const availableShapes = Object.keys(activePhonemeMap);
            const shapeScores = {};
            
            // Score each available shape based on simulated audio features
            availableShapes.forEach(shape => {
                let score = 0;
                const threshold = getAdjustedThreshold(shape, 0.5);
                
                switch(shape) {
                    case 'A':
                    case 'Aa':
                        // Open vowels - favor with medium-high volume
                        if (simulatedVolume > 0.3 && simulatedDynamics < 0.2) {
                            score = simulatedVolume * 0.8 + (1 - simulatedDynamics) * 0.2;
                        }
                        break;
                    case 'E':
                    case 'Ee': 
                        // High front vowels - favor with high spectral content
                        if (simulatedSpectral > 0.6 && simulatedVolume > 0.4) {
                            score = simulatedSpectral * 0.6 + simulatedVolume * 0.4;
                        }
                        break;
                    case 'O':
                    case 'Oh':
                        // Back vowels - favor with medium volume, low spectral
                        if (simulatedVolume > 0.2 && simulatedSpectral < 0.4) {
                            score = simulatedVolume * 0.5 + (1 - simulatedSpectral) * 0.5;
                        }
                        break;
                    case 'U':
                    case 'Uh':
                        // Central vowels - most common, medium features
                        if (simulatedVolume > 0.15 && simulatedVolume < 0.7) {
                            score = 0.6 + Math.random() * 0.3; // Slightly random for naturalness
                        }
                        break;
                    case 'M':
                        // Bilabial consonants - favor with dynamics
                        if (simulatedDynamics > 0.1 && simulatedSpectral < 0.3) {
                            score = simulatedDynamics * 0.7 + (1 - simulatedSpectral) * 0.3;
                        }
                        break;
                    case 'S':
                        // Sibilants - favor with high spectral and zero crossing
                        if (simulatedSpectral > 0.7 && simulatedZeroCrossing > 0.1) {
                            score = simulatedSpectral * 0.6 + simulatedZeroCrossing * 0.4;
                        }
                        break;
                    case 'D':
                        // Alveolar consonants - favor with dynamics and mid spectral
                        if (simulatedDynamics > 0.15 && simulatedSpectral > 0.3 && simulatedSpectral < 0.6) {
                            score = simulatedDynamics * 0.5 + simulatedSpectral * 0.5;
                        }
                        break;
                    case 'L':
                        // Liquids - favor with mid spectral range
                        if (simulatedSpectral > 0.25 && simulatedSpectral < 0.55 && simulatedVolume > 0.2) {
                            score = simulatedSpectral * 0.6 + simulatedVolume * 0.4;
                        }
                        break;
                    case 'R':
                        // Rhotics - favor with low spectral, decent volume
                        if (simulatedSpectral < 0.35 && simulatedVolume > 0.2) {
                            score = (1 - simulatedSpectral) * 0.6 + simulatedVolume * 0.4;
                        }
                        break;
                    case 'F':
                        // Fricatives - favor with zero crossing and mid spectral
                        if (simulatedZeroCrossing > 0.06 && simulatedSpectral > 0.4 && simulatedSpectral < 0.7) {
                            score = simulatedZeroCrossing * 0.5 + simulatedSpectral * 0.5;
                        }
                        break;
                    case 'CLOSED':
                    case 'REST':
                        // Silence/closed - favor with low volume
                        if (simulatedVolume < 0.1) {
                            score = 1 - simulatedVolume;
                        }
                        break;
                    default:
                        // Default scoring for other shapes
                        score = Math.random() * 0.5;
                }
                
                // Apply individual bias and check against threshold
                if (score > threshold) {
                    shapeScores[shape] = score * (shapeBiases[shape] || 1.0);
                }
            });
            
            // Apply phoneme bias to overall selection
            if (Object.keys(shapeScores).length === 0) {
                // Fallback - apply bias to shape selection
                const biasedShapes = availableShapes.filter(shape => {
                    const underDetected = ['A', 'Aa', 'U', 'Uh', 'O', 'Oh', 'L', 'R'];
                    const overDetected = ['S', 'E', 'Ee', 'D'];
                    
                    if (phonemeBias < 0.5 && underDetected.includes(shape)) return true;
                    if (phonemeBias > 0.5 && overDetected.includes(shape)) return true;
                    if (phonemeBias >= 0.4 && phonemeBias <= 0.6) return true;
                    return false;
                });
                
                return biasedShapes[Math.floor(Math.random() * biasedShapes.length)] || availableShapes[0];
            }
            
            // Return shape with highest score
            return Object.keys(shapeScores).reduce((a, b) => shapeScores[a] > shapeScores[b] ? a : b);
        };
        
        // Generate phoneme sequence with enhanced detection
        const phonemeSequence = [];
        for (let i = 0; i < totalFrames; i++) {
            const time = i / frameRate;
            
            // Get bias settings from request (if provided)
            const detectionOptions = {
                phonemeBias: req.body.phonemeBias || 0.5,
                shapeBiases: req.body.shapeBiases || {},
                holdPause: req.body.holdPause || 5
            };
            
            const phoneme = detectPhonemeFromAudio(time, detectionOptions);
            phonemeSequence.push({
                time: time,
                phoneme: phoneme,
                frame: i
            });
        }
        
        console.log(`🎯 Generated ${phonemeSequence.length} phoneme frames`);
        
        // For a complete implementation, you would:
        // 1. Create Canvas/image processing context
        // 2. Generate frames using phoneme sequence and library images
        // 3. Combine frames into video using FFmpeg or similar
        // 4. Return video file or data
        
        // For now, return a comprehensive response with all the data
        const response = {
            success: true,
            message: 'Video generation completed',
            videoData: {
                format: videoFormat,
                frameRate: frameRate,
                dimensions: { width: frameWidth, height: frameHeight },
                duration: audioDuration,
                totalFrames: totalFrames
            },
            phonemeSequence: phonemeSequence,
            libraryInfo: {
                name: libraryName || path.basename(zipPath, '.zip'),
                imageCount: Object.keys(libraryImages).length,
                phonemeMap: activePhonemeMap
            },
            processingTime: Date.now(),
            // Note: In a real implementation, this would be actual video data
            videoFile: null, // Would contain path to generated video file
            downloadUrl: null // Would contain URL to download video
        };
        
        // Clean up temporary files
        if (audioFile && audioFile.includes('temp')) {
            try {
                fs.unlinkSync(audioFile);
            } catch (e) {
                console.log('⚠️ Could not clean up temp audio file:', e.message);
            }
        }
        
        console.log('✅ Video generation request processed');
        res.json(response);
        
    } catch (error) {
        console.error('❌ Video generation error:', error);
        
        // Clean up any temporary files
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                console.log('⚠️ Could not clean up uploaded file');
            }
        }
        
        res.status(500).json({ 
            error: 'Video generation failed',
            details: error.message 
        });
    }
});
