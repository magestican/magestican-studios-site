













import { STRINGS as HANA } from '../../koikoi/src/strings.js';

const SHARED_KEYS = [
  'back', 'vsBot', 'friend', 'level', 'easy', 'medium', 'hard', 'you', 'bot', 'friendName', 'playerN', 'newGame',
  'createRoom', 'join', 'codePh', 'copyLink', 'copied', 'waiting', 'joined', 'connecting', 'leave', 'watching',
  'badCode', 'watchLink', 'watchCopied', 'watchInvite', 'watchers', 'refused', 'noRooms', 'roomCodeLabel', 'seatNext',
];
const shared = (code) => Object.fromEntries(SHARED_KEYS.map((k) => [k, HANA[code][k]]));

const OWN = {
  en: {
    rules: '/shogi.html',
    sideLabel: 'You play', sideSente: 'First (sente)', sideGote: 'Second (gote)', guide: 'Move guide',
    inHand: '{who}: in hand', boardLabel: 'Shogi board', yourTurn: 'Your move.', turnOf: '{who} to move...',
    thinking: '{who} is thinking...', check: 'Check!', promoteQ: 'Promote this piece?', promoteYes: 'Promote', promoteNo: 'Keep',
    youWin: 'Checkmate - you win!', youLose: 'Checkmate - {who} wins. Again?', mateBy: 'Checkmate - {who} wins.',
    resign: 'Resign', resigned: '{who} resigned.', sennichite: 'Sennichite: the same position four times - a draw.',
    perpetual: 'Perpetual check - {who} loses.', moveCap: '256 moves - a draw.', noMoves: '{who} has no legal move and loses.',
    moveN: 'Move {n}', loading: 'Setting up the board...',
    hostLeft: 'The host left - the game goes on from the same position.',
    help: 'Tap a piece, then a square. A captured piece changes sides: tap it in your hand to drop it back on the board. Pieces may promote in the far three rows.',
    pieceOn: '{piece} on {sq}', emptySq: 'empty {sq}', dropOf: 'Drop a {piece}',
    n_K: 'King', n_R: 'Rook', n_B: 'Bishop', n_G: 'Gold general', n_S: 'Silver general', n_N: 'Knight', n_L: 'Lance', n_P: 'Pawn',
    'n_+R': 'Dragon', 'n_+B': 'Horse', 'n_+S': 'Promoted silver', 'n_+N': 'Promoted knight', 'n_+L': 'Promoted lance', 'n_+P': 'Tokin',
  },
  es: {
    rules: '/es/shogi.html',
    sideLabel: 'Juegas con', sideSente: 'Primero (sente)', sideGote: 'Segundo (gote)', guide: 'Guía de movimientos',
    inHand: '{who}: en mano', boardLabel: 'Tablero de shogi', yourTurn: 'Te toca mover.', turnOf: 'Mueve {who}...',
    thinking: '{who} está pensando...', check: '¡Jaque!', promoteQ: '¿Promover esta pieza?', promoteYes: 'Promover', promoteNo: 'No promover',
    youWin: '¡Jaque mate, ganaste!', youLose: 'Jaque mate: gana {who}. ¿Otra?', mateBy: 'Jaque mate: gana {who}.',
    resign: 'Abandonar', resigned: '{who} abandonó.', sennichite: 'Sennichite: la misma posición cuatro veces, empate.',
    perpetual: 'Jaque perpetuo: pierde {who}.', moveCap: '256 jugadas: empate.', noMoves: '{who} no tiene jugada legal y pierde.',
    moveN: 'Jugada {n}', loading: 'Preparando el tablero...',
    hostLeft: 'El anfitrión se fue: la partida sigue desde la misma posición.',
    help: 'Toca una pieza y luego una casilla. Una pieza capturada cambia de bando: tócala en tu mano para colocarla en el tablero. Las piezas pueden promover en las tres filas del fondo.',
    pieceOn: '{piece} en {sq}', emptySq: '{sq} vacía', dropOf: 'Colocar: {piece}',
    n_K: 'Rey', n_R: 'Torre', n_B: 'Alfil', n_G: 'General de oro', n_S: 'General de plata', n_N: 'Caballo', n_L: 'Lanza', n_P: 'Peón',
    'n_+R': 'Dragón', 'n_+B': 'Caballo dragón', 'n_+S': 'Plata promovida', 'n_+N': 'Caballo promovido', 'n_+L': 'Lanza promovida', 'n_+P': 'Tokin',
  },
  pt: {
    rules: '/pt/shogi.html',
    sideLabel: 'Você joga', sideSente: 'Primeiro (sente)', sideGote: 'Segundo (gote)', guide: 'Guia de movimentos',
    inHand: '{who}: na mão', boardLabel: 'Tabuleiro de shogi', yourTurn: 'Sua vez.', turnOf: 'Vez de {who}...',
    thinking: '{who} está pensando...', check: 'Xeque!', promoteQ: 'Promover esta peça?', promoteYes: 'Promover', promoteNo: 'Manter',
    youWin: 'Xeque-mate - você venceu!', youLose: 'Xeque-mate - {who} venceu. De novo?', mateBy: 'Xeque-mate - {who} venceu.',
    resign: 'Desistir', resigned: '{who} desistiu.', sennichite: 'Sennichite: a mesma posição quatro vezes - empate.',
    perpetual: 'Xeque perpétuo - {who} perde.', moveCap: '256 lances - empate.', noMoves: '{who} não tem lance legal e perde.',
    moveN: 'Lance {n}', loading: 'Montando o tabuleiro...',
    hostLeft: 'O anfitrião saiu - o jogo continua da mesma posição.',
    help: 'Toque numa peça e depois numa casa. Uma peça capturada muda de lado: toque nela na sua mão para recolocá-la no tabuleiro. As peças podem promover nas três últimas fileiras.',
    pieceOn: '{piece} em {sq}', emptySq: '{sq} vazia', dropOf: 'Colocar: {piece}',
    n_K: 'Rei', n_R: 'Torre', n_B: 'Bispo', n_G: 'General de ouro', n_S: 'General de prata', n_N: 'Cavalo', n_L: 'Lança', n_P: 'Peão',
    'n_+R': 'Dragão', 'n_+B': 'Cavalo-dragão', 'n_+S': 'Prata promovida', 'n_+N': 'Cavalo promovido', 'n_+L': 'Lança promovida', 'n_+P': 'Tokin',
  },
  tl: {
    rules: '/tl/shogi.html',
    sideLabel: 'Ikaw ay', sideSente: 'Una (sente)', sideGote: 'Ikalawa (gote)', guide: 'Gabay sa galaw',
    inHand: '{who}: hawak', boardLabel: 'Board ng shogi', yourTurn: 'Ikaw na.', turnOf: 'Si {who} ang gagalaw...',
    thinking: 'Nag-iisip si {who}...', check: 'Check!', promoteQ: 'I-promote ang piyesang ito?', promoteYes: 'I-promote', promoteNo: 'Huwag',
    youWin: 'Checkmate - panalo ka!', youLose: 'Checkmate - panalo si {who}. Isa pa?', mateBy: 'Checkmate - panalo si {who}.',
    resign: 'Sumuko', resigned: 'Sumuko si {who}.', sennichite: 'Sennichite: apat na beses ang parehong posisyon - tabla.',
    perpetual: 'Walang-tigil na check - talo si {who}.', moveCap: '256 galaw - tabla.', noMoves: 'Walang legal na galaw si {who} kaya talo.',
    moveN: 'Galaw {n}', loading: 'Inaayos ang board...',
    hostLeft: 'Umalis ang host - tuloy ang laro mula sa parehong posisyon.',
    help: 'I-tap ang piyesa, saka ang parisukat. Ang nakuhang piyesa ay lilipat sa iyo: i-tap ito sa hawak mo para ibaba ulit sa board. Puwedeng mag-promote sa tatlong pinakamalayong hanay.',
    pieceOn: '{piece} sa {sq}', emptySq: 'bakanteng {sq}', dropOf: 'Ibaba ang {piece}',
    n_K: 'Hari', n_R: 'Rook', n_B: 'Bishop', n_G: 'Gold general', n_S: 'Silver general', n_N: 'Knight', n_L: 'Lance', n_P: 'Pawn',
    'n_+R': 'Dragon', 'n_+B': 'Horse', 'n_+S': 'Promoted silver', 'n_+N': 'Promoted knight', 'n_+L': 'Promoted lance', 'n_+P': 'Tokin',
  },
  ja: {
    rules: '/ja/shogi.html',
    sideLabel: '手番', sideSente: '先手', sideGote: '後手', guide: '動きガイド',
    inHand: '{who}の持ち駒', boardLabel: '将棋盤', yourTurn: 'あなたの手番です。', turnOf: '{who}の手番...',
    thinking: '{who}が考えています...', check: '王手!', promoteQ: '成りますか?', promoteYes: '成る', promoteNo: '成らない',
    youWin: '詰み - あなたの勝ちです!', youLose: '詰み - {who}の勝ち。もう一局?', mateBy: '詰み - {who}の勝ち。',
    resign: '投了', resigned: '{who}が投了しました。', sennichite: '千日手: 同じ局面が四回 - 引き分けです。',
    perpetual: '連続王手の千日手 - {who}の負け。', moveCap: '256手 - 引き分けです。', noMoves: '{who}は指せる手がなく負けです。',
    moveN: '{n}手目', loading: '駒を並べています...',
    hostLeft: 'ホストが退出しました - 同じ局面から続けます。',
    help: '駒をタップしてから、動かすマスをタップ。取った駒は自分の持ち駒になり、タップして盤に打てます。敵陣の三段で成ることができます。',
    pieceOn: '{sq}の{piece}', emptySq: '{sq} 空き', dropOf: '{piece}を打つ',
    n_K: '玉将', n_R: '飛車', n_B: '角行', n_G: '金将', n_S: '銀将', n_N: '桂馬', n_L: '香車', n_P: '歩兵',
    'n_+R': '龍王', 'n_+B': '龍馬', 'n_+S': '成銀', 'n_+N': '成桂', 'n_+L': '成香', 'n_+P': 'と金',
  },
  ko: {
    rules: '/ko/shogi.html',
    sideLabel: '내 차례', sideSente: '선수 (센테)', sideGote: '후수 (고테)', guide: '이동 안내',
    inHand: '{who}: 손에 든 말', boardLabel: '쇼기판', yourTurn: '내 차례입니다.', turnOf: '{who} 차례...',
    thinking: '{who} 생각 중...', check: '장군!', promoteQ: '이 말을 승격할까요?', promoteYes: '승격', promoteNo: '그대로',
    youWin: '외통 - 승리했습니다!', youLose: '외통 - {who} 승리. 한 판 더?', mateBy: '외통 - {who} 승리.',
    resign: '기권', resigned: '{who} 기권했습니다.', sennichite: '센니치테: 같은 국면 네 번 - 무승부.',
    perpetual: '연속 장군 - {who} 패배.', moveCap: '256수 - 무승부.', noMoves: '{who}에게 둘 수 있는 수가 없어 패배합니다.',
    moveN: '{n}수', loading: '판을 차리는 중...',
    hostLeft: '호스트가 나갔습니다 - 같은 국면에서 계속합니다.',
    help: '말을 누르고 칸을 누르세요. 잡은 말은 내 편이 됩니다: 손에 든 말을 눌러 판에 다시 놓을 수 있어요. 상대 진영 세 줄에서 승격할 수 있습니다.',
    pieceOn: '{sq}의 {piece}', emptySq: '빈 칸 {sq}', dropOf: '{piece} 놓기',
    n_K: '왕', n_R: '비차', n_B: '각행', n_G: '금장', n_S: '은장', n_N: '계마', n_L: '향차', n_P: '보병',
    'n_+R': '용왕', 'n_+B': '용마', 'n_+S': '성은', 'n_+N': '성계', 'n_+L': '성향', 'n_+P': '토킨',
  },
  id: {
    rules: '/id/shogi.html',
    sideLabel: 'Kamu main', sideSente: 'Pertama (sente)', sideGote: 'Kedua (gote)', guide: 'Panduan langkah',
    inHand: '{who}: di tangan', boardLabel: 'Papan shogi', yourTurn: 'Giliranmu.', turnOf: 'Giliran {who}...',
    thinking: '{who} sedang berpikir...', check: 'Skak!', promoteQ: 'Promosikan bidak ini?', promoteYes: 'Promosi', promoteNo: 'Tetap',
    youWin: 'Skakmat - kamu menang!', youLose: 'Skakmat - {who} menang. Lagi?', mateBy: 'Skakmat - {who} menang.',
    resign: 'Menyerah', resigned: '{who} menyerah.', sennichite: 'Sennichite: posisi yang sama empat kali - seri.',
    perpetual: 'Skak terus-menerus - {who} kalah.', moveCap: '256 langkah - seri.', noMoves: '{who} tidak punya langkah sah dan kalah.',
    moveN: 'Langkah {n}', loading: 'Menyiapkan papan...',
    hostLeft: 'Tuan rumah keluar - permainan lanjut dari posisi yang sama.',
    help: 'Ketuk bidak, lalu petak. Bidak yang ditangkap pindah ke pihakmu: ketuk di tanganmu untuk menaruhnya lagi di papan. Bidak bisa promosi di tiga baris terjauh.',
    pieceOn: '{piece} di {sq}', emptySq: '{sq} kosong', dropOf: 'Taruh {piece}',
    n_K: 'Raja', n_R: 'Benteng', n_B: 'Gajah', n_G: 'Jenderal emas', n_S: 'Jenderal perak', n_N: 'Kuda', n_L: 'Tombak', n_P: 'Pion',
    'n_+R': 'Naga', 'n_+B': 'Kuda naga', 'n_+S': 'Perak promosi', 'n_+N': 'Kuda promosi', 'n_+L': 'Tombak promosi', 'n_+P': 'Tokin',
  },
  vi: {
    rules: '/vi/shogi.html',
    sideLabel: 'Bạn đi', sideSente: 'Trước (sente)', sideGote: 'Sau (gote)', guide: 'Gợi ý nước đi',
    inHand: '{who}: quân trong tay', boardLabel: 'Bàn cờ shogi', yourTurn: 'Đến lượt bạn.', turnOf: 'Lượt của {who}...',
    thinking: '{who} đang suy nghĩ...', check: 'Chiếu!', promoteQ: 'Phong cấp quân này?', promoteYes: 'Phong cấp', promoteNo: 'Giữ nguyên',
    youWin: 'Chiếu hết - bạn thắng!', youLose: 'Chiếu hết - {who} thắng. Chơi lại?', mateBy: 'Chiếu hết - {who} thắng.',
    resign: 'Đầu hàng', resigned: '{who} đã đầu hàng.', sennichite: 'Sennichite: cùng một thế cờ bốn lần - hòa.',
    perpetual: 'Chiếu liên tục - {who} thua.', moveCap: '256 nước - hòa.', noMoves: '{who} không còn nước hợp lệ và thua.',
    moveN: 'Nước {n}', loading: 'Đang xếp bàn cờ...',
    hostLeft: 'Chủ phòng đã rời - ván cờ tiếp tục từ cùng thế cờ.',
    help: 'Chạm vào quân, rồi chạm ô. Quân bị bắt đổi phe: chạm vào nó trong tay để thả lại lên bàn. Quân có thể phong cấp ở ba hàng xa nhất.',
    pieceOn: '{piece} ở {sq}', emptySq: 'ô trống {sq}', dropOf: 'Thả {piece}',
    n_K: 'Vua', n_R: 'Xe', n_B: 'Tượng', n_G: 'Tướng vàng', n_S: 'Tướng bạc', n_N: 'Mã', n_L: 'Thương', n_P: 'Tốt',
    'n_+R': 'Long vương', 'n_+B': 'Long mã', 'n_+S': 'Bạc phong cấp', 'n_+N': 'Mã phong cấp', 'n_+L': 'Thương phong cấp', 'n_+P': 'Tokin',
  },
  'zh-Hant': {
    rules: '/zh-hant/shogi.html',
    sideLabel: '執棋', sideSente: '先手', sideGote: '後手', guide: '走法提示',
    inHand: '{who}的持駒', boardLabel: '將棋盤', yourTurn: '輪到你了。', turnOf: '輪到{who}...',
    thinking: '{who}思考中...', check: '王手!', promoteQ: '要升變這枚棋子嗎?', promoteYes: '升變', promoteNo: '不升變',
    youWin: '將死 - 你贏了!', youLose: '將死 - {who}獲勝。再來一局?', mateBy: '將死 - {who}獲勝。',
    resign: '認輸', resigned: '{who}認輸了。', sennichite: '千日手:同一局面出現四次 - 和局。',
    perpetual: '連續王手的千日手 - {who}判負。', moveCap: '256手 - 和局。', noMoves: '{who}無棋可走,判負。',
    moveN: '第{n}手', loading: '正在擺棋...',
    hostLeft: '房主離開了 - 棋局從同一局面繼續。',
    help: '先點棋子,再點格子。吃掉的棋子會成為你的持駒:點一下即可打回盤上。棋子進入敵陣三行可以升變。',
    pieceOn: '{sq}的{piece}', emptySq: '{sq} 空格', dropOf: '打入{piece}',
    n_K: '王將', n_R: '飛車', n_B: '角行', n_G: '金將', n_S: '銀將', n_N: '桂馬', n_L: '香車', n_P: '步兵',
    'n_+R': '龍王', 'n_+B': '龍馬', 'n_+S': '成銀', 'n_+N': '成桂', 'n_+L': '成香', 'n_+P': '金(と)',
  },
  'zh-Hans': {
    rules: '/zh-hans/shogi.html',
    sideLabel: '执棋', sideSente: '先手', sideGote: '后手', guide: '走法提示',
    inHand: '{who}的持驹', boardLabel: '将棋盘', yourTurn: '轮到你了。', turnOf: '轮到{who}...',
    thinking: '{who}思考中...', check: '王手!', promoteQ: '要升变这枚棋子吗?', promoteYes: '升变', promoteNo: '不升变',
    youWin: '将死 - 你赢了!', youLose: '将死 - {who}获胜。再来一局?', mateBy: '将死 - {who}获胜。',
    resign: '认输', resigned: '{who}认输了。', sennichite: '千日手:同一局面出现四次 - 和棋。',
    perpetual: '连续王手的千日手 - {who}判负。', moveCap: '256手 - 和棋。', noMoves: '{who}无棋可走,判负。',
    moveN: '第{n}手', loading: '正在摆棋...',
    hostLeft: '房主离开了 - 棋局从同一局面继续。',
    help: '先点棋子,再点格子。吃掉的棋子会成为你的持驹:点一下即可打回盘上。棋子进入敌阵三行可以升变。',
    pieceOn: '{sq}的{piece}', emptySq: '{sq} 空格', dropOf: '打入{piece}',
    n_K: '王将', n_R: '飞车', n_B: '角行', n_G: '金将', n_S: '银将', n_N: '桂马', n_L: '香车', n_P: '步兵',
    'n_+R': '龙王', 'n_+B': '龙马', 'n_+S': '成银', 'n_+N': '成桂', 'n_+L': '成香', 'n_+P': '金(と)',
  },
};

export const STRINGS = Object.freeze(Object.fromEntries(
  Object.entries(OWN).map(([code, own]) => [code, Object.freeze({ ...shared(code), ...own })]),
));

export const stringsFor = (lang) => STRINGS[lang] ?? STRINGS.en;


export const fill = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));


export const KANJI = Object.freeze({
  P: '歩', L: '香', N: '桂', S: '銀', G: '金', B: '角', R: '飛', K: '王',
  '+P': 'と', '+L': '杏', '+N': '圭', '+S': '全', '+B': '馬', '+R': '龍',
});
export const kanjiFor = (type, color) => (type === 'K' && color === 'w' ? '玉' : KANJI[type]);
export const pieceName = (T, type) => T[`n_${type}`] ?? type;
