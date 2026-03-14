// STATE
const userResults = {};
let mcResult = null;
let mcWorker = null;
let debounceTimer = null;

const COMP_LABELS = { CL: 'Champions League', EL: 'Europa League', ECL: 'Conference League' };
const COMP_SHORT = { CL: 'CL', EL: 'EL', ECL: 'ECL' };
const COUNTRY_CLR = { England:'#e74c3c', Spain:'#f39c12', Germany:'#2ecc71', Italy:'#3498db', France:'#9b59b6' };

// BUILD DASHBOARD
function buildDashboard() {
  const dash = document.getElementById('dashboard');
  TRACKED.forEach(c => {
    const clr = COUNTRY_CLR[c];
    dash.innerHTML += `
      <div class="kpi-card" id="kpi-${c}">
        <div class="accent-bar" style="background:${clr}"></div>
        <div class="country-header">
          <img src="${getFlag(c)}" alt="${c}">
          <span>${c}</span>
        </div>
        <div class="coeff-val" id="coeff-${c}">Coeff: \u2014</div>
        <div class="prob-val" style="color:${clr}" id="prob-${c}">\u2014</div>
        <div class="prob-label">Top-2 probability</div>
        <div class="prob-bar"><div class="prob-bar-fill" id="bar-${c}" style="background:${clr};width:0%"></div></div>
      </div>`;
  });
}

function updateDashboard(res) {
  TRACKED.forEach(c => {
    document.getElementById('coeff-' + c).textContent = 'Coeff: ' + res.mean[c].toFixed(3);
    document.getElementById('prob-' + c).textContent = res.top2[c].toFixed(1) + '%';
    document.getElementById('bar-' + c).style.width = res.top2[c] + '%';
  });
  document.getElementById('eng-top2').textContent = res.england.staysTop2.toFixed(2) + '%';
  var risk = res.england.dropsOut;
  document.getElementById('eng-sub').textContent =
    risk < 1 ? 'Very safe \u2014 risk of dropping: ' + risk.toFixed(2) + '%' :
    risk < 10 ? 'Moderate risk of dropping: ' + risk.toFixed(2) + '%' :
    'High risk! Chance of dropping: ' + risk.toFixed(2) + '%';
}

// BUILD BRACKET
function clubHTML(name, country, side) {
  if (!name) {
    return '<div class="tbd-placeholder">TBD</div>';
  }
  var meta = CLUB_META[name] || {};
  var clr = meta.color || '#555';
  var short = (meta.short || name.substring(0,3)).charAt(0);
  return '<div class="club-row" data-side="' + side + '">' +
    '<img class="club-badge" src="' + getBadge(name) + '" alt="' + name + '"' +
    ' onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\'">' +
    '<div class="badge-fallback" style="background:' + clr + '">' + short + '</div>' +
    '<img class="club-flag" src="' + getFlag(country) + '" alt="' + country + '">' +
    '<span class="club-name">' + name + '</span>' +
    '<span class="winner-icon">\u2713</span></div>';
}

