/**
 * Club metadata: badges, country flags, short names, colors
 * Badge source: logo.dev (reliable CDN for club logos)
 * Flags: flagcdn.com
 */
const CLUB_META = {
  // ── Champions League ──
  'PSG':              { short:'PSG',       color:'#004170', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52747.png', country:'France' },
  'Chelsea':          { short:'CHE',       color:'#034694', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52914.png', country:'England' },
  'Galatasaray':      { short:'GAL',       color:'#FF6600', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52826.png', country:'Turkey' },
  'Liverpool':        { short:'LIV',       color:'#C8102E', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/7889.png', country:'England' },
  'Real Madrid':      { short:'RMA',       color:'#FEBE10', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50051.png', country:'Spain' },
  'Man City':         { short:'MCI',       color:'#6CABDD', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50062.png', country:'England' },
  'Atalanta':         { short:'ATA',       color:'#1E71B8', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52625.png', country:'Italy' },
  'Bayern München':   { short:'BAY',       color:'#DC052D', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50037.png', country:'Germany' },
  'Newcastle':        { short:'NEW',       color:'#241F20', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52919.png', country:'England' },
  'Barcelona':        { short:'BAR',       color:'#A50044', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50080.png', country:'Spain' },
  'Atlético Madrid':  { short:'ATM',       color:'#CE3524', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50124.png', country:'Spain' },
  'Tottenham':        { short:'TOT',       color:'#132257', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52920.png', country:'England' },
  'Bodø/Glimt':       { short:'BOD',       color:'#FFD700', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52924.png', country:'Norway' },
  'Sporting CP':      { short:'SCP',       color:'#007A47', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50149.png', country:'Portugal' },
  'Leverkusen':       { short:'LEV',       color:'#E32221', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50046.png', country:'Germany' },
  'Arsenal':          { short:'ARS',       color:'#EF0107', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52915.png', country:'England' },
  
  // ── Europa League ──
  'Ferencváros':      { short:'FTC',       color:'#1B8A42', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/33785.png', country:'Hungary' },
  'Braga':            { short:'BRA',       color:'#C8102E', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52133.png', country:'Portugal' },
  'Panathinaikos':    { short:'PAO',       color:'#006633', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50130.png', country:'Greece' },
  'Real Betis':       { short:'BET',       color:'#00954C', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52109.png', country:'Spain' },
  'Genk':             { short:'GNK',       color:'#0047AB', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50074.png', country:'Belgium' },
  'Freiburg':         { short:'FRE',       color:'#000000', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52727.png', country:'Germany' },
  'Celta':            { short:'CEL',       color:'#8AC3EE', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52107.png', country:'Spain' },
  'Lyon':             { short:'OL',        color:'#1B3F8B', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50040.png', country:'France' },
  'Stuttgart':        { short:'VfB',       color:'#E32219', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52471.png', country:'Germany' },
  'Porto':            { short:'POR',       color:'#003893', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50064.png', country:'Portugal' },
  'Nottingham Forest':{ short:'NFO',       color:'#DD0000', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52922.png', country:'England' },
  'Midtjylland':      { short:'MID',       color:'#C8102E', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/59523.png', country:'Denmark' },
  'Bologna':          { short:'BOL',       color:'#1A2D5A', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52633.png', country:'Italy' },
  'Roma':             { short:'ROM',       color:'#8E1F2F', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50137.png', country:'Italy' },
  'Lille':            { short:'LIL',       color:'#C8102E', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52750.png', country:'France' },
  'Aston Villa':      { short:'AVL',       color:'#670E36', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52913.png', country:'England' },
  
  // ── Conference League ──
  'Lech Poznań':      { short:'LPO',       color:'#1856A4', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50148.png', country:'Poland' },
  'Shakhtar Donetsk': { short:'SHA',       color:'#F26522', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50065.png', country:'Ukraine' },
  'AZ Alkmaar':       { short:'AZ',        color:'#C8102E', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50143.png', country:'Netherlands' },
  'Sparta Praha':     { short:'SPA',       color:'#9B1B30', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52274.png', country:'Czech Republic' },
  'Crystal Palace':   { short:'CRY',       color:'#1B458F', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52916.png', country:'England' },
  'AEK Larnaca':      { short:'AEL',       color:'#FFD700', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/64315.png', country:'Cyprus' },
  'Fiorentina':       { short:'FIO',       color:'#482F8A', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52636.png', country:'Italy' },
  'Raków':            { short:'RAK',       color:'#A62626', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/78975.png', country:'Poland' },
  'Samsunspor':       { short:'SAM',       color:'#E42313', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52839.png', country:'Turkey' },
  'Rayo Vallecano':   { short:'RAY',       color:'#E53027', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52106.png', country:'Spain' },
  'Celje':            { short:'CEJ',       color:'#FFD700', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/57951.png', country:'Slovenia' },
  'AEK Athens':       { short:'AEK',       color:'#FFD700', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/50131.png', country:'Greece' },
  'Sigma Olomouc':    { short:'SIG',       color:'#1B3F8B', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52266.png', country:'Czech Republic' },
  'Mainz':            { short:'M05',       color:'#ED1C24', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52468.png', country:'Germany' },
  'Rijeka':           { short:'RIJ',       color:'#003DA5', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52182.png', country:'Croatia' },
  'Strasbourg':       { short:'RCS',       color:'#009FE3', badge:'https://img.uefa.com/imgml/TP/teams/logos/50x50/52755.png', country:'France' },
};

// Country ISO codes for flagcdn.com
const COUNTRY_FLAGS = {
  'England': 'gb-eng', 'Spain': 'es', 'Germany': 'de', 'Italy': 'it', 'France': 'fr',
  'Turkey': 'tr', 'Norway': 'no', 'Portugal': 'pt', 'Hungary': 'hu', 'Greece': 'gr',
  'Belgium': 'be', 'Denmark': 'dk', 'Poland': 'pl', 'Ukraine': 'ua', 'Netherlands': 'nl',
  'Czech Republic': 'cz', 'Cyprus': 'cy', 'Slovenia': 'si', 'Croatia': 'hr',
};

function getFlag(country) {
  const code = COUNTRY_FLAGS[country];
  return code ? `https://flagcdn.com/24x18/${code}.png` : '';
}

function getBadge(club) {
  return CLUB_META[club] ? CLUB_META[club].badge : '';
}

function getShort(club) {
  return CLUB_META[club] ? CLUB_META[club].short : club.substring(0,3).toUpperCase();
}

// Tracked country colors
const COUNTRY_COLORS = {
  'England': '#e74c3c',
  'Spain': '#f39c12',
  'Germany': '#2ecc71',
  'Italy': '#3498db',
  'France': '#9b59b6',
};
