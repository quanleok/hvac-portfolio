#!/usr/bin/env bash
# Weekly SEO report for Double Le HVAC.
# Uses OpenClaw's search-console CLI (~/.local/bin/search-console).
# Run: bash scripts/seo-report.sh > seo-reports/$(date +%F).txt
#
# To schedule weekly (every Monday 8am), add to crontab:
#   0 8 * * 1 cd /path/to/hvac-service-management && bash scripts/seo-report.sh > seo-reports/$(date +\%F).txt 2>&1

set -e
SITE="sc-domain:double-le-hvac.com"
SITEMAP="https://www.double-le-hvac.com/sitemap.xml"

source ~/.zshrc 2>/dev/null || true

echo "================================================================"
echo "Double Le HVAC · Search Console Report"
echo "Generated: $(date '+%Y-%m-%d %H:%M %Z')"
echo "Site: $SITE"
echo "================================================================"
echo ""

echo "=== Sitemaps registered ==="
search-console list-sitemaps "$SITE"
echo ""

echo "=== Re-submitting sitemap (forces re-fetch) ==="
search-console submit-sitemap "$SITE" "$SITEMAP"
echo ""

echo "=== Top 25 search queries (last 28 days) ==="
search-console query "$SITE" --days 28 --dimensions query 2>/dev/null | head -120
echo ""

echo "=== Top 25 landing pages (last 28 days) ==="
search-console query "$SITE" --days 28 --dimensions page 2>/dev/null | head -120
echo ""

echo "=== Country breakdown (last 28 days) ==="
search-console query "$SITE" --days 28 --dimensions country 2>/dev/null | head -60
echo ""

echo "=== Device breakdown (last 28 days) ==="
search-console query "$SITE" --days 28 --dimensions device 2>/dev/null | head -40
echo ""

echo "Report complete."
