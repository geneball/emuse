const { toKeyNum, scDegToKeyNum, scaleRows, modeNames, chordNames, toChord, chordName, emStr } = require("./emuse");
const { asChord } = require( './etrack.js' );
const jetpack = require("fs-jetpack");
const { find } = require("fs-jetpack");
const { msg, err, question } = require( './msg.js' );
const { setKeyScale } = require("./piano");

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
        let diff = eventDiffs( gene.evts[ _dst.iEvt ], gene.orig_events[ _dst.iEvt ], _dst.iEvt );
        if ( diff!='' ) debugger;
        _dst.iEvt++;
    }
}
function eventDiffs( e1, e2, idx ){
    let diff = '';
    if ( e1==undefined || e2==undefined ){
        return `${idx}: ${e1}!=${e2} `;
    } else {
        if ( e1.t != e2.t ) diff += `t: ${e1.t}!=${e2.t} `;
        if ( e1.d != e2.d ) diff += `d: ${e1.d}!=${e2.d} `;
        if ( e1.nt != e2.nt ) diff += `nt: ${e1.nt}!=${e2.nt} `;
        if ( e1.chord != undefined || e2.chord != undefined ){
            if ( e1.chord==undefined || e2.chord==undefined ){ 
                diff += `chord: ${e1.chord}!=${e2.chord} `; 
            } else {
                let same = ( e1.chord.length == e2.chord.length );
                if ( same )
                    for ( let i=0; i<e1.chord.length; i++ )
                        if ( e1.chord[i] != e2.chord[i] ) same = false;
                if (!same)
                    diff += `chord: ${e1.chord}!=${e2.chord}`;   
            }
        }
        return diff==''? '' : `${idx}:[ ${diff}] `;
    }
}
function compareEvents( evts1, evts2, descr ){
    let diff = '';
    let len = evts1.length;
    if ( len != evts2.length ){
        diff += `len: ${evts1.length}!=${evts2.length}`;
        if (evts2.length > len) len = evts2.length;
    }
    let cnt = 0;
    for ( let i=0; i<len; i++ ){
        let d = eventDiffs( evts1[i], evts2[i], i );
        if ( d!='' ){ cnt++; diff += '\r\n  ' + d; }
    }
    if ( cnt>0 )
        err( `${descr}: ${cnt} diffs: ${diff}` );
    return cnt;
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
const encStyles = [  // in preferred order for generating events
        'scaledegrees', 'notes', 'intervals', 'rootNote', 'mRhythm', 'mSteady',
        'chords', 'romans', 'rootMajor', 'hRhythm', 'hSteady', 'hmSteady'
];
const encTypes = { 
    MN: 0, MR: 1, HN: 2, HR: 3,
    vToNm: [ 'MN', 'MR', 'HN', 'HR' ]
}
const ntCh = 'ABCDEFGabcdefg#b0123456789-';
const digCh = '+-0123456789';
const sdCh = digCh + '#b';
const rhyCh = digCh + '.';
const chdCh = ntCh + 'adgimbsu12345679#()/M';
const romCh = 'IViv' + chdCh;
const encodings = { 
    notes:          { isRhythm: false, isMelody:  true,  isConst: false, isSteady: false, type: 'MN',   vchr: ntCh   },
    intervals:      { isRhythm: false, isMelody:  true,  isConst: false, isSteady: false, type: 'MN',   vchr: digCh  },
    scaledegrees:   { isRhythm: false, isMelody:  true,  isConst: false, isSteady: false, type: 'MN',   vchr: sdCh   },
    rootNote:       { isRhythm: false, isMelody:  true,  isConst: true,  isSteady: false, type: 'MN',   vchr: ntCh   },
    mRhythm:        { isRhythm: true,  isMelody:  true,  isConst: false, isSteady: false, type: 'MR',   vchr: rhyCh  },
    mSteady:        { isRhythm: true,  isMelody:  true,  isConst: true,  isSteady: true,  type: 'MR',   vchr: rhyCh  },
    chords:         { isRhythm: false, isMelody:  false, isConst: false, isSteady: false, type: 'HN',   vchr: chdCh  },
    romans:         { isRhythm: false, isMelody:  false, isConst: false, isSteady: false, type: 'HN',   vchr: romCh  },
    rootMajor:      { isRhythm: false, isMelody:  false, isConst: true,  isSteady: false, type: 'HN',   vchr: chdCh  },     
    hRhythm:        { isRhythm: true,  isMelody:  false, isConst: false, isSteady: false, type: 'HR',   vchr: rhyCh  },
    hSteady:        { isRhythm: true,  isMelody:  false, isConst: true,  isSteady: true,  type: 'HR',   vchr: rhyCh  },
    hmSteady:       { isRhythm: true,  isMelody:  false, isConst: true,  isSteady: true,  type: 'HR',   vchr: rhyCh  }
};
function isRhythmStyle( style ){ return encodings[ style ].isRhythm; }
function typeCnt( styles, typeToCount ){
    let cnt = 0;
    for ( let s of styles )
        if ( encodings[s].type==typeToCount ) cnt++;
    return cnt;
}
function addTic( tic, tpm, cd ){
    if ( tic % tpm == 0 )
        cd.push( `|${(tic/tpm)+1}`);
}

function fromEvents( gene, style, evts ){
    let cd = [];
    if ( evts==undefined ) evts = gene.evts;
    let rootnt = toKeyNum( gene.root );
    let prevnt = rootnt;
    let scRows = scaleRows( rootnt, gene.mode );
    let mtic = 0, htic = 0, tpm = gene.bpb * gene.tpb;
    if ( encodings[style] == undefined ) debugger;
    let { isRhythm, isMelody, isConst } = encodings[ style ];
    let mcnt = 0;  // cnt of melody events, if hmSteady => chords match notee count

    for ( let e of evts ){
        if ( isMelody && e.nt != undefined ){   // process melody event
            addTic( mtic, tpm, cd );
            if ( e.t > mtic ){
                let rst = isConst? gene.tpb : e.t - mtic;
                cd.push( isRhythm? rst : 'r' );
                mtic = e.t;
                addTic( mtic, tpm, cd );
            }
                switch( style ){
                case 'notes':       cd.push( e.nt ); break;
                case 'rootNote':    cd.push( rootnt ); break;
                case 'intervals':   cd.push( e.nt>=prevnt? `+${e.nt - prevnt}` : `${e.nt-prevnt}` ); break;
                case 'scaledegrees': 
                    if ( scRows[e.nt]==undefined ) err( `fromEvents: ${gene.nm} ${style} unrecognized ${e.nt}`, true );
                    cd.push( scRows[e.nt].bdeg ); break;
                case 'mRhythm':     cd.push( e.d ); break;
                case 'mSteady':     cd.push( gene.tpb ); break;
                default: err( `fromEvents: unrecognized style: ${style}`, true ); break;
            }
            prevnt = e.nt;
            mtic += e.d;
        } 
        if ( !isMelody && style=='hmSteady' && e.nt != undefined ){
            if ( e.t > mtic ) mcnt++;   // count the rest
             mcnt++;
        }
        if ( !isMelody && e.chord != undefined ){   // process harmony event
            addTic( htic, tpm, cd );
            if ( e.t > htic ){
                let rst = isConst? gene.tpb : e.t - htic;
                cd.push( isRhythm? rst : 'r' );
                htic = e.t; 
                addTic( htic, tpm, cd );
            }
            switch( style ){
                case 'chords':     cd.push( chordName( e.chord, true )); break;
                case 'romans':       // convert leading note to roman scale degree 1..7
                    let [ rt, chnm ] = chordName( e.chord, false, true );     // split root & name
                    let rom = romanDegree( scRows[ e.chord[0] ].bdeg );
                    if (chnm=='m'){ rom = rom.toLowerCase(); chnm=''; } 
                    if (chnm=='M'){ rom = rom.toUpperCase(); chnm=''; }
                    cd.push( `${rom}${chnm}` ); break;
                case 'rootMajor':  cd.push( emStr(rootnt,true)+'M' ); break;
                case 'hRhythm':    cd.push( e.d ); break;
                case 'hSteady':    cd.push( gene.tpb ); break;
                case 'hmSteady':   cd.push( mcnt * gene.tpb ); mcnt = 0; break;
                default: err( `fromEvents: unrecognized style: ${style}`, true ); break;
            }
            htic += e.d;
        }
    }
    return cd;
}
function getStyle( gene, style ){       // returns [] from gene.style or null
    if ( !encStyles.includes(style)) debugger;
    let etype = encodings[ style ].type;
    let g = gene;
    if ( typeof gene[etype] == 'object' && gene[etype][style]!=undefined ) g = gene[ etype ];
 
    let cd = g[ style ];
    if (cd==undefined || ( typeof cd != 'string' && !(cd instanceof String))){
        err( `${gene.nm} ${style} not string` );    
        return null;
    }
    if ( cd.trim()=='' ){ 
        msg( `getStyle: ${gene.nm} gene.${style} empty` );
        return null;
    }
    return cd.split( cd.indexOf(',') >=0? ',' : ' ' );
}
function setStyle( gene, style, cd ){
    if ( cd instanceof Array ) cd = cd.join(' ');
    if ( cd==undefined || cd.trim()=='' ) err( `setStyle: ${gene.nm} ${style} set to '' `);
    if ( !encStyles.includes( style )) debugger;
    let etype = encodings[ style ].type;
    if ( gene[etype]!=undefined ){
        gene[etype][style] = cd;
    } else
        gene[style] = cd;

}
class cdStepper {
    constructor( gene, style ){
        this.gene = gene;
        this.style = style;
        this.tpm = gene.tpb * gene.bpb;     // tics/measure
        this.idx = 0;
        this.cnt = 0;
        this.code = getStyle( gene, style );
        this.isSteady = encodings[style].isSteady;
        if ( this.code==null ) return;
        checkCode( gene, style );
        this.cnt = this.code.length;
    }
    nextCd(){
        return this.code[ this.idx++ ];
    }
    isEmpty(){ return this.idx >= this.cnt; }
}
function getStyles( styles, melody ){
    let noteStyle = '', rhythmStyle = '';
    for ( let s of styles ){
        let enc = encodings[ s ];
        if ( enc==undefined ) debugger;
        if ( enc.isMelody==melody ){
            if ( enc.isRhythm ){ 
                if ( rhythmStyle != '' ) debugger;  // duplicate rhythm
                rhythmStyle = s;
            } else {
                if ( noteStyle != '' ) debugger;  // duplicate tune
                noteStyle = s;
            }
        }
    }
    return [ noteStyle, rhythmStyle ];
}
function cdValsOnly( cds ){
    if ( typeof cds=='string' || cds instanceof String )
        cds = cds.split(' ');
    let vals = [];
    for ( let c of cds ){
        let v = String(c);
        if ( v!='.' && v[0]!='|' ) vals.push( v );
    }
    return vals;
}
function updateField( gene, style, evts ){
    let code = fromEvents( gene, style, evts );
    let old = getStyle( gene, style );
    let fdif = -1, ndif = 0, diffs = '';
    if ( code[0] != old[0] ){           //  eg '|1' != '|1'
        ndif++;  diffs = `0(${old[0]}=>${code[0]})`;
    }
    let newcd = cdValsOnly( code );
    old = cdValsOnly( old );
    let mxlen = newcd.length;
    if ( old.length > mxlen ) mxlen = old.length;


    for ( let i=0; i < mxlen; i++ )
        if ( newcd[i] != old[i] ) {
            ndif++;
            if ( fdif < 0 ) fdif = i;
            diffs += ` ${i}(${old[i]}=>${newcd[i]})`;
        }
    if ( ndif == 0 ) return;

    let br = '\r\n';
    let detail = `recalc'd version differs in ${ndif} places: ${diffs}`; //, old[${fdif}]= ${old[fdif]} not ${code[fdif]} `;
    if ( question( `Update ${gene.nm}.${style}?`, detail )){
        if ( gene.old==undefined ) gene.old = {};
        gene.old[style] = old.join(' ');
        setStyle( gene, style, code );
        saveGene( gene );
        msg( `saved ${gene.nm}.${style}` );
    }
}
function isBarMark( cd, cdstp, tic, isSteady ){
    if ( isSteady==undefined ) isSteady = false;
    if ( cd==undefined ) return false;
    if ( cd=='.' || cd[0]=='|' ){
        let tpm = cdstp.tpm;    
        if ( isSteady ) return true;        // ignore bar mismatches if steady rhythm
        if ( (tic % tpm)!=0 || (cd[0]=='|' && (tic/ tpm != Number(cd.substring(1)-1) )))
            err( `${cdstp.gene.nm}: ${cdstp.style}[${cdstp.idx-1}]=${cd} (*${tpm}) at tic=${tic}` );
        return true;
    } else
        return false;
}
function toMelody( n_gene, r_gene, styles ){
    let [ noteStyle, rhythmStyle ] = getStyles( styles, true );
    if ( noteStyle=='' && rhythmStyle=='' ) return [];     // no melody requested

    if ( !checkCode(n_gene, noteStyle) || !checkCode(r_gene, rhythmStyle) ) return [];      // invalid code strings

    let nts = new cdStepper( n_gene, noteStyle );
    let rhy  = new cdStepper( r_gene, rhythmStyle );
    if ( nts.isEmpty() || rhy.isEmpty() ) return [];         // no harmony data

    let evts = [];
    let rtnt = nt = toKeyNum( n_gene.root ), tic = 0;
    let ntOff = (60 + rtnt % 12) - rtnt + (n_gene.mOct-4)*12;      // offset to shift root to mOct
    let dur = r_gene.tpb;
    let tpm = r_gene.bpb * r_gene.tpb;
    while ( true ){
        let rcd = rhy.nextCd();     // get next duration
        if ( isBarMark( rcd, rhy, tic, rhy.isSteady )){
            rcd = rhy.nextCd();
        }
        if ( rcd != undefined ){    // if cds run out, repeat last dur
            switch ( rhythmStyle ){
                case 'mRhythm':    dur = Number( rcd );   break;
                default:
                case 'mSteady':    break;   // dur stays at tpb
            }
        }
        if ( dur < 0 ){
            err( `toMelody: ${r_gene.nm} ${rhythmStyle} cd ${rcd} => out of range ${dur}` ); 
            dur = r_gene.tpb; 
        }
        let ncd = nts.nextCd();     // get next note (or rest)
        if ( isBarMark( ncd, nts, tic, rhy.isSteady ) ){   // measure boundary check
            ncd = nts.nextCd();
        }

        if ( rcd==undefined && ncd==undefined ) break;  // stop when both codes are exhausted
        if ( ncd != 'r' ){
            if ( ncd!=undefined ){  // if cds run out, repeat last nt
                switch ( noteStyle ){
                    case 'notes':       nt = toKeyNum( ncd );        break;
                    case 'intervals':   nt += Number( ncd );         break;
                    case 'scaledegrees': nt = scDegToKeyNum( ncd );  break;
                    default:
                    case 'rootNote':    break;      // nt stays at root
                }
            }
            nt = Number(nt);
            if ( nt<0 || nt>127 ){ 
                err( `toMelody: ${n_gene.nm} ${noteStyle} cd ${ncd} => out of range ${nt}` ); 
                nt = rtnt; 
            }
            evts.push( { t:tic, d:dur, nt: Number(nt) + ntOff } );
        }
        tic += dur;
    }

    if ( !rhy.isSteady )    // don't update notes from Steady rhythm
        updateField( n_gene, noteStyle, evts );
    updateField( r_gene, rhythmStyle, evts );
    return evts;
}

function toHarmony( n_gene, r_gene, styles ){
    let [ noteStyle, rhythmStyle ] = getStyles( styles, false );
    if ( noteStyle=='' && rhythmStyle=='' ) return [];     // no harmony requested

    let nts = new cdStepper( n_gene, noteStyle );
    let rhy  = new cdStepper( r_gene, rhythmStyle );
    if ( nts.isEmpty() || rhy.isEmpty() ) return [];         // no harmony data

    let evts = [];
    let rtNt = toKeyNum( n_gene.root ), nt = rtNt, tic = 0;
    let chd = [ nt, nt+4, nt+7 ];   // major chord
    let dur = r_gene.tpb;
    while ( true ){
        let rcd = rhy.nextCd();     // get next duration
        if ( isBarMark( rcd, rhy, tic, rhy.isSteady ) ){   // measure boundary check
            rcd = rhy.nextCd();
        }
        if ( rcd != undefined ){    // if cds run out, repeat last dur
            switch ( rhythmStyle ){
                case 'hRhythm':
                case 'hmSteady':   dur = Number( rcd );   break; 
                default:
                case 'hSteady':    break;   // dur stays at tpb
            }
        }
        if ( dur < 0 ){
            err( `toHarmony: ${r_gene.nm} ${rhythmStyle} cd ${rcd} => out of range ${dur}` ); 
            dur = r_gene.tpb; 
        }
        let ncd = nts.nextCd();     // get next chord (or rest)
        if ( isBarMark( ncd, nts, tic, rhy.isSteady ) ){   // measure boundary check
            ncd = nts.nextCd();
        }

        if ( rcd==undefined && ncd==undefined ) break;  // stop when both codes are exhausted
        if ( ncd != 'r' ){
            if ( ncd!=undefined ){  // if cds run out, repeat last chd
                switch ( noteStyle ){
                    case 'chords':  
                    case 'romans':   chd = asChord( ncd, rtNt, n_gene.hOct );   break;
                    default:
                    case 'rootMajor':    break;      // nt stays at root
                }
            }
            evts.push( { t:tic, d:dur, chord: chd } );
        }
        tic += dur;
    }
   
    if ( !rhy.isSteady )    // don't update notes from Steady rhythm
        updateField( n_gene, noteStyle, evts );
    updateField( r_gene, rhythmStyle, evts );
    return evts;
}
function toEvents( mn_gene, mr_gene, hn_gene, hr_gene, styles ){
   if ( typeof styles == 'string' || styles instanceof String )
       styles = styles.split( styles.includes(',')? ',':' ' );

    // 'notes'        => 'notes,mSteady'
    // 'notes,mRhythm,chords' => 'hSteady'  -- so chords match notes
    // 'notes,mSteady,chords' => 'hmSteady' -- so chords match steady notes
    // 'mRhythm'      => 'rootNote,mRhythm'
    // 'chords'       => 'chords,hSteady'
    // 'hRhythm'      => 'rootMajor,hRhythm'
    // 'notes,chords' => 'notes,mSteady,chords,hmSteady'
    // let typeCnts = {};
    // for ( let typ of encTypes.vToNm ) typeCnts[ typ ] = typeCnt( styles, typ );
    // if ( typeCnts.MN > 0 && typeCnts.MR== 0 ) styles.push( 'mSteady' );
    // if ( typeCnts.MN== 0 && typeCnts.MR > 0 ) styles.push( 'rootNote' );
    // if ( typeCnts.HN > 0 && typeCnts.HR== 0 ) 
    //     styles.push( typeCnts.MR==0?  'hmSteady' : 'hRhythm' );
    // if ( typeCnts.HN== 0 && typeCnts.HR > 0 ) styles.push( 'rootMajor' );
    // if ( styles.includes('mSteady')){
    //     let idx = styles.indexOf('hRhythm');
    //     if (idx>=0) styles[idx] = 'hmSteady';
    // }
    // if ( styles.includes('mSteady') && styles.includes('hSteady')){
    //     styles[ styles.indexOf('hSteady')] = 'hmSteady';      
    // }
    // 'notes,mRhythm'    => melody events from gene.notes & gene.mRhythm
    // 'notes,mSteady'    => melody events from gene.notes w/ 1 note per beat
    // 'intervals'        => melody events from gene.intervals starting at gene.root
    // 'scaledegrees'     => melody events from gene.key & gene.scaledegrees
    // 'rootNote,mRhythm' => melody events repeating gene.root according to gene.mRhythm
    // 'chords,hRhythm'   => harmony events from gene.chords & gene.hRhythm
    // 'chords,hSteady'   => harmony events from gene.chords  w/ 1 chord per beat
    // 'rootMajor,hRhythm'=> harmony events repeat rootMajor according to gene.hRhythm
    // 'mSteady,hmSteady' => chord /num steady notes
    // 'romans'           => harmony events from gene.romans & gene.key (at 1 chord per beat)

    //gene.eventStyles = styles.join(',');
    setScale( mn_gene.mode, mn_gene.root );
    let melody = toMelody( mn_gene, mr_gene, styles );

    let harmony = toHarmony( hn_gene, hr_gene, styles );

    let evts = melody.concat( harmony ); 
    evts.sort( (a,b) => a.t - b.t );
    return evts;
}
//**************************************** */
function saveGene( gene ){
    let data = jetpack.cwd( './data' );
    let evts = gene.evts;
    delete gene.orig_events;  
    delete gene.evts;

    data.write( `${gene.nm}_gene.json`, gene ); //, 'json' );
    gene.evts = evts;
}
// function saveTrack( song, trk, _trk ){
//     let data = jetpack.cwd( './data' );
//     data.write( `${song.nm}_def.json`, song );

//     let gene = {
//         nm: `${song.nm}_${trk.nm}`,
//         root: song.root,
//         mode: song.mode,
//         bpb: song.beatsPerBar,
//         tpb: song.ticsPerBeat,
//         tempo: song.tempo,
//         codons: '',
//         orig_events: _trk.evts,
//         evts: []
//     };
//     genCodons( gene );

//     for ( let enc of encStyles ){
//         gene[ enc ] = fromEvents( gene, enc ).join(' ');
//     }

//     let evts2 = toEvents( gene, 'notes,mRhythm,chords,hRhythm' );
//     let evts = gene.evts;
//     let f = [ 't', 'd', 'nt' ];
//     let diffcnt = 0;
//     for ( let i=0; i<gene.orig_events.length; i++ ){
//         let diff = false;
//         let oediff = false;
//         let e1 = evts[i], e2 = evts2[i], oe = gene.orig_events[i];
//         for ( let fld of f ){
//           if ( e1[fld] != oe[fld] ) oediff = true;
//           if ( e1[fld] != e2[fld] ){
//             console.log( `${i}.${fld}: e1=${e1[fld]} e2=${e2[fld]} ${oediff? oe[fld]:''}` );
//             diffcnt++;
//           }
//         }
//         oediff = false;
//         if (e1.chord != undefined){
//             let clen = e1.chord.length;
//             for ( let k=0; k<clen; k++ ){
//                 if ( e1.chord[k]!=oe.chord[k] ) oediff = true;
//                 if ( e1.chord[k]!=e2.chord[k] && Math.abs(e1.chord[k]-e2.chord[k])!=12 ){
//                   console.log( `${i}.chord[${k}]: e1=${e1.chord[k]} e2=${e2.chord[k]} ${oediff? oe.chord[k]:''} ` );
//                   diffcnt++;
//                 }
//             }
//         }
//     }
//     if (diffcnt > 0) console.log( `saveTrack: ${diffcnt} diffs in ${song.nm} ${trk.nm}` );
//     delete gene.orig_events;        // since gene.evts matches
//     delete gene.evts;

//     data.write( `${song.nm}_${trk.nm}_gene.json`, gene );
//     gene.evts = evts;
// }
// function loadTrack( song, trk ){
//     let data = jetpack.cwd( './data' );
//     let gene = data.read( `${song.nm}_${trk.nm}_gene.json`, 'json' );

//     loadGeneEvents( gene );
//     return gene;
// }
// function loadGeneEvents( gene ){

//     let evts;
//     if ( style.length > 0 ) {
//         try {
//             gene.evts = evts = toEvents( gene, style );
//         }
//         catch( err ){
//             console.log( `Err in toEvents for  ${gene.nm} ${err}` );
//             if ( typeof msg == 'function' ) msg( `loadGeneEvents: err in toEvents for  ${gene.nm} ${err}` );
//             return;
//         }
//     }
//     let save = false;
//     for ( let enc of encStyles ){       // recreate all gene forms
//         if ( gene[ enc ]==undefined ){
//             save = true;
//             try{
//                 gene[ enc ] = fromEvents( gene, enc ).join(' ');
//             } catch (err){
//                 console.log( `loadGeneEvents: err in fromEvents ${enc} for ${gene.nm} ${err}` );
//                 return;
//             }
//         }
//     }
//     if ( save ){
//         delete gene.evts;
//         let data = jetpack.cwd( './data' );
//         data.write( `${gene.nm}_gene.json`, gene );
//     }

//     gene.evts = evts;
// }
function checkCode( g, sty ){       // return false & reports if code errors
    let cd = getStyle( g, sty );

    let validChars = encodings[sty].vchr;
    let isRhythm = encodings[sty].isRhythm;
    let empty = [], invalid = [], nonNums = [];
    let vcnt = 0;
    for ( let i=0; i<cd.length; i++ ){
        let c = cd[i];
        if ( c=='' ) empty.push( i );
        if ( c[0]=='|' || c=='.' ){          // '|1' or '.' ok in any code
            if ( c[0]=='|' && isNaN( Number(c.substring(1)) ) ) nonNums.push( i );
        } else {
            vcnt++;     // count of non-empty non-bar codes
            if ( isRhythm || ( c!='r' && c!='R' )){     // r or R is ok in all Notes
                for ( let j=0; j<c.length; j++ )
                    if ( !validChars.includes( c[j] ) ){ 
                        invalid.push( i ); 
                        break; 
                    }
                if ( encodings[sty].isRhythm || (sty=='intervals' && c[0]!='|') ){  // must be number
                    if ( isNaN( Number(c) ) ) nonNums.push( i );
                }
            }
        }
    }
    let msg = '';
    if ( empty.length>0 ) msg += ` ${empty.length} null entries (${empty})`;
    if ( invalid.length>0 ) msg += ` ${invalid.length} invalid entries (${invalid})`;
    if ( nonNums.length>0 ) msg += ` ${nonNums.length} nonNumeric entries (${nonNums})`;
    if (msg==''){
        if (g.cnts==undefined) g.cnts = {};
        g.cnts[ sty ] = vcnt;
        return true;
    }

    err( `${g.nm} ${sty} errors: ${msg}` );
    return false;
}
function fillDefault( g, field, val ){
    if ( g[field] != undefined ) return;
    g[ field ] = val;
    if ( val instanceof Object && Object.keys(val).length==0 ) val = '{}';
    msg( ` g.${field}=${val}`, true );
}
function loadGene( g ){     // verify gene json
    msg( `loading ${g.nm}...` );
    fillDefault( g, 'mOct', 4 );
    fillDefault( g, 'hOct', 3 );
    fillDefault( g, 'root', 'C' ); 
    fillDefault( g, 'mode', 'Major' );
    fillDefault( g, 'bpb', 4 );        // beats per bar (measure)
    fillDefault( g, 'tpb', 4 );        // tics per beat
    fillDefault( g, 'tempo', 100 );
    fillDefault( g, 'bpb', 4 );
    fillDefault( g, 'defs', {} );       // definition source per envType
    for ( let e of encStyles ){  // styles in order of preference
        let cd = getStyle( g, e );
        let enc = encodings[e];
        if ( g[ enc.type ]==undefined ) g[enc.type] = {};
        if ( g[ enc.type ].def==undefined){  // no definition recorded
            g[ enc.type ].def = e;     // use this one as definition
        }
    }
    if ( g.MN.def!=undefined && g.MR.def!=undefined ){
        let styles = g.MN.def + ',' + g.MR.def;
        msg( ` M:${styles}`, true );
    }
    if ( g.HN.def!=undefined && g.HR.def!=undefined ){
        let styles = g.HN.def + ',' + g.HR.def;
        msg( ` H:${styles}`, true );
    }

    let styles = [ 'notes', 'mRhythm', 'chords', 'hRhythm' ];
    let evts = toEvents( g, g, g, g, styles );
    for ( let e of encStyles ){
        updateField( g, e, evts );
    }
}

var genes = [];
var gene_paths = [];
var gene_names = [];
function findGene( nm ){
    if ( gene_paths.length==0 ) findGenes();
    for ( let g of genes ){
        if ( nm == g.nm ){
            loadGene( g ); 
            return g;
        }
    }
    console.log( `findGene: didn't find ${nm}` );
}
function findGenes( ){
    let data = jetpack.cwd( './data' );
    gene_paths = data.find( { matching: './*_gene.json'} );
    for ( let p of gene_paths ){
        let gene = null;
        try {  
            gene = data.read( p, 'json' );
            genes.push(  gene );
        } catch ( err ){
            console.log( `Err parsing ${p} ${err}` );
            if ( typeof msg == 'function' ) msg( `Err parsing ${p} ${err}` );
        }
    }
    gene_names = genes.map( x => x.nm );
}
function geneNames(){
    if ( gene_paths.length==0 ) findGenes();
    return gene_names;
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

module.exports = { toEvents, findGene, getStyle, isRhythmStyle, geneNames, findSong, songNames };
// const { toEvents, findGene, getStyle, isRhythmStyle, geneNames, findSong, songNames } = require("./egene");
