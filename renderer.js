
const information = document.getElementById('info')
const stat = document.getElementById('status')

const { msg } = require( './msg.js' );
const { shell } = require('electron');
const { info } = require('jzz');

var JZZ = require('jzz');
require('jzz-synth-tiny')(JZZ);
require('jzz-input-kbd')(JZZ);
require('jzz-gui-select')(JZZ);

// Register Web Audio synth to have at least one MIDI-Out port
JZZ.synth.Tiny.register('Web Audio');

// Create HTML piano
let nts = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
let ids = ['kC','kCS','kD','kDS','kE','kF','kFS','kG','kGS','kA','kAS','kB'];

var piano = JZZ.input.Kbd({at: 'piano', from: 'C3', to: 'C7', 
  wl:100, ww:28, bl:66, bw:16, onCreate: function(){
  this.getBlackKeys().setStyle({color:'#fff'});
  for ( oct of [3,4,5,6,7]){
    for ( let i=0; i<nts.length; i++ ){
      let ht = `<span class=inner id=${ids[i]}${oct}></span>`;
      this.getKey(`${nts[i]}${oct}`).setInnerHTML(ht);
      if( oct==7 ) break; // after C7
    }
  }
}});

// Enable keyboard input
//JZZ.input.ASCII({
//  Z:'C5', S:'C#5', X:'D5', D:'D#5', C:'E5', V:'F5', G:'F#5', B:'G5', H:'Ab5', N:'A5', J:'Bb5', M:'B5'
//}).connect(piano);

var _midiOut = null;

// JZZ() engine must be started after jazz-midi-electron is initialized
var keybd ={
 // Z:'C5', S:'C#5', X:'D5', D:'D#5', C:'E5', V:'F5', G:'F#5', B:'G5', H:'Ab5', N:'A5', J:'Bb5', M:'B5'
 '48':'C3', '49':'C#3', '50':'D3', '51':'D#3', '52':'E3', '53':'F3', '54':'F#3',
 '55':'G3', '56':'G#3', '57':'A3', '58':'A#3', '59':'B3', 
    z:'C4',    s:'C#4',    x:'D4',    d:'D#4',    c:'E4',    v:'F4',    g:'F#4',
    b:'G4',    h:'G#4',    n:'A4',    j:'A#4',    m:'B4',  
  ',':'C5',    l:'C#5',  '.':'D5',  ';':'D#5',  '/':'E5',  "'":'F5', '78':'F#5', 
 '79':'G5', '80':'G#5', '81':'A5', '82':'A#5', '83':'B5',
 '84':'C6', '85':'C#6', '86':'D6', '87':'D#6', '88':'E6', '89':'F6', '90':'F#6',
 '91':'G6', '92':'G#6', '93':'A6', '94':'A#6', '95':'B6', '96':'C7'
};
JZZ.input.ASCII(keybd).connect(piano);
    // var midiin = JZZ.gui.SelectMidiIn({ at: 'selectmidiin', none: 'HTML Piano' });
    // _midiOut = JZZ.gui.SelectMidiOut({ at: 'selectmidiout', none: 'No MIDI Out' });
    // midiin.connect(piano);
    _midiOut = JZZ().openMidiOut('Microsoft GS Wavetable Synth');
    piano.connect(_midiOut);
    // Open the default MIDI Out port:
    //_midiOut.select();
    //const stat = document.getElementById('status')
//});

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

const em = require('./emuse.js');
//em.test();
const et= require('./etrack.js');
const  eg = require("./egene");
const  { saveTrack, findSong, songNames } = eg;

