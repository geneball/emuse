const { toChord, toKeyNum, toScale, scaleRows } = require("./emuse");

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
  console.log(`toSD: unrec ${s}`);
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
  if (chd=='') chd = 'M';
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
  while ( scdeg < 1 ){ scdeg+=8; off-=12; }
  while ( scdeg > 8 ){ scdeg-=8; off+=12; }
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
  chdOff:   0,  // chord notes offset
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
    rws[ i ] = { inscale: scrw.inscale, rw: scrw.rw + oct, deg: scrw.deg };
    scidx++;
    if ( scidx > 11 ){
      scidx = 0;
      oct += 7;
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
function trackRowMap(){
  calcRowMap();
  return _trk.rowMap;
}
function evalTrack( song, track, playwhich, melOffset, chdOffset ){  // calc events for song & track, Chords/Melody/Both, chord notes offset
  _trk.bpb = song.beatsPerBar;
  let tpb = _trk.tpb = Number( song.ticsPerBeat );
  _trk.msTic = 60000 / song.tempo / tpb;
  _trk.barTics = _trk.bpb * tpb;
  _trk.root = toKeyNum( song.root );
  _trk.scale = toScale( song.mode, _trk.root );
  _trk.melOff = melOffset? melOffset : 0;
  _trk.chdOff = chdOffset? chdOffset : 0;

  _trk.evts = [];
  let tic = 0;
  _trk.Lo = 127;
  _trk.Hi = 0;
  _trk.maxTic = 0;
  if (playwhich=='Chords' || playwhich=='Both'){
    let chdseq = track.chords.join(' ').split(' ');
    for ( let c of chdseq ){
      if (c[0]=='|'){
        let mtic = (parseFloat(c.substr(1))-1) *_trk.barTics;
        if ( tic != mtic )
          console.log( `chords ${c} at tic ${tic} not ${mtic}` );
      } else {
          let [tics,chordname] = c.split(':');
          tics = Number( tics );
          if ( chordname != 'r' ){
            let chd = asChord( chordname, _trk.scale );
            chd = chd.map( x => x + _trk.chdOff );
            if ( tics % tpb != 0 ) 
              console.log( `chords: tics(${tics}) not at beat (${tpb}) ` )
            let beats = tics / tpb;
            for( let i=0; i<beats; i++ ){
              _trk.evts.push( { t: Number(tic), chord: chd, d: tpb } );
              for ( let n of chd ){
                if ( n < _trk.Lo ) _trk.Lo = n;
                if ( n > _trk.Hi ) _trk.Hi = n;
              }
              tic += tpb;
            }
          } else {
            tic += tics;
          }
      }
    }
    if ( tic > _trk.maxTic ) _trk.maxTic = tic;
  }
  if (playwhich=='Melody' || playwhich=='Both'){
    let mseq = track.melody.join(' ').split(' ');
    tic = 0;
    for ( let n of mseq ){
      if (n[0]=='|'){
        let bar = parseFloat(n.substr(1));
        let mtic = (bar-1) * _trk.barTics;
        if ( tic != mtic )
          console.log( `melody ${n} at tic ${tic} not ${mtic}` );
      } else {
          let [tics,scdeg] = n.split(':');
          tics = Number(tics);
          if ( scdeg.toLowerCase() != 'r' ){
            let n = asNote( scdeg, _trk.scale ) + _trk.melOff;
            if (isNaN(n)) debugger; 
            _trk.evts.push( { t:tic, nt: n, d:tics } );
            if ( n < _trk.Lo ) _trk.Lo = n;
            if ( n > _trk.Hi ) _trk.Hi = n;
          }
          tic += tics;
      }
    }
    if ( tic > _trk.maxTic ) _trk.maxTic = tic;
  }
  //console.log( evts );

  if ( playwhich=='Both' ){
    _trk.evts.sort( (a,b) => (a.t - b.t) );
  }
  return _trk;
}


var _plyr = {
  midi:  null,
  chordVelocity: 80,
  melodyVelocity: 120,

  stop: false,
  msStart: 0,   // tstamp of playing start
  hist: []      // list of events actually played
};
function playEvent( evt ){
  var dur = evt.d * _trk.msTic - 2; 
  let till = evt.t * _trk.msTic;
  setTimeout( function() { 
    if (_plyr.stop ) return;
    if (evt.nt !=undefined ){
      _plyr.hist.push( {tic: ((Date.now()-_plyr.msStart)/_trk.msTic).toFixed(1), nt:evt.nt})
      _plyr.midi.noteOn( 0, evt.nt, _plyr.melodyVelocity ).wait( dur ).noteOff( 0, evt.nt );
    } else if (evt.chord !=undefined ){
      for ( var i=0; i<evt.chord.length; i++ ){
        _plyr.hist.push( {tic: ((Date.now()-_plyr.msStart)/_trk.msTic).toFixed(1), nt:evt.chord[i]})
        _plyr.midi.noteOn( 0, evt.chord[i], _plyr.chordVelocity ).wait( dur ).noteOff( 0, evt.chord[i] );
    }  
  }}, till );
}
function setPlayer( midi ){
  _plyr.midi = midi;
}
function startPlay( midi ){
  stopPlay();

  _plyr.stop = false;
  _plyr.msStart = Date.now();
  _plyr.hist = [];
 
  for ( let e of _trk.evts ){
    playEvent( e );
  }
}
function stopPlay(){
  _plyr.stop = true;
  _plyr.midi.allNotesOff(0);
}
function setVelocity( chd, mel ){
  _plyr.chordVelocity = chd;
  _plyr.melodyVelocity = mel;
}

module.exports = { trackNames, findTrack, evalTrack, trackRowMap, trackLoHi, maxTic,
  setPlayer, playEvent, startPlay, stopPlay, setVelocity };