# Lip-Sync Anim## ✨ New Features

- **� Modern Aceternity UI**: Beautiful glassmorphism design with animated components and gradient accents
- **✨ Interactive Animations**: Smooth hover effects, floating elements, shimmer transitions, and ripple click effects
- **�🎵 Audio-Synced Preview**: Preview your animation with synchronized audio playback
- **🖌️ Customizable Video Background**: Adjustable background color (default: black)
- **📱 Responsive Design**: Fully responsive layout optimized for all screen sizes
- **🎯 Professional Dark Theme**: Modern dark color scheme with purple accent gradients
- **🔌 API Integration**: Complete REST API for programmatic access
- **⚡ Enhanced Performance**: Faster processing and improved user experience
- **🧠 Deterministic Audio Analysis**: Precise, feature-based phoneme detection with zero randomness
- **🎭 Advanced Acoustic Mapping**: Multi-feature analysis including formants, spectral rolloff, and zero-crossing rate
- **📚 Lips Library**: Save and reuse phoneme mouth shape sets - no need to upload every time!
- **🎬 Ultra HD Video Export**: Export in Full HD (1920x1080) or Ultra HD 4K (3840x2160)
- **💎 Premium Quality**: Ultra-high bitrates (up to 25 Mbps) for crystal-clear output

## 🎨 Premium Aceternity UI Features

- **✨ Interactive Glassmorphism Cards**: Modern frosted glass effects with advanced hover animations
- **🌟 Enhanced File Upload**: Grid patterns, spotlight effects, and animated drag & drop areas
- **🎯 Stateful Buttons**: Loading states, success animations, and mouse-tracking effects
- **📊 Advanced Progress Indicators**: Beam animations, glow effects, and animated status dots
- **🎭 3D Card Tilt Effects**: Mouse-responsive card transformations and depth
- **🎨 Dynamic Color Gradients**: Animated text gradients and shifting backgrounds
- **⚡ GPU-Accelerated Animations**: Smooth 60fps performance with hardware acceleration
- **📱 Responsive Modern Design**: Adaptive layouts that work perfectly on all devices
- **🔍 Mouse Spotlight Tracking**: Interactive spotlight effects that follow cursor movement
- **🌊 Floating Particle System**: Ambient particle animations for visual appeal

A web-based tool that automatically creates mouth animations synchronized with voiceover recordings using standardized phoneme mouth shapes. Perfect for animators and content creators who need accurate lip-sync sequences based on linguistic phonemes.

## Future Features

- Advanced phoneme detection using AI/ML
- Batch processing for multiple audio files
- Custom timing adjustments
- Integration with popular animation software
- Real-time lip-sync preview during audio playback
- API server integration of phoneme-based mapping
- Custom phoneme set definitions
- Facial expression integration beyond mouth shapes

## ✨ New Features

- **🎵 Audio-Synced Preview**: Preview your animation with synchronized audio playback
- **🎨 Customizable Video Background**: Adjustable background color (default: black)
- **📱 Compact UI**: Optimized layout that fits on screen without scrolling
- **🎯 Modern Dark Theme**: Professional dark color scheme
- **🔌 API Integration**: Complete REST API for programmatic access
- **⚡ Enhanced Performance**: Faster processing and improved user experience
- **🧠 Intelligent Expression Mapping**: Advanced audio analysis for phoneme-based mouth shapes
- **🎭 Standardized Phoneme Support**: Works with 14 predefined phoneme mouth shapes for accuracy
- **📚 Lips Library**: Save and reuse phoneme mouth shape sets - no need to upload every time!
- **🎬 Ultra HD Video Export**: Export in Full HD (1920x1080) or Ultra HD 4K (3840x2160)
- **💎 Premium Quality**: Ultra-high bitrates (up to 25 Mbps) for crystal-clear output

## Features

