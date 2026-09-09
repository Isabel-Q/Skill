const MASTER_ID = __MASTER_ID__;
const SHEET_NAME = __SHEET_NAME__;
const CONTROL_SHEET = __CONTROL_SHEET__;
const MASTER_COLS = 26;
const CHILD_COLS = 20;
const AGENTS = __AGENTS__;
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
  let updated = 0;
  try {
    const masterBook = SpreadsheetApp.openById(MASTER_ID);
    const masterSheet = masterBook.getSheetByName(SHEET_NAME);
    if (!masterSheet) throw new Error('找不到汇总名单工作表');

    const masterLast = Math.max(masterSheet.getLastRow(), 1);
    let masterRows = masterLast > 1
      ? masterSheet.getRange(2, 1, masterLast - 1, MASTER_COLS).getValues()
      : [];
    masterRows = masterRows.filter(hasMasterRecord_);

    const childState = [];
    AGENTS.forEach(function(agent) {
      const book = SpreadsheetApp.openById(agent.id);
      const sheet = book.getSheetByName(SHEET_NAME);
      if (!sheet) throw new Error(agent.name + ' 表中找不到“' + SHEET_NAME + '”');

      const last = Math.max(sheet.getLastRow(), 1);
      const rows = last > 1 ? sheet.getRange(2, 1, last - 1, CHILD_COLS).getValues() : [];
      const matcher = buildMatcher_(masterRows, agent.name);
      const ids = [];

      rows.forEach(function(row, offset) {
        if (!hasChildInput_(row)) {
          ids[offset] = '';
          return;
        }

        let pos = claimMatch_(matcher, row);
        if (pos === undefined) {
          const next = new Array(MASTER_COLS).fill('');
          copyChildToMaster_(row, next);
          next[7] = '';
          next[8] = '';
          next[9] = '';
          next[21] = agent.name;
          next[22] = 1;
          next[23] = agent.name;
          next[24] = offset + 2;
          next[25] = agent.name + '-' + Utilities.getUuid();
          next[5] = tier_(next[11]);
          masterRows.push(next);
          pos = masterRows.length - 1;
          registerClaim_(matcher, next, pos);
          added++;
        } else {
          const target = masterRows[pos];
          copyChildToMaster_(row, target);
          target[5] = tier_(target[11]);
          target[21] = agent.name;
          target[23] = agent.name;
          target[24] = offset + 2;
          if (!clean_(target[25])) target[25] = agent.name + '-' + Utilities.getUuid();
          updated++;
        }
        ids[offset] = masterRows[pos][25];
      });
      childState.push({sheet:sheet, rows:rows, ids:ids});
    });

    updateDuplicateCounts_(masterRows);
    masterRows.sort(compareRows_);

    const required = masterRows.length + 1;
    if (masterSheet.getMaxRows() < required) {
      masterSheet.insertRowsAfter(masterSheet.getMaxRows(), required - masterSheet.getMaxRows());
    }
    if (masterRows.length) {
      masterSheet.getRange(2, 1, masterRows.length, MASTER_COLS).setValues(masterRows);
    }
    if (masterLast - 1 > masterRows.length) {
      masterSheet.getRange(masterRows.length + 2, 1, masterLast - 1 - masterRows.length, MASTER_COLS).clearContent();
    }

    const masterById = indexById_(masterRows);
    childState.forEach(function(state) {
      if (!state.rows.length) return;
      const internalValues = state.ids.map(function(id) {
        if (!id || masterById[id] === undefined) return ['', ''];
        const source = masterRows[masterById[id]];
        return [source[8], source[9]];
      });
      state.sheet.getRange(2, 8, internalValues.length, 2).setValues(internalValues);
    });

    writeStatus_(masterBook, new Date(), '成功', '新增 ' + added + ' 条；更新 ' + updated + ' 条');
    SpreadsheetApp.getActive().toast(
      '同步完成：新增 ' + added + ' 条，更新 ' + updated + ' 条',
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

function copyChildToMaster_(child, master) {
  for (let c = 0; c <= 6; c++) master[c] = child[c];
  for (let c = 9; c <= 19; c++) master[c + 1] = child[c];
}

function hasMasterRecord_(row) {
  return clean_(row[25]) || [0,1,2,3,4,5,6,10,11,12,13,14,15,16,17,18,19,20]
    .some(function(c) { return clean_(row[c]) !== ''; });
}

function hasChildInput_(row) {
  return [0,1,2,3,4,5,6,9,10,11,12,13,14,15,16,17,18,19]
    .some(function(c) { return clean_(row[c]) !== ''; });
}

function buildMatcher_(rows, agentName) {
  const matcher = {byUrl:{}, byName:{}, used:{}};
  rows.forEach(function(row, pos) {
    if (clean_(row[21]) !== agentName) return;
    addToMap_(matcher.byUrl, urlKey_(row), pos);
    addToMap_(matcher.byName, nameKey_(row), pos);
  });
  return matcher;
}

function registerClaim_(matcher, masterRow, pos) {
  matcher.used[pos] = true;
  addToMap_(matcher.byUrl, urlKey_(masterRow), pos);
  addToMap_(matcher.byName, nameKey_(masterRow), pos);
}

function addToMap_(map, key, pos) {
  if (!key) return;
  if (!map[key]) map[key] = [];
  map[key].push(pos);
}

function claimMatch_(matcher, childRow) {
  const masterShape = childAsMaster_(childRow);
  const urlMatch = takeUnused_(matcher.byUrl[urlKey_(masterShape)], matcher.used);
  if (urlMatch !== undefined) return urlMatch;
  return takeUnused_(matcher.byName[nameKey_(masterShape)], matcher.used);
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

function childAsMaster_(child) {
  const row = new Array(MASTER_COLS).fill('');
  copyChildToMaster_(child, row);
  return row;
}

function indexById_(rows) {
  const result = {};
  rows.forEach(function(row, i) {
    const id = clean_(row[25]);
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

function updateDuplicateCounts_(rows) {
  const map = {};
  rows.forEach(function(row) {
    const key = identityKey_(row);
    if (!map[key]) map[key] = {};
    map[key][clean_(row[21])] = true;
  });
  rows.forEach(function(row) {
    row[22] = Object.keys(map[identityKey_(row)] || {}).filter(Boolean).length || 1;
  });
}

function urlKey_(row) {
  const url = clean_(row[3]).toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[?#].*$/, '')
    .replace(/\/$/, '');
  return url ? clean_(row[2]).toLowerCase() + '|' + url : '';
}

function nameKey_(row) {
  const name = clean_(row[1]).toLowerCase();
  if (!name) return '';
  return clean_(row[0]).toLowerCase() + '|' + clean_(row[2]).toLowerCase() + '|' + name;
}

function identityKey_(row) {
  return urlKey_(row) || nameKey_(row);
}

function compareRows_(a, b) {
  const ka = [clean_(a[0]), clean_(a[1]).toLowerCase(), clean_(a[2]), clean_(a[21])].join('|');
  const kb = [clean_(b[0]), clean_(b[1]).toLowerCase(), clean_(b[2]), clean_(b[21])].join('|');
  return ka.localeCompare(kb, 'zh-Hans');
}

function clean_(value) {
  return value == null ? '' : String(value).trim();
}

function writeStatus_(book, time, status, details) {
  const sheet = book.getSheetByName(CONTROL_SHEET);
  if (!sheet) return;
  sheet.getRange('B3:B5').setValues([[time], [status], [details]]);
  sheet.getRange('B3').setNumberFormat('yyyy-mm-dd hh:mm:ss');
}
