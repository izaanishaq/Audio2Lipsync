// Natural Phoneme Detection - Based on Real Lip-Sync Principles
class PhonemeDetectorNatural {
    constructor() {
        this.previousMouthShape = null;
        this.shapeStabilityFrames = 0;
        this.minimumShapeFrames = 3;
        this.maxShapeHoldFrames = 12;
        this.silenceFrames = 0;
        this.phonemeCounters = {};
        
        // Natural mouth shape probabilities based on English language frequency
        this.naturalFrequencies = {
            'Uh': 0.25,    // Most common - schwa sound
            'Aa': 0.15,    // Open vowels
            'Ee': 0.12,    // High vowels  
            'Oh': 0.10,    // Back vowels
            'S': 0.08,     // Sibilants
            'M': 0.08,     // Bilabials
            'D': 0.06,     // Alveolars
            'L': 0.05,     // Liquids
            'R': 0.04,     // Rhotics
            'F': 0.03,     // Fricatives
            'Neutral': 0.04  // Silence/transitions
        };
    }

    updateTimingSettings(holdPauseValue, smoothing = 3) {
        // Natural timing based on speech patterns with smoothing
        this.minimumShapeFrames = Math.max(2, holdPauseValue + Math.floor(smoothing / 2));
        this.maxShapeHoldFrames = Math.max(6, holdPauseValue * 2 + smoothing);
        
        console.log(`Natural timing ${holdPauseValue} (smoothing: ${smoothing}): Min=${this.minimumShapeFrames}, Max=${this.maxShapeHoldFrames}`);
    }

    selectMouthShape(audioFrame, frameIndex = 0, mouthShapeMap, uploadedMouthShapes, audioBuffer) {
        const { volume, energy, spectralCentroid, zeroCrossingRate, dynamics } = audioFrame;
        
        // Get audio sensitivity from UI
        const sensitivityEl = document.getElementById('sensitivity');
        const sensitivity = sensitivityEl ? parseFloat(sensitivityEl.value) : 1.4;
        
        // Apply sensitivity scaling to audio features
        const adjustedVolume = Math.min(1.0, volume * sensitivity);
        const adjustedEnergy = Math.min(1.0, energy * sensitivity);
        
        // Calculate simple audio characteristics
        const maxVol = Math.max(...this.audioFeatures?.volume || [1]);
        const normalizedVolume = maxVol > 0 ? adjustedVolume / maxVol : 0;
        
        // Get timing settings with smoothing
        const holdPauseEl = document.getElementById('holdPause');
        const holdPauseValue = holdPauseEl ? parseInt(holdPauseEl.value) : 5;
        const smoothingEl = document.getElementById('smoothing');
        const smoothing = smoothingEl ? parseInt(smoothingEl.value) : 3;
        
        this.updateTimingSettings(holdPauseValue, smoothing);
        
        // Natural temporal smoothing
        if (this.previousMouthShape && this.shapeStabilityFrames < this.maxShapeHoldFrames) {
            this.shapeStabilityFrames++;
            
            if (this.shapeStabilityFrames < this.minimumShapeFrames) {
                return this.previousMouthShape;
            }
            
            // Hold current shape if audio is stable
            if (this.shouldHoldCurrentShape(adjustedVolume, adjustedEnergy, dynamics)) {
                return this.previousMouthShape;
            }
        }
        
        // Natural phoneme selection
        let selectedShape = this.selectNaturalPhoneme(
            adjustedVolume, adjustedEnergy, spectralCentroid, zeroCrossingRate, dynamics, 
            normalizedVolume, frameIndex, mouthShapeMap, uploadedMouthShapes
        );
        
        // Track distribution for natural speech patterns
        if (selectedShape && selectedShape.name) {
            this.phonemeCounters[selectedShape.name] = (this.phonemeCounters[selectedShape.name] || 0) + 1;
            
            if (frameIndex % 120 === 0 && frameIndex > 0) {
                console.log('Natural distribution:', this.phonemeCounters);
                
                // Check if distribution is natural
                const total = Object.values(this.phonemeCounters).reduce((a, b) => a + b, 0);
                const distribution = {};
                Object.keys(this.phonemeCounters).forEach(key => {
                    distribution[key] = (this.phonemeCounters[key] / total * 100).toFixed(1) + '%';
                });
                console.log('Natural percentages:', distribution);
            }
        }
        
        // Update tracking
        if (selectedShape) {
            this.shapeStabilityFrames = 0;
        } else {
            this.shapeStabilityFrames++;
        }
        
        this.previousMouthShape = selectedShape;
        return selectedShape;
    }

