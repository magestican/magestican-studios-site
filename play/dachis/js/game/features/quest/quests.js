












import { nextLair } from '../world/lairs.js';
import { HOME } from '../world/regions.js';

const MAIN_STEPS = [
  { kind: 'visit', flag: 'starter', text: 'Run down the road to the priests — the X on your map' },
  { kind: 'visit', flag: 'initiated', text: 'Run to the Shrine Village — the X on your map' },
  { kind: 'talk', flag: 'kumabo', text: 'Return to Kazan Village and see Kumabo' },
  { kind: 'beat', lairs: true }, 
  { kind: 'befriend', last: true },
];

export const QUESTS = [
  { id: 'main', region: HOME, main: true, name: 'The Bridge', steps: MAIN_STEPS },
  { id: 'paw-tonic', region: HOME, giver: 'kazan-v1', name: 'A Sore Paw', after: 'initiated',
    steps: [
      { kind: 'talk', npc: 'kazan-v1', text: 'Talk to the villager with the sore paw',
        say: ['Fine. It still aches. Do not tell my daughter. The spring only takes the edge off; a Berry Tonic would see to it.', 'If you find one in the grass, bring it here and we will say no more about it.'] },
      { kind: 'deliver', npc: 'kazan-v1', item: 'tonic', n: 1, text: 'Bring a Berry Tonic to the villager with the sore paw',
        say: ['Oh. Oh, that is better. You did not see the face I just made.', 'Here, take this. I wore it while I healed. Maybe one of your friends will like it.'] },
    ],
    reward: { collectible: 'c9' } },
  { id: 'forgotten-friends', region: HOME, giver: 'kazan-v2', name: 'Forgotten Friends', after: 'initiated',
    steps: [
      { kind: 'talk', npc: 'kazan-v2', text: 'Talk to the villager who knows about the sickness',
        say: ['My brother says the red ones are lost for good. I say he is wrong, but I would like to be able to prove it at supper.', 'Befriend a wild one out there and come back. Then I get to say I told you so, which I like very much.'] },
      { kind: 'befriend', text: 'Befriend a wild dachi' },
      { kind: 'talk', npc: 'kazan-v2', text: 'Tell the villager about your new friend',
        say: ['It worked? Ha! Wait until supper.', 'Have this shell. My brother found it. He will not miss it, and if he does, good.'] },
    ],
    reward: { collectible: 'c6', items: { candy: 1 } } },
  { id: 'spiral-watch', region: HOME, giver: 'kazan-v0', name: 'Spiral Watch', after: 'kumabo',
    steps: [
      { kind: 'talk', npc: 'kazan-v0', text: 'Talk to the villager who saw the red hand',
        say: ['It came through down on Tomo Coast. The hand. I saw where it went in, and I could not make my legs go there.', 'You go. Tell me what is left. ...If there is anything of his, bring it back.'] },
      { kind: 'visit', sec: 'tomo-coast', text: 'Look for the spiral scorch on Tomo Coast', 
        say: ['The sand here is burned black in a spiral. A splinter of dark glass glints in the middle.'] },
      { kind: 'talk', npc: 'kazan-v0', text: 'Tell the villager what you found on Tomo Coast',
        say: ['Just glass. ...The Elder keeps a piece like it in his hut, from the first spiral. He does not know I know.', 'Keep it. I do not want it in my house.'] },
    ],
    reward: { collectible: 'c1' } },
  
  { id: 'lost-hatchling', region: 'ember-tube', giver: 'kazan-v3', name: 'The Lost Hatchling', after: 'initiated',
    steps: [
      { kind: 'talk', npc: 'kazan-v3', text: 'Talk to the worried villager in Kazan Village',
        say: ['My little one followed the warm air down the cave on the slope. The Ember Tube, we call it.', 'Please, Tamer. Find my hatchling before the lava does.'] },
      { kind: 'visit', sec: 'ember-b', text: 'Look for the hatchling in the Ember Tube\'s Magma Hall',
        say: ['A tiny dachi is curled up on a warm stone, humming to itself. It blinks at you and hops onto your shoulder.'] },
      { kind: 'talk', npc: 'kazan-v3', text: 'Bring the hatchling home to Kazan Village',
        say: ['You found it! Look at it, humming that silly tune.', 'It hummed it all the way into this shell. Keep it - it is yours now.'] },
    ],
    reward: { collectible: 'c23', items: { tonic: 2 } } },
  { id: 'lantern-oil', region: 'ember-tube', giver: 'shrine-v0', name: 'Light for the Lanterns', after: 'initiated',
    steps: [
      { kind: 'talk', npc: 'shrine-v0', text: 'Talk to the acolyte by the shrine lanterns',
        say: ['Our lanterns burn low. The first keepers carried fire up from the Ember Tube in a lantern of black glass.', 'They say it still sits in the Glow Gallery. Would you bring it back to us?'] },
      { kind: 'find', id: 'c16', text: 'Find the Obsidian Lantern in the Ember Tube\'s Glow Gallery',
        say: ['The black glass lantern is still warm. A tiny flame wakes inside it when you lift it.'] },
      { kind: 'talk', npc: 'shrine-v0', text: 'Bring the Obsidian Lantern to the acolyte',
        say: ['It still burns! The keepers\' fire, after all these years.', 'Take the helmet the last keeper wore. Its lamp will never go out down there.'] },
    ],
    reward: { collectible: 'c24' } },
  { id: 'kumabo-gear', region: 'ember-tube', giver: 'kazan-v4', name: 'Kumabo\'s Missing Gear', after: 'kumabo',
    steps: [
      { kind: 'talk', npc: 'kazan-v4', text: 'Talk to the villager who fixes things',
        say: ['Kumabo lost a gear out of her arm down in the Ember Tube, and an Ember dachi ran off with it. They cannot leave anything shiny alone.', 'Make friends with one and it might cough it up. I would go myself, but my knees and that tube do not get along.'] },
      { kind: 'befriend', type: 'Ember', text: 'Befriend an Ember dachi',
        say: ['Your new friend coughs up something round and warm: a little brass gear.'] },
      { kind: 'talk', npc: 'kazan-v4', text: 'Bring the gear back to Kazan Village',
        say: ['That is Kumabo\'s gear, all right. She will want you to keep it, you know. She has decided you need the luck more.', 'And take a Heart Seal. I made a few. They come out crooked, but they work.'] },
    ],
    reward: { collectible: 'c17', items: { seal: 1 } } },
  
  { id: 'bubble-mend', region: 'shellhaven', giver: 'shell-v0', name: 'A Thin Spot', after: 'boss_ashlo',
    steps: [
      { kind: 'talk', npc: 'shell-v0', text: 'Talk to the fish folk keeper by the gate in Shellhaven',
        say: ['There. See it ripple? A thin spot. I have been holding it with my thumb since breakfast.', 'Frost dachis breathe a skin as hard as ice. Bring me one. I would go myself, but if I take my thumb off, we all get wet.'] },
      { kind: 'befriend', type: 'Frost', text: 'Befriend a Frost dachi',
        say: ['Your new friend puffs a breath of frost. A little bubble freezes in the air and drops into your hand.'] },
      { kind: 'talk', npc: 'shell-v0', text: 'Bring your Frost friend back to Shellhaven',
        say: ['Smooth. Look at that. ...I did the hard part, you know. The holding.', 'Keep the frozen one. If anybody asks where you got it, you got it from the keeper.'] },
    ],
    reward: { collectible: 'c32' } },
  { id: 'clam-pearl', region: 'shellhaven', giver: 'shell-v1', name: 'The Quiet Clam', after: 'boss_ashlo',
    steps: [
      { kind: 'talk', npc: 'shell-v1', text: 'Talk to the fish folk by the giant clam',
        say: ['She has not opened all day. She sulks when nobody feeds her. Do not look at her, it makes it worse.', 'Sweets. One Sweet Candy and she might forgive the whole village.'] },
      { kind: 'deliver', npc: 'shell-v1', item: 'candy', n: 1, text: 'Bring a Sweet Candy to the clam keeper in Shellhaven',
        say: ['She spat at you! She likes you. She spat at me for nine years before I worked that out.', 'Wear the shell. She will want to see it on you.'] },
    ],
    reward: { collectible: 'c40', items: { tonic: 1 } } },
  { id: 'city-song', region: 'shellhaven', giver: 'shell-v3', name: 'The City That Sang', after: 'boss_ashlo',
    steps: [
      { kind: 'talk', npc: 'shell-v3', text: 'Talk to the fish folk who listens to Memory Stones',
        say: ['Grandmother says the drowned temple in Coral Deep still sings when the tide goes through. My brother says that is a story for babies.', 'Go and listen. If it sings, tell me first. Not him. Me.'] },
      { kind: 'visit', sec: 'temple-sanctum', text: 'Listen at the altar inside the drowned temple in Coral Deep', 
        say: ['The tide pushes through the broken windows and something hums back. Three notes. The same three, again and again.'] },
      { kind: 'talk', npc: 'shell-v3', text: 'Tell the fish folk in Shellhaven what you heard',
        say: ['Three notes? The same three? ...Grandmother hums three notes when she does the nets.', 'You keep the song. If I have it, my brother will just say I made it up.'] },
    ],
    reward: { collectible: 'c37' } },
  
  { id: 'lost-coin', region: 'shellhaven', giver: 'shell-v2', name: 'Grandfather\'s Coin', after: 'boss_ashlo',
    steps: [
      { kind: 'talk', npc: 'shell-v2', text: 'Talk to the fish folk by the elder\'s post in Shellhaven',
        say: ['My sister chased a coin into the Kelp Maze and came back without it, crying, and she has not stopped, and I sleep next to her.', 'It was Grandfather\'s, from the market up in the city. A whale on one side. The maze is through the east gate. Please. I am so tired.'] },
      { kind: 'find', id: 'c33', text: 'Find the whale coin deep in the Kelp Maze, east of Shellhaven',
        say: ['At the end of a blind corner, something round and green lies in the sand. A whale on one side.'] },
      { kind: 'talk', npc: 'shell-v2', text: 'Bring the coin back to Shellhaven',
        say: ['The whale. She is going to stop. She is going to STOP.', 'Keep the coin, Grandfather liked coins that travelled. Take these too. I am going to sleep for a week.'] },
    ],
    reward: { items: { candy: 2, seal: 1 } } },
  
  
  
  { id: 'fig-luck', region: 'vinegate', giver: 'vine-v2', name: 'A Fig for Luck', after: 'boss_bramble',
    steps: [
      { kind: 'talk', npc: 'vine-v2', text: 'Talk to the river folk who throws figs for luck',
        say: ['Someone threw my lucky fig in the river. Fine, it was me. Now I have no luck and the river has two.', 'The best figs grow on the terraces past the canopy. Bring one back? Not for eating. For luck. Mostly.'] },
      { kind: 'visit', sec: 'fig-terraces', text: 'Pick a fig on the Fig Terraces, past the Canopy Walk',
        say: ['Where two dikes meet, an old fig tree leans over the water. One ripe fig drops into your hand like it was waiting.'] },
      { kind: 'talk', npc: 'vine-v2', text: 'Bring the fig back to Vinegate',
        say: ['A terrace fig! Now watch - in it goes, and out it comes, and now it is twice as lucky.', 'Keep the fig. You walked all the way up there for my luck, you may as well have some.'] },
    ],
    reward: { collectible: 'c63' } },
  { id: 'bend-fishing', region: 'vinegate', giver: 'vine-v0', name: 'Past the Bend', after: 'boss_bramble',
    steps: [
      { kind: 'talk', npc: 'vine-v0', text: 'Talk to the river folk at the landing',
        say: ['My grandpa fished past the bend, all the way up to the old temple. He lost his float there. A painted one.', 'Nobody goes up the temple steps now. Nobody except you, maybe. You have that look.'] },
      { kind: 'find', id: 'c61', text: 'Find the old fishing float at the foot of the Ruin Steps',
        say: ['In the weeds at the foot of the temple: a gourd float, its paint almost gone. It is light as a leaf.'] },
      { kind: 'talk', npc: 'vine-v0', text: 'Bring the float back to the landing',
        say: ['That is it! Grandpa\'s float. He said the fish past the bend were as big as boats. He also said a lot of things.', 'Here - a fisher\'s bandana. Now you are one of us. Do not tell the fish.'] },
    ],
    reward: { collectible: 'c70' } },
  { id: 'scared-tails', region: 'vinegate', giver: 'vine-v1', name: 'Scared Tails', after: 'boss_bramble',
    steps: [
      { kind: 'talk', npc: 'vine-v1', text: 'Talk to the river folk who watches the guards',
        say: ['My son is one of the king\'s guards. His tail shakes at supper. He will not say why.', 'If he saw a wild Beast dachi go off with a person and come to no harm, he might stop thinking the canopy is coming down. Befriend one for me?'] },
      { kind: 'befriend', type: 'Beast', text: 'Befriend a Beast dachi',
        say: ['Your new friend puffs up and looks up at the canopy, as if somebody up there is watching.'] },
      { kind: 'talk', npc: 'vine-v1', text: 'Tell the river folk on the east pier',
        say: ['He came down for supper. First time in a month. He did not say anything about it, so I will not either.', 'He sent this down for you. He said you would know what it means. I do not.'] },
    ],
    reward: { collectible: 'c65' } },
  
  { id: 'dented-lamp', region: 'minehead', giver: 'mine-v0', name: 'The Lamp with the Dent', after: 'boss_kingshade',
    steps: [
      { kind: 'talk', npc: 'mine-v0', text: 'Talk to the girl who trims the lamps',
        say: ['My brother took my lamp down to the Hush. The one with the bean dent. He did not even put it out nicely, he just took it.', 'If you go down past the chains, look for it. I would go. I am not allowed. I am also scared, but mostly not allowed.'] },
      { kind: 'find', id: 'c77', text: 'Find the dented lamp in the Deep Seam',
        say: ['Tucked behind a pillar in the Lamp Hall, cold: a miner\'s lamp with a dent in its side shaped exactly like a bean.'] },
      { kind: 'talk', npc: 'mine-v0', text: 'Bring the lamp back to the camp',
        say: ['That is it. That is the bean. ...Did you see him? Was he cold? Never mind. Do not tell me.', 'Take his helmet. He left it on my bed when he went. I am not keeping it for him. I am keeping it for you.'] },
    ],
    reward: { collectible: 'c84' } },
  { id: 'night-soup', region: 'minehead', giver: 'mine-v2', name: 'Soup for the Night Shift', after: 'boss_kingshade',
    steps: [
      { kind: 'talk', npc: 'mine-v2', text: 'Talk to the camp cook',
        say: ['Soup. For the night shift, at the bottom of the shaft. They will not come up for it. They say the ledge is long. It is, but so is my patience.', 'Carry it down to the Lower Seam and do not spill. If you spill, lie.'] },
      { kind: 'visit', sec: 'shaft-b', text: 'Carry the soup down to the Lower Seam',
        say: ['The night shift take the pot without a word, then all talk at once about the soup. One of them cries a little. He says it is the steam.'] },
      { kind: 'talk', npc: 'mine-v2', text: 'Tell the cook the soup got there',
        say: ['They ate it? All of it? Of course they did. Here - a crystal I found in the pot once. I do not ask how.', 'Next time, bring the pot back. That was my good pot.'] },
    ],
    reward: { collectible: 'c78' } },
  { id: 'not-afraid', region: 'minehead', giver: 'mine-v1', name: 'Not Afraid of the Light', after: 'boss_kingshade',
    steps: [
      { kind: 'talk', npc: 'mine-v1', text: 'Talk to the miner who misses the dark',
        say: ['The Hermit says the dark ones in the seams are the gentle ones. That the light hurts them. I do not know any more.', 'Bring me a Shadow dachi that is not afraid of you. Of your little light. Then I will know something.'] },
      { kind: 'befriend', type: 'Shadow', text: 'Befriend a Shadow dachi',
        say: ['Your new friend sits right in your walkman\'s glow, blinking, and then leans into it like a cat into the sun.'] },
      { kind: 'talk', npc: 'mine-v1', text: 'Show the miner on the rim',
        say: ['It is... it is sitting in the light. On purpose. Huh. ...Huh.', 'Here. I had this from the Hermit, for being quiet. I do not think I want to be that quiet.'] },
    ],
    reward: { collectible: 'c80' } },
  { id: 'firefly-home', region: 'hollowroot', giver: 'hollow-v3', name: 'The Lost Fireflies', after: 'boss_leviathrum',
    steps: [
      { kind: 'talk', npc: 'hollow-v3', text: 'Talk to the tree folk who keeps the firefly jars',
        say: ['Half my fireflies went down the knot-hole. They go to the heartwood when they are sad. I do not know what made them sad. Maybe me.', 'Will you go down to the sap pool and hum to them? Not loud. They do not like loud.'] },
      { kind: 'visit', sec: 'tree-heart', text: 'Find the fireflies at the sap pool, inside the Mother Tree',
        say: ['A cloud of fireflies hangs over the glowing sap. When you hum, they drift up toward the knot-hole, one by one.'] },
      { kind: 'talk', npc: 'hollow-v3', text: 'Tell the firefly keeper in Hollowroot',
        say: ['...They came back. All of them. I counted twice.', 'That one keeps landing on you. Take the jar. It is not my idea, it is hers.'] },
    ],
    reward: { collectible: 'c48' } },
  { id: 'old-shears', region: 'hollowroot', giver: 'hollow-v2', name: 'The Gardener\'s Shears', after: 'boss_leviathrum',
    steps: [
      { kind: 'talk', npc: 'hollow-v2', text: 'Talk to the tree folk who remembers the Old Grove',
        say: ['Mother Bramble\'s shears. Nobody else was allowed to touch them. She dropped them the night the red came and did not even look back.', 'They are in Thornfield, her garden. Rope slide, south-east platform. Get them before she comes looking.'] },
      { kind: 'find', id: 'c46', text: 'Find Mother Bramble\'s shears in Thornfield\'s garden terraces',
        say: ['Under a thorn bed, half sunk in moss: a pair of old garden shears, handles worn smooth by one paw, for years.'] },
      { kind: 'talk', npc: 'hollow-v2', text: 'Bring the shears back to Hollowroot',
        say: ['Hers. Still sharp. She kept them sharp the whole time she was cutting the wrong things.', 'Wear this. Every gardener up here wears one. Every gardener but one.'] },
    ],
    reward: { collectible: 'c54', items: { seal: 1 } } },
  { id: 'leaf-bed', region: 'hollowroot', giver: 'hollow-v1', name: 'A Bed of Leaves', after: 'boss_leviathrum',
    steps: [
      { kind: 'talk', npc: 'hollow-v1', text: 'Talk to the tree folk on the east platform',
        say: ['The leaf beds will not settle. The wild ones wake up scared every hour and wake the rest of us.', 'They settle if one of them goes off with somebody and comes to no harm. Make a friend of one? I have not slept since the thaw.'] },
      { kind: 'befriend', type: 'Leaf', text: 'Befriend a Leaf dachi',
        say: ['Your new friend curls up for a moment in the leaves, and the whole bed goes quiet around it.'] },
      { kind: 'talk', npc: 'hollow-v1', text: 'Tell the east platform\'s tree folk',
        say: ['Listen to that. Nothing at all.', 'A rain cup. Best cup in the Wilds. I made it, so I would know.'] },
    ],
    reward: { collectible: 'c50', items: { candy: 2 } } },
  
  
  { id: 'theres-soup', region: 'frostspine', giver: 'frost-v1', name: "There's Soup", after: 'boss_quartz',
    steps: [
      { kind: 'talk', npc: 'frost-v1', text: 'Talk to the woman whose sister went up to the Menagerie',
        say: ["You're going up? Past the thin ice? ...Okay. Okay. If you see them, the little blue one's got a chipped ear. My sister. Well, her kids. And her.", "I made soup. I make soup every night, actually, in case. Don't tell her that. Tell her it's a coincidence."] },
      { kind: 'beat', boss: 'glacius', text: 'Stand up to Glacius Rex at the summit',
        say: ["Up on the summit the ice ring cracks, and a whole family of dachis blinks at the morning like it's the same one they walked into."] },
      { kind: 'talk', npc: 'frost-v1', text: 'Tell her what happened at the summit',
        say: ["They're walking down? All of them? The chipped ear too? ...I have to go heat the soup. I have to - where's my spoon. Why am I crying, it's soup.", "Here, take this. I knit one for everybody who comes up the pass. I knit yours ages ago. I just didn't know it was yours yet."] },
    ],
    reward: { collectible: 'c99', items: { tonic: 1 } } },
  { id: 'rope-end', region: 'frostspine', giver: 'frost-v2', name: 'The Rope End', after: 'boss_quartz',
    steps: [
      { kind: 'talk', npc: 'frost-v2', text: 'Ask about the cut bridge',
        say: ["Grandpa says he cut the high bridge himself. With a knife. In one go. In a storm. He tells it different every time, but the knife's always in it.", "The end of the rope's still hanging off the pass somewhere. If you find it, bring it here. I wanna see how good the knife was."] },
      { kind: 'find', id: 'c91', text: 'Find the cut end of the rope on the Switchback Pass',
        say: ["Snagged on the rocks above the pass: the high bridge's rope, cut clean on one side - and on the other side, chewed. Big teeth. Really big teeth."] },
      { kind: 'talk', npc: 'frost-v2', text: 'Bring the rope end back to camp',
        say: ["Teeth?! He never said teeth. ...Oh, he's so gonna hear about this. 'The knife,' huh. Grandpa!", "Okay, you earned this. It's his old climbing helmet. Don't tell him I gave it away. Actually, do. Tell him it was the teeth."] },
    ],
    reward: { collectible: 'c102' } },
  { id: 'thawing-is-real', region: 'frostspine', giver: 'frost-v0', name: "Thawing's Real", after: 'boss_quartz',
    steps: [
      { kind: 'talk', npc: 'frost-v0', text: 'Talk to the man by the frozen lake',
        say: ["My kids don't believe ice turns into water. They think I'm making it up, like dragons. I mean, I've never seen it either, up here, so who am I to talk.", "There's a kettle out at the steam vents past the glacier, always boiling. If you could bring it back still steaming... I just want them to see it once."] },
      { kind: 'find', id: 'c94', text: 'Fetch the kettle from the steam vents',
        say: ["The kettle's wedged over a steam crack, rattling its lid. You wrap it in your sleeve and run. It's still steaming when you get to the camp. Barely. It counts."] },
      { kind: 'talk', npc: 'frost-v0', text: 'Bring the steaming kettle to the lake',
        say: ["Kids! KIDS! Look - snow in, water out. Water! ...They're not impressed. They want to do it again. Okay. That's the same thing as impressed.", "Here, these were my dad's. For the glare out on the ice. He always said the glacier was showing off. I think he was right."] },
    ],
    reward: { collectible: 'c100' } },
  { id: 'the-pot', region: 'kazan-heart', giver: 'forge-v0', name: 'The Pot', after: 'boss_glacius',
    steps: [
      { kind: 'talk', npc: 'forge-v0', text: 'Talk to the girl who carried a pot',
        say: ["I put it down. Can you believe that? I carried that pot the whole way down out of the Vault, and then I put it down by the hot water for ONE second and the water kinds moved in.", "It's not like I need it. We've got pots. It's just... it was the one from home. It's in the cistern, past the rivers. If you're going that way. You're probably not going that way."] },
      { kind: 'find', id: 'c110', text: 'Find the pot in the Cinder Cistern',
        say: ["Half sunk in the warm shallows: a blackened pot with a dented lid. A little Tide dachi is asleep in it. It does not want to get out. Eventually it gets out."] },
      { kind: 'talk', npc: 'forge-v0', text: 'Bring the pot back to the forge',
        say: ["That's... yeah. That's the dent. Mom dropped it on the step the day I was born, she said, and never fixed it, 'cause then it wouldn't be ours anymore.", "Here. She made me this cap and it never fit. It's too big. It's still too big. You keep it warm for a while."] },
    ],
    reward: { collectible: 'c116' } },
  { id: 'cart-ten', region: 'kazan-heart', giver: 'forge-v2', name: 'Cart Ten', after: 'boss_glacius',
    steps: [
      { kind: 'talk', npc: 'forge-v2', text: 'Ask about the old ore carts',
        say: ["Cart Ten was Grandma's. She scratched a face in the zero so it'd have somebody to talk to on the long runs. Then one night it jumped the points past the islands, and that was that.", "The track fixer says its plate's still out there, on the island at the end of the wrong line. I'd go, but, uh. The carts. I don't really... do the carts."] },
      { kind: 'find', id: 'c108', text: "Find Cart Ten's plate in the Magma Galleries",
        say: ["Out at the end of the wrong line, half under the cinders: a dented tin plate, CART 10, and a little scratched face smiling inside the zero."] },
      { kind: 'talk', npc: 'forge-v2', text: 'Bring the plate back to the forge',
        say: ["Hi, Ten. ...What? You talk to stuff too. Don't lie.", "Grandma used to sit on the dock and listen to the carts. Said every one had its own voice. She kept this - it's them running flat out. That whoop at the end? Could be anybody. Could be you, next time."] },
    ],
    reward: { collectible: 'c112' } },
  { id: 'steady-heat', region: 'kazan-heart', giver: 'forge-v1', name: 'A Steady Heat', after: 'boss_glacius',
    steps: [
      { kind: 'talk', npc: 'forge-v1', text: 'Talk to the kid saving up for a hammer',
        say: ["Ferro says my fire's not steady. Steady how? It's FIRE. It goes up and down, that's the whole thing about it.", "It's 'cause of the bird. Everybody's fire goes funny when you think he might send for you next. Maybe if he stopped... no. Forget it. Nobody stops him."] },
      { kind: 'beat', boss: 'pyrecrown', text: 'Stand up to Pyrecrown in his nest',
        say: ["Far below the nest, in the Ashen Forge, every fire in every hearth settles down at once, like a room letting out its breath."] },
      { kind: 'talk', npc: 'forge-v1', text: 'Tell the kid at the forge',
        say: ["He's gone? Like GONE gone? ...Oh. Oh, look, it's steady. Ferro! FERRO! Look at my hands!", "He gave it to me. The hammer. And he said give you this, for the old man up in the village. Said 'thirty-two', whatever that means. Said the old man would know."] },
    ],
    reward: { collectible: 'c106' } },
];
export const questById = (id) => QUESTS.find((q) => q.id === id) || null;
export const SIDE = QUESTS.filter((q) => !q.main);



