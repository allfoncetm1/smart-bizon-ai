#!/bin/bash
# Smart Bizon AI — deploy script.
# Pulls latest from wait-for-db, rebuilds, restarts. Stops nginx/postgres
# during the build for memory headroom (2GB VPS, no swap) and always
# brings them back up. If the build fails, the previous working .next
# is restored so the site keeps running the old version instead of crash-looping.
set -e
cd /var/www/smart-bizon-ai

echo "==> git pull"
git pull origin wait-for-db

# This script may have just changed on disk (e.g. this very pull). Bash reads
# scripts incrementally, so continuing to execute a file that was rewritten
# underneath it is undefined behavior. Re-exec the (possibly new) copy once,
# with a guard so this can't loop forever.
if [ -z "$SB_DEPLOY_REEXEC" ]; then
  SB_DEPLOY_REEXEC=1 exec bash "$0" "$@"
fi

echo "==> npm install"
npm install --no-audit --no-fund

echo "==> prisma generate"
npx prisma generate

echo "==> prisma migrate deploy"
npx prisma migrate deploy

echo "==> stopping app/nginx/postgres for build headroom"
pm2 stop smart-bizon-ai || true
systemctl stop nginx postgresql

rm -rf .next.bak
if [ -d .next ]; then
  mv .next .next.bak
fi

BUILD_OK=1
echo "==> building"
if ! npm run build; then
  BUILD_OK=0
  echo "==> BUILD FAILED — restoring previous build"
  rm -rf .next
  if [ -d .next.bak ]; then
    mv .next.bak .next
  fi
else
  rm -rf .next.bak
fi

echo "==> restarting services"
systemctl start postgresql nginx
pm2 restart smart-bizon-ai
pm2 save

if [ "$BUILD_OK" -eq 1 ]; then
  echo "==> deploy OK"
else
  echo "==> deploy FAILED — site is back up on the PREVIOUS build, fix the error and redeploy"
  exit 1
fi
