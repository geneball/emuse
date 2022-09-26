
const information = document.getElementById('info')
const stat = document.getElementById('status')

const { shell } = require('electron');

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
}


const selRoot = document.getElementById('selectRoot');
const selChd = document.getElementById('selectChord');
const selSong = document.getElementById('selectSong');
const selTrk = document.getElementById('selectTrack');
const selEvts = document.getElementById('selectEvents');
const selWhich = document.getElementById('selWhich');
const selChdOff = document.getElementById('selChdOff');
const btnPlay = document.getElementById('btnPlay');

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

function playCurrChord( midi, dur ){
  const root = em.toKeyNum( selRoot.value );
  const chd = em.toChord( selChd.value, root );
  playChord( midi, chd );
}
function playChord( midi, chd, dur ){
  dur = dur==undefined? 1000 : dur;
  for( let i=0; i<keyspan.length; i++ ){
    keyspan[i].classList.remove( 'on' );
  }
  for( let i=0; i<chd.length; i++ ){
    let k = keyspan[ chd[i] ];
    k.classList.add( 'on' );
  }
//  const information = document.getElementById('info')
//  information.innerText = `playChord( [${chd}], ${dur} )`
  
  for ( var i=0; i<chd.length; i++ ){
    midi.noteOn(0, chd[i], 120 ).wait(dur).noteOff(0, chd[i]);
  }
}

loadSelect( selChd, em.chordNames() );

const sngs = require('./songs.js');
var _song, _track, _evtList, _msPerTic;
var _lowestNote, _highestNote;
   
selRoot.addEventListener("change", function() {
    playCurrChord( _midiOut, 500);
});
selChd.addEventListener("change", function() {
      playCurrChord( _midiOut, 500);
});
selSong.addEventListener("change", function() {
  _song = sngs.findSong( selSong.value );
  loadSelect( selTrk, sngs.trackNames( _song ));
  selRoot.select( _song.root );
});
function evalTrack(){
  _song = sngs.findSong( selSong.value );
  _msPerTic = 60000 / _song.tempo / _song.ticsPerBeat;
  _chordOffset = Number( selChdOff.value );

  _track = sngs.findTrack( _song, selTrk.value );
  _evtList = sngs.trackEvents( _song, _track, selWhich.value, _chordOffset ); 
  _lowestNote = 127;
  _highestNote = 0;
  for ( var e of _evtList ){
    if ( e.nt != undefined && e.nt < _lowestNote )
      _lowestNote = e.nt;
    else if ( e.chord != undefined ){
      for ( var nt of e.chord )
        if ( nt < _lowestNote )
          _lowestNote = nt;
    }
  }
  stat.innerText = `Lowest: ${_lowestNote}`;
  showEventList();

  var evts = _evtList.map( x => `${x.t}: ${x.chord!=undefined? em.asStr(x.chord) : em.asStr(x.nt)} * ${x.d}` );
  loadSelect( selEvts, evts );
  btnPlay.innerText = 'Play';
}
function showEventList(){
  let html = '';  
  let root = em.toKeyNum( _song.root );
  let scale = em.toScale( _song.mode, root );
  let sp = 1;
  for (let i=_lowestNote; i<=_highestNote; i++){
    html += `<div class="r0 sp${sp}"></div>`;
    sp = sp==7? 1 : sp+1;
  }
  divRows.innerHTML = html;
}
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
  if (evt.nt !=undefined )
    _midiOut.noteOn(0, evt.nt, 120).wait( evt.d * _msPerTic ).noteOff( 0,evt.nt );
  if (evt.chord !=undefined )
    playChord( _midiOut, evt.chord, evt.d * _msPerTic );
});
btnPlay.addEventListener("click", function(){
  if ( btnPlay.innerText=='Play' ){
    btnPlay.innerText = 'Stop';
    sngs.playEvents( _midiOut, _evtList );
  } else {
    btnPlay.innerText = 'Play';
    sngs.stopPlay();
  }
});

loadSelect( selSong, sngs.songNames() );
_song = sngs.findSong( selSong.value );
loadSelect( selTrk, sngs.trackNames( _song ));
evalTrack();
