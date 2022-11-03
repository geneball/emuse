
const { msg, statusMsg } = require("./msg.js");
const { shell } = require('electron');

const { toKeyNum, toScale, setScale, scaleRows, modeNames, chordNames, chordName, emStr } = require( './emuse.js' );
const { midiOutDev, clearKeyMarkers, setKeyScale, rmClassFrChildren, addClass } = require( './piano.js' );

const { trackNames, findTrack, evalTrack, trackLoHi, maxTic  } = require('./etrack.js');
const { saveTrack, loadTrack, findSong, songNames, toEvents  } = require("./egene");
const { resetPlyr, startPlay, stopPlay, setTic, mNt, hNt, setChordRoot,  chordRoot, setChordType, adjInversion, plyrVal, playEvent, selectEl } = require( './eplyr.js' );

function loadSelect( sel, nms ){
  if ( sel==null )  debugger;
  if ( !nms instanceof Array ) debugger;
   var i, L = sel.options.length - 1;
   for(i = L; i >= 0; i--) {
      sel.remove(i);
   }
   for (var nm of nms){
    var opt = document.createElement('option');
    opt.value = opt.innerHTML = nm;
    sel.appendChild(opt);  
   }
   sel.selectedIndex = 0;
}
function radioValue( nm ){    // return value of radio group name='nm'
  let els = document.getElementsByName( nm );
  for (let i=0; i<els.length; i++ ){
    if ( els[i].checked ) return els[i].value;
  }
  return null;
}


const selRoot     = document.getElementById('selectRoot');
const selMode     = document.getElementById('selectMode');
const scaleDegrees= document.getElementById('scaleDegrees');
const chd_inv     = document.getElementById('chdInv');
const divChdBtns  = document.getElementById('chdButtons');
const selSong     = document.getElementById('selectSong');
const selTrk      = document.getElementById('selectTrack');
const selEvts     = document.getElementById('selectEvents');

// tempo options
const bpb         = document.getElementById( 'bpb' );
const tpb         = document.getElementById( 'tpb' );
const tempo       = document.getElementById( 'tempo' );

// melody options
const m_velocity  = document.getElementById('m_velocity');
const m_octave    = document.getElementById('m_octave');
const m_tune      = document.getElementById('m_tune');
const m_rhythm    = document.getElementById('m_rhythm');


// harmony options
const h_velocity  = document.getElementById('h_velocity');
const h_octave    = document.getElementById('h_octave');
const h_chords    = document.getElementById('h_chords');
const h_rhythm    = document.getElementById('h_rhythm');

const btnPlay     = document.getElementById('btnPlay');
const btnSave     = document.getElementById('btnSave');

const divBars     = document.getElementById('bars');
const divBeats    = document.getElementById('beats');
const divLabels   = document.getElementById("labels");
const divRows     = document.getElementById('rows');
const divTics     = document.getElementById('tics');
const divNotes    = document.getElementById('notes');
const divChords   = document.getElementById('chords');
//const btnsExtract = document.getElementById('extract');

/* ***************** chordUI   **********************  */
function asBtnHtml( nms ){
  let html = '';
  for ( let n of nms ){
    html += `<button>${n}</button>`;
  }
  return html;
}
function clearChordBtns(){
  rmClassFrChildren( document.getElementById('triads'),   'root' );
  rmClassFrChildren( document.getElementById('quartads'), 'root' );
  rmClassFrChildren( document.getElementById('quintads'), 'root' );
}
function initChordUI(){
  divChdBtns.innerHTML = `<div id='triads'>${asBtnHtml(chordNames(3))}</div>` +
  `<div id='quartads'>${asBtnHtml(chordNames(4))}</div>` +
  `<div id='quintads'>${asBtnHtml(chordNames(5))}</div>`;
  divChdBtns.addEventListener("click", function(ev){
    if ( ev.target.nodeName != 'BUTTON' ) return;
    clearChordBtns();

    addClass( ev.target, 'root' );
    setChordType( ev.target.innerText );
    chd_inv.value = 0;
  });
  scaleDegrees.addEventListener('click', (ev) => {
    let id = ev.target.id;
    if ( ev.target.nodeName != 'BUTTON' ) return;
    rmClassFrChildren( scaleDegrees, 'root' );
    
    addClass( ev.target, 'root' );
    let key = Number( ev.target.id.substr(3));  // e.g. scd50..scd71
    setChordRoot( key );
    chd_inv.value = 0;
  });
  chd_inv.addEventListener('change', (ev) => {
    adjInversion( chd_inv.value );
  });
}

