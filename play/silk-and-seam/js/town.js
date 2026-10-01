











import { briefFor, part } from './logic.js';
import { WEDDING_PEOPLE, SECOND_VISITS } from './townfolk.js';
import { VOICES, NIGHT, CONFLICTS } from './townlife.js';
export { CONFLICTS };

export const APPROACHES = {
  warm: 'kindness and a listening ear',
  witty: 'a joke or a clever turn of phrase',
  craft: 'talk of cloth, cut and stitching',
  flatter: 'compliments',
  curious: 'questions about her life and the town',
  boast: 'confidence in your own work',
};
export const SCORE = { liked: 2, neutral: 1, disliked: -1 };
export const TALKS_PER_DAY = 3;        
export const REQUEST_COOLDOWN = 4;     
export const MAX_TOWN_LETTERS = 3;     
export const NOTICE_WEIGHT = 3;        
export const NEED = 4;                 


export const REQUEST_KINDS = {
  opera: { name: 'Opera costume', badge: 'The Opera House', feeMult: 1.8, budgetMult: 1.5 },
  noble: { name: "Noblewoman's gown", badge: 'A noble house', feeMult: 1.6, budgetMult: 1.4 },
  society: { name: 'Society debut', badge: 'Society', feeMult: 1.4, budgetMult: 1.3 },
  
  
  church: { name: "Bride's gown", badge: 'A church wedding', feeMult: 1.7, budgetMult: 1.5 },
  asianwedding: { name: "Bride's wedding dress", badge: 'An Asian wedding', feeMult: 1.7, budgetMult: 1.5 },
  wedding: { name: 'Wedding outfit', badge: 'A wedding', feeMult: 1.3, budgetMult: 1.2 },
  festival: { name: 'Festival dress', badge: 'A festival', feeMult: 1.25, budgetMult: 1.1 },
  stage: { name: 'Stage costume', badge: 'The Blue Lantern', feeMult: 1.35, budgetMult: 1.2 },
  charity: { name: 'A kindness', badge: 'Free work - for notice', feeMult: 0, budgetMult: 0 },
};

export const PLACES = [
  { id: 'square', name: 'Market Square', blurb: 'Cobbles, the clock tower, the Herald office and a bakery that smells of poppy seed.', sky: '#f3c98b', wall: '#c98f5a' },
  { id: 'spice', name: 'Spice Row', blurb: 'Sari silks in the windows, jollof and cardamom on the air, marigolds over every door.', sky: '#f4b36a', wall: '#b8573a' },
  { id: 'lantern', name: 'Lantern Street', blurb: 'Red paper lanterns, a tea house, a Thai kitchen, a haberdasher and the Blue Lantern club.', sky: '#e39b8a', wall: '#8c2f36' },
  { id: 'harbour', name: 'The Harbour', blurb: 'Nets, gulls and the washhouses, where the town works hardest and earns least.', sky: '#a9c3cc', wall: '#5d6f78' },
  { id: 'crescent', name: 'Opera House & the Crescent', blurb: 'Gilt, velvet, carriages, and the grand houses of the Crescent. They do not receive just anyone.', sky: '#c7b3d9', wall: '#5a4a6e' },
];