function buildR16(comp) {
  var ties = R16_TIES[comp];
  var html = '<div class="round-section"><div class="round-title">Round of 16</div><div class="ties-grid">';
  ties.forEach(function(tie, i) {
    html += '<div class="tie-card" id="card-' + tie.id + '">' +
      '<div class="tie-header">' +
      '<span class="tie-label">' + COMP_SHORT[comp] + ' R16 #' + (i+1) + '</span>' +
      '<span class="tie-agg" id="agg-' + tie.id + '"></span></div>' +
      '<div id="rows-' + tie.id + '">' +
      '<div class="club-row" data-side="home" id="row-' + tie.id + '-home">' +
      '<img class="club-badge" src="' + getBadge(tie.home) + '" alt="' + tie.home + '"' +
      ' onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\'">' +
      '<div class="badge-fallback" style="background:' + ((CLUB_META[tie.home]||{}).color||'#555') + '">' + ((CLUB_META[tie.home]||{short:'?'}).short.charAt(0)) + '</div>' +
      '<img class="club-flag" src="' + getFlag(tie.hc) + '" alt="' + tie.hc + '">' +
      '<span class="club-name">' + tie.home + '</span>' +
      '<span class="winner-icon">\u2713</span>' +
      '<div class="scores-area">' +
      '<span class="score-fixed">' + tie.fl_hg + '</span>' +
      '<span class="score-sep">|</span>' +
      '<input class="score-input" type="number" min="0" max="20" data-tie="' + tie.id + '" data-field="sl_ag" placeholder="\u2013" title="Away goals (2nd leg)">' +
      '</div></div>' +
      '<div class="club-row" data-side="away" id="row-' + tie.id + '-away">' +
      '<img class="club-badge" src="' + getBadge(tie.away) + '" alt="' + tie.away + '"' +
      ' onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\'">' +
      '<div class="badge-fallback" style="background:' + ((CLUB_META[tie.away]||{}).color||'#555') + '">' + ((CLUB_META[tie.away]||{short:'?'}).short.charAt(0)) + '</div>' +
      '<img class="club-flag" src="' + getFlag(tie.ac) + '" alt="' + tie.ac + '">' +
      '<span class="club-name">' + tie.away + '</span>' +
      '<span class="winner-icon">\u2713</span>' +
      '<div class="scores-area">' +
      '<span class="score-fixed">' + tie.fl_ag + '</span>' +
      '<span class="score-sep">|</span>' +
      '<input class="score-input" type="number" min="0" max="20" data-tie="' + tie.id + '" data-field="sl_hg" placeholder="\u2013" title="Home goals (2nd leg)">' +
      '</div></div></div>' +
      '<div class="pen-area" id="pen-' + tie.id + '" style="display:none">' +
      '<button class="pen-btn" data-tie="' + tie.id + '" data-pick="home" onclick="pickPenalty(this)">\uD83C\uDFC6 ' + tie.home + ' wins pens</button>' +
      '<button class="pen-btn" data-tie="' + tie.id + '" data-pick="away" onclick="pickPenalty(this)">\uD83C\uDFC6 ' + tie.away + ' wins pens</button>' +
      '</div></div>';
  });
  html += '</div></div>';
  return html;
}

function buildTwoLegRound(comp, round, count, label) {
  var html = '<div class="round-section"><div class="round-title">' + label + '</div><div class="ties-grid">';
  for (var i = 0; i < count; i++) {
    var id = comp + '-' + round + '-' + i;
    html += '<div class="tie-card" id="card-' + id + '">' +
      '<div class="tie-header">' +
      '<span class="tie-label">' + COMP_SHORT[comp] + ' ' + round + ' #' + (i+1) + '</span>' +
      '<span class="tie-agg" id="agg-' + id + '"></span></div>' +
      '<div id="rows-' + id + '">' +
      '<div class="tbd-placeholder" id="tbd1-' + id + '">Waiting for results\u2026</div>' +
      '<div class="tbd-placeholder" id="tbd2-' + id + '" style="display:none"></div></div>' +
      '<div id="inputs-' + id + '" style="display:none">' +
      '<div class="club-row" data-side="club1" id="row-' + id + '-club1"></div>' +
      '<div class="club-row" data-side="club2" id="row-' + id + '-club2"></div></div>' +
      '<div class="pen-area" id="pen-' + id + '" style="display:none">' +
      '<button class="pen-btn" data-tie="' + id + '" data-pick="club1" onclick="pickPenalty(this)">\uD83C\uDFC6 TBD wins pens</button>' +
      '<button class="pen-btn" data-tie="' + id + '" data-pick="club2" onclick="pickPenalty(this)">\uD83C\uDFC6 TBD wins pens</button>' +
      '</div></div>';
  }
  html += '</div></div>';
  return html;
}

