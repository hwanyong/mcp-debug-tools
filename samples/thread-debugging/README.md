# MCP Debug Tools - Thread Debugging Sample

Node.js Worker Threads를 사용한 멀티 스레드 디버깅 예제입니다. 메모리 구조와 스레드 간 통신을 학습할 수 있습니다.

## 📋 예제 내용

이 샘플은 다음과 같은 멀티 스레드 시나리오를 포함합니다:

### 1. **CPU 집약적 계산 (소수 찾기)**
- 여러 워커 스레드에서 동시 계산
- 워커 풀 패턴 구현
- 병렬 처리 성능 비교

### 2. **병렬 데이터 정렬**
- 대용량 배열을 청크로 분할
- 각 워커에서 독립적 정렬
- 정렬된 결과 병합

### 3. **SharedArrayBuffer 메모리 공유**
- 스레드 간 메모리 공유
- Atomics를 사용한 안전한 메모리 접근
- 동기화 메커니즘 구현

### 4. **워커 간 직접 통신**
- MessageChannel을 통한 통신
- 워커 간 데이터 전달
- 병렬 검색 작업

### 5. **성능 측정 및 비교**
- 단일 스레드 vs 멀티 스레드
- 실행 시간 측정
- 성능 향상 계산

## 🚀 실행 방법

### 일반 실행
```bash
npm start
# 또는
node worker-threads.js
```

### 디버그 모드 실행
```bash
npm run debug
# 또는
node --inspect worker-threads.js

# 모든 워커 디버그
npm run debug-workers
```

### SharedArrayBuffer 활성화
```bash
node --no-warnings --experimental-worker worker-threads.js
```

### VSCode에서 디버깅

1. VSCode에서 이 폴더를 엽니다
2. 좌측 디버그 탭 클릭 (Ctrl+Shift+D)
3. 상단 드롭다운에서 디버그 구성 선택:
   - **Debug Main Thread Only**: 메인 스레드만 디버깅
   - **Debug with Worker Threads**: 워커 스레드 포함 디버깅
   - **Debug with SharedArrayBuffer**: SharedArrayBuffer 활성화
   - **Attach to Worker Process**: 실행 중인 워커에 연결
4. F5 또는 실행 버튼 클릭

## 🔍 MCP Debug Tools 사용 예제

### 1. 워커 스레드 추적

```javascript
// AI에게 요청 예시:
"모든 활성 워커 스레드를 보여줘"
"threadId가 2인 워커의 현재 상태를 확인해줘"
```

### 2. 메모리 공유 디버깅

```javascript
// AI에게 요청 예시:
"SharedArrayBuffer의 메모리 내용을 보여줘"
"Atomics 연산이 일어나는 부분에 브레이크포인트를 설정해줘"
```

### 3. 메시지 통신 추적

```javascript
// AI에게 요청 예시:
"워커로 전달되는 메시지를 추적해줘"
"parentPort의 메시지 핸들러에 브레이크포인트를 설정해줘"
```

### 4. 성능 분석

```javascript
// AI에게 요청 예시:
"각 워커의 실행 시간을 측정해줘"
"병렬 처리와 순차 처리의 성능을 비교해줘"
```

## 📊 주요 디버깅 포인트

### 추천 브레이크포인트 위치

#### 메인 스레드
1. **라인 226**: WorkerPool 클래스 - 워커 생성 로직
2. **라인 285**: 병렬 작업 시작 - 태스크 분배
3. **라인 344**: SharedArrayBuffer 생성 - 메모리 할당
4. **라인 516**: 성능 측정 - 시간 비교

#### 워커 스레드
1. **라인 32**: workerTask 함수 - 작업 분기점
2. **라인 82**: CPU 집약적 계산 - 소수 찾기 알고리즘
3. **라인 153**: SharedArrayBuffer 조작 - 메모리 쓰기
4. **라인 178**: 메시지 핸들러 - 통신 처리

### 변수 관찰 목록

디버깅 시 다음 변수들을 Watch에 추가하면 유용합니다:

