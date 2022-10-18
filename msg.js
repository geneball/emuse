

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

module.exports = { msg, status, err }; 
// const { msg, status, err } = require("./renderer.js");