    shouldHoldCurrentShape(volume, energy, dynamics) {
        // Natural speech has pauses and sustained sounds
        if (energy < 0.05 || volume < 0.06) {
            this.silenceFrames++;
            return this.silenceFrames < 4; // Short natural pauses
        } else {
            this.silenceFrames = 0;
        }
        
        // Continue shape if audio is stable (natural speech characteristic)
        return dynamics < 0.04;
    }

    selectNaturalPhoneme(volume, energy, spectralCentroid, zeroCrossingRate, dynamics, normalizedVolume, frameIndex, mouthShapeMap, uploadedMouthShapes) {
        
        if (!mouthShapeMap) {
            console.error('mouthShapeMap is null');
            return this.getDefaultShape(uploadedMouthShapes, mouthShapeMap);
        }

        // Natural silence detection
        if (volume < 0.03 || energy < 0.02) {
            if (mouthShapeMap.silence && mouthShapeMap.silence.length > 0) {
                return mouthShapeMap.silence[0];
            }
            return this.getShapeByName('Neutral', mouthShapeMap, uploadedMouthShapes);
        }

        // Create natural distribution based on audio energy levels
        // This mimics how real speech naturally distributes mouth shapes
        
        const audioIntensity = Math.min(1.0, (normalizedVolume + energy) / 2);
        const frequency = Math.min(1.0, spectralCentroid / 2000); // Normalize to 0-1
        const variability = Math.min(1.0, dynamics * 10);
        const noise = Math.min(1.0, zeroCrossingRate * 50);
        
        // Log natural characteristics occasionally
        if (frameIndex % 60 === 0) {
            console.log(`🌿 NATURAL: Intensity=${audioIntensity.toFixed(2)}, Freq=${frequency.toFixed(2)}, Var=${variability.toFixed(2)}, Noise=${noise.toFixed(2)}`);
        }
        
        // Natural shape selection based on weighted probabilities
        const candidates = [];
        
        // Get individual shape bias values from UI
        const shapeBiases = {
            'Uh': parseFloat(document.getElementById('biasUh')?.value || 1.0),
            'Aa': parseFloat(document.getElementById('biasAa')?.value || 1.0),
            'Ee': parseFloat(document.getElementById('biasEe')?.value || 1.0),
            'Oh': parseFloat(document.getElementById('biasOh')?.value || 1.0),
            'S': parseFloat(document.getElementById('biasS')?.value || 1.0),
            'M': parseFloat(document.getElementById('biasM')?.value || 1.0),
            'D': parseFloat(document.getElementById('biasD')?.value || 1.0),
            'L': parseFloat(document.getElementById('biasL')?.value || 1.0),
            'R': parseFloat(document.getElementById('biasR')?.value || 1.0),
            'F': parseFloat(document.getElementById('biasF')?.value || 1.0)
        };
        
        // Most common sounds in natural speech
        if (audioIntensity > 0.1) {
            // Uh - Central vowel, most common in English
            candidates.push({
                name: 'Uh',
                weight: this.naturalFrequencies['Uh'] * (1 + audioIntensity * 0.5) * shapeBiases['Uh'],
                reason: 'central vowel'
            });
            
            // Aa - Open vowel, common in stressed syllables
            if (audioIntensity > 0.3) {
                candidates.push({
                    name: 'Aa',
                    weight: this.naturalFrequencies['Aa'] * (1 + audioIntensity) * shapeBiases['Aa'],
                    reason: 'open vowel'
                });
            }
            
            // Ee - High vowel, appears with higher frequency content
            if (frequency > 0.4) {
                candidates.push({
                    name: 'Ee',
                    weight: this.naturalFrequencies['Ee'] * (1 + frequency) * shapeBiases['Ee'],
                    reason: 'high vowel'
                });
            }
            
            // Oh - Back vowel, appears with lower frequency content
            if (frequency < 0.4 && audioIntensity > 0.2) {
                candidates.push({
                    name: 'Oh',
                    weight: this.naturalFrequencies['Oh'] * (1 + (1 - frequency)) * shapeBiases['Oh'],
                    reason: 'back vowel'
                });
            }
        }
        
        // Consonants based on audio characteristics
        if (variability > 0.1 || noise > 0.2) {
            // S - Sibilant, high frequency noise
            if (noise > 0.3 && frequency > 0.5) {
                candidates.push({
                    name: 'S',
                    weight: this.naturalFrequencies['S'] * (1 + noise + frequency) * shapeBiases['S'],
                    reason: 'sibilant'
                });
            }
            
            // D - Plosive, shows up as dynamics
            if (variability > 0.2 && audioIntensity > 0.2) {
                candidates.push({
                    name: 'D',
                    weight: this.naturalFrequencies['D'] * (1 + variability) * shapeBiases['D'],
                    reason: 'plosive'
                });
            }
            
            // M - Bilabial, low frequency with some dynamics
            if (frequency < 0.3 && variability > 0.1) {
                candidates.push({
                    name: 'M',
                    weight: this.naturalFrequencies['M'] * (1 + variability * (1 - frequency)) * shapeBiases['M'],
                    reason: 'bilabial'
                });
            }
            
            // L - Liquid, mid-range characteristics
            if (frequency > 0.2 && frequency < 0.6 && audioIntensity > 0.15) {
                candidates.push({
                    name: 'L',
                    weight: this.naturalFrequencies['L'] * (1 + audioIntensity) * shapeBiases['L'],
                    reason: 'liquid'
                });
            }
            
            // R - Rhotic, low frequency with energy
            if (frequency < 0.4 && audioIntensity > 0.2) {
                candidates.push({
                    name: 'R',
                    weight: this.naturalFrequencies['R'] * (1 + audioIntensity * (1 - frequency)) * shapeBiases['R'],
                    reason: 'rhotic'
                });
            }
            
            // F - Fricative, high frequency with dynamics
            if (frequency > 0.4 && variability > 0.15) {
                candidates.push({
                    name: 'F',
                    weight: this.naturalFrequencies['F'] * (1 + frequency + variability) * shapeBiases['F'],
                    reason: 'fricative'
                });
            }
        }
        
        // Filter candidates to only include uploaded shapes
        const validCandidates = candidates.filter(c => uploadedMouthShapes[c.name]);
        
        if (validCandidates.length === 0) {
            return this.getDefaultShape(uploadedMouthShapes, mouthShapeMap);
        }
        
        // Weighted random selection for natural variation
        const totalWeight = validCandidates.reduce((sum, c) => sum + c.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const candidate of validCandidates) {
            random -= candidate.weight;
            if (random <= 0) {
                if (Math.random() < 0.01) {
                    console.log(`🌿 SELECTED ${candidate.name} (${candidate.reason}) weight=${candidate.weight.toFixed(3)}`);
                }
                return this.getShapeByName(candidate.name, mouthShapeMap, uploadedMouthShapes);
            }
        }
        
        // Fallback to highest weighted
        const best = validCandidates.sort((a, b) => b.weight - a.weight)[0];
        return this.getShapeByName(best.name, mouthShapeMap, uploadedMouthShapes);
    }

