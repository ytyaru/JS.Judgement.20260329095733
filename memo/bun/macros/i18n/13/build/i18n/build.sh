#!/bin/bash
# build/i18n/build.sh

if [ $# -lt 2 ]; then
    echo "使用法: $0 <入力元パス> <出力先パターン>"
    echo "例: $0 ./src/main.js ./dist/main.{lang}.js"
    exit 1
fi

# 実行時のディレクトリを環境変数に入れてJSに伝える
export INIT_CWD=$(pwd)

# build.js があるディレクトリのスクリプトを実行
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
bun run "$SCRIPT_DIR/build.js" "$1" "$2"
