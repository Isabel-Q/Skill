const MASTER_ID = __MASTER_ID__;
const SHEET_NAME = __SHEET_NAME__;
const CONTROL_SHEET = __CONTROL_SHEET__;
const AGENTS = __AGENTS__;

const MASTER_HEADERS = [
  '国家','达人名称','平台','账号链接','内容类型','粉丝量级','受众画像','KOL池',
  '推进合作','DM Comments','报价（USD）','粉丝数','近15条平均播放量','播放率',
  '互动量','互动率','竞品合作情况','达人简介及推荐理由','交付内容','提报日期',
  'Remark','代理','重复提报代理数','原始文件','原始行号','提报记录ID'
];
const CHILD_HEADERS = [
  '国家','达人名称','平台','账号链接','内容类型','粉丝量级','受众画像','推进合作',
  'DM Comments','报价（USD）','粉丝数','近15条平均播放量','播放率','互动量',
  '互动率','竞品合作情况','达人简介及推荐理由','交付内容','提报日期','Remark'
];
const AGENCY_FIELDS = [
  '国家','达人名称','平台','账号链接','内容类型','粉丝量级','受众画像','报价（USD）',
  '粉丝数','近15条平均播放量','播放率','互动量','互动率','竞品合作情况',
  '达人简介及推荐理由','交付内容','提报日期','Remark'
];
const TIERS = __TIERS__;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('KOL同步')
    .addItem('立即同步', 'runSync')
    .addToUi();
}

