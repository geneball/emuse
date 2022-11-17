
  const { chordParserFactory } = require( 'chord-symbol' );
  const { msg, err } = require("./msg.js");

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
	function toKeyNum( nt ){
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
				return noteDefs[i].midi4 + (oct-4)*12;
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
	function initModeDegrees(){
		let shp = [ '', '#', '##' ];
		for ( let sc of modeDefs ){
			let sdg = [];
			let semi = 0, sd = 0, prSharp = false;
			for ( let i=0; i<12; i++ ){
				if ( semi < sc.scale.length && sc.scale[semi]===i ){		// 0 => '1'  2 => '2'
					sd++;
					sdg.push( `${sd}` );
					semi++;
					prSharp = false;
				} else { 						// 1 => '1#'
					sdg.push( prSharp? `${sd}##` : `${sd}#` );		// e.g. 8, 11  => 6 6# 6## 7
					prSharp = true;
				}
			}
			sc.scDeg = sdg;
		}
	}
    function modeNames( ){   return modeDefs.map( x => x.nm );    }

	var currScale;
	var currRoot;
	var currMode;
	var currScaleRows;
	var currScaleDegMap;
	function scaleRows( root, md ){	// return currScaleRows: [0.127] with info for each key in current scale
		if ( (root!=undefined && root!=currRoot) || (md!=undefined && md!=currMode) ) setScale( md, root );
		return currScaleRows;
	}
	function scaleDegMap(  ){	// return currScaleRows: [0.127] with info for each key in current scale
		return currScaleDegMap;
	}
	function scDegToKeyNum( sdeg ){
		let k = currScaleDegMap[ sdeg ];
		if ( k==undefined ) debugger;
		return k;
	}
	function calcScaleRows(  ){	
		currScaleRows = []; 
		currScaleDegMap = {};

		let cls = {
			'1':	{ chd: 'ch1',   nt: 'n1',   sd:'sd1',   row: 'sp1' },
			'1#':	{ chd: 'ch12',  nt: 'n12',  sd:'sd12',  row: 'sp2' },
			'1##':	{ chd: 'ch21',  nt: 'n21',  sd:'sd21',  row: 'sp2' },
			'2':	{ chd: 'ch2',   nt: 'n2',   sd:'sd2',   row: 'sp1' },
			'2#':	{ chd: 'ch23',  nt: 'n23',  sd:'sd23',  row: 'sp2' },
			'2##':	{ chd: 'ch32',  nt: 'n32',  sd:'sd32',  row: 'sp2' },
			'3':	{ chd: 'ch3',   nt: 'n3',   sd:'sd3',   row: 'sp1' },
			'3#':	{ chd: 'ch34',  nt: 'n34',  sd:'sd34',  row: 'sp2' },
			'3##':	{ chd: 'ch43',  nt: 'n43',  sd:'sd43',  row: 'sp2' },
			'4':	{ chd: 'ch4',   nt: 'n4',   sd:'sd4',   row: 'sp1' },
			'4#':	{ chd: 'ch45',  nt: 'n45',  sd:'sd45',  row: 'sp2' },
			'4##':	{ chd: 'ch54',  nt: 'n54',  sd:'sd54',  row: 'sp2' },
			'5':	{ chd: 'ch5',   nt: 'n5',   sd:'sd5',   row: 'sp1' },
			'5#':	{ chd: 'ch56',  nt: 'n56',  sd:'sd56',  row: 'sp2' },
			'5##':	{ chd: 'ch65',  nt: 'n65',  sd:'sd65',  row: 'sp2' },
			'6':	{ chd: 'ch6',   nt: 'n6',   sd:'sd6',   row: 'sp1' },
			'6#':	{ chd: 'ch67',  nt: 'n67',  sd:'sd67',  row: 'sp2' },
			'6##':	{ chd: 'ch76',  nt: 'n76',  sd:'sd76',  row: 'sp2' },
			'7':	{ chd: 'ch7',   nt: 'n7',   sd:'sd7',   row: 'sp1' },
			'7#':	{ chd: 'ch71',  nt: 'n71',  sd:'sd71',  row: 'sp2' },
			'7##':	{ chd: 'ch17',  nt: 'n17',  sd:'sd17',  row: 'sp2' },
		}
	
		let off = 12 - (currRoot % 12); 
		let oct = Math.trunc(currRoot / 12)+1;
		let octB = oct * -7;		// octB => oct octaves below Root
		for ( let k=0; k < 128; k++ ){
			// bdeg (e.g. in GMaj), C-1 => -68,  G3 => 1, C4 => 5
			let scidx = ( k + off ) % 12;			// 0..12
			let scdeg = currScale.scDeg[ scidx ];	// '1' .. '7##'
			if ( scdeg==='1' ) octB += 7;
			let bdeg =  octB + Number(scdeg.substring(0,1));
			
			let scDegKey = `${bdeg}${scdeg.substring(1)}`;
			currScaleDegMap[  scDegKey ] = k;   // map from eg. GMaj:  '1' => 67, '1#' => 68, '-1' => 65

			let scrow = { key:k, nt: emStr(k, false), scdeg: scdeg, bdeg: scDegKey,
			ntcls: cls[ scdeg ].nt, sdcls: cls[scdeg].sd, chdcls: cls[ scdeg ].chd, rowcls: cls[ scdeg ].row };
			scrow.inscale = scrow.scdeg.length===1;		// no # => inscale
			currScaleRows[ k ] = scrow;
		}

		return currScaleRows;
	}
	function setScale( md, root ){	// set currScale, currRoot & cuffScaleRows for selected mode
		if ( modeDefs[0].scDeg == undefined )
			initModeDegrees();

        if (root==undefined) root = 'C';
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
		if ( idx >= 0 )  
			return split? [ nts[0], chordDefs[idx].nm ] : `${nts[0]}${chordDefs[idx].nm}`;

		for ( let i=0; i < chd2.length-1; i++ ){
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
	function asDeg( scDeg ){	// 0, 0.5, 1, 2, 2.5, ..6 => '1','1#','2','2#', .. 7
		let deg = Math.trunc( scDeg );
		return `${deg}${scDeg>deg? '#':'' }`;
	}
	
	function emStr( chd, astype ){		// 60 => "C4"  0=>"C"  [60,64,67] => '[ C4 E4 G4 ]'
		if ( astype===undefined ) astype = false;
		if ( chd instanceof Array ){
			var s = '[ ';
			for ( var i=0; i < chd.length; i++ )
				s += emStr( chd[i], astype ) + ' ';
			return s + ']'; // + chordName(chd);
		}
    
        var keynum = parseFloat( chd );
		if ( !isNaN( keynum )){  // treat as keyNum
		  var oct = Math.trunc(keynum/12)-1;
          var scdeg = keynum % 12;
		  if ( noteDefs[scdeg]==undefined ) debugger;
		  return noteDefs[scdeg].nm + (astype? '' : `${oct}`);		// astype =>  no octave
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

	
module.exports = { toKeyNum, setScale, toScale, scaleRows, scaleDegMap, scDegToKeyNum, modeNames, chordNames, toChord, chordName, emStr, asDeg, emTest }; 
// const { toKeyNum, setScale, toScale, scaleRows, scaleDegMap, scDegToKeyNum, modeNames, chordNames, toChord, chordName, emStr, asDeg, emTest } = require( './emuse.js' );