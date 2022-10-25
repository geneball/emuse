

const { msg, status, err } = require("./msg.js");
const { shell } = require('electron');
//const { info } = require('jzz');
const { 
  toKeyNum, toScale, scaleRows, modeNames, chordNames, toChord, chordName, 
	emStr, asDeg, emTest 
} = require( './emuse.js' );
const { 
  midiOutDev, markKey, clearKeyMarkers, rmClassFrChildren, addClass, removeClass 
} = require( './piano.js' );

const et= require('./etrack.js');
const eg = require("./egene");
const { saveTrack, findSong, songNames } = eg;
const { 
       resetPlyr, startPlay, stopPlay, setTic, setChordRoot, setChordType,
       plyrVal, playEvent, playChord, selectEl, setNoteOn, setNoteOff
} = require( './eplyr.js' );


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
const divChdBtns  = document.getElementById('chdButtons');
const selSong     = document.getElementById('selectSong');
const selTrk      = document.getElementById('selectTrack');
const selEvts     = document.getElementById('selectEvents');

// melody options
const m_velocity  = document.getElementById('m_velocity');
const m_octave    = document.getElementById('m_octave');
const m_tune      = document.getElementById('m_tune');
const m_rhythm= document.getElementById('m_rhythm');
// const m_rhythm    = document.getElementById('m_rhythm');
// const m_tune    = document.getElementById('m_tune');

// harmony options
const h_velocity  = document.getElementById('h_velocity');
const h_octave    = document.getElementById('h_octave');
const h_mute      = document.getElementById('h_mute');
// const h_close     = document.getElementById('h_close');

const btnPlay     = document.getElementById('btnPlay');
const btnSave     = document.getElementById('btnSave');

const divBars     = document.getElementById('bars');
const divBeats    = document.getElementById('beats');
const divLabels   = document.getElementById("labels");
const divRows     = document.getElementById('rows');
const divTics     = document.getElementById('tics');
const divNotes    = document.getElementById('notes');
const divChords   = document.getElementById('chords');

/* ***************** chordUI   **********************  */
function asBtnHtml( nms ){
  let html = '';
  for ( let n of nms ){
    html += `<button>${n}</button>`;
  }
  return html;
}
function initChordUI(){
  divChdBtns.innerHTML = `<div id='triads'>${asBtnHtml(chordNames(3))}</div>` +
  `<div id='quartads'>${asBtnHtml(chordNames(4))}</div>` +
  `<div id='quintads'>${asBtnHtml(chordNames(5))}</div>`;
  divChdBtns.addEventListener("click", function(ev){
    if ( ev.target.nodeName != 'BUTTON' ) return;
    rmClassFrChildren( document.getElementById('triads'), 'root' );
    rmClassFrChildren( document.getElementById('quartads'), 'root' );
    rmClassFrChildren( document.getElementById('quintads'), 'root' );

    addClass( ev.target, 'root' );
    setChordType( ev.target.innerText );
  });
  scaleDegrees.addEventListener('click', (ev) => {
    let id = ev.target.id;
    if ( ev.target.nodeName != 'BUTTON' ) return;
    rmClassFrChildren( scaleDegrees, 'root' );
    
    addClass( ev.target, 'root' );
    let key = Number( ev.target.id.substr(3));  // e.g. scd50..scd71
    setChordRoot( key );
  });
}

/* **********************  Song & Track UI  *******************  */
var _song, _track;  
selRoot.addEventListener("change", function() {
    playCurrChord( midiOutDev(), 500);
});
function setKey( song ){
  let root = song.root;
  let mode = song.mode;
  for (let i=0; i<selRoot.options.length; i++){  // select song's key in selRoot
    let txt = selRoot.options[i].innerText.trim();
    if ( txt==root || (root.length>1 && txt.includes(root)))
      selRoot.options[i].selected = true;
  }
  selMode.value = mode;

  let rkey = toKeyNum( root );
  let scale = toScale( song.mode, rkey );
  let rows = scaleRows( scale );
  let schtml = '';
  for ( let sd=0; sd<12; sd++ ){
    schtml += `<button id="scd${rkey+sd}"> ${rows[sd].scdeg} ${emStr((rkey+sd) % 12)}</button>`;
  }  
  scaleDegrees.innerHTML = schtml;
  addClass( scaleDegrees.childNodes[0], 'root' );
  addClass( divChdBtns.childNodes[0].childNodes[0], 'root' );
  setChordRoot( rkey, true );
  setChordType( 'M', true );
}
selSong.addEventListener("change", function() {
  _song = eg.findSong( selSong.value );
  loadSelect( selTrk, et.trackNames( _song ));
  setKey( _song );
  selTrk.dispatchEvent( new Event('change') );
});
selTrk.addEventListener("change", function() {      // change Track
  evalTrack();
});
selEvts.addEventListener("change", function() {     // change Event
  var evt = _trk.evts[ selEvts.selectedIndex ];
  playEvent( {t:0, nt: evt.nt, chord: evt.chord, d: evt.d } );
});
function evalTrack(){     // evaluate new track
  resetPlyr( 0 );
  _song = eg.findSong( selSong.value );
  _track = et.findTrack( _song, selTrk.value );
  _trk = et.evalTrack( _song, _track ); 
  showEventList();

  var evts = _trk.evts.map( x => `${x.t}: ${x.chord!=undefined? emStr(x.chord) : emStr(x.nt)} * ${x.d}` );
  loadSelect( selEvts, evts );
  btnPlay.innerText = 'Play';
}

