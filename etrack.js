const { toChord, toKeyNum, toScale, scaleRows, scaleDegMap, setScale, scDegToKeyNum } = require("./emuse");
const { msg, err } = require('./msg.js');
const { mNt, hNt } = require( './eplyr.js' );

function trackNames( song ){
  return song.tracks.map( x => x.nm );
}
function findTrack( song, nm ){
  for ( const t of song.tracks )
    if (t.nm.toLowerCase()==nm.trim().toLowerCase()) return t;
  return null;
}
function splitPrefix( s, prefix ){   // return s split into [ 'leading chars in prefix', 'rest' ]
  let pr = '';
  for ( let i=0; i<s.length; i++ )
    if ( !prefix.includes( s[i] ))  return [ s.substring(0,i), s.substring(i) ];
  return [ s, '' ];
}
function asChord( nm, rootkey, octave ){    // decode chord string
  //  roman:  e.g. 'Im' or 'iii6(9)'
  //  scdeg:  1#m  2##sus2
  //  note:   G#m  A6(9)
  if ( octave==undefined ) octave = 3;
  let roman = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7 };
  nm = nm.trim();
  let rootnm = '', chordnm = '';
  if ( rootkey==undefined ) rootkey = 60;
  let fch = nm.toUpperCase().substring(0,1);
  switch ( fch ){
    case "I":   case "V":
      [ rootnm, chordnm] = splitPrefix( nm, "IViv" );
      let sd = roman[ rootnm.toUpperCase() ];
      rootkey = scDegToKeyNum( sd );
      break;
    case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '#':
      [ rootnm, chordnm ] = splitPrefix( nm, "1234567#b" );
      rootkey = scDegToKeyNum( rootnm );
      break;
    case 'A': case 'B': case 'C': case 'D': case 'E': case 'F': case 'G':
      [ rootnm, chordnm ] = splitPrefix( nm, "ABCDEFGabcdefg#b" );
      rootkey = toKeyNum( rootnm );
      break;
    default: 
      err( `toChord: unrecognized chord ${nm}`, true );
  }
  // let i = 0;
  // nm = nm + ' ';  
  // for(; i<nm.length; i++){
  //   if (!'IViv'.includes(nm[i])) break;
  // }
  // let scdeg = i==0? 0 : toSD( nm.substr(0,i));
  // let chd = nm.substr(i);
  if (chordnm.trim()=='') chordnm = 'M';
  let ntOff = (60 + rootkey % 12) - rootkey + (octave-4)*12;      // offset to shift rootkey to octave
  return toChord( chordnm, rootkey + ntOff );   // shift root key to desired octave 
}

function asNote( scdeg ){  // decode scale degree even if <0 or >7
  let scDegMap = scaleDegMap();
  let k = scDegMap[scdeg];
  if ( k!==undefined ) return k;
}

var _trk = {    // state for last decoded track
  bpb:      0,  // beatsPerBar
  tpb:      0,  // ticsPerBeat
  barTics:  0,  // tics / bar
  msTic:    0,  // msPerTic
  root:     0,  // keynum of root
  scale:    0,  // semitones of mode
  evts:     0,  // events
  mLo:      0,  // lowest melody event keynum
  mHi:      0,  // highest melody event keynum
  hLo:      0,  // lowest harmony event keynum
  hHi:      0,  // highest harmony event keynum
  maxTic:   0,  // maxTic in track
  rowMap: []    // [chdLo..ntHi] => [0..x] with .5 for non-scale notes
};

