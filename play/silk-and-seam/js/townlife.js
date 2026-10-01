










export const VOICES = {
  nowak: { pitch: 225, rate: 7.5, wave: 'triangle', vowel: 0.9, wobble: 0.1, vib: 0.01, temper: 'cold' },
  crane: { pitch: 150, rate: 11, wave: 'sawtooth', vowel: 1.15, wobble: 0.14, vib: 0, temper: 'cold' },
  pillai: { pitch: 245, rate: 9, wave: 'triangle', vowel: 1.05, wobble: 0.08, vib: 0, temper: 'cold' },
  folake: { pitch: 205, rate: 9.5, wave: 'triangle', vowel: 0.85, wobble: 0.16, vib: 0.02, temper: 'angry' },
  chen: { pitch: 290, rate: 7, wave: 'sine', vowel: 1.1, wobble: 0.06, vib: 0, temper: 'cold' },
  nok: { pitch: 320, rate: 12.5, wave: 'square', vowel: 1.2, wobble: 0.2, vib: 0, temper: 'angry' },
  ortega: { pitch: 255, rate: 10.5, wave: 'sawtooth', vowel: 1, wobble: 0.18, vib: 0.015, temper: 'angry' },
  rosen: { pitch: 118, rate: 6.5, wave: 'sawtooth', vowel: 0.8, wobble: 0.08, vib: 0.02, temper: 'cold' },
  briggs: { pitch: 235, rate: 6.5, wave: 'triangle', vowel: 0.8, wobble: 0.12, vib: 0.03, temper: 'hurt' },
  haddad: { pitch: 250, rate: 7.5, wave: 'sine', vowel: 0.95, wobble: 0.07, vib: 0, temper: 'hurt' },
  alfie: { pitch: 420, rate: 13.5, wave: 'square', vowel: 1.3, wobble: 0.22, vib: 0, temper: 'angry' },
  wick: { pitch: 132, rate: 10, wave: 'sawtooth', vowel: 1.05, wobble: 0.1, vib: 0, temper: 'cold' },
  dupre: { pitch: 350, rate: 6, wave: 'sine', vowel: 1.2, wobble: 0.1, vib: 0.06, temper: 'angry' },
  philippa: { pitch: 280, rate: 6.5, wave: 'sine', vowel: 1.15, wobble: 0.05, vib: 0.01, temper: 'cold' },
  devika: { pitch: 260, rate: 8, wave: 'triangle', vowel: 1.05, wobble: 0.07, vib: 0.01, temper: 'cold' },
  pennington: { pitch: 305, rate: 7, wave: 'sine', vowel: 0.9, wobble: 0.1, vib: 0.03, temper: 'hurt' },
  santos: { pitch: 270, rate: 11, wave: 'triangle', vowel: 1.1, wobble: 0.16, vib: 0.02, temper: 'cold' },
  tran: { pitch: 300, rate: 12, wave: 'square', vowel: 1.15, wobble: 0.06, vib: 0, temper: 'cold' },
  kaur: { pitch: 240, rate: 12, wave: 'triangle', vowel: 0.95, wobble: 0.18, vib: 0.02, temper: 'angry' },
};






