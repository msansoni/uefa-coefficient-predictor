// HIGHLIGHT AND SCORING LOGIC
function highlightR16(tie) {
  var ur = userResults[tie.id];
  var card = document.getElementById('card-' + tie.id);
  var rowH = document.getElementById('row-' + tie.id + '-home');
  var rowA = document.getElementById('row-' + tie.id + '-away');
  var aggEl = document.getElementById('agg-' + tie.id);
  var penEl = document.getElementById('pen-' + tie.id);
  rowH.classList.remove('winner', 'loser');
  rowA.classList.remove('winner', 'loser');
  card.classList.remove('decided');
  aggEl.textContent = '';
  penEl.style.display = 'none';
  if (!ur || ur.sl_hg === undefined || ur.sl_ag === undefined) return;
  var homeAgg = tie.fl_hg + ur.sl_ag;
  var awayAgg = tie.fl_ag + ur.sl_hg;
  aggEl.textContent = 'Agg: ' + homeAgg + ' - ' + awayAgg;
  if (homeAgg > awayAgg) {
    rowH.classList.add('winner'); rowA.classList.add('loser');
    card.classList.add('decided'); delete ur.penWinner;
  } else if (awayAgg > homeAgg) {
    rowA.classList.add('winner'); rowH.classList.add('loser');
    card.classList.add('decided'); delete ur.penWinner;
  } else {
    penEl.style.display = 'block';
    if (ur.penWinner === 'home') {
      rowH.classList.add('winner'); rowA.classList.add('loser'); card.classList.add('decided');
    } else if (ur.penWinner === 'away') {
      rowA.classList.add('winner'); rowH.classList.add('loser'); card.classList.add('decided');
    }
  }
}

function highlightTwoLeg(id) {
  var ur = userResults[id];
  var bs = bracketState[id];
  if (!bs || !ur) return;
  var card = document.getElementById('card-' + id);
  var r1 = document.getElementById('row-' + id + '-club1');
  var r2 = document.getElementById('row-' + id + '-club2');
  var aggEl = document.getElementById('agg-' + id);
  var penEl = document.getElementById('pen-' + id);
  if (!r1 || !r2) return;
  r1.classList.remove('winner', 'loser');
  r2.classList.remove('winner', 'loser');
  card.classList.remove('decided');
  aggEl.textContent = '';
  penEl.style.display = 'none';
  if (ur.fl_hg === undefined || ur.fl_ag === undefined ||
      ur.sl_hg === undefined || ur.sl_ag === undefined) return;
  var c1Agg = ur.fl_hg + ur.sl_ag;
  var c2Agg = ur.fl_ag + ur.sl_hg;
  aggEl.textContent = 'Agg: ' + c1Agg + ' - ' + c2Agg;
  if (c1Agg > c2Agg) {
    r1.classList.add('winner'); r2.classList.add('loser');
    card.classList.add('decided'); userResults[id].winner = 'club1'; delete ur.penWinner;
  } else if (c2Agg > c1Agg) {
    r2.classList.add('winner'); r1.classList.add('loser');
    card.classList.add('decided'); userResults[id].winner = 'club2'; delete ur.penWinner;
  } else {
    penEl.style.display = 'block'; delete userResults[id].winner;
    if (ur.penWinner === 'club1') {
      r1.classList.add('winner'); r2.classList.add('loser');
      card.classList.add('decided'); userResults[id].winner = 'club1';
    } else if (ur.penWinner === 'club2') {
      r2.classList.add('winner'); r1.classList.add('loser');
      card.classList.add('decided'); userResults[id].winner = 'club2';
    }
  }
}

function highlightFinal(id) {
  var ur = userResults[id];
  var bs = bracketState[id];
  if (!bs || !ur) return;
  var card = document.getElementById('card-' + id);
  var r1 = document.getElementById('row-' + id + '-club1');
  var r2 = document.getElementById('row-' + id + '-club2');
  var aggEl = document.getElementById('agg-' + id);
  var penEl = document.getElementById('pen-' + id);
  if (!r1 || !r2) return;
  r1.classList.remove('winner', 'loser');
  r2.classList.remove('winner', 'loser');
  card.classList.remove('decided');
  aggEl.textContent = '';
  penEl.style.display = 'none';
  if (ur.g1 === undefined || ur.g2 === undefined) return;
  aggEl.textContent = ur.g1 + ' - ' + ur.g2;
  if (ur.g1 > ur.g2) {
    r1.classList.add('winner'); r2.classList.add('loser');
    card.classList.add('decided'); userResults[id].winner = 'club1'; delete ur.penWinner;
  } else if (ur.g2 > ur.g1) {
    r2.classList.add('winner'); r1.classList.add('loser');
    card.classList.add('decided'); userResults[id].winner = 'club2'; delete ur.penWinner;
  } else {
    penEl.style.display = 'block'; delete userResults[id].winner;
    if (ur.penWinner === 'club1') {
      r1.classList.add('winner'); r2.classList.add('loser');
      card.classList.add('decided'); userResults[id].winner = 'club1';
    } else if (ur.penWinner === 'club2') {
      r2.classList.add('winner'); r1.classList.add('loser');
      card.classList.add('decided'); userResults[id].winner = 'club2';
    }
  }
}

