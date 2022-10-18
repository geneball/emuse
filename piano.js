var JZZ = require('jzz');
require('jzz-synth-tiny')(JZZ);
require('jzz-input-kbd')(JZZ);
require('jzz-gui-select')(JZZ);

//const em = require('./emuse.js');
const {  toKeyNum  } = require( './emuse.js' );

var _midiOut = null;
var keyspan = [];

function initPiano(){
    // Register Web Audio synth to have at least one MIDI-Out port
    JZZ.synth.Tiny.register('Web Audio');

    // Create HTML piano
    let nts = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    let ids = ['kC','kCS','kD','kDS','kE','kF','kFS','kG','kGS','kA','kAS','kB'];

    var piano = JZZ.input.Kbd({at: 'piano', from: 'C3', to: 'C7', 
        wl:100, ww:28, bl:66, bw:16, 
        onCreate: function(){
            this.getBlackKeys().setStyle({color:'#fff'});
            for ( oct of [3,4,5,6,7]){
                for ( let i=0; i<nts.length; i++ ){
                    let ht = `<span class=inner id=${ids[i]}${oct}></span>`;
                    this.getKey(`${nts[i]}${oct}`).setInnerHTML(ht);
                    if( oct==7 ) break; // after C7
                }
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
        // Z:'C5', S:'C#5', X:'D5', D:'D#5', C:'E5', V:'F5', G:'F#5', B:'G5', H:'Ab5', N:'A5', J:'Bb5', M:'B5'
        '48':'C3', '49':'C#3', '50':'D3', '51':'D#3', '52':'E3', '53':'F3', '54':'F#3',
        '55':'G3', '56':'G#3', '57':'A3', '58':'A#3', '59':'B3', 
            z:'C4',    s:'C#4',    x:'D4',    d:'D#4',    c:'E4',    v:'F4',    g:'F#4',
            b:'G4',    h:'G#4',    n:'A4',    j:'A#4',    m:'B4',  
            ',':'C5',    l:'C#5',  '.':'D5',  ';':'D#5',  '/':'E5',  "'":'F5', '78':'F#5', 
        '79':'G5', '80':'G#5', '81':'A5', '82':'A#5', '83':'B5',
        '84':'C6', '85':'C#6', '86':'D6', '87':'D#6', '88':'E6', '89':'F6', '90':'F#6',
        '91':'G6', '92':'G#6', '93':'A6', '94':'A#6', '95':'B6', '96':'C7'
    };
    JZZ.input.ASCII( keybd).connect( piano );
        
    for ( oct of [3,4,5,6,7]){
        for ( let i=0; i<nts.length; i++ ){
            let kn = toKeyNum(`${nts[i]}${oct}`);
            keyspan[kn] = document.getElementById(`${ids[i]}${oct}`);
        }
    }
    for( const k in keybd ){
        keyspan[ toKeyNum(keybd[k]) ].innerHTML = k;
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
        removeClass( ks, 'on' );
    }
}
function markKey( nt, on ){
    if ( on )
        addClass( keyspan[ nt ], 'on' );
    else
        removeClass( keyspan[ nt ], 'on' );
}

module.exports = { midiOutDev, markKey, clearKeyMarkers, rmClassFrChildren, addClass, removeClass }
// { midiOutDev, markKey, clearKeyMarkers, rmClassFrChildren, addClass, removeClass } = require( './piano.js' );