- **🎨 Modern Aceternity UI**: Beautiful glassmorphism interface with animated components, gradient accents, and smooth transitions
- **🔬 Advanced Audio Analysis**: Multi-feature analysis (volume, energy, spectral characteristics, formant frequencies, spectral rolloff, zero-crossing rate) for highly accurate lip-sync
- **🤖 Deterministic Phoneme Mapping**: Accurately maps audio to standardized phoneme mouth shapes using acoustic feature analysis - no randomness, only data-driven selection
- **⚡ Enhanced Spectral Analysis**: Uses FFT-based spectral centroid calculation and MFCC-like features for precise phoneme classification
- **🎯 Formant-Based Vowel Detection**: Analyzes formant frequencies to accurately distinguish between different vowel sounds
- **📊 Acoustic Feature Classification**: Uses zero-crossing rate, spectral rolloff, and spectral flux for consonant discrimination
- **🌊 Temporal Smoothing**: Intelligent smoothing system prevents rapid, unnatural mouth shape changes while maintaining accuracy
- **📐 Standardized Mouth Shapes**: Uses 14 predefined phoneme shapes for linguistic accuracy
- **Lips Library System**: Save and reuse phoneme mouth shape sets across projects
- **Multiple Mapping Modes**: Choose between phoneme-based mapping or simple volume-based mapping
- **Customizable Settings**: Adjustable frame rate, audio sensitivity, and animation smoothing
- **Audio-Synced Preview**: Preview your animation with synchronized audio playback
- **Customizable Video Background**: Choose any background color for your video output
- **Multiple Export Options**: Download as ultra-high-quality ZIP frames (1920x1080 PNG) or WebM video (with audio)
- **Ultra HD Video Quality**: Choose between Full HD (1080p) or Ultra HD 4K (2160p) export
- **Premium Video Encoding**: Up to 25 Mbps bitrate with H.264/VP9 codecs for maximum quality
- **MP4 Format**: Exports in MP4 format when supported (WebM fallback for compatibility)
- **Drag & Drop Support**: Easy file uploading with drag and drop functionality
- **Responsive Design**: Compact UI optimized for all screen sizes
- **Modern Dark Theme**: Professional appearance with custom color scheme
- **API Integration**: Complete REST API for programmatic integration
- **Browser-based Processing**: All processing happens locally, no server required

## How to Use

### 1. Upload Your Files

**Voiceover Audio:**
- Click "Upload Voiceover" or drag an audio file (MP3, WAV, etc.)
- The tool will analyze the audio volume levels

