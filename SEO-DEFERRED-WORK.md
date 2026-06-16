# SEO / AEO / GEO — Deferred Work

Internal notes. **Not published** (excluded in `_config.yml`).
Created 2026-06-16 after the full SEO/AEO/GEO audit + on-site fix pass.

These items were **deliberately not auto-fixed** during the fix pass because they are larger
**editorial / judgment-heavy** projects where bulk automation would risk content quality. Each is
real and worth doing — do them deliberately. Ask Claude to drive any of them.

The deterministic/critical fixes (ROI contradictions, fake review schema, LocalBusiness type,
stale pricing, "data included" copy, fabricated legal stats, llms.txt 404, Trustpilot link,
services FAQ, pagination noindex, H1 spacing, 3 clear cannibalization dupes) were all completed
and verified in the same pass — see the commit that adds this file.

---

## 1. Broader keyword cannibalization (~18 posts) — HIGH impact
Only the 3 **exact-duplicate** pairs were consolidated (best-companies 05-22→05-14, AI lead-scoring→propensity; Georgia pair was already done). The larger fuzzy clusters still self-compete:

- **"Cold calling real estate 2026" generic cluster (~10 posts)** — synonyms of tips/tactics/hacks/strategies/blueprint/system. Pick ONE pillar (`…2026-blueprint` or `…investors-2026`), merge the unique paragraphs in, and `301`/`canonical_url` the other ~8 into it.
- **"Best cold calling companies" roundups (~8 posts)** — collapse to ONE real-estate-investor roundup + ONE B2B/solar roundup. Ensure the blog roundup doesn't cannibalize the money page `best-cold-calling-companies-real-estate.html`.
- **"Cold calling scripts real estate"** — `2024-11-19-create-effective-cold-calling-scripts.md` duplicates `2026-03-31-cold-calling-scripts-real-estate-2026.md` (same target_keyword). Make the 2026 one the hub; canonical the 2024 one.
- **Georgia mega-cluster (~12 posts, Apr–May 2026)** — keep 3–4 distinct angles (compliance, foreign investors, Atlanta, general); merge the rest.
- **Solar duplicates** — `2024-06-18-…book-more-appointments.md` + `2024-07-08-…scripts-that-book-appointments.md` (same kw) → merge.

**Method:** prefer real merges + the existing `robots: "noindex, follow"` + `canonical_url:` frontmatter pattern (the post layout already supports `page.canonical_url`). True 301s would need the `jekyll-redirect-from` plugin.
**Partial cannibalization to also resolve:** `real-estate.html` vs `cold-calling-for-real-estate-investors.html` (both investor money pages, share the Tampa case study) — differentiate H1s/intent and cross-link.

## 2. E-E-A-T: wire founder bylines into the blog — HIGH impact
- `_layouts/post.html` emits `"@type":"Person","name":"Televista Team"` (a non-person typed as Person) and bylines `rel="author"` to `/about.html`. 301 posts share this generic byline.
- The cure already exists, unused: `about.html` has full `Person` JSON-LD for founders **Amer & Mahmoud** (photos, "Co-Founder" titles, operator bios).
- **Do:** add an author-bio block to `post.html`; byline operator-voice posts (compliance, ROI, call-timing) to Amer/Mahmoud; point JSON-LD `author` at the real Person entities. (Add surnames + LinkedIn to the about.html founder schema for entity authority.)

## 3. Upgrade weak/circular citations in benchmark posts — MEDIUM-HIGH (GEO + trust)
Sampled posts lean on a single Reddit thread, competitor blogs (REmail Direct), Jamil Academy, a Quora graphic-design CPL, and **circular self-citations** to Televista's own blog presented as "research." LLMs discount these.
- **Do:** replace with FTC / FCC / NAR / Census / authoritative sources. Priority files: `2026-05-18-cold-calling-distressed-properties-roi.md`, `2026-06-13-…cost-per-deal-benchmarks.md`, `2026-06-08-…cpl-cpa-benchmarks.md`.
- Also verify/replace any remaining unverifiable first-party stats ("847+ tracked calls", "50,000 calls" dataset).