const FIRST_PEOPLE = [
  {
    id: 'nowak', name: 'Mrs Wiktoria Nowak', role: 'baker, Market Square', place: 'square', look: 14,
    likes: ['warm', 'curious'], dislikes: 'boast',
    hello: 'Come in, come in, mind the flour. You are the new dressmaker on Thimble Lane? Sit. Have a paczek.',
    topics: [
      { say: 'I bake since four this morning. Poppy seed, plum, and the rye my husband liked. He is gone six years now.', g: 0, replies: [
        { a: 'warm', t: 'Six years. You still bake his bread - that is a kind of remembering.' },
        { a: 'boast', t: 'Early mornings! I know them. My stitching is the best on the Lane, you know.' },
        { a: 'curious', t: 'Who comes in first, at that hour?' },
      ] },
      { say: 'My niece Zofia is to be married at St Casimir\'s. The whole Polish street will come - and half the Irish one.', g: 1, replies: [
        { a: 'curious', t: 'Tell me about her young man.' },
        { a: 'witty', t: 'Half the Irish street? Then the dancing will outlast the priest.' },
        { a: 'flatter', t: 'With an aunt like you, she will want for nothing.' },
      ] },
      { say: 'She wants something romantic. Flowers. Her mother had nothing - we came with one suitcase.', replies: [
        { a: 'warm', t: 'Then this one should carry everything that suitcase could not.' },
        { a: 'craft', t: 'Silk rosettes at the waist, a lace edge - flowers that last.' },
        { a: 'boast', t: 'Leave it to me. Nobody does romantic like I do.' },
      ] },
    ],
    gossip: [
      { id: 'nowak-early', text: 'The first customer at Nowak\'s every morning is old Mr Rosen, for a plain roll. He says he hates flattery, and Mrs Nowak says he hates it because he blushes.', hint: { who: 'rosen', dislikes: 'flatter' } },
      { id: 'nowak-zofia', text: 'Zofia Nowak is marrying Declan Byrne, a tram driver. The two streets have been cooking for the wedding for a month.' },
      { id: 'nowak-lady', text: 'Mrs Nowak delivers to the Crescent. Lady Philippa Ashcombe laps up a compliment on her taste - but make a joke in her drawing room and you will never be asked back.', hint: { who: 'philippa', likes: 'flatter' } },
    ],
    react: {
      liked: ['She pats your hand. "You are a good girl."', 'Her face softens. "Yes. Yes, exactly."'],
      neutral: ['"Mm." She brushes flour off the counter.', 'She nods and pushes the plate closer.'],
      disliked: ['"Hm. Big words are cheap, like my day-old bread."', 'She raises an eyebrow and says nothing.'],
    },
    bye: 'Well. Come back when you are hungry.',
    requests: [
      { kind: 'church', client: 'Miss Zofia Nowak', occasion: 'her wedding at St Casimir\'s', look: 1, body: 'classic', wants: ['Romantic', 'Elegant', 'Flowers'], avoid: ['Risqué'],
        line: 'You know what? You make Zofia\'s dress. I pay, she smiles, everybody dances. I will send the measurements.' },
    ],
  },
  {
    id: 'crane', he: true, name: 'Mr Tobias Crane', role: 'society columnist, the Thimblebury Herald', place: 'square', look: 19,
    likes: ['witty', 'boast'], dislikes: 'craft',
    hello: 'Ah! The new needle in town. Tobias Crane, the Herald, page six. Say something quotable.',
    topics: [
      { say: 'Everyone in this town is somebody\'s cousin, and I write about all of them. What makes you worth a column?', replies: [
        { a: 'boast', t: 'I dressed half the Lane in a month, and none of them have stopped being complimented.' },
        { a: 'craft', t: 'I use a French seam on every chiffon hem, so nothing frays.' },
        { a: 'witty', t: 'I am the only person in Thimblebury who is nobody\'s cousin. Yet.' },
      ] },
      { say: 'The Crescent is all a-flutter. A Rani is staying at number nine, and the opera has a new soprano.', g: 0, replies: [
        { a: 'curious', t: 'A Rani? Do tell.' },
        { a: 'witty', t: 'And you, I suppose, are all a-flutter on their behalf.' },
        { a: 'warm', t: 'It must be lonely, arriving in a strange town, even for a Rani.' },
      ] },
      { say: 'My daughter Aurora makes her debut at the Assembly Rooms this season. She will be the talk of page six - whether she likes it or not.', g: 1, replies: [
        { a: 'boast', t: 'Put her in one of mine and page six will write itself.' },
        { a: 'craft', t: 'A debutante wants a fitted bodice and a full skirt with plenty of petticoat.' },
        { a: 'curious', t: 'And does she like it?' },
      ] },
    ],
    gossip: [
      { id: 'crane-rani', text: 'Rani Devika Rao of number nine, the Crescent, studied textiles in Madras. Ask her about weaving and she talks for an hour - but flatter her and she goes cold as marble.', hint: { who: 'devika', dislikes: 'flatter' } },
      { id: 'crane-aurora', text: 'Aurora Crane would rather be at the observatory than the Assembly Rooms. Her father prints none of this.' },
      { id: 'crane-diva', text: 'Madame Dupre, the new soprano, cannot abide being questioned - she answers reporters with a stare. But tell her she is magnificent and she is yours.', hint: { who: 'dupre', likes: 'flatter' } },
    ],
    react: {
      liked: ['He scribbles in his notebook. "Oh, that\'s good."', 'He laughs out loud. "Page six, darling."'],
      neutral: ['"Hm, hm." His pencil hovers.', 'He nods politely, eyes drifting to the door.'],
      disliked: ['His eyes glaze. "Seams. Fascinating."', 'He stifles a yawn behind his notebook.'],
    },
    bye: 'Well, I must dash - there is a scandal at the bowls club.',
    requests: [
      { kind: 'society', client: 'Miss Aurora Crane', occasion: 'her debut at the Assembly Rooms', look: 3, body: 'slender', wants: ['Elegant', 'Romantic', 'Formal'], avoid: ['Gothic'],
        line: 'Right, you are hired. Aurora\'s debut gown - make it something I can write three paragraphs about.' },
    ],
  },
  {
    id: 'pillai', name: 'Mrs Lakshmi Pillai', role: 'sari and silk merchant, Spice Row', place: 'spice', look: 28,
    likes: ['craft', 'curious'], dislikes: 'flatter',
    hello: 'You are a dressmaker? Then touch this. No - properly. Tell me what it is.',
    topics: [
      { say: 'That is Kanchipuram silk. The border is woven separately and joined by hand, so it never comes away.', g: 0, replies: [
        { a: 'craft', t: 'Joined by hand - the korvai? I have read about it and never seen one.' },
        { a: 'flatter', t: 'What exquisite taste you have, Mrs Pillai.' },
        { a: 'curious', t: 'Where do your silks come from?' },
      ] },
      { say: 'Onam is coming - our harvest festival from Kerala. Flowers on the floor, a feast on banana leaves, and everyone in ivory and gold.', g: 1, replies: [
        { a: 'curious', t: 'Why ivory and gold?' },
        { a: 'witty', t: 'A feast on banana leaves - no washing up. Kerala is very wise.' },
        { a: 'warm', t: 'It sounds like home, the way you say it.' },
      ] },
      { say: 'Every dressmaker in this town wants to sell me a frock. None of them know how to drape.', replies: [
        { a: 'craft', t: 'Pleats tucked in at the navel, the pallu over the left shoulder - I would want you to check mine.' },
        { a: 'boast', t: 'Then you have not met me.' },
        { a: 'flatter', t: 'None of them could hope to match your eye.' },
      ] },
    ],
    gossip: [
      { id: 'pillai-silk', text: 'Mrs Pillai\'s silks come by ship from Madras, and Mr Wick at the opera buys her gold tissue for crowns. He only respects people who talk shop.', hint: { who: 'wick', likes: 'craft' } },
      { id: 'pillai-onam', text: 'The ivory and gold of an Onam kasavu saree is the colour of unbleached cotton and temple lamps. Mrs Pillai wears one every year.' },
      { id: 'pillai-folake', text: 'Mama Folake at the chop house loves a joke and a kind word - but brag at her table and she will serve you last.', hint: { who: 'folake', dislikes: 'boast' } },
    ],
    react: {
      liked: ['Her eyes sharpen with interest. "Good. You know something."', 'She nods, satisfied. "Yes."'],
      neutral: ['"Hm." She refolds the silk.', 'She tilts her head, weighing you up.'],
      disliked: ['"Words like that I can buy at any market."', 'Her mouth thins. "Please. Don\'t."'],
    },
    bye: 'Come back when you have learned something about cloth.',
    requests: [
      { kind: 'festival', client: 'Mrs Lakshmi Pillai', occasion: 'the Onam feast', look: 28, body: 'curvy', wants: ['Elegant', 'Simple', 'Shimmering'], avoid: ['Gothic'], garment: { slot: 'skirt', id: 'saree' },
        line: 'All right. Make my saree for Onam. Ivory and gold, simple and bright. If you get the pleats wrong, I will tell everyone.' },
    ],
  },
  {
    id: 'folake', name: 'Mama Folake Adebayo', role: 'chop house cook and choir leader, Spice Row', place: 'spice', look: 17,
    likes: ['warm', 'witty'], dislikes: 'boast',
    hello: 'Sit down, you are too thin. Jollof or egusi? Both. You are having both.',
    topics: [
      { say: 'Thirty years I cook. Lagos, then Liverpool, then here. Everywhere the rice is different and the people are the same.', replies: [
        { a: 'warm', t: 'And everywhere, I bet, they came back for your cooking.' },
        { a: 'boast', t: 'I have been dressmaking for years myself, and I am very good at it.' },
        { a: 'witty', t: 'The people are the same, but only the rice here gets argued about.' },
      ] },
      { say: 'Our church has its harvest thanksgiving soon. Drums, dancing up the aisle, and every auntie in her best gele and wrapper.', g: 0, replies: [
        { a: 'curious', t: 'What is a gele, exactly?' },
        { a: 'witty', t: 'Dancing up the aisle - now that is a service I would stay awake for.' },
        { a: 'craft', t: 'A wax print needs a simple cut - let the pattern do the talking.' },
      ] },
      { say: 'Last year Mrs Okafor outdid me. Her wrapper shone like the sun. I have not forgiven her.', g: 1, replies: [
        { a: 'warm', t: 'Then this year, Mama, it is your turn to shine.' },
        { a: 'witty', t: 'Revenge by wrapper. I am in.' },
        { a: 'curious', t: 'Mrs Okafor? Who is she to you?' },
      ] },
    ],
    gossip: [
      { id: 'folake-gele', text: 'A gele is a Yoruba head-tie, stiff and folded high. At Mama Folake\'s church, the size of your gele is a competitive sport.' },
      { id: 'folake-okafor', text: 'Mrs Adaeze Okafor and Mama Folake have been best friends and worst rivals for twenty years.' },
      { id: 'folake-marisol', text: 'The flamenco dancer at the Blue Lantern eats at Folake\'s after every show. She cannot bear pity - but show some swagger and she lights up.', hint: { who: 'ortega', likes: 'boast' } },
    ],
    react: {
      liked: ['She roars with laughter and slaps the table.', '"Ah! This one, I like this one."'],
      neutral: ['"Eat, eat." She spoons more rice.', 'She hums a hymn and stirs the pot.'],
      disliked: ['"Hm. Pride is not a flavour, my dear."', 'She serves the next table first.'],
    },
    bye: 'Go on, go on. Take some puff-puff for the road.',
    requests: [
      { kind: 'festival', client: 'Mama Folake Adebayo', occasion: 'the harvest thanksgiving at her church', look: 17, body: 'full', wants: ['Patterned', 'Elegant', 'Shimmering'], avoid: ['Simple'],
        line: 'You! You will make my dress for thanksgiving. Bright, proud, shining. Mrs Okafor will see it from the back pew.' },
    ],
  },
  {
    id: 'chen', name: 'Mrs Chen Mei-Lin', role: 'owner of the Jade Kettle tea house, Lantern Street', place: 'lantern', look: 16,
    likes: ['curious', 'craft'], dislikes: 'witty',
    hello: 'Please, sit. Oolong today. Let it steep - you will be patient, yes?',
    topics: [
      { say: 'My grandfather came from Guangdong to work the ships. He opened this tea house with one kettle.', g: 0, replies: [
        { a: 'curious', t: 'Is that the kettle on the shelf?' },
        { a: 'witty', t: 'One kettle - and now a whole street of lanterns. Good return on a kettle.' },
        { a: 'warm', t: 'He would be proud to see it full like this.' },
      ] },
      { say: 'My daughter Jia marries in spring. There is a tea ceremony in the morning - she serves tea to her elders, kneeling, in red.', g: 1, replies: [
        { a: 'curious', t: 'Why red?' },
        { a: 'craft', t: 'Kneeling in a fitted skirt is hard - it needs ease at the hip.' },
        { a: 'flatter', t: 'She will look lovely, like her mother.' },
      ] },
      { say: 'In the evening, she wants a white gown too, like the English brides. Two dresses in one day! Young people.', replies: [
        { a: 'witty', t: 'Two dresses, twice the photographs, half the sleep.' },
        { a: 'craft', t: 'Then the morning dress should be the one with the work in it - the one her elders see.' },
        { a: 'warm', t: 'She is holding on to both worlds. That is a lovely thing.' },
      ] },
    ],
    gossip: [
      { id: 'chen-kettle', text: 'The iron kettle on the Jade Kettle\'s shelf is the original, from 1871. Mrs Chen polishes it every New Year.' },
      { id: 'chen-red', text: 'Red is the colour of luck and joy at a Chinese wedding. White, in Mrs Chen\'s grandmother\'s day, was for mourning.' },
      { id: 'chen-nok', text: 'Khun Nok at the Golden Orchid wants her cooking praised and a laugh with her curry. Talk to her about hems and she will fall asleep.', hint: { who: 'nok', dislikes: 'craft' } },
    ],
    react: {
      liked: ['She pours you more tea, smiling.', '"Yes. You listen well."'],
      neutral: ['She sips her tea quietly.', 'She nods, turning her cup.'],
      disliked: ['Her smile goes polite and thin.', '"Hm. Perhaps." She looks at the kettle.'],
    },
    bye: 'Thank you for visiting. The tea is always here.',
    requests: [
      { kind: 'asianwedding', client: 'Miss Chen Jia', occasion: 'her wedding-morning tea ceremony', look: 16, body: 'slender', wants: ['Elegant', 'Formal', 'Romantic'], avoid: ['Gothic'], garment: { slot: 'bodice', id: 'qipao' },
        line: 'I would like you to make Jia\'s qipao for the tea ceremony, in red. The one her grandmother will see. Please make it beautiful.' },
    ],
  },
  {
    id: 'nok', name: 'Khun Nok Wongsakul', role: 'cook at the Golden Orchid, Lantern Street', place: 'lantern', look: 27,
    likes: ['witty', 'flatter'], dislikes: 'craft',
    hello: 'Sawasdee ka! Sit, sit. You want it spicy, or English spicy?',
    topics: [
      { say: 'Everybody says my green curry is the best in the county. Everybody is correct.', replies: [
        { a: 'flatter', t: 'It is the best thing I have eaten since I came to Thimblebury.' },
        { a: 'craft', t: 'Speaking of green - I have a sage dye that would suit you.' },
        { a: 'witty', t: 'I asked for English spicy and I think I can see through time.' },
      ] },
      { say: 'At Songkran we throw water at everyone in the street. Last year I got the vicar. Twice.', g: 0, replies: [
        { a: 'witty', t: 'Twice is a blessing. Once could be an accident.' },
        { a: 'curious', t: 'Why water?' },
        { a: 'warm', t: 'Was he a good sport about it?' },
      ] },
      { say: 'The ladies from the temple are dancing at the harbour for Songkran. I am dancing too. Do not laugh.', g: 1, replies: [
        { a: 'flatter', t: 'Laugh? You will be the best dancer on the quay.' },
        { a: 'craft', t: 'A pha sin wrap with a woven hem border would sit well for dancing.' },
        { a: 'curious', t: 'Which dance?' },
      ] },
    ],
    gossip: [
      { id: 'nok-water', text: 'At Songkran, the Thai new year, water washes away the old year\'s bad luck. The vicar of St Anne\'s now brings an umbrella.' },
      { id: 'nok-dance', text: 'The Golden Orchid ladies dance the ram wong at the harbour every April. Khun Nok practises in the kitchen between orders.' },
      { id: 'nok-samira', text: 'Samira at the washhouse was a seamstress in Aleppo. She will not take compliments, but talk needlework with her and she brightens.', hint: { who: 'haddad', likes: 'craft' } },
    ],
    react: {
      liked: ['She laughs and swats you with a tea towel.', '"Ha! I like you. Extra rice."'],
      neutral: ['"Mm-hm." She stirs the wok.', 'She shrugs happily and keeps cooking.'],
      disliked: ['Her eyes wander to the clock.', '"Yes, yes, clothes," she says, not listening.'],
    },
    bye: 'Okay, I have forty curries to make. Come back hungry!',
    requests: [
      { kind: 'festival', client: 'Khun Nok Wongsakul', occasion: 'the Songkran dance on the quay', look: 27, body: 'curvy', wants: ['Playful', 'Patterned', 'Daywear'], avoid: ['Gothic'], garment: { slot: 'skirt', id: 'phasin' },
        line: 'Okay, okay. You make my pha sin for the dance. Pretty but I must move in it. And if I get the vicar wet, it must dry fast!' },
    ],
  },
  {
    id: 'ortega', name: 'Miss Marisol Ortega', role: 'flamenco dancer at the Blue Lantern', place: 'lantern', look: 22,
    likes: ['boast', 'witty'], dislikes: 'warm',
    hello: 'You are staring. Everyone stares. It is fine - I am worth it. What do you want?',
    topics: [
      { say: 'I dance six nights a week. My feet are ruined, my heart is in Seville, and the piano player cannot count.', replies: [
        { a: 'warm', t: 'That sounds exhausting. You must miss home terribly.' },
        { a: 'witty', t: 'Then dance in threes and let him catch up.' },
        { a: 'boast', t: 'Six nights a week? I sew seven. We are the same kind of stubborn.' },
      ] },
      { say: 'My dresses fall apart. The ruffles tear off on the turns. Every dressmaker here makes costumes for statues.', g: 0, replies: [
        { a: 'boast', t: 'My ruffles do not tear. Spin all you like.' },
        { a: 'craft', t: 'Bias-cut flounces, sewn on a stay tape - they would move with you.' },
        { a: 'curious', t: 'Who made the last one?' },
      ] },
      { say: 'Next month I have a solo. A whole song, alone, with the red light. It must be the dress people remember.', g: 1, replies: [
        { a: 'witty', t: 'Then the dress must be brave enough to upstage you. Difficult.' },
        { a: 'warm', t: 'You must be nervous. It is a big moment.' },
        { a: 'curious', t: 'What is the song about?' },
      ] },
    ],
    gossip: [
      { id: 'ortega-last', text: 'Marisol Ortega\'s last dress was made by a costume house in London. It lost three flounces in one bulerias.' },
      { id: 'ortega-song', text: 'Marisol\'s solo is a solea - a song of loneliness. She tells people it is about a goat.' },
      { id: 'ortega-alfie', text: 'Alfie the lamplighter\'s boy knows everybody\'s secrets. He wants to be made to laugh, and he hates being mothered.', hint: { who: 'alfie', likes: 'witty' } },
    ],
    react: {
      liked: ['She throws her head back and laughs. "Ole!"', 'A slow smile. "Now we are talking."'],
      neutral: ['She shrugs one shoulder.', '"Maybe." She taps a heel on the floor.'],
      disliked: ['"Don\'t pity me. I hate that."', 'She rolls her eyes and turns to the mirror.'],
    },
    bye: 'Rehearsal. Go. Come see the show some night.',
    requests: [
      { kind: 'stage', client: 'Miss Marisol Ortega', occasion: 'her flamenco solo at the Blue Lantern', look: 22, body: 'curvy', wants: ['Eveningwear', 'Glamour', 'Playful'], avoid: ['Simple'],
        line: 'Fine. You make the dress for my solo. If a single ruffle comes off, I will throw it at you from the stage.' },
    ],
  },
  {
    id: 'rosen', he: true, name: 'Mr Abraham Rosen', role: 'haberdasher and retired tailor, Lantern Street', place: 'lantern', look: 18,
    likes: ['craft', 'witty'], dislikes: 'flatter',
    hello: 'The new dressmaker. My customers talk. Let me see your hands. Hm. Needle calluses. Good.',
    topics: [
      { say: 'Fifty years I cut coats. My father cut coats in Vilnius, his father in Warsaw. Now I sell buttons.', g: 0, replies: [
        { a: 'craft', t: 'Did your father pad-stitch his lapels by hand?' },
        { a: 'flatter', t: 'Such a distinguished family of tailors, Mr Rosen!' },
        { a: 'curious', t: 'Why did you stop cutting?' },
      ] },
      { say: 'Young people today buy thread by the colour. Thread you buy by the weight and the twist.', replies: [
        { a: 'craft', t: 'Silk thread for silk, and a finer needle - otherwise it puckers.' },
        { a: 'witty', t: 'I buy mine by whichever reel has not rolled under the table.' },
        { a: 'boast', t: 'I never have that problem. My seams are perfect.' },
      ] },
      { say: 'My granddaughter Hannah has her bat mitzvah in the autumn. She wants to look grown-up. She is twelve.', g: 1, replies: [
        { a: 'witty', t: 'At twelve I wanted to look grown-up too. At thirty I would like it to stop.' },
        { a: 'curious', t: 'What does a bat mitzvah mean for her?' },
        { a: 'flatter', t: 'She must take after her wise grandfather.' },
      ] },
    ],
    gossip: [
      { id: 'rosen-hands', text: 'Mr Rosen stopped cutting coats when his hands began to shake. He still teaches the harbour girls to sew on Sunday mornings, for nothing.' },
      { id: 'rosen-hannah', text: 'At her bat mitzvah Hannah Rosen reads from the Torah in front of the whole synagogue - her grandfather has been practising with her for a year.' },
      { id: 'rosen-nell', text: 'Old Nell at the harbour has a granddaughter, Molly, who won the school prize. Nell cannot afford a dress for the prize-giving. She would never ask - but a kind word opens her up.', hint: { who: 'briggs', likes: 'warm' } },
    ],
    react: {
      liked: ['"Ha!" A rare smile. "Yes. That is right."', 'He nods slowly, approving.'],
      neutral: ['"Mm." He sorts buttons into a tin.', 'He peers at you over his glasses.'],
      disliked: ['"Save the sugar for Mrs Nowak\'s buns."', 'He waves a hand. "Enough, enough."'],
    },
    bye: 'Buttons are sixpence a card. Good day.',
    requests: [
      { kind: 'festival', client: 'Miss Hannah Rosen', occasion: 'her bat mitzvah', look: 2, body: 'slender', wants: ['Elegant', 'Cute', 'Daywear'], avoid: ['Risqué'],
        line: 'You know what you are doing. Make Hannah\'s dress. Grown-up, but twelve. You understand. I will pay, and I will check every seam.', gift: { id: 'buttons', n: 2 } },
    ],
  },
  {
    id: 'briggs', name: 'Old Nell Briggs', role: 'fishwife at the harbour', place: 'harbour', look: 20,
    likes: ['warm', 'curious'], dislikes: 'boast',
    hello: 'Cod\'s tuppence, herring\'s a penny, and I\'m not haggling, dear.',
    topics: [
      { say: 'Up at three for the boats. My Jack went out one morning in \'09 and never come back. Still up at three.', replies: [
        { a: 'warm', t: 'I am so sorry, Nell. You have carried a lot, alone.' },
        { a: 'witty', t: 'Three in the morning is not a time, it is a punishment.' },
        { a: 'curious', t: 'Who helps you with the stall?' },
      ] },
      { say: 'My granddaughter Molly helps. Sharp as a hook, that one. Top of her class. First prize, if you please.', g: 0, replies: [
        { a: 'curious', t: 'First prize! What for?' },
        { a: 'boast', t: 'I was top of my class too. Look where it got me.' },
        { a: 'warm', t: 'You must be bursting with pride.' },
      ] },
      { say: 'There\'s a prize-giving at the school. All the girls in new frocks. Molly\'s got her Sunday one. It\'s had three owners.', g: 1, replies: [
        { a: 'warm', t: 'Nell - would you let me make Molly something? For her day.' },
        { a: 'curious', t: 'Three owners? Whose was it first?' },
        { a: 'boast', t: 'If she wore one of mine, she\'d outshine the lot of them.' },
      ] },
    ],
    gossip: [
      { id: 'briggs-prize', text: 'Molly Briggs won the county essay prize with "What the Sea Takes". The headmistress read it aloud and cried.' },
      { id: 'briggs-dress', text: 'In the harbour, a girl\'s one good dress is handed down street by street. Molly Briggs\'s Sunday frock began life on a butcher\'s daughter.' },
      { id: 'briggs-samira', text: 'Nell says Samira Haddad at the washhouse is desperate for the clerk\'s post at the bank - but she has only her washing clothes. Flattery makes her wary; kindness and shop talk do not.', hint: { who: 'haddad', dislikes: 'flatter' } },
    ],
    react: {
      liked: ['Her eyes go bright. "Oh, you\'re a love."', 'She pats your arm with a cold, rough hand.'],
      neutral: ['"Aye." She wraps a herring in newspaper.', 'She nods, scaling a fish.'],
      disliked: ['"Well. Aren\'t we grand."', 'She turns to the next customer.'],
    },
    bye: 'Mind the gulls, dear. They\'ll have your hat.',
    need: 4,
    requests: [
      { kind: 'charity', client: 'Molly Briggs', occasion: 'the school prize-giving', look: 0, body: 'slender', wants: ['Cute', 'Daywear', 'Simple'], avoid: ['Glamour'],
        line: 'You offer to make Molly a dress for the prize-giving, for nothing. Nell goes quiet. "I can\'t pay you, you know." You tell her you know. She presses something into your hand: a roll of old lace, her mother\'s.', gift: { id: 'lace', n: 3 } },
    ],
  },
  {
    id: 'haddad', name: 'Mrs Samira Haddad', role: 'laundress at the harbour washhouse', place: 'harbour', look: 15,
    likes: ['craft', 'warm'], dislikes: 'flatter',
    hello: 'Careful - the floor is wet. You are looking for someone? ... Oh. For me?',
    topics: [
      { say: 'In Aleppo I embroidered wedding dresses. Here, I wash other people\'s sheets. It is honest work.', g: 0, replies: [
        { a: 'craft', t: 'What stitches did you use? I have always wanted to learn tatreez.' },
        { a: 'flatter', t: 'Someone as talented as you should be in a palace!' },
        { a: 'curious', t: 'How did you come to Thimblebury?' },
      ] },
      { say: 'The bank on Market Square wants a clerk who speaks French and Arabic. I speak both, and English, and some Turkish.', g: 1, replies: [
        { a: 'warm', t: 'Four languages. They would be lucky to have you.' },
        { a: 'witty', t: 'The manager speaks one, and badly. You should have his job.' },
        { a: 'curious', t: 'Have you applied?' },
      ] },
      { say: 'The interview is on Thursday. I have this apron and one skirt. I will go anyway.', replies: [
        { a: 'warm', t: 'Samira, let me make you something for Thursday. No charge. Please.' },
        { a: 'craft', t: 'A plain, well-cut jacket and skirt would be all you need.' },
        { a: 'flatter', t: 'You would look wonderful in a sack!' },
      ] },
    ],
    gossip: [
      { id: 'haddad-aleppo', text: 'Samira Haddad came to Thimblebury with her two sons and a bag of embroidery silks she would not sell, even when they were hungry.' },
      { id: 'haddad-bank', text: 'The bank on Market Square has lost two French contracts for want of a clerk who can read the letters.' },
      { id: 'haddad-devika', text: 'Samira did laundry for number nine, the Crescent. The Rani there asks everyone questions about their lives - she likes the curious, too.', hint: { who: 'devika', likes: 'curious' } },
    ],
    react: {
      liked: ['She smiles properly for the first time.', '"You understand." She wipes her hands.'],
      neutral: ['She nods, wringing a sheet.', '"Perhaps," she says quietly.'],
      disliked: ['She stiffens. "Please do not."', 'Her face closes like a door.'],
    },
    bye: 'I must get back. The sheets do not wash themselves.',
    need: 4,
    requests: [
      { kind: 'charity', client: 'Mrs Samira Haddad', occasion: 'her interview for the bank', look: 15, body: 'classic', wants: ['Professional', 'Daywear', 'Simple'], avoid: ['Risqué', 'Whimsical'],
        line: 'You offer to make Samira something for her interview, for nothing. She shakes her head, then stops. "Then take these." A skein of gold embroidery thread, the last of the silks from Aleppo.', gift: { id: 'embroidery', n: 2 } },
    ],
  },
  {
    id: 'alfie', he: true, name: 'Alfie Pike', role: 'lamplighter\'s boy, knows everything', place: 'harbour', look: 21,
    likes: ['witty', 'boast'], dislikes: 'warm',
    hello: 'Oi, dressmaker! Want to know something? Everything\'s got a price. Mine\'s a laugh.',
    topics: [
      { say: 'I light every lamp from the harbour to the Crescent. See everything, me. Who\'s courting, who\'s skint, who\'s lying.', g: 0, replies: [
        { a: 'witty', t: 'And who\'s paying you to keep quiet?' },
        { a: 'warm', t: 'That is a lot of walking for a boy. Do you get enough to eat?' },
        { a: 'curious', t: 'Go on then - who\'s courting?' },
      ] },
      { say: 'Up at the opera there\'s a bloke called Wick who talks to his costumes. Proper talks to them.', g: 1, replies: [
        { a: 'witty', t: 'Do they answer back? Mine do.' },
        { a: 'curious', t: 'What does he say to them?' },
        { a: 'boast', t: 'If I made his costumes, they\'d sing on their own.' },
      ] },
      { say: 'Bet you can\'t guess what\'s in my pocket.', g: 2, replies: [
        { a: 'boast', t: 'A thimble, two buttons and somebody\'s secret.' },
        { a: 'witty', t: 'Your hand. Hopefully.' },
        { a: 'curious', t: 'Go on. Show me.' },
      ] },
    ],
    gossip: [
      { id: 'alfie-courting', text: 'Aurora Crane goes to the observatory every Thursday. So, every Thursday, does the Rani\'s nephew.' },
      { id: 'alfie-wick', text: 'Mr Wick at the opera loves a joke and shop talk, and cannot stand being buttered up. He talks to the costumes because they, he says, never flatter him.', hint: { who: 'wick', dislikes: 'flatter' } },
      { id: 'alfie-pocket', text: 'In Alfie\'s pocket: a thimble, a button, and a ticket stub from the opera\'s dress rehearsal. Madame Dupre, he says, loves being told how grand she is.', hint: { who: 'dupre', likes: 'boast' } },
    ],
    react: {
      liked: ['He cackles. "You\'re all right, you are."', 'He grins, gap-toothed.'],
      neutral: ['"Yeah, yeah." He kicks a pebble.', 'He shrugs.'],
      disliked: ['"Don\'t mother me, missus."', 'He scowls and looks away.'],
    },
    bye: 'Lamps won\'t light themselves. Ta-ra!',
    requests: [],
  },
  {
    id: 'wick', he: true, name: 'Mr Ignatius Wick', role: 'wardrobe master, the Thimblebury Opera', place: 'crescent', look: 26, minStanding: 6,
    likes: ['craft', 'witty'], dislikes: 'flatter',
    hello: 'You are standing on a Valkyrie. No - the cloak. Step off, please. Now, who are you?',
    topics: [
      { say: 'Every costume here must survive six weeks of sweat, stage lights and tenors. Beauty is easy. Surviving is hard.', replies: [
        { a: 'craft', t: 'Flat-felled seams inside, and a hanging lining so it can be let out.' },
        { a: 'flatter', t: 'Your costumes are the finest I have ever seen.' },
        { a: 'witty', t: 'The tenors survive, though. That is the real tragedy.' },
      ] },
      { say: 'We open The Magic Flute next month. The Queen of the Night needs a gown that looks like the sky has turned against you.', g: 0, replies: [
        { a: 'craft', t: 'Midnight velvet, jet beads, and something that catches the light - stars on a dark ground.' },
        { a: 'curious', t: 'Who is singing the Queen?' },
        { a: 'boast', t: 'I could make the sky itself jealous.' },
      ] },
      { say: 'My last assistant used glue. GLUE. On silk.', g: 1, replies: [
        { a: 'witty', t: 'I hope you buried them with honours. And the glue.' },
        { a: 'craft', t: 'Glue stains silk forever - you can see it under the lights.' },
        { a: 'curious', t: 'What did the glue ruin?' },
      ] },
    ],
    gossip: [
      { id: 'wick-queen', text: 'The Queen of the Night is sung by Madame Solene Dupre, who has two top Fs and one temper. She cannot bear being questioned.', hint: { who: 'dupre', dislikes: 'curious' } },
      { id: 'wick-glue', text: 'The glue incident is why the opera\'s Valkyries had to sing Act Three in borrowed curtains.' },
      { id: 'wick-lady', text: 'Mr Wick once dressed Lady Philippa for a charity masque. "Charming, if you admire her," he says, "and she requires that you do."', hint: { who: 'philippa', likes: 'warm' } },
    ],
    react: {
      liked: ['"Correct." He almost smiles.', 'He points his scissors at you. "Yes. Good."'],
      neutral: ['He pins a hem, listening with half an ear.', '"Mm." He measures something.'],
      disliked: ['"Flattery wrinkles. I have no use for it."', 'He goes back to his pins.'],
    },
    bye: 'I have forty chorus hats to trim. Close the door on your way out.',
    requests: [
      { kind: 'opera', client: 'Mr Ignatius Wick', occasion: "The Magic Flute - the Queen of the Night's gown", look: 26, body: 'classic', wants: ['Gothic', 'Shimmering', 'Elaborate'], avoid: ['Casual'],
        line: 'Very well. You make the Queen of the Night. The whole house will be looking at it for the aria. No glue.' },
    ],
  },
  {
    id: 'dupre', name: 'Madame Solene Dupre', role: 'prima donna, the Thimblebury Opera', place: 'crescent', look: 25, minStanding: 12, need: 5,
    likes: ['flatter', 'boast'], dislikes: 'curious',
    hello: 'You may approach. Briefly. I am resting my voice, so you will do the talking.',
    topics: [
      { say: 'I have sung in Paris, Milan and Vienna. Now Thimblebury. The acoustics are... adequate.', replies: [
        { a: 'flatter', t: 'They are adequate until you sing in them. Then they are divine.' },
        { a: 'curious', t: 'Why did you leave Vienna?' },
        { a: 'witty', t: 'The acoustics may be adequate, but the audience is thrilled.' },
      ] },
      { say: 'My costumes are always wrong. Too heavy to breathe in, too plain to be seen from the gods.', replies: [
        { a: 'boast', t: 'Mine are light as breath and can be seen from the moon.' },
        { a: 'craft', t: 'Boning that stops below the ribs, so you can breathe from the diaphragm.' },
        { a: 'curious', t: 'Which costume was the worst?' },
      ] },
      { say: 'In the spring I sing Tosca. Act Two, she faces down a monster in a gown worth dying in.', replies: [
        { a: 'flatter', t: 'Only you could make a gown worth dying in look like it was worth living in.' },
        { a: 'boast', t: 'Then you need the finest dressmaker in town. I am right here.' },
        { a: 'curious', t: 'What happens at the end?' },
      ] },
    ],
    gossip: [
      { id: 'dupre-vienna', text: 'Madame Dupre left Vienna after throwing a shoe at a conductor. She says he deserved both shoes.' },
    ],
    react: {
      liked: ['She inclines her head graciously.', '"You have taste. That is rare."'],
      neutral: ['She examines her nails.', '"Mm." She sips warm honey water.'],
      disliked: ['"Questions. Always questions. It tires my voice."', 'She turns away with a sigh.'],
    },
    bye: 'You may go. I shall remember your face, perhaps.',
    requests: [
      { kind: 'opera', client: 'Madame Solene Dupre', occasion: 'Tosca, Act Two - a gown worth dying in', look: 25, body: 'curvy', wants: ['Glamour', 'Eveningwear', 'Elaborate'], avoid: ['Simple'],
        line: 'Very well. You shall make my Tosca. Something the gods can see. Something that makes the baritone forget his lines.' },
    ],
  },
  {
    id: 'philippa', name: 'Lady Philippa Ashcombe', role: 'of Ashcombe House, the Crescent', place: 'crescent', look: 23, minStanding: 20, need: 5,
    likes: ['flatter', 'warm'], dislikes: 'witty',
    hello: 'I am told you are the dressmaker everyone is talking about. I shall decide whether they are right.',
    topics: [
      { say: 'Ashcombe House has dressed at Worth, in Paris, for three generations. My grandmother met the Empress Eugenie.', replies: [
        { a: 'flatter', t: 'And your ladyship carries that elegance better than anyone in town.' },
        { a: 'witty', t: 'I hope the Empress was suitably impressed by your grandmother.' },
        { a: 'boast', t: 'Worth never had my eye for colour.' },
      ] },
      { say: 'My late mother founded the harbour school. I sit on its board now. It is a great deal of work.', replies: [
        { a: 'warm', t: 'Molly Briggs\'s prize came from that school. Your mother\'s work lives on.' },
        { a: 'witty', t: 'Boards are where good ideas go for a lie-down.' },
        { a: 'curious', t: 'Do you visit the school often?' },
      ] },
      { say: 'I am to be presented at court in the spring. It must be perfect. Formal, elegant, and not remotely "fun".', replies: [
        { a: 'flatter', t: 'With your bearing, perfect is simply where we start.' },
        { a: 'warm', t: 'It is a great honour. I would be glad to help you feel ready for it.' },
        { a: 'witty', t: 'No fun whatsoever. I shall hide it in the lining.' },
      ] },
    ],
    gossip: [
      { id: 'philippa-school', text: 'Lady Philippa quietly pays the fees of six harbour girls at her mother\'s school. She would be mortified if anyone knew.' },
    ],
    react: {
      liked: ['She inclines her head. "How perceptive."', 'A small, pleased smile.'],
      neutral: ['"Quite." She sips her tea.', 'She considers you in silence.'],
      disliked: ['"I beg your pardon?"', 'The temperature in the room drops.'],
    },
    bye: 'Thank you. My butler will see you out.',
    requests: [
      { kind: 'noble', client: 'Lady Philippa Ashcombe', occasion: 'her presentation at court', look: 23, body: 'slender', wants: ['Formal', 'Elegant', 'Elaborate'], avoid: ['Casual', 'Risqué'],
        line: 'I have decided. You shall make my court gown. Do not disappoint me - Ashcombe House remembers.' },
    ],
  },
  {
    id: 'devika', name: 'Rani Devika Rao', role: 'visiting from Mysore, number nine, the Crescent', place: 'crescent', look: 24, minStanding: 15, need: 5,
    likes: ['curious', 'craft'], dislikes: 'flatter',
    hello: 'Come in. You are the dressmaker from Thimble Lane - Mrs Pillai sends me your name. Sit, please.',
    topics: [
      { say: 'In Mysore, the silk weavers have worked for my family for two hundred years. I learned to weave before I learned to write.', replies: [
        { a: 'curious', t: 'What was the first thing you wove?' },
        { a: 'flatter', t: 'Your highness is as accomplished as she is beautiful.' },
        { a: 'craft', t: 'Mysore silk has that soft, pure sheen - no zari needed to make it glow.' },
      ] },
      { say: 'The Lord Mayor gives a banquet for me next month. He has asked if I will wear "native costume". As if I own a costume.', replies: [
        { a: 'curious', t: 'What will you wear?' },
        { a: 'witty', t: 'Perhaps he will wear his native costume too. Chains and a hat.' },
        { a: 'warm', t: 'That must be tiresome. You deserve to be seen as you are.' },
      ] },
      { say: 'A saree, of course. But I want it cut and finished by someone here - so that it belongs to both places.', replies: [
        { a: 'craft', t: 'A fitted choli in the local style, and the saree in your own silk, bordered in gold.' },
        { a: 'flatter', t: 'Anything would look perfect on you, your highness.' },
        { a: 'curious', t: 'Which parts of it should come from Mysore?' },
      ] },
    ],
    gossip: [
      { id: 'devika-weave', text: 'The first thing Rani Devika wove was a bookmark, badly, at seven. She still uses it.' },
    ],
    react: {
      liked: ['Her face lights up. "Yes - exactly that."', 'She leans forward, interested.'],
      neutral: ['She nods, considering.', '"Perhaps." She pours tea.'],
      disliked: ['"I hear that all day. Tell me something true."', 'She sets her cup down, cooler.'],
    },
    bye: 'Thank you for coming. Mrs Pillai was right to mention you.',
    requests: [
      { kind: 'noble', client: 'Rani Devika Rao', occasion: "the Lord Mayor's banquet", look: 24, body: 'classic', wants: ['Formal', 'Shimmering', 'Elaborate'], avoid: ['Casual'], garment: { slot: 'skirt', id: 'saree' },
        line: 'I should like you to make it - the saree for the banquet. Let the Lord Mayor see what "native costume" really means.' },
    ],
  },
];






