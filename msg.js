

function msg( s ){
  let info = document.getElementById( 'info' );
  info.innerHTML = s;
}

function err( s, debug ){
  msg(s);
  console.log( s );
  if ( debug ) debugger;
}

function status( s ){
  let stat = document.getElementById( 'status' );
  stat.innerText = s;
}

function nameChord( s ){
  let stat = document.getElementById( 'chordName' );
  stat.innerText = s;
}

module.exports = { msg, status, nameChord, err }; 
// const { msg, status, nameChord, err } = require("./renderer.js");

