#!/usr/bin/env python3
"""Build the old-site -> Framer migration map from Search Console page exports.

Inputs  (seo/data): gsc-pages-12m_*.csv, gsc-pages-3m_*.csv
Output  (seo/):     migration-map.csv, migration-map-summary.md

Decisions are PROPOSALS for Todd to approve. Rules follow the handover brief, section 6:
  move   = rebuild on Framer at the same address
  merge  = fold into a stronger page, 301 redirect
  retire = 301 redirect to the nearest relevant page
  review = needs a decision from Todd (product list, outside target area but earning clicks, etc.)
  none   = variant of another URL (www/http/query/no slash/asset); handled by sitewide rules
Re-run whenever the exports are refreshed:  python3 seo/scripts/build_migration_map.py
"""
import csv, glob, os, re, collections
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

TIER1 = "earl-shilton barwell burbage hinckley stoke-golding desford market-bosworth sapcote stoney-stanton broughton-astley".split()
TIER2 = ("leicester leicestershire loughborough market-harborough coalville melton-mowbray lutterworth ashby-de-la-zouch wigston oadby "
         "blaby enderby narborough braunstone-town thorpe-astley glenfield groby anstey birstall thurmaston syston shepshed mountsorrel "
         "rothley quorn sileby kibworth countesthorpe whetstone ibstock measham castle-donington kegworth kirby-muxloe ratby markfield").split()
TIER3 = "nottingham northampton milton-keynes".split()
# Warwickshire towns next to the home patch, added by Todd 14 Nov 2026
WARKS = "nuneaton coventry rugby".split()
# Near Hinckley but not yet confirmed by Todd
NEARBY_UNCONFIRMED = "bedworth atherstone".split()
# Todd: avoid the Birmingham area
AVOID = "birmingham solihull walsall dudley wolverhampton west-bromwich".split()
ALIASES = {"sheshed": "shepshed", "nottinghamshire": "nottingham", "northamptonshire": "northampton", "south-wigston": "wigston"}
TOWN_PREFIXES = ["solar-panels-", "battery-storage-", "ev-chargers-", "tesla-powerwall-", "givenergy-installer-",
                 "air-conditioning-", "sigenergy-installer-", "growatt-installer-", "solaredge-installer-",
                 "zappi-ev-charger-installer-", "drone-roof-survey-", "solar-and-air-conditioning-package-"]
# Pages that earn their own address even when a town hub exists (handover: Earl Shilton Powerwall, 1,344 impressions)
OWN_PAGE_IMPRESSIONS = 500
OWN_PAGE_CLICKS = 5
OUTSIDE_REVIEW_CLICKS = 10

SERVICE_HUB = {  # nearest new Framer page per service
    "solar-panels": "/services/solar", "battery-storage": "/services/battery", "tesla-powerwall": "/services/battery",
    "givenergy-installer": "/services/battery", "sigenergy-installer": "/services/battery", "growatt-installer": "/services/solar",
    "solaredge-installer": "/services/solar", "ev-chargers": "/services/ev-charging", "zappi-ev-charger-installer": "/services/ev-charging",
    "air-conditioning": "/services/air-conditioning", "solar-and-air-conditioning-package": "/services/air-conditioning",
    "drone-roof-survey": "/services/re-roofing",
}
FIXED = {  # path -> (decision, new_url, reason)
    "/": ("move", "/", "Home. Framer /home-v2 must become /"),
    "/solar-panels/": ("merge", "/services/solar", "Old service page; or rename Framer slug to keep this address (CONFIRM)"),
    "/battery-storage/": ("merge", "/services/battery", "Old service page; or rename Framer slug to keep this address (CONFIRM)"),
    "/ev-chargers/": ("merge", "/services/ev-charging", "Old service page; or rename Framer slug to keep this address (CONFIRM)"),
    "/air-conditioning/": ("merge", "/services/air-conditioning", "Old service page"),
    "/re-roofing-and-solar/": ("merge", "/services/re-roofing", "Old service page"),
    "/services/": ("retire", "/", "Services index"),
    "/solar-calculator/": ("move", "/solar-calculator/", "Earns clicks; calculator needs building in Framer"),
    "/reviews/": ("move", "/reviews/", "Planned reviews page (stage 3)"),
    "/areas-we-cover/": ("move", "/areas-we-cover/", "Planned areas page, links to town pages (stage 3)"),
    "/about/": ("merge", "/the-chameleon-principle", "About content lives on The Chameleon Principle"),
    "/contact/": ("merge", "/get-started", "Enquiries go through the Leon funnel"),
    "/energy-planning-call/": ("merge", "/get-started", "Funnel offers the 15-minute call"),
    "/solar-plan/": ("merge", "/get-started", "Funnel offers the survey"),
    "/our-process/": ("review", "/the-chameleon-principle", "Could be its own page (journey stages) or merge"),
    "/privacy-policy/": ("move", "/privacy-policy/", "Legal page: missing on Framer site"),
    "/terms-and-conditions/": ("move", "/terms-and-conditions/", "Legal page: missing on Framer site"),
    "/terms-conditions/": ("merge", "/terms-and-conditions/", "Duplicate terms page"),
    "/complaints/": ("move", "/complaints/", "Required for RECC/consumer code: missing on Framer site"),
    "/careers/": ("review", "", "Keep only if hiring"),
    "/make-a-payment/": ("review", "", "Needed if customers pay online"),
    "/sitemap/": ("retire", "/", "Framer generates sitemap.xml"),
    "/blog/": ("move", "/blog/", "Articles index (Framer CMS collection)"),
    "/guides/": ("move", "/guides/", "Guides index (Framer CMS collection)"),
    "/products/": ("review", "/products/", "Products index; depends on product list (CONFIRM)"),
    "/commercial-solar/": ("move", "/commercial-solar/", "Commercial is a target (Todd, 14 Nov): page needed on Framer"),
    "/commercial-ev-charging/": ("move", "/commercial-ev-charging/", "Commercial is a target (Todd, 14 Nov): page needed on Framer"),
    "/in-roof-solar-panels/": ("merge", "/services/solar", "Fold into solar service page as a section"),
    "/flat-roof-solar-panels/": ("merge", "/services/solar", "Fold into solar service page as a section"),
    "/fox-ess-installer/": ("review", "", "Product/installer page; depends on product list (CONFIRM)"),
    "/solar-energy/": ("retire", "/services/solar", "No traffic"),
}


