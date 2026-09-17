#!/bin/bash
# deploy.sh - Zero-downtime deployment script with automatic health check monitoring and rollback

set -e

# Configuration
SERVICE_NAME="backend"
HEALTH_CHECK_URL="http://localhost:5000/health"
MAX_ATTEMPTS=6
ATTEMPT_DELAY=10
DEPLOY_LOG_FILE="deploy.log"

# Standard JSON logger function for DevOps pipeline auditing
log_json() {
    local level=$1
    local msg=$2
    local event=$3
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "{\"timestamp\": \"$timestamp\", \"level\": \"$level\", \"logger\": \"deploy\", \"message\": \"$msg\", \"event\": \"$event\"}" | tee -a "$DEPLOY_LOG_FILE"
}

log_json "INFO" "Starting deployment process..." "deploy_start"

# 1. Fetch current running container and image tag for backup state
PREVIOUS_CONTAINER_ID=$(docker-compose ps -q $SERVICE_NAME || echo "")
if [ -n "$PREVIOUS_CONTAINER_ID" ]; then
    PREVIOUS_IMAGE_ID=$(docker inspect --format='{{.Image}}' "$PREVIOUS_CONTAINER_ID" || echo "")
    log_json "INFO" "Backup current container ID: $PREVIOUS_CONTAINER_ID with image ID: $PREVIOUS_IMAGE_ID" "deploy_backup"
else
    log_json "INFO" "No active container found. Fresh deployment will be performed." "deploy_backup_none"
fi

# 2. Build and start new version of SMTT backend
log_json "INFO" "Building image and starting container..." "deploy_up"
if ! docker-compose up --build -d; then
    log_json "ERROR" "Docker build/start command failed. Terminating deploy." "deploy_up_failed"
    exit 1
fi

# 3. Monitor health check endpoint
log_json "INFO" "Entering health check monitoring loop..." "health_monitor_start"
HEALTHY=false

for ((attempt=1; attempt<=MAX_ATTEMPTS; attempt++)); do
    log_json "INFO" "Validating service health (attempt $attempt/$MAX_ATTEMPTS) at $HEALTH_CHECK_URL" "health_check_attempt"
    
    # Perform HTTP check using python to ensure compatibility
    RESPONSE=$(python -c "
import urllib.request, json
try:
    with urllib.request.urlopen('$HEALTH_CHECK_URL', timeout=5) as r:
        data = json.loads(r.read().decode())
        if data.get('status') == 'healthy':
            print('ok')
except Exception:
    print('error')
" 2>/dev/null || echo "error")

    if [ "$RESPONSE" = "ok" ]; then
        HEALTHY=true
        break
    fi
    
    sleep $ATTEMPT_DELAY
done

# 4. Success or Rollback execution
if [ "$HEALTHY" = true ]; then
    log_json "INFO" "Deployment succeeded! SMTT backend health is healthy." "deploy_success"
else
    log_json "ERROR" "Deployment health checks failed. Starting automatic rollback..." "deploy_failed"
    
    if [ -n "$PREVIOUS_CONTAINER_ID" ] && [ -n "$PREVIOUS_IMAGE_ID" ]; then
        log_json "WARNING" "Reverting system state to previous image: $PREVIOUS_IMAGE_ID" "rollback_start"
        
        # Stop new broken container
        docker-compose down
        
        # Re-tag previous image as latest
        docker tag "$PREVIOUS_IMAGE_ID" "smtt-backend:latest"
        
        # Spin up backup container
        docker-compose up -d --no-build
        
        log_json "INFO" "Rollback completed successfully." "rollback_finished"
    else
        log_json "ERROR" "No stable previous container found to rollback to. Halting backend." "rollback_failed_no_state"
        docker-compose down
    fi
    exit 1
fi
