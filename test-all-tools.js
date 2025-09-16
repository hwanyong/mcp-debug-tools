#!/usr/bin/env node

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

async function testAllTools() {
    console.log('🧪 모든 도구 테스트 시작...\n');
    
    const results = [];
    
    try {
        // HTTP 클라이언트 생성
        const transport = new StreamableHTTPClientTransport(
            'http://localhost:8890/mcp'
        );

        const client = new Client({
            name: 'test-client',
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {}
            }
        });

        await client.connect(transport);
        console.log('✅ MCP 서버 연결 성공\n');

        // 테스트할 도구 목록
        const toolsToTest = [
            { 
                name: 'list-breakpoints', 
                args: {},
                description: '브레이크포인트 목록 조회'
            },
            { 
                name: 'get-debug-state', 
                args: {},
                description: '디버그 상태 조회'
            },
            { 
                name: 'get-workspace-info', 
                args: {},
                description: 'Workspace 정보 조회'
            },
            { 
                name: 'list-debug-configs', 
                args: {},
                description: '디버그 구성 목록 조회'
            },
            { 
                name: 'get-active-session', 
                args: {},
                description: '활성 디버그 세션 조회'
            }
        ];

        // 각 도구 테스트
        for (const tool of toolsToTest) {
            console.log(`📋 테스트: ${tool.description} (${tool.name})`);
            const startTime = Date.now();
            
            try {
                const result = await client.callTool(tool.name, tool.args);
                const elapsed = Date.now() - startTime;
                
                console.log(`  ✅ 성공 (${elapsed}ms)`);
                
                // 결과 요약
                if (result.content && result.content[0]) {
                    const content = result.content[0].text;
                    const preview = content.substring(0, 100);
                    console.log(`  📄 응답: ${preview}${content.length > 100 ? '...' : ''}`);
                }
                
                results.push({
                    tool: tool.name,
                    status: 'success',
                    time: elapsed,
                    description: tool.description
                });
                
            } catch (error) {
                const elapsed = Date.now() - startTime;
                console.log(`  ❌ 실패 (${elapsed}ms): ${error.message}`);
                
                results.push({
                    tool: tool.name,
                    status: 'failed',
                    time: elapsed,
                    error: error.message,
                    description: tool.description
                });
            }
            
            console.log(); // 줄바꿈
        }

        // 테스트 결과 요약
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 테스트 결과 요약\n');
        
        const successCount = results.filter(r => r.status === 'success').length;
        const failCount = results.filter(r => r.status === 'failed').length;
        const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
        
        console.log(`✅ 성공: ${successCount}개`);
        console.log(`❌ 실패: ${failCount}개`);
        console.log(`⏱️  평균 응답 시간: ${avgTime.toFixed(2)}ms`);
        
        // 실패한 도구 상세
        if (failCount > 0) {
            console.log('\n❌ 실패한 도구:');
            results.filter(r => r.status === 'failed').forEach(r => {
                console.log(`  - ${r.tool}: ${r.error}`);
            });
        }
        
        // 가장 느린 도구
        const slowest = results.reduce((max, r) => r.time > max.time ? r : max);
        console.log(`\n🐢 가장 느린 도구: ${slowest.tool} (${slowest.time}ms)`);
        
        // 가장 빠른 도구
        const fastest = results.reduce((min, r) => r.time < min.time ? r : min);
        console.log(`🚀 가장 빠른 도구: ${fastest.tool} (${fastest.time}ms)`);

        await client.close();
        
    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
        process.exit(1);
    }
}

// 실행
testAllTools().catch(console.error);