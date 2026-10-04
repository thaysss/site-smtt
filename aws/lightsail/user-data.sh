#!/bin/sh
set -eu
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y docker.io docker-compose-v2 ca-certificates
systemctl enable --now docker
usermod -aG docker ubuntu
install -d -m 0750 -o ubuntu -g ubuntu /opt/smtt
if [ ! -f /swapfile ]; then
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    printf '/swapfile none swap sw 0 0\n' >> /etc/fstab
fi
printf 'ready\n' > /opt/smtt/bootstrap-ready
chown ubuntu:ubuntu /opt/smtt/bootstrap-ready
