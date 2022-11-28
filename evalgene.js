// const jetpack = require("fs-jetpack");
// const { find } = require("fs-jetpack");
// const { setKeyScale } = require("./piano");

const { msg, err } = require( './msg.js' );
const { asChord } = require( './etrack.js' );
const { scDegToKeyNum } = require("./emuse");
const { getStyle, isRhythmStyle, setEval } = require( './egene.js' );

function codeVals( g, cds ){
    let vals = [];         // array of just values (no bar-markers)
    for ( let i=0; i < cds.length; i++ ){
        let cd = cds[i].trim();
        if ( cd=='' ) err( `codeVals:  ${g.nm} gene.${style}[${i}] is '' ` );
        if ( cd!='.' && cd[0]!='|' )
            vals.push( cd );
    }   
    return vals;
}
class histogram {
    constructor( gene, style ){
        this.gene = gene;
        this.style = style;

        this.cnt = 0;
        this.code = getStyle( gene, style );
        if ( this.code==undefined ) return;

        let cds = this.code;
        this.cnt = this.code.length;

        this.valcnts = {};
        this.sum = 0;
        this.sumsq = 0;
        this.cntmax = 0;
        this.maxval = '';
        this.vals = codeVals( gene, cds );         // array of just values (no bar-markers)
        setEval( gene, style, 'code_len', cds.length );     // number of events
        for ( let i=0; i < this.vals.length; i++ ){
            let cd = this.vals[ i ];
            if ( this.valcnts[cd]==undefined ){
                this.valcnts[cd] = 0;
            }
            this.valcnts[cd]++;
            if ( this.valcnts[cd] > this.cntmax ){
                this.cntmax = this.valcnts[cd];
                this.maxval = cd;
            }

            if ( !isNaN( Number( cd )) ){     // numeric codes
                cd = Number( cd );
                this.sum += cd;
                this.sumsq += cd*cd
            }
        }
        setEval( gene, style, 'avg_val',  this.sum / this.vals.length );
        setEval( gene, style, 'avg_sqr',  this.sumsq / this.vals.length );
        setEval( gene, style, 'hist_max', this.maxval );
        setEval( gene, style, 'hist_maxPct', this.cntmax/this.vals.length );

        this.auto = [];         // calc auto-correlation
        this.max_auto = 0;      // max auto-correlation
        this.max_pos = [];       // offset of max        
        for ( let pos=1; pos < this.vals.length; pos++ ){
            let cnt = 0;
            let len = this.vals.length - pos;
            for (let i=0; i < len; i++ ){
                if ( this.vals[ i ] == this.vals[ i + pos ] ) cnt++;
            }
            let ncnt = cnt/len;
            this.auto.push( ncnt );
            if ( ncnt > this.max_auto ) this.max_auto = ncnt;
        }
        for ( let i=0; i<this.auto.length; i++ )
          if ( this.auto[i] > this.max_auto*0.9 ) this.max_pos.push( i );
        
        setEval( gene, style, 'auto_max', this.max_auto );
        setEval( gene, style, 'auto_off', this.max_pos );

        setEval( gene, style, 'tic_len', isRhythmStyle( style )? this.sum : 0 );

        setEval( gene, style, 'legal', evalLegality( gene, style, this.vals ));
      //  if ( style=='romans' ) setEval( gene, style, 'legal', evalChordProgression( gene, this.vals ));
    }
    html(){
        let htics = isRhythmStyle( this.style )? ` tics=${this.sum}` : '';
        let h = `<div id="${this.gene.nm}_hist"> <span class="hTitle"> ${this.gene.nm} ${this.style} cnt=${this.cnt} ${htics} maxcor=${this.max_auto} at ${this.max_pos}</span> <div id="${this.style}bars" class="hist"> `;
        if ( this.valcnts ){    // had values to count
            let valNms = Object.getOwnPropertyNames( this.valcnts );
            valNms = valNms.sort( (a,b) => { 
                    let na = Number(a), nb = Number(b);
                    if ( !isNaN(na)&&!isNaN(nb) ) return na-nb;
                    return isNaN(na)? -1 : 1;
                }
            );
            let ht = 10, cls = 'sp2', rows = scaleRows();
            for ( let i=0; i<valNms.length; i++ ){
                let nm = valNms[i];
                let num = Number( nm );
                if ( nm!='r' && nm!='.' && nm[0]!='|' ){
                    switch ( this.style ){
                        case 'mRhythm':
                        case 'hRhythm':  
                        case 'intervals':      
                            cls = i%2==0? 'n1':'n5';    
                            break;
                        case 'scaledegrees':    
                            num = scDegToKeyNum( nm );
                        case 'notes':
                        case 'rootNote':
                            cls = rows[ num ].ntcls;
                            break;
                        case 'chords':
                        case 'romans':
                        case 'rootMajor':
                            let ch = asChord( nm );
                            cls = rows[ ch[0] ].ntcls;
                            break;
                    }
                }
                h += `<div id="hv_${nm}" class="histBar ln${this.valcnts[nm]*2} ${cls}"> ${nm} (${this.valcnts[nm]})</div>`;
            }
        }
        h += `</div></div>`;
        return h;
    }
}
function evalHist( gene, style, div ){
    let hist = new histogram( gene, style );   
    div.innerHTML = hist.html();
}

