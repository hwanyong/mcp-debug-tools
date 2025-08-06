import * as net from 'net'

/**
 * Check if a port is available using Node.js built-in method
 * Falls back to server binding method for older Node.js versions
 */
export async function isPortAvailable(port: number): Promise<boolean> {
    // Use Node.js built-in method if available (Node.js 18.13.0+)
    if ('isPortAvailable' in net && typeof (net as any).isPortAvailable === 'function') {
        return await (net as any).isPortAvailable(port)
    }
    
    // Fallback to server binding method for older Node.js versions
    return isPortAvailableLegacy(port)
}

/**
 * Legacy method: Check if a port is available by attempting to bind to it
 * Used as fallback for older Node.js versions
 */
function isPortAvailableLegacy(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer()
        
        server.on('error', () => {
            resolve(false)
        })
        
        server.on('listening', () => {
            server.close(() => {
                resolve(true)
            })
        })
        
        server.listen(port)
    })
}

/**
 * Find the next available port starting from the given port
 */
export async function findAvailablePort(startPort: number, maxAttempts: number = 100): Promise<number> {
    for (let port = startPort; port < startPort + maxAttempts; port++) {
        const isAvailable = await isPortAvailable(port)
        if (isAvailable) {
            return port
        }
    }
    throw new Error(`No available port found after ${maxAttempts} attempts starting from port ${startPort}`)
}