function joinVisits(people, more) {
  return people.map((p) => {
    const m = more[p.id] || {}, n = NIGHT[p.id] || {};
    const clues = CONFLICTS.flatMap((c) => c.holders[p.id] || []);
    const gossip = [...p.gossip, ...(m.gossip || []), ...(n.nightGossip || []), ...clues];
    const at = (g) => (typeof g === 'string' ? gossip.findIndex((x) => x.id === g) : g);
    const fix = (set) => set.map((t) => (t.g == null ? t : { ...t, g: at(t.g) }));
    const chats = [...(p.chats || []), ...(m.chats || [])].map(fix);
    const mended = CONFLICTS.flatMap((c) => c.requests[p.id] || []);
    return {
      ...p, again: m.again || p.again, gossip, chats, voice: VOICES[p.id],
      hours: n.hours || 'both', nightAt: n.nightAt, nightHello: n.nightHello, nightChat: n.nightChat && fix(n.nightChat),
      requests: [...p.requests, ...(m.requests || []), ...(n.nightRequests || []), ...mended],
    };
  });
}
export const PEOPLE = joinVisits([...FIRST_PEOPLE, ...WEDDING_PEOPLE], SECOND_VISITS);



export const BUILDINGS = [
  { id: 'atelier', name: 'Your atelier', sign: 'Silk & Seam', place: 'square', people: [], home: true, hint: 'Your shop on Thimble Lane, with the dress form in the window.' },
  { id: 'bakery', name: "Nowak's Bakery", sign: 'Piekarnia Nowak', place: 'square', people: ['nowak'], hint: 'Poppy-seed rolls and plum cake in the window. The baker knows everyone\'s business.' },
  { id: 'herald', name: 'The Thimblebury Herald', sign: 'The Herald', place: 'square', people: ['crane'], hint: 'Today\'s paper in the window: "Rani Arrives at the Crescent!" The society columnist is in.' },
  { id: 'silks', name: "Pillai's Silks", sign: 'Pillai Silks', place: 'spice', people: ['pillai'], hint: 'Bolts of Kanchipuram silk with gold borders. The owner talks cloth, not compliments.' },
  { id: 'chophouse', name: "Mama Folake's Chop House", sign: "Mama Folake's", place: 'spice', people: ['folake'], hint: 'Jollof steam at the door and a hymn from the kitchen. Everyone leaves fed.' },
  { id: 'teahouse', name: 'The Jade Kettle', sign: 'Jade Kettle', place: 'lantern', people: ['chen'], hint: 'An old iron kettle on the shelf and oolong on the stove. A wedding is being planned.' },
  { id: 'orchid', name: 'The Golden Orchid', sign: 'Golden Orchid', place: 'lantern', people: ['nok'], hint: 'Green curry, orchids and laughter. The cook practises a dance between orders.' },
  { id: 'bluelantern', name: 'The Blue Lantern', sign: 'Blue Lantern', place: 'lantern', people: ['ortega'], hint: 'A red spotlight and a flamenco poster: "Marisol Ortega - Six Nights a Week".' },
  { id: 'haberdashery', name: "Rosen's Haberdashery", sign: 'A. Rosen - Buttons & Thread', place: 'lantern', people: ['rosen'], hint: 'Button cards and thread by the weight and the twist. An old tailor minds the counter.' },
  { id: 'fishmarket', name: 'The Fish Quay', sign: 'Fish Quay', place: 'harbour', people: ['briggs', 'alfie'], hint: 'Herring a penny, cod tuppence. A fishwife, and a boy who hears everything.' },
  { id: 'washhouse', name: 'The Washhouse', sign: 'Public Washhouse', place: 'harbour', people: ['haddad'], hint: 'Steam, sheets on the lines, and a laundress who once embroidered wedding gowns.' },
  { id: 'opera', name: 'The Thimblebury Opera', sign: 'Opera', place: 'crescent', people: ['wick', 'dupre'], hint: 'Posters for The Magic Flute and Tosca. The wardrobe master and the prima donna are inside.' },
  { id: 'ashcombe', name: 'Ashcombe House', sign: 'Ashcombe House', place: 'crescent', people: ['philippa'], hint: 'A crest over the door and a butler at it. Lady Philippa receives only the talk of the town.' },
  { id: 'ninecrescent', name: 'Number Nine, the Crescent', sign: 'No. 9', place: 'crescent', people: ['devika'], hint: 'A peacock-blue door. The visiting Rani weaves and asks questions.' },
  { id: 'stanne', name: "St Anne's Church", sign: "St Anne's", place: 'square', people: ['pennington', 'santos'], hint: 'Bells, lilies on the altar and a choir rehearsing. The flower lady and the choir mistress run every wedding here.' },
  { id: 'lotus', name: 'The Lotus Wedding House', sign: 'Lotus Weddings', place: 'lantern', people: ['tran', 'kaur'], hint: 'A red bridal ao dai and a gold-bordered lehenga in the window. Eleven weddings this season - Vietnamese, Korean, Chinese, Malay, Sikh.' },
];
export const building = (id) => BUILDINGS.find((b) => b.id === id);
export const buildingOf = (personId) => BUILDINGS.find((b) => b.people.includes(personId));




