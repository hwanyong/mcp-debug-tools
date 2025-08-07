# MCP Debug Tools - 배포 가이드

이 문서는 MCP Debug Tools의 첫 배포와 재배포 과정을 설명합니다.

## 📋 목차

1. [개요](#-개요)
2. [첫 배포](#-첫-배포)
3. [재배포](#-재배포)
4. [문제 해결](#-문제-해결)
5. [체크리스트](#-체크리스트)

## 🎯 개요

MCP Debug Tools는 두 개의 독립적인 프로그램으로 배포됩니다:

- **CLI Tool**: npm 패키지 (`@hwanyong/mcp-debug-tools`)
- **VSCode Extension**: VSCode Marketplace

## 🚀 첫 배포

### 1. CLI Tool 첫 배포

#### 1-1. npm 계정 설정
```bash
# npm 로그인
npm login

# 사용자 정보 확인
npm whoami
```

#### 1-2. 스코프 설정
```bash
# 스코프 생성 (처음 사용시)
npm org create hwanyong

# 또는 개인 스코프 사용
npm init --scope=@hwanyong
```

#### 1-3. 빌드 및 배포
```bash
# 빌드
npm run compile

# 첫 배포 (public 접근 권한 필요)
npm publish --access public
```

#### 1-4. 배포 확인
```bash
# 패키지 정보 확인
npm view @hwanyong/mcp-debug-tools

# 버전 확인
npm view @hwanyong/mcp-debug-tools version

# npx 테스트
npx @hwanyong/mcp-debug-tools --help
```

### 2. VSCode Extension 첫 배포

#### 2-1. Publisher 계정 생성
1. [VSCode Extension Marketplace](https://marketplace.visualstudio.com/) 접속
2. **Sign in** 클릭
3. **Publisher 계정** 생성
4. **Publisher ID** 선택 (예: `hwanyong`)

#### 2-2. 패키지 준비
```bash
# 빌드
npm run compile

# VSCode Extension 패키징
npm run vscode:prepublish
```

#### 2-3. Marketplace 업로드
1. **Publisher Dashboard** 접속
2. **New Extension** 클릭
3. **.vsix 파일** 업로드
4. **확장 프로그램 정보** 입력:
   - Display Name: `MCP Debug Tools`
   - Description: `VSCode extension and CLI tool for MCP-based debugging`
   - Tags: `debugging`, `mcp`, `dap`
5. **게시**

### 3. MCP 설정

#### 3-1. Cursor 설정
`~/.cursor/mcp.json` 파일에 추가:
```json
{
  "mcpServers": {
    "dap-proxy": {
      "command": "npx",
      "args": ["-y", "@hwanyong/mcp-debug-tools", "--port=8890"],
      "env": {}
    }
  }
}
```

#### 3-2. 다른 AI 도구 설정
각 AI 도구의 MCP 설정 파일에 동일한 설정 추가

## 🔄 재배포

### 1. CLI Tool 재배포

#### 1-1. 버전 업데이트
```bash
# 패치 버전 (0.0.1 → 0.0.2)
npm version patch

# 마이너 버전 (0.0.1 → 0.1.0)
npm version minor

# 메이저 버전 (0.0.1 → 1.0.0)
npm version major
```

#### 1-2. 빌드 및 배포
```bash
# 빌드
npm run compile

# 배포
npm publish
```

#### 1-3. 배포 확인
```bash
# 새 버전 확인
npm view @hwanyong/mcp-debug-tools version

# npx 테스트
npx @hwanyong/mcp-debug-tools --help
```

### 2. VSCode Extension 재배포

#### 2-1. 버전 업데이트
```bash
# package.json에서 수동으로 버전 변경
# 예: "version": "0.0.1" → "version": "0.0.2"
```

#### 2-2. 빌드 및 패키징
```bash
# 빌드
npm run compile

# VSCode Extension 패키징
npm run vscode:prepublish
```

#### 2-3. Marketplace 업데이트
1. **Publisher Dashboard** 접속
2. **기존 확장 프로그램** 선택
3. **새 .vsix 파일** 업로드
4. **변경사항 설명** 입력
5. **게시**

### 3. MCP 설정 업데이트

#### 3-1. 자동 업데이트
- npx는 항상 최신 버전을 자동으로 다운로드
- 별도 설정 변경 불필요

#### 3-2. 특정 버전 사용시
```json
{
  "mcpServers": {
    "dap-proxy": {
      "command": "npx",
      "args": ["-y", "@hwanyong/mcp-debug-tools@0.0.2", "--port=8890"],
      "env": {}
    }
  }
}
```

## 🚨 문제 해결

### CLI Tool 배포 문제

#### npm 로그인 실패
```bash
# 토큰 재생성
npm token create

# 로그인 재시도
npm login
```

#### 스코프 권한 문제
```bash
# 스코프 권한 확인
npm org ls hwanyong

# 스코프에 사용자 추가
npm org add hwanyong <username>
```

#### 패키지 이름 충돌
```bash
# 패키지 이름 사용 가능 여부 확인
npm search @hwanyong/mcp-debug-tools

# 다른 스코프 사용
npm init --scope=@your-username
```

### VSCode Extension 배포 문제

#### Publisher 계정 문제
- Marketplace에서 Publisher 계정 재확인
- Publisher ID 중복 확인

#### .vsix 파일 문제
```bash
# 파일 크기 확인
ls -la *.vsix

# 패키지 내용 확인
unzip -l *.vsix
```

#### Marketplace 오류
- 필수 필드 누락 확인
- 태그 및 설명 길이 제한 확인
- 이미지 파일 형식 확인

## ✅ 체크리스트

### CLI Tool 첫 배포
- [ ] npm 계정 로그인
- [ ] 스코프 생성/확인
- [ ] 코드 빌드 (`npm run compile`)
- [ ] 첫 배포 (`npm publish --access public`)
- [ ] 배포 확인 (`npm view @hwanyong/mcp-debug-tools`)
- [ ] npx 테스트 (`npx @hwanyong/mcp-debug-tools --help`)

### VSCode Extension 첫 배포
- [ ] Publisher 계정 생성
- [ ] 코드 빌드 (`npm run compile`)
- [ ] 패키징 (`npm run vscode:prepublish`)
- [ ] Marketplace 업로드
- [ ] 확장 프로그램 정보 입력
- [ ] 게시 완료

### CLI Tool 재배포
- [ ] 코드 수정 완료
- [ ] 버전 업데이트 (`npm version patch`)
- [ ] 빌드 (`npm run compile`)
- [ ] 배포 (`npm publish`)
- [ ] 새 버전 확인
- [ ] npx 테스트

### VSCode Extension 재배포
- [ ] 코드 수정 완료
- [ ] 버전 수동 업데이트
- [ ] 빌드 (`npm run compile`)
- [ ] 패키징 (`npm run vscode:prepublish`)
- [ ] Marketplace 업로드
- [ ] 변경사항 설명 입력
- [ ] 게시 완료

## 📊 배포 후 확인

### CLI Tool
```bash
# 버전 확인
npm view @hwanyong/mcp-debug-tools version

# 다운로드 테스트
npx @hwanyong/mcp-debug-tools --help

# MCP 연결 테스트
# Cursor에서 MCP 기능 사용 테스트
```

### VSCode Extension
- VSCode에서 확장 프로그램 업데이트 확인
- 모니터링 패널 정상 작동 확인
- 상태바 표시 확인

## 🔧 유용한 스크립트

### CLI Tool 재배포 스크립트
```bash
#!/bin/bash
# redeploy-cli.sh

echo "🚀 CLI Tool 재배포 시작..."

# 버전 업데이트
npm version patch

# 빌드
npm run compile

# 배포
npm publish

echo "✅ CLI Tool 재배포 완료!"
echo "새 버전: $(npm view @hwanyong/mcp-debug-tools version)"
```

### Extension 재배포 스크립트
```bash
#!/bin/bash
# redeploy-extension.sh

echo "🎯 VSCode Extension 재배포 시작..."

# 빌드
npm run compile

# 패키징
npm run vscode:prepublish

echo "✅ VSCode Extension 패키징 완료!"
echo "Marketplace에 .vsix 파일을 업로드하세요."
```

## 📝 버전 관리

### Semantic Versioning
- **MAJOR.MINOR.PATCH** 형식 사용
- **PATCH**: 버그 수정 (0.0.1 → 0.0.2)
- **MINOR**: 기능 추가 (0.0.1 → 0.1.0)
- **MAJOR**: 호환성 변경 (0.0.1 → 1.0.0)

### 버전 업데이트 명령
```bash
# 패치 버전
npm version patch

# 마이너 버전
npm version minor

# 메이저 버전
npm version major
```

---

**참고**: 이 문서는 배포 과정을 안내하며, 실제 배포 전에 충분한 테스트를 권장합니다. 