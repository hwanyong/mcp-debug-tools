#!/bin/bash

echo "🎯 VSCode Extension 배포 시작..."

# VSCode Extension용 package.json으로 교체
cp package-vscode.json package.json

# 빌드
npm run compile

# VSCode Extension 패키징
npx @vscode/vsce publish

echo "✅ VSCode Extension 패키징 완료!"
echo "📦 .vsix 파일이 생성되었습니다."
echo "🌐 Marketplace에 업로드하세요: https://marketplace.visualstudio.com/manage"

# npm 패키지용 package.json으로 복원
cp package-npm.json package.json

echo "🔄 package.json이 npm 패키지용으로 복원되었습니다."
