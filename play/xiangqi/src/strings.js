




















import { STRINGS as HANA } from '../../koikoi/src/strings.js';

const SHARED_KEYS = [
  'back', 'vsBot', 'friend', 'level', 'easy', 'medium', 'hard', 'you', 'bot', 'friendName', 'playerN', 'newGame',
  'createRoom', 'join', 'codePh', 'copyLink', 'copied', 'waiting', 'joined', 'connecting', 'leave', 'watching',
  'badCode', 'watchLink', 'watchCopied', 'watchInvite', 'watchers', 'refused', 'noRooms', 'roomCodeLabel', 'seatNext',
];
const shared = (code) => Object.fromEntries(SHARED_KEYS.map((k) => [k, HANA[code][k]]));

const OWN = {
  en: {
    rules: '/xiangqi.html',
    sideLabel: 'You play', sideRed: 'Red (first)', sideBlack: 'Black (second)', guide: 'Move guide',
    taken: '{who} took', boardLabel: 'Xiangqi board', yourTurn: 'Your move.', turnOf: '{who} to move...',
    thinking: '{who} is thinking...', check: 'Check!',
    youWin: 'Checkmate - you win!', youLose: 'Checkmate - {who} wins. Again?', mateBy: 'Checkmate - {who} wins.',
    resign: 'Resign', resigned: '{who} resigned.', stalemate: '{who} has no legal move and loses.',
    repetition: 'The same position three times - a draw.', perpetual: 'Perpetual check - {who} loses.',
    idle: '60 moves each without a capture - a draw.', moveCap: '300 moves - a draw.',
    moveN: 'Move {n}', loading: 'Setting up the board...',
    hostLeft: 'The host left - the game goes on from the same position.',
    help: 'Tap a piece, then a point: pieces stand where the lines cross. Checkmate the other general to win. A player with no legal move loses.',
    note: 'Perpetual check loses. Perpetual chase is not judged here.',
    pieceOn: '{piece} on {sq}', emptySq: 'empty {sq}',
    n_K: 'General', n_A: 'Advisor', n_B: 'Elephant', n_N: 'Horse', n_R: 'Chariot', n_C: 'Cannon', n_P: 'Soldier',
  },
  es: {
    rules: '/es/xiangqi.html',
    sideLabel: 'Juegas con', sideRed: 'Rojas (primero)', sideBlack: 'Negras (segundo)', guide: 'Guía de movimientos',
    taken: '{who} capturó', boardLabel: 'Tablero de xiangqi', yourTurn: 'Te toca mover.', turnOf: 'Mueve {who}...',
    thinking: '{who} está pensando...', check: '¡Jaque!',
    youWin: '¡Jaque mate, ganaste!', youLose: 'Jaque mate: gana {who}. ¿Otra?', mateBy: 'Jaque mate: gana {who}.',
    resign: 'Abandonar', resigned: '{who} abandonó.', stalemate: '{who} no tiene jugada legal y pierde.',
    repetition: 'La misma posición tres veces: empate.', perpetual: 'Jaque perpetuo: pierde {who}.',
    idle: '60 jugadas cada uno sin capturas: empate.', moveCap: '300 jugadas: empate.',
    moveN: 'Jugada {n}', loading: 'Preparando el tablero...',
    hostLeft: 'El anfitrión se fue: la partida sigue desde la misma posición.',
    help: 'Toca una pieza y luego un punto: las piezas van donde se cruzan las líneas. Da jaque mate al general rival para ganar. Quien no tiene jugada legal pierde.',
    note: 'El jaque perpetuo pierde. La persecución perpetua no se juzga aquí.',
    pieceOn: '{piece} en {sq}', emptySq: '{sq} vacío',
    n_K: 'General', n_A: 'Consejero', n_B: 'Elefante', n_N: 'Caballo', n_R: 'Carro', n_C: 'Cañón', n_P: 'Soldado',
  },
  pt: {
    rules: '/pt/xiangqi.html',
    sideLabel: 'Você joga', sideRed: 'Vermelhas (primeiro)', sideBlack: 'Pretas (segundo)', guide: 'Guia de movimentos',
    taken: '{who} capturou', boardLabel: 'Tabuleiro de xiangqi', yourTurn: 'Sua vez.', turnOf: 'Vez de {who}...',
    thinking: '{who} está pensando...', check: 'Xeque!',
    youWin: 'Xeque-mate - você venceu!', youLose: 'Xeque-mate - {who} venceu. De novo?', mateBy: 'Xeque-mate - {who} venceu.',
    resign: 'Desistir', resigned: '{who} desistiu.', stalemate: '{who} não tem lance legal e perde.',
    repetition: 'A mesma posição três vezes - empate.', perpetual: 'Xeque perpétuo - {who} perde.',
    idle: '60 lances de cada lado sem captura - empate.', moveCap: '300 lances - empate.',
    moveN: 'Lance {n}', loading: 'Montando o tabuleiro...',
    hostLeft: 'O anfitrião saiu - o jogo continua da mesma posição.',
    help: 'Toque numa peça e depois num ponto: as peças ficam onde as linhas se cruzam. Dê xeque-mate no general adversário para vencer. Quem não tem lance legal perde.',
    note: 'Xeque perpétuo perde. A perseguição perpétua não é julgada aqui.',
    pieceOn: '{piece} em {sq}', emptySq: '{sq} vazio',
    n_K: 'General', n_A: 'Conselheiro', n_B: 'Elefante', n_N: 'Cavalo', n_R: 'Carruagem', n_C: 'Canhão', n_P: 'Soldado',
  },
  tl: {
    rules: '/tl/xiangqi.html',
    sideLabel: 'Ikaw ay', sideRed: 'Pula (una)', sideBlack: 'Itim (ikalawa)', guide: 'Gabay sa galaw',
    taken: 'Nakuha ni {who}', boardLabel: 'Board ng xiangqi', yourTurn: 'Ikaw na.', turnOf: 'Si {who} ang gagalaw...',
    thinking: 'Nag-iisip si {who}...', check: 'Check!',
    youWin: 'Checkmate - panalo ka!', youLose: 'Checkmate - panalo si {who}. Isa pa?', mateBy: 'Checkmate - panalo si {who}.',
    resign: 'Sumuko', resigned: 'Sumuko si {who}.', stalemate: 'Walang legal na galaw si {who} kaya talo.',
    repetition: 'Tatlong beses ang parehong posisyon - tabla.', perpetual: 'Walang-tigil na check - talo si {who}.',
    idle: '60 galaw bawat isa nang walang nakukuha - tabla.', moveCap: '300 galaw - tabla.',
    moveN: 'Galaw {n}', loading: 'Inaayos ang board...',
    hostLeft: 'Umalis ang host - tuloy ang laro mula sa parehong posisyon.',
    help: 'I-tap ang piyesa, saka ang punto: nakatayo ang mga piyesa kung saan nagkukrus ang mga linya. I-checkmate ang heneral ng kalaban para manalo. Talo ang walang legal na galaw.',
    note: 'Talo ang walang-tigil na check. Hindi hinuhusgahan dito ang walang-tigil na paghabol.',
    pieceOn: '{piece} sa {sq}', emptySq: 'bakanteng {sq}',
    n_K: 'Heneral', n_A: 'Tagapayo', n_B: 'Elepante', n_N: 'Kabayo', n_R: 'Karwahe', n_C: 'Kanyon', n_P: 'Sundalo',
  },
  ja: {
    rules: '/ja/xiangqi.html',
    sideLabel: '手番', sideRed: '赤(先手)', sideBlack: '黒(後手)', guide: '動きガイド',
    taken: '{who}が取った駒', boardLabel: 'シャンチーの盤', yourTurn: 'あなたの手番です。', turnOf: '{who}の手番...',
    thinking: '{who}が考えています...', check: '王手!',
    youWin: '詰み - あなたの勝ちです!', youLose: '詰み - {who}の勝ち。もう一局?', mateBy: '詰み - {who}の勝ち。',
    resign: '投了', resigned: '{who}が投了しました。', stalemate: '{who}は指せる手がなく負けです。',
    repetition: '同じ局面が三回 - 引き分けです。', perpetual: '連続王手 - {who}の負け。',
    idle: '駒を取らずに各60手 - 引き分けです。', moveCap: '300手 - 引き分けです。',
    moveN: '{n}手目', loading: '駒を並べています...',
    hostLeft: 'ホストが退出しました - 同じ局面から続けます。',
    help: '駒をタップしてから、動かす点をタップ。駒は線の交点に置きます。相手の将を詰ませれば勝ち。指せる手がない側は負けです。',
    note: '連続王手は負け。連続追い(長捉)はここでは判定しません。',
    pieceOn: '{sq}の{piece}', emptySq: '{sq} 空き',
    n_K: '将', n_A: '士', n_B: '象', n_N: '馬', n_R: '車', n_C: '砲', n_P: '兵',
  },
  ko: {
    rules: '/ko/xiangqi.html',
    sideLabel: '진영', sideRed: '빨강 (선수)', sideBlack: '검정 (후수)', guide: '이동 안내',
    taken: '{who}가 잡은 말', boardLabel: '샹치 판', yourTurn: '당신 차례입니다.', turnOf: '{who} 차례...',
    thinking: '{who} 생각 중...', check: '장군!',
    youWin: '외통 - 당신이 이겼습니다!', youLose: '외통 - {who} 승리. 한 판 더?', mateBy: '외통 - {who} 승리.',
    resign: '기권', resigned: '{who} 기권했습니다.', stalemate: '{who}는 둘 수가 없어 패배합니다.',
    repetition: '같은 국면 세 번 - 무승부입니다.', perpetual: '연속 장군 - {who} 패배.',
    idle: '서로 60수 동안 잡은 말이 없음 - 무승부입니다.', moveCap: '300수 - 무승부입니다.',
    moveN: '{n}수', loading: '판을 차리는 중...',
    hostLeft: '방장이 나갔습니다 - 같은 국면에서 계속합니다.',
    help: '말을 누른 다음 점을 누르세요. 말은 선이 만나는 점에 놓입니다. 상대 장을 외통으로 몰면 이깁니다. 둘 수가 없는 쪽은 집니다.',
    note: '연속 장군은 패배입니다. 연속 추격은 여기서 판정하지 않습니다.',
    pieceOn: '{sq}의 {piece}', emptySq: '{sq} 빈 점',
    n_K: '장', n_A: '사', n_B: '상', n_N: '마', n_R: '차', n_C: '포', n_P: '졸',
  },
  id: {
    rules: '/id/xiangqi.html',
    sideLabel: 'Kamu main', sideRed: 'Merah (pertama)', sideBlack: 'Hitam (kedua)', guide: 'Panduan langkah',
    taken: '{who} menangkap', boardLabel: 'Papan xiangqi', yourTurn: 'Giliranmu.', turnOf: 'Giliran {who}...',
    thinking: '{who} sedang berpikir...', check: 'Skak!',
    youWin: 'Skakmat - kamu menang!', youLose: 'Skakmat - {who} menang. Lagi?', mateBy: 'Skakmat - {who} menang.',
    resign: 'Menyerah', resigned: '{who} menyerah.', stalemate: '{who} tidak punya langkah sah dan kalah.',
    repetition: 'Posisi yang sama tiga kali - seri.', perpetual: 'Skak terus-menerus - {who} kalah.',
    idle: '60 langkah masing-masing tanpa menangkap - seri.', moveCap: '300 langkah - seri.',
    moveN: 'Langkah {n}', loading: 'Menyiapkan papan...',
    hostLeft: 'Tuan rumah keluar - permainan berlanjut dari posisi yang sama.',
    help: 'Ketuk bidak, lalu titik: bidak berdiri di persilangan garis. Skakmat jenderal lawan untuk menang. Pemain tanpa langkah sah kalah.',
    note: 'Skak terus-menerus kalah. Kejaran terus-menerus tidak dinilai di sini.',
    pieceOn: '{piece} di {sq}', emptySq: '{sq} kosong',
    n_K: 'Jenderal', n_A: 'Penasihat', n_B: 'Gajah', n_N: 'Kuda', n_R: 'Kereta', n_C: 'Meriam', n_P: 'Prajurit',
  },
  vi: {
    rules: '/vi/xiangqi.html',
    sideLabel: 'Bạn cầm', sideRed: 'Đỏ (đi trước)', sideBlack: 'Đen (đi sau)', guide: 'Gợi ý nước đi',
    taken: '{who} đã ăn', boardLabel: 'Bàn cờ tướng', yourTurn: 'Đến lượt bạn.', turnOf: 'Lượt của {who}...',
    thinking: '{who} đang suy nghĩ...', check: 'Chiếu tướng!',
    youWin: 'Chiếu bí - bạn thắng!', youLose: 'Chiếu bí - {who} thắng. Chơi nữa?', mateBy: 'Chiếu bí - {who} thắng.',
    resign: 'Xin thua', resigned: '{who} đã xin thua.', stalemate: '{who} hết nước đi và thua.',
    repetition: 'Cùng một thế cờ ba lần - hòa.', perpetual: 'Chiếu mãi - {who} thua.',
    idle: 'Mỗi bên 60 nước không ăn quân - hòa.', moveCap: '300 nước - hòa.',
    moveN: 'Nước {n}', loading: 'Đang bày cờ...',
    hostLeft: 'Chủ phòng đã rời - ván cờ tiếp tục từ thế cờ hiện tại.',
    help: 'Chạm vào một quân, rồi chạm vào một giao điểm: quân cờ đứng ở chỗ các đường cắt nhau. Chiếu bí tướng đối phương để thắng. Bên hết nước đi thì thua.',
    note: 'Chiếu mãi bị xử thua. Đuổi bắt mãi không được xét ở đây.',
    pieceOn: '{piece} ở {sq}', emptySq: '{sq} trống',
    n_K: 'Tướng', n_A: 'Sĩ', n_B: 'Tượng', n_N: 'Mã', n_R: 'Xe', n_C: 'Pháo', n_P: 'Tốt',
  },
  'zh-Hant': {
    rules: '/zh-hant/xiangqi.html',
    sideLabel: '執棋', sideRed: '紅方(先走)', sideBlack: '黑方(後走)', guide: '走法提示',
    taken: '{who}吃掉的棋子', boardLabel: '象棋棋盤', yourTurn: '輪到你了。', turnOf: '輪到{who}...',
    thinking: '{who}思考中...', check: '將軍!',
    youWin: '將死 - 你贏了!', youLose: '將死 - {who}獲勝。再來一局?', mateBy: '將死 - {who}獲勝。',
    resign: '認輸', resigned: '{who}認輸了。', stalemate: '{who}無棋可走(困斃),判負。',
    repetition: '同一局面出現三次 - 和棋。', perpetual: '長將 - {who}判負。',
    idle: '雙方各走60步未吃子 - 和棋。', moveCap: '300步 - 和棋。',
    moveN: '第{n}步', loading: '正在擺棋...',
    hostLeft: '房主離開了 - 棋局從同一局面繼續。',
    help: '先點棋子,再點交叉點:棋子走在線的交點上。將死對方的將帥即可獲勝。無棋可走的一方判負。',
    note: '長將判負。長捉在這裡不作判定。',
    pieceOn: '{sq}的{piece}', emptySq: '{sq} 空位',
    n_K: '將帥', n_A: '士', n_B: '象', n_N: '馬', n_R: '車', n_C: '炮', n_P: '兵卒',
  },
  'zh-Hans': {
    rules: '/zh-hans/xiangqi.html',
    sideLabel: '执棋', sideRed: '红方(先走)', sideBlack: '黑方(后走)', guide: '走法提示',
    taken: '{who}吃掉的棋子', boardLabel: '象棋棋盘', yourTurn: '轮到你了。', turnOf: '轮到{who}...',
    thinking: '{who}思考中...', check: '将军!',
    youWin: '将死 - 你赢了!', youLose: '将死 - {who}获胜。再来一局?', mateBy: '将死 - {who}获胜。',
    resign: '认输', resigned: '{who}认输了。', stalemate: '{who}无棋可走(困毙),判负。',
    repetition: '同一局面出现三次 - 和棋。', perpetual: '长将 - {who}判负。',
    idle: '双方各走60步未吃子 - 和棋。', moveCap: '300步 - 和棋。',
    moveN: '第{n}步', loading: '正在摆棋...',
    hostLeft: '房主离开了 - 棋局从同一局面继续。',
    help: '先点棋子,再点交叉点:棋子走在线的交点上。将死对方的将帅即可获胜。无棋可走的一方判负。',
    note: '长将判负。长捉在这里不作判定。',
    pieceOn: '{sq}的{piece}', emptySq: '{sq} 空位',
    n_K: '将帅', n_A: '士', n_B: '象', n_N: '马', n_R: '车', n_C: '炮', n_P: '兵卒',
  },
};

export const STRINGS = Object.freeze(Object.fromEntries(
  Object.entries(OWN).map(([code, own]) => [code, Object.freeze({ ...shared(code), ...own })]),
));

export const stringsFor = (lang) => STRINGS[lang] ?? STRINGS.en;


export const fill = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));


export const GLYPHS = Object.freeze({
  K: ['帥', '將'], A: ['仕', '士'], B: ['相', '象'], N: ['傌', '馬'], R: ['俥', '車'], C: ['炮', '砲'], P: ['兵', '卒'],
});
const GLYPHS_HANS = Object.freeze({
  K: ['帅', '将'], A: ['仕', '士'], B: ['相', '象'], N: ['马', '马'], R: ['车', '车'], C: ['炮', '炮'], P: ['兵', '卒'],
});
export const glyphFor = (type, color, lang = 'en') => (lang === 'zh-Hans' ? GLYPHS_HANS : GLYPHS)[type][color === 'r' ? 0 : 1];
export const pieceName = (T, type) => T[`n_${type}`] ?? type;

export const riverFor = (lang) => (lang === 'zh-Hans' ? ['楚 河', '汉 界'] : ['楚 河', '漢 界']);