function runSync() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  let added = 0;
  let changed = 0;
  let checked = 0;
  try {
    const masterBook = SpreadsheetApp.openById(MASTER_ID);
    const masterSheet = masterBook.getSheetByName(SHEET_NAME);
    if (!masterSheet) throw new Error('找不到汇总名单工作表');

    // Validate every header before any roster is written. A moved column is safe;
    // a missing, renamed, or duplicated required header stops the whole sync.
    const masterSchema = readSchema_(masterSheet, MASTER_HEADERS, '内部汇总表');
    const agentSources = AGENTS.map(function(agent) {
      const book = SpreadsheetApp.openById(agent.id);
      const sheet = book.getSheetByName(SHEET_NAME);
      if (!sheet) throw new Error(agent.name + ' 表中找不到“' + SHEET_NAME + '”');
      return {
        agent:agent,
        sheet:sheet,
        schema:readSchema_(sheet, CHILD_HEADERS, agent.name + ' 代理表')
      };
    });

    const masterLast = Math.max(masterSheet.getLastRow(), 1);
    let masterRows = masterLast > 1
      ? masterSheet.getRange(2, 1, masterLast - 1, masterSchema.width).getValues()
      : [];
    masterRows = masterRows.filter(function(row) {
      return hasMasterRecord_(row, masterSchema);
    });

    const childState = [];
    agentSources.forEach(function(source) {
      const agent = source.agent;
      const sheet = source.sheet;
      const schema = source.schema;
      const last = Math.max(sheet.getLastRow(), 1);
      const rows = last > 1
        ? sheet.getRange(2, 1, last - 1, schema.width).getValues()
        : [];
      const displayRows = last > 1
        ? sheet.getRange(2, 1, last - 1, schema.width).getDisplayValues()
        : [];
      const matcher = buildMatcher_(masterRows, masterSchema, agent.name);
      const ids = [];

      rows.forEach(function(row, offset) {
        if (!hasChildInput_(row, schema)) {
          ids[offset] = '';
          return;
        }
        checked++;

        let pos = claimMatch_(matcher, row, schema, masterSchema, offset + 2);
        if (pos === undefined) {
          const next = new Array(masterSchema.width).fill('');
          copyFields_(row, schema, next, masterSchema, AGENCY_FIELDS, displayRows[offset]);
          setField_(next, masterSchema, 'KOL池', '');
          setField_(next, masterSchema, '推进合作', '');
          setField_(next, masterSchema, 'DM Comments', '');
          setField_(next, masterSchema, '代理', agent.name);
          setField_(next, masterSchema, '重复提报代理数', 1);
          setField_(next, masterSchema, '原始文件', agent.name);
          setField_(next, masterSchema, '原始行号', offset + 2);
          setField_(next, masterSchema, '提报记录ID', agent.name + '-' + Utilities.getUuid());
          setField_(next, masterSchema, '粉丝量级', tier_(getField_(next, masterSchema, '粉丝数')));
          masterRows.push(next);
          pos = masterRows.length - 1;
          registerClaim_(matcher, next, masterSchema, pos);
          added++;
        } else {
          const target = masterRows[pos];
          const before = target.slice();
          copyFields_(row, schema, target, masterSchema, AGENCY_FIELDS, displayRows[offset]);
          setField_(target, masterSchema, '粉丝量级', tier_(getField_(target, masterSchema, '粉丝数')));
          setField_(target, masterSchema, '代理', agent.name);
          setField_(target, masterSchema, '原始文件', agent.name);
          setField_(target, masterSchema, '原始行号', offset + 2);
          if (!clean_(getField_(target, masterSchema, '提报记录ID'))) {
            setField_(target, masterSchema, '提报记录ID', agent.name + '-' + Utilities.getUuid());
          }
          if (fieldsChanged_(before, target, masterSchema, AGENCY_FIELDS)) changed++;
        }
        ids[offset] = getField_(masterRows[pos], masterSchema, '提报记录ID');
      });
      childState.push({sheet:sheet, schema:schema, rows:rows, ids:ids});
    });

    updateDuplicateCounts_(masterRows, masterSchema);
    masterRows.sort(function(a, b) { return compareRows_(a, b, masterSchema); });

    const required = masterRows.length + 1;
    if (masterSheet.getMaxRows() < required) {
      masterSheet.insertRowsAfter(masterSheet.getMaxRows(), required - masterSheet.getMaxRows());
    }
    if (masterRows.length) {
      masterSheet.getRange(2, 1, masterRows.length, masterSchema.width).setValues(masterRows);
    }
    if (masterLast - 1 > masterRows.length) {
      masterSheet.getRange(
        masterRows.length + 2,
        1,
        masterLast - 1 - masterRows.length,
        masterSchema.width
      ).clearContent();
    }

    const masterById = indexById_(masterRows, masterSchema);
    childState.forEach(function(state) {
      if (!state.rows.length) return;
      const cooperation = [];
      const comments = [];
      state.ids.forEach(function(id) {
        if (!id || masterById[id] === undefined) {
          cooperation.push(['']);
          comments.push(['']);
          return;
        }
        const masterRow = masterRows[masterById[id]];
        cooperation.push([getField_(masterRow, masterSchema, '推进合作')]);
        comments.push([getField_(masterRow, masterSchema, 'DM Comments')]);
      });
      state.sheet.getRange(
        2,
        state.schema.index['推进合作'] + 1,
        cooperation.length,
        1
      ).setValues(cooperation);
      state.sheet.getRange(
        2,
        state.schema.index['DM Comments'] + 1,
        comments.length,
        1
      ).setValues(comments);
    });

    const summary = '新增 ' + added + ' 条；实际变更 ' + changed + ' 条；核对 ' + checked + ' 条';
    writeStatus_(masterBook, new Date(), '成功', summary);
    SpreadsheetApp.getActive().toast(
      '同步完成：' + summary,
      'KOL名单同步',
      8
    );
  } catch (err) {
    try {
      writeStatus_(SpreadsheetApp.openById(MASTER_ID), new Date(), '失败', String(err.message || err));
    } catch (ignored) {}
    SpreadsheetApp.getActive().toast(String(err.message || err), '同步失败', 10);
    throw err;
  } finally {
    lock.releaseLock();
  }
}

function readSchema_(sheet, requiredHeaders, label) {
  const width = Math.max(sheet.getLastColumn(), 1);
  const raw = sheet.getRange(1, 1, 1, width).getDisplayValues()[0];
  const normalizedToIndex = {};
  const duplicateHeaders = [];
  raw.forEach(function(header, index) {
    const key = normalizeHeader_(header);
    if (!key) return;
    if (normalizedToIndex[key] !== undefined) duplicateHeaders.push(clean_(header));
    else normalizedToIndex[key] = index;
  });
  if (duplicateHeaders.length) {
    throw new Error(label + '存在重复表头：' + unique_(duplicateHeaders).join('、'));
  }

  const index = {};
  const missing = [];
  requiredHeaders.forEach(function(header) {
    const pos = normalizedToIndex[normalizeHeader_(header)];
    if (pos === undefined) missing.push(header);
    else index[header] = pos;
  });
  if (missing.length) {
    throw new Error(label + '缺少或改名了必需表头：' + missing.join('、') + '。未写入任何名单数据。');
  }
  return {width:width, index:index};
}

