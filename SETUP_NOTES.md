# stefanvesper.com – Setup & Deployment Notizen

## Stack
- **Framework:** Astro + Tailwind CSS (Theme: Career Portfolio, data-driven SSG)
- **Hosting:** Hetzner VPS (CX22, Ubuntu 24.04)
- **Webserver:** Nginx
- **CI/CD:** GitHub Actions → rsync auf den Server
- **SSL:** Let's Encrypt via Certbot
- **Domain-Registrar:** IONOS
- **Server-IP:** `178.105.161.33`
- **Server-User:** `stefan`

---

## Projektstruktur

```
src/
  data/         → JSON-Dateien für alle Inhalte (home, career, tech, projects)
  assets/       → Bilder (werden von Astro optimiert)
  components/   → Astro-Komponenten (u.a. project-card.astro)
  utils/        → images.ts (resolveAssetImage)
public/
  media/        → Videos (in .gitignore! Müssen manuell per scp auf Server)
  favicon.ico
```

---

## Content pflegen

### Projekte hinzufügen (`src/data/projects.json`)
- `images`: nur Dateiname, z.B. `"brandedPlayer.png"` → Datei muss in `src/assets/`
- `video`: Pfad ab public, z.B. `"/media/demo.mp4"` → Datei muss in `public/media/`
- **Keine deutschen Anführungszeichen** `„"` in JSON-Strings → stattdessen `''` nutzen
- JSON nach Änderungen validieren: `python3 -c "import json; json.load(open('src/data/projects.json')); print('JSON valid')"`
- Link auf `"#"` setzen wenn kein externer Link vorhanden → Button wird automatisch ausgeblendet

### Videos auf den Server laden (nicht via Git!)
```bash
scp /Users/steve/pfad/zur/datei.mp4 stefan@178.105.161.33:/var/www/stefanvesper.com/html/media/
```

### Bilder optimieren vor dem Commit
```bash
convert bild.jpg -quality 75 -resize "1920x1920>" bild.jpg
```
(ImageMagick muss installiert sein)

---

## Deployment

### Normaler Workflow
1. Änderungen in JSON/Code machen
2. `git add`, `git commit`, `git push origin main`
3. GitHub Actions baut Astro und deployed via rsync automatisch

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)
- Baut mit `npm run build`
- rsync nach `/var/www/stefanvesper.com/html/`
- Nginx reload ist **nicht** im Workflow (würde sudo-Fehler erzeugen)

### Git Push schlägt fehl (HTTP 400 / Buffer zu klein)
```bash
git config --global http.postBuffer 524288000
```

---

## Server-Zugang

### SSH Login
```bash
ssh stefan@178.105.161.33
```

### Nginx
```bash
sudo nginx -t                        # Konfiguration testen
sudo systemctl reload nginx          # Nginx neu laden
sudo nano /etc/nginx/sites-available/stefanvesper.com  # Config bearbeiten
```

### Nginx-Konfiguration (wichtig)
- Default-Config deaktivieren: `sudo rm /etc/nginx/sites-enabled/default`
- IPv6 in Config: `listen [::]:80;` und `listen [::]:443 ssl;`

---

## SSL / Certbot

### Erstzertifikat ausstellen
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d stefanvesper.com -d www.stefanvesper.com
```

### Falls IPv6 Probleme (CA kann Domain nicht erreichen)
DNS-Challenge nutzen statt HTTP-Challenge:
```bash
sudo certbot certonly --manual --preferred-challenges dns -d stefanvesper.com -d www.stefanvesper.com
```
→ Certbot gibt einen Wert vor → bei IONOS als TXT-Record `_acme-challenge` eintragen
→ Warten bis TXT sichtbar ist: `dig _acme-challenge.stefanvesper.com TXT +short`
→ Dann im Certbot-Terminal Enter drücken

### Auto-Erneuerung testen
```bash
sudo certbot renew --dry-run
```

---

## DNS bei IONOS

- A-Record `@` → `178.105.161.33`
- A-Record `www` → `178.105.161.33`
- AAAA-Records (IPv6) löschen wenn kein IPv6 auf dem Server
- Nameserver der Domain prüfen: `dig stefanvesper.com NS +short`
- Direkt beim IONOS-NS prüfen (umgeht lokalen Cache):
  ```bash
  dig @ns1023.ui-dns.org stefanvesper.com AAAA +short
  ```

---

## Häufige Fehler & Lösungen

| Problem | Ursache | Lösung |
|---|---|---|
| JSON parse error | Deutsche Anführungszeichen `„"` | Ersetzen durch `''` |
| GitHub Actions Build fail | Fehlende `package-lock.json` | `npm install` + committen |
| Nginx zeigt Default-Seite | Default-Config aktiv | `sudo rm /etc/nginx/sites-enabled/default` |
| Certbot HTTP 400 (IPv6) | Alter AAAA-Record bei IONOS | DNS-Challenge nutzen |
| git push HTTP 400 | postBuffer zu klein | `git config --global http.postBuffer 524288000` |
| Videos fehlen nach Deploy | `public/media/` in `.gitignore` | Manuell per scp auf Server laden |
| Icon not found (Astro build) | Icon-Name ungültig | Mit `mdi:` Prefix ersetzen |
