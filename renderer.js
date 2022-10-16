
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
function radioValue( nm ){    // return value of radio group name='nm'
  let els = document.getElementsByName( nm );
  for (let i=0; i<els.length; i++ ){
    if ( els[i].checked ) return els[i].value;
  }
  return null;
}

const em = require('./emuse.js');
//em.test();
const et= require('./etrack.js');
const  eg = require("./egene");
const  { saveTrack, findSong, songNames } = eg;

const selRoot     = document.getElementById('selectRoot');
const selMode     = document.getElementById('selectMode');
const scaleDegrees= document.getElementById('scaleDegrees');
const divChdBtns  = document.getElementById('chdButtons');
const selSong     = document.getElementById('selectSong');
const selTrk      = document.getElementById('selectTrack');
const selEvts     = document.getElementById('selectEvents');

// melody dialog
const adjMelody   = document.getElementById("adjMelody");
const m_dialog    = document.getElementById( "melodyCtrl" );
const m_velocity  = document.getElementById('m_velocity');
const m_mute      = document.getElementById('m_mute');
const m_close     = document.getElementById('m_close');

// harmony dialog
const adjHarmony  = document.getElementById("adjHarmony");
const h_dialog    = document.getElementById( "harmonyCtrl" );
const h_velocity  = document.getElementById('h_velocity');
const h_mute      = document.getElementById('h_mute');
const h_close     = document.getElementById('h_close');

const btnPlay     = document.getElementById('btnPlay');
const btnSave     = document.getElementById('btnSave');

const divBars     = document.getElementById('bars');
const divBeats    = document.getElementById('beats');
const divLabels   = document.getElementById("labels");
const divRows     = document.getElementById('rows');
const divTics     = document.getElementById('tics');
const divNotes    = document.getElementById('notes');
const divChords   = document.getElementById('chords');

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

function asBtnHtml( nms ){
  let html = '';
  for ( let n of nms ){
    html += `<button>${n}</button>`;
  }
  return html;
}

var _chdRoot;
function initChordUI(){
  divChdBtns.innerHTML = `<div id='triads'>${asBtnHtml(em.chordNames(3))}</div>` +
  `<div id='quartads'>${asBtnHtml(em.chordNames(4))}</div>` +
  `<div id='quintads'>${asBtnHtml(em.chordNames(5))}</div>`;
  divChdBtns.addEventListener("click", function(e){
    const root = em.toKeyNum( selRoot.value );
    const chd = em.toChord( e.target.innerText, _chdRoot );
    playEvent( { t:0, chord: chd, d: 800 } );
  });
  scaleDegrees.addEventListener('click', (ev) => {
    let id = ev.target.id;
    for ( let i=0; i< scaleDegrees.childNodes.length; i++ ){
      let btn = scaleDegrees.childNodes[i];
      removeClass( btn, 'root' );
    }
    addClass( ev.target, 'root' );
    _chdRoot = Number( ev.target.id.substr(3));
  });
}

