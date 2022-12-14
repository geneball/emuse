
const { msg, statusMsg } = require("./msg.js");
const { shell } = require('electron');

const { toKeyNum, setScale, scaleRows, scDegToKeyNum, modeNames, chordNames, chordName, modeChord, emStr } = require( './emuse.js' );
const { clearKeyMarkers, setKeyScale, rmClassFrChildren, addClass } = require( './piano.js' );

const { trackNames, findTrack, evalTrack  } = require('./etrack.js');
const { findGene, geneNames, saveGene, toEvents  } = require("./egene");
const { evalGene, evalHist } = require( './evalgene.js' );
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
const selMNgene   = document.getElementById('sel_MN_gene');
const selMRgene   = document.getElementById('sel_MR_gene');
const selHNgene   = document.getElementById('sel_HN_gene');
const selHRgene   = document.getElementById('sel_HR_gene');

const mMute       = document.getElementById('mMute');
const hMute       = document.getElementById('hMute');

const selMNotes    = document.getElementById('selMNotes');
const selMRhythm   = document.getElementById('selMRhythm');
const selHNotes    = document.getElementById('selHNotes');
const selHRhythm   = document.getElementById('selHRhythm');
const selEvts      = document.getElementById('selectEvents');

const mNotesHist    = document.getElementById('mNotesHist');
const mRhythmHist   = document.getElementById('mRhythmHist');
const hNotesHist    = document.getElementById('hNotesHist');
const hRhythmHist   = document.getElementById('hRhythmHist');


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
    html += `<button id="chty_${n}">${n}</button>`;
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
    setChordRoot( key, true );
    let [ rnm, chty ] = modeChord( key );
    clearChordBtns();
    let chdbtn = document.getElementById( 'chty_'+chty );
    if ( chdbtn != undefined ) addClass( chdbtn, 'root' );
    setChordType( chty );
    chd_inv.value = 0;
  });
  chd_inv.addEventListener('change', (ev) => {
    adjInversion( chd_inv.value );
  });
}

/* **********************  Song & Track UI  *******************  */
var _song, _track, _trk, _evts;  
selRoot.addEventListener("change", function() {  setKey( selRoot.value, selMode.value ); reEval(); });
selMode.addEventListener("change", function() {  setKey( selRoot.value, selMode.value ); reEval(); });

function setKey( root, mode ){
  clearChordBtns();
  rmClassFrChildren( scaleDegrees, 'root' );
  selRoot.value = root;
  
  selMode.value = mode;

  let rkey = toKeyNum( root );    // root key in octave 4
  MN_gene.rootNt = rkey;
  MN_gene.mode = mode;
  setScale( mode, root );
  let rows = scaleRows( );
  let schtml = '';

  for ( let sd=rkey; sd<rkey+12; sd++ ){
    let rw = rows[sd];
    if ( rw.inscale ){
      let [ rnm, chty ] = modeChord( sd );
      schtml += `<button id="scd${sd}" class="${rw.chdcls}"> ${rnm} ${emStr((sd), true)}${chty}</button>`;
    }
  }  
  scaleDegrees.innerHTML = schtml;
  setKeyScale( rows );      // piano scale coloring
  addClass( scaleDegrees.childNodes[0], 'root' );
  addClass( divChdBtns.childNodes[0].childNodes[0], 'root' );
  setChordRoot( rkey, true );
  setChordType( 'M', true );
}
var MN_gene, MR_gene, HN_gene, HR_gene;
selMNgene.addEventListener("change", function() {
  selMRgene.value = selHNgene.value = selHRgene.value = selMNgene.value;
  _gene = MN_gene = MR_gene = HN_gene = HR_gene = findGene( selMNgene.value );
  setKey( _gene.root, _gene.mode );

  initValue( bpb, 'bpb', _gene.bpb, 4 );
  initValue( tpb, 'tpb', _gene.tpb, 4 );
  initValue( tempo, 'tempo', _gene.tempo, 80 );
  plyrVal( 'msTic', 60000 / plyrVal('tempo') / plyrVal( 'tpb' ) );

  m_octave.value = _gene.melodyOctave == undefined? 4 : _gene.melodyOctave;
  h_octave.value = _gene.harmonyOctave == undefined? 3 : _gene.harmonyOctave;

  msg( `Eval = ${ evalGene( _gene )}` );  
  reEval();
});
selMRgene.addEventListener("change", function() {
  MR_gene = findGene( selMRgene.value );
  reEval();
});
selHNgene.addEventListener("change", function() {
  selHRgene.value = selHNgene.value;
  HR_gene = HN_gene = findGene( selHNgene.value );
  reEval();
});
selHRgene.addEventListener("change", function() {
  HR_gene = findGene( selHRgene.value ); 
  reEval();
});

