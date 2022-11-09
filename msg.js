const { dialog } = require('electron')

function msg( s ){
  let info = document.getElementById( 'info' );
  info.innerHTML = s;
}

function err( s ){
  console.log( s );  
  let opts = {
    msg: s, 
    type: 'error',
    buttons: [ 'cancel', 'debug' ], defaultId: 0
  };
  if (dialog==undefined) msg( s );
  else
  if ( dialog.showMessageBoxSync( opts )==1 ) debugger;
}

function question( s, detail ){
  let opts = {
    msg: s, 
    type: 'question',
    buttons: [ 'no', 'yes' ], defaultId: 0
  };
  if (dialog==undefined){ msg( s + detail ); return 0; }
  else
   return dialog.showMessageBoxSync( opts )==1;
}

function statusMsg( s ){
  let stat = document.getElementById( 'status' );
  stat.innerText = s;
}

function nameChord( s ){
  let stat = document.getElementById( 'chordName' );
  stat.innerText = s;
}

module.exports = { msg, statusMsg, nameChord, err, question }; 
// const { msg, statusMsg, nameChord, err, question } = require("./renderer.js");

