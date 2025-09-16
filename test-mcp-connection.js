// MCP 연결 테스트 스크립트
// 이 스크립트는 clear-breakpoints 도구를 호출하여 타임아웃 문제가 해결되었는지 확인합니다.

const { spawn } = require('child_process');

async function testConnection() {
    console.log('🧪 MCP 연결 테스트 시작...\n');
    
    // CLI 프로세스 시작
    const cli = spawn('node', ['out/cli.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    cli.stdout.on('data', (data) => {
        output += data.toString();
    });
    
    cli.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log(data.toString());
    });
    
    // Initialize 요청
    console.log('📤 Sending initialize request...');
    const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: {
                name: 'test-client',
                version: '1.0.0'
            }
        }
    };
    
    cli.stdin.write(JSON.stringify(initRequest) + '\n');
    
    // 응답 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // initialized 알림
    console.log('📤 Sending initialized notification...');
    const initializedNotification = {
        jsonrpc: '2.0',
        method: 'notifications/initialized'
    };
    
    cli.stdin.write(JSON.stringify(initializedNotification) + '\n');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // clear-breakpoints 도구 호출
    console.log('📤 Calling clear-breakpoints tool...');
    const startTime = Date.now();
    
    const toolRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
            name: 'clear-breakpoints',
            arguments: {}
        }
    };
    
    cli.stdin.write(JSON.stringify(toolRequest) + '\n');
    
    // 응답 대기 (최대 35초)
    const timeout = setTimeout(() => {
        console.log('❌ 테스트 실패: 35초 타임아웃');
        cli.kill();
        process.exit(1);
    }, 35000);
    
    // stdout 모니터링
    const checkInterval = setInterval(() => {
        if (output.includes('"id":2')) {
            const elapsed = Date.now() - startTime;
            clearTimeout(timeout);
            clearInterval(checkInterval);
            
            console.log(`\n✅ 테스트 성공!`);
            console.log(`⏱️  응답 시간: ${elapsed}ms`);
            console.log('\n📥 응답 내용:');
            console.log(output.substring(output.lastIndexOf('{"jsonrpc"')));
            
            cli.kill();
            process.exit(0);
        }
    }, 100);
}

// 테스트 실행
testConnection().catch(err => {
    console.error('❌ 테스트 실패:', err);
    process.exit(1);
});