/* **********************  Song & Track UI  *******************  */
var _song, _track, _trk, _evts;  
selRoot.addEventListener("change", function() {  setKey( selRoot.value, selMode.value ); });
selMode.addEventListener("change", function() {  setKey( selRoot.value, selMode.value ); });

function setKey( root, mode ){
  clearChordBtns();
  rmClassFrChildren( scaleDegrees, 'root' );
  selRoot.value = root;
  
  selMode.value = mode;

  let rkey = toKeyNum( root );    // root key in octave 4
  setScale( mode, rkey );
  let rows = scaleRows( );
  let schtml = '';

  for ( let sd=rkey; sd<rkey+12; sd++ ){
    let rw = rows[sd];
    schtml += `<button id="scd${sd}" class="${rw.chdcls}"> ${rw.scdeg} ${emStr((sd), true)}</button>`;
  }  
  scaleDegrees.innerHTML = schtml;
  setKeyScale( rows );      // piano scale coloring
  addClass( scaleDegrees.childNodes[0], 'root' );
  addClass( divChdBtns.childNodes[0].childNodes[0], 'root' );
  setChordRoot( rkey, true );
  setChordType( 'M', true );
}
selSong.addEventListener("change", function() {
  _song = findSong( selSong.value );
  loadSelect( selTrk, trackNames( _song ));
  setKey( _song.root, _song.mode );

  selTrk.dispatchEvent( new Event('change') );
});
selTrk.addEventListener("change", function() {      // change Track
  refreshTrack();
});
selEvts.addEventListener("change", function() {     // change Event
  var evt = _evts[ selEvts.selectedIndex ];
  playEvent( {t:0, nt: evt.nt, chord: evt.chord, d: evt.d } );
});
function initValue( ctl, nm, val, def ){
  if ( val==undefined ) val = def;
  if ( ctl.value==undefined )
    ctl.innerText = plyrVal( nm, val );
  else
    ctl.value = plyrVal( nm, val );
}
function getEvents(){
  if ( !m_tune.checked || !m_rhythm.checked || !h_chords.checked || !h_rhythm.checked ){
    let style = '';
    if ( m_tune.checked  ) style += ',notes';
    if ( m_rhythm.checked ) style += ',mRhythm';
    if ( h_chords.checked ) style += ',chords';
    if ( h_rhythm.checked ) style += ',hRhythm';
    _evts = toEvents( _gene, style.substring(1) );
  }
}
function refreshTrack(){     // evaluate new track
  resetPlyr( 0 );
  _song = findSong( selSong.value );
  _track = findTrack( _song, selTrk.value );
  // parse events from song_def.json, then save track as song_track_gene.json
  _trk = evalTrack( _song, _track, m_octave.value, h_octave.value ); 
  _evts = _trk.evts;
  saveTrack( _song, _track, _trk );
  _gene = loadTrack( _song, _track );

  initValue( bpb, 'bpb', _song.beatsPerBar, 4 );
  initValue( tpb, 'tpb', _song.ticsPerBeat, 4 );
  initValue( tempo, 'tempo', _song.tempo, 80 );
  plyrVal( 'msTic', 60000 / plyrVal('tempo') / plyrVal( 'tpb' ) );

  m_octave.value = _song.melodyOctave == undefined? 4 : _song.melodyOctave;
  h_octave.value = _song.harmonyOctave == undefined? 3 : _song.harmonyOctave;
 
  getEvents();  // recalc events given  melody/harmony tune/rhythm settings

  showEventList(  );

  var evts = _evts.map( x => `${x.t}: ${x.chord!=undefined? emStr(x.chord,true) : emStr(x.nt,true)} * ${x.d}` );
  loadSelect( selEvts, evts );
  btnPlay.innerText = 'Play';
}