export const awake = (p, night) => !night || p.hours !== 'day';
export const whereIs = (p, night) => (night && p.nightAt ? building(p.nightAt) : buildingOf(p.id));
export const peopleIn = (b, night) => PEOPLE.filter((p) => whereIs(p, night)?.id === b.id).map((p) => p.id);

export const person = (id) => PEOPLE.find((p) => p.id === id);
export const GOSSIP = PEOPLE.flatMap((p) => p.gossip.map((g) => ({ ...g, from: p.id })));
export const gossip = (id) => GOSSIP.find((g) => g.id === id);


export function freshTown() {
  return { day: 0, talks: 0, people: {}, known: [], notice: 0, charity: 0, kinds: {}, trouble: { seen: [], mended: [], tried: {} } };
}

export function townDay(town, made) {
  const t = { ...freshTown(), ...(town || {}) };
  return t.day === made ? t : { ...t, day: made, talks: 0 };
}
export const talksLeft = (town, made) => (townDay(town, made).talks >= TALKS_PER_DAY ? 0 : TALKS_PER_DAY - townDay(town, made).talks);
export const standing = (rep, notice) => (rep || 0) + NOTICE_WEIGHT * (notice || 0);
export const receives = (p, rep, notice) => standing(rep, notice) >= (p.minStanding || 0);
export const talkedToday = (town, id, made) => town?.people?.[id]?.last === made;


