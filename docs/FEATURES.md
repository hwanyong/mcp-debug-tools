# MCP Debug Tools - 기능 명세서

## 📌 개요

MCP Debug Tools는 VSCode의 디버깅 기능을 MCP(Model Context Protocol)를 통해 제공하는 확장 프로그램입니다. 
DAP(Debug Adapter Protocol) 메시지를 추적하고 디버깅 세션을 제어할 수 있는 도구와 리소스를 제공합니다.

## 🟢 현재 구현된 기능

### Tools (실행 가능한 명령) - 11개

| 도구명 | 설명 | 파라미터 |
|--------|------|----------|
| `add-breakpoint` | 파일의 특정 라인에 브레이크포인트 추가 | file, line |
| `remove-breakpoint` | 파일의 특정 라인에서 브레이크포인트 제거 | file, line |
| `list-breakpoints` | 워크스페이스의 모든 브레이크포인트 목록 조회 | - |
| `start-debug` | 디버그 세션 시작 | config |
| `stop-debug` | 활성 디버그 세션 중지 | - |
| `continue` | 디버그 실행 계속 | - |
| `step-over` | 한 줄 실행 (함수 건너뛰기) | - |
| `step-into` | 함수 안으로 들어가기 | - |
| `step-out` | 함수 밖으로 나가기 | - |
| `pause` | 실행 중인 디버그 세션 일시 중지 | - |
| `get-debug-state` | 현재 디버그 세션 상태 조회 | - |

### Resources (읽기 전용 정보) - 5개

| 리소스명 | URI | 설명 |
|----------|-----|------|
| `dap-log` | `dap-log://current` | DAP 프로토콜 메시지 로그 |
| `breakpoints` | `debug://breakpoints` | 현재 설정된 모든 브레이크포인트 정보 |
| `active-session` | `debug://active-session` | 활성 디버그 세션 정보 |
| `debug-console` | `debug://console` | 디버그 콘솔 출력 내용 |
| `active-stack-item` | `debug://active-stack-item` | 현재 포커스된 스레드/스택 프레임 |

## 🔵 추가 구현 가능한 기능

### 변수 관련 기능 (우선순위: 높음)

#### Tools
| 도구명 | 설명 | 구현 방법 |
|--------|------|-----------|
| `evaluate-expression` | 표현식 평가 및 변수 값 확인 | Debug Console 활용 |
| `inspect-variable` | 특정 변수의 상세 정보 조회 | DAP 메시지 파싱 |
| `add-watch` | Watch 표현식 추가 | VSCode API |
| `remove-watch` | Watch 표현식 제거 | VSCode API |
| `search-variables` | 현재 스코프에서 변수 검색 | DAP 메시지 파싱 |

#### Resources
| 리소스명 | 설명 | 구현 방법 |
|----------|------|-----------|
| `variable-details` | 특정 변수의 모든 속성 정보 | DAP 메시지 파싱 |
| `watch-list` | 현재 감시 중인 표현식 목록 | VSCode API |
| `variable-history` | 변수 값 변경 이력 | DAP 메시지 추적 |

### 콜스택 및 스레드 관련 기능

#### Resources
| 리소스명 | 설명 | 구현 방법 |
|----------|------|-----------|
| `call-stack` | 전체 콜스택 정보 | DAP stackTrace 응답 파싱 |
| `thread-list` | 모든 스레드 목록 및 상태 | DAP threads 응답 파싱 |
| `scopes` | 현재 프레임의 변수 스코프 | DAP scopes 응답 파싱 |
| `variables` | 스코프별 변수 목록 | DAP variables 응답 파싱 |

### 브레이크포인트 고급 기능

#### Tools
| 도구명 | 설명 | 구현 방법 |
|--------|------|-----------|
| `set-conditional-breakpoint` | 조건부 브레이크포인트 설정 | VSCode API |
| `set-logpoint` | 로그포인트 설정 | VSCode API |
| `toggle-breakpoint` | 브레이크포인트 활성화/비활성화 | VSCode API |
| `clear-all-breakpoints` | 모든 브레이크포인트 제거 | VSCode API |

### 디버그 구성 관리

#### Tools
| 도구명 | 설명 | 구현 방법 |
|--------|------|-----------|
| `list-debug-configs` | 사용 가능한 디버그 구성 목록 | launch.json 파싱 |
| `select-debug-config` | 디버그 구성 선택 | VSCode API |

