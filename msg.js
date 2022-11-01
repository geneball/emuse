

function msg( s ){
  let info = document.getElementById( 'info' );
  info.innerHTML = s;
}

function err( s, debug ){
  msg(s);
  console.log( s );
  if ( debug ) debugger;
}

function statusMsg( s ){
  let stat = document.getElementById( 'status' );
  stat.innerText = s;
}

function nameChord( s ){
  let stat = document.getElementById( 'chordName' );
  stat.innerText = s;
}

module.exports = { msg, statusMsg, nameChord, err }; 
// const { msg, statusMsg, nameChord, err } = require("./renderer.js");

