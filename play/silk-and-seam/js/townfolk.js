












export const WEDDING_PEOPLE = [
  {
    id: 'pennington', name: 'Mrs Dorothy Pennington', role: "verger and flower lady, St Anne's Church", place: 'square', look: 29,
    likes: ['warm', 'craft'], dislikes: 'witty',
    hello: 'Shoes on the mat, please, dear. You are the dressmaker from Thimble Lane? I have heard. Come and help me with these peonies.',
    topics: [
      { say: 'Thirty-one years I have done the flowers at St Anne\'s. Every wedding, every christening, every funeral. You learn a great deal about people from what they want on the altar.', g: 0, replies: [
        { a: 'curious', t: 'What do brides usually ask for?' },
        { a: 'warm', t: 'Thirty-one years - the church must feel like your own home by now.' },
        { a: 'witty', t: 'And what do the flowers say about the grooms?' },
      ] },
      { say: 'My granddaughter Rose is to be married here in June. My own wedding dress went to the moths in the war. I want her to have what I did not.', g: 1, replies: [
        { a: 'warm', t: 'Then we will make her a dress good enough for both of you.' },
        { a: 'curious', t: 'What was your dress like?' },
        { a: 'craft', t: 'A long veil of Brussels lace would carry the whole aisle - and it lasts, if it is stored in blue tissue.' },
      ] },
      { say: 'People think a church wedding is all white. It is not. Ivory, champagne, the colour of old pearls. White is for the young and the brave.', replies: [
        { a: 'craft', t: 'Silk takes ivory beautifully - a true white can look blue under the church windows.' },
        { a: 'witty', t: 'White for the young and brave - and the ones who never spill the wine.' },
        { a: 'warm', t: 'That is a lovely way of putting it.' },
      ] },
    ],
    gossip: [
      { id: 'pennington-altar', text: 'Mrs Pennington can tell how long a marriage will last by what the bride puts on the altar. Sweet peas, she says, are a good sign. Orchids she keeps to herself.' },
      { id: 'pennington-moths', text: 'Dorothy Pennington married in 1916 in a borrowed coat. Her own dress, ivory silk, was eaten by moths in the attic while her husband was at the front.' },
      { id: 'pennington-lourdes', text: 'Mrs Pennington and Mrs Santos run the weddings at St Anne\'s between them - the flowers and the choir. "Lourdes loves a good joke," says Mrs Pennington, "which is more than I can say for the Lord\'s house."', hint: { who: 'santos', likes: 'witty' } },
    ],
    react: {
      liked: ['She beams and hands you a peony. "Hold that, dear."', '"Oh, yes. Yes, that is it exactly."'],
      neutral: ['"Hm." She snips a stem.', 'She nods and turns a vase a little to the left.'],
      disliked: ['"We do not joke in the Lord\'s house, dear."', 'Her lips go thin. She snips a stem rather hard.'],
    },
    bye: 'Off you go, then. Mind the step - it is older than I am.',
    requests: [
      { kind: 'church', client: 'Miss Rose Pennington', occasion: "her wedding at St Anne's", look: 1, body: 'classic', wants: ['Romantic', 'Elegant', 'Formal'], avoid: ['Risqué'],
        line: 'I have decided. You shall make Rose\'s wedding gown. Ivory, dear, not white - and something of lace, for me.' },
      { kind: 'church', client: 'Miss Clara Finch', occasion: "her wedding to the curate at St Anne's", look: 0, body: 'pear', wants: ['Romantic', 'Flowers', 'Elegant'], avoid: ['Gothic'],
        line: 'Would you make Clara\'s gown? The church will pay - I have seen to it. She should have a mother\'s fuss, and she shall have ours.' },
    ],
  },
  {
    id: 'santos', name: 'Mrs Lourdes Santos', role: "choir mistress at St Anne's, and a nurse at the cottage hospital", place: 'square', look: 30,
    likes: ['witty', 'curious'], dislikes: 'flatter',
    hello: 'Ay, the dressmaker! Come in, come in - we are rehearsing, but they are flat anyway. Sit. Tell me something funny, I need it.',
    topics: [
      { say: 'Twelve years in England. I still cannot get used to the rain. In Manila it rains like it means it - then it stops!', replies: [
        { a: 'witty', t: 'Here it rains like it is apologising, and never stops.' },
        { a: 'curious', t: 'What do you miss most about Manila?' },
        { a: 'flatter', t: 'You bring the sunshine with you, Mrs Santos.' },
      ] },
      { say: 'My daughter Joy is marrying Mama Folake\'s son, Tunde. A Filipino-Nigerian wedding! The food alone - we will need a second church hall.', g: 0, replies: [
        { a: 'curious', t: 'How did they meet?' },
        { a: 'witty', t: 'Adobo and jollof on one table - the guests will never leave.' },
        { a: 'boast', t: 'Then you need the finest dressmaker in town. Here I am.' },
      ] },
      { say: 'Joy wants a Filipiniana - a terno, with the butterfly sleeves, like her lola wore. In England nobody knows how to make them stand up.', g: 1, replies: [
        { a: 'curious', t: 'What makes the sleeves stand like that?' },
        { a: 'flatter', t: 'Anything would look beautiful on your daughter.' },
        { a: 'witty', t: 'Sleeves that stand up on their own - more than I can say for the tenors.' },
      ] },
    ],
    gossip: [
      { id: 'santos-joy', text: 'Joy Santos and Tunde Adebayo met at the cottage hospital, where she was the nurse on duty and he had broken his ankle at the church football match.' },
      { id: 'santos-terno', text: 'A terno\'s butterfly sleeves are stiffened with starch or pina fibre so they stand up from the shoulder. Mrs Santos says her grandmother\'s could stand up by themselves on the table.' },
      { id: 'santos-tran', text: 'Mrs Santos says Mrs Tran at the Lotus Wedding House is "the only woman in town who runs a wedding tighter than I run a choir" - she respects anyone who knows her trade and says so out loud.', hint: { who: 'tran', likes: 'boast' } },
    ],
    react: {
      liked: ['She laughs, a big warm laugh. "Ay, I like you!"', '"Yes! Exactly!" She claps her hands.'],
      neutral: ['"Mm." She hums a note to the choir.', 'She nods, tapping the hymn book.'],
      disliked: ['"Ay, stop. You want something."', 'She narrows her eyes. "Flattery is for bishops."'],
    },
    bye: 'Okay, okay, the altos are fighting again. Come on Sunday - there is pancit after mass.',
    requests: [
      { kind: 'church', client: 'Miss Joy Santos', occasion: "her wedding mass at St Anne's", look: 11, body: 'slender', wants: ['Formal', 'Elegant', 'Romantic'], avoid: ['Risqué'], garment: { slot: 'sleeve', id: 'terno' },
        line: 'You! You make Joy\'s terno. The sleeves must stand up like wings, and it must survive two choirs and a Yoruba dance.' },
      { kind: 'wedding', client: 'Mrs Lourdes Santos', occasion: 'her daughter\'s wedding, as mother of the bride', look: 30, body: 'curvy', wants: ['Formal', 'Elegant', 'Shimmering'], avoid: ['Risqué'],
        line: 'And me! The mother of the bride cannot stand next to Folake in something old. She will never let me forget it.' },
    ],
  },
  {
    id: 'tran', name: 'Mrs Tran Thi Mai', role: 'owner of the Lotus Wedding House, Lantern Street', place: 'lantern', look: 31, minStanding: 3,
    likes: ['craft', 'boast'], dislikes: 'witty',
    hello: 'You are the dressmaker from Thimble Lane. I have heard. I have eleven weddings this season and no time. Speak.',
    topics: [
      { say: 'Vietnamese, Korean, Chinese, Malay, Sikh, Thai. Every bride wants something different, and every mother wants something else.', g: 0, replies: [
        { a: 'craft', t: 'And every one means a different cut - an ao dai is fitted to the millimetre, a hanbok is all volume.' },
        { a: 'witty', t: 'And every groom wants to know where the food is.' },
        { a: 'curious', t: 'How did you come to run a wedding house?' },
      ] },
      { say: 'For my niece\'s engagement - the dam hoi - she wants an ao dai in red and gold. Every tailor in England makes it too loose.', g: 1, replies: [
        { a: 'boast', t: 'Mine will fit like it was poured on. I do not do loose.' },
        { a: 'craft', t: 'The ao dai is darted high under the bust, and the panels must split exactly at the waist.' },
        { a: 'curious', t: 'What happens at a dam hoi?' },
      ] },
      { say: 'A wedding is a performance. The bride is the star. If the costume is wrong, the show is wrong.', replies: [
        { a: 'boast', t: 'Then I will make sure the star shines. That is what I do.' },
        { a: 'witty', t: 'And the groom is the understudy who forgot his lines.' },
        { a: 'craft', t: 'Then the dress must work from twenty feet away and from two inches - both.' },
      ] },
    ],
    gossip: [
      { id: 'tran-hall', text: 'Mrs Tran came from Hue with nothing but her mother\'s sewing box. She built the Lotus Wedding House out of a tea room, one wedding at a time.' },
      { id: 'tran-damhoi', text: 'At a Vietnamese engagement, the dam hoi, the groom\'s family comes down the street in procession with red lacquered boxes of gifts - betel, tea, cakes - and the bride wears an ao dai in red.' },
      { id: 'tran-kaur', text: 'Mrs Tran and Auntie Harpreet share the Lotus Wedding House and argue about everything. "She wants compliments and questions," says Mrs Tran. "I have time for neither."', hint: { who: 'kaur', likes: 'flatter' } },
    ],
    react: {
      liked: ['"Good." She writes something in her ledger.', 'A brisk nod. "You know your work."'],
      neutral: ['"Hm." She checks her watch.', 'She turns a page in the ledger.'],
      disliked: ['"I do not have time for jokes."', 'She looks at you like a stain on a tablecloth.'],
    },
    bye: 'I have a Korean mother-in-law in the next room. Good day.',
    requests: [
      { kind: 'asianwedding', client: 'Miss Tran Ngoc Anh', occasion: 'her engagement ceremony, the dam hoi', look: 34, body: 'slender', wants: ['Elegant', 'Formal', 'Romantic'], avoid: ['Risqué'], garment: { slot: 'skirt', id: 'aodai' },
        line: 'Very well. You make Ngoc Anh\'s ao dai for the dam hoi. Fitted. Not loose. If it is loose, I will know.' },
      { kind: 'asianwedding', client: 'Miss Choi Min-ji', occasion: 'her pyebaek, the Korean family ceremony', look: 34, body: 'classic', wants: ['Romantic', 'Elegant', 'Formal'], avoid: ['Casual'], garment: { slot: 'skirt', id: 'chima' },
        line: 'The Choi family. The pyebaek. The chima must be wide enough to catch every chestnut. You will do it.' },
      { kind: 'asianwedding', client: 'Miss Lim Pei Shan', occasion: 'her Peranakan wedding', look: 12, body: 'curvy', wants: ['Elaborate', 'Patterned', 'Formal'], avoid: ['Casual'], garment: { slot: 'bodice', id: 'kebaya' },
        line: 'A Nyonya bride. Kebaya, and every stitch shows. I am trusting you with a very old family. Do not make me regret it.' },
    ],
  },
  {
    id: 'kaur', name: 'Auntie Harpreet Kaur Gill', role: 'matchmaker and wedding planner, the Lotus Wedding House', place: 'lantern', look: 32,
    likes: ['flatter', 'curious'], dislikes: 'boast',
    hello: 'Come, come, sit, beta! You are not married? Never mind, never mind. Tea? You will have tea.',
    topics: [
      { say: 'Thirty-one couples I have matched. Thirty-one! And only one divorce, and that was the man\'s fault.', g: 0, replies: [
        { a: 'flatter', t: 'Thirty-one! You must have the best eye for people in England.' },
        { a: 'curious', t: 'How do you know when two people are right?' },
        { a: 'boast', t: 'I can match a dress to a bride in a minute. Probably quicker than you.' },
      ] },
      { say: 'My niece Simran marries next month. The Anand Karaj at the gurdwara - four rounds of the Guru Granth Sahib, and the whole family in tears.', g: 1, replies: [
        { a: 'curious', t: 'What happens in the four rounds?' },
        { a: 'flatter', t: 'With you planning it, it will be the wedding of the year.' },
        { a: 'craft', t: 'She kneels and walks in it - the lehenga needs room, and something light underneath.' },
      ] },
      { say: 'Red for the bride, always red. Pink if she is modern. Gold everywhere. My sister-in-law wants cream. Cream! Like a cake!', replies: [
        { a: 'flatter', t: 'You are right, of course. Your eye for colour is famous.' },
        { a: 'boast', t: 'Cream or red, my dress would win the argument for you.' },
        { a: 'curious', t: 'Why red for a bride?' },
      ] },
    ],
    gossip: [
      { id: 'kaur-match', text: 'Auntie Harpreet matched the tram conductor with the schoolmistress because she noticed they both read Dickens on the 8.15. They have been married eleven years.' },
      { id: 'kaur-laavan', text: 'At a Sikh wedding the couple walk four times around the holy book while the laavan hymns are sung - one round for each stage of married life.' },
      { id: 'kaur-devika', text: 'Auntie Harpreet says Rani Devika of the Crescent "asks questions like a schoolteacher and hates to be buttered" - which is why they get on.', hint: { who: 'devika', dislikes: 'flatter' } },
    ],
    react: {
      liked: ['She pinches your cheek. "Such a good girl."', '"Hai, see! You understand!"'],
      neutral: ['"Achha." She pours more tea.', 'She adjusts her dupatta and considers you.'],
      disliked: ['"Showing off, showing off. Nobody likes a show-off, beta."', 'She clicks her tongue. "Hmph."'],
    },
    bye: 'Go, go - and if you meet a nice doctor, send him to me.',
    requests: [
      { kind: 'asianwedding', client: 'Miss Simran Kaur Gill', occasion: 'her Anand Karaj at the gurdwara', look: 9, body: 'curvy', wants: ['Elaborate', 'Romantic', 'Formal'], avoid: ['Risqué'], garment: { slot: 'skirt', id: 'lehenga' },
        line: 'You will make Simran\'s lehenga. Red, and gold, and heavy - but she must walk four rounds in it without a stumble.' },
      { kind: 'asianwedding', client: 'Cik Nur Aina', occasion: 'her bersanding - a Malay wedding', look: 33, body: 'classic', wants: ['Elaborate', 'Shimmering', 'Formal'], avoid: ['Risqué'], garment: { slot: 'bodice', id: 'kebaya' },
        line: 'A Malay family came to me, and I sent them to you. A kebaya for the bersanding - she sits on the dais like a queen, so it must look like one.' },
    ],
  },
];