#### Resources
| 리소스명 | 설명 | 구현 방법 |
|----------|------|-----------|
| `debug-configurations` | 모든 디버그 구성 정보 | launch.json 읽기 |
| `workspace-breakpoints` | 파일별 브레이크포인트 맵 | VSCode API |

### 예외 및 모듈 정보

#### Resources
| 리소스명 | 설명 | 구현 방법 |
|----------|------|-----------|
| `exception-info` | 예외 정보 및 스택 트레이스 | DAP stopped 이벤트 파싱 |
| `module-list` | 로드된 모듈/라이브러리 목록 | DAP module 이벤트 파싱 |

## 🔴 구현 불가능한 기능

### API 제한으로 인한 불가능 기능

| 기능 | 이유 | 필요 사항 |
|------|------|-----------|
| 메모리 읽기/쓰기 | DAP readMemory 요청 전송 불가 | DebugSession.customRequest() API 필요 |
| 변수 값 직접 수정 | DAP setVariable 요청 전송 불가 | DebugSession.customRequest() API 필요 |
| 역방향 디버깅 | DAP stepBack 요청 전송 불가 | DebugSession.customRequest() API 필요 |
| 프레임 재시작 | DAP restartFrame 요청 전송 불가 | DebugSession.customRequest() API 필요 |
| 어셈블리 레벨 디버깅 | 디스어셈블리 관련 DAP 요청 불가 | 저수준 API 접근 필요 |

## 📋 구현 우선순위

### Phase 1 - 핵심 기능 (즉시 구현)
1. **표현식 평가 Tool** - 변수 값 즉시 확인
2. **특정 변수 검사 Tool** - 변수명으로 상세 정보 조회
3. **콜스택 정보 Resource** - 전체 스택 프레임 정보
4. **변수/스코프 정보 Resource** - 모든 변수 목록
5. **스레드 목록 Resource** - 멀티스레드 디버깅 지원

### Phase 2 - 변수 모니터링 (중요)
6. Watch 표현식 추가/제거 Tool
7. Watch 목록 Resource
8. 변수 상세 정보 Resource
9. 조건부 브레이크포인트 Tool

### Phase 3 - 추가 디버깅 기능
10. 예외 정보 Resource
11. 디버그 구성 관리 Tool
12. 모듈 정보 Resource
13. 변수 검색 Tool

### Phase 4 - 편의 기능
14. 브레이크포인트 토글 Tool
15. 워크스페이스 브레이크포인트 맵 Resource
16. 변수 히스토리 Resource

## 💡 사용 시나리오

### 변수 디버깅 워크플로우
1. 브레이크포인트 설정 → `add-breakpoint`
2. 디버그 시작 → `start-debug`
3. 변수 값 확인 → `evaluate-expression`
4. 변수 상세 정보 → `inspect-variable`
5. 지속적 모니터링 → `add-watch`
6. 콜스택 확인 → `call-stack` resource
7. 스코프별 변수 탐색 → `variables` resource

### DAP 메시지 분석 워크플로우
1. DAP 로그 확인 → `dap-log` resource
2. 특정 이벤트 필터링
3. 요청/응답 쌍 매칭
4. 디버거 동작 분석

## 🛠 기술 스택

- **VSCode Extension API**: 디버그 세션 제어
- **MCP Server**: HTTP 기반 도구/리소스 제공
- **DAP Tracker**: 프로토콜 메시지 추적
- **TypeScript**: 타입 안정성
- **Express**: HTTP 서버

## 📝 제한사항

1. **VSCode Debug API 한계**: High-level API만 제공되어 일부 DAP 기능 직접 접근 불가
2. **DAP 메시지 파싱**: 읽기 전용으로만 가능, 직접 전송 불가
3. **실시간 동기화**: MCP 프로토콜 특성상 실시간 스트리밍 제한적
4. **디버거 의존성**: 디버거가 지원하는 기능에 따라 사용 가능 기능 제한

## 🔄 향후 개선 방향

1. VSCode API 업데이트 시 `customRequest()` 활용
2. WebSocket 지원으로 실시간 업데이트 개선
3. 디버거별 특화 기능 지원
4. UI 패널 통합 (Monitor Panel 활용)
