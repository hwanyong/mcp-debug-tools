# MCP Debug Tools - 구현 계획서

## 📅 구현 일정

### Week 1: Phase 1 - 핵심 기능
- [x] 표현식 평가 Tool
- [x] 특정 변수 검사 Tool  
- [x] 콜스택 정보 Resource
- [x] 변수/스코프 정보 Resource
- [x] 스레드 목록 Resource

### Week 2: Phase 2 - 변수 모니터링
- (CANCELED)[ ] Watch 표현식 추가/제거 Tool
- (CANCELED)[ ] Watch 목록 Resource
- (CANCELED)[ ] 변수 상세 정보 Resource
- [x] 조건부 브레이크포인트 Tool

### Week 3: Phase 3 - 추가 기능
- [x] 예외 정보 Resource
- [x] 디버그 구성 관리 Tool
- [ ] 모듈 정보 Resource
- [x] 변수 검색 Tool (variables-scope resource로 대응 가능)

### Week 4: Phase 4 - 편의 기능
- [x] 브레이크포인트 토글 Tool (add/remove-breakpoint 조합으로 대응 가능)
- [x] 워크스페이스 브레이크포인트 맵 Resource
- [ ] 변수 히스토리 Resource

## 🔧 구현 상세

### Phase 1 - 핵심 기능 구현

#### 1. 표현식 평가 Tool (`evaluate-expression`)
```typescript
// src/tools-parameters.ts에 추가
export const inputSchemas = {
    // ... 기존 스키마들
    'evaluate-expression': {
        expression: z.string().describe('Expression to evaluate in debug context')
    }
}

// src/tools.ts에 추가
export const evaluateExpressionTool = {
    name: 'evaluate-expression',
    config: {
        title: 'Evaluate Expression',
        description: 'Evaluate expression in debug context',
        inputSchema: inputSchemas['evaluate-expression']
    },
    handler: async (args) => {
        // vscode.debug.activeDebugConsole.append() 사용
        // 결과는 DAP 메시지에서 파싱
    }
}
```

#### 2. 특정 변수 검사 Tool (`inspect-variable`)
```typescript
// src/tools-parameters.ts에 추가
export const inputSchemas = {
    // ... 기존 스키마들
    'inspect-variable': {
        variableName: z.string().describe('Name of the variable to inspect')
    }
}

// src/tools.ts에 추가
export const inspectVariableTool = {
    name: 'inspect-variable',
    config: {
        title: 'Inspect Variable',
        description: 'Get detailed information about a variable',
        inputSchema: inputSchemas['inspect-variable']
    },
    handler: async (args) => {
        // DAP 로그에서 variables 응답 검색
        // 변수명 매칭 및 상세 정보 추출
    }
}
```

#### 3. 콜스택 정보 Resource (`call-stack`)
```typescript
// 구현 방법: DAP stackTrace 응답 파싱
export const callStackResource = {
    name: 'call-stack',
    uri: 'debug://call-stack',
    config: {
        title: 'Call Stack',
        description: 'Complete call stack information',
        mimeType: 'application/json'
    },
    handler: async (uri) => {
        // DAP 메시지에서 최신 stackTrace 응답 찾기
        // 프레임별 정보 구조화
    }
}
```

#### 4. 변수/스코프 정보 Resource (`variables-scope`)
```typescript
// 구현 방법: DAP scopes/variables 응답 파싱
export const variablesScopeResource = {
    name: 'variables-scope',
    uri: 'debug://variables-scope',
    config: {
        title: 'Variables and Scopes',
        description: 'All variables in current scope',
        mimeType: 'application/json'
    },
    handler: async (uri) => {
        // DAP 메시지에서 scopes 응답 파싱
        // 각 스코프별 variables 응답 매칭
    }
}
```

#### 5. 스레드 목록 Resource (`thread-list`)
```typescript
// 구현 방법: DAP threads 응답 파싱
export const threadListResource = {
    name: 'thread-list',
    uri: 'debug://thread-list',
    config: {
        title: 'Thread List',
        description: 'All threads in debug session',
        mimeType: 'application/json'
    },
    handler: async (uri) => {
        // DAP 메시지에서 threads 응답 파싱
        // 스레드 상태 정보 포함
    }
}
```

### Phase 2 - 변수 모니터링 구현

#### 조건부 브레이크포인트
```typescript
// src/tools-parameters.ts에 추가
export const inputSchemas = {
    // ... 기존 스키마들
    'set-conditional-breakpoint': {
        file: z.string().describe('Relative path from workspace root'),
        line: z.number().int().min(1).describe('Line number (1-based)'),
        condition: z.string().optional().describe('Condition expression'),
        hitCondition: z.string().optional().describe('Hit count condition'),
        logMessage: z.string().optional().describe('Log message to output')
    }
}
```
- `vscode.SourceBreakpoint` 생성자 파라미터 활용
- condition, hitCondition, logMessage 설정