**Mouth Shape Images:**
- Prepare SVG images of the 14 required phoneme mouth shapes
- Name them exactly as: `Neutral.svg`, `M.svg`, `S.svg`, `D.svg`, `Ee.svg`, `Aa.svg`, `Uh.svg`, `Oh.svg`, `R.svg`, `W-Oo.svg`, `F.svg`, `L.svg`, `Smile.svg`, `Surprised.svg`
- **Option 1**: Load from saved library (if you've used this phoneme set before)
- **Option 2**: Upload new SVG files and save them to library for future use
- The app will automatically validate and categorize your phoneme shapes

### 2. Configure Settings

**Frame Rate (FPS):**
- Choose from 12, 24, 30, or 60 FPS
- 24 FPS is standard for most animations

**Audio Sensitivity:**
- Adjust how responsive the mouth movements are to audio volume
- Higher values = more dramatic mouth movements
- Range: 0.1 to 2.0

**Animation Smoothing:**
- Reduces jittery movements between frames
- Higher values = smoother but less responsive animation
- Range: 0 to 10

**Expression Mapping:**
- **Phoneme-based (Recommended)**: Uses advanced audio analysis for standardized phoneme mouth shapes
- **Volume-based (Legacy)**: Simple volume-to-openness mapping for traditional sequences

### 3. Using the Lips Library System

**Save Your Mouth Shapes:**
1. Upload your mouth shape images
2. Click "Save Current Set" 
3. Give your library a descriptive name (e.g., "Character_Expressions", "Smirk_Set")
4. Your mouth shapes are now saved for future projects!

**Load Saved Libraries:**
1. Use the "Saved Libraries" dropdown
2. Select a previously saved mouth shape set
3. Images load instantly - no need to re-upload!

**Manage Libraries:**
- **Export**: Download library as JSON file for backup or sharing
- **Import**: Load library files from other projects or teammates
- **Delete**: Remove unused libraries to keep things organized

**Benefits:**
- Save time on repeated projects
- Share mouth shape sets with team members
- Maintain consistency across multiple animations
- Backup your custom mouth shape collections

### 4. Generate Animation

- Click "Generate Animation" to start processing
- The tool will analyze your audio and create frame-by-frame animation
- Progress bar shows current status

### 5. Preview and Download

**Preview:**
- Use play/pause/stop controls to preview your animation
- Check if the mouth movements sync well with your audio

**Download Options:**
- **HD ZIP Frames**: Ultra high-quality individual PNG frames (1920x1080) for use in animation software
- **Ultra HD MP4**: Combined MP4 video with synchronized audio in Full HD or 4K quality
- **Professional Quality**: All exports use maximum quality settings with optimized compression

## Technical Requirements

- Modern web browser with Web Audio API support
- Chrome, Firefox, Safari, or Edge (latest versions)
- No additional software installation required

### File Recommendations

#### Audio Files
- **Format**: MP3, WAV, OGG, or M4A
- **Quality**: 44.1kHz sample rate recommended
- **Length**: Any duration (longer files may take more processing time)

#### Phoneme Shape Images
- **Format**: SVG files only (scalable vector graphics)
- **Naming**: Must match required phoneme names exactly (case-insensitive)
- **Content**: Clean, distinct mouth shapes representing each phoneme
- **Required**: All 14 shapes for optimal results (minimum 8 for basic functionality)

### Mouth Shape Images

#### Required Phoneme Shapes (14 total)

The application requires exactly 14 standardized phoneme mouth shapes. Each shape corresponds to specific speech sounds:

| **Shape Name** | **Phonemes/Sounds** | **Description** | **Example Words** |
|----------------|---------------------|-----------------|-------------------|
| **Neutral** | Silence, pauses | Closed mouth for silence | (quiet moments) |
| **M** | M, P, B | Lips pressed together | **M**ama, **P**apa, **B**aby |
| **S** | S, Z, TH | Tongue against teeth | **S**un, **Z**oo, **Th**ink |
| **D** | D, T, N, L | Tongue to roof of mouth | **D**og, **T**op, **N**ew |
| **Ee** | EE, I, Y | Wide smile shape | S**ee**, **I**t, **Y**es |
| **Aa** | AA, A, AH | Open mouth for vowels | C**a**t, **A**pple, **Ah** |
| **Uh** | UH, U, ER | Neutral open mouth | B**u**t, **U**p, H**er** |
| **Oh** | OH, O, AW | Rounded lips | G**o**, **O**pen, **Aw**e |
| **R** | R | Pursed lips for R sound | **R**ed, Ca**r** |
| **W-Oo** | W, OO, QU | Very rounded lips | **W**ater, B**oo**k, **Qu**een |
| **F** | F, V | Lower lip to upper teeth | **F**ish, **V**ery |
| **L** | L | Tongue visible | **L**ove, Fe**l**l |
| **Smile** | Smile, happy | Happy expression | (emotional expressions) |
| **Surprised** | Surprised, shock | Wide open mouth | (exclamations, gasps) |

#### File Naming Requirements

Name your SVG or PNG files exactly as the shape names above:
- ✅ `Neutral.svg`, `M.svg`, `S.svg`, `D.svg`, etc.
- ✅ `neutral.png`, `m.png`, `s.png`, `d.png`, etc. (case-insensitive)
- ✅ `mouth_Neutral.svg`, `shape_M.svg`, etc. (with prefixes)
- ❌ `mouth_01.svg`, `shape_A.svg`, `random_name.svg` (won't be recognized)

## Tips for Best Results

1. **Audio Quality**: Use clear audio with minimal background noise for optimal feature extraction
2. **Phoneme Accuracy**: Create distinct differences between each phoneme mouth shape
3. **Complete Set**: Upload all 14 required phoneme shapes for maximum accuracy and feature utilization
4. **File Naming**: Name files exactly as shown in the phoneme table above
5. **Sensitivity**: Start with default settings and adjust based on your audio characteristics
6. **Smoothing**: Use moderate smoothing (2-3) for natural movement without losing accuracy
7. **Frame Rate**: 24 FPS provides good balance of quality and file size
8. **Mapping Mode**: Use "Phoneme-based" for deterministic, feature-driven mouth shape mapping
9. **Library Management**: Save your phoneme sets to avoid re-uploading
10. **Quality Check**: Preview the animation before exporting to verify accurate phoneme mapping
11. **Audio Characteristics**: The system now uses advanced acoustic analysis - clearer speech will result in more accurate mouth shapes
12. **Deterministic Results**: The same audio file will always produce the same mouth shape sequence (no randomness)

## Browser Compatibility

### Video Export
- ✅ Chrome 66+ (Recommended)
- ✅ Firefox 60+
- ✅ Edge 79+
- ⚠️ Safari 14+ (Limited support)

### Audio Processing
- ✅ Chrome 66+
- ✅ Firefox 60+
- ✅ Safari 12+
- ✅ Edge 79+

**Note**: Video export works best in Chrome and Firefox. If you experience issues with video export, the ZIP download will always work as a fallback.

## Privacy

- All processing happens in your browser
- No files are uploaded to external servers
- Your audio and images stay on your device
- Saved mouth shape libraries are stored locally in your browser
- Export libraries as JSON files to backup or share with teammates

## API Integration

The application now includes a complete REST API for programmatic access:

### Quick Start with API

1. **Start the API server:**
```bash
cd api
npm install
npm start
```

2. **Use the API client:**
```javascript
const client = new LipSyncAPIClient('http://localhost:3001/api');

const job = await client.generateAnimation(audioFile, imageFiles, {
    fps: 24,
    sensitivity: 1.2,
    backgroundColor: '#000000',
    format: 'video'
});

const result = await client.waitForCompletion(job.jobId);
await client.downloadFile(job.jobId);
```

For complete API documentation, see [api/README.md](api/README.md).

**Note:** The web application includes advanced intelligent expression mapping optimized for expressive mouth shape sets. The API server currently uses simplified mapping for demonstration purposes. For best results with expressive sets like smirks and grins, use the web application directly.

## Future Features

- MP4 export format (currently exports as WebM)
- Advanced mouth shape detection using AI
- Batch processing for multiple audio files
- Custom timing adjustments
- Integration with popular animation software
- Real-time lip-sync preview during audio playback
- API server integration of intelligent expression mapping
- Custom expression category definitions

## Troubleshooting

**Animation doesn't sync well:**
- Ensure you have uploaded all 14 required phoneme shapes
- Try the "Phoneme-based" mapping mode for standardized mouth shapes
- Adjust audio sensitivity and smoothing settings
- Check that mouth shapes are named correctly (see phoneme table)
- For traditional open/closed sequences, use "Volume-based" mapping

**Phoneme shapes not recognized:**
- Check file naming matches exactly: Neutral, M, S, D, Ee, Aa, Uh, Oh, R, W-Oo, F, L, Smile, Surprised
- Use SVG or PNG format only
- Ensure files aren't corrupted
- Try adding prefixes like "mouth_Neutral.svg" if needed

**Browser performance issues:**
- Use shorter audio files for testing
- Close other browser tabs
- Try a lower frame rate (12 or 24 FPS)

**Files won't upload:**
- Check file formats (PNG for images, common audio formats)
- Ensure files aren't corrupted
- Try refreshing the page

---

Built with modern web technologies for fast, client-side processing. No server required!

## Video Quality

- **Full HD (1920x1080)**: High-quality output perfect for most projects
- **Ultra HD 4K (3840x2160)**: Maximum quality for professional productions
- Higher quality means larger file sizes but superior visual clarity

**Video Encoding:**
- Automatically uses H.264 codec with AAC audio for MP4 format (best compatibility)
- Falls back to VP9 codec with Opus audio for WebM if MP4 not supported
- Bitrates: Up to 12 Mbps for 1080p, 25 Mbps for 4K
- Multiple fallback options ensure compatibility across browsers

## 🎬 Video Format Support

**MP4 Export (Preferred):**
- Best compatibility across devices and platforms
- Uses H.264 video codec with AAC audio
- Supported in Chrome, Edge, Safari, and most modern browsers
- Automatically selected when available

**WebM Export (Fallback):**
- Used when MP4 is not supported by the browser
- Uses VP9/VP8 video codec with Opus/Vorbis audio  
- Excellent quality but less universal compatibility
- Works in Chrome, Firefox, and other Chromium-based browsers

The app automatically detects your browser's capabilities and chooses the best available format for maximum quality and compatibility.
