const { toChord } = require("./emuse");
const { err, msg, statusMsg, nameChord } = require("./msg");
const { midiOutDev, markKey, clearKeyMarkers, addClass, removeClass } = require( './piano.js' );



var _chdRoot, _chdChord, _chdInv;        // current chord root & type
function setChordRoot( ky, noPlay ){
    _chdRoot = ky;  
     if (!noPlay) playChord();
}
function chordRoot(){ return _chdRoot; }
function setChordType( nm, noPlay ){
    _chdChord = nm;
     if (!noPlay) playChord();
}
function adjInversion( inv ){
    _chdInv = inv;
 
    playChord();   
    return _chdInv;
}
function invertChord( chd, inv ){   
    let len = chd.length;
    for ( let i=0; i < Math.abs( inv ); i++ ){
        let idx = i % len;
        if ( inv < 0 )
            chd[ len-1-idx ] -= 12;
        else
            chd[ idx ] += 12;
    }
    return chd.sort( );
}
function playEvent( e ){
    clearKeyMarkers();
    if ( e.nt != undefined ){
        setNoteOn( e.t, e.nt, e.d, _plyr.m_velocity );
    }
    if ( e.chord != undefined ){
        for ( let nt of e.chord ){
            setNoteOn( e.t, nt, e.d, _plyr.h_velocity );
        }
    }
    setTimeout( ()=>{ 
        midiOutDev().allNotesOff(0);
        }, 800 );
}
function playChord(){
    let chd = toChord( _chdChord, _chdRoot );
    chd = invertChord( chd, _chdInv );
    nameChord( `${emStr(chd,false)} = ${chordName(chd, true)}` );
    playEvent( { t:0, chord: chd, d: 800 } );
}