export function cannotTalk(p, town, { made = 0, rep = 0, night = false } = {}) {
  if (!awake(p, night)) return 'asleep';
  if (!receives(p, rep, town?.notice)) return 'closed';
  if (talkedToday(town, p.id, made)) return 'talked';
  if (!talksLeft(town, made)) return 'tired';
  return null;
}


export function reactionOf(p, approach) {
  return p.likes.includes(approach) ? 'liked' : p.dislikes === approach ? 'disliked' : 'neutral';
}

export function startRapport(p, town) {
  const mem = town?.people?.[p.id];
  const friend = (mem?.served || 0) > 0 && (mem?.stars || 0) >= 3 ? 2 : 0;
  return Math.min(2, Math.floor((town?.notice || 0) / 3)) + friend;
}

export const conversationsOf = (p) => [p.topics, ...(p.chats || [])];

export function talksWith(town, id) {
  const mem = town?.people?.[id];
  return mem?.talks ?? (mem?.met ? 1 : 0);
}

export function conversationIndex(p, town) {
  const n = talksWith(town, p.id), all = conversationsOf(p).length;
  return n < all ? n : all > 1 ? 1 + ((n - 1) % (all - 1)) : 0;
}

export const topicsOf = (p, talk) => (talk?.set === 'night' ? p.nightChat : conversationsOf(p)[talk?.set || 0] || p.topics);
export function startTalk(p, town, { night = false } = {}) {
  const set = night && p.nightChat && !town?.people?.[p.id]?.nightHeard ? 'night' : conversationIndex(p, town);
  return { id: p.id, set, night, round: 0, rapport: startRapport(p, town), heard: [], log: [], done: false };
}