function pickPenalty(btn) {
  var tieId = btn.dataset.tie;
  var pick = btn.dataset.pick;
  if (!userResults[tieId]) userResults[tieId] = {};
  userResults[tieId].penWinner = pick;
  var penArea = document.getElementById('pen-' + tieId);
  penArea.querySelectorAll('.pen-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
  processAllResults();
  triggerMC(50000);
}

// TABS
document.querySelectorAll('.comp-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.comp-tab').forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    document.querySelectorAll('.bracket-container').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('bracket-' + tab.dataset.comp).classList.add('active');
  });
});

// COEFFICIENT STANDINGS TABLE
function calcConfirmedPoints() {
  var confirmed = {};
  TRACKED.forEach(function(c) { confirmed[c] = 0; });
  ['CL','EL','ECL'].forEach(function(comp) {
    var bonus = ROUND_BONUS[comp];
    var ties = R16_TIES[comp];
    for (var ti = 0; ti < ties.length; ti++) {
      var tie = ties[ti];
      var ur = userResults[tie.id];
      if (!ur || ur.sl_hg === undefined || ur.sl_ag === undefined) continue;
      if (TRACKED.includes(tie.ac)) confirmed[tie.ac] += matchPts(ur.sl_hg, ur.sl_ag);
      if (TRACKED.includes(tie.hc)) confirmed[tie.hc] += matchPts(ur.sl_ag, ur.sl_hg);
      var homeAgg = tie.fl_hg + ur.sl_ag;
      var awayAgg = tie.fl_ag + ur.sl_hg;
      var winnerCountry = null;
      if (homeAgg > awayAgg) winnerCountry = tie.hc;
      else if (awayAgg > homeAgg) winnerCountry = tie.ac;
      else if (ur.penWinner === 'home') winnerCountry = tie.hc;
      else if (ur.penWinner === 'away') winnerCountry = tie.ac;
      if (winnerCountry && TRACKED.includes(winnerCountry)) {
        confirmed[winnerCountry] += bonus;
      }
    }
    for (var qi = 0; qi < 4; qi++) {
      var qid = comp + '-QF-' + qi;
      var qur = userResults[qid];
      var qbs = bracketState[qid];
      if (!qur || !qbs) continue;
      if (qur.fl_hg !== undefined && qur.fl_ag !== undefined) {
        if (TRACKED.includes(qbs.club1.country)) confirmed[qbs.club1.country] += matchPts(qur.fl_hg, qur.fl_ag);
        if (TRACKED.includes(qbs.club2.country)) confirmed[qbs.club2.country] += matchPts(qur.fl_ag, qur.fl_hg);
      }
      if (qur.sl_hg !== undefined && qur.sl_ag !== undefined) {
        if (TRACKED.includes(qbs.club2.country)) confirmed[qbs.club2.country] += matchPts(qur.sl_hg, qur.sl_ag);
        if (TRACKED.includes(qbs.club1.country)) confirmed[qbs.club1.country] += matchPts(qur.sl_ag, qur.sl_hg);
      }
      var qwinner = getTwoLegWinner(qid, qbs.club1, qbs.club2);
      if (qwinner && TRACKED.includes(qwinner.country)) confirmed[qwinner.country] += bonus;
    }
    for (var si = 0; si < 2; si++) {
      var sid = comp + '-SF-' + si;
      var sur = userResults[sid];
      var sbs = bracketState[sid];
      if (!sur || !sbs) continue;
      if (sur.fl_hg !== undefined && sur.fl_ag !== undefined) {
        if (TRACKED.includes(sbs.club1.country)) confirmed[sbs.club1.country] += matchPts(sur.fl_hg, sur.fl_ag);
        if (TRACKED.includes(sbs.club2.country)) confirmed[sbs.club2.country] += matchPts(sur.fl_ag, sur.fl_hg);
      }
      if (sur.sl_hg !== undefined && sur.sl_ag !== undefined) {
        if (TRACKED.includes(sbs.club2.country)) confirmed[sbs.club2.country] += matchPts(sur.sl_hg, sur.sl_ag);
        if (TRACKED.includes(sbs.club1.country)) confirmed[sbs.club1.country] += matchPts(sur.sl_ag, sur.sl_hg);
      }
      var swinner = getTwoLegWinner(sid, sbs.club1, sbs.club2);
      if (swinner && TRACKED.includes(swinner.country)) confirmed[swinner.country] += bonus;
    }
    var fId = comp + '-F';
    var fur = userResults[fId];
    var fbs = bracketState[fId];
    if (fur && fbs) {
      if (fur.g1 !== undefined && fur.g2 !== undefined) {
        if (TRACKED.includes(fbs.club1.country)) confirmed[fbs.club1.country] += matchPts(fur.g1, fur.g2);
        if (TRACKED.includes(fbs.club2.country)) confirmed[fbs.club2.country] += matchPts(fur.g2, fur.g1);
      }
    }
  });
  return confirmed;
}

