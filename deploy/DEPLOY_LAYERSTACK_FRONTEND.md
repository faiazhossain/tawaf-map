# LayerStack Frontend Deployment Runbook

This runbook deploys the Next.js frontend to `layerstack_frontend` using Docker Compose with the image from Docker Hub and configures Nginx for `https://tawaf.barikoimaps.com`.

## 1) Pre-checks (safe)

Run on local machine:

```bash
ssh layerstack_frontend "hostname && whoami"
ssh layerstack_frontend "docker --version && docker compose version && nginx -v"
```

## 2) Upload docker-compose.yml to server

```bash
scp docker-compose.yml layerstack_frontend:/home/faiaz/tawaf-map/
```

Or sync the entire deploy directory:

```bash
rsync -avz deploy/ layerstack_frontend:/home/faiaz/tawaf-map/deploy/
```

## 3) Pull image and start container

On server:

```bash
cd /home/faiaz/tawaf-map
docker compose pull
docker compose up -d
docker compose ps
docker compose logs -f --tail=200 tawaf-frontend
```

Health check from server:

```bash
curl -I http://127.0.0.1:3000
```

## 4) Install Nginx site config

Copy config (without .conf extension):

```bash
sudo cp deploy/nginx/tawaf.barikoimaps.com.conf /etc/nginx/sites-available/tawaf.barikoimaps.com
sudo ln -sf /etc/nginx/sites-available/tawaf.barikoimaps.com /etc/nginx/sites-enabled/tawaf.barikoimaps.com
```

Validate and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5) SSL certificate (if not already present)

If certs do not exist:

```bash
sudo certbot --nginx -d tawaf.barikoimaps.com
```

Then test:

```bash
curl -I https://tawaf.barikoimaps.com
```

## 6) Rollback commands

```bash
cd /home/faiaz/tawaf-map
docker compose down
docker image ls | head
```

Nginx rollback:

```bash
sudo rm -f /etc/nginx/sites-enabled/tawaf.barikoimaps.com
sudo nginx -t
sudo systemctl reload nginx
```

## 7) Update deployment

To update to a new image version:

```bash
cd /home/faiaz/tawaf-map
docker compose pull
docker compose up -d
docker compose ps
```

## Notes

- Image is pulled from Docker Hub: `rilusmahmud/tawaf-map:latest`
- App is exposed only on `127.0.0.1:3000`; external traffic should come via Nginx.
- Use `.env.production` for environment-specific variables (create from `.env.production.example`).
- Prefer running all `sudo` commands manually with confirmation.