export const helloOf = (p, talk) => (talk.set === 'night' || (talk.night && p.nightHello && talk.set) ? p.nightHello : talk.set ? p.again || p.hello : p.hello);




export function emotionOf(p, kind, approach) {
  if (kind === 'liked') return approach === 'witty' ? 'laugh' : 'love';
  if (kind === 'disliked') return p.voice?.temper || 'cold';
  if (kind === 'joy') return 'joy';
  return 'hmm';
}
export const moodOf = (emotion) => ({ love: 'happy', laugh: 'happy', joy: 'happy', hurt: 'sad', angry: 'angry' }[emotion] || 'neutral');





export const MEND_NOTICE = 2;
export const conflict = (id) => CONFLICTS.find((c) => c.id === id);
export const troublesOf = (id) => CONFLICTS.filter((c) => c.a === id || c.b === id);
const trouble = (town) => ({ seen: [], mended: [], tried: {}, ...(town?.trouble || {}) });
export const isMended = (town, id) => trouble(town).mended.includes(id);
export const isSeen = (town, id) => trouble(town).seen.includes(id);

export function clueSource(gid) {
  for (const p of PEOPLE) {
    const g = p.gossip.find((x) => x.id === gid);
    if (g) return { who: p.id, night: !!g.night };
  }
  return null;
}
export const hasClues = (town, c) => c.clues.every((g) => (town?.known || []).includes(g));

