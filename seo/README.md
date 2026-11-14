# SEO workspace: Energy Concerns

Working files for the new Framer site's search programme (see the handover brief, stages 1 and 6.1).

- `data/`: raw Search Console exports via OpenSEO (property `sc-domain:energyconcernsltd.co.uk`), pulled 14 Nov 2026.
  - `gsc-pages-3m_*.csv` (464 pages) and `gsc-pages-12m_*.csv` (665 pages): complete page inventories.
  - `gsc-queries-3m-top1000.csv`: top 1,000 queries by clicks.
  - `gsc-query-page-3m-first3000.csv`: first 3,000 query-and-page rows (rows past 1,000 are zero-click long tail).
- `migration-map.csv`: every old URL with clicks, impressions and position, and a proposed decision (move, merge, retire, review), new address and reason.
- `migration-map-summary.md`: totals and the items that need Todd's decision.
- `scripts/build_migration_map.py`: rebuilds the map from `data/`. Thresholds and town tiers are at the top of the script.

All decisions are proposals until Todd approves them.
