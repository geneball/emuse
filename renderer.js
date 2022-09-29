
const information = document.getElementById('info')
const stat = document.getElementById('status')

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
  z:'C4', s:'C#4', x:'D4', d:'D#4', c:'E4', v:'F4', g:'F#4',
  b:'G4', h:'G#4', n:'A4', j:'A#4', m:'B4', ',':'C5',
  l:'C#5', '.':'D5', ';':'D#5', '/':'E5'
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


const selRoot = document.getElementById('selectRoot');
const selMode = document.getElementById('selectMode');
const selChd = document.getElementById('selectChord');
const selSong = document.getElementById('selectSong');
const selTrk = document.getElementById('selectTrack');
const selEvts = document.getElementById('selectEvents');
const selWhich = document.getElementById('selWhich');
const selChdOff = document.getElementById('selChdOff');
const btnPlay = document.getElementById('btnPlay');

const divBars = document.getElementById('bars');
const divLabels = document.getElementById("labels");
const divRows = document.getElementById('rows');
const divTics = document.getElementById('tics');
const divNotes = document.getElementById('notes');
const divChords = document.getElementById('chords');

const em = require('./emuse.js');
//em.test();
var keyspan = [];
for ( oct of [3,4,5,6,7]){
  for ( let i=0; i<nts.length; i++ ){
    let kn = em.toKeyNum(`${nts[i]}${oct}`);
    keyspan[kn] = document.getElementById(`${ids[i]}${oct}`);
  }
}
for( const k in keybd ){
  keyspan[ em.toKeyNum(keybd[k]) ].innerHTML = k;
}//keyspan[60].innerHTML = "Z";

function clearKeyMarks(){
  for( let ksp of keyspan ){
    if ( ksp!=null && ksp!=undefined ) 
      ksp.classList.remove('on');
  }
}
function setKeyMark( nt ){
  let k = keyspan[ nt ];
  k.classList.add( 'on' );
}
function playCurrChord( midi, dur ){
  const root = em.toKeyNum( selRoot.value );
  const chd = em.toChord( selChd.value, root );
  sngs.playEvent( {t:0, chord: chd, d: dur} );
}
loadSelect( selChd, em.chordNames() );

const sngs = require('./songs.js');
sngs.setPlayer( _midiOut );
var _song, _track, _evtList;
   
selRoot.addEventListener("change", function() {
    playCurrChord( _midiOut, 500);
});
selChd.addEventListener("change", function() {
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
  _song = sngs.findSong( selSong.value );
  loadSelect( selTrk, sngs.trackNames( _song ));
  setKey( _song );
  selTrk.dispatchEvent( new Event('change') );
});
function evalTrack(){
  _song = sngs.findSong( selSong.value );
  _msPerTic = 60000 / _song.tempo / _song.ticsPerBeat;
  _chordOffset = Number( selChdOff.value );

  _track = sngs.findTrack( _song, selTrk.value );
  _evtList = sngs.trackEvents( _song, _track, selWhich.value, _chordOffset ); 
  showEventList();

  var evts = _evtList.map( x => `${x.t}: ${x.chord!=undefined? em.asStr(x.chord) : em.asStr(x.nt)} * ${x.d}` );
  loadSelect( selEvts, evts );
  btnPlay.innerText = 'Play';
}
var _rows = [];
var _notes = [];
var _chords = [];
function showEventList(){
  let html = '';  
  let root = em.toKeyNum( _song.root );
  let scale = em.toScale( _song.mode, root );
  let [ lo, hi ] = sngs.trackLoHi();
  let maxtic = sngs.maxTic();

  stat.innerText = `Notes: ${lo}..${hi}  Tics: 0..${maxtic} `;
  let rows = sngs.trackRowMap();
  let rw = 0; sp = 1;
  for (let i=lo; i<=hi; i++){
    let rw = rows[i];
    if ( rw.inscale ){   // nt i is in scale
      html += `<div class="r${rw.rw} sp${rw.deg}"></div>`;
      _rows[ rw.rw ] = `R${rw.rw}: ${i}=${em.asStr(i)} = ${em.asDeg(rw.deg)}`;
    }
  }
  divRows.innerHTML = html;

  html = '';
  let tic = 0;
  let tpb =  _song.ticsPerBeat;
  let tpm = _song.beatsPerBar * tpb;
  for( tic=0; tic <= maxtic; tic += tpb ){
    let  mrk = 'tic';
    if ( (tic % tpm)==0 ){
      mrk = 'bar';
      let m = (tic / tpm) + 1;
      html += `<div class="r18 t${tic}">${m}</div>`;
    }
     html += `<div class="${mrk} t${tic}"></div>`;
  }
  divTics.innerHTML =  html;

  html = '';
  let chtml = '', cnt=0, ccnt=0;
  for ( let e of _evtList ){
     if ( e.nt != undefined ){
       let rw = rows[ e.nt ];
       if (rw==undefined) debugger;
       if ( rw.inscale ){
          html += `<div id="nt${cnt}" class="r${rw.rw} n${rw.deg} t${e.t} ln${e.d}"></div>`;
       } else {
          let deg = Math.trunc(rw.deg);
          let brow = Math.trunc(rw.rw);
          html += `<div id="nt${cnt}" class="r${brow}p n${deg}${deg+1} t${e.t} ln${e.d}"></div>`;
       }
       _notes[cnt] = `${cnt}: ${em.asDeg(rw.deg)}`;
       cnt++;
     } else if ( e.chord != undefined ){
       for ( i=0; i < e.chord.length; i++ ){
         let nt = e.chord[ i ];
         let rw = rows[ nt ];
      //   if (rw==undefined) rw = { rw:-1, deg: -1};
         chtml += `<div id="chd${ccnt}-${i}" class="r${rw.rw} n${rw.deg} t${e.t} ln${e.d}"></div>`;
       }
       ccnt++;
     }
   }
   divNotes.innerHTML = html;
   divChords.innerHTML = chtml;
}

divBars.addEventListener("click", function(evt){
  let tgt = evt.target;
  let tip = `#${tgt.id}.${tgt.className} `;
  for ( let cl of tgt.className.split(' ')){
    if (cl[0]=='r'){
      tip += _rows[ cl.substring(1) ];
    }
  }
  information.innerHTML = tip;


});
selTrk.addEventListener("change", function() {
  evalTrack();
});
selWhich.addEventListener("change", function() {
  evalTrack();
});
selChdOff.addEventListener("change", function() {
  evalTrack();
});
selEvts.addEventListener("change", function() {
  var evt = _evtList[ selEvts.selectedIndex ];
  sngs.playEvent( {t:0, nt: evt.nt, chord: evt.chord, d: evt.d } );
});
btnPlay.addEventListener("click", function(){
  if ( btnPlay.innerText=='Play' ){
    btnPlay.innerText = 'Stop';
    sngs.startPlay( );
  } else {
    btnPlay.innerText = 'Play';
    sngs.stopPlay();
  }
});

selChdOff.value = -12;
loadSelect( selSong, sngs.songNames() );
selSong.dispatchEvent( new Event('change') );

// _song = sngs.findSong( selSong.value );
// setKey( _song );
// loadSelect( selTrk, sngs.trackNames( _song ));
// evalTrack();
