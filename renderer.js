
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
var piano = JZZ.input.Kbd({at: 'piano', from: 'C3', to: 'C7', 
  wl:100, ww:28, bl:66, bw:16, onCreate: function(){
  this.getBlackKeys().setStyle({color:'#fff'});
  this.getKey('C5').setInnerHTML('<span class=inner>Z</span>');
  this.getKey('C#5').setInnerHTML('<span class=inner>S</span>');
  this.getKey('D5').setInnerHTML('<span class=inner>X</span>');
  this.getKey('D#5').setInnerHTML('<span class=inner>D</span>');
  this.getKey('E5').setInnerHTML('<span class=inner>C</span>');
  this.getKey('F5').setInnerHTML('<span class=inner>V</span>');
  this.getKey('F#5').setInnerHTML('<span class=inner>G</span>');
  this.getKey('G5').setInnerHTML('<span class=inner>B</span>');
  this.getKey('G#5').setInnerHTML('<span class=inner>H</span>');
  this.getKey('A5').setInnerHTML('<span class=inner>N</span>');
  this.getKey('A#5').setInnerHTML('<span class=inner>J</span>');
  this.getKey('B5').setInnerHTML('<span class=inner>M</span>');
}});

// Enable keyboard input
JZZ.input.ASCII({
  Z:'C5', S:'C#5', X:'D5', D:'D#5', C:'E5', V:'F5', G:'F#5', B:'G5', H:'Ab5', N:'A5', J:'Bb5', M:'B5'
}).connect(piano);

var _midiOut = null;

// JZZ() engine must be started after jazz-midi-electron is initialized
require('jazz-midi-electron')().then(function() {
    // var midiin = JZZ.gui.SelectMidiIn({ at: 'selectmidiin', none: 'HTML Piano' });
    // _midiOut = JZZ.gui.SelectMidiOut({ at: 'selectmidiout', none: 'No MIDI Out' });
    // midiin.connect(piano);
    _midiOut = JZZ().openMidiOut('Microsoft GS Wavetable Synth');
    piano.connect(_midiOut);
    // Open the default MIDI Out port:
    //_midiOut.select();
    const stat = document.getElementById('status')
});

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
function playCurrChord( midi, dur ){
    const root = em.toKeyNum( selRoot.value );
    const chd = em.toChord( selChd.value, root );
    playChord( midi, chd );
}
function playChord( midi, chd, dur ){
    dur = dur==undefined? 1000 : dur;
    const information = document.getElementById('info')
    information.innerText = `playChord( [${chd}], ${dur} )`
    
    for ( var i=0; i<chd.length; i++ ){
      midi.noteOn(0, chd[i], 120 ).wait(dur).noteOff(0, chd[i]);
    }
}


const selRoot = document.getElementById('selectRoot');
const selChd = document.getElementById('selectChord');
const selSong = document.getElementById('selectSong');
const selTrk = document.getElementById('selectTrack');
const selEvts = document.getElementById('selectEvents');
const selWhich = document.getElementById('selWhich');
const btnPlay = document.getElementById('btnPlay');

const em = require('./emuse.js');
em.test();
loadSelect( selChd, em.chordNames() );

const sngs = require('./songs.js');
var _song, _track, _evtList, _msPerTic;
   
selRoot.addEventListener("change", function() {
    playCurrChord( _midiOut, 500);
});
selChd.addEventListener("change", function() {
      playCurrChord( _midiOut, 500);
});
selSong.addEventListener("change", function() {
  _song = sngs.findSong( selSong.value );
  loadSelect( selTrk, sngs.trackNames( _song ));
});
function evalTrack(){
  _song = sngs.findSong( selSong.value );
  _msPerTic = 60000 / _song.tempo / _song.ticsPerBeat;

  _track = sngs.findTrack( _song, selTrk.value );
  _evtList = sngs.trackEvents( _song, _track, selWhich.value ); 
  
  var evts = _evtList.map( x => `${x.t}: ${x.chord!=undefined? em.asStr(x.chord) : em.asStr(x.nt)} for ${x.d}` );
  loadSelect( selEvts, evts );
}
selTrk.addEventListener("change", function() {
  evalTrack();
});
selWhich.addEventListener("change", function() {
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
  sngs.playEvents( _midiOut, _evtList );
});

loadSelect( selSong, sngs.songNames() );
_song = sngs.findSong( selSong.value );
loadSelect( selTrk, sngs.trackNames( _song ));