export function canMediate(p, town, made = 0) {
  return CONFLICTS.find((c) => c.mediator === p.id && isSeen(town, c.id) && !isMended(town, c.id) && hasClues(town, c) && trouble(town).tried[c.id] !== made) || null;
}

export const complaintOf = (p, town) => troublesOf(p.id).filter((c) => !isMended(town, c.id)).map((c) => c.complaint[p.id]).filter(Boolean)[0] || null;


export function mediate(town, c, p, i, rapport, made) {
  const t = { ...freshTown(), ...(town || {}) };
  const tr = trouble(t);
  const kind = reactionOf(p, c.tell[i].a);
  const ok = kind === 'liked' || (kind === 'neutral' && rapport >= needOf(p));
  if (!ok) return { ok, kind, town: { ...t, trouble: { ...tr, tried: { ...tr.tried, [c.id]: made } } } };
  const people = { ...t.people };
  for (const id of [c.a, c.b]) people[id] = { ...(people[id] || {}), lastReq: null };
  return { ok, kind, town: { ...t, people, notice: (t.notice || 0) + MEND_NOTICE, trouble: { ...tr, mended: [...tr.mended, c.id] } } };
}

export function talkStep(talk, p, i) {
  const topics = topicsOf(p, talk);
  const topic = topics[talk.round];
  const reply = topic.replies[i];
  const kind = reactionOf(p, reply.a);
  const heard = [...talk.heard];
  if (reply.a === 'curious' && kind !== 'disliked' && topic.g != null && p.gossip[topic.g]) heard.push(p.gossip[topic.g].id);
  const round = talk.round + 1;
  return { ...talk, round, rapport: talk.rapport + SCORE[kind], heard, log: [...talk.log, { a: reply.a, kind }], done: round >= topics.length, last: kind };
}
export const needOf = (p) => p.need || NEED;