function buildFinalRound(comp) {
  var id = comp + '-F';
  return '<div class="round-section"><div class="round-title">Final</div><div class="ties-grid">' +
    '<div class="tie-card" id="card-' + id + '">' +
    '<div class="tie-header">' +
    '<span class="tie-label">' + COMP_SHORT[comp] + ' Final</span>' +
    '<span class="tie-agg" id="agg-' + id + '"></span></div>' +
    '<div id="rows-' + id + '">' +
    '<div class="tbd-placeholder" id="tbd1-' + id + '">Waiting for semi-final results\u2026</div></div>' +
    '<div id="inputs-' + id + '" style="display:none">' +
    '<div class="club-row" data-side="club1" id="row-' + id + '-club1"></div>' +
    '<div class="club-row" data-side="club2" id="row-' + id + '-club2"></div></div>' +
    '<div class="pen-area" id="pen-' + id + '" style="display:none">' +
    '<button class="pen-btn" data-tie="' + id + '" data-pick="club1" onclick="pickPenalty(this)">\uD83C\uDFC6 TBD wins pens</button>' +
    '<button class="pen-btn" data-tie="' + id + '" data-pick="club2" onclick="pickPenalty(this)">\uD83C\uDFC6 TBD wins pens</button>' +
    '</div></div></div></div>';
}

function buildAllBrackets() {
  ['CL','EL','ECL'].forEach(function(comp) {
    var el = document.getElementById('bracket-' + comp);
    el.innerHTML = buildR16(comp) +
      buildTwoLegRound(comp, 'QF', 4, 'Quarter-Finals') +
      buildTwoLegRound(comp, 'SF', 2, 'Semi-Finals') +
      buildFinalRound(comp);
  });
}

// BRACKET STATE TRACKING
var bracketState = {};

function getR16Winner(comp, idx) {
  var tie = R16_TIES[comp][idx];
  var ur = userResults[tie.id];
  if (!ur || ur.sl_hg === undefined || ur.sl_ag === undefined) return null;
  var homeAgg = tie.fl_hg + ur.sl_ag;
  var awayAgg = tie.fl_ag + ur.sl_hg;
  if (homeAgg > awayAgg) return { club: tie.home, country: tie.hc };
  if (awayAgg > homeAgg) return { club: tie.away, country: tie.ac };
  if (ur.penWinner === 'home') return { club: tie.home, country: tie.hc };
  if (ur.penWinner === 'away') return { club: tie.away, country: tie.ac };
  return null;
}

function getQFParticipants(comp, qfIdx) {
  var pair = QF_BRACKET[qfIdx];
  return { club1: getR16Winner(comp, pair[0]), club2: getR16Winner(comp, pair[1]) };
}

function getTwoLegWinner(id, c1, c2) {
  var ur = userResults[id];
  if (!ur || ur.fl_hg === undefined || ur.fl_ag === undefined ||
      ur.sl_hg === undefined || ur.sl_ag === undefined) return null;
  var c1Agg = ur.fl_hg + ur.sl_ag;
  var c2Agg = ur.fl_ag + ur.sl_hg;
  if (c1Agg > c2Agg) return c1;
  if (c2Agg > c1Agg) return c2;
  if (ur.penWinner === 'club1') return c1;
  if (ur.penWinner === 'club2') return c2;
  return null;
}

function getFinalWinner(id, c1, c2) {
  var ur = userResults[id];
  if (!ur || ur.g1 === undefined || ur.g2 === undefined) return null;
  if (ur.g1 > ur.g2) return c1;
  if (ur.g2 > ur.g1) return c2;
  if (ur.penWinner === 'club1') return c1;
  if (ur.penWinner === 'club2') return c2;
  return null;
}