selMNotes.addEventListener( "change", (ev) => { 
  reEval();  
});
selMRhythm.addEventListener("change", (ev) => { 
  if ( selMRhythm.value=='mSteady' && selHRhythm.value!='hSteady' ) hMute.checked = true;
  reEval(); 
});
selHNotes.addEventListener( "change", (ev) => { 
  reEval();  
});
selHRhythm.addEventListener("change", (ev) => { 
  if ( selHRhythm.value=='hSteady' && selMRhythm.value!='mSteady' ) mMute.checked = true;

  reEval(); 
});

selEvts.addEventListener("change", function() {     // change Event
  var evt = _evts[ selEvts.selectedIndex ];
  playEvent( {t:0, nt: evt.nt, chord: evt.chord, d: evt.d } );
});
mMute.addEventListener( 'change', (ev)=>{ reEval(); });
hMute.addEventListener( 'change', (ev)=>{ reEval(); });

function initValue( ctl, nm, val, def ){
  if ( val==undefined ) val = def;
  if ( ctl.value==undefined )
    ctl.innerText = plyrVal( nm, val );
  else
    ctl.value = plyrVal( nm, val );
}
function clearHist(){
  mNotesHist.innerHTML = '';
  mRhythmHist.innerHTML = '';
  hNotesHist.innerHTML = '';
  hRhythmHist.innerHTML = '';
}
function getEvents(){
  let style = '';
  if ( !mMute.checked ){
    style += ',' + selMNotes.value;
    style += ',' + selMRhythm.value;
  }
  if ( !hMute.checked ){
    style += ',' + selHNotes.value;
    style += ',' + ((selMRhythm.value=='mSteady' && selHRhythm.value=='hSteady' )? 'hmSteady' : selHRhythm.value);
  }
  clearHist();
  _evts = [];
  if (style!='')
    _evts = toEvents( MN_gene, MR_gene, HN_gene, HR_gene, style.substring(1) );

  if ( !mMute.checked ){
    evalHist( MN_gene, selMNotes.value, mNotesHist );
    evalHist( MR_gene, selMRhythm.value, mRhythmHist );
  }
  if ( !hMute.checked ){
    evalHist( HN_gene, selHNotes.value, hNotesHist );
    evalHist( HR_gene, selHRhythm.value, hRhythmHist );
  }
}

function reEval(){
  MN_gene.mOct = m_octave.value;
  HN_gene.hOct = h_octave.value;

  getEvents();
  showEventList();  
  
  var evts = _evts.map( x => `${x.t}: ${x.chord!=undefined? emStr(x.chord,true) : emStr(x.nt,true)} * ${x.d}` );
  loadSelect( selEvts, evts );
  btnPlay.innerText = 'Play';
}

