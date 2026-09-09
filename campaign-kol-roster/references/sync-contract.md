# Synchronization contract

## Read and match

On every manual run, read only populated rows from each agency roster and the master. Build in-memory indexes; do not compare every agency row against every master row.

Before reading or writing row values, build a field-to-column map from row 1 in every workbook. Normalize header matching only by trimming whitespace, collapsing repeated spaces, and ignoring case. Use canonical field names for all reads, writes, matching, sorting, duplicate counts, tier calculation, and writeback. Physical column order is never authoritative.

Validate every workbook before any roster write:

- every required canonical header exists exactly once
- a moved column is accepted automatically
- a renamed, removed, or duplicated required header aborts the entire sync
- the failure message names the affected workbook and headers and states that no roster data was written

Allow unrelated extra columns and preserve their existing master values. Do not silently guess that an unfamiliar header is an alias for a required field.

Candidate scope is always the same agency. Cross-agency matches are used only for duplicate counts and adjacency, never to merge or overwrite records.

Matching priority:

1. `platform + normalized URL`
2. `country + platform + normalized KOL name`
3. create a new record

Normalize URLs by trimming whitespace, lowercasing, removing protocol, leading `www.`, query/fragment, and trailing slash. Normalize text keys by trimming and lowercasing. Include platform in both keys.

Claim each candidate once per run so repeated identical rows from one agency remain separate. For each matched/new child row, retain the master record ID in memory and use it for writeback after master sorting.

Because agency sheets intentionally have no internal ID, simultaneous changes to platform, URL, country, and name can be interpreted as a new submission. Do not silently delete the unmatched old master record. Report this limitation in operational documentation.

## Direction and write behavior

- Copy agency-maintained fields to the same canonical field names in the master, regardless of their current column positions.
- Recalculate `粉丝量级` from `粉丝数` using the configured tier boundaries.
- Transfer `提报日期` from its displayed calendar date to a spreadsheet date serial; do not pass Apps Script `Date` objects between workbooks because timezone conversion can shift the day.
- Never read agency `推进合作` or `DM Comments` into the master.
- Write master `推进合作` and `DM Comments` back to the columns with those headers in each agency sheet.
- Maintain `代理`, `重复提报代理数`, `原始文件`, `原始行号`, and `提报记录ID` by header name in the master.
- Recalculate `重复提报代理数` as the number of distinct agencies sharing the KOL identity key.
- Sort the master by country, name, platform, then agency so multi-agency submissions are adjacent.
- Do not delete master rows merely because an agency row disappeared unless the user explicitly defines deletion semantics.

## Trigger and status

Expose `runSync` through:

- a custom `KOL同步 → 立即同步` menu
- exactly one assigned image/drawing button on `同步控制`

Keep the visible button compact and place it beside or directly below the latest status block without covering the agency table. A cell-colored rectangle cannot execute Apps Script and must not be presented as a second button. Moving or resizing the assigned drawing must preserve its `runSync` assignment.

The control sheet stores the latest timestamp, status, and `新增 N 条；更新 N 条`. Use a document lock to prevent simultaneous runs. Use no timed trigger by default.

## OAuth recovery

If Google shows `This app is blocked`:

1. Create or choose a standard Google Cloud project owned by the user's organization/account.
2. Configure Google Auth Platform as External/Testing unless the organization requires an internal app.
3. Add only the required test users.
4. Link the Apps Script project to the standard Cloud project number.
5. Run `runSync`, continue through the unverified-testing warning, and grant only the required Sheets scope.
6. Verify an execution completes and the control sheet records success.

Do not publish the OAuth application or broaden scopes unless the user explicitly needs access beyond test users.
