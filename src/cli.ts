#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMcpClient } from './mcp-client.js'

async function main() {
    console.error('🚀 DAP Proxy MCP 클라이언트 시작')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const args = process.argv.slice(2)
    let domain = 'http://localhost'
    let port = 8890 // 기본 포트

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
    }

    const serverUrl = `${domain}:${port}/mcp`
    console.error(`🎯 서버 URL: ${serverUrl}`)

    // HTTP 클라이언트로 확장에 연결 후 MCP 프록시 생성
    const proxy = await createMcpClient(serverUrl)

    // stdio로 Cursor 등 MCP 클라이언트에 서버 제공
    console.error('📡 stdio transport 시작...')

    try {
        const transport = new StdioServerTransport()
        await proxy.connect(transport)

        console.error('✅ MCP 클라이언트 준비 완료!')
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
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
    console.log('  --port=<번호>      DAP Proxy 서버 포트 지정 (기본값: 8890)')
    console.log('  --help, -h         이 도움말 표시')
    console.log('')
    console.log('예시:')
    console.log('  node ./out/cli.js                 # 기본 포트 8890 사용')
    console.log('  node ./out/cli.js --port=8891     # 포트 8891 사용')
    console.log('')
    console.log('주의: DAP Proxy VSCode 확장이 먼저 실행되어야 합니다!')
    console.log('')
    process.exit(0)
}

main().catch((error) => {
    console.error('치명적 오류:', error)
    process.exit(1)
})