function initDialogs(){
  tempo.addEventListener( 'change', (ev)=> {
     plyrVal('tempo', tempo.value);
     plyrVal( 'msTic', 60000 / plyrVal('tempo') / plyrVal( 'tpb' ) );
  });
  // Melody/Harmony Adjust dialogues
  m_velocity.addEventListener("change", (ev) => plyrVal( 'm_velocity', m_velocity.value ) );
  m_octave.addEventListener("change", (ev) => {  reEval();  });
 // m_tune.addEventListener('change',     (ev) => {  refreshTrack(); } );
 // m_rhythm.addEventListener('change',   (ev) => {  refreshTrack(); } ); //plyrVal( 'm_rhythm', m_rhythm.checked );  } );
 
  h_velocity.addEventListener("change", (ev) => {  plyrVal( 'h_velocity', h_velocity.value );  } );
  h_octave.addEventListener("change",   (ev) => { reEval(); });
//  h_chords.addEventListener('change',     (ev) => {  refreshTrack(); } ); //plyrVal( 'h_chords', h_chords.checked );  } );
//  h_rhythm.addEventListener('change',     (ev) => {  refreshTrack(); } ); //plyrVal( 'h_rhythm', h_rhythm.checked );  } );
}
btnPlay.addEventListener("click", (ev) => {     // Play
  if ( btnPlay.innerText=='Play' ){
    btnPlay.innerText = 'Stop';
    let { maxtic: maxtic } = eventRange( _evts );
    startPlay( _evts, _gene.tpb, maxtic );
  } else {
    btnPlay.innerText = 'Play';
    stopPlay();
  }
});
btnSave.addEventListener("click", (ev) => {     // Save
  saveGene( _gene ); 
  msg( `Saved gene '${_gene.nm}` );
});

