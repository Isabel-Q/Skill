# Physical-mirror mode

Use this mode only when separate physical agency tables/Bases are mandatory.

## Required linkage

Each agency row must retain a hidden `主表记录ID`. Each master row must retain `来源表ID` and `来源记录ID`. These stable IDs are authoritative; URL/name keys are only recovery fallbacks.

## Direction

- Agency → master: agency-owned fields only.
- Master → agency: `推进合作` and `DM Comments` only.
- Never let a mirrored write retrigger the opposite workflow indefinitely.

## Per-agency registration

After copying the child template:

1. Resolve the new table/Base and all field IDs.
2. Set the agency identity/default.
3. Create or clone an agency-to-master create/update workflow bound to the new table ID.
4. Create the master-to-agency feedback workflow or add a branch bound to the new table ID.
5. Store linkage IDs after the first successful create.
6. Enable workflows and inspect execution history.
7. Test create, agency edit, and internal feedback edit.

Copying alone is insufficient because workflow triggers/actions bind to stable table and field IDs. Never promise zero-registration physical copies unless the live product explicitly returns a supported dynamic-template mechanism.

## Loop prevention

Use one of these supported patterns:

- workflows watch only owner fields, so feedback writes cannot trigger agency-to-master updates
- a source/version marker suppresses mirrored events
- API upserts compare canonical values and skip unchanged writes

## Status

Where a manual reconciliation action is needed, report `新增`, `实际变更`, and `核对` separately. Do not count an unchanged rewrite as a change.