export const NIGHT = {
  nowak: { hours: 'day' }, pillai: { hours: 'day' }, chen: { hours: 'day' }, rosen: { hours: 'day' },
  briggs: { hours: 'day' }, haddad: { hours: 'day' }, pennington: { hours: 'day' }, devika: { hours: 'day' },
  philippa: { hours: 'day' }, kaur: { hours: 'day' }, santos: { hours: 'day' },
  ortega: {
    nightHello: 'Now you see me properly. Under the red light. Sit at the front - no, closer.',
    nightGossip: [
      { id: 'ortega-jollof', night: true, text: 'Lourdes Santos asked Marisol to taste her jollof after choir. She has been practising Mama Folake\'s own recipe for weeks, to serve at the wedding as a surprise. It is, Marisol says, "nearly".' },
      { id: 'ortega-moon', night: true, text: 'Marisol dances the last set of the night by moonlight alone, when the club has emptied. The piano player stays to play it and counts perfectly.' },
    ],
    nightChat: [
      { say: 'The last set. Everyone is drunk or in love, and nobody can tell which. This is when I dance best.', g: 'ortega-moon', replies: [
        { a: 'boast', t: 'Then tonight I will stay and watch you dance your best.' },
        { a: 'curious', t: 'What do you dance, when they have all gone?' },
        { a: 'warm', t: 'You must be so tired by now.' },
      ] },
      { say: 'Lourdes from the church came in after choir with a pot of rice. She made me taste it. Twice. With her eyes on me.', g: 'ortega-jollof', replies: [
        { a: 'witty', t: 'Twice? Then it was either very good or very bad.' },
        { a: 'curious', t: 'Rice? What kind of rice?' },
        { a: 'warm', t: 'That is sweet of her to share.' },
      ] },
      { say: 'At night I think about Seville. Then I dance, and I stop thinking.', replies: [
        { a: 'witty', t: 'Seville should think about you for once.' },
        { a: 'boast', t: 'Dance in one of my dresses and Seville will hear about it.' },
        { a: 'warm', t: 'Home never really leaves you, does it?' },
      ] },
    ],
    nightRequests: [
      { kind: 'stage', client: 'Miss Marisol Ortega', occasion: 'the midnight set, danced by moonlight', look: 22, body: 'curvy', wants: ['Eveningwear', 'Romantic', 'Shimmering'], avoid: ['Casual'], when: 'night',
        line: 'For the last set. Something that holds the moonlight - and does not rattle. At midnight every sound is loud.' },
    ],
  },
  crane: {
    nightAt: 'bluelantern',
    nightHello: 'Ah - my dressmaker. Off the record, tonight. Everything I say after nine is off the record.',
    nightGossip: [
      { id: 'crane-vienna', night: true, text: 'Deep in his cups at the Blue Lantern, Mr Crane told the real Vienna story: Madame Dupre fainted on stage in a corset laced too tight, and the conductor laughed. She threw the shoe. She has been afraid of a heavy costume ever since.' },
      { id: 'crane-rye', night: true, text: 'Mr Crane has bought Mrs Nowak\'s rye every morning for ten years. Since the column he sends his housekeeper, because he is too ashamed to go in himself.' },
    ],
    nightChat: [
      { say: 'Do you know why I drink here? Nobody in the Blue Lantern reads page six. Heaven.', replies: [
        { a: 'witty', t: 'And nobody in the Herald office can see you enjoying yourself.' },
        { a: 'boast', t: 'They would read it if I were on it.' },
        { a: 'craft', t: 'The singer\'s dress is badly lined - you can see it from here.' },
      ] },
      { say: 'The Dupre woman. They think she is a monster. They do not know Vienna. I was there, you know.', g: 'crane-vienna', replies: [
        { a: 'curious', t: 'What really happened in Vienna?' },
        { a: 'witty', t: 'Were you the one who got the second shoe?' },
        { a: 'boast', t: 'I know more than you think, Mr Crane.' },
      ] },
      { say: 'I have not been into Nowak\'s in months. Months! And her rye is the only good thing in my life.', g: 'crane-rye', replies: [
        { a: 'curious', t: 'Then why have you stopped going in?' },
        { a: 'witty', t: 'A man who cannot face his baker has a story in him.' },
        { a: 'warm', t: 'That sounds lonely, Mr Crane.' },
      ] },
    ],
  },
  alfie: {
    nightHello: 'Evening, dressmaker! Mind the ladder - I\'m on lamp nineteen. What you doing out this late?',
    nightGossip: [
      { id: 'alfie-adobo', night: true, text: 'Alfie saw Mama Folake at the late grocer buying pork, garlic and a whole bottle of vinegar. She is teaching herself adobo, for Joy\'s family, and swore him to secrecy for a puff-puff.' },
      { id: 'alfie-lamps', night: true, text: 'There are forty-one lamps from the harbour to the Crescent. Alfie names them. Lamp nineteen, outside the Lotus, is called Auntie.' },
    ],
    nightChat: [
      { say: 'Forty-one lamps, every night. I name \'em. That one\'s Auntie - never goes out, never stops fizzing.', g: 'alfie-lamps', replies: [
        { a: 'witty', t: 'What\'s the one outside the Herald called? Gossip?' },
        { a: 'curious', t: 'You name all of them?' },
        { a: 'warm', t: 'Isn\'t it cold, up a ladder at this hour?' },
      ] },
      { say: 'Guess who I saw at the late grocer. Go on. Buying VINEGAR. A whole bottle.', g: 'alfie-adobo', replies: [
        { a: 'curious', t: 'Who? Tell me.' },
        { a: 'witty', t: 'Somebody pickling their enemies?' },
        { a: 'boast', t: 'I already know. I know everything.' },
      ] },
      { say: 'Night\'s the best. The town tells the truth at night. Everyone\'s too tired to lie.', replies: [
        { a: 'witty', t: 'Except you. You\'re never too tired to lie.' },
        { a: 'boast', t: 'I\'m never too tired. I sew till three.' },
        { a: 'warm', t: 'Do you ever get to sleep, Alfie?' },
      ] },
    ],
  },
  folake: {
    nightHello: 'Late customer! Sit - the last of the pepper soup is the best. It has had all day to think.',
    nightGossip: [
      { id: 'folake-kettle', night: true, text: 'Over a late pepper soup Mama Folake said Mrs Chen was never angry about the Songkran water. She thinks Khun Nok stopped coming because of something sharp she said about the curry - and she is too proud to ask.' },
    ],
    nightChat: [
      { say: 'At night the chop house is for the cooks. Everybody who fed the town all day comes here and I feed them.', replies: [
        { a: 'warm', t: 'Who feeds you, Mama?' },
        { a: 'witty', t: 'So the cooks eat last - that is the only fair rule in Thimblebury.' },
        { a: 'boast', t: 'I sew for the whole town. Feed me too.' },
      ] },
      { say: 'Mrs Chen used to come in for soup. Now she sits in her tea house alone at night. Something happened with Khun Nok.', g: 'folake-kettle', replies: [
        { a: 'curious', t: 'What happened between them?' },
        { a: 'warm', t: 'That is sad. They were such friends.' },
        { a: 'witty', t: 'Tea and curry falling out - it sounds like a bad stomach.' },
      ] },
      { say: 'I have a secret. I am learning a Filipino dish for Joy\'s family. It is going very badly.', replies: [
        { a: 'witty', t: 'Badly is how every good dish starts. Ask any wedding.' },
        { a: 'warm', t: 'That they will love you for trying, Mama.' },
        { a: 'boast', t: 'I could cook it better, I expect.' },
      ] },
    ],
  },
  nok: {
    nightHello: 'Kitchen\'s closing but for you - sit. I make you the staff curry, the real one.',
    nightGossip: [
      { id: 'nok-brides', night: true, text: 'Late at night Khun Nok sees Auntie Harpreet walking her newly matched couples to the Lotus door herself. Thirty-one couples, and she has never asked Mrs Tran for a penny.' },
    ],
    nightChat: [
      { say: 'The staff curry. Not for customers. Too spicy for England. You eat it, you are family.', replies: [
        { a: 'flatter', t: 'Family of the best cook in England? I accept.' },
        { a: 'witty', t: 'If I survive it, am I also in the will?' },
        { a: 'craft', t: 'Chilli oil stains silk, you know - I will eat carefully.' },
      ] },
      { say: 'Every night I see the auntie from the Lotus walking young couples to the door. Holding their hands like they are children.', g: 'nok-brides', replies: [
        { a: 'curious', t: 'Auntie Harpreet? Why does she walk them there?' },
        { a: 'witty', t: 'Delivering them personally - no refunds.' },
        { a: 'flatter', t: 'You notice everything, Khun Nok.' },
      ] },
      { say: 'Mrs Chen does not speak to me since Songkran. I soaked her silk wall. I leave her curry. She says nothing.', replies: [
        { a: 'flatter', t: 'Your curry could melt anybody, in time.' },
        { a: 'witty', t: 'Maybe she thinks the curry is also a water attack.' },
        { a: 'craft', t: 'Water on silk can be steamed out - it may not be ruined.' },
      ] },
    ],
  },
  wick: {
    nightHello: 'After the show. The worst hour. Every seam that split tonight is on my desk. Sit - carefully.',
    nightGossip: [
      { id: 'wick-funeral', night: true, text: 'After the show Mr Wick let slip why Lady Philippa cannot bear lilies: her mother\'s coffin was buried under them, when she was eleven. Nobody at St Anne\'s knows.' },
    ],
    nightChat: [
      { say: 'Four hooks, two hems, and a crown with a dent in it. Tonight\'s casualties.', replies: [
        { a: 'craft', t: 'The crown - is it buckram? It will steam back into shape.' },
        { a: 'witty', t: 'Who dented the crown - the king or the tenor?' },
        { a: 'flatter', t: 'You make it all look so easy.' },
      ] },
      { say: 'I dressed Lady Philippa\'s mother once, you know. And later I dressed the church for her funeral. The lilies were my idea. I have regretted it for years.', g: 'wick-funeral', replies: [
        { a: 'curious', t: 'Why do you regret the lilies?' },
        { a: 'witty', t: 'Lilies. The theatre\'s answer to everything.' },
        { a: 'craft', t: 'Lily pollen stains everything it touches - silk worst of all.' },
      ] },
      { say: 'Madame Dupre thinks I am trying to smother her. Every costume, "too heavy". I will not explain my work.', replies: [
        { a: 'craft', t: 'Weights in a hem are not weight on a singer. Somebody should tell her.' },
        { a: 'witty', t: 'Explaining to a soprano is like singing to a tenor.' },
        { a: 'flatter', t: 'You are too good for her, Mr Wick.' },
      ] },
    ],
  },
  dupre: {
    nightHello: 'You come to my dressing room after a performance? Bold. I like bold. Bijou, move.',
    nightGossip: [
      { id: 'dupre-flowers', night: true, text: 'Madame Dupre\'s dressing room is full of flowers after every show. She sends every bouquet on to the cottage hospital before morning, and tells nobody.' },
    ],
    nightChat: [
      { say: 'Seven curtain calls. Seven. The tenor had two.', replies: [
        { a: 'flatter', t: 'Seven was a restrained audience.' },
        { a: 'boast', t: 'In my Tosca gown you would have had nine.' },
        { a: 'curious', t: 'How do you know when to stop bowing?' },
      ] },
      { say: 'All these flowers. They go to the hospital. Do not look at me like that. I am not sentimental.', g: 'dupre-flowers', replies: [
        { a: 'flatter', t: 'Of course not. Only magnificent.' },
        { a: 'curious', t: 'Why the hospital?' },
        { a: 'boast', t: 'I would do the same - only I would sew them into a gown first.' },
      ] },
      { say: 'Wick makes every costume heavy. He wants me to fail. I know it.', replies: [
        { a: 'flatter', t: 'Nobody could make you fail, Madame.' },
        { a: 'boast', t: 'Then let me look at his work - I will know in a minute.' },
        { a: 'curious', t: 'What makes you think that?' },
      ] },
    ],
  },
  tran: {
    nightHello: 'The last wedding has gone home. Now I do the books. You may keep me company - quietly.',
    nightGossip: [
      { id: 'tran-books', night: true, text: 'At night Mrs Tran does the Lotus books by lamplight and sends a little money every month to her mother in Hue. The Lotus has not had a quiet week in five years.' },
    ],
    nightChat: [
      { say: 'Eleven weddings. Three hundred and six chairs. Nine hundred dumplings. The numbers are the only thing that never argues.', g: 'tran-books', replies: [
        { a: 'craft', t: 'Numbers and seams - both tell you the truth if you measure twice.' },
        { a: 'curious', t: 'Who do you send the money to?' },
        { a: 'witty', t: 'Nine hundred dumplings. Were any left?' },
      ] },
      { say: 'Auntie Harpreet thinks I do not like her. She talks, I count. It is not the same as not liking.', replies: [
        { a: 'boast', t: 'I could tell her so - I have a way with people.' },
        { a: 'craft', t: 'Two different stitches holding the same seam.' },
        { a: 'witty', t: 'Have you tried talking and counting at the same time?' },
      ] },
      { say: 'In Hue my mother sewed ao dai by the river. At night I still hear her machine.', replies: [
        { a: 'craft', t: 'A treadle, I bet - the sound is like rain on a roof.' },
        { a: 'boast', t: 'I will make an ao dai she would have been proud of.' },
        { a: 'witty', t: 'Perhaps it is just the lamps fizzing.' },
      ] },
    ],
    nightRequests: [
      { kind: 'asianwedding', client: 'Miss Nguyen Hoa', occasion: 'her evening wedding reception - the second ao dai', look: 34, body: 'slender', wants: ['Elegant', 'Eveningwear', 'Shimmering'], avoid: ['Casual'], garment: { slot: 'skirt', id: 'aodai' }, when: 'night',
        line: 'Tonight I have a job for you. The evening ao dai for the Nguyen reception - it must shine under lanterns. You have one week.' },
    ],
  },
};










