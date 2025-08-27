import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { promisify } from 'util'
import { WorkspaceConfig } from './config-manager'

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const mkdir = promisify(fs.mkdir)

export interface RegistryEntry {
    vscodeInstanceId: string
    workspacePath: string
    workspaceName: string
    configPath: string
    port: number
    pid: number
    lastHeartbeat: number
}

export interface GlobalRegistry {
    activeInstances: RegistryEntry[]
    lastUpdated: number
}

/**
 * 글로벌 레지스트리 관리자
 * ~/.mcp-debug-tools/active-configs.json 파일을 관리합니다
 */
export class RegistryManager {
    private registryDir: string
    private registryPath: string
    private cleanupTimer?: NodeJS.Timeout
    
    constructor() {
        this.registryDir = path.join(os.homedir(), '.mcp-debug-tools')
        this.registryPath = path.join(this.registryDir, 'active-configs.json')
    }
    
    /**
     * 레지스트리 초기화
     */
    async initialize(): Promise<void> {
        await this.ensureRegistryDir()
        
        // 정기적으로 stale 엔트리 정리 (30초마다)
        this.startCleanupTimer()
    }
    
    /**
     * VSCode 인스턴스 등록
     */
    async registerInstance(config: WorkspaceConfig, configPath: string): Promise<void> {
        try {
            const registry = await this.loadRegistry()
            
            // 새 엔트리 생성
            const entry: RegistryEntry = {
                vscodeInstanceId: config.vscodeInstanceId,
                workspacePath: config.workspacePath,
                workspaceName: config.workspaceName,
                configPath,
                port: config.port,
                pid: config.pid,
                lastHeartbeat: config.lastHeartbeat
            }
            
            // 기존 엔트리 제거 (같은 workspace)
            registry.activeInstances = registry.activeInstances.filter(
                e => e.workspacePath !== config.workspacePath
            )
            
            // 새 엔트리 추가
            registry.activeInstances.push(entry)
            registry.lastUpdated = Date.now()
            
            // 저장
            await this.saveRegistry(registry)
            
            console.log(`Instance registered: ${config.vscodeInstanceId} at port ${config.port}`)
        } catch (error) {
            console.error('Failed to register instance:', error)
            throw error
        }
    }
    
    /**
     * VSCode 인스턴스 등록 해제
     */
    async unregisterInstance(vscodeInstanceId: string): Promise<void> {
        try {
            const registry = await this.loadRegistry()
            
            // 인스턴스 제거
            registry.activeInstances = registry.activeInstances.filter(
                e => e.vscodeInstanceId !== vscodeInstanceId
            )
            registry.lastUpdated = Date.now()
            
            // 저장
            await this.saveRegistry(registry)
            
            console.log(`Instance unregistered: ${vscodeInstanceId}`)
        } catch (error) {
            console.error('Failed to unregister instance:', error)
        }
    }
    
    /**
     * 인스턴스 heartbeat 업데이트
     */
    async updateHeartbeat(vscodeInstanceId: string): Promise<void> {
        try {
            const registry = await this.loadRegistry()
            
            // 해당 인스턴스 찾기
            const instance = registry.activeInstances.find(
                e => e.vscodeInstanceId === vscodeInstanceId
            )
            
            if (instance) {
                instance.lastHeartbeat = Date.now()
                registry.lastUpdated = Date.now()
                await this.saveRegistry(registry)
            }
        } catch (error) {
            console.error('Failed to update heartbeat:', error)
        }
    }
    
    /**
     * 활성 인스턴스 목록 조회
     */
    async getActiveInstances(): Promise<RegistryEntry[]> {
        try {
            const registry = await this.loadRegistry()
            
            // Stale 엔트리 필터링 (15초 이상 heartbeat 없음)
            const activeInstances = registry.activeInstances.filter(
                e => this.isInstanceAlive(e)
            )
            
            return activeInstances
        } catch (error) {
            console.error('Failed to get active instances:', error)
            return []
        }
    }
    
    /**
     * 특정 workspace의 활성 인스턴스 찾기
     */
    async findInstanceByWorkspace(workspacePath: string): Promise<RegistryEntry | null> {
        const instances = await this.getActiveInstances()
        return instances.find(e => e.workspacePath === workspacePath) || null
    }
    
    /**
     * 레지스트리 로드
     */
    private async loadRegistry(): Promise<GlobalRegistry> {
        try {
            const data = await readFile(this.registryPath, 'utf8')
            return JSON.parse(data)
        } catch (error) {
            // 파일이 없으면 빈 레지스트리 반환
            if ((error as any).code === 'ENOENT') {
                return {
                    activeInstances: [],
                    lastUpdated: Date.now()
                }
            }
            throw error
        }
    }
    
    /**
     * 레지스트리 저장
     */
    private async saveRegistry(registry: GlobalRegistry): Promise<void> {
        const data = JSON.stringify(registry, null, 2)
        await writeFile(this.registryPath, data, 'utf8')
    }
    
    /**
     * 디렉토리 확인 및 생성
     */
    private async ensureRegistryDir(): Promise<void> {
        try {
            await mkdir(this.registryDir, { recursive: true })
        } catch (error) {
            if ((error as any).code !== 'EEXIST') {
                throw error
            }
        }
    }
    
    /**
     * 인스턴스가 살아있는지 확인
     */
    private isInstanceAlive(entry: RegistryEntry, maxAge: number = 15000): boolean {
        const age = Date.now() - entry.lastHeartbeat
        
        // PID 체크 (가능한 경우)
        try {
            // process.kill(0)은 프로세스 존재 여부만 확인
            process.kill(entry.pid, 0)
            // heartbeat age도 확인
            return age < maxAge
        } catch (error) {
            // 프로세스가 없거나 권한이 없음
            return false
        }
    }
    
    /**
     * Stale 엔트리 정리 타이머 시작
     */
    private startCleanupTimer(): void {
        // 기존 타이머 정리
        this.stopCleanupTimer()
        
        // 30초마다 stale 엔트리 정리
        this.cleanupTimer = setInterval(async () => {
            try {
                await this.cleanupStaleEntries()
            } catch (error) {
                console.error('Cleanup failed:', error)
            }
        }, 30000)
    }
    
    /**
     * Stale 엔트리 정리 타이머 중지
     */
    stopCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer as unknown as number)
            this.cleanupTimer = undefined
        }
    }
    
    /**
     * Stale 엔트리 정리
     */
    private async cleanupStaleEntries(): Promise<void> {
        try {
            const registry = await this.loadRegistry()
            
            // 살아있는 인스턴스만 유지
            const aliveInstances = registry.activeInstances.filter(
                e => this.isInstanceAlive(e)
            )
            
            if (aliveInstances.length !== registry.activeInstances.length) {
                registry.activeInstances = aliveInstances
                registry.lastUpdated = Date.now()
                await this.saveRegistry(registry)
                
                const removed = registry.activeInstances.length - aliveInstances.length
                console.log(`Cleaned up ${removed} stale entries`)
            }
        } catch (error) {
            console.error('Failed to cleanup stale entries:', error)
        }
    }
    
    /**
     * 정리
     */
    async cleanup(vscodeInstanceId?: string): Promise<void> {
        // 타이머 중지
        this.stopCleanupTimer()
        
        // 인스턴스 등록 해제
        if (vscodeInstanceId) {
            await this.unregisterInstance(vscodeInstanceId)
        }
    }
}

// 싱글톤 인스턴스
export const registryManager = new RegistryManager()