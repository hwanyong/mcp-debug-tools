# MCP Debug Tools

AI 도구(Cursor, Windsurf 등)가 VSCode의 디버깅 기능에 접근할 수 있도록 하는 브리지 솔루션입니다. Model Context Protocol (MCP)과 Debug Adapter Protocol (DAP)을 연결하여 AI가 디버깅 작업을 수행할 수 있게 합니다.

## 📺 데모 비디오: AI 기반 디버깅 시연

MCP Debug Tools가 AI 어시스턴트를 통해 여러 Node.js 프로젝트를 동시에 복잡한 디버깅 작업을 수행하는 모습을 확인하세요. 이 시연은 자연어 명령을 통한 실시간 변수 검사, 멀티스레드 디버깅, 자동화된 브레이크포인트 관리를 보여줍니다.

[![MCP Debug Tools Demo](https://github.com/hwanyong/mcp-debug-tools/blob/main/docs/resources/Area_x24.gif)](https://www.youtube.com/watch?v=0lE4-jZ9hTQ)

## ⚠️ 베타 테스트

현재 베타 테스트 중입니다. 문제나 피드백이 있으시면 알려주세요.

**연락처:** [yoo.hwanyong@gmail.com](mailto:yoo.hwanyong@gmail.com)

## 🎯 주요 기능

### 디버그 제어
- **브레이크포인트 관리**: 조건부 브레이크포인트 추가/제거, 일괄 작업
- **실행 제어**: 디버그 시작/중지, 계속/일시정지, Step Into/Over/Out
- **변수 검사**: 값 확인, 표현식 평가, 스코프 분석
- **스택 추적**: 호출 스택, 스레드 관리, 예외 정보

### 자동 연결 시스템
- VSCode 인스턴스 자동 탐색 및 연결
- 다중 VSCode 창 지원
- 워크스페이스 기반 구성 관리
- 실시간 하트비트 모니터링

## 📦 설치

### 1. VSCode 확장 프로그램 (필수)

VSCode에서 서버로 디버깅 기능을 제공합니다.

**방법 1: VSCode 마켓플레이스**
```
1. VSCode 확장 탭 열기 (Ctrl+Shift+X)
2. "MCP Debug Tools" 검색
3. 설치 클릭
```

**방법 2: 직접 링크**
- [VSCode 마켓플레이스의 MCP Debug Tools](https://marketplace.visualstudio.com/items?itemName=uhd.mcp-debug-tools)

**방법 3: 다운로드 링크**
- [릴리스](https://github.com/hwanyong/mcp-debug-tools/releases)

### 2. CLI 도구

AI 도구와 VSCode를 연결하는 클라이언트입니다.

```bash
# npx로 직접 실행 (설치 불필요)
npx @uhd_kr/mcp-debug-tools
```

## 🔧 구성

### MCP 설정 (Cursor/Windsurf)

`mcp.json` 또는 구성 파일에 추가:

```json
{
  "mcpServers": {
    "dap-proxy": {
      "command": "npx",
      "args": ["-y", "@uhd_kr/mcp-debug-tools"],
      "env": {}
    }
  }
}
```

### CLI 옵션

```bash
# 자동 연결 (권장)
npx @uhd_kr/mcp-debug-tools

# 포트 지정
npx @uhd_kr/mcp-debug-tools --port=8891

# 자동 탐색 비활성화
npx @uhd_kr/mcp-debug-tools --no-auto
```

## 🛠️ 지원 기능

### MCP 도구 (실행 가능 명령)

#### 브레이크포인트 관리
- `add-breakpoint` - 조건부 지원 브레이크포인트 추가
- `add-breakpoints` - 여러 브레이크포인트 한 번에 추가
- `remove-breakpoint` - 특정 브레이크포인트 제거
- `clear-breakpoints` - 전체/특정 파일 브레이크포인트 제거
- `list-breakpoints` - 모든 브레이크포인트 목록

#### 디버그 제어
- `start-debug` - 디버그 세션 시작
- `stop-debug` - 디버그 세션 중지
- `continue` - 실행 계속
- `step-over` - 한 줄 건너뛰기
- `step-into` - 함수 내부로 들어가기
- `step-out` - 함수 밖으로 나오기
- `pause` - 실행 일시정지

#### 상태 검사
- `get-debug-state` - 디버그 세션 상태
- `evaluate-expression` - 표현식 평가
- `inspect-variable` - 변수 상세 정보
- `get-variables-scope` - 스코프 내 모든 변수
- `get-call-stack` - 호출 스택 정보
- `get-thread-list` - 스레드 목록
- `get-exception-info` - 예외 정보

#### 구성 관리
- `list-debug-configs` - launch.json 구성 목록
- `select-debug-config` - 디버그 구성 선택

#### 워크스페이스 관리
- `select-vscode-instance` - VSCode 인스턴스 선택
- `list-vscode-instances` - 활성 인스턴스 목록
- `get-workspace-info` - 워크스페이스 정보

### MCP 리소스 (읽기 전용 정보)

- `dap-log://current` - DAP 프로토콜 메시지 로그
- `debug://breakpoints` - 현재 브레이크포인트 정보
- `debug://active-session` - 활성 디버그 세션 정보
- `debug://console` - 디버그 콘솔 출력
- `debug://call-stack` - 호출 스택 정보
- `debug://variables-scope` - 변수 스코프 정보

## 🏗️ 아키텍처

```
┌─────────────┐    HTTP    ┌─────────────┐    stdio   ┌─────────────┐
│   VSCode    │ ◄────────► │  CLI Tool   │ ◄────────► │ AI Tool     │
│  Extension  │   (8890)   │             │            │ (Cursor)    │
└─────────────┘            └─────────────┘            └─────────────┘
```

### 자동 연결 메커니즘

1. **워크스페이스 설정**: `.mcp-debug-tools/config.json` - VSCode 연결 정보 저장
2. **글로벌 레지스트리**: `~/.mcp-debug-tools/active-configs.json` - 모든 활성 인스턴스 추적
3. **하트비트**: 5초 간격 생존 업데이트
4. **PID 검증**: 프로세스 상태 확인

## 🚀 시작하기

1. VSCode 확장 프로그램 설치
2. VSCode에서 프로젝트 열기
3. AI 도구의 MCP 구성에 추가
4. AI 도구에서 디버깅 명령 사용

## 💡 일반적인 사용 사례

### 1. 버그 찾기 및 수정
AI 어시스턴트에게 코드 디버깅 도움 요청:
```
"calculateTotal 함수에 오류가 있습니다. 함수 시작 부분에 브레이크포인트를 설정하고
단계별로 실행하여 문제를 찾을 수 있나요?"
```
AI는 다음을 수행합니다:
- 문제가 있는 함수에 브레이크포인트 설정
- 디버그 세션 시작
- 코드를 한 줄씩 단계별 실행
- 변수를 검사하여 버그 식별
- 디버깅 데이터를 기반으로 수정사항 제안

### 2. 복잡한 코드 흐름 이해
익숙하지 않은 코드베이스 탐색시:
```
"인증 흐름이 어떻게 작동하는지 이해해야 합니다. 로그인 프로세스를
단계별로 추적해 줄 수 있나요?"
```
AI는 다음을 수행합니다:
- 주요 인증 함수 식별
- 전략적 브레이크포인트 설정
- 인증 흐름 실행
- 실제 런타임 데이터로 각 단계 설명
- 프로세스를 통한 데이터 변환 방법 표시

### 3. 데이터 처리 검증
데이터 변환 파이프라인의 경우:
```
"내 데이터 변환 파이프라인이 입력 배열을 올바르게 처리하고
예상 출력 형식을 생성하는지 확인해주세요"
```
AI는 다음을 수행합니다:
- 변환 단계에 브레이크포인트 설정
- 입력 데이터 구조 검사
- 각 단계에서 데이터 변경 모니터링
- 요구사항과 출력 검증
- 데이터 무결성 문제 식별

### 4. 성능 병목 현상 감지
성능 문제 찾기:
```
"내 애플리케이션이 느리게 실행됩니다. 실행 중에 가장 많은 시간이
걸리는 함수를 식별하는 데 도움을 줄 수 있나요?"
```
AI는 다음을 수행합니다:
- 함수 진입/종료 지점에 브레이크포인트 설정
- 실행 흐름 모니터링
- 자주 호출되는 함수 식별
- 최적화 기회 제안
- 잠재적 병목 현상 강조

### 5. 예외 처리 분석
런타임 오류 디버깅:
```
"내 앱이 처리되지 않은 예외로 충돌합니다. 예외를 잡아서
발생 시점의 정확한 상태를 보여줄 수 있나요?"
```
AI는 다음을 수행합니다:
- 예외 모니터링
- 예외 세부사항 및 스택 추적 캡처
- 충돌 시점의 변수 상태 표시
- 근본 원인 분석
- 오류 처리 개선사항 제안

### 6. 테스트 주도 디버깅
실패하는 테스트 디버깅:
```
"내 단위 테스트가 실패합니다. 테스트 실행을 디버깅하고
어설션이 실패하는 이유를 보여줄 수 있나요?"
```
AI는 다음을 수행합니다:
- 디버그 모드에서 테스트 실행
- 테스트 어설션에서 중단
- 예상값과 실제값 비교
- 불일치의 원인 추적
- 테스트 또는 코드 수정사항 제안

## 🤖 AI 에이전트 통합 가이드

### AI 어시스턴트와 MCP Debug Tools 사용하기

AI 기반 개발 워크플로우에서 MCP Debug Tools를 활용하고자 하는 AI 개발자와 사용자를 위해, AI 에이전트가 이러한 디버깅 도구를 효과적으로 사용할 수 있도록 돕는 포괄적인 규칙 문서를 제공합니다.

#### MCP_DEBUG_TOOLS_RULES.md

이 문서는 AI 에이전트가 다음을 수행할 수 있도록 하는 필수 가이드라인과 패턴을 포함합니다:
- 디버깅 작업의 적절한 순서 이해
- 일반적인 디버깅 시나리오를 효율적으로 처리
- 오류에서 우아하게 복구
- 성능과 안전을 위한 모범 사례 따르기

#### 사용 방법

1. **AI 도구 사용자의 경우 (Cursor, Windsurf 등)**
   - 디버깅 시 AI 어시스턴트의 컨텍스트에 규칙 문서 포함
   - [`MCP_DEBUG_TOOLS_RULES.md`](./MCP_DEBUG_TOOLS_RULES.md)에서 관련 섹션을 프롬프트에 복사
   - 프롬프트 예시:
     ```
     내 Node.js 애플리케이션을 디버그해야 합니다. 적절한 도구 순서와
     오류 처리를 위해 MCP Debug Tools 규칙을 따라주세요.
     [MCP_DEBUG_TOOLS_RULES.md의 관련 섹션 붙여넣기]
     ```

2. **맞춤형 AI 에이전트 개발의 경우**
   - 디버깅 워크플로우 구현을 위한 참조로 규칙 문서 사용
   - 순차적 작업 패턴을 에이전트 로직에 통합
   - 강력한 디버깅 자동화를 위한 오류 복구 전략 따르기

3. **참조할 주요 섹션**
   - **사전 요구사항 확인**: 디버깅 전 환경 준비 확인
   - **도구 카테고리**: 5개 주요 도구 카테고리와 목적 이해
   - **순차적 작업**: 디버깅 작업의 적절한 순서 따르기
   - **일반 워크플로우**: 일반적인 디버깅 시나리오를 위한 사전 구축 패턴
   - **오류 복구**: 실패를 처리하고 우아하게 복구

#### 규칙 따르기의 이점

- ✅ **오류 감소**: 적절한 도구 순서로 일반적인 실수 방지
- ✅ **효율적인 디버깅**: 최적화된 워크플로우로 시간과 리소스 절약
- ✅ **향상된 AI 지원**: AI가 더 정확한 디버깅 도움 제공 가능
- ✅ **일관된 결과**: 표준화된 패턴으로 신뢰할 수 있는 결과 보장

#### AI 지원 디버깅 세션 예시

```
사용자: "내 함수가 undefined를 반환하는 이유를 찾도록 도와주세요"

AI (규칙 사용):
1. 먼저, 사용 가능한 VSCode 인스턴스를 확인합니다 (list-vscode-instances)
2. 함수 시작 부분에 브레이크포인트를 설정합니다 (add-breakpoint)
3. 디버그 세션을 시작합니다 (start-debug)
4. 일시정지 시, 모든 변수를 검사합니다 (get-variables-scope)
5. undefined가 도입되는 위치를 찾기 위해 단계별 실행합니다 (step-over)
6. 결과를 바탕으로 수정사항을 제안합니다
```

전체 규칙과 패턴은 [`MCP_DEBUG_TOOLS_RULES.md`](./MCP_DEBUG_TOOLS_RULES.md) 참조

## 📊 현재 제한사항
- 실시간 동기화는 MCP 프로토콜 제약에 의해 제한됨

## 🔮 향후 계획
- 원격 디버깅
- 성능 프로파일링 도구

## 🐛 문제 해결

### CLI가 VSCode를 찾을 수 없음
1. VSCode 확장 프로그램이 활성화되어 있는지 확인
2. `.mcp-debug-tools/config.json`이 존재하는지 확인
3. `--port` 옵션으로 수동 연결 시도

### 여러 VSCode 창
- CLI는 현재 디렉토리를 기반으로 자동 선택
- `list-vscode-instances`를 사용하여 활성 인스턴스 확인
- `select-vscode-instance`를 사용하여 특정 인스턴스 선택

## 📄 라이선스

GNU General Public License v3.0 - [LICENSE](https://github.com/hwanyong/mcp-debug-tools/blob/main/LICENSE)

## 🤝 기여

이슈와 Pull Request를 환영합니다!

## 📚 참고 자료

- [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [VSCode Extension API](https://code.visualstudio.com/api)

---

**AI와 함께하는 즐거운 디버깅! 🚀**