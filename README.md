# Audio2LipSync

Generate lip-sync animations from audio using phoneme-based mouth shape mapping.

## Quick Start

1. **Upload audio file** (MP3, WAV, OGG, M4A)
2. **Upload 14 phoneme mouth shapes** (SVG format): `Neutral`, `M`, `S`, `D`, `Ee`, `Aa`, `Uh`, `Oh`, `R`, `W-Oo`, `F`, `L`, `Smile`, `Surprised`
3. **Configure settings**: FPS (24 recommended), sensitivity (0.1-2.0), smoothing (0-10)
4. **Generate animation**
5. **Download** as HD frames (ZIP) or MP4 video (1080p/4K)

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


## API Integration

## Library System

- **Save**: Store mouth shape sets for reuse
- **Load**: Quick access to saved phoneme sets
- **Export/Import**: Share libraries as JSON files
- **Manage**: Organize and delete unused sets

## Phoneme Shapes Reference

| Shape | Sounds | Description |
|-------|--------|-------------|
| Neutral | Silence | Closed mouth |
| M | M, P, B | Lips together |
| S | S, Z, TH | Tongue to teeth |
| D | D, T, N, L | Tongue to roof |
| Ee | EE, I, Y | Wide smile |
| Aa | AA, A, AH | Open vowels |
| Uh | UH, U, ER | Neutral open |
| Oh | OH, O, AW | Rounded lips |
| R | R | Pursed lips |
| W-Oo | W, OO, QU | Very rounded |
| F | F, V | Lip to teeth |
| L | L | Tongue visible |
| Smile | Happy | Happy expression |
| Surprised | Shock | Wide open |

## API Integration

```bash
cd api && npm install && npm start
```

```javascript
const client = new LipSyncAPIClient('http://localhost:3001/api');
const job = await client.generateAnimation(audioFile, imageFiles, options);
const result = await client.waitForCompletion(job.jobId);
```

See [api/README.md](api/README.md) for complete documentation.

## Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- SVG mouth shape files named exactly as phoneme shapes
- Audio files: MP3, WAV, OGG, M4A

## Troubleshooting

- **Poor sync**: Use all 14 phoneme shapes, try phoneme-based mapping
- **Shapes not recognized**: Check exact file naming (case-insensitive)
- **Performance issues**: Use lower FPS, shorter audio files
- **Upload problems**: Verify file formats and refresh page
