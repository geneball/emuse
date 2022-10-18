var _chdRoot, _chdChord;        // current chord root & type
function setChordRoot( ky, noPlay ){
    _chdRoot = ky;  
    if (!noPlay) playChord();
}
function setChordType( nm, noPlay ){
    _chdChord = nm;
    if (!noPlay) playChord();
}
function playEvent( e ){
    clearKeyMarkers();
    if ( e.nt != undefined ){
        setNoteOn( e.t, e.nt, e.d, mVel() );
    }
    if ( e.chord != undefined ){
        for ( let nt of e.chord ){
        setNoteOn( e.t, nt, e.d, hVel() );
        }
    }
    setTimeout( ()=>{ 
        midiOutDev().allNotesOff(0);
        }, 800 );
}
function playChord(){
    chd = toChord( _chdChord, _chdRoot );
    msg( emStr(chd) );
    playEvent( { t:0, chord: chd, d: 800 } );
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
        _plyr.melodyOffset = Number( radioValue( 'm_oct' )); 
        _plyr.chordOffset = Number( radioValue( 'h_oct' ) );
        _plyr.melodyVelocity = Number( m_velocity.value );
        _plyr.chordVelocity = Number( h_velocity.value );
        _plyr.melodyMute = m_mute.checked;
        _plyr.harmonyMute = h_mute.checked;
        clearKeyMarkers();
    }
    function asNtChd( e ){
        if ( e.nt != undefined ) return emStr(e.nt);
        if ( e.chord != undefined ) return chordName(e.chord, true);
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
        status( `${asBar(tic)} { ${asBar(e.t)} ${asNtChd(e)} ${inBeats(e.d)} }` );
        
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
        midiOutDev().noteOn( 0, nt, vel);
        markKey( nt, true );
        //addClass( keyspan[ nt ], 'on' );
        addHist( `noteOn(${nt} ${d})`);
    }
    function setNoteOff( nt, idx ){
        midiOutDev().noteOff( 0, nt );
        markKey( nt, false );
        // removeClass( keyspan[ nt ], 'on' );
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
        midiOutDev().allNotesOff(0);
        _plyr.notesOn = [];
        btnPlay.innerText = 'Play';
    }

    function selectEl( el ){
        removeClass( _plyr.selEl, 'sel' );
        _plyr.selEl = el;
        addClass( el, 'sel' );
    }
  
    function mVel(){ return _plyr.melodyVelocity; }
    function hVel(){ return _plyr.chordVelocity; }
    function mOffset(){ return _plyr.melodyOffset; }
    function hOffset(){ return _plyr.chordOffset; }
  
    module.exports = { resetPlyr, startPlay, stopPlay, setTic, setChordRoot, setChordType, mVel, hVel, mOffset, hOffset, playEvent, playChord, selectEl, setNoteOn, setNoteOff };
 // const { 
 //       resetPlyr, startPlay, stopPlay, setTic, setChordRoot, setChordType,
 //       mVel, hVel, mOffset, hOffset, playEvent, playChord, selectEl, setNoteOn, setNoteOff
 //  } = require( './eplyr.js' );