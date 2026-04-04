#!/bin/bash
# build/i18n/build.sh
if [ $# -lt 2 ]; then
    echo "使用法: $0 <入力元パス> <出力先パターン>"
    echo "例: $0 ./src/main.js ./dist/main.{lang}.js"
    exit 1
fi
# macro.jsがあるディレクトリへ移動して実行（パス解決のため）
cd "$(dirname "$0")"
bun run build.js "$1" "$2"

