/**
 * UEFA Coefficient Monte Carlo Engine (Browser-side)
 * Runs simulations in-browser using Web Workers for non-blocking computation.
 * Accepts user-defined results and simulates remaining unknown matches.
 */

const WIN_PTS = 2.0, DRAW_PTS = 1.0, LOSS_PTS = 0.0;
const ROUND_BONUS = { CL: 1.5, EL: 1.0, ECL: 0.5 };
const TRACKED = ['England','Spain','Germany','Italy','France'];

const NUM_CLUBS = { England:9, Spain:8, Germany:7, Italy:7, France:7 };
const CURRENT_PTS = { England:205.625, Spain:147.25, Germany:127.0, Italy:125.5, France:109.75 };

const QF_BRACKET = [[0,1],[2,3],[4,5],[6,7]];
const SF_BRACKET = [[0,1],[2,3]];

const R16_TIES = {
  CL: [
    { id:'CL-0', home:'PSG', hc:'France', away:'Chelsea', ac:'England', fl_hg:5, fl_ag:2 },
    { id:'CL-1', home:'Galatasaray', hc:'Turkey', away:'Liverpool', ac:'England', fl_hg:1, fl_ag:0 },
    { id:'CL-2', home:'Real Madrid', hc:'Spain', away:'Man City', ac:'England', fl_hg:3, fl_ag:0 },
    { id:'CL-3', home:'Atalanta', hc:'Italy', away:'Bayern M\u00fcnchen', ac:'Germany', fl_hg:1, fl_ag:6 },
    { id:'CL-4', home:'Newcastle', hc:'England', away:'Barcelona', ac:'Spain', fl_hg:1, fl_ag:1 },
    { id:'CL-5', home:'Atl\u00e9tico Madrid', hc:'Spain', away:'Tottenham', ac:'England', fl_hg:5, fl_ag:2 },
    { id:'CL-6', home:'Bod\u00f8/Glimt', hc:'Norway', away:'Sporting CP', ac:'Portugal', fl_hg:3, fl_ag:0 },
    { id:'CL-7', home:'Leverkusen', hc:'Germany', away:'Arsenal', ac:'England', fl_hg:1, fl_ag:1 },
  ],
  EL: [
    { id:'EL-0', home:'Ferencv\u00e1ros', hc:'Hungary', away:'Braga', ac:'Portugal', fl_hg:2, fl_ag:0 },
    { id:'EL-1', home:'Panathinaikos', hc:'Greece', away:'Real Betis', ac:'Spain', fl_hg:1, fl_ag:0 },
    { id:'EL-2', home:'Genk', hc:'Belgium', away:'Freiburg', ac:'Germany', fl_hg:1, fl_ag:0 },
    { id:'EL-3', home:'Celta', hc:'Spain', away:'Lyon', ac:'France', fl_hg:1, fl_ag:1 },
    { id:'EL-4', home:'Stuttgart', hc:'Germany', away:'Porto', ac:'Portugal', fl_hg:1, fl_ag:2 },
    { id:'EL-5', home:'Nottingham Forest', hc:'England', away:'Midtjylland', ac:'Denmark', fl_hg:0, fl_ag:1 },
    { id:'EL-6', home:'Bologna', hc:'Italy', away:'Roma', ac:'Italy', fl_hg:1, fl_ag:1 },
    { id:'EL-7', home:'Lille', hc:'France', away:'Aston Villa', ac:'England', fl_hg:0, fl_ag:1 },
  ],
  ECL: [
    { id:'ECL-0', home:'Lech Pozna\u0144', hc:'Poland', away:'Shakhtar Donetsk', ac:'Ukraine', fl_hg:1, fl_ag:3 },
    { id:'ECL-1', home:'AZ Alkmaar', hc:'Netherlands', away:'Sparta Praha', ac:'Czech Republic', fl_hg:2, fl_ag:1 },
    { id:'ECL-2', home:'Crystal Palace', hc:'England', away:'AEK Larnaca', ac:'Cyprus', fl_hg:0, fl_ag:0 },
    { id:'ECL-3', home:'Fiorentina', hc:'Italy', away:'Rak\u00f3w', ac:'Poland', fl_hg:2, fl_ag:1 },
    { id:'ECL-4', home:'Samsunspor', hc:'Turkey', away:'Rayo Vallecano', ac:'Spain', fl_hg:1, fl_ag:3 },
    { id:'ECL-5', home:'Celje', hc:'Slovenia', away:'AEK Athens', ac:'Greece', fl_hg:0, fl_ag:4 },
    { id:'ECL-6', home:'Sigma Olomouc', hc:'Czech Republic', away:'Mainz', ac:'Germany', fl_hg:0, fl_ag:0 },
    { id:'ECL-7', home:'Rijeka', hc:'Croatia', away:'Strasbourg', ac:'France', fl_hg:1, fl_ag:2 },
  ]
};

