# Docker Deployment

## Overview

Deploy API Tester Kit on a VPS using Docker and Docker Compose. Includes Nginx reverse proxy with optional SSL support.

## Prerequisites

- Docker 20.10+
- Docker Compose v2+
- (Optional) Domain name with DNS configured
- (Optional) SSL certificates for HTTPS

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/api-tester-kit.git
cd api-tester-kit
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start services

```bash
docker compose up -d
```

### 4. Verify

```bash
docker compose ps
curl http://localhost:3000
```

## Services

| Service | Description | Port |
|---|---|---|
| `api-tester` | Next.js application | 3000 |
| `nginx` | Reverse proxy | 80, 443 |

## Configuration

### Environment Variables (.env)

```bash
# Application
PORT=3000
NODE_ENV=production

# Nginx
NGINX_PORT=80
NGINX_SSL_PORT=443
```

### Nginx Configuration

Edit `nginx/default.conf` to customize:

- Upstream server
- Proxy headers
- SSL settings
- Caching rules

### SSL Configuration

1. Place certificates in `nginx/ssl/`:
   - `fullchain.pem` - SSL certificate
   - `privkey.pem` - Private key

2. Uncomment HTTPS server block in `nginx/default.conf`

3. Restart nginx:
   ```bash
   docker compose restart nginx
   ```

## Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f api-tester

# Rebuild after changes
docker compose build --no-cache
docker compose up -d

# Pull latest image
docker compose pull
docker compose up -d

# Clean up unused images
docker image prune -f
```

## Health Checks

The application includes health checks:

```bash
# Check application health
curl http://localhost:3000

# Check Docker health status
docker inspect --format='{{.State.Health.Status}}' api-tester-kit
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs api-tester

# Check if port is in use
lsof -i :3000
```

### Nginx 502 Bad Gateway

```bash
# Verify upstream is running
docker compose ps

# Check nginx config
docker compose exec nginx nginx -t
```

### SSL certificate errors

```bash
# Verify certificate files
ls -la nginx/ssl/

# Check certificate validity
openssl x509 -in nginx/ssl/fullchain.pem -text -noout
```

## Production Recommendations

1. **SSL**: Always use HTTPS in production
2. **Firewall**: Only expose ports 80 and 443
3. **Updates**: Regularly update Docker images
4. **Backups**: Backup any persistent data
5. **Monitoring**: Set up container health monitoring
6. **Logging**: Configure log rotation

## GitHub Actions Deployment

The project includes GitHub Actions workflows for automated deployment:

1. **CI** (`.github/workflows/ci.yml`): Runs on push/PR
   - Lint
   - Type check
   - Vitest tests
   - Jest tests
   - Build

2. **CD** (`.github/workflows/cd.yml`): Runs on version tags
   - Build Docker image
   - Push to GitHub Container Registry
   - Deploy to VPS via SSH

### Setting up CD

1. Add secrets to GitHub repository:
   - `VPS_HOST`: Your server IP
   - `VPS_USER`: SSH username
   - `VPS_SSH_KEY`: SSH private key

2. Create a release:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
