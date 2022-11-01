const { toKeyNum, toScale, scaleRows, modeNames, chordNames, toChord, chordName, asStr, asDeg, test } = require("./emuse");
const { trackNames, findTrack, evalTrack, trackRowMap, trackLoHi, maxTic } = require("./etrack");
const jetpack = require("fs-jetpack");
const { find } = require("fs-jetpack");
const { msg } = require( './msg.js' );
const { eNt, hNt } = require( './eplyr.js' );


var codon_maps = null;          // codon op & arg mappings
const codon_ops = [ 
    'TN',   // set tonic  A .. G#
    'MB',   // set melody base octave  0,12,24,36,48,60,72,84,96,108,120
    'CB',   // set chord base octave   0,12,24,36,48,60,72,84,96,108,120
    'SM',   // set mode  Ionian .. Locrian_bb3_bb
    'BB',   // set beatsPerBar  2..32
    'TB',   // set ticsPerBeat  1..32
    'TM',   // set Tempo 40..200
    'NA',   // note adjust  -12..12
    'ND',   // note duration  0..88 in 1/16 beats
    'DA',   // note duration adjust  -32..32 ( in 1/16 of beat)
    'CD',   // chord duration  0..88 in 1/16 beats
    'CA',   // chord duration adjust -32..32 ( in 1/16 of beat)
    'CR',   // chord root adjust  1..7
    'CK',   // chord kind  'M '.. '7sus2'
    'MR',   // melody rest 0..88 in 1/16 beats
    'CS',   // chord silence  0..88 in 1/16 beats
    'PC',   // play chord ( current chord & duration )
    'PN'    // play note  ( current note & duration )
];
const codon_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+~,./;<>?:[]{}|';
const roots = [  // for TN
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Db', 'Eb', 'Gb', 'Ab', 'Bb' 
];
function int_arr( lo, hi, step ){
    let a = [];
    for ( let v = lo; v <= hi; v += step )
      a.push( v );
    return a;
}
function create_maps( values, codons ){
    let vtc = new Map();
    let ctv = new Map();
    if ( values.length > codons.length ) debugger;
    for ( let i=0; i < values.length; i++ ){
        vtc.set( values[i],  codons[i] );
        ctv.set( codons[i],  values[i] );
    }
    return { toCodon: vtc, fromCodon: ctv };
}
function init_codon_maps(){
    codon_maps = {};
    codon_maps.ops = create_maps( codon_ops, codon_chars.split('') );

    codon_maps.roots    = create_maps( roots,             codon_chars );  // reuse codons for parameters depending on op
    codon_maps.octaves  = create_maps( int_arr(0,120,12), codon_chars );  // for MB, CB
    codon_maps.modes    = create_maps( modeNames(),       codon_chars );  // for SM
    codon_maps.chords   = create_maps( chordNames(),      codon_chars );  // for CK
    codon_maps.tempo    = create_maps( int_arr(40,210,2), codon_chars );  // for TM
    codon_maps.smallnum = create_maps( int_arr(-44,44,1), codon_chars );  // for AT, BB, NA, DA, CA
    codon_maps.duration = create_maps( int_arr(0,88,1),   codon_chars );  // for ND, CD
}

function toArgmap( op ){        // return mapping for args for a specific op 
    let argmap = undefined;
    switch( op ){
        case 'TN':  argmap = codon_maps.roots;      break; 

        case 'MB':
        case 'CB':  argmap = codon_maps.octaves;    break;

        case 'TB':
        case 'BB':
        case 'AT':  
        case 'NA':
        case 'CR':
        case 'DA':
        case 'CA':  argmap = codon_maps.smallnum;   break;

        case 'SM':  argmap = codon_maps.modes;      break;
        case 'TM':  argmap = codon_maps.tempo;      break;
        case 'CK':  argmap = codon_maps.chords;     break;

        case 'ND':  
        case 'CD':
        case 'MR':
        case 'CS':  argmap = codon_maps.duration;   break;

        default:
        case 'PC':
        case 'PN': argmap = undefined;              break;
    }
    return argmap;
}
function initState( gene ){     // init & return encode/decode state 
    let st = {};
    st.gene = gene;
    st.tpb = 0;       // default ticsPerBeat
    st.bpb = 0;
    st.cdur = 0;       // initial chord duration => 1 beat
    st.chdrt = 0;        // octave base for chords
    st.ntdur = 0;      // initial nt duration => 1 beat
    st.iCdn = 0;       // next idx into gene.codons  when decoding
    st.iEvt = 0;       // next idx in gene.evts when encoding
    st.ctic = 0;        // next chord tic
    st.ntic = 0;        // next melody tic
    return st;
}

//ENCODING events => codons
var _est;      // encode state
var _encHist;

