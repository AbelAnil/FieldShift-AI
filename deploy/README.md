# Self-hosted deployment (GHCR images + Caddy + Watchtower + Tailscale)

Every push triggers `.github/workflows/docker-publish.yml`, which builds both images
(linux/amd64 + linux/arm64) and pushes them to GitHub Container Registry:

| Image | Tags |
|---|---|
| `ghcr.io/abelanil/fieldshift-ai-backend` | `latest` (default branch), `<branch>`, `sha-<short>`, `<semver>` on `v*` tags |
| `ghcr.io/abelanil/fieldshift-ai-frontend` | same |

## One-time: make the packages public
After the first workflow run, open each package under
**GitHub → your profile → Packages → fieldshift-ai-backend / -frontend → Package settings → Change visibility → Public**.
Then anyone can `docker pull` without logging in, and Watchtower needs no credentials.

## Run it

```bash
mkdir fieldshift && cd fieldshift
# copy docker-compose.yml, Caddyfile and .env.example from this folder
cp .env.example .env   # set SECRET_KEY, LLM_API_KEY, ...
docker compose up -d
```

The app is served at http://localhost:8080:

- `/api/*`, `/docs`, `/redoc`, `/openapi.json` → backend
- everything else → frontend

The frontend calls the API on the same origin, so no CORS setup or public API URL is needed.
The SQLite database lives in the `backend-data` volume.

## Auto-updates
Watchtower checks GHCR every `WATCHTOWER_POLL_INTERVAL` seconds (default 300) and restarts
`backend` / `frontend` when a new `latest` is pushed. Only containers labelled
`com.centurylinklabs.watchtower.enable=true` are touched. Pin a version with `IMAGE_TAG=sha-abc1234`.

## Expose publicly with Tailscale Funnel

```bash
sudo tailscale funnel --bg 8080
tailscale funnel status     # shows https://<machine>.<tailnet>.ts.net
```

Funnel terminates HTTPS, so Caddy serves plain HTTP. Turn it off with `sudo tailscale funnel --https=443 off`.
