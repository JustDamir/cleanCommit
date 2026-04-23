#!/bin/bash
echo "🚀 Clean Commit"
echo "==============="
cd python_service && ./start.sh &
sleep 3
go run cmd/server/main.go