// POPULATE LATER ROUNDS
function makeClubRow(club, side, tieId, isLeg1, isLeg2, isFinal) {
  var meta = CLUB_META[club.club] || {};
  var clr = meta.color || '#555';
  var short = (meta.short || club.club.substring(0,3)).charAt(0);
  var scoresHTML = '';
  if (isFinal) {
    var gField = side === 'club1' ? 'g1' : 'g2';
    scoresHTML = '<div class="scores-area">' +
      '<input class="score-input" type="number" min="0" max="20" data-tie="' + tieId + '" data-field="' + gField + '" placeholder="\u2013">' +
      '</div>';
  } else {
    var f1field = side === 'club1' ? 'fl_hg' : 'fl_ag';
    var f2field = side === 'club1' ? 'sl_ag' : 'sl_hg';
    scoresHTML = '<div class="scores-area">' +
      '<input class="score-input" type="number" min="0" max="20" data-tie="' + tieId + '" data-field="' + f1field + '" placeholder="L1" title="Leg 1">' +
      '<span class="score-sep">|</span>' +
      '<input class="score-input" type="number" min="0" max="20" data-tie="' + tieId + '" data-field="' + f2field + '" placeholder="L2" title="Leg 2">' +
      '</div>';
  }
  return '<img class="club-badge" src="' + getBadge(club.club) + '" alt="' + club.club + '"' +
    ' onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\'">' +
    '<div class="badge-fallback" style="background:' + clr + '">' + short + '</div>' +
    '<img class="club-flag" src="' + getFlag(club.country) + '" alt="' + club.country + '">' +
    '<span class="club-name">' + club.club + '</span>' +
    '<span class="winner-icon">\u2713</span>' +
    scoresHTML;
}

function populateQF(comp) {
  for (var qi = 0; qi < 4; qi++) {
    var id = comp + '-QF-' + qi;
    var parts = getQFParticipants(comp, qi);
    var club1 = parts.club1, club2 = parts.club2;
    var inputsEl = document.getElementById('inputs-' + id);
    var tbd1 = document.getElementById('tbd1-' + id);
    if (club1 && club2) {
      tbd1.style.display = 'none';
      inputsEl.style.display = 'block';
      var r1 = document.getElementById('row-' + id + '-club1');
      var r2 = document.getElementById('row-' + id + '-club2');
      r1.innerHTML = makeClubRow(club1, 'club1', id, true, true, false);
      r2.innerHTML = makeClubRow(club2, 'club2', id, true, true, false);
      restoreInputs(id);
      var penArea = document.getElementById('pen-' + id);
      penArea.querySelectorAll('.pen-btn')[0].textContent = '\uD83C\uDFC6 ' + club1.club + ' wins pens';
      penArea.querySelectorAll('.pen-btn')[1].textContent = '\uD83C\uDFC6 ' + club2.club + ' wins pens';
      inputsEl.querySelectorAll('.score-input').forEach(function(inp) {
        inp.removeEventListener('input', onScoreInput);
        inp.addEventListener('input', onScoreInput);
      });
      bracketState[id] = { club1: club1, club2: club2 };
    } else {
      tbd1.style.display = 'flex';
      tbd1.textContent = (club1 ? club1.club : 'TBD') + ' vs ' + (club2 ? club2.club : 'TBD');
      inputsEl.style.display = 'none';
    }
  }
}

function populateSF(comp) {
  for (var si = 0; si < 2; si++) {
    var id = comp + '-SF-' + si;
    var pair = SF_BRACKET[si];
    var qfA = bracketState[comp + '-QF-' + pair[0]];
    var qfB = bracketState[comp + '-QF-' + pair[1]];
    var c1 = qfA ? getTwoLegWinner(comp + '-QF-' + pair[0], qfA.club1, qfA.club2) : null;
    var c2 = qfB ? getTwoLegWinner(comp + '-QF-' + pair[1], qfB.club1, qfB.club2) : null;
    var inputsEl = document.getElementById('inputs-' + id);
    var tbd1 = document.getElementById('tbd1-' + id);
    if (c1 && c2) {
      tbd1.style.display = 'none';
      inputsEl.style.display = 'block';
      var r1 = document.getElementById('row-' + id + '-club1');
      var r2 = document.getElementById('row-' + id + '-club2');
      r1.innerHTML = makeClubRow(c1, 'club1', id, true, true, false);
      r2.innerHTML = makeClubRow(c2, 'club2', id, true, true, false);
      restoreInputs(id);
      var penArea = document.getElementById('pen-' + id);
      penArea.querySelectorAll('.pen-btn')[0].textContent = '\uD83C\uDFC6 ' + c1.club + ' wins pens';
      penArea.querySelectorAll('.pen-btn')[1].textContent = '\uD83C\uDFC6 ' + c2.club + ' wins pens';
      inputsEl.querySelectorAll('.score-input').forEach(function(inp) {
        inp.removeEventListener('input', onScoreInput);
        inp.addEventListener('input', onScoreInput);
      });
      bracketState[id] = { club1: c1, club2: c2 };
    } else {
      tbd1.style.display = 'flex';
      tbd1.textContent = (c1 ? c1.club : 'TBD') + ' vs ' + (c2 ? c2.club : 'TBD');
      inputsEl.style.display = 'none';
    }
  }
}

