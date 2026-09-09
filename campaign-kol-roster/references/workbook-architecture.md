# Workbook architecture

## Internal master roster: A:Z

| Col | Field | Direction |
|---|---|---|
| A | 国家 | agency → master |
| B | 达人名称 | agency → master |
| C | 平台 | agency → master |
| D | 账号链接 | agency → master |
| E | 内容类型 | agency → master |
| F | 粉丝量级 | recalculated during sync from L |
| G | 受众画像 | agency → master |
| H | KOL池 | master only |
| I | 推进合作 | master → agency |
| J | DM Comments | master → agency |
| K | 报价（USD） | agency → master |
| L | 粉丝数 | agency → master |
| M | 近15条平均播放量 | agency → master |
| N | 播放率 | agency → master |
| O | 互动量 | agency → master |
| P | 互动率 | agency → master |
| Q | 竞品合作情况 | agency → master |
| R | 达人简介及推荐理由 | agency → master |
| S | 交付内容 | agency → master |
| T | 提报日期 | agency → master |
| U | Remark | agency → master |
| V | 代理 | master only |
| W | 重复提报代理数 | master only |
| X | 原始文件 | master only |
| Y | 原始行号 | master only |
| Z | 提报记录ID | master only |

## Agency-facing roster: A:T

The agency schema is the master schema with master H and V:Z removed. After the removal, columns shift:

`国家｜达人名称｜平台｜账号链接｜内容类型｜粉丝量级｜受众画像｜推进合作｜DM Comments｜报价（USD）｜粉丝数｜近15条平均播放量｜播放率｜互动量｜互动率｜竞品合作情况｜达人简介及推荐理由｜交付内容｜提报日期｜Remark`

Therefore agency H/I map to master I/J, and agency J:T map to master K:U.

## Native structures

- Keep the roster as a native Google Sheets table covering the full entry area.
- Apply strict dropdowns to country, platform, follower tier, and yes/no fields.
- Preserve date, number, and percentage types.
- Apply the light-green conditional-format rule across the roster body using the correct local column: master `$I2="是"`; agency `$H2="是"`.
- Protect or clearly label master-to-agency fields if the campaign's sharing model supports it.

## Reference tabs

The master `标准说明` documents the complete internal schema and sync rules. Agency copies must be rewritten for the A:T schema and must not contain:

- names or links for other agencies
- original-source inventories
- KOL池, duplicate counts, source row/file, or internal record IDs
- internal-only workflow notes

The country ecology reference interprets the shared tier labels by market; it does not create different dropdown values for each country.
