
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

	  { nm: 'Db',  midi4: 61 },
    { nm: 'Eb',  midi4: 63 },
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
		for (var i=0; i < noteDefs.length; i++)
			if ( nt.toUpperCase()=== noteDefs[i].nm.toUpperCase() ) 
				return noteDefs[i].midi4 + (oct-4)*12;
		console.log(`toKeyNum: unrecognized note ${nt}`);
		return 60;
	}
	// c  c# d  d# e  f  f# g  g# a  a# b  c  -- note name
	// 0  1  2  3  4  5  6  7  8  9  10 11 12 -- semitones
	// 1     2     3  4     5     6     7     -- scale degree
	// I     ii   iii IV    V     vi    vii   -- scale degree
	const modeDefs = 
	[
	 { scale:[ 0, 2, 4, 5, 7, 9, 11, 12 ], nm: 'Ionian',            },
	 { scale:[ 0, 2, 4, 5, 7, 9, 11, 12 ], nm: 'Major',             },
	 { scale:[ 0, 2, 3, 5, 7, 9, 10, 12 ], nm: 'Dorian'             },
	 { scale:[ 0, 1, 3, 5, 7, 8, 10, 12 ], nm: 'Phrygian'           },
	 { scale:[ 0, 2, 4, 6, 7, 9, 11, 12 ], nm: 'Lydian'             },
	 { scale:[ 0, 2, 4, 5, 7, 9, 10, 12 ], nm: 'Mixolydian'         },
	 { scale:[ 0, 2, 3, 5, 7, 8, 10, 12 ], nm: 'Aeolian'            },
	 { scale:[ 0, 2, 3, 5, 7, 8, 10, 12 ], nm: 'Minor'              },
	 { scale:[ 0, 1, 3, 5, 6, 8, 10, 12 ], nm: 'Locrian'            },
	 { scale:[ 0, 2, 3, 5, 7, 8, 11, 12 ], nm: 'Harmonic minor'     },
	 { scale:[ 0, 2, 3, 5, 7, 9, 11, 12 ], nm: 'Melodic minor'      },
	 { scale:[ 0, 2, 4, 5, 7, 9, 10, 12 ], nm: 'Phryrgian Dominant' }
	];
	function toScale( md, root ){
        if (root==undefined) root = 0;
		if ( md===undefined ) return modeDefs[0];
		if ( md instanceof Array && md.length >= 8 ) 
			return md;
		md = md.trim().toUpperCase();
		for (var i=0; i < modeDefs.length; i++)
			if ( md ===  modeDefs[i].nm.toUpperCase() )
				return modeDefs[i].scale.map( x => x+root );
		console.log(`toScale: unrecognized mode ${md}`);
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
	  { nm: 'sus4',    nts:[0,5,7]         },  // 1 4  5           sus4      Isus4
	  { nm: 'aug',     nts:[0,4,8]         },  // 1 3  5#          aug       I+(#5)
	  { nm: 'M7aug',   nts:[0,4,8,11]      },  // 1 3  5# 7        M7aug     I+7(#5)
	  { nm: 'm',       nts:[0,3,7]         },  // 1 3b 5           m         i
	  { nm: 'm(9)',    nts:[0,2,3,7]       },  // 1 2  3b 5        m(9)      i(add9)
	  { nm: 'm6',      nts:[0,3,7,9]       },  // 1 3b 5  6        m6
	  { nm: 'm7',      nts:[0,3,7,10]      },  // 1 3b 5  6#       m7
	  { nm: 'm7(9)',   nts:[0,2,3,7,10]    },  // 1 2  3b 5  6#    m7(9)
	  { nm: 'm7(11)',  nts:[0,2,3,5,7,10]  },  // 1 2  3b 4  5 6#  m7(11)
	  { nm: 'mM7',     nts:[0,3,7,11]      },  // 1 3b 5  7        mM7
	  { nm: 'mM7(9)',  nts:[0,2,3,7,11]    },  // 1 2  3b 5  7     mM7(9)
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
	  { nm: '7sus2',   nts:[0,2,7]         },  // 1 2b 5           7sus2
	];
    function chordNames(){
        return chordDefs.map( x => x.nm );
    }
	function toChord( chd, root ){
        root = toKeyNum(root);
		if ( chd instanceof Array ) 
			return chd.map( x => x + root );
		if (chd.trim()=="") chd = 'M';
		for (var i=0; i < chordDefs.length; i++)
			if ( chd.trim() === chordDefs[i].nm )
				return chordDefs[i].nts.map( x => x + root );
			
		console.log(`toChord: unrecognized chord "${chd}"`);
		return chordDefs[0].nts.map( x => x + root );		// default major triad
	}
	function chordName( chd ){
		if ( !(chd instanceof Array)) 
            return "?";
		var rt = chd[0], nt = '';
		if ( rt>0 ){
            chd = chd.map( x => x-rt );
            nt = asStr(rt);
        }
		for (var i=0; i < chordDefs.length; i++){
			if (chd.length === chordDefs[i].nts.length && 
                chd.every((val,idx) => val == chordDefs[i].nts[idx] ))
				    return nt + chordDefs[i].nm;
        }
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
	
	function asStr( chd ){
		if ( chd instanceof Array ){
			var s = '[ ';
			for ( var i=0; i < chd.length; i++ )
				s += asStr( chd[i] ) + ' ';
			return s + ']=' + chordName(chd);
		}
    
        var keynum = parseFloat( chd );
		if ( !isNaN( keynum )){  // treat as keyNum
		  var oct = Math.trunc(keynum/12)-1;
          var scdeg = keynum % 12;
		  return noteDefs[scdeg].nm + (oct<0? '' : `${oct}`);		// treat -1 as no octave
		}
		return `? ${chd}`;
	}
	
	function test(){
		for(const v of [ 60, 'Ab', 'C4', 'C6', 'C#3', 'bb', 'c#' ]){
            var kn = toKeyNum(v);
 			console.log( `toKeyNum(${v}) = ${kn} = ${asStr(kn)}` );
        }

        for(const v of [ 'major', 'locrian', 'harmonic minor' ])
			console.log( `toScale(${v}) = [${toScale(v)}]` );

        for(const v of [ 'M', 'm', 'dim', 'mM7' ]){
			  var ch1 = toChord(v, 'C');
			  var ch3 = toChord(v,'E');
			  var ch4 = toChord(v,'Bb');
 			  console.log( `toChord(${v},C) = [${ch1}] = ${asStr(ch1)} = ${chordName(ch1)}` );
			  console.log( `toChord(${v},E) = [${ch3}] = ${asStr(ch3)} = ${chordName(ch3)}` );
			  console.log( `toChord(${v},Bb) = [${ch4}] = ${asStr(ch4)} = ${chordName(ch4)}` );
        }
	}

    function chordProgression( song ){


    }
	
module.exports = { toKeyNum, toScale, chordNames, toChord, chordName, asStr, chordProgression, test }; 