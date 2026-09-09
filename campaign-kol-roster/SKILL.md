---
name: campaign-kol-roster
description: Build or maintain a reusable Google Sheets architecture for a campaign that collects KOL submissions from multiple agencies, normalizes the rosters, creates one internal master and one agency-facing sheet per agency, and adds manual bidirectional synchronization. Use when the user wants to 汇总代理达人名单, create a campaign KOL roster system, split a master into agency sheets, or reuse this campaign workflow. Do not use for a one-off spreadsheet cleanup that does not need agency/master synchronization.
---

# Campaign KOL Roster

Create a campaign-specific Google Drive/Sheets system with a confidential internal master, simplified agency-facing sheets, and one manually triggered synchronization flow.

Use the Google Drive and Google Sheets skills for file and workbook operations. Use an authenticated browser only for Apps Script, OAuth, Google Cloud configuration, or assigning an image/button action when the connector cannot perform those actions.

## Required inputs

Resolve these from the request, source folder, filenames, and existing sheets before asking:

- campaign name
- destination Drive folder
- source roster files and the agency represented by each
- whether an existing master or campaign architecture must be updated instead of recreated

Ask only when an agency-to-file mapping or a destructive/moving action is materially ambiguous. Preserve all original files. Move them into `旧格式代理提报名单` only when the user authorizes organizing or archiving the sources.

## Default architecture

Read [references/workbook-architecture.md](references/workbook-architecture.md) before creating or restructuring workbooks.

Unless the user specifies otherwise:

- Keep every agency submission as an independent record. Never deduplicate away a submission.
- Place multi-agency submissions for the same KOL next to one another in the master.
- Use one internal master workbook and one agency-facing workbook per agency.
- Keep `标准说明`, `粉丝量级参考`, and `同步控制` as separate master tabs.
- Agency workbooks keep their own roster plus an agency-safe `标准说明` and the tier reference. Do not expose other agencies, source provenance, internal IDs, KOL pool status, or duplicate counts.
- Use a manual `立即同步` button/menu. Do not add a timer or scheduled trigger unless explicitly requested.

## Data ownership and direction

Treat these as invariants:

- Agency → master: country, KOL name, platform, account URL, content type, follower tier, audience profile, quote, follower count, recent average views, view rate, engagements, engagement rate, competitor history, recommendation, deliverables, submission date, and Remark.
- Master → agency: `推进合作` and `DM Comments` only.
- Master only: `KOL池`, agency name, duplicate-agency count, original source, original row, and submission record ID.
- An agency edit to `推进合作` or `DM Comments` must never overwrite the master; the next sync restores the master values.

## Normalization defaults

- Platform dropdown: `YouTube`, `TikTok`, `Instagram`, `Facebook`.
- Country dropdown: use the campaign markets; for this operating model the usual set is `越南`, `泰国`, `马来西亚`, `菲律宾`.
- Yes/no dropdowns: `是`, `否`.
- Store follower, average-view, engagement, and quote fields as numbers, not strings; display number fields with thousands separators.
- Store view rate and engagement rate as percentages.
- Merge source average-view columns into `近15条平均播放量`; if two source measures both exist and no better rule is supplied, use their simple average and document that choice.
- Merge source remark-like columns into one `Remark`, removing only exact duplicated text fragments.
- Default follower tiers: `0-150K`, `150K-500K`, `500K-1.2M`, `1.2M+`. Keep one shared tagging system across all countries and provide a separate country-ecology interpretation table.

## Synchronization implementation

Read [references/sync-contract.md](references/sync-contract.md) whenever creating, changing, or diagnosing synchronization.

Generate Apps Script with [scripts/render_sync_script.py](scripts/render_sync_script.py) when the default 26-column master and 20-column agency schemas apply. Read [references/script-configuration.md](references/script-configuration.md) for the input shape. Configure the master spreadsheet ID, agency names/IDs, and tier thresholds; do not paste campaign-specific IDs into the skill itself.

The matching priority must be:

1. Limit candidates to the same agency.
2. Match normalized `platform + account URL`.
3. Fall back to normalized `country + platform + KOL name`.
4. If neither matches, create a new master record and a new internal record ID.

Each master candidate may be claimed only once per sync. After matching, use the claimed internal record ID for that run's master-to-agency writeback.

## Build and validation

Read [references/implementation-checklist.md](references/implementation-checklist.md) before changing Drive structure, publishing agency sheets, or declaring completion.

Always verify:

- source row counts reconcile with master records without deduplication
- master has 26 columns A:Z and each agency roster has 20 columns A:T
- deleting internal agency columns adjusts native table ranges, dropdowns, conditional formatting, and formulas
- `推进合作 = 是` colors the entire agency/master row light green
- a test sync completes with zero unexpected additions and the expected update count
- internal fields and other-agency information are absent from every agency-facing workbook
- the control sheet reports the last sync time, success/failure, additions, and updates

If OAuth is blocked, follow the bounded recovery in the sync contract. Do not weaken account security controls or publish the application externally merely to bypass the warning.