function initDialogs(){
  // Melody/Harmony Adjust dialogues
  m_velocity.addEventListener("change", function() {
    plyrVal( 'm_velocity', m_velocity.value );
  });
  m_octave.addEventListener("change", function() {
    plyrVal( 'm_octave', m_octave.value );
  });
  m_tune.addEventListener('change', (ev) =>{
    plyrVal( 'm_tune', m_tune.checked );
  });
  m_rhythm.addEventListener('change', (ev) =>{
    plyrVal( 'm_rhythm', m_rhythm.checked );
  });
 
  h_velocity.addEventListener("change", function() {
    plyrVal( 'h_velocity', h_velocity.value );
  });
  h_octave.addEventListener("change", function() {
    plyrVal( 'h_octave', h_octave.value );
  });
  h_mute.addEventListener('change', (ev) =>{
    plyrVal( 'h_mute', h_mute.checked );
  });
}
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
var _ntcls = {
  '1':'n1',  '1#':'n12',  '2':'n2',  '2#':'n23',  '3':'n3', '3#':'n34',  
  '4':'n4',  '4#':'n45',  '5':'n5',  '5#':'n56',  '6':'n6', '6#':'n67',  '7':'n7', '7#':'n71' 
};
var _chdcls = {
  '1':'ch1',  '1#':'ch12',  '2':'ch2',  '2#':'ch23',  '3':'ch3', '3#':'ch34',
  '4':'ch4',  '4#':'ch45',  '5':'ch5',  '5#':'ch56',  '6':'ch6', '6#':'ch67',  '7':'ch7', '7#':'ch71' 
};
var _rowcls = {
  '1':'sp1',  '1#':'sp2',  '2':'sp1',  '2#':'sp2',  '3':'sp1', '3#':'sp2',
  '4':'sp1',  '4#':'sp2',  '5':'sp1',  '5#':'sp2',  '6':'sp1', '6#':'sp2',  '7':'sp1', '7#':'sp2' 
};

var _rowdefs = {};
function showEventList(){     // build rows display from _trk.evts
  clearKeyMarkers();
  let html = '';  
  let root = toKeyNum( _song.root );
  let scale = toScale( _song.mode, root );
  let [ lo, hi ] = et.trackLoHi();
  let maxtic = et.maxTic();

  status( `Notes: ${lo}..${hi}  Tics: 0..${maxtic} ` );
  let rows = et.trackRowMap();
  
  let sp = 1, lblRw = 0;;
  for (let i=lo; i<=hi; i++){   // backgrounds for rows
    let rw = rows[i];
    let r = `r${rw.rw}`;
    html += `<div id="rw${rw.rw}" class="${r} rw ${_rowcls[rw.deg]}"></div>`;
    _rowdefs[r] = { nt: i, deg: rw.deg, k:rw.key };
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
       cnt++;
     } else if ( e.chord != undefined ){
       chtml += `<div id="chd${ccnt}">`;
       for ( i=0; i < e.chord.length; i++ ){
         let nt = e.chord[ i ];
         let rw = rows[ nt ];
      //   if (rw==undefined) rw = { rw:-1, deg: -1};
         chtml += `<div id="chd${ccnt}-${i}" class="r${rw.rw} rw ${_chdcls[rw.deg]} t${e.t} ln${e.d} e${iE}"></div>`;
          let chdname = chordName( e.chord, true );
          if ( chdname != lastChd ){
            lastChd = chdname;
            lblhtml += `<div class="r${lblRw+1} t${e.t}">${lastChd}</div>`;
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
  if ( rw!=null ) tip = `${emStr(rw.nt)} (${rw.deg}) `;
  if (tgt.id.startsWith('nt')){
    tip = `m${iEvt} ${asBar(e.t)} ${emStr(e.nt)} (${rw.deg}) for ${inBeats(e.d)}`;
    selectEl( tgt );
    playEvent( { t:0, nt: e.nt, d: e.d } );
  } else if (tgt.id.startsWith('chd')){
    let ich = tgt.id.substring(3).split('-')[0];
  
    tip = `c${iEvt} ${asBar(e.t)} ${chordName(e.chord,true)} ${emStr(e.chord)} for ${inBeats(e.d)}`;
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

if ( typeof eg.songNames == 'function' )
  loadSelect( selSong, eg.songNames() );
selSong.dispatchEvent( new Event('change') );