export function mainStep(flags = {}, ctx = {}) {
  for (let i = 0; i < MAIN_STEPS.length; i++) {
    const s = MAIN_STEPS[i];
    if (s.flag && !flags[s.flag]) return { index: i, text: s.text };
    if (s.lairs) { const l = nextLair(flags); if (l) return { index: i, text: l.hint }; }
    if (s.last) return { index: i, text: `Befriend every dachi — ${ctx.caught || 0} / ${ctx.total || 0}` };
  }
  return { index: MAIN_STEPS.length, text: '' };
}


const prog = (flags, id) => (flags.quests ? flags.quests[id] : undefined);
export function status(flags = {}, q) {
  const n = prog(flags, q.id);
  if (n === undefined) return q.after && !flags[q.after] ? 'locked' : 'open';
  return n >= q.steps.length ? 'done' : 'active';
}

function matches(s, e, items = {}) {
  if (s.kind === 'talk' || s.kind === 'deliver') {
    if (e.kind !== 'talk' || e.npc !== s.npc) return false;
    return s.kind === 'talk' || (items[s.item] || 0) >= (s.n || 1);
  }
  if (s.kind !== e.kind) return false;
  if (s.kind === 'visit') return e.sec === s.sec;
  if (s.kind === 'befriend') return !s.type || (e.types || []).includes(s.type);
  if (s.kind === 'find') return e.id === s.id;
  if (s.kind === 'beat') return !s.boss || e.boss === s.boss;
  return false;
}



