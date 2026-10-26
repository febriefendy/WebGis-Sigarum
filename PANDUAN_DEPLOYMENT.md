# PANDUAN DEPLOYMENT DAN KEAMANAN PRODUKSI — SIGARUM WEBGIS
## Panduan Penerapan Sistem di Server Produksi, Docker, PostgreSQL + PostGIS, dan Nginx HTTPS

---

## 1. PERSYARATAN SERVER PRODUKSI (SYSTEM REQUIREMENTS)

- **Operating System:** Ubuntu Server 22.04 LTS / Debian 12 (Disarankan)
- **CPU:** Minimal 2 vCPU
- **RAM:** Minimal 4 GB (disarankan untuk kalkulasi spasial PostGIS dan tile caching)
- **Penyimpanan:** Minimal 30 GB SSD
- **Runtimes:**
  - Node.js LTS v20.x atau v22.x
  - PostgreSQL 14+ atau 15+ dengan ekstensi PostGIS 3.x
  - Nginx (sebagai Reverse Proxy & SSL Termination)
  - PM2 (Process Manager) atau Docker & Docker Compose

---

## 2. MANAJEMEN ENVIRONMENT & SECRET (`.env`)

Buat berkas `.env` pada direktori root proyek di server produksi (jangan pernah melakukan *commit* berkas `.env` ke Git repository publik):

```ini
# =========================================================================
# SIGARUM PRODUCTION CONFIGURATION
# =========================================================================

# Server Environment
NODE_ENV=production
PORT=5000
APP_URL=https://sigarum.pamekasankab.go.id

# Keamanan Token JWT (Gunakan kunci acak 64 karakter)
JWT_SECRET=f98a7c2b3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4
JWT_EXPIRES_IN=7d

# Konfigurasi Basis Data PostgreSQL + PostGIS
DB_ENGINE=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=sigarum_db
DB_USER=sigarum_admin
DB_PASS=SandiRahasiaPostGISPamekasan2026!
DATABASE_URL=postgres://sigarum_admin:SandiRahasiaPostGISPamekasan2026!@127.0.0.1:5432/sigarum_db

# Konfigurasi Berkas Upload
MAX_UPLOAD_SIZE_MB=5
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/geo+json
```

---

## 3. INSTALASI DAN INISIALISASI DATABASE POSTGRESQL + POSTGIS

### A. Instalasi di Ubuntu Server
```bash
# Update repository sistem
sudo apt update && sudo apt upgrade -y

# Instal PostgreSQL dan ekstensi spasial PostGIS
sudo apt install -y postgresql postgresql-contrib postgis postgresql-14-postgis-3
```

### B. Membuat User dan Basis Data
```bash
sudo -u postgres psql
```
Di dalam console PostgreSQL:
```sql
-- 1. Buat User Khusus SIGARUM
CREATE USER sigarum_admin WITH PASSWORD 'SandiRahasiaPostGISPamekasan2026!';

-- 2. Buat Database
CREATE DATABASE sigarum_db OWNER sigarum_admin;

-- 3. Berikan Hak Akses Penuh
GRANT ALL PRIVILEGES ON DATABASE sigarum_db TO sigarum_admin;

-- 4. Beralih ke database sigarum_db
\c sigarum_db

-- 5. Aktifkan Ekstensi PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 6. Verifikasi versi PostGIS
SELECT PostGIS_Version();
\q
```

### C. Menjalankan Skema DDL dan Data Awal
Eksekusi skrip SQL yang telah disediakan:
```bash
# Impor DDL Schema (Tabel, Trigger Spasial, Indices, Views)
psql -h localhost -U sigarum_admin -d sigarum_db -f database/schema.sql

# Impor Data Awal (Seed Data)
psql -h localhost -U sigarum_admin -d sigarum_db -f database/seed.sql
```

---

## 4. DEPLOYMENT DENGAN NODE.JS & PM2

### A. Instalasi Dependensi dan Pengujian Otomatis
```bash
cd /var/www/sigarum-webgis
npm ci --production=false

# Jalankan pengujian otomatis untuk memastikan seluruh modul lulus
npm test
```