function populateFinal(comp) {
  var id = comp + '-F';
  var sfA = bracketState[comp + '-SF-0'];
  var sfB = bracketState[comp + '-SF-1'];
  var c1 = sfA ? getTwoLegWinner(comp + '-SF-0', sfA.club1, sfA.club2) : null;
  var c2 = sfB ? getTwoLegWinner(comp + '-SF-1', sfB.club1, sfB.club2) : null;
  var inputsEl = document.getElementById('inputs-' + id);
  var tbd1 = document.getElementById('tbd1-' + id);
  if (c1 && c2) {
    tbd1.style.display = 'none';
    inputsEl.style.display = 'block';
    var r1 = document.getElementById('row-' + id + '-club1');
    var r2 = document.getElementById('row-' + id + '-club2');
    r1.innerHTML = makeClubRow(c1, 'club1', id, false, false, true);
    r2.innerHTML = makeClubRow(c2, 'club2', id, false, false, true);
    restoreInputs(id);
    var penArea = document.getElementById('pen-' + id);
    penArea.querySelectorAll('.pen-btn')[0].textContent = '\uD83C\uDFC6 ' + c1.club + ' wins pens';
    penArea.querySelectorAll('.pen-btn')[1].textContent = '\uD83C\uDFC6 ' + c2.club + ' wins pens';
    inputsEl.querySelectorAll('.score-input').forEach(function(inp) {
      inp.removeEventListener('input', onScoreInput);
      inp.addEventListener('input', onScoreInput);
    });
    bracketState[id] = { club1: c1, club2: c2 };
  } else {
    tbd1.style.display = 'flex';
    tbd1.textContent = (c1 ? c1.club : 'TBD') + ' vs ' + (c2 ? c2.club : 'TBD');
    inputsEl.style.display = 'none';
  }
}

function restoreInputs(tieId) {
  var ur = userResults[tieId];
  if (!ur) return;
  var card = document.getElementById('card-' + tieId);
  if (!card) return;
  card.querySelectorAll('.score-input').forEach(function(inp) {
    var field = inp.dataset.field;
    if (ur[field] !== undefined) inp.value = ur[field];
  });
}

// SCORE INPUT HANDLING
function onScoreInput(e) {
  var inp = e.target;
  var tieId = inp.dataset.tie;
  var field = inp.dataset.field;
  var val = inp.value === '' ? undefined : parseInt(inp.value, 10);
  if (!userResults[tieId]) userResults[tieId] = {};
  if (val === undefined || isNaN(val)) {
    delete userResults[tieId][field];
  } else {
    userResults[tieId][field] = val;
  }
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function() {
    processAllResults();
    triggerMC(50000);
  }, 300);
}

function processAllResults() {
  ['CL','EL','ECL'].forEach(function(comp) {
    R16_TIES[comp].forEach(function(tie) { highlightR16(tie); });
    populateQF(comp);
    for (var qi = 0; qi < 4; qi++) { highlightTwoLeg(comp + '-QF-' + qi); }
    populateSF(comp);
    for (var si = 0; si < 2; si++) { highlightTwoLeg(comp + '-SF-' + si); }
    populateFinal(comp);
    highlightFinal(comp + '-F');
  });
}