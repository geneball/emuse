// const jetpack = require("fs-jetpack");
// const { find } = require("fs-jetpack");
// const { setKeyScale } = require("./piano");

const { msg, err } = require( './msg.js' );
const { asChord } = require( './etrack.js' );
const { scDegToKeyNum } = require("./emuse");
const { getStyle, isRhythmStyle  } = require( './egene.js' );

class histogram {
    constructor( gene, style ){
        this.gene = gene;
        this.style = style;

        this.cnt = 0;
        this.code = getStyle( gene, style );
        if ( this.code==null ) return;

        let cds = this.code;
        this.cnt = this.code.length;
        this.values = {};
        this.valueCnt = 0;
        this.sum = 0;
        this.sumsq = 0;
        this.cntmin = 10000;
        this.cntmax = -10000;
    
        this.auto = [];         // calc auto-correlation
        this.max_auto = 0;      // max auto-correlation
        this.max_pos = 0;       // offset of max
        this.vals = [];         // array of just values (no bar-markers)
        for ( let i=0; i < cds.length; i++ ){
            let cd = cds[i].trim();
            if ( cd=='' ) err( `histogram:  ${gene.nm} gene.${style}[${i}] is '' ` );
            if ( cd!='.' && cd[0]!='|' ){
                this.vals.push( cd );
                if ( this.values[cd]==undefined ){
                    this.values[cd] = 0;
                    this.valueCnt++;
                }
                this.values[cd]++;
                if ( this.values[cd] < this.cntmin ) this.cntmin = this.values[cd];
                if ( this.values[cd] > this.cntmax ) this.cntmax = this.values[cd];

                if ( !isNaN( Number( cd )) ){     // numeric codes
                    cd = Number( cd );
                    this.sum += cd;
                    this.sumsq += cd*cd
                }
            }
        }
        for ( let pos=1; pos < this.vals.length; pos++ ){
            let cnt = 0;
            for (let i=0; i < this.vals.length-pos; i++ ){
                if ( this.vals[ i ] == this.vals[ i + pos ] ) cnt++;
            }
            this.auto.push( cnt );
            if ( cnt > this.max_auto ){ this.max_auto = cnt; this.max_pos = pos; }
        }
        
    }
    html(){
        let htics = isRhythmStyle( this.style )? ` tics=${this.sum}` : '';
        let h = `<div id="${this.gene.nm}_hist"> <span class="hTitle"> ${this.gene.nm} ${this.style} cnt=${this.cnt} ${htics} maxcor=${this.max_auto} at ${this.max_pos}</span> <div id="${this.style}bars" class="hist"> `;
        let valNms = Object.getOwnPropertyNames( this.values );
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
            h += `<div id="hv_${nm}" class="histBar ln${this.values[nm]*2} ${cls}"> ${nm} (${this.values[nm]})</div>`;
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
