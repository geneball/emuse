const { toChord, toKeyNum, toScale, scaleRows } = require("./emuse");
const { msg, err } = require('./msg.js');

function trackNames( song ){
  return song.tracks.map( x => x.nm );
}
function findTrack( song, nm ){
  for ( const t of song.tracks )
    if (t.nm.toLowerCase()==nm.trim().toLowerCase()) return t;
  return null;
}
function toSD( s ){
  var roman = [ 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii' ];
  for (let i=0; i<roman.length; i++)
    if ( s.toLowerCase() == roman[i] ) return i;
  msg(`toSD: unrec ${s}`);
  return 0;
}
function scDeg( nt, root, scale ){ // return scDeg (1..7) from keynum given root & scale

}
function toRow( nt, lowest, scale ){ // map keynum to row, given scale & lowest note


}
function asChord( nm, scale ){    // decode e.g. 'Im' or 'iii6(9)'
  let i = 0;
  nm = nm + ' ';  
  for(; i<nm.length; i++){
    if (!'IViv'.includes(nm[i])) break;
  }
  let scdeg = i==0? 0 : toSD( nm.substr(0,i));
  let chd = nm.substr(i);
  if (chd.trim()=='') chd = 'M';
  return toChord( chd, scale[scdeg]);
}
function asNote( scdeg, scale ){  // decode scale degree even if <0 or >7
  let off = 0, adj = 0;
  let lch = scdeg[scdeg.length-1];
  if ( lch=='#' || lch=='b' ){
    scdeg = scdeg.substr(0,scdeg.length-1);
    adj = lch=='#'? 1 : -1;
  }
  scdeg = Number( scdeg );
  while ( scdeg < 1 ){ scdeg+=7; off-=12; }
  while ( scdeg > 7 ){ scdeg-=7; off+=12; }
  return scale[scdeg-1] + off + adj;
}

var _trk = {    // state for last decoded track
  bpb:      0,  // beatsPerBar
  tpb:      0,  // ticsPerBeat
  barTics:  0,  // tics / bar
  msTic:    0,  // msPerTic
  root:     0,  // keynum of root
  scale:    0,  // semitones of mode
  evts:     0,  // events
  Lo:       0,  // lowest event keynum
  Hi:       0,  // highest event keynum
  maxTic:   0,  // maxTic in track
  rowMap: []    // [chdLo..ntHi] => [0..x] with .5 for non-scale notes
};

function calcRowMap(){    // calc _trk.rowMap as [ lo..hi ] == row for keynum [0..] with .5 rows for notes outside scale
  let lo = _trk.Lo;
  let hi = _trk.Hi;
  let scrows = scaleRows( _trk.scale );   
  // _trk.root  = keynum of scale root (60..71) which corresponds to semitone 0 in scale[]
  // find scale semitone for lo 
  let loroot = _trk.root;  
  while ( loroot > lo ) loroot -= 12;
  let scidx = lo - loroot;    // lo as semitone idx within scale
  let rws= [], oct = 0;
  for (let i = lo; i <= hi; i++ ){
    scrw = scrows[scidx];
    rws[ i ] = { inscale: scrw.inscale, rw: scrw.rw + oct, key:i,  deg: scrw.scdeg };
    scidx++;
    if ( scidx > 11 ){
      scidx = 0;
      oct += 12;
    }
  }
  _trk.rowMap = rws;
}
function trackLoHi(){
  return [ _trk.Lo, _trk.Hi ];
}
function maxTic(){ 
  return _trk.maxTic;
}
function trackRowMap(){ // return track row map
  calcRowMap();
  return _trk.rowMap;
}
function evalMelody( track ){
  let tic = 0;
  let mseq = track.melody.join(' ').split(' ');
  tic = 0;
  for ( let n of mseq ){
    if (n[0]=='|'){
      let bar = parseFloat(n.substr(1));
      let mtic = (bar-1) * _trk.barTics;
      if ( tic != mtic )
        msg( `melody ${n} at tic ${tic} not ${mtic}` );
    } else {
        let [tics,scdeg] = n.split(':');
        tics = Number(tics);
        if ( scdeg.toLowerCase() != 'r' ){
          let n = asNote( scdeg, _trk.scale );
          if (isNaN(n)) debugger; 
          _trk.evts.push( { t:tic, nt: n, d:tics } );
          if ( n < _trk.Lo ) _trk.Lo = n;
          if ( n > _trk.Hi ) _trk.Hi = n;
        }
        tic += tics;
    }
    if ( tic > _trk.maxTic ) _trk.maxTic = tic;
  }
}
function evalHarmony( track ){
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
          let chd = asChord( chordname, _trk.scale );

          // while ( tics > 0 ){
          //   let dur = tics > tpb? tpb : tics; 
          //   tics -= dur;
          _trk.evts.push( { t: Number(tic), chord: chd, d: tics } );
          for ( let n of chd ){
            if ( n < _trk.Lo ) _trk.Lo = n;
            if ( n > _trk.Hi ) _trk.Hi = n;
          }
          tic += tics;
 //         }
        } else {
          tic += tics;
        }
    } 
    else err( `unrecognized harmony: ${c}`)
  }
}
function evalTrack( song, track ){  // calc events for song & track
  _trk.bpb = song.beatsPerBar;
  let tpb = _trk.tpb = Number( song.ticsPerBeat );
  _trk.msTic = 60000 / song.tempo / tpb;
  _trk.barTics = _trk.bpb * tpb;
  _trk.root = toKeyNum( song.root );
  _trk.scale = toScale( song.mode, _trk.root );
 
  _trk.evts = [];
  let tic = 0;
  _trk.Lo = 127;
  _trk.Hi = 0;
  _trk.maxTic = 0;

  evalMelody( track );
  evalHarmony( track );
  _trk.evts.sort( (a,b) => (a.t - b.t) );
  return _trk;
}
module.exports = { trackNames, findTrack, evalTrack, trackRowMap, trackLoHi, maxTic  };