## 4. Location-page uniqueness — MEDIUM (doorway-page risk on 25 pages)
~35–45% unique today; 3–4 verbatim template sentences repeat across all 25, and most "compliance" sections claim state-specificity but name **zero statutes**.
- **Do:** name one real statute per state (CA → CCPA/CPRA + two-party recording consent; TX already names "Business & Commerce Code"; OH names nothing), vary the repeated template sentences, internally link each state page to its matching state/city blog post.
- Bug: `cold-calling-ohio.html` says "three major metros" but "6 Cities" in the metric card — reconcile.

## 5. Comparison-page legal exposure — MEDIUM (review before scaling)
`televista-vs-*` pages make specific unverified factual claims about named competitors (Power ISA "pools your leads across **hundreds** of campaigns" / "~$1,150/mo"; REVA "~$1,500/mo, healthcare focus"). Pages hedge ("based on publicly published materials as of June 2026"), but keep dated screenshot evidence on file or soften the hard quantifiers/dollar figures to reduce trade-libel risk.

## 6. New content assets (GEO magnets) — MEDIUM
- **REI glossary / definitions hub** (assignment, novation, subject-to, DSCR, double-close) — strong AI-citation + internal-link asset; topics exist scattered but no canonical definitional page.
- **Gated script library / lead magnet** — FSBO/absentee posts reference scripts but there's no downloadable.
- Note: an **ROI calculator** (`#roi-calculator` on services.html, `calcIndustry` in main.js) and a **sample call audio player** (`callerAudio` in main.js) already exist — confirm they're surfaced on enough pages before building new ones.

## 7. Minor / low-priority technical & schema
- **`/services` vs `/services.html` duplicate URL surface** — both return 200. Canonicals already consolidate; a true `/index.html`→`/` redirect isn't possible on plain GitHub Pages without a plugin. Optional cleanup: standardize internal links to the `.html` form.
- **`wizard.css` (21 KB) + `wizard.js` (46 KB) unminified on all pages** — minify (use a real CSS/JS minifier, not by hand) and/or load only where the wizard is used.
- **about.html duplicate `Person` entities** — "Amer"/"Mahmoud" defined twice (in `Organization.founder[]` and standalone `Person`) with no shared `@id`; add `@id` (e.g. `#amer`, `#mahmoud`) so crawlers don't see 4 people.
- **LinkedIn handle mismatch** — `sameAs` uses `linkedin.com/company/televistaagency` while the brand is `televistaleadgeneration`; confirm it's the correct/owned profile.
- **Product schema for a service (pricing.html)** — `Service`/`Offer` is more correct than `Product` (kept `Product` after removing the fake reviews; harmless but won't earn the merchant snippets it implies).
- **Add a real Terms of Service page** — removed the broken `terms-of-service.html` link from llms.txt; a B2B service site should have a lawyer-reviewed ToS (you already have privacy-policy.html + compliance.html).

## 8. Verify in a live browser (couldn't observe programmatically)
- Whether Google AI Overviews / People-Also-Ask / ads / local pack appear on the ~8 informational queries (cost, "does it still work 2026", vs PPC/SMS/direct-mail, scripts, AI lead scoring) — determines ranking-vs-citation strategy.
- Whether the on-page testimonials and the named Ohio client ("David Whillhite") are real/verifiable.

---

## Off-site plan (the ~90% of AI visibility that lives off your pages)
Tracked separately — the priority order:
1. **Claim + fill the empty Clutch profile**, drive 10–20 verified reviews (highest ROI).
2. **Get onto third-party "best cold calling for REI/wholesalers" listicles** (RealEstateBees, PropertyLeads, Ossisto, GigaBPO) — aim for a top-3 named slot.
3. **Grow real Trustpilot + Google reviews** (currently ~7 on Trustpilot, 4.2/5).
4. **Seed authentic Reddit / BiggerPockets answers.**
5. **REI podcast/YouTube spots** for founders; **one original data study** as stat/link bait.
6. Keep llms.txt + schema as hygiene — NOT as AEO levers (2026 evidence: no citation lift).
