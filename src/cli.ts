#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMcpClient } from './mcp-client.js'
import { ConfigFinder } from './config-finder.js'

// 로그 함수 - stdio 통신에 영향을 주지 않도록 별도 처리
function logInfo(message: string) {
    // stderr로 출력하되, stdio 통신과 분리
    process.stderr.write(`[CLI] ${message}\n`)
}

async function main() {
    logInfo('🚀 DAP Proxy MCP 클라이언트 시작')
    logInfo('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const args = process.argv.slice(2)
    let domain = 'http://localhost'
    let port: number | null = null // null이면 자동 탐색
    let autoConnect = true

    const domainArg = args.find(arg => arg.startsWith('--domain='))
    if (domainArg) {
        domain = domainArg.split('=')[1]
    }

    // 명령줄 인자에서 포트 추출
    const portArg = args.find(arg => arg.startsWith('--port='))
    if (portArg) {
        port = parseInt(portArg.split('=')[1])
        if (isNaN(port) || port < 1 || port > 65535) {
            console.error('❌ 잘못된 포트 번호입니다')
            process.exit(1)
        }
        autoConnect = false // 포트가 명시되면 자동 연결 비활성화
    }

    // --no-auto 옵션으로 자동 연결 비활성화
    if (args.includes('--no-auto')) {
        autoConnect = false
        if (!port) {
            port = 8890 // 기본 포트
        }
    }

    // 자동 연결 시도
    if (autoConnect && !port) {
        logInfo('🔍 VSCode 인스턴스 자동 탐색 중...')
        const instance = await ConfigFinder.findVSCodeInstance()
        
        if (instance) {
            port = instance.port
            if (instance.workspace) {
                logInfo(`📁 Workspace: ${instance.workspace}`)
            }
            logInfo(`✨ 자동 탐색 성공! Port: ${port}`)
        } else {
            logInfo('⚠️ VSCode 인스턴스를 찾을 수 없음, 기본 포트 사용')
            port = 8890
        }
    } else if (!port) {
        port = 8890 // 기본 포트
    }

    const serverUrl = `${domain}:${port}/mcp`
    logInfo(`🎯 서버 URL: ${serverUrl}`)

    // HTTP 클라이언트로 확장에 연결 후 MCP 프록시 생성
    logInfo('🔗 VSCode 확장에 HTTP 연결 시도...')
    
    let retries = 0
    const maxRetries = 3
    let proxy = null
    
    // 연결 재시도 로직
    while (retries < maxRetries) {
        try {
            proxy = await createMcpClient(serverUrl)
            logInfo('✅ VSCode 확장 HTTP 연결 성공')
            break
        } catch (error) {
            retries++
            if (retries < maxRetries) {
                logInfo(`⚠️ 연결 실패, 재시도 ${retries}/${maxRetries}...`)
                await new Promise(resolve => setTimeout(resolve, 2000))
            } else {
                console.error('❌ VSCode 확장 연결 실패')
                console.error('VSCode에서 DAP Proxy 확장이 실행 중인지 확인하세요')
                process.exit(1)
            }
        }
    }

    // stdio로 Cursor 등 MCP 클라이언트에 서버 제공
    logInfo('📡 stdio transport 시작...')

    try {
        const transport = new StdioServerTransport()
        await proxy!.connect(transport)

        logInfo('✅ MCP 클라이언트 준비 완료!')
        logInfo('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    } catch (error) {
        console.error('❌ 오류 발생:', error)
        if (error instanceof Error) {
            console.error('스택 트레이스:', error.stack)
        }
        process.exit(1)
    }
}

// 도움말 표시
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('')
    console.log('DAP Proxy MCP 클라이언트')
    console.log('')
    console.log('사용법:')
    console.log('  node ./out/cli.js [옵션]')
    console.log('  또는 npx dap-proxy-mcp [옵션] (배포 후)')
    console.log('')
    console.log('옵션:')
    console.log('  --port=<번호>      DAP Proxy 서버 포트 지정 (자동 탐색 비활성화)')
    console.log('  --no-auto          자동 VSCode 탐색 비활성화 (기본값: 8890)')
    console.log('  --help, -h         이 도움말 표시')
    console.log('')
    console.log('자동 연결:')
    console.log('  기본적으로 CLI는 다음 순서로 VSCode를 자동 탐색합니다:')
    console.log('  1. 현재 디렉토리부터 상위로 .mcp-debug-tools/config.json 탐색')
    console.log('  2. 글로벌 레지스트리에서 활성 VSCode 인스턴스 확인')
    console.log('')
    console.log('예시:')
    console.log('  node ./out/cli.js                 # 자동 VSCode 탐색')
    console.log('  node ./out/cli.js --port=8891     # 포트 8891 직접 지정')
    console.log('  node ./out/cli.js --no-auto       # 자동 탐색 없이 기본 포트 8890')
    console.log('')
    console.log('주의: DAP Proxy VSCode 확장이 먼저 실행되어야 합니다!')
    console.log('')
    process.exit(0)
}

main().catch((error) => {
    console.error('치명적 오류:', error)
    process.exit(1)
})