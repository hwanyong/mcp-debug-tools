import * as net from 'net'

/**
 * Check if a port is available
 */
export function isPortAvailable(port: number): Promise<boolean> {
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
        
        server.listen(port, '127.0.0.1')
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