function poissonSample(lam) {
  const L = Math.exp(-lam);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

function matchPts(goalsFor, goalsAgainst) {
  if (goalsFor > goalsAgainst) return WIN_PTS;
  if (goalsFor === goalsAgainst) return DRAW_PTS;
  return LOSS_PTS;
}

function tieWinner(homeClub, awayClub, fl_hg, fl_ag, sl_hg, sl_ag) {
  const homeAgg = fl_hg + sl_ag;
  const awayAgg = fl_ag + sl_hg;
  if (homeAgg > awayAgg) return 'home';
  if (awayAgg > homeAgg) return 'away';
  return Math.random() < 0.5 ? 'home' : 'away';
}

function simR16SecondLeg(tie, pts) {
  const sl_hg = poissonSample(1.4);
  const sl_ag = poissonSample(1.1);
  if (TRACKED.includes(tie.ac)) pts[tie.ac] = (pts[tie.ac]||0) + matchPts(sl_hg, sl_ag);
  if (TRACKED.includes(tie.hc)) pts[tie.hc] = (pts[tie.hc]||0) + matchPts(sl_ag, sl_hg);
  const side = tieWinner(tie.home, tie.away, tie.fl_hg, tie.fl_ag, sl_hg, sl_ag);
  return { winner: side==='home'?tie.home:tie.away, wc: side==='home'?tie.hc:tie.ac, sl_hg, sl_ag };
}

function simTwoLeggedTie(club1, c1, club2, c2, pts) {
  const fl_hg=poissonSample(1.3), fl_ag=poissonSample(1.1);
  if(TRACKED.includes(c1)) pts[c1]=(pts[c1]||0)+matchPts(fl_hg,fl_ag);
  if(TRACKED.includes(c2)) pts[c2]=(pts[c2]||0)+matchPts(fl_ag,fl_hg);
  const sl_hg=poissonSample(1.4), sl_ag=poissonSample(1.1);
  if(TRACKED.includes(c2)) pts[c2]=(pts[c2]||0)+matchPts(sl_hg,sl_ag);
  if(TRACKED.includes(c1)) pts[c1]=(pts[c1]||0)+matchPts(sl_ag,sl_hg);
  const side=tieWinner(club1,club2,fl_hg,fl_ag,sl_hg,sl_ag);
  return { winner:side==='home'?club1:club2, wc:side==='home'?c1:c2, fl_hg, fl_ag, sl_hg, sl_ag };
}

function simFinal(club1, c1, club2, c2, pts) {
  const g1=poissonSample(1.25), g2=poissonSample(1.25);
  if(TRACKED.includes(c1)) pts[c1]=(pts[c1]||0)+matchPts(g1,g2);
  if(TRACKED.includes(c2)) pts[c2]=(pts[c2]||0)+matchPts(g2,g1);
  if(g1>g2) return {winner:club1,wc:c1};
  if(g2>g1) return {winner:club2,wc:c2};
  return Math.random()<0.5?{winner:club1,wc:c1}:{winner:club2,wc:c2};
}

function runMonteCarlo(userResults={}, iterations=100000) {
  const top2Count={}, top1Count={}, coeffSums={}, coeffSqSums={};
  const coeffMin={}, coeffMax={};
  let engOutOfTop2=0;
  const overtakeBy={}, pairOvertake={}, coeffAll={}, addPtsAll={};
  TRACKED.forEach(c=>{
    top2Count[c]=0; top1Count[c]=0;
    coeffSums[c]=0; coeffSqSums[c]=0;
    coeffMin[c]=Infinity; coeffMax[c]=-Infinity;
    if(c!=='England') overtakeBy[c]=0;
    coeffAll[c]=new Float32Array(iterations);
    addPtsAll[c]=new Float32Array(iterations);
  });
  const binWidth=0.25, binsMin=14, binsMax=35;
  const nBins=Math.floor((binsMax-binsMin)/binWidth);
  const histograms={};
  TRACKED.forEach(c=>histograms[c]=new Array(nBins).fill(0));
  const sampleTraces=[];
  const nSample=Math.min(100,iterations);
  for (let iter=0;iter<iterations;iter++) {
    const addPts={};
    const trace=iter<nSample?{CL:{},EL:{},ECL:{}}:null;
    for (const comp of ['CL','EL','ECL']) {
      const bonus=ROUND_BONUS[comp];
      const ties=R16_TIES[comp];
      const r16Winners=[];
      for (let i=0;i<ties.length;i++) {
        const tie=ties[i];
        const userR=userResults[tie.id];
        let winner,wc,sl_hg,sl_ag;
        if(userR&&userR.sl_hg!==undefined&&userR.sl_ag!==undefined){
          sl_hg=userR.sl_hg; sl_ag=userR.sl_ag;
          if(TRACKED.includes(tie.ac)) addPts[tie.ac]=(addPts[tie.ac]||0)+matchPts(sl_hg,sl_ag);
          if(TRACKED.includes(tie.hc)) addPts[tie.hc]=(addPts[tie.hc]||0)+matchPts(sl_ag,sl_hg);
          const side=tieWinner(tie.home,tie.away,tie.fl_hg,tie.fl_ag,sl_hg,sl_ag);
          winner=side==='home'?tie.home:tie.away;
          wc=side==='home'?tie.hc:tie.ac;
        } else {
          const r=simR16SecondLeg(tie,addPts);
          winner=r.winner; wc=r.wc; sl_hg=r.sl_hg; sl_ag=r.sl_ag;
        }
        r16Winners.push({club:winner,country:wc});
        if(TRACKED.includes(wc)) addPts[wc]=(addPts[wc]||0)+bonus;
        if(trace) trace[comp]['R16_'+i]={home:tie.home,away:tie.away,winner,wc};
      }
      const qfWinners=[];
      for (let qi=0;qi<QF_BRACKET.length;qi++) {
        const [a,b]=QF_BRACKET[qi];
        const c1=r16Winners[a], c2=r16Winners[b];
        const qfKey=comp+'-QF-'+qi;
        const userQ=userResults[qfKey];
        let winner,wc;
        if(userQ&&userQ.winner){
          winner=userQ.winner==='club1'?c1.club:c2.club;
          wc=userQ.winner==='club1'?c1.country:c2.country;
          if(userQ.fl_hg!==undefined){if(TRACKED.includes(c1.country)) addPts[c1.country]=(addPts[c1.country]||0)+matchPts(userQ.fl_hg,userQ.fl_ag);if(TRACKED.includes(c2.country)) addPts[c2.country]=(addPts[c2.country]||0)+matchPts(userQ.fl_ag,userQ.fl_hg);}
          if(userQ.sl_hg!==undefined){if(TRACKED.includes(c2.country)) addPts[c2.country]=(addPts[c2.country]||0)+matchPts(userQ.sl_hg,userQ.sl_ag);if(TRACKED.includes(c1.country)) addPts[c1.country]=(addPts[c1.country]||0)+matchPts(userQ.sl_ag,userQ.sl_hg);}
        } else {
          const r=simTwoLeggedTie(c1.club,c1.country,c2.club,c2.country,addPts);
          winner=r.winner; wc=r.wc;
        }
        qfWinners.push({club:winner,country:wc});
        if(TRACKED.includes(wc)) addPts[wc]=(addPts[wc]||0)+bonus;
        if(trace) trace[comp]['QF_'+qi]={home:c1.club,away:c2.club,winner,wc};
      }
      const sfWinners=[];
      for (let si=0;si<SF_BRACKET.length;si++) {
        const [a,b]=SF_BRACKET[si];
        const c1=qfWinners[a], c2=qfWinners[b];
        const sfKey=comp+'-SF-'+si;
        const userS=userResults[sfKey];
        let winner,wc;
        if(userS&&userS.winner){
          winner=userS.winner==='club1'?c1.club:c2.club;
          wc=userS.winner==='club1'?c1.country:c2.country;
          if(userS.fl_hg!==undefined){if(TRACKED.includes(c1.country)) addPts[c1.country]=(addPts[c1.country]||0)+matchPts(userS.fl_hg,userS.fl_ag);if(TRACKED.includes(c2.country)) addPts[c2.country]=(addPts[c2.country]||0)+matchPts(userS.fl_ag,userS.fl_hg);}
          if(userS.sl_hg!==undefined){if(TRACKED.includes(c2.country)) addPts[c2.country]=(addPts[c2.country]||0)+matchPts(userS.sl_hg,userS.sl_ag);if(TRACKED.includes(c1.country)) addPts[c1.country]=(addPts[c1.country]||0)+matchPts(userS.sl_ag,userS.sl_hg);}
        } else {
          const r=simTwoLeggedTie(c1.club,c1.country,c2.club,c2.country,addPts);
          winner=r.winner; wc=r.wc;
        }
        sfWinners.push({club:winner,country:wc});
        if(TRACKED.includes(wc)) addPts[wc]=(addPts[wc]||0)+bonus;
        if(trace) trace[comp]['SF_'+si]={home:c1.club,away:c2.club,winner,wc};
      }
      if(sfWinners.length>=2){
        const c1=sfWinners[0], c2=sfWinners[1];
        const fKey=comp+'-F';
        const userF=userResults[fKey];
        let winner,wc;
        if(userF&&userF.winner){
          winner=userF.winner==='club1'?c1.club:c2.club;
          wc=userF.winner==='club1'?c1.country:c2.country;
          if(userF.g1!==undefined){if(TRACKED.includes(c1.country)) addPts[c1.country]=(addPts[c1.country]||0)+matchPts(userF.g1,userF.g2);if(TRACKED.includes(c2.country)) addPts[c2.country]=(addPts[c2.country]||0)+matchPts(userF.g2,userF.g1);}
        } else {
          const r=simFinal(c1.club,c1.country,c2.club,c2.country,addPts);
          winner=r.winner; wc=r.wc;
        }
        if(trace) trace[comp]['F']={home:c1.club,away:c2.club,winner,wc};
      }
    }
    const coefficients={};
    TRACKED.forEach(c=>{ const total=CURRENT_PTS[c]+(addPts[c]||0); coefficients[c]=total/NUM_CLUBS[c]; });
    TRACKED.forEach(c=>{
      const coeff=coefficients[c];
      coeffSums[c]+=coeff; coeffSqSums[c]+=coeff*coeff;
      if(coeff<coeffMin[c]) coeffMin[c]=coeff;
      if(coeff>coeffMax[c]) coeffMax[c]=coeff;
      const bi=Math.floor((coeff-binsMin)/binWidth);
      if(bi>=0&&bi<nBins) histograms[c][bi]++;
      coeffAll[c][iter]=coeff;
      addPtsAll[c][iter]=addPts[c]||0;
    });
    const ranked=TRACKED.map(c=>[c,coefficients[c]]).sort((a,b)=>b[1]-a[1]);
    top2Count[ranked[0][0]]++; top2Count[ranked[1][0]]++;
    top1Count[ranked[0][0]]++;
    const engCoeff=coefficients['England'];
    const above=TRACKED.filter(c=>c!=='England'&&coefficients[c]>engCoeff);
    above.forEach(c=>overtakeBy[c]++);
    if(above.length>=2) engOutOfTop2++;
    for(let i=0;i<above.length;i++){for(let j=i+1;j<above.length;j++){const pair=[above[i],above[j]].sort().join(' & ');pairOvertake[pair]=(pairOvertake[pair]||0)+1;}}
    if(iter<nSample){sampleTraces.push({sim:iter,coefficients:Object.fromEntries(TRACKED.map(c=>[c,Math.round(coefficients[c]*1000)/1000])),rank:ranked.map(r=>r[0]),engTop2:above.length<2,trace});}
  }
  function percentile(sortedArr, p) {
    const idx=(p/100)*(sortedArr.length-1);
    const lo=Math.floor(idx),hi=Math.ceil(idx);
    if(lo===hi) return sortedArr[lo];
    return sortedArr[lo]+(sortedArr[hi]-sortedArr[lo])*(idx-lo);
  }
  const n=iterations;
  const result={
    iterations:n,top2:{},top1:{},mean:{},std:{},minObs:{},maxObs:{},dist:{},
    percentiles:{},addPtsStats:{},
    england:{staysTop2:Math.round((n-engOutOfTop2)/n*10000)/100,dropsOut:Math.round(engOutOfTop2/n*10000)/100,overtake:{},pairOvertake:{}},
    traces:sampleTraces,histBins:{min:binsMin,max:binsMax,width:binWidth}
  };
  TRACKED.forEach(c=>{
    const mean=coeffSums[c]/n;
    const variance=(coeffSqSums[c]/n)-(mean*mean);
    result.top2[c]=Math.round(top2Count[c]/n*10000)/100;
    result.top1[c]=Math.round(top1Count[c]/n*10000)/100;
    result.mean[c]=Math.round(mean*1000)/1000;
    result.std[c]=Math.round(Math.sqrt(Math.max(0,variance))*1000)/1000;
    result.minObs[c]=Math.round(coeffMin[c]*1000)/1000;
    result.maxObs[c]=Math.round(coeffMax[c]*1000)/1000;
    result.dist[c]=[];
    for(let i=0;i<nBins;i++){if(histograms[c][i]>0){result.dist[c].push({x:Math.round((binsMin+i*binWidth)*100)/100,y:Math.round(histograms[c][i]/n*10000)/100});}}
    if(c!=='England') result.england.overtake[c]=Math.round(overtakeBy[c]/n*10000)/100;
    const sorted=Array.from(coeffAll[c]).sort((a,b)=>a-b);
    result.percentiles[c]={p5:Math.round(percentile(sorted,5)*1000)/1000,p25:Math.round(percentile(sorted,25)*1000)/1000,p50:Math.round(percentile(sorted,50)*1000)/1000,p75:Math.round(percentile(sorted,75)*1000)/1000,p95:Math.round(percentile(sorted,95)*1000)/1000};
    const sortedPts=Array.from(addPtsAll[c]).sort((a,b)=>a-b);
    const ptsMean=sortedPts.reduce((s,v)=>s+v,0)/n;
    result.addPtsStats[c]={mean:Math.round(ptsMean*1000)/1000,min:Math.round(sortedPts[0]*1000)/1000,max:Math.round(sortedPts[n-1]*1000)/1000,p50:Math.round(percentile(sortedPts,50)*1000)/1000};
  });
  Object.entries(pairOvertake).forEach(([pair,count])=>{result.england.pairOvertake[pair]=Math.round(count/n*10000)/100;});
  return result;
}

if(typeof module!=='undefined') module.exports={runMonteCarlo,R16_TIES,TRACKED,NUM_CLUBS,CURRENT_PTS,ROUND_BONUS,QF_BRACKET,SF_BRACKET};