function reEval(){
  _trk = evalTrack( _song, _track, m_octave.value, h_octave.value ); 
  _evts = _trk.evts;
  getEvents();
  showEventList();  
}

function initDialogs(){
  tempo.addEventListener( 'change', (ev)=> {
     plyrVal('tempo', tempo.value);
     plyrVal( 'msTic', 60000 / plyrVal('tempo') / plyrVal( 'tpb' ) );
  });
  // Melody/Harmony Adjust dialogues
  m_velocity.addEventListener("change", (ev) => plyrVal( 'm_velocity', m_velocity.value ) );
  m_octave.addEventListener("change", (ev) => {  reEval();  });
  m_tune.addEventListener('change',     (ev) => {  refreshTrack(); } );
  m_rhythm.addEventListener('change',   (ev) => {  refreshTrack(); } ); //plyrVal( 'm_rhythm', m_rhythm.checked );  } );
 
  h_velocity.addEventListener("change", (ev) => {  plyrVal( 'h_velocity', h_velocity.value );  } );
  h_octave.addEventListener("change",   (ev) => { reEval(); });
  h_chords.addEventListener('change',     (ev) => {  refreshTrack(); } ); //plyrVal( 'h_chords', h_chords.checked );  } );
  h_rhythm.addEventListener('change',     (ev) => {  refreshTrack(); } ); //plyrVal( 'h_rhythm', h_rhythm.checked );  } );
}
btnPlay.addEventListener("click", (ev) => {     // Play
  if ( btnPlay.innerText=='Play' ){
    btnPlay.innerText = 'Stop';
    let { maxtic: maxtic } = eventRange( _evts );
    startPlay( _evts, _trk.tpb, maxtic );
  } else {
    btnPlay.innerText = 'Play';
    stopPlay();
  }
});
btnSave.addEventListener("click", (ev) => {     // Save
  saveTrack( _song, _track, _trk ); 
  msg( `Saved track '${_track.nm}' of '${_song.nm}'` );
});

/*  ********************* Note scroll #bars display ************************ */
function inBeats( tics ){     // return tics as string in beats
  let bts = Math.trunc( tics / _song.ticsPerBeat );
  let fr = tics % _song.ticsPerBeat;
  if ( fr==0 ) return bts==1? '1 beat' : `${bts} beats`;
  let denom = _song.ticsPerBeat;
  for (let i=2; i < denom; i++){
    if ( (fr%i)==0 && (denom % i)==0 ) { fr /= i; denom /= i; }
  }
  if (bts==0) return `${fr}/${denom} beat`;
  return `${bts} ${fr}/${denom} beats`;
}
function asBar( tics ){    // return tics as string in bars
  let tpm = _song.ticsPerBeat * _song.beatsPerBar;
  let bar = Math.trunc( tics/tpm )+1;
  tics = tics % tpm;   // tics past bar
  return `|${bar}.${(tics/tpm).toFixed(2)}`;

  // let beats = Math.trunc( tics / _song.ticsPerBeat );  // full beats
  // let fr = tics % _song.ticsPerBeat;   //  beats / tpb
  // let s = beats > 0? `${beats}` : '';
  // s += fr==0? '' : ` ${fr}/${_song.ticsPerBeat}`;
  // return `|${bar}.${s}`;
}
// var _ntcls = {
//   '1':'n1',  '1#':'n12',  '2':'n2',  '2#':'n23',  '3':'n3', '3#':'n34',  
//   '4':'n4',  '4#':'n45',  '5':'n5',  '5#':'n56',  '6':'n6', '6#':'n67',  '7':'n7', '7#':'n71' 
// };
// var _chdcls = {
//   '1':'ch1',  '1#':'ch12',  '2':'ch2',  '2#':'ch23',  '3':'ch3', '3#':'ch34',
//   '4':'ch4',  '4#':'ch45',  '5':'ch5',  '5#':'ch56',  '6':'ch6', '6#':'ch67',  '7':'ch7', '7#':'ch71' 
// };
// var _rowcls = {
//   '1':'sp1',  '1#':'sp2',  '2':'sp1',  '2#':'sp2',  '3':'sp1', '3#':'sp2',
//   '4':'sp1',  '4#':'sp2',  '5':'sp1',  '5#':'sp2',  '6':'sp1', '6#':'sp2',  '7':'sp1', '7#':'sp2' 
// };