    getShapeByName(name, mouthShapeMap, uploadedMouthShapes) {
        if (!uploadedMouthShapes[name]) {
            return this.getDefaultShape(uploadedMouthShapes, mouthShapeMap);
        }
        
        // Find in appropriate category
        if (['Aa', 'Ee', 'Oh', 'Uh'].includes(name)) {
            return mouthShapeMap.vowels?.find(v => v.name === name);
        } else if (['S', 'D', 'M', 'L', 'R', 'F'].includes(name)) {
            return mouthShapeMap.consonants?.find(c => c.name === name);
        } else {
            return mouthShapeMap.silence?.find(s => s.name === name);
        }
    }

    getDefaultShape(uploadedMouthShapes, mouthShapeMap) {
        // Prefer neutral for fallback
        if (uploadedMouthShapes['Neutral']) {
            if (mouthShapeMap && mouthShapeMap.silence) {
                const neutralShape = mouthShapeMap.silence.find(s => s.name === 'Neutral');
                if (neutralShape) return neutralShape;
            }
        }
        
        // Or most common vowel
        if (uploadedMouthShapes['Uh']) {
            return mouthShapeMap.vowels?.find(v => v.name === 'Uh');
        }
        
        // Return first available
        if (mouthShapeMap && mouthShapeMap.all && mouthShapeMap.all.length > 0) {
            return mouthShapeMap.all[0];
        }
        
        return { index: 0, name: 'Neutral', category: 'fallback' };
    }
}

// Export for use in main script
window.PhonemeDetectorNatural = PhonemeDetectorNatural;
