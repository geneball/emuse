// const { toKeyNum, setScale, scDegToKeyNum, scaleRows, modeNames, chordNames, toChord, chordName } = require("./emuse");
// const { asChord } = require( './etrack.js' );
// const jetpack = require("fs-jetpack");
// const { find } = require("fs-jetpack");
// const { msg, err } = require( './msg.js' );
// const { setKeyScale } = require("./piano");

class histogram {
    constructor( gene, style ){
        this.gene = gene;
        this.style = style;

        this.cnt = 0;
        if ( gene[style]==undefined || gene[style].trim()=='' ){
            msg( `histogram: ${gene.nm} gene.${style} empty` );
        }  
        let cds = this.code = gene[ style ].split(' ');
        this.cnt = this.code.length;
        this.values = {};
        this.valueCnt = 0;
        this.sum = 0;
        this.sumsq = 0;
        for ( let i=0; i < cds.length; i++ ){
            let cd = cds[i].trim();
            if ( cd=='' ) err( `histogram:  ${gene.nm} gene.${style}[${i}] is '' ` );
            if ( this.values[cd]==undefined ){
                this.values[cd] = 0;
                this.valueCnt++;
            }
            this.values[cd]++;
            if ( !isNaN( Number( cd )) ){     // numeric codes
                this.sum += cd;
                this.sumsq += cd*cd
            }
        }
    }
    html(){
        let h = `<div id="${this.gene.nm}_hist"> <span class="hTitle" ${this.gene.nm} ${this.style} </span> <div id="${this.style}bars"> `;
        


        h += `</div></div>`;
        return h;
    }
}

function evalHist( gene, style, div ){
    let hist = new histogram( gene, style );
    div.innerHtml = hist.html();
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
