import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { promisify } from 'util'
import { WorkspaceConfig } from './config-manager.js'
import { RegistryEntry } from './registry-manager.js'

const readFile = promisify(fs.readFile)
const exists = promisify(fs.exists)

/**
 * 설정 파일 탐색 및 VSCode 인스턴스 찾기
 */
export class ConfigFinder {
    
    /**
     * 현재 디렉토리부터 상위로 탐색하며 .mcp-debug-tools/config.json 찾기
     */
    static async findWorkspaceConfig(): Promise<{ config: WorkspaceConfig, path: string } | null> {
        let currentDir = process.cwd()
        const root = path.parse(currentDir).root
        
        while (currentDir !== root) {
            const configPath = path.join(currentDir, '.mcp-debug-tools', 'config.json')
            
            if (fs.existsSync(configPath)) {
                try {
                    const data = await readFile(configPath, 'utf8')
                    const config = JSON.parse(data) as WorkspaceConfig
                    
                    // VSCode가 살아있는지 확인
                    if (this.isConfigAlive(config)) {
                        console.error(`[자동 연결] Workspace 설정 발견: ${currentDir}`)
                        return { config, path: configPath }
                    } else {
                        console.error(`[자동 연결] Stale 설정 무시: ${configPath}`)
                    }
                } catch (error) {
                    console.error(`[자동 연결] 설정 파일 읽기 실패: ${error}`)
                }
            }
            
            // 상위 디렉토리로 이동
            currentDir = path.dirname(currentDir)
        }
        
        return null
    }
    
    /**
     * 글로벌 레지스트리에서 활성 인스턴스 찾기
     */
    static async findFromGlobalRegistry(): Promise<RegistryEntry[]> {
        const registryPath = path.join(os.homedir(), '.mcp-debug-tools', 'active-configs.json')
        
        if (!fs.existsSync(registryPath)) {
            return []
        }
        
        try {
            const data = await readFile(registryPath, 'utf8')
            const registry = JSON.parse(data)
            
            // 살아있는 인스턴스만 필터링
            const activeInstances = (registry.activeInstances || []).filter((entry: RegistryEntry) => {
                // 각 인스턴스의 설정 파일을 읽어서 확인
                if (fs.existsSync(entry.configPath)) {
                    try {
                        const configData = fs.readFileSync(entry.configPath, 'utf8')
                        const config = JSON.parse(configData) as WorkspaceConfig
                        return this.isConfigAlive(config)
                    } catch (error) {
                        return false
                    }
                }
                return false
            })
            
            return activeInstances
        } catch (error) {
            console.error(`[자동 연결] 글로벌 레지스트리 읽기 실패: ${error}`)
            return []
        }
    }
    
    /**
     * 자동으로 VSCode 인스턴스 찾기
     * 1. 현재 디렉토리부터 상위로 탐색
     * 2. 못 찾으면 글로벌 레지스트리 확인
     */
    static async findVSCodeInstance(): Promise<{ port: number, workspace?: string } | null> {
        console.error('[자동 연결] VSCode 인스턴스 탐색 시작...')
        
        // 1. Workspace 설정 파일 탐색
        const workspaceConfig = await this.findWorkspaceConfig()
        if (workspaceConfig) {
            console.error(`[자동 연결] ✅ Workspace VSCode 발견 - Port: ${workspaceConfig.config.port}`)
            return {
                port: workspaceConfig.config.port,
                workspace: workspaceConfig.config.workspacePath
            }
        }
        
        // 2. 글로벌 레지스트리에서 찾기
        console.error('[자동 연결] Workspace에서 못 찾음, 글로벌 레지스트리 확인...')
        const instances = await this.findFromGlobalRegistry()
        
        if (instances.length === 0) {
            console.error('[자동 연결] ❌ 활성 VSCode 인스턴스를 찾을 수 없음')
            return null
        }
        
        if (instances.length === 1) {
            // 인스턴스가 하나면 자동 선택
            const instance = instances[0]
            console.error(`[자동 연결] ✅ 단일 VSCode 발견 - ${instance.workspaceName} (Port: ${instance.port})`)
            return {
                port: instance.port,
                workspace: instance.workspacePath
            }
        }
        
        // 여러 인스턴스가 있으면 목록 표시하고 첫 번째 선택
        console.error(`[자동 연결] 🔍 ${instances.length}개의 활성 VSCode 인스턴스 발견:`)
        instances.forEach((inst, idx) => {
            console.error(`  ${idx + 1}. ${inst.workspaceName} (Port: ${inst.port})`)
        })
        
        // 기본적으로 첫 번째 인스턴스 선택 (나중에 MCP 도구로 선택 가능)
        const selected = instances[0]
        console.error(`[자동 연결] ⚡ 첫 번째 인스턴스 자동 선택: ${selected.workspaceName}`)
        
        return {
            port: selected.port,
            workspace: selected.workspacePath
        }
    }
    
    /**
     * 설정이 살아있는지 확인 (15초 이내 heartbeat)
     */
    private static isConfigAlive(config: WorkspaceConfig, maxAge: number = 15000): boolean {
        const age = Date.now() - config.lastHeartbeat
        
        // PID가 살아있는지 확인
        try {
            process.kill(config.pid, 0)
            // heartbeat age도 확인
            return age < maxAge
        } catch (error) {
            // 프로세스가 없거나 권한이 없음
            return false
        }
    }
}