export const CONFLICTS = [
  {
    id: 'lilies', title: 'The war of the lilies', a: 'pennington', b: 'philippa', mediator: 'philippa',
    blurb: 'Every June Mrs Pennington puts lilies on St Anne\'s altar, and every June Lady Philippa objects. They have not spoken since Easter.',
    clues: ['rosen-arthur', 'wick-funeral'],
    holders: { rosen: [{ id: 'rosen-arthur', text: 'The lilies at St Anne\'s come from the garden Arthur Pennington planted the spring before he went to the front. He never came back. His widow puts his lilies at every wedding, so that he is at all of them.' }] },
    complaint: {
      pennington: 'And do not mention Lady Philippa to me. Fifteen years of sniffing at my lilies. I have not spoken to her since Easter.',
      philippa: 'That woman at St Anne\'s has covered the altar in lilies again. Lilies! She does it to spite me, I am quite sure.',
    },
    tell: [
      { a: 'warm', t: 'They are Arthur Pennington\'s lilies, your ladyship - from the garden he planted before the war. She puts him at every wedding. She has no idea what they mean to you.' },
      { a: 'witty', t: 'The lilies are just her late husband\'s way of getting into every wedding.' },
      { a: 'craft', t: 'She grows them herself, you know - Madonna lilies, from her husband\'s old beds.' },
    ],
    ok: 'Lady Philippa is silent for a long time. "Arthur\'s. I did not know." She rings for paper. "I shall write to her tonight. Perhaps she will let me tell her about my mother." For the first time, she smiles at you properly.',
    fail: '"You will not speak to me of this." The temperature in the room drops, and stays dropped.',
    requests: {
      pennington: [{ kind: 'church', client: 'Miss Letitia Ashcombe', occasion: "Lady Philippa's goddaughter, married at St Anne's - with lilies", look: 3, body: 'slender', wants: ['Romantic', 'Elegant', 'Flowers'], avoid: ['Risqué'], after: 'lilies',
        line: 'Lady Philippa came to see me. We talked for three hours. Her goddaughter is to marry here - and we shall both do the flowers. You must make the gown, dear.' }],
      philippa: [{ kind: 'noble', client: 'Lady Philippa Ashcombe', occasion: 'the St Anne\'s restoration gala, as its patroness', look: 23, body: 'slender', wants: ['Formal', 'Elegant', 'Romantic'], avoid: ['Casual'], after: 'lilies',
        line: 'I have agreed to be patroness of the St Anne\'s restoration. Dorothy insists. You will dress me for the gala - and I shall wear a lily, God help me.' }],
    },
  },
  {
    id: 'lotus', title: 'Trouble at the Lotus', a: 'tran', b: 'kaur', mediator: 'kaur',
    blurb: 'Mrs Tran and Auntie Harpreet share the Lotus Wedding House and cannot share a sentence. Auntie is sure Mrs Tran looks down on her.',
    clues: ['nok-brides', 'santos-frames'],
    holders: { santos: [{ id: 'santos-frames', text: 'In Mrs Tran\'s back office Mrs Santos saw a whole wall of framed photographs - every couple Auntie Harpreet ever matched. "Do not dare tell her," said Mrs Tran.' }] },
    complaint: {
      tran: 'Auntie Harpreet. She talks through my weddings, she talks through my accounts. She thinks I do not like her. Enough.',
      kaur: 'That Mrs Tran looks at me like I am a bad fish. Five years I share a house with her and never one kind word. Hmph.',
    },
    tell: [
      { a: 'curious', t: 'Auntie - have you ever been in Mrs Tran\'s back office? Every couple you matched is on her wall, framed.' },
      { a: 'flatter', t: 'She treasures you, Auntie. Thirty-one couples, and she has every one framed - she just cannot say so.' },
      { a: 'boast', t: 'Leave it with me, Auntie - I have sorted out bigger quarrels than this.' },
    ],
    ok: 'Auntie Harpreet puts down her tea. "Framed? All of them?" Her eyes fill. "That silly, silly woman." She marches straight to the back office. You hear shouting, then laughing, then two women crying.',
    fail: '"Showing off, showing off. What do you know about it?" She turns her back.',
    requests: {
      tran: [{ kind: 'asianwedding', client: 'Miss Sari Hartono', occasion: 'a Javanese wedding - the kebaya and batik for the ceremony', look: 11, body: 'slender', wants: ['Elegant', 'Patterned', 'Formal'], avoid: ['Risqué'], garment: { slot: 'skirt', id: 'sarong' }, after: 'lotus',
        line: 'Auntie brought me a Javanese family. Together. We have agreed on something, for once. You make the bride\'s sarong - hand-drawn batik, the kawung for a good marriage.' }],
      kaur: [{ kind: 'asianwedding', client: 'Miss Anjali Ghosh', occasion: 'a Bengali wedding - the red Banarasi saree', look: 13, body: 'curvy', wants: ['Elaborate', 'Shimmering', 'Formal'], avoid: ['Casual'], garment: { slot: 'skirt', id: 'saree' }, after: 'lotus',
        line: 'Beta, you made peace in my house. My next bride is yours. A Bengali girl - red Banarasi, gold, the whole thing. Mai says hello. Imagine!' }],
    },
  },
  {
    id: 'mothers', title: 'The two mothers', a: 'folake', b: 'santos', mediator: 'folake',
    blurb: 'Mama Folake and Mrs Santos are planning Joy and Tunde\'s wedding together, and the arguments about the food have got serious. Nobody is laughing any more.',
    clues: ['ortega-jollof', 'alfie-adobo'],
    holders: {},
    complaint: {
      folake: 'Lourdes says there will be no jollof at the wedding. NO JOLLOF. At my son\'s wedding! I have not spoken to her for a week.',
      santos: 'Folake says my menu is too much. Too much! Then she will not say what she wants. I am done arguing with that woman.',
    },
    tell: [
      { a: 'warm', t: 'Mama - Lourdes has been learning your jollof. From your own recipe. For weeks. It is meant to be a surprise.' },
      { a: 'witty', t: 'You two are secretly cooking each other\'s dinners. It is the most romantic thing in Thimblebury.' },
      { a: 'boast', t: 'I have been playing peacemaker all week, you know. You should thank me.' },
    ],
    ok: 'Mama Folake stares at you. Then she laughs so hard she has to sit down. "She is learning my jollof? And I am learning her adobo!" She wipes her eyes. "Tell no one. We will surprise each other at the wedding - both of us."',
    fail: '"Hm. Pride is not a flavour, my dear." She goes back to her pot.',
    requests: {
      folake: [{ kind: 'wedding', client: 'Miss Bisi Adebayo', occasion: 'her brother\'s wedding, as chief bridesmaid', look: 7, body: 'pear', wants: ['Elegant', 'Patterned', 'Playful'], avoid: ['Gothic'], after: 'mothers',
        line: 'Now the wedding is happy again, Bisi wants a proper chief bridesmaid dress. Bright! Let her outshine me, just this once.' }],
      santos: [{ kind: 'church', client: 'Miss Imelda Cruz', occasion: 'her wedding at St Anne\'s - the choir\'s own soprano', look: 12, body: 'classic', wants: ['Formal', 'Romantic', 'Elegant'], avoid: ['Risqué'], garment: { slot: 'sleeve', id: 'terno' }, after: 'mothers',
        line: 'Folake and I are friends again - thanks to you. So my soprano, Imelda, gets married next, and you make her terno. Two choirs, again!' }],
    },
  },
  {
    id: 'flute', title: 'Quarrel at the Opera', a: 'wick', b: 'dupre', mediator: 'dupre',
    blurb: 'Madame Dupre is sure Mr Wick makes her costumes heavy to sabotage her. Mr Wick will not explain his work to anyone. Rehearsals have stopped.',
    clues: ['crane-vienna', 'haddad-weights'],
    holders: { haddad: [{ id: 'haddad-weights', text: 'Samira mends for the Opera now. She says Mr Wick sews little lead weights into Madame Dupre\'s hems so the stage draught can never lift them, and lines every bodice so it breathes. He has told nobody.' }] },
    complaint: {
      wick: 'Madame Dupre has refused my Tosca. "Too heavy." She has not the faintest idea what goes into a costume and she will not be told.',
      dupre: 'Wick. That man makes every costume like armour. He wants me to faint on his stage. He will not have the pleasure.',
    },
    tell: [
      { a: 'flatter', t: 'Madame - he sews weights in your hems so the draught can never lift them. He lines every bodice so you can breathe. Nobody else is worth that care.' },
      { a: 'boast', t: 'I have looked at his work, Madame. I would stake my name on it - he is protecting you, not smothering you.' },
      { a: 'curious', t: 'Why do you think he makes them heavy?' },
    ],
    ok: 'Madame Dupre says nothing. Then, very quietly: "In Vienna, nobody lined anything." She sends Bijou to Mr Wick\'s workroom with a note in his collar. It says only: "Thank you. Tosca, then."',
    fail: '"Questions. Always questions." She turns to the mirror.',
    requests: {
      wick: [{ kind: 'opera', client: 'Mr Ignatius Wick', occasion: 'Carmen - Act One, the cigarette girl\'s dress', look: 26, body: 'curvy', wants: ['Playful', 'Glamour', 'Patterned'], avoid: ['Formal'], after: 'flute',
        line: 'Rehearsals are back on, and I owe you for it. Carmen, Act One. Light, sweat-proof, and it must swing. I shall sew the weights myself.' }],
      dupre: [{ kind: 'opera', client: 'Madame Solene Dupre', occasion: 'Rusalka - the Song to the Moon', look: 25, body: 'curvy', wants: ['Romantic', 'Shimmering', 'Eveningwear'], avoid: ['Casual'], after: 'flute',
        line: 'You shall make my Rusalka. The Song to the Moon. Light as breath - and Wick shall line it. We have agreed. Do not look so pleased with yourself.' }],
    },
  },
  {
    id: 'water', title: 'Water under the bridge', a: 'chen', b: 'nok', mediator: 'chen',
    blurb: 'Since Songkran, Mrs Chen and Khun Nok - old friends on Lantern Street - have not said a word to each other. Each thinks the other is angry.',
    clues: ['briggs-curry', 'folake-kettle'],
    holders: { briggs: [{ id: 'briggs-curry', text: 'Every Friday since Songkran a pot of green curry appears on the Jade Kettle\'s step before dawn. Nell sees Khun Nok leave it on her way to market. Mrs Chen thinks it comes from a customer.' }] },
    complaint: {
      chen: 'Khun Nok does not come for tea any more. Not since Songkran. I suppose I said something about her curry. She is right to stay away.',
      nok: 'Mrs Chen is angry with me. I soaked her silk panels at Songkran. She will not look at me in the street.',
    },
    tell: [
      { a: 'curious', t: 'Mrs Chen - have you wondered who leaves green curry on your step every Friday? It is Khun Nok. She thinks you are angry about the silk.' },
      { a: 'craft', t: 'Those silk panels the water spotted can be steamed clean. And Khun Nok has been leaving you curry every Friday to say sorry.' },
      { a: 'witty', t: 'Water under the bridge - or under the tea house, anyway.' },
    ],
    ok: 'Mrs Chen sets down the kettle. "The curry is from her?" She laughs, and then she cannot stop. "And I thought she was angry with me!" She puts on her coat. "Mind the tea house. I am going to the Golden Orchid."',
    fail: 'Her smile goes polite and thin. "Hm. Perhaps." She looks at the kettle.',
    requests: {
      chen: [{ kind: 'asianwedding', client: 'Miss Chen Mei', occasion: 'a Hakka wedding - the qipao for the hair-combing night', look: 16, body: 'slender', wants: ['Elegant', 'Formal', 'Romantic'], avoid: ['Gothic'], garment: { slot: 'bodice', id: 'qipao' }, after: 'water',
        line: 'My niece Mei marries in a month - the hair-combing is the night before. Nok is doing the banquet and you will make the qipao. We are all family again.' }],
      nok: [{ kind: 'festival', client: 'Khun Nok Wongsakul', occasion: 'Loy Krathong - floating lanterns on the harbour at night', look: 27, body: 'curvy', wants: ['Romantic', 'Shimmering', 'Elegant'], avoid: ['Casual'], garment: { slot: 'skirt', id: 'phasin' }, after: 'water',
        line: 'Mrs Chen and me will float our krathong together this year! You make my pha sin for the night - something that shines on the water.' }],
    },
  },
  {
    id: 'herald', title: 'Stodgy', a: 'nowak', b: 'crane', mediator: 'nowak',
    blurb: 'The Herald called Mrs Nowak\'s rye "stodgy". She has cancelled her advertisement and stopped delivering to the Crescent, and Mr Crane has not set foot in the bakery since.',
    clues: ['alfie-typo', 'crane-rye'],
    holders: { alfie: [{ id: 'alfie-typo', text: 'Alfie delivers the Herald. He says old Mr Pruitt the typesetter set "stodgy" where Mr Crane wrote "sturdy" - in a column praising Nowak\'s rye. Mr Crane never saw it before it printed.' }] },
    complaint: {
      nowak: 'You read what the Herald wrote about my rye? "Stodgy." Thirty years I bake. That man will not get one crumb from me again.',
      crane: 'Mrs Nowak has pulled her advertisement. Over one word! I cannot explain - it would mean admitting the Herald made a mistake.',
    },
    tell: [
      { a: 'warm', t: 'Mrs Nowak - he wrote "sturdy". The typesetter set it wrong. And he has sent his housekeeper for your rye every day since, because he is too ashamed to come in.' },
      { a: 'curious', t: 'Did you ever read what Mr Crane actually wrote, before the typesetter got to it?' },
      { a: 'boast', t: 'I have it all worked out, you will see. Leave it to me.' },
    ],
    ok: 'Mrs Nowak wipes her hands on her apron, twice. "Sturdy." She wraps a warm rye in paper. "Take this to him. Tell him he comes himself tomorrow, or I will come to his office." She is smiling.',
    fail: '"Hm. Big words are cheap, like my day-old bread."',
    requests: {
      nowak: [{ kind: 'festival', client: 'Mrs Wiktoria Nowak', occasion: 'Dozynki, the Polish harvest festival - she carries the wreath', look: 14, body: 'full', wants: ['Flowers', 'Patterned', 'Romantic'], avoid: ['Risqué'], after: 'herald',
        line: 'This year the Herald will write about our Dozynki - Tobias promised. And I carry the harvest wreath. You make my dress. Flowers, lots.' }],
      crane: [{ kind: 'society', client: 'Miss Aurora Crane', occasion: 'her engagement party - to the Rani\'s nephew', look: 3, body: 'slender', wants: ['Elegant', 'Romantic', 'Shimmering'], avoid: ['Gothic'], after: 'herald',
        line: 'Now that I can walk into Nowak\'s again, I have news worth printing: Aurora is engaged. To the Rani\'s nephew! The telescope boy! Dress her - page one.' }],
    },
  },
];
