var JZZ = require('jzz');
require('jzz-synth-tiny')(JZZ);
require('jzz-input-kbd')(JZZ);
require('jzz-gui-select')(JZZ);


const {  toKeyNum, sdBackgrounds } = require( './emuse.js' );
// const { toKeyNum, setScale, toScale, scaleRows,sdBackgrounds, scaleDegMap, modeNames, chordNames, toChord, chordName, emStr, asDeg, emTest } = require( './emuse.js' );
var _midiOut = null;
var keyspan = [];
const minKey = 36, maxKey = 108; 
function initPiano(){
    // Register Web Audio synth to have at least one MIDI-Out port
    JZZ.synth.Tiny.register('Web Audio');

    // Create HTML piano
    let nts = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
   // let ids = ['kC','kCS','kD','kDS','kE','kF','kFS','kG','kGS','kA','kAS','kB'];

    var piano = JZZ.input.Kbd({at: 'piano', from: 'C1', to: 'C7', 
        wl:90, ww:20, bl:60, bw:14, 
        onCreate: function(){
           // this.getBlackKeys().setStyle({color:'#fff'});
           for ( let k=minKey; k<=maxKey; k++ ){
                let oct = Math.trunc(k/12)-2;
                let i = k % 12;
                let ht = `<span class="inner" id="key${k}">${k}</span>`;
                this.getKey(`${nts[i]}${oct}`).setInnerHTML(ht);
            }
        }
   
    });

    _midiOut = JZZ().openMidiOut('Microsoft GS Wavetable Synth');
    piano.connect( _midiOut );

//    _midiOut = JZZ.gui.SelectMidiOut({ at: 'selectmidiout', none: 'No MIDI Out' });
//       // Open the default MIDI Out port:
//       //_midiOut.select();
//       //const stat = document.getElementById('status')
//   //});


    // JZZ() engine must be started after jazz-midi-electron is initialized
    var keybd ={
        z:'C4',    s:'C#4',    x:'D4',    d:'D#4',    c:'E4',    v:'F4',    g:'F#4',
        b:'G4',    h:'G#4',    n:'A4',    j:'A#4',    m:'B4',  
        ',':'C5',    l:'C#5',  '.':'D5',  ';':'D#5',  '/':'E5',  "'":'F5', 
    };
    JZZ.input.ASCII( keybd).connect( piano );
        
    for ( let k=minKey; k<=maxKey; k++ ){
        let oct = Math.trunc(k/12)-2;
        let i = k % 12;
        keyspan[k] = document.getElementById(`key${k}`);
        keyspan[k].innerHTML = keybd[k]==undefined? k : keybd[k];
    }
}

initPiano();

function midiOutDev(){
    return _midiOut;
}

function removeClass( el, cls ){
    if ( el==null || el==undefined ) return;

    if ( el.classList.contains( cls ) ){
        el.classList.remove( cls );
    }
}
function rmClassFrChildren( el, cls ){
    for ( let i=0; i< el.childNodes.length; i++ ){
        let btn = el.childNodes[i];
        removeClass( btn, 'root' );
    }
}
function addClass( el, cls ){
    if ( el==null || el==undefined ) return; //debugger;

    if ( el.classList.contains( cls ) ) return;
    el.classList.add( cls );
}
function clearKeyMarkers(){
    for (let ks of keyspan ){
        removeClass( ks, 'act' );
    }
}
function setKeyScale( scaleRows ){
    if (keyspan==undefined || keyspan[minKey]==undefined) return;
    for (let k=minKey; k<=maxKey; k++){
        if (keyspan[k].className != undefined ){
            let classes = keyspan[k].className.split(' ');
            for ( let cls of classes )
                if ( cls.startsWith('sd'))
                    removeClass( keyspan[k], cls );
        }
    }
    for (let k=minKey; k<=maxKey; k++){
        addClass( keyspan[k], scaleRows[k].sdcls );
    }

}
function markKey( nt, on ){
    if ( on )
        addClass( keyspan[ nt ], 'act' );
    else
        removeClass( keyspan[ nt ], 'act' );
}

module.exports = { midiOutDev, markKey, clearKeyMarkers, setKeyScale, rmClassFrChildren, addClass, removeClass }
// { midiOutDev, markKey, clearKeyMarkers, setKeyScale, rmClassFrChildren, addClass, removeClass } = require( './piano.js' );