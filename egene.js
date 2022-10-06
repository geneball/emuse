const { toChord, toKeyNum, toScale, scaleRows, modeNames, chordNames } = require("./emuse");
const { trackNames, findTrack, evalTrack, trackRowMap, trackLoHi, maxTic } = require("./etrack");
const jetpack = require("fs-jetpack");

function asNum( n ){ return n.toString(); }

const codon_ops = [ 
    'TN',   // set tonic  A .. G#
    'SM',   // set mode  Ionian .. Locrian_bb3_bb
    'BB',   // set beatsPerBar  2..32
    'TM',   // set Tempo 40..200
    'NA',   // note adjust  -12..12
    'ND',   // note duration  1/64 .. 64 beats
    'DA',   // note duration adjust  -64..64 ( in 1/16 of beat)
    'CD',   // chord duration  1/64 .. 64 beats
    'CA',   // chord duration adjust -64..64 ( in 1/16 of beat)
    'CR',   // chord root adjust  1..7
    'CK',   // chord kind  'M '.. '7sus2'
    'PC',   // play chord ( current chord & duration )
    'PN'    // play note  ( current note & duration )
];
const codon_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+~,./;<>?:[]{}|';
const roots = [  // for TN
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' 
];

var codon_maps = null;
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
    codon_maps.modes    = create_maps( modeNames(),       codon_chars );  // for SM
    codon_maps.chords   = create_maps( chordNames(),      codon_chars );  // for CK
    codon_maps.tempo    = create_maps( int_arr(40,210,2), codon_chars );  // for TM
    codon_maps.smallnum = create_maps( int_arr(-44,44,1), codon_chars );  // for AT, BB, NA, DA, CA
    codon_maps.duration = create_maps( int_arr(0,88,1),   codon_chars );  // for ND, CD
}

function addCodon( op, arg ){
    if ( codon_maps == null ) init_codon_maps();
    let opcdn = codon_maps.ops.toCodon.get( op );
    let argcdn = '';
    let argmap = null;
    switch ( op ){
        case 'TN':  argmap = codon_maps.roots;      break;
        case 'BB':
        case 'AT':  
        case 'NA':
        case 'CR':  argmap = codon_maps.smallnum;   break;
        case 'SM':  argmap = codon_maps.modes;      break;
        case 'TM':  argmap = codon_maps.tempo;      break;
        case 'CK':  argmap = codon_maps.chords;     break;

        case 'ND':  
        case 'CD':
        case 'MR':
        case 'CS':  argmap = codon_maps.duration;   break;

        case 'PC':
        case 'PN': arg = undefined;            break;
    }
    if ( argmap==null ) debugger;
    if ( arg != undefined )
        argcdn = argmap.toCodon.get( arg );
    if ( opcdn == undefined || argcdn == undefined ) debugger;
    _st.codons += opcdn + argcdn;
}

var _st = {
    chd: null,
    cdur: 1,
    nt:  0,
    ntdur: 1,
    bpb: 4,
    tpb: 4,
    codons: ''
};

function setTonic( nt ){ 
    addCodon( 'TN', nt ); 
    _st.nt = nt;
}
function setMode( md ){         addCodon( 'SM', md ); }
function setBeats( bpb ){       addCodon( 'BB', bpb ); }
function setTempo( bpm ){       addCodon( 'TM', bpm + (bpm % 2) ); }
function noteFreq( nt ){  
        if ( nt == _st.nt ) return;
        addCodon( 'NA', nt - _st.nt );
    }
function noteDur( dur ){  
    // convert dur to 1/64ths of beat
    dur *= ( 64/_st.tpb );
    if ( dur == _st.ntdur ) return;
    addCodon( 'DA', dur - _st.ntdur );  
}
function melodyRest( dur ){     addCodon( 'MR', dur  ); }
function chordRest( dur ){      addCodon( 'CS', dur  ); }
function chordRoot( nt  ){      addCodon( 'CR', nt   ); }
function chordKind( kind ){     addCodon( 'CK', kind ); }
function chordDuration(adj){    addCodon( 'CD', adj  ); }
function playChord(  ){         addCodon( 'PC' );       }
function playNote(  ){          addCodon( 'PN' );       }

function saveTrack( song, trk, _trk ){

    jetpack.write( `${song.nm}.json`, song );

    let gene = {
        nm: `${song.nm}_${trk.nm}`,
        codons: []
    };

    setTonic( song.root );
    setMode( song.mode );
    setBeats( song.beatsPerBar );
    setTempo( song.tempo );

    let ntic = 0, ctic = 0;
    for ( let e of _trk.evts ){
        if ( e.nt != undefined ){
            if ( e.t != ntic ){ 
                melodyRest( e.t - ntic );
                ntic = e.t;
            }
            noteFreq( e.nt ); 
            noteDur( e.d );
            playNote();
            ntic += e.d;
        } else {
            if ( e.t != ctic ){ 
                chordRest( e.t - ctic );
                ctic = e.t;
            }
            chordRoot( e.chord[0] );
            chordKind( e.chord );
            chordDuration( e.d );
            playChord();
            ctic += e.d;
        }
    }
    gene.codons = _st.codons;
    gene.events = _trk.evts;   //DEBUG
    jetpack.write( `${song.nm}_${trk.nm}_gene.json`, gene )
}


module.exports = { saveTrack };
// const { saveTrack } = require("./egene");