// var _rowdefs = {};
var _row0key;
function rowInfo( rw ){
  if (isNaN(rw)) debugger;
  return scaleRows()[ rw + _row0key ];
}
function eventRange( evts ){
  let lo = 128, hi = 0, maxtic = 0;
  for ( let e of evts ){
    if ( e.t + e.d > maxtic )
      maxtic = e.t + e.d;
    if ( e.nt!=undefined ){
      if ( e.nt < lo ) lo = e.nt;
      if ( e.nt > hi ) hi = e.nt;
    }
    if ( e.chord != undefined ){
      for ( let nt of e.chord ){
        if ( nt < lo ) lo = nt;
        if ( nt > hi ) hi = nt;
      }
    }
  }
  return { lo: lo, hi: hi, maxtic: maxtic };
}
function showEventList(){     // build rows display from _evts
  clearKeyMarkers();
  let html = '';  
  let root = toKeyNum( _song.root );
  //setScale( _song.mode, root );
  let { lo:lo, hi: hi, maxtic: maxtic } = eventRange( _evts );
 // let maxtic = maxTic();

  statusMsg( `Notes: ${lo}..${hi}  Tics: 0..${maxtic} ` );
  let rows = scaleRows(); 
  
  //let sp = 1; //, lblRw = 0;
  _row0key = lo;
  for (let i=lo; i<=hi; i++){   // backgrounds for rows
    let rw = rows[i];
    let r = i-lo; //`r${rw.rw}`;
    html += `<div id="rw${r}" class="r${r} rw ${rw.rowcls}"></div>`;
    // _rowdefs[r] = { nt: i, deg: rw.deg, k:rw.key };
    // lblRw = r+1;
  }
  let lblRw = hi-lo+2;
  divRows.innerHTML = html;
  // set up label bar
  divLabels.innerHTML = `<div id="labelRow" class="lbl r${lblRw}"></div>`;
  let divLabelRow = document.getElementById( 'labelRow' );
 // divLabelRow.style.height = '40px';
  let bx = divLabelRow.getBoundingClientRect();
  let barsbx = divBars.getBoundingClientRect();

  // adjust overall height
  divBars.style.height = `${barsbx.bottom - bx.top}px`;

  html = '';
  let lblhtml = '';
  let beathtml = '';
  let tic = 0;
  let tpb =  _song.ticsPerBeat;
  let tpm = _song.beatsPerBar * tpb;
  let bt = 0;
  for( tic=0; tic <= maxtic; tic += tpb ){    // beat & measure bars + measure labels
    let  mrk = 'tic';
    if ( (tic % tpm)==0 ){
      mrk = 'bar';
      let m = (tic / tpm) + 1;
      lblhtml += `<div class="kbar r${lblRw} t${tic} ln2">${m}</div>`;
    }
    html += `<div class="${mrk} t${tic}"></div>`;
    beathtml += `<div id="beat${bt}" class="kbt r${lblRw+2} bt${tpb} t${tic}"></div>`;
    bt++;
  }
  divBeats.innerHTML = beathtml;
  divTics.innerHTML =  html;
  divLabels.innerHTML += lblhtml;

  html = '';
  lblhtml = '';
  let chtml = '', cnt=0, ccnt=0, lastChd = '';
  for ( let iE=0; iE<_evts.length; iE++ ){
    let e = _evts[iE]; 
     if ( e.nt != undefined ){
       let rw = rows[ e.nt ];
       let r = e.nt - lo;
       if (rw==undefined) debugger;
      //  if ( rw.inscale ){
          html += `<div id="nt${cnt}" class="k${e.nt} r${r} rw ${rw.ntcls} t${e.t} ln${e.d} e${iE}"></div>`;
      //  } else {
      //     let deg = Math.trunc(rw.deg);
      //     let brow = Math.trunc(rw.rw);
      //     html += `<div id="nt${cnt}" class="r${brow} rw n${deg}${deg+1} t${e.t} ln${e.d} e${iE}"></div>`;
      //  }
       cnt++;
     } else if ( e.chord != undefined ){
       chtml += `<div id="chd${ccnt}">`;
       for ( i=0; i < e.chord.length; i++ ){
         let nt = e.chord[ i ];
         let rw = rows[ nt ];
         let r = nt-lo;
      //   if (rw==undefined) rw = { rw:-1, deg: -1};
         chtml += `<div id="chd${ccnt}-${i}" class="k${nt} r${r} rw ${rw.chdcls} t${e.t} ln${e.d} e${iE}"></div>`;
          let chdname = chordName( e.chord, true );
          if ( chdname != lastChd ){
            lastChd = chdname;
            lblhtml += `<div class="kchd r${lblRw+1} t${e.t}">${lastChd}</div>`;
          }
       }
       chtml += '</div>';
       ccnt++;
     }
   }
   divLabels.innerHTML += lblhtml;
   divNotes.innerHTML = html;
   divChords.innerHTML = chtml;
   setTic(0);
}
divBars.addEventListener("click",  (evt) => {    // click on Notes scroll
  let tgt = evt.target;
  let rw = null, iEvt = null;
  let tip = `#${tgt.id}.${tgt.className} `;

  for ( let cl of tgt.className.split(' ') ){ 
    if ( cl[0]=='r' && '0123456789'.includes(cl[1])){ 
      rw = rowInfo( Number( cl.substring(1) ));
      if (rw==undefined) debugger;
      tip = `${rw.nt} (${rw.bdeg})`;
    }
    if ( cl[0]=='e' ) iEvt = Number( cl.substring(1));
  }


  let e = _evts[ iEvt ];
  if (tgt.id.startsWith('nt')){
    tip = `m${iEvt} ${asBar(e.t)} ${emStr(e.nt, false)} (${rw.bdeg}) for ${inBeats(e.d)}`;
    selectEl( tgt );
    playEvent( { t:0, nt:  e.nt, d: e.d } );
  } else if (tgt.id.startsWith('chd')){
    let ich = tgt.id.substring(3).split('-')[0];
  
    tip = `c${iEvt} ${asBar(e.t)} ${chordName(e.chord,true)} ${emStr(e.chord,false)} for ${inBeats(e.d)}`;
    selectEl( tgt.parentElement );
    playEvent( { t:0, chord: e.chord, d: e.d } );
  } else if (tgt.id.startsWith('beat')){
    setTic( Number(tgt.id.substring(4))*_song.ticsPerBeat );
    return;
  } 
  msg( tip );
});

initChordUI();
loadSelect( selMode, modeNames() );
loadSelect( selRoot,  ['C','C#','Db', 'D','D#', 'Eb','E','F','F#','Gb', 'G','G#','Ab','A','A#','Bb','B'] );

initDialogs();

if ( typeof songNames == 'function' )
  loadSelect( selSong, songNames() );
selSong.dispatchEvent( new Event('change') );

