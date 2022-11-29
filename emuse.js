
  const { chordParserFactory } = require( 'chord-symbol' );
  const { msg, err } = require("./msg.js");
  const { addClass } = require('./piano.js');

    const noteDefs =   // 0=='C-1' .. 127='G8'
	[
	  { nm: 'C',   midi4: 60 },     // C4
	  { nm: 'C#',  midi4: 61 },
	  { nm: 'D',   midi4: 62 },
	  { nm: 'D#',  midi4: 63 },
	  { nm: 'E',   midi4: 64 },
	  { nm: 'F',   midi4: 65 },
	  { nm: 'F#',  midi4: 66 },
	  { nm: 'G',   midi4: 67 },
	  { nm: 'G#',  midi4: 68 },
	  { nm: 'A',   midi4: 69 },
	  { nm: 'A#',  midi4: 70 },
	  { nm: 'B',   midi4: 71 },		// 60..71 must be 1st 12

	  { nm: 'E#',  midi4: 65 },		// non-keyboard sharps
	  { nm: 'B#',  midi4: 72 },
	  { nm: 'Cb',  midi4: 59 },
	  { nm: 'Db',  midi4: 61 },		// duplicate sharps as flats 
	  {	nm: 'Eb',  midi4: 63 },
      { nm: 'Fb',  midi4: 64 },
	  { nm: 'Gb',  midi4: 66 },
      { nm: 'Ab',  midi4: 68 },  
      { nm: 'Bb',  midi4: 70 }
	];
	function toKeyNum( nt, astype ){
		if ( astype == undefined ) astype = false;
		if (!isNaN(parseFloat(nt))) return nt;
		let lst = nt.length-1;
		if ( nt[lst-1]=='-' ) lst = lst-1;
		var oct = parseFloat( nt.substring(lst) );	// octave number if present
		if ( isNaN( oct )) 
      		oct = 4; 
		else 
			nt = nt.substring(0, lst);
		for (var i=0; i < noteDefs.length; i++){
			if ( nt.toUpperCase()=== noteDefs[i].nm.toUpperCase() ) 
				return noteDefs[i].midi4 + ( astype? -60 : (oct-4)*12 );
		}
		err( `toKeyNum: unrecognized note ${nt}`, true );
	}
	// c  c# d  d# e  f  f# g  g# a  a# b  c  -- note name
	// 0  1  2  3  4  5  6  7  8  9  10 11 12 -- semitones
	// 1     2     3  4     5     6     7     -- scale degree
	// I     ii   iii IV    V     vi    vii   -- scale degree
	const modeDefs = 
	[
	 { scale:[ 0, 2, 4, 5, 7,  9, 11 ], nm: 'Ionian',            },  	// I  + Ionian & 6 rotations
	 { scale:[ 0, 2, 4, 5, 7,  9, 11 ], nm: 'Major',             },	 	// I
	 { scale:[ 0, 2, 3, 5, 7,  9, 10 ], nm: 'Dorian'             },	 	// II
	 { scale:[ 0, 1, 3, 5, 7,  8, 10 ], nm: 'Phrygian'           },  	// III
	 { scale:[ 0, 2, 4, 6, 7,  9, 11 ], nm: 'Lydian'             },  	// IV
	 { scale:[ 0, 2, 4, 5, 7,  9, 10 ], nm: 'Mixolydian'         },  	// V
	 { scale:[ 0, 2, 3, 5, 7,  8, 10 ], nm: 'Aeolian'            },  	// VI
	 { scale:[ 0, 2, 3, 5, 7,  8, 10 ], nm: 'Minor'              },  	// VI
	 { scale:[ 0, 1, 3, 5, 6,  8, 10 ], nm: 'Locrian'            },  	// VII
	
	 { scale:[ 0, 2, 3, 5, 7,  9, 11 ], nm: 'Melodic minor'      },		// I  + 6 rotations
	 { scale:[ 0, 1, 3, 5, 7,  9, 10 ], nm: 'Phrygian ♯6' 		 },		// II
	 { scale:[ 0, 2, 4, 6, 8,  9, 11 ], nm: 'Lydian augmented' 	 },		// III
	 { scale:[ 0, 2, 4, 6, 7,  9, 11 ], nm: 'Lydian dominant' 	 },		// IV
	 { scale:[ 0, 2, 4, 5, 7,  9, 11 ], nm: 'Aeolian dominant' 	 },		// V
	 { scale:[ 0, 2, 3, 5, 6,  8, 10 ], nm: 'Half-diminished' 	 },		// VI
	 { scale:[ 0, 1, 3, 4, 6,  8, 10 ], nm: 'Altered dominant' 	 },		// VII

	 { scale:[ 0, 2, 3, 5, 7,  8, 11 ], nm: 'Harmonic minor'     },		// I  + 6 rotations
 	 { scale:[ 0, 1, 3, 5, 6,  9, 10 ], nm: 'Locrian ♯6' 		 },		// II
	 { scale:[ 0, 2, 4, 5, 8,  9, 11 ], nm: 'Ionian ♯5' 		 },		// III
	 { scale:[ 0, 2, 3, 6, 7,  9, 10 ], nm: 'Ukrainian Dorian' 	 },		// IV
	 { scale:[ 0, 1, 4, 5, 7,  8, 10 ], nm: 'Phrygian Dominant'  },		// V	 
	 { scale:[ 0, 3, 4, 6, 7,  9, 11 ], nm: 'Lydian ♯2' 		 },		// VI
	 { scale:[ 0, 1, 3, 4, 6,  8,  9 ], nm: 'Altered Diminished' },		// VII

	 { scale:[ 0, 2, 4, 5, 7,  8, 11 ], nm: 'Harmonic major' 	 },		// I  + 6 rotations
	 { scale:[ 0, 2, 3, 5, 6,  9, 10 ], nm: 'Dorian ♭5' 		 },		// II
	 { scale:[ 0, 1, 3, 4, 7,  8, 10 ], nm: 'Phrygian b4'  		 },		// III	 
	 { scale:[ 0, 2, 3, 6, 7,  9, 11 ], nm: 'Lydian ♭3' 		 },		// IV
	 { scale:[ 0, 1, 4, 5, 7,  9, 10 ], nm: 'Mixolydian ♭2' 	 },		// V
	 { scale:[ 0, 3, 4, 6, 8,  9, 11 ], nm: 'Lydian Augmented ♯2'},		// VI
	 { scale:[ 0, 1, 3, 5, 6,  8,  9 ], nm: 'Locrian ♭♭7' 		 },		// VII

	 { scale:[ 0, 1, 4, 5, 7,  8, 11 ], nm: 'Double harmonic' 	 },		// I  + 6 rotations
	 { scale:[ 0, 3, 4, 6, 7, 10, 11 ], nm: 'Lydian ♯2 ♯6' 		 },		// II
	 { scale:[ 0, 1, 3, 4, 7,  8,  9 ], nm: 'Phrygian ♭♭7 ♭4' 	  },	// III
	 { scale:[ 0, 2, 3, 6, 7,  8, 11 ], nm: 'Hungarian minor' 	 },		// IV
	 { scale:[ 0, 1, 4, 5, 6,  9, 10 ], nm: 'Locrian ♮6 ♮3' 	 },		// V
	 { scale:[ 0, 3, 4, 5, 8,  9, 11 ], nm: 'Ionian ♯5 ♯2' 		 }, 	// VI
	 { scale:[ 0, 1, 2, 5, 6,  8,  9 ], nm: 'Locrian ♭♭3 ♭♭7' 	 }		// VII
	];

    function modeNames( ){   return modeDefs.map( x => x.nm );    }

	var currScale;
	var currRoot;			// keynum of root note in octave 4:  60..71
	var currRootNm;		   // scale root name, e.g if currRoot=61: either 'Bb' or 'C#'
	var currMode;
	var currScaleRows;
	var currScaleDegMap;
	function scaleRows( rootnm, md ){	// return currScaleRows: [0.127] with info for each key in current scale
		if ( (rootnm!=undefined && rootnm!=currRootNm) || (md!=undefined && md!=currMode) ) setScale( md, rootnm );
		return currScaleRows;
	}
	function scaleDegMap(  ){	// return currScaleDegMap
		return currScaleDegMap;
	}
	function scDegToKeyNum( sdeg ){
		let k = currScaleDegMap[ sdeg ];
		if ( k==undefined ) debugger;
		return k;
	}

	const ntNames = {	// keyed by name of a scale degree (at semitone x): 
						//   nt:[ ,, ]	name of next scDeg (x+1, x+2, x+3) (always next letter)	
						//   up1:[ ] names for non-scale note at x+1  (1 or 2 values for ['#', 'b'] )
						//   up2:[ ] names for non-scale note at x+2  (if 2 values: for as sharp, and as flat )
						'Abb': { nt:[ 'Bxx', 'Bbb', 'Bb' ], up1:[ 'Ab'       ], up2: [ 'A'        ] },
						'Ab':  { nt:[ 'Bbb', 'Bb',   'B' ], up1:[ 'A'        ], up2: [ 'Bb'       ] },
						'A':   { nt:[  'Bb',  'B',  'B#' ], up1:[ 'A#', 'Bb' ], up2: [ 'B'        ] },
						'A#':  { nt:[   'B', 'B#', 'B##' ], up1:[ 'B'        ], up2: [ 'B#', 'Cb' ] },
						'A##': { nt:[  'B#','B##',  'Bx' ], up1:[ 'C'        ], up2: [ 'C#'       ] },

						'Bbb': { nt:[ 'Cbb', 'Cb',   'C' ], up1:[ 'Bb'       ], up2: [ 'B'        ] },
						'Bb':  { nt:[  'Cb',  'C',  'C#' ], up1:[ 'B'        ], up2: [ 'C'        ] },
						'B':   { nt:[   'C', 'C#', 'C##' ], up1:[ 'C'        ], up2: [ 'C#'       ] },
						'B#':  { nt:[  'C#','C##',  'Cx' ], up1:[ 'C#'       ], up2: [ 'D'        ] },	
						'B##': { nt:[ 'C##', 'Cx', 'Cxx' ], up1:[ 'C##'      ], up2: [ 'Cx'       ] },

						'Cbb': { nt:[ 'Dxx', 'Dbb', 'Db' ], up1:[ 'Cb'       ], up2: [ 'C'        ] },
						'Cb':  { nt:[ 'Dbb', 'Db',   'D' ], up1:[ 'C'        ], up2: [ 'Db'       ] },
						'C':   { nt:[  'Db',  'D',  'D#' ], up1:[ 'C#', 'Db' ], up2: [ 'D'        ] },
						'C#':  { nt:[   'D', 'D#', 'D##' ], up1:[ 'D'        ], up2: [ 'D#', 'Eb' ] },	
						'C##': { nt:[  'D#','D##', 'Dxx' ], up1:[ 'D#'       ], up2: [ 'D##'      ] },

						'Dbb': { nt:[ 'Exx','Ebb',  'Eb' ], up1:[ 'Db'       ], up2: [ 'D'        ] },
						'Db':  { nt:[ 'Ebb', 'Eb',   'E' ], up1:[ 'D'        ], up2: [ 'Eb'       ] },
						'D':   { nt:[  'Eb',  'E',  'E#' ], up1:[ 'D#', 'Eb' ], up2: [ 'E'        ] },
						'D#':  { nt:[   'E', 'E#', 'E##' ], up1:[ 'E'        ], up2: [ 'E#', 'Fb' ] },	
						'D##': { nt:[  'E#','E##', 'Exx' ], up1:[ 'E#'       ], up2: [ 'E##'      ] },

						'Ebb': { nt:[ 'Fbb', 'Fb',   'F' ], up1:[ 'Eb'       ], up2: [ 'E'        ] },
						'Eb':  { nt:[  'Fb',  'F',  'F#' ], up1:[ 'E'        ], up2: [ 'F'        ] },
						'E':   { nt:[   'F', 'F#', 'F##' ], up1:[ 'F'        ], up2: [ 'F#'       ] },
						'E#':  { nt:[  'F#','F##',  'Fx' ], up1:[ 'F#'       ], up2: [ 'F##'      ] },	
						'E##': { nt:[ 'F##','Fxx', 'Fxx' ], up1:[ 'F##'      ], up2: [ 'Fx'       ] },

						'Fbb': { nt:[ 'Gxx','Gbb',  'Gb' ], up1:[ 'Fb'       ], up2: [ 'F'        ] },
						'Fb':  { nt:[ 'Gbb', 'Gb',   'G' ], up1:[ 'F'        ], up2: [ 'Gb'       ] },
						'F':   { nt:[  'Gb',  'G',  'G#' ], up1:[ 'F#', 'Gb' ], up2: [ 'G'        ] },
						'F#':  { nt:[   'G', 'G#', 'G##' ], up1:[ 'G'        ], up2: [ 'G#', 'Ab' ] },	
						'F##': { nt:[  'G#','G##', 'Gxx' ], up1:[ 'G#'       ], up2: [ 'G##'      ] },

						'Gbb': { nt:[ 'Axx','Abb',  'Ab' ], up1:[ 'Gb'       ], up2: [ 'G'        ] },
						'Gb':  { nt:[ 'Abb', 'Ab',   'A' ], up1:[ 'G'        ], up2: [ 'Ab'       ] },
						'G':   { nt:[  'Ab',  'A',  'A#' ], up1:[ 'G#', 'Ab' ], up2: [ 'A'        ] },
						'G#':  { nt:[   'A', 'A#', 'A##' ], up1:[ 'A'        ], up2: [ 'A#', 'Bb' ] },
						'G##': { nt:[  'A#','A##', 'Axx' ], up1:[ 'A#'       ], up2: [ 'A##'      ] }					
					}
					// major 2 2 1 2 2 2 1  => 0, 2, 4, 5, 7,  9, 11, 12  
					// Db 2 Eb 2 F 1 Gb 2 Ab 2 Bb 2 C 1 Db
					// minor 2 1 2 2 1 2 2 => 0, 2, 3, 5, 7,  8, 10
					// Db 2 Eb 1 Fb 2 Gb 2 Ab 1 Bbb 2 Cb 2 Db
	const cls = {   // class names by scale degree
			'1':	{ chd: 'ch1',   nt: 'n1',   sd:'sd1',   row: 'sp1' },
			'1#':	{ chd: 'ch12',  nt: 'n12',  sd:'sd12',  row: 'sp2' },
			'2b':	{ chd: 'ch12',  nt: 'n12',  sd:'sd12',  row: 'sp2' },
			'1##':	{ chd: 'ch21',  nt: 'n21',  sd:'sd21',  row: 'sp2' },
			'2':	{ chd: 'ch2',   nt: 'n2',   sd:'sd2',   row: 'sp1' },
			'2#':	{ chd: 'ch23',  nt: 'n23',  sd:'sd23',  row: 'sp2' },
			'3b':	{ chd: 'ch23',  nt: 'n23',  sd:'sd23',  row: 'sp2' },
			'2##':	{ chd: 'ch32',  nt: 'n32',  sd:'sd32',  row: 'sp2' },
			'3':	{ chd: 'ch3',   nt: 'n3',   sd:'sd3',   row: 'sp1' },
			'3#':	{ chd: 'ch34',  nt: 'n34',  sd:'sd34',  row: 'sp2' },
			'4b':	{ chd: 'ch34',  nt: 'n34',  sd:'sd34',  row: 'sp2' },
			'3##':	{ chd: 'ch43',  nt: 'n43',  sd:'sd43',  row: 'sp2' },
			'4':	{ chd: 'ch4',   nt: 'n4',   sd:'sd4',   row: 'sp1' },
			'4#':	{ chd: 'ch45',  nt: 'n45',  sd:'sd45',  row: 'sp2' },
			'5b':	{ chd: 'ch45',  nt: 'n45',  sd:'sd45',  row: 'sp2' },
			'4##':	{ chd: 'ch54',  nt: 'n54',  sd:'sd54',  row: 'sp2' },
			'5':	{ chd: 'ch5',   nt: 'n5',   sd:'sd5',   row: 'sp1' },
			'5#':	{ chd: 'ch56',  nt: 'n56',  sd:'sd56',  row: 'sp2' },
			'6b':	{ chd: 'ch56',  nt: 'n56',  sd:'sd56',  row: 'sp2' },
			'5##':	{ chd: 'ch65',  nt: 'n65',  sd:'sd65',  row: 'sp2' },
			'6':	{ chd: 'ch6',   nt: 'n6',   sd:'sd6',   row: 'sp1' },
			'6#':	{ chd: 'ch67',  nt: 'n67',  sd:'sd67',  row: 'sp2' },
			'7b':	{ chd: 'ch67',  nt: 'n67',  sd:'sd67',  row: 'sp2' },
			'6##':	{ chd: 'ch76',  nt: 'n76',  sd:'sd76',  row: 'sp2' },
			'7':	{ chd: 'ch7',   nt: 'n7',   sd:'sd7',   row: 'sp1' },
			'7#':	{ chd: 'ch71',  nt: 'n71',  sd:'sd71',  row: 'sp2' },
			'1b':	{ chd: 'ch71',  nt: 'n71',  sd:'sd71',  row: 'sp2' },
			'7##':	{ chd: 'ch17',  nt: 'n17',  sd:'sd17',  row: 'sp2' },
		};

	function addScaleRow( k, insc, ntnm, scdeg, bdeg ){  // add row to currScaleRows
		if ( k<0 || k>127 ) return;		// only legal midi keys

		if ( cls[scdeg]===undefined ) debugger;
		currScaleRows[ k ] = { key: k, inscale: insc, ntnm: ntnm, scdeg: scdeg, bdeg: bdeg, 
			ntcls: cls[scdeg].nt, sdcls: cls[scdeg].sd, chdcls: cls[scdeg].chd, rowcls: cls[scdeg].row };
		currScaleDegMap[ bdeg ] = k;   // map from eg. GMaj:  '1' => 67, '1#' => 68, '-1' => 65
	}
	function calcScaleRows(  ){		// load currScaleRows[key] with { key: nt: scdeg: bdeg: inscale: ntcls: sdcls: chdcls: rowcls: }
		currScaleRows = []; 
		currScaleDegMap = {};
	
		// currScaleRows[midi-key]
		// { key: 		midi note num
		//   inscale:   true, for scdeg = '1'..'7'
		//   ntnm:      name of note in scale, e.g. 'C#' or 'Gbb'
		//   scdeg:		e.g. 1..7##  -- scale degree in current mode/root
		//   bdeg:      scale degree of inscale notes adjusted so root = 0,  e.g. for Cmajor: -59..67  
		//   ntcls:     class name for note
		//   sdcls:     class name for scale degree background
		//   chdcls:    class name for notes in a chord
		//   rowcls:    class name for background
	    // }

		let useflat = false;
		if ( currRootNm.endsWith('b')) useflat = true;		// e.g. root=='Bb' => choose flats over sharps for non-scale notes
		let ntnm = currRootNm;
		for ( let oct=-1; oct<11; oct++ ){  // fill each midi octave
			for ( let isc=0; isc<7; isc++ ){  // idx into currscale.scale[]: semitones to next scale degree
				let semi = currScale.scale[ isc ];		// semitones above root in octave
				let k = currRoot%12 + oct*12 + semi;	// key number
				if ( k > 127 ) break;
				let bsc = isc + (oct-5)*7;		// scdeg in octave
				addScaleRow( k, true, ntnm, `${isc+1}`, `${bsc+1}` );  // add inscale note ( scaleDegree isc+1 )
				let nxtScaleNt = isc==6? 12: currScale.scale[isc+1];		// semitone of next inscale note
				let ntstep = nxtScaleNt - semi; 	// semitones to next scale note: 1, 2, or 3

				let names = ntNames[ ntnm ];   // next notes table for current scale note
				if ( nxtScaleNt > semi+1 ){ // at least one non-scale in between
					let nm = ( useflat && names.up1.length>1 )? names.up1[1] : names.up1[0];
					addScaleRow( k+1, false, nm, `${isc+1}#`, `${bsc+1}#` );
				}
				if ( nxtScaleNt > semi+2 ){ // 3 semitone step -- so add a second non-scale note
					let nm = ( useflat && names.up2.length>1 )? names.up2[1] : names.up2[0];
					addScaleRow( k+2, false, nm, `${isc+2}b`, `${bsc+2}b` );		// always use flat for 2nd non-scale 
				}
				ntnm = ntNames[ntnm].nt[ ntstep-1 ];   // name of next scale note
			}
		}
	
		// // calc off & lettOff so currScaleRows[ currRoot ] = { scdeg: '1', nt: LetterSemiNote[currRootLetter][0], ... }
		// let off = 12 - (currRoot % 12);   // scale semitone of C-1 
		// let letOff = 8-(currRootLetter.charCodeAt(0)-'A'.charCodeAt(0));
		// let oct = Math.trunc(currRoot / 12)+1;
		// let octB = oct * -7;		// octB => oct octaves below Root
		// let prevInScale = -1;
		// for ( let k=0; k < 128; k++ ){
		// 	// bdeg (e.g. in GMaj), C-1 => -68,  G3 => 1, C4 => 5
		// 	let scidx = ( k + off ) % 12;			// 0..12
		// 	let scdeg = currScale.scDeg[ scidx ];	// '1' .. '7##'
		// 	let inscale = scdeg.length==1;	// no # => inscale			
		// 	if ( scdeg==='1' ) octB += 7;
		// 	let bdeg =  octB + Number(scdeg.substring(0,1));
			
		// 	let scDegKey = `${bdeg}${scdeg.substring(1)}`;
		// 	currScaleDegMap[  scDegKey ] = k;   // map from eg. GMaj:  '1' => 67, '1#' => 68, '-1' => 65

		// 	let letidx = (currScale.lett[ scidx ] + letOff) % 7;
		// 	let nt = LetterSemiNote[ letidx ][scidx];   // emStr( k, false, 0 );

		// 	// if ( inscale && prevInScale>=0 && currScaleRows[prevInScale].nt[0]==nt[0] ){
		// 	// 	let ont = nt;
		// 	// 	nt = emStr( k, false, 1 );
		// 	// 	msg( `${k}: ${currScaleRows[prevInScale].nt} ${ont} => ${nt}`);
		// 	// }
		// 	let scrow = { key:k, nt: nt, scdeg: scdeg, bdeg: scDegKey, inscale: inscale,
		// 		ntcls: cls[ scdeg ].nt, sdcls: cls[scdeg].sd, chdcls: cls[ scdeg ].chd, rowcls: cls[ scdeg ].row };
	
		// 	currScaleRows[ k ] = scrow;
		// 	if ( inscale ) prevInScale = k;
		// }

		return currScaleRows;
	}
	// const LetterSemiNote = [   // LetterSemiNote[A..G][0..11] = maps (Letter, semitone) => name 
	// //sm-tn   0     1      2     3      4      5      6      7      8      9     10     11
	// 	[ 'Abb', 'Ab',   'A', 'A#', 'A##',    '',    '',    '',    '',    '',    '',    '' ],
	// 	[    '',   '', 'Bbb', 'Bb',   'B',  'B#', 'B##',    '',    '',    '',    '',    '' ],
	// 	[    '',   '',    '',   '', 'Cbb',  'Cb',   'C',  'C#', 'C##',    '',    '',    '' ],	
	// 	[    '',   '',    '',   '',    '',    '', 'Dbb',  'Db',   'D',  'D#', 'D##',    '' ],	
	// 	[ 'E##',   '',    '',   '',    '',    '',    '',    '', 'Ebb',  'Eb',   'E',  'E#' ],	
	// 	[   'F', 'F#', 'F##',   '',    '',    '',    '',    '',    '',    '', 'Fbb',  'Fb' ],	
	// 	[ 'Gbb', 'Gb',   'G', 'G#',  'G##',   '',    '',    '',    '',    '',    '',    '' ]
	// ];		
	function setScale( md, root ){	// set currScale, currRoot & cuffScaleRows for selected mode & root (e.g. 'A#')
		// if ( modeDefs[0].scDeg == undefined )
		// 	initModeDegrees();

        if (root==undefined || !isNaN(Number(root))) debugger;
		currRootNm = root;
		currRoot = toKeyNum( root );
		if ( md===undefined ) md = 'Major'; // modeDefs[0];
		currMode = md;
		currScale = null;
		md = md.trim().toUpperCase();
		for (var i=0; i < modeDefs.length; i++)
			if ( md ===  modeDefs[i].nm.toUpperCase() ){
				currScale = modeDefs[i];
				break;
			}
		if ( currScale===null )	{	
			err( `toScale: unrecognized mode ${md}`, false );
			currScale = modeDefs[0];
		}
		calcScaleRows();
		let s = `${currRootNm} ${currMode}`;
		for ( let i=0; i<12; i++ ){
			let rw = currScaleRows[currRoot+i];
			s += ` ${rw.scdeg}=${rw.ntnm}`;
		}
		msg( s );
	}
	function toScale( md, root ){		// return [] of semitones in scale, e.g. [ 0,2,4,5,7,9,11,12 ]
		debugger; //setScale( md, root );
		return currScale.scale.map( v => currRoot + v );
	}	
	// c  c# d  d# e  f  f# g  g# a  a# b  c  -- note name
	// 0  1  2  3  4  5  6  7  8  9  10 11 12 -- semitones
	// 1     2     3  4     5     6     7     -- scale degree
	// I     ii   iii IV    V     vi    vii   -- scale degree
	var chordDefs = null;

    function chordNames( numNotes ){
		let triads   = [ 'M', 'm', 'dim', 'aug', 'b5',  'sus2', 'sus4' ];
		let quartads = [ 'M7', 'm7', '7', '7aug', '7b5', 'mM7', 'm7b5', 'dim7',	'6', 'M7b5', 'M7aug', 'm6', 'mM7b5', 'm(9)', '(9)', '7sus2', '7sus4' ];
		let quintads = [ '9', '6(9)', '7(9)', 'M7(#11)', 'm7(9)', '7(b9)', '7(b13)', '7(13)', '7(#9)', 'm7(11)', '7(#11)' ];
		// 'M7(9)','mM7(9)',

		if ( chordDefs === null ){
			chordDefs = [];
			for ( chdnm of triads ) 
				chordDefs.push( { nm: chdnm, nts: toChord( chdnm, 0 ) } );
			for ( chdnm of quartads ) 
				chordDefs.push( { nm: chdnm, nts: toChord( chdnm, 0 ) } );
			for ( chdnm of quintads ) 
				chordDefs.push( { nm: chdnm, nts: toChord( chdnm, 0 ) } );
		}

		if ( numNotes==3 ) return triads;
		if ( numNotes==4 ) return quartads;
		if ( numNotes==5 ) return quintads;

        return chordDefs.map( x => x.nm );
    }

	var parseChord = chordParserFactory();

	function toChord( chd, root ){
		let chnm = emStr( root, true ) + chd;
		chnm = chnm.trim();
		if ( 'ABCDEFG'.includes( chd[0]) ) chnm = chd;
		const chord = parseChord( chnm.trim() );
		if ( chord.error==undefined ){
			let norm = chord.normalized;
			let semis = norm.semitones;
			let bassNt = norm.bassNote;
			if ( bassNt != undefined ){  // inverted
				for ( let i=0; i < norm.notes.length; i++ ){
					if ( norm.notes[i] == bassNt ) break;  // found bass -- nothing else to invert
					semis[ i ] += 12;
				}
				semis = semis.sort( (a,b) => { return a-b; } );
			}
			let s = semis.map( x => x + root );
			return s;
		}
		else  err( `parseChord( ${chnm} ) => ${chord.error[0].message}`, true ); 
	}
	function idxChd( chd ){		// return idx of matching chordDef[] or -1
		for (var i=0; i < chordDefs.length; i++){
			if (chd.length === chordDefs[i].nts.length && 
                chd.every((val,idx) => val == chordDefs[i].nts[idx] ))
				    return i;
        }
		return -1;
	}
	function chordName( chd, astype, split ){	// return chord name e.g. [60,64,67] => "C4M"  (or if astype==true, "CM")
		if (astype==undefined) astype == false;
		if (split==undefined) split == false;
		if ( !(chd instanceof Array)) 
            debugger;
		var rt = chd[0], chd2;
		let nts = chd.map( (v, i) => emStr( chd[i], astype ) );			
        chd2 = chd.map( x => x-rt );
 
		let idx = idxChd( chd2 );
		if ( idx >= 0 ){  
			let nm = chordDefs[idx].nm;
			if ( nm=='M' ) nm = '';
			return split? [ nts[0], nm ] : `${nts[0]}${nm}`;
		}

		for ( let i=0; i < chd2.length-1; i++ ){	// check for inversions
			chd2[i] += 12;
			let chd3 = [ ...chd2 ];
			chd3.sort( (a,b) => a-b );
			chd3 = chd3.map( x => x-chd3[0] );
			idx = idxChd( chd3 );
			if ( idx >= 0 ){
				let nm = chordDefs[idx].nm;
				if ( nm=='M' ) nm = '';
				let rt = nts[i+1], bass = nts[0];
				return split? [ rt, `${nm}/${bass}` ] : `${rt}${nm}/${bass}`;
			}
		}

		err( `chordName: ${chd} unrecognized` );
		return 'unrec chord';
	}

	function modeChord( key ){  // return [roman, chordtype] for 'key',3,5 triad in current mode 
		// e.g. in C major:  C => [ 'I', 'M' ]  D => [ 'ii', 'm' ]   B =>  [ 'VIIdim', 'dim' ]
		//      in C minor:  C => [ 'i', 'm' ]  D => [ IIdim, dim ]  F => [ iv, m ]
		let rows = scaleRows();
		let bdeg = Number( rows[key].bdeg );
		const romans = [ 'x', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII' ];
		let rom = romans[ bdeg ];
		let chord = [ key, scDegToKeyNum(bdeg+2), scDegToKeyNum(bdeg+4) ];    // root + 3rd & 5th in scale
	   
		let [ rt, nm ] = chordName( chord, true, true );  // get name of the chord
		let rnm = nm;
		if ( nm == 'm' ){ rom = rom.toLowerCase(); rnm = ''; }
		if ( nm == 'M' ) rnm = '';
		return [ rom + rnm, nm ];
	}

	const scaleDegreeDefs = [
	  { nm: 'I',      idx: 0,  major: true  },
	  { nm: 'II',     idx: 1,  major: true  },
	  { nm: 'III',    idx: 2,  major: true  },
	  { nm: 'IV',     idx: 3,  major: true  },
	  { nm: 'V',      idx: 4,  major: true  },
	  { nm: 'VI',     idx: 5,  major: true  },
	  { nm: 'VII',    idx: 6,  major: true  },
	  { nm: 'i',      idx: 0,  major: false },
	  { nm: 'ii',     idx: 1,  major: false },
	  { nm: 'iii',    idx: 2,  major: false },
	  { nm: 'iv',     idx: 3,  major: false },
	  { nm: 'v',      idx: 4,  major: false },
	  { nm: 'vi',     idx: 5,  major: false },
	  { nm: 'vii',    idx: 6,  major: false },
	];
	// function asDeg( scDeg ){	// 0, 0.5, 1, 2, 2.5, ..6 => '1','1#','2','2#', .. 7
	// 	let deg = Math.trunc( scDeg );
	// 	return `${deg}${scDeg>deg? '#':'' }`;
	// }
	
	function emStr( chd, astype, alt ){		// return ntnm in current Key -- with octave # if astype==false // 60 => "C4"  0=>"C"  [60,64,67] => '[ C4 E4 G4 ]'
		if (currMode==undefined) setScale('Major', 'C');
		if ( alt==undefined) alt = 0;
		if ( astype===undefined ) astype = false;
		if ( chd instanceof Array ){
			var s = '[ ';
			for ( var i=0; i < chd.length; i++ )
				s += emStr( chd[i], astype ) + ' ';
			return s + ']'; // + chordName(chd);
		}
    
        var keynum = parseFloat( chd );
		if ( !isNaN( keynum )){  // treat as keyNum
		  let nm = currScaleRows[ keynum ].ntnm;
		  if ( astype ) return nm;

 		  var oct = Math.trunc(keynum/12)-1;
		  return  `${nm}${oct}`;

//           var scdeg = keynum % 12;
// 		  if ( noteDefs[scdeg]==undefined ) debugger;
// //		  return noteDefs[scdeg].nm + (astype? '' : `${oct}`);		// astype =>  no octave
// 		  return noteDefs[scdeg].nms[alt] + (astype? '' : `${oct}`);		// astype =>  no octave
		}
		return `? ${chd}`;
	}
	
	function emTest(){
		for(const v of [ 60, 'Ab', 'C4', 'C6', 'C#3', 'bb', 'c#' ]){
            var kn = toKeyNum(v);
 			msg( `toKeyNum(${v}) = ${kn} = ${emStr(kn, false)}` );
        }

        for(const v of [ 'major', 'locrian', 'harmonic minor' ])
			msg( `toScale(${v}) = [${toScale(v)}]` );

        for(const v of [ 'M', 'm', 'dim', 'mM7' ]){
			  var ch1 = toChord(v, 'C');
			  var ch3 = toChord(v,'E');
			  var ch4 = toChord(v,'Bb');
 			  msg( `toChord(${v},C) = [${ch1}] = ${emStr(ch1, false)} = ${chordName(ch1)}` );
			  msg( `toChord(${v},E) = [${ch3}] = ${emStr(ch3, true)} = ${chordName(ch3)}` );
			  msg( `toChord(${v},Bb) = [${ch4}] = ${emStr(ch4, true)} = ${chordName(ch4)}` );
        }
	}


	
module.exports = { toKeyNum, setScale, toScale, scaleRows, scaleDegMap, scDegToKeyNum, modeNames, chordNames, toChord, chordName, modeChord, emStr, emTest }; 
// const { toKeyNum, setScale, toScale, scaleRows, scaleDegMap, scDegToKeyNum, modeNames, chordNames, toChord, chordName, emStr, emTest } = require( './emuse.js' );