def tier_of(town):
    town = ALIASES.get(town, town)
    if town in TIER1: return "1", town
    if town in TIER2: return "2", town
    if town in TIER3: return "3", town
    if town in WARKS: return "warks", town
    if town in NEARBY_UNCONFIRMED: return "nearby?", town
    if town in AVOID: return "avoid", town
    return "outside", town


def load(pattern):
    path = glob.glob(os.path.join(DATA, pattern))[0]
    return {r["page"]: r for r in csv.DictReader(open(path))}


def main():
    m12, m3 = load("gsc-pages-12m_*.csv"), load("gsc-pages-3m_*.csv")
    urls = sorted(set(m12) | set(m3))
    out = []
    for url in urls:
        u = urlparse(url)
        path = u.path or "/"
        a, b = m12.get(url, {}), m3.get(url, {})
        c12, i12 = int(a.get("clicks", 0) or 0), int(a.get("impressions", 0) or 0)
        row = dict(old_url=url, path=path, page_type="", town="", tier="",
                   clicks_12m=c12, impressions_12m=i12, position_12m=a.get("position", ""),
                   clicks_3m=b.get("clicks", 0), impressions_3m=b.get("impressions", 0), position_3m=b.get("position", ""),
                   decision="", new_url="", reason="")

        def set_(t, d, n, r): row.update(page_type=t, decision=d, new_url=n, reason=r)

        if u.netloc != "energyconcernsltd.co.uk" or u.scheme != "https" or u.query:
            set_("variant", "none", "", "www/http/query-string variant; covered by sitewide www->apex, http->https")
        elif path.startswith("/wp-content/"):
            set_("asset", "none", "", "Old WordPress file; let 404/410")
        elif not path.endswith("/"):
            set_("variant", "merge", path + "/", "No-trailing-slash duplicate")
        elif path in FIXED:
            set_("core", *FIXED[path])
        else:
            parts = path.strip("/").split("/")
            slug = parts[-1]
            if len(parts) == 1 and any(slug.startswith(p) for p in TOWN_PREFIXES):
                pre = next(p for p in TOWN_PREFIXES if slug.startswith(p))
                service, raw_town = pre[:-1], slug[len(pre):]
                tier, town = tier_of(raw_town)
                row.update(town=town, tier=tier)
                hub = f"/solar-panels-{town}/"
                if raw_town in ("alternative-leicester", "with-battery", "the-future-of-energy-storage"):
                    set_("town-service", "retire", SERVICE_HUB.get(service, "/"), "Not a real town page")
                elif tier == "nearby?":
                    set_("town-service", "review", path, "Close to Hinckley; include in target area? (CONFIRM)")
                elif tier in ("outside", "avoid"):
                    if c12 >= OUTSIDE_REVIEW_CLICKS and tier != "avoid":
                        set_("town-service", "review", SERVICE_HUB.get(service, "/"), f"Outside target area but earned {c12} clicks in 12m")
                    else:
                        set_("town-service", "retire", SERVICE_HUB.get(service, "/"), "Outside target area" if tier == "avoid" else "Outside target area, low traffic")
                elif service == "solar-panels" and raw_town == town:
                    set_("town-hub", "move", path, f"Tier {tier} town hub: solar + battery + solar-and-battery")
                elif service == "solar-panels":
                    set_("town-hub", "merge", hub, f"Alias of {town}")
                elif c12 >= OWN_PAGE_CLICKS or i12 >= OWN_PAGE_IMPRESSIONS:
                    set_("town-service", "move", path, f"Own page: demand ({i12} impr, {c12} clicks in 12m)")
                elif service in ("air-conditioning", "ev-chargers", "zappi-ev-charger-installer", "drone-roof-survey"):
                    set_("town-service", "merge", SERVICE_HUB[service], "Not part of solar/battery hub; low demand")
                else:
                    set_("town-service", "merge", hub, f"Fold into Tier {tier} town hub")
            elif parts[0] == "guides":
                if c12 >= 1 or i12 >= 500:
                    set_("guide", "move", path, "Guide with demand: move content and address unchanged")
                else:
                    set_("guide", "retire", "/guides/", "No clicks, little demand")
            elif parts[0] == "blog":
                hit = next((t for t in sorted(TIER1 + TIER2 + TIER3 + WARKS + list(ALIASES), key=len, reverse=True)
                            if re.search(rf"(^|-){t}(-|$)", slug)), None)
                if "commercial" in slug:
                    set_("blog-commercial", "move", path, "Commercial work is a target (Todd, 14 Nov)")
                elif hit and hit != "leicestershire":
                    tier, town = tier_of(hit)
                    row.update(town=town, tier=tier)
                    set_("blog-town", "merge", f"/solar-panels-{town}/", f"Town guide: fold local content into Tier {tier} hub")
                elif re.search(r"(birmingham|oxford|hereford|shrewsbury|shropshire|telford|stafford|stoke|wolverhampton|worcester|kidderminster|"
                               r"solihull|derby|banbury|peterborough|stamford|kettering|swadlincote|ironbridge|black-country|"
                               r"west-midlands|dudley)", slug):
                    if c12 >= OUTSIDE_REVIEW_CLICKS:
                        set_("blog-outside", "review", "/blog/", f"Outside target area but earned {c12} clicks in 12m")
                    else:
                        set_("blog-outside", "retire", "/blog/", "Outside target area, low traffic")
                elif c12 >= 1 or i12 >= 500:
                    set_("blog", "move", path, "Article with demand: move unchanged")
                else:
                    set_("blog", "retire", "/blog/", "No clicks, little demand")
            elif parts[0] in ("products", "brands"):
                if c12 >= 1 or i12 >= 200:
                    set_(parts[0][:-1], "review", path, "Has demand; keep if Todd fits this product (CONFIRM product list)")
                else:
                    set_(parts[0][:-1], "review", "/products/", "Low demand; merge into product page if fitted (CONFIRM)")
            elif parts[0] in ("ev-chargers", "battery-storage", "solar-panels", "solar-energy"):
                set_("service-sub", "merge" if c12 else "retire", SERVICE_HUB.get(parts[0], "/services/solar"), "Old service sub-page")
            else:
                set_("other", "review", "", "Unclassified")
        out.append(row)

    out.sort(key=lambda r: (-r["clicks_12m"], -r["impressions_12m"]))
    fields = list(out[0].keys())
    with open(os.path.join(ROOT, "migration-map.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(out)

    # Summary
    canon = [r for r in out if r["decision"] != "none"]
    by = collections.defaultdict(lambda: [0, 0, 0])
    for r in canon:
        x = by[r["decision"]]; x[0] += 1; x[1] += r["clicks_12m"]; x[2] += r["impressions_12m"]
    tot_c = sum(r["clicks_12m"] for r in canon)
    existing_hubs = {r["town"] for r in out if r["page_type"] == "town-hub" and r["decision"] == "move"}
    lines = ["# Migration map: summary", "",
             "Generated by `seo/scripts/build_migration_map.py` from Search Console page exports "
             "(12 months to 11 Nov 2026, plus 3 months). Every decision is a **proposal** for Todd to approve.", "",
             "| Decision | Pages | Clicks (12m) | Share of clicks | Impressions (12m) |", "|---|---|---|---|---|"]
    for d in ("move", "merge", "retire", "review"):
        n, c, i = by[d]
        lines.append(f"| {d} | {n} | {c:,} | {c / tot_c:.0%} | {i:,} |")
    lines += ["", f"Variants (www, http, query strings, assets) excluded: {len(out) - len(canon)} URLs.", "",
              "## Review items (need Todd's decision)", "", "| Page | Clicks 12m | Impr 12m | Why |", "|---|---|---|---|"]
    for r in [r for r in canon if r["decision"] == "review"][:40]:
        lines.append(f"| {r['path']} | {r['clicks_12m']} | {r['impressions_12m']:,} | {r['reason']} |")
    lines += ["", "## Town-level pages kept as their own page (demand threshold)", ""]
    for r in [r for r in canon if r["page_type"] == "town-service" and r["decision"] == "move"]:
        lines.append(f"- {r['path']}: {r['impressions_12m']:,} impressions, {r['clicks_12m']} clicks")
    missing = [t for t in TIER1 + TIER2 + TIER3 + WARKS if t not in existing_hubs and t != "leicestershire"]
    lines += ["", "## Target towns with no existing solar page (new addresses needed)", "", ", ".join(missing), ""]
    open(os.path.join(ROOT, "migration-map-summary.md"), "w").write("\n".join(lines))
    print("\n".join(lines[:12]))


if __name__ == "__main__":
    main()
