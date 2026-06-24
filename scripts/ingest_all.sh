#!/bin/bash

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

for file in legal_docs/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        codex_name="${filename%.*}"
        
        echo "=================================================="
        echo "Ingesting $codex_name..."
        npx tsx scripts/ingest_codex.ts "$file" "$codex_name"
    fi
done

echo "All documents processed."
