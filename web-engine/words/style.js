



































export const COLORS = {
  paper: '#FBF5E4',    
  card: '#FFFDF6',     
  ink: '#17150F',      
  inkSoft: '#4A4438',  
  green: '#1B6B3A',    
  gold: '#8A5A00',     
  red: '#A8321E',      
  blue: '#1D4E89',     
  slate: '#5D5749',    
};








export const SIZES = {
  base: 20,        
  min: 18,         
  small: 18,       
  h1: 34,
  h2: 26,
  tile: 34,        
  tileWide: 44,    
  target: 48,      
  border: 3,       
  radius: 6,
  shadow: 4,       
  motionMs: 120,   
};










export const FONT_STACK = 'Verdana, "DejaVu Sans", Tahoma, "Segoe UI", system-ui, sans-serif';


















export const STATES = {
  
  right: { fill: 'green', on: 'card', mark: '■', label: 'right place' },
  moved: { fill: 'gold', on: 'card', mark: '◆', label: 'wrong place' },
  absent: { fill: 'slate', on: 'card', mark: '×', label: 'not in the word' },
  
  band1: { fill: 'green', on: 'card', mark: '●', label: 'group 1' },
  band2: { fill: 'gold', on: 'card', mark: '▲', label: 'group 2' },
  band3: { fill: 'blue', on: 'card', mark: '■', label: 'group 3' },
  band4: { fill: 'red', on: 'card', mark: '◆', label: 'group 4' },
  
  
  
  mistake: { fill: 'red', on: 'card', mark: '×', label: 'mistake used' },
  
  theme: { fill: 'blue', on: 'card', mark: '●', label: 'theme word' },
  spangram: { fill: 'gold', on: 'card', mark: '★', label: 'spangram' },
};


export const BANDS = ['band1', 'band2', 'band3', 'band4'];









const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};


export function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255)
    + 0.7152 * channel((n >> 8) & 255)
    + 0.0722 * channel(n & 255);
}


export function contrast(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}





export const CONTRAST_FLOOR = {
  bodyText: 7,     
  onFill: 4.5,     
  uiEdge: 3,       
};









export function cssVariables() {
  const lines = [];
  for (const [k, v] of Object.entries(COLORS)) lines.push([`--fc-${k}`, v]);
  for (const [k, v] of Object.entries(SIZES)) {
    lines.push([`--fc-${k}`, k === 'motionMs' ? `${v}ms` : `${v}px`]);
  }
  lines.push(['--fc-font', FONT_STACK]);
  return lines;
}
