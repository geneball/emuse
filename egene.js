const { toKeyNum, scDegToKeyNum, scaleRows, modeNames, chordNames, toChord, chordName } = require("./emuse");
const { asChord } = require( './etrack.js' );
const jetpack = require("fs-jetpack");
const { find } = require("fs-jetpack");
const { msg } = require( './msg.js' );


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
        'notes', 'intervals', 'scaledegrees', 'rootNote', 'mRhythm', 'mSteady',
        'chords', 'romans', 'rootMajor', 'hRhythm', 'hSteady', 'hmSteady'
];
const mTune = 0, mRhythm = 1, hTune = 2, hRhythm = 3;
const encodings = { 
    notes:          { isRhythm: false, isMelody:  true,  isConst: false, type: mTune    },
    intervals:      { isRhythm: false, isMelody:  true,  isConst: false, type: mTune    },
    scaledegrees:   { isRhythm: false, isMelody:  true,  isConst: false, type: mTune    },
    rootNote:       { isRhythm: false, isMelody:  true,  isConst: true,  type: mTune    },
    mRhythm:        { isRhythm: true,  isMelody:  true,  isConst: false, type: mRhythm  },
    mSteady:        { isRhythm: true,  isMelody:  true,  isConst: true,  type: mRhythm  },
    chords:         { isRhythm: false, isMelody:  false, isConst: false, type: hTune    },
    romans:         { isRhythm: false, isMelody:  false, isConst: false, type: hTune    },
    rootMajor:      { isRhythm: false, isMelody:  false, isConst: true,  type: hTune    },     
    hRhythm:        { isRhythm: true,  isMelody:  false, isConst: false, type: hRhythm  },
    hSteady:        { isRhythm: true,  isMelody:  false, isConst: true,  type: hRhythm  },
    hmSteady:       { isRhythm: true,  isMelody:  false, isConst: true,  type: hRhythm  }
};
function typeCnt( styles, typeToCount ){
    let cnt = 0;
    for ( let s of styles )
        if ( encodings[s].type==typeToCount ) cnt++;
    return cnt;
}
function fromEvents( gene, style ){
    let cd = [];
    let evts = gene.evts;
    let rootnt = toKeyNum( gene.root );
    let prevnt = rootnt;
    let scRows = scaleRows();
    let mtic = 0, htic = 0;
    if ( encodings[style] == undefined ) debugger;
    let { isRhythm, isMelody, isConst } = encodings[ style ];
    let mcnt = 0;  // cnt of melody events, if hmSteady => chords match notee count
    
    for ( let e of evts ){
        if ( isMelody && e.nt != undefined ){   // process melody event
            if ( e.t > mtic ){
                let rst = isConst? gene.tpb : e.t - mtic;
                cd.push( isRhythm? rst : 'r' );
                mtic = e.t;
            }
            switch( style ){
                case 'notes':       cd.push( e.nt ); break;
                case 'rootNote':    cd.push( rootnt ); break;
                case 'intervals':   cd.push( e.nt>=prevnt? `+${e.nt - prevnt}` : `${e.nt-prevnt}` ); break;
                case 'scaledegrees': cd.push( scRows[e.nt].bdeg ); break;
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
            if ( e.t > htic ){
                let rst = isConst? gene.tpb : e.t - htic;
                cd.push( isRhythm? rst : 'r' );
                htic = e.t; 
            }
            switch( style ){
                case 'chords':      cd.push( chordName( e.chord, true )); break;
                case 'romans':       // convert leading note to roman scale degree 1..7
                    let [ rt, chnm ] = chordName( e.chord, false, true );     // split root & name
                    cd.push( `${ romanDegree( scRows[ e.chord[0] ].bdeg) }${chnm}` ); break;
                case 'rootMajor':  cd.push( gene.root+'M' ); break;
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
class cdStepper {
    constructor( gene, style ){
        this.gene = gene;
        this.style = style;
        if ( gene[style]==undefined ) debugger; 
        this.idx = 0;
        this.code = gene[ style ].split(' ');
    }
    nextCd(){
        return this.code[ this.idx++ ];
    }
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
function toMelody( gene, styles ){
    let [ noteStyle, rhythmStyle ] = getStyles( styles, true );
    if ( noteStyle=='' && rhythmStyle=='' ) return [];     // no melody requested

    let nts = new cdStepper( gene, noteStyle );
    let rhy  = new cdStepper( gene, rhythmStyle );

    let evts = [];
    let nt = toKeyNum( gene.root ), tic = 0;
    let dur = gene.tpb;
    while ( true ){
        let rcd = rhy.nextCd();     // get next duration
        if ( rcd != undefined ){    // if cds run out, repeat last dur
            switch ( rhythmStyle ){
                case 'mRhythm':    dur = Number( rcd );   break;
                default:
                case 'mSteady':    break;   // dur stays at tpb
            }
        }
        let ncd = nts.nextCd();     // get next note (or rest)

        if ( rcd==undefined && ncd==undefined ) break;  // stop when both codes are exhausted
        if ( ncd != 'r' ){
            if ( ncd!=undefined ){  // if cds run out, repeat last nt
                switch ( noteStyle ){
                    case 'notes':       nt = toKeyNum( ncd );        break;
                    case 'intervals':   nt += Number( ncd );         break;
                    case 'scaledegrees': nt = scDegToKeyNum[ ncd ];  break;
                    default:
                    case 'rootNote':    break;      // nt stays at root
                }
            }
            evts.push( { t:tic, d:dur, nt: nt } );
        }
        tic += dur;
    }
    return evts;
}
function toHarmony( gene, styles ){
    let [ noteStyle, rhythmStyle ] = getStyles( styles, false );
    if ( noteStyle=='' && rhythmStyle=='' ) return [];     // no harmony requested

    let nts = new cdStepper( gene, noteStyle );
    let rhy  = new cdStepper( gene, rhythmStyle );

    let evts = [];
    let nt = toKeyNum( gene.root ), tic = 0;
    let chd = [ nt, nt+4, nt+7 ];   // major chord
    let dur = gene.tpb;
    while ( true ){
        let rcd = rhy.nextCd();     // get next duration
        if ( rcd != undefined ){    // if cds run out, repeat last dur
            switch ( rhythmStyle ){
                case 'hRhythm':
                case 'hmSteady':   dur = Number( rcd );   break; 
                default:
                case 'hSteady':    break;   // dur stays at tpb
            }
        }
        let ncd = nts.nextCd();     // get next chord (or rest)

        if ( rcd==undefined && ncd==undefined ) break;  // stop when both codes are exhausted
        if ( ncd != 'r' ){
            if ( ncd!=undefined ){  // if cds run out, repeat last chd
                switch ( noteStyle ){
                    case 'chords':  
                    case 'romans':   chd = asChord( ncd );   break;
                    default:
                    case 'rootMajor':    break;      // nt stays at root
                }
            }
            evts.push( { t:tic, d:dur, chord: chd } );
        }
        tic += dur;
    }
    return evts;
}
function toEvents( gene, styles ){
    if ( typeof styles == 'string' || styles instanceof String ) styles = styles.split(',');

    // 'notes'        => 'notes,mSteady'
    // 'notes,mRhythm,chords' => 'hSteady'  -- so chords match notes
    // 'notes,mSteady,chords' => 'hmSteady' -- so chords match steady notes
    // 'mRhythm'      => 'rootNote,mRhythm'
    // 'chords'       => 'chords,hSteady'
    // 'hRhythm'      => 'rootMajor,hRhythm'
    // 'notes,chords' => 'notes,mSteady,chords,hmSteady'
    let typeCnts = [];
    for ( let typ of [ mTune, mRhythm, hTune, hRhythm ] ) typeCnts[ typ ] = typeCnt( styles, typ );
    if ( typeCnts[mTune] > 0 && typeCnts[mRhythm]== 0 ) styles.push( 'mSteady' );
    if ( typeCnts[mTune]== 0 && typeCnts[mRhythm] > 0 ) styles.push( 'rootNote' );
    if ( typeCnts[hTune] > 0 && typeCnts[hRhythm]== 0 ) 
        styles.push( typeCnts[mRhythm]==0?  'hmSteady' : 'hRhythm' );
    if ( typeCnts[hTune]== 0 && typeCnts[hRhythm] > 0 ) styles.push( 'rootMajor' );
    if ( styles.includes('mSteady')){
        let idx = styles.indexOf('hRhythm');
        if (idx>=0) styles[idx] = 'hmSteady';
    }
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

    msg( styles.join(',') );
    let melody = toMelody( gene, styles );
    let harmony = toHarmony( gene, styles );

    let evts = melody.concat( harmony ); 
    evts.sort( (a,b) => a.t - b.t );
    return evts;
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

    for ( let enc of encStyles ){
        gene[ enc ] = fromEvents( gene, enc ).join(' ');
    }

    let evts2 = toEvents( gene, 'notes,mRhythm,chords,hRhythm' );
    let evts = gene.evts;
    let f = [ 't', 'd', 'nt' ];
    let diffcnt = 0;
    for ( let i=0; i<gene.orig_events.length; i++ ){
        let diff = false;
        let oediff = false;
        let e1 = evts[i], e2 = evts2[i], oe = gene.orig_events[i];
        for ( let fld of f ){
          if ( e1[fld] != oe[fld] ) oediff = true;
          if ( e1[fld] != e2[fld] ){
            console.log( `${i}.${fld}: e1=${e1[fld]} e2=${e2[fld]} ${oediff? oe[fld]:''}` );
            diffcnt++;
          }
        }
        oediff = false;
        if (e1.chord != undefined){
            let clen = e1.chord.length;
            for ( let k=0; k<clen; k++ ){
                if ( e1.chord[k]!=oe.chord[k] ) oediff = true;
                if ( e1.chord[k]!=e2.chord[k] && Math.abs(e1.chord[k]-e2.chord[k])!=12 ){
                  console.log( `${i}.chord[${k}]: e1=${e1.chord[k]} e2=${e2.chord[k]} ${oediff? oe.chord[k]:''} ` );
                  diffcnt++;
                }
            }
        }
    }
    if (diffcnt > 0) console.log( `saveTrack: ${diffcnt} diffs in ${song.nm} ${trk.nm}` );
    delete gene.orig_events;        // since gene.evts matches
    delete gene.evts;

    data.write( `${song.nm}_${trk.nm}_gene.json`, gene );
    gene.evts = evts;
}
function loadTrack( song, trk ){
    let data = jetpack.cwd( './data' );
    let gene = data.read( `${song.nm}_${trk.nm}_gene.json`, 'json' );

    let style = [], haveType = [false,false,false,false];
    for ( let e of encStyles ){  // styles in order of preference
        let enc = encodings[e];
        if ( !haveType[ enc.type ] ){
            style.push( e );
            haveType[ enc.type ] = true;
        }      
    }
    if ( style.length > 0 ) 
      gene.evts = toEvents( gene, style );

    return gene;
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

module.exports = { saveTrack, loadTrack, toEvents, findSong, songNames };
// const { saveTrack, loadTrack, toEvents, findSong, songNames } = require("./egene");