function addCodon( op, arg ){
    _encHist.push( arg? { op: op, arg: arg } : { op: op } );
    if ( codon_maps == null ) init_codon_maps();
    let opcdn = codon_maps.ops.toCodon.get( op );
    let argcdn = '';
    let argmap = toArgmap( op );

    if ( arg != undefined ){
        if ( argmap==null ) debugger;
        argcdn = argmap.toCodon.get( arg );
    }
    if ( opcdn == undefined || argcdn == undefined ) debugger;
    _est.gene.codons += opcdn + argcdn;
    _est.iCdn = _est.gene.codons.length
}
function setTonic( nt ){        addCodon( 'TN', nt );  _est.root = nt; }
function setMelodyBase( nt ){   addCodon( 'MB', nt );  _est.nt = nt; }
function setChordBase( nt ){    addCodon( 'CB', nt );  _est.chdrt = nt; }
function setMode( md ){         addCodon( 'SM', md );  _est.mode = md; }
function setTicsPerBeat( tpb ){
    addCodon( 'TB', tpb ); 
    _est.tpb = tpb;
    _est.cdur = _est.ntdur = tpb;
}
function setBeats( bpb ){       addCodon( 'BB', bpb ); _est.bpb = bpb; }
function setTempo( bpm ){       addCodon( 'TM', bpm + (bpm % 2) ); _est.tempo = bpm; }
function noteFreq( nt ){  
        if ( nt == _est.nt ) return;
        addCodon( 'NA', nt - _est.nt );
        _est.nt = nt;
    }
function noteDur( dur ){        adjDur( 'DA', dur, _est.ntdur ); _est.ntdur = dur; }
function adjDur( op, dur, cdur ){  
    if ( dur == cdur ) return;
    let adj = dur - cdur;
    while ( adj > 44 ) { addCodon( op, 44 ); adj -= 44; }
    while ( adj < -44 ) { addCodon( op, -44 ); adj += 44; }
    addCodon( op, adj );  
}
function melodyRest( dur ){     addCodon( 'MR', dur  ); }
function chordRest( dur ){      addCodon( 'CS', dur  ); }
function chordRoot( nt  ){      addCodon( 'CR', nt - _est.chdrt ); _est.chdrt = nt; }
function chordKind( kind ){ 
    let chdnm = chordName( kind, true );
    chdnm = (chdnm[1]=='#' || chdnm[1]=='b')? chdnm.substring(2) : chdnm.substring(1);
    if ( chdnm=='' ) chdnm = 'M';
    addCodon( 'CK', chdnm ); 
    _est.chdkind = chdnm;
}
function chordDuration( dur ){  adjDur( 'CA', dur, _est.cdur ); _est.cdur = dur; }
function playChord(  ){         addCodon( 'PC' );       }
function playNote(  ){          addCodon( 'PN' );       }