#### 메인 스레드
- `pool.workers`: 워커 풀의 워커 목록
- `pool.activeWorkers`: 활성 워커 수
- `sharedArray`: 공유 메모리 배열
- `results`: 워커 결과 수집

#### 워커 스레드
- `threadId`: 현재 스레드 ID
- `workerData`: 워커로 전달된 데이터
- `parentPort`: 메인 스레드와의 통신 포트
- `sharedBuffer`: 공유 메모리 버퍼

## 🎯 학습 목표

이 예제를 통해 다음을 학습할 수 있습니다:

### 1. **멀티 스레드 프로그래밍**
- Worker Threads API 이해
- 스레드 생성과 종료
- 스레드 라이프사이클 관리

### 2. **스레드 간 통신**
- 메시지 기반 통신
- MessageChannel 활용
- 데이터 직렬화와 역직렬화

### 3. **메모리 공유**
- SharedArrayBuffer 사용법
- Atomics 연산 이해
- 동기화와 경쟁 상태 방지

### 4. **병렬 처리 최적화**
- 워커 풀 패턴
- 작업 분배 전략
- 성능 측정과 분석

## 💡 고급 디버깅 기법

### 1. 워커별 디버깅

```javascript
// 특정 워커만 디버깅하기
if (threadId === 2) {
    debugger; // 이 워커만 중단
}
```

### 2. 조건부 로깅

```javascript
// 특정 조건에서만 로그 출력
if (workerData.taskType === 'compute' && result.count > 100) {
    console.log('Large prime count:', result);
}
```

### 3. 메모리 덤프

```javascript
// SharedArrayBuffer 상태 덤프
console.log('Memory snapshot:', Array.from(sharedArray.slice(0, 20)));
```

### 4. 타이밍 분석

```javascript
// 각 단계별 시간 측정
const stepStart = performance.now();
// ... 작업 수행 ...
const stepTime = performance.now() - stepStart;
console.log(`Step completed in ${stepTime}ms`);
```

## ⚠️ 주의사항

### SharedArrayBuffer 관련
- 일부 환경에서는 보안상 비활성화되어 있을 수 있음
- 필요시 `--no-warnings --experimental-worker` 플래그 사용
- COOP/COEP 헤더가 필요할 수 있음

### 워커 디버깅
- 워커는 별도의 V8 인스턴스에서 실행됨
- 각 워커는 독립적인 메모리 공간 사용
- 디버거 연결 시 포트 충돌 주의

### 성능 고려사항
- 워커 생성은 비용이 높음 (워커 풀 사용 권장)
- 작은 작업은 오히려 성능 저하 가능
- 메시지 전달 시 데이터 복사 비용 고려

## 🔗 관련 문서

- [MCP Debug Tools 메인 문서](../../README.md)
- [Node.js Worker Threads 문서](https://nodejs.org/api/worker_threads.html)
- [SharedArrayBuffer MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
- [Atomics MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Atomics)

## 🐛 문제 해결

### 워커가 시작되지 않는 경우
1. Node.js 버전 확인 (14.0.0 이상 필요)
2. Worker Threads 지원 여부 확인
3. 파일 경로가 올바른지 확인

### SharedArrayBuffer가 undefined인 경우
1. Node.js 플래그 확인: `--no-warnings --experimental-worker`
2. 브라우저 환경이 아닌 Node.js 환경인지 확인
3. Node.js 버전 업데이트 고려

### 디버거가 워커에 연결되지 않는 경우
1. `autoAttachChildProcesses: true` 설정 확인
2. 포트 충돌 확인 (기본: 9229)
3. VSCode 디버거 재시작

## 📈 확장 아이디어

1. **데이터베이스 연결 풀**: 각 워커가 독립적인 DB 연결 관리
2. **이미지 처리**: 이미지를 타일로 분할하여 병렬 처리
3. **웹 서버**: 각 워커가 독립적인 HTTP 요청 처리
4. **머신러닝**: 데이터셋을 분할하여 병렬 학습
5. **파일 처리**: 대용량 파일을 청크로 나누어 병렬 분석

---

**Happy Multi-threaded Debugging! 🚀🔧**