function normalizeHeader_(value) {
  return clean_(value).replace(/\s+/g, ' ').toLowerCase();
}

function unique_(values) {
  return values.filter(function(value, index) { return values.indexOf(value) === index; });
}

function getField_(row, schema, field) {
  return row[schema.index[field]];
}

function setField_(row, schema, field, value) {
  row[schema.index[field]] = value;
}

function copyFields_(source, sourceSchema, target, targetSchema, fields, sourceDisplay) {
  fields.forEach(function(field) {
    let value = getField_(source, sourceSchema, field);
    if (field === '提报日期' && sourceDisplay) {
      value = dateSerialFromDisplay_(sourceDisplay[sourceSchema.index[field]]);
    }
    setField_(target, targetSchema, field, value);
  });
}

function dateSerialFromDisplay_(displayValue) {
  const text = clean_(displayValue);
  if (!text) return '';
  const match = text.match(/^(\d{1,4})[\/-](\d{1,2})[\/-](\d{1,4})$/);
  if (!match) return text;
  let year;
  let month;
  let day;
  if (match[1].length === 4) {
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    month = Number(match[1]);
    day = Number(match[2]);
    year = Number(match[3]);
  }
  if (year < 100) year += 2000;
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error('无法识别提报日期：' + text);
  }
  return (utc - Date.UTC(1899, 11, 30)) / 86400000;
}

function hasMasterRecord_(row, schema) {
  return clean_(getField_(row, schema, '提报记录ID')) || AGENCY_FIELDS.some(function(field) {
    return clean_(getField_(row, schema, field)) !== '';
  });
}

function hasChildInput_(row, schema) {
  return AGENCY_FIELDS.some(function(field) {
    return clean_(getField_(row, schema, field)) !== '';
  });
}

function buildMatcher_(rows, schema, agentName) {
  const matcher = {byFingerprint:{}, byRowUrl:{}, byRowName:{}, byUrl:{}, byName:{}, used:{}};
  rows.forEach(function(row, pos) {
    if (clean_(getField_(row, schema, '代理')) !== agentName) return;
    const sourceRow = clean_(getField_(row, schema, '原始行号'));
    addToMap_(matcher.byFingerprint, fingerprint_(row, schema), pos);
    if (sourceRow) {
      addToMap_(matcher.byRowUrl, sourceRow + '|' + urlKey_(row, schema), pos);
      addToMap_(matcher.byRowName, sourceRow + '|' + nameKey_(row, schema), pos);
    }
    addToMap_(matcher.byUrl, urlKey_(row, schema), pos);
    addToMap_(matcher.byName, nameKey_(row, schema), pos);
  });
  return matcher;
}

function registerClaim_(matcher, masterRow, masterSchema, pos) {
  matcher.used[pos] = true;
  const sourceRow = clean_(getField_(masterRow, masterSchema, '原始行号'));
  addToMap_(matcher.byFingerprint, fingerprint_(masterRow, masterSchema), pos);
  if (sourceRow) {
    addToMap_(matcher.byRowUrl, sourceRow + '|' + urlKey_(masterRow, masterSchema), pos);
    addToMap_(matcher.byRowName, sourceRow + '|' + nameKey_(masterRow, masterSchema), pos);
  }
  addToMap_(matcher.byUrl, urlKey_(masterRow, masterSchema), pos);
  addToMap_(matcher.byName, nameKey_(masterRow, masterSchema), pos);
}

function addToMap_(map, key, pos) {
  if (!key) return;
  if (!map[key]) map[key] = [];
  map[key].push(pos);
}

function claimMatch_(matcher, childRow, childSchema, masterSchema, sourceRow) {
  const masterShape = new Array(masterSchema.width).fill('');
  copyFields_(childRow, childSchema, masterShape, masterSchema, AGENCY_FIELDS);
  const exactMatch = takeUnused_(matcher.byFingerprint[fingerprint_(masterShape, masterSchema)], matcher.used);
  if (exactMatch !== undefined) return exactMatch;
  const rowUrlMatch = takeUnused_(matcher.byRowUrl[sourceRow + '|' + urlKey_(masterShape, masterSchema)], matcher.used);
  if (rowUrlMatch !== undefined) return rowUrlMatch;
  const rowNameMatch = takeUnused_(matcher.byRowName[sourceRow + '|' + nameKey_(masterShape, masterSchema)], matcher.used);
  if (rowNameMatch !== undefined) return rowNameMatch;
  const urlMatch = takeUnused_(matcher.byUrl[urlKey_(masterShape, masterSchema)], matcher.used);
  if (urlMatch !== undefined) return urlMatch;
  return takeUnused_(matcher.byName[nameKey_(masterShape, masterSchema)], matcher.used);
}

