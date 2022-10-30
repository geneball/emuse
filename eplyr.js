const { toChord } = require("./emuse");
const { err, msg, nameChord } = require("./msg");
const { midiOutDev, markKey, clearKeyMarkers, addClass, removeClass } = require( './piano.js' );

var _chdRoot, _chdChord, _chdInv;        // current chord root & type
function setChordRoot( ky, noPlay ){
    _chdRoot = ky;  
     if (!noPlay) playChord();
}
function setChordType( nm, noPlay ){
    _chdChord = nm;
     if (!noPlay) playChord();
}
function adjInversion( inv ){
    _chdInv = inv;
 
    playChord();   
    return _chdInv;
}
function invertChord( chd ){   
    let len = chd.length;
    for ( let i=0; i < Math.abs(_chdInv); i++ ){
        let idx = i % len;
        if ( _chdInv < 0 )
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
    chd = invertChord( chd );
    nameChord( `${emStr(chd,false)} = ${chordName(chd, true)}` );
    playEvent( { t:0, chord: chd, d: 800 } );
}

var _plyr = {
        midi:  null,
        m_velocity:     127,
        h_velocity:     80,
        m_octave:       3,
        h_octave:       2,
        m_rhythm:       true,  // if false, play all melody notes for 1 beat
        m_rhythmNote:   60, 
        m_tune:         true,  // if false, play root for all notes
        h_mute:         false,   
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
        // _plyr.m_tune = true;
        // _plyr.h_mute = false;

        // _plyr.m_rhythm = true;
        _plyr.rhythmNote = 60;
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
        addHist( `noteOn(${nt} ${d})`);
    }
    function setNoteOff( nt ){
        midiOutDev().noteOff( 0, nt );
        markKey( nt, false );
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
                    setNoteOff( nnt.nt );
                } else {
                    _plyr.notesOn.push( nnt );
                }
            }
        
            for ( let i=_plyr.currEvtIdx; i<_trk.evts.length; i++ ){
                let e = _trk.evts[ i ];
                if ( e==null || e.t > tic ) break;
                if ( e.nt != undefined && (_plyr.m_tune || _plyr.m_rhythm) ){
                    let nt = e.nt + (_plyr.m_octave-3)*12;
                    if (!_plyr.m_tune) nt = _plyr.m_rhythmNote;     // no tune? play all notes as root
                    let dur = e.d;
                    if (!_plyr.m_rhythm) dur = tpb;     // no rhythm? 1 beat per note
                    setNoteOn( tic, nt, dur, _plyr.m_velocity );
                }
                if ( e.chord != undefined && !_plyr.h_mute  ){
                    for ( let nt of e.chord ){
                        nt += (_plyr.h_octave-3)*12;
                        setNoteOn( tic, nt, e.d, _plyr.h_velocity );
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
  
    module.exports = { resetPlyr, startPlay, stopPlay, setTic, setChordRoot, setChordType, adjInversion,
        plyrVal, playEvent, playChord, selectEl, setNoteOn, setNoteOff };
 // const { 
 //       resetPlyr, startPlay, stopPlay, setTic, setChordRoot, setChordType, invertChord,
 //       plyrVal, playEvent, playChord, selectEl, setNoteOn, setNoteOff
 //  } = require( './eplyr.js' );