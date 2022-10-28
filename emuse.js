
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
	  { nm: 'B',   midi4: 71 },

	  { nm: 'Db',  midi4: 61 },		// duplicate sharps as flats 
	  {	nm: 'Eb',  midi4: 63 },
      { nm: 'Gb',  midi4: 66 },
      { nm: 'Ab',  midi4: 68 },  
      { nm: 'Bb',  midi4: 70 }
	];
	function toKeyNum( nt ){
		if (!isNaN(parseFloat(nt))) return nt;
		var oct = parseFloat( nt[nt.length-1] );	// octave number if present
		if ( isNaN( oct )) 
      		oct = 4; 
		else 
			nt = nt.substring(0,nt.length-1);
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
	function scaleRows( scale ){	// return map of all semitones [0..11] => [ 0..7 ] with .5 entries for non-scale notes
		let rw = [], sc = 0, r = 0;
		let off = scale[0];
		scale = scale.map( x => x-off );
		for ( let i=0; i < 12; i++ ){
			if ( i==scale[sc] ){ // semitone i is in scale
				rw.push( { inscale: true, rw: r, deg: sc, scdeg:`${sc+1}` } );	// assign next full row to scale degree sc
				r++;   
				sc++;
			} else {	// semitone i is non-scale
				rw.push ( { inscale: false, rw: r, deg: sc-0.5, scdeg:`${sc}#` } );	// insert a half-row for a non-scale scale degree
				r++;
			}
		}
		return rw;
	}
	function toScale( md, root ){		// return [] of semitones in scale, e.g. [ 0,2,4,5,7,9,11,12 ]
		if ( modeDefs[0].scDeg == undefined )
			initModeDegrees();

        if (root==undefined) root = 0;
		if ( md===undefined ) return modeDefs[0];
		if ( md instanceof Array && md.length >= 8 ) 
			return md;
		md = md.trim().toUpperCase();
		for (var i=0; i < modeDefs.length; i++)
			if ( md ===  modeDefs[i].nm.toUpperCase() )
				return modeDefs[i].scale.map( x => x+root );
		err( `toScale: unrecognized mode ${md}`, false );
		return modeDefs[0].scale;		// default Ionian
	}
	
	// c  c# d  d# e  f  f# g  g# a  a# b  c  -- note name
	// 0  1  2  3  4  5  6  7  8  9  10 11 12 -- semitones
	// 1     2     3  4     5     6     7     -- scale degree
	// I     ii   iii IV    V     vi    vii   -- scale degree
	const chordDefs = 
	[                  // semitones            scale degrees       nm        hookchart
	  { nm: 'M',       nts:[0,4,7]         },  // 1 3  5           M         ''
	  { nm: '(9)',     nts:[0,2,4,7]       },  // 1 2  3  5        (9)       (add9)
	  { nm: '6',       nts:[0,4,7,9]       },  // 1 3  5  6        6         (add5)
	  { nm: '6(9)',    nts:[0,2,4,7,9]     },  // 1 2  3  5  6     6(9)      (add6add9)
	  { nm: 'M7',      nts:[0,4,7,11]      },  // 1 3  5  7        M7        I7
	  { nm: 'M7(9)',   nts:[0,2,4,7,11]    },  // 1 2  3  5  7     M7(9)     I9
	  { nm: 'M7(#11)', nts:[0,2,4,6,11]    },  // 1 2  3  4# 7     M7(#11)   I9(b5)
	  { nm: 'b5',      nts:[0,4,6]         },  // 1 3  5b          b5        I(b5)
	  { nm: 'M7b5',    nts:[0,4,6,11]      },  // 1 3  5b 7        M7b5      I7(b5)
	  { nm: 'sus2',    nts:[0,2,7]         },  // 1 2  5           sus2      Isus2
	  { nm: 'sus4',    nts:[0,5,7]         },  // 1 4  5           sus4      Isus4
	  { nm: 'aug',     nts:[0,4,8]         },  // 1 3  5#          aug       I+(#5)
	  { nm: 'M7aug',   nts:[0,4,8,11]      },  // 1 3  5# 7        M7aug     I+7(#5)
	  { nm: 'm',       nts:[0,3,7]         },  // 1 3b 5           m         i
	  { nm: 'm(9)',    nts:[0,2,3,7]       },  // 1 2  3b 5        m(9)      i(add9)
	  { nm: '9',       nts:[0,2,3,5,7]     },  // 1 2  3b 4 5      9         I9
	  { nm: 'm6',      nts:[0,3,7,9]       },  // 1 3b 5  6        m6
	  { nm: 'm7',      nts:[0,3,7,10]      },  // 1 3b 5  6#       m7
	  { nm: 'm7(9)',   nts:[0,2,3,7,10]    },  // 1 2  3b 5  6#    m7(9)
	  { nm: 'm7(11)',  nts:[0,2,3,5,7,10]  },  // 1 2  3b 4  5 6#  m7(11)
	  { nm: 'mM7',     nts:[0,3,7,11]      },  // 1 3b 5  7        mM7
	//  { nm: 'mM7(9)',  nts:[0,2,3,7,11]    },  // 1 2  3b 5  7     mM7(9)
	  { nm: 'm7b5',    nts:[0,3,6,10]      },  // 1 3b 5b 6#       m7b5
	  { nm: 'mM7b5',   nts:[0,3,6,11]      },  // 1 3b 5b 7        mM7b5
	  { nm: 'dim',     nts:[0,3,6]         },  // 1 3b 5b          dim
	  { nm: 'dim7',    nts:[0,3,6,9]       },  // 1 3b 5b 6        dim7
	  { nm: '7',       nts:[0,4,7,10]      },  // 1 3  5  6#       7
	  { nm: '7(b9)',   nts:[0,1,4,7,10]    },  // 1 2b 3  5  6#    7(b9)
	  { nm: '7(b13)',  nts:[0,4,7,8,10]    },  // 1 3  5  6b 7b    7(b13)
	  { nm: '7(9)',    nts:[0,2,4,7,10]    },  // 1 2b 3  5  6#    7(9)
	  { nm: '7(#11)',  nts:[0,2,4,6,7,10]  },  // 1 2b 3  4# 5 6#  7(#11)
	  { nm: '7(13)',   nts:[0,4,7,9,10]    },  // 1 3  5  6  7b    7(13)
	  { nm: '7(#9)',   nts:[0,3,4,7,10]    },  // 1 2# 3  5  6#    7(#9)
	  { nm: '7b5',     nts:[0,4,6,10]      },  // 1 3  5b 6#       7b5
	  { nm: '7aug',    nts:[0,4,8,10]      },  // 1 3  5# 6#       7aug
	  { nm: '7sus4',   nts:[0,5,7,10]      },  // 1 4b 5  6#       7sus4
	  { nm: '7sus2',   nts:[0,7,10,14]     },  // 1 5 b7 9         7sus2  9(omit3)
	];
	var triads = [ 'M', 'm', 'dim', 'aug', 'b5',  'sus2', 'sus4' ];
	var quartads = [ 'M7', 'm7', '7', '7aug', '7b5', 'mM7', 'm7b5', 'dim7',
	 '6', 'M7b5', 'M7aug', 'm6', 'mM7b5', 'm(9)', '(9)', '7sus2', '7sus4' ];

	var quintads = [ '9', '6(9)', '7(9)', 'M7(9)', 'M7(#11)', 'm7(9)', 
			'mM7(9)', '7(b9)', '7(b13)', '7(13)', '7(#9)', 'm7(11)', '7(#11)' ];

    function chordNames( numNotes ){
		if ( numNotes==3 ) return triads;
		if ( numNotes==4 ) return quartads;
		if ( numNotes==5 ) return quintads;
        return chordDefs.map( x => x.nm );
    }

	var parseChord = chordParserFactory();

	function toChord( chd, root ){
		let chnm = emStr( root % 12 ) + chd;
		chnm = chnm.trim();
		if ( 'ABCDEFG'.includes( chd[0]) ) chnm = chd;
		const chord = parseChord( chnm.trim() );
		if ( chord.error==undefined ){
			let semis = chord.normalized.semitones;
			let nm = emStr( root % 12 ) + chordName( semis, true );
			const revchord = parseChord( nm.trim() );
			if ( !revchord.normalized.semitones.every( (v,i) => semis[i]===v ))  err( `toChord: ${chnm} => ${semis} => ${nm} => ${revchord.normalized.semitones}`, false)
			return chord.normalized.semitones.map( x => x + root );
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
	function chordName( chd, astype ){	// return chord name e.g. [60,64,67] => "C4M"  (or if astype==true, "CM")
		if (astype==undefined) astype == false;
		if ( !(chd instanceof Array)) 
            return "?";
		var rt = chd[0], nt = '';
		if ( rt > 0 ){
            chd = chd.map( x => x-rt );
            nt = emStr( astype? rt%12 : rt);
        }

		let idx = idxChd( chd );
		if ( idx >= 0 )  
			return nt + chordDefs[idx].nm;

		let adj = false;
		for ( let i=0; i < chd.length; i++ ){
			if ( chd[i] < 0 )  { chd[i] += 12; adj = true; }
			if ( chd[i] > 11 ) { chd[i] -= 12; adj = true; }
		}
		if ( adj ){
			let chd2 = chd.sort( (a,b) => a-b );
			return chordName( chd2, astype );
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
	
	function emStr( chd ){		// 60 => "C4"  0=>"C"  [60,64,67] => '[ C4 E4 G4 ]'
		if ( chd instanceof Array ){
			var s = '[ ';
			for ( var i=0; i < chd.length; i++ )
				s += emStr( chd[i] ) + ' ';
			return s + ']'; // + chordName(chd);
		}
    
        var keynum = parseFloat( chd );
		if ( !isNaN( keynum )){  // treat as keyNum
		  var oct = Math.trunc(keynum/12)-1;
          var scdeg = keynum % 12;
		  if ( noteDefs[scdeg]==undefined ) debugger;
		  return noteDefs[scdeg].nm + (oct<0? '' : `${oct}`);		// treat -1 as no octave
		}
		return `? ${chd}`;
	}
	
	function emTest(){
		for(const v of [ 60, 'Ab', 'C4', 'C6', 'C#3', 'bb', 'c#' ]){
            var kn = toKeyNum(v);
 			msg( `toKeyNum(${v}) = ${kn} = ${emStr(kn)}` );
        }

        for(const v of [ 'major', 'locrian', 'harmonic minor' ])
			msg( `toScale(${v}) = [${toScale(v)}]` );

        for(const v of [ 'M', 'm', 'dim', 'mM7' ]){
			  var ch1 = toChord(v, 'C');
			  var ch3 = toChord(v,'E');
			  var ch4 = toChord(v,'Bb');
 			  msg( `toChord(${v},C) = [${ch1}] = ${emStr(ch1)} = ${chordName(ch1)}` );
			  msg( `toChord(${v},E) = [${ch3}] = ${emStr(ch3)} = ${chordName(ch3)}` );
			  msg( `toChord(${v},Bb) = [${ch4}] = ${emStr(ch4)} = ${chordName(ch4)}` );
        }
	}

	
module.exports = { toKeyNum, toScale, scaleRows, modeNames, chordNames, toChord, chordName, 
	emStr, asDeg, emTest }; 
// const { toKeyNum, toScale, scaleRows, modeNames, chordNames, toChord, chordName, 
//			emStr, asDeg, emTest } = require( './emuse.js' );