function fingerprint_(row, schema) {
  return AGENCY_FIELDS.map(function(field) {
    return comparableFieldValue_(getField_(row, schema, field), field);
  }).join('\u001f');
}

function takeUnused_(positions, used) {
  if (!positions) return undefined;
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    if (!used[pos]) {
      used[pos] = true;
      return pos;
    }
  }
  return undefined;
}

function indexById_(rows, schema) {
  const result = {};
  rows.forEach(function(row, i) {
    const id = clean_(getField_(row, schema, '提报记录ID'));
    if (id) result[id] = i;
  });
  return result;
}

function tier_(followers) {
  const n = Number(String(followers == null ? '' : followers).replace(/,/g, ''));
  if (!isFinite(n) || n < 0) return '';
  for (let i = 0; i < TIERS.length; i++) {
    if (TIERS[i].lt == null || n < TIERS[i].lt) return TIERS[i].label;
  }
  return '';
}

function updateDuplicateCounts_(rows, schema) {
  const map = {};
  rows.forEach(function(row) {
    const key = identityKey_(row, schema);
    if (!map[key]) map[key] = {};
    map[key][clean_(getField_(row, schema, '代理'))] = true;
  });
  rows.forEach(function(row) {
    const count = Object.keys(map[identityKey_(row, schema)] || {}).filter(Boolean).length || 1;
    setField_(row, schema, '重复提报代理数', count);
  });
}

function urlKey_(row, schema) {
  const url = clean_(getField_(row, schema, '账号链接')).toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[?#].*$/, '')
    .replace(/\/$/, '');
  return url ? clean_(getField_(row, schema, '平台')).toLowerCase() + '|' + url : '';
}

function nameKey_(row, schema) {
  const name = clean_(getField_(row, schema, '达人名称')).toLowerCase();
  if (!name) return '';
  return clean_(getField_(row, schema, '国家')).toLowerCase() + '|' +
    clean_(getField_(row, schema, '平台')).toLowerCase() + '|' + name;
}

function identityKey_(row, schema) {
  return urlKey_(row, schema) || nameKey_(row, schema);
}

function compareRows_(a, b, schema) {
  const ka = [
    clean_(getField_(a, schema, '国家')),
    clean_(getField_(a, schema, '达人名称')).toLowerCase(),
    clean_(getField_(a, schema, '平台')),
    clean_(getField_(a, schema, '代理'))
  ].join('|');
  const kb = [
    clean_(getField_(b, schema, '国家')),
    clean_(getField_(b, schema, '达人名称')).toLowerCase(),
    clean_(getField_(b, schema, '平台')),
    clean_(getField_(b, schema, '代理'))
  ].join('|');
  return ka.localeCompare(kb, 'zh-Hans');
}

function clean_(value) {
  return value == null ? '' : String(value).trim();
}

function fieldsChanged_(before, after, schema, fields) {
  return fields.some(function(field) {
    return comparableFieldValue_(getField_(before, schema, field), field) !==
      comparableFieldValue_(getField_(after, schema, field), field);
  });
}

function comparableFieldValue_(value, field) {
  if (value == null || value === '') return '';
  if (field === '提报日期') {
    if (Object.prototype.toString.call(value) === '[object Date]') {
      return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    if (typeof value === 'number' && isFinite(value)) {
      return Utilities.formatDate(
        new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86400000),
        'UTC',
        'yyyy-MM-dd'
      );
    }
  }
  return clean_(value);
}

function writeStatus_(book, time, status, details) {
  const sheet = book.getSheetByName(CONTROL_SHEET);
  if (!sheet) return;
  sheet.getRange('B3:B5').setValues([[time], [status], [details]]);
  sheet.getRange('B3').setNumberFormat('yyyy-mm-dd hh:mm:ss');
}
