# Apply workflow

## Validate

Reject the entire apply before any schema write when there are duplicate/blank keys, unsupported types, inconsistent scope/ownership/direction, duplicate orders, invalid options, or a missing record ID.

## Diff

Compare desired configuration with `_系统映射` and current live field definitions. Report:

- fields to add
- labels to rename
- views/orders/formats to update
- select options to add
- child surfaces to update
- blocked destructive changes

Use a deterministic configuration hash so an unchanged configuration skips schema work.

## Safe automatic changes

- add a field
- rename the display label while retaining field ID
- reorder fields in generated views
- change visibility, required state, help text, and compatible formatting
- add select options
- add/register a child surface

## Blocked by default

- changing `字段Key`
- deleting a live field or stored records
- changing an existing field to an incompatible type
- removing a select option that has stored values
- changing record identity or matching roles on a populated system
- changing synchronization ownership when both sides contain different nonblank values

For an approved incompatible type migration, create a new field, convert/copy values with explicit error reporting, verify counts, switch views/workflows, then deprecate the old field. Never mutate or delete first.

## Synchronization behavior

Single-source mode applies structure, views, and permissions; it does not copy business rows. Physical-mirror mode generates owner-directed workflows using stable record IDs and skips unchanged writes. Track additions, actual changes, checked records, and failures separately.