// function calcRowMap(){    // calc _trk.rowMap as [ lo..hi ] == row for keynum [0..] with .5 rows for notes outside scale
//   let lo = _trk.Lo;
//   let hi = _trk.Hi;
//   let scrows = scaleRows( _trk.scale );   
//   // _trk.root  = keynum of scale root (60..71) which corresponds to semitone 0 in scale[]
//   // find scale semitone for lo 
//   let loroot = _trk.root;  
//   while ( loroot > lo ) loroot -= 12;
//   let scidx = lo - loroot;    // lo as semitone idx within scale
//   let rws= [], oct = 0;
//   for (let i = lo; i <= hi; i++ ){
//     scrw = scrows[scidx];
//     rws[ i ] = { inscale: scrw.inscale, rw: scrw.rw + oct, key:i,  deg: scrw.scdeg };
//     scidx++;
//     if ( scidx > 11 ){
//       scidx = 0;
//       oct += 12;
//     }
//   }
//   _trk.rowMap = rws;
// }
function trackLoHi(){
  let mLo = _trk.mLo, mHi = _trk.mHi;
  let hLo = _trk.hLo, hHi = _trk.hHi;
  
  return [ mLo < hLo? mLo : hLo, mHi > hHi? mHi : hHi  ];
}
function maxTic(){ 
  return _trk.maxTic;
}
// function trackRowMap(){ // return track row map
//   debugger;
//   calcRowMap();
//   return _trk.rowMap;
// }
function evalMelody( track, octave ){
  let tic = 0;
  let mseq = track.melody.join(' ').split(' ');
  tic = 0;
  for ( let n of mseq ){
    if (n=='') continue;
    if (n[0]=='|'){
      let bar = parseFloat(n.substr(1));
      let mtic = (bar-1) * _trk.barTics;
      if ( tic != mtic )
        msg( `melody ${n} at tic ${tic} not ${mtic}` );
    } else {
        let [tics,scdeg] = n.split(':');
        if ( scdeg==undefined ) debugger;
        tics = Number(tics);
        if ( scdeg.toLowerCase() != 'r' ){
          let n = asNote( scdeg );  // n in octave 4
          if (isNaN(n)) debugger; 
          n += (octave-4)*12;     // shift to specified octave
          _trk.evts.push( { t:tic, nt: n, d:tics, sd: scdeg } );
          if ( n < _trk.mLo ) _trk.mLo = n;
          if ( n > _trk.mHi ) _trk.mHi = n;
        }
        tic += tics;
    }
    if ( tic > _trk.maxTic ) _trk.maxTic = tic;
  }
}
function evalHarmony( track, octave ){
  let tpb = _trk.tpb;
  let tic = 0;
  let chdseq = track.chords.join(' ').split(' ');
  for ( let c of chdseq ){
    c = c.trim();
    if (c[0]=='|'){
      let mtic = (parseFloat(c.substr(1))-1) *_trk.barTics;
      if ( tic != mtic )
        msg( `chords ${c} at tic ${tic} not ${mtic}` );
    } else if ( c.indexOf(':')>=0 ) {
        let [tics,chordname] = c.split(':');
        tics = Number( tics );
        if ( chordname != 'r' ){
          let chd = asChord( chordname );
          chd = chd.map( v => v+(octave-4)*12 );
          _trk.evts.push( { t: Number(tic), chord: chd, d: tics, nm: chordname } );
          for ( let n of chd ){
            if ( n < _trk.hLo ) _trk.hLo = n;
            if ( n > _trk.hHi ) _trk.hHi = n;
          }
          tic += tics;
        } else {
          tic += tics;
        }
    } 
    else err( `unrecognized harmony: ${c}`);
    if ( tic > _trk.maxTic ) _trk.maxTic = tic;
  }
}
function evalTrack( song, track, mOct, hOct ){  // calc events for song & track
  if (mOct==undefined) mOct = 4;
  if (hOct==undefined) hOct = 3;
  
  _trk.bpb = song.beatsPerBar;
  let tpb = _trk.tpb = Number( song.ticsPerBeat );
  _trk.msTic = 60000 / song.tempo / tpb;
  _trk.barTics = _trk.bpb * tpb;
  _trk.root = toKeyNum( song.root );
  setScale( song.mode, _trk.root );
  //_trk.scale = toScale( song.mode, _trk.root );

  _trk.evts = [];
  let tic = 0;
  _trk.mLo = 127;
  _trk.mHi = 0;
  _trk.hLo = 127;
  _trk.hHi = 0;
  _trk.maxTic = 0;

  evalMelody( track, mOct );
  evalHarmony( track, hOct );
  _trk.evts.sort( (a,b) => (a.t - b.t) );
  return _trk;
}
module.exports = { trackNames, findTrack, evalTrack, trackLoHi, asChord, maxTic  };
// const { trackNames, findTrack, evalTrack, trackLoHi, asChord, maxTic  } = require( './etrack.js' );
