import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { promisify } from 'util'

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const mkdir = promisify(fs.mkdir)
const unlink = promisify(fs.unlink)

export interface WorkspaceConfig {
    vscodeInstanceId: string
    port: number
    pid: number
    workspacePath: string
    workspaceName: string
    lastHeartbeat: number
}

/**
 * Workspace 설정 파일 관리자
 * .mcp-debug-tools/config.json 파일을 관리합니다
 */
export class ConfigManager {
    private configDir: string
    private configPath: string
    private heartbeatTimer?: NodeJS.Timeout
    
    constructor(private workspaceFolder: vscode.WorkspaceFolder | undefined) {
        if (!workspaceFolder) {
            throw new Error('No workspace folder found')
        }
        
        this.configDir = path.join(workspaceFolder.uri.fsPath, '.mcp-debug-tools')
        this.configPath = path.join(this.configDir, 'config.json')
    }
    
    /**
     * 설정 파일 생성 및 초기화
     */
    async initialize(port: number): Promise<void> {
        try {
            // 디렉토리 생성 (없으면)
            await this.ensureConfigDir()
            
            // 설정 생성
            const config: WorkspaceConfig = {
                vscodeInstanceId: this.generateInstanceId(),
                port,
                pid: process.pid,
                workspacePath: this.workspaceFolder!.uri.fsPath,
                workspaceName: this.workspaceFolder!.name,
                lastHeartbeat: Date.now()
            }
            
            // 파일 저장
            await this.saveConfig(config)
            
            // Heartbeat 시작
            this.startHeartbeat()
            
            console.log(`Config file created at: ${this.configPath}`)
        } catch (error) {
            console.error('Failed to initialize config:', error)
            throw error
        }
    }
    
    /**
     * 설정 파일 업데이트
     */
    async updateConfig(updates: Partial<WorkspaceConfig>): Promise<void> {
        try {
            const currentConfig = await this.loadConfig()
            if (!currentConfig) {
                console.error('No config to update')
                return
            }
            const updatedConfig: WorkspaceConfig = {
                ...currentConfig,
                ...updates,
                lastHeartbeat: Date.now()
            }
            await this.saveConfig(updatedConfig)
        } catch (error) {
            console.error('Failed to update config:', error)
            throw error
        }
    }
    
    /**
     * 설정 파일 로드
     */
    async loadConfig(): Promise<WorkspaceConfig | null> {
        try {
            const data = await readFile(this.configPath, 'utf8')
            return JSON.parse(data)
        } catch (error) {
            if ((error as any).code === 'ENOENT') {
                return null
            }
            throw error
        }
    }
    
    /**
     * 설정 파일 저장
     */
    private async saveConfig(config: WorkspaceConfig): Promise<void> {
        const data = JSON.stringify(config, null, 2)
        await writeFile(this.configPath, data, 'utf8')
    }
    
    /**
     * 디렉토리 확인 및 생성
     */
    private async ensureConfigDir(): Promise<void> {
        try {
            await mkdir(this.configDir, { recursive: true })
        } catch (error) {
            if ((error as any).code !== 'EEXIST') {
                throw error
            }
        }
    }
    
    /**
     * Heartbeat 타이머 시작
     */
    private startHeartbeat(): void {
        // 기존 타이머 정리
        this.stopHeartbeat()
        
        // 5초마다 heartbeat 업데이트
        this.heartbeatTimer = setInterval(async () => {
            try {
                await this.updateConfig({ lastHeartbeat: Date.now() })
            } catch (error) {
                console.error('Heartbeat update failed:', error)
            }
        }, 5000)
    }
    
    /**
     * Heartbeat 타이머 중지
     */
    stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer as unknown as number)
            this.heartbeatTimer = undefined
        }
    }
    
    /**
     * 설정 파일 삭제
     */
    async cleanup(): Promise<void> {
        try {
            // Heartbeat 중지
            this.stopHeartbeat()
            
            // 파일 삭제
            await unlink(this.configPath)
            console.log(`Config file removed: ${this.configPath}`)
        } catch (error) {
            if ((error as any).code !== 'ENOENT') {
                console.error('Failed to cleanup config:', error)
            }
        }
    }
    
    /**
     * 고유 인스턴스 ID 생성
     */
    private generateInstanceId(): string {
        return `vscode-${process.pid}-${Date.now()}`
    }
    
    /**
     * VSCode가 활성 상태인지 확인
     */
    static isAlive(config: WorkspaceConfig, maxAge: number = 10000): boolean {
        const age = Date.now() - config.lastHeartbeat
        return age < maxAge
    }
}