function updateStandings(res) {
  var confirmed = calcConfirmedPoints();
  var tbody = document.getElementById('standings-body');
  var rows = TRACKED.map(function(c) {
    var currentCoeff = CURRENT_PTS[c] / NUM_CLUBS[c];
    var confirmedCoeff = confirmed[c] / NUM_CLUBS[c];
    var pct = res.percentiles[c];
    return {
      country: c, currentCoeff: currentCoeff,
      confirmedPts: confirmed[c], confirmedCoeff: confirmedCoeff,
      median: pct.p50, p5: pct.p5, p25: pct.p25, p75: pct.p75, p95: pct.p95,
      min: res.minObs[c], max: res.maxObs[c],
      mean: res.mean[c], top2: res.top2[c]
    };
  }).sort(function(a, b) { return b.median - a.median; });
  var globalMin = Math.min.apply(null, rows.map(function(r) { return r.p5; }));
  var globalMax = Math.max.apply(null, rows.map(function(r) { return r.p95; }));
  var range = globalMax - globalMin || 1;
  var html = '';
  rows.forEach(function(r, i) {
    var clr = COUNTRY_CLR[r.country];
    var isTop2 = i < 2 ? 'top2-row' : '';
    var rankClass = i < 2 ? 'rank-cell top' : 'rank-cell';
    var p5Left = ((r.p5 - globalMin) / range * 100);
    var p95Right = ((r.p95 - globalMin) / range * 100);
    var p25Left = ((r.p25 - globalMin) / range * 100);
    var p75Right = ((r.p75 - globalMin) / range * 100);
    var medianPos = ((r.median - globalMin) / range * 100);
    var confirmedStr = r.confirmedPts > 0
      ? '<span style="color:var(--green)">+' + r.confirmedCoeff.toFixed(3) + '</span>'
      : '<span style="color:var(--text-muted)">\u2014</span>';
    html += '<tr class="' + isTop2 + '">' +
      '<td class="' + rankClass + '">' + (i + 1) + '</td>' +
      '<td><div class="nation-cell">' +
      '<img src="' + getFlag(r.country) + '" alt="' + r.country + '">' +
      '<div><div class="name">' + r.country + '</div>' +
      '<div class="clubs">' + NUM_CLUBS[r.country] + ' clubs \u00B7 ' + CURRENT_PTS[r.country].toFixed(1) + ' pts</div></div></div></td>' +
      '<td class="num coeff-current">' + r.currentCoeff.toFixed(3) + '</td>' +
      '<td class="num">' + confirmedStr + '</td>' +
      '<td class="num" style="color:' + clr + ';font-weight:700">' + r.median.toFixed(3) + '</td>' +
      '<td><div class="range-cell">' +
      '<span class="range-label">' + r.p5.toFixed(1) + '</span>' +
      '<div class="range-bar-wrap">' +
      '<div class="range-bar" style="left:' + p5Left + '%;width:' + (p95Right - p5Left) + '%;background:' + clr + '"></div>' +
      '<div class="range-iqr" style="left:' + p25Left + '%;width:' + (p75Right - p25Left) + '%;background:' + clr + '"></div>' +
      '<div class="range-median" style="left:' + medianPos + '%;background:' + clr + '"></div>' +
      '</div><span class="range-label">' + r.p95.toFixed(1) + '</span></div></td>' +
      '<td class="num top2-pct" style="color:' + (r.top2 > 50 ? 'var(--green)' : r.top2 > 10 ? 'var(--yellow)' : 'var(--red)') + '">' + r.top2.toFixed(1) + '%</td></tr>';
  });
  tbody.innerHTML = html;
}

// CHARTS
var distChart = null;

