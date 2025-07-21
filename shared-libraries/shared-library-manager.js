// Shared Library Storage Manager
// Works for both frontend (via file:// protocol) and API (Node.js)

class SharedLibraryManager {
    constructor() {
        this.isNode = typeof window === 'undefined';
        this.baseDir = this.isNode ? 
            require('path').join(__dirname) :
            '../shared-libraries';
        this.librariesFile = this.isNode ?
            require('path').join(this.baseDir, 'libraries.json') :
            `${this.baseDir}/libraries.json`;
        this.dataDir = this.isNode ?
            require('path').join(this.baseDir, 'library-data') :
            `${this.baseDir}/library-data`;
        
        if (this.isNode) {
            this.fs = require('fs');
            this.path = require('path');
        }
        
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (this.isNode) {
            // Node.js - create directories if they don't exist
            if (!this.fs.existsSync(this.baseDir)) {
                this.fs.mkdirSync(this.baseDir, { recursive: true });
            }
            if (!this.fs.existsSync(this.dataDir)) {
                this.fs.mkdirSync(this.dataDir, { recursive: true });
            }
            if (!this.fs.existsSync(this.librariesFile)) {
                this.fs.writeFileSync(this.librariesFile, JSON.stringify({}, null, 2));
            }
        }
    }

    // Node.js methods
    async loadLibrariesNode() {
        try {
            if (this.fs.existsSync(this.librariesFile)) {
                const data = this.fs.readFileSync(this.librariesFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading libraries (Node):', error);
        }
        return {};
    }

    async saveLibrariesNode(libraries) {
        try {
            this.fs.writeFileSync(this.librariesFile, JSON.stringify(libraries, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving libraries (Node):', error);
            throw error;
        }
    }

    async loadLibraryDataNode(libraryName) {
        try {
            const filePath = this.path.join(this.dataDir, `${libraryName}.json`);
            if (this.fs.existsSync(filePath)) {
                const data = this.fs.readFileSync(filePath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading library data (Node):', error);
        }
        return null;
    }

    async saveLibraryDataNode(libraryName, libraryData) {
        try {
            const filePath = this.path.join(this.dataDir, `${libraryName}.json`);
            this.fs.writeFileSync(filePath, JSON.stringify(libraryData, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving library data (Node):', error);
            throw error;
        }
    }

    async deleteLibraryDataNode(libraryName) {
        try {
            const filePath = this.path.join(this.dataDir, `${libraryName}.json`);
            if (this.fs.existsSync(filePath)) {
                this.fs.unlinkSync(filePath);
            }
            return true;
        } catch (error) {
            console.error('Error deleting library data (Node):', error);
            throw error;
        }
    }

    // Browser methods (localStorage + API sync)
    async loadLibrariesBrowser() {
        try {
            // Try to load from localStorage first
            const stored = localStorage.getItem('sharedLibraries');
            if (stored) {
                return JSON.parse(stored);
            }
            
            // Fallback to old localStorage format and migrate
            const oldStored = localStorage.getItem('lipSyncLibraries');
            if (oldStored) {
                const oldLibraries = JSON.parse(oldStored);
                // Convert old format to index format
                const indexLibraries = {};
                for (const [name, lib] of Object.entries(oldLibraries)) {
                    indexLibraries[name] = {
                        name: lib.name || name,
                        createdAt: lib.createdAt || new Date().toISOString(),
                        imageCount: lib.imageCount || (lib.images ? lib.images.length : 0)
                    };
                }
                await this.saveLibrariesBrowser(indexLibraries);
                return indexLibraries;
            }
        } catch (error) {
            console.error('Error loading libraries (Browser):', error);
        }
        return {};
    }

    async saveLibrariesBrowser(libraries) {
        try {
            localStorage.setItem('sharedLibraries', JSON.stringify(libraries));
            return true;
        } catch (error) {
            console.error('Error saving libraries (Browser):', error);
            throw error;
        }
    }

    async loadLibraryDataBrowser(libraryName) {
        try {
            const libraries = await this.loadLibrariesBrowser();
            return libraries[libraryName] || null;
        } catch (error) {
            console.error('Error loading library data (Browser):', error);
            return null;
        }
    }

    async saveLibraryDataBrowser(libraryName, libraryData) {
        try {
            const libraries = await this.loadLibrariesBrowser();
            libraries[libraryName] = libraryData;
            await this.saveLibrariesBrowser(libraries);
            return true;
        } catch (error) {
            console.error('Error saving library data (Browser):', error);
            throw error;
        }
    }

    async deleteLibraryDataBrowser(libraryName) {
        try {
            const libraries = await this.loadLibrariesBrowser();
            delete libraries[libraryName];
            await this.saveLibrariesBrowser(libraries);
            return true;
        } catch (error) {
            console.error('Error deleting library data (Browser):', error);
            throw error;
        }
    }

    // Universal API methods
    async loadLibraries() {
        if (this.isNode) {
            return await this.loadLibrariesNode();
        } else {
            return await this.loadLibrariesBrowser();
        }
    }

    async saveLibraries(libraries) {
        if (this.isNode) {
            return await this.saveLibrariesNode(libraries);
        } else {
            return await this.saveLibrariesBrowser(libraries);
        }
    }

    async loadLibraryData(libraryName) {
        if (this.isNode) {
            return await this.loadLibraryDataNode(libraryName);
        } else {
            return await this.loadLibraryDataBrowser(libraryName);
        }
    }

    async saveLibraryData(libraryName, libraryData) {
        if (this.isNode) {
            return await this.saveLibraryDataNode(libraryName, libraryData);
        } else {
            return await this.saveLibraryDataBrowser(libraryName, libraryData);
        }
    }

    async deleteLibraryData(libraryName) {
        if (this.isNode) {
            return await this.deleteLibraryDataNode(libraryName);
        } else {
            return await this.deleteLibraryDataBrowser(libraryName);
        }
    }

    async listLibraries() {
        const libraries = await this.loadLibraries();
        return Object.keys(libraries).map(name => {
            const lib = libraries[name];
            return {
                name: lib.name || name,
                createdAt: lib.createdAt || new Date().toISOString(),
                imageCount: lib.imageCount || (lib.images ? lib.images.length : 0)
            };
        });
    }

    async saveLibrary(libraryName, libraryData) {
        // Add metadata
        const enrichedData = {
            ...libraryData,
            name: libraryName,
            createdAt: libraryData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save to individual file
        await this.saveLibraryData(libraryName, enrichedData);

        // Update libraries index
        const libraries = await this.loadLibraries();
        libraries[libraryName] = {
            name: libraryName,
            createdAt: enrichedData.createdAt,
            updatedAt: enrichedData.updatedAt,
            imageCount: enrichedData.imageCount || (enrichedData.images ? enrichedData.images.length : 0)
        };
        await this.saveLibraries(libraries);

        return true;
    }

    async deleteLibrary(libraryName) {
        // Delete from individual file
        await this.deleteLibraryData(libraryName);

        // Update libraries index
        const libraries = await this.loadLibraries();
        delete libraries[libraryName];
        await this.saveLibraries(libraries);

        return true;
    }

    async getLibrary(libraryName) {
        return await this.loadLibraryData(libraryName);
    }

    // Export/Import utilities for syncing
    async exportAllLibraries() {
        const libraries = await this.loadLibraries();
        const exportData = {};
        
        for (const libraryName of Object.keys(libraries)) {
            const libraryData = await this.loadLibraryData(libraryName);
            if (libraryData) {
                exportData[libraryName] = libraryData;
            }
        }
        
        return exportData;
    }

    async importLibraries(importData) {
        for (const [libraryName, libraryData] of Object.entries(importData)) {
            await this.saveLibrary(libraryName, libraryData);
        }
        return true;
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharedLibraryManager;
} else {
    window.SharedLibraryManager = SharedLibraryManager;
}