const selRoot = document.getElementById('selectRoot');
const selMode = document.getElementById('selectMode');
const divChdBtns = document.getElementById('chdButtons');
const selSong = document.getElementById('selectSong');
const selTrk = document.getElementById('selectTrack');
const selEvts = document.getElementById('selectEvents');
const selWhich = document.getElementById('selWhich');
const selMelVel = document.getElementById('selMelVel');
const selChdVel = document.getElementById('selChdVel');
const selMelOff = document.getElementById('selMelOff');
const selChdOff = document.getElementById('selChdOff');
const btnPlay = document.getElementById('btnPlay');
const btnSave = document.getElementById('btnSave');

const divBars = document.getElementById('bars');
const divBeats = document.getElementById('beats');
const divLabels = document.getElementById("labels");
const divRows = document.getElementById('rows');
const divTics = document.getElementById('tics');
const divNotes = document.getElementById('notes');
const divChords = document.getElementById('chords');

var keyspan = [];
for ( oct of [3,4,5,6,7]){
  for ( let i=0; i<nts.length; i++ ){
    let kn = em.toKeyNum(`${nts[i]}${oct}`);
    keyspan[kn] = document.getElementById(`${ids[i]}${oct}`);
  }
}
for( const k in keybd ){
  keyspan[ em.toKeyNum(keybd[k]) ].innerHTML = k;
}

function removeClass( el, cls ){
  if ( el==null || el==undefined ) return;

  if ( el.classList.contains( cls ) ){
    el.classList.remove( cls );
  }
}
function addClass( el, cls ){
  if ( el==null || el==undefined ) return; //debugger;

  if ( el.classList.contains( cls ) ) return;
  el.classList.add( cls );
}
function clearKeyMarkers(){
  for (let ks of keyspan ){
    removeClass( ks, 'on' );
  }
}
// function playCurrChord( midi, dur ){
//   const root = em.toKeyNum( selRoot.value );
//   const chd = em.toChord( selChd.value, root );
//   playEvent( {t:0, chord: chd, d: dur} );
// }
function playEvent( e ){
  clearKeyMarkers();
  if ( e.nt != undefined ){
    setNoteOn( e.t, e.nt, e.d, _plyr.melodyVelocity );
  }
  if ( e.chord != undefined ){
    for ( let nt of e.chord ){
      setNoteOn( e.t, nt, e.d, _plyr.chordVelocity );
    }
  }
  setTimeout( ()=>{ 
    _midiOut.allNotesOff(0);
    }, 800 );
}
//loadSelect( selChd, em.chordNames() );

function asBtnHtml( nms ){
  let html = '';
  for ( let n of nms ){
    html += `<button>${n}</button>`;
  }
  return html;
}
divChdBtns.innerHTML = `<div id='triads'>${asBtnHtml(em.chordNames(3))}</div>` +
`<div id='quartads'>${asBtnHtml(em.chordNames(4))}</div>` +
`<div id='quintads'>${asBtnHtml(em.chordNames(5))}</div>`;
divChdBtns.addEventListener("click", function(e){
  const root = em.toKeyNum( selRoot.value );
  const chd = em.toChord( e.target.innerText, root );
  playEvent( { t:0, chord: chd, d: 800 } );
});