### Phase 3 - 추가 디버깅 기능

#### 예외 정보 Resource
- DAP `stopped` 이벤트의 `reason: 'exception'` 파싱
- 예외 상세 정보 추출

#### 디버그 구성 관리
```typescript
// src/tools-parameters.ts에 추가
export const inputSchemas = {
    // ... 기존 스키마들
    'list-debug-configs': {
        // 파라미터 없음
    },
    'select-debug-config': {
        configName: z.string().describe('Debug configuration name to select')
    }
}
```
- `.vscode/launch.json` 파일 읽기
- 구성 목록 제공 및 선택 기능

#### 모듈 정보 Resource
- DAP `module` 이벤트 추적
- 로드된 모듈 목록 유지

#### 변수 검색 Tool
```typescript
// src/tools-parameters.ts에 추가
export const inputSchemas = {
    // ... 기존 스키마들
    'search-variables': {
        pattern: z.string().describe('Pattern to search for in variable names'),
        scope: z.enum(['local', 'global', 'all']).optional().describe('Scope to search in')
    }
}
```

### Phase 4 - 편의 기능

#### 브레이크포인트 관리
```typescript
// src/tools-parameters.ts에 추가
export const inputSchemas = {
    // ... 기존 스키마들
    'toggle-breakpoint': {
        file: z.string().describe('Relative path from workspace root'),
        line: z.number().int().min(1).describe('Line number (1-based)')
    },
    'clear-all-breakpoints': {
        // 파라미터 없음
    }
}
```
- 토글, 일괄 제거 등 편의 기능
- 워크스페이스 전체 브레이크포인트 맵

#### 변수 히스토리
- DAP 메시지 추적으로 변수 값 변경 이력 저장
- 시간별 변화 추이 제공

## 🧪 테스트 계획

### 단위 테스트
- 각 Tool/Resource 핸들러 테스트
- DAP 메시지 파싱 로직 테스트

### 통합 테스트
- 실제 디버그 세션에서 기능 검증
- 다양한 디버거 (Node.js, Python, etc.) 호환성

### 시나리오 테스트
1. 간단한 Node.js 앱 디버깅
2. 멀티스레드 애플리케이션 디버깅
3. 예외 처리 시나리오
4. 복잡한 객체 구조 탐색

## 📊 성능 고려사항

### DAP 메시지 파싱
- 대용량 로그 처리 최적화
- 메시지 인덱싱 및 캐싱
- 정규식 최적화

### 메모리 관리
- DAP 메시지 버퍼 크기 제한
- 오래된 메시지 자동 정리
- 순환 참조 방지

## 🔍 DAP 메시지 파싱 전략

### 메시지 구조 분석
```typescript
interface DAPMessage {
    type: 'request' | 'response' | 'event'
    command?: string
    event?: string
    seq: number
    request_seq?: number
    body?: any
}
```

### 스키마 관리 원칙
- 모든 Tool의 inputSchema는 `src/tools-parameters.ts`에서 Zod 스키마로 정의
- 각 Tool은 `inputSchemas['tool-name']`으로 스키마 참조
- 타입 안정성과 런타임 검증을 위해 Zod 사용

### 파싱 유틸리티
```typescript
// DAP 메시지 파서
function parseDAPMessage(message: string): DAPMessage | null {
    // "Client -> Server:" 또는 "Server -> Client:" 제거
    // JSON 파싱
    // 타입 검증
}

// 특정 응답 찾기
function findLatestResponse(command: string): DAPMessage | null {
    // 역순으로 메시지 검색
    // command 매칭
    // 가장 최근 응답 반환
}

// 요청-응답 쌍 매칭
function matchRequestResponse(seq: number): {
    request: DAPMessage,
    response: DAPMessage
} | null {
    // request_seq로 매칭
}
```

## 🚀 배포 계획

### v1.1.0 - Phase 1 완료
- 핵심 변수 디버깅 기능
- 콜스택 정보 제공

### v1.2.0 - Phase 2 완료
- Watch 기능 추가
- 조건부 브레이크포인트

### v1.3.0 - Phase 3 완료
- 예외 처리 기능
- 모듈 정보 제공

### v1.4.0 - Phase 4 완료
- 모든 편의 기능 포함
- 성능 최적화 완료

## 📝 문서화

### 사용자 문서
- 각 기능별 사용 가이드
- 예제 코드 및 스크린샷
- FAQ 및 트러블슈팅

### 개발자 문서
- API 레퍼런스
- 아키텍처 설명
- 기여 가이드라인

## 🔗 관련 리소스

- [VSCode Debug API](https://code.visualstudio.com/api/references/vscode-api#debug)
- [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/)
- [MCP Specification](https://modelcontextprotocol.io/)