function romanDegree( sdeg ){
    let sharps = '';
    while ( sdeg[sdeg.length-1]=='#' ){
        sharps += '#'; 
        sdeg = sdeg.substring(0, sdeg.length-1 );
    }
    let n = Number(sdeg);
    while ( n > 7 ) n -= 7;
    while ( n < 0 ) n += 7;
    let roman = [ 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII' ];
    return roman[n] + sharps;
}
function extractEvents( evts, scaleRows, root, style ){
    let extr = [];
    let prevnt = toKeyNum(root);
    let mtic = 0, htic = 0;
    let isRhythm, isMelody;
    switch ( style ){
        case 'notes':       isRhythm = false; isMelody = true; break;
        case 'intervals':   isRhythm = false; isMelody = true; break;
        case 'scaledegree': isRhythm = false; isMelody = true; break;
        case 'm_rhythm':    isRhythm = true;  isMelody = true; break;
        case 'chords':      isRhythm = false; isMelody = false; break;
        case 'roman':       isRhythm = false; isMelody = false; break;
        case 'h_rhythm':    isRhythm = true;  isMelody = false; break;
        default:        err( `unrecognized style ${style}` );   break;
    }
    for ( let e of evts ){
        if ( isMelody && e.nt != undefined ){
            if ( e.t > mtic ){
                extr.push( style=='m_rhythm'? e.t-mtic : 'r' );
                mtic = e.t;
            }
            switch( style ){
                case 'notes':       extr.push( e.nt ); break;
                case 'intervals':   extr.push( e.nt>=prevnt? `+${e.nt - prevnt}` : `${e.nt-prevnt}` ); break;
                case 'scaledegree': extr.push( scaleRows[e.nt].bdeg ); break;
                case 'm_rhythm':    extr.push( e.d );
                default: break;
            }
            prevnt = e.nt;
            mtic += e.d;
        } 
        if ( !isMelody && e.chord != undefined ){
            if ( e.t > htic ){
                extr.push( isRhythm? e.t-htic : 'r' );
                htic = e.t; 
            }
            switch( style ){
                case 'chords':      extr.push( chordName( e.chord, true )); break;
                case 'roman':       // convert leading note to roman scale degree 1..7
                    let [ rt, chnm ] = chordName( e.chord, false, true );     // split root & name
                    extr.push( `${ romanDegree( scaleRows[ e.chord[0] ].bdeg) }${chnm}` ); break;
                case 'h_rhythm':    extr.push( e.d );
                default: break;
            }
            htic += e.d;
        }
    }
    return extr;
}
function encodeEvent( e ){
    _encHist.push( { evt: _est.iEvt, t: e.t, typ: e.nt? 'N':'C', nt: _est.nt, nd: _est.ntdur, rt: _est.chdrt, cd: _est.cdur  } );
    if ( e.nt != undefined ){
        if ( e.t != _est.ntic ){ 
            melodyRest( e.t - _est.ntic );
            _est.ntic = e.t;
        }
        noteFreq( e.nt ); 
        noteDur( e.d );
        playNote();
        _est.ntic += e.d;
    } else {
        if ( e.t != _est.ctic ){ 
            chordRest( e.t - _est.ctic );
            _est.ctic = e.t;
        }
        chordRoot( e.chord[0] );
        chordKind( e.chord );
        chordDuration( e.d );
        playChord();
        _est.ctic += e.d;
    }
}
function genCodons( gene ){
    _est = initState( gene );   // init encoding state
    _encHist = [];

    _dst = initState( gene );   // for simultaneous decode debugging
    _decHist = [];  

    setTicsPerBeat( gene.tpb );  

    setTonic( gene.root );
    setMelodyBase( toKeyNum('C4') );
    setChordBase( toKeyNum('C3') );
    
    setMode( gene.mode );
    setBeats( gene.bpb );

    setTempo( gene.tempo );
    checkDecode( gene );            // check that states still match

    _est.iEvt = 0;
    while ( _est.iEvt < gene.orig_events.length ){
        encodeEvent( gene.orig_events[ _est.iEvt ] );
        _est.iEvt++;
        checkDecode( gene );            // check that states & evts match
    }
}

function checkDecode( gene ){         // decode codons up to this point & make sure _est===_dst & g.evts[] match g.origEvents
    while ( _dst.iCdn < gene.codons.length ){
        decodeCodon( gene );
    }
    Object.keys( _dst ).forEach( k => {
        if ( k!='gene' && _dst[k] != _est[k] ){
            if ( k!='tempo' || Math.abs(_dst[k]-_est[k])>1 ) debugger;
        }
    });
    while ( _dst.iEvt < gene.evts.length ){
        let e = gene.evts[ _dst.iEvt ];
        let oe = gene.orig_events[ _dst.iEvt ];
        if ( oe.t != e.t ) debugger;
        if ( oe.d != e.d ) debugger;
        if ( oe.nt != undefined && oe.nt != e.nt ) debugger;
        if ( oe.chord != undefined ){
            if ( oe.chord.length != e.chord.length ) debugger;      
            for ( let j=0; j < oe.chord.length; j++ ){
              if ( oe.chord[j] != e.chord[j] ) debugger;
            }
        }  
        _dst.iEvt++;
    }
}

//DECODING  codons => _dst & g.evts
var _dst;
var _decHist;
function decodeCodon( g ){      // decode g.codons[ g._dst.iCdn..] & update g._dst & g.evts[]
    let op = codon_maps.ops.fromCodon.get( g.codons[ _dst.iCdn ] );
    _dst.iCdn++;
    let arg = '';
    if ( op != 'PC' && op != 'PN' ){  // op has an arg
        arg = g.codons[ _dst.iCdn ];
        _dst.iCdn++;
    }
    let argmap = toArgmap( op );
    let val = argmap==undefined? undefined : argmap.fromCodon.get( arg );        
    _decHist.push( val? { op: op, arg: val } : { op: op } );
    switch( op ){
        case 'TN':  _dst.nt = val;                      break;  // set tonic  A .. G#
        case 'TB':  _dst.tpb = val;
                    _dst.ntdur = _dst.cdur = val;       break;  // initial durations of 1 beat, given tics per beat

        case 'MB':  _dst.nt = val;                      break;  // set melody initial octave
        case 'CB':  _dst.chdrt = val;                   break;  // set chord initial root note
                                                        

        case 'SM':  _dst.mode = val;                    break;  // set mode  Ionian .. Locrian_bb3_bb
        case 'BB':  _dst.bpb = val;                     break;  // set beatsPerBar  2..32
        case 'TM':  _dst.tempo = val;                   break;  // set Tempo 40..200


        case 'AT':  _dst.root += val;                   break;  // adjust tonic
        case 'NA':  _dst.nt += val;                     break;  // note adjust  -12..12
        case 'CR':  _dst.chdrt += val;                  break;  // chord root adjust  1..7
        case 'DA':  _dst.ntdur += val;                  break;  // note duration adjust  -32..32 ( in 1/16 of beat)
        case 'CA':  _dst.cdur += val;                   break;  // chord duration adjust -32..32 ( in 1/16 of beat)

        case 'CK':  _dst.chdkind = val;                 break;  // chord kind  'M '.. '7sus2'

        case 'ND':  _dst.ntdur = val;                   break;  // note duration  0..88 in tics
        case 'CD':  _dst.cdur = val;                    break;  // chord duration  0..88 in tics
        case 'MR':  _dst.ntic += val;                   break;  // melody rest 0..88 in tics
        case 'CS':  _dst.ctic += val;                   break;  // chord silence  0..88 in tics

        case 'PC':  g.evts.push( { t: _dst.ctic, chord: toChord(  _dst.chdkind, _dst.chdrt ), d: _dst.cdur } );  
                    _dst.iEvt++;     
                    _dst.ctic += _dst.cdur;
                    _decHist.push( { e: g.evts.length, t: _dst.ctic, op: 'PC', nt: _dst.nt, nd: _dst.ntdur, rt: _dst.chdrt, cd: _dst.cdur }); 
       
                                                        break;  // play chord ( current chord & duration )
        case 'PN':  g.evts.push( { t: _dst.ntic, nt: _dst.nt, d: _dst.ntdur } );  
                    _dst.iEvt++; 
                    _dst.ntic += _dst.ntdur;
                    _decHist.push( { e: g.evts.length, t: _dst.ntic, op: 'PN', nt: _dst.nt, nd: _dst.ntdur, rt: _dst.chdrt, cd: _dst.cdur } ); 
                                                        break;  // play note  ( current note & duration )
    }
}
function genEvts( gene ){
    _dst = initState( gene );
    _decHist = [];
    while ( _dst.iCdn < gene.codons.length ){
      decodeCodon( gene );
    }
}

//**************************************** */
function saveTrack( song, trk, _trk ){

    let data = jetpack.cwd( './data' );
    data.write( `${song.nm}_def.json`, song );

    let gene = {
        nm: `${song.nm}_${trk.nm}`,
        root: song.root,
        mode: song.mode,
        bpb: song.beatsPerBar,
        tpb: song.ticsPerBeat,
        tempo: song.tempo,
        codons: '',
        orig_events: _trk.evts,
        evts: []
    };
    genCodons( gene );
    delete gene.orig_events;        // since gene.evts matches

    gene.notes       = extractEvents( gene.evts, scaleRows(), song.root, 'notes'        ).join(' ');
    gene.intervals   = extractEvents( gene.evts, scaleRows(), song.root, 'intervals'    ).join(' ');
    gene.scaledegree = extractEvents( gene.evts, scaleRows(), song.root, 'scaledegree'  ).join(' ');
    gene.m_rhythm    = extractEvents( gene.evts, scaleRows(), song.root, 'm_rhythm'     ).join(' ');
    gene.chords      = extractEvents( gene.evts, scaleRows(), song.root, 'chords'       ).join(' ');
    gene.roman       = extractEvents( gene.evts, scaleRows(), song.root, 'roman'        ).join(' ');
    gene.h_rhythm    = extractEvents( gene.evts, scaleRows(), song.root, 'h_rhythm'     ).join(' ');

    data.write( `${song.nm}_${trk.nm}_gene.json`, gene )
}
var songs = [];
var song_paths = [];
var song_names = [];

function findSongs( ){
    let data = jetpack.cwd( './data' );
    song_paths = data.find( { matching: '*_def.json'} );
    for ( let p of song_paths ){
        let sng = null;
        try {  
            sng = data.read( p, 'json' );
            songs.push(  sng );
        } catch ( err ){
            console.log( `Err parsing ${p} ${err}` );
            if ( typeof msg == 'function' ) msg( `Err parsing ${p} ${err}` );
        }
    }
    song_names = songs.map( x => x.nm );
}
function findSong( nm ){
    if ( song_paths.length==0 ) findSongs();
    for ( let s of songs ){
        if ( nm == s.nm ) return s;
    }
    console.log( `findSong: didn't find ${nm}` );
}
function songNames(){
    if ( song_paths.length==0 ) findSongs();
    return song_names;
}

module.exports = { saveTrack, findSong, songNames, extractEvents };
// const { saveTrack, extractEvents, findSong, songNames, extractEvents } = require("./egene");