export function requestReady(p, town, { made = 0, orders = [], job = null, lvl = 99, night = false } = {}) {
  if (!nextRequest(p, town, lvl, night)) return false;
  const mem = town?.people?.[p.id];
  if (orders.some((o) => o.townPerson === p.id) || job?.order?.townPerson === p.id) return false;
  if (orders.filter((o) => o.town).length >= MAX_TOWN_LETTERS) return false;
  return mem?.lastReq == null || made >= mem.lastReq + REQUEST_COOLDOWN;
}




export function nextRequest(p, town, lvl = 99, night = false) {
  const mem = town?.people?.[p.id] || {}, n = mem.reqs || 0, list = p.requests || [];
  const can = (r) => (!r.garment || (part(r.garment.slot, r.garment.id)?.lvl || 1) <= lvl) && (r.when !== 'night' || night) && (!r.after || isMended(town, r.after));
  const fresh = list.find((r) => r.after && can(r) && !(mem.afterTaken || []).includes(r.after));
  if (fresh) return fresh;
  for (let k = 0; k < list.length; k++) {
    const r = list[(n + k) % list.length];
    if (can(r)) return r;
  }
  return null;
}

export function talkOutcome(talk, p, town, ctx = {}) {
  const good = talk.rapport >= needOf(p);
  const known = new Set([...(town?.known || []), ...talk.heard]);
  
  
  const open = (g) => !known.has(g.id) && (!g.night || ctx.night);
  const clue = CONFLICTS.filter((c) => isSeen(town, c.id) && !isMended(town, c.id)).flatMap((c) => c.clues);
  const parting = talk.rapport >= 3 ? p.gossip.find((g) => open(g) && clue.includes(g.id)) || p.gossip.find(open) : null;
  const request = good && requestReady(p, town, ctx) ? nextRequest(p, town, ctx.lvl, ctx.night) : null;
  return { good, request, parting: parting ? parting.id : null };
}

export function recordTalk(town, talk, outcome, made) {
  const t = { ...freshTown(), ...(town || {}) };
  const mem = { ...(t.people[talk.id] || {}) };
  if (talk.set === 'night') mem.nightHeard = true; else mem.talks = talksWith(t, talk.id) + 1;
  mem.met = true;
  mem.best = Math.max(mem.best ?? -99, talk.rapport);
  const known = [...t.known];
  for (const g of [...talk.heard, outcome?.parting].filter(Boolean)) if (!known.includes(g)) known.push(g);
  const tr = trouble(t);
  const seen = [...tr.seen];
  for (const c of troublesOf(talk.id)) if (!seen.includes(c.id)) seen.push(c.id);
  return { ...t, known, people: { ...t.people, [talk.id]: mem }, trouble: { ...tr, seen } };
}

export function spendTalk(town, id, made) {
  const t = townDay(town, made);
  return { ...t, talks: t.talks + 1, people: { ...t.people, [id]: { ...(t.people[id] || {}), last: made } } };
}


export function knownTemper(known, id) {
  const out = { likes: [], dislikes: [] };
  for (const gid of known || []) {
    const h = gossip(gid)?.hint;
    if (h?.who !== id) continue;
    if (h.likes && !out.likes.includes(h.likes)) out.likes.push(h.likes);
    if (h.dislikes && !out.dislikes.includes(h.dislikes)) out.dislikes.push(h.dislikes);
  }
  return out;
}


export function requestOrder(p, req, lvl, rng) {
  const kind = REQUEST_KINDS[req.kind];
  const order = briefFor({ name: req.client, occasion: req.occasion, look: req.look, body: req.body, wants: req.wants, avoid: req.avoid, garment: req.garment }, lvl, rng);
  const base = Math.round(25 + 18 * lvl + rng() * 12);
  order.town = true;
  order.townPerson = p.id;
  order.kind = req.kind;
  order.note = req.line;
  order.from = p.name;
  order.fee = Math.round(base * kind.feeMult);
  order.budget = Math.round((30 + 28 * lvl * (0.8 + 0.4 * rng())) * kind.budgetMult);
  if (req.kind === 'charity') { order.charity = true; order.xpFee = base; }
  if (req.gift) order.gift = { ...req.gift };
  order.id = `t${Math.floor(rng() * 1e9).toString(36)}`;
  return order;
}

export function answerRequest(town, id, made, accepted, req = null) {
  const t = { ...freshTown(), ...(town || {}) };
  const mem = { ...(t.people[id] || {}) };
  if (accepted) { mem.reqs = (mem.reqs || 0) + 1; mem.lastReq = made; } else mem.lastReq = made + 1 - REQUEST_COOLDOWN;
  if (accepted && req?.after) mem.afterTaken = [...(mem.afterTaken || []), req.after];
  return { ...t, people: { ...t.people, [id]: mem } };
}

export const noticeFor = (starCount) => (starCount >= 4 ? 3 : starCount >= 3 ? 2 : 1);

export function recordServed(town, order, starCount) {
  const t = { ...freshTown(), ...(town || {}) };
  const mem = { ...(t.people[order.townPerson] || {}) };
  mem.served = (mem.served || 0) + 1;
  mem.stars = starCount;
  const out = { ...t, people: { ...t.people, [order.townPerson]: mem }, kinds: { ...t.kinds, [order.kind]: (t.kinds[order.kind] || 0) + 1 } };
  if (order.charity) { out.notice = t.notice + noticeFor(starCount); out.charity = t.charity + 1; }
  return out;
}