### B. Menjalankan Aplikasi di Latar Belakang (PM2)
```bash
# Instal PM2 secara global
sudo npm install -g pm2

# Jalankan server Express SIGARUM
pm2 start server/server.js --name "sigarum-api" -i max

# Simpan konfigurasi agar otomatis jalan saat server reboot
pm2 save
pm2 startup
```

---

## 5. KONFIGURASI NGINX REVERSE PROXY & HTTPS (SSL)

Buat berkas konfigurasi Nginx pada `/etc/nginx/sites-available/sigarum`:

```nginx
server {
    listen 80;
    server_name sigarum.pamekasankab.go.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sigarum.pamekasankab.go.id;

    # Sertifikat SSL (Let's Encrypt Certbot)
    ssl_certificate /etc/letsencrypt/live/sigarum.pamekasankab.go.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sigarum.pamekasankab.go.id/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Batas Maksimal Upload Berkas
    client_max_body_size 10M;

    # Root direktori statis frontend
    root /var/www/sigarum-webgis;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy untuk REST API
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Direktori Upload Gambar
    location /uploads/ {
        alias /var/www/sigarum-webgis/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Service Worker Cache Header
    location /sw.js {
        add_header Cache-Control "no-cache";
        proxy_cache_bypass $http_pragma;
        proxy_cache_revalidate on;
        expires off;
    }
}
```

Aktifkan konfigurasi dan pasang sertifikat SSL:
```bash
sudo ln -s /etc/nginx/sites-available/sigarum /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Pasang SSL gratis Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d sigarum.pamekasankab.go.id
```

---

## 6. OPSI DEPLOYMENT DOCKER (CONTAINERIZED)

Untuk deployment menggunakan container, telah disediakan file `Dockerfile` dan `docker-compose.yml`:

### A. `Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server/server.js"]
```

### B. `docker-compose.yml`
```yaml
version: '3.8'

services:
  db:
    image: postgis/postgis:15-3.3-alpine
    container_name: sigarum_postgis
    restart: always
    environment:
      POSTGRES_DB: sigarum_db
      POSTGRES_USER: sigarum_admin
      POSTGRES_PASSWORD: SandiRahasiaPostGISPamekasan2026!
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02_seed.sql
    ports:
      - "5432:5432"

  app:
    build: .
    container_name: sigarum_webgis_app
    restart: always
    depends_on:
      - db
    environment:
      PORT: 5000
      DATABASE_URL: postgres://sigarum_admin:SandiRahasiaPostGISPamekasan2026!@db:5432/sigarum_db
      JWT_SECRET: f98a7c2b3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4
    ports:
      - "5000:5000"
    volumes:
      - ./uploads:/app/uploads

volumes:
  pgdata:
```

Jalankan container dengan satu perintah:
```bash
docker compose up -d --build
```

---

## 7. STRATEGI BACKUP DAN PEMULIHAN (DISASTER RECOVERY)

### A. Otomatisasi Backup Basis Data (Cron Job Harian)
Buat skrip `/usr/local/bin/backup-sigarum.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/sigarum"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

# Dump basis data PostgreSQL PostGIS
pg_dump -U sigarum_admin -h localhost sigarum_db | gzip > "$BACKUP_DIR/sigarum_db_$TIMESTAMP.sql.gz"

# Hapus backup lebih dari 30 hari
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete

echo "Backup basis data SIGARUM selesai: sigarum_db_$TIMESTAMP.sql.gz"
```
Pasang ke cron job setiap pukul 02:00 pagi:
```bash
sudo crontab -e
# Tambahkan baris:
0 2 * * * /usr/local/bin/backup-sigarum.sh >> /var/log/sigarum-backup.log 2>&1
```

### B. Prosedur Pemulihan Basis Data (Restore)
```bash
# Ekstrak dan pulihkan ke database baru
gunzip -c /var/backups/sigarum/sigarum_db_20261019_020000.sql.gz | psql -U sigarum_admin -h localhost -d sigarum_db
```