var _plyr = {
        evts:           [],
        bpb:            0,
        maxTic:         0,
        tpb:            0,
        tempo:          0,
        msTic:          0,
        midi:           null,
        m_velocity:     127,
        h_velocity:     80,
   //     m_rhythm:       true,  // if false, play all melody notes for 1 beat
   //     m_rhythmNote:   60, 
  //      m_tune:         true,  // if false, play root for all notes
   //     h_chords:       true,   
    //    h_rhythm:       true,   
        root:           60,
        stop:           false,
        currBeat:       0,
        currEvtIdx:     0,   // index of next e in _plyr.evts[]
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
        // _plyr.m_tune = true;
        // _plyr.h_mute = false;

        // _plyr.m_rhythm = true;
        //_plyr.rhythmNote = 60;
        clearKeyMarkers();
    }
    function plyrVal( nm, val ){
        if ( _plyr[nm] == undefined ) err( `plyrVal: ${nm} undefined`);
        if ( val != undefined ){
            _plyr[ nm ] = val;
            msg( `${nm} = ${val}` );
        }
        return _plyr[ nm ];
    }
    
    function asNtChd( e ){
        if ( e.nt != undefined ) return emStr(e.nt,false);
        if ( e.chord != undefined ) return chordName(e.chord, true);
    }

    function setTic( evts, tic ){
        _plyr.evts = evts;
        let bt = Math.trunc( tic / _gene.tpb );
        
    //    let divBeat = document.getElementById( `beat${_plyr.currBeat}` );
    //        _plyr.currEvtIdx = 0;

        if ( _plyr.evts[ _plyr.evts.length-1 ].t < tic )     // set currEvtIdx past last event, if it starts before tic 
          _plyr.currEvtIdx = _plyr.evts.length;
        else {        // or set currEvtIdx to first evt that starts at or after 'tic'
            let eIdx = _plyr.currEvtIdx;            // scan forward from currEvtIdx
            if ( bt < _plyr.currBeat ) eIdx = 0;    // or from start, if moving back
            for( let i= eIdx; i<_plyr.evts.length; i++ ){
                if ( _plyr.evts[ i ].t >= tic ){ // next event
                    _plyr.currEvtIdx = i;
                    break;
                }
            }
        }

        let stat = `${asBar(tic)} `;
        let e = evts[ _plyr.currEvtIdx ];
        if ( e != null ) stat += `{ ${asBar(e.t)} ${asNtChd(e)} ${inBeats(e.d)} }`;
        statusMsg( stat );
        setBeat( bt );
    }
    var _divBeat;
    function setBeat( bt ){
        if (_divBeat != undefined )
            removeClass( _divBeat, 'on' );

        _plyr.currBeat = bt;
        _divBeat = document.getElementById( `beat${bt}` );
        if ( _divBeat == undefined ) return;
        addClass( _divBeat, 'on' );   
        _divBeat.scrollIntoView();
        let div = document.getElementById( `beat${bt+5}` );
        if ( div == undefined ) return;
        div.scrollIntoView(); 
    }
    function addHist( msg ){
        let currMs = (Date.now()-_plyr.msStart)/_plyr.msTic;
        _plyr.hist.push( { ms:`${currMs.toFixed(2)}`, m: msg } );
    }
    function setNoteOn( tic, nt, d, vel ){
        _plyr.notesOn.push( { t:tic, nt: nt, d: d });
        midiOutDev().noteOn( 0, nt, vel);
        markKey( nt, true );
        addHist( `noteOn(${nt} ${d})`);
    }
    function setNoteOff( nt ){
        midiOutDev().noteOff( 0, nt );
        markKey( nt, false );
        addHist( `noteOff( ${nt} )`);
    }
    function startPlay(  evts, tpb, maxtic ){
        _plyr.evts = evts;
        _plyr.tpb = tpb;
        _plyr.maxTic = maxtic;
        resetPlyr();  // leave currBeat intact

        _plyr.msStart = Date.now();
        _plyr.msMax = _plyr.msStart + _plyr.maxTic * _plyr.msTic;
        var beat = _plyr.currBeat;
        let tic = beat * _plyr.tpb;
    
        function playtic(){
            addHist( asBar(tic) );
            setTic( _evts, tic );
            let ntson = _plyr.notesOn;
            _plyr.notesOn = [];
            for ( let n of ntson ){
                let nnt = { t: n.t, nt: n.nt, d: n.d-1 };  // one less tic
                if (nnt.d==0){
                    setNoteOff( nnt.nt );
                } else {
                    _plyr.notesOn.push( nnt );
                }
            }
        
            if ( !_plyr.stop ){
                for ( let i=_plyr.currEvtIdx; i<_plyr.evts.length; i++ ){
                    let e = _plyr.evts[ i ];
                    if ( e==null || e.t > tic ) break;
                    if ( e.nt != undefined ){ 
                       let nt = e.nt; 
                       let dur = e.d;
                       setNoteOn( tic, nt, dur, _plyr.m_velocity );
                    }
                    if ( e.chord != undefined ){ 
                        let dur = e.d;
                        let chd = e.chord;
                        for ( let nt of chd ){
                            setNoteOn( tic, nt, dur, _plyr.h_velocity );
                        }
                    }
                }
            }
            tic++;
            if ( tic >= _plyr.maxTic ){
                stopPlay();
                clearKeyMarkers();
                setTic( _plyr.evts, 0 );
            }
            if ( _plyr.stop )  return;
            setTimeout( playtic, _plyr.msTic );
        }
        setTimeout( playtic, _plyr.msTic )
    }
    function stopPlay( ){
        _plyr.stop = true;              // signal pending playtic()'s to stop
        midiOutDev().allNotesOff(0);
        _plyr.notesOn = [];
        btnPlay.innerText = 'Play';
    }

    function selectEl( el ){
        removeClass( _plyr.selEl, 'sel' );
        _plyr.selEl = el;
        addClass( el, 'sel' );
    }
  
    module.exports = { resetPlyr, startPlay, stopPlay, setTic, setChordRoot, setChordType, adjInversion, invertChord,
        plyrVal, chordRoot, playEvent, playChord, selectEl, setNoteOn, setNoteOff };
 // const { 
 //       resetPlyr, startPlay, stopPlay, setTic, setChordRoot, setChordType, invertChord,
 //       plyrVal, chordRoot, playEvent, playChord, selectEl, setNoteOn, setNoteOff
 //  } = require( './eplyr.js' );