var _song, _track;  
selRoot.addEventListener("change", function() {
    playCurrChord( _midiOut, 500);
});
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
  let beats = Math.trunc( tics / _song.ticsPerBeat );  // full beats
  let fr = tics % _song.ticsPerBeat;   //  beats / tpb
  let s = beats > 0? `${beats}` : '';
  s += fr==0? '' : ` ${fr}/${_song.ticsPerBeat}`;
  return `|${bar}.${s}`;
}
var _ntcls = {
  '1':'n1',  '1#':'n12',  '2':'n2',  '2#':'n23',  '3':'n3', '3#':'n34',  
  '4':'n4',  '4#':'n45',  '5':'n5',  '5#':'n56',  '6':'n6', '6#':'n67',  '7':'n7', '7#':'n71' 
};
function showEventList(){     // build rows display from _trk.evts
  clearKeyMarkers();
  let html = '';  
  let root = em.toKeyNum( _song.root );
  let scale = em.toScale( _song.mode, root );
  let [ lo, hi ] = et.trackLoHi();
  let maxtic = et.maxTic();

  stat.innerText = `Notes: ${lo}..${hi}  Tics: 0..${maxtic} `;
  let rows = et.trackRowMap();
  let schtml = '';
  for ( let sd=lo; sd<lo+12 && sd<=hi; sd++ ){
    schtml += `<button id="scd${sd}"> ${rows[sd].deg}</button>`;
  }
  scaleDegrees.innerHTML = schtml;
  addClass( document.querySelector(`#scd${lo}`), 'root' );
  _chdRoot = lo;


  let sp = 1, lblRw = 0;;
  for (let i=lo; i<=hi; i++){   // backgrounds for rows
    let rw = rows[i];
    let r = `r${rw.rw}`;
    if ( rw.inscale ){   // nt i is in scale
      html += `<div id="rw${rw.rw}" class="${r} rw sp${rw.deg}"></div>`;
      _rowdefs[r] = { nt: i, deg: rw.deg, k:rw.key };
    } else {
      html += `<div id="rw${rw.rw}" class="${r} rw spx"></div>`;
      _rowdefs[r] = { nt: i, deg: rw.deg, k:rw.key };
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
  for ( let iE=0; iE<_trk.evts.length; iE++ ){
    let e = _trk.evts[iE]; 
     if ( e.nt != undefined ){
       let rw = rows[ e.nt ];
       if (rw==undefined) debugger;
      //  if ( rw.inscale ){
          html += `<div id="nt${cnt}" class="r${rw.rw} rw ${_ntcls[ rw.deg ]} t${e.t} ln${e.d} e${iE}"></div>`;
      //  } else {
      //     let deg = Math.trunc(rw.deg);
      //     let brow = Math.trunc(rw.rw);
      //     html += `<div id="nt${cnt}" class="r${brow} rw n${deg}${deg+1} t${e.t} ln${e.d} e${iE}"></div>`;
      //  }
//       _notes[cnt] = `mel[${cnt}] ${asBar(e.t)}: ${em.asStr(e.nt)} (${em.asDeg(rw.deg)}) for ${inBeats(e.d)}`;
       cnt++;
     } else if ( e.chord != undefined ){
       chtml += `<div id="chd${ccnt}">`;
       for ( i=0; i < e.chord.length; i++ ){
         let nt = e.chord[ i ];
         let rw = rows[ nt ];
      //   if (rw==undefined) rw = { rw:-1, deg: -1};
         chtml += `<div id="chd${ccnt}-${i}" class="r${rw.rw} rw ${_ntcls[rw.deg]} t${e.t} ln${e.d} e${iE}"></div>`;
          let chdname = em.chordName( e.chord, true );
          if ( chdname != lastChd ){
            lastChd = chdname;
            lblhtml += `<div class="r${lblRw+1} t${e.t}">${lastChd}</div>`;
          }
       //   _chords[ccnt] = `chd[${ccnt}] ${asBar(e.t)}: ${em.asStr(e.chord)} for ${inBeats(e.d)}`;
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
function evalTrack(){
  resetPlyr( 0 );
  _song = eg.findSong( selSong.value );
  _track = et.findTrack( _song, selTrk.value );
  _trk = et.evalTrack( _song, _track, 'Both', _plyr.melodyOffset, _plyr.chordOffset ); 
  showEventList();

  var evts = _trk.evts.map( x => `${x.t}: ${x.chord!=undefined? em.asStr(x.chord) : em.asStr(x.nt)} * ${x.d}` );
  loadSelect( selEvts, evts );
  btnPlay.innerText = 'Play';
}
// var _rows = [];
var _notes = [];
var _chords = [];
var _rowdefs = {};


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
  _plyr.melodyOffset = Number( radioValue( 'm_oct' )); 
  _plyr.chordOffset = Number( radioValue( 'h_oct' ) );
  _plyr.melodyVelocity = Number( m_velocity.value );
  _plyr.chordVelocity = Number( h_velocity.value );
  _plyr.melodyMute = m_mute.checked;
  _plyr.harmonyMute = h_mute.checked;
  clearKeyMarkers();
}
function asNtChd( e ){
  if ( e.nt != undefined ) return em.asStr(e.nt);
  if ( e.chord != undefined ) return em.chordName(e.chord, true);
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
  
  if ( e==null ) return;
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
      if ( e.nt != undefined && !_plyr.m_mute ){
        setNoteOn( tic, e.nt, e.d, _plyr.melodyVelocity );
      }
      if ( e.chord != undefined && !_plyr.h_mute  ){
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

divBars.addEventListener("click", function(evt){    // click on Notes scroll
  let tgt = evt.target;
  let rw = null, iEvt = null;
  for ( let cl of tgt.className.split(' ') ){ 
    if (  _rowdefs[cl] != undefined ) rw = _rowdefs[cl];
    if ( cl[0]=='e' ) iEvt = Number( cl.substring(1));
  }

  let tip = `#${tgt.id}.${tgt.className} `;
  let eCls = tgt.className.substring(tgt.className.indexOf(' e'));
  let e = _trk.evts[ eCls.substring(2) ];
  if ( rw!=null ) tip = `${em.asStr(rw.nt)} (${rw.deg}) `;
  if (tgt.id.startsWith('nt')){
    //tip += _notes[tgt.id.substring(2)];
    tip = `m${iEvt} ${asBar(e.t)} ${em.asStr(e.nt)} (${rw.deg}) for ${inBeats(e.d)}`;
    selectEl( tgt );
    playEvent( { t:0, nt: e.nt, d: e.d } );
  } else if (tgt.id.startsWith('chd')){
    let ich = tgt.id.substring(3).split('-')[0];
    tip += _chords[ich];
    tip = `c${iEvt} ${asBar(e.t)} ${em.chordName(e.chord,true)} for ${inBeats(e.d)}`;
    selectEl( tgt.parentElement );
    playEvent( { t:0, chord: e.chord, d: e.d } );
  } else if (tgt.id.startsWith('beat')){
    setTic( Number(tgt.id.substring(4))*_song.ticsPerBeat );
    return;
  } 
  msg( tip );
});

selTrk.addEventListener("change", function() {      // change Track
  evalTrack();
});
selEvts.addEventListener("change", function() {     // change Event
  var evt = _trk.evts[ selEvts.selectedIndex ];
  playEvent( {t:0, nt: evt.nt, chord: evt.chord, d: evt.d } );
});

btnPlay.addEventListener("click", function(){     // Play
  if ( btnPlay.innerText=='Play' ){
    btnPlay.innerText = 'Stop';
    startPlay();
  } else {
    btnPlay.innerText = 'Play';
      stopPlay();
  }
});
btnSave.addEventListener("click", function(){     // Save
  saveTrack( _song, _track, _trk ); 
  msg( `Saved track '${_track.nm}' of '${_song.nm}'` );
});


function initDialogs(){
  // Melody/Harmony Adjust dialogues
  var m_octs = document.querySelectorAll('input[type=radio][name="m_oct"]');
  m_octs.forEach( radio => radio.addEventListener('change', () => { evalTrack(); }));
  m_velocity.addEventListener("change", function() {
    evalTrack();
  });
  adjMelody.addEventListener('click', ev => {
    m_dialog.showModal();
  });
  m_mute.addEventListener('change', (ev) =>{
    _plyr.m_mute = m_mute.checked;
  });
  m_close.addEventListener('click', (ev) =>{ m_dialog.close(); })

  var h_octs = document.querySelectorAll('input[type=radio][name="h_oct"]');
  h_octs.forEach( radio => radio.addEventListener('change', () => { evalTrack(); }));
  h_velocity.addEventListener("change", function() {
    evalTrack();
  });
  adjHarmony.addEventListener('click', ev => {
    h_dialog.showModal();
  });
  h_mute.addEventListener('change', (ev) =>{
    _plyr.h_mute = h_mute.checked;
  });
  h_close.addEventListener('click', (ev) =>{ h_dialog.close(); })
}

initChordUI();
loadSelect( selMode, em.modeNames() );
loadSelect( selRoot,  ['C','C#','Db', 'D','D#', 'Eb','E','F','F#','Gb', 'G','G#','Ab','A','A#','Bb','B'] );

initDialogs();

if ( typeof eg.songNames == 'function' )
  loadSelect( selSong, eg.songNames() );
selSong.dispatchEvent( new Event('change') );

