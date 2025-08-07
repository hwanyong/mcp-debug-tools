#!/bin/bash

echo "🚀 npm 패키지 배포 시작..."

# npm 패키지용 package.json으로 교체
cp package-npm.json package.json

# 빌드
npm run compile

# npm 배포
npm publish

echo "✅ npm 패키지 배포 완료!"
echo "📦 패키지: @uhd_kr/mcp-debug-tools"

# VSCode Extension용 package.json으로 복원
cp package-vscode.json package.json

echo "🔄 package.json이 VSCode Extension용으로 복원되었습니다."