var _song, _track;  
selRoot.addEventListener("change", function() {
    playCurrChord( _midiOut, 500);
});
// selChd.addEventListener("change", function() {
//       playCurrChord( _midiOut, 500);
// });
function setKey( song ){
  let root = song.root;
  let mode = song.mode;
  for (let i=0; i<selRoot.options.length; i++){
    let txt = selRoot.options[i].innerText.trim();
    if ( txt==root || (root.length>1 && txt.includes(root)))
      selRoot.options[i].selected = true;
  }
  selMode.value = mode;
}
selSong.addEventListener("change", function() {
  _song = eg.findSong( selSong.value );
  loadSelect( selTrk, et.trackNames( _song ));
  setKey( _song );
  selTrk.dispatchEvent( new Event('change') );
});
function evalTrack(){
  resetPlyr( 0 );
  _song = eg.findSong( selSong.value );
  _track = et.findTrack( _song, selTrk.value );
  _trk = et.evalTrack( _song, _track, selWhich.value, _plyr.melodyOffset, _plyr.chordOffset ); 
  showEventList();

  var evts = _trk.evts.map( x => `${x.t}: ${x.chord!=undefined? em.asStr(x.chord) : em.asStr(x.nt)} * ${x.d}` );
  loadSelect( selEvts, evts );
  btnPlay.innerText = 'Play';
}
var _rows = [];
var _notes = [];
var _chords = [];
var _rowdefs = {};
function inBeats( tics ){
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
function asBar( tics ){
  let tpm = _song.ticsPerBeat * _song.beatsPerBar;
  let bar = Math.trunc( tics/tpm )+1;
  return `|${bar}.${tics % tpm}`;
}
function showEventList(){
  clearKeyMarkers();
  let html = '';  
  let root = em.toKeyNum( _song.root );
  let scale = em.toScale( _song.mode, root );
  let [ lo, hi ] = et.trackLoHi();
  let maxtic = et.maxTic();

  stat.innerText = `Notes: ${lo}..${hi}  Tics: 0..${maxtic} `;
  let rows = et.trackRowMap();
  let rw = 0; sp = 1, lblRw = 0;;
  for (let i=lo; i<=hi; i++){   // backgrounds for rows
    let rw = rows[i];
    let r = `r${rw.rw}`;
    if ( rw.inscale ){   // nt i is in scale
      html += `<div id="rw${rw.rw}" class="${r} rw sp${rw.deg}"></div>`;
      _rows[ rw.rw ] = `R${rw.rw}: ${i}=${em.asStr(i)} = ${em.asDeg(rw.deg)}`;
      _rowdefs[r] = { nt: em.asStr(i), deg: em.asDeg(rw.deg) };
        // lblRw = rw.rw+1;
    } else {
      html += `<div id="rw${rw.rw}" class="${r} rw spx"></div>`;
      _rows[ rw.rw ] = `R${rw.rw}: ${i}=${em.asStr(i)} = ${em.asDeg(rw.deg)}`;
    //  r = `r${Math.trunc(rw.rw)}p`;  // between scale degrees
      _rowdefs[r] = { nt: em.asStr(i), deg: em.asDeg(rw.deg) };
    }
    lblRw = rw.rw+1;
  }
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
      lblhtml += `<div class="r${lblRw} t${tic} ln2">${m}</div>`;
    }
    html += `<div class="${mrk} t${tic}"></div>`;
    beathtml += `<div id="beat${bt}" class="r${lblRw+2} bt${tpb} t${tic}"></div>`;
    bt++;
  }
  divBeats.innerHTML = beathtml;
  divTics.innerHTML =  html;
  divLabels.innerHTML += lblhtml;

  html = '';
  lblhtml = '';
  let chtml = '', cnt=0, ccnt=0, lastChd = '';
  for ( let e of _trk.evts ){
     if ( e.nt != undefined ){
       let rw = rows[ e.nt ];
       if (rw==undefined) debugger;
       if ( rw.inscale ){
          html += `<div id="nt${cnt}" class="r${rw.rw} rw n${rw.deg} t${e.t} ln${e.d}"></div>`;
       } else {
          let deg = Math.trunc(rw.deg);
          let brow = Math.trunc(rw.rw);
          html += `<div id="nt${cnt}" class="r${brow} rw n${deg}${deg+1} t${e.t} ln${e.d}"></div>`;
       }
       _notes[cnt] = `mel[${cnt}] ${asBar(e.t)}: ${em.asStr(e.nt)} (${em.asDeg(rw.deg)}) for ${inBeats(e.d)}`;
       cnt++;
     } else if ( e.chord != undefined ){
       chtml += `<div id="chd${ccnt}">`;
       for ( i=0; i < e.chord.length; i++ ){
         let nt = e.chord[ i ];
         let rw = rows[ nt ];
      //   if (rw==undefined) rw = { rw:-1, deg: -1};
         chtml += `<div id="chd${ccnt}-${i}" class="r${rw.rw} rw n${rw.deg} t${e.t} ln${e.d}"></div>`;
          let chdname = em.chordName( e.chord, true );
          if ( chdname != lastChd ){
            lastChd = chdname;
            lblhtml += `<div class="r${lblRw+1} t${e.t}">${lastChd}</div>`;
          }
          _chords[ccnt] = `chd[${ccnt}] ${asBar(e.t)}: ${em.asStr(e.chord)} for ${inBeats(e.d)}`;
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

var _plyr = {
  midi:  null,
  melodyVelocity: 128,
  chordVelocity:  48,
  melodyOffset:   0,
  chordOffset:    -12,
  stop:           false,
  currBeat:       0,
  currEvtIdx:     0,   // index of next e in _trk.evts[]
  msStart:        0,   // tstamp of playing start
  msMax:          0,   // maxTic in ms
  notesOn:        [],  // list of notes currently on
  hist:           [],   // list of events actually played
  selEl:          null  // currently selected element
};
function resetPlyr( bt ){
  _plyr.stop = false;
  _plyr.notesOn = [];
  if ( bt != undefined ){
    _plyr.currBeat = bt;
  }
  _plyr.currEvtIdx = 0;
  _plyr.notesOn = [];
  _plyr.hist = [];
  _plyr.melodyOffset = Number( selMelOff.value );
  _plyr.chordOffset = Number( selChdOff.value );
  _plyr.melodyVelocity = Number( selMelVel.value );
  _plyr.chordVelocity = Number( selChdVel.value );
  clearKeyMarkers();
}
function asNtChd( e ){
  if ( e.nt != undefined ) return em.asStr(e.nt);
  if ( e.chord != undefined ) return em.chordName(e.chord);
}
function setTic( tic ){
  let bt = Math.trunc( tic / _song.ticsPerBeat );
  let divBeat = document.getElementById( `beat${_plyr.currBeat}` );
  removeClass( divBeat, 'on' );
  let eIdx = _plyr.currEvtIdx;
  if ( _plyr.currBeat < bt ) eIdx = 0;
  _plyr.currEvtIdx = -1;
  let e = null;
  for( let i= eIdx; i<_trk.evts.length; i++ ){
    e = _trk.evts[ i ];
    if ( e.t >= tic ){ // next event
      _plyr.currEvtIdx = i;
      break;
    }
  }
  if ( _plyr.currEvtIdx < 0 ){ 
    bt = 0;     // restart
  };
  
  if ( e==null ) debugger;
  stat.innerHTML = `${asBar(tic)} { ${asBar(e.t)} ${asNtChd(e)} ${inBeats(e.d)} }`;
  
  _plyr.currBeat = bt;
  divBeat = document.getElementById( `beat${bt}` );
  divBeat.scrollIntoView();
  if ( bt+5 <= _trk.maxTic/_trk.tpb ) 
    document.getElementById( `beat${bt+5}`).scrollIntoView();

  addClass( divBeat, 'on' );
}
function addHist( msg ){
  let currMs = (Date.now()-_plyr.msStart)/_trk.msTic;
  _plyr.hist.push( { ms:`${currMs.toFixed(2)}`, m: msg } );
}
function setNoteOn( tic, nt, d, vel ){
  _plyr.notesOn.push( { t:tic, nt: nt, d: d });
  _midiOut.noteOn( 0, nt, vel);
  addClass( keyspan[ nt ], 'on' );
  addHist( `noteOn(${nt} ${d})`);
}
function setNoteOff( nt, idx ){
  _midiOut.noteOff( 0, nt );
  removeClass( keyspan[ nt ], 'on' );
  addHist( `noteOff( ${nt} )`);
}
function startPlay( midi ){
  resetPlyr();  // leave currBeat intact
  _plyr.msStart = Date.now();
  _plyr.msMax = _plyr.msStart + _trk.maxTic * _trk.msTic;
  var beat = _plyr.currBeat;
  let tic = beat * _song.ticsPerBeat;

  function playtic(){
    addHist( asBar(tic) );
    setTic( tic );
    let ntson = _plyr.notesOn;
    _plyr.notesOn = [];
    for ( let n of ntson ){
      let nnt = { t: n.t, nt: n.nt, d: n.d-1 };  // one less tic
      if (nnt.d==0){
        setNoteOff( nnt.nt, i );
      } else {
        _plyr.notesOn.push( nnt );
      }
    }
  
    for ( let i=_plyr.currEvtIdx; i<_trk.evts.length; i++ ){
      let e = _trk.evts[ i ];
      if ( e==null || e.t > tic ) break;
      if ( e.nt != undefined ){
        setNoteOn( tic, e.nt, e.d, _plyr.melodyVelocity );
      }
      if ( e.chord != undefined ){
        for ( let nt of e.chord ){
          setNoteOn( tic, nt, e.d, _plyr.chordVelocity );
        }
      }
    }
    tic++;
    if ( _plyr.stop || tic > _trk.maxTic ){
      btnPlay.innerText = 'Play';
      if ( tic > _trk.maxTic ) _plyr.currBeat = 0;
    } else {
      setTimeout( playtic, _trk.msTic );
    }
  }
  setTimeout( playtic, _trk.msTic )
}
function stopPlay( ){
  _plyr.stop = true;
  _midiOut.allNotesOff(0);
  _plyr.notesOn = [];
  btnPlay.innerText = 'Play';
}
function selectEl( el ){
  removeClass( _plyr.selEl, 'sel' );
  _plyr.selEl = el;
  addClass( el, 'sel' );
}
divBars.addEventListener("click", function(evt){
  let tgt = evt.target;
  let rw = null;
  for ( let cl of tgt.className.split(' ') )
    if (  _rowdefs[cl] != undefined ){
      rw = _rowdefs[cl];
    }

  let tip = `#${tgt.id}.${tgt.className} `;
  if ( rw!=null ) tip = `${rw.nt} (${rw.deg}) `;
  if (tgt.id.startsWith('nt')){
    tip += _notes[tgt.id.substring(2)];
    selectEl( tgt );
  } else if (tgt.id.startsWith('chd')){
    let ich = tgt.id.substring(3).split('-')[0];
    tip += _chords[ich];
    selectEl( tgt.parentElement );
  } else if (tgt.id.startsWith('beat')){
    setTic( Number(tgt.id.substring(4))*_song.ticsPerBeat );
    return;
  } 
  msg( tip );
});
selTrk.addEventListener("change", function() {
  evalTrack();
});
selWhich.addEventListener("change", function() {
  evalTrack();
});
selMelOff.addEventListener("change", function() {
  evalTrack();
});
selChdOff.addEventListener("change", function() {
  evalTrack();
});
selMelVel.addEventListener("change", function() {
  evalTrack();
});
selChdVel.addEventListener("change", function() {
  evalTrack();
});
selEvts.addEventListener("change", function() {
  var evt = _trk.evts[ selEvts.selectedIndex ];
  playEvent( {t:0, nt: evt.nt, chord: evt.chord, d: evt.d } );
});
btnPlay.addEventListener("click", function(){
  if ( btnPlay.innerText=='Play' ){
    btnPlay.innerText = 'Stop';
    startPlay();
  } else {
    btnPlay.innerText = 'Play';
      stopPlay();
  }
});
btnSave.addEventListener("click", function(){
  saveTrack( _song, _track, _trk ); 
  msg( `Saved track '${_track.nm}' of '${_song.nm}'` );
});

if ( typeof eg.songNames == 'function' )
  loadSelect( selSong, eg.songNames() );
selSong.dispatchEvent( new Event('change') );

