# Architecture decision

## What formulas can and cannot do

Formula fields compute a value from fields in the same record. Cross-table values require linked-record plus lookup, or filterUp. These fields are calculated/read-only surfaces: they do not create a master record, upsert a row, or push an edit back to the source.

Therefore a copied physical child table cannot automatically join a bidirectional roster system through formulas alone.

## Default: single-source mode

Keep one physical `KOL记录` table and expose it through different views/forms and advanced-permission roles.

Benefits:

- immediate consistency with no sync job
- stable native record IDs
- no row matching or duplicate-write loops
- internal and agency owners edit different fields on the same record
- lower automation usage and fewer failure modes

The internal `汇总名单` and each agency surface are views, not copies of the data. A view filter is convenience, not security; enforce isolation with advanced permissions.

## Alternative: physical-mirror mode

Use only for hard table/Base isolation. Each agency table owns agency fields; the master owns internal fields. Native workflows or record APIs create/upsert the counterpart and maintain stable source/master record IDs.

This mode costs more to operate and each copied child must be registered because table IDs and workflow references are concrete. A template copy may preserve field definitions, but do not assume it clones or rewires Base-level workflows.

## Decision rule

| Requirement | Mode |
|---|---|
| Same Base membership is acceptable | Single-source |
| Immediate visibility with least maintenance | Single-source |
| Agency must not access the Base at all | Physical mirror or separate Base |
| Legal/contractual physical separation | Physical mirror |
| User only wants a familiar spreadsheet-like surface | Single-source view |