export const SECOND_VISITS = {
  nowak: {
    again: 'Ah, my dressmaker! Sit. Today is plum cake - I saved you the corner.',
    gossip: [
      { id: 'nowak-casimir', text: 'St Casimir\'s has the better bells, but St Anne\'s has Mrs Pennington, who has done the flowers at every wedding in Thimblebury for thirty years. Crack a joke in her church and she will show you the door.', hint: { who: 'pennington', dislikes: 'witty' } },
      { id: 'nowak-wianki', text: 'On Midsummer night the Polish girls float wreaths of flowers on the harbour - wianki - and the boys row out to catch them. Mrs Nowak says she caught her husband that way. He said she caught him.' },
    ],
    chats: [[
      { say: 'The wedding was beautiful. Zofia cried, Declan cried, the priest cried. Only the Irish grandmother stayed dry - she had the whisky.', replies: [
        { a: 'warm', t: 'Everyone crying at a wedding - that is how you know it was a good one.' },
        { a: 'boast', t: 'They cried because the dress was so perfect, I expect.' },
        { a: 'witty', t: 'The grandmother had the right idea.' },
      ] },
      { say: 'Now the flower lady from St Anne\'s comes in for rolls every Friday and asks who made Zofia\'s dress. I tell her: my girl on Thimble Lane.', g: 'nowak-casimir', replies: [
        { a: 'curious', t: 'Who is the flower lady?' },
        { a: 'warm', t: 'Thank you for sending people my way. It means a great deal.' },
        { a: 'boast', t: 'Of course she asks. Everyone does now.' },
      ] },
      { say: 'Midsummer is coming. When I was a girl in Krakow we put wreaths on the river. Here I put them on the harbour. Silly old woman.', g: 'nowak-wianki', replies: [
        { a: 'curious', t: 'Why wreaths on the water?' },
        { a: 'warm', t: 'Not silly at all. You carry home with you.' },
        { a: 'witty', t: 'Does the harbour give them back?' },
      ] },
    ]],
    requests: [
      { kind: 'festival', client: 'Hania Nowak', occasion: "her first communion at St Casimir's", look: 0, body: 'slender', wants: ['Elegant', 'Cute', 'Romantic'], avoid: ['Risqué'],
        line: 'And Hania - Zofia\'s little sister - her first communion is in May. White, with a little veil. You make it, I pay, she stops asking me every day.' },
    ],
  },
  crane: {
    again: 'You again! Good - I have a column to fill, and you are, officially, news.',
    gossip: [
      { id: 'crane-lotus', text: 'The Herald\'s advertising page says the Lotus Wedding House on Lantern Street has booked eleven weddings this season: Vietnamese, Korean, Chinese, Malay, and a Sikh wedding of four hundred. Mrs Tran, who runs it, respects confidence - and has no patience for a joker.', hint: { who: 'tran', dislikes: 'witty' } },
      { id: 'crane-aurora2', text: 'Aurora Crane\'s debut was a triumph. She spent the second half of the ball on the Assembly Rooms roof with a telescope and the Rani\'s nephew.' },
    ],
    chats: [[
      { say: 'Aurora\'s debut made page six, page seven and, regrettably, the letters page. A reader objected to her dancing.', g: 'crane-aurora2', replies: [
        { a: 'witty', t: 'Objected to the dancing, or to not being asked?' },
        { a: 'craft', t: 'The skirt had four petticoats, you know - it needed room to move.' },
        { a: 'curious', t: 'What happened after the ball?' },
      ] },
      { say: 'The whole town has gone wedding-mad. Two churches, a gurdwara, a Lotus Wedding House - I have run out of words for "white".', g: 'crane-lotus', replies: [
        { a: 'curious', t: 'A Lotus Wedding House?' },
        { a: 'boast', t: 'Then let me give you some new ones. I dress half those brides.' },
        { a: 'witty', t: 'Try "ivory", "champagne" and "I told you so".' },
      ] },
      { say: 'My editor wants a feature: "The Needle Behind Thimblebury". I said you were far too modest. Prove me wrong.', replies: [
        { a: 'boast', t: 'Modest? Put me on the front page.' },
        { a: 'witty', t: 'I am terribly modest. Print that in very large letters.' },
        { a: 'warm', t: 'That is kind of you, Mr Crane. I would be honoured.' },
      ] },
    ]],
  },
  pillai: {
    again: 'You came back. Good. I have something new from Madras - feel this one, and tell me.',
    gossip: [
      { id: 'pillai-meera', text: 'Mrs Pillai\'s daughter Meera is to marry a doctor from Kochi, at the Lotus Wedding House, in a kasavu saree with a gold border as wide as your hand.' },
      { id: 'pillai-mai', text: 'Mrs Tran of the Lotus Wedding House buys Mrs Pillai\'s silk for her ao dai. "She haggles like a fishwife," says Mrs Pillai, "and she knows cloth like a weaver. So she gets a good price."', hint: { who: 'tran', likes: 'craft' } },
    ],
    chats: [[
      { say: 'Feel. That is Mysore silk, pure, no zari. The Rani\'s family weavers made it. It shines by itself.', replies: [
        { a: 'craft', t: 'It glows like skin - that is the twist of the thread, not a finish.' },
        { a: 'flatter', t: 'Only you could find something so fine.' },
        { a: 'curious', t: 'How long does a length like this take to weave?' },
      ] },
      { say: 'My daughter Meera is getting married. A doctor! From Kochi! I have waited twenty-six years to say that.', g: 'pillai-meera', replies: [
        { a: 'curious', t: 'Tell me about the wedding.' },
        { a: 'witty', t: 'Twenty-six years of waiting, and you say it like a bargain.' },
        { a: 'flatter', t: 'She must be as beautiful as you.' },
      ] },
      { say: 'The wedding is at the Lotus Wedding House. Mrs Tran runs it. She knows her silk, that one - she buys from me.', g: 'pillai-mai', replies: [
        { a: 'curious', t: 'What is she like, Mrs Tran?' },
        { a: 'craft', t: 'An ao dai in your silk would be something - it wants a heavy silk that still falls straight.' },
        { a: 'boast', t: 'I will make sure the dress outshines the hall.' },
      ] },
    ]],
    requests: [
      { kind: 'asianwedding', client: 'Miss Meera Pillai', occasion: 'her Kerala wedding at the Lotus Wedding House', look: 13, body: 'classic', wants: ['Elegant', 'Shimmering', 'Formal'], avoid: ['Gothic'], garment: { slot: 'skirt', id: 'saree' },
        line: 'Meera\'s wedding saree. Ivory and gold, kasavu, and a blouse that fits. I trust nobody else with the pleats.' },
    ],
  },
  folake: {
    again: 'My dressmaker! Sit, sit. Today it is pepper soup, and you will not argue.',
    gossip: [
      { id: 'folake-tunde', text: 'Mama Folake\'s son Tunde is marrying Joy Santos, a nurse from Manila, at St Anne\'s. The two mothers are arranging it together, and neither has yet won an argument.' },
      { id: 'folake-santos', text: 'Mrs Santos, the choir mistress at St Anne\'s, loves a laugh and a question about home. Butter her up, Mama Folake says, and she knows at once you are after something.', hint: { who: 'santos', dislikes: 'flatter' } },
    ],
    chats: [[
      { say: 'Mrs Okafor saw my thanksgiving dress. She said nothing for a whole hymn. A WHOLE HYMN. I have never been so happy.', replies: [
        { a: 'witty', t: 'Silence from Mrs Okafor - that is a standing ovation.' },
        { a: 'warm', t: 'You earned that hymn, Mama.' },
        { a: 'boast', t: 'I told you my dresses win arguments.' },
      ] },
      { say: 'My Tunde is getting married! To Joy, a nurse, from Manila. At St Anne\'s, with a Filipino choir AND a Yoruba choir. God help the organist.', g: 'folake-tunde', replies: [
        { a: 'curious', t: 'How did they meet?' },
        { a: 'witty', t: 'Two choirs - the organist will need a lie-down and a pay rise.' },
        { a: 'warm', t: 'Oh, Mama. Congratulations. You must be so proud.' },
      ] },
      { say: 'Joy\'s mother, Lourdes, sings like an angel and argues like a lawyer. We are planning it together. I am enjoying myself very much.', g: 'folake-santos', replies: [
        { a: 'curious', t: 'What do you argue about?' },
        { a: 'warm', t: 'It sounds like you two will be friends for life.' },
        { a: 'boast', t: 'Let me make both mothers\' dresses and there will be nothing left to argue about.' },
      ] },
    ]],
    requests: [
      { kind: 'wedding', client: 'Mama Folake Adebayo', occasion: "her son's wedding at St Anne's, as mother of the groom", look: 17, body: 'full', wants: ['Elegant', 'Patterned', 'Formal'], avoid: ['Risqué'],
        line: 'Mother of the groom! You make my dress, and my gele will match, and Lourdes will say nothing for a whole hymn too.' },
    ],
  },
  chen: {
    again: 'Welcome back. Sit - today is Tieguanyin. Smell it first.',
    gossip: [
      { id: 'chen-kwa', text: 'At a Cantonese wedding the bride may wear a qun kwa - a red jacket and skirt worked in gold with a phoenix and a dragon. Mrs Chen\'s own took her mother two years to embroider.' },
      { id: 'chen-newyear', text: 'At Lunar New Year Mrs Chen closes the Jade Kettle to paying customers for one day, and the whole of Lantern Street eats dumplings at her tables for nothing.' },
    ],
    chats: [[
      { say: 'Jia\'s wedding is close now. Her grandmother has started sewing again - her hands shake, but she insists.', g: 'chen-kwa', replies: [
        { a: 'curious', t: 'What is she sewing?' },
        { a: 'craft', t: 'A shaking hand can still make a good running stitch - it is the tension that matters.' },
        { a: 'witty', t: 'Grandmothers and deadlines - a dangerous combination.' },
      ] },
      { say: 'New Year is coming. I close the tea house for one day, and everyone eats here. My feet will hurt for a week.', g: 'chen-newyear', replies: [
        { a: 'curious', t: 'Why do you open your doors like that?' },
        { a: 'witty', t: 'Free dumplings? I will bring a very large bag.' },
        { a: 'warm', t: 'That is a generous thing to do.' },
      ] },
      { say: 'Every New Year I wear the same old qipao. It is too tight now. Do not tell anyone.', replies: [
        { a: 'craft', t: 'A qipao can be let out at the side seams - or we cut a new one with room to breathe.' },
        { a: 'witty', t: 'Your secret dies with me. And with the dumplings.' },
        { a: 'curious', t: 'Who made the old one?' },
      ] },
    ]],
    requests: [
      { kind: 'festival', client: 'Mrs Chen Mei-Lin', occasion: 'Lunar New Year at the Jade Kettle', look: 16, body: 'classic', wants: ['Elegant', 'Patterned', 'Shimmering'], avoid: ['Gothic'], garment: { slot: 'bodice', id: 'qipao' },
        line: 'Then make me a new qipao for New Year. Red, or gold - with room for dumplings. Please.' },
    ],
  },
  nok: {
    again: 'You came back! You want curry? Of course you want curry.',
    gossip: [
      { id: 'nok-fah', text: 'Khun Nok\'s niece Fah is marrying an English sailor. In the morning the elders will pour blessed water over the couple\'s hands from a conch shell, and Fah will wear a silk sabai.' },
      { id: 'nok-tran', text: 'Khun Nok says Mrs Tran at the Lotus Wedding House is the most organised woman in England, "and she cannot take a joke - I tried, she looked at me like a bad fish."', hint: { who: 'tran', dislikes: 'witty' } },
    ],
    chats: [[
      { say: 'Songkran was the best! I got the vicar AGAIN. He brought an umbrella. I brought a bucket.', replies: [
        { a: 'witty', t: 'An umbrella against a bucket - the vicar never stood a chance.' },
        { a: 'flatter', t: 'Nobody throws water like you, Khun Nok.' },
        { a: 'craft', t: 'Silk water-spots, you know - you have to press them out while damp.' },
      ] },
      { say: 'My niece Fah is getting married! To an Englishman! A sailor. He eats my curry with milk. I am trying to love him.', g: 'nok-fah', replies: [
        { a: 'curious', t: 'What will the wedding be like?' },
        { a: 'witty', t: 'With milk! That is grounds for an annulment.' },
        { a: 'flatter', t: 'He is lucky to marry into your family - and your kitchen.' },
      ] },
      { say: 'The wedding house on this street, the Lotus, will do the wedding. Mrs Tran runs it. Very serious lady. Very serious.', g: 'nok-tran', replies: [
        { a: 'curious', t: 'What is she like?' },
        { a: 'witty', t: 'Serious? Then she has never had your green curry.' },
        { a: 'flatter', t: 'Next to you, I think everyone looks serious.' },
      ] },
    ]],
    requests: [
      { kind: 'asianwedding', client: 'Khun Fah Wongsakul', occasion: 'her Thai wedding and the water blessing', look: 11, body: 'slender', wants: ['Elegant', 'Formal', 'Shimmering'], avoid: ['Casual'], garment: { slot: 'bodice', id: 'sabai' },
        line: 'You make Fah\'s wedding dress! A sabai, Thai silk, shining - so the sailor\'s family knows what a Thai bride looks like.' },
    ],
  },
  ortega: {
    again: 'You. The dressmaker whose ruffles do not fall off. Sit, I have ten minutes.',
    gossip: [
      { id: 'ortega-feria', text: 'Marisol Ortega was born in Triana, the potters\' quarter of Seville, and learned to dance at her grandmother\'s feria stall before she could read.' },
      { id: 'ortega-santos', text: 'Marisol now sings with the choir at St Anne\'s on Sundays - Mrs Santos heard her hum in the market. "She makes me laugh and she asks about Seville," Marisol says. "Nobody asks about Seville."', hint: { who: 'santos', likes: 'curious' } },
    ],
    chats: [[
      { say: 'The solo worked. Three encores. The piano player still cannot count, but the audience could.', replies: [
        { a: 'boast', t: 'Three encores? My next dress will make it four.' },
        { a: 'witty', t: 'Maybe the piano player counts in encores.' },
        { a: 'warm', t: 'I am so glad it went well - you deserved it.' },
      ] },
      { say: 'In Seville I danced at the feria in a traje de gitana - spots, ruffles, a flower in the hair. Here nobody even knows what a feria is.', g: 'ortega-feria', replies: [
        { a: 'curious', t: 'Where in Seville are you from?' },
        { a: 'boast', t: 'Describe it, and I will make you one they would talk about in Seville.' },
        { a: 'warm', t: 'It must be hard, being so far from all that.' },
      ] },
      { say: 'On Sundays I sing at St Anne\'s now. Do not laugh. Mrs Santos heard me humming in the market and that was that.', g: 'ortega-santos', replies: [
        { a: 'witty', t: 'Flamenco on Saturday, hymns on Sunday - you have every night covered.' },
        { a: 'curious', t: 'How did she talk you into it?' },
        { a: 'warm', t: 'That is lovely. Singing must be good for the soul.' },
      ] },
    ]],
  },
  rosen: {
    again: 'Back again. Good. Come, I have a tin of old horn buttons you will want to see.',
    gossip: [
      { id: 'rosen-hannah2', text: 'Hannah Rosen read her Torah portion without one mistake. Her grandfather told everyone at the kiddush that the dress steadied her. It was the year of practice.' },
      { id: 'rosen-pennington', text: 'Mr Rosen has sold Mrs Pennington of St Anne\'s her lace for thirty years. "She will talk about lace until the shop shuts," he says, "and I let her."', hint: { who: 'pennington', likes: 'craft' } },
    ],
    chats: [[
      { say: 'Horn buttons, from before the war. Nobody makes these any more. Everything is plastic now. Plastic!', replies: [
        { a: 'craft', t: 'Horn takes a polish plastic never will - and it does not melt under the iron.' },
        { a: 'witty', t: 'Plastic buttons will outlast us all - and they will deserve to.' },
        { a: 'flatter', t: 'Only a man of your taste would keep these.' },
      ] },
      { say: 'Hannah did it. Every word. Her grandmother would have kvelled.', g: 'rosen-hannah2', replies: [
        { a: 'curious', t: 'How was she on the day?' },
        { a: 'witty', t: 'And her grandfather is kvelling for two, I see.' },
        { a: 'flatter', t: 'She takes after you, Mr Rosen.' },
      ] },
      { say: 'Mrs Pennington from St Anne\'s buys her lace from me. Thirty years. Now she asks about you. What have you been doing?', g: 'rosen-pennington', replies: [
        { a: 'curious', t: 'What does she want to know?' },
        { a: 'craft', t: 'Lace for wedding veils, I expect - Chantilly for softness, Alencon if she wants a corded edge.' },
        { a: 'witty', t: 'Buttonholes, mostly. It is a glamorous life.' },
      ] },
    ]],
  },
  briggs: {
    again: 'Oh, it\'s you, love. Molly still talks about that dress. Sit on the crate, it\'s clean. Mostly.',
    gossip: [
      { id: 'briggs-molly2', text: 'Molly Briggs has worn her prize-giving dress to chapel, to the fair and to her cousin\'s christening. Nell says it has earned its keep and then some.' },
      { id: 'briggs-lanterns', text: 'On the last night of summer the harbour families float paper lanterns for the ones the sea took. Nell lights one for Jack every year.' },
    ],
    chats: [[
      { say: 'Molly\'s worn that dress to everything since. Chapel, the fair, her cousin\'s christening. She keeps it on the chair where she can see it.', g: 'briggs-molly2', replies: [
        { a: 'curious', t: 'Where did she wear it first?' },
        { a: 'warm', t: 'That is the best thing anyone has ever said about my work.' },
        { a: 'boast', t: 'Well, it is one of my better ones.' },
      ] },
      { say: 'End of summer, we float lanterns for the ones the sea kept. I do one for Jack.', g: 'briggs-lanterns', replies: [
        { a: 'warm', t: 'Could I come and float one with you this year?' },
        { a: 'curious', t: 'When did the lanterns start?' },
        { a: 'boast', t: 'I could make you a lantern shade in silk - far better than paper.' },
      ] },
      { say: 'My back\'s not what it was. Molly says I should sit down more. I say the herring won\'t sell itself.', replies: [
        { a: 'warm', t: 'Molly is right, you know. Let someone look after you for once.' },
        { a: 'curious', t: 'Could Molly mind the stall on Saturdays?' },
        { a: 'witty', t: 'The herring could try. It has the face for it.' },
      ] },
    ]],
  },
  haddad: {
    again: 'You came to see me again? Wait, I dry my hands. There. Now.',
    gossip: [
      { id: 'haddad-post', text: 'Samira Haddad got the post at the bank. The manager now asks her to read every letter twice, "because she is the only one who understands them".' },
      { id: 'haddad-tatreez', text: 'Samira teaches tatreez - cross-stitch in the old patterns - to the harbour girls on Wednesday nights, after Mr Rosen\'s Sunday sewing class gave her the idea.' },
    ],
    chats: [[
      { say: 'I have news. The bank - they gave me the post. I start on Monday. I will wear the suit you made.', g: 'haddad-post', replies: [
        { a: 'warm', t: 'Samira! I am so happy for you.' },
        { a: 'curious', t: 'What will you do first?' },
        { a: 'flatter', t: 'They are lucky to have someone so brilliant.' },
      ] },
      { say: 'On Wednesday nights I teach the girls tatreez. The old patterns - cypress trees, the moon, the eight-pointed star.', g: 'haddad-tatreez', replies: [
        { a: 'craft', t: 'The eight-pointed star - is that worked in cross-stitch over two threads?' },
        { a: 'curious', t: 'Who taught you?' },
        { a: 'flatter', t: 'They are so lucky to have such a talented teacher.' },
      ] },
      { say: 'In Aleppo, before, I embroidered wedding dresses. Red and black, silk on linen. One took a whole winter.', replies: [
        { a: 'craft', t: 'A whole winter - the chest panel alone must have been thousands of stitches.' },
        { a: 'warm', t: 'Perhaps one day you will make one again - here.' },
        { a: 'flatter', t: 'Your work must have been the finest in Aleppo.' },
      ] },
    ]],
  },
  alfie: {
    again: 'Oi oi! Back for more, are you? Gossip costs a laugh. Same as before.',
    gossip: [
      { id: 'alfie-night', text: 'Alfie lights the lamps at dusk, from the harbour up to the Crescent. At night, he says, the Blue Lantern\'s sign is the brightest thing in town - brighter than the moon, if the moon is having a bad week.' },
      { id: 'alfie-kaur', text: 'Auntie Harpreet at the Lotus Wedding House has matched thirty-one couples. "Brag at her," says Alfie, "and she\'ll match you with the fishmonger."', hint: { who: 'kaur', dislikes: 'boast' } },
      { id: 'alfie-church', text: 'Mrs Pennington, the verger at St Anne\'s, once chased Alfie round the churchyard with a flower basket for whistling in the vestry. "Be nice to her, though," he says, "and she\'ll feed you cake."', hint: { who: 'pennington', likes: 'warm' } },
    ],
    chats: [[
      { say: 'Know what I see at night, lighting up? Everyone going where they shouldn\'t. Best time of day, night.', g: 'alfie-night', replies: [
        { a: 'curious', t: 'Go on - who goes where they shouldn\'t?' },
        { a: 'witty', t: 'And you, going everywhere with a lit stick. Very discreet.' },
        { a: 'warm', t: 'Are you not scared, out on your own in the dark?' },
      ] },
      { say: 'There\'s a lady at the wedding house - Auntie Harpreet - who marries people off. Thirty-one couples. Says she\'s got her eye on me. I\'m eleven!', g: 'alfie-kaur', replies: [
        { a: 'witty', t: 'Eleven? She plans ahead.' },
        { a: 'boast', t: 'Tell her I\'ll make the wedding suit. Top hat and all.' },
        { a: 'curious', t: 'How does she pick them?' },
      ] },
      { say: 'Verger at St Anne\'s chased me with a basket once. For whistling. In a church! Where else do you whistle?', g: 'alfie-church', replies: [
        { a: 'witty', t: 'Outside a church, Alfie. That is sort of the point.' },
        { a: 'boast', t: 'I would have outrun her.' },
        { a: 'curious', t: 'What was in the basket?' },
      ] },
    ]],
  },
  wick: {
    again: 'Ah. The one who does not use glue. Come in, and mind the swan - it is a hat.',
    gossip: [
      { id: 'wick-traviata', text: 'The Opera\'s next season opens with La Traviata. Mr Wick has already rejected four fabrics for Violetta\'s party gown: "Too pink. Too sad. Too French. Too cheap."' },
      { id: 'wick-dupre2', text: 'Madame Dupre\'s dressing room holds a portrait of herself, a portrait of her dog, and nothing else. "Tell her she is extraordinary," says Mr Wick, "and that the dog is too."', hint: { who: 'dupre', likes: 'flatter' } },
    ],
    chats: [[
      { say: 'Next season: La Traviata. Violetta\'s party gown, Act One. She is dying, and must look as if she has never been better.', g: 'wick-traviata', replies: [
        { a: 'craft', t: 'Silk taffeta for the rustle, and a bodice cut to let her breathe for the high notes.' },
        { a: 'curious', t: 'Which fabrics have you tried?' },
        { a: 'flatter', t: 'Only you could stage such a thing.' },
      ] },
      { say: 'A tenor split his breeches in Act Two last night. Twelve hundred people heard it. The orchestra did not stop.', replies: [
        { a: 'witty', t: 'The orchestra was probably laughing too hard to stop.' },
        { a: 'craft', t: 'Breeches need a gusset - a diamond of cloth at the fork, cut on the bias.' },
        { a: 'flatter', t: 'In your hands it probably sounded deliberate.' },
      ] },
      { say: 'Madame Dupre\'s dog has a costume now. For the curtain call. I made it. I am not proud.', g: 'wick-dupre2', replies: [
        { a: 'witty', t: 'Does it get a bigger bow than the tenor?' },
        { a: 'curious', t: 'What kind of costume?' },
        { a: 'craft', t: 'Stretch velvet, I hope - a dog will not stand still for a fitting.' },
      ] },
    ]],
    requests: [
      { kind: 'opera', client: 'Mr Ignatius Wick', occasion: "La Traviata - Violetta's party gown", look: 26, body: 'slender', wants: ['Glamour', 'Eveningwear', 'Romantic'], avoid: ['Casual'],
        line: 'Violetta. Act One. She is dying and the audience must not guess until Act Three. Make it lie beautifully.' },
    ],
  },
  dupre: {
    again: 'Ah. You again. You may sit. Not there - that is Bijou\'s chair.',
    gossip: [
      { id: 'dupre-bijou', text: 'Madame Dupre\'s little dog Bijou has his own chair, his own cushion and, since last week, his own costume for the curtain call.' },
    ],
    chats: [[
      { say: 'Bijou is performing with me now. Only the curtain call. He has a better sense of timing than the tenor.', g: 'dupre-bijou', replies: [
        { a: 'flatter', t: 'With you on the stage beside him, Bijou will be the second most magnificent creature there.' },
        { a: 'curious', t: 'How long have you had Bijou?' },
        { a: 'witty', t: 'The tenor must be devastated.' },
      ] },
      { say: 'The Merry Widow is to be my next role. Hanna Glawari - a rich widow in Paris who breaks every heart at the ball.', replies: [
        { a: 'boast', t: 'Then you need a gown that breaks hearts at fifty paces. I can make it.' },
        { a: 'flatter', t: 'You were born to play a woman who breaks every heart.' },
        { a: 'curious', t: 'Is it a comedy?' },
      ] },
      { say: 'Vienna has written, begging me to return. I have not answered. Let them wait.', replies: [
        { a: 'flatter', t: 'Let them wait. Thimblebury does not deserve you, but it has you.' },
        { a: 'boast', t: 'Vienna will have to queue behind my atelier.' },
        { a: 'curious', t: 'Will you go back?' },
      ] },
    ]],
    requests: [
      { kind: 'opera', client: 'Madame Solene Dupre', occasion: "The Merry Widow - Hanna's ball gown", look: 25, body: 'curvy', wants: ['Glamour', 'Shimmering', 'Elegant'], avoid: ['Simple'],
        line: 'You shall make Hanna\'s ball gown. When I walk into the embassy ball, every man on the stage must forget his line - and the conductor his tempo.' },
    ],
  },
  philippa: {
    again: 'You again. Good. Sit - Hobbes will bring tea. You may tell me what the town is saying.',
    gossip: [
      { id: 'philippa-ball', text: 'Every midsummer Ashcombe House throws its garden open for a ball, and every midsummer it rains. This year Lady Philippa has ordered a marquee the size of the Opera.' },
      { id: 'philippa-lilies', text: 'Lady Philippa has objected to the lilies at St Anne\'s every June for fifteen years. Every June, Mrs Pennington puts them up anyway.' },
    ],
    chats: [[
      { say: 'The court presentation went... tolerably. Her Majesty looked at me for a full second. Mother would have been satisfied.', replies: [
        { a: 'flatter', t: 'A full second! Most debutantes are given half.' },
        { a: 'warm', t: 'Your mother would have been proud of you. I am sure of it.' },
        { a: 'witty', t: 'A full second - practically a conversation.' },
      ] },
      { say: 'The Midsummer Ball at Ashcombe. It rains every year. Every. Year. I have ordered a marquee.', g: 'philippa-ball', replies: [
        { a: 'curious', t: 'How long has Ashcombe held the ball?' },
        { a: 'flatter', t: 'Rain would not dare fall on a ball of yours this year.' },
        { a: 'witty', t: 'Perhaps the rain simply wants an invitation.' },
      ] },
      { say: 'Mrs Pennington at St Anne\'s puts lilies on the altar for every wedding. Lilies are for funerals. I have said so for fifteen years.', g: 'philippa-lilies', replies: [
        { a: 'curious', t: 'What would you choose instead?' },
        { a: 'warm', t: 'You both clearly care a great deal about the church.' },
        { a: 'witty', t: 'Lilies for the groom, perhaps, and roses for the bride.' },
      ] },
    ]],
    requests: [
      { kind: 'noble', client: 'Lady Philippa Ashcombe', occasion: 'the Midsummer Ball at Ashcombe House', look: 23, body: 'slender', wants: ['Elegant', 'Romantic', 'Eveningwear'], avoid: ['Casual', 'Gothic'],
        line: 'You shall dress me for the Midsummer Ball. Something that looks well in candlelight - and in a marquee, should it come to that.' },
    ],
  },
  devika: {
    again: 'Come in, come in. I have had a letter from Mysore, and I want someone to tell it to.',
    gossip: [
      { id: 'devika-anika', text: 'Rani Devika\'s niece Anika is to marry into a Jaipur family. The wedding will last five days, and her lehenga will be so heavy with gold work that two cousins carry the dupatta.' },
      { id: 'devika-kaur', text: 'Rani Devika once asked Auntie Harpreet of the Lotus Wedding House to find her nephew a wife. Auntie asked her forty questions, then talked about herself for an hour. "She loves to be asked," says the Rani.', hint: { who: 'kaur', likes: 'curious' } },
    ],
    chats: [[
      { say: 'My niece Anika is marrying into a Jaipur family. Five days of wedding. My sister is already exhausted, and it is two months away.', g: 'devika-anika', replies: [
        { a: 'curious', t: 'What will she wear?' },
        { a: 'craft', t: 'A Jaipur bride - a lehenga, then, heavy with gota and zardozi work.' },
        { a: 'flatter', t: 'With an aunt like you, she will be the most elegant bride in India.' },
      ] },
      { say: 'My nephew asked me to find him a wife here. So I went to the matchmaker on Lantern Street. That was a mistake. A long, long mistake.', g: 'devika-kaur', replies: [
        { a: 'curious', t: 'What happened?' },
        { a: 'witty', t: 'A long mistake - and did she find him one?' },
        { a: 'flatter', t: 'Anyone would be lucky to marry into your family.' },
      ] },
      { say: 'The banquet went well. The Lord Mayor asked where I bought my "costume". I told him Thimble Lane.', replies: [
        { a: 'craft', t: 'The border held its line all night - that is the Mysore silk, it does not stretch.' },
        { a: 'curious', t: 'What did he say to that?' },
        { a: 'flatter', t: 'You made the saree look like a crown.' },
      ] },
    ]],
    requests: [
      { kind: 'asianwedding', client: 'Princess Anika Rao', occasion: 'her wedding in Jaipur - the lehenga for the pheras', look: 13, body: 'slender', wants: ['Elaborate', 'Glamour', 'Formal'], avoid: ['Casual'], garment: { slot: 'skirt', id: 'lehenga' },
        line: 'I would like you to make Anika\'s wedding lehenga. Jaipur will send its own tailors. I want them to see it and be quiet.' },
    ],
  },
};