function evalLegality( g, style, vals ){
    let eval = 0;
    switch ( style ){
        case 'notes':  break;  // not used?     
        case 'intervals':  break;       // eval melody jumps
        case 'scaledegrees':  break;    // 'legality' of notes in scale
        case 'chords':  break;          // eval chords included
        case 'romans':  eval = evalRomans( g, vals );  break;  // 'legality' of chords in scale
        case 'mRhythm':  break;         // eval rhythm of melody
        case 'hRhythm':  break;         // eval rhythm of harmony
    }
    return eval;
}
function evalRomans( g, rom ){    // return fract of chord transitions that are 'legal' (for  g.eval.romans.legal )
  let major = {     // 1 => allowed transitions
    //        I, ii, iii, IV,  V, vi, VIIdim
    I:      [ 1,  1,   1,  1,  1,  1,  1  ],
    ii:     [ 0,  1,   0,  1,  1,  0,  1  ],
    iii:    [ 0,  1,   0,  1,  0,  1,  0  ],
    IV:     [ 0,  1,   0,  1,  1,  0,  1  ],
    V:      [ 1,  0,   0,  0,  1,  1,  1  ],
    vi:     [ 0,  1,   0,  1,  0,  0,  0  ],
    VIIdim: [ 1,  0,   0,  0,  1,  1,  1  ]
  };
  let majIdx = { I: 0, ii: 1, iii: 2, IV: 3, V: 4, vi:5, VIIdim: 6 };
  let minor = {     // 1 => allowed transitions
    //        i, IIdim, III, iv, v, VI, VII, bVII
    i:      [ 1,  1,   1,  1,  1,  1,   1,   1  ],
    IIdim:  [ 0,  1,   0,  1,  1,  0,   1,   0  ],
    III:    [ 0,  1,   0,  1,  0,  1,   0,   0  ],
    iv:     [ 0,  1,   0,  1,  1,  0,   1,   0  ],
    v:      [ 1,  0,   0,  0,  1,  1,   1,   0  ],
    VI:     [ 0,  1,   0,  1,  0,  0,   0,   0  ],
    VII:    [ 1,  0,   0,  0,  1,  1,   1,   0  ],
    bVII:   [ 0,  1,   1,  1,  0,  1,   0,   0  ]
  };
  let minIdx = { i: 0, IIdim: 1, III: 2, iv: 3, v: 4, VI:5, VII: 6, bVII: 7 };

  let prev = 'I';
  let allowed = major, idx = majIdx;
  if ( g.mode == "minor" ){ allowed = minor; idx = minIdx; prev = 'i'; }

  let legal = 0, tot = 0;
  for ( let r of rom ){
    tot++;
    let frRow = allowed[ prev ];
    let col = idx[ r ];
    if ( frRow!=undefined && frRow[r]!=undefined && col!=undefined ) 
        legal += frRow[ col ];
    prev = r;
  }
  return legal / tot;       // fraction of chord transitions that are 'legal'
}

// histogram computes for each style: gene.eval.style.
//   code_len:    number of code values
//   tic_len:     duration in tics ( 0 for note styles )    /g.tpb for bars
//   avg_val:     mean of numeric values
//   avg_sqr:     mean of squared numeric values
//   hist_max:    code value that is most frequent
//   hist_maxPct: fraction of code values that = hist_max
//   auto_off:    code offset with largest self matches
//   auto_max:    num matches at auto_off
//   legal:       fraction of events that are 'legal'   
var evalParms = {     // parameters for overall valuation of each style
    notes:      {  weight: 1,  best_len: 20     },   // code_len
    intervals:  {  weight: 1,  best_sqr: 16     },   // avg_sqr 
    scaledegrees:{ weight: 1    },
    chords:     {  weight: 1    },
    romans:     {  weight: 1    },
    mRhythm:    {  weight: 1    },
    hRhythm:    {  weight: 1    },
};

function mapRange( val, best, dist ){  // map best => 1,  best +/- dist => 0, further from best => negative
    let d = Math.abs( val - best );     // [0..] val distance from best
    let e = (dist - d)/ dist;           // d=0 => 1,  d==dist => 0,  d>dist => negative
    return e;
}
function evalGene( gene ){
    let toteval = 0;
    let evalStyles = [ 'notes', 'intervals', 'scaledegrees', 'chords', 'romans', 'mRhythm', 'hRhythm' ]; 
    for ( let sty of evalStyles ){
        let hist = new histogram( gene, sty );  // analyze style code strings
    }
    let tpm = gene.tpb * gene.bpb;      // tics per measure
    let nbars = gene.eval.hRhythm / tpm;

    for ( let sty of evalStyles ){
        let styeval = gene.eval[sty];
        let sP = evalParms[sty];
        let E = 0, b = 0;
        switch ( sty ){     // compute an E with positive good & larger better
            case 'notes':          // code_len == ideal    
                E = mapRange( styeval.code_len, sP.best_len, sP.best_len );    // best_len => 1,  0 & 2*best_len => 0
                break;   
            case 'intervals':      // avg_sqr == 16
                E = mapRange( styeval.avg_sqr, sP.best_sqr, sP.best_sqr );    // best_sqr => 1,  0 & 2*best_sqr => 0
                break;   
            case 'scaledegrees':  break;    // 'legality' of notes in scale
            case 'chords':  break;          // eval chords included
            case 'romans':    break;  // 'legality' of chords in scale
            case 'mRhythm':  break;         // eval rhythm of melody
            case 'hRhythm':  break;         // eval rhythm of harmony
        }
        toteval += E * sP.weight;
    }
    gene.eval.total = toteval;
    return toteval;
}

module.exports = { evalGene, evalHist };
// const { evalGene, evalHist } = require("./evalgene");