function initDistChart() {
  var ctx = document.getElementById('distChart').getContext('2d');
  distChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: TRACKED.map(function(c) {
        return {
          label: c, data: [],
          borderColor: COUNTRY_CLR[c],
          backgroundColor: COUNTRY_CLR[c] + '22',
          borderWidth: 2, pointRadius: 0, fill: true, tension: 0.3
        };
      })
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          title: { display: true, text: 'Coefficient', color: '#94a3b8', font: { size: 11, family: 'Inter' } },
          ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 15 },
          grid: { color: '#1e293b' }
        },
        y: {
          title: { display: true, text: 'Probability (%)', color: '#94a3b8', font: { size: 11, family: 'Inter' } },
          ticks: { color: '#64748b', font: { size: 10 } },
          grid: { color: '#1e293b' }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#f1f5f9', font: { size: 11, family: 'Inter' }, usePointStyle: true, pointStyle: 'circle' }
        },
        tooltip: {
          backgroundColor: '#1e293b', titleColor: '#f1f5f9',
          bodyColor: '#94a3b8', borderColor: '#2d3a4f', borderWidth: 1,
          callbacks: {
            label: function(ctx) { return ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(2) + '%'; }
          }
        }
      }
    }
  });
}

function updateDistChart(res) {
  var allX = new Set();
  TRACKED.forEach(function(c) { (res.dist[c]||[]).forEach(function(d) { allX.add(d.x); }); });
  var labels = Array.from(allX).sort(function(a,b) { return a-b; });
  distChart.data.labels = labels.map(function(x) { return x.toFixed(1); });
  TRACKED.forEach(function(c, i) {
    var dataMap = {};
    (res.dist[c]||[]).forEach(function(d) { dataMap[d.x] = d.y; });
    distChart.data.datasets[i].data = labels.map(function(x) { return dataMap[x] || 0; });
  });
  distChart.update('none');
}

function updateOvertakeTable(res) {
  var wrap = document.getElementById('overtake-wrap');
  var html = '<table class="overtake-table">' +
    '<thead><tr><th>Scenario</th><th>Probability</th></tr></thead><tbody>';
  var countries = ['Spain','Germany','Italy','France'];
  countries.forEach(function(c) {
    var pct = res.england.overtake[c] || 0;
    html += '<tr><td><img src="' + getFlag(c) + '" width="16" height="12" style="vertical-align:middle;margin-right:6px;border-radius:2px">' +
      c + ' overtakes England</td>' +
      '<td style="color:' + (pct > 20 ? 'var(--red)' : pct > 5 ? 'var(--yellow)' : 'var(--green)') +
      ';font-weight:600">' + pct.toFixed(2) + '%</td></tr>';
  });
  if (res.england.pairOvertake) {
    var pairs = Object.entries(res.england.pairOvertake).sort(function(a,b) { return b[1]-a[1]; });
    pairs.forEach(function(entry) {
      var pair = entry[0], pct = entry[1];
      html += '<tr><td style="color:var(--text-muted)">' + pair + ' both overtake</td>' +
        '<td style="color:' + (pct > 10 ? 'var(--red)' : pct > 2 ? 'var(--yellow)' : 'var(--green)') +
        ';font-weight:600">' + pct.toFixed(2) + '%</td></tr>';
    });
  }
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

// MONTE CARLO
function triggerMC(iterations) {
  var btn = document.getElementById('run-btn');
  var status = document.getElementById('sim-status');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Running\u2026';
  status.textContent = 'Simulating ' + (iterations/1000).toFixed(0) + 'K iterations\u2026';
  var startTime = performance.now();
  setTimeout(function() {
    try {
      var result = runMonteCarlo(cleanResults(), iterations);
      mcResult = result;
      updateDashboard(result);
      updateDistChart(result);
      updateOvertakeTable(result);
      updateStandings(result);
      var elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
      btn.disabled = false;
      btn.innerHTML = 'Run 100K Simulations';
      status.textContent = (iterations/1000).toFixed(0) + 'K simulations completed in ' + elapsed + 's';
    } catch(e) {
      btn.disabled = false;
      btn.innerHTML = 'Run 100K Simulations';
      status.textContent = 'Error: ' + e.message;
      console.error('MC Error:', e);
    }
  }, 50);
}

function cleanResults() {
  var clean = {};
  for (var k in userResults) {
    if (!userResults.hasOwnProperty(k)) continue;
    var copy = Object.assign({}, userResults[k]);
    delete copy.penWinner;
    if (Object.keys(copy).length > 0) clean[k] = copy;
  }
  return clean;
}

// INIT
buildDashboard();
buildAllBrackets();
initDistChart();

// Attach R16 input events
document.querySelectorAll('.score-input').forEach(function(inp) {
  inp.addEventListener('input', onScoreInput);
});

// Run initial MC
triggerMC(50000);