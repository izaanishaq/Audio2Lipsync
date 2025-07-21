// Audio Processing and Feature Extraction Module
class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.audioFeatures = null;
    }

    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            return true;
        } catch (error) {
            console.error('Error initializing audio context:', error);
            return false;
        }
    }

    async loadAudioFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    resolve(this.audioBuffer);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    extractAudioFeatures(channelData, totalFrames, samplesPerFrame, sensitivity, updateProgressCallback) {
        const features = {
            volume: [],
            energy: [],
            spectralCentroid: [],
            zeroCrossingRate: [],
            dynamics: [],
            spectralRolloff: [],
            spectralFlux: [],
            formantFrequencies: []
        };
        
        let previousSpectrum = null;
        
        for (let frame = 0; frame < totalFrames; frame++) {
            const startSample = frame * samplesPerFrame;
            const endSample = Math.min(startSample + samplesPerFrame, channelData.length);
            const frameData = channelData.slice(startSample, endSample);
            
            // Volume (RMS)
            const rms = Math.sqrt(frameData.reduce((sum, val) => sum + val * val, 0) / frameData.length);
            features.volume.push(rms * sensitivity);
            
            // Energy
            const energy = frameData.reduce((sum, val) => sum + Math.abs(val), 0) / frameData.length;
            features.energy.push(energy * sensitivity);
            
            // Zero Crossing Rate (indicates speech characteristics)
            let zeroCrossings = 0;
            for (let i = 1; i < frameData.length; i++) {
                if ((frameData[i-1] >= 0) !== (frameData[i] >= 0)) {
                    zeroCrossings++;
                }
            }
            features.zeroCrossingRate.push(zeroCrossings / frameData.length);
            
            // Enhanced Spectral Centroid
            const spectralCentroid = this.calculateSpectralCentroid(frameData);
            features.spectralCentroid.push(spectralCentroid);
            
            // Spectral Rolloff (frequency below which 85% of energy is contained)
            const spectralRolloff = this.calculateSpectralRolloff(frameData);
            features.spectralRolloff.push(spectralRolloff);
            
            // Spectral Flux (rate of change in frequency content)
            const powerSpectrum = this.calculatePowerSpectrum(frameData);
            let spectralFlux = 0;
            if (previousSpectrum) {
                for (let i = 0; i < Math.min(powerSpectrum.length, previousSpectrum.length); i++) {
                    spectralFlux += Math.abs(powerSpectrum[i] - previousSpectrum[i]);
                }
                spectralFlux /= powerSpectrum.length;
            }
            features.spectralFlux.push(spectralFlux);
            previousSpectrum = powerSpectrum;
            
            // Formant frequencies (simplified estimation)
            const formants = this.estimateFormants(frameData);
            features.formantFrequencies.push(formants);
            
            // Dynamics (rate of change)
            if (frame > 0) {
                const prevVolume = features.volume[frame - 1];
                const currentVolume = features.volume[frame];
                features.dynamics.push(Math.abs(currentVolume - prevVolume));
            } else {
                features.dynamics.push(0);
            }
            
            if (frame % 100 === 0 && updateProgressCallback) {
                updateProgressCallback(30 + (frame / totalFrames) * 40, `Analyzing frame ${frame}/${totalFrames}...`);
            }
        }
        
        return features;
    }

    calculateSpectralCentroid(frameData) {
        if (frameData.length === 0) return 0;
        
        const fftSize = Math.min(frameData.length, 1024);
        const halfFFT = fftSize / 2;
        const sampleRate = this.audioBuffer?.sampleRate || 44100;
        const nyquist = sampleRate / 2;
        
        const powerSpectrum = new Array(halfFFT).fill(0);
        
        for (let k = 0; k < halfFFT; k++) {
            let real = 0;
            let imag = 0;
            
            const step = Math.floor(frameData.length / fftSize);
            for (let n = 0; n < frameData.length; n += step) {
                const angle = -2 * Math.PI * k * n / fftSize;
                real += frameData[n] * Math.cos(angle);
                imag += frameData[n] * Math.sin(angle);
            }
            
            powerSpectrum[k] = Math.sqrt(real * real + imag * imag);
        }
        
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < powerSpectrum.length; i++) {
            const frequency = (i * nyquist) / powerSpectrum.length;
            const magnitude = powerSpectrum[i];
            
            numerator += frequency * magnitude;
            denominator += magnitude;
        }
        
        return denominator > 0 ? numerator / denominator : 0;
    }

    calculateSpectralRolloff(frameData) {
        const powerSpectrum = this.calculatePowerSpectrum(frameData);
        const totalPower = powerSpectrum.reduce((sum, val) => sum + val, 0);
        const threshold = totalPower * 0.85;
        
        let cumulativePower = 0;
        for (let i = 0; i < powerSpectrum.length; i++) {
            cumulativePower += powerSpectrum[i];
            if (cumulativePower >= threshold) {
                const sampleRate = this.audioBuffer?.sampleRate || 44100;
                return (i * sampleRate) / (2 * powerSpectrum.length);
            }
        }
        
        return 0;
    }

    calculatePowerSpectrum(frameData) {
        const fftSize = Math.min(frameData.length, 512);
        const powerSpectrum = new Array(fftSize / 2).fill(0);
        
        for (let k = 0; k < powerSpectrum.length; k++) {
            let real = 0;
            let imag = 0;
            
            for (let n = 0; n < frameData.length; n++) {
                const angle = -2 * Math.PI * k * n / fftSize;
                real += frameData[n] * Math.cos(angle);
                imag += frameData[n] * Math.sin(angle);
            }
            
            powerSpectrum[k] = real * real + imag * imag;
        }
        
        return powerSpectrum;
    }

    estimateFormants(frameData) {
        const powerSpectrum = this.calculatePowerSpectrum(frameData);
        const sampleRate = this.audioBuffer?.sampleRate || 44100;
        const formants = [];
        
        for (let i = 1; i < powerSpectrum.length - 1; i++) {
            if (powerSpectrum[i] > powerSpectrum[i-1] && powerSpectrum[i] > powerSpectrum[i+1]) {
                const frequency = (i * sampleRate) / (2 * powerSpectrum.length);
                if (frequency > 100 && frequency < 4000) {
                    formants.push({
                        frequency: frequency,
                        magnitude: powerSpectrum[i]
                    });
                }
            }
        }
        
        formants.sort((a, b) => b.magnitude - a.magnitude);
        return formants.slice(0, 3);
    }

    smoothAudioFeatures(smoothing) {
        if (!this.audioFeatures) return;
        
        for (const [featureName, values] of Object.entries(this.audioFeatures)) {
            for (let i = 0; i < values.length; i++) {
                let sum = 0;
                let count = 0;
                
                for (let j = Math.max(0, i - smoothing); j <= Math.min(values.length - 1, i + smoothing); j++) {
                    sum += values[j];
                    count++;
                }
                
                values[i] = sum / count;
            }
        }
    }
}

// Export for use in main script
window.AudioProcessor = AudioProcessor;
