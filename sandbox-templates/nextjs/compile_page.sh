#!/bin/bash

function ping_server() {
    counter=0
    while true; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
        
        if [[ "$response" -eq 200 ]]; then
            echo "Server is up!"
            break
        fi

        ((counter++))
        if (( counter % 20 == 0 )); then
            echo "Waiting for server to start..."
        fi

        sleep 0.1
    done
}

# Start ping in the background
ping_server &

# Start the Next.js dev server
cd /home/user && exec npx next dev --turbo -H 0.0.0.0