export function advance(flags, event, items = {}) {
  const out = [];
  for (const q of SIDE) {
    const st = status(flags, q);
    if (st === 'locked' || st === 'done') continue;
    const i = st === 'open' ? 0 : prog(flags, q.id), s = q.steps[i];
    if (!matches(s, event, items)) continue;
    if (s.kind === 'deliver') items[s.item] -= s.n || 1;
    
    
    let n = i + 1;
    while (n < q.steps.length && q.steps[n].kind === 'find' && flags.found && flags.found[q.steps[n].id]) n++;
    (flags.quests || (flags.quests = {}))[q.id] = n;
    const done = n >= q.steps.length;
    out.push({ quest: q, step: s, done, say: s.say || [], reward: done ? q.reward || null : null });
  }
  return out;
}

export function reminder(flags, npc) {
  for (const q of SIDE) if (q.giver === npc && status(flags, q) === 'active') return q.steps[prog(flags, q.id)].text;
  return null;
}


export function questState(flags = {}, ctx = {}) {
  const main = { id: 'main', name: QUESTS[0].name, ...mainStep(flags, ctx) };
  const side = SIDE.map((q) => {
    const st = status(flags, q), n = prog(flags, q.id) || 0;
    return { id: q.id, name: q.name, region: q.region, status: st, text: st === 'active' ? q.steps[n].text : st === 'done' ? 'Done' : '',
      steps: q.steps.slice(0, st === 'done' ? q.steps.length : n).map((s) => s.text) };
  }).filter((q) => q.status === 'active' || q.status === 'done');
  return { main, side };
}