Object.assign(SECOND_VISITS, {
  pennington: {
    again: 'Hello again, dear. Come and hold the ladder - the lilies are going up.',
    gossip: [
      { id: 'pennington-clara', text: 'Clara Finch plays the organ at St Anne\'s now that her father\'s hands are too stiff. She is to marry the young curate, who cannot sing a note.' },
      { id: 'pennington-ladder', text: 'Mrs Pennington still climbs the ladder to the altar flowers herself, at seventy-two. The vicar offered to hold it once; she told him to mind his sermons.' },
    ],
    chats: [[
      { say: 'Lady Philippa says lilies are for funerals. She has said so for fifteen years. The lilies are going up anyway.', g: 'pennington-ladder', replies: [
        { a: 'curious', t: 'Who puts them up - surely not you, on that ladder?' },
        { a: 'warm', t: 'I think you two secretly enjoy it by now.' },
        { a: 'witty', t: 'Put a lily in her pew and see what happens.' },
      ] },
      { say: 'Mr Rosen has sold me lace for thirty years. He never charges me full price, and he thinks I have not noticed.', replies: [
        { a: 'warm', t: 'That is a kind of love letter, is it not?' },
        { a: 'craft', t: 'His Chantilly is the best in the county - fine as a cobweb.' },
        { a: 'witty', t: 'Perhaps he thinks you have not noticed the extra biscuits either.' },
      ] },
      { say: 'A bride came in last week with no mother to help her. Clara Finch, the organist\'s girl. Her mother passed at Easter. She sat in the vestry and cried.', g: 'pennington-clara', replies: [
        { a: 'warm', t: 'Then she needs someone on her side. Can I help?' },
        { a: 'curious', t: 'Who is helping her now?' },
        { a: 'witty', t: 'Weddings make everyone cry - it is practically in the vows.' },
      ] },
    ]],
  },
  santos: {
    again: 'The dressmaker! Come, come. Today the sopranos are sharp and the tenors are asleep.',
    gossip: [
      { id: 'santos-cord', text: 'At a Filipino wedding the sponsors drape a veil over the couple\'s shoulders and loop a cord around them in a figure of eight, for a bond that cannot be broken.' },
    ],
    chats: [[
      { say: 'The two mothers - me and Folake - we agreed on everything except the food, the music, the guest list and the date.', replies: [
        { a: 'witty', t: 'So you agreed on the groom. That is a start.' },
        { a: 'curious', t: 'What did you settle on in the end?' },
        { a: 'flatter', t: 'With two such wonderful mothers, it can only be perfect.' },
      ] },
      { say: 'The wedding house on Lantern Street - Mrs Tran\'s - wanted to do the reception. She is terrifying. I liked her immediately.', g: 'santos-tran', replies: [
        { a: 'curious', t: 'Terrifying how?' },
        { a: 'witty', t: 'Terrifying and likeable - a rare combination. Like a good goose.' },
        { a: 'flatter', t: 'Nobody could be as organised as you.' },
      ] },
      { say: 'At a Filipino wedding they put a veil over the couple and a cord around them, like a figure eight. Tied together. No escape!', g: 'santos-cord', replies: [
        { a: 'curious', t: 'What does the cord mean?' },
        { a: 'witty', t: 'No escape - the most honest wedding vow I have ever heard.' },
        { a: 'flatter', t: 'What a beautiful tradition - you must have looked radiant at yours.' },
      ] },
    ]],
  },
  tran: {
    again: 'Back. Good. I have nine minutes. Use them well.',
    gossip: [
      { id: 'tran-pyebaek', text: 'At a Korean pyebaek the groom\'s parents toss dates and chestnuts for the bride to catch in her skirt - one for every child they hope for.' },
    ],
    chats: [[
      { say: 'A Korean family - the pyebaek is on Saturday. The bride bows to her husband\'s parents and they throw dates and chestnuts into her skirt. She must catch them.', g: 'tran-pyebaek', replies: [
        { a: 'craft', t: 'Then the chima must be full enough to catch them - tied high, wide, with deep pleats.' },
        { a: 'witty', t: 'Chestnuts at the bride - is that a blessing or a test?' },
        { a: 'curious', t: 'What do the dates and chestnuts mean?' },
      ] },
      { say: 'A Peranakan wedding next month. A Nyonya family, very old. The bride wears a kebaya with embroidery so fine you need a glass to see it.', replies: [
        { a: 'boast', t: 'Give me the glass - I will put stitches in it they need two for.' },
        { a: 'craft', t: 'Kebaya sulam - the embroidery cut away round the motifs, like lace. It takes weeks.' },
        { a: 'witty', t: 'A dress you need a telescope for - very modern.' },
      ] },
      { say: 'People think I am hard. I am not hard. I am on time. There is a difference.', replies: [
        { a: 'boast', t: 'Then we will get on. I have never missed a fitting.' },
        { a: 'witty', t: 'On time - the rarest thing at any wedding.' },
        { a: 'craft', t: 'A wedding dress is a deadline sewn in silk. I understand.' },
      ] },
    ]],
  },
  kaur: {
    again: 'Beta! You came back! Sit, sit, I have news - so much news.',
    gossip: [
      { id: 'kaur-bersanding', text: 'At a Malay wedding the bride and groom sit side by side on a dais, the pelamin - king and queen for a day - while the guests sprinkle them with scented water and yellow rice.' },
    ],
    chats: [[
      { say: 'A Malay family came to me. Their daughter\'s bersanding - she sits on a dais like a queen, and all the guests come to bless her. They want songket.', g: 'kaur-bersanding', replies: [
        { a: 'curious', t: 'Why does she sit on a dais?' },
        { a: 'flatter', t: 'Only you would be trusted with a royal day like that.' },
        { a: 'boast', t: 'Songket? I could weave it in my sleep.' },
      ] },
      { say: 'My husband says I talk too much. I told him, if I did not talk, who would know anything?', replies: [
        { a: 'flatter', t: 'The whole town would be lost without you, Auntie.' },
        { a: 'curious', t: 'What does he do all day, then?' },
        { a: 'boast', t: 'I talk more than you, and I sew while I do it.' },
      ] },
      { say: 'The Rani on the Crescent wants a wife for her nephew. I asked her forty questions. She answered every one. I like her very much.', replies: [
        { a: 'curious', t: 'What sort of wife is he looking for?' },
        { a: 'flatter', t: 'If anyone can find him a wife, it is you.' },
        { a: 'boast', t: 'Send him to me first - I will dress him to impress.' },
      ] },
    ]],
  },
});
