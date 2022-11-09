const { toKeyNum, scDegToKeyNum, scaleRows, modeNames, chordNames, toChord, chordName } = require("./emuse");
const { asChord } = require( './etrack.js' );
const jetpack = require("fs-jetpack");
const { find } = require("fs-jetpack");
const { msg, err, question } = require( './msg.js' );
const { setKeyScale } = require("./piano");

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

function fromEvents( gene, style, evts ){
    let cd = [];
    if ( evts==undefined ) evts = gene.evts;
    let rootnt = toKeyNum( gene.root );
    let prevnt = rootnt;
    let scRows = scaleRows( rootnt, gene.mode );
    let mtic = 0, htic = 0, bpm = gene.bpb * gene.tpb;
    if ( encodings[style] == undefined ) debugger;
    let { isRhythm, isMelody, isConst } = encodings[ style ];
    let mcnt = 0;  // cnt of melody events, if hmSteady => chords match notee count
    
    for ( let e of evts ){
        if ( mtic % bpm == 0 ) cd.push( '.' );
        if ( isMelody && e.nt != undefined ){   // process melody event
            if ( e.t > mtic ){
                let rst = isConst? gene.tpb : e.t - mtic;
                cd.push( isRhythm? rst : 'r' );
                mtic = e.t;
                if ( mtic % bpm == 0 ) cd.push( '.' );
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
            if ( htic % (4*bpm) == 0 ) cd.push( '.' );
            if ( e.t > htic ){
                let rst = isConst? gene.tpb : e.t - htic;
                cd.push( isRhythm? rst : 'r' );
                htic = e.t; 
                if ( htic % (4*bpm) == 0 ) cd.push( '.' );
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
        this.idx = 0;
        this.cnt = 0;
        if ( gene[style]==undefined || gene[style].trim()=='' ){
            msg( `cdStepper: ${gene.nm} gene.${style} empty` );
            return null;
        }  
        let cd = this.code = gene[ style ].split(' ');
        this.cnt = cd.length;
        for ( let i=0; i<cd.length; i++ ){
            cd[i] = cd[i].trim();
            if ( cd[i]=='' ) err( `cdStepper:  ${gene.nm} gene.${style} [${i}] is '' ` );
        }
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

function firstDiffPos(a, b) {
    let len = a.length;
    if ( b.length > len ) len = b.length;
    for ( let i=0; i < len; i++ ){
        if ( a[i] !== b[i] ) return i;
    }
    return -1;
} 
function updateField( gene, style, evts ){
    let code = fromEvents( gene, style, evts ).join(' ');

    let idx = firstDiffPos( code, gene[style] );
    if ( idx < 0 ) return;

    let detail = `recalc'd version differs at ${idx}: \r\n curr: ${gene[style]} \r\n  new: ${code} `;
    if ( question( `Update ${gene.nm}.${style}?`, detail )){
        saveGene( gene );
    }
}

function toMelody( gene, styles ){
    let [ noteStyle, rhythmStyle ] = getStyles( styles, true );
    if ( noteStyle=='' && rhythmStyle=='' ) return [];     // no melody requested

    let nts = new cdStepper( gene, noteStyle );
    let rhy  = new cdStepper( gene, rhythmStyle );
    if ( nts.isEmpty() || rhy.isEmpty() ) return [];         // no harmony data

    let evts = [];
    let rtnt = nt = toKeyNum( gene.root ), tic = 0;
    let ntOff = (60 + rtnt % 12) - rtnt + (gene.mOct-4)*12;      // offset to shift root to mOct
    let dur = gene.tpb;
    while ( true ){
        let rcd = rhy.nextCd();     // get next duration
        if ( rcd == '.' ){   // measure boundary check
            if ( (tic % gene.tpb*gene.bpb)!=0 ) msg( `toMelody: rhythm . at tic=${tic} idx=${rhy.idx}` );
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
            err( `toMelody: ${gene.nm} ${rhythmStyle} cd ${rcd} => out of range ${dur}` ); 
            dur = gene.tpb; 
        }
        let ncd = nts.nextCd();     // get next note (or rest)
        if ( ncd == '.' ){   // measure boundary check
            if ( (tic % gene.tpb*gene.bpb)!=0 ) msg( `toMelody: note . at tic=${tic} idx=${nts.idx}` );
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
                err( `toMelody: ${gene.nm} ${noteStyle} cd ${ncd} => out of range ${nt}` ); 
                nt = rtnt; 
            }
            evts.push( { t:tic, d:dur, nt: Number(nt) + ntOff } );
        }
        tic += dur;
    }

    updateField( gene, noteStyle, evts );
    updateField( gene, rhythmStyle, evts );
    return evts;
}
function toHarmony( gene, styles ){
    let [ noteStyle, rhythmStyle ] = getStyles( styles, false );
    if ( noteStyle=='' && rhythmStyle=='' ) return [];     // no harmony requested

    let nts = new cdStepper( gene, noteStyle );
    let rhy  = new cdStepper( gene, rhythmStyle );
    if ( nts.isEmpty() || rhy.isEmpty() ) return [];         // no harmony data

    let evts = [];
    let rtNt = toKeyNum( gene.root ), nt = rtNt, tic = 0;
    let chd = [ nt, nt+4, nt+7 ];   // major chord
    let dur = gene.tpb;
    while ( true ){
        let rcd = rhy.nextCd();     // get next duration
        if ( rcd == '.' ){   // measure boundary check
            if ( (tic % gene.tpb*gene.bpb)!=0 ) msg( `toHarmony: rhythm . at tic=${tic} idx=${rhy.idx}` );
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
            err( `toHarmony: ${gene.nm} ${rhythmStyle} cd ${rcd} => out of range ${dur}` ); 
            dur = gene.tpb; 
        }
        let ncd = nts.nextCd();     // get next chord (or rest)
        if ( ncd == '.' ){   // measure boundary check
            if ( (tic % gene.tpb*gene.bpb)!=0 ) msg( `toHarmony: chord . at tic=${tic} idx=${nts.idx}` );
            ncd = nts.nextCd();
        }

        if ( rcd==undefined && ncd==undefined ) break;  // stop when both codes are exhausted
        if ( ncd != 'r' ){
            if ( ncd!=undefined ){  // if cds run out, repeat last chd
                switch ( noteStyle ){
                    case 'chords':  
                    case 'romans':   chd = asChord( ncd, rtNt, gene.hOct );   break;
                    default:
                    case 'rootMajor':    break;      // nt stays at root
                }
            }
            evts.push( { t:tic, d:dur, chord: chd } );
        }
        tic += dur;
    }
   
    updateField( gene, noteStyle, evts );
    updateField( gene, rhythmStyle, evts );
    return evts;
}
function toEvents( gene, styles ){
    if ( typeof styles == 'string' || styles instanceof String )
        styles = styles.split( styles.includes(',')? ',':' ' );

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

    gene.eventStyles = styles.join(',');
    setScale( gene.mode, gene.root );
    let melody = toMelody( gene, styles );

    let harmony = toHarmony( gene, styles );

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
function loadGeneEvents( gene ){
    let style = [], haveType = [false,false,false,false];
    for ( let e of encStyles ){  // styles in order of preference
        let enc = encodings[e];
        if ( !haveType[ enc.type ] ){
            style.push( e );
            haveType[ enc.type ] = true;
        }      
    }
    let evts;
    if ( style.length > 0 ) {
        if ( gene.mOct==undefined ) gene.mOct = 4;
        if ( gene.hOct==undefined ) gene.hOct = 3;
        try {
            gene.evts = evts = toEvents( gene, style );
        }
        catch( err ){
            console.log( `Err in toEvents for  ${gene.nm} ${err}` );
            if ( typeof msg == 'function' ) msg( `loadGeneEvents: err in toEvents for  ${gene.nm} ${err}` );
            return;
        }
    }
    let save = false;
    for ( let enc of encStyles ){       // recreate all gene forms
        if ( gene[ enc ]==undefined ){
            save = true;
            try{
                gene[ enc ] = fromEvents( gene, enc ).join(' ');
            } catch (err){
                console.log( `loadGeneEvents: err in fromEvents ${enc} for ${gene.nm} ${err}` );
                return;
            }
        }
    }
    if ( save ){
        delete gene.evts;
        let data = jetpack.cwd( './data' );
        data.write( `${gene.nm}_gene.json`, gene );
    }

    gene.evts = evts;
}

var genes = [];
var gene_paths = [];
var gene_names = [];
function findGene( nm ){
    if ( gene_paths.length==0 ) findGenes();
    for ( let g of genes ){
        if ( nm == g.nm ) return g;
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
        loadGeneEvents( gene );
    }
    gene_names = genes.map( x => x.nm );
}
function geneNames(){
    if ( gene_paths.length==0 ) findGenes();
    return gene_names;
}

// var songs = [];
// var song_paths = [];
// var song_names = [];
// function findSongs( ){
//     let data = jetpack.cwd( './data' );
//     song_paths = data.find( { matching: '*_def.json'} );
//     for ( let p of song_paths ){
//         let sng = null;
//         try {  
//             sng = data.read( p, 'json' );
//             songs.push(  sng );
//         } catch ( err ){
//             console.log( `Err parsing ${p} ${err}` );
//             if ( typeof msg == 'function' ) msg( `Err parsing ${p} ${err}` );
//         }
//     }
//     song_names = songs.map( x => x.nm );
// }
// function findSong( nm ){
//     if ( song_paths.length==0 ) findSongs();
//     for ( let s of songs ){
//         if ( nm == s.nm ) return s;
//     }
//     console.log( `findSong: didn't find ${nm}` );
// }
// function songNames(){
//     if ( song_paths.length==0 ) findSongs();
//     return song_names;
// }

module.exports = { /*saveTrack, loadTrack,*/ toEvents, findGene, geneNames /*, findSong, songNames*/ };
// const { saveTrack, loadTrack, toEvents, findGene, geneNames, findSong, songNames } = require("./egene");