/*  ********************* Note scroll #bars display ************************ */
function inBeats( tics ){     // return tics as string in beats
  let bts = Math.trunc( tics / _gene.tpb );
  let fr = tics % _gene.tpb;
  if ( fr==0 ) return bts==1? '1 beat' : `${bts} beats`;
  let denom = _gene.tpb;
  for (let i=2; i < denom; i++){
    if ( (fr%i)==0 && (denom % i)==0 ) { fr /= i; denom /= i; }
  }
  if (bts==0) return `${fr}/${denom} beat`;
  return `${bts} ${fr}/${denom} beats`;
}
function asBar( tics ){    // return tics as string as |bar.bt.tic
  let ticsPerBeat = _gene.tpb, beatsPerBar = _gene.bpb, ticsPerBar = ticsPerBeat * beatsPerBar;
  let bar = Math.trunc( tics / ticsPerBar );
  tics -= bar * ticsPerBar;
  let beat = Math.trunc( tics / ticsPerBeat );
  tics -= beat * ticsPerBeat;

  return `|${bar+1}.${beat}.${tics}`;
}

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
function showRows( lo, hi ){     // set up row & label backgrounds & resize  => lblRow
  let html = '';  
  let rows = scaleRows(); 
 
  _row0key = lo;
  for (let i=lo; i<=hi; i++){   // backgrounds for rows
    let rw = rows[i];
    let r = i-lo; 
    html += `<div id="rw${r}" class="r${r} rw ${rw.rowcls}"></div>`;
  }
  let lblRw = hi-lo+1;
  divRows.innerHTML = html;

  // set up label bar
  divLabels.innerHTML = `<div id="labelRow" class="lbl r${lblRw}"></div>`;
  let divLabelRow = document.getElementById( 'labelRow' );

  let bx = divLabelRow.getBoundingClientRect();
  let barsbx = divBars.getBoundingClientRect();

  // adjust overall height
  divBars.style.height = `${barsbx.bottom - bx.top}px`;
  return lblRw;
}
function showBeats( maxtic, lblRw ){         // set up measure bars & labels
  let tichtml = '';
  let lblhtml = '';
  let beathtml = '';
  let tic = 0;
  let tpb =  _gene.tpb;
  let tpm = _gene.bpb * tpb;
  let bt = 0;
  for( tic=0; tic <= maxtic; tic += tpb ){    // beat & measure bars + measure labels
    let  mrk = 'tic';
    if ( (tic % tpm)==0 ){
      mrk = 'bar';
      let m = (tic / tpm) + 1;
      lblhtml += `<div class="kbar r${lblRw} t${tic} ln2">${m}</div>`;
    }
    tichtml += `<div class="${mrk} t${tic}"></div>`;
    beathtml += `<div id="beat${bt}" class="kbt r${lblRw+2} bt${tpb} t${tic}"></div>`;
    bt++;
  }
  divBeats.innerHTML = beathtml;
  divTics.innerHTML =  tichtml;
  divLabels.innerHTML += lblhtml;
}
function showEvents( lo, lblRw ){       // place events on bars display
  let html = '', lblhtml = '';
  let chtml = '', cnt=0, ccnt=0, lastChd = '';
  let rows = scaleRows();
  for ( let iE=0; iE<_evts.length; iE++ ){
    let e = _evts[iE]; 
     if ( e.nt != undefined ){              // display melody note
       let rw = rows[ e.nt ];
       let r = e.nt - lo;
       if (rw==undefined) debugger;
       html += `<div id="nt${cnt}" class="k${e.nt} r${r} rw ${rw.ntcls} t${e.t} ln${e.d} e${iE}"></div>`;
       cnt++;
     } else if ( e.chord != undefined ){    // display harmony chord
       chtml += `<div id="chd${ccnt}">`;
       for ( i=0; i < e.chord.length; i++ ){
         let nt = e.chord[ i ];
         let rw = rows[ nt ];
         let r = nt-lo;
         chtml += `<div id="chd${ccnt}-${i}" class="k${nt} r${r} rw ${rw.chdcls} t${e.t} ln${e.d} e${iE}"></div>`;
      }
      let chdname = chordName( e.chord, true );
      if ( chdname != lastChd ){
        lastChd = chdname;
        lblhtml += `<div class="kchd r${lblRw+1} t${e.t}">${lastChd}</div>`;
      }
      chtml += '</div>';
      ccnt++;
     }
  }
  divLabels.innerHTML += lblhtml;
  divNotes.innerHTML = html;
  divChords.innerHTML = chtml;
}
function showEventList(){     // build rows display from _evts
  clearKeyMarkers();

  //let root = toKeyNum( _gene.root );
  let { lo:lo, hi: hi, maxtic: maxtic } = eventRange( _evts );

  statusMsg( `Notes: ${lo}..${hi}  Tics: 0..${maxtic} ` );

  let lblRow = showRows( lo, hi );       // set up row & label backgrounds & resize
  showBeats( maxtic, lblRow );      // set up measure bars & labels
  showEvents( lo, lblRow );            // place events on bars display
  setTic( _evts, 0);
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
    setTic( _evts, Number(tgt.id.substring(4))*_gene.tpb );
    return;
  } 
  msg( tip );
});

initChordUI();
loadSelect( selMode, modeNames() );
loadSelect( selRoot,  ['C','C#','Db', 'D','D#', 'Eb','E','F','F#','Gb', 'G','G#','Ab','A','A#','Bb','B'] );

initDialogs();

//if ( typeof songNames == 'function' )
//  loadSelect( selSong, songNames() );

loadSelect( selMNotes, [ 'scaledegrees', 'notes', 'intervals', 'rootNote' ] );
loadSelect( selMRhythm, [ 'mRhythm', 'mSteady' ] );
loadSelect( selHNotes, [  'chords', 'romans', 'rootMajor' ] );
loadSelect( selHRhythm, [ 'hRhythm', 'hSteady' ] );

loadSelect( selMNgene, geneNames() );
loadSelect( selMRgene, geneNames() );
loadSelect( selHNgene, geneNames() );
loadSelect( selHRgene, geneNames() );
selMNgene.dispatchEvent( new Event('change') );
//selSong.dispatchEvent( new Event('change') );

