const { toChord, toKeyNum, toScale } = require("./emuse");

const songs = 
[
  { nm: 'Scarborough Fair - Canticle',
    root: 'E',
    mode: 'Dorian',
    timeSig: '3/4', 
    beatsPerBar: 3,
    tempo: 128,
    ticsPerBeat: 4,
    tracks:
    [ 
      { nm: 'Melody',
        melody: 
        [
          '|1 8:1 4:1 |2 2:5 8:5 2:5 |3 6:2 2:3 4:2 |4 12:1 |5 12:R',
          '|6 4:R 4:5 4:7 |7 8:8 4:7 |8 4:5 4:6 4:4 |9 36:5 |12 8:R 4:8', 
          '|13 8:8 4:8 |14 8:7 8:5 4:4 4:3 |16 2:2 16:0 6:R', 
          '8:1 4:5 | 8:4 4:3 | 4:2 4:1 4:0 | 36:1'
        ], 
        chords:
        [
          '60:i 12:III 12:i 4:III 8:IV', 
          '60:i 24:III 24:VII 12:i 24:VII 48:i'
        ]
      }
    ],
    lyrics: 
    [
      'Are you going to Scarborough Fair?',
      'Parsley, sage, rosemary, and thyme',
      'Remember me to one who lives there',
      'She once was a true love of mine',
      'Tell her to make me a cambric shirt',
      '(in the deep forest green)',
      'Parsley, sage, rosemary, and thyme',
      '(Tracing of sparrow on snow-crested ground)',
      'Without no seams nor needle work',
      '(Bedclothes the child of the mountain)',
      'Then she\'ll be a true love of mine',
      '(Sleeps unaware of the clarion call)',
      'Tell her to find me an acre of land',
      '(A sprinkling of leaves)',
      'Parsley, sage, rosemary and thyme',
      '(Washes the grave with silvery tears)',
      'Between the salt water and the sea strands',
      '(And polishes a gun)',
      'Then she\'ll be a true love of mine',
      'Tell her to reap it with a sickle of leather',
      '(Blazing in scarlet battalions)',
      'Parsley, sage, rosemary, and thyme',
      '(Generals order their soldiers to kill)',
      'And gather it all in a bunch of heather',
      '(A cause they\'ve long ago forgotten)',
      'Then she\'ll be a true love of mine',
      'Are you going to Scarborough Fair?',
      'Parsley, sage, rosemary, and thyme',
      'Remember me to one who lives there',
      'She once was a true love of mine' 
    ]
  },

  { nm: 'American Pie',
    root: 'G',
    mode: 'Major',
    timeSig: '4/4', 
    beatsPerBar: 4,
    tempo: 78,
    ticsPerBeat: 4,
    tracks:
    [ 
      { nm: 'Intro',
        melody: 
        [
          '|1 15:r 1:5 |2 4:12 4:12 1:12 1:10 4:8 2:r', 
          '|3 1:11 3:9 2:11 2:11 1:10 3:9 1:8 3:7',  
          '|4 2:8 2:7 2:r 1:8 1:7 2:8 2:7 12:5 7:r 1:5',  
          '|6 1:12 1:10 1:12 1:12 2:12 2:12 1:13 4:8 2:r 1:8',  
          '|7 1:9 3:10 2:11 2:10 2:9 2:10 3:11 1:9',  
          '|8 2:8 2:6 1:8 3:6 2:8 4:6 1:8 1:10 9:10 10:r 2:6 1:10 1:10 1:10 1:10 2:11 2:10 1:8 1:9',  
          '|11 1:10 2:10 1:10 1:10 3:10 3:11 1:10 1:8 1:6 2:r',  
          '|12 2:8 2:8 3:8 1:7 1:6 2:8 2:r 3:8 1:9 2:10 2:13 2:12 2:10 4:e 2:12', 
          '|14 2:13 1:12 2:12 1:10 1:11 1:10 3:8 1:7 4:6', 
          '|15 3:9 1:10 1:11 1:10 2:10 1:9 3:10 2:9 2:r', 
          '|16 2:10 2:10 2:10 2:10 3:10 1:10 1:9 1:8 1:6 1:8',  
          '|17 6:5 2:8 4:11 4:10',  
          '|18 8:8', 
        ],
        chords: 
        [
           '|1 16:r 4:I 4:V6 8:vi7 8:ii 8:IV',  
           '|4 12:vi 20:V 4:I 4:V6 8:vi7',  
           '|7 8:ii 8:IV 8:vi 8:IV 16:V',  
           '|10 8:vi 8:ii 8:vi 8:ii 4:IV 4:I6 8:ii',  
           '|13 8:IV 8:V 4:I 4:V6 8:vi',  
           '|15 8:ii7 8:V 4:I 4:V6 8:vi 8:IV 8:V7',  
           '|18 16:I', 
        ],
      },
      { nm: 'Verse',
        melody: 
        [
           '|1 4:r 2:12 2:13 2:13 4:12 4:12 4:11 2:10 2:9 2:9 2:10 4:11 6:10 4:11 4:10',  
           '|4 4:11 2:10 2:8 4:9 8:r 2:8 2:8 4:8 2:7 2:8', 
           '|6 4:7 2:7 6:5 14:r 2:13 2:12 4:13 2:12 2:12 4:12 2:10 4:10',  
           '|9 2:12 4:12 6:13 4:10 2:12 2:9 6:r 4:12 4:11 2:10 4:9 2:11 2:10 1:10 2:9', 
           '|12 6:r 2:8 2:6 4:8 4:6 2:8 2:6 6:8 2:r 6:10 4:9 6:10 1:11 1:10 2:9 2:10 12:r', 
           '|16 4:6 2:3 4:3 6:3 4:4 2:3 4:5 2:4 4:3', 
           '|18 2:r 4:6 2:3 4:3 4:3 4:4 2:3 1:5 1:4 4:3 2:r 2:3', 
           '|20 4:4 4:3 2:2 2:1 2:1 4:3 2:2 6:r 2:8 8:8 4:8 2:8 2:8 2:9 1:7 1:6', 
           '|23 6:5 4:12 2:10 2:8 2:6 2:8 2:6 2:5 4:5 2:5 4:3', 
           '|25 4:5 2:5 2:6 4:r 2:2 6:2 2:3 4:4 2:3 2:4 2:3',  
           '|27 2:5 1:3 3:2 2:3 6:r 6:3 2:8 2:6 4:5 2:5 4:5 2:6 2:5 2:2 4:r 2:1 2:1', 
           '|30 12:r 2:3 12:4 4:3 6:1 12:r', 
        ],
        chords: 
        [
          '|1 16:I 16:ii 16:IV 16:ii 16:vi 32:VI',  
          '|8 8:I 8:V6 16:vi 16:ii7 16:IV',  
          '|12 16:vi 16:II7',  
          '|14 32:V 16:vi 16:V 16:vi 16:V 8:IV 8:I6 16:II7', 
          '|22 16:IV 16:V7 8:I 8:V6 16:vi 16:ii 16:IV 8:I 8:V6 16:vi',  
          '|30 16:IV 16:V7 8:I 8:IV', 
        ],
      },
      { nm: 'Chorus',
        melody: 
        [
          '|1 6:12 2:11 4:11 2:11 2:11',  
          '|2 2:10 2:9 2:8 2:9 2:R 4:12 4:12 2:12 2:12 2:11 2:11 2:11 2:11 4:10 2:9 2:8 1:7 1:6 2:5 4:r 4:12 4:12 4:11 2:11 2:11 4:10 2:9 2:8 6:9 2:10 2:9', 
          '|7 2:8 2:6 2:8 1:6 3:8 1:7 5:6 8:9 8:r', 
          '|9 2:8 2:6 2:8 1:6 3:8 1:7 5:6 1:7 1:6 6:5 24:r', 
        ],
        chords: 
        [
          '|1 8:I 8:IV 8:I 8:V 8:I 8:IV 8:I 8:V 8:I 8:IV 8:I 8:V 16:vi 16:II7',  
          '|9 16:vi 32:V7', 
        ],
      },
    ],
    lyrics:
    { Intro: 
      [
        'A long long time ago I can still remember',
        'How that music used to make me smile',
        'And I knew if I had my chance',
        'That I could make those people dance',
        'And maybe they\'d be happy for a while',
        'But February made me shiver',
        'With every paper I\'d deliver',
        'Bad news on the doorstep',
        'I couldn\'t take one more step',
        'I can\'t remember if I cried',
        'When I read about his widowed bride',
        'But something touched me deep inside',
        'The day the music died',
        'So'
      ],
      Chorus:
      [
        'bye-bye, Miss American Pie',
        'Drove my Chevy to the levee',
        'But the levee was dry',
        'Them good old boys were drinking whiskey and rye',
        'Singing, This\'ll be the day that I die',
        'This will be the day that I die'
      ],
      Verse1: 
      [
        'Did you write the Book of Love?',
        'And do you have faith in God above?',
        'If the Bible tells you so',
        'Do you believe in rock \'n roll?',
        'Can music save your mortal soul?',
        'And can you teach me how to dance real slow?',
        'Well I know that you\'re in love with him',
        '\'Cause I saw you dancing in the gym',
        'You both kicked off your shoes',
        'Then I dig those rhythm and blues',
        'I was a lonely teenage broncin\' buck',
        'With a pink carnation and a pickup truck',
        'But I knew I was out of luck',
        'The day the music died',
        'I started singing'
      ],
      Chorus2: [],
      Verse2:
      [
        'Now for ten years we\'ve been on our own',
        'And moss grows fat on a rolling stone',
        'But that\'s not how it used to be',
        'When the jester sang for the King and Queen',
        'In a coat he borrowed from James Dean',
        'And a voice that came from you and me',
        'Oh and while the King was looking down',
        'The jester stole his thorny crown',
        'The courtroom was adjourned',
        'No verdict was returned',
        'And while Lenin read a book of Marx',
        'The Quartet practiced in the park',
        'And we sang dirges in the dark',
        'The day the music died',
        'We were singing'
      ],
      Chorus3: [],
      Verse3:
      [
        'Helter skelter in the summer swelter',
        'The birds flew off with a fallout shelter',
        'Eight miles high and falling fast',
        'It landed foul on the grass, the players tried for a forward pass',
        'With the jester on the sidelines in a cast',
        'Now the halftime air was sweet perfume',
        'While the sergeants played a marching tune',
        'We all got up to dance',
        'Oh, but we never got the chance',
        '\'Cause the players tried to take the field',
        'The marching band refused to yield',
        'Do you recall what was revealed',
        'The day the music died?',
        'We started singing'
      ],
      Chorus4: [],
      Verse4:
      [
        'Oh, and there we were all in one place',
        'A generation lost in space',
        'With no time left to start again',
        'So come on, Jack be nimble, Jack be quick',
        'Jack Flash sat on a candlestick',
        '\'Cause fire is the devil\'s only friend',
        'Oh, and as I watched him on the stage',
        'My hands were clenched in fists of rage',
        'No angel born in Hell',
        'Could break that Satan\'s spell',
        'And as the flames climbed high into the night',
        'To light the sacrificial rite',
        'I saw Satan laughing with delight',
        'The day the music died',
        'He was singing bye-bye'
      ],
      Chorus5: [],
      Verse5:
      [
        'I met a girl who sang the blues',
        'And I asked her for some happy news',
        'But she just smiled and turned away',
        'I went down to the sacred store',
        'Where I\'d heard the music years before',
        'But the man there said the music wouldn\'t play',
        'And in the streets, the children screamed',
        'The lovers cried and the poets dreamed',
        'But not a word was spoken',
        'The church bells all were broken',
        'And the three men I admire most',
        'The Father, Son, and the Holy Ghost',
        'They caught the last train for the coast',
        'The day the music died',
        'And they were singing'
      ], 
      Chorus6: [],
      Chorus7: []
    }
  },
  { nm: 'You Can\'t Hurry Love',
    root: 'Bb',
    mode: 'Major',
    timeSig: '4/4', 
    beatsPerBar: 4,
    tempo: 99,
    ticsPerBeat: 4,
    tracks:
    [ 
      { nm: 'Melody',
        melody: [
		'|1 2:4 2:3 2:2 4:3 4:6 2:5',
		'|2 2:6 2:5 2:4 4:5 2:r 2:3 4:5 2:6 2:7 4:3 2:2 2:1 1:r 1:1',
		'|4 2:2 2:3 2:4 2:3 1:2 2:3 2:4 4:5',
		'|5 2:4 2:3 2:2 4:3 4:6 2:5',
		'|6 2:6 2:5 2:4 4:5 2:r 2:3 4:5 2:6 2:7 2:3 2:3 2:2 2:1 1:r 1:1',
		'|8 2:2 2:3 2:4 1:r 2:5 2:5 2:5'
        ],
        chords: [
		'|1 5:V7sus2 4:I 6:I6 6:IV 10:I ',
		'|3 6:iii 10:vi 8:ii 8:V7 6:Isus2 4:I 4:I6 2:I',
		'|6 6:IV 10:I 6:iii 10:vi 8:ii 4:V9 4:V7'
        ]
      }
    ],
    lyrics: {
      Verse1: 
      [
		'I need love, love to ease my mind',
		'I need to find, find someone to call mine',
		'But mama said you can\'t hurry love',
		'No you just have to wait',
		'She said love don\'t come easy',
		'It\'s a game of give and take',
		'You can\'t hurry love',
		'No, you just have to wait',
		'You gotta trust, give it time',
		'No matter how long it takes',
		'But how many heartaches must I stand',
		'Before I find a love to let me live again',
		'Right now the only thing that keeps me hanging on',
		'When I feel my strength, yeah, it\'s almost gone',
		'I remember mama said',
		'No, you just have to wait',
		'She said love don\'t come easy',
		'It\'s a game of give and take',
		'How long must I wait? How much more can I take?',
		'Before loneliness will \'cause my heart, heart to break',
		'No, I can\'t bear to live my life alone',
		'I grow impatient for a love to call my own',
		'But when I feel that I, I can\'t go on',
		'These precious words keeps me hanging on',
		'I remember mama said',
		'No, you just have to wait',
		'She said love don\'t come easy',
		'It\'s a game of give and take',
		'You can\'t hurry love',
		'No, you just have to wait',
		'She said trust, give it time',
		'No matter how long it takes (gotta wait)',
		'No love, love don\'t come easy',
		'But I keep on waiting, anticipating for that',
		'Soft voice to talk to me at night',
		'For some tender arms to hold me tight',
		'I keep waiting, I keep on waiting (give and take)',
		'But it ain\'t easy, it ain\'t easy when mama said',
		'You can\'t hurry love',
		'No, you just have to wait',
		'She said trust, give it time',
		'No matter how long it takes',
		'You can\'t hurry love',
		'No, you just have to wait',
		'She said love don\'t come easy',
		'It\'s a game of give and take',
		'You can\'t hurry love',
		'No, you just have to wait',
		'Mama said just give it time',
      ]
    }
  },
  { nm: 'Sweet Dreams Are Made of This',
    root: 'C',
    mode: 'Harmonic minor',
    timeSig: '4/4', 
    beatsPerBar: 4,
    tempo: 125,
    ticsPerBeat: 4,
    tracks:
    [ 
      { nm: 'Intro',
        melody: [
		'|1 2:1 2:1 2:15 2:15 2:10 2:17 2:8 2:15',
		'|2 2:6 2:6 2:13 2:15 2:5 2:12 2:14 2:15',
		'|3 2:1 2:1 2:15 2:15 2:10 2:17 2:8 2:15',
		'|4 2:6 2:6 2:13 2:15 2:5 2:12 2:14 2:15'
        ],
        chords: [
		'16:i 8:VI 8:V 16:i 8:VI 8:V'
        ]
      },
      { nm: 'Verse',
        melody: [
		'|1 4:r 4:3 4:3 2:1 4:3 4:3 4:3 4:2 2:r',
		'|3 2:3 2:3 2:1 6:3 4:1',
		'|4 2:3 6:4 2:3 2:2 2:r 2:1',
		'|5 2:3 2:3 2:1 6:3 2:3 2:1',
		'|6 2:3 4:3 2:3 4:1 4:r',
		'|7 4:3 2:1 4:3 6:1',
		'|8 2:3 2:3 2:4 4:3 4:2'
        ],
        chords: [
		'|1 16:i 2:VI 88:V 16:i',
		'|4 8:VI 8:V 16:i 8:VI 8:V',
		'|7 16:i 8:VI 8:V'
        ]
      },
      { nm: 'Bridge',
        melody: [
        ],
        chords: [
		'|1 16:VI 8:VI4.2 8:V',
		'|3 16:i 16:iv 16:VI 16:V'
        ]
      }
    ],
    lyrics: {
      Verse1: 
      [
		'Sweet dreams are made of this',
		'Who am I to disagree',
		'I travel the world and the seven seas',
		'Everybody\'s looking for something',
		'Some of them want to use you',
		'Some of them want to get used by you',
		'Some of them want to abuse you',
		'Some of them want to be abused',
		'Sweet dreams are made of this',
		'Who am I to disagree',
		'I travel the world and the seven seas',
		'Everybody\'s looking for something',
		'Hold your head up, keep your head up, movin\' on',
		'Hold your head up, movin\' on, keep your head up, movin\' on',
		'Hold your head up, movin\' on, keep your head up, movin\' on',
		'Hold your head up, movin\' on, keep your head up',
		'Some of them want to use you',
		'Some of them want to get used by you',
		'Some of them want to abuse you',
		'Some of them want to be abused',
		'Sweet dreams are made of this',
		'Who am I to disagree',
		'I travel the world and the seven seas',
		'Everybody\'s looking for something',
		'Sweet dreams are made of this',
		'Who am I to disagree',
		'I travel the world and the seven seas',
		'Everybody\'s looking for something',
		'Sweet dreams are made of this',
		'Who am I to disagree',
		'I travel the world and the seven seas',
		'Everybody\'s looking for something',
		'Sweet dreams are made of this',
		'Who am I to disagree',
		'I travel the world and the seven seas',
		'Everybody\'s looking for something',
		'Sweet dreams are made of this',
		'Who am I to disagree',
		'I travel the world and the seven seas'
      ]
    }
  },
  { nm: 'Imagine',
    root: 'C',
    mode: 'Major',
    timeSig: '4/4', 
    beatsPerBar: 4,
    tempo: 76,
    ticsPerBeat: 4,
    tracks:
    [ 
      { nm: 'Verse',
        melody: [
		'|1 3:r 1:5 1:5 3:5 4:5 2:7 1:7 2:6 11:r 1:6 1:6# 2:7',
		'|3 3:r 1:6 2:6 2:6 2:6 3:7 1:7 4:6 10:r 1:6 1:6# 2:7',
		'|5 4:r 2:5 6:5 2:7 1:7 3:6 10:r 1:6 1:6# 2:7',
		'|7 7:r 1:5 1:5 3:5 2:6 2:7 4:6'
        ],
        chords: [
		'|1 12:I 4:I7 16:IV 12:I 4:I7 16:IV',
		'|5 12:I 4:I7 16:IV 12:I 4:I7 16:IV'
        ]
      },
	  { nm: 'Chorus lead-out',
        melody: [
		'|1 3:r 1:6 2:8 2:6 4:8 2:10 2:10',
		'|2 1:9 1:8 4:6 20:r',
		'|3 2:7 6:7 4:7 2:8 9:9 1:9 2:10 4:12 1:10 1:9',
		'|5 1:8 4:r 1:6 2:8 2:7 1:8 1:7 2:6 1:6 1:7',
		'|6 2:8 4:8 15:r 1:6 2:8 2:7 1:7 2:6 1:6 4:3 13:r',
		'|9 3:r 1:6 2:6 2:8 2:7 1:8 1:7 2:6 2:7',
		'|10 2:8 1:8 1:6 2:5 10:r',
		'|11 6:r 1:8 1:8 2:9 1:10 1:9 2:8 2:9 1:10 1:8 6:8'
        ],
        chords: [
		'|1 8:IV 8:vi6.4 8:ii 8:IV6.4 12:V 8:I6.4 16:V7',
		'|5 8:IV :V 4:I 4:I7 4:V/vi 4:V7/vi',
		'|7 8:IV 8:V 4:I 4:I7 4:V/vi 4:V7/vi',
		'|9 8:IV 8:V 4:I 4:I7 4:V/vi 4:V7/vi',
		'|11 8:IV 8:V 16:I'
        ]
      }
    ],
    lyrics: {
      Verse1: 
      [
        'Imagine there\'s no heaven',
		'It\'s easy if you try',
		'No hell below us',
		'Above us, only sky',
		'Imagine all the people',
		'Livin\' for today',
		'Ah',
		'Imagine there\'s no countries',
		'It isn\'t hard to do',
		'Nothing to kill or die for',
		'And no religion, too',
		'Imagine all the people',
		'Livin\' life in peace',
		'You may say I\'m a dreamer',
		'But I\'m not the only one',
		'I hope someday you\'ll join us',
		'And the world will be as one',
		'Imagine no possessions',
		'I wonder if you can',
		'No need for greed or hunger',
		'A brotherhood of man',
		'Imagine all the people',
		'Sharing all the world',
		'You may say I\'m a dreamer',
		'But I\'m not the only one',
		'I hope someday you\'ll join us',
		'And the world will live as one'
      ]
    }
  },
  { nm: 'Hallelujah',
    root: 'C',
    mode: 'Major',
    timeSig: '6/4', 
    beatsPerBar: 6,
    tempo: 168,
    ticsPerBeat: 4,
    tracks:
    [ 
      { nm: 'Verse',
        melody: [
		'|1 10:5 2:5 4:5 5:5 2:6 4:5 8:6 10:r 4:3',
		'|3 2:5 4:5 10:5 2:5 4:5 6:6 2:3 6:3 6:r 4:6 12:6 2:6 20:6 4:5 4:5 4:4 4:r 2:5 7:1 15:r',
		'|8 18:r 2:4 2:4',
		'|9 6:5 6:5 8:5 4:5 8:6 4:6 8:7 4:7',
		'|11 4:8 8:8 8:8 4:8',
		'|12 2:9 10:8 8:9 4:8',
		'|13 2:9 10:9 8:9 8:9 8:9 8:10 10:9 10:8 8:r',
		'|16 12:r 4:10 8:12'
        ],
        chords: [
		'|1 24:I 24:vi 24:I 24:vi',
		'|5 24:IV 24:V 24:I 24:V',
		'|9 24:I 24:IV 12:IV 12:V',
		'|11 24:vi 24:IV 24:V 24:V7/vi 30:vif'
        ]
      },
	  { nm: 'Chorus',
        melody: [
		'|1 12:6 4:6 20:r 8:6 4:5',
		'|3 12:3 4:3 8:r',
		'|4 12:r 4:3 8:5',
		'|5 12:6 4:6 8:r',
		'|6 12:r 8:6 4:5',
		'|7 24:3 24:8'
        ],
        chords: [
		'|1 48:IV 48:vi 48:IV 24:I 24:V'
        ]
      }
    ],
    lyrics: {
      Verse1: 
      [
        'Now I\'ve heard there was a secret chord',
		'That David played, and it pleased the Lord',
		'But you dont really care for music, do you?',
		'It goes like this, the fourth, the fifth',
		'The minor falls, the major lifts',
		'The baffled king composing Hallelujah',
		'Hallelujah, Hallelujah',
		'Hallelujah, Hallelujah',
		'Your faith was strong but you needed proof',
		'You saw her bathing on the roof',
		'Her beauty and the moonlight overthrew her',
		'She tied you to a kitchen chair',
		'She broke your throne, and she cut your hair',
		'And from your lips she drew the Hallelujah',
		'Hallelujah, Hallelujah',
		'Hallelujah, Hallelujah',
		'Well, maybe there\'s a God above',
		'As for me all I\'ve ever learned from love',
		'Is how to shoot somebody who outdrew you',
		'But it\'s not a crime that you\'re hear tonight',
		'It\'s not some pilgrim who claims to have seen the Light',
		'No, it\'s a cold and it\'s a very broken Hallelujah',
		'Hallelujah, Hallelujah',
		'Hallelujah, Hallelujah',
	
		'Hallelujah, Hallelujah',
		'Hallelujah, Hallelujah',
		'Well people I\'ve been here before',
		'I know this room and I\'ve walked this floor',
		'You see I used to live alone before I knew ya',
		'And I\'ve seen your flag on the marble arch',
		'But listen love, love is not some kind of victory march, no',
		'It\'s a cold and it\'s a broken Hallelujah',
		'Hallelujah, Hallelujah',
		'Hallelujah, Hallelujah',
		'There was a time you let me know',
		'What\'s really going on below',
		'But now you never show it to me, do you?',
		'And I remember when I moved in you',
		'And the holy dove she was moving too',
		'And every single breath we drew was Hallelujah',
		'Hallelujah, Hallelujah',
		'Hallelujah, Hallelujah',
		'Now I\'ve done my best, I know it wasn\'t much',
		'I couldn\'t feel, so I tried to touch',
		'I\'ve told the truth, I didnt come here to London just to fool you',
		'And even though it all went wrong',
		'I\'ll stand right here before the Lord of song',
		'With nothing, nothing on my tongue but Hallelujah',
		'Hallelujah, Hallelujah',
		'Hallelujah, Hallelujah',
		'Hallelujah, Hallelujah',
		'Hallelujah, Hallelujah',
		'Hallelujah'
      ]
    }
  },
  { nm: 'generic',
    root: 'C',
    mode: 'Major',
    timeSig: '3/4', 
    beatsPerBar: 3,
    tempo: 60,
    ticsPerBeat: 4,
    tracks:
    [ 
      { nm: 'Intro',
        melody: [
        ],
        chords: [
        ]
      }
    ],
    lyrics: {
      Verse1: 
      [
        'line1'
      ]
    }
  }
];
function songNames(){
  return songs.map( x => x.nm );
}
function findSong( nm ){
  for ( const s of songs )
    if (s.nm.toLowerCase()==nm.trim().toLowerCase()) return s;
  return null;
}
function trackNames( song ){
  return song.tracks.map( x => x.nm );
}
function findTrack( song, nm ){
  for ( const t of song.tracks )
    if (t.nm.toLowerCase()==nm.trim().toLowerCase()) return t;
  return null;
}
function toSD( s ){
  var roman = [ 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii' ];
  for (var i=0; i<roman.length; i++)
    if ( s.toLowerCase() == roman[i] ) return i;
  console.log(`toSD: unrec ${s}`);
  return 0;
}
function scDeg( nt, root, scale ){ // return scDeg (1..7) from keynum given root & scale

}
function toRow( nt, lowest, scale ){ // map keynum to row, given scale & lowest note


}
function asChord( nm, scale ){    // decode e.g. 'Im' or 'iii6(9)'
  var i = 0;
  nm = nm + ' ';  
  for(; i<nm.length; i++){
    if (!'IViv'.includes(nm[i])) break;
  }
  var scdeg = i==0? 0 : toSD( nm.substr(0,i));
  var chd = nm.substr(i);
  if (chd=='') chd = 'M';
  return toChord( chd, scale[scdeg]);
}
function asNote( scdeg, scale ){  // decode scale degree even if <0 or >7
  var off = 0, adj = 0;
  var lch = scdeg[scdeg.length-1];
  if ( lch=='#' || lch=='b' ){
    scdeg = scdeg.substr(0,scdeg.length-1);
    adj = lch=='#'? 1 : -1;
  }
  scdeg = Number( scdeg );
  while ( scdeg < 1 ){ scdeg+=8; off-=12; }
  while ( scdeg > 8 ){ scdeg-=8; off+=12; }
  return scale[scdeg-1] + off;
}
const playChords = 0;
const playMelody = 1;
const playBoth = 2;

function trackEvents( song, track, playwhich, chordOffset ){
  if (playwhich==undefined) playwhich = playBoth;
  var bpb = song.beatsPerBar;
  var tpb = song.ticsPerBeat;
  var msPerTic = 60000 / song.tempo / tpb;
  var ticsPerBar = bpb * tpb;
  var root = toKeyNum( song.root );
  var scale = toScale( song.mode, root );

  var evts = [], tic = 0;
  if (playwhich=='Chords' || playwhich=='Both'){
    var chdseq = track.chords.join(' ').split(' ');
    for ( var c of chdseq ){
      if (c[0]=='|'){
        var mtic = (parseFloat(c.substr(1))-1) *ticsPerBar;
        if ( tic != mtic )
          console.log( `chords ${c} at tic ${tic} not ${mtic}` );
      } else {
          var [tics,chordname] = c.split(':');
          if ( chd != 'r' ){
            var chd = asChord( chordname, scale );
            chd = chd.map( x => x + chordOffset );
            if ( tics % song.ticsPerBeat != 0 ) 
              console.log( `chords: tics(${tics}) not at beat (${song.ticsPerBeat}) ` )
            var beats = tics / song.ticsPerBeat;
            for( var i=0; i<beats; i++ ){
              evts.push( {t: tic, chord: chd, d:song.ticsPerBeat } );
              tic += song.ticsPerBeat;
            }
          } else 
            tic += tics;
      }
    }
  }
  if (playwhich=='Melody' || playwhich=='Both'){
    var mseq = track.melody.join(' ').split(' ');
    tic = 0;
    for ( var n of mseq ){
      if (n[0]=='|'){
        var mtic = (parseFloat(n.substr(1))-1) * ticsPerBar;
        if ( tic != mtic )
          console.log( `melody ${n} at tic ${tic} not ${mtic}` );
      } else {
          var [tics,scdeg] = n.split(':');
          tics = Number(tics);
          if ( scdeg.toLowerCase() != 'r' )
            evts.push( {t:tic, nt: asNote( scdeg, scale ), d:tics } );
          tic += tics;
      }
    }
  }
  //console.log( evts );
  if ( playwhich=='Both' )
    evts.sort( (a,b) => (a.t - b.t) );
  return evts;
}
var _midi;
var _stop;
var _chordVelocity = 100;
var _melodyVelocity = 120;
var _start;
var _actuals;
function playEvent( evt ){
  var dur = evt.d * _msPerTic;
  let till = evt.t * _msPerTic;
  setTimeout( function() { 
    if (_stop ) return;
    if (evt.nt !=undefined ){
      _actuals.push( {tic: ((Date.now()-_start)/_msPerTic).toFixed(1), nt:evt.nt})
      _midi.noteOn( 0, evt.nt, _melodyVelocity ).wait( dur ).noteOff( 0, evt.nt );
    } else if (evt.chord !=undefined ){
      for ( var i=0; i<evt.chord.length; i++ ){
        _actuals.push( {tic: ((Date.now()-_start)/_msPerTic).toFixed(1), nt:evt.chord[i]})
        _midi.noteOn( 0, evt.chord[i], _chordVelocity ).wait( dur ).noteOff( 0, evt.chord[i] );
    }  
  }}, till );
}
function playEvents( midi, evts ){
  _midi = midi;
  stopPlay();

  _stop = false;
  _start = Date.now();
  _actuals = [];
  for ( let e of evts ){
    playEvent( e );
  }
}
function stopPlay(){
  _stop = true;
  _midi.allNotesOff(0);
}
function setVelocity( chd, mel ){
  _chordVelocity = chd;
  _melodyVelocity = mel;
}
// function playTrack( midi, song, track, playwhich ){
//     stopPlay();
//     var evts = trackEvents( song, track, playwhich );
 
//     playEvts( evts );
// }
module.exports = { songNames, findSong, trackNames,findTrack, trackEvents,
  playEvents, stopPlay, setVelocity };