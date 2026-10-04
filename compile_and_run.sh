#!/usr/bin/env bash
# Singly Linked List Implementation - Build and Launch Script for Linux / macOS

set -e

echo "====================================================================="
echo "   Singly Linked List Implementation - Build and Launch Script"
echo "====================================================================="
echo ""

COMPILER=""
if command -v gcc >/dev/null 2>&1; then
    COMPILER="gcc"
elif command -v clang >/dev/null 2>&1; then
    COMPILER="clang"
else
    echo "[ERROR] Neither gcc nor clang was found. Please install build-essential or clang."
    exit 1
fi

echo "[INFO] Using compiler: $COMPILER"
$COMPILER -Wall -O2 backend/server.c backend/linkedlist.c -o backend/server

echo "[SUCCESS] Backend compiled successfully into backend/server!"
echo ""
echo "[INFO] Starting Singly Linked List C HTTP Server on http://localhost:8080 ..."
echo "[INFO] Open http://localhost:8080 in your browser."
echo "Press Ctrl+C to terminate the server."
echo ""

cd backend && ./server
