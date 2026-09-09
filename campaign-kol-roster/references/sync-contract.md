# Synchronization contract

## Read and match

On every manual run, read only populated rows from each agency roster and the master. Build in-memory indexes; do not compare every agency row against every master row.

Candidate scope is always the same agency. Cross-agency matches are used only for duplicate counts and adjacency, never to merge or overwrite records.

Matching priority:

1. `platform + normalized URL`
2. `country + platform + normalized KOL name`
3. create a new record

Normalize URLs by trimming whitespace, lowercasing, removing protocol, leading `www.`, query/fragment, and trailing slash. Normalize text keys by trimming and lowercasing. Include platform in both keys.

Claim each candidate once per run so repeated identical rows from one agency remain separate. For each matched/new child row, retain the master record ID in memory and use it for writeback after master sorting.

Because agency sheets intentionally have no internal ID, simultaneous changes to platform, URL, country, and name can be interpreted as a new submission. Do not silently delete the unmatched old master record. Report this limitation in operational documentation.

## Direction and write behavior

- Copy agency A:G to master A:G.
- Copy agency J:T to master K:U.
- Recalculate master F from master L using the configured tier boundaries.
- Never read agency H/I into the master.
- Write master I/J back to agency H/I after matching.
- Set master V to the agency name; maintain W:Z internally.
- Recalculate W as the number of distinct agencies sharing the KOL identity key.
- Sort the master by country, name, platform, then agency so multi-agency submissions are adjacent.
- Do not delete master rows merely because an agency row disappeared unless the user explicitly defines deletion semantics.

## Trigger and status

Expose `runSync` through:

- a custom `KOL同步 → 立即同步` menu
- an assigned image/drawing button on `同步控制`

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
