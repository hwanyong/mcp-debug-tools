# MCP Debug Tools - Basic Debugging Sample

함수, 지역변수, 반복문, 조건문을 통한 기본적인 디버깅 학습 예제입니다.

## 📋 예제 내용

이 샘플은 다음과 같은 디버깅 시나리오를 포함합니다:

### 1. **클래스와 메서드 (DataProcessor)**
- 객체 지향 프로그래밍의 디버깅
- 인스턴스 변수 추적
- 메서드 호출 체인 관찰

### 2. **재귀 함수 (fibonacci)**
- 콜스택 깊이 관찰
- 재귀 호출 추적
- 전역 변수 변화 모니터링

### 3. **정렬 알고리즘 (bubbleSort)**
- 중첩 반복문 디버깅
- 조건문 분기 추적
- 배열 요소 스왑 관찰

### 4. **비동기 처리 (fetchDataAsync)**
- Promise와 async/await 디버깅
- 비동기 실행 흐름 추적
- 에러 처리 확인

### 5. **복잡한 데이터 구조 (processComplexData)**
- 중첩된 객체와 배열 검사
- 다양한 데이터 타입 처리
- 에러 수집 및 통계

### 6. **예외 처리 (divideNumbers)**
- try-catch 블록 디버깅
- 다양한 에러 타입 처리
- 에러 메시지 추적

## 🚀 실행 방법

### 일반 실행
```bash
npm start
# 또는
node app.js
```

### 디버그 모드 실행
```bash
npm run debug
# 또는
node --inspect app.js
```

### VSCode에서 디버깅

1. VSCode에서 이 폴더를 엽니다
2. 좌측 디버그 탭 클릭 (Ctrl+Shift+D)
3. 상단 드롭다운에서 디버그 구성 선택:
   - **Debug Basic Example**: 일반 디버깅
   - **Debug with Break on Start**: 시작 시 중단
   - **Debug with Conditional Breakpoints**: 조건부 브레이크포인트용
4. F5 또는 실행 버튼 클릭

## 🔍 MCP Debug Tools 사용 예제

### 1. 브레이크포인트 설정

```javascript
// AI에게 요청 예시:
"app.js 파일의 75번째 줄(fibonacci 함수)에 브레이크포인트를 설정해줘"

// 조건부 브레이크포인트
"bubbleSort 함수에서 array[j] > 50일 때만 멈추도록 조건부 브레이크포인트를 설정해줘"
```

### 2. 변수 검사

```javascript
// AI에게 요청 예시:
"현재 processor 객체의 data 배열 내용을 보여줘"
"globalCounter 변수의 현재 값은 얼마야?"
```

### 3. 콜스택 추적

```javascript
// AI에게 요청 예시:
"fibonacci(5)를 실행할 때 콜스택을 보여줘"
"현재 실행 중인 함수들의 호출 순서를 알려줘"
```

### 4. 스텝 실행

```javascript
// AI에게 요청 예시:
"bubbleSort 함수를 한 줄씩 실행하면서 배열이 어떻게 변하는지 보여줘"
"다음 함수 호출까지 실행해줘 (Step Over)"
```

## 📊 주요 디버깅 포인트

### 추천 브레이크포인트 위치

1. **라인 35**: `filterData` 메서드 - 조건부 필터링 로직
2. **라인 75**: `fibonacci` 함수 - 재귀 호출 시작
3. **라인 93-96**: `bubbleSort` 스왑 로직 - 정렬 과정 관찰
4. **라인 125**: `fetchDataAsync` Promise 처리
5. **라인 170-185**: `processComplexData` 타입별 처리 분기
6. **라인 214**: `divideNumbers` 에러 처리

### 변수 관찰 목록

디버깅 시 다음 변수들을 Watch에 추가하면 유용합니다:

- `globalCounter`: 전역 카운터
- `processor.data`: DataProcessor 인스턴스의 데이터
- `array`: 정렬 중인 배열
- `result`: 각 함수의 반환값
- `error`: 에러 객체

## 🎯 학습 목표

이 예제를 통해 다음을 학습할 수 있습니다:

1. **기본 디버깅 기술**
   - 브레이크포인트 설정 및 관리
   - 변수 값 검사
   - 실행 흐름 제어

2. **고급 디버깅 기술**
   - 조건부 브레이크포인트 활용
   - 콜스택 분석
   - 비동기 코드 디버깅

3. **MCP Debug Tools 활용**
   - AI를 통한 자동 디버깅
   - 복잡한 버그 추적
   - 효율적인 디버깅 워크플로우

## 📝 팁과 트릭

1. **조건부 브레이크포인트**: 특정 조건에서만 멈추도록 설정
   ```javascript
   // 예: i > 5일 때만 멈춤
   ```

2. **로그포인트**: 코드 수정 없이 로그 출력
   ```javascript
   // 브레이크포인트 대신 로그 메시지 설정
   ```

3. **Watch 표현식**: 복잡한 표현식 실시간 평가
   ```javascript
   // 예: processor.data.length > 0 && globalCounter < 100
   ```

## 🔗 관련 문서

- [MCP Debug Tools 메인 문서](../../README.md)
- [DAP Protocol 명세](https://microsoft.github.io/debug-adapter-protocol/)
- [VSCode 디버깅 가이드](https://code.visualstudio.com/docs/editor/debugging)

## 🐛 문제 해결

### 디버거가 연결되지 않는 경우
1. VSCode Extension이 활성화되어 있는지 확인
2. 포트 8890이 사용 가능한지 확인
3. `.vscode/launch.json` 파일이 올바른지 확인

### 브레이크포인트가 작동하지 않는 경우
1. 소스맵이 올바르게 생성되었는지 확인
2. 파일이 저장되었는지 확인
3. 디버그 구성이 올바른지 확인

---

**Happy Debugging! 🚀**