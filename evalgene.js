// const jetpack = require("fs-jetpack");
// const { find } = require("fs-jetpack");
// const { setKeyScale } = require("./piano");

const { msg, err } = require( './msg.js' );
const { asChord } = require( './etrack.js' );
const { scDegToKeyNum } = require("./emuse");
const { getStyle, isRhythmStyle, setEval } = require( './egene.js' );

class histogram {
    constructor( gene, style ){
        this.gene = gene;
        this.style = style;

        this.cnt = 0;
        this.code = getStyle( gene, style );
        if ( this.code==null ) return;

        let cds = this.code;
        this.cnt = this.code.length;

        this.valcnts = {};
        this.sum = 0;
        this.sumsq = 0;
        this.cntmax = 0;
        this.maxval = '';
        this.vals = [];         // array of just values (no bar-markers)
        for ( let i=0; i < cds.length; i++ ){
            let cd = cds[i].trim();
            if ( cd=='' ) err( `histogram:  ${gene.nm} gene.${style}[${i}] is '' ` );
            if ( cd!='.' && cd[0]!='|' ){
                this.vals.push( cd );
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
        }
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
        }
    html(){
        let htics = isRhythmStyle( this.style )? ` tics=${this.sum}` : '';
        let h = `<div id="${this.gene.nm}_hist"> <span class="hTitle"> ${this.gene.nm} ${this.style} cnt=${this.cnt} ${htics} maxcor=${this.max_auto} at ${this.max_pos}</span> <div id="${this.style}bars" class="hist"> `;
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
        h += `</div></div>`;
        return h;
    }
}

function evalHist( gene, style, div ){
    let hist = new histogram( gene, style );
    div.innerHTML = hist.html();
}

function evalGene( gene ){
    let notestyles = [ 'notes', 'intervals', 'scaledegrees', 'chords', 'romans' ];
    let rhythmstyles = [ 'mRhythm', 'hRhythm' ];
    let styles = notestyles.concat( rhythmstyles );
    for ( let sty of styles ){

    }

}

module.exports = { evalGene, evalHist };
// const { evalGene, evalHist } = require("./evalgene");
