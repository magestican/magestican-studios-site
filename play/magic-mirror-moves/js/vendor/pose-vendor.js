var bR=Object.create;var dd=Object.defineProperty;var wR=Object.getOwnPropertyDescriptor;var vR=Object.getOwnPropertyNames;var SR=Object.getPrototypeOf,CR=Object.prototype.hasOwnProperty;var gr=(r,t)=>()=>{try{return t||r((t={exports:{}}).exports,t),t.exports}catch(e){throw t=0,e}},kt=(r,t)=>{for(var e in t)dd(r,e,{get:t[e],enumerable:!0})},TR=(r,t,e,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of vR(t))!CR.call(r,n)&&n!==e&&dd(r,n,{get:()=>t[n],enumerable:!(o=wR(t,n))||o.enumerable});return r};var hd=(r,t,e)=>(e=r!=null?bR(SR(r)):{},TR(t||!r||!r.__esModule?dd(e,"default",{value:r,enumerable:!0}):e,r));var qb=gr((Lq,Kb)=>{Kb.exports=Yt;var xr=null;try{xr=new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0,1,13,2,96,0,1,127,96,4,127,127,127,127,1,127,3,7,6,0,1,1,1,1,1,6,6,1,127,1,65,0,11,7,50,6,3,109,117,108,0,1,5,100,105,118,95,115,0,2,5,100,105,118,95,117,0,3,5,114,101,109,95,115,0,4,5,114,101,109,95,117,0,5,8,103,101,116,95,104,105,103,104,0,0,10,191,1,6,4,0,35,0,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,126,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,127,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,128,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,129,34,4,66,32,135,167,36,0,32,4,167,11,36,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,130,34,4,66,32,135,167,36,0,32,4,167,11])),{}).exports}catch{}function Yt(r,t,e){this.low=r|0,this.high=t|0,this.unsigned=!!e}Yt.prototype.__isLong__;Object.defineProperty(Yt.prototype,"__isLong__",{value:!0});function nr(r){return(r&&r.__isLong__)===!0}Yt.isLong=nr;var Mb={},Lb={};function fi(r,t){var e,o,n;return t?(r>>>=0,(n=0<=r&&r<256)&&(o=Lb[r],o)?o:(e=Qt(r,(r|0)<0?-1:0,!0),n&&(Lb[r]=e),e)):(r|=0,(n=-128<=r&&r<128)&&(o=Mb[r],o)?o:(e=Qt(r,r<0?-1:0,!1),n&&(Mb[r]=e),e))}Yt.fromInt=fi;function yr(r,t){if(isNaN(r))return t?mi:br;if(t){if(r<0)return mi;if(r>=Wb)return Hb}else{if(r<=-Vb)return or;if(r+1>=Vb)return Ub}return r<0?yr(-r,t).neg():Qt(r%pl|0,r/pl|0,t)}Yt.fromNumber=yr;function Qt(r,t,e){return new Yt(r,t,e)}Yt.fromBits=Qt;var Qu=Math.pow;function Id(r,t,e){if(r.length===0)throw Error("empty string");if(r==="NaN"||r==="Infinity"||r==="+Infinity"||r==="-Infinity")return br;if(typeof t=="number"?(e=t,t=!1):t=!!t,e=e||10,e<2||36<e)throw RangeError("radix");var o;if((o=r.indexOf("-"))>0)throw Error("interior hyphen");if(o===0)return Id(r.substring(1),t,e).neg();for(var n=yr(Qu(e,8)),s=br,a=0;a<r.length;a+=8){var i=Math.min(8,r.length-a),l=parseInt(r.substring(a,a+i),e);if(i<8){var c=yr(Qu(e,i));s=s.mul(c).add(yr(l))}else s=s.mul(n),s=s.add(yr(l))}return s.unsigned=t,s}Yt.fromString=Id;function Er(r,t){return typeof r=="number"?yr(r,t):typeof r=="string"?Id(r,t):Qt(r.low,r.high,typeof t=="boolean"?t:r.unsigned)}Yt.fromValue=Er;var Bb=65536,nA=1<<24,pl=Bb*Bb,Wb=pl*pl,Vb=Wb/2,zb=fi(nA),br=fi(0);Yt.ZERO=br;var mi=fi(0,!0);Yt.UZERO=mi;var ul=fi(1);Yt.ONE=ul;var Gb=fi(1,!0);Yt.UONE=Gb;var Nd=fi(-1);Yt.NEG_ONE=Nd;var Ub=Qt(-1,2147483647,!1);Yt.MAX_VALUE=Ub;var Hb=Qt(-1,-1,!0);Yt.MAX_UNSIGNED_VALUE=Hb;var or=Qt(0,-2147483648,!1);Yt.MIN_VALUE=or;var tt=Yt.prototype;tt.toInt=function(){return this.unsigned?this.low>>>0:this.low};tt.toNumber=function(){return this.unsigned?(this.high>>>0)*pl+(this.low>>>0):this.high*pl+(this.low>>>0)};tt.toString=function(t){if(t=t||10,t<2||36<t)throw RangeError("radix");if(this.isZero())return"0";if(this.isNegative())if(this.eq(or)){var e=yr(t),o=this.div(e),n=o.mul(e).sub(this);return o.toString(t)+n.toInt().toString(t)}else return"-"+this.neg().toString(t);for(var s=yr(Qu(t,6),this.unsigned),a=this,i="";;){var l=a.div(s),c=a.sub(l.mul(s)).toInt()>>>0,u=c.toString(t);if(a=l,a.isZero())return u+i;for(;u.length<6;)u="0"+u;i=""+u+i}};tt.getHighBits=function(){return this.high};tt.getHighBitsUnsigned=function(){return this.high>>>0};tt.getLowBits=function(){return this.low};tt.getLowBitsUnsigned=function(){return this.low>>>0};tt.getNumBitsAbs=function(){if(this.isNegative())return this.eq(or)?64:this.neg().getNumBitsAbs();for(var t=this.high!=0?this.high:this.low,e=31;e>0&&(t&1<<e)==0;e--);return this.high!=0?e+33:e+1};tt.isZero=function(){return this.high===0&&this.low===0};tt.eqz=tt.isZero;tt.isNegative=function(){return!this.unsigned&&this.high<0};tt.isPositive=function(){return this.unsigned||this.high>=0};tt.isOdd=function(){return(this.low&1)===1};tt.isEven=function(){return(this.low&1)===0};tt.equals=function(t){return nr(t)||(t=Er(t)),this.unsigned!==t.unsigned&&this.high>>>31===1&&t.high>>>31===1?!1:this.high===t.high&&this.low===t.low};tt.eq=tt.equals;tt.notEquals=function(t){return!this.eq(t)};tt.neq=tt.notEquals;tt.ne=tt.notEquals;tt.lessThan=function(t){return this.comp(t)<0};tt.lt=tt.lessThan;tt.lessThanOrEqual=function(t){return this.comp(t)<=0};tt.lte=tt.lessThanOrEqual;tt.le=tt.lessThanOrEqual;tt.greaterThan=function(t){return this.comp(t)>0};tt.gt=tt.greaterThan;tt.greaterThanOrEqual=function(t){return this.comp(t)>=0};tt.gte=tt.greaterThanOrEqual;tt.ge=tt.greaterThanOrEqual;tt.compare=function(t){if(nr(t)||(t=Er(t)),this.eq(t))return 0;var e=this.isNegative(),o=t.isNegative();return e&&!o?-1:!e&&o?1:this.unsigned?t.high>>>0>this.high>>>0||t.high===this.high&&t.low>>>0>this.low>>>0?-1:1:this.sub(t).isNegative()?-1:1};tt.comp=tt.compare;tt.negate=function(){return!this.unsigned&&this.eq(or)?or:this.not().add(ul)};tt.neg=tt.negate;tt.add=function(t){nr(t)||(t=Er(t));var e=this.high>>>16,o=this.high&65535,n=this.low>>>16,s=this.low&65535,a=t.high>>>16,i=t.high&65535,l=t.low>>>16,c=t.low&65535,u=0,p=0,m=0,f=0;return f+=s+c,m+=f>>>16,f&=65535,m+=n+l,p+=m>>>16,m&=65535,p+=o+i,u+=p>>>16,p&=65535,u+=e+a,u&=65535,Qt(m<<16|f,u<<16|p,this.unsigned)};tt.subtract=function(t){return nr(t)||(t=Er(t)),this.add(t.neg())};tt.sub=tt.subtract;tt.multiply=function(t){if(this.isZero())return br;if(nr(t)||(t=Er(t)),xr){var e=xr.mul(this.low,this.high,t.low,t.high);return Qt(e,xr.get_high(),this.unsigned)}if(t.isZero())return br;if(this.eq(or))return t.isOdd()?or:br;if(t.eq(or))return this.isOdd()?or:br;if(this.isNegative())return t.isNegative()?this.neg().mul(t.neg()):this.neg().mul(t).neg();if(t.isNegative())return this.mul(t.neg()).neg();if(this.lt(zb)&&t.lt(zb))return yr(this.toNumber()*t.toNumber(),this.unsigned);var o=this.high>>>16,n=this.high&65535,s=this.low>>>16,a=this.low&65535,i=t.high>>>16,l=t.high&65535,c=t.low>>>16,u=t.low&65535,p=0,m=0,f=0,d=0;return d+=a*u,f+=d>>>16,d&=65535,f+=s*u,m+=f>>>16,f&=65535,f+=a*c,m+=f>>>16,f&=65535,m+=n*u,p+=m>>>16,m&=65535,m+=s*c,p+=m>>>16,m&=65535,m+=a*l,p+=m>>>16,m&=65535,p+=o*u+n*c+s*l+a*i,p&=65535,Qt(f<<16|d,p<<16|m,this.unsigned)};tt.mul=tt.multiply;tt.divide=function(t){if(nr(t)||(t=Er(t)),t.isZero())throw Error("division by zero");if(xr){if(!this.unsigned&&this.high===-2147483648&&t.low===-1&&t.high===-1)return this;var e=(this.unsigned?xr.div_u:xr.div_s)(this.low,this.high,t.low,t.high);return Qt(e,xr.get_high(),this.unsigned)}if(this.isZero())return this.unsigned?mi:br;var o,n,s;if(this.unsigned){if(t.unsigned||(t=t.toUnsigned()),t.gt(this))return mi;if(t.gt(this.shru(1)))return Gb;s=mi}else{if(this.eq(or)){if(t.eq(ul)||t.eq(Nd))return or;if(t.eq(or))return ul;var a=this.shr(1);return o=a.div(t).shl(1),o.eq(br)?t.isNegative()?ul:Nd:(n=this.sub(t.mul(o)),s=o.add(n.div(t)),s)}else if(t.eq(or))return this.unsigned?mi:br;if(this.isNegative())return t.isNegative()?this.neg().div(t.neg()):this.neg().div(t).neg();if(t.isNegative())return this.div(t.neg()).neg();s=br}for(n=this;n.gte(t);){o=Math.max(1,Math.floor(n.toNumber()/t.toNumber()));for(var i=Math.ceil(Math.log(o)/Math.LN2),l=i<=48?1:Qu(2,i-48),c=yr(o),u=c.mul(t);u.isNegative()||u.gt(n);)o-=l,c=yr(o,this.unsigned),u=c.mul(t);c.isZero()&&(c=ul),s=s.add(c),n=n.sub(u)}return s};tt.div=tt.divide;tt.modulo=function(t){if(nr(t)||(t=Er(t)),xr){var e=(this.unsigned?xr.rem_u:xr.rem_s)(this.low,this.high,t.low,t.high);return Qt(e,xr.get_high(),this.unsigned)}return this.sub(this.div(t).mul(t))};tt.mod=tt.modulo;tt.rem=tt.modulo;tt.not=function(){return Qt(~this.low,~this.high,this.unsigned)};tt.and=function(t){return nr(t)||(t=Er(t)),Qt(this.low&t.low,this.high&t.high,this.unsigned)};tt.or=function(t){return nr(t)||(t=Er(t)),Qt(this.low|t.low,this.high|t.high,this.unsigned)};tt.xor=function(t){return nr(t)||(t=Er(t)),Qt(this.low^t.low,this.high^t.high,this.unsigned)};tt.shiftLeft=function(t){return nr(t)&&(t=t.toInt()),(t&=63)===0?this:t<32?Qt(this.low<<t,this.high<<t|this.low>>>32-t,this.unsigned):Qt(0,this.low<<t-32,this.unsigned)};tt.shl=tt.shiftLeft;tt.shiftRight=function(t){return nr(t)&&(t=t.toInt()),(t&=63)===0?this:t<32?Qt(this.low>>>t|this.high<<32-t,this.high>>t,this.unsigned):Qt(this.high>>t-32,this.high>=0?0:-1,this.unsigned)};tt.shr=tt.shiftRight;tt.shiftRightUnsigned=function(t){if(nr(t)&&(t=t.toInt()),t&=63,t===0)return this;var e=this.high;if(t<32){var o=this.low;return Qt(o>>>t|e<<32-t,e>>>t,this.unsigned)}else return t===32?Qt(e,0,this.unsigned):Qt(e>>>t-32,0,this.unsigned)};tt.shru=tt.shiftRightUnsigned;tt.shr_u=tt.shiftRightUnsigned;tt.toSigned=function(){return this.unsigned?Qt(this.low,this.high,!1):this};tt.toUnsigned=function(){return this.unsigned?this:Qt(this.low,this.high,!0)};tt.toBytes=function(t){return t?this.toBytesLE():this.toBytesBE()};tt.toBytesLE=function(){var t=this.high,e=this.low;return[e&255,e>>>8&255,e>>>16&255,e>>>24,t&255,t>>>8&255,t>>>16&255,t>>>24]};tt.toBytesBE=function(){var t=this.high,e=this.low;return[t>>>24,t>>>16&255,t>>>8&255,t&255,e>>>24,e>>>16&255,e>>>8&255,e&255]};Yt.fromBytes=function(t,e,o){return o?Yt.fromBytesLE(t,e):Yt.fromBytesBE(t,e)};Yt.fromBytesLE=function(t,e){return new Yt(t[0]|t[1]<<8|t[2]<<16|t[3]<<24,t[4]|t[5]<<8|t[6]<<16|t[7]<<24,e)};Yt.fromBytesBE=function(t,e){return new Yt(t[4]<<24|t[5]<<16|t[6]<<8|t[7],t[0]<<24|t[1]<<16|t[2]<<8|t[3],e)}});var A0=gr(()=>{});var F0=gr(()=>{});var H0=gr((U0,gg)=>{(function(r,t,e){function o(i){var l=this,c=a();l.next=function(){var u=2091639*l.s0+l.c*23283064365386963e-26;return l.s0=l.s1,l.s1=l.s2,l.s2=u-(l.c=u|0)},l.c=1,l.s0=c(" "),l.s1=c(" "),l.s2=c(" "),l.s0-=c(i),l.s0<0&&(l.s0+=1),l.s1-=c(i),l.s1<0&&(l.s1+=1),l.s2-=c(i),l.s2<0&&(l.s2+=1),c=null}function n(i,l){return l.c=i.c,l.s0=i.s0,l.s1=i.s1,l.s2=i.s2,l}function s(i,l){var c=new o(i),u=l&&l.state,p=c.next;return p.int32=function(){return c.next()*4294967296|0},p.double=function(){return p()+(p()*2097152|0)*11102230246251565e-32},p.quick=p,u&&(typeof u=="object"&&n(u,c),p.state=function(){return n(c,{})}),p}function a(){var i=4022871197,l=function(c){c=String(c);for(var u=0;u<c.length;u++){i+=c.charCodeAt(u);var p=.02519603282416938*i;i=p>>>0,p-=i,p*=i,i=p>>>0,p-=i,i+=p*4294967296}return(i>>>0)*23283064365386963e-26};return l}t&&t.exports?t.exports=s:e&&e.amd?e(function(){return s}):this.alea=s})(U0,typeof gg=="object"&&gg,typeof define=="function"&&define)});var q0=gr((K0,xg)=>{(function(r,t,e){function o(a){var i=this,l="";i.x=0,i.y=0,i.z=0,i.w=0,i.next=function(){var u=i.x^i.x<<11;return i.x=i.y,i.y=i.z,i.z=i.w,i.w^=i.w>>>19^u^u>>>8},a===(a|0)?i.x=a:l+=a;for(var c=0;c<l.length+64;c++)i.x^=l.charCodeAt(c)|0,i.next()}function n(a,i){return i.x=a.x,i.y=a.y,i.z=a.z,i.w=a.w,i}function s(a,i){var l=new o(a),c=i&&i.state,u=function(){return(l.next()>>>0)/4294967296};return u.double=function(){do var p=l.next()>>>11,m=(l.next()>>>0)/4294967296,f=(p+m)/(1<<21);while(f===0);return f},u.int32=l.next,u.quick=u,c&&(typeof c=="object"&&n(c,l),u.state=function(){return n(l,{})}),u}t&&t.exports?t.exports=s:e&&e.amd?e(function(){return s}):this.xor128=s})(K0,typeof xg=="object"&&xg,typeof define=="function"&&define)});var X0=gr((j0,yg)=>{(function(r,t,e){function o(a){var i=this,l="";i.next=function(){var u=i.x^i.x>>>2;return i.x=i.y,i.y=i.z,i.z=i.w,i.w=i.v,(i.d=i.d+362437|0)+(i.v=i.v^i.v<<4^(u^u<<1))|0},i.x=0,i.y=0,i.z=0,i.w=0,i.v=0,a===(a|0)?i.x=a:l+=a;for(var c=0;c<l.length+64;c++)i.x^=l.charCodeAt(c)|0,c==l.length&&(i.d=i.x<<10^i.x>>>4),i.next()}function n(a,i){return i.x=a.x,i.y=a.y,i.z=a.z,i.w=a.w,i.v=a.v,i.d=a.d,i}function s(a,i){var l=new o(a),c=i&&i.state,u=function(){return(l.next()>>>0)/4294967296};return u.double=function(){do var p=l.next()>>>11,m=(l.next()>>>0)/4294967296,f=(p+m)/(1<<21);while(f===0);return f},u.int32=l.next,u.quick=u,c&&(typeof c=="object"&&n(c,l),u.state=function(){return n(l,{})}),u}t&&t.exports?t.exports=s:e&&e.amd?e(function(){return s}):this.xorwow=s})(j0,typeof yg=="object"&&yg,typeof define=="function"&&define)});var Q0=gr((Y0,bg)=>{(function(r,t,e){function o(a){var i=this;i.next=function(){var c=i.x,u=i.i,p,m,f;return p=c[u],p^=p>>>7,m=p^p<<24,p=c[u+1&7],m^=p^p>>>10,p=c[u+3&7],m^=p^p>>>3,p=c[u+4&7],m^=p^p<<7,p=c[u+7&7],p=p^p<<13,m^=p^p<<9,c[u]=m,i.i=u+1&7,m};function l(c,u){var p,m,f=[];if(u===(u|0))m=f[0]=u;else for(u=""+u,p=0;p<u.length;++p)f[p&7]=f[p&7]<<15^u.charCodeAt(p)+f[p+1&7]<<13;for(;f.length<8;)f.push(0);for(p=0;p<8&&f[p]===0;++p);for(p==8?m=f[7]=-1:m=f[p],c.x=f,c.i=0,p=256;p>0;--p)c.next()}l(i,a)}function n(a,i){return i.x=a.x.slice(),i.i=a.i,i}function s(a,i){a==null&&(a=+new Date);var l=new o(a),c=i&&i.state,u=function(){return(l.next()>>>0)/4294967296};return u.double=function(){do var p=l.next()>>>11,m=(l.next()>>>0)/4294967296,f=(p+m)/(1<<21);while(f===0);return f},u.int32=l.next,u.quick=u,c&&(c.x&&n(c,l),u.state=function(){return n(l,{})}),u}t&&t.exports?t.exports=s:e&&e.amd?e(function(){return s}):this.xorshift7=s})(Y0,typeof bg=="object"&&bg,typeof define=="function"&&define)});var J0=gr((Z0,wg)=>{(function(r,t,e){function o(a){var i=this;i.next=function(){var c=i.w,u=i.X,p=i.i,m,f;return i.w=c=c+1640531527|0,f=u[p+34&127],m=u[p=p+1&127],f^=f<<13,m^=m<<17,f^=f>>>15,m^=m>>>12,f=u[p]=f^m,i.i=p,f+(c^c>>>16)|0};function l(c,u){var p,m,f,d,g,h=[],x=128;for(u===(u|0)?(m=u,u=null):(u=u+"\0",m=0,x=Math.max(x,u.length)),f=0,d=-32;d<x;++d)u&&(m^=u.charCodeAt((d+32)%u.length)),d===0&&(g=m),m^=m<<10,m^=m>>>15,m^=m<<4,m^=m>>>13,d>=0&&(g=g+1640531527|0,p=h[d&127]^=m+g,f=p==0?f+1:0);for(f>=128&&(h[(u&&u.length||0)&127]=-1),f=127,d=512;d>0;--d)m=h[f+34&127],p=h[f=f+1&127],m^=m<<13,p^=p<<17,m^=m>>>15,p^=p>>>12,h[f]=m^p;c.w=g,c.X=h,c.i=f}l(i,a)}function n(a,i){return i.i=a.i,i.w=a.w,i.X=a.X.slice(),i}function s(a,i){a==null&&(a=+new Date);var l=new o(a),c=i&&i.state,u=function(){return(l.next()>>>0)/4294967296};return u.double=function(){do var p=l.next()>>>11,m=(l.next()>>>0)/4294967296,f=(p+m)/(1<<21);while(f===0);return f},u.int32=l.next,u.quick=u,c&&(c.X&&n(c,l),u.state=function(){return n(l,{})}),u}t&&t.exports?t.exports=s:e&&e.amd?e(function(){return s}):this.xor4096=s})(Z0,typeof wg=="object"&&wg,typeof define=="function"&&define)});var ew=gr((tw,vg)=>{(function(r,t,e){function o(a){var i=this,l="";i.next=function(){var u=i.b,p=i.c,m=i.d,f=i.a;return u=u<<25^u>>>7^p,p=p-m|0,m=m<<24^m>>>8^f,f=f-u|0,i.b=u=u<<20^u>>>12^p,i.c=p=p-m|0,i.d=m<<16^p>>>16^f,i.a=f-u|0},i.a=0,i.b=0,i.c=-1640531527,i.d=1367130551,a===Math.floor(a)?(i.a=a/4294967296|0,i.b=a|0):l+=a;for(var c=0;c<l.length+20;c++)i.b^=l.charCodeAt(c)|0,i.next()}function n(a,i){return i.a=a.a,i.b=a.b,i.c=a.c,i.d=a.d,i}function s(a,i){var l=new o(a),c=i&&i.state,u=function(){return(l.next()>>>0)/4294967296};return u.double=function(){do var p=l.next()>>>11,m=(l.next()>>>0)/4294967296,f=(p+m)/(1<<21);while(f===0);return f},u.int32=l.next,u.quick=u,c&&(typeof c=="object"&&n(c,l),u.state=function(){return n(l,{})}),u}t&&t.exports?t.exports=s:e&&e.amd?e(function(){return s}):this.tychei=s})(tw,typeof vg=="object"&&vg,typeof define=="function"&&define)});var rw=gr(()=>{});var nw=gr((ow,xp)=>{(function(r,t,e){var o=256,n=6,s=52,a="random",i=e.pow(o,n),l=e.pow(2,s),c=l*2,u=o-1,p;function m(C,S,I){var $=[];S=S==!0?{entropy:!0}:S||{};var R=h(g(S.entropy?[C,b(t)]:C??x(),3),$),A=new f($),F=function(){for(var _=A.g(n),O=i,M=0;_<l;)_=(_+M)*o,O*=o,M=A.g(1);for(;_>=c;)_/=2,O/=2,M>>>=1;return(_+M)/O};return F.int32=function(){return A.g(4)|0},F.quick=function(){return A.g(4)/4294967296},F.double=F,h(b(A.S),t),(S.pass||I||function(_,O,M,P){return P&&(P.S&&d(P,A),_.state=function(){return d(A,{})}),M?(e[a]=_,O):_})(F,R,"global"in S?S.global:this==e,S.state)}function f(C){var S,I=C.length,$=this,R=0,A=$.i=$.j=0,F=$.S=[];for(I||(C=[I++]);R<o;)F[R]=R++;for(R=0;R<o;R++)F[R]=F[A=u&A+C[R%I]+(S=F[R])],F[A]=S;($.g=function(_){for(var O,M=0,P=$.i,B=$.j,V=$.S;_--;)O=V[P=u&P+1],M=M*o+V[u&(V[P]=V[B=u&B+O])+(V[B]=O)];return $.i=P,$.j=B,M})(o)}function d(C,S){return S.i=C.i,S.j=C.j,S.S=C.S.slice(),S}function g(C,S){var I=[],$=typeof C,R;if(S&&$=="object")for(R in C)try{I.push(g(C[R],S-1))}catch{}return I.length?I:$=="string"?C:C+"\0"}function h(C,S){for(var I=C+"",$,R=0;R<I.length;)S[u&R]=u&($^=S[u&R]*19)+I.charCodeAt(R++);return b(S)}function x(){try{var C;return p&&(C=p.randomBytes)?C=C(o):(C=new Uint8Array(o),(r.crypto||r.msCrypto).getRandomValues(C)),b(C)}catch{var S=r.navigator,I=S&&S.plugins;return[+new Date,r,I,r.screen,b(t)]}}function b(C){return String.fromCharCode.apply(0,C)}if(h(e.random(),t),typeof xp=="object"&&xp.exports){xp.exports=m;try{p=rw()}catch{}}else typeof define=="function"&&define.amd?define(function(){return m}):e["seed"+a]=m})(typeof self<"u"?self:ow,[],Math)});var Sg=gr((ist,sw)=>{var GD=H0(),UD=q0(),HD=X0(),KD=Q0(),qD=J0(),jD=ew(),Si=nw();Si.alea=GD;Si.xor128=UD;Si.xorwow=HD;Si.xorshift7=KD;Si.xor4096=qD;Si.tychei=jD;sw.exports=Si});var Op={};kt(Op,{Abs:()=>Ss,Acos:()=>jo,Acosh:()=>Xo,AdadeltaOptimizer:()=>es,AdagradOptimizer:()=>rs,AdamOptimizer:()=>os,AdamaxOptimizer:()=>ns,Add:()=>go,AddN:()=>Cs,All:()=>Zi,Any:()=>Ji,ArgMax:()=>Ts,ArgMin:()=>Ns,Asin:()=>Yo,Asinh:()=>Qo,Atan:()=>Zo,Atan2:()=>tn,Atanh:()=>Jo,AvgPool:()=>Is,AvgPool3D:()=>ks,AvgPool3DGrad:()=>lc,AvgPoolGrad:()=>ic,BatchMatMul:()=>Es,BatchToSpaceND:()=>$s,Bincount:()=>Rs,BitwiseAnd:()=>en,BroadcastArgs:()=>As,BroadcastTo:()=>KR,Cast:()=>xo,Ceil:()=>rn,ClipByValue:()=>on,Complex:()=>Fs,ComplexAbs:()=>_s,Concat:()=>Ds,Conv2D:()=>Os,Conv2DBackpropFilter:()=>Ps,Conv2DBackpropInput:()=>Ms,Conv3D:()=>Ls,Conv3DBackpropFilterV2:()=>cc,Conv3DBackpropInputV2:()=>Bs,Cos:()=>Vs,Cosh:()=>nn,CropAndResize:()=>Gs,Cumprod:()=>zs,Cumsum:()=>Ws,DataStorage:()=>Ho,DenseBincount:()=>Us,DepthToSpace:()=>Hs,DepthwiseConv2dNative:()=>Ks,DepthwiseConv2dNativeBackpropFilter:()=>qs,DepthwiseConv2dNativeBackpropInput:()=>js,Diag:()=>Xs,Dilation2D:()=>Ys,Dilation2DBackpropFilter:()=>ju,Dilation2DBackpropInput:()=>qu,Draw:()=>tl,ENV:()=>Ku,Einsum:()=>Qs,Elu:()=>Zs,EluGrad:()=>uc,Environment:()=>Qi,Equal:()=>an,Erf:()=>Js,Exp:()=>ta,ExpandDims:()=>ea,Expm1:()=>ln,FFT:()=>el,Fill:()=>ra,FlipLeftRight:()=>oa,Floor:()=>cn,FloorDiv:()=>un,FromPixels:()=>il,FusedBatchNorm:()=>na,FusedConv2D:()=>Wn,FusedDepthwiseConv2D:()=>Gn,GatherNd:()=>aa,GatherV2:()=>sa,Greater:()=>pn,GreaterEqual:()=>mn,IFFT:()=>ia,Identity:()=>yo,Imag:()=>la,IsFinite:()=>fn,IsInf:()=>dn,IsNan:()=>hn,KernelBackend:()=>Wr,LRN:()=>rl,LRNGrad:()=>pc,LeakyRelu:()=>ca,Less:()=>gn,LessEqual:()=>xn,LinSpace:()=>ua,Log:()=>pa,Log1p:()=>yn,LogSoftmax:()=>jR,LogicalAnd:()=>bn,LogicalNot:()=>wn,LogicalOr:()=>vn,LogicalXor:()=>qR,LowerBound:()=>XR,MatrixBandPart:()=>YR,Max:()=>ol,MaxPool:()=>ma,MaxPool3D:()=>fa,MaxPool3DGrad:()=>fc,MaxPoolGrad:()=>mc,MaxPoolWithArgmax:()=>da,Maximum:()=>Sn,Mean:()=>ha,Min:()=>nl,Minimum:()=>Cn,MirrorPad:()=>ga,Mod:()=>xa,MomentumOptimizer:()=>ss,Multinomial:()=>ya,Multiply:()=>Tn,Neg:()=>sl,NonMaxSuppressionV3:()=>ba,NonMaxSuppressionV4:()=>wa,NonMaxSuppressionV5:()=>va,NotEqual:()=>Nn,OP_SCOPE_SUFFIX:()=>sp,OneHot:()=>Ca,OnesLike:()=>Sa,Optimizer:()=>Oe,OptimizerConstructors:()=>El,Pack:()=>Ta,PadV2:()=>Na,Pool:()=>QR,Pow:()=>Ia,Prelu:()=>ka,Prod:()=>Ea,RMSPropOptimizer:()=>as,RaggedGather:()=>$a,RaggedRange:()=>Ra,RaggedTensorToTensor:()=>Aa,Range:()=>Fa,Rank:()=>ep,Real:()=>_a,RealDiv:()=>sn,Reciprocal:()=>In,Reduction:()=>Jt,Relu:()=>kn,Relu6:()=>En,Reshape:()=>Da,ResizeBilinear:()=>Pa,ResizeBilinearGrad:()=>hc,ResizeNearestNeighbor:()=>Oa,ResizeNearestNeighborGrad:()=>dc,Reverse:()=>Ma,RotateWithOffset:()=>ui,Round:()=>$n,Rsqrt:()=>Rn,SGDOptimizer:()=>no,ScatterNd:()=>La,SearchSorted:()=>Va,Select:()=>za,Selu:()=>An,Sigmoid:()=>Dn,Sign:()=>_n,Sin:()=>Ga,Sinh:()=>Fn,Slice:()=>Wa,Softmax:()=>Ka,Softplus:()=>On,SpaceToBatchND:()=>Ua,SparseFillEmptyRows:()=>qa,SparseReshape:()=>ja,SparseSegmentMean:()=>Xa,SparseSegmentSum:()=>Ya,SparseToDense:()=>Qa,SplitV:()=>Ha,Sqrt:()=>Pn,Square:()=>gc,SquaredDifference:()=>Mn,StaticRegexReplace:()=>Ln,Step:()=>Vn,StridedSlice:()=>Za,StringNGrams:()=>Ja,StringSplit:()=>ti,StringToHashBucketFast:()=>ei,Sub:()=>ri,Sum:()=>al,Tan:()=>oi,Tanh:()=>Bn,Tensor:()=>Nt,TensorBuffer:()=>$t,TensorScatterUpdate:()=>Ba,Tile:()=>bo,TopK:()=>ni,Transform:()=>si,Transpose:()=>wo,Unique:()=>ai,Unpack:()=>ii,UnsortedSegmentSum:()=>li,UpperBound:()=>ZR,Variable:()=>Kr,ZerosLike:()=>ci,_FusedMatMul:()=>zn,abs:()=>he,acos:()=>Qd,acosh:()=>Zd,add:()=>Z,addN:()=>Jd,all:()=>th,any:()=>eh,argMax:()=>$c,argMin:()=>rh,asin:()=>oh,asinh:()=>nh,atan:()=>sh,atan2:()=>ah,atanh:()=>ih,avgPool:()=>Fc,avgPool3d:()=>ph,backend:()=>To,backend_util:()=>N,basicLSTMCell:()=>mh,batchNorm:()=>Io,batchNorm2d:()=>fh,batchNorm3d:()=>dh,batchNorm4d:()=>hh,batchToSpaceND:()=>_c,bincount:()=>Dc,bitwiseAnd:()=>gh,booleanMaskAsync:()=>cw,broadcastArgs:()=>xh,broadcastTo:()=>ko,broadcast_util:()=>_r,browser:()=>Oo,buffer:()=>ot,cast:()=>xt,ceil:()=>yh,clipByValue:()=>Oc,clone:()=>qe,complex:()=>Le,concat:()=>Lt,concat1d:()=>bh,concat2d:()=>wh,concat3d:()=>vh,concat4d:()=>Sh,conv1d:()=>Ch,conv2d:()=>Eo,conv2dTranspose:()=>Th,conv3d:()=>Nh,conv3dTranspose:()=>Ih,copyRegisteredKernels:()=>oA,cos:()=>kh,cosh:()=>Eh,cosineWindow:()=>Nl,cumprod:()=>$h,cumsum:()=>Rh,customGrad:()=>Fe,denseBincount:()=>Ah,deprecationWarn:()=>l0,depthToSpace:()=>Fh,depthwiseConv2d:()=>wi,device_util:()=>vo,diag:()=>_h,dilation2d:()=>Dh,disableDeprecationWarnings:()=>EA,dispose:()=>Tt,disposeVariables:()=>$A,div:()=>mt,divNoNan:()=>Oh,dot:()=>Ph,dropout:()=>gw,einsum:()=>$o,elu:()=>Mc,enableDebugMode:()=>kA,enableProdMode:()=>IA,enclosingPowerOfTwo:()=>Sp,engine:()=>Re,ensureShape:()=>Mh,env:()=>D,equal:()=>Pc,erf:()=>Lh,euclideanNorm:()=>Vh,exp:()=>We,expandDims:()=>Ne,expm1:()=>zh,eye:()=>Lc,fft:()=>Ni,fill:()=>Fr,findBackend:()=>PA,findBackendFactory:()=>MA,floor:()=>Bc,floorDiv:()=>Ec,fused:()=>Cp,gather:()=>Vc,gatherND:()=>dw,gather_util:()=>xx,getBackend:()=>qn,getGradient:()=>Xu,getKernel:()=>pi,getKernelsForBackend:()=>yc,grad:()=>V0,grads:()=>z0,greater:()=>Qn,greaterEqual:()=>zc,ifft:()=>ts,imag:()=>Fo,image:()=>oo,inTopKAsync:()=>xw,io:()=>kl,irfft:()=>ou,isFinite:()=>Wh,isInf:()=>Gh,isNaN:()=>Uh,keep:()=>Ve,kernel_impls:()=>be,leakyRelu:()=>Wc,less:()=>vl,lessEqual:()=>vi,linalg:()=>pv,linspace:()=>Hh,localResponseNormalization:()=>Kh,log:()=>Jr,log1p:()=>Gc,logSigmoid:()=>qh,logSoftmax:()=>jh,logSumExp:()=>Hc,logicalAnd:()=>Zn,logicalNot:()=>Kc,logicalOr:()=>qc,logicalXor:()=>Xh,losses:()=>mv,lowerBound:()=>Yh,matMul:()=>Et,math:()=>gx,max:()=>Dr,maxPool:()=>jc,maxPool3d:()=>Qh,maxPoolWithArgmax:()=>Zh,maximum:()=>Xc,mean:()=>Jn,memory:()=>RA,meshgrid:()=>Jh,min:()=>wl,minimum:()=>to,mirrorPad:()=>Yc,mod:()=>tg,moments:()=>eg,movingAverage:()=>uw,mul:()=>K,multiRNNCell:()=>rg,multinomial:()=>og,neg:()=>ye,nextFrame:()=>_p,norm:()=>Yn,notEqual:()=>Qc,oneHot:()=>Cl,ones:()=>Or,onesLike:()=>ng,op:()=>T,outerProduct:()=>sg,pad:()=>Ye,pad1d:()=>ag,pad2d:()=>ig,pad3d:()=>lg,pad4d:()=>cg,pool:()=>ug,pow:()=>Zr,prelu:()=>Jc,print:()=>kc,prod:()=>pg,profile:()=>AA,raggedGather:()=>mg,raggedRange:()=>fg,raggedTensorToTensor:()=>dg,rand:()=>hg,randomGamma:()=>kg,randomNormal:()=>tu,randomStandardNormal:()=>Eg,randomUniform:()=>Ti,randomUniformInt:()=>$g,range:()=>_o,ready:()=>DA,real:()=>eo,reciprocal:()=>Rg,registerBackend:()=>Nc,registerGradient:()=>tA,registerKernel:()=>cl,relu:()=>Do,relu6:()=>eu,removeBackend:()=>OA,reshape:()=>L,reverse:()=>ar,reverse1d:()=>Ag,reverse2d:()=>Fg,reverse3d:()=>_g,reverse4d:()=>Dg,rfft:()=>Ii,round:()=>ru,rsqrt:()=>Og,scalar:()=>it,scatterND:()=>pw,scatter_util:()=>iu,searchSorted:()=>Sl,selu:()=>Pg,separableConv2d:()=>Mg,serialization:()=>cx,setBackend:()=>_A,setPlatform:()=>LA,setdiff1dAsync:()=>Lg,sigmoid:()=>je,sign:()=>Bg,signal:()=>uv,sin:()=>Vg,sinh:()=>zg,slice:()=>ft,slice1d:()=>Wg,slice2d:()=>Gg,slice3d:()=>Ug,slice4d:()=>Hg,slice_util:()=>me,softmax:()=>Kg,softplus:()=>Uc,spaceToBatchND:()=>Zc,sparse:()=>fv,sparseToDense:()=>fw,spectral:()=>cv,split:()=>ro,sqrt:()=>ze,square:()=>ue,squaredDifference:()=>nu,squeeze:()=>Pt,stack:()=>_e,step:()=>su,stridedSlice:()=>qg,string:()=>dv,sub:()=>lt,sum:()=>Ft,sumOutType:()=>Kn,tan:()=>jg,tanh:()=>bl,tensor:()=>$e,tensor1d:()=>Zt,tensor2d:()=>De,tensor3d:()=>au,tensor4d:()=>Xg,tensor5d:()=>Yg,tensor6d:()=>Qg,tensorScatterUpdate:()=>Jg,tensor_util:()=>Md,test_util:()=>Ig,tidy:()=>at,tile:()=>Ao,time:()=>FA,topk:()=>tx,train:()=>D3,transpose:()=>ki,truncatedNormal:()=>ex,unique:()=>rx,unregisterGradient:()=>rA,unregisterKernel:()=>eA,unsortedSegmentSum:()=>ox,unstack:()=>ir,upcastType:()=>se,upperBound:()=>nx,util:()=>y,valueAndGrad:()=>W0,valueAndGrads:()=>G0,variable:()=>sx,variableGrads:()=>dp,version_core:()=>Bv,where:()=>sr,whereAsync:()=>lu,zeros:()=>Xe,zerosLike:()=>ce});var Ho=class{constructor(t,e){this.backend=t,this.dataMover=e,this.data=new WeakMap,this.dataIdsCount=0}get(t){return this.data.has(t)||this.dataMover.moveData(this.backend,t),this.data.get(t)}set(t,e){this.dataIdsCount++,this.data.set(t,e)}has(t){return this.data.has(t)}delete(t){return this.dataIdsCount--,this.data.delete(t)}numDataIds(){return this.dataIdsCount}},Wr=class{refCount(t){return rr("refCount")}incRef(t){return rr("incRef")}timerAvailable(){return!0}time(t){return rr("time")}read(t){return rr("read")}readSync(t){return rr("readSync")}readToGPU(t,e){return rr("readToGPU")}numDataIds(){return rr("numDataIds")}disposeData(t,e){return rr("disposeData")}write(t,e,o){return rr("write")}move(t,e,o,n,s){return rr("move")}createTensorFromGPUData(t,e,o){return rr("createTensorFromGPUData")}memory(){return rr("memory")}floatPrecision(){return rr("floatPrecision")}epsilon(){return this.floatPrecision()===32?1e-7:1e-4}dispose(){return rr("dispose")}};function rr(r){throw new Error(`'${r}' not yet implemented or not found in the registry. This kernel may not be supported by the tfjs backend you have chosen`)}function Rb(r){let t=r.length,e=0;for(;t>0;)e=Math.random()*t|0,t--,Uu(r,t,e)}function NR(r,t){if(r.length!==t.length)throw new Error(`Array sizes must match to be shuffled together First array length was ${r.length}Second array length was ${t.length}`);let e=r.length,o=0;for(;e>0;)o=Math.random()*e|0,e--,Uu(r,e,o),Uu(t,e,o)}function qi(r,t,e){return Math.max(r,Math.min(t,e))}function IR(r){return r%2===0?r:r+1}function Uu(r,t,e){let o=r[t];r[t]=r[e],r[e]=o}function kR(r){let t=0;for(let e=0;e<r.length;e++)t+=r[e];return t}function ER(r,t){let e=Math.random();return t*e+(1-e)*r}function $R(r,t){let e=0;for(let o=0;o<r.length;o++){let n=Number(r[o])-Number(t[o]);e+=n*n}return e}function E(r,t){if(!r)throw new Error(typeof t=="string"?t:t())}function zt(r,t,e=""){E(Pe(r,t),()=>e+` Shapes ${r} and ${t} must match`)}function dr(r){E(r!=null,()=>"The input to the tensor constructor must be a non-null value.")}function bt(r){if(r.length===0)return 1;let t=r[0];for(let e=1;e<r.length;e++)t*=r[e];return t}function RR(r){return r.length===0}function gd(r,t){if(r===t)return!0;if(r==null||t==null||r.length!==t.length)return!1;for(let e=0;e<r.length;e++)if(r[e]!==null&&t[e]!==null&&r[e]!==t[e])return!1;return!0}function Pe(r,t){if(r===t)return!0;if(r==null||t==null||r.length!==t.length)return!1;for(let e=0;e<r.length;e++)if(r[e]!==t[e])return!1;return!0}function ho(r){return r%1===0}function AR(r){if(Math.tanh!=null)return Math.tanh(r);if(r===1/0)return 1;if(r===-1/0)return-1;{let t=Math.exp(2*r);return(t-1)/(t+1)}}function FR(r){let t=Math.ceil(Math.sqrt(r));return[t,Math.ceil(r/t)]}function _R(r){let t=new Uint32Array(r);for(let e=0;e<r;++e)t[e]=e;return Rb(t),t}function ws(r,t){return t<=r.length?r:r+" ".repeat(t-r.length)}function DR(r,t=n=>0,e,o){return new Promise((n,s)=>{let a=0,i=()=>{if(r()){n();return}a++;let l=t(a);if(e!=null&&a>=e){s();return}o!=null?o(i,l):setTimeout(i,l)};i()})}function OR(r,t){let e=1,o=-1;for(let s=0;s<r.length;++s)if(r[s]>=0)e*=r[s];else if(r[s]===-1){if(o!==-1)throw Error(`Shapes can only have 1 implicit size. Found -1 at dim ${o} and dim ${s}`);o=s}else if(r[s]<0)throw Error(`Shapes can not be < 0. Found ${r[s]} at dim ${s}`);if(o===-1){if(t>0&&t!==e)throw Error(`Size(${t}) must match the product of shape ${r}`);return r}if(e===0)throw Error(`Cannot infer the missing size in [${r}] when there are 0 elements`);if(t%e!==0)throw Error(`The implicit shape can't be a fractional number. Got ${t} / ${e}`);let n=r.slice();return n[o]=t/e,n}function Ko(r,t){let e=t.length;return r=r==null?t.map((o,n)=>n):[].concat(r),E(r.every(o=>o>=-e&&o<e),()=>`All values in axis param must be in range [-${e}, ${e}) but got axis ${r}`),E(r.every(o=>ho(o)),()=>`All values in axis param must be integers but got axis ${r}`),r.map(o=>o<0?e+o:o)}function xd(r,t){let e=[],o=[],n=t!=null&&Array.isArray(t)&&t.length===0,s=t==null||n?null:Ko(t,r).sort(),a=0;for(let i=0;i<r.length;++i){if(s!=null){if(s[a]===i&&r[i]!==1)throw new Error(`Can't squeeze axis ${i} since its dim '${r[i]}' is not 1`);(s[a]==null||s[a]>i)&&r[i]===1&&(e.push(r[i]),o.push(i)),s[a]<=i&&a++}r[i]!==1&&(e.push(r[i]),o.push(i))}return{newShape:e,keptDims:o}}function yd(r,t){return Hu(r,t)}function Hu(r,t){let e=null;if(r==null||r==="float32")e=new Float32Array(t);else if(r==="int32")e=new Int32Array(t);else if(r==="bool")e=new Uint8Array(t);else if(r==="string")e=new Array(t);else throw new Error(`Unknown data type ${r}`);return e}function bd(r,t){for(let e=0;e<r.length;e++){let o=r[e];if(isNaN(o)||!isFinite(o))throw Error(`A tensor of type ${t} being uploaded contains ${o}.`)}}function wd(r){return r==="bool"||r==="complex64"||r==="float32"||r==="int32"||r==="string"}function PR(r,t){return!(t==="complex64"||t==="float32"&&r!=="complex64"||t==="int32"&&r!=="float32"&&r!=="complex64"||t==="bool"&&r==="bool")}function ji(r){if(r==="float32"||r==="int32")return 4;if(r==="complex64")return 8;if(r==="bool")return 1;throw new Error(`Unknown dtype ${r}`)}function vd(r){if(r==null)return 0;let t=0;return r.forEach(e=>t+=e.length),t}function kr(r){return typeof r=="string"||r instanceof String}function Ab(r){return typeof r=="boolean"}function Fb(r){return typeof r=="number"}function qo(r){return Array.isArray(r)?qo(r[0]):r instanceof Float32Array?"float32":r instanceof Int32Array||r instanceof Uint8Array||r instanceof Uint8ClampedArray?"int32":Fb(r)?"float32":kr(r)?"string":Ab(r)?"bool":"float32"}function Gr(r){return!!(r&&r.constructor&&r.call&&r.apply)}function Xi(r,t){for(let e=t;e<r;++e)if(r%e===0)return e;return r}function Ur(r){let t=r.length;if(t<2)return[];let e=new Array(t-1);e[t-2]=r[t-1];for(let o=t-3;o>=0;--o)e[o]=e[o+1]*r[o+1];return e}function _b(r,t,e,o=!1){let n=new Array;if(t.length===1){let s=t[0]*(o?2:1);for(let a=0;a<s;a++)n[a]=e[r+a]}else{let s=t[0],a=t.slice(1),i=a.reduce((l,c)=>l*c)*(o?2:1);for(let l=0;l<s;l++)n[l]=_b(r+l*i,a,e,o)}return n}function bs(r,t,e=!1){if(r.length===0)return t[0];let o=r.reduce((n,s)=>n*s)*(e?2:1);if(o===0)return[];if(o!==t.length)throw new Error(`[${r}] does not match the input size ${t.length}${e?" for a complex tensor":""}.`);return _b(0,r,t,e)}function MR(r,t){if(Array.isArray(r))return r;if(t==="float32")return r instanceof Float32Array?r:new Float32Array(r);if(t==="int32")return r instanceof Int32Array?r:new Int32Array(r);if(t==="bool"||t==="string")return Uint8Array.from(new Int32Array(r));throw new Error(`Unknown dtype ${t}`)}function sc(r,t){let e=Yi(r,t);for(let o=0;o<e.length;o++)e[o]=1;return e}function Yi(r,t){if(t==null||t==="float32"||t==="complex64")return new Float32Array(r);if(t==="int32")return new Int32Array(r);if(t==="bool")return new Uint8Array(r);throw new Error(`Unknown data type ${t}`)}function LR(r,t){let e=r.reduce((o,n)=>o*n,1);if(t==null||t==="float32")return bs(r,new Float32Array(e));if(t==="int32")return bs(r,new Int32Array(e));if(t==="bool")return bs(r,new Uint8Array(e));throw new Error(`Unknown data type ${t}`)}function Kt(r){r.forEach(t=>{E(Number.isInteger(t)&&t>=0,()=>`Tensor must have a shape comprised of positive integers but got shape [${r}].`)})}function BR(r,t,e){if(t===0)return 0;if(t===1)return r[0];let o=r[r.length-1];for(let n=0;n<r.length-1;++n)o+=e[n]*r[n];return o}function VR(r,t,e){if(t===0)return[];if(t===1)return[r];let o=new Array(t);for(let n=0;n<o.length-1;++n)o[n]=Math.floor(r/e[n]),r-=o[n]*e[n];return o[o.length-1]=r,o}function vs(r){return r&&r.then&&typeof r.then=="function"}var Db="tfjsflags",Qi=class{constructor(t){this.global=t,this.flags={},this.flagRegistry={},this.urlFlags={},this.getQueryParams=WR,this.populateURLFlags()}setPlatform(t,e){this.platform!=null&&(D().getBool("IS_TEST")||D().getBool("PROD")||console.warn(`Platform ${this.platformName} has already been set. Overwriting the platform with ${t}.`)),this.platformName=t,this.platform=e}registerFlag(t,e,o){if(this.flagRegistry[t]={evaluationFn:e,setHook:o},this.urlFlags[t]!=null){let n=this.urlFlags[t];D().getBool("IS_TEST")||D().getBool("PROD")||console.warn(`Setting feature override from URL ${t}: ${n}.`),this.set(t,n)}}async getAsync(t){return t in this.flags?this.flags[t]:(this.flags[t]=await this.evaluateFlag(t),this.flags[t])}get(t){if(t in this.flags)return this.flags[t];let e=this.evaluateFlag(t);if(vs(e))throw new Error(`Flag ${t} cannot be synchronously evaluated. Please use getAsync() instead.`);return this.flags[t]=e,this.flags[t]}getNumber(t){return this.get(t)}getBool(t){return this.get(t)}getString(t){return this.get(t)}getFlags(){return this.flags}get features(){return this.flags}set(t,e){if(this.flagRegistry[t]==null)throw new Error(`Cannot set flag ${t} as it has not been registered.`);this.flags[t]=e,this.flagRegistry[t].setHook!=null&&this.flagRegistry[t].setHook(e)}evaluateFlag(t){if(this.flagRegistry[t]==null)throw new Error(`Cannot evaluate flag '${t}': no evaluation function found.`);return this.flagRegistry[t].evaluationFn()}setFlags(t){this.flags=Object.assign({},t)}reset(){this.flags={},this.urlFlags={},this.populateURLFlags()}populateURLFlags(){if(typeof this.global>"u"||typeof this.global.location>"u"||typeof this.global.location.search>"u")return;let t=this.getQueryParams(this.global.location.search);Db in t&&t[Db].split(",").forEach(o=>{let[n,s]=o.split(":");this.urlFlags[n]=UR(n,s)})}};function WR(r){let t={};return r.replace(/[?&]([^=?&]+)(?:=([^&]*))?/g,(e,...o)=>(GR(t,o[0],o[1]),o.join("="))),t}function GR(r,t,e){r[decodeURIComponent(t)]=decodeURIComponent(e||"")}function UR(r,t){let e=t.toLowerCase();return e==="true"||e==="false"?e==="true":`${+e}`===e?+e:t}function D(){return Ku}var Ku=null;function Ob(r){Ku=r}var Sd;function Cd(){if(Sd==null){let r;if(typeof window<"u")r=window;else if(typeof global<"u")r=global;else if(typeof process<"u")r=process;else if(typeof self<"u")r=self;else throw new Error("Could not find a global object");Sd=r}return Sd}function HR(){let r=Cd();return r._tfGlobals==null&&(r._tfGlobals=new Map),r._tfGlobals}function ac(r,t){let e=HR();if(e.has(r))return e.get(r);{let o=t();return e.set(r,o),e.get(r)}}var Ss="Abs",jo="Acos",Xo="Acosh",go="Add",Cs="AddN",Zi="All",Ji="Any",Ts="ArgMax",Ns="ArgMin",Yo="Asin",Qo="Asinh",Zo="Atan",Jo="Atanh",tn="Atan2",Is="AvgPool",ic="AvgPoolGrad",ks="AvgPool3D",lc="AvgPool3DGrad",Es="BatchMatMul",$s="BatchToSpaceND",Rs="Bincount",en="BitwiseAnd",KR="BroadcastTo",As="BroadcastArgs",xo="Cast",rn="Ceil",on="ClipByValue",Fs="Complex",_s="ComplexAbs",Ds="Concat",Os="Conv2D",Ps="Conv2DBackpropFilter",Ms="Conv2DBackpropInput",Ls="Conv3D",cc="Conv3DBackpropFilterV2",Bs="Conv3DBackpropInputV2",Vs="Cos",nn="Cosh",zs="Cumprod",Ws="Cumsum",Gs="CropAndResize",Us="DenseBincount",Hs="DepthToSpace",Ks="DepthwiseConv2dNative",qs="DepthwiseConv2dNativeBackpropFilter",js="DepthwiseConv2dNativeBackpropInput",Xs="Diag",Ys="Dilation2D",qu="Dilation2DBackpropInput",ju="Dilation2DBackpropFilter",tl="Draw",sn="RealDiv",Qs="Einsum",Zs="Elu",uc="EluGrad",Js="Erf",an="Equal",ta="Exp",ea="ExpandDims",ln="Expm1",el="FFT",ra="Fill",oa="FlipLeftRight",cn="Floor",un="FloorDiv",na="FusedBatchNorm",sa="GatherV2",aa="GatherNd",pn="Greater",mn="GreaterEqual",yo="Identity",ia="IFFT",la="Imag",fn="IsFinite",dn="IsInf",hn="IsNan",ca="LeakyRelu",gn="Less",xn="LessEqual",ua="LinSpace",pa="Log",yn="Log1p",bn="LogicalAnd",wn="LogicalNot",vn="LogicalOr",qR="LogicalXor",jR="LogSoftmax",XR="LowerBound",rl="LRN",pc="LRNGrad",YR="MatrixBandPart",ol="Max",Sn="Maximum",ma="MaxPool",mc="MaxPoolGrad",fa="MaxPool3D",fc="MaxPool3DGrad",da="MaxPoolWithArgmax",ha="Mean",nl="Min",Cn="Minimum",ga="MirrorPad",xa="Mod",ya="Multinomial",Tn="Multiply",sl="Neg",Nn="NotEqual",ba="NonMaxSuppressionV3",wa="NonMaxSuppressionV4",va="NonMaxSuppressionV5",Sa="OnesLike",Ca="OneHot",Ta="Pack",Na="PadV2",QR="Pool",Ia="Pow",ka="Prelu",Ea="Prod",$a="RaggedGather",Ra="RaggedRange",Aa="RaggedTensorToTensor",Fa="Range",_a="Real",In="Reciprocal",kn="Relu",Da="Reshape",Oa="ResizeNearestNeighbor",dc="ResizeNearestNeighborGrad",Pa="ResizeBilinear",hc="ResizeBilinearGrad",En="Relu6",Ma="Reverse",$n="Round",Rn="Rsqrt",La="ScatterNd",Ba="TensorScatterUpdate",Va="SearchSorted",za="Select",An="Selu",Wa="Slice",Ga="Sin",Fn="Sinh",_n="Sign",Dn="Sigmoid",On="Softplus",Pn="Sqrt",al="Sum",Ua="SpaceToBatchND",Ha="SplitV",Ka="Softmax",qa="SparseFillEmptyRows",ja="SparseReshape",Xa="SparseSegmentMean",Ya="SparseSegmentSum",Qa="SparseToDense",Mn="SquaredDifference",gc="Square",Ln="StaticRegexReplace",Za="StridedSlice",Ja="StringNGrams",ti="StringSplit",ei="StringToHashBucketFast",ri="Sub",oi="Tan",Bn="Tanh",bo="Tile",ni="TopK",si="Transform",wo="Transpose",ai="Unique",ii="Unpack",li="UnsortedSegmentSum",ZR="UpperBound",ci="ZerosLike",Vn="Step",il="FromPixels",ui="RotateWithOffset",zn="_FusedMatMul",Wn="FusedConv2D",Gn="FusedDepthwiseConv2D";function Hr(...r){D().getBool("IS_TEST")||D().getBool("PROD")||console.warn(...r)}function JR(...r){D().getBool("IS_TEST")||D().getBool("PROD")||console.log(...r)}var ll=ac("kernelRegistry",()=>new Map),xc=ac("gradRegistry",()=>new Map);function pi(r,t){let e=Td(r,t);return ll.get(e)}function Xu(r){return xc.get(r)}function yc(r){let t=ll.entries(),e=[];for(;;){let{done:o,value:n}=t.next();if(o)break;let[s,a]=n,[i]=s.split("_");i===r&&e.push(a)}return e}function cl(r){let{kernelName:t,backendName:e}=r,o=Td(t,e);ll.has(o)&&Hr(`The kernel '${t}' for backend '${e}' is already registered`),ll.set(o,r)}function tA(r){let{kernelName:t}=r;xc.has(t)&&D().getBool("DEBUG")&&Hr(`Overriding the gradient for '${t}'`),xc.set(t,r)}function eA(r,t){let e=Td(r,t);if(!ll.has(e))throw new Error(`The kernel '${r}' for backend '${t}' is not registered`);ll.delete(e)}function rA(r){if(!xc.has(r))throw new Error(`The gradient '${r}' for backend is not registered`);xc.delete(r)}function oA(r,t){yc(r).forEach(o=>{let n=Object.assign({},o,{backendName:t});cl(n)})}function Td(r,t){return`${t}_${r}`}var y={};kt(y,{arraysEqual:()=>Pe,arraysEqualWithNull:()=>gd,assert:()=>E,assertNonNegativeIntegerDimensions:()=>Kt,assertNonNull:()=>dr,assertShapesMatch:()=>zt,bytesFromStringArray:()=>vd,bytesPerElement:()=>ji,checkConversionForErrors:()=>bd,clamp:()=>qi,computeStrides:()=>Ur,convertBackendValuesAndArrayBuffer:()=>MR,createScalarValue:()=>uA,createShuffledIndices:()=>_R,decodeString:()=>fl,distSquared:()=>$R,encodeString:()=>Hn,fetch:()=>mA,fingerPrint64:()=>cA,flatten:()=>$r,getArrayFromDType:()=>Hu,getTypedArrayFromDType:()=>yd,hasEncodingLoss:()=>PR,hexToLong:()=>bc,indexToLoc:()=>VR,inferDtype:()=>qo,inferFromImplicitShape:()=>OR,isBoolean:()=>Ab,isFunction:()=>Gr,isInt:()=>ho,isNumber:()=>Fb,isPromise:()=>vs,isScalarShape:()=>RR,isString:()=>kr,isTypedArray:()=>ne,isValidDtype:()=>wd,locToIndex:()=>BR,makeOnesTypedArray:()=>sc,makeZerosNestedTypedArray:()=>LR,makeZerosTypedArray:()=>Yi,nearestDivisor:()=>Xi,nearestLargerEven:()=>IR,now:()=>gi,parseAxisParam:()=>Ko,randUniform:()=>ER,repeatedTry:()=>DR,rightPad:()=>ws,shuffle:()=>Rb,shuffleCombo:()=>NR,sizeFromShape:()=>bt,sizeToSquarishShape:()=>FR,squeezeShape:()=>xd,sum:()=>kR,swap:()=>Uu,tanh:()=>AR,toNestedArray:()=>bs,toTypedArray:()=>ml});function Yu(r){return r instanceof Float32Array||r instanceof Int32Array||r instanceof Uint8Array||r instanceof Uint8ClampedArray}var Ed=hd(qb());var hi=Ed.default||Ed;function bc(r){return hi.fromString(r,!0,16)}var Xb=bc("c3a5c85c97cb3127"),di=bc("b492b66fbe98f273"),Me=bc("9ae16a3b2f90404f");function kd(r){return r.xor(r.shru(47))}function Yb(r,t,e){let o=r.slice(t,t+e);return hi.fromBytes(Array.from(o),!0,!0)}function qt(r,t){return Yb(r,t,8)}function jb(r,t){return Yb(r,t,4)}function xe(r,t){return t===0?r:r.shru(t).or(r.shl(64-t))}function Un(r,t,e=bc("9ddfea08eb382d69")){let o=r.xor(t).mul(e);o=o.xor(o.shru(47));let n=t.xor(o).mul(e);return n=n.xor(n.shru(47)),n=n.mul(e),n}function sA(r,t,e,o,n,s){n=n.add(r),s=xe(s.add(n).add(o),21);let a=n;return n=n.add(t),n=n.add(e),s=s.add(xe(n,44)),[n.add(o),s.add(a)]}function Zu(r,t,e,o){return sA(qt(r,t),qt(r,t+8),qt(r,t+16),qt(r,t+24),e,o)}function aA(r,t=r.length){if(t>=8){let e=Me.add(t*2),o=qt(r,0).add(Me),n=qt(r,t-8),s=xe(n,37).mul(e).add(o),a=xe(o,25).add(n).mul(e);return Un(s,a,e)}if(t>=4){let e=Me.add(t*2),o=jb(r,0);return Un(o.shl(3).add(t),jb(r,t-4),e)}if(t>0){let e=r[0],o=r[t>>1],n=r[t-1],s=e+(o<<8),a=t+(n<<2);return kd(Me.mul(s).xor(Xb.mul(a))).mul(Me)}return Me}function iA(r,t=r.length){let e=Me.add(t*2),o=qt(r,0).mul(di),n=qt(r,8),s=qt(r,t-8).mul(e),a=qt(r,t-16).mul(Me);return Un(xe(o.add(n),43).add(xe(s,30)).add(a),o.add(xe(n.add(Me),18)).add(s),e)}function lA(r,t=r.length){let e=Me.add(t*2),o=qt(r,0).mul(Me),n=qt(r,8),s=qt(r,t-8).mul(e),a=qt(r,t-16).mul(Me),i=xe(o.add(n),43).add(xe(s,30)).add(a),l=Un(i,o.add(xe(n.add(Me),18)).add(s),e),c=qt(r,16).mul(e),u=qt(r,24),p=i.add(qt(r,t-32)).mul(e),m=l.add(qt(r,t-24)).mul(e);return Un(xe(c.add(u),43).add(xe(p,30)).add(m),c.add(xe(u.add(o),18)).add(p),e)}function cA(r,t=r.length){let e=hi.fromNumber(81,!0);if(t<=32)return t<=16?aA(r,t):iA(r,t);if(t<=64)return lA(r,t);let o=e,n=e.mul(di).add(113),s=kd(n.mul(Me).add(113)).mul(Me),a=[hi.UZERO,hi.UZERO],i=[hi.UZERO,hi.UZERO];o=o.mul(Me).add(qt(r,0));let l=0,c=(t-1>>6)*64,u=c+(t-1&63)-63;do o=xe(o.add(n).add(a[0]).add(qt(r,l+8)),37).mul(di),n=xe(n.add(a[1]).add(qt(r,l+48)),42).mul(di),o=o.xor(i[1]),n=n.add(a[0]).add(qt(r,l+40)),s=xe(s.add(i[0]),33).mul(di),a=Zu(r,l,a[1].mul(di),o.add(i[0])),i=Zu(r,l+32,s.add(i[1]),n.add(qt(r,l+16))),[s,o]=[o,s],l+=64;while(l!==c);let p=di.add(s.and(255).shl(1));return l=u,i[0]=i[0].add(t-1&63),a[0]=a[0].add(i[0]),i[0]=i[0].add(a[0]),o=xe(o.add(n).add(a[0]).add(qt(r,l+8)),37).mul(p),n=xe(n.add(a[1]).add(qt(r,l+48)),42).mul(p),o=o.xor(i[1].mul(9)),n=n.add(a[0].mul(9).add(qt(r,l+40))),s=xe(s.add(i[0]),33).mul(p),a=Zu(r,l,a[1].mul(p),o.add(i[0])),i=Zu(r,l+32,s.add(i[1]),n.add(qt(r,l+16))),[s,o]=[o,s],Un(Un(a[0],i[0],p).add(kd(n).mul(Xb)).add(s),Un(a[1],i[1],p).add(o),p)}function uA(r,t){return t==="string"?Hn(r):ml([r],t)}function pA(r,t){return r instanceof Float32Array&&t==="float32"||r instanceof Int32Array&&t==="int32"||r instanceof Uint8Array&&t==="bool"}function ml(r,t){if(t==="string")throw new Error("Cannot convert a string[] to a TypedArray");if(Array.isArray(r)&&(r=$r(r)),D().getBool("DEBUG")&&bd(r,t),pA(r,t))return r;if(t==null||t==="float32"||t==="complex64")return new Float32Array(r);if(t==="int32")return new Int32Array(r);if(t==="bool"){let e=new Uint8Array(r.length);for(let o=0;o<e.length;++o)Math.round(r[o])!==0&&(e[o]=1);return e}else throw new Error(`Unknown data type ${t}`)}function gi(){return D().platform.now()}function mA(r,t){return D().platform.fetch(r,t)}function Hn(r,t="utf-8"){return t=t||"utf-8",D().platform.encode(r,t)}function fl(r,t="utf-8"){return t=t||"utf-8",D().platform.decode(r,t)}function ne(r){return D().platform.isTypedArray!=null?D().platform.isTypedArray(r):Yu(r)}function $r(r,t=[],e=!1){if(t==null&&(t=[]),typeof r=="boolean"||typeof r=="number"||typeof r=="string"||vs(r)||r==null||ne(r)&&e)t.push(r);else if(Array.isArray(r)||ne(r))for(let o=0;o<r.length;++o)$r(r[o],t,e);else{let o=-1;for(let n of Object.keys(r))/^([1-9]+[0-9]*|0)$/.test(n)&&(o=Math.max(o,Number(n)));for(let n=0;n<=o;n++)$r(r[n],t,e)}return t}var Ju=class{constructor(t,e){this.backendTimer=t,this.logger=e,e==null&&(this.logger=new $d)}profileKernel(t,e,o){let n,s=()=>{n=o()},a,i=gi();if(this.backendTimer.timerAvailable())a=this.backendTimer.time(s);else{s();for(let c of n)c.dataSync();a=Promise.resolve({kernelMs:gi()-i})}if(D().getBool("CHECK_COMPUTATION_FOR_ERRORS"))for(let c=0;c<n.length;c++){let u=n[c];u.data().then(p=>{fA(p,u.dtype,t)})}return{kernelName:t,outputs:n,inputs:e,timeMs:a.then(c=>c.kernelMs),extraInfo:a.then(c=>c.getExtraProfileInfo!=null?c.getExtraProfileInfo():"")}}logKernelProfile(t){let{kernelName:e,outputs:o,timeMs:n,inputs:s,extraInfo:a}=t;o.forEach(i=>{Promise.all([i.data(),n,a]).then(l=>{this.logger.logKernelProfile(e,i,l[0],l[1],s,l[2])})})}};function fA(r,t,e){if(t!=="float32")return!1;for(let o=0;o<r.length;o++){let n=r[o];if(isNaN(n)||!isFinite(n))return console.warn(`Found ${n} in the result of '${e}'`),!0}return!1}var $d=class{logKernelProfile(t,e,o,n,s,a){let i=typeof n=="number"?ws(`${n}ms`,9):n.error,l=ws(t,25),c=e.rank,u=e.size,p=ws(e.shape.toString(),14),m="";for(let f in s){let d=s[f];if(d!=null){let g=d.shape||e.shape,h=g.length;m+=`${f}: ${h}D ${h>0?g:""} `}}console.log(`%c${l}	%c${i}	%c${c}D ${p}	%c${u}	%c${m}	%c${a}`,"font-weight:bold","color:red","color:blue","color: orange","color: green","color: steelblue")}};function Qb(r,t,e){let o={},n={};for(let l=0;l<t.length;l++)o[t[l].id]=!0;for(let l=0;l<r.length;l++){let c=r[l],u=c.inputs;for(let p in u){let m=u[p],f=!1;for(let d=0;d<t.length;d++)if(o[m.id]){c.outputs.forEach(g=>o[g.id]=!0),f=!0,n[c.id]=!0;break}if(f)break}}let s={};s[e.id]=!0;let a={};for(let l=r.length-1;l>=0;l--){let c=r[l],u=c.inputs;for(let p=0;p<c.outputs.length;p++)if(s[c.outputs[p].id]){for(let m in u)s[u[m].id]=!0,a[c.id]=!0;break}}let i=[];for(let l=0;l<r.length;l++){let c=r[l];if(n[c.id]&&a[c.id]){let u={};for(let m in c.inputs){let f=c.inputs[m];o[f.id]&&(u[m]=f)}let p=Object.assign({},c);p.inputs=u,p.outputs=c.outputs,i.push(p)}}return i}function Zb(r,t,e,o){for(let n=t.length-1;n>=0;n--){let s=t[n],a=[];if(s.outputs.forEach(l=>{let c=r[l.id];c!=null?a.push(c):a.push(null)}),s.gradient==null)throw new Error(`Cannot compute gradient: gradient function not found for ${s.kernelName}.`);let i=s.gradient(a);for(let l in s.inputs){if(!(l in i))throw new Error(`Cannot backprop through input ${l}. Available gradients found: ${Object.keys(i)}.`);let c=e(()=>i[l]());if(c.dtype!=="float32")throw new Error(`Error in gradient for op ${s.kernelName}. The gradient of input ${l} must have 'float32' dtype, but has '${c.dtype}'`);let u=s.inputs[l];if(!Pe(c.shape,u.shape))throw new Error(`Error in gradient for op ${s.kernelName}. The gradient of input '${l}' has shape '${c.shape}', which does not match the shape of the input '${u.shape}'`);if(r[u.id]==null)r[u.id]=c;else{let p=r[u.id];r[u.id]=o(p,c),p.dispose()}}}}var Jb=20,wc=3,Rd=7;function t0(r,t,e,o){let n=Ur(t),s=dA(r,t,e,n),a=t.length,i=tp(r,t,e,n,s),l=["Tensor"];return o&&(l.push(`  dtype: ${e}`),l.push(`  rank: ${a}`),l.push(`  shape: [${t}]`),l.push("  values:")),l.push(i.map(c=>"    "+c).join(`
`)),l.join(`
`)}function dA(r,t,e,o){let n=bt(t),s=o[o.length-1],a=new Array(s).fill(0),i=t.length,l=e==="complex64"?Sc(r):r;if(i>1)for(let c=0;c<n/s;c++){let u=c*s;for(let p=0;p<s;p++)a[p]=Math.max(a[p],vc(l[u+p],0,e).length)}return a}function vc(r,t,e){let o;return Array.isArray(r)?o=`${parseFloat(r[0].toFixed(Rd))} + ${parseFloat(r[1].toFixed(Rd))}j`:kr(r)?o=`'${r}'`:e==="bool"?o=e0(r):o=parseFloat(r.toFixed(Rd)).toString(),ws(o,t)}function e0(r){return r===0?"false":"true"}function tp(r,t,e,o,n,s=!0){let a=e==="complex64"?2:1,i=t[0],l=t.length;if(l===0){if(e==="complex64"){let g=Sc(r);return[vc(g[0],0,e)]}return e==="bool"?[e0(r[0])]:[r[0].toString()]}if(l===1){if(i>Jb){let h=wc*a,x=Array.from(r.slice(0,h)),b=Array.from(r.slice((i-wc)*a,i*a));return e==="complex64"&&(x=Sc(x),b=Sc(b)),["["+x.map((C,S)=>vc(C,n[S],e)).join(", ")+", ..., "+b.map((C,S)=>vc(C,n[i-wc+S],e)).join(", ")+"]"]}return["["+(e==="complex64"?Sc(r):Array.from(r)).map((h,x)=>vc(h,n[x],e)).join(", ")+"]"]}let c=t.slice(1),u=o.slice(1),p=o[0]*a,m=[];if(i>Jb){for(let g=0;g<wc;g++){let h=g*p,x=h+p;m.push(...tp(r.slice(h,x),c,e,u,n,!1))}m.push("...");for(let g=i-wc;g<i;g++){let h=g*p,x=h+p;m.push(...tp(r.slice(h,x),c,e,u,n,g===i-1))}}else for(let g=0;g<i;g++){let h=g*p,x=h+p;m.push(...tp(r.slice(h,x),c,e,u,n,g===i-1))}let f=l===2?",":"";m[0]="["+(i>0?m[0]+f:"");for(let g=1;g<m.length-1;g++)m[g]=" "+m[g]+f;let d=`,
`;for(let g=2;g<l;g++)d+=`
`;return m[m.length-1]=" "+m[m.length-1]+"]"+(s?"":d),m}function Sc(r){let t=[];for(let e=0;e<r.length;e+=2)t.push([r[e],r[e+1]]);return t}var $t=class{constructor(t,e,o){if(this.dtype=e,this.shape=t.slice(),this.size=bt(t),o!=null){let n=o.length;E(n===this.size,()=>`Length of values '${n}' does not match the size inferred by the shape '${this.size}'.`)}if(e==="complex64")throw new Error("complex64 dtype TensorBuffers are not supported. Please create a TensorBuffer for the real and imaginary parts separately and call tf.complex(real, imag).");this.values=o||Hu(e,this.size),this.strides=Ur(t)}set(t,...e){e.length===0&&(e=[0]),E(e.length===this.rank,()=>`The number of provided coordinates (${e.length}) must match the rank (${this.rank})`);let o=this.locToIndex(e);this.values[o]=t}get(...t){t.length===0&&(t=[0]);let e=0;for(let n of t){if(n<0||n>=this.shape[e]){let s=`Requested out of range element at ${t}.   Buffer shape=${this.shape}`;throw new Error(s)}e++}let o=t[t.length-1];for(let n=0;n<t.length-1;++n)o+=this.strides[n]*t[n];return this.values[o]}locToIndex(t){if(this.rank===0)return 0;if(this.rank===1)return t[0];let e=t[t.length-1];for(let o=0;o<t.length-1;++o)e+=this.strides[o]*t[o];return e}indexToLoc(t){if(this.rank===0)return[];if(this.rank===1)return[t];let e=new Array(this.shape.length);for(let o=0;o<e.length-1;++o)e[o]=Math.floor(t/this.strides[o]),t-=e[o]*this.strides[o];return e[e.length-1]=t,e}get rank(){return this.shape.length}toTensor(){return Rr().makeTensor(this.values,this.shape,this.dtype)}},Rr=null,dl=null,hA=null;function r0(r){Rr=r}function o0(r){dl=r}function n0(r){hA=r}var Nt=class{constructor(t,e,o,n){this.kept=!1,this.isDisposedInternal=!1,this.shape=t.slice(),this.dtype=e||"float32",this.size=bt(t),this.strides=Ur(t),this.dataId=o,this.id=n,this.rankType=this.rank<5?this.rank.toString():"higher"}get rank(){return this.shape.length}async buffer(){let t=await this.data();return dl.buffer(this.shape,this.dtype,t)}bufferSync(){return dl.buffer(this.shape,this.dtype,this.dataSync())}async array(){let t=await this.data();return bs(this.shape,t,this.dtype==="complex64")}arraySync(){return bs(this.shape,this.dataSync(),this.dtype==="complex64")}async data(){this.throwIfDisposed();let t=Rr().read(this.dataId);if(this.dtype==="string"){let e=await t;try{return e.map(o=>fl(o))}catch{throw new Error("Failed to decode the string bytes into utf-8. To get the original bytes, call tensor.bytes().")}}return t}dataToGPU(t){return this.throwIfDisposed(),Rr().readToGPU(this.dataId,t)}dataSync(){this.throwIfDisposed();let t=Rr().readSync(this.dataId);if(this.dtype==="string")try{return t.map(e=>fl(e))}catch{throw new Error("Failed to decode the string bytes into utf-8. To get the original bytes, call tensor.bytes().")}return t}async bytes(){this.throwIfDisposed();let t=await Rr().read(this.dataId);return this.dtype==="string"?t:new Uint8Array(t.buffer)}dispose(){this.isDisposed||(this.kerasMask&&this.kerasMask.dispose(),Rr().disposeTensor(this),this.isDisposedInternal=!0)}get isDisposed(){return this.isDisposedInternal}throwIfDisposed(){if(this.isDisposed)throw new Error("Tensor is disposed.")}print(t=!1){return dl.print(this,t)}clone(){return this.throwIfDisposed(),dl.clone(this)}toString(t=!1){let e=this.dataSync();return t0(e,this.shape,this.dtype,t)}cast(t){return this.throwIfDisposed(),dl.cast(this,t)}variable(t=!0,e,o){return this.throwIfDisposed(),Rr().makeVariable(this,t,e,o)}};Object.defineProperty(Nt,Symbol.hasInstance,{value:r=>!!r&&r.data!=null&&r.dataSync!=null&&r.throwIfDisposed!=null});function Ad(){return ac("Tensor",()=>Nt)}Ad();var Kr=class extends Nt{constructor(t,e,o,n){super(t.shape,t.dtype,t.dataId,n),this.trainable=e,this.name=o}assign(t){if(t.dtype!==this.dtype)throw new Error(`dtype of the new value (${t.dtype}) and previous value (${this.dtype}) must match`);if(!Pe(t.shape,this.shape))throw new Error(`shape of the new value (${t.shape}) and previous value (${this.shape}) must match`);Rr().disposeTensor(this),this.dataId=t.dataId,Rr().incRef(this,null)}dispose(){Rr().disposeVariable(this),this.isDisposedInternal=!0}};Object.defineProperty(Kr,Symbol.hasInstance,{value:r=>r instanceof Nt&&r.assign!=null&&r.assign instanceof Function});var Md={};kt(Md,{assertTypesMatch:()=>Pd,getTensorsInContainer:()=>Cc,isTensorInList:()=>xA,makeTypesMatch:()=>yt});var ep;(function(r){r.R0="R0",r.R1="R1",r.R2="R2",r.R3="R3",r.R4="R4",r.R5="R5",r.R6="R6"})(ep||(ep={}));var Fd;(function(r){r.float32="float32",r.int32="int32",r.bool="int32",r.complex64="complex64"})(Fd||(Fd={}));var _d;(function(r){r.float32="float32",r.int32="int32",r.bool="bool",r.complex64="complex64"})(_d||(_d={}));var Dd;(function(r){r.float32="float32",r.int32="float32",r.bool="float32",r.complex64="complex64"})(Dd||(Dd={}));var Od;(function(r){r.float32="complex64",r.int32="complex64",r.bool="complex64",r.complex64="complex64"})(Od||(Od={}));var gA={float32:Dd,int32:Fd,bool:_d,complex64:Od};function se(r,t){if(r==="string"||t==="string"){if(r==="string"&&t==="string")return"string";throw new Error(`Can not upcast ${r} with ${t}`)}return gA[r][t]}function Kn(r){return se(r,"int32")}function rp(r){return r!=null&&typeof r=="object"&&"texture"in r&&r.texture instanceof WebGLTexture}function op(r){return typeof GPUBuffer<"u"&&r!=null&&typeof r=="object"&&"buffer"in r&&r.buffer instanceof GPUBuffer}function yt(r,t){if(r.dtype===t.dtype)return[r,t];let e=se(r.dtype,t.dtype);return[r.cast(e),t.cast(e)]}function Pd(r,t){E(r.dtype===t.dtype,()=>`The dtypes of the first(${r.dtype}) and second(${t.dtype}) input must match`)}function xA(r,t){return t.some(e=>e.id===r.id)}function Cc(r){let t=[];return s0(r,t,new Set),t}function s0(r,t,e){if(r==null)return;if(r instanceof Nt){t.push(r);return}if(!yA(r))return;let o=r;for(let n in o){let s=o[n];e.has(s)||(e.add(s),s0(s,t,e))}}function yA(r){return Array.isArray(r)||typeof r=="object"}function Ld(r){return r.kernelName!=null}var np=class{constructor(){this.registeredVariables={},this.nextTapeNodeId=0,this.numBytes=0,this.numTensors=0,this.numStringTensors=0,this.numDataBuffers=0,this.gradientDepth=0,this.kernelDepth=0,this.scopeStack=[],this.numDataMovesStack=[],this.nextScopeId=0,this.tensorInfo=new WeakMap,this.profiling=!1,this.activeProfile={newBytes:0,newTensors:0,peakBytes:0,kernels:[],result:null,get kernelNames(){return Array.from(new Set(this.kernels.map(t=>t.name)))}}}dispose(){for(let t in this.registeredVariables)this.registeredVariables[t].dispose()}},Tc=class r{constructor(t){this.ENV=t,this.registry={},this.registryFactory={},this.pendingBackendInitId=0,this.state=new np}async ready(){if(this.pendingBackendInit!=null)return this.pendingBackendInit.then(()=>{});if(this.backendInstance!=null)return;let t=this.getSortedBackends();for(let e=0;e<t.length;e++){let o=t[e];if(await this.initializeBackend(o).success){await this.setBackend(o);return}}throw new Error("Could not initialize any backends, all backend initializations failed.")}get backend(){if(this.pendingBackendInit!=null)throw new Error(`Backend '${this.backendName}' has not yet been initialized. Make sure to await tf.ready() or await tf.setBackend() before calling other methods`);if(this.backendInstance==null){let{name:t,asyncInit:e}=this.initializeBackendsAndReturnBest();if(e)throw new Error(`The highest priority backend '${t}' has not yet been initialized. Make sure to await tf.ready() or await tf.setBackend() before calling other methods`);this.setBackend(t)}return this.backendInstance}backendNames(){return Object.keys(this.registryFactory)}findBackend(t){if(!(t in this.registry))if(t in this.registryFactory){let{asyncInit:e}=this.initializeBackend(t);if(e)return null}else return null;return this.registry[t]}findBackendFactory(t){return t in this.registryFactory?this.registryFactory[t].factory:null}registerBackend(t,e,o=1){return t in this.registryFactory?(Hr(`${t} backend was already registered. Reusing existing backend factory.`),!1):(this.registryFactory[t]={factory:e,priority:o},!0)}async setBackend(t){if(this.registryFactory[t]==null)throw new Error(`Backend name '${t}' not found in registry`);if(this.backendName=t,this.registry[t]==null){this.backendInstance=null;let{success:e,asyncInit:o}=this.initializeBackend(t);if(!(o?await e:e))return!1}return this.backendInstance=this.registry[t],this.setupRegisteredKernels(),this.profiler=new Ju(this.backendInstance),!0}setupRegisteredKernels(){yc(this.backendName).forEach(e=>{e.setupFunc!=null&&e.setupFunc(this.backendInstance)})}disposeRegisteredKernels(t){yc(t).forEach(o=>{o.disposeFunc!=null&&o.disposeFunc(this.registry[t])})}initializeBackend(t){let e=this.registryFactory[t];if(e==null)throw new Error(`Cannot initialize backend ${t}, no registration found.`);try{let o=e.factory();if(o&&!(o instanceof Wr)&&typeof o.then=="function"){let n=++this.pendingBackendInitId,s=o.then(a=>n<this.pendingBackendInitId?!1:(this.registry[t]=a,this.pendingBackendInit=null,!0)).catch(a=>(n<this.pendingBackendInitId||(this.pendingBackendInit=null,Hr(`Initialization of backend ${t} failed`),Hr(a.stack||a.message)),!1));return this.pendingBackendInit=s,{success:s,asyncInit:!0}}else return this.registry[t]=o,{success:!0,asyncInit:!1}}catch(o){return Hr(`Initialization of backend ${t} failed`),Hr(o.stack||o.message),{success:!1,asyncInit:!1}}}removeBackend(t){if(!(t in this.registryFactory))throw new Error(`${t} backend not found in registry`);this.backendName===t&&this.pendingBackendInit!=null&&this.pendingBackendInitId++,t in this.registry&&(this.disposeRegisteredKernels(t),this.registry[t].dispose(),delete this.registry[t]),delete this.registryFactory[t],this.backendName===t&&(this.pendingBackendInit=null,this.backendName=null,this.backendInstance=null)}getSortedBackends(){if(Object.keys(this.registryFactory).length===0)throw new Error("No backend found in registry.");return Object.keys(this.registryFactory).sort((t,e)=>this.registryFactory[e].priority-this.registryFactory[t].priority)}initializeBackendsAndReturnBest(){let t=this.getSortedBackends();for(let e=0;e<t.length;e++){let o=t[e],{success:n,asyncInit:s}=this.initializeBackend(o);if(s||n)return{name:o,asyncInit:s}}throw new Error("Could not initialize any backends, all backend initializations failed.")}moveData(t,e){let o=this.state.tensorInfo.get(e),n=o.backend,s=this.readSync(e),a=n.refCount(e);n.disposeData(e,!0),o.backend=t,t.move(e,s,o.shape,o.dtype,a),this.shouldCheckForMemLeaks()&&this.state.numDataMovesStack[this.state.numDataMovesStack.length-1]++}tidy(t,e){let o=null;if(e==null){if(typeof t!="function")throw new Error("Please provide a function to tidy()");e=t}else{if(typeof t!="string"&&!(t instanceof String))throw new Error("When calling with two arguments, the first argument to tidy() must be a string");if(typeof e!="function")throw new Error("When calling with two arguments, the 2nd argument to tidy() must be a function");o=t}let n;return this.scopedRun(()=>this.startScope(o),()=>this.endScope(n),()=>(n=e(),n instanceof Promise&&console.error("Cannot return a Promise inside of tidy."),n))}scopedRun(t,e,o){t();try{let n=o();return e(),n}catch(n){throw e(),n}}nextTensorId(){return r.nextTensorId++}nextVariableId(){return r.nextVariableId++}clone(t){let e=k.runKernel(yo,{x:t}),o={x:t},n=a=>({x:()=>{let i="float32",l={x:a},c={dtype:i};return k.runKernel(xo,l,c)}}),s=[];return this.addTapeNode(this.state.activeScope.name,o,[e],n,s,{}),e}runKernel(t,e,o){if(this.backendName==null&&this.backend,!(pi(t,this.backendName)!=null))throw new Error(`Kernel '${t}' not registered for backend '${this.backendName}'`);return this.runKernelFunc({kernelName:t,inputs:e,attrs:o})}shouldCheckForMemLeaks(){return this.ENV.getBool("IS_TEST")}checkKernelForMemLeak(t,e,o){let n=this.backend.numDataIds(),s=0;o.forEach(l=>{s+=l.dtype==="complex64"?3:1});let a=this.state.numDataMovesStack[this.state.numDataMovesStack.length-1],i=n-e-s-a;if(i>0)throw new Error(`Backend '${this.backendName}' has an internal memory leak (${i} data ids) after running '${t}'`)}runKernelFunc(t){let e,o=[],n=this.isTapeOn(),s=this.state.numBytes,a=this.state.numTensors;this.shouldCheckForMemLeaks()&&this.state.numDataMovesStack.push(0);let i;this.backendName==null&&this.backend;let l,c=Ld(t)?t.kernelName:this.state.activeScope!=null?this.state.activeScope.name:"";if(Ld(t)){let{kernelName:d,inputs:g,attrs:h}=t;this.backendName==null&&this.backend;let x=pi(d,this.backendName);E(x!=null,()=>`Cannot find registered kernel '${d}' for backend '${this.backendName}'`),i=()=>{let b=this.backend.numDataIds();l=x.kernelFunc({inputs:g,attrs:h,backend:this.backend});let C=Array.isArray(l)?l:[l];this.shouldCheckForMemLeaks()&&this.checkKernelForMemLeak(d,b,C);let S=C.map(I=>I.rank!=null?I:this.makeTensorFromTensorInfo(I));if(n){let I=this.getTensorsForGradient(d,g,S);o=this.saveTensorsForBackwardMode(I)}return S}}else{let{forwardFunc:d}=t,g=h=>{n&&(o=h.map(x=>this.keep(this.clone(x))))};i=()=>{let h=this.backend.numDataIds();l=this.tidy(()=>d(this.backend,g));let x=Array.isArray(l)?l:[l];return this.shouldCheckForMemLeaks()&&this.checkKernelForMemLeak(c,h,x),x}}let{inputs:u,attrs:p}=t,m=Ld(t)?null:t.backwardsFunc,f;return this.scopedRun(()=>this.state.kernelDepth++,()=>this.state.kernelDepth--,()=>{!this.ENV.getBool("DEBUG")&&!this.state.profiling?e=i():(f=this.profiler.profileKernel(c,u,()=>i()),this.ENV.getBool("DEBUG")&&this.profiler.logKernelProfile(f),e=f.outputs)}),n&&this.addTapeNode(c,u,e,m,o,p),this.state.profiling&&this.state.activeProfile.kernels.push({name:c,bytesAdded:this.state.numBytes-s,totalBytesSnapshot:this.state.numBytes,tensorsAdded:this.state.numTensors-a,totalTensorsSnapshot:this.state.numTensors,inputShapes:Object.keys(u).map(d=>u[d]!=null?u[d].shape:null),outputShapes:e.map(d=>d.shape),kernelTimeMs:f.timeMs,extraInfo:f.extraInfo}),Array.isArray(l)?e:e[0]}saveTensorsForBackwardMode(t){return t.map(o=>this.keep(this.clone(o)))}getTensorsForGradient(t,e,o){let n=Xu(t);if(n!=null){let s=n.inputsToSave||[],a=n.outputsToSave||[],i;n.saveAllInputs?(E(Array.isArray(e),()=>"saveAllInputs is true, expected inputs to be an array."),i=Object.keys(e).map(c=>e[c])):i=s.map(c=>e[c]);let l=o.filter((c,u)=>a[u]);return i.concat(l)}return[]}makeTensor(t,e,o,n){if(t==null)throw new Error("Values passed to engine.makeTensor() are null");o=o||"float32",n=n||this.backend;let s=t;o==="string"&&kr(t[0])&&(s=t.map(l=>Hn(l)));let a=n.write(s,e,o),i=new Nt(e,o,a,this.nextTensorId());if(this.trackTensor(i,n),o==="string"){let l=this.state.tensorInfo.get(a),c=vd(s);this.state.numBytes+=c-l.bytes,l.bytes=c}return i}makeTensorFromDataId(t,e,o,n){o=o||"float32";let s={dataId:t,shape:e,dtype:o};return this.makeTensorFromTensorInfo(s,n)}makeTensorFromTensorInfo(t,e){let{dataId:o,shape:n,dtype:s}=t,a=new Nt(n,s,o,this.nextTensorId());return this.trackTensor(a,e),a}makeVariable(t,e=!0,o,n){o=o||this.nextVariableId().toString(),n!=null&&n!==t.dtype&&(t=t.cast(n));let s=new Kr(t,e,o,this.nextTensorId());if(this.state.registeredVariables[s.name]!=null)throw new Error(`Variable with name ${s.name} was already registered`);return this.state.registeredVariables[s.name]=s,this.incRef(s,this.backend),s}trackTensor(t,e){this.state.numTensors++,t.dtype==="string"&&this.state.numStringTensors++;let o=0;t.dtype!=="complex64"&&t.dtype!=="string"&&(o=t.size*ji(t.dtype)),this.state.numBytes+=o,this.state.tensorInfo.has(t.dataId)||(this.state.numDataBuffers++,this.state.tensorInfo.set(t.dataId,{backend:e||this.backend,dtype:t.dtype,shape:t.shape,bytes:o})),t instanceof Kr||this.track(t)}incRef(t,e){this.trackTensor(t,e),this.backend.incRef(t.dataId)}removeDataId(t,e){this.state.tensorInfo.has(t)&&this.state.tensorInfo.get(t).backend===e&&(this.state.tensorInfo.delete(t),this.state.numDataBuffers--)}disposeTensor(t){if(!this.state.tensorInfo.has(t.dataId))return;let e=this.state.tensorInfo.get(t.dataId);if(this.state.numTensors--,t.dtype==="string"&&(this.state.numStringTensors--,this.state.numBytes-=e.bytes),t.dtype!=="complex64"&&t.dtype!=="string"){let o=t.size*ji(t.dtype);this.state.numBytes-=o}e.backend.disposeData(t.dataId)&&this.removeDataId(t.dataId,e.backend)}disposeVariables(){for(let t in this.state.registeredVariables){let e=this.state.registeredVariables[t];this.disposeVariable(e)}}disposeVariable(t){this.disposeTensor(t),this.state.registeredVariables[t.name]!=null&&delete this.state.registeredVariables[t.name]}memory(){let t=this.backend.memory();return t.numTensors=this.state.numTensors,t.numDataBuffers=this.state.numDataBuffers,t.numBytes=this.state.numBytes,this.state.numStringTensors>0&&(t.unreliable=!0,t.reasons==null&&(t.reasons=[]),t.reasons.push("Memory usage by string tensors is approximate (2 bytes per character)")),t}async profile(t){this.state.profiling=!0;let e=this.state.numBytes,o=this.state.numTensors;this.state.activeProfile.kernels=[],this.state.activeProfile.result=await t(),this.state.profiling=!1,this.state.activeProfile.peakBytes=Math.max(...this.state.activeProfile.kernels.map(n=>n.totalBytesSnapshot)),this.state.activeProfile.newBytes=this.state.numBytes-e,this.state.activeProfile.newTensors=this.state.numTensors-o;for(let n of this.state.activeProfile.kernels)n.kernelTimeMs=await n.kernelTimeMs,n.extraInfo=await n.extraInfo;return this.state.activeProfile}isTapeOn(){return this.state.gradientDepth>0&&this.state.kernelDepth===0}addTapeNode(t,e,o,n,s,a){let i={id:this.state.nextTapeNodeId++,kernelName:t,inputs:e,outputs:o,saved:s},l=Xu(t);l!=null&&(n=l.gradFunc),n!=null&&(i.gradient=c=>(c=c.map((u,p)=>{if(u==null){let m=o[p],f=Yi(m.size,m.dtype);return this.makeTensor(f,m.shape,m.dtype)}return u}),n(c.length>1?c:c[0],s,a))),this.state.activeTape.push(i)}keep(t){return t.kept=!0,t}startTape(){this.state.gradientDepth===0&&(this.state.activeTape=[]),this.state.gradientDepth++}endTape(){this.state.gradientDepth--}startScope(t){let e={track:[],name:"unnamed scope",id:this.state.nextScopeId++};t&&(e.name=t),this.state.scopeStack.push(e),this.state.activeScope=e}endScope(t){let e=Cc(t),o=new Set(e.map(s=>s.id));for(let s=0;s<this.state.activeScope.track.length;s++){let a=this.state.activeScope.track[s];!a.kept&&!o.has(a.id)&&a.dispose()}let n=this.state.scopeStack.pop();this.state.activeScope=this.state.scopeStack.length===0?null:this.state.scopeStack[this.state.scopeStack.length-1],e.forEach(s=>{!s.kept&&s.scopeId===n.id&&this.track(s)})}gradients(t,e,o,n=!1){if(E(e.length>0,()=>"gradients() received an empty list of xs."),o!=null&&o.dtype!=="float32")throw new Error(`dy must have 'float32' dtype, but has '${o.dtype}'`);let s=this.scopedRun(()=>this.startTape(),()=>this.endTape(),()=>this.tidy("forward",t));E(s instanceof Nt,()=>"The result y returned by f() must be a tensor.");let a=Qb(this.state.activeTape,e,s);if(!n&&a.length===0&&e.length>0)throw new Error("Cannot compute gradient of y=f(x) with respect to x. Make sure that the f you passed encloses all operations that lead from x to y.");return this.tidy("backward",()=>{let i={};i[s.id]=o??bA(s.shape),Zb(i,a,c=>this.tidy(c),wA);let l=e.map(c=>i[c.id]);return this.state.gradientDepth===0&&(this.state.activeTape.forEach(c=>{for(let u of c.saved)u.dispose()}),this.state.activeTape=null),{value:s,grads:l}})}customGrad(t){return E(Gr(t),()=>"The f passed in customGrad(f) must be a function."),(...e)=>{E(e.every(i=>i instanceof Nt),()=>"The args passed in customGrad(f)(x1, x2,...) must all be tensors");let o,n={};e.forEach((i,l)=>{n[l]=i});let s=(i,l)=>(o=t(...e,l),E(o.value instanceof Nt,()=>"The function f passed in customGrad(f) must return an object where `obj.value` is a tensor"),E(Gr(o.gradFunc),()=>"The function f passed in customGrad(f) must return an object where `obj.gradFunc` is a function."),o.value),a=(i,l)=>{let c=o.gradFunc(i,l),u=Array.isArray(c)?c:[c];E(u.length===e.length,()=>"The function f passed in customGrad(f) must return an object where `obj.gradFunc` is a function that returns the same number of tensors as inputs passed to f(...)."),E(u.every(m=>m instanceof Nt),()=>"The function f passed in customGrad(f) must return an object where `obj.gradFunc` is a function that returns a list of only tensors.");let p={};return u.forEach((m,f)=>{p[f]=()=>m}),p};return this.runKernelFunc({forwardFunc:s,backwardsFunc:a,inputs:n})}}readSync(t){return this.state.tensorInfo.get(t).backend.readSync(t)}read(t){return this.state.tensorInfo.get(t).backend.read(t)}readToGPU(t,e){return this.state.tensorInfo.get(t).backend.readToGPU(t,e)}async time(t){let e=gi(),o=await this.backend.time(t);return o.wallMs=gi()-e,o}track(t){return this.state.activeScope!=null&&(t.scopeId=this.state.activeScope.id,this.state.activeScope.track.push(t)),t}get registeredVariables(){return this.state.registeredVariables}reset(){this.pendingBackendInitId++,this.state.dispose(),this.ENV.reset(),this.state=new np;for(let t in this.registry)this.disposeRegisteredKernels(t),this.registry[t].dispose(),delete this.registry[t];this.backendName=null,this.backendInstance=null,this.pendingBackendInit=null}};Tc.nextTensorId=0;Tc.nextVariableId=0;function bA(r){let t=sc(bt(r),"float32");return k.makeTensor(t,r,"float32")}function Bd(){let r=Cd();if(r._tfengine==null){let t=new Qi(r);r._tfengine=new Tc(t)}return Ob(r._tfengine.ENV),r0(()=>r._tfengine),r._tfengine}var k=Bd();function wA(r,t){let e={a:r,b:t};return k.runKernel("Add",e)}var vo={};kt(vo,{isBrowser:()=>zd,isMobile:()=>CA,mockIsMobile:()=>SA});function vA(){return typeof navigator<"u"&&navigator!=null}var Vd;function SA(r){Vd=r}function CA(r){if(Vd!==void 0)return Vd;if(r||vA()){if(r||(r=navigator),r.product==="ReactNative")return!0;let t=r.userAgent||r.vendor||(typeof window<"u"?window.opera:"");if(!t){let e=r;return e.userAgentData&&e.userAgentData.mobile}return/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(t)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(t.substr(0,4))}return!1}function zd(){return typeof window<"u"&&window.document!=null||typeof WorkerGlobalScope<"u"}var Ke=D();Ke.registerFlag("DEBUG",()=>!1,r=>{r&&console.warn("Debugging mode is ON. The output of every math call will be downloaded to CPU and checked for NaNs. This significantly impacts performance.")});Ke.registerFlag("IS_BROWSER",()=>zd());Ke.registerFlag("IS_NODE",()=>typeof process<"u"&&typeof process.versions<"u"&&typeof process.versions.node<"u");Ke.registerFlag("IS_CHROME",()=>typeof navigator<"u"&&navigator!=null&&navigator.userAgent!=null&&/Chrome/.test(navigator.userAgent)&&/Google Inc/.test(navigator.vendor));Ke.registerFlag("IS_SAFARI",()=>typeof navigator<"u"&&navigator!=null&&navigator.userAgent!=null&&/Safari/.test(navigator.userAgent)&&/Apple/.test(navigator.vendor));Ke.registerFlag("PROD",()=>!1);Ke.registerFlag("TENSORLIKE_CHECK_SHAPE_CONSISTENCY",()=>Ke.getBool("DEBUG"));Ke.registerFlag("DEPRECATION_WARNINGS_ENABLED",()=>!0);Ke.registerFlag("IS_TEST",()=>!1);Ke.registerFlag("CHECK_COMPUTATION_FOR_ERRORS",()=>Ke.getBool("DEBUG"));Ke.registerFlag("WRAP_TO_IMAGEBITMAP",()=>!1);Ke.registerFlag("CANVAS2D_WILL_READ_FREQUENTLY_FOR_GPU",()=>!1);Ke.registerFlag("USE_SETTIMEOUTCUSTOM",()=>!1);function Ce(r,t){let e=r;if(ne(r))return t==="string"?[]:[r.length];if(rp(r)){let n=r.channels||"RGBA";return[r.height,r.width*n.length]}else if(op(r))return[r.buffer.size/(t==null?4:ji(t))];if(!Array.isArray(r))return[];let o=[];for(;Array.isArray(e)||ne(e)&&t!=="string";)o.push(e.length),e=e[0];return Array.isArray(r)&&D().getBool("TENSORLIKE_CHECK_SHAPE_CONSISTENCY")&&i0(r,o,[]),o}function i0(r,t,e){if(e=e||[],!Array.isArray(r)&&!ne(r)){E(t.length===0,()=>`Element arr[${e.join("][")}] is a primitive, but should be an array/TypedArray of ${t[0]} elements`);return}E(t.length>0,()=>`Element arr[${e.join("][")}] should be a primitive, but is an array of ${r.length} elements`),E(r.length===t[0],()=>`Element arr[${e.join("][")}] should have ${t[0]} elements, but has ${r.length} elements`);let o=t.slice(1);for(let n=0;n<r.length;++n)i0(r[n],o,e.concat(n))}function a0(r,t,e,o){if(r!=="string_or_numeric"){if(r==null)throw new Error("Expected dtype cannot be null.");if(r!=="numeric"&&r!==t||r==="numeric"&&t==="string")throw new Error(`Argument '${e}' passed to '${o}' must be ${r} tensor, but got ${t} tensor`)}}function v(r,t,e,o="numeric"){if(r instanceof Ad())return a0(o,r.dtype,t,e),r;let n=qo(r);if(n!=="string"&&["bool","int32","float32"].indexOf(o)>=0&&(n=o),a0(o,n,t,e),r==null||!ne(r)&&!Array.isArray(r)&&typeof r!="number"&&typeof r!="boolean"&&typeof r!="string"){let l=r==null?"null":r.constructor.name;throw new Error(`Argument '${t}' passed to '${e}' must be a Tensor or TensorLike, but got '${l}'`)}let s=Ce(r,n);!ne(r)&&!Array.isArray(r)&&(r=[r]);let i=n!=="string"?ml(r,n):$r(r,[],!0);return k.makeTensor(i,s,n)}function So(r,t,e,o="numeric"){if(!Array.isArray(r))throw new Error(`Argument ${t} passed to ${e} must be a \`Tensor[]\` or \`TensorLike[]\``);return r.map((s,a)=>v(s,`${t}[${a}]`,e,o))}var sp="__op";function T(r){let t=Object.keys(r);if(t.length!==1)throw new Error(`Please provide an object with a single key (operation name) mapping to a function. Got an object with ${t.length} keys.`);let e=t[0],o=r[e];e.endsWith("_")&&(e=e.substring(0,e.length-1)),e=e+sp;let n=(...s)=>{k.startScope(e);try{let a=o(...s);return vs(a)&&console.error("Cannot return a Promise inside of tidy."),k.endScope(a),a}catch(a){throw k.endScope(null),a}};return Object.defineProperty(n,"name",{value:e,configurable:!0}),n}function TA(r,t){let e=v(r,"real","complex"),o=v(t,"imag","complex");zt(e.shape,o.shape,`real and imag shapes, ${e.shape} and ${o.shape}, must match in call to tf.complex().`);let n={real:e,imag:o};return k.runKernel(Fs,n)}var Le=T({complex_:TA});function Be(r,t,e,o){if(o==null)o=qo(r);else if(o==="complex64")throw new Error("Cannot construct a complex64 tensor directly. Please use tf.complex(real, imag).");if(op(r)||rp(r)){if(o!=="float32"&&o!=="int32")throw new Error(`Creating tensor from GPU data only supports 'float32'|'int32' dtype, while the dtype is ${o}.`);return k.backend.createTensorFromGPUData(r,t||e,o)}if(!ne(r)&&!Array.isArray(r)&&typeof r!="number"&&typeof r!="boolean"&&typeof r!="string")throw new Error("values passed to tensor(values) must be a number/boolean/string or an array of numbers/booleans/strings, or a TypedArray");if(t!=null){Kt(t);let n=bt(t),s=bt(e);E(n===s,()=>`Based on the provided shape, [${t}], the tensor should have ${n} values but has ${s}`);for(let a=0;a<e.length;++a){let i=e[a],l=a===e.length-1?i!==bt(t.slice(a)):!0;E(e[a]===t[a]||!l,()=>`Error creating a new Tensor. Inferred shape (${e}) does not match the provided shape (${t}). `)}}return!ne(r)&&!Array.isArray(r)&&(r=[r]),t=t||e,r=o!=="string"?ml(r,o):$r(r,[],!0),k.makeTensor(r,t,o)}function $e(r,t,e){let o=Ce(r,e);return Be(r,t,o,e)}var Co={float32:4,float16:2,int32:4,uint16:2,uint8:1,bool:1,complex64:8};var Te=class r{static join(t){return new r(t).slice()}constructor(t){if(this.shards=[],this.previousShardIndex=0,t==null||(t instanceof Array||(t=[t]),t=t.map(o=>ne(o)?o.buffer:o),t.length===0))return;this.bufferUniformSize=t[0].byteLength;let e=0;for(let o=0;o<t.length;o++){let n=t[o];o!==t.length-1&&n.byteLength!==this.bufferUniformSize&&(this.bufferUniformSize=void 0);let s=e+n.byteLength;this.shards.push({buffer:n,start:e,end:s}),e=s}this.shards.length===0&&(this.byteLength=0),this.byteLength=this.shards[this.shards.length-1].end}slice(t=0,e=this.byteLength){if(this.shards.length===0)return new ArrayBuffer(0);if(t=isNaN(Number(t))?0:t,e=isNaN(Number(e))?0:e,t=Math.max(0,t),e=Math.min(this.byteLength,e),e<=t)return new ArrayBuffer(0);let o=this.findShardForByte(t);if(o===-1)throw new Error(`Could not find start shard for byte ${t}`);let n=e-t,s=new ArrayBuffer(n),a=new Uint8Array(s),i=0;for(let l=o;l<this.shards.length;l++){let c=this.shards[l],p=t+i-c.start,m=i,d=Math.min(e,c.end)-c.start,g=new Uint8Array(c.buffer,p,d-p);if(a.set(g,m),i+=g.length,e<c.end)break}return s}findShardForByte(t){if(this.shards.length===0||t<0||t>=this.byteLength)return-1;if(this.bufferUniformSize!=null)return this.previousShardIndex=Math.floor(t/this.bufferUniformSize),this.previousShardIndex;function e(n){return t<n.start?-1:t>=n.end?1:0}if(e(this.shards[this.previousShardIndex])===0)return this.previousShardIndex;let o=NA(this.shards,e);return o===-1?-1:(this.previousShardIndex=o,this.previousShardIndex)}};function NA(r,t){let e=0,o=r.length;for(;e<=o;){let n=Math.floor((o-e)/2)+e,s=t(r[n]);if(s===0)return n;s<0?o=n:e=n+1}return-1}function IA(){D().set("PROD",!0)}function kA(){D().set("DEBUG",!0)}function EA(){D().set("DEPRECATION_WARNINGS_ENABLED",!1),console.warn("TensorFlow.js deprecation warnings have been disabled.")}function l0(r){D().getBool("DEPRECATION_WARNINGS_ENABLED")&&console.warn(r+" You can disable deprecation warnings with tf.disableDeprecationWarnings().")}n0(l0);function $A(){k.disposeVariables()}function Re(){return k}function RA(){return k.memory()}function AA(r){return k.profile(r)}function at(r,t){return k.tidy(r,t)}function Tt(r){Cc(r).forEach(e=>e.dispose())}function Ve(r){return k.keep(r)}function FA(r){return k.time(r)}function _A(r){return k.setBackend(r)}function DA(){return k.ready()}function qn(){return k.backendName}function OA(r){k.removeBackend(r)}function PA(r){return k.findBackend(r)}function MA(r){return k.findBackendFactory(r)}function Nc(r,t,e=1){return k.registerBackend(r,t,e)}function To(){return k.backend}function LA(r,t){D().setPlatform(r,t)}var jn=4;async function p0(r,t){let e=[],o=[],n=Array.isArray(r)?r.map(a=>a.name):Object.keys(r);for(let a=0;a<n.length;++a){let i=n[a],l=Array.isArray(r)?r[a].tensor:r[i];if(l.dtype!=="float32"&&l.dtype!=="int32"&&l.dtype!=="bool"&&l.dtype!=="string"&&l.dtype!=="complex64")throw new Error(`Unsupported dtype in weight '${i}': ${l.dtype}`);let c={name:i,shape:l.shape,dtype:l.dtype};if(l.dtype==="string"){let u=new Promise(async p=>{let m=await l.bytes(),f=m.reduce((h,x)=>h+x.length,0)+jn*m.length,d=new Uint8Array(f),g=0;for(let h=0;h<m.length;h++){let x=m[h],b=new Uint8Array(new Uint32Array([x.length]).buffer);d.set(b,g),g+=jn,d.set(x,g),g+=x.length}p(d)});o.push(u)}else o.push(l.data());t!=null&&(c.group=t),e.push(c)}let s=await Promise.all(o);return{data:zA(s),specs:e}}function ap(r,t){let e=new Te(r),o={},n=0;for(let s of t){let a=BA(s,(i,l)=>e.slice(n+i,n+l));o[s.name]=m0(s,e.slice(n,n+a)),n+=a}return o}function BA(r,t){let e=bt(r.shape),o;if("quantization"in r){let n=r.quantization;o=Co[n.dtype]}else if(r.dtype==="string"){let n=0;for(let s=0;s<e;s++)n+=jn+new Uint32Array(t(n,n+jn))[0];return n}else o=Co[r.dtype];return e*o}async function VA(r,t){let e=bt(r.shape),o;if("quantization"in r){let n=r.quantization;o=Co[n.dtype]}else if(r.dtype==="string"){let n=0;for(let s=0;s<e;s++)n+=jn+new Uint32Array(await t(n,n+jn))[0];return n}else o=Co[r.dtype];return e*o}function m0(r,t){let e=r.name,o=r.dtype,n=r.shape,s=bt(n),a,i=0;if("quantization"in r){let l=r.quantization;if(l.dtype==="uint8"||l.dtype==="uint16"){if(!("min"in l&&"scale"in l))throw new Error(`Weight ${r.name} with quantization ${l.dtype} doesn't have corresponding metadata min and scale.`)}else if(l.dtype==="float16"){if(o!=="float32")throw new Error(`Weight ${r.name} is quantized with ${l.dtype} which only supports weights of type float32 not ${o}.`)}else throw new Error(`Weight ${r.name} has unknown quantization dtype ${l.dtype}. Supported quantization dtypes are: 'uint8', 'uint16', and 'float16'.`);let c=Co[l.dtype],u=l.dtype==="uint8"?new Uint8Array(t):new Uint16Array(t);if(o==="float32")if(l.dtype==="uint8"||l.dtype==="uint16"){a=new Float32Array(u.length);for(let p=0;p<u.length;p++){let m=u[p];a[p]=m*l.scale+l.min}}else if(l.dtype==="float16")a=HA()(u);else throw new Error(`Unsupported quantization type ${l.dtype} for weight type float32.`);else if(o==="int32"){if(l.dtype!=="uint8"&&l.dtype!=="uint16")throw new Error(`Unsupported quantization type ${l.dtype} for weight type int32.`);a=new Int32Array(u.length);for(let p=0;p<u.length;p++){let m=u[p];a[p]=Math.round(m*l.scale+l.min)}}else throw new Error(`Unsupported dtype in weight '${e}': ${o}`);i+=s*c}else if(o==="string"){let l=bt(r.shape);a=[];for(let c=0;c<l;c++){let u=new Uint32Array(t.slice(i,i+jn))[0];i+=jn;let p=new Uint8Array(t.slice(i,i+u));a.push(p),i+=u}}else{let l=Co[o];if(o==="float32")a=new Float32Array(t);else if(o==="int32")a=new Int32Array(t);else if(o==="bool")a=new Uint8Array(t);else if(o==="complex64"){a=new Float32Array(t);let c=new Float32Array(a.length/2),u=new Float32Array(a.length/2);for(let d=0;d<c.length;d++)c[d]=a[d*2],u[d]=a[d*2+1];let p=$e(c,n,"float32"),m=$e(u,n,"float32"),f=Le(p,m);return p.dispose(),m.dispose(),f}else throw new Error(`Unsupported dtype in weight '${e}': ${o}`);i+=s*l}return $e(a,n,o)}async function c0(r,t,e){let o=new Uint8Array(t);for(;o.byteLength<e;){let{done:n,value:s}=await r.read();if(n&&s==null){let i=e-o.byteLength;throw new Error(`Reader is done but ${i} bytes are still expected`)}let a=new Uint8Array(o.length+s.byteLength);a.set(o,0),a.set(new Uint8Array(s),o.length),o=a}return o.buffer}async function ip(r,t){let e={},o=r.getReader(),n=new ArrayBuffer(0);for(let s of t){let a=await VA(s,async(c,u)=>(n=await c0(o,n,u),n.slice(c,u)));n=await c0(o,n,a);let i=n.slice(0,a);n=n.slice(a);let l=m0(s,i);if(e[s.name]=l,qn()==="webgpu"){let c=To();"uploadToGPU"in c&&bt(l.shape)>=D().get("WEBGPU_CPU_HANDOFF_SIZE_THRESHOLD")&&c.uploadToGPU(l.dataId)}}return e}function zA(r){if(r===null)throw new Error(`Invalid input value: ${JSON.stringify(r)}`);let t=0,e=[];r.forEach(s=>{if(t+=s.byteLength,e.push(s.byteLength===s.buffer.byteLength?s:new s.constructor(s)),!(s instanceof Float32Array||s instanceof Int32Array||s instanceof Uint8Array))throw new Error(`Unsupported TypedArray subtype: ${s.constructor.name}`)});let o=new Uint8Array(t),n=0;return e.forEach(s=>{o.set(new Uint8Array(s.buffer),n),n+=s.byteLength}),o.buffer}var Wd=typeof Buffer<"u"&&(typeof Blob>"u"||typeof atob>"u"||typeof btoa>"u");function u0(r){return Wd?Buffer.byteLength(r,"utf8"):new Blob([r]).size}function f0(r){if(Wd)return Buffer.from(r).toString("base64");let t=new Uint8Array(r),e="";for(let o=0,n=t.length;o<n;o++)e+=String.fromCharCode(t[o]);return btoa(e)}function d0(r){if(Wd){let o=Buffer.from(r,"base64");return o.buffer.slice(o.byteOffset,o.byteOffset+o.byteLength)}let t=atob(r),e=new Uint8Array(t.length);for(let o=0;o<t.length;++o)e.set([t.charCodeAt(o)],o);return e.buffer}function h0(r){return Te.join(r)}function Gd(r){for(r=r.trim();r.endsWith("/");)r=r.slice(0,r.length-1);let e=r.split("/");return e[e.length-1]}function lp(r,t){let e={modelTopology:r.modelTopology,format:r.format,generatedBy:r.generatedBy,convertedBy:r.convertedBy,weightsManifest:t};return r.signature!=null&&(e.signature=r.signature),r.userDefinedMetadata!=null&&(e.userDefinedMetadata=r.userDefinedMetadata),r.modelInitializer!=null&&(e.modelInitializer=r.modelInitializer),r.initializerSignature!=null&&(e.initializerSignature=r.initializerSignature),r.trainingConfig!=null&&(e.trainingConfig=r.trainingConfig),e}function Ud(r,t,e){let o={modelTopology:r.modelTopology,format:r.format,generatedBy:r.generatedBy,convertedBy:r.convertedBy};if(r.trainingConfig!=null&&(o.trainingConfig=r.trainingConfig),r.weightsManifest!=null){if(!t)throw new Error("modelJSON has weightsManifest but weightSpecs is null");if(!e)throw new Error("modelJSON has weightsManifest but weightData is null");o.weightSpecs=t,o.weightData=e}return r.signature!=null&&(o.signature=r.signature),r.userDefinedMetadata!=null&&(o.userDefinedMetadata=r.userDefinedMetadata),r.modelInitializer!=null&&(o.modelInitializer=r.modelInitializer),r.initializerSignature!=null&&(o.initializerSignature=r.initializerSignature),o}async function hl(r,t){let e,o;return r.weightsManifest!=null&&([e,o]=await t(r.weightsManifest)),Ud(r,e,o)}function qr(r){if(r.modelTopology instanceof ArrayBuffer)throw new Error("Expected JSON model topology, received ArrayBuffer.");return{dateSaved:new Date,modelTopologyType:"JSON",modelTopologyBytes:r.modelTopology==null?0:u0(JSON.stringify(r.modelTopology)),weightSpecsBytes:r.weightSpecs==null?0:u0(JSON.stringify(r.weightSpecs)),weightDataBytes:r.weightData==null?0:new Te(r.weightData).byteLength}}function Ic(r){let t=[];for(let e of r)t.push(...e.weights);return t}function WA(){let r=e=>{let o=e<<13,n=0;for(;(o&8388608)===0;)n-=8388608,o<<=1;return o&=-8388609,n+=947912704,o|n},t=new Uint32Array(2048);t[0]=0;for(let e=1;e<1024;e++)t[e]=r(e);for(let e=1024;e<2048;e++)t[e]=939524096+(e-1024<<13);return t}function GA(){let r=new Uint32Array(64);r[0]=0,r[31]=1199570944,r[32]=2147483648,r[63]=3347054592;for(let t=1;t<31;t++)r[t]=t<<23;for(let t=33;t<63;t++)r[t]=2147483648+(t-32<<23);return r}function UA(){let r=new Uint32Array(64);for(let t=0;t<64;t++)r[t]=1024;return r[0]=r[32]=0,r}function HA(){let r=WA(),t=GA(),e=UA();return o=>{let n=new ArrayBuffer(4*o.length),s=new Uint32Array(n);for(let a=0;a<o.length;a++){let i=o[a],l=r[e[i>>10]+(i&1023)]+t[i>>10];s[a]=l}return new Float32Array(n)}}var de=class r{constructor(){this.saveRouters=[],this.loadRouters=[]}static getInstance(){return r.instance==null&&(r.instance=new r),r.instance}static registerSaveRouter(t){r.getInstance().saveRouters.push(t)}static registerLoadRouter(t){r.getInstance().loadRouters.push(t)}static getSaveHandlers(t){return r.getHandlers(t,"save")}static getLoadHandlers(t,e){return r.getHandlers(t,"load",e)}static getHandlers(t,e,o){let n=[];return(e==="load"?r.getInstance().loadRouters:r.getInstance().saveRouters).forEach(a=>{let i=a(t,o);i!==null&&n.push(i)}),n}},g0=r=>de.registerSaveRouter(r),x0=r=>de.registerLoadRouter(r),y0=r=>de.getSaveHandlers(r),b0=(r,t)=>de.getLoadHandlers(r,t);var Hd="tensorflowjs",Kd=1,xi="models_store",Xn="model_info_store";function w0(){if(!D().getBool("IS_BROWSER"))throw new Error("Failed to obtain IndexedDB factory because the current environmentis not a web browser.");let r=typeof window>"u"?self:window,t=r.indexedDB||r.mozIndexedDB||r.webkitIndexedDB||r.msIndexedDB||r.shimIndexedDB;if(t==null)throw new Error("The current browser does not appear to support IndexedDB.");return t}function qd(r){let t=r.result;t.createObjectStore(xi,{keyPath:"modelPath"}),t.createObjectStore(Xn,{keyPath:"modelPath"})}var jr=class{constructor(t){if(this.indexedDB=w0(),t==null||!t)throw new Error("For IndexedDB, modelPath must not be null, undefined or empty.");this.modelPath=t}async save(t){if(t.modelTopology instanceof ArrayBuffer)throw new Error("BrowserLocalStorage.save() does not support saving model topology in binary formats yet.");return this.databaseAction(this.modelPath,t)}async load(){return this.databaseAction(this.modelPath)}databaseAction(t,e){return new Promise((o,n)=>{let s=this.indexedDB.open(Hd,Kd);s.onupgradeneeded=()=>qd(s),s.onsuccess=()=>{let a=s.result;if(e==null){let i=a.transaction(xi,"readonly"),c=i.objectStore(xi).get(this.modelPath);c.onsuccess=()=>{if(c.result==null)return a.close(),n(new Error(`Cannot find model with path '${this.modelPath}' in IndexedDB.`));o(c.result.modelArtifacts)},c.onerror=u=>(a.close(),n(c.error)),i.oncomplete=()=>a.close()}else{e.weightData=Te.join(e.weightData);let i=qr(e),l=a.transaction(Xn,"readwrite"),c=l.objectStore(Xn),u;try{u=c.put({modelPath:this.modelPath,modelArtifactsInfo:i})}catch(m){return n(m)}let p;u.onsuccess=()=>{p=a.transaction(xi,"readwrite");let m=p.objectStore(xi),f;try{f=m.put({modelPath:this.modelPath,modelArtifacts:e,modelArtifactsInfo:i})}catch(d){return n(d)}f.onsuccess=()=>o({modelArtifactsInfo:i}),f.onerror=d=>{c=l.objectStore(Xn);let g=c.delete(this.modelPath);g.onsuccess=()=>(a.close(),n(f.error)),g.onerror=h=>(a.close(),n(f.error))}},u.onerror=m=>(a.close(),n(u.error)),l.oncomplete=()=>{p==null?a.close():p.oncomplete=()=>a.close()}}},s.onerror=a=>n(s.error)})}};jr.URL_SCHEME="indexeddb://";var v0=r=>D().getBool("IS_BROWSER")&&!Array.isArray(r)&&r.startsWith(jr.URL_SCHEME)?KA(r.slice(jr.URL_SCHEME.length)):null;de.registerSaveRouter(v0);de.registerLoadRouter(v0);function KA(r){return new jr(r)}function qA(r){return r.startsWith(jr.URL_SCHEME)?r.slice(jr.URL_SCHEME.length):r}var cp=class{constructor(){this.indexedDB=w0()}async listModels(){return new Promise((t,e)=>{let o=this.indexedDB.open(Hd,Kd);o.onupgradeneeded=()=>qd(o),o.onsuccess=()=>{let n=o.result,s=n.transaction(Xn,"readonly"),i=s.objectStore(Xn).getAll();i.onsuccess=()=>{let l={};for(let c of i.result)l[c.modelPath]=c.modelArtifactsInfo;t(l)},i.onerror=l=>(n.close(),e(i.error)),s.oncomplete=()=>n.close()},o.onerror=n=>e(o.error)})}async removeModel(t){return t=qA(t),new Promise((e,o)=>{let n=this.indexedDB.open(Hd,Kd);n.onupgradeneeded=()=>qd(n),n.onsuccess=()=>{let s=n.result,a=s.transaction(Xn,"readwrite"),i=a.objectStore(Xn),l=i.get(t),c;l.onsuccess=()=>{if(l.result==null)return s.close(),o(new Error(`Cannot find model with path '${t}' in IndexedDB.`));{let u=i.delete(t),p=()=>{c=s.transaction(xi,"readwrite");let f=c.objectStore(xi).delete(t);f.onsuccess=()=>e(l.result.modelArtifactsInfo),f.onerror=d=>o(l.error)};u.onsuccess=p,u.onerror=m=>(p(),s.close(),o(l.error))}},l.onerror=u=>(s.close(),o(l.error)),a.oncomplete=()=>{c==null?s.close():c.oncomplete=()=>s.close()}},n.onerror=s=>o(n.error)})}};var No="/",gl="tensorflowjs_models",S0="info",jA="model_topology",XA="weight_specs",YA="weight_data",QA="model_metadata";function C0(r){return{info:[gl,r,S0].join(No),topology:[gl,r,jA].join(No),weightSpecs:[gl,r,XA].join(No),weightData:[gl,r,YA].join(No),modelMetadata:[gl,r,QA].join(No)}}function T0(r){for(let t of Object.values(r))window.localStorage.removeItem(t)}function ZA(r){let t=r.split(No);if(t.length<3)throw new Error(`Invalid key format: ${r}`);return t.slice(1,t.length-1).join(No)}function JA(r){return r.startsWith(Xr.URL_SCHEME)?r.slice(Xr.URL_SCHEME.length):r}var Xr=class{constructor(t){if(!D().getBool("IS_BROWSER")||typeof window>"u"||typeof window.localStorage>"u")throw new Error("The current environment does not support local storage.");if(this.LS=window.localStorage,t==null||!t)throw new Error("For local storage, modelPath must not be null, undefined or empty.");this.modelPath=t,this.keys=C0(this.modelPath)}async save(t){if(t.modelTopology instanceof ArrayBuffer)throw new Error("BrowserLocalStorage.save() does not support saving model topology in binary formats yet.");{let e=JSON.stringify(t.modelTopology),o=JSON.stringify(t.weightSpecs),n=qr(t),s=Te.join(t.weightData);try{this.LS.setItem(this.keys.info,JSON.stringify(n)),this.LS.setItem(this.keys.topology,e),this.LS.setItem(this.keys.weightSpecs,o),this.LS.setItem(this.keys.weightData,f0(s));let a={format:t.format,generatedBy:t.generatedBy,convertedBy:t.convertedBy,signature:t.signature!=null?t.signature:void 0,userDefinedMetadata:t.userDefinedMetadata!=null?t.userDefinedMetadata:void 0,modelInitializer:t.modelInitializer!=null?t.modelInitializer:void 0,initializerSignature:t.initializerSignature!=null?t.initializerSignature:void 0,trainingConfig:t.trainingConfig!=null?t.trainingConfig:void 0};return this.LS.setItem(this.keys.modelMetadata,JSON.stringify(a)),{modelArtifactsInfo:n}}catch{throw T0(this.keys),new Error(`Failed to save model '${this.modelPath}' to local storage: size quota being exceeded is a possible cause of this failure: modelTopologyBytes=${n.modelTopologyBytes}, weightSpecsBytes=${n.weightSpecsBytes}, weightDataBytes=${n.weightDataBytes}.`)}}}async load(){let t=JSON.parse(this.LS.getItem(this.keys.info));if(t==null)throw new Error(`In local storage, there is no model with name '${this.modelPath}'`);if(t.modelTopologyType!=="JSON")throw new Error("BrowserLocalStorage does not support loading non-JSON model topology yet.");let e={},o=JSON.parse(this.LS.getItem(this.keys.topology));if(o==null)throw new Error(`In local storage, the topology of model '${this.modelPath}' is missing.`);e.modelTopology=o;let n=JSON.parse(this.LS.getItem(this.keys.weightSpecs));if(n==null)throw new Error(`In local storage, the weight specs of model '${this.modelPath}' are missing.`);e.weightSpecs=n;let s=this.LS.getItem(this.keys.modelMetadata);if(s!=null){let i=JSON.parse(s);e.format=i.format,e.generatedBy=i.generatedBy,e.convertedBy=i.convertedBy,i.signature!=null&&(e.signature=i.signature),i.userDefinedMetadata!=null&&(e.userDefinedMetadata=i.userDefinedMetadata),i.modelInitializer!=null&&(e.modelInitializer=i.modelInitializer),i.initializerSignature!=null&&(e.initializerSignature=i.initializerSignature),i.trainingConfig!=null&&(e.trainingConfig=i.trainingConfig)}let a=this.LS.getItem(this.keys.weightData);if(a==null)throw new Error(`In local storage, the binary weight values of model '${this.modelPath}' are missing.`);return e.weightData=d0(a),e}};Xr.URL_SCHEME="localstorage://";var N0=r=>D().getBool("IS_BROWSER")&&!Array.isArray(r)&&r.startsWith(Xr.URL_SCHEME)?tF(r.slice(Xr.URL_SCHEME.length)):null;de.registerSaveRouter(N0);de.registerLoadRouter(N0);function tF(r){return new Xr(r)}var up=class{constructor(){E(D().getBool("IS_BROWSER"),()=>"Current environment is not a web browser"),E(typeof window>"u"||typeof window.localStorage<"u",()=>"Current browser does not appear to support localStorage"),this.LS=window.localStorage}async listModels(){let t={},e=gl+No,o=No+S0;for(let n=0;n<this.LS.length;++n){let s=this.LS.key(n);if(s.startsWith(e)&&s.endsWith(o)){let a=ZA(s);t[a]=JSON.parse(this.LS.getItem(s))}}return t}async removeModel(t){t=JA(t);let e=C0(t);if(this.LS.getItem(e.info)==null)throw new Error(`Cannot find model at path '${t}'`);let o=JSON.parse(this.LS.getItem(e.info));return T0(e),o}};var xl="://",Ar=class r{constructor(){this.managers={}}static getInstance(){return r.instance==null&&(r.instance=new r),r.instance}static registerManager(t,e){E(t!=null,()=>"scheme must not be undefined or null."),t.endsWith(xl)&&(t=t.slice(0,t.indexOf(xl))),E(t.length>0,()=>"scheme must not be an empty string.");let o=r.getInstance();E(o.managers[t]==null,()=>`A model store manager is already registered for scheme '${t}'.`),o.managers[t]=e}static getManager(t){let e=r.getInstance().managers[t];if(e==null)throw new Error(`Cannot find model manager for scheme '${t}'`);return e}static getSchemes(){return Object.keys(r.getInstance().managers)}};function pp(r){if(r.indexOf(xl)===-1)throw new Error(`The url string provided does not contain a scheme. Supported schemes are: ${Ar.getSchemes().join(",")}`);return{scheme:r.split(xl)[0],path:r.split(xl)[1]}}async function I0(r,t,e=!1){E(r!==t,()=>`Old path and new path are the same: '${r}'`);let o=de.getLoadHandlers(r);E(o.length>0,()=>`Copying failed because no load handler is found for source URL ${r}.`),E(o.length<2,()=>`Copying failed because more than one (${o.length}) load handlers for source URL ${r}.`);let n=o[0],s=de.getSaveHandlers(t);E(s.length>0,()=>`Copying failed because no save handler is found for destination URL ${t}.`),E(s.length<2,()=>`Copying failed because more than one (${o.length}) save handlers for destination URL ${t}.`);let a=s[0],i=pp(r).scheme,l=pp(r).path,c=i===pp(r).scheme,u=await n.load();e&&c&&await Ar.getManager(i).removeModel(l);let p=await a.save(u);return e&&!c&&await Ar.getManager(i).removeModel(l),p.modelArtifactsInfo}async function k0(){let r=Ar.getSchemes(),t={};for(let e of r){let o=await Ar.getManager(e).listModels();for(let n in o){let s=e+xl+n;t[s]=o[n]}}return t}async function E0(r){let t=pp(r);return Ar.getManager(t.scheme).removeModel(t.path)}async function $0(r,t){return I0(r,t,!1)}async function R0(r,t){return I0(r,t,!0)}var jd=class{constructor(){this.messageName="setTimeoutCustom",this.functionRefs=[],this.handledMessageCount=0,this.hasEventListener=!1}fetch(t,e){return fetch(t,e)}now(){return performance.now()}encode(t,e){if(e!=="utf-8"&&e!=="utf8")throw new Error(`Browser's encoder only supports utf-8, but got ${e}`);return this.textEncoder==null&&(this.textEncoder=new TextEncoder),this.textEncoder.encode(t)}decode(t,e){return new TextDecoder(e).decode(t)}setTimeoutCustom(t,e){if(typeof window>"u"||!D().getBool("USE_SETTIMEOUTCUSTOM")){setTimeout(t,e);return}this.functionRefs.push(t),setTimeout(()=>{window.postMessage({name:this.messageName,index:this.functionRefs.length-1},"*")},e),this.hasEventListener||(this.hasEventListener=!0,window.addEventListener("message",o=>{if(o.source===window&&o.data.name===this.messageName){o.stopPropagation();let n=this.functionRefs[o.data.index];n(),this.handledMessageCount++,this.handledMessageCount===this.functionRefs.length&&(this.functionRefs=[],this.handledMessageCount=0)}},!0))}isTypedArray(t){return Yu(t)}};if(D().get("IS_BROWSER")){D().setPlatform("browser",new jd);try{Ar.registerManager(Xr.URL_SCHEME,new up)}catch{}try{Ar.registerManager(jr.URL_SCHEME,new cp)}catch{}}var eF={importFetch:()=>A0()},Xd;var Yd=class{constructor(){this.util=F0(),this.textEncoder=new this.util.TextEncoder}fetch(t,e){return D().global.fetch!=null?D().global.fetch(t,e):(Xd==null&&(Xd=eF.importFetch()),Xd(t,e))}now(){let t=process.hrtime();return t[0]*1e3+t[1]/1e6}encode(t,e){if(e!=="utf-8"&&e!=="utf8")throw new Error(`Node built-in encoder only supports utf-8, but got ${e}`);return this.textEncoder.encode(t)}decode(t,e){return t.length===0?"":new this.util.TextDecoder(e).decode(t)}isTypedArray(t){return this.util.types.isFloat32Array(t)||this.util.types.isInt32Array(t)||this.util.types.isUint8Array(t)||this.util.types.isUint8ClampedArray(t)}};D().get("IS_NODE")&&!D().get("IS_BROWSER")&&D().setPlatform("node",new Yd);function ot(r,t="float32",e){return t=t||"float32",Kt(r),new $t(r,t,e)}function rF(r,t){let e=v(r,"x","cast");if(!wd(t))throw new Error(`Failed to cast to unknown dtype ${t}`);if(t==="string"&&e.dtype!=="string"||t!=="string"&&e.dtype==="string")throw new Error("Only strings can be casted to strings");let o={x:e},n={dtype:t};return k.runKernel(xo,o,n)}var xt=T({cast_:rF});function oF(r){let e={x:v(r,"x","clone","string_or_numeric")};return k.runKernel(yo,e)}var qe=T({clone_:oF});function kc(r,t=!1){console.log(r.toString(t))}Bd();var nF={buffer:ot,cast:xt,clone:qe,print:kc};o0(nF);function sF(r,t){let e=v(r,"a","add"),o=v(t,"b","add");[e,o]=yt(e,o);let n={a:e,b:o};return k.runKernel("Add",n)}var Z=T({add_:sF});function aF(r,t){let e=v(r,"a","floorDiv"),o=v(t,"b","floorDiv");[e,o]=yt(e,o);let n={a:e,b:o};return k.runKernel(un,n)}var Ec=T({floorDiv_:aF});function iF(r,t){let e=v(r,"a","div"),o=v(t,"b","div");if([e,o]=yt(e,o),e.dtype==="int32"&&o.dtype==="int32")return Ec(e,o);let n={a:e,b:o},s={};return k.runKernel(sn,n,s)}var mt=T({div_:iF});function lF(r,t){let e=v(r,"a","mul"),o=v(t,"b","mul");[e,o]=yt(e,o);let n={a:e,b:o};return k.runKernel(Tn,n)}var K=T({mul_:lF});function cF(r){let t=v(r,"x","abs");if(t.dtype==="complex64"){let e={x:t};return k.runKernel(_s,e)}else{let e={x:t};return k.runKernel("Abs",e)}}var he=T({abs_:cF});function uF(r){let e={x:v(r,"x","acos")};return k.runKernel(jo,e)}var Qd=T({acos_:uF});function pF(r){let e={x:v(r,"x","acosh")};return k.runKernel(Xo,e)}var Zd=T({acosh_:pF});function mF(r){E(Array.isArray(r),()=>"The argument passed to tf.addN() must be a list of tensors"),E(r.length>=1,()=>`Must pass at least one tensor to tf.addN(), but got ${r.length}`);let t=r.map((n,s)=>v(n,`tensors${s}`,"addN")),e=t[0];t.forEach(n=>{if(n.dtype!==e.dtype)throw new Error("All tensors passed to tf.addN() must have the same dtype")}),t.forEach(n=>{if(!Pe(n.shape,e.shape))throw new Error("All tensors passed to tf.addN() must have the same shape")});let o=t;return k.runKernel(Cs,o)}var Jd=T({addN_:mF});function fF(r,t=null,e=!1){let n={x:v(r,"x","all","bool")},s={axis:t,keepDims:e};return k.runKernel("All",n,s)}var th=T({all_:fF});function dF(r,t=null,e=!1){let n={x:v(r,"x","any","bool")},s={axis:t,keepDims:e};return k.runKernel("Any",n,s)}var eh=T({any_:dF});function hF(r,t=0){let o={x:v(r,"x","argMax")},n={axis:t};return k.runKernel(Ts,o,n)}var $c=T({argMax_:hF});function gF(r,t=0){let o={x:v(r,"x","argMin")},n={axis:t};return k.runKernel(Ns,o,n)}var rh=T({argMin_:gF});function xF(r){let e={x:v(r,"x","asin")};return k.runKernel(Yo,e)}var oh=T({asin_:xF});function yF(r){let e={x:v(r,"x","asinh")};return k.runKernel(Qo,e)}var nh=T({asinh_:yF});function bF(r){let e={x:v(r,"x","atan")};return k.runKernel(Zo,e)}var sh=T({atan_:bF});function wF(r,t){let e=v(r,"a","atan2"),o=v(t,"b","atan2");[e,o]=yt(e,o);let n={a:e,b:o};return k.runKernel(tn,n)}var ah=T({atan2_:wF});function vF(r){let e={x:v(r,"x","atanh")};return k.runKernel(Jo,e)}var ih=T({atanh_:vF});function SF(r,t,e,o,n="NHWC",s){let a=r[3],i=[...t,a],l=D0(n);return bi(r,i,e,s,o,null,null,l)}function ch(r,t,e,o,n,s,a="channelsLast"){let[i,l]=Rc(t),c;if(a==="channelsLast")c=[i,l,r[3],r[3]];else if(a==="channelsFirst")c=[i,l,r[1],r[1]];else throw new Error(`Unknown dataFormat ${a}`);return bi(r,c,e,o,n,s,!1,a)}function CF(r,t,e,o,n,s,a="NDHWC"){let[i,l,c]=lh(t),u,p;if(a==="NDHWC")p="channelsLast",u=[i,l,c,r[4],r[4]];else if(a==="NCDHW")p="channelsFirst",u=[i,l,c,r[1],r[1]];else throw new Error(`Unknown dataFormat ${a}`);return _0(r,u,e,o,n,!1,p,s)}function bi(r,t,e,o,n,s,a=!1,i="channelsLast"){let[l,c,u,p]=[-1,-1,-1,-1];if(i==="channelsLast")[l,c,u,p]=r;else if(i==="channelsFirst")[l,p,c,u]=r;else throw new Error(`Unknown dataFormat ${i}`);let[m,f,,d]=t,[g,h]=Rc(e),[x,b]=Rc(o),C=yl(m,x),S=yl(f,b),{padInfo:I,outHeight:$,outWidth:R}=IF(n,c,u,g,h,C,S,s,i),A=a?d*p:d,F;return i==="channelsFirst"?F=[l,A,$,R]:i==="channelsLast"&&(F=[l,$,R,A]),{batchSize:l,dataFormat:i,inHeight:c,inWidth:u,inChannels:p,outHeight:$,outWidth:R,outChannels:A,padInfo:I,strideHeight:g,strideWidth:h,filterHeight:m,filterWidth:f,effectiveFilterHeight:C,effectiveFilterWidth:S,dilationHeight:x,dilationWidth:b,inShape:r,outShape:F,filterShape:t}}function _0(r,t,e,o,n,s=!1,a="channelsLast",i){let[l,c,u,p,m]=[-1,-1,-1,-1,-1];if(a==="channelsLast")[l,c,u,p,m]=r;else if(a==="channelsFirst")[l,m,c,u,p]=r;else throw new Error(`Unknown dataFormat ${a}`);let[f,d,g,,h]=t,[x,b,C]=lh(e),[S,I,$]=lh(o),R=yl(f,S),A=yl(d,I),F=yl(g,$),{padInfo:_,outDepth:O,outHeight:M,outWidth:P}=kF(n,c,u,p,x,b,C,R,A,F,i),B=s?h*m:h,V;return a==="channelsFirst"?V=[l,B,O,M,P]:a==="channelsLast"&&(V=[l,O,M,P,B]),{batchSize:l,dataFormat:a,inDepth:c,inHeight:u,inWidth:p,inChannels:m,outDepth:O,outHeight:M,outWidth:P,outChannels:B,padInfo:_,strideDepth:x,strideHeight:b,strideWidth:C,filterDepth:f,filterHeight:d,filterWidth:g,effectiveFilterDepth:R,effectiveFilterHeight:A,effectiveFilterWidth:F,dilationDepth:S,dilationHeight:I,dilationWidth:$,inShape:r,outShape:V,filterShape:t}}function TF(r,t,e,o,n){o==null&&(o=uh(r,t,e));let s=r[0],a=r[1],i=Ac((s-t+2*o)/e+1,n),l=Ac((a-t+2*o)/e+1,n);return[i,l]}function NF(r,t,e,o,n,s){n==null&&(n=uh(r,t[0],o[0]));let a=[0,0,0,e];for(let i=0;i<3;i++)r[i]+2*n>=t[i]&&(a[i]=Ac((r[i]-t[i]+2*n)/o[i]+1,s));return a}function uh(r,t,e,o=1){let n=yl(t,o);return Math.floor((r[0]*(e-1)-e+n)/2)}function Rc(r){return typeof r=="number"?[r,r,r]:r.length===2?[r[0],r[1],1]:r}function lh(r){return typeof r=="number"?[r,r,r]:r}function yl(r,t){return t<=1?r:r+(r-1)*(t-1)}function IF(r,t,e,o,n,s,a,i,l){let c,u,p;if(typeof r=="number"){c={top:r,bottom:r,left:r,right:r,type:r===0?"VALID":"NUMBER"};let f=TF([t,e],s,o,r,i);u=f[0],p=f[1]}else if(r==="same"){u=Math.ceil(t/o),p=Math.ceil(e/n);let m=Math.max(0,(u-1)*o+s-t),f=Math.max(0,(p-1)*n+a-e),d=Math.floor(m/2),g=m-d,h=Math.floor(f/2),x=f-h;c={top:d,bottom:g,left:h,right:x,type:"SAME"}}else if(r==="valid")c={top:0,bottom:0,left:0,right:0,type:"VALID"},u=Math.ceil((t-s+1)/o),p=Math.ceil((e-a+1)/n);else if(typeof r=="object"){let m=l==="channelsLast"?r[1][0]:r[2][0],f=l==="channelsLast"?r[1][1]:r[2][1],d=l==="channelsLast"?r[2][0]:r[3][0],g=l==="channelsLast"?r[2][1]:r[3][1];c={top:m,bottom:f,left:d,right:g,type:m===0&&f===0&&d===0&&g===0?"VALID":"EXPLICIT"},u=Ac((t-s+m+f)/o+1,i),p=Ac((e-a+d+g)/n+1,i)}else throw Error(`Unknown padding parameter: ${r}`);return{padInfo:c,outHeight:u,outWidth:p}}function kF(r,t,e,o,n,s,a,i,l,c,u){let p,m,f,d;if(r==="valid"&&(r=0),typeof r=="number"){p={top:r,bottom:r,left:r,right:r,front:r,back:r,type:r===0?"VALID":"NUMBER"};let h=NF([t,e,o,1],[i,l,c],1,[n,s,a],r,u);m=h[0],f=h[1],d=h[2]}else if(r==="same"){m=Math.ceil(t/n),f=Math.ceil(e/s),d=Math.ceil(o/a);let g=(m-1)*n+i-t,h=(f-1)*s+l-e,x=(d-1)*a+c-o,b=Math.floor(g/2),C=g-b,S=Math.floor(h/2),I=h-S,$=Math.floor(x/2),R=x-$;p={top:S,bottom:I,left:$,right:R,front:b,back:C,type:"SAME"}}else throw Error(`Unknown padding parameter: ${r}`);return{padInfo:p,outDepth:m,outHeight:f,outWidth:d}}function Ac(r,t){if(!t)return Math.trunc(r);switch(t){case"round":return Math.round(r);case"ceil":return Math.ceil(r);case"floor":return Math.floor(r);default:throw new Error(`Unknown roundingMode ${t}`)}}function yi(r){let[t,e,o]=Rc(r);return t===1&&e===1&&o===1}function Ae(r,t){return yi(r)||yi(t)}function Yr(r){return Rc(r).every(t=>t>0)}function D0(r){if(r==="NHWC")return"channelsLast";if(r==="NCHW")return"channelsFirst";throw new Error(`Unknown dataFormat ${r}`)}function ie(r,t,e){if(e!=null){if(typeof t=="string")throw Error(`Error in ${r}: pad must be an integer when using dimRoundingMode ${e} but got pad ${t}.`);if(typeof t=="number")E(ho(t),()=>`Error in ${r}: pad must be an integer when using dimRoundingMode ${e} but got pad ${t}.`);else if(typeof t=="object")t.forEach(o=>{o.forEach(n=>{E(ho(n),()=>`Error in ${r}: pad must be an integer when using dimRoundingMode ${e} but got pad ${n}.`)})});else throw Error(`Error in ${r}: Unknown padding parameter: ${t}`)}}function EF(r,t){let o={x:v(r,"x","reshape","string_or_numeric")},n={shape:t};return k.runKernel(Da,o,n)}var L=T({reshape_:EF});function $F(r,t,e,o,n){let s=v(r,"x","avgPool","float32"),a=1;E(Ae(e,a),()=>`Error in avgPool: Either strides or dilations must be 1. Got strides ${e} and dilations '${a}'`);let i=s,l=!1;s.rank===3&&(l=!0,i=L(s,[1,s.shape[0],s.shape[1],s.shape[2]])),E(i.rank===4,()=>`Error in avgPool: x must be rank 4 but got rank ${i.rank}.`),ie("avgPool",o,n);let c={x:i},u={filterSize:t,strides:e,pad:o,dimRoundingMode:n},p=k.runKernel(Is,c,u);return p=xt(p,s.dtype),l?L(p,[p.shape[1],p.shape[2],p.shape[3]]):p}var Fc=T({avgPool_:$F});function RF(r,t,e,o,n,s="NDHWC"){let a=v(r,"x","avgPool3d","float32"),i=a,l=!1;a.rank===4&&(l=!0,i=L(a,[1,a.shape[0],a.shape[1],a.shape[2],a.shape[3]])),E(i.rank===5,()=>`Error in avgPool3d: x must be rank 5 but got rank ${i.rank}.`),E(s==="NDHWC",()=>`Error in avgPool3d: Only NDHWC is currently supported, but got dataFormat of ${s}`),E(typeof e=="number"&&e>0||Array.isArray(e)&&e[0]>0&&e[1]>0&&e[2]>0,()=>`Error in avgPool3d: Stride must be > 0, but got '${e}'`),ie("avgPool3d",o,n);let c={x:i},u={filterSize:t,strides:e,pad:o,dimRoundingMode:n,dataFormat:s},p=k.runKernel(ks,c,u);return p=xt(p,i.dtype),l?L(p,[p.shape[1],p.shape[2],p.shape[3],p.shape[4]]):p}var ph=T({avgPool3d_:RF});function AF(r,t=0){E(r.length>=1,()=>"Pass at least one tensor to concat");let e=So(r,"tensors","concat","string_or_numeric");if(e[0].dtype==="complex64"&&e.forEach(s=>{if(s.dtype!=="complex64")throw new Error(`Cannot concatenate complex64 tensors with a tensor
          with dtype ${s.dtype}. `)}),e.length===1)return qe(e[0]);let o=e,n={axis:t};return k.runKernel(Ds,o,n)}var Lt=T({concat_:AF});function FF(r,t,e=!1,o=!1){let n=v(r,"a","matMul"),s=v(t,"b","matMul");[n,s]=yt(n,s);let a={a:n,b:s},i={transposeA:e,transposeB:o};return k.runKernel(Es,a,i)}var Et=T({matMul_:FF});function _F(r){let e={x:v(r,"x","sigmoid","float32")};return k.runKernel(Dn,e)}var je=T({sigmoid_:_F});function DF(r,t,e){let o=v(r,"x","slice","string_or_numeric");if(o.rank===0)throw new Error("Slicing scalar is not possible");let n={x:o},s={begin:t,size:e};return k.runKernel(Wa,n,s)}var ft=T({slice_:DF});function OF(r){let e={x:v(r,"x","tanh","float32")};return k.runKernel(Bn,e)}var bl=T({tanh_:OF});function PF(r,t,e,o,n,s){let a=v(r,"forgetBias","basicLSTMCell"),i=v(t,"lstmKernel","basicLSTMCell"),l=v(e,"lstmBias","basicLSTMCell"),c=v(o,"data","basicLSTMCell"),u=v(n,"c","basicLSTMCell"),p=v(s,"h","basicLSTMCell"),m=Lt([c,p],1),f=Et(m,i),d=Z(f,l),g=d.shape[0],h=d.shape[1]/4,x=[g,h],b=ft(d,[0,0],x),C=ft(d,[0,h],x),S=ft(d,[0,h*2],x),I=ft(d,[0,h*3],x),$=Z(K(je(b),bl(C)),K(u,je(Z(a,S)))),R=K(bl($),je(I));return[$,R]}var mh=T({basicLSTMCell_:PF});function MF(r,t,e){let o=v(r,"x","batchToSpaceND"),n=t.reduce((i,l)=>i*l);E(o.rank>=1+t.length,()=>`input rank is ${o.rank} but should be > than blockShape.length ${t.length}`),E(e.length===t.length,()=>`crops.length is ${e.length} but should be equal to blockShape.length  ${t.length}`),E(o.shape[0]%n===0,()=>`input tensor batch is ${o.shape[0]} but is not divisible by the product of the elements of blockShape ${t.join(" * ")} === ${n}`);let s={x:o},a={blockShape:t,crops:e};return k.runKernel($s,s,a)}var _c=T({batchToSpaceND_:MF});function O0(r){let t;return r.rank===0||r.rank===1?t=L(r,[1,1,1,r.size]):r.rank===2?t=L(r,[1,1,r.shape[0],r.shape[1]]):r.rank===3?t=L(r,[1,r.shape[0],r.shape[1],r.shape[2]]):t=r,t}function LF(r,t,e,o,n,s){s==null&&(s=.001);let a=v(r,"x","batchNorm"),i=v(t,"mean","batchNorm"),l=v(e,"variance","batchNorm"),c;n!=null&&(c=v(n,"scale","batchNorm"));let u;o!=null&&(u=v(o,"offset","batchNorm")),E(i.rank===l.rank,()=>"Batch normalization gradient requires mean and variance to have equal ranks."),E(u==null||i.rank===u.rank,()=>"Batch normalization gradient requires mean and offset to have equal ranks."),E(c==null||i.rank===c.rank,()=>"Batch normalization gradient requires mean and scale to have equal ranks.");let m={x:O0(a),scale:c,offset:u,mean:i,variance:l},f={varianceEpsilon:s},d=k.runKernel(na,m,f);return L(d,a.shape)}var Io=T({batchNorm_:LF});function BF(r,t,e,o,n,s){let a=v(r,"x","batchNorm"),i=v(t,"mean","batchNorm"),l=v(e,"variance","batchNorm"),c;n!=null&&(c=v(n,"scale","batchNorm"));let u;return o!=null&&(u=v(o,"offset","batchNorm")),E(a.rank===2,()=>`Error in batchNorm2D: x must be rank 2 but got rank ${a.rank}.`),E(i.rank===2||i.rank===1,()=>`Error in batchNorm2D: mean must be rank 2 or rank 1 but got rank ${i.rank}.`),E(l.rank===2||l.rank===1,()=>`Error in batchNorm2D: variance must be rank 2 or rank 1 but got rank ${l.rank}.`),c!=null&&E(c.rank===2||c.rank===1,()=>`Error in batchNorm2D: scale must be rank 2 or rank 1 but got rank ${c.rank}.`),u!=null&&E(u.rank===2||u.rank===1,()=>`Error in batchNorm2D: offset must be rank 2 or rank 1 but got rank ${u.rank}.`),Io(a,i,l,u,c,s)}var fh=T({batchNorm2d_:BF});function VF(r,t,e,o,n,s){let a=v(r,"x","batchNorm"),i=v(t,"mean","batchNorm"),l=v(e,"variance","batchNorm"),c;n!=null&&(c=v(n,"scale","batchNorm"));let u;return o!=null&&(u=v(o,"offset","batchNorm")),E(a.rank===3,()=>`Error in batchNorm3D: x must be rank 3 but got rank ${a.rank}.`),E(i.rank===3||i.rank===1,()=>`Error in batchNorm3D: mean must be rank 3 or rank 1 but got rank ${i.rank}.`),E(l.rank===3||l.rank===1,()=>`Error in batchNorm3D: variance must be rank 3 or rank 1 but got rank ${l.rank}.`),c!=null&&E(c.rank===3||c.rank===1,()=>`Error in batchNorm3D: scale must be rank 3 or rank 1 but got rank ${c.rank}.`),u!=null&&E(u.rank===3||u.rank===1,()=>`Error in batchNorm3D: offset must be rank 3 or rank 1 but got rank ${u.rank}.`),Io(a,i,l,u,c,s)}var dh=T({batchNorm3d_:VF});function zF(r,t,e,o,n,s){let a=v(r,"x","batchNorm"),i=v(t,"mean","batchNorm"),l=v(e,"variance","batchNorm"),c;n!=null&&(c=v(n,"scale","batchNorm"));let u;return o!=null&&(u=v(o,"offset","batchNorm")),E(a.rank===4,()=>`Error in batchNorm4D: x must be rank 4 but got rank ${a.rank}.`),E(i.rank===4||i.rank===1,()=>`Error in batchNorm4D: mean must be rank 4 or rank 1 but got rank ${i.rank}.`),E(l.rank===4||l.rank===1,()=>`Error in batchNorm4D: variance must be rank 4 or rank 1 but got rank ${l.rank}.`),c!=null&&E(c.rank===4||c.rank===1,()=>`Error in batchNorm4D: scale must be rank 4 or rank 1 but got rank ${c.rank}.`),u!=null&&E(u.rank===4||u.rank===1,()=>`Error in batchNorm4D: offset must be rank 4 or rank 1 but got rank ${u.rank}.`),Io(a,i,l,u,c,s)}var hh=T({batchNorm4d_:zF});function WF(r,t,e){let o=v(r,"x","bincount"),n=v(t,"weights","bincount");E(o.dtype==="int32",()=>`Error in bincount: input dtype must be int32, but got ${o.dtype}`),E(e>=0,()=>`size must be non-negative, but got ${e}.`),E(n.size===o.size||n.size===0,()=>`Error in bincount: weights must have the same size as input or0-length, but got input shape: ${o.shape}, weights shape: ${n.shape}.`);let s={x:o,weights:n},a={size:e};return k.runKernel(Rs,s,a)}var Dc=T({bincount_:WF});function GF(r,t){let e=v(r,"x","bitwiseAnd"),o=v(t,"y","bitwiseAnd");if(!Pe(e.shape,o.shape))throw new Error(`BitwiseAnd: Tensors must have the same shape. x: ${e.shape}, y: ${o.shape}`);if(e.dtype!=="int32"||o.dtype!=="int32")throw new Error(`BitwiseAnd: Only supports 'int32' values in tensor, found type of x: ${e.dtype} and type of y: ${o.dtype}`);let n={a:e,b:o};return k.runKernel(en,n)}var gh=T({bitwiseAnd_:GF});function UF(r,t){let e=v(r,"s0","broadcastArgs","int32"),o=v(t,"s1","broadcastArgs","int32");if(e.rank!==1)throw new Error(`broadcastArgs(): first input must be a vector (rank=1). Has rank ${e.rank}`);if(o.rank!==1)throw new Error(`broadcastArgs(): second input must be a vector (rank=1). Has rank ${o.rank}`);let n={s0:e,s1:o};return k.runKernel(As,n)}var xh=T({broadcastArgs_:UF});function HF(r,t){let e=v(r,"broadcastTo","x"),o=e.shape;if(Kt(t),t.length<e.rank)throw new Error(`broadcastTo(): shape.length=${t.length} < input.rank=${e.rank}.`);if(t.length>e.rank){let c=e.shape.slice();for(;c.length<t.length;)c.unshift(1);e=L(e,c)}let n=e.shape,s=Array.from(t);for(let c=t.length-1;c>=0;c--)if(n[c]===t[c])s[c]=1;else if(e.shape[c]!==1)throw new Error(`broadcastTo(): [${o}] cannot be broadcast to [${t}].`);if(s.map((c,u)=>c>1?u:-1).filter(c=>c>=0).length===0)return qe(e);let i={x:e},l={reps:s};return k.runKernel(bo,i,l)}var ko=T({broadcastTo_:HF});function KF(r){let e={x:v(r,"x","ceil","float32")};return k.runKernel(rn,e)}var yh=T({ceil_:KF});function Fr(r,t,e){Kt(r),e=e||qo(t);let o={shape:r,value:t,dtype:e};return k.runKernel(ra,{},o)}function qF(r,t,e){let o=v(r,"x","clipByValue");if(E(t<=e,()=>`Error in clip: min (${t}) must be less than or equal to max (${e}).`),t===e)return Fr(o.shape,t,o.dtype);let n={x:o},s={clipValueMin:t,clipValueMax:e};return k.runKernel(on,n,s)}var Oc=T({clipByValue_:qF});function jF(r){return Lt(r,0)}var bh=T({concat1d_:jF});function XF(r,t){return Lt(r,t)}var wh=T({concat2d_:XF});function YF(r,t){return Lt(r,t)}var vh=T({concat3d_:YF});function QF(r,t){return Lt(r,t)}var Sh=T({concat4d_:QF});function ZF(r,t,e,o,n="NHWC",s=[1,1],a){let i=v(r,"x","conv2d","float32"),l=v(t,"filter","conv2d","float32"),c=i,u=!1;i.rank===3&&(u=!0,c=L(i,[1,i.shape[0],i.shape[1],i.shape[2]])),E(c.rank===4,()=>`Error in conv2d: input must be rank 4, but got rank ${c.rank}.`),E(l.rank===4,()=>`Error in conv2d: filter must be rank 4, but got rank ${l.rank}.`),ie("conv2d",o,a);let p=n==="NHWC"?c.shape[3]:c.shape[1];E(p===l.shape[2],()=>`Error in conv2d: depth of input (${p}) must match input depth for filter ${l.shape[2]}.`),E(Ae(e,s),()=>`Error in conv2D: Either strides or dilations must be 1. Got strides ${e} and dilations '${s}'`),E(Yr(s),()=>"Error in conv2D: Dilated rates should be larger than 0."),E(Yr(e),()=>"Error in conv2D: Strides should be larger than 0.");let m={x:c,filter:l},f={strides:e,pad:o,dataFormat:n,dilations:s,dimRoundingMode:a},d=k.runKernel(Os,m,f);return u?L(d,[d.shape[1],d.shape[2],d.shape[3]]):d}var Eo=T({conv2d_:ZF});function JF(r,t,e,o,n="NWC",s=1,a){let i=v(r,"x","conv1d"),l=v(t,"filter","conv1d"),c=i,u=!1;i.rank===2&&(u=!0,c=L(i,[1,i.shape[0],i.shape[1]])),E(c.rank===3,()=>`Error in conv1d: input must be rank 3, but got rank ${c.rank}.`),E(l.rank===3,()=>`Error in conv1d: filter must be rank 3, but got rank ${l.rank}.`),ie("conv1d",o,a),E(c.shape[2]===l.shape[1],()=>`Error in conv1d: depth of input (${c.shape[2]}) must match input depth for filter ${l.shape[1]}.`),E(Ae(e,s),()=>`Error in conv1D: Either stride or dilation must be 1. Got stride ${e} and dilation '${s}'`),E(Yr(s),()=>"Error in conv1D: Dilated rates should be larger than 0."),E(Yr(e),()=>"Error in conv1D: Stride should be larger than 0."),E(n==="NWC",()=>`Error in conv1d: got dataFormat of ${n} but only NWC is currently supported.`);let p=L(l,[1,l.shape[0],l.shape[1],l.shape[2]]),m=L(c,[c.shape[0],1,c.shape[1],c.shape[2]]),h=Eo(m,p,[1,e],o,"NHWC",[1,s],a);return u?L(h,[h.shape[2],h.shape[3]]):L(h,[h.shape[0],h.shape[2],h.shape[3]])}var Ch=T({conv1d_:JF});function t_(r,t,e,o,n,s="NHWC",a){E(r.length===t.rank,()=>`Length of inShape (${r.length}) and rank of dy (${t.rank}) must match`);let i=r,l=t,c=!1;t.rank===3&&(c=!0,l=L(t,[1,t.shape[0],t.shape[1],t.shape[2]]),i=[1,r[0],r[1],r[2]]),E(i.length===4,()=>`Error in conv2dDerInput: inShape must be length 4, but got length ${i.length}.`),E(l.rank===4,()=>`Error in conv2dDerInput: dy must be rank 4, but got rank ${l.rank}`),E(e.rank===4,()=>`Error in conv2dDerInput: filter must be rank 4, but got rank ${e.rank}`);let u=s==="NHWC"?i[3]:i[1],p=s==="NHWC"?l.shape[3]:l.shape[1];E(u===e.shape[2],()=>`Error in conv2dDerInput: depth of input (${u}) must match input depth for filter ${e.shape[2]}.`),E(p===e.shape[3],()=>`Error in conv2dDerInput: depth of output (${p}) must match output depth for filter ${e.shape[3]}.`),ie("conv2dDerInput",n,a);let m={dy:l,filter:e},f={strides:o,pad:n,dataFormat:s,dimRoundingMode:a,inputShape:i},d=k.runKernel(Ms,m,f);return c?L(d,[d.shape[1],d.shape[2],d.shape[3]]):d}var mp=T({conv2DBackpropInput_:t_});function e_(r,t,e,o,n,s){let a=v(r,"x","conv2dTranspose"),i=v(t,"filter","conv2dTranspose");return mp(e,a,i,o,n,"NHWC",s)}var Th=T({conv2dTranspose_:e_});function r_(r,t,e,o,n="NDHWC",s=[1,1,1]){let a=v(r,"x","conv3d"),i=v(t,"filter","conv3d"),l=a,c=!1;a.rank===4&&(c=!0,l=L(a,[1,a.shape[0],a.shape[1],a.shape[2],a.shape[3]])),E(l.rank===5,()=>`Error in conv3d: input must be rank 5, but got rank ${l.rank}.`),E(i.rank===5,()=>`Error in conv3d: filter must be rank 5, but got rank ${i.rank}.`),E(l.shape[4]===i.shape[3],()=>`Error in conv3d: depth of input (${l.shape[4]}) must match input depth for filter ${i.shape[3]}.`),E(Ae(e,s),()=>`Error in conv3D: Either strides or dilations must be 1. Got strides ${e} and dilations '${s}'`),E(n==="NDHWC",()=>`Error in conv3d: got dataFormat of ${n} but only NDHWC is currently supported.`),E(Yr(s),()=>"Error in conv3D: Dilated rates should be larger than 0."),E(Yr(e),()=>"Error in conv3D: Strides should be larger than 0.");let u={x:l,filter:i},p={strides:e,pad:o,dataFormat:n,dilations:s},m=k.runKernel(Ls,u,p);return c?L(m,[m.shape[1],m.shape[2],m.shape[3],m.shape[4]]):m}var Nh=T({conv3d_:r_});function o_(r,t,e,o,n){E(r.length===t.rank,()=>`Length of inShape (${r.length}) and rank of dy (${t.rank}) must match`);let s=r,a=t,i=!1;t.rank===4&&(i=!0,a=L(t,[1,t.shape[0],t.shape[1],t.shape[2],t.shape[3]]),s=[1,r[0],r[1],r[2],r[3]]);let l=s[4],c=a.shape[4];E(s.length===5,()=>`Error in conv3dDerInput: inShape must be length 5, but got length ${s.length}.`),E(a.rank===5,()=>`Error in conv3dDerInput: dy must be rank 5, but got rank ${a.rank}`),E(e.rank===5,()=>`Error in conv3dDerInput: filter must be rank 5, but got rank ${e.rank}`),E(l===e.shape[3],()=>`Error in conv3dDerInput: depth of input (${l}) must match input depth for filter ${e.shape[3]}.`),E(c===e.shape[4],()=>`Error in conv3dDerInput: depth of output (${c}) must match output depth for filter ${e.shape[4]}.`);let u={dy:a,filter:e},p={pad:n,strides:o,inputShape:s},m=k.runKernel(Bs,u,p);return i?L(m,[m.shape[1],m.shape[2],m.shape[3],m.shape[4]]):m}var P0=T({conv3DBackpropInput_:o_});function n_(r,t,e,o,n){let s=v(r,"x","conv3dTranspose"),a=v(t,"filter","conv3dTranspose");return P0(e,s,a,o,n)}var Ih=T({conv3dTranspose_:n_});function s_(r){let e={x:v(r,"x","cos","float32")};return k.runKernel("Cos",e)}var kh=T({cos_:s_});function a_(r){let e={x:v(r,"x","cosh","float32")};return k.runKernel(nn,e)}var Eh=T({cosh_:a_});function i_(r,t=0,e=!1,o=!1){let s={x:v(r,"x","cumprod")},a={axis:t,exclusive:e,reverse:o};return k.runKernel(zs,s,a)}var $h=T({cumprod_:i_});function l_(r,t=0,e=!1,o=!1){let s={x:v(r,"x","cumsum")},a={axis:t,exclusive:e,reverse:o};return k.runKernel(Ws,s,a)}var Rh=T({cumsum_:l_});function c_(r,t,e,o=!1){let n=v(r,"x","denseBincount"),s=v(t,"weights","denseBincount");E(n.dtype==="int32",()=>`Error in denseBincount: input dtype must be int32, but got ${n.dtype}`),E(n.rank<=2,()=>`Error in denseBincount: input must be at most rank 2, but got rank ${n.rank}.`),E(e>=0,()=>`size must be non-negative, but got ${e}.`),E(s.size===n.size||s.size===0,()=>`Error in denseBincount: weights must have the same shape as x or 0-length, but got x shape: ${n.shape}, weights shape: ${s.shape}.`);let a={x:n,weights:s},i={size:e,binaryOutput:o};return k.runKernel(Us,a,i)}var Ah=T({denseBincount_:c_});function u_(r,t,e="NHWC"){let o=v(r,"x","depthToSpace","float32"),n=e==="NHWC"?o.shape[1]:o.shape[2],s=e==="NHWC"?o.shape[2]:o.shape[3],a=e==="NHWC"?o.shape[3]:o.shape[1];E(t>1,()=>`blockSize should be > 1 for depthToSpace, but was: ${t}`),E(n*t>=0,()=>`Negative dimension size caused by overflow when multiplying
    ${n} and ${t}  for depthToSpace with input shape
    ${o.shape}`),E(s*t>=0,()=>`Negative dimension size caused by overflow when multiplying
    ${s} and ${t} for depthToSpace with input shape
        ${o.shape}`),E(a%(t*t)===0,()=>`Dimension size must be evenly divisible by ${t*t} but is ${a} for depthToSpace with input shape ${o.shape}`);let i={x:o},l={blockSize:t,dataFormat:e};return k.runKernel(Hs,i,l)}var Fh=T({depthToSpace_:u_});function p_(r,t,e,o,n="NHWC",s=[1,1],a){let i=v(r,"x","depthwiseConv2d","float32"),l=v(t,"filter","depthwiseConv2d","float32"),c=i,u=!1;i.rank===3&&(u=!0,c=L(i,[1,i.shape[0],i.shape[1],i.shape[2]])),E(c.rank===4,()=>`Error in depthwiseConv2d: input must be rank 4, but got rank ${c.rank}.`),E(l.rank===4,()=>`Error in depthwiseConv2d: filter must be rank 4, but got rank ${l.rank}.`);let p=n==="NHWC"?c.shape[3]:c.shape[1];E(p===l.shape[2],()=>`Error in depthwiseConv2d: number of input channels (${p}) must match the inChannels dimension in filter ${l.shape[2]}.`),ie("depthwiseConv2d",o,a);let m={x:c,filter:l},f={strides:e,pad:o,dataFormat:n,dilations:s,dimRoundingMode:a},d=k.runKernel(Ks,m,f);return u?L(d,[d.shape[1],d.shape[2],d.shape[3]]):d}var wi=T({depthwiseConv2d_:p_});function m_(r){let e={x:v(r,"x","diag")};return k.runKernel(Xs,e)}var _h=T({diag_:m_});function f_(r,t,e,o,n=[1,1],s="NHWC"){let a=v(r,"x","dilation2d"),i=v(t,"filter","dilation2d");E(a.rank===3||a.rank===4,()=>`Error in dilation2d: input must be rank 3 or 4, but got rank ${a.rank}.`),E(i.rank===3,()=>`Error in dilation2d: filter must be rank 3, but got rank ${i.rank}.`),E(s==="NHWC",()=>`Error in dilation2d: Only NHWC is currently supported, but got dataFormat of ${s}`);let l=a,c=!1;a.rank===3&&(l=L(a,[1,a.shape[0],a.shape[1],a.shape[2]]),c=!0),E(l.shape[3]===i.shape[2],()=>`Error in dilation2d:  input and filter must have the same depth: ${l.shape[3]} vs ${i.shape[2]}`);let u={x:l,filter:i},p={strides:e,pad:o,dilations:n},m=k.runKernel(Ys,u,p);return c?L(m,[m.shape[1],m.shape[2],m.shape[3]]):m}var Dh=T({dilation2d_:f_});var _r={};kt(_r,{assertAndGetBroadcastShape:()=>At,getBroadcastDims:()=>M0,getReductionAxes:()=>fp});function M0(r,t){let e=r.length,o=[];for(let n=0;n<e;n++){let s=e-1-n,a=r[s]||1;(t[t.length-1-n]||1)>1&&a===1&&o.unshift(s)}return o}function fp(r,t){let e=[];for(let o=0;o<t.length;o++){let n=r[r.length-o-1],s=t.length-o-1,a=t[s];(n==null||n===1&&a>1)&&e.unshift(s)}return e}function At(r,t){let e=Math.max(r.length,t.length),o=new Array(e);for(let n=0;n<e;n++){let s=r[r.length-n-1];s==null&&(s=1);let a=t[t.length-n-1];if(a==null&&(a=1),s===1)o[e-n-1]=a;else if(a===1)o[e-n-1]=s;else if(s!==a){let i=`Operands could not be broadcast together with shapes ${r} and ${t}.`;throw Error(i)}else o[e-n-1]=s}return o}function d_(r,t){let e=v(r,"a","equal","string_or_numeric"),o=v(t,"b","equal","string_or_numeric");[e,o]=yt(e,o),At(e.shape,o.shape);let n={a:e,b:o};return k.runKernel(an,n)}var Pc=T({equal_:d_});function h_(r,t,e){let o=v(t,"a","where"),n=v(e,"b","where"),s=v(r,"condition","where","bool"),a=At(At(s.shape,o.shape),n.shape),i=ko(s,a),l=ko(o,a),c=ko(n,a),u={condition:i,t:l,e:c};return k.runKernel(za,u)}var sr=T({where_:h_});function g_(r){let e={x:v(r,"x","zerosLike")};return k.runKernel(ci,e)}var ce=T({zerosLike_:g_});function x_(r,t){let e=v(r,"a","div"),o=v(t,"b","div");[e,o]=yt(e,o);let n=mt(e,o),s=ce(n),a=Pc(o,s);return sr(a,s,n)}var Oh=T({divNoNan_:x_});function y_(r,t){let e=v(r,"t1","dot"),o=v(t,"t2","dot");E((e.rank===1||e.rank===2)&&(o.rank===1||o.rank===2),()=>`Error in dot: inputs must all be rank 1 or 2, but got ranks ${e.rank} and ${o.rank}.`);let n=e.rank===1?e.size:e.shape[1],s=o.rank===1?o.size:o.shape[0];if(E(n===s,()=>`Error in dot: inner dimensions of inputs must match, but got ${n} and ${s}.`),e.rank===1&&o.rank===1){let a=L(e,[1,-1]),i=L(o,[-1,1]),l=Et(a,i);return L(l,[])}else if(e.rank===1&&o.rank===2){let a=L(e,[1,-1]),i=L(o,[o.shape[0],o.shape[1]]),l=Et(a,i);return L(l,[l.size])}else if(e.rank===2&&o.rank===1){let a=L(o,[-1,1]),i=Et(e,a);return L(i,[i.size])}else{let a=L(o,[o.shape[0],o.shape[1]]);return Et(e,a)}}var Ph=T({dot_:y_});function b_(r,...t){let e=t.map((n,s)=>v(n,`tensors${s}`,"einsum")),o={equation:r};return k.runKernel(Qs,e,o)}var $o=T({einsum_:b_});function w_(r){let e={x:v(r,"x","elu","float32")};return k.runKernel("Elu",e)}var Mc=T({elu_:w_});function v_(r,t){let e=v(r,"x","ensureShape","string_or_numeric");if(!gd(e.shape,t))throw new Error(`EnsureShape: Shape of tensor ${e.shape} is not compatible with expected shape ${t}`);return r}var Mh=T({ensureShape_:v_});function S_(r){let t=v(r,"x","erf");E(t.dtype==="int32"||t.dtype==="float32",()=>"Input dtype must be `int32` or `float32`."),t.dtype==="int32"&&(t=xt(t,"float32"));let e={x:t};return k.runKernel("Erf",e)}var Lh=T({erf_:S_});function Bh(r,t){for(let e=0;e<r.length;++e)if(r[r.length-e-1]!==t-1-e)return!1;return!0}function L0(r,t,e){let o=r.length+t.length,n=[],s=0,a=0;for(let i=0;i<o;i++)e.indexOf(i)===-1?n.push(r[s++]):n.push(t[a++]);return n}function C_(r,t){let e=[],o=r.length;for(let s=0;s<o;s++)t.indexOf(s)===-1&&e.push(r[s]);let n=t.map(s=>r[s]);return[e,n]}function Ro(r,t){let e=t.map(o=>1);return L0(r,e,t)}function T_(r,t,e){E(Bh(t,e),()=>`${r} supports only inner-most axes for now. Got axes ${t} and rank-${e} input.`)}function N_(r,t){if(Bh(r,t))return null;let e=[];for(let o=0;o<t;++o)r.indexOf(o)===-1&&e.push(o);return r.forEach(o=>e.push(o)),e}function I_(r){return r.map((t,e)=>[e,t]).sort((t,e)=>t[1]-e[1]).map(t=>t[0])}function k_(r,t){let e=[];for(let o=t-r;o<t;++o)e.push(o);return e}function $_(r,t=null,e=!1){let n={x:v(r,"x","max")},s={reductionIndices:t,keepDims:e};return k.runKernel("Max",n,s)}var Dr=T({max_:$_});function R_(r,t=null,e=!1){let n={x:v(r,"x","min")},s={axis:t,keepDims:e};return k.runKernel("Min",n,s)}var wl=T({min_:R_});function A_(r,t){let e=v(r,"base","pow"),o=v(t,"exp","pow");[e,o]=yt(e,o);let n={a:e,b:o};return k.runKernel("Pow",n)}var Zr=T({pow_:A_});function it(r,t){if((ne(r)&&t!=="string"||Array.isArray(r))&&t!=="complex64")throw new Error("Error creating a new Scalar: value must be a primitive (number|boolean|string)");if(t==="string"&&ne(r)&&!(r instanceof Uint8Array))throw new Error("When making a scalar from encoded string, the value must be `Uint8Array`.");return Be(r,[],[],t)}function F_(r){let e={x:v(r,"x","sqrt","float32")};return k.runKernel(Pn,e)}var ze=T({sqrt_:F_});function __(r){let t=v(r,"x","square"),e={};return k.runKernel("Square",{x:t},e)}var ue=T({square_:__});function D_(r,t=null,e=!1){let o=v(r,"x","sum");o.dtype==="bool"&&(o=xt(o,"int32"));let n={x:o},s={axis:t,keepDims:e};return k.runKernel("Sum",n,s)}var Ft=T({sum_:D_});function O_(r,t="euclidean",e=null,o=!1){r=v(r,"x","norm");let n=B0(r,t,e),s=n.shape;if(o){let a=Ko(e,r.shape);s=Ro(n.shape,a)}return L(n,s)}function B0(r,t,e=null){if(r.rank===0)return he(r);if(r.rank!==1&&e===null)return B0(L(r,[-1]),t,e);if(r.rank===1||typeof e=="number"||Array.isArray(e)&&e.length===1){if(t===1)return Ft(he(r),e);if(t===1/0)return Dr(he(r),e);if(t===-1/0)return wl(he(r),e);if(t==="euclidean"||t===2)return ze(Ft(Zr(he(r),it(2,"int32")),e));throw new Error(`Error in norm: invalid ord value: ${t}`)}if(Array.isArray(e)&&e.length===2){if(t===1)return Dr(Ft(he(r),e[0]),e[1]-1);if(t===1/0)return Dr(Ft(he(r),e[1]),e[0]);if(t===-1/0)return wl(Ft(he(r),e[1]),e[0]);if(t==="fro"||t==="euclidean")return ze(Ft(ue(r),e));throw new Error(`Error in norm: invalid ord value: ${t}`)}throw new Error(`Error in norm: invalid axis: ${e}`)}var Yn=T({norm_:O_});function P_(r,t=null,e=!1){return Yn(r,"euclidean",t,e)}var Vh=T({euclideanNorm_:P_});function M_(r){let e={x:v(r,"x","exp")};return k.runKernel("Exp",e)}var We=T({exp_:M_});function L_(r,t=0){let e=v(r,"x","expandDims","string_or_numeric");E(t<=e.rank,()=>"Axis must be <= rank of the tensor");let o={input:e},n={dim:t};return k.runKernel(ea,o,n)}var Ne=T({expandDims_:L_});function B_(r){let e={x:v(r,"x","expm1")};return k.runKernel(ln,e)}var zh=T({expm1_:B_});function V_(r,t){let e=v(r,"x","tile","string_or_numeric");E(e.rank===t.length,()=>`Error in transpose: rank of input ${e.rank} must match length of reps ${t}.`);let o={x:e},n={reps:t};return k.runKernel(bo,o,n)}var Ao=T({tile_:V_});function z_(r,t,e,o="float32"){t==null&&(t=r);let n=ot([r,t],o),s=r<=t?r:t;for(let i=0;i<s;++i)n.set(1,i,i);let a=L(n.toTensor(),[r,t]);if(e==null)return a;if(e.length===1)return Ao(Ne(a,0),[e[0],1,1]);if(e.length===2)return Ao(Ne(Ne(a,0),0),[e[0],e[1],1,1]);if(e.length===3)return Ao(Ne(Ne(Ne(a,0),0),0),[e[0],e[1],e[2],1,1]);throw new Error(`eye() currently supports only 1D and 2D batchShapes, but received ${e.length}D.`)}var Lc=T({eye_:z_});function W_(r){let e={x:v(r,"x","floor","float32")};return k.runKernel(cn,e)}var Bc=T({floor_:W_});function G_(r,t,e=0,o=0){let n=v(r,"x","gather"),s=v(t,"indices","gather","int32"),a={x:n,indices:s},i={axis:e,batchDims:o};return k.runKernel(sa,a,i)}var Vc=T({gather_:G_});function U_(r,t){let e=v(r,"a","greater","string_or_numeric"),o=v(t,"b","greater","string_or_numeric");[e,o]=yt(e,o),At(e.shape,o.shape);let n={a:e,b:o};return k.runKernel(pn,n)}var Qn=T({greater_:U_});function H_(r,t){let e=v(r,"a","greaterEqual","string_or_numeric"),o=v(t,"b","greaterEqual","string_or_numeric");[e,o]=yt(e,o),At(e.shape,o.shape);let n={a:e,b:o};return k.runKernel(mn,n)}var zc=T({greaterEqual_:H_});function K_(r){let e={input:v(r,"input","imag")};return k.runKernel(la,e)}var Fo=T({imag_:K_});function q_(r){let e={x:v(r,"x","isFinite")};return k.runKernel(fn,e)}var Wh=T({isFinite_:q_});function j_(r){let e={x:v(r,"x","isInf")};return k.runKernel(dn,e)}var Gh=T({isInf_:j_});function X_(r){let e={x:v(r,"x","isNaN")};return k.runKernel(hn,e)}var Uh=T({isNaN_:X_});function Y_(r,t=.2){let o={x:v(r,"x","leakyRelu")},n={alpha:t};return k.runKernel(ca,o,n)}var Wc=T({leakyRelu_:Y_});function Q_(r,t){let e=v(r,"a","less","string_or_numeric"),o=v(t,"b","less","string_or_numeric");[e,o]=yt(e,o),At(e.shape,o.shape);let n={a:e,b:o};return k.runKernel(gn,n)}var vl=T({less_:Q_});function Z_(r,t){let e=v(r,"a","lessEqual","string_or_numeric"),o=v(t,"b","lessEqual","string_or_numeric");[e,o]=yt(e,o),At(e.shape,o.shape);let n={a:e,b:o};return k.runKernel(xn,n)}var vi=T({lessEqual_:Z_});function Hh(r,t,e){if(e<=0)throw new Error("The number of values should be positive.");let o={start:r,stop:t,num:e};return k.runKernel(ua,{},o)}function J_(r,t=5,e=1,o=1,n=.5){let s=v(r,"x","localResponseNormalization");E(s.rank===4||s.rank===3,()=>`Error in localResponseNormalization: x must be rank 3 or 4 but got
               rank ${s.rank}.`),E(ho(t),()=>`Error in localResponseNormalization: depthRadius must be an integer but got depthRadius ${t}.`);let a=s,i=!1;s.rank===3&&(i=!0,a=L(s,[1,s.shape[0],s.shape[1],s.shape[2]]));let l={x:a},c={depthRadius:t,bias:e,alpha:o,beta:n},u=k.runKernel("LRN",l,c);return i?L(u,[u.shape[1],u.shape[2],u.shape[3]]):u}var Kh=T({localResponseNormalization_:J_});function tD(r){let e={x:v(r,"x","log","float32")};return k.runKernel("Log",e)}var Jr=T({log_:tD});function eD(r){let e={x:v(r,"x","log1p")};return k.runKernel(yn,e)}var Gc=T({log1p_:eD});function V0(r){return E(Gr(r),()=>"The f passed in grad(f) must be a function"),(t,e)=>{let o=v(t,"x","tf.grad","string_or_numeric"),n=e!=null?v(e,"dy","tf.grad"):null;return k.tidy(()=>{let{value:s,grads:a}=k.gradients(()=>r(o),[o],n);return n!=null&&zt(s.shape,n.shape,"The shape of dy passed in grad(f)(x, dy) must match the shape returned by f(x)"),hp(a),a[0]})}}function z0(r){return E(Gr(r),()=>"The f passed in grads(f) must be a function"),(t,e)=>{E(Array.isArray(t),()=>"The args passed in grads(f)(args) must be an array of `Tensor`s or `TensorLike`s");let o=So(t,"args","tf.grads","string_or_numeric"),n=e!=null?v(e,"dy","tf.grads"):null;return k.tidy(()=>{let{value:s,grads:a}=k.gradients(()=>r(...o),o,n);return n!=null&&zt(s.shape,n.shape,"The shape of dy passed in grads(f)([x1,...], dy) must match the shape returned by f([x1,...])"),hp(a),a})}}function W0(r){return E(Gr(r),()=>"The f passed in valueAndGrad(f) must be a function"),(t,e)=>{E(t instanceof Nt,()=>"The x passed in valueAndGrad(f)(x) must be a tensor"),E(e==null||e instanceof Nt,()=>"The dy passed in valueAndGrad(f)(x, dy) must be a tensor");let{grads:o,value:n}=k.gradients(()=>r(t),[t],e);return hp(o),{grad:o[0],value:n}}}function G0(r){return E(Gr(r),()=>"The f passed in valueAndGrads(f) must be a function"),(t,e)=>{E(Array.isArray(t)&&t.every(n=>n instanceof Nt),()=>"The args passed in valueAndGrads(f)(args) must be array of tensors"),E(e==null||e instanceof Nt,()=>"The dy passed in valueAndGrads(f)(args, dy) must be a tensor");let o=k.gradients(()=>r(...t),t,e);return e!=null&&zt(o.value.shape,e.shape,"The shape of dy passed in valueAndGrads(f)([x1,...], dy) must match the shape returned by f([x1,...])"),hp(o.grads),o}}function dp(r,t){E(Gr(r),()=>"The f passed in variableGrads(f) must be a function"),E(t==null||Array.isArray(t)&&t.every(c=>c instanceof Kr),()=>"The varList passed in variableGrads(f, varList) must be an array of variables");let e=t!=null;if(!e){t=[];for(let c in k.registeredVariables)t.push(k.registeredVariables[c])}let o=e?t.filter(c=>!c.trainable):null,n=t.length;t=t.filter(c=>c.trainable),E(t.length>0,()=>`variableGrads() expects at least one of the input variables to be trainable, but none of the ${n} variables is trainable.`);let s=!0,{value:a,grads:i}=k.gradients(r,t,null,s);E(i.some(c=>c!=null),()=>"Cannot find a connection between any variable and the result of the loss function y=f(x). Please make sure the operations that use variables are inside the function f passed to minimize()."),E(a.rank===0,()=>`The f passed in variableGrads(f) must return a scalar, but it returned a rank-${a.rank} tensor`);let l={};return t.forEach((c,u)=>{i[u]!=null&&(l[c.name]=i[u])}),o?.forEach(c=>l[c.name]=null),{value:a,grads:l}}function Fe(r){return k.customGrad(r)}function hp(r){if(r.filter(e=>e==null).length>0)throw new Error(`Cannot compute gradient of y=f(x) with respect to x. Make sure that
    the f you passed encloses all operations that lead from x to y.`)}function rD(r){let e={x:v(r,"x","neg")};return k.runKernel("Neg",e)}var ye=T({neg_:rD});function oD(r){let e={x:v(r,"x","softplus")};return k.runKernel(On,e)}var Uc=T({softplus_:oD});function nD(r){let t=v(r,"x","logSigmoid");return Fe(o=>({value:ye(Uc(ye(o))),gradFunc:a=>K(a,je(ye(o)))}))(t)}var qh=T({logSigmoid_:nD});function sD(r,t){let e=v(r,"a","sub"),o=v(t,"b","sub");[e,o]=yt(e,o);let n={a:e,b:o};return k.runKernel("Sub",n)}var lt=T({sub_:sD});function aD(r,t=-1){let e=v(r,"logits","logSoftmax");if(t===-1&&(t=e.rank-1),t!==e.rank-1)throw Error(`Log Softmax along a non-last dimension is not yet supported. Logits was rank ${e.rank} and axis was ${t}`);return Fe((n,s)=>{let i=Dr(n,t,!0),l=lt(n,i),c=lt(xt(l,"float32"),Jr(Ft(We(l),t,!0)));return s([c]),{value:c,gradFunc:(p,m)=>{let[f]=m,d=!0,g=We(f);return lt(p,K(Ft(p,t,d),g))}}})(e)}var jh=T({logSoftmax_:aD});function iD(r,t=null,e=!1){let o=v(r,"x","logSumExp"),n=Ko(t,o.shape),s=Dr(o,n,!0),a=lt(o,s),i=We(a),l=Ft(i,n),c=Jr(l),u=Z(L(s,c.shape),c);if(e){let p=Ro(u.shape,n);return L(u,p)}return u}var Hc=T({logSumExp_:iD});function lD(r,t){let e=v(r,"a","logicalAnd","bool"),o=v(t,"b","logicalAnd","bool");At(e.shape,o.shape);let n={a:e,b:o};return k.runKernel(bn,n)}var Zn=T({logicalAnd_:lD});function cD(r){let e={x:v(r,"x","logicalNot","bool")};return k.runKernel(wn,e)}var Kc=T({logicalNot_:cD});function uD(r,t){let e=v(r,"a","logicalOr","bool"),o=v(t,"b","logicalOr","bool");At(e.shape,o.shape);let n={a:e,b:o};return k.runKernel(vn,n)}var qc=T({logicalOr_:uD});function pD(r,t){let e=v(r,"a","logicalXor","bool"),o=v(t,"b","logicalXor","bool");return At(e.shape,o.shape),Zn(qc(r,t),Kc(Zn(r,t)))}var Xh=T({logicalXor_:pD});var gp=2147483648;function mD(r,t,e="left"){let o=v(r,"sortedSequence","searchSorted"),n=v(t,"values","searchSorted"),s=o.shape[o.shape.length-1],a=n.shape[n.shape.length-1],i=L(o,[-1,s]),l=L(n,[-1,a]);if(i.rank<2)throw new Error("Sorted input argument must be at least 2-dimensional");if(i.shape[0]!==l.shape[0])throw new Error("Leading dimension of 'sortedSequence' and 'values' must match.");if(bt(l.shape)>=gp)throw new Error(`values tensor size must less than ${gp}`);if(i.shape[1]>=gp)throw new Error(`trailing dim_size must less than ${gp} for int32 output type, was ${i.shape[1]}`);let c={sortedSequence:i,values:l},u={side:e};return k.runKernel(Va,c,u)}var Sl=T({searchSorted_:mD});function Yh(r,t){return Sl(r,t,"left")}function fD(r,t,e,o,n){let s=v(r,"x","maxPool"),a=1,i=s,l=!1;s.rank===3&&(l=!0,i=L(s,[1,s.shape[0],s.shape[1],s.shape[2]])),E(i.rank===4,()=>`Error in maxPool: input must be rank 4 but got rank ${i.rank}.`),E(Ae(e,a),()=>`Error in maxPool: Either strides or dilations must be 1. Got strides ${e} and dilations '${a}'`),ie("maxPool",o,n);let c={x:i},u={filterSize:t,strides:e,pad:o,dimRoundingMode:n},p=k.runKernel(ma,c,u);return l?L(p,[p.shape[1],p.shape[2],p.shape[3]]):p}var jc=T({maxPool_:fD});function dD(r,t=[1,1,1],e,o,n,s="NDHWC"){let a=v(r,"x","maxPool3d"),i=a,l=!1;a.rank===4&&(l=!0,i=L(a,[1,a.shape[0],a.shape[1],a.shape[2],a.shape[3]])),E(i.rank===5,()=>`Error in maxPool3d: x must be rank 5 but got rank ${i.rank}.`),E(s==="NDHWC",()=>`Error in maxPool3d: Only NDHWC is currently supported, but got dataFormat of ${s}`),ie("maxPool3d",o,n);let c={x:i},u={filterSize:t,strides:e,pad:o,dimRoundingMode:n,dataFormat:s},p=k.runKernel(fa,c,u);return l?L(p,[p.shape[1],p.shape[2],p.shape[3],p.shape[4]]):p}var Qh=T({maxPool3d_:dD});function hD(r,t,e,o,n=!1){let a={x:v(r,"x","maxPoolWithArgmax")},i={filterSize:t,strides:e,pad:o,includeBatchInIndex:n},l=k.runKernel(da,a,i);return{result:l[0],indexes:l[1]}}var Zh=T({maxPoolWithArgmax_:hD});function gD(r,t){let e=v(r,"a","maximum"),o=v(t,"b","maximum");[e,o]=yt(e,o),e.dtype==="bool"&&(e=xt(e,"int32"),o=xt(o,"int32")),At(e.shape,o.shape);let n={a:e,b:o};return k.runKernel(Sn,n)}var Xc=T({maximum_:gD});function xD(r,t=null,e=!1){let n={x:v(r,"x","mean")},s={axis:t,keepDims:e};return k.runKernel(ha,n,s)}var Jn=T({mean_:xD});function Xe(r,t="float32"){if(Kt(r),t==="complex64"){let o=Xe(r,"float32"),n=Xe(r,"float32");return Le(o,n)}let e=Yi(bt(r),t);return k.makeTensor(e,r,t)}function Or(r,t="float32"){if(Kt(r),t==="complex64"){let o=Or(r,"float32"),n=Xe(r,"float32");return Le(o,n)}let e=sc(bt(r),t);return k.makeTensor(e,r,t)}function Jh(r,t,{indexing:e="xy"}={}){if(e!=="xy"&&e!=="ij")throw new TypeError(`${e} is not a valid third argument to meshgrid`);if(r===void 0)return[];let o=v(r,"x","meshgrid",r instanceof Nt?r.dtype:"float32");if(t===void 0)return[o];let n=v(t,"y","meshgrid",t instanceof Nt?t.dtype:"float32"),s=bt(o.shape),a=bt(n.shape);return e==="xy"?(o=L(o,[1,-1]),n=L(n,[-1,1]),[Et(Or([a,1],o.dtype),o),Et(n,Or([1,s],n.dtype))]):(o=L(o,[-1,1]),n=L(n,[1,-1]),[Et(o,Or([1,a],o.dtype)),Et(Or([s,1],n.dtype),n)])}function yD(r,t){let e=v(r,"a","minimum"),o=v(t,"b","minimum");[e,o]=yt(e,o),e.dtype==="bool"&&(e=xt(e,"int32"),o=xt(o,"int32")),At(e.shape,o.shape);let n={a:e,b:o};return k.runKernel(Cn,n)}var to=T({minimum_:yD});function bD(r,t,e){E(e==="reflect"||e==="symmetric",()=>`Invalid mode. Mode must be either reflect or symmetric. Got ${e}.`);let o=v(r,"x","mirrorPad");if(o.rank===0)throw new Error("mirrorPad(scalar) is not defined. Pass non-scalar to mirrorPad");E(t.length===o.rank,()=>`Padding doesn't match input. Must be ${o.rank}. Got ${t.length}.`);let n=e==="reflect"?1:0;for(let i=0;i<o.rank;i++)E(t[i].length===2,()=>"Invalid number of paddings. Must be length of 2 each."),E(t[i][0]>=0&&t[i][0]<=o.shape[i]-n&&t[i][1]>=0&&t[i][1]<=o.shape[i]-n,()=>`Padding in dimension ${i} cannot be greater than or equal to ${o.shape[i]-n} or less than 0 for input of shape ${o.shape}`);let s={paddings:t,mode:e},a={x:o};return k.runKernel(ga,a,s)}var Yc=T({mirrorPad_:bD});function wD(r,t){let e=v(r,"a","mod"),o=v(t,"b","mod");[e,o]=yt(e,o);let n={a:e,b:o};return k.runKernel("Mod",n)}var tg=T({mod_:wD});function vD(r,t=null,e=!1){r=v(r,"x","moments");let o=Ko(t,r.shape),n=Jn(r,o,e),s=n.shape;e||(s=Ro(n.shape,o));let a=ue(lt(xt(r,"float32"),L(n,s))),i=Jn(a,o,e);return{mean:n,variance:i}}var eg=T({moments_:vD});function SD(r,t,e,o){let n=v(t,"data","multiRNNCell"),s=So(e,"c","multiRNNCell"),a=So(o,"h","multiRNNCell"),i=n,l=[];for(let p=0;p<r.length;p++){let m=r[p](i,s[p],a[p]);l.push(m[0]),l.push(m[1]),i=m[1]}let c=[],u=[];for(let p=0;p<l.length;p+=2)c.push(l[p]),u.push(l[p+1]);return[c,u]}var rg=T({multiRNNCell_:SD});function CD(r,t,e,o=!1){let n=v(r,"logits","multinomial"),s=n.size,a=n.rank;if(s<2)throw new Error(`Error in multinomial: you need at least 2 outcomes, but got ${s}.`);if(a>2)throw new Error(`Rank of probabilities must be 1 or 2, but is ${a}`);e=e||Math.random();let l={logits:a===1?L(n,[1,-1]):n},c={numSamples:t,seed:e,normalized:o},u=k.runKernel(ya,l,c);return a===1?L(u,[u.size]):u}var og=T({multinomial_:CD});function TD(r,t){let e=v(r,"a","notEqual","string_or_numeric"),o=v(t,"b","notEqual","string_or_numeric");[e,o]=yt(e,o),At(e.shape,o.shape);let n={a:e,b:o};return k.runKernel(Nn,n)}var Qc=T({notEqual_:TD});function ND(r,t,e=1,o=0,n="int32"){if(t<2)throw new Error(`Error in oneHot: depth must be >=2, but it is ${t}`);let a={indices:v(r,"indices","oneHot","int32")},i={dtype:n,depth:t,onValue:e,offValue:o};return k.runKernel(Ca,a,i)}var Cl=T({oneHot_:ND});function ID(r){let e={x:v(r,"x","onesLike")};return k.runKernel(Sa,e)}var ng=T({onesLike_:ID});function kD(r,t){let e=v(r,"v1","outerProduct"),o=v(t,"v2","outerProduct");E(e.rank===1&&o.rank===1,()=>`Error in outerProduct: inputs must be rank 1, but got ranks ${e.rank} and ${o.rank}.`);let n=L(e,[-1,1]),s=L(o,[1,-1]);return Et(n,s)}var sg=T({outerProduct_:kD});function ED(r,t,e=0){let o=v(r,"x","pad");if(o.rank===0)throw new Error("pad(scalar) is not defined. Pass non-scalar to pad");let n={paddings:t,constantValue:e},s={x:o};return k.runKernel(Na,s,n)}var Ye=T({pad_:ED});function $D(r,t,e=0){return E(t.length===2,()=>"Invalid number of paddings. Must be length of 2."),Ye(r,[t],e)}var ag=T({pad1d_:$D});function RD(r,t,e=0){return E(t.length===2&&t[0].length===2&&t[1].length===2,()=>"Invalid number of paddings. Must be length of 2 each."),Ye(r,t,e)}var ig=T({pad2d_:RD});function AD(r,t,e=0){return E(t.length===3&&t[0].length===2&&t[1].length===2&&t[2].length===2,()=>"Invalid number of paddings. Must be length of 2 each."),Ye(r,t,e)}var lg=T({pad3d_:AD});function FD(r,t,e=0){return E(t.length===4&&t[0].length===2&&t[1].length===2&&t[2].length===2&&t[3].length===2,()=>"Invalid number of paddings. Must be length of 2 each."),Ye(r,t,e)}var cg=T({pad4d_:FD});function _D(r,t,e){let o=v(r,"x","spaceToBatchND");E(o.rank>=1+t.length,()=>`input rank ${o.rank} should be > than [blockShape] ${t.length}`),E(e.length===t.length,()=>`paddings.shape[0] ${e.length} must be equal to [blockShape] ${t.length}`),E(o.shape.reduce((a,i,l)=>l>0&&l<=t.length?a&&(i+e[l-1][0]+e[l-1][1])%t[l-1]===0:a,!0),()=>`input spatial dimensions ${o.shape.slice(1)} with paddings ${e.toString()} must be divisible by blockShapes ${t.toString()}`);let n={x:o},s={blockShape:t,paddings:e};return k.runKernel(Ua,n,s)}var Zc=T({spaceToBatchND_:_D});function DD(r,t,e,o,n,s,a){n==null&&(n=[1,1]),s==null&&(s=1),o===0&&(o="valid");let i=v(r,"x","maxPool"),l=i,c=!1;i.rank===3&&(c=!0,l=L(i,[1,i.shape[0],i.shape[1],i.shape[2]])),E(Ae(s,n),()=>`Error in pool: Either strides or dilations must be 1. Got strides ${s} and dilations '${n}'`);let u=ch(l.shape,t,s,n,o),p=[u.dilationHeight,u.dilationWidth],m;o==="same"?m=PD([u.filterHeight,u.filterWidth],p):m=[[0,0],[0,0]];let f=p[0]===1&&p[1]===1,[d,g]=OD([u.inHeight,u.inWidth],p,m),h=f?o:"valid",x=f?l:Zc(l,p,d),C=(e==="avg"?()=>Fc(x,t,s,h,a):()=>jc(x,t,s,h,a))(),S=f?C:_c(C,p,g);return c?L(S,[S.shape[1],S.shape[2],S.shape[3]]):S}function OD(r,t,e){let o=e.map(u=>u[0]),n=e.map(u=>u[1]),s=r.concat(o,n),a=t.map((u,p)=>(u-s[p]%u)%u),i=n.map((u,p)=>u+a[p]),l=t.map((u,p)=>[o[p],i[p]]),c=t.map((u,p)=>[0,a[p]]);return[l,c]}function PD(r,t){let o=r.map((a,i)=>a+(a-1)*(t[i]-1)).map(a=>a-1),n=o.map(a=>Math.floor(a/2)),s=o.map((a,i)=>a-n[i]);return o.map((a,i)=>[n[i],s[i]])}var ug=T({pool_:DD});function MD(r,t){let e=v(r,"x","prelu"),o=v(t,"alpha","prelu"),n={x:e,alpha:o};return k.runKernel(ka,n)}var Jc=T({prelu_:MD});function LD(r,t=null,e=!1){let o=v(r,"x","prod");o.dtype==="bool"&&(o=xt(o,"int32"));let n={x:o},s={axis:t,keepDims:e};return k.runKernel(Ea,n,s)}var pg=T({prod_:LD});function BD(r,t,e,o){let n=r.map((u,p)=>v(u,`tensors${p}`,"raggedGather","int32")),s=v(t,"paramsDenseValues","raggedGather"),a=v(e,"indices","raggedGather","int32"),i={paramsNestedSplits:n,paramsDenseValues:s,indices:a},l={outputRaggedRank:o},c=k.runKernel($a,i,l);return{outputNestedSplits:c.slice(0,c.length-1),outputDenseValues:c[c.length-1]}}var mg=T({raggedGather_:BD});function VD(r,t,e){let o=v(r,"starts","raggedRange"),n=v(t,"limits","raggedRange",o.dtype),s=v(e,"deltas","raggedRange",o.dtype),a={starts:o,limits:n,deltas:s},i=k.runKernel(Ra,a);return{rtNestedSplits:i[0],rtDenseValues:i[1]}}var fg=T({raggedRange_:VD});function zD(r,t,e,o,n){let s=v(r,"shape","raggedTensorToTensor","int32"),a=v(t,"values","raggedTensorToTensor"),i=v(e,"defaultValue","raggedTensorToTensor",a.dtype),l=o.map((p,m)=>v(p,`tensors${m}`,"raggedTensorToTensor","int32")),c={shape:s,values:a,defaultValue:i,rowPartitionTensors:l},u={rowPartitionTypes:n};return k.runKernel(Aa,c,u)}var dg=T({raggedTensorToTensor_:zD});function WD(r,t,e){Kt(r);let o=bt(r),n=null;if(e==null||e==="float32")n=new Float32Array(o);else if(e==="int32")n=new Int32Array(o);else if(e==="bool")n=new Uint8Array(o);else throw new Error(`Unknown data type ${e}`);for(let s=0;s<o;s++)n[s]=t();return k.makeTensor(n,r,e)}var hg=T({rand_:WD});var wp=hd(Sg());var Ig={};kt(Ig,{TEST_EPSILON_FLOAT16:()=>aw,createVideoElement:()=>rO,encodeStrings:()=>iw,expectArrayBuffersEqual:()=>eO,expectArraysClose:()=>YD,expectArraysEqual:()=>ZD,expectNumbersClose:()=>JD,expectPromiseToFail:()=>QD,expectValuesInRange:()=>tO,play:()=>oO,testEpsilon:()=>Tg});var XD=.001,aw=.1;function YD(r,t,e){return e==null&&(e=Tg()),Cg(r,t,(o,n)=>Ng(o,n,e))}function Tg(){return k.backend.floatPrecision()===32?XD:aw}function Cg(r,t,e){let o=!0;if((ne(r)||ne(t))&&(o=!1),ne(r)&&ne(t)&&(o=!0),o){let a=r.constructor.name,i=t.constructor.name;if(a!==i)throw new Error(`Arrays are of different type. Actual: ${a}. Expected: ${i}`)}if(Array.isArray(r)&&Array.isArray(t)){let a=Ce(r),i=Ce(t);if(!Pe(a,i))throw new Error(`Arrays have different shapes. Actual: [${a}]. Expected: [${i}]`)}let n=ne(r)?r:$r(r),s=ne(t)?t:$r(t);if(n.length!==s.length)throw new Error(`Arrays have different lengths actual: ${n.length} vs expected: ${s.length}.
Actual:   ${n}.
Expected: ${s}.`);for(let a=0;a<s.length;++a){let i=n[a],l=s[a];if(!e(i,l))throw new Error(`Arrays differ: actual[${a}] = ${i}, expected[${a}] = ${l}.
Actual:   ${n}.
Expected: ${s}.`)}typeof expect<"u"&&expect().nothing()}function QD(r,t){r().then(()=>t.fail(),()=>t()),typeof expect<"u"&&expect().nothing()}function ZD(r,t){let e=typeof t=="string"||typeof t=="number"||typeof t=="boolean"?[t]:t;return kr(r)||kr(r[0])||kr(t)||kr(t[0])?Cg(r,e,(o,n)=>o==n):Cg(r,t,(o,n)=>Ng(o,n,0))}function JD(r,t,e){if(e==null&&(e=Tg()),!Ng(r,t,e))throw new Error(`Numbers differ: actual === ${r}, expected === ${t}`);typeof expect<"u"&&expect().nothing()}function Ng(r,t,e){return!isFinite(r)&&!isFinite(t)?!0:!(isNaN(r)||isNaN(t)||Math.abs(r-t)>e)}function tO(r,t,e){for(let o=0;o<r.length;o++)if(r[o]<t||r[o]>e)throw new Error(`Value out of range:${r[o]} low: ${t}, high: ${e}`)}function eO(r,t){let e=new Float32Array(r),o=new Float32Array(t);if(e.length!==o.length)throw new Error(`Expected ArrayBuffer to be of length ${o.length}, but it was ${e.length}`);for(let n=0;n<o.length;n++)if(e[n]!==o[n])throw new Error(`Expected ArrayBuffer value at ${n} to be ${o[n]} but got ${e[n]} instead`)}function iw(r){for(let t=0;t<r.length;t++){let e=r[t];Array.isArray(e)?iw(e):r[t]=Hn(e)}return r}function rO(r){let t=document.createElement("video");return"playsInline"in t&&(t.playsInline=!0),t.muted=!0,t.loop=!0,t.style.position="fixed",t.style.left="0px",t.style.top="0px",t.preload="auto",t.appendChild(r),new Promise(e=>{t.addEventListener("loadeddata",o=>e(t)),t.load()})}async function oO(r){await r.play(),"requestVideoFrameCallback"in r&&await new Promise(t=>{r.requestVideoFrameCallback(t)})}var Ci=class{constructor(t,e,o,n,s){this.mean=t,this.stdDev=e,this.dtype=o,this.nextVal=NaN,this.truncated=n,this.truncated&&(this.upper=this.mean+this.stdDev*2,this.lower=this.mean-this.stdDev*2);let a=s||Math.random();this.random=wp.alea(a.toString())}nextValue(){if(!isNaN(this.nextVal)){let n=this.nextVal;return this.nextVal=NaN,n}let t,e,o=!1;for(;!o;){let n,s,a;do n=2*this.random()-1,s=2*this.random()-1,a=n*n+s*s;while(a>=1||a===0);let i=Math.sqrt(-2*Math.log(a)/a);t=this.mean+this.stdDev*n*i,e=this.mean+this.stdDev*s*i,(!this.truncated||this.isValidTruncated(t))&&(o=!0)}return(!this.truncated||this.isValidTruncated(e))&&(this.nextVal=this.convertValue(e)),this.convertValue(t)}convertValue(t){return this.dtype==null||this.dtype==="float32"?t:Math.round(t)}isValidTruncated(t){return t<=this.upper&&t>=this.lower}},yp=class{constructor(t,e,o,n){this.alpha=t,this.beta=1/e,this.dtype=o;let s=n||Math.random();this.randu=wp.alea(s.toString()),this.randn=new Ci(0,1,o,!1,this.randu()),t<1?this.d=t+2/3:this.d=t-1/3,this.c=1/Math.sqrt(9*this.d)}nextValue(){let t,e,o,n,s,a;for(;;){do n=this.randn.nextValue(),a=1+this.c*n;while(a<=0);if(a*=a*a,t=n*n,e=1-.331*t*t,o=.5*t+this.d*(1-a+Math.log(a)),s=this.randu(),s<e||Math.log(s)<o)break}return a=1/this.beta*this.d*a,this.alpha<1&&(a*=Math.pow(this.randu(),1/this.alpha)),this.convertValue(a)}convertValue(t){return this.dtype==="float32"?t:Math.round(t)}},bp=class{constructor(t=0,e=1,o,n){if(this.canReturnFloat=()=>this.dtype==null||this.dtype==="float32",this.min=t,this.range=e-t,this.dtype=o,n==null&&(n=Math.random()),typeof n=="number"&&(n=n.toString()),!this.canReturnFloat()&&this.range<=1)throw new Error(`The difference between ${t} - ${e} <= 1 and dtype is not float`);this.random=wp.alea(n)}convertValue(t){return this.canReturnFloat()?t:Math.round(t)}nextValue(){return this.convertValue(this.min+this.range*this.random())}};function nO(r,t,e=1,o="float32",n){if(Kt(r),e==null&&(e=1),o==null&&(o="float32"),o!=="float32"&&o!=="int32")throw new Error(`Unsupported data type ${o}`);let s=new yp(t,e,o,n),a=ot(r,o);for(let i=0;i<a.values.length;i++)a.values[i]=s.nextValue();return a.toTensor()}var kg=T({randomGamma_:nO});function sO(r,t=0,e=1,o,n){if(Kt(r),o!=null&&o==="bool")throw new Error(`Unsupported data type ${o}`);let s=new Ci(t,e,o,!1,n),a=ot(r,o);for(let i=0;i<a.values.length;i++)a.values[i]=s.nextValue();return a.toTensor()}var tu=T({randomNormal_:sO});function aO(r,t,e){if(t!=null&&t==="bool")throw new Error(`Unsupported data type ${t}`);return tu(r,0,1,t,e)}var Eg=T({randomStandardNormal_:aO});function iO(r,t=0,e=1,o="float32",n){Kt(r);let s=ot(r,o),a=new bp(t,e,null,n);for(let i=0;i<s.values.length;i++)s.values[i]=a.nextValue();return s.toTensor()}var Ti=T({randomUniform_:iO});function lO(r,t,e,o){return Ti(r,t,e,"int32",o)}var $g=T({randomUniformInt_:lO});function _o(r,t,e=1,o="float32"){if(e===0)throw new Error("Cannot have a step of zero");let n={start:r,stop:t,step:e,dtype:o};return k.runKernel(Fa,{},n)}function cO(r){let e={input:v(r,"input","real")};return k.runKernel(_a,e)}var eo=T({real_:cO});function uO(r){let e={x:v(r,"x","reciprocal")};return k.runKernel(In,e)}var Rg=T({reciprocal_:uO});function pO(r){let e={x:v(r,"x","relu")};return k.runKernel(kn,e)}var Do=T({relu_:pO});function mO(r){let e={x:v(r,"x","relu6")};return k.runKernel(En,e)}var eu=T({relu6_:mO});function fO(r,t){let o={x:v(r,"x","reverse")},n={dims:t};return k.runKernel(Ma,o,n)}var ar=T({reverse_:fO});function dO(r){let t=v(r,"x","reverse");return E(t.rank===1,()=>`Error in reverse1D: x must be rank 1 but got rank ${t.rank}.`),ar(t,0)}var Ag=T({reverse1d_:dO});function hO(r,t){let e=v(r,"x","reverse");return E(e.rank===2,()=>`Error in reverse2D: x must be rank 2 but got rank ${e.rank}.`),ar(e,t)}var Fg=T({reverse2d_:hO});function gO(r,t){let e=v(r,"x","reverse");return E(e.rank===3,()=>`Error in reverse3D: x must be rank 3 but got rank ${e.rank}.`),ar(e,t)}var _g=T({reverse3d_:gO});function xO(r,t){let e=v(r,"x","reverse");return E(e.rank===4,()=>`Error in reverse4D: x must be rank 4 but got rank ${e.rank}.`),ar(e,t)}var Dg=T({reverse4d_:xO});function yO(r){let e={x:v(r,"x","round")};return k.runKernel($n,e)}var ru=T({round_:yO});function bO(r){let e={x:v(r,"x","rsqrt","float32")};return k.runKernel(Rn,e)}var Og=T({rsqrt_:bO});function wO(r){let e={x:v(r,"x","selu")};return k.runKernel(An,e)}var Pg=T({selu_:wO});function vO(r,t,e,o,n,s=[1,1],a="NHWC"){let i=v(r,"x","separableConv2d"),l=v(t,"depthwiseFilter","separableConv2d"),c=v(e,"pointwiseFilter","separableConv2d"),u=i,p=!1;if(i.rank===3&&(p=!0,u=L(i,[1,i.shape[0],i.shape[1],i.shape[2]])),a==="NCHW")throw new Error("separableConv2d currently does not support dataFormat NCHW; only NHWC is supported");E(u.rank===4,()=>`Error in separableConv2d: input must be rank 4, but got rank ${u.rank}.`),E(l.rank===4,()=>`Error in separableConv2d: depthwise filter must be rank 4, but got rank ${l.rank}.`),E(c.rank===4,()=>`Error in separableConv2d: pointwise filter must be rank 4, but got rank ${l.rank}.`),E(c.shape[0]===1,()=>`Error in separableConv2d: the first dimension of pointwise filter  must be 1, but got ${c.shape[0]}.`),E(c.shape[1]===1,()=>`Error in separableConv2d: the second dimension of pointwise filter must be 1, but got ${c.shape[1]}.`);let m=l.shape[2],f=l.shape[3];E(c.shape[2]===m*f,()=>`Error in separableConv2d: the third dimension of pointwise filter must be ${m*f}, but got ${c.shape[2]}.`);let d=wi(u,l,o,n,a,s),h=Eo(d,c,1,"valid",a);return p?L(h,[h.shape[1],h.shape[2],h.shape[3]]):h}var Mg=T({separableConv2d_:vO});async function SO(r,t){let e=v(r,"x","setdiff1d"),o=v(t,"y","setdiff1d");E(e.dtype===o.dtype,()=>`x and y should have the same dtype, but got x (${e.dtype}) and y (${o.dtype}).`),E(e.rank===1,()=>`x should be 1D tensor, but got x (${e.shape}).`),E(o.rank===1,()=>`y should be 1D tensor, but got y (${o.shape}).`);let n=await e.data(),s=await o.data(),a=new Set(s),i=0;for(let u=0;u<n.length;u++)a.has(n[u])||i++;let l=new $t([i],e.dtype),c=new $t([i],"int32");for(let u=0,p=0;u<n.length;u++)a.has(n[u])||(l.values[p]=n[u],c.values[p]=u,p++);return[l.toTensor(),c.toTensor()]}var Lg=SO;function CO(r){let e={x:v(r,"x","sign")};return k.runKernel(_n,e)}var Bg=T({sign_:CO});function TO(r){let e={x:v(r,"x","sin","float32")};return k.runKernel("Sin",e)}var Vg=T({sin_:TO});function NO(r){let e={x:v(r,"x","sinh")};return k.runKernel(Fn,e)}var zg=T({sinh_:NO});function IO(r,t,e){let o=v(r,"x","slice1d");return E(o.rank===1,()=>`slice1d expects a rank-1 tensor, but got a rank-${o.rank} tensor`),ft(o,[t],[e])}var Wg=T({slice1d_:IO});function kO(r,t,e){let o=v(r,"x","slice2d");return E(o.rank===2,()=>`slice2d expects a rank-2 tensor, but got a rank-${o.rank} tensor`),ft(o,t,e)}var Gg=T({slice2d_:kO});function EO(r,t,e){let o=v(r,"x","slice3d");return E(o.rank===3,()=>`slice3d expects a rank-3 tensor, but got a rank-${o.rank} tensor`),ft(o,t,e)}var Ug=T({slice3d_:EO});function $O(r,t,e){let o=v(r,"x","slice4d");return E(o.rank===4,()=>`slice4d expects a rank-4 tensor, but got a rank-${o.rank} tensor`),ft(o,t,e)}var Hg=T({slice4d_:$O});function RO(r,t=-1){let e=v(r,"logits","softmax","float32");if(t===-1&&(t=e.rank-1),t!==e.rank-1)throw Error(`Softmax along a non-last dimension is not yet supported. Logits was rank ${e.rank} and dim was ${t}`);let o={logits:e},n={dim:t};return k.runKernel(Ka,o,n)}var Kg=T({softmax_:RO});function AO(r){E(r.dtype==="complex64",()=>`The dtype for tf.spectral.fft() must be complex64 but got ${r.dtype}.`);let t={input:r};return k.runKernel("FFT",t)}var Ni=T({fft_:AO});function FO(r){E(r.dtype==="complex64",()=>`The dtype for tf.spectral.ifft() must be complex64 but got ${r.dtype}.`);let t={input:r};return k.runKernel(ia,t)}var ts=T({ifft_:FO});function _O(r){let t=r.shape[r.shape.length-1],e=r.size/t,o;if(t<=2){let n=L(r,[e,t]);o=ts(n)}else{let n=[e,2*(t-1)],s=L(eo(r),[e,t]),a=L(Fo(r),[e,t]),i=ar(ft(s,[0,1],[e,t-2]),1),l=K(ar(ft(a,[0,1],[e,t-2]),1),it(-1)),c=Lt([s,i],1),u=Lt([a,l],1),p=L(Le(c,u),[n[0],n[1]]);o=ts(p)}if(o=eo(o),r.rank===3&&r.shape[0]!==0){let n=o,s=r.shape[0];o=L(o,[s,o.shape[0]/s,o.shape[1]]),n.dispose()}return o}var ou=T({irfft_:_O});function DO(r,t,e=0){let n={x:v(r,"x","split")},s={numOrSizeSplits:t,axis:e};return k.runKernel(Ha,n,s)}var ro=T({split_:DO});function OO(r,t){E(r.dtype==="float32",()=>`The dtype for rfft() must be real value but got ${r.dtype}`);let e=r.shape[r.shape.length-1],o=r.size/e,n;if(t!=null&&t<e){let d=r.shape.map(h=>0),g=r.shape.map(h=>h);g[r.shape.length-1]=t,n=ft(r,d,g),e=t}else if(t!=null&&t>e){let d=r.shape.map(g=>g);d[r.shape.length-1]=t-e,n=Lt([r,Xe(d)],r.shape.length-1),e=t}else n=r;let s=ce(n),a=L(Le(n,s),[o,e]),i=Ni(a),l=Math.floor(e/2)+1,c=eo(i),u=Fo(i),p=ro(c,[l,e-l],c.shape.length-1),m=ro(u,[l,e-l],u.shape.length-1),f=n.shape.slice();return f[n.shape.length-1]=l,L(Le(p[0],m[0]),f)}var Ii=T({rfft_:OO});function PO(r,t){let e=v(r,"a","squaredDifference"),o=v(t,"b","squaredDifference");[e,o]=yt(e,o),At(e.shape,o.shape);let n={a:e,b:o},s={};return k.runKernel(Mn,n,s)}var nu=T({squaredDifference_:PO});function MO(r,t){let e=v(r,"x","squeeze","string_or_numeric");return L(e,xd(e.shape,t).newShape)}var Pt=T({squeeze_:MO});function LO(r,t=0){let e=So(r,"tensors","stack","string_or_numeric");E(e.length>=1,()=>"Pass at least one tensor to tf.stack"),e.length>0&&E(t<=e[0].rank,()=>"Axis must be <= rank of the tensor");let o=e,n={axis:t};return k.runKernel(Ta,o,n)}var _e=T({stack_:LO});function BO(r,t=0){let o={x:v(r,"x","step")},n={alpha:t};return k.runKernel(Vn,o,n)}var su=T({step_:BO});function VO(r,t,e,o,n=0,s=0,a=0,i=0,l=0){let u={x:v(r,"x","stridedSlice","string_or_numeric")},p={begin:t,end:e,strides:o,beginMask:n,endMask:s,ellipsisMask:a,newAxisMask:i,shrinkAxisMask:l};return k.runKernel(Za,u,p)}var qg=T({stridedSlice_:VO});function zO(r){let e={x:v(r,"x","tan","float32")};return k.runKernel("Tan",e)}var jg=T({tan_:zO});function Zt(r,t){dr(r);let e=Ce(r,t);if(e.length!==1)throw new Error("tensor1d() requires values to be a flat/TypedArray");return Be(r,null,e,t)}function De(r,t,e){if(dr(r),t!=null&&t.length!==2)throw new Error("tensor2d() requires shape to have two numbers");let o=Ce(r,e);if(o.length!==2&&o.length!==1)throw new Error("tensor2d() requires values to be number[][] or flat/TypedArray");if(o.length===1&&t==null)throw new Error("tensor2d() requires shape to be provided when `values` are a flat/TypedArray");return Be(r,t,o,e)}function au(r,t,e){if(dr(r),t!=null&&t.length!==3)throw new Error("tensor3d() requires shape to have three numbers");let o=Ce(r,e);if(o.length!==3&&o.length!==1)throw new Error("tensor3d() requires values to be number[][][] or flat/TypedArray");if(o.length===1&&t==null)throw new Error("tensor3d() requires shape to be provided when `values` are a flat array");return Be(r,t,o,e)}function Xg(r,t,e){if(dr(r),t!=null&&t.length!==4)throw new Error("tensor4d() requires shape to have four numbers");let o=Ce(r,e);if(o.length!==4&&o.length!==1)throw new Error("tensor4d() requires values to be number[][][][] or flat/TypedArray");if(o.length===1&&t==null)throw new Error("tensor4d() requires shape to be provided when `values` are a flat array");return Be(r,t,o,e)}function Yg(r,t,e){if(dr(r),t!=null&&t.length!==5)throw new Error("tensor5d() requires shape to have five numbers");let o=Ce(r,e);if(o.length!==5&&o.length!==1)throw new Error("tensor5d() requires values to be number[][][][][] or flat/TypedArray");if(o.length===1&&t==null)throw new Error("tensor5d() requires shape to be provided when `values` are a flat array");return Be(r,t,o,e)}function Qg(r,t,e){if(dr(r),t!=null&&t.length!==6)throw new Error("tensor6d() requires shape to have six numbers");let o=Ce(r,e);if(o.length!==6&&o.length!==1)throw new Error("tensor6d() requires values to be number[][][][][][] or flat/TypedArray");if(o.length===1&&t==null)throw new Error("tensor6d() requires shape to be provided when `values` are a flat array");return t=t||o,Be(r,t,o,e)}var iu={};kt(iu,{calculateShapes:()=>lw,validateInput:()=>Tl,validateUpdateShape:()=>Zg});function Zg(r,t,e){let o=t.rank>1?t.shape[t.rank-1]:1,n=t.rank>1?t.rank-1:1,s=`Must have updates.shape = indices.shape[:batchDim] + shape[sliceDim:], got updates.shape: ${e.shape}, indices.shape: ${t.shape}, shape: ${r}, sliceDim: ${o}, and batchDim: ${n}.`;if(e.rank<n)throw new Error(s+` update.rank < ${n}. `);if(r.length<o+(e.rank-n))throw new Error(s+` Output shape length < ${o+(e.rank-n)}`);if(e.rank!==n+r.length-o)throw new Error(s+` update.rank != ${n+r.length-o}`);for(let a=0;a<n;++a)if(e.shape[a]!==t.shape[a])throw new Error(s+` updates.shape[${a}] (${e.shape[a]}) != indices.shape[${a}] (${t.shape[a]}).`);for(let a=0;a<e.rank-n;++a)if(e.shape[a+n]!==r[a+o])throw new Error(s+` updates.shape[${a+n}] (${e.shape[a+n]}) != shape[${a+n}] (${r[a+n]})`)}function Tl(r,t,e){if(t.rank<1)throw new Error(`tf.scatterND() expects the indices to be rank 1 or higher, but the rank was ${t.rank}.`);if(r.rank<1)throw new Error(`tf.scatterND() expects the updates to be rank 1 or higher, but the rank was ${r.rank}.`);if(t.dtype!=="int32")throw new Error(`The dtype of 'indices' should be int32, but got dtype: ${t.dtype}`);if(e.length<1)throw new Error(`Output rank must be greater or equal to 1, but got shape: ${e}`);if(e.length===0){if(t.size===0)throw new Error(`Indices specified for empty output. indices shape: ${t.shape}`);if(r.size===0)throw new Error(`Updates specified for empty output. updates shape: ${r.shape}`)}Zg(e,t,r)}function lw(r,t,e){let o=t.shape.length,n=o>1?t.shape[o-1]:1,s=e.length,a=1;for(let p=n;p<s;++p)a*=e[p];let i=n<1?1:n,l=bt(t.shape)/i,c=[...Ur(e.slice(0,n)),1],u=bt(e);return{sliceRank:n,numUpdates:l,sliceSize:a,strides:c,outputSize:u}}function WO(r,t,e){let o=v(r,"tensor","tensorScatterupdate"),n=v(t,"indices","tensorScatterupdate","int32"),s=v(e,"updates","tensorScatterupdate");if(Tl(s,n,o.shape),o.dtype!==s.dtype)throw new Error(`tensor and updates must have the same dtype, instead they are ${o.dtype} and ${s.dtype}.`);let a={tensor:o,indices:n,updates:s},i={};return k.runKernel(Ba,a,i)}var Jg=T({tensorScatterUpdate_:WO});function GO(r,t=1,e=!0){let o=v(r,"x","topk");if(o.rank===0)throw new Error("topk() expects the input to be of rank 1 or higher");let n=o.shape[o.shape.length-1];if(t<0)throw new Error(`'k' passed to topk() must be >= 0 but got ${t}`);if(t>n)throw new Error(`'k' passed to topk() must be <= the last dimension (${n}) but got ${t}`);let s={x:o},a={k:t,sorted:e},[i,l]=k.runKernel(ni,s,a);return{values:i,indices:l}}var tx=T({topk_:GO});function UO(r,t=0,e=1,o,n){if(Kt(r),o!=null&&o==="bool")throw new Error("Unsupported data type $ { dtype }");let s=new Ci(t,e,o,!0,n),a=ot(r,o);for(let i=0;i<a.values.length;i++)a.values[i]=s.nextValue();return a.toTensor()}var ex=T({truncatedNormal_:UO});function HO(r,t=0){let e=v(r,"x","unique","string_or_numeric");E(e.rank>0,()=>"The input tensor must be at least 1D");let o={x:e},n={axis:t},[s,a]=k.runKernel(ai,o,n);return{values:s,indices:a}}var rx=T({unique_:HO});function KO(r,t,e){let o=v(r,"x","unsortedSegmentSum"),n=v(t,"segmentIds","unsortedSegmentSum","int32");E(ho(e),()=>"numSegments must be of dtype int");let s={x:o,segmentIds:n},a={numSegments:e};return k.runKernel(li,s,a)}var ox=T({unsortedSegmentSum_:KO});function qO(r,t=0){let e=v(r,"x","unstack","string_or_numeric");E(t>=-e.shape.length&&t<e.shape.length,()=>`Axis = ${t} is not in [-${e.shape.length}, ${e.shape.length})`);let o={value:e},n={axis:t};return k.runKernel(ii,o,n)}var ir=T({unstack_:qO});function nx(r,t){return Sl(r,t,"right")}function sx(r,t=!0,e,o){return k.makeVariable(r,t,e,o)}function vp(r,t){let e=[];for(let s=0;s<t.length;s++)t[s]&&e.push(s);let o=ot(r,"int32"),n=ot([e.length,r.length],"int32");for(let s=0;s<e.length;s++){let a=o.indexToLoc(e[s]),i=s*r.length;n.values.set(a,i)}return n.toTensor()}async function jO(r){let t=v(r,"condition","whereAsync","bool"),e=await t.data(),o=vp(t.shape,e);return r!==t&&t.dispose(),o}var lu=jO;async function XO(r,t,e){let o=v(r,"tensor","boolMask"),n=v(t,"mask","boolMask","bool"),s=e??0,a=n.rank,i=o.shape;E(a>0,()=>"mask cannot be scalar"),zt(i.slice(s,s+a),n.shape,"mask's shape must match the first K dimensions of tensor's shape,");let l=1;for(let g=s;g<s+a;g++)l*=i[g];let c=i.slice(0,s).concat([l],i.slice(s+a)),u=L(o,c),p=L(n,[-1]),m=await lu(p),f=Pt(m,[1]),d=Vc(u,f,s);return r!==o&&o.dispose(),t!==n&&n.dispose(),f.dispose(),u.dispose(),p.dispose(),m.dispose(),d}var cw=XO;function YO(r,t,e){let o=v(r,"x","transpose");if(t==null&&(t=o.shape.map((a,i)=>i).reverse()),E(o.rank===t.length,()=>`Error in transpose: rank of input ${o.rank} must match length of perm ${t}.`),t.forEach(a=>{E(a>=0&&a<o.rank,()=>`All entries in 'perm' must be between 0 and ${o.rank-1} but got ${t}`)}),o.rank<=1)return o.clone();let n={x:o},s={perm:t};return o.dtype==="complex64"?at(()=>{let a=eo(o),i=Fo(o);return a=k.runKernel(wo,{x:a},s),i=k.runKernel(wo,{x:i},s),e&&(i=ye(i)),Le(a,i)}):k.runKernel(wo,n,s)}var ki=T({transpose_:YO});function QO(r,t,e,o,n=!0){let s=v(r,"v","movingAverage"),a=v(t,"x","movingAverage"),i=v(e,"decay","movingAverage");Pd(s,a),E(Pe(s.shape,a.shape),()=>"Shape mismatch in v and x");let l=it(1),c=lt(l,i),u=K(lt(a,s),c);if(n){E(o!=null,()=>"When using zeroDebias: true, step is required.");let p=v(o,"step","movingAverage");u=mt(u,lt(l,Zr(i,p)))}return Z(s,u)}var uw=T({movingAverage_:QO});function ZO(r,t,e){Kt(e);let o=v(r,"indices","scatterND","int32"),n=v(t,"updates","scatterND");Tl(n,o,e);let s={indices:o,updates:n},a={shape:e};return k.runKernel(La,s,a)}var pw=T({scatterND_:ZO});function mw(r,t,e,o){if(r.dtype!=="int32")throw new Error(`tf.sparseToDense() expects the indices to be int32 type, but the dtype was ${r.dtype}.`);if(r.rank>2)throw new Error(`sparseIndices should be a scalar, vector, or matrix, but got shape ${r.shape}.`);let n=r.rank>0?r.shape[0]:1,s=r.rank>1?r.shape[1]:1;if(e.length!==s)throw new Error(`outputShape has incorrect number of elements:, ${e.length}, should be: ${s}.`);let a=t.size;if(!(t.rank===0||t.rank===1&&a===n))throw new Error(`sparseValues has incorrect shape ${t.shape}, should be [] or [${n}]`);if(t.dtype!==o.dtype)throw new Error("sparseValues.dtype must match defaultValues.dtype")}function tP(r,t,e,o=0){Kt(e);let n=v(r,"sparseIndices","sparseToDense","int32"),s=v(t,"sparseValues","sparseToDense","string_or_numeric"),a=v(o,"defaultValue","sparseToDense",s.dtype);mw(n,s,e,a);let i={sparseIndices:n,sparseValues:s,defaultValue:a},l={outputShape:e};return k.runKernel(Qa,i,l)}var fw=T({sparseToDense_:tP});function eP(r,t){let e=v(t,"indices","gatherND","int32"),n={params:v(r,"x","gatherND","string_or_numeric"),indices:e};return k.runKernel(aa,n)}var dw=T({gatherND_:eP});function hw(r,t){if(t==null)return r.shape.slice();if(Pe(r.shape,t))return t;if(r.shape.length===t.length){let e=[];for(let o=0;o<r.shape.length;o++)t[o]==null&&r.shape[o]!=null?e.push(r.shape[o]):e.push(t[o]);return e}return t}function rP(r,t,e,o){let n=v(r,"x","dropout");if(E(n.dtype==="float32",()=>`x has to be a floating point tensor since it's going to be scaled, but got a ${n.dtype} tensor instead.`),E(t>=0&&t<1,()=>`rate must be a float in the range [0, 1), but got ${t}.`),t===0)return r instanceof Nt?n.clone():n;let s=hw(n,e),a=1-t,i=mt(Bc(Z(Ti(s,0,1,"float32",o),a)),a);return K(n,i)}var gw=T({dropout_:rP});function Sp(r){return Math.floor(Math.pow(2,Math.ceil(Math.log(r)/Math.log(2))))}function Nl(r,t,e){let o=1-r%2,n=new Float32Array(r);for(let s=0;s<r;++s){let a=2*Math.PI*s/(r+o-1);n[s]=t-e*Math.cos(a)}return Zt(n,"float32")}async function oP(r,t,e=1){let o=v(r,"predictions","inTopK"),n=v(t,"targets","inTopK");E(o.rank>1,()=>`inTopK() expects the predictions to be of rank 2 or higher, but got ${o.rank}`),E(o.rank-1===n.rank,()=>`predictions rank should be 1 larger than targets rank, but got predictions rank ${o.rank} and targets rank ${n.rank}`),zt(o.shape.slice(0,o.shape.length-1),n.shape,"predictions's shape should be align with the targets' shape, except the last dimension.");let s=o.shape[o.shape.length-1];E(e>0&&e<=s,()=>`'k' passed to inTopK() must be > 0 && <= the predictions last dimension (${s}), but got ${e}`);let a=await o.data(),i=await n.data(),[l,c]=[a.length/s,s],u=yd("bool",l);for(let p=0;p<l;p++){let m=p*c,f=a.subarray(m,m+c),d=[];for(let g=0;g<f.length;g++)d.push({value:f[g],index:g});d.sort((g,h)=>h.value-g.value),u[p]=0;for(let g=0;g<e;g++)if(d[g].index===i[p]){u[p]=1;break}}return r!==o&&o.dispose(),t!==n&&n.dispose(),$e(u,n.shape,"bool")}var xw=oP;var Cp={};kt(Cp,{conv2d:()=>bw,depthwiseConv2d:()=>Sw,matMul:()=>Cw});function nP(r,t,e,o,n,s="NHWC",a){let i=r;r.rank===3&&(i=L(r,[1,r.shape[0],r.shape[1],r.shape[2]]));let l=t;l.rank===3&&(l=L(t,[1,t.shape[0],t.shape[1],t.shape[2]])),E(i.rank===4,()=>`Error in conv2dDerFilter: input must be rank 4, but got shape ${i.shape}.`),E(l.rank===4,()=>`Error in conv2dDerFilter: dy must be rank 4, but got shape ${l.shape}.`),E(e.length===4,()=>`Error in conv2dDerFilter: filterShape must be length 4, but got ${e}.`);let c=s==="NHWC"?i.shape[3]:i.shape[1],u=s==="NHWC"?l.shape[3]:l.shape[1];E(c===e[2],()=>`Error in conv2dDerFilter: depth of input ${c}) must match input depth in filter (${e[2]}.`),E(u===e[3],()=>`Error in conv2dDerFilter: depth of dy (${u}) must match output depth for filter (${e[3]}).`),ie("conv2dDerFilter",n,a);let p={x:i,dy:l},m={strides:o,pad:n,dataFormat:s,dimRoundingMode:a,filterShape:e};return k.runKernel(Ps,p,m)}var yw=T({conv2DBackpropFilter_:nP});function Ei(r,t,e){if(e==null||e==="linear")return r;if(e==="relu")return K(r,su(t));throw new Error(`Cannot compute gradient for fused activation ${e}.`)}function $i(r,t){let e=t,o=fp(r.shape,t.shape);return o.length>0&&(e=Ft(e,o)),L(e,r.shape)}function Ri(r,t,e,o){if(t==="linear")return r;if(t==="relu")return Do(r);if(t==="elu")return Mc(r);if(t==="relu6")return eu(r);if(t==="prelu")return Jc(r,e);if(t==="leakyrelu")return Wc(r,o);if(t==="sigmoid")return je(r);throw new Error(`Unknown fused activation ${t}.`)}var Ai=(r,t)=>!(r>0)||t==="linear";function sP({x:r,filter:t,strides:e,pad:o,dataFormat:n="NHWC",dilations:s=[1,1],dimRoundingMode:a,bias:i,activation:l="linear",preluActivationWeights:c,leakyreluAlpha:u}){if(l=l||"linear",Ai(k.state.gradientDepth,l)===!1){E(n==="NHWC",()=>`Error in fused conv2d: got dataFormat of ${n} but only NHWC is currently supported for the case of gradient depth is 0 and the activation is not linear.`);let $=Eo(r,t,e,o,n,s,a);return i!=null&&($=Z($,i)),Ri($,l,c,u)}let p=v(r,"x","conv2d","float32"),m=v(t,"filter","conv2d","float32"),f=p,d=!1;p.rank===3&&(d=!0,f=L(p,[1,p.shape[0],p.shape[1],p.shape[2]])),E(f.rank===4,()=>`Error in fused conv2d: input must be rank 4, but got rank ${f.rank}.`),E(m.rank===4,()=>`Error in fused conv2d: filter must be rank 4, but got rank ${m.rank}.`),ie("fused conv2d",o,a);let g=n==="NHWC"?f.shape[3]:f.shape[1];E(m.shape[2]===g,()=>`Error in conv2d: depth of input (${g}) must match input depth for filter ${m.shape[2]}.`),E(Ae(e,s),()=>`Error in conv2D: Either strides or dilations must be 1. Got strides ${e} and dilations '${s}'`);let h=bi(f.shape,m.shape,e,s,o,a),x;i!=null&&(x=v(i,"bias","fused conv2d"),[x]=yt(x,p),n==="NHWC"?At(h.outShape,x.shape):(E(x.shape.length<=1,()=>`Error in fused conv2d: only supports scalar or 1-D Tensor bias for NCHW format but got the bias of rank-${x.shape.length}.`),E(x.shape.length===0||x.shape[0]===h.outChannels||x.shape[0]===1,()=>`Error in fused conv2d: bias shape (${x.shape}) is not compatible with the number of output channels (${h.outChannels})`)));let b;if(c!=null){let $=c.shape;if(E($.length<=1||$.length===3,()=>`Error in fused conv2d: only supports scalar, 1-D Tensor or 3-D Tensor PReLU activation weights but got a tensor of rank-${$.length}.`),$.length===1)E($[0]===1||$[0]===h.outChannels,()=>`Error in fused conv2d: PReLU activation weights (${$}) is not compatible with the number of output channels (${h.outChannels}).`);else if($.length===3)try{At($,h.outShape)}catch{let A=`Error in fused conv2d: PReLU activation weights (${$}) is not compatible with the output shape of the conv2d (${h.outShape}).`;throw Error(A)}b=v(c,"prelu weights","fused conv2d")}let C=($,R)=>{E(n==="NHWC",()=>`Error in gradient of fused conv2D: got dataFormat of ${n} but only NHWC is currently supported.`);let[A,F,_,O]=R,M=Ei($,_,l);E(yi(s),()=>`Error in gradient of fused conv2D: dilation rates greater than 1 are not yet supported in gradients. Got dilations '${s}'`);let P=mp(F.shape,M,A,e,o),B=yw(F,M,A.shape,e,o),V=[P,B];if(O!=null){let z=$i(O,M);V.push(z)}return V},S={x:f,filter:m,bias:x,preluActivationWeights:b},I={strides:e,pad:o,dataFormat:n,dilations:s,dimRoundingMode:a,activation:l,leakyreluAlpha:u};return i==null?Fe((R,A,F)=>{let _=k.runKernel(Wn,S,I);return F([A,R,_]),d&&(_=L(_,[_.shape[1],_.shape[2],_.shape[3]])),{value:_,gradFunc:C}})(f,m):Fe((R,A,F,_)=>{let O=k.runKernel(Wn,S,I);return _([A,R,O,F]),d&&(O=L(O,[O.shape[1],O.shape[2],O.shape[3]])),{value:O,gradFunc:C}})(f,m,x)}var bw=T({fusedConv2d_:sP});function aP(r,t,e,o,n,s=[1,1],a){let i=r;r.rank===3&&(i=L(r,[1,r.shape[0],r.shape[1],r.shape[2]]));let l=t;l.rank===3&&(l=L(t,[1,t.shape[0],t.shape[1],t.shape[2]]));let c={x:i,dy:l},u={strides:o,pad:n,dimRoundingMode:a,dilations:s,filterShape:e};return k.runKernel(qs,c,u)}var ww=T({depthwiseConv2dNativeBackpropFilter_:aP});function iP(r,t,e,o,n,s=[1,1],a){let i=t,l=!1;t.rank===3&&(l=!0,i=L(t,[1,t.shape[0],t.shape[1],t.shape[2]]));let c={dy:i,filter:e},u={strides:o,pad:n,dimRoundingMode:a,dilations:s,inputShape:r},p=k.runKernel(js,c,u);return l?L(p,[p.shape[1],p.shape[2],p.shape[3]]):p}var vw=T({depthwiseConv2dNativeBackpropInput_:iP});function lP({x:r,filter:t,strides:e,pad:o,dataFormat:n="NHWC",dilations:s=[1,1],dimRoundingMode:a,bias:i,activation:l="linear",preluActivationWeights:c,leakyreluAlpha:u}){if(Ai(k.state.gradientDepth,l)===!1){let I=wi(r,t,e,o,n,s,a);return i!=null&&(I=Z(I,i)),Ri(I,l,c,u)}let p=v(r,"x","depthwiseConv2d","float32"),m=v(t,"filter","depthwiseConv2d","float32"),f=p,d=!1;p.rank===3&&(d=!0,f=L(p,[1,p.shape[0],p.shape[1],p.shape[2]])),E(f.rank===4,()=>`Error in fused depthwiseConv2d: input must be rank 4, but got rank ${f.rank}.`),E(m.rank===4,()=>`Error in fused depthwiseConv2d: filter must be rank 4, but got rank ${m.rank}.`),E(f.shape[3]===m.shape[2],()=>`Error in fused depthwiseConv2d: number of input channels (${f.shape[3]}) must match the inChannels dimension in filter ${m.shape[2]}.`),s==null&&(s=[1,1]),E(Ae(e,s),()=>`Error in fused depthwiseConv2d: Either strides or dilations must be 1. Got strides ${e} and dilations '${s}'`),ie("fused depthwiseConv2d",o,a);let g=bi(f.shape,m.shape,e,s,o,a,!0),h;i!=null&&(h=v(i,"bias","fused conv2d"),[h]=yt(h,p),At(g.outShape,h.shape));let x;c!=null&&(x=v(c,"prelu weights","fused depthwiseConv2d"));let b=(I,$)=>{E(yi(s),()=>`Error in gradient of fused depthwiseConv2d: dilation rates greater than 1 are not yet supported. Got dilations '${s}'`);let[R,A,F,_]=$,O=Ei(I,F,l),M=vw(A.shape,O,R,e,o,s,a),P=ww(A,O,R.shape,e,o,s,a);if(_!=null){let B=$i(h,O);return[M,P,B]}return[M,P]},C={x:f,filter:m,bias:h,preluActivationWeights:x},S={strides:e,pad:o,dataFormat:n,dilations:s,dimRoundingMode:a,activation:l,leakyreluAlpha:u};return i==null?Fe(($,R,A)=>{let F=k.runKernel(Gn,C,S);return A([R,$,F]),d&&(F=L(F,[F.shape[1],F.shape[2],F.shape[3]])),{value:F,gradFunc:b}})(f,m):Fe(($,R,A,F)=>{let _=k.runKernel(Gn,C,S);return F([R,$,_,A]),d&&(_=L(_,[_.shape[1],_.shape[2],_.shape[3]])),{value:_,gradFunc:b}})(f,m,h)}var Sw=T({fusedDepthwiseConv2d_:lP});function cP({a:r,b:t,transposeA:e=!1,transposeB:o=!1,bias:n,activation:s="linear",preluActivationWeights:a,leakyreluAlpha:i=.2}){if(Ai(k.state.gradientDepth,s)===!1){let O=Et(r,t,e,o);return n!=null&&(O=Z(O,n)),Ri(O,s,a,i)}let l=v(r,"a","fused matMul"),c=v(t,"b","fused matMul");[l,c]=yt(l,c);let u=e?l.shape[l.rank-2]:l.shape[l.rank-1],p=o?c.shape[c.rank-1]:c.shape[c.rank-2],m=e?l.shape[l.rank-1]:l.shape[l.rank-2],f=o?c.shape[c.rank-2]:c.shape[c.rank-1],d=l.shape.slice(0,-2),g=c.shape.slice(0,-2),h=bt(d),x=bt(g);E(u===p,()=>`Error in fused matMul: inner shapes (${u}) and (${p}) of Tensors with shapes ${l.shape} and ${c.shape} and transposeA=${e} and transposeB=${o} must match.`);let C=At(l.shape.slice(0,-2),c.shape.slice(0,-2)).concat([m,f]),S=e?L(l,[h,u,m]):L(l,[h,m,u]),I=o?L(c,[x,f,p]):L(c,[x,p,f]),$;n!=null&&($=v(n,"bias","fused matMul"),[$]=yt($,l),At(C,$.shape));let R;a!=null&&(R=v(a,"prelu weights","fused matMul"));let A=(O,M)=>{let[P,B,V,z]=M,G=Ei(L(O,V.shape),V,s),W,H;if(!e&&!o?(W=Et(G,B,!1,!0),H=Et(P,G,!0,!1)):!e&&o?(W=Et(G,B,!1,!1),H=Et(G,P,!0,!1)):e&&!o?(W=Et(B,G,!1,!0),H=Et(P,G,!1,!1)):(W=Et(B,G,!0,!0),H=Et(G,P,!0,!0)),n!=null){let X=$i(z,G);return[W,H,X]}else return[W,H]},F={a:S,b:I,bias:$,preluActivationWeights:R},_={transposeA:e,transposeB:o,activation:s,leakyreluAlpha:i};return n==null?Fe((M,P,B)=>{let V=k.runKernel(zn,F,_);return B([M,P,V]),{value:L(V,C),gradFunc:A}})(S,I):Fe((M,P,B,V)=>{let z=k.runKernel(zn,F,_);return V([M,P,z,B]),{value:L(z,C),gradFunc:A}})(S,I,$)}var Cw=T({fusedMatMul_:cP});function uP(r){return Nl(r,.54,.46)}var Tw=T({hammingWindow_:uP});function pP(r){return Nl(r,.5,.5)}var Tp=T({hannWindow_:pP});function mP(r,t,e,o=!1,n=0){let s=0,a=[];for(;s+t<=r.size;)a.push(ft(r,s,t)),s+=e;if(o)for(;s<r.size;){let i=s+t-r.size,l=Lt([ft(r,s,t-i),Fr([i],n)]);a.push(l),s+=e}return a.length===0?De([],[0,t]):L(Lt(a),[a.length,t])}var Np=T({frame_:mP});function fP(r,t,e,o,n=Tp){o==null&&(o=Sp(t));let s=Np(r,t,e),a=K(s,n(t));return Ii(a,o)}var Nw=T({stft_:fP});function dP(r,t,e,o,n="bilinear",s=0){let a=v(r,"image","cropAndResize"),i=v(t,"boxes","cropAndResize","float32"),l=v(e,"boxInd","cropAndResize","int32"),c=i.shape[0];E(a.rank===4,()=>`Error in cropAndResize: image must be rank 4,but got rank ${a.rank}.`),E(i.rank===2&&i.shape[1]===4,()=>`Error in cropAndResize: boxes must be have size [${c},4] but had shape ${i.shape}.`),E(l.rank===1&&l.shape[0]===c,()=>`Error in cropAndResize: boxInd must be have size [${c}] but had shape ${i.shape}.`),E(o.length===2,()=>`Error in cropAndResize: cropSize must be of length 2, but got length ${o.length}.`),E(o[0]>=1&&o[1]>=1,()=>`cropSize must be atleast [1,1], but was ${o}`),E(n==="bilinear"||n==="nearest",()=>`method must be bilinear or nearest, but was ${n}`);let u={image:a,boxes:i,boxInd:l},p={method:n,extrapolationValue:s,cropSize:o};return k.runKernel(Gs,u,p)}var Iw=T({cropAndResize_:dP});function hP(r){let t=v(r,"image","flipLeftRight","float32");E(t.rank===4,()=>`Error in flipLeftRight: image must be rank 4,but got rank ${t.rank}.`);let e={image:t};return k.runKernel(oa,e,{})}var kw=T({flipLeftRight_:hP});function gP(r){let t=v(r,"image","grayscaleToRGB"),e=t.rank-1,o=t.shape[e];E(t.rank>=2,()=>`Error in grayscaleToRGB: images must be at least rank 2, but got rank ${t.rank}.`),E(o===1,()=>`Error in grayscaleToRGB: last dimension of a grayscale image should be size 1, but got size ${o}.`);let n=new Array(t.rank);return n.fill(1,0,e),n[e]=3,Ao(t,n)}var Ew=T({grayscaleToRGB_:gP});function xP(r){let t=v(r,"image","RGBToGrayscale"),e=t.rank-1,o=t.shape[e];E(t.rank>=2,()=>`Error in RGBToGrayscale: images must be at least rank 2, but got rank ${t.rank}.`),E(o===3,()=>`Error in RGBToGrayscale: last dimension of an RGB image should be size 3, but got size ${o}.`);let n=t.dtype,s=xt(t,"float32"),a=Zt([.2989,.587,.114]),i;switch(t.rank){case 2:i=$o("ij,j->i",s,a);break;case 3:i=$o("ijk,k->ij",s,a);break;case 4:i=$o("ijkl,l->ijk",s,a);break;case 5:i=$o("ijklm,m->ijkl",s,a);break;case 6:i=$o("ijklmn,n->ijklm",s,a);break;default:throw new Error("Not a valid tensor rank.")}return i=Ne(i,-1),xt(i,n)}var $w=T({rgbToGrayscale_:xP});function yP(r,t,e=0,o=.5){let n=v(r,"image","rotateWithOffset","float32");E(n.rank===4,()=>`Error in rotateWithOffset: image must be rank 4,but got rank ${n.rank}.`);let s={image:n},a={radians:t,fillValue:e,center:o};return k.runKernel(ui,s,a)}var Rw=T({rotateWithOffset_:yP});function wr(r,t,e,o,n,s){o==null&&(o=.5),n==null&&(n=Number.NEGATIVE_INFINITY),s==null&&(s=0);let a=r.shape[0];return e=Math.min(e,a),E(0<=o&&o<=1,()=>`iouThreshold must be in [0, 1], but was '${o}'`),E(r.rank===2,()=>`boxes must be a 2D tensor, but was of rank '${r.rank}'`),E(r.shape[1]===4,()=>`boxes must have 4 columns, but 2nd dimension was ${r.shape[1]}`),E(t.rank===1,()=>"scores must be a 1D tensor"),E(t.shape[0]===a,()=>`scores has incompatible shape with boxes. Expected ${a}, but was ${t.shape[0]}`),E(0<=s&&s<=1,()=>`softNmsSigma must be in [0, 1], but was '${s}'`),{maxOutputSize:e,iouThreshold:o,scoreThreshold:n,softNmsSigma:s}}function bP(r,t,e,o=.5,n=Number.NEGATIVE_INFINITY){let s=v(r,"boxes","nonMaxSuppression","float32"),a=v(t,"scores","nonMaxSuppression","float32"),i=wr(s,a,e,o,n);e=i.maxOutputSize,o=i.iouThreshold,n=i.scoreThreshold;let l={maxOutputSize:e,iouThreshold:o,scoreThreshold:n};return k.runKernel(ba,{boxes:s,scores:a},l)}var Aw=T({nonMaxSuppression_:bP});function Fw(r,t,e){let o=wP(r,t,e),n=o<0?-(o+1):o;r.splice(n,0,t)}function wP(r,t,e){return SP(r,t,e||vP)}function vP(r,t){return r>t?1:r<t?-1:0}function SP(r,t,e){let o=0,n=r.length,s=0,a=!1;for(;o<n;){s=o+(n-o>>>1);let i=e(t,r[s]);i>0?o=s+1:(n=s,a=!i)}return a?o:-o-1}function Ip(r,t,e,o,n){return ax(r,t,e,o,n,0)}function kp(r,t,e,o,n,s){return ax(r,t,e,o,n,0,!1,s,!0)}function Ep(r,t,e,o,n,s){return ax(r,t,e,o,n,s,!0)}function ax(r,t,e,o,n,s,a=!1,i=!1,l=!1){let c=[];for(let h=0;h<t.length;h++)t[h]>n&&c.push({score:t[h],boxIndex:h,suppressBeginIndex:0});c.sort(_w);let u=s>0?-.5/s:0,p=[],m=[];for(;p.length<e&&c.length>0;){let h=c.pop(),{score:x,boxIndex:b,suppressBeginIndex:C}=h;if(x<n)break;let S=!1;for(let I=p.length-1;I>=C;--I){let $=CP(r,b,p[I]);if($>=o){S=!0;break}if(h.score=h.score*TP(o,u,$),h.score<=n)break}h.suppressBeginIndex=p.length,S||(h.score===x?(p.push(b),m.push(h.score)):h.score>n&&Fw(c,h,_w))}let f=p.length,d=e-f;i&&d>0&&(p.push(...new Array(d).fill(0)),m.push(...new Array(d).fill(0)));let g={selectedIndices:p};return a&&(g.selectedScores=m),l&&(g.validOutputs=f),g}function CP(r,t,e){let o=r.subarray(t*4,t*4+4),n=r.subarray(e*4,e*4+4),s=Math.min(o[0],o[2]),a=Math.min(o[1],o[3]),i=Math.max(o[0],o[2]),l=Math.max(o[1],o[3]),c=Math.min(n[0],n[2]),u=Math.min(n[1],n[3]),p=Math.max(n[0],n[2]),m=Math.max(n[1],n[3]),f=(i-s)*(l-a),d=(p-c)*(m-u);if(f<=0||d<=0)return 0;let g=Math.max(s,c),h=Math.max(a,u),x=Math.min(i,p),b=Math.min(l,m),C=Math.max(x-g,0)*Math.max(b-h,0);return C/(f+d-C)}function TP(r,t,e){let o=Math.exp(t*e*e);return e<=r?o:0}function _w(r,t){return r.score-t.score||r.score===t.score&&t.boxIndex-r.boxIndex}async function NP(r,t,e,o=.5,n=Number.NEGATIVE_INFINITY){let s=v(r,"boxes","nonMaxSuppressionAsync"),a=v(t,"scores","nonMaxSuppressionAsync"),i=wr(s,a,e,o,n);e=i.maxOutputSize,o=i.iouThreshold,n=i.scoreThreshold;let l=await Promise.all([s.data(),a.data()]),c=l[0],u=l[1],{selectedIndices:p}=Ip(c,u,e,o,n);return s!==r&&s.dispose(),a!==t&&a.dispose(),Zt(p,"int32")}var Dw=NP;function IP(r,t,e,o=.5,n=Number.NEGATIVE_INFINITY,s=0){let a=v(r,"boxes","nonMaxSuppression"),i=v(t,"scores","nonMaxSuppression"),l=wr(a,i,e,o,n,s);e=l.maxOutputSize,o=l.iouThreshold,n=l.scoreThreshold,s=l.softNmsSigma;let c={boxes:a,scores:i},u={maxOutputSize:e,iouThreshold:o,scoreThreshold:n,softNmsSigma:s},p=k.runKernel(va,c,u);return{selectedIndices:p[0],selectedScores:p[1]}}var Ow=T({nonMaxSuppressionWithScore_:IP});async function kP(r,t,e,o=.5,n=Number.NEGATIVE_INFINITY,s=0){let a=v(r,"boxes","nonMaxSuppressionAsync"),i=v(t,"scores","nonMaxSuppressionAsync"),l=wr(a,i,e,o,n,s);e=l.maxOutputSize,o=l.iouThreshold,n=l.scoreThreshold,s=l.softNmsSigma;let c=await Promise.all([a.data(),i.data()]),u=c[0],p=c[1],{selectedIndices:m,selectedScores:f}=Ep(u,p,e,o,n,s);return a!==r&&a.dispose(),i!==t&&i.dispose(),{selectedIndices:Zt(m,"int32"),selectedScores:Zt(f)}}var Pw=kP;function EP(r,t,e,o=.5,n=Number.NEGATIVE_INFINITY,s=!1){let a=v(r,"boxes","nonMaxSuppression"),i=v(t,"scores","nonMaxSuppression"),l=wr(a,i,e,o,n,null),c=l.maxOutputSize,u=l.iouThreshold,p=l.scoreThreshold,m={boxes:a,scores:i},f={maxOutputSize:c,iouThreshold:u,scoreThreshold:p,padToMaxOutputSize:s},d=k.runKernel(wa,m,f);return{selectedIndices:d[0],validOutputs:d[1]}}var Mw=T({nonMaxSuppressionPadded_:EP});async function $P(r,t,e,o=.5,n=Number.NEGATIVE_INFINITY,s=!1){let a=v(r,"boxes","nonMaxSuppressionAsync"),i=v(t,"scores","nonMaxSuppressionAsync"),l=wr(a,i,e,o,n,null),c=l.maxOutputSize,u=l.iouThreshold,p=l.scoreThreshold,[m,f]=await Promise.all([a.data(),i.data()]),{selectedIndices:d,validOutputs:g}=kp(m,f,c,u,p,s);return a!==r&&a.dispose(),i!==t&&i.dispose(),{selectedIndices:Zt(d,"int32"),validOutputs:it(g,"int32")}}var Lw=$P;function RP(r,t,e=!1,o=!1){let n=v(r,"images","resizeBilinear");E(n.rank===3||n.rank===4,()=>`Error in resizeBilinear: x must be rank 3 or 4, but got rank ${n.rank}.`),E(t.length===2,()=>`Error in resizeBilinear: new shape must 2D, but got shape ${t}.`),E(o===!1||e===!1,()=>"Error in resizeBilinear: If halfPixelCenters is true, alignCorners must be false.");let s=n,a=!1;n.rank===3&&(a=!0,s=L(n,[1,n.shape[0],n.shape[1],n.shape[2]]));let[]=t,i={images:s},l={alignCorners:e,halfPixelCenters:o,size:t},c=k.runKernel(Pa,i,l);return a?L(c,[c.shape[1],c.shape[2],c.shape[3]]):c}var Bw=T({resizeBilinear_:RP});function AP(r,t,e=!1,o=!1){let n=v(r,"images","resizeNearestNeighbor");E(n.rank===3||n.rank===4,()=>`Error in resizeNearestNeighbor: x must be rank 3 or 4, but got rank ${n.rank}.`),E(t.length===2,()=>`Error in resizeNearestNeighbor: new shape must 2D, but got shape ${t}.`),E(n.dtype==="float32"||n.dtype==="int32",()=>"`images` must have `int32` or `float32` as dtype"),E(o===!1||e===!1,()=>"Error in resizeNearestNeighbor: If halfPixelCenters is true, alignCorners must be false.");let s=n,a=!1;n.rank===3&&(a=!0,s=L(n,[1,n.shape[0],n.shape[1],n.shape[2]]));let[]=t,i={images:s},l={alignCorners:e,halfPixelCenters:o,size:t},c=k.runKernel(Oa,i,l);return a?L(c,[c.shape[1],c.shape[2],c.shape[3]]):c}var Vw=T({resizeNearestNeighbor_:AP});function FP(r,t="binary",e=!1,o=.5){let n=v(r,"image","threshold"),s=.2989,a=.587,i=.114,l=n.shape[0]*n.shape[1],c=K(Zt([o]),255),u,p,m,f;if(E(n.rank===3,()=>`Error in threshold: image must be rank 3,but got rank ${n.rank}.`),E(n.shape[2]===3||n.shape[2]===1,()=>`Error in threshold: image color channel must be equal to 3 or 1but got ${n.shape[2]}.`),E(n.dtype==="int32"||n.dtype==="float32",()=>`Error in dtype: image dtype must be int32 or float32,but got dtype ${n.dtype}.`),E(t==="otsu"||t==="binary",()=>`Method must be binary or otsu, but was ${t}`),n.shape[2]===3){[u,p,m]=ro(n,[1,1,1],-1);let h=K(u,s),x=K(p,a),b=K(m,i);f=Z(Z(h,x),b)}else f=r;if(t==="otsu"){let h=Dc(xt(ru(f),"int32"),$e([]),256);c=_P(h,l)}let d=e?vi(f,c):Qn(f,c);return xt(K(d,255),"int32")}function _P(r,t){let e=Zt([-1]),o=Zt([0]),n=Zt([0]),s,a,i,l,c,u;for(let p=0;p<r.size-1;p++){s=ft(r,0,p+1),a=ft(r,p+1),c=mt(Ft(s),t),u=mt(Ft(a),t);let m=Ft(K(s,_o(0,s.size)));i=mt(m,Ft(s));let f=Fr(a.shape,s.size),d=Z(_o(0,a.size),f),g=K(a,d);l=mt(Ft(g),Ft(a));let h=lt(i,l),x=lt(i,l),b=K(c,u);n=K(K(b,h),x);let C=Qn(n,o);o=sr(C,n,o),e=sr(C,Zt([p]),e)}return e}var zw=T({threshold_:FP});function DP(r,t,e="nearest",o="constant",n=0,s){let a=v(r,"image","transform","float32"),i=v(t,"transforms","transform","float32");E(a.rank===4,()=>`Error in transform: image must be rank 4,but got rank ${a.rank}.`),E(i.rank===2&&(i.shape[0]===a.shape[0]||i.shape[0]===1)&&i.shape[1]===8,()=>"Error in transform: Input transform should be batch x 8 or 1 x 8"),E(s==null||s.length===2,()=>`Error in transform: outputShape must be [height, width] or null, but got ${s}.`);let l={image:a,transforms:i},c={interpolation:e,fillMode:o,fillValue:n,outputShape:s};return k.runKernel(si,l,c)}var Ww=T({transform_:DP});function OP(r,t,e){let o=v(r,"a","bandPart");E(o.rank>=2,()=>`bandPart(): Rank must be at least 2, got ${o.rank}.`);let n=o.shape,[s,a]=o.shape.slice(-2),i,l;typeof t=="number"?(E(t%1===0,()=>`bandPart(): numLower must be an integer, got ${t}.`),E(t<=s,()=>`bandPart(): numLower (${t}) must not be greater than the number of rows (${s}).`),i=v(t<0?s:t,"numLower","bandPart")):(E(t.dtype==="int32",()=>"bandPart(): numLower's dtype must be an int32."),i=sr(vl(t,0),s,to(t,s))),typeof e=="number"?(E(e%1===0,()=>`bandPart(): numUpper must be an integer, got ${e}.`),E(e<=a,()=>`bandPart(): numUpper (${e}) must not be greater than the number of columns (${a}).`),l=v(e<0?a:e,"numUpper","bandPart")):(E(e.dtype==="int32",()=>"bandPart(): numUpper's dtype must be an int32."),l=sr(vl(e,0),a,to(e,a)));let c=L(_o(0,s,1,"int32"),[-1,1]),u=_o(0,a,1,"int32"),p=lt(c,u),m=Zn(vi(p,i),zc(p,ye(l))),f=Xe([s,a],o.dtype);return L(_e(ir(L(o,[-1,s,a])).map(d=>sr(m,d,f))),n)}var Gw=T({bandPart_:OP});function PP(r){let t;if(Array.isArray(r)){t=!1,E(r!=null&&r.length>0,()=>"Gram-Schmidt process: input must not be null, undefined, or empty");let n=r[0].shape[0];for(let s=1;s<r.length;++s)E(r[s].shape[0]===n,()=>`Gram-Schmidt: Non-unique lengths found in the input vectors: (${r[s].shape[0]} vs. ${n})`)}else t=!0,r=ro(r,r.shape[0],0).map(n=>Pt(n,[0]));E(r.length<=r[0].shape[0],()=>`Gram-Schmidt: Number of vectors (${r.length}) exceeds number of dimensions (${r[0].shape[0]}).`);let e=[],o=r;for(let n=0;n<r.length;++n)e.push(k.tidy(()=>{let s=o[n];if(n>0)for(let a=0;a<n;++a){let i=K(Ft(K(e[a],s)),e[a]);s=lt(s,i)}return mt(s,Yn(s,"euclidean"))}));return t?_e(e,0):e}var Uw=T({gramSchmidt_:PP});function MP(r,t=!1){if(E(r.rank>=2,()=>`qr() requires input tensor to have a rank >= 2, but got rank ${r.rank}`),r.rank===2)return Hw(r,t);{let e=r.shape.slice(0,r.shape.length-2).reduce((l,c)=>l*c),o=ir(L(r,[e,r.shape[r.shape.length-2],r.shape[r.shape.length-1]]),0),n=[],s=[];o.forEach(l=>{let[c,u]=Hw(l,t);n.push(c),s.push(u)});let a=L(_e(n,0),r.shape),i=L(_e(s,0),r.shape);return[a,i]}}function Hw(r,t=!1){return k.tidy(()=>{E(r.shape.length===2,()=>`qr2d() requires a 2D Tensor, but got a ${r.shape.length}D Tensor.`);let e=r.shape[0],o=r.shape[1],n=Lc(e),s=qe(r),a=De([[1]],[1,1]),i=qe(a),l=e>=o?o:e;for(let c=0;c<l;++c){let u=s,p=i,m=n;[i,s,n]=k.tidy(()=>{let f=ft(s,[c,c],[e-c,1]),d=Yn(f),g=ft(s,[c,c],[1,1]),h=sr(Qn(g,0),De([[-1]]),De([[1]])),x=lt(g,K(h,d)),b=mt(f,x);b.shape[0]===1?i=qe(a):i=Lt([a,ft(b,[1,0],[b.shape[0]-1,b.shape[1]])],0);let C=ye(mt(Et(h,x),d)),S=ft(s,[c,0],[e-c,o]),I=K(C,i),$=ki(i);if(c===0)s=lt(S,Et(I,Et($,S)));else{let F=lt(S,Et(I,Et($,S)));s=Lt([ft(s,[0,0],[c,o]),F],0)}let R=ki(I),A=ft(n,[0,c],[e,n.shape[1]-c]);if(c===0)n=lt(A,Et(Et(A,i),R));else{let F=lt(A,Et(Et(A,i),R));n=Lt([ft(n,[0,0],[e,c]),F],1)}return[i,s,n]}),Tt([u,p,m])}return!t&&e>o&&(n=ft(n,[0,0],[e,o]),s=ft(s,[0,0],[o,o])),[n,s]})}var Kw=T({qr_:MP});var Jt;(function(r){r[r.NONE=0]="NONE",r[r.MEAN=1]="MEAN",r[r.SUM=2]="SUM",r[r.SUM_BY_NONZERO_WEIGHTS=3]="SUM_BY_NONZERO_WEIGHTS"})(Jt||(Jt={}));function LP(r,t,e=Jt.SUM_BY_NONZERO_WEIGHTS){let o=v(r,"losses","computeWeightedLoss"),n=null;t!=null&&(n=v(t,"weights","computeWeightedLoss"));let s=n==null?o:K(o,n);if(e===Jt.NONE)return s;if(e===Jt.SUM)return Ft(s);if(e===Jt.MEAN){if(n==null)return Jn(s);{let a=o.size/n.size,i=mt(Ft(s),Ft(n));return a>1?mt(i,it(a)):i}}if(e===Jt.SUM_BY_NONZERO_WEIGHTS){if(n==null)return mt(Ft(s),it(o.size));{let a=K(n,Or(o.shape)),i=xt(Ft(Qc(a,it(0))),"float32");return mt(Ft(s),i)}}throw Error(`Unknown reduction: ${e}`)}var Ie=T({computeWeightedLoss_:LP});function BP(r,t,e,o=Jt.SUM_BY_NONZERO_WEIGHTS){let n=v(r,"labels","absoluteDifference"),s=v(t,"predictions","absoluteDifference"),a=null;e!=null&&(a=v(e,"weights","absoluteDifference")),zt(n.shape,s.shape,"Error in absoluteDifference: ");let i=he(lt(n,s));return Ie(i,a,o)}var qw=T({absoluteDifference_:BP});function VP(r,t,e,o,n=Jt.SUM_BY_NONZERO_WEIGHTS){let s=v(r,"labels","cosineDistance"),a=v(t,"predictions","cosineDistance"),i=null;o!=null&&(i=v(o,"weights","cosineDistance")),zt(s.shape,a.shape,"Error in cosineDistance: ");let l=it(1),c=lt(l,Ft(K(s,a),e,!0));return Ie(c,i,n)}var jw=T({cosineDistance_:VP});function zP(r,t,e,o=Jt.SUM_BY_NONZERO_WEIGHTS){let n=v(r,"labels","hingeLoss"),s=v(t,"predictions","hingeLoss"),a=null;e!=null&&(a=v(e,"weights","hingeLoss")),zt(n.shape,s.shape,"Error in hingeLoss: ");let i=it(1);n=lt(K(it(2),n),i);let l=Do(lt(i,K(n,s)));return Ie(l,a,o)}var Xw=T({hingeLoss_:zP});function WP(r,t,e,o=1,n=Jt.SUM_BY_NONZERO_WEIGHTS){let s=v(r,"labels","huberLoss"),a=v(t,"predictions","huberLoss"),i=null;e!=null&&(i=v(e,"weights","huberLoss")),zt(s.shape,a.shape,"Error in huberLoss: ");let l=it(o),c=he(lt(a,s)),u=to(c,l),p=lt(c,u),m=Z(K(it(.5),ue(u)),K(l,p));return Ie(m,i,n)}var Yw=T({huberLoss_:WP});function GP(r,t,e,o=1e-7,n=Jt.SUM_BY_NONZERO_WEIGHTS){let s=v(r,"labels","logLoss"),a=v(t,"predictions","logLoss"),i=null;e!=null&&(i=v(e,"weights","logLoss")),zt(s.shape,a.shape,"Error in logLoss: ");let l=it(1),c=it(o),u=ye(K(s,Jr(Z(a,c)))),p=K(lt(l,s),Jr(Z(lt(l,a),c))),m=lt(u,p);return Ie(m,i,n)}var Qw=T({logLoss_:GP});function UP(r,t,e,o=Jt.SUM_BY_NONZERO_WEIGHTS){let n=v(r,"labels","meanSquaredError"),s=v(t,"predictions","meanSquaredError"),a=null;e!=null&&(a=v(e,"weights","meanSquaredError")),zt(n.shape,s.shape,"Error in meanSquaredError: ");let i=nu(n,s);return Ie(i,a,o)}var Zw=T({meanSquaredError_:UP});function HP(r,t){let e=v(r,"labels","sigmoidCrossEntropyWithLogits"),o=v(t,"logits","sigmoidCrossEntropyWithLogits");zt(e.shape,o.shape,"Error in sigmoidCrossEntropyWithLogits: ");let n=Do(o),s=K(o,e),a=Gc(We(ye(he(o))));return Z(lt(n,s),a)}function KP(r,t,e,o=0,n=Jt.SUM_BY_NONZERO_WEIGHTS){let s=v(r,"multiClassLabels","sigmoidCrossEntropy"),a=v(t,"logits","sigmoidCrossEntropy"),i=null;if(e!=null&&(i=v(e,"weights","sigmoidCrossEntropy")),zt(s.shape,a.shape,"Error in sigmoidCrossEntropy: "),o>0){let c=it(o),u=it(1),p=it(.5);s=Z(K(s,lt(u,c)),K(p,c))}let l=HP(s,a);return Ie(l,i,n)}var Jw=T({sigmoidCrossEntropy_:KP});function qP(r,t,e=-1){if(e===-1&&(e=t.rank-1),e!==t.rank-1)throw Error(`Softmax cross entropy along a non-last dimension is not yet supported. Labels / logits was rank ${t.rank} and dim was ${e}`);return Fe((n,s,a)=>{let l=Hc(s,[e],!0),c=lt(xt(s,"float32"),l);a([n,c]);let u=ye(K(c,n));return{value:Ft(u,[e]),gradFunc:(f,d)=>{let[g,h]=d,x=Ro(f.shape,[e]);return[K(L(f,x),lt(xt(g,"float32"),We(h))),K(L(f,x),lt(We(h),xt(g,"float32")))]}}})(r,t)}function jP(r,t,e,o=0,n=Jt.SUM_BY_NONZERO_WEIGHTS){let s=v(r,"onehotLabels","softmaxCrossEntropy"),a=v(t,"logits","softmaxCrossEntropy"),i=null;if(e!=null&&(i=v(e,"weights","softmaxCrossEntropy")),zt(s.shape,a.shape,"Error in softmaxCrossEntropy: "),o>0){let c=it(o),u=it(1),p=it(s.shape[1]);s=Z(K(s,lt(u,c)),mt(c,p))}let l=qP(s,a);return Ie(l,i,n)}var tv=T({softmaxCrossEntropy_:jP});function XP(r,t,e,o){let n=v(r,"indices","sparseFillEmptyRows","int32"),s=v(t,"values","sparseFillEmptyRows"),a=v(e,"denseShape","sparseFillEmptyRows","int32"),i=v(o,"defaultValue","sparseFillEmptyRows",s.dtype);if(n.rank!==2)throw new Error(`Indices should be Tensor2D but received shape
        ${n.shape}`);if(s.rank!==1)throw new Error(`Values should be Tensor1D but received shape ${s.shape}`);if(a.rank!==1)throw new Error(`Dense shape should be Tensor1D but received shape ${a.shape}`);if(i.rank!==0)throw new Error(`Default value should be a scalar but received shape ${i.shape}`);let l={indices:n,values:s,denseShape:a,defaultValue:i},c=k.runKernel(qa,l);return{outputIndices:c[0],outputValues:c[1],emptyRowIndicator:c[2],reverseIndexMap:c[3]}}var ev=T({sparseFillEmptyRows_:XP});function YP(r,t,e){let o=v(r,"inputIndices","sparseReshape","int32"),n=v(t,"inputShape","sparseReshape","int32"),s=v(e,"newShape","sparseReshape","int32");if(o.rank!==2)throw new Error(`Input indices should be Tensor2D but received shape
        ${o.shape}`);if(n.rank!==1)throw new Error(`Input shape should be Tensor1D but received shape ${n.shape}`);if(s.rank!==1)throw new Error(`New shape should be Tensor1D but received shape ${s.shape}`);let a={inputIndices:o,inputShape:n,newShape:s},i=k.runKernel(ja,a);return{outputIndices:i[0],outputShape:i[1]}}var rv=T({sparseReshape_:YP});function QP(r,t,e){let o=v(r,"data","sparseSegmentMean"),n=v(t,"indices","sparseSegmentMean","int32"),s=v(e,"segmentIds","sparseSegmentMean","int32");if(o.rank<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.rank!==1)throw new Error(`Indices should be Tensor1D but received shape
          ${n.shape}`);if(s.rank!==1)throw new Error(`Segment ids should be Tensor1D but received shape
          ${s.shape}`);let a={data:o,indices:n,segmentIds:s};return k.runKernel(Xa,a)}var ov=T({sparseSegmentMean_:QP});function ZP(r,t,e){let o=v(r,"data","sparseSegmentSum"),n=v(t,"indices","sparseSegmentSum","int32"),s=v(e,"segmentIds","sparseSegmentSum","int32");if(o.rank<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.rank!==1)throw new Error(`Indices should be Tensor1D but received shape
         ${n.shape}`);if(s.rank!==1)throw new Error(`Segment ids should be Tensor1D but received shape
         ${s.shape}`);let a={data:o,indices:n,segmentIds:s};return k.runKernel(Ya,a)}var nv=T({sparseSegmentSum_:ZP});function JP(r,t,e,o,n,s,a,i){let l=v(r,"data","stringNGrams","string");if(l.dtype!=="string")throw new Error("Data must be of datatype string");if(l.shape.length!==1)throw new Error(`Data must be a vector, saw: ${l.shape}`);let c=v(t,"dataSplits","stringNGrams");if(c.dtype!=="int32")throw new Error("Data splits must be of datatype int32");let u={separator:e,nGramWidths:o,leftPad:n,rightPad:s,padWidth:a,preserveShortSequences:i},p={data:l,dataSplits:c},m=k.runKernel(Ja,p,u);return{nGrams:m[0],nGramsSplits:m[1]}}var sv=T({stringNGrams_:JP});function t3(r,t,e=!0){let o=v(r,"input","stringSplit","string"),n=v(t,"delimiter","stringSplit","string");if(o.rank!==1)throw new Error(`Input should be Tensor1D but received shape ${o.shape}`);if(n.rank!==0)throw new Error(`Delimiter should be a scalar but received shape ${n.shape}`);let s={skipEmpty:e},a={input:o,delimiter:n},i=k.runKernel(ti,a,s);return{indices:i[0],values:i[1],shape:i[2]}}var av=T({stringSplit_:t3});function e3(r,t){let e=v(r,"input","stringToHashBucketFast","string"),o={numBuckets:t};if(t<=0)throw new Error("Number of buckets must be at least 1");let n={input:e};return k.runKernel(ei,n,o)}var iv=T({stringToHashBucketFast_:e3});function r3(r,t,e,o=!0){let n=v(r,"input","staticRegexReplace","string"),s={pattern:t,rewrite:e,replaceGlobal:o};return k.runKernel(Ln,{x:n},s)}var lv=T({staticRegexReplace_:r3});var cv={fft:Ni,ifft:ts,rfft:Ii,irfft:ou},uv={hammingWindow:Tw,hannWindow:Tp,frame:Np,stft:Nw},oo={flipLeftRight:kw,grayscaleToRGB:Ew,resizeNearestNeighbor:Vw,resizeBilinear:Bw,rgbToGrayscale:$w,rotateWithOffset:Rw,cropAndResize:Iw,nonMaxSuppression:Aw,nonMaxSuppressionAsync:Dw,nonMaxSuppressionWithScore:Ow,nonMaxSuppressionWithScoreAsync:Pw,nonMaxSuppressionPadded:Mw,nonMaxSuppressionPaddedAsync:Lw,threshold:zw,transform:Ww},pv={bandPart:Gw,gramSchmidt:Uw,qr:Kw},mv={absoluteDifference:qw,computeWeightedLoss:Ie,cosineDistance:jw,hingeLoss:Xw,huberLoss:Yw,logLoss:Qw,meanSquaredError:Zw,sigmoidCrossEntropy:Jw,softmaxCrossEntropy:tv},fv={sparseFillEmptyRows:ev,sparseReshape:rv,sparseSegmentMean:ov,sparseSegmentSum:nv},dv={stringNGrams:sv,stringSplit:av,stringToHashBucketFast:iv,staticRegexReplace:lv};var cx={};kt(cx,{Serializable:()=>cu,SerializationMap:()=>$p,getRegisteredName:()=>n3,registerClass:()=>lx});var o3=new Map,ix=new Map,cu=class{getClassName(){return this.constructor.className}static fromConfig(t,e){return new t(e)}},$p=class r{constructor(){this.classNameMap={}}static getMap(){return r.instance==null&&(r.instance=new r),r.instance}static register(t){r.getMap().classNameMap[t.className]=[t,t.fromConfig]}};function lx(r,t,e){E(r.className!=null,()=>"Class being registered does not have the static className property defined."),E(typeof r.className=="string",()=>"className is required to be a string, but got type "+typeof r.className),E(r.className.length>0,()=>"Class being registered has an empty-string as its className, which is disallowed."),typeof t>"u"&&(t="Custom"),typeof e>"u"&&(e=r.className);let o=e,n=t+">"+o;return $p.register(r),o3.set(n,r),ix.set(r,n),r}function n3(r){return ix.has(r)?ix.get(r):r.className}var Oe=class extends cu{minimize(t,e=!1,o){let{value:n,grads:s}=this.computeGradients(t,o);if(o!=null){let a=o.map(i=>({name:i.name,tensor:s[i.name]}));this.applyGradients(a)}else this.applyGradients(s);return Tt(s),e?n:(n.dispose(),null)}get iterations(){return this.iterations_==null&&(this.iterations_=0),this.iterations_}incrementIterations(){this.iterations_=this.iterations+1}computeGradients(t,e){return dp(t,e)}dispose(){this.iterations_!=null&&Tt(this.iterations_)}async saveIterations(){return this.iterations_==null&&(this.iterations_=0),{name:"iter",tensor:it(this.iterations_,"int32")}}async getWeights(){throw new Error("getWeights() is not implemented for this optimizer yet.")}async setWeights(t){throw new Error(`setWeights() is not implemented for this optimizer class ${this.getClassName()}`)}async extractIterations(t){return this.iterations_=(await t[0].tensor.data())[0],t.slice(1)}};Object.defineProperty(Oe,Symbol.hasInstance,{value:r=>r.minimize!=null&&r.computeGradients!=null&&r.applyGradients!=null});var es=class extends Oe{static get className(){return"Adadelta"}constructor(t,e,o=null){super(),this.learningRate=t,this.rho=e,this.epsilon=o,this.accumulatedGrads=[],this.accumulatedUpdates=[],o==null&&(this.epsilon=k.backend.epsilon())}applyGradients(t){(Array.isArray(t)?t.map(o=>o.name):Object.keys(t)).forEach((o,n)=>{let s=k.registeredVariables[o],a=!1;this.accumulatedGrads[n]==null&&(this.accumulatedGrads[n]={originalName:`${o}/accum_grad`,variable:at(()=>ce(s).variable(a))}),this.accumulatedUpdates[n]==null&&(this.accumulatedUpdates[n]={originalName:`${o}/accum_var`,variable:at(()=>ce(s).variable(a))});let i=Array.isArray(t)?t[n].tensor:t[o];if(i==null)return;let l=this.accumulatedGrads[n].variable,c=this.accumulatedUpdates[n].variable;at(()=>{let u=Z(K(l,this.rho),K(ue(i),1-this.rho)),p=K(mt(ze(Z(c,this.epsilon)),ze(Z(l,this.epsilon))),i),m=Z(K(c,this.rho),K(ue(p),1-this.rho));l.assign(u),c.assign(m);let f=Z(K(p,-this.learningRate),s);s.assign(f)})}),this.incrementIterations()}dispose(){this.accumulatedUpdates!=null&&(Tt(this.accumulatedGrads.map(t=>t.variable)),Tt(this.accumulatedUpdates.map(t=>t.variable)))}async getWeights(){let t=[...this.accumulatedGrads,...this.accumulatedUpdates];return[await this.saveIterations()].concat(t.map(e=>({name:e.originalName,tensor:e.variable})))}async setWeights(t){t=await this.extractIterations(t);let e=t.length/2,o=!1;this.accumulatedGrads=t.slice(0,e).map(n=>({originalName:n.name,variable:n.tensor.variable(o)})),this.accumulatedUpdates=t.slice(e,e*2).map(n=>({originalName:n.name,variable:n.tensor.variable(o)}))}getConfig(){return{learningRate:this.learningRate,rho:this.rho,epsilon:this.epsilon}}static fromConfig(t,e){return new t(e.learningRate,e.rho,e.epsilon)}};var rs=class extends Oe{static get className(){return"Adagrad"}constructor(t,e=.1){super(),this.learningRate=t,this.initialAccumulatorValue=e,this.accumulatedGrads=[]}applyGradients(t){(Array.isArray(t)?t.map(o=>o.name):Object.keys(t)).forEach((o,n)=>{let s=k.registeredVariables[o];this.accumulatedGrads[n]==null&&(this.accumulatedGrads[n]={originalName:`${o}/accumulator`,variable:at(()=>Fr(s.shape,this.initialAccumulatorValue).variable(!1))});let a=Array.isArray(t)?t[n].tensor:t[o];if(a==null)return;let i=this.accumulatedGrads[n].variable;at(()=>{let l=Z(i,ue(a));i.assign(l);let c=Z(K(mt(a,ze(Z(l,k.backend.epsilon()))),-this.learningRate),s);s.assign(c)})}),this.incrementIterations()}dispose(){this.accumulatedGrads!=null&&Tt(this.accumulatedGrads.map(t=>t.variable))}async getWeights(){return[await this.saveIterations()].concat(this.accumulatedGrads.map(t=>({name:t.originalName,tensor:t.variable})))}async setWeights(t){t=await this.extractIterations(t);let e=!1;this.accumulatedGrads=t.map(o=>({originalName:o.name,variable:o.tensor.variable(e)}))}getConfig(){return{learningRate:this.learningRate,initialAccumulatorValue:this.initialAccumulatorValue}}static fromConfig(t,e){return new t(e.learningRate,e.initialAccumulatorValue)}};var os=class extends Oe{static get className(){return"Adam"}constructor(t,e,o,n=null){super(),this.learningRate=t,this.beta1=e,this.beta2=o,this.epsilon=n,this.accumulatedFirstMoment=[],this.accumulatedSecondMoment=[],at(()=>{this.accBeta1=it(e).variable(),this.accBeta2=it(o).variable()}),n==null&&(this.epsilon=k.backend.epsilon())}applyGradients(t){let e=Array.isArray(t)?t.map(o=>o.name):Object.keys(t);at(()=>{let o=lt(1,this.accBeta1),n=lt(1,this.accBeta2);e.forEach((s,a)=>{let i=k.registeredVariables[s],l=!1;this.accumulatedFirstMoment[a]==null&&(this.accumulatedFirstMoment[a]={originalName:`${s}/m`,variable:at(()=>ce(i).variable(l))}),this.accumulatedSecondMoment[a]==null&&(this.accumulatedSecondMoment[a]={originalName:`${s}/v`,variable:at(()=>ce(i).variable(l))});let c=Array.isArray(t)?t[a].tensor:t[s];if(c==null)return;let u=this.accumulatedFirstMoment[a].variable,p=this.accumulatedSecondMoment[a].variable,m=Z(K(u,this.beta1),K(c,1-this.beta1)),f=Z(K(p,this.beta2),K(ue(c),1-this.beta2)),d=mt(m,o),g=mt(f,n);u.assign(m),p.assign(f);let h=Z(K(mt(d,Z(ze(g),this.epsilon)),-this.learningRate),i);i.assign(h)}),this.accBeta1.assign(K(this.accBeta1,this.beta1)),this.accBeta2.assign(K(this.accBeta2,this.beta2))}),this.incrementIterations()}dispose(){this.accBeta1.dispose(),this.accBeta2.dispose(),this.accumulatedFirstMoment!=null&&Tt(this.accumulatedFirstMoment.map(t=>t.variable)),this.accumulatedSecondMoment!=null&&Tt(this.accumulatedSecondMoment.map(t=>t.variable))}async getWeights(){let t=[...this.accumulatedFirstMoment,...this.accumulatedSecondMoment];return[await this.saveIterations()].concat(t.map(e=>({name:e.originalName,tensor:e.variable})))}async setWeights(t){t=await this.extractIterations(t),at(()=>{this.accBeta1.assign(Zr(this.beta1,this.iterations_+1)),this.accBeta2.assign(Zr(this.beta2,this.iterations_+1))});let e=t.length/2,o=!1;this.accumulatedFirstMoment=t.slice(0,e).map(n=>({originalName:n.name,variable:n.tensor.variable(o)})),this.accumulatedSecondMoment=t.slice(e,e*2).map(n=>({originalName:n.name,variable:n.tensor.variable(o)}))}getConfig(){return{learningRate:this.learningRate,beta1:this.beta1,beta2:this.beta2,epsilon:this.epsilon}}static fromConfig(t,e){return new t(e.learningRate,e.beta1,e.beta2,e.epsilon)}};var ns=class extends Oe{static get className(){return"Adamax"}constructor(t,e,o,n=null,s=0){super(),this.learningRate=t,this.beta1=e,this.beta2=o,this.epsilon=n,this.decay=s,this.accumulatedFirstMoment=[],this.accumulatedWeightedInfNorm=[],at(()=>{this.iteration=it(0).variable(),this.accBeta1=it(e).variable()}),n==null&&(this.epsilon=k.backend.epsilon())}applyGradients(t){let e=Array.isArray(t)?t.map(o=>o.name):Object.keys(t);at(()=>{let o=lt(1,this.accBeta1),n=mt(-this.learningRate,Z(K(this.iteration,this.decay),1));e.forEach((s,a)=>{let i=k.registeredVariables[s],l=!1;this.accumulatedFirstMoment[a]==null&&(this.accumulatedFirstMoment[a]={originalName:`${s}/m`,variable:ce(i).variable(l)}),this.accumulatedWeightedInfNorm[a]==null&&(this.accumulatedWeightedInfNorm[a]={originalName:`${s}/v`,variable:ce(i).variable(l)});let c=Array.isArray(t)?t[a].tensor:t[s];if(c==null)return;let u=this.accumulatedFirstMoment[a].variable,p=this.accumulatedWeightedInfNorm[a].variable,m=Z(K(u,this.beta1),K(c,1-this.beta1)),f=K(p,this.beta2),d=he(c),g=Xc(f,d);u.assign(m),p.assign(g);let h=Z(K(mt(n,o),mt(m,Z(g,this.epsilon))),i);i.assign(h)}),this.iteration.assign(Z(this.iteration,1)),this.accBeta1.assign(K(this.accBeta1,this.beta1))}),this.incrementIterations()}dispose(){this.accBeta1.dispose(),this.iteration.dispose(),this.accumulatedFirstMoment!=null&&Tt(this.accumulatedFirstMoment.map(t=>t.variable)),this.accumulatedWeightedInfNorm!=null&&Tt(this.accumulatedWeightedInfNorm.map(t=>t.variable))}async getWeights(){throw new Error("getWeights() is not implemented for Adamax yet.")}async setWeights(t){throw new Error("setWeights() is not implemented for Adamax yet.")}getConfig(){return{learningRate:this.learningRate,beta1:this.beta1,beta2:this.beta2,epsilon:this.epsilon,decay:this.decay}}static fromConfig(t,e){return new t(e.learningRate,e.beta1,e.beta2,e.epsilon,e.decay)}};var no=class extends Oe{static get className(){return"SGD"}constructor(t){super(),this.learningRate=t,this.setLearningRate(t)}applyGradients(t){(Array.isArray(t)?t.map(o=>o.name):Object.keys(t)).forEach((o,n)=>{let s=Array.isArray(t)?t[n].tensor:t[o];if(s==null)return;let a=k.registeredVariables[o];at(()=>{let i=Z(K(this.c,s),a);a.assign(i)})}),this.incrementIterations()}setLearningRate(t){this.learningRate=t,this.c!=null&&this.c.dispose(),this.c=Ve(it(-t))}dispose(){this.c.dispose()}async getWeights(){return[await this.saveIterations()]}async setWeights(t){if(t=await this.extractIterations(t),t.length!==0)throw new Error("SGD optimizer does not have settable weights.")}getConfig(){return{learningRate:this.learningRate}}static fromConfig(t,e){return new t(e.learningRate)}};var ss=class extends no{static get className(){return"Momentum"}constructor(t,e,o=!1){super(t),this.learningRate=t,this.momentum=e,this.useNesterov=o,this.accumulations=[],this.m=it(this.momentum)}applyGradients(t){(Array.isArray(t)?t.map(o=>o.name):Object.keys(t)).forEach((o,n)=>{let s=k.registeredVariables[o];this.accumulations[n]==null&&(this.accumulations[n]={originalName:`${o}/momentum`,variable:at(()=>ce(s).variable(!1))});let a=this.accumulations[n].variable,i=Array.isArray(t)?t[n].tensor:t[o];i!=null&&at(()=>{let l,c=Z(K(this.m,a),i);this.useNesterov?l=Z(K(this.c,Z(i,K(c,this.m))),s):l=Z(K(this.c,c),s),a.assign(c),s.assign(l)})}),this.incrementIterations()}dispose(){this.m.dispose(),this.accumulations!=null&&Tt(this.accumulations.map(t=>t.variable))}setMomentum(t){this.momentum=t}async getWeights(){return[await this.saveIterations()].concat(this.accumulations.map(t=>({name:t.originalName,tensor:t.variable})))}async setWeights(t){t=await this.extractIterations(t);let e=!1;this.accumulations=t.map(o=>({originalName:o.name,variable:o.tensor.variable(e)}))}getConfig(){return{learningRate:this.learningRate,momentum:this.momentum,useNesterov:this.useNesterov}}static fromConfig(t,e){return new t(e.learningRate,e.momentum,e.useNesterov)}};var as=class extends Oe{static get className(){return"RMSProp"}constructor(t,e=.9,o=0,n=null,s=!1){if(super(),this.learningRate=t,this.decay=e,this.momentum=o,this.epsilon=n,this.accumulatedMeanSquares=[],this.accumulatedMoments=[],this.accumulatedMeanGrads=[],this.centered=s,n==null&&(this.epsilon=k.backend.epsilon()),t==null)throw new Error("learningRate for RMSPropOptimizer must be defined.")}applyGradients(t){(Array.isArray(t)?t.map(o=>o.name):Object.keys(t)).forEach((o,n)=>{let s=k.registeredVariables[o],a=!1;this.accumulatedMeanSquares[n]==null&&(this.accumulatedMeanSquares[n]={originalName:`${o}/rms`,variable:at(()=>ce(s).variable(a))}),this.accumulatedMoments[n]==null&&(this.accumulatedMoments[n]={originalName:`${o}/momentum`,variable:at(()=>ce(s).variable(a))}),this.accumulatedMeanGrads[n]==null&&this.centered&&(this.accumulatedMeanGrads[n]={originalName:`${o}/mg`,variable:at(()=>ce(s).variable(a))});let i=Array.isArray(t)?t[n].tensor:t[o];if(i==null)return;let l=this.accumulatedMeanSquares[n].variable,c=this.accumulatedMoments[n].variable;at(()=>{let u=Z(K(l,this.decay),K(ue(i),1-this.decay));if(this.centered){let p=this.accumulatedMeanGrads[n].variable,m=Z(K(p,this.decay),K(i,1-this.decay)),f=mt(K(i,this.learningRate),ze(lt(u,Z(ue(m),this.epsilon)))),d=Z(K(c,this.momentum),f);l.assign(u),p.assign(m),c.assign(d);let g=lt(s,d);s.assign(g)}else{let p=Z(K(l,this.decay),K(ue(i),1-this.decay)),m=Z(K(c,this.momentum),mt(K(i,this.learningRate),ze(Z(p,this.epsilon))));l.assign(p),c.assign(m);let f=lt(s,m);s.assign(f)}})}),this.incrementIterations()}dispose(){this.accumulatedMeanSquares!=null&&Tt(this.accumulatedMeanSquares.map(t=>t.variable)),this.accumulatedMeanGrads!=null&&this.centered&&Tt(this.accumulatedMeanGrads.map(t=>t.variable)),this.accumulatedMoments!=null&&Tt(this.accumulatedMoments.map(t=>t.variable))}async getWeights(){let t=[...this.accumulatedMeanSquares,...this.accumulatedMoments];return this.centered&&t.push(...this.accumulatedMeanGrads),[await this.saveIterations()].concat(t.map(e=>({name:e.originalName,tensor:e.variable})))}async setWeights(t){t=await this.extractIterations(t);let e=this.centered?t.length/3:t.length/2,o=!1;this.accumulatedMeanSquares=t.slice(0,e).map(n=>({originalName:n.name,variable:n.tensor.variable(o)})),this.accumulatedMoments=t.slice(e,e*2).map(n=>({originalName:n.name,variable:n.tensor.variable(o)})),this.centered&&(this.accumulatedMeanGrads=t.slice(e*2,e*3).map(n=>({originalName:n.name,variable:n.tensor.variable(o)})))}getConfig(){return{learningRate:this.learningRate,decay:this.decay,momentum:this.momentum,epsilon:this.epsilon,centered:this.centered}}static fromConfig(t,e){return new t(e.learningRate,e.decay,e.momentum,e.epsilon,e.centered)}};var s3=[es,rs,os,ns,ss,as,no];function hv(){for(let r of s3)lx(r)}var kl={};kt(kl,{CompositeArrayBuffer:()=>Te,browserFiles:()=>xv,browserHTTPRequest:()=>vv,concatenateArrayBuffers:()=>h0,copyModel:()=>$0,decodeWeights:()=>ap,decodeWeightsStream:()=>ip,encodeWeights:()=>p0,fromMemory:()=>Sv,fromMemorySync:()=>hx,getLoadHandlers:()=>b0,getModelArtifactsForJSON:()=>hl,getModelArtifactsForJSONSync:()=>Ud,getModelArtifactsInfoForJSON:()=>qr,getSaveHandlers:()=>y0,getWeightSpecs:()=>Ic,http:()=>Ap,isHTTPScheme:()=>Rp,listModels:()=>k0,loadWeights:()=>bv,moveModel:()=>R0,registerLoadRouter:()=>x0,registerSaveRouter:()=>g0,removeModel:()=>E0,weightsLoaderFactory:()=>fx,withSaveHandler:()=>Cv,withSaveHandlerSync:()=>Tv});var a3="model",i3=".json",l3=".weights.bin";function gv(r){return new Promise(t=>setTimeout(t)).then(r)}var Il=class r{constructor(t){if(!D().getBool("IS_BROWSER"))throw new Error("browserDownloads() cannot proceed because the current environment is not a browser.");t.startsWith(r.URL_SCHEME)&&(t=t.slice(r.URL_SCHEME.length)),(t==null||t.length===0)&&(t=a3),this.modelJsonFileName=t+i3,this.weightDataFileName=t+l3}async save(t){if(typeof document>"u")throw new Error("Browser downloads are not supported in this environment since `document` is not present");let e=Te.join(t.weightData),o=window.URL.createObjectURL(new Blob([e],{type:"application/octet-stream"}));if(t.modelTopology instanceof ArrayBuffer)throw new Error("BrowserDownloads.save() does not support saving model topology in binary formats yet.");{let n=[{paths:["./"+this.weightDataFileName],weights:t.weightSpecs}],s=lp(t,n),a=window.URL.createObjectURL(new Blob([JSON.stringify(s)],{type:"application/json"})),i=this.modelJsonAnchor==null?document.createElement("a"):this.modelJsonAnchor;if(i.download=this.modelJsonFileName,i.href=a,await gv(()=>i.dispatchEvent(new MouseEvent("click"))),t.weightData!=null){let l=this.weightDataAnchor==null?document.createElement("a"):this.weightDataAnchor;l.download=this.weightDataFileName,l.href=o,await gv(()=>l.dispatchEvent(new MouseEvent("click")))}return{modelArtifactsInfo:qr(t)}}}};Il.URL_SCHEME="downloads://";var ux=class{constructor(t){if(t==null||t.length<1)throw new Error(`When calling browserFiles, at least 1 file is required, but received ${t}`);this.jsonFile=t[0],this.weightsFiles=t.slice(1)}async load(){return new Promise((t,e)=>{let o=new FileReader;o.onload=n=>{let s=JSON.parse(n.target.result),a=s.modelTopology;if(a==null){e(new Error(`modelTopology field is missing from file ${this.jsonFile.name}`));return}if(s.weightsManifest==null){e(new Error(`weightManifest field is missing from file ${this.jsonFile.name}`));return}if(this.weightsFiles.length===0){t({modelTopology:a});return}let l=hl(s,c=>this.loadWeights(c));t(l)},o.onerror=n=>e(`Failed to read model topology and weights manifest JSON from file '${this.jsonFile.name}'. BrowserFiles supports loading Keras-style tf.Model artifacts only.`),o.readAsText(this.jsonFile)})}loadWeights(t){let e=[],o=[];for(let a of t)e.push(...a.weights),o.push(...a.paths);let n=this.checkManifestAndWeightFiles(t),s=o.map(a=>this.loadWeightsFile(a,n[a]));return Promise.all(s).then(a=>[e,a])}loadWeightsFile(t,e){return new Promise((o,n)=>{let s=new FileReader;s.onload=a=>{let i=a.target.result;o(i)},s.onerror=a=>n(`Failed to weights data from file of path '${t}'.`),s.readAsArrayBuffer(e)})}checkManifestAndWeightFiles(t){let e=[],o=this.weightsFiles.map(s=>Gd(s.name)),n={};for(let s of t)s.paths.forEach(a=>{let i=Gd(a);if(e.indexOf(i)!==-1)throw new Error(`Duplicate file basename found in weights manifest: '${i}'`);if(e.push(i),o.indexOf(i)===-1)throw new Error(`Weight file with basename '${i}' is not provided.`);n[a]=this.weightsFiles[o.indexOf(i)]});if(e.length!==this.weightsFiles.length)throw new Error(`Mismatch in the number of files in weights manifest (${e.length}) and the number of weight files provided (${this.weightsFiles.length}).`);return n}},c3=r=>D().getBool("IS_BROWSER")&&!Array.isArray(r)&&r.startsWith(Il.URL_SCHEME)?u3(r.slice(Il.URL_SCHEME.length)):null;de.registerSaveRouter(c3);function u3(r="model"){return new Il(r)}function xv(r){return new ux(r)}function px(r,t,e,o){a(r),e=e??0,o=o??1,i(e,o);let n=0,s=l=>(l.then(c=>{let u=e+ ++n/r.length*(o-e);return t(u),c}),l);function a(l){E(l!=null&&Array.isArray(l)&&l.length>0,()=>"promises must be a none empty array")}function i(l,c){E(l>=0&&l<=1,()=>`Progress fraction must be in range [0, 1], but got startFraction ${l}`),E(c>=0&&c<=1,()=>`Progress fraction must be in range [0, 1], but got endFraction ${c}`),E(c>=l,()=>`startFraction must be no more than endFraction, but got startFraction ${l} and endFraction ${c}`)}return Promise.all(r.map(s))}async function mx(r,t){t==null&&(t={});let e=t.fetchFunc==null?D().platform.fetch:t.fetchFunc,o=r.map(p=>e(p,t.requestInit,{isBinary:!0})),i=(t.onProgress==null?await Promise.all(o):await px(o,t.onProgress,0,.5)).map(p=>p.arrayBuffer());return t.onProgress==null?await Promise.all(i):await px(i,t.onProgress,.5,1)}function yv(r,t){var e;let o=t.fetchFunc==null?D().platform.fetch:t.fetchFunc,n=0,s;return(e=t.onProgress)===null||e===void 0||e.call(t,0),new ReadableStream({pull:async a=>{for(var i;n<r.length;){s||(s=(await o(r[n],t.requestInit,{isBinary:!0})).body.getReader());let{done:l,value:c}=await s.read();if(l){n++,s=void 0,(i=t.onProgress)===null||i===void 0||i.call(t,n/r.length);continue}a.enqueue(c);return}a.close()}})}async function bv(r,t="",e,o){return fx(a=>mx(a,{requestInit:o}))(r,t,e)}function fx(r){return async(t,e="",o)=>{let n=t.map(()=>!1),s={},a=o!=null?o.map(()=>!1):[],i=[];if(t.forEach((f,d)=>{let g=0;f.weights.forEach(h=>{let x="quantization"in h?h.quantization.dtype:h.dtype,b=Co[x]*bt(h.shape),C=()=>{n[d]=!0,s[d]==null&&(s[d]=[]),s[d].push({manifestEntry:h,groupOffset:g,sizeBytes:b})};o!=null?o.forEach((S,I)=>{S===h.name&&(C(),a[I]=!0)}):C(),i.push(h.name),g+=b})}),!a.every(f=>f)){let f=o.filter((d,g)=>!a[g]);throw new Error(`Could not find weights in manifest with names: ${f.join(", ")}. 
Manifest JSON has weights with names: ${i.join(", ")}.`)}let l=n.reduce((f,d,g)=>(d&&f.push(g),f),[]),c=[];l.forEach(f=>{t[f].paths.forEach(d=>{let g=e+(e.endsWith("/")?"":"/")+d;c.push(g)})});let u=await r(c),p={},m=0;return l.forEach(f=>{let d=t[f].paths.length,g=new Te(u.slice(m,m+d));s[f].forEach(x=>{let b=g.slice(x.groupOffset,x.groupOffset+x.sizeBytes),C=ap(b,[x.manifestEntry]);for(let S in C)p[S]=C[S]}),m+=d}),p}}var p3="application/octet-stream",m3="application/json",uu=class{constructor(t,e){if(this.DEFAULT_METHOD="POST",e==null&&(e={}),this.weightPathPrefix=e.weightPathPrefix,this.weightUrlConverter=e.weightUrlConverter,e.fetchFunc!=null?(E(typeof e.fetchFunc=="function",()=>"Must pass a function that matches the signature of `fetch` (see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)"),this.fetch=e.fetchFunc):this.fetch=D().platform.fetch,E(t!=null&&t.length>0,()=>"URL path for http must not be null, undefined or empty."),Array.isArray(t)&&E(t.length===2,()=>`URL paths for http must have a length of 2, (actual length is ${t.length}).`),this.path=t,e.requestInit!=null&&e.requestInit.body!=null)throw new Error("requestInit is expected to have no pre-existing body, but has one.");this.requestInit=e.requestInit||{},this.loadOptions=e}async save(t){if(t.modelTopology instanceof ArrayBuffer)throw new Error("BrowserHTTPRequest.save() does not support saving model topology in binary formats yet.");let e=Object.assign({method:this.DEFAULT_METHOD},this.requestInit);e.body=new FormData;let o=[{paths:["./model.weights.bin"],weights:t.weightSpecs}],n=lp(t,o);if(e.body.append("model.json",new Blob([JSON.stringify(n)],{type:m3}),"model.json"),t.weightData!=null){let a=Te.join(t.weightData);e.body.append("model.weights.bin",new Blob([a],{type:p3}),"model.weights.bin")}let s=await this.fetch(this.path,e);if(s.ok)return{modelArtifactsInfo:qr(t),responses:[s]};throw new Error(`BrowserHTTPRequest.save() failed due to HTTP response status ${s.status}.`)}async loadModelJSON(){let t=await this.fetch(this.path,this.requestInit);if(!t.ok)throw new Error(`Request to ${this.path} failed with status code ${t.status}. Please verify this URL points to the model JSON of the model to load.`);let e;try{e=await t.json()}catch{let a=`Failed to parse model JSON of response from ${this.path}.`;throw this.path.endsWith(".pb")?a+=" Your path contains a .pb file extension. Support for .pb models have been removed in TensorFlow.js 1.0 in favor of .json models. You can re-convert your Python TensorFlow model using the TensorFlow.js 1.0 conversion scripts or you can convert your.pb models with the 'pb2json'NPM script in the tensorflow/tfjs-converter repository.":a+=" Please make sure the server is serving valid JSON for this request.",new Error(a)}let o=e.modelTopology,n=e.weightsManifest;if(o==null&&n==null)throw new Error(`The JSON from HTTP path ${this.path} contains neither model topology or manifest for weights.`);return e}async load(){if(this.loadOptions.streamWeights)return this.loadStream();let t=await this.loadModelJSON();return hl(t,e=>this.loadWeights(e))}async loadStream(){let t=await this.loadModelJSON(),e=await this.getWeightUrls(t.weightsManifest),o=Ic(t.weightsManifest),n=()=>yv(e,this.loadOptions);return Object.assign(Object.assign({},t),{weightSpecs:o,getWeightStream:n})}async getWeightUrls(t){let e=Array.isArray(this.path)?this.path[1]:this.path,[o,n]=f3(e),s=this.weightPathPrefix||o,a=[],i=[];for(let l of t)for(let c of l.paths)this.weightUrlConverter!=null?i.push(this.weightUrlConverter(c)):a.push(s+c+n);return this.weightUrlConverter&&a.push(...await Promise.all(i)),a}async loadWeights(t){let e=await this.getWeightUrls(t),o=Ic(t),n=await mx(e,this.loadOptions);return[o,n]}};uu.URL_SCHEME_REGEX=/^https?:\/\//;function f3(r){let t=r.lastIndexOf("/"),e=r.lastIndexOf("?"),o=r.substring(0,t),n=e>t?r.substring(e):"";return[o+"/",n]}function Rp(r){return r.match(uu.URL_SCHEME_REGEX)!=null}var wv=(r,t)=>{if(typeof fetch>"u"&&(t==null||t.fetchFunc==null))return null;{let e=!0;if(Array.isArray(r)?e=r.every(o=>Rp(o)):e=Rp(r),e)return Ap(r,t)}return null};de.registerSaveRouter(wv);de.registerLoadRouter(wv);function Ap(r,t){return new uu(r,t)}function vv(r,t){return Ap(r,t)}var pu=class{constructor(t){this.modelArtifacts=t}load(){return this.modelArtifacts}},Fp=class{constructor(t){this.saveHandler=t}save(t){return this.saveHandler(t)}},dx=class{constructor(t){t.load&&(this.load=()=>Promise.resolve(t.load())),t.save&&(this.save=e=>Promise.resolve(t.save(e)))}};function Sv(r,t,e,o){let n=arguments;return new dx(hx(...n))}function hx(r,t,e,o){return arguments.length===1?r.modelTopology!=null||r.weightSpecs!=null?new pu(r):(console.warn("Please call tf.io.fromMemory() with only one argument. The argument should be of type ModelArtifacts. The multi-argument signature of tf.io.fromMemory() has been deprecated and will be removed in a future release."),new pu({modelTopology:r})):(console.warn("Please call tf.io.fromMemory() with only one argument. The argument should be of type ModelArtifacts. The multi-argument signature of tf.io.fromMemory() has been deprecated and will be removed in a future release."),new pu({modelTopology:r,weightSpecs:t,weightData:e,trainingConfig:o}))}function Cv(r){return new Fp(r)}function Tv(r){return new Fp(r)}var gx={};kt(gx,{confusionMatrix:()=>Nv});function d3(r,t,e){let o=v(r,"labels","confusionMatrix"),n=v(t,"predictions","confusionMatrix");E(e==null||e>0&&Number.isInteger(e),()=>`If provided, numClasses must be a positive integer, but got ${e}`),E(o.rank===1,()=>`Expected the rank of labels to be 1, but got ${o.rank}`),E(n.rank===1,()=>`Expected the rank of predictions to be 1, but got ${n.rank}`),E(o.shape[0]===n.shape[0],()=>`Mismatch in the number of examples: ${o.shape[0]} vs. ${n.shape[0]}. Labels and predictions should have the same number of elements.`),E(e>0&&Number.isInteger(e),()=>`numClasses is required to be a positive integer, but got ${e}`);let s=Cl(xt(o,"int32"),e),a=Cl(xt(n,"int32"),e),i=ki(s),l=Et(i,a);return xt(l,"int32")}var Nv=T({confusionMatrix_:d3});var Oo={};kt(Oo,{draw:()=>S3,fromPixels:()=>C3,fromPixelsAsync:()=>b3,toPixels:()=>v3});var Fi,Iv=!1;function kv(r,t=3){if(t>4)throw new Error("Cannot construct Tensor with more than 4 channels from pixels.");if(r==null)throw new Error("pixels passed to tf.browser.fromPixels() can not be null");let e=!1,o=!1,n=!1,s=!1,a=!1,i=!1;if(r.data instanceof Uint8Array)e=!0;else if(typeof ImageData<"u"&&r instanceof ImageData)o=!0;else if(typeof HTMLVideoElement<"u"&&r instanceof HTMLVideoElement)n=!0;else if(typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement)s=!0;else if(r.getContext!=null)a=!0;else if(typeof ImageBitmap<"u"&&r instanceof ImageBitmap)i=!0;else throw new Error(`pixels passed to tf.browser.fromPixels() must be either an HTMLVideoElement, HTMLImageElement, HTMLCanvasElement, ImageData in browser, or OffscreenCanvas, ImageData in webworker or {data: Uint32Array, width: number, height: number}, but was ${r.constructor.name}`);if(pi(il,k.backendName)!=null){let d={pixels:r},g={numChannels:t};return k.runKernel(il,d,g)}let[c,u]=n?[r.videoWidth,r.videoHeight]:[r.width,r.height],p;if(a)p=r.getContext("2d").getImageData(0,0,c,u).data;else if(o||e)p=r.data;else if(s||n||i){if(Fi==null)if(typeof document>"u")if(typeof OffscreenCanvas<"u"&&typeof OffscreenCanvasRenderingContext2D<"u")Fi=new OffscreenCanvas(1,1).getContext("2d");else throw new Error("Cannot parse input in current context. Reason: OffscreenCanvas Context2D rendering is not supported.");else Fi=document.createElement("canvas").getContext("2d",{willReadFrequently:!0});Fi.canvas.width=c,Fi.canvas.height=u,Fi.drawImage(r,0,0,c,u),p=Fi.getImageData(0,0,c,u).data}let m;if(t===4)m=new Int32Array(p);else{let d=c*u;m=new Int32Array(d*t);for(let g=0;g<d;g++)for(let h=0;h<t;++h)m[g*t+h]=p[g*4+h]}return au(m,[u,c,t],"int32")}function h3(r){return r!=null&&r.data instanceof Uint8Array}function g3(){return typeof window<"u"&&typeof ImageBitmap<"u"&&window.hasOwnProperty("createImageBitmap")}function x3(r){return r!=null&&r.width!==0&&r.height!==0}function y3(r){return g3()&&!(r instanceof ImageBitmap)&&x3(r)&&!h3(r)}async function b3(r,t=3){let e=null;if(D().getBool("WRAP_TO_IMAGEBITMAP")&&y3(r)){let o;try{o=await createImageBitmap(r,{premultiplyAlpha:"none"})}catch{o=null}o!=null&&o.width===r.width&&o.height===r.height?e=o:e=r}else e=r;return kv(e,t)}function Ev(r){if(r.rank!==2&&r.rank!==3)throw new Error(`toPixels only supports rank 2 or 3 tensors, got rank ${r.rank}.`);let t=r.rank===2?1:r.shape[2];if(t>4||t===2)throw new Error(`toPixels only supports depth of size 1, 3 or 4 but got ${t}`);if(r.dtype!=="float32"&&r.dtype!=="int32")throw new Error(`Unsupported type for toPixels: ${r.dtype}. Please use float32 or int32 tensors.`)}function w3(r){let t=r?.alpha||1;if(t>1||t<0)throw new Error(`Alpha value ${t} is suppoed to be in range [0 - 1].`)}async function v3(r,t){let e=v(r,"img","toPixels");if(!(r instanceof Nt)){let c=e;e=xt(c,"int32"),c.dispose()}Ev(e);let[o,n]=e.shape.slice(0,2),s=e.rank===2?1:e.shape[2],a=await e.data(),i=e.dtype==="float32"?255:1,l=new Uint8ClampedArray(n*o*4);for(let c=0;c<o*n;++c){let u=[0,0,0,255];for(let m=0;m<s;m++){let f=a[c*s+m];if(e.dtype==="float32"){if(f<0||f>1)throw new Error(`Tensor values for a float32 Tensor must be in the range [0 - 1] but encountered ${f}.`)}else if(e.dtype==="int32"&&(f<0||f>255))throw new Error(`Tensor values for a int32 Tensor must be in the range [0 - 255] but encountered ${f}.`);s===1?(u[0]=f*i,u[1]=f*i,u[2]=f*i):u[m]=f*i}let p=c*4;l[p+0]=Math.round(u[0]),l[p+1]=Math.round(u[1]),l[p+2]=Math.round(u[2]),l[p+3]=Math.round(u[3])}if(t!=null){Iv||pi(tl,k.backendName)!=null&&(console.warn("tf.browser.toPixels is not efficient to draw tensor on canvas. Please try tf.browser.draw instead."),Iv=!0),t.width=n,t.height=o;let c=t.getContext("2d"),u=new ImageData(l,n,o);c.putImageData(u,0,0)}return e!==r&&e.dispose(),l}function S3(r,t,e){let o=v(r,"img","draw");if(!(r instanceof Nt)){let a=o;o=xt(a,"int32"),a.dispose()}Ev(o),w3(e?.imageOptions);let n={image:o},s={canvas:t,options:e};k.runKernel(tl,n,s)}var C3=T({fromPixels_:kv});var xx={};kt(xx,{prepareAndValidate:()=>$v});function $v(r,t){let e=r.shape.length,o=t.shape.length;if(e<1)throw new Error(`tf.gatherND() expects the input to be rank 1 or higher, but the rank was ${e}.`);if(o<1)throw new Error(`tf.gatherND() expects the indices to be rank 1 or higher, but the rank was ${o}.`);if(t.dtype!=="int32")throw new Error(`tf.gatherND() expects the indices to be int32 type, but the dtype was ${t.dtype}.`);if(t.shape[o-1]>e)throw new Error(`index innermost dimension length must be <= tensor rank; saw: ${t.shape[o-1]} vs. ${e}`);if(bt(r.shape)===0)throw new Error(`Requested more than 0 entries, but input is empty. Input shape: ${r.shape}.`);let n=t.shape,s=n[n.length-1],a=1;for(let p=0;p<n.length-1;++p)a*=n[p];let i=r.shape,l=n.slice();l.pop();let c=1;for(let p=s;p<e;++p)c*=i[p],l.push(i[p]);let u=[...Ur(r.shape).map(p=>p/c),1].slice(0,s);return[l,a,c,u]}var me={};kt(me,{assertParamsValid:()=>N3,computeFlatOffset:()=>R3,computeOutShape:()=>k3,getNormalizedAxes:()=>E3,isSliceContinous:()=>$3,maskToAxes:()=>I3,parseSliceParams:()=>A3,sliceInfo:()=>F3,startForAxis:()=>Mv,startIndicesWithElidedDims:()=>Dv,stopForAxis:()=>Lv,stopIndicesWithElidedDims:()=>Ov,stridesForAxis:()=>Pv,stridesWithElidedDims:()=>Av});var yx=-2,T3=-1;function N3(r,t,e){let o=r.shape.length;E(o===t.length,()=>`Error in slice${o}D: Length of begin ${t} must match the rank of the array (${o}).`),E(o===e.length,()=>`Error in slice${o}D: Length of size ${e} must match the rank of the array (${o}).`);for(let n=0;n<o;++n)E(t[n]+e[n]<=r.shape[n],()=>`Error in slice${o}D: begin[${n}] + size[${n}] (${t[n]+e[n]}) would overflow input.shape[${n}] (${r.shape[n]})`)}function I3(r){let t=[],e=0;for(;r>0;)r&1&&t.push(e),r/=2,e++;return t}function k3(r,t,e){let o=[];for(let n=0;n<r.length;n++)o[n]=Math.ceil((t[n]-r[n])/e[n]);return o}function Av(r,t,e,o){let n=[...r];for(let s=n.length;s<o.length;s++)n.push(1);for(let s=0;s<e;s++)s===0?n[t]=1:(n.splice(t,0,1),n.pop());return n}function Fv(r,t,e){return e<=r?e:e-(t-1)}function _v(r,t){let e=[];for(let o=0;o<r;o++)e.push(t+o);return e}function E3(r,t,e,o,n,s,a,i,l){let c=r.length,u=new Array(c),p=new Array(c),m=new Array(c);if(t.length&&e>0){let f=t[0],d=e+1;u=Dv(a,f,d,o,r),p=Ov(i,f,d,n,r),m=Av(s,f,d,r)}else for(let f=0;f<c;f++)u[f]=Mv(a,o,s,r,f,l),p[f]=Lv(i,n,s,r,f,l),m[f]=Pv(s,f,l);return{begin:u,end:p,strides:m}}function Dv(r,t,e,o,n){let s=[...n],a=_v(e,t);for(let i=0;i<s.length;i++)if(a.indexOf(i)>-1)s[i]=0;else{let l=Fv(t,e,i),c=o[l];r&1<<l&&(c=0),s[i]=c}return s}function Ov(r,t,e,o,n){let s=[...n],a=_v(e,t);for(let i=0;i<s.length;i++)if(a.indexOf(i)>-1)s[i]=Number.MAX_SAFE_INTEGER;else{let l=Fv(t,e,i),c=o[l];r&1<<l&&(c=Number.MAX_SAFE_INTEGER),s[i]=c}for(let i=0;i<s.length;i++){let l=n[i];s[i]<0&&(s[i]+=l),s[i]=qi(0,s[i],n[i])}return s}function Pv(r,t,e){let o=r[t];return(e&1<<t||o==null)&&(o=1),o}function Mv(r,t,e,o,n,s){let a=t[n],i=e[n]||1;(r&1<<n||s&1<<n||a==null)&&(i>0?a=Number.MIN_SAFE_INTEGER:a=Number.MAX_SAFE_INTEGER);let l=o[n];return a<0&&(a+=l),a=qi(0,a,l-1),a}function Lv(r,t,e,o,n,s){let a=t[n],i=e[n]||1;(r&1<<n||s&1<<n||a==null)&&(i>0?a=Number.MAX_SAFE_INTEGER:a=Number.MIN_SAFE_INTEGER);let l=o[n];return a<0&&(a+=l),i>0?a=qi(0,a,l):a=qi(-1,a,l-1),a}function $3(r,t,e){let o=e.length;for(let n=0;n<e.length;n++)if(e[n]>1){o=n;break}for(let n=o+1;n<e.length;n++)if(t[n]>0||e[n]!==r[n])return!1;return!0}function R3(r,t){let e=r.length>0?r[r.length-1]:1;for(let o=0;o<r.length-1;o++)e+=r[o]*t[o];return e}function A3(r,t,e){let o,n=r.shape.length;typeof t=="number"?o=[t,...new Array(n-1).fill(0)]:t.length<n?o=t.concat(new Array(n-t.length).fill(0)):o=t.slice(),o.forEach(a=>{E(a!==-1,()=>"slice() does not support negative begin indexing.")});let s;return e==null?s=new Array(n).fill(-1):typeof e=="number"?s=[e,...new Array(n-1).fill(-1)]:e.length<n?s=e.concat(new Array(n-e.length).fill(-1)):s=e,s=s.map((a,i)=>a>=0?a:(E(a===-1,()=>`Negative size values should be exactly -1 but got ${a} for the slice() size at index ${i}.`),r.shape[i]-o[i])),[o,s]}function F3(r,t,e,o,n,s,a,i,l){let c;if(o==null?(c=new Array(t.length),c.fill(1)):c=o,a!=null&&(a&a-1)!==0)throw new Error("Multiple ellipses in slice is not allowed.");let u=!1,p={dims:c.length,numAddAxisAfterEllipsis:0,begin:t.slice(),end:e.slice(),strides:c.slice(),beginMask:n,endMask:s,ellipsisMask:a,newAxisMask:i,shrinkAxisMask:l};for(let C=0;C<p.dims;C++)u&&(1<<C&i)!==0&&p.numAddAxisAfterEllipsis++,1<<C&a&&(u=!0);u||(p.ellipsisMask|=1<<p.dims,p.dims++);let m={dims:r.length,beginMask:0,endMask:0,beginValid:!1,endValid:!1};_3(p,m);let f=!0,d=!0,g=!0,h=[],x=[];for(let C=0;C<r.length;++C){if(m.strides[C]===0)throw Error(`strides[${C}] must be non-zero`);let S=!!(m.shrinkAxisMask&1<<C),I=r[C];if(I===-1){h.push(S?1:-1);continue}let $=[m.beginMask&1<<C,m.endMask&1<<C],R=[m.strides[C]>0?0:-1,m.strides[C]>0?I:I-1];if(S&&m.strides[C]<=0)throw Error("only stride 1 allowed on non-range indexing.");g=g&&m.strides[C]===1;let A=!!(m.beginMask&1<<C&&m.endMask&1<<C);if(m.beginValid&&m.endValid){if(S){let M=m.begin[C]<0?I+m.begin[C]:m.begin[C];if(m.begin[C]=M,m.end[C]=m.begin[C]+1,M<0||M>=I)throw Error(`slice index ${m.begin[C]} of dimension ${C} out of bounds.`)}else m.begin[C]=Rv(m.begin[C],0,m.strides[C],I,$,R),m.end[C]=Rv(m.end[C],1,m.strides[C],I,$,R);let O=m.strides[C]===1&&m.begin[C]===0&&m.end[C]===I;f=f&&O,d=d&&(C===0&&m.strides[C]===1||O)}else f=f&&m.strides[C]===1&&A,d=d&&(C===0&&m.strides[C]===1||A);let F,_=!1;if(m.beginValid&&m.endValid?(F=m.end[C]-m.begin[C],_=!0):S?(F=1,_=!0):A&&I>=0&&(m.strides[C]<0?F=-I:F=I,_=!0),_){let O;F===0||F<0!=m.strides[C]<0?O=0:O=Math.trunc(F/m.strides[C])+(F%m.strides[C]!==0?1:0),h.push(O)}else h.push(-1)}for(let C=0;C<m.finalShapeGatherIndices.length;++C){let S=m.finalShapeGatherIndices[C];S>=0?x.push(h[S]):S===yx&&x.push(1)}return{finalShapeSparse:x.filter((C,S)=>m.finalShapeGatherIndices[S]!==yx),finalShape:x,isIdentity:f,sliceDim0:d,isSimpleSlice:g,begin:m.begin,end:m.end,strides:m.strides}}function _3(r,t){t.beginMask=0,t.endMask=0,t.shrinkAxisMask=0;let e=0;t.beginValid=r.begin!=null,t.endValid=r.end!=null,t.begin=new Array(t.dims),t.end=new Array(t.dims),t.strides=new Array(t.dims),t.finalShapeGatherIndices=[],t.finalShapeGatherIndicesSparse=[],t.inputShapeGatherIndicesSparse=new Array(t.dims);for(let o=0;o<r.dims;o++)if(1<<o&r.ellipsisMask){let n=Math.min(t.dims-(r.dims-o)+1+r.numAddAxisAfterEllipsis,t.dims);for(;e<n;e++)t.begin[e]=0,t.end[e]=0,t.strides[e]=1,t.beginMask|=1<<e,t.endMask|=1<<e,t.finalShapeGatherIndices.push(e),t.finalShapeGatherIndicesSparse.push(-1),t.inputShapeGatherIndicesSparse[e]=o}else if(1<<o&r.newAxisMask)t.finalShapeGatherIndices.push(yx),t.finalShapeGatherIndicesSparse.push(-1);else{if(e===t.begin.length)throw Error(`Index out of range using input dim ${e}; input has only ${t.dims} dims, ${t.begin.length}.`);r.begin!=null&&(t.begin[e]=r.begin[o]),r.end!=null&&(t.end[e]=r.end[o]),t.strides[e]=r.strides[o],r.beginMask&1<<o&&(t.beginMask|=1<<e),r.endMask&1<<o&&(t.endMask|=1<<e),r.shrinkAxisMask&1<<o?(t.finalShapeGatherIndices.push(T3),t.finalShapeGatherIndicesSparse.push(-1),t.shrinkAxisMask|=1<<e):(t.finalShapeGatherIndices.push(e),t.finalShapeGatherIndicesSparse.push(o)),t.inputShapeGatherIndicesSparse[e]=o,e++}}function Rv(r,t,e,o,n,s){if(n[t])return e>0?s[t]:s[t+1&1];{let a=r<0?o+r:r;return a<s[0]?s[0]:a>s[1]?s[1]:a}}var Bv="4.22.0";var El=class{static sgd(t){return new no(t)}static momentum(t,e,o=!1){return new ss(t,e,o)}static rmsprop(t,e=.9,o=0,n=null,s=!1){return new as(t,e,o,n,s)}static adam(t=.001,e=.9,o=.999,n=null){return new os(t,e,o,n)}static adadelta(t=.001,e=.95,o=null){return new es(t,e,o)}static adamax(t=.002,e=.9,o=.999,n=null,s=0){return new ns(t,e,o,n,s)}static adagrad(t,e=.1){return new rs(t,e)}};var D3=El;var O3=typeof requestAnimationFrame<"u"?requestAnimationFrame:typeof setImmediate<"u"?setImmediate:r=>r();function _p(){return new Promise(r=>O3(()=>r()))}var N={};kt(N,{ERF_A1:()=>Z3,ERF_A2:()=>J3,ERF_A3:()=>tM,ERF_A4:()=>eM,ERF_A5:()=>rM,ERF_P:()=>Q3,PARALLELIZE_THRESHOLD:()=>Dp,RowPartitionType:()=>so,SELU_SCALE:()=>Y3,SELU_SCALEALPHA:()=>X3,applyActivation:()=>Ri,assertAndGetBroadcastShape:()=>At,assertAxesAreInnerMostDims:()=>T_,assertParamsConsistent:()=>P3,assignToTypedArray:()=>lM,axesAreInnerMostDims:()=>Bh,calculateShapes:()=>lw,checkEinsumDimSizes:()=>dM,checkPadOnDimRoundingMode:()=>ie,combineLocations:()=>L0,combineRaggedTensorToTensorShapes:()=>L3,complexWithEvenIndex:()=>sM,complexWithOddIndex:()=>aM,computeConv2DInfo:()=>bi,computeConv3DInfo:()=>_0,computeDefaultPad:()=>uh,computeDilation2DInfo:()=>SF,computeOptimalWindowSize:()=>W3,computeOutAndReduceShapes:()=>C_,computeOutShape:()=>M3,computePool2DInfo:()=>ch,computePool3DInfo:()=>CF,convertConv2DDataFormat:()=>D0,decodeEinsumEquation:()=>mM,eitherStridesOrDilationsAreOne:()=>Ae,expandShapeToKeepDim:()=>Ro,exponent:()=>uM,exponents:()=>cM,fromStringArrayToUint8:()=>OM,fromUint8ToStringArray:()=>DM,getAxesPermutation:()=>N_,getBroadcastDims:()=>M0,getComplexWithIndex:()=>iM,getEinsumComputePath:()=>hM,getEinsumPermutation:()=>fM,getFusedBiasGradient:()=>$i,getFusedDyActivation:()=>Ei,getImageCenter:()=>G3,getInnerMostAxes:()=>k_,getPermuted:()=>H3,getRaggedRank:()=>V3,getReductionAxes:()=>fp,getReshaped:()=>U3,getReshapedPermuted:()=>K3,getRowPartitionTypesHelper:()=>B3,getSliceBeginCoords:()=>q3,getSliceSize:()=>j3,getSparseFillEmptyRowsIndicesDenseShapeMismatch:()=>bM,getSparseFillEmptyRowsNegativeIndexErrorMessage:()=>wM,getSparseFillEmptyRowsOutOfRangeIndexErrorMessage:()=>vM,getSparseReshapeEmptyTensorZeroOutputDimErrorMessage:()=>TM,getSparseReshapeInputOutputMismatchErrorMessage:()=>IM,getSparseReshapeInputOutputMultipleErrorMessage:()=>NM,getSparseReshapeMultipleNegativeOneOutputDimErrorMessage:()=>SM,getSparseReshapeNegativeOutputDimErrorMessage:()=>CM,getSparseSegmentReductionIndicesOutOfRangeErrorMessage:()=>RM,getSparseSegmentReductionNegativeSegmentIdsErrorMessage:()=>kM,getSparseSegmentReductionNonIncreasingSegmentIdsErrorMessage:()=>EM,getSparseSegmentReductionSegmentIdOutOfRangeErrorMessage:()=>$M,getUndoAxesPermutation:()=>I_,isIdentityPermutation:()=>gM,log:()=>JR,mergeRealAndImagArrays:()=>oM,prepareAndValidate:()=>$v,prepareSplitSize:()=>yM,segment_util:()=>wx,shouldFuse:()=>Ai,slice_util:()=>me,splitRealAndImagArrays:()=>nM,stridesOrDilationsArePositive:()=>Yr,tupleValuesAreOne:()=>yi,upcastType:()=>se,validateDefaultValueShape:()=>z3,validateInput:()=>Tl,validateUpdateShape:()=>Zg,warn:()=>Hr});function P3(r,t){let e=r[0].length;r.forEach((n,s)=>{E(n.length===e,()=>`Error in concat${e}D: rank of tensors[${s}] must be the same as the rank of the rest (${e})`)}),E(t>=0&&t<e,()=>`Error in concat${e}D: axis must be between 0 and ${e-1}.`);let o=r[0];r.forEach((n,s)=>{for(let a=0;a<e;a++)E(a===t||n[a]===o[a],()=>`Error in concat${e}D: Shape of tensors[${s}] (${n}) does not match the shape of the rest (${o}) along the non-concatenated axis ${s}.`)})}function M3(r,t){let e=r[0].slice();for(let o=1;o<r.length;o++)e[t]+=r[o][t];return e}var so;(function(r){r[r.FIRST_DIM_SIZE=0]="FIRST_DIM_SIZE",r[r.VALUE_ROWIDS=1]="VALUE_ROWIDS",r[r.ROW_LENGTHS=2]="ROW_LENGTHS",r[r.ROW_SPLITS=3]="ROW_SPLITS",r[r.ROW_LIMITS=4]="ROW_LIMITS",r[r.ROW_STARTS=5]="ROW_STARTS"})(so||(so={}));function L3(r,t,e){let o=new Array;if(e==null&&t==null)return o;if(t==null)for(;o.length<r+e.length;)o.push(-1);else o=t.slice();if(e==null)return o;if(r+e.length!==o.length)throw new Error(`rt input.shape and shape=${t} are incompatible: rt input.rank = ${r+e.length}, but shape.rank = ${o.length}`);for(let n=1;n<e.length;++n){let s=e[n],a=o[o.length-e.length+n],i=o[a];if(s>=0)if(i>=0){if(i!==s)throw new Error(`rt input.shape and shape=${t} are incompatible: rt input.shape[${n+r}] = ${s} but shape[${n+r}] = ${i}`)}else o[a]=s}return o}function B3(r){let t={FIRST_DIM_SIZE:so.FIRST_DIM_SIZE,VALUE_ROWIDS:so.VALUE_ROWIDS,ROW_LENGTHS:so.ROW_LENGTHS,ROW_SPLITS:so.ROW_SPLITS,ROW_LIMITS:so.ROW_LIMITS,ROW_STARTS:so.ROW_STARTS},e=[];for(let o of r)if(o in t)e.push(t[o]);else break;return e}function V3(r){return r.length===0?0:r[0]===so.FIRST_DIM_SIZE?r.length-1:r.length}function z3(r,t){if(r==null||t==null)return;let e=r.length,o=t.length;if(e>=o)throw new Error(`defaultValue.shape=${r} and ragged tensor flatValues.shape=${t}, are incompatible: defaultValue.rank = ${e} must be less than ragged tensor input flatValues.rank = ${o})`);for(let n=0;n<Math.min(e,o-1);++n){let s=r[n],a=t[n+1];if(s>=0&&a>=0&&s!==1&&s!==a)throw new Error(`defaultValue.shape=${r}, and ragged tensor input flatValues.shape=${t} are incompatible: defaultValue.shape[${n-r.length}] = ${s} but ragged tensor input.flatValues.shape[${n-r.length}] = ${a}`)}}var Dp=30;function W3(r){return r<=Dp?r:Xi(r,Math.floor(Math.sqrt(r)))}function G3(r,t,e){let o=e*(typeof r=="number"?r:r[0]),n=t*(typeof r=="number"?r:r[1]);return[o,n]}function U3(r,t,e,o=!0){let n=[];if(o)n=n.concat(t.slice(0)),n.push(r[0]/e),n=n.concat(r.slice(1));else{n=n.concat(r[0]);let s=t.length;for(let a=0;a<s;++a)n=n.concat([r[a+1]/t[a],t[a]]);n=n.concat(r.slice(s+1))}return n}function H3(r,t,e=!0){let o=[];if(e){o.push(t);for(let n=t+1;n<r;++n)n<=2*t?(o.push(n),o.push(n-(t+1))):o.push(n)}else{let n=[],s=[];for(let a=1;a<r;++a)a>=t*2+1||a%2===1?s.push(a):n.push(a);o.push(...n),o.push(0),o.push(...s)}return o}function K3(r,t,e,o=!0){let n=[];o?n.push(r[0]/e):n.push(r[0]*e);for(let s=1;s<r.length;++s)s<=t.length?o?n.push(t[s-1]*r[s]):n.push(r[s]/t[s-1]):n.push(r[s]);return n}function q3(r,t){let e=[0];for(let o=0;o<t;++o)e.push(r[o][0]);return e}function j3(r,t,e){let o=r.slice(0,1);for(let n=0;n<e;++n)o.push(r[n+1]-t[n][0]-t[n][1]);return o}var X3=1.7580993408473768,Y3=1.0507009873554805;var Q3=.3275911,Z3=.254829592,J3=-.284496736,tM=1.421413741,eM=-1.453152027,rM=1.061405429;function oM(r,t){if(r.length!==t.length)throw new Error(`Cannot merge real and imag arrays of different lengths. real:${r.length}, imag: ${t.length}.`);let e=new Float32Array(r.length*2);for(let o=0;o<e.length;o+=2)e[o]=r[o/2],e[o+1]=t[o/2];return e}function nM(r){let t=new Float32Array(r.length/2),e=new Float32Array(r.length/2);for(let o=0;o<r.length;o+=2)t[o/2]=r[o],e[o/2]=r[o+1];return{real:t,imag:e}}function sM(r){let t=Math.ceil(r.length/4),e=new Float32Array(t),o=new Float32Array(t);for(let n=0;n<r.length;n+=4)e[Math.floor(n/4)]=r[n],o[Math.floor(n/4)]=r[n+1];return{real:e,imag:o}}function aM(r){let t=Math.floor(r.length/4),e=new Float32Array(t),o=new Float32Array(t);for(let n=2;n<r.length;n+=4)e[Math.floor(n/4)]=r[n],o[Math.floor(n/4)]=r[n+1];return{real:e,imag:o}}function iM(r,t){let e=r[t*2],o=r[t*2+1];return{real:e,imag:o}}function lM(r,t,e,o){r[o*2]=t,r[o*2+1]=e}function cM(r,t){let e=new Float32Array(r/2),o=new Float32Array(r/2);for(let n=0;n<Math.ceil(r/2);n++){let s=(t?2:-2)*Math.PI*(n/r);e[n]=Math.cos(s),o[n]=Math.sin(s)}return{real:e,imag:o}}function uM(r,t,e){let o=(e?2:-2)*Math.PI*(r/t),n=Math.cos(o),s=Math.sin(o);return{real:n,imag:s}}var bx="->",pM=/->/g,Vv=",",zv="...";function mM(r,t){r=r.replace(/\s/g,"");let e=(r.length-r.replace(pM,"").length)/bx.length;if(e<1)throw new Error("Equations without an arrow are not supported.");if(e>1)throw new Error(`Equation must contain exactly one arrow ("${bx}").`);let[o,n]=r.split(bx);E(o.indexOf(zv)===-1,()=>`The ellipsis notation ("${zv}") is not supported yet.`);let s=o.split(Vv),a=s.length;if(t!==a)throw new Error(`Expected ${a} input tensors, received ${t}`);if(a>2)throw new Error("Support for more than 2 input tensors is not implemented yet.");let i=[];for(let m=0;m<n.length;++m){let f=n[m];if(!s.some(d=>d.indexOf(f)!==-1))throw new Error(`Output subscripts contain the label ${f} not present in the input subscripts.`);i.indexOf(f)===-1&&i.push(f)}for(let m=0;m<o.length;++m){let f=o[m];i.indexOf(f)===-1&&f!==Vv&&i.push(f)}let l=new Array(s.length);for(let m=0;m<a;++m){if(new Set(s[m].split("")).size!==s[m].length)throw new Error(`Found duplicate axes in input component ${s[m]}. Support for duplicate axes in input is not implemented yet.`);l[m]=[];for(let f=0;f<s[m].length;++f)l[m].push(i.indexOf(s[m][f]))}let c=i.length,u=n.length,p=[];for(let m=u;m<c;++m)p.push(m);return{allDims:i,summedDims:p,idDims:l}}function fM(r,t){let e=new Array(r);e.fill(-1);for(let n=0;n<t.length;++n)e[t[n]]=n;let o=[];for(let n=0;n<r;++n)e[n]===-1&&o.push(n);return e=e.filter(n=>n!==-1),{permutationIndices:e,expandDims:o}}function dM(r,t,e){let o=new Array(r);for(let n=0;n<e.length;++n){let s=e[n].shape;for(let a=0;a<t[n].length;++a)o[t[n][a]]===void 0?o[t[n][a]]=s[a]:E(o[t[n][a]]===s[a],()=>`Expected dimension ${o[t[n][a]]} at axis ${a} of input shaped ${JSON.stringify(s)}, but got dimension ${s[a]}`)}}function hM(r,t){let e=r,o=[],n=0;r.length===0&&e.push(-1),n=r.length+1;for(let a=0;a<n;++a)o.push([]);let s=[];for(let a=0;a<e.length;++a){let i=e[a],l=xM(t,i);for(let c of l)s.indexOf(c)===-1&&(o[a].push(c),s.push(c))}return{path:e,steps:o}}function gM(r){return r.every((t,e)=>t===e)}function xM(r,t){let e=[];for(let o=0;o<r.length;++o)(r[o].length===0||r[o].indexOf(t)!==-1||t===-1)&&e.push(o);return e}function yM(r,t,e=0){let o=[];if(typeof t=="number")E(r.shape[e]%t===0,()=>"Number of splits must evenly divide the axis."),o=new Array(t).fill(r.shape[e]/t);else{let n=t.reduce((a,i)=>(i===-1&&(a+=1),a),0);E(n<=1,()=>"There should be only one negative value in split array.");let s=t.indexOf(-1);if(s!==-1){let a=t.reduce((i,l)=>l>0?i+l:i);t[s]=r.shape[e]-a}E(r.shape[e]===t.reduce((a,i)=>a+i),()=>"The sum of sizes must match the size of the axis dimension."),o=t}return o}function bM(r){return`Received SparseTensor with denseShape[0] = 0 but
  indices.shape[0] = ${r}`}function wM(r,t){return`indices(${r}, 0) is invalid: ${t} < 0`}function vM(r,t,e){return`indices(${r}, 0) is invalid: ${t} >= ${e}`}function SM(r,t){return`only one output dimension may be -1, not both ${r} and ${t}`}function CM(r,t){return`size ${r} must be non-negative, not ${t}`}function TM(){return"reshape cannot infer the missing input size for an empty tensor unless all specified input sizes are non-zero"}function NM(r,t){let e=bt(r),o=bt(t);return`Input to reshape is a SparseTensor with ${e}
  dense values, but the requested shape requires a multiple of ${o}. inputShape=${r} outputShape= ${t}`}function IM(r,t){let e=bt(r),o=bt(t);return`Input to reshape is a tensor with ${e} dense values, but the requested shape has ${o}. inputShape=${r} outputShape=${t}`}function kM(){return"segment ids must be >= 0"}function EM(){return"segment ids are not increasing"}function $M(r,t){return`Segment id ${r} out of range [0, ${t}), possibly because segmentIds input is not sorted.`}function RM(r,t,e){return`Bad: indices[${r}] == ${t} out of range [0, ${e})`}var wx={};kt(wx,{collectGatherOpShapeInfo:()=>_M,computeOutShape:()=>FM,segOpComputeOptimalWindowSize:()=>AM});function AM(r,t){let e=!1,o;for(r<=Dp?(o=r,e=!0):o=Xi(r,Math.floor(Math.sqrt(r)));!e;)o>t||o===r?e=!0:o=Xi(r,o+1);return o}function FM(r,t,e){let o=[],n=r.length;for(let s=0;s<n;s++)s!==t?o.push(r[s]):o.push(e);return o}function _M(r,t,e,o){let n=t.shape.length,s=r.shape.length;if(o!==0&&(o<-n||o>n))throw new Error(`Expect batchDims in the range of [-${n}, ${n}], but got ${o}`);if(o<0&&(o+=n),o>s)throw new Error(`batchDims (${o}) must be less than rank(x) (
    ${s}).`);if(e<o)throw new Error(`batchDims (${o}) must be less than or equal to axis (${e}).`);for(let p=0;p<o;++p)if(r.shape[p]!==t.shape[p])throw new Error(`x.shape[${p}]: ${r.shape[p]} should be equal to indices.shape[${p}]: ${t.shape[p]}.`);let a=r.shape[e],i=[],l=1,c=1,u=1;for(let p=0;p<o;++p)i.push(r.shape[p]),l*=r.shape[p];for(let p=o;p<e;p++)i.push(r.shape[p]),c*=r.shape[p];for(let p=o;p<n;p++)i.push(t.shape[p]);for(let p=e+1;p<s;p++)i.push(r.shape[p]),u*=r.shape[p];return{batchSize:l,sliceSize:u,outerSize:c,dimSize:a,outputShape:i}}function DM(r){try{return r.map(t=>fl(t))}catch(t){throw new Error(`Failed to decode encoded string bytes into utf-8, error: ${t}`)}}function OM(r){return r.map(t=>Hn(t))}var be={};kt(be,{nonMaxSuppressionV3Impl:()=>Ip,nonMaxSuppressionV4Impl:()=>kp,nonMaxSuppressionV5Impl:()=>Ep,whereImpl:()=>vp});hv();var _i={},Pp={alpha:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1,depth:!1,stencil:!1,failIfMajorPerformanceCaveat:!0};function Wv(r,t){_i[r]=t}function lr(r,t){if(!(r in _i)||t!=null){let o=MM(r,t);if(o!==null)_i[r]=o;else return console.log("Could not get context for WebGL version",r),null}let e=_i[r];return e==null||e.isContextLost()?(delete _i[r],lr(r)):(e.disable(e.DEPTH_TEST),e.disable(e.STENCIL_TEST),e.disable(e.BLEND),e.disable(e.DITHER),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SAMPLE_COVERAGE),e.enable(e.SCISSOR_TEST),e.enable(e.CULL_FACE),e.cullFace(e.BACK),_i[r])}function PM(r){if(!D().getBool("IS_SAFARI")&&typeof OffscreenCanvas<"u"&&r===2)return new OffscreenCanvas(300,150);if(typeof document<"u")return document.createElement("canvas");throw new Error("Cannot create a canvas in this context")}function MM(r,t){if(r!==1&&r!==2)throw new Error("Cannot get WebGL rendering context, WebGL is disabled.");let e=t??PM(r);return e.addEventListener("webglcontextlost",o=>{o.preventDefault(),delete _i[r]},!1),D().getBool("SOFTWARE_WEBGL_ENABLED")&&(Pp.failIfMajorPerformanceCaveat=!1),r===1?e.getContext("webgl",Pp)||e.getContext("experimental-webgl",Pp):e.getContext("webgl2",Pp)}var is;(function(r){r[r.DENSE=0]="DENSE",r[r.SHARED_BATCH=1]="SHARED_BATCH"})(is||(is={}));var ke;(function(r){r[r.RENDER=0]="RENDER",r[r.UPLOAD=1]="UPLOAD",r[r.PIXELS=2]="PIXELS",r[r.DOWNLOAD=3]="DOWNLOAD"})(ke||(ke={}));var we;(function(r){r[r.UNPACKED_FLOAT16=0]="UNPACKED_FLOAT16",r[r.UNPACKED_FLOAT32=1]="UNPACKED_FLOAT32",r[r.PACKED_4X1_UNSIGNED_BYTE=2]="PACKED_4X1_UNSIGNED_BYTE",r[r.PACKED_2X2_FLOAT32=3]="PACKED_2X2_FLOAT32",r[r.PACKED_2X2_FLOAT16=4]="PACKED_2X2_FLOAT16"})(we||(we={}));function Di(r,t){return[t,r]}function Gv(r,t){return r*t}function mu(r){let t=y.sizeFromShape(r),e=Math.ceil(t/4);return y.sizeToSquarishShape(e)}function ao(r,t){return[Math.max(1,Math.ceil(t/2)),Math.max(1,Math.ceil(r/2))]}function Uv(r,t){let[e,o]=ao(r,t);return e*o*4}function fu(r,t){let e=r,o,n,s,a,i,l,c,u,p,m;return D().getNumber("WEBGL_VERSION")===2?(o=e.R32F,n=e.R16F,s=e.RGBA16F,a=e.RGBA32F,i=e.RED,c=4,u=1,p=e.HALF_FLOAT,m=e.FLOAT,l=e.RGBA8):(o=r.RGBA,n=r.RGBA,s=r.RGBA,a=e.RGBA,i=r.RGBA,c=4,u=4,p=t!=null?t.HALF_FLOAT_OES:null,m=r.FLOAT,l=r.RGBA),{internalFormatFloat:o,internalFormatHalfFloat:n,internalFormatPackedHalfFloat:s,internalFormatPackedFloat:a,textureFormatFloat:i,downloadTextureFormat:l,downloadUnpackNumChannels:c,defaultNumChannels:u,textureTypeHalfFloat:p,textureTypeFloat:m}}function rt(r,t){let e=t();return D().getBool("DEBUG")&&LM(r),e}function LM(r){let t=r.getError();if(t!==r.NO_ERROR)throw new Error("WebGL Error: "+zM(r,t))}var BM=596e-10,VM=65504;function Hv(r){return!!(D().getBool("WEBGL_RENDER_FLOAT32_ENABLED")||r===0||BM<Math.abs(r)&&Math.abs(r)<VM)}function zM(r,t){switch(t){case r.NO_ERROR:return"NO_ERROR";case r.INVALID_ENUM:return"INVALID_ENUM";case r.INVALID_VALUE:return"INVALID_VALUE";case r.INVALID_OPERATION:return"INVALID_OPERATION";case r.INVALID_FRAMEBUFFER_OPERATION:return"INVALID_FRAMEBUFFER_OPERATION";case r.OUT_OF_MEMORY:return"OUT_OF_MEMORY";case r.CONTEXT_LOST_WEBGL:return"CONTEXT_LOST_WEBGL";default:return`Unknown error code ${t}`}}function du(r,t){return Po(r,()=>r.getExtension(t),'Extension "'+t+'" not supported on this browser.')}function Kv(r,t){let e=Po(r,()=>r.createShader(r.VERTEX_SHADER),"Unable to create vertex WebGLShader.");if(rt(r,()=>r.shaderSource(e,t)),rt(r,()=>r.compileShader(e)),r.getShaderParameter(e,r.COMPILE_STATUS)===!1)throw console.log(r.getShaderInfoLog(e)),new Error("Failed to compile vertex shader.");return e}function qv(r,t){let e=Po(r,()=>r.createShader(r.FRAGMENT_SHADER),"Unable to create fragment WebGLShader.");if(rt(r,()=>r.shaderSource(e,t)),rt(r,()=>r.compileShader(e)),D().get("ENGINE_COMPILE_ONLY"))return e;if(r.getShaderParameter(e,r.COMPILE_STATUS)===!1)throw Nx(t,r.getShaderInfoLog(e)),new Error("Failed to compile fragment shader.");return e}var WM=/ERROR: [0-9]+:([0-9]+):/g;function Nx(r,t){let e=WM.exec(t);if(e==null){console.log(`Couldn't parse line number in error: ${t}`),console.log(r);return}let o=+e[1],n=r.split(`
`),s=n.length.toString().length+2,a=n.map((p,m)=>y.rightPad((m+1).toString(),s)+p),i=0;for(let p=0;p<a.length;p++)i=Math.max(a[p].length,i);let l=a.slice(0,o-1),c=a.slice(o-1,o),u=a.slice(o);console.log(l.join(`
`)),console.log(t.split(`
`)[0]),console.log(`%c ${y.rightPad(c[0],i)}`,"border:1px solid red; background-color:#e3d2d2; color:#a61717"),console.log(u.join(`
`))}function jv(r){return Po(r,()=>r.createProgram(),"Unable to create WebGLProgram.")}function Xv(r,t){if(rt(r,()=>r.linkProgram(t)),!D().get("ENGINE_COMPILE_ONLY")&&r.getProgramParameter(t,r.LINK_STATUS)===!1)throw console.log(r.getProgramInfoLog(t)),new Error("Failed to link vertex and fragment shaders.")}function Lp(r,t){if(rt(r,()=>r.validateProgram(t)),r.getProgramParameter(t,r.VALIDATE_STATUS)===!1)throw console.log(r.getProgramInfoLog(t)),new Error("Shader program validation failed.")}function Yv(r,t){let e=Po(r,()=>r.createBuffer(),"Unable to create WebGLBuffer");return rt(r,()=>r.bindBuffer(r.ARRAY_BUFFER,e)),rt(r,()=>r.bufferData(r.ARRAY_BUFFER,t,r.STATIC_DRAW)),e}function Qv(r,t){let e=Po(r,()=>r.createBuffer(),"Unable to create WebGLBuffer");return rt(r,()=>r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,e)),rt(r,()=>r.bufferData(r.ELEMENT_ARRAY_BUFFER,t,r.STATIC_DRAW)),e}function Zv(r){return Po(r,()=>r.createTexture(),"Unable to create WebGLTexture.")}function Jv(r,t){let e=D().getNumber("WEBGL_MAX_TEXTURE_SIZE");if(r<=0||t<=0){let o=`[${r}x${t}]`;throw new Error("Requested texture size "+o+" is invalid.")}if(r>e||t>e){let o=`[${r}x${t}]`,n=`[${e}x${e}]`;throw new Error("Requested texture size "+o+" greater than WebGL maximum on this browser / GPU "+n+".")}}function t1(r){return Po(r,()=>r.createFramebuffer(),"Unable to create WebGLFramebuffer.")}function Ix(r,t,e,o,n,s,a){let i=r.getAttribLocation(t,e);return i===-1?!1:(rt(r,()=>r.bindBuffer(r.ARRAY_BUFFER,o)),rt(r,()=>r.vertexAttribPointer(i,n,r.FLOAT,!1,s,a)),rt(r,()=>r.enableVertexAttribArray(i)),!0)}function GM(r,t,e){HM(r,e),rt(r,()=>r.activeTexture(r.TEXTURE0+e)),rt(r,()=>r.bindTexture(r.TEXTURE_2D,t))}function e1(r,t,e){return Po(r,()=>r.getUniformLocation(t,e),'uniform "'+e+'" not present in program.')}function r1(r,t,e){return r.getUniformLocation(t,e)}function o1(r,t,e,o){rt(r,()=>GM(r,t,o)),rt(r,()=>r.uniform1i(e,o))}function Bp(r,t,e){rt(r,()=>r.bindFramebuffer(r.FRAMEBUFFER,e)),rt(r,()=>r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,t,0))}function kx(r,t){rt(r,()=>r.bindFramebuffer(r.FRAMEBUFFER,t)),rt(r,()=>r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,null,0))}function hu(r){let t=r.checkFramebufferStatus(r.FRAMEBUFFER);if(t!==r.FRAMEBUFFER_COMPLETE)throw new Error("Error binding framebuffer: "+UM(r,t))}function UM(r,t){switch(t){case r.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:return"FRAMEBUFFER_INCOMPLETE_ATTACHMENT";case r.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:return"FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";case r.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:return"FRAMEBUFFER_INCOMPLETE_DIMENSIONS";case r.FRAMEBUFFER_UNSUPPORTED:return"FRAMEBUFFER_UNSUPPORTED";default:return`unknown error ${t}`}}function Po(r,t,e){let o=rt(r,()=>t());if(o==null)throw new Error(e);return o}function HM(r,t){let e=r.MAX_COMBINED_TEXTURE_IMAGE_UNITS-1,o=t+r.TEXTURE0;if(o<r.TEXTURE0||o>e){let n=`[gl.TEXTURE0, gl.TEXTURE${e}]`;throw new Error(`textureUnit must be in ${n}.`)}}function ls(r,t=2){return y.sizeFromShape(r.slice(0,r.length-t))}function cs(r){if(r.length===0)throw Error("Cannot get rows and columns of an empty shape array.");return[r.length>1?r[r.length-2]:1,r[r.length-1]]}function gu(r){let t=[1,1,1];return r.length===0||r.length===1&&r[0]===1||(t=[ls(r),...cs(r)]),t}function n1(r,t=!1){let e=D().getNumber("WEBGL_MAX_TEXTURE_SIZE"),o=D().getNumber("WEBGL_MAX_SIZE_FOR_NARROW_TEXTURE");o===1/0&&D().getBool("WEBGL_AUTO_SQUARIFY_NARROW_TEXTURE_SHAPE")&&(o=e/2),t&&(e=e*2,o=o*2,r=r.map((i,l)=>l>=r.length-2?y.nearestLargerEven(r[l]):r[l]),r.length===1&&(r=[2,r[0]])),r.length!==2&&(r=y.squeezeShape(r).newShape);let n=y.sizeFromShape(r),s=null;r.length<=1&&n<=e?s=[1,n]:r.length===2&&r[0]<=e&&r[1]<=e?s=r:r.length===3&&r[0]*r[1]<=e&&r[2]<=e?s=[r[0]*r[1],r[2]]:r.length===3&&r[0]<=e&&r[1]*r[2]<=e?s=[r[0],r[1]*r[2]]:r.length===4&&r[0]*r[1]*r[2]<=e&&r[3]<=e?s=[r[0]*r[1]*r[2],r[3]]:r.length===4&&r[0]<=e&&r[1]*r[2]*r[3]<=e&&(s=[r[0],r[1]*r[2]*r[3]]);let a=s!=null&&Math.max(...s)>o&&Math.min(...s)<=(t?2:1)&&Math.min(...s)>0;if(s==null||a)if(t){let i=ls(r),l=2,c=2;r.length&&([l,c]=cs(r)),n=i*(l/2)*(c/2),s=y.sizeToSquarishShape(n).map(u=>u*2)}else s=y.sizeToSquarishShape(n);return s}function Mp(r){return r%2===0}function Oi(r,t){if(r=r.slice(-2),t=t.slice(-2),y.arraysEqual(r,t)||!r.length||!t.length||r[0]===0||r[1]===0||t[0]===0||t[1]===0)return!0;if(r.length!==t.length){let e=r[r.length-1],o=t[t.length-1];if(e===o||Mp(e)&&Mp(o)&&(r[0]===1||t[0]===1))return!0}return r[1]===t[1]&&Mp(r[0])&&Mp(t[0])}var Sx,Cx;function s1(r){if(Sx==null){let t=lr(r);Sx=t.getParameter(t.MAX_TEXTURE_SIZE)}return Sx}function a1(r){if(Cx==null){let t=lr(r);Cx=t.getParameter(t.MAX_TEXTURE_IMAGE_UNITS)}return Math.min(16,Cx)}function i1(r){if(r===0)return 0;let t,e=lr(r);return hr(e,"EXT_disjoint_timer_query_webgl2")&&r===2?t=2:hr(e,"EXT_disjoint_timer_query")?t=1:t=0,t}function hr(r,t){return r.getExtension(t)!=null}function Ex(r){try{if(lr(r)!=null)return!0}catch(t){return console.log("Error when getting WebGL context: ",t),!1}return!1}function l1(r){if(r===0)return!1;let t=lr(r);if(r===1){if(!hr(t,"OES_texture_float"))return!1}else if(!hr(t,"EXT_color_buffer_float"))return!1;return Tx(t)}function c1(r){if(r===0)return!1;let t=lr(r);if(r===1){if(!hr(t,"OES_texture_float")||!hr(t,"WEBGL_color_buffer_float"))return!1}else{if(hr(t,"EXT_color_buffer_float"))return Tx(t);let o="EXT_color_buffer_half_float";if(hr(t,o)){let n=t.getExtension(o);return KM(t,n)}return!1}return Tx(t)}function Tx(r){let t=fu(r),e=r.createTexture();r.bindTexture(r.TEXTURE_2D,e),r.texImage2D(r.TEXTURE_2D,0,t.internalFormatFloat,1,1,0,t.textureFormatFloat,t.textureTypeFloat,null);let s=r.createFramebuffer();r.bindFramebuffer(r.FRAMEBUFFER,s),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,e,0);let a=r.checkFramebufferStatus(r.FRAMEBUFFER)===r.FRAMEBUFFER_COMPLETE;return r.bindTexture(r.TEXTURE_2D,null),r.bindFramebuffer(r.FRAMEBUFFER,null),r.deleteTexture(e),r.deleteFramebuffer(s),a}function KM(r,t){let e=fu(r,t),o=r.createTexture();r.bindTexture(r.TEXTURE_2D,o),r.texImage2D(r.TEXTURE_2D,0,e.internalFormatHalfFloat,1,1,0,e.textureFormatFloat,e.textureTypeHalfFloat,null);let a=r.createFramebuffer();r.bindFramebuffer(r.FRAMEBUFFER,a),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,o,0);let i=r.checkFramebufferStatus(r.FRAMEBUFFER)===r.FRAMEBUFFER_COMPLETE;return r.bindTexture(r.TEXTURE_2D,null),r.bindFramebuffer(r.FRAMEBUFFER,null),r.deleteTexture(o),r.deleteFramebuffer(a),i}function u1(r){return r!==2?!1:lr(r).fenceSync!=null}function io(r,t){Array.isArray(r)||(r=[r]),r.forEach(e=>{e!=null&&y.assert(e.dtype!=="complex64",()=>`${t} does not support complex64 tensors in the WebGL backend.`)})}var ct=D();ct.registerFlag("HAS_WEBGL",()=>ct.getNumber("WEBGL_VERSION")>0);ct.registerFlag("WEBGL_VERSION",()=>Ex(2)?2:Ex(1)?1:0);ct.registerFlag("WEBGL_CHECK_NUMERICAL_PROBLEMS",()=>!1);ct.registerFlag("WEBGL_BUFFER_SUPPORTED",()=>ct.get("WEBGL_VERSION")===2);ct.registerFlag("WEBGL_CPU_FORWARD",()=>!0);ct.registerFlag("WEBGL_FORCE_F16_TEXTURES",()=>!1);ct.registerFlag("WEBGL_PACK",()=>ct.getBool("HAS_WEBGL"));ct.registerFlag("WEBGL_PACK_NORMALIZATION",()=>ct.getBool("WEBGL_PACK"));ct.registerFlag("WEBGL_PACK_CLIP",()=>ct.getBool("WEBGL_PACK"));ct.registerFlag("WEBGL_PACK_DEPTHWISECONV",()=>ct.getBool("WEBGL_PACK"));ct.registerFlag("WEBGL_PACK_BINARY_OPERATIONS",()=>ct.getBool("WEBGL_PACK"));ct.registerFlag("WEBGL_PACK_UNARY_OPERATIONS",()=>ct.getBool("WEBGL_PACK"));ct.registerFlag("WEBGL_PACK_ARRAY_OPERATIONS",()=>ct.getBool("WEBGL_PACK"));ct.registerFlag("WEBGL_PACK_IMAGE_OPERATIONS",()=>ct.getBool("WEBGL_PACK"));ct.registerFlag("WEBGL_PACK_REDUCE",()=>ct.getBool("WEBGL_PACK"));ct.registerFlag("WEBGL_LAZILY_UNPACK",()=>ct.getBool("WEBGL_PACK"));ct.registerFlag("WEBGL_CONV_IM2COL",()=>ct.getBool("WEBGL_PACK"));ct.registerFlag("WEBGL_PACK_CONV2DTRANSPOSE",()=>ct.getBool("WEBGL_PACK"));ct.registerFlag("WEBGL_MAX_TEXTURE_SIZE",()=>s1(ct.getNumber("WEBGL_VERSION")));ct.registerFlag("WEBGL_MAX_TEXTURES_IN_SHADER",()=>a1(ct.getNumber("WEBGL_VERSION")));ct.registerFlag("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION",()=>{let r=ct.getNumber("WEBGL_VERSION");return r===0?0:i1(r)});ct.registerFlag("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE",()=>ct.getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")>0&&!vo.isMobile());ct.registerFlag("WEBGL_RENDER_FLOAT32_CAPABLE",()=>l1(ct.getNumber("WEBGL_VERSION")));ct.registerFlag("WEBGL_RENDER_FLOAT32_ENABLED",()=>ct.getBool("WEBGL_FORCE_F16_TEXTURES")?!1:ct.getBool("WEBGL_RENDER_FLOAT32_CAPABLE"));ct.registerFlag("WEBGL_DOWNLOAD_FLOAT_ENABLED",()=>c1(ct.getNumber("WEBGL_VERSION")));ct.registerFlag("WEBGL_FENCE_API_ENABLED",()=>u1(ct.getNumber("WEBGL_VERSION")));ct.registerFlag("WEBGL_SIZE_UPLOAD_UNIFORM",()=>ct.getBool("WEBGL_RENDER_FLOAT32_ENABLED")?4:0);ct.registerFlag("WEBGL_DELETE_TEXTURE_THRESHOLD",()=>-1,r=>{if(typeof r!="number")throw new Error(`WEBGL_DELETE_TEXTURE_THRESHOLD must be a number but got ${r}.`);if(r<0&&r!==-1)throw new Error(`WEBGL_DELETE_TEXTURE_THRESHOLD must be -1 (indicating never delete) or at least 0, but got ${r}.`)});ct.registerFlag("WEBGL_FLUSH_THRESHOLD",()=>vo.isMobile()?1:-1,r=>{if(typeof r!="number")throw new Error(`WEBGL_FLUSH_THRESHOLD must be a number but got ${r}.`);if(r<0&&r!==-1)throw new Error(`WEBGL_FLUSH_THRESHOLD must be -1 (indicating never manual flush) or at least 0, but got ${r}.`)});ct.registerFlag("CPU_HANDOFF_SIZE_THRESHOLD",()=>128);ct.registerFlag("WEBGL_USE_SHAPES_UNIFORMS",()=>!1);ct.registerFlag("TOPK_LAST_DIM_CPU_HANDOFF_SIZE_THRESHOLD",()=>1e5);ct.registerFlag("TOPK_K_CPU_HANDOFF_THRESHOLD",()=>128);ct.registerFlag("WEBGL_EXP_CONV",()=>!1);ct.registerFlag("SOFTWARE_WEBGL_ENABLED",()=>ct.getBool("IS_TEST"));ct.registerFlag("WEBGL_MAX_SIZE_FOR_NARROW_TEXTURE",()=>1/0);ct.registerFlag("WEBGL_AUTO_SQUARIFY_NARROW_TEXTURE_SHAPE",()=>!1);ct.registerFlag("WEBGL2_ISNAN_CUSTOM",()=>!1);ct.registerFlag("ENGINE_COMPILE_ONLY",()=>!1);function jt(){let r,t,e,o,n,s,a,i,l,c;return D().getNumber("WEBGL_VERSION")===2?(r="#version 300 es",t="in",e="out",o="in",n="texture",s="outputColor",a="out vec4 outputColor;",i=D().getBool("WEBGL2_ISNAN_CUSTOM")?`
      bool isnan_custom(float val) {
        uint floatToUint = floatBitsToUint(val);
        return (floatToUint & 0x7fffffffu) > 0x7f800000u;
      }

      bvec4 isnan_custom(vec4 val) {
        return bvec4(isnan_custom(val.x),
          isnan_custom(val.y), isnan_custom(val.z), isnan_custom(val.w));
      }

      #define isnan(value) isnan_custom(value)
    `:"",l="",c=`
      #define round(value) newRound(value)
      int newRound(float value) {
        return int(floor(value + 0.5));
      }

      ivec4 newRound(vec4 value) {
        return ivec4(floor(value + vec4(0.5)));
      }
    `):(r="",t="attribute",e="varying",o="varying",n="texture2D",s="gl_FragColor",a="",i=`
      #define isnan(value) isnan_custom(value)
      bool isnan_custom(float val) {
        return (val > 0. || val < 1. || val == 0.) ? false : true;
      }
      bvec4 isnan_custom(vec4 val) {
        return bvec4(isnan(val.x), isnan(val.y), isnan(val.z), isnan(val.w));
      }
    `,l=`
      uniform float INFINITY;

      bool isinf(float val) {
        return abs(val) == INFINITY;
      }
      bvec4 isinf(vec4 val) {
        return equal(abs(val), vec4(INFINITY));
      }
    `,c=`
      int round(float value) {
        return int(floor(value + 0.5));
      }

      ivec4 round(vec4 value) {
        return ivec4(floor(value + vec4(0.5)));
      }
    `),{version:r,attribute:t,varyingVs:e,varyingFs:o,texture2D:n,output:s,defineOutput:a,defineSpecialNaN:i,defineSpecialInf:l,defineRound:c}}function Pr(r,t,e="index"){let o=y.computeStrides(t);return o.map((n,s)=>{let a=`int ${r[s]} = ${e} / ${n}`,i=s===o.length-1?`int ${r[s+1]} = ${e} - ${r[s]} * ${n}`:`index -= ${r[s]} * ${n}`;return`${a}; ${i};`}).join("")}function Pi(r,t,e="index"){let o=y.computeStrides(t);return o.map((n,s)=>{let a=`int ${r[s]} = ${e} / outShapeStrides[${s}]`,i=s===o.length-1?`int ${r[s+1]} = ${e} - ${r[s]} * outShapeStrides[${s}]`:`index -= ${r[s]} * outShapeStrides[${s}]`;return`${a}; ${i};`}).join("")}function qM(r,t){let e=r.length,o=r.map(s=>`${t}[${s}]`),n=new Array(e-1);n[e-2]=o[e-1];for(let s=e-3;s>=0;--s)n[s]=`(${n[s+1]} * ${o[s+1]})`;return n}function p1(r,t,e="index"){let o=r.map((s,a)=>a),n=qM(o,t);return n.map((s,a)=>{let i=`int ${r[a]} = ${e} / ${n[a]}`,l=a===n.length-1?`int ${r[a+1]} = ${e} - ${r[a]} * ${n[a]}`:`index -= ${r[a]} * ${n[a]}`;return`${i}; ${l};`}).join("")}function $l(r){let t=y.computeStrides(r).map(e=>e.toString());return`
  int getFlatIndex(ivec3 coords) {
    return coords.x * ${t[0]} + coords.y * ${t[1]} + coords.z;
  }
`}function Rl(){return`
  int getFlatIndex(ivec3 coords) {
    return coords.x * outShapeStrides[0] + coords.y * outShapeStrides[1] + coords.z;
  }
`}var zp=`
  const float FLOAT_MAX = 1.70141184e38;
  const float FLOAT_MIN = 1.17549435e-38;

  lowp vec4 encode_float(highp float v) {
    if (isnan(v)) {
      return vec4(255, 255, 255, 255);
    }

    highp float av = abs(v);

    if(av < FLOAT_MIN) {
      return vec4(0.0, 0.0, 0.0, 0.0);
    } else if(v > FLOAT_MAX) {
      return vec4(0.0, 0.0, 128.0, 127.0) / 255.0;
    } else if(v < -FLOAT_MAX) {
      return vec4(0.0, 0.0,  128.0, 255.0) / 255.0;
    }

    highp vec4 c = vec4(0,0,0,0);

    highp float e = floor(log2(av));
    highp float m = exp2(fract(log2(av))) - 1.0;

    c[2] = floor(128.0 * m);
    m -= c[2] / 128.0;
    c[1] = floor(32768.0 * m);
    m -= c[1] / 32768.0;
    c[0] = floor(8388608.0 * m);

    highp float ebias = e + 127.0;
    c[3] = floor(ebias / 2.0);
    ebias -= c[3] * 2.0;
    c[2] += floor(ebias) * 128.0;

    c[3] += 128.0 * step(0.0, -v);

    return c / 255.0;
  }
`;var{getBroadcastDims:m1}=N;function f1(r,t,e){let o=[];if(r.forEach(f=>{let d=y.sizeFromShape(f.shapeInfo.logicalShape);if(f.shapeInfo.isUniform?o.push(`uniform float ${f.name}${d>1?`[${d}]`:""};`):(o.push(`uniform sampler2D ${f.name};`),o.push(`uniform int offset${f.name};`)),e.enableShapeUniforms){let{uniformShape:g}=Wp(e.packedInputs,f.shapeInfo.logicalShape,f.shapeInfo.texShape);switch(g.length){case 1:o.push(`uniform int ${f.name}Shape;`);break;case 2:o.push(`uniform ivec2 ${f.name}Shape;`);break;case 3:o.push(`uniform ivec3 ${f.name}Shape;`);break;case 4:o.push(`uniform ivec4 ${f.name}Shape;`);break;default:break}o.push(`uniform ivec2 ${f.name}TexShape;`)}}),e.enableShapeUniforms){switch(t.logicalShape.length){case 1:o.push("uniform int outShape;");break;case 2:o.push("uniform ivec2 outShape;"),o.push("uniform int outShapeStrides;");break;case 3:o.push("uniform ivec3 outShape;"),o.push("uniform ivec2 outShapeStrides;");break;case 4:o.push("uniform ivec4 outShape;"),o.push("uniform ivec3 outShapeStrides;");break;default:break}o.push("uniform ivec2 outTexShape;")}e.customUniforms&&e.customUniforms.forEach(f=>{o.push(`uniform ${f.type} ${f.name}${f.arrayIndex?`[${f.arrayIndex}]`:""};`)});let n=o.join(`
`),s=r.map(f=>jM(f,t,e.packedInputs,e.enableShapeUniforms)).join(`
`),a=t.texShape,i=jt(),l=QM(i),c,u,p=tL(i);return t.isPacked?(c=XM(t.logicalShape,a,e.enableShapeUniforms),u=JM(i)):(c=YM(t.logicalShape,a,e.enableShapeUniforms),u=ZM(i)),e.packedInputs&&(p+=nL),[p,l,u,n,c,s,e.userCode].join(`
`)}function Fl(r,t=!1){let e=r.shapeInfo.logicalShape;switch(e.length){case 0:return gL(r,t);case 1:return yL(r,t);case 2:return wL(r,t);case 3:return SL(r,t);case 4:return TL(r,t);case 5:return NL(r);case 6:return IL(r);default:throw new Error(`${e.length}-D input sampling is not yet supported`)}}function d1(r,t){switch(r.shapeInfo.logicalShape.length){case 0:return hL(r);case 1:return xL(r,t);case 2:return bL(r,t);case 3:return vL(r,t);default:return CL(r,t)}}function jM(r,t,e=!1,o){let n="";e?n+=d1(r,o):n+=Fl(r,o);let s=r.shapeInfo.logicalShape,a=t.logicalShape;return s.length<=a.length&&(e?n+=kL(r,t):n+=EL(r,t)),n}function XM(r,t,e){switch(r.length){case 0:return h1();case 1:return sL(r,t,e);case 2:return fL(r,t,e);case 3:return iL(r,t,e);default:return cL(r,t,e)}}function YM(r,t,e){switch(r.length){case 0:return h1();case 1:return aL(r,t,e);case 2:return dL(r,t,e);case 3:return lL(r,t,e);case 4:return uL(r,t,e);case 5:return pL(r,t);case 6:return mL(r,t);default:throw new Error(`${r.length}-D output sampling is not yet supported`)}}function QM(r){return`
    float sampleTexture(sampler2D textureSampler, vec2 uv) {
      return ${r.texture2D}(textureSampler, uv).r;
    }
  `}function ZM(r){return`
    void setOutput(float val) {
      ${r.output} = vec4(val, 0, 0, 0);
    }
  `}function JM(r){return`
    void setOutput(vec4 val) {
      ${r.output} = val;
    }
  `}function tL(r){return`${r.version}
    precision highp float;
    precision highp int;
    precision highp sampler2D;
    ${r.varyingFs} vec2 resultUV;
    ${r.defineOutput}
    const vec2 halfCR = vec2(0.5, 0.5);

    struct ivec5
    {
      int x;
      int y;
      int z;
      int w;
      int u;
    };

    struct ivec6
    {
      int x;
      int y;
      int z;
      int w;
      int u;
      int v;
    };

    uniform float NAN;
    ${r.defineSpecialNaN}
    ${r.defineSpecialInf}
    ${r.defineRound}

    int imod(int x, int y) {
      return x - y * (x / y);
    }

    int idiv(int a, int b, float sign) {
      int res = a / b;
      int mod = imod(a, b);
      if (sign < 0. && mod != 0) {
        res -= 1;
      }
      return res;
    }

    //Based on the work of Dave Hoskins
    //https://www.shadertoy.com/view/4djSRW
    #define HASHSCALE1 443.8975
    float random(float seed){
      vec2 p = resultUV * seed;
      vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
      p3 += dot(p3, p3.yzx + 19.19);
      return fract((p3.x + p3.y) * p3.z);
    }

    ${eL}
    ${rL}
    ${oL}
  `}var eL=`
vec2 uvFromFlat(int texNumR, int texNumC, int index) {
  int texR = index / texNumC;
  int texC = index - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
vec2 packedUVfrom1D(int texNumR, int texNumC, int index) {
  int texelIndex = index / 2;
  int texR = texelIndex / texNumC;
  int texC = texelIndex - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
`,rL=`
vec2 packedUVfrom2D(int texelsInLogicalRow, int texNumR,
  int texNumC, int row, int col) {
  int texelIndex = (row / 2) * texelsInLogicalRow + (col / 2);
  int texR = texelIndex / texNumC;
  int texC = texelIndex - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
`,oL=`
vec2 packedUVfrom3D(int texNumR, int texNumC,
    int texelsInBatch, int texelsInLogicalRow, int b,
    int row, int col) {
  int index = b * texelsInBatch + (row / 2) * texelsInLogicalRow + (col / 2);
  int texR = index / texNumC;
  int texC = index - texR * texNumC;
  return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
}
`,nL=`
  float getChannel(vec4 frag, vec2 innerDims) {
    vec2 modCoord = mod(innerDims, 2.);
    return modCoord.x == 0. ?
      (modCoord.y == 0. ? frag.r : frag.g) :
      (modCoord.y == 0. ? frag.b : frag.a);
  }
  float getChannel(vec4 frag, int dim) {
    float modCoord = mod(float(dim), 2.);
    return modCoord == 0. ? frag.r : frag.g;
  }
`;function h1(){return`
    int getOutputCoords() {
      return 0;
    }
  `}function sL(r,t,e){let o=[Math.ceil(t[0]/2),Math.ceil(t[1]/2)];return o[0]===1?e?`
      int getOutputCoords() {
        return 2 * int(resultUV.x * ceil(float(outTexShape[1]) / 2.0));
      }
    `:`
      int getOutputCoords() {
        return 2 * int(resultUV.x * ${o[1]}.0);
      }
    `:o[1]===1?e?`
      int getOutputCoords() {
        return 2 * int(resultUV.y * ceil(float(outTexShape[0]) / 2.0));
      }
    `:`
      int getOutputCoords() {
        return 2 * int(resultUV.y * ${o[0]}.0);
      }
    `:e?`
    int getOutputCoords() {
      ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(packedTexShape[0], packedTexShape[1]));
      return 2 * (resTexRC.x * packedTexShape[1] + resTexRC.y);
    }
  `:`
    int getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${o[0]}, ${o[1]}));
      return 2 * (resTexRC.x * ${o[1]} + resTexRC.y);
    }
  `}function aL(r,t,e){return t[0]===1?e?`
      int getOutputCoords() {
        return int(resultUV.x * float(outTexShape[1]));
      }
    `:`
      int getOutputCoords() {
        return int(resultUV.x * ${t[1]}.0);
      }
    `:t[1]===1?e?`
      int getOutputCoords() {
        return int(resultUV.y * float(outTexShape[0]));
      }
    `:`
      int getOutputCoords() {
        return int(resultUV.y * ${t[0]}.0);
      }
    `:e?`
    int getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(outTexShape[0], outTexShape[1]));
      return resTexRC.x * outTexShape[1] + resTexRC.y;
    }
  `:`
    int getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${t[0]}, ${t[1]}));
      return resTexRC.x * ${t[1]} + resTexRC.y;
    }
  `}function iL(r,t,e){if(e)return`
    ivec3 getOutputCoords() {
      ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
      int texelsInLogicalRow = int(ceil(float(outShape[2]) / 2.0));
      int texelsInBatch = texelsInLogicalRow * int(ceil(float(outShape[1]) / 2.0));
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(packedTexShape[0], packedTexShape[1]));
      int index = resTexRC.x * packedTexShape[1] + resTexRC.y;

      int b = index / texelsInBatch;
      index -= b * texelsInBatch;

      int r = 2 * (index / texelsInLogicalRow);
      int c = imod(index, texelsInLogicalRow) * 2;

      return ivec3(b, r, c);
    }
  `;let o=[Math.ceil(t[0]/2),Math.ceil(t[1]/2)],n=Math.ceil(r[2]/2),s=n*Math.ceil(r[1]/2);return`
    ivec3 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${o[0]}, ${o[1]}));
      int index = resTexRC.x * ${o[1]} + resTexRC.y;

      int b = index / ${s};
      index -= b * ${s};

      int r = 2 * (index / ${n});
      int c = imod(index, ${n}) * 2;

      return ivec3(b, r, c);
    }
  `}function lL(r,t,e){if(e)return`
  ivec3 getOutputCoords() {
    ivec2 resTexRC = ivec2(resultUV.yx *
                           vec2(outTexShape[0], outTexShape[1]));
    int index = resTexRC.x * outTexShape[1] + resTexRC.y;
    ${Pi(["r","c","d"],r)}
    return ivec3(r, c, d);
  }
`;let o=Pr(["r","c","d"],r);return`
    ivec3 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${t[0]}, ${t[1]}));
      int index = resTexRC.x * ${t[1]} + resTexRC.y;
      ${o}
      return ivec3(r, c, d);
    }
  `}function cL(r,t,e){if(e)return`
    ivec4 getOutputCoords() {
      ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(packedTexShape[0], packedTexShape[1]));
      int index = resTexRC.x * packedTexShape[1] + resTexRC.y;

      int texelsInLogicalRow = int(ceil(float(outShape[3]) / 2.0));
      int texelsInBatch = texelsInLogicalRow * int(ceil(float(outShape[2]) / 2.0));
      int texelsInBatchN = texelsInBatch * outShape[1];

      int b2 = index / texelsInBatchN;
      index -= b2 * texelsInBatchN;

      int b = index / texelsInBatch;
      index -= b * texelsInBatch;

      int r = 2 * (index / texelsInLogicalRow);
      int c = imod(index, texelsInLogicalRow) * 2;

      return ivec4(b2, b, r, c);
    }
  `;let o=[Math.ceil(t[0]/2),Math.ceil(t[1]/2)],n=Math.ceil(r[r.length-1]/2),s=n*Math.ceil(r[r.length-2]/2),a=s,i="",l="b, r, c";for(let c=2;c<r.length-1;c++)a*=r[r.length-c-1],i=`
      int b${c} = index / ${a};
      index -= b${c} * ${a};
    `+i,l=`b${c}, `+l;return`
    ivec${r.length} getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${o[0]}, ${o[1]}));
      int index = resTexRC.x * ${o[1]} + resTexRC.y;

      ${i}

      int b = index / ${s};
      index -= b * ${s};

      int r = 2 * (index / ${n});
      int c = imod(index, ${n}) * 2;

      return ivec${r.length}(${l});
    }
  `}function uL(r,t,e){if(e)return`
    ivec4 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
        vec2(outTexShape[0], outTexShape[1]));
      int index = resTexRC.x * outTexShape[1] + resTexRC.y;
      ${Pi(["r","c","d","d2"],r)}
      return ivec4(r, c, d, d2);
    }
  `;let o=Pr(["r","c","d","d2"],r);return`
    ivec4 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
        vec2(${t[0]}, ${t[1]}));
      int index = resTexRC.x * ${t[1]} + resTexRC.y;
      ${o}
      return ivec4(r, c, d, d2);
    }
  `}function pL(r,t){let e=Pr(["r","c","d","d2","d3"],r);return`
    ivec5 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx * vec2(${t[0]},
                             ${t[1]}));

      int index = resTexRC.x * ${t[1]} + resTexRC.y;

      ${e}

      ivec5 outShape = ivec5(r, c, d, d2, d3);
      return outShape;
    }
  `}function mL(r,t){let e=Pr(["r","c","d","d2","d3","d4"],r);return`
    ivec6 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
        vec2(${t[0]}, ${t[1]}));
      int index = resTexRC.x * ${t[1]} + resTexRC.y;

      ${e}

      ivec6 result = ivec6(r, c, d, d2, d3, d4);
      return result;
    }
  `}function fL(r,t,e){let o=[Math.ceil(t[0]/2),Math.ceil(t[1]/2)];if(y.arraysEqual(r,t))return e?`
      ivec2 getOutputCoords() {
        ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
        return 2 * ivec2(resultUV.yx * vec2(packedTexShape[0], packedTexShape[1]));
      }
    `:`
      ivec2 getOutputCoords() {
        return 2 * ivec2(resultUV.yx * vec2(${o[0]}, ${o[1]}));
      }
    `;let n=Math.ceil(r[1]/2);return e?`
    ivec2 getOutputCoords() {
      ivec2 packedTexShape = ivec2(ceil(float(outTexShape[0]) / 2.0), ceil(float(outTexShape[1]) / 2.0));
      int texelsInLogicalRow = int(ceil(float(outShape[1]) / 2.0));
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(packedTexShape[0], packedTexShape[1]));

      int index = resTexRC.x * packedTexShape[1] + resTexRC.y;
      int r = 2 * (index / texelsInLogicalRow);
      int c = imod(index, texelsInLogicalRow) * 2;

      return ivec2(r, c);
    }
  `:`
    ivec2 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${o[0]}, ${o[1]}));

      int index = resTexRC.x * ${o[1]} + resTexRC.y;
      int r = 2 * (index / ${n});
      int c = imod(index, ${n}) * 2;

      return ivec2(r, c);
    }
  `}function dL(r,t,e){return y.arraysEqual(r,t)?e?`
      ivec2 getOutputCoords() {
        return ivec2(resultUV.yx * vec2(outTexShape[0], outTexShape[1]));
      }
    `:`
      ivec2 getOutputCoords() {
        return ivec2(resultUV.yx * vec2(${t[0]}, ${t[1]}));
      }
    `:r[1]===1?e?`
      ivec2 getOutputCoords() {
        ivec2 resTexRC = ivec2(resultUV.yx *
                               vec2(outTexShape[0], outTexShape[1]));
        int index = resTexRC.x * outTexShape[1] + resTexRC.y;
        return ivec2(index, 0);
      }
    `:`
      ivec2 getOutputCoords() {
        ivec2 resTexRC = ivec2(resultUV.yx *
                               vec2(${t[0]}, ${t[1]}));
        int index = resTexRC.x * ${t[1]} + resTexRC.y;
        return ivec2(index, 0);
      }
    `:r[0]===1?e?`
      ivec2 getOutputCoords() {
        ivec2 resTexRC = ivec2(resultUV.yx *
                               vec2(outTexShape[0], outTexShape[1]));
        int index = resTexRC.x * outTexShape[1] + resTexRC.y;
        return ivec2(0, index);
      }
    `:`
      ivec2 getOutputCoords() {
        ivec2 resTexRC = ivec2(resultUV.yx *
                               vec2(${t[0]}, ${t[1]}));
        int index = resTexRC.x * ${t[1]} + resTexRC.y;
        return ivec2(0, index);
      }
    `:e?`
    ivec2 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(outTexShape[0], outTexShape[1]));
      int index = resTexRC.x * outTexShape[1] + resTexRC.y;
      int r = index / outShape[1];
      int c = index - r * outShape[1];
      return ivec2(r, c);
    }
  `:`
    ivec2 getOutputCoords() {
      ivec2 resTexRC = ivec2(resultUV.yx *
                             vec2(${t[0]}, ${t[1]}));
      int index = resTexRC.x * ${t[1]} + resTexRC.y;
      int r = index / ${r[1]};
      int c = index - r * ${r[1]};
      return ivec2(r, c);
    }
  `}function Mi(r){return`offset${r}`}function hL(r){let t=r.name,e="get"+t.charAt(0).toUpperCase()+t.slice(1),o=jt();return`
    vec4 ${e}() {
      return ${o.texture2D}(${t}, halfCR);
    }
  `}function gL(r,t){let e=r.name,o="get"+e.charAt(0).toUpperCase()+e.slice(1);if(r.shapeInfo.isUniform)return`float ${o}() {return ${e};}`;let[n,s]=r.shapeInfo.texShape;if(n===1&&s===1)return`
      float ${o}() {
        return sampleTexture(${e}, halfCR);
      }
    `;let a=Mi(e);if(t)return`
    float ${o}() {
      vec2 uv = uvFromFlat(${e}TexShape[0], ${e}TexShape[1], ${a});
      return sampleTexture(${e}, uv);
    }
  `;let[i,l]=r.shapeInfo.texShape;return`
    float ${o}() {
      vec2 uv = uvFromFlat(${i}, ${l}, ${a});
      return sampleTexture(${e}, uv);
    }
  `}function xL(r,t){let e=r.name,o="get"+e.charAt(0).toUpperCase()+e.slice(1),n=r.shapeInfo.texShape,s=jt();if(t)return`
    vec4 ${o}(int index) {
      ivec2 packedTexShape = ivec2(ceil(float(${e}TexShape[0]) / 2.0), ceil(float(${e}TexShape[1]) / 2.0));
      vec2 uv = packedUVfrom1D(
        packedTexShape[0], packedTexShape[1], index);
      return ${s.texture2D}(${e}, uv);
    }
  `;let a=[Math.ceil(n[0]/2),Math.ceil(n[1]/2)];return`
    vec4 ${o}(int index) {
      vec2 uv = packedUVfrom1D(
        ${a[0]}, ${a[1]}, index);
      return ${s.texture2D}(${e}, uv);
    }
  `}function yL(r,t){let e=r.name,o="get"+e.charAt(0).toUpperCase()+e.slice(1);if(r.shapeInfo.isUniform)return`
      float ${o}(int index) {
        ${_l(r)}
      }
    `;let n=r.shapeInfo.texShape,s=n[0],a=n[1];if(a===1&&s===1)return`
      float ${o}(int index) {
        return sampleTexture(${e}, halfCR);
      }
    `;let i=Mi(e);return a===1?t?`
      float ${o}(int index) {
        vec2 uv = vec2(0.5, (float(index + ${i}) + 0.5) / float(${e}TexShape[0]));
        return sampleTexture(${e}, uv);
      }
    `:`
      float ${o}(int index) {
        vec2 uv = vec2(0.5, (float(index + ${i}) + 0.5) / ${s}.0);
        return sampleTexture(${e}, uv);
      }
    `:s===1?t?`
      float ${o}(int index) {
        vec2 uv = vec2((float(index + ${i}) + 0.5) / float(${e}TexShape[1]), 0.5);
        return sampleTexture(${e}, uv);
      }
    `:`
      float ${o}(int index) {
        vec2 uv = vec2((float(index + ${i}) + 0.5) / ${a}.0, 0.5);
        return sampleTexture(${e}, uv);
      }
    `:t?`
    float ${o}(int index) {
      vec2 uv = uvFromFlat(${e}TexShape[0], ${e}TexShape[1], index + ${i});
      return sampleTexture(${e}, uv);
    }
  `:`
    float ${o}(int index) {
      vec2 uv = uvFromFlat(${s}, ${a}, index + ${i});
      return sampleTexture(${e}, uv);
    }
  `}function bL(r,t){let e=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=r.shapeInfo.texShape,a=s[0],i=s[1],l=jt();if(s!=null&&y.arraysEqual(e,s))return t?`
      vec4 ${n}(int row, int col) {
        vec2 uv = (vec2(col, row) + halfCR) / vec2(${o}TexShape[1], ${o}TexShape[0]);

        return ${l.texture2D}(${o}, uv);
      }
    `:`
      vec4 ${n}(int row, int col) {
        vec2 uv = (vec2(col, row) + halfCR) / vec2(${i}.0, ${a}.0);

        return ${l.texture2D}(${o}, uv);
      }
    `;if(t)return`
    vec4 ${n}(int row, int col) {
      ivec2 packedTexShape = ivec2(ceil(float(${o}TexShape[0]) / 2.0), ceil(float(${o}TexShape[1]) / 2.0));
      int valuesPerRow = int(ceil(float(${o}Shape[1]) / 2.0));
      vec2 uv = packedUVfrom2D(valuesPerRow, packedTexShape[0], packedTexShape[1], row, col);
      return ${l.texture2D}(${o}, uv);
    }
  `;let c=[Math.ceil(s[0]/2),Math.ceil(s[1]/2)],u=Math.ceil(e[1]/2);return`
    vec4 ${n}(int row, int col) {
      vec2 uv = packedUVfrom2D(${u}, ${c[0]}, ${c[1]}, row, col);
      return ${l.texture2D}(${o}, uv);
    }
  `}function wL(r,t){let e=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=r.shapeInfo.texShape;if(s!=null&&y.arraysEqual(e,s)){if(t)return`
      float ${n}(int row, int col) {
        vec2 uv = (vec2(col, row) + halfCR) / vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `;let m=s[0],f=s[1];return`
    float ${n}(int row, int col) {
      vec2 uv = (vec2(col, row) + halfCR) / vec2(${f}.0, ${m}.0);
      return sampleTexture(${o}, uv);
    }
  `}let{newShape:a,keptDims:i}=y.squeezeShape(e),l=a;if(l.length<e.length){let m=Dl(r,l),f=["row","col"];return`
      ${Fl(m,t)}
      float ${n}(int row, int col) {
        return ${n}(${Ol(f,i)});
      }
    `}if(r.shapeInfo.isUniform)return`
      float ${n}(int row, int col) {
        int index = round(dot(vec2(row, col), vec2(${e[1]}, 1)));
        ${_l(r)}
      }
    `;let c=s[0],u=s[1],p=Mi(o);return u===1?t?`
      float ${n}(int row, int col) {
        float index = dot(vec3(row, col, ${p}), vec3(${o}Shape[1], 1, 1));
        vec2 uv = vec2(0.5, (index + 0.5) / float(${o}TexShape[0]));
        return sampleTexture(${o}, uv);
      }
    `:`
    float ${n}(int row, int col) {
      float index = dot(vec3(row, col, ${p}), vec3(${e[1]}, 1, 1));
      vec2 uv = vec2(0.5, (index + 0.5) / ${c}.0);
      return sampleTexture(${o}, uv);
    }
  `:c===1?t?`
      float ${n}(int row, int col) {
        float index = dot(vec3(row, col, ${p}), vec3(${o}Shape[1], 1, 1));
        vec2 uv = vec2((index + 0.5) / float(${o}TexShape[1]), 0.5);
        return sampleTexture(${o}, uv);
      }
    `:`
    float ${n}(int row, int col) {
      float index = dot(vec3(row, col, ${p}), vec3(${e[1]}, 1, 1));
      vec2 uv = vec2((index + 0.5) / ${u}.0, 0.5);
      return sampleTexture(${o}, uv);
    }
  `:t?`
      float ${n}(int row, int col) {
        // Explicitly use integer operations as dot() only works on floats.
        int index = row * ${o}Shape[1] + col + ${p};
        vec2 uv = uvFromFlat(${o}TexShape[0], ${o}TexShape[1], index);
        return sampleTexture(${o}, uv);
      }
    `:`
  float ${n}(int row, int col) {
    // Explicitly use integer operations as dot() only works on floats.
    int index = row * ${e[1]} + col + ${p};
    vec2 uv = uvFromFlat(${c}, ${u}, index);
    return sampleTexture(${o}, uv);
  }
`}function vL(r,t){let e=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=r.shapeInfo.texShape,a=[Math.ceil(s[0]/2),Math.ceil(s[1]/2)];if(e[0]===1){let m=e.slice(1),f=[1,2],d=Dl(r,m),g=["b","row","col"];return`
        ${d1(d,t)}
        vec4 ${n}(int b, int row, int col) {
          return ${n}(${Ol(g,f)});
        }
      `}let i=jt();if(t)return`
    vec4 ${n}(int b, int row, int col) {
      ivec2 packedTexShape = ivec2(ceil(float(${o}TexShape[0]) / 2.0), ceil(float(${o}TexShape[1]) / 2.0));
      int valuesPerRow = int(ceil(float(${o}Shape[2]) / 2.0));
      int texelsInBatch = valuesPerRow * int(ceil(float(${o}Shape[1]) / 2.0));
      vec2 uv = packedUVfrom3D(
        packedTexShape[0], packedTexShape[1], texelsInBatch, valuesPerRow, b, row, col);
      return ${i.texture2D}(${o}, uv);
    }
  `;let l=a[0],c=a[1],u=Math.ceil(e[2]/2),p=u*Math.ceil(e[1]/2);return`
    vec4 ${n}(int b, int row, int col) {
      vec2 uv = packedUVfrom3D(
        ${l}, ${c}, ${p}, ${u}, b, row, col);
      return ${i.texture2D}(${o}, uv);
    }
  `}function SL(r,t){let e=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=e[1]*e[2],a=e[2],{newShape:i,keptDims:l}=y.squeezeShape(e),c=i;if(c.length<e.length){let g=Dl(r,c),h=["row","col","depth"];return`
        ${Fl(g,t)}
        float ${n}(int row, int col, int depth) {
          return ${n}(${Ol(h,l)});
        }
      `}if(r.shapeInfo.isUniform)return`
      float ${n}(int row, int col, int depth) {
        int index = round(dot(vec3(row, col, depth),
                          vec3(${s}, ${a}, 1)));
        ${_l(r)}
      }
    `;let u=r.shapeInfo.texShape,p=u[0],m=u[1],f=r.shapeInfo.flatOffset;if(m===s&&f==null)return t?`
      float ${n}(int row, int col, int depth) {
        int stride1 = ${o}Shape[2];
        float texR = float(row);
        float texC = dot(vec2(col, depth), vec2(stride1, 1));
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `:`
        float ${n}(int row, int col, int depth) {
          float texR = float(row);
          float texC = dot(vec2(col, depth), vec2(${a}, 1));
          vec2 uv = (vec2(texC, texR) + halfCR) /
                     vec2(${m}.0, ${p}.0);
          return sampleTexture(${o}, uv);
        }
      `;if(m===a&&f==null)return t?`
      float ${n}(int row, int col, int depth) {
        float texR = dot(vec2(row, col), vec2(${o}Shape[1], 1));
        float texC = float(depth);
        vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `:`
    float ${n}(int row, int col, int depth) {
      float texR = dot(vec2(row, col), vec2(${e[1]}, 1));
      float texC = float(depth);
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${m}.0, ${p}.0);
      return sampleTexture(${o}, uv);
    }
  `;let d=Mi(o);return t?`
    float ${n}(int row, int col, int depth) {
      // Explicitly use integer operations as dot() only works on floats.
      int stride0 = ${o}Shape[1] * ${o}Shape[2];
      int stride1 = ${o}Shape[2];
      int index = row * stride0 + col * stride1 + depth + ${d};
      vec2 uv = uvFromFlat(${o}TexShape[0], ${o}TexShape[1], index);
      return sampleTexture(${o}, uv);
    }
    `:`
      float ${n}(int row, int col, int depth) {
        // Explicitly use integer operations as dot() only works on floats.
        int index = row * ${s} + col * ${a} + depth + ${d};
        vec2 uv = uvFromFlat(${p}, ${m}, index);
        return sampleTexture(${o}, uv);
      }
  `}function CL(r,t){let e=r.name,o="get"+e.charAt(0).toUpperCase()+e.slice(1),n=jt();if(t)return`
    vec4 ${o}(int b2, int b, int row, int col) {
      int valuesPerRow = int(ceil(float(${e}Shape[3]) / 2.0));
      int texelsInBatch = valuesPerRow * int(ceil(float(${e}Shape[2]) / 2.0));
      int index = b * texelsInBatch + (row / 2) * valuesPerRow + (col / 2);
      texelsInBatch *= ${e}Shape[1];
      index = b2 * texelsInBatch + index;
      ivec2 packedTexShape = ivec2(ceil(float(${e}TexShape[0]) / 2.0), ceil(float(${e}TexShape[1]) / 2.0));
      int texR = index / packedTexShape[1];
      int texC = index - texR * packedTexShape[1];
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(packedTexShape[1], packedTexShape[0]); return ${n.texture2D}(${e}, uv);
    }
  `;let s=r.shapeInfo.logicalShape,a=s.length,i=r.shapeInfo.texShape,l=[Math.ceil(i[0]/2),Math.ceil(i[1]/2)],c=l[0],u=l[1],p=Math.ceil(s[a-1]/2),m=p*Math.ceil(s[a-2]/2),f="int b, int row, int col",d=`b * ${m} + (row / 2) * ${p} + (col / 2)`;for(let g=2;g<a-1;g++)f=`int b${g}, `+f,m*=s[a-g-1],d=`b${g} * ${m} + `+d;return`
    vec4 ${o}(${f}) {
      int index = ${d};
      int texR = index / ${u};
      int texC = index - texR * ${u};
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${u}, ${c});
      return ${n.texture2D}(${e}, uv);
    }
  `}function TL(r,t){let e=r.shapeInfo.logicalShape,o=r.name,n="get"+o.charAt(0).toUpperCase()+o.slice(1),s=e[3],a=e[2]*s,i=e[1]*a,{newShape:l,keptDims:c}=y.squeezeShape(e);if(l.length<e.length){let b=Dl(r,l),C=["row","col","depth","depth2"];return`
      ${Fl(b,t)}
      float ${n}(int row, int col, int depth, int depth2) {
        return ${n}(${Ol(C,c)});
      }
    `}if(r.shapeInfo.isUniform)return`
      float ${n}(int row, int col, int depth, int depth2) {
        int index = round(dot(vec4(row, col, depth, depth2),
                          vec4(${i}, ${a}, ${s}, 1)));
        ${_l(r)}
      }
    `;let u=r.shapeInfo.flatOffset,p=r.shapeInfo.texShape,m=p[0],f=p[1],d=`int stride2 = ${o}Shape[3];`,g=`int stride1 = ${o}Shape[2] * stride2;`,h=`int stride0 = ${o}Shape[1] * stride1;`;if(f===i&&u==null)return t?`
      float ${n}(int row, int col, int depth, int depth2) {
        ${d}
        ${g}
        float texR = float(row);
        float texC =
            dot(vec3(col, depth, depth2),
                vec3(stride1, stride2, 1));
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `:`
      float ${n}(int row, int col, int depth, int depth2) {
        float texR = float(row);
        float texC =
            dot(vec3(col, depth, depth2),
                vec3(${a}, ${s}, 1));
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${f}.0, ${m}.0);
        return sampleTexture(${o}, uv);
      }
    `;if(f===s&&u==null)return t?`
      float ${n}(int row, int col, int depth, int depth2) {
        float texR = dot(vec3(row, col, depth),
                         vec3(${o}Shape[1] * ${o}Shape[2], ${o}Shape[2], 1));
        float texC = float(depth2);
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(${o}TexShape[1], ${o}TexShape[0]);
        return sampleTexture(${o}, uv);
      }
    `:`
      float ${n}(int row, int col, int depth, int depth2) {
        float texR = dot(vec3(row, col, depth),
                         vec3(${e[1]*e[2]}, ${e[2]}, 1));
        float texC = float(depth2);
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(${f}.0, ${m}.0);
        return sampleTexture(${o}, uv);
      }
    `;let x=Mi(o);return t?`
    float ${n}(int row, int col, int depth, int depth2) {
      // Explicitly use integer operations as dot() only works on floats.
      ${d}
      ${g}
      ${h}
      int index = row * stride0 + col * stride1 +
          depth * stride2 + depth2;
      vec2 uv = uvFromFlat(${o}TexShape[0], ${o}TexShape[1], index + ${x});
      return sampleTexture(${o}, uv);
    }
  `:`
    float ${n}(int row, int col, int depth, int depth2) {
      // Explicitly use integer operations as dot() only works on floats.
      int index = row * ${i} + col * ${a} +
          depth * ${s} + depth2;
      vec2 uv = uvFromFlat(${m}, ${f}, index + ${x});
      return sampleTexture(${o}, uv);
    }
  `}function NL(r){let t=r.shapeInfo.logicalShape,e=r.name,o="get"+e.charAt(0).toUpperCase()+e.slice(1),n=t[4],s=t[3]*n,a=t[2]*s,i=t[1]*a,{newShape:l,keptDims:c}=y.squeezeShape(t);if(l.length<t.length){let g=Dl(r,l),h=["row","col","depth","depth2","depth3"];return`
      ${Fl(g)}
      float ${o}(int row, int col, int depth, int depth2, int depth3) {
        return ${o}(${Ol(h,c)});
      }
    `}if(r.shapeInfo.isUniform)return`
      float ${o}(int row, int col, int depth, int depth2, int depth3) {
        float index = dot(
          vec4(row, col, depth, depth2),
          vec4(${i}, ${a}, ${s}, ${n})) +
          depth3;
        ${_l(r)}
      }
    `;let u=r.shapeInfo.flatOffset,p=r.shapeInfo.texShape,m=p[0],f=p[1];if(f===i&&u==null)return`
      float ${o}(int row, int col, int depth, int depth2, int depth3) {
        int texR = row;
        float texC = dot(vec4(col, depth, depth2, depth3),
                         vec4(${a}, ${s}, ${n}, 1));
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${f}.0, ${m}.0);
        return sampleTexture(${e}, uv);
      }
    `;if(f===n&&u==null)return`
      float ${o}(int row, int col, int depth, int depth2, int depth3) {
        float texR = dot(
          vec4(row, col, depth, depth2),
          vec4(${t[1]*t[2]*t[3]},
               ${t[2]*t[3]}, ${t[3]}, 1));
        int texC = depth3;
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(${f}.0, ${m}.0);
        return sampleTexture(${e}, uv);
      }
    `;let d=Mi(e);return`
    float ${o}(int row, int col, int depth, int depth2, int depth3) {
      // Explicitly use integer operations as dot() only works on floats.
      int index = row * ${i} + col * ${a} + depth * ${s} +
          depth2 * ${n} + depth3 + ${d};
      vec2 uv = uvFromFlat(${m}, ${f}, index);
      return sampleTexture(${e}, uv);
    }
  `}function IL(r){let t=r.shapeInfo.logicalShape,e=r.name,o="get"+e.charAt(0).toUpperCase()+e.slice(1),{newShape:n,keptDims:s}=y.squeezeShape(t);if(n.length<t.length){let h=Dl(r,n),x=["row","col","depth","depth2","depth3","depth4"];return`
      ${Fl(h)}
      float ${o}(int row, int col, int depth,
                    int depth2, int depth3, int depth4) {
        return ${o}(${Ol(x,s)});
      }
    `}let a=t[5],i=t[4]*a,l=t[3]*i,c=t[2]*l,u=t[1]*c;if(r.shapeInfo.isUniform)return`
      float ${o}(int row, int col, int depth,
                  int depth2, int depth3, int depth4) {
        int index = round(dot(
          vec4(row, col, depth, depth2),
          vec4(${u}, ${c}, ${l}, ${i})) +
          dot(
            vec2(depth3, depth4),
            vec2(${a}, 1)));
        ${_l(r)}
      }
    `;let p=r.shapeInfo.flatOffset,m=r.shapeInfo.texShape,f=m[0],d=m[1];if(d===u&&p==null)return`
      float ${o}(int row, int col, int depth,
                    int depth2, int depth3, int depth4) {
        int texR = row;
        float texC = dot(vec4(col, depth, depth2, depth3),
          vec4(${c}, ${l}, ${i}, ${a})) +
               float(depth4);
        vec2 uv = (vec2(texC, texR) + halfCR) /
                   vec2(${d}.0, ${f}.0);
        return sampleTexture(${e}, uv);
      }
    `;if(d===a&&p==null)return`
      float ${o}(int row, int col, int depth,
                    int depth2, int depth3, int depth4) {
        float texR = dot(vec4(row, col, depth, depth2),
          vec4(${t[1]*t[2]*t[3]*t[4]},
               ${t[2]*t[3]*t[4]},
               ${t[3]*t[4]},
               ${t[4]})) + float(depth3);
        int texC = depth4;
        vec2 uv = (vec2(texC, texR) + halfCR) /
                  vec2(${d}.0, ${f}.0);
        return sampleTexture(${e}, uv);
      }
    `;let g=Mi(e);return`
    float ${o}(int row, int col, int depth,
                  int depth2, int depth3, int depth4) {
      // Explicitly use integer operations as dot() only works on floats.
      int index = row * ${u} + col * ${c} + depth * ${l} +
          depth2 * ${i} + depth3 * ${a} + depth4 + ${g};
      vec2 uv = uvFromFlat(${f}, ${d}, index);
      return sampleTexture(${e}, uv);
    }
  `}function _l(r){let t=r.name,e=y.sizeFromShape(r.shapeInfo.logicalShape);return e<2?`return ${t};`:`
    for (int i = 0; i < ${e}; i++) {
      if (i == index) {
        return ${t}[i];
      }
    }
  `}function kL(r,t){let e=r.name,o=e.charAt(0).toUpperCase()+e.slice(1),n="get"+o+"AtOutCoords",s=r.shapeInfo.logicalShape.length,a=t.logicalShape.length,i=m1(r.shapeInfo.logicalShape,t.logicalShape),l=ht(a),c=a-s,u,p=["x","y","z","w","u","v"];s===0?u="":a<2&&i.length>=1?u="coords = 0;":u=i.map(b=>`coords.${p[b+c]} = 0;`).join(`
`);let m="";a<2&&s>0?m="coords":m=r.shapeInfo.logicalShape.map((b,C)=>`coords.${p[C+c]}`).join(", ");let f="return outputValue;",g=y.sizeFromShape(r.shapeInfo.logicalShape)===1,x=y.sizeFromShape(t.logicalShape)===1;if(s===1&&!g&&!x)f=`
      return vec4(outputValue.xy, outputValue.xy);
    `;else if(g&&!x)a===1?f=`
        return vec4(outputValue.x, outputValue.x, 0., 0.);
      `:f=`
        return vec4(outputValue.x);
      `;else if(i.length){let b=s-2,C=s-1;i.indexOf(b)>-1&&i.indexOf(C)>-1?f="return vec4(outputValue.x);":i.indexOf(b)>-1?f="return vec4(outputValue.x, outputValue.y, outputValue.x, outputValue.y);":i.indexOf(C)>-1&&(f="return vec4(outputValue.xx, outputValue.zz);")}return`
    vec4 ${n}() {
      ${l} coords = getOutputCoords();
      ${u}
      vec4 outputValue = get${o}(${m});
      ${f}
    }
  `}function EL(r,t){let e=r.name,o=e.charAt(0).toUpperCase()+e.slice(1),n="get"+o+"AtOutCoords",s=t.texShape,a=r.shapeInfo.texShape,i=r.shapeInfo.logicalShape.length,l=t.logicalShape.length;if(!r.shapeInfo.isUniform&&i===l&&r.shapeInfo.flatOffset==null&&y.arraysEqual(a,s))return`
      float ${n}() {
        return sampleTexture(${e}, resultUV);
      }
    `;let c=ht(l),u=m1(r.shapeInfo.logicalShape,t.logicalShape),p=l-i,m,f=["x","y","z","w","u","v"];i===0?m="":l<2&&u.length>=1?m="coords = 0;":m=u.map(g=>`coords.${f[g+p]} = 0;`).join(`
`);let d="";return l<2&&i>0?d="coords":d=r.shapeInfo.logicalShape.map((g,h)=>`coords.${f[h+p]}`).join(", "),`
    float ${n}() {
      ${c} coords = getOutputCoords();
      ${m}
      return get${o}(${d});
    }
  `}function ht(r){if(r<=1)return"int";if(r===2)return"ivec2";if(r===3)return"ivec3";if(r===4)return"ivec4";if(r===5)return"ivec5";if(r===6)return"ivec6";throw Error(`GPU for rank ${r} is not yet supported`)}function Wp(r,t,e){let{newShape:o,keptDims:n}=y.squeezeShape(t),s=t.length,a=r&&s===3&&t[0]===1,i=a?t.slice(1):o,l=!r&&s>1&&!y.arraysEqual(t,e)&&o.length<s||a;return{useSqueezeShape:l,uniformShape:l?i:t,keptDims:n}}function Dl(r,t){let e=JSON.parse(JSON.stringify(r));return e.shapeInfo.logicalShape=t,e}function Ol(r,t){return t.map(e=>r[e]).join(", ")}function x1(r,t,e,o){let n=e.map((u,p)=>{let m={logicalShape:u.shape,texShape:u.isUniform?null:u.texData.texShape,isUniform:u.isUniform,isPacked:u.isUniform?!1:u.texData.isPacked,flatOffset:null};return u.texData!=null&&u.texData.slice!=null&&u.texData.slice.flatOffset>0&&(m.flatOffset=u.texData.slice.flatOffset),{name:t.variableNames[p],shapeInfo:m}}),s=n.map(u=>u.shapeInfo),a={logicalShape:o.shape,texShape:o.texData.texShape,isUniform:!1,isPacked:o.texData.isPacked,flatOffset:null},i=f1(n,a,t),l=qv(r.gl,i),c=r.createProgram(l);return D().get("ENGINE_COMPILE_ONLY")?{program:t,fragmentShader:l,source:i,webGLProgram:c,inShapeInfos:s,outShapeInfo:a,variablesLocations:null,customUniformLocations:null,infLoc:null,nanLoc:null,outShapeLocation:null,outShapeStridesLocation:null,outTexShapeLocation:null}:(r.buildVao(c),Object.assign({program:t,fragmentShader:l,source:i,webGLProgram:c,inShapeInfos:s,outShapeInfo:a},$x(r,t,c)))}function $x(r,t,e){let o=[],n=[],s,a,i,l=null,c=null;c=r.getUniformLocation(e,"NAN",!1),D().getNumber("WEBGL_VERSION")===1&&(l=r.getUniformLocation(e,"INFINITY",!1));let u=!1;for(let p of t.variableNames){let m={name:p,uniform:r.getUniformLocation(e,p,u),offset:r.getUniformLocation(e,`offset${p}`,u)};t.enableShapeUniforms&&(m.shape=r.getUniformLocation(e,`${p}Shape`,u),m.texShape=r.getUniformLocation(e,`${p}TexShape`,u)),o.push(m)}if(t.enableShapeUniforms&&(s=r.getUniformLocation(e,"outShape",u),i=r.getUniformLocation(e,"outShapeStrides",u),a=r.getUniformLocation(e,"outTexShape",u)),t.customUniforms)for(let p of t.customUniforms)n.push(r.getUniformLocation(e,p.name,u));return{variablesLocations:o,customUniformLocations:n,infLoc:l,nanLoc:c,outShapeLocation:s,outShapeStridesLocation:i,outTexShapeLocation:a}}function g1(r,t){if(r.length!==t.length)throw Error(`Binary was compiled with ${r.length} inputs, but was executed with ${t.length} inputs`);r.forEach((e,o)=>{let n=e.logicalShape,s=t[o],a=s.shape;if(!y.arraysEqual(n,a))throw Error(`Binary was compiled with different shapes than the current args. Shapes ${n} and ${a} must match`);if(e.isUniform&&s.isUniform)return;let i=e.texShape,l=s.isUniform?null:s.texData.texShape;if(!y.arraysEqual(i,l))throw Error(`Binary was compiled with different texture shapes than the current args. Shape ${i} and ${l} must match`)})}function y1(r,t,e,o,n){t.program.enableShapeUniforms||(g1(t.inShapeInfos,e),g1([t.outShapeInfo],[o]));let s=o.texData.texture,a=o.texData.texShape;o.texData.isPacked?r.setOutputPackedMatrixTexture(s.texture,a[0],a[1]):r.setOutputMatrixTexture(s.texture,a[0],a[1]),r.setProgram(t.webGLProgram),r.bindVertexArray(t.webGLProgram.vao),D().getNumber("WEBGL_VERSION")===1&&t.infLoc!==null&&r.gl.uniform1f(t.infLoc,1/0),t.nanLoc!==null&&r.gl.uniform1f(t.nanLoc,NaN);for(let l=0;l<e.length;++l){let c=e[l],{uniform:u,offset:p,shape:m,texShape:f}=t.variablesLocations[l];if(m){let{uniformShape:d}=Wp(t.program.packedInputs,c.shape,c.texData.texShape);switch(d.length){case 1:r.gl.uniform1iv(m,new Int32Array(d));break;case 2:r.gl.uniform2iv(m,new Int32Array(d));break;case 3:r.gl.uniform3iv(m,new Int32Array(d));break;case 4:r.gl.uniform4iv(m,new Int32Array(d));break;default:break}}if(f&&r.gl.uniform2i(f,c.texData.texShape[0],c.texData.texShape[1]),u!=null){if(c.isUniform){if(y.sizeFromShape(c.shape)<2)r.gl.uniform1f(u,c.uniformValues[0]);else{let d=c.uniformValues;d instanceof Float32Array||(d=new Float32Array(d)),r.gl.uniform1fv(u,d)}continue}c.texData.slice!=null&&p!=null&&r.gl.uniform1i(p,c.texData.slice.flatOffset),r.setInputMatrixTexture(c.texData.texture.texture,u,l)}}let i=t.outShapeLocation;if(i)switch(o.shape.length){case 1:r.gl.uniform1iv(i,new Int32Array(o.shape));break;case 2:r.gl.uniform2iv(i,new Int32Array(o.shape));break;case 3:r.gl.uniform3iv(i,new Int32Array(o.shape));break;case 4:r.gl.uniform4iv(i,new Int32Array(o.shape));break;default:break}if(t.outShapeStridesLocation){let l=y.computeStrides(o.shape);switch(o.shape.length){case 2:r.gl.uniform1iv(t.outShapeStridesLocation,new Int32Array(l));break;case 3:r.gl.uniform2iv(t.outShapeStridesLocation,new Int32Array(l));break;case 4:r.gl.uniform3iv(t.outShapeStridesLocation,new Int32Array(l));break;default:break}}if(t.outTexShapeLocation&&r.gl.uniform2i(t.outTexShapeLocation,o.texData.texShape[0],o.texData.texShape[1]),t.program.customUniforms&&n)for(let l=0;l<t.program.customUniforms.length;++l){let c=t.program.customUniforms[l],u=t.customUniformLocations[l],p=n[l];if(c.type==="float")r.gl.uniform1fv(u,p);else if(c.type==="vec2")r.gl.uniform2fv(u,p);else if(c.type==="vec3")r.gl.uniform3fv(u,p);else if(c.type==="vec4")r.gl.uniform4fv(u,p);else if(c.type==="int")r.gl.uniform1iv(u,p);else if(c.type==="ivec2")r.gl.uniform2iv(u,p);else if(c.type==="ivec3")r.gl.uniform3iv(u,p);else if(c.type==="ivec4")r.gl.uniform4iv(u,p);else throw Error(`uniform type ${c.type} is not supported yet.`)}r.executeProgram()}function b1(r,t,e){let o="";t.concat(e).forEach(a=>{let i=a.texData!=null&&a.texData.slice!=null&&a.texData.slice.flatOffset>0;if(r.enableShapeUniforms&&!a.isUniform){let l=a.texData.texShape,{useSqueezeShape:c,uniformShape:u,keptDims:p}=Wp(r.packedInputs,a.shape,l),m="",f="",d="";if(u.length===1&&r.packedInputs){let I=[Math.ceil(l[0]/2),Math.ceil(l[1]/2)];m=`${I[0]>1}_${I[1]>1}`}else if(u.length===2&&!r.packedInputs)f=`${u[0]>1}_${u[1]>1}`;else if(u.length>2&&!r.packedInputs){let I=y.computeStrides(u);d=`${I[0]===l[1]}_${I[I.length-1]===l[1]}`}let g=a.shape.length,h=u.length===2&&y.arraysEqual(a.shape,l),x=y.sizeFromShape(a.shape)===1,b=N.getBroadcastDims(a.shape,e.shape),C=!r.packedInputs&&g===e.shape.length&&y.arraysEqual(l,e.texData.texShape),S=r.packedInputs||u.length>2?"":`${l[0]>1}_${l[1]>1}`;o+=`${g}_${C}_${c?p:""}_${u.length}_${x}_${b}_${h}_${m}_${f}_${d}_${S}_${i}`}else{let l=a.isUniform?"uniform":a.texData.texShape;o+=`${a.shape}_${l}_${i}`}});let n=r.userCode,s=r.constructor.name;return s+="_"+o+"_"+n+`${D().getNumber("WEBGL_VERSION")}`,s}function Mt(r){return D().getBool("WEBGL_USE_SHAPES_UNIFORMS")&&r<=4}var Gp=class{constructor(t){this.variableNames=["A"],this.packedInputs=!1,this.packedOutput=!0,this.outPackingScheme=is.DENSE,this.customUniforms=[{name:"texShape",type:"ivec2"}];let e=jt();this.outputShape=t,this.enableShapeUniforms=Mt(this.outputShape.length),this.userCode=`
      ivec3 outCoordsFromFlatIndex(int index) {
        ${this.enableShapeUniforms?Pi(["r","c","d"],t):Pr(["r","c","d"],t)}
        return ivec3(r, c, d);
      }

      void main() {
        ivec2 resTexRC = ivec2(resultUV.yx * vec2(texShape[0], texShape[1]));
        int index = 4 * (resTexRC.x * texShape[1] + resTexRC.y);

        vec4 result = vec4(0.);

        for (int i=0; i<4; i++) {
          int flatIndex = index + i;
          ivec3 rc = outCoordsFromFlatIndex(flatIndex);
          result[i] = getA(rc.x, rc.y, rc.z);
        }

        ${e.output} = result;
      }
    `}};var Up=class{constructor(t){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.outPackingScheme=is.DENSE,this.customUniforms=[{name:"texShape",type:"ivec2"}];let e=jt();this.outputShape=t,this.enableShapeUniforms=Mt(this.outputShape.length),this.userCode=`
      ivec3 outCoordsFromFlatIndex(int index) {
        ${this.enableShapeUniforms?Pi(["r","c","d"],t):Pr(["r","c","d"],t)}
        return ivec3(r, c, d);
      }

      void main() {
        ivec2 resTexRC = ivec2(resultUV.yx * vec2(texShape[0], texShape[1]));
        int index = 4 * (resTexRC.x * texShape[1] + resTexRC.y);

        vec4 result = vec4(0.);

        for (int i=0; i<4; i++) {
          int flatIndex = index + i;
          ivec3 rc = outCoordsFromFlatIndex(flatIndex);
          result[i] = getChannel(getA(rc.x, rc.y, rc.z), vec2(rc.y, rc.z));
        }

        ${e.output} = result;
      }
    `}};var Hp=class{constructor(t){this.variableNames=["A"],this.outTexUsage=ke.DOWNLOAD;let e=jt();this.outputShape=t,this.userCode=`
      ${zp}

      void main() {
        float x = getAAtOutCoords();
        ${e.output} = encode_float(x);
      }
    `}};var Kp=class{constructor(t){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!1,this.outTexUsage=ke.DOWNLOAD;let e=jt();this.outputShape=t,this.userCode=`
      ${zp}

      void main() {
        ivec3 coords = getOutputCoords();
        float x = getChannel(getAAtOutCoords(), vec2(coords.y, coords.z));
        ${e.output} = encode_float(x);
      }
    `}};var AL={R:0,G:1,B:2,A:3},xu=class{constructor(t,e=!1,o="RGBA"){this.variableNames=["A"],this.customUniforms=[{name:"texShape",type:"ivec2"}];let n=jt();this.outputShape=t,this.enableShapeUniforms=Mt(this.outputShape.length);let s="result";e&&(s="floor(result * 255. + 0.5)");let a="";for(let i=0;i<o.length;i++){let l=o[i];a+=`
          if(offset == ${i}) {
            result = values[${AL[l]}];
          }`}this.userCode=`
      ${this.enableShapeUniforms?Rl():$l(t)}

      void main() {
        ivec3 coords = getOutputCoords();
        int flatIndex = getFlatIndex(coords);
        float result = 0.;
        int offset = imod(flatIndex, ${o.length});

        flatIndex = idiv(flatIndex, ${o.length}, 1.);

        int r = flatIndex / texShape[1];
        if (r < texShape[0]) {
          int c = imod(flatIndex, texShape[1]);
          vec2 uv = (vec2(c, r) + halfCR) / vec2(texShape[1], texShape[0]);
          vec4 values = ${n.texture2D}(A, uv);
          ${a}
        }
        ${n.output} = vec4(${s}, 0., 0., 0.);
      }
    `}};var qp=class{constructor(t,e=!1){this.variableNames=["A"],this.packedInputs=!1,this.packedOutput=!0,this.customUniforms=[{name:"texShape",type:"ivec2"}];let o=jt();this.outputShape=t,this.enableShapeUniforms=Mt(this.outputShape.length);let n="",s="result";e&&(s="floor(result * 255. + 0.5)");for(let a=0;a<=1;a++)for(let i=0;i<=1;i++){let l=a*2+i;n+=`
          localCoords = coords;
          if(localCoords[2] + ${i} < ${this.enableShapeUniforms?"outShape[2]":`${t[2]}`}) {
          localCoords[2] += ${i};
          if (localCoords[1] + ${a} < ${this.enableShapeUniforms?"outShape[1]":`${t[1]}`}) {
            localCoords[1] += ${a};

            flatIndex = getFlatIndex(localCoords);
            offset = imod(flatIndex, 4);

            flatIndex = idiv(flatIndex, 4, 1.);

            int r = flatIndex / texShape[1];
            int c = imod(flatIndex, texShape[1]);
            vec2 uv = (vec2(c, r) + halfCR) / vec2(texShape[1], texShape[0]);
            values = ${o.texture2D}(A, uv);

            if (offset == 0) {
              result[${l}] = values[0];
            } else if (offset == 1) {
              result[${l}] = values[1];
            } else if (offset == 2) {
              result[${l}] = values[2];
            } else {
              result[${l}] = values[3];
            }
          }
        }
        `}this.userCode=`
        ${this.enableShapeUniforms?Rl():$l(t)}

        void main() {
          ivec3 coords = getOutputCoords();

          vec4 result = vec4(0.);
          int flatIndex, r, c, offset;
          ivec3 localCoords;
          vec2 uv;
          vec4 values;

          ${n}

          ${o.output} = ${s};
        }
    `}};function w1(r){let t=jt(),e=`${t.version}
    precision highp float;
    ${t.attribute} vec3 clipSpacePos;
    ${t.attribute} vec2 uv;
    ${t.varyingVs} vec2 resultUV;

    void main() {
      gl_Position = vec4(clipSpacePos, 1);
      resultUV = uv;
    }`;return Kv(r,e)}function v1(r){let t=new Float32Array([-1,1,0,0,1,-1,-1,0,0,0,1,1,0,1,1,1,-1,0,1,0]);return Yv(r,t)}function S1(r){let t=new Uint16Array([0,1,2,2,1,3]);return Qv(r,t)}function yu(r,t,e,o,n,s){Jv(t,e);let a=Zv(r),i=r.TEXTURE_2D;return rt(r,()=>r.bindTexture(i,a)),rt(r,()=>r.texParameteri(i,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE)),rt(r,()=>r.texParameteri(i,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE)),rt(r,()=>r.texParameteri(i,r.TEXTURE_MIN_FILTER,r.NEAREST)),rt(r,()=>r.texParameteri(i,r.TEXTURE_MAG_FILTER,r.NEAREST)),D().getNumber("WEBGL_VERSION")===1?rt(r,()=>r.texImage2D(i,0,o,t,e,0,n,s,null)):rt(r,()=>r.texStorage2D(i,1,o,t,e)),rt(r,()=>r.bindTexture(r.TEXTURE_2D,null)),{texture:a,texShape:[e,t]}}function Rx(r){return r.internalFormatFloat}function C1(r,t,e,o){let[n,s]=Di(t,e);return yu(r,n,s,Rx(o),o.textureFormatFloat,r.FLOAT)}function Ax(r){return r.internalFormatHalfFloat}function T1(r,t,e,o){let[n,s]=Di(t,e);return yu(r,n,s,Ax(o),o.textureFormatFloat,o.textureTypeHalfFloat)}function Fx(r){return r.downloadTextureFormat}function N1(r,t,e,o){let[n,s]=Di(t,e);return yu(r,n,s,Fx(o),r.RGBA,r.UNSIGNED_BYTE)}function _x(r){return r.internalFormatPackedFloat}function I1(r,t,e,o){let[n,s]=ao(t,e);return yu(r,n,s,_x(o),r.RGBA,r.FLOAT)}function Dx(r){return r.internalFormatPackedHalfFloat}function k1(r,t,e,o){let[n,s]=ao(t,e);return yu(r,n,s,Dx(o),r.RGBA,o.textureTypeHalfFloat)}function E1(r,t,e){return rt(r,()=>r.bindBuffer(r.ARRAY_BUFFER,e)),Ix(r,t,"clipSpacePos",e,3,20,0)&&Ix(r,t,"uv",e,2,20,12)}function $1(r,t,e,o,n,s){rt(r,()=>r.bindTexture(r.TEXTURE_2D,t));let a,i,l;n instanceof Uint8Array?(a=new Uint8Array(e*o*4),i=r.UNSIGNED_BYTE,l=r.RGBA):(a=new Float32Array(e*o*4),i=r.FLOAT,l=s.internalFormatPackedFloat),a.set(n),D().getNumber("WEBGL_VERSION")===2?rt(r,()=>r.texSubImage2D(r.TEXTURE_2D,0,0,0,e,o,r.RGBA,i,a)):rt(r,()=>r.texImage2D(r.TEXTURE_2D,0,l,e,o,0,r.RGBA,i,a)),rt(r,()=>r.bindTexture(r.TEXTURE_2D,null))}function R1(r,t,e){rt(r,()=>r.bindTexture(r.TEXTURE_2D,t)),e.data instanceof Uint8Array?D().getNumber("WEBGL_VERSION")===2?rt(r,()=>r.texSubImage2D(r.TEXTURE_2D,0,0,0,e.width,e.height,r.RGBA,r.UNSIGNED_BYTE,e.data)):rt(r,()=>r.texImage2D(r.TEXTURE_2D,0,r.RGBA,e.width,e.height,0,r.RGBA,r.UNSIGNED_BYTE,e.data)):D().getNumber("WEBGL_VERSION")===2?rt(r,()=>r.texSubImage2D(r.TEXTURE_2D,0,0,0,r.RGBA,r.UNSIGNED_BYTE,e)):rt(r,()=>r.texImage2D(r.TEXTURE_2D,0,r.RGBA,r.RGBA,r.UNSIGNED_BYTE,e)),rt(r,()=>r.bindTexture(r.TEXTURE_2D,null))}function A1(r,t,e,o){let n=r.createBuffer();rt(r,()=>r.bindBuffer(r.PIXEL_PACK_BUFFER,n));let i=4*4*t*e;return rt(r,()=>r.bufferData(r.PIXEL_PACK_BUFFER,i,r.STREAM_READ)),rt(r,()=>r.readPixels(0,0,e,t,r.RGBA,r.FLOAT,0)),rt(r,()=>r.bindBuffer(r.PIXEL_PACK_BUFFER,null)),n}function F1(r,t,e){let o=r,n=new Float32Array(e);return o.bindBuffer(o.PIXEL_PACK_BUFFER,t),o.getBufferSubData(o.PIXEL_PACK_BUFFER,0,n),o.bindBuffer(o.PIXEL_PACK_BUFFER,null),n}function _1(r,t,e,o){let[n,s]=Di(t,e),a=4,i=new Uint8Array(Gv(t*e,a));return rt(r,()=>r.readPixels(0,0,n,s,o.downloadTextureFormat,r.UNSIGNED_BYTE,i)),new Float32Array(i.buffer)}function D1(r,t,e,o,n,s,a,i){let l=r,c=new Float32Array(Uv(s,a));return l.bindBuffer(l.PIXEL_PACK_BUFFER,t),l.getBufferSubData(l.PIXEL_PACK_BUFFER,0,c),l.bindBuffer(l.PIXEL_PACK_BUFFER,null),c}function O1(r,t,e){let o=new Float32Array(t*e*4);return rt(r,()=>r.readPixels(0,0,e,t,r.RGBA,r.FLOAT,o)),o}var Pl=class{constructor(t){this.outputTexture=null,this.program=null,this.disposed=!1,this.itemsToPoll=[];let e=D().getNumber("WEBGL_VERSION");if(t!=null?(this.gl=t,Wv(e,t)):this.gl=lr(e),t=this.gl,D().getNumber("WEBGL_VERSION")===2){let s=t;this.createVertexArray=()=>rt(s,()=>s.createVertexArray()),this.bindVertexArray=a=>rt(s,()=>s.bindVertexArray(a)),this.deleteVertexArray=a=>rt(s,()=>s.deleteVertexArray(a)),this.getVertexArray=()=>rt(s,()=>s.getParameter(s.VERTEX_ARRAY_BINDING))}else if(t!=null){let s=t.getExtension("OES_vertex_array_object");if(s==null)throw new Error("All WebGL1 implementations are expected to offer OES_vertex_array_object.");this.createVertexArray=()=>rt(t,()=>s.createVertexArrayOES()),this.bindVertexArray=a=>rt(t,()=>s.bindVertexArrayOES(a)),this.deleteVertexArray=a=>rt(t,()=>s.deleteVertexArrayOES(a)),this.getVertexArray=()=>rt(t,()=>t.getParameter(s.VERTEX_ARRAY_BINDING_OES))}let o="WEBGL_color_buffer_float",n="EXT_color_buffer_half_float";if(this.parallelCompilationExtension=this.gl.getExtension("KHR_parallel_shader_compile"),D().getNumber("WEBGL_VERSION")===1){let s="OES_texture_float",a="OES_texture_half_float";if(this.textureFloatExtension=du(this.gl,s),hr(this.gl,a))this.textureHalfFloatExtension=du(this.gl,a);else if(D().get("WEBGL_FORCE_F16_TEXTURES"))throw new Error("GL context does not support half float textures, yet the environment flag WEBGL_FORCE_F16_TEXTURES is set to true.");if(this.colorBufferFloatExtension=this.gl.getExtension(o),hr(this.gl,n))this.colorBufferHalfFloatExtension=du(this.gl,n);else if(D().get("WEBGL_FORCE_F16_TEXTURES"))throw new Error("GL context does not support color renderable half floats, yet the environment flag WEBGL_FORCE_F16_TEXTURES is set to true.")}else if(o="EXT_color_buffer_float",hr(this.gl,o))this.colorBufferFloatExtension=this.gl.getExtension(o);else if(hr(this.gl,n))this.colorBufferHalfFloatExtension=this.gl.getExtension(n);else throw new Error("GL context does not support color renderable floats");this.vertexBuffer=v1(this.gl),this.indexBuffer=S1(this.gl),this.framebuffer=t1(this.gl),this.textureConfig=fu(this.gl,this.textureHalfFloatExtension)}get debug(){return D().getBool("DEBUG")}dispose(){if(this.disposed)return;this.program!=null&&console.warn("Disposing a GPGPUContext that still has a bound WebGLProgram. This is probably a resource leak, delete the program with GPGPUContext.deleteProgram before disposing."),this.outputTexture!=null&&console.warn("Disposing a GPGPUContext that still has a bound output matrix texture.  This is probably a resource leak, delete the output matrix texture with GPGPUContext.deleteMatrixTexture before disposing.");let t=this.gl;rt(t,()=>t.finish()),rt(t,()=>t.bindFramebuffer(t.FRAMEBUFFER,null)),rt(t,()=>t.deleteFramebuffer(this.framebuffer)),rt(t,()=>t.bindBuffer(t.ARRAY_BUFFER,null)),rt(t,()=>t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,null)),rt(t,()=>t.deleteBuffer(this.indexBuffer)),this.disposed=!0}createFloat32MatrixTexture(t,e){return this.throwIfDisposed(),C1(this.gl,t,e,this.textureConfig)}createFloat16MatrixTexture(t,e){return this.throwIfDisposed(),T1(this.gl,t,e,this.textureConfig)}createUnsignedBytesMatrixTexture(t,e){return this.throwIfDisposed(),N1(this.gl,t,e,this.textureConfig)}uploadPixelDataToTexture(t,e){this.throwIfDisposed(),R1(this.gl,t,e)}uploadDenseMatrixToTexture(t,e,o,n){this.throwIfDisposed(),$1(this.gl,t,e,o,n,this.textureConfig)}createFloat16PackedMatrixTexture(t,e){return this.throwIfDisposed(),k1(this.gl,t,e,this.textureConfig)}createPackedMatrixTexture(t,e){return this.throwIfDisposed(),I1(this.gl,t,e,this.textureConfig)}deleteMatrixTexture(t){this.throwIfDisposed(),this.outputTexture===t&&(kx(this.gl,this.framebuffer),this.outputTexture=null),rt(this.gl,()=>this.gl.deleteTexture(t))}downloadByteEncodedFloatMatrixFromOutputTexture(t,e,o){return this.downloadMatrixDriver(t,()=>_1(this.gl,e,o,this.textureConfig))}downloadPackedMatrixFromBuffer(t,e,o,n,s,a){return D1(this.gl,t,e,o,n,s,a,this.textureConfig)}downloadFloat32MatrixFromBuffer(t,e){return F1(this.gl,t,e)}createBufferFromTexture(t,e,o){this.bindTextureToFrameBuffer(t);let n=A1(this.gl,e,o,this.textureConfig);return this.unbindTextureToFrameBuffer(),n}createAndWaitForFence(){let t=this.createFence(this.gl);return this.pollFence(t)}createFence(t){let e,o;if(D().getBool("WEBGL_FENCE_API_ENABLED")){let n=t,s=n.fenceSync(n.SYNC_GPU_COMMANDS_COMPLETE,0);t.flush(),o=()=>{let a=n.clientWaitSync(s,0,0);return a===n.ALREADY_SIGNALED||a===n.CONDITION_SATISFIED},e=s}else D().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")>0?(e=this.beginQuery(),this.endQuery(),o=()=>this.isQueryAvailable(e,D().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION"))):o=()=>!0;return{query:e,isFencePassed:o}}downloadMatrixFromPackedTexture(t,e,o){return this.downloadMatrixDriver(t,()=>O1(this.gl,e,o))}createProgram(t){this.throwIfDisposed();let e=this.gl;this.vertexShader==null&&(this.vertexShader=w1(e));let o=jv(e);rt(e,()=>e.attachShader(o,this.vertexShader)),rt(e,()=>e.attachShader(o,t)),Xv(e,o);let n=Object.assign(o,{vao:this.createVertexArray()});return this.debug&&Lp(e,n),n}buildVao(t){this.setProgram(t),this.bindVertexArray(t.vao);let e=this.gl;rt(e,()=>e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,this.indexBuffer)),E1(e,t,this.vertexBuffer)}deleteProgram(t){this.throwIfDisposed(),t===this.program&&(this.program=null),t!=null&&(rt(this.gl,()=>this.gl.deleteProgram(t)),this.deleteVertexArray(t.vao))}setProgram(t){this.throwIfDisposed(),this.program=t,this.program!=null&&this.debug&&Lp(this.gl,this.program),rt(this.gl,()=>this.gl.useProgram(t))}getUniformLocation(t,e,o=!0){return this.throwIfDisposed(),o?e1(this.gl,t,e):r1(this.gl,t,e)}getAttributeLocation(t,e){return this.throwIfDisposed(),rt(this.gl,()=>this.gl.getAttribLocation(t,e))}getUniformLocationNoThrow(t,e){return this.throwIfDisposed(),this.gl.getUniformLocation(t,e)}setInputMatrixTexture(t,e,o){this.throwIfDisposed(),this.throwIfNoProgram(),o1(this.gl,t,e,o)}setOutputMatrixTexture(t,e,o){this.setOutputMatrixTextureDriver(t,o,e)}setOutputPackedMatrixTexture(t,e,o){this.throwIfDisposed();let[n,s]=ao(e,o);this.setOutputMatrixTextureDriver(t,n,s)}setOutputMatrixWriteRegion(t,e,o,n){this.setOutputMatrixWriteRegionDriver(o,t,n,e)}setOutputPackedMatrixWriteRegion(t,e,o,n){throw new Error("setOutputPackedMatrixWriteRegion not implemented.")}debugValidate(){this.program!=null&&Lp(this.gl,this.program),hu(this.gl)}executeProgram(){this.throwIfDisposed(),this.throwIfNoProgram();let t=this.gl;if(this.debug){let e=this.getVertexArray();console.assert(e===this.program.vao,"VAO changed between setProgram and executeProgram!"),this.debugValidate()}rt(t,()=>t.drawElements(t.TRIANGLES,6,t.UNSIGNED_SHORT,0))}blockUntilAllProgramsCompleted(){this.throwIfDisposed(),rt(this.gl,()=>this.gl.finish())}getQueryTimerExtension(){return this.disjointQueryTimerExtension==null&&(this.disjointQueryTimerExtension=du(this.gl,D().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")===2?"EXT_disjoint_timer_query_webgl2":"EXT_disjoint_timer_query")),this.disjointQueryTimerExtension}getQueryTimerExtensionWebGL2(){return this.getQueryTimerExtension()}getQueryTimerExtensionWebGL1(){return this.getQueryTimerExtension()}beginQuery(){if(D().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")===2){let o=this.gl,n=this.getQueryTimerExtensionWebGL2(),s=o.createQuery();return o.beginQuery(n.TIME_ELAPSED_EXT,s),s}let t=this.getQueryTimerExtensionWebGL1(),e=t.createQueryEXT();return t.beginQueryEXT(t.TIME_ELAPSED_EXT,e),e}endQuery(){if(D().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION")===2){let e=this.gl,o=this.getQueryTimerExtensionWebGL2();e.endQuery(o.TIME_ELAPSED_EXT);return}let t=this.getQueryTimerExtensionWebGL1();t.endQueryEXT(t.TIME_ELAPSED_EXT)}async waitForQueryAndGetTime(t){return await y.repeatedTry(()=>this.disposed||this.isQueryAvailable(t,D().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION"))),this.getQueryTime(t,D().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_VERSION"))}getQueryTime(t,e){if(e===0)return null;if(e===2){let o=this.gl;return o.getQueryParameter(t,o.QUERY_RESULT)/1e6}else{let o=this.getQueryTimerExtensionWebGL1();return o.getQueryObjectEXT(t,o.QUERY_RESULT_EXT)/1e6}}isQueryAvailable(t,e){if(e===0)return!0;if(e===2){let o=this.gl,n=this.getQueryTimerExtensionWebGL2(),s=o.getQueryParameter(t,o.QUERY_RESULT_AVAILABLE);return this.disjoint==null&&(this.disjoint=this.gl.getParameter(n.GPU_DISJOINT_EXT)),s&&!this.disjoint}else{let o=this.getQueryTimerExtensionWebGL1(),n=o.getQueryObjectEXT(t,o.QUERY_RESULT_AVAILABLE_EXT);return this.disjoint==null&&(this.disjoint=this.gl.getParameter(o.GPU_DISJOINT_EXT)),n&&!this.disjoint}}pollFence(t){return new Promise(e=>{this.addItemToPoll(()=>t.isFencePassed(),()=>e())})}pollItems(){let t=_L(this.itemsToPoll.map(e=>e.isDoneFn));for(let e=0;e<=t;++e){let{resolveFn:o}=this.itemsToPoll[e];o()}this.itemsToPoll=this.itemsToPoll.slice(t+1)}addItemToPoll(t,e){if(this.itemsToPoll.push({isDoneFn:t,resolveFn:e}),this.itemsToPoll.length>1)return;let o;"setTimeoutCustom"in D().platform&&(o=D().platform.setTimeoutCustom.bind(D().platform)),y.repeatedTry(()=>(this.pollItems(),this.itemsToPoll.length===0),()=>0,null,o)}bindTextureToFrameBuffer(t){this.throwIfDisposed(),Bp(this.gl,t,this.framebuffer),this.debug&&hu(this.gl)}unbindTextureToFrameBuffer(){this.outputTexture!=null?(Bp(this.gl,this.outputTexture,this.framebuffer),this.debug&&hu(this.gl)):kx(this.gl,this.framebuffer)}downloadMatrixDriver(t,e){this.bindTextureToFrameBuffer(t);let o=e();return this.unbindTextureToFrameBuffer(),o}setOutputMatrixTextureDriver(t,e,o){this.throwIfDisposed();let n=this.gl;Bp(n,t,this.framebuffer),this.debug&&hu(n),this.outputTexture=t,rt(n,()=>n.viewport(0,0,e,o)),rt(n,()=>n.scissor(0,0,e,o))}setOutputMatrixWriteRegionDriver(t,e,o,n){this.throwIfDisposed(),rt(this.gl,()=>this.gl.scissor(t,e,o,n))}throwIfDisposed(){if(this.disposed)throw new Error("Attempted to use disposed GPGPUContext.")}throwIfNoProgram(){if(this.program==null)throw new Error("No GPU program is currently set.")}};function _L(r){let t=0;for(;t<r.length&&r[t]();++t);return t-1}var py={};kt(py,{addImpl:()=>Mx,bincountImpl:()=>Bl,bincountReduceImpl:()=>jp,bitwiseAndImpl:()=>Lx,castImpl:()=>Px,ceilImpl:()=>Bx,concatImpl:()=>Xp,equalImpl:()=>Vx,expImpl:()=>Wx,expm1Impl:()=>Ux,floorDivImpl:()=>Kx,floorImpl:()=>Hx,gatherNdImpl:()=>Yp,gatherV2Impl:()=>Qp,greaterEqualImpl:()=>jx,greaterImpl:()=>qx,lessEqualImpl:()=>Yx,lessImpl:()=>Xx,linSpaceImpl:()=>Zp,logImpl:()=>Qx,maxImpl:()=>Jp,maximumImpl:()=>Zx,minimumImpl:()=>Jx,multiplyImpl:()=>bu,negImpl:()=>ty,notEqualImpl:()=>ey,prodImpl:()=>ry,raggedGatherImpl:()=>tm,raggedRangeImpl:()=>em,raggedTensorToTensorImpl:()=>rm,rangeImpl:()=>om,rsqrtImpl:()=>ny,scatterImpl:()=>Mr,sigmoidImpl:()=>mS,simpleAbsImpl:()=>Ox,sliceImpl:()=>ay,sparseFillEmptyRowsImpl:()=>nm,sparseReshapeImpl:()=>sm,sparseSegmentReductionImpl:()=>zl,sqrtImpl:()=>hS,squaredDifferenceImpl:()=>iy,staticRegexReplaceImpl:()=>ly,stridedSliceImpl:()=>am,stringNGramsImpl:()=>im,stringSplitImpl:()=>lm,stringToHashBucketFastImpl:()=>cm,subImpl:()=>uy,tileImpl:()=>um,topKImpl:()=>pm,transposeImpl:()=>Vl,uniqueImpl:()=>mm});function U(r,t){Array.isArray(r)||(r=[r]),r.forEach(e=>{e!=null&&y.assert(e.dtype!=="complex64",()=>`${t} does not support complex64 tensors in the CPU backend.`)})}function Ox(r){let t=new Float32Array(r.length);for(let e=0;e<r.length;++e)t[e]=Math.abs(r[e]);return t}var DL=r=>{let{x:t}=r.inputs,e=r.backend;U(t,"abs");let o=new Float32Array(y.sizeFromShape(t.shape)),n=e.data.get(t.dataId).values;return o=Ox(n),e.makeOutput(o,t.shape,t.dtype)},P1={kernelName:"Abs",backendName:"cpu",kernelFunc:DL};function wt(r){return(t,e,o,n,s)=>{let a=N.assertAndGetBroadcastShape(t,e),i=a.length,l=y.computeStrides(a),c=y.sizeFromShape(a),u=y.getTypedArrayFromDType(s,c),p=t.length,m=e.length,f=y.computeStrides(t),d=y.computeStrides(e),g=N.getBroadcastDims(t,a),h=N.getBroadcastDims(e,a);if(g.length+h.length===0)for(let x=0;x<u.length;++x)u[x]=r(o[x%o.length],n[x%n.length]);else for(let x=0;x<u.length;++x){let b=y.indexToLoc(x,i,l),C=b.slice(-p);g.forEach(R=>C[R]=0);let S=y.locToIndex(C,p,f),I=b.slice(-m);h.forEach(R=>I[R]=0);let $=y.locToIndex(I,m,d);u[x]=r(o[S],n[$])}return[u,a]}}function fe(r){let{inputs:t,backend:e}=r,{real:o,imag:n}=t,s=e.data.get(o.dataId).values,a=e.data.get(n.dataId).values,i=e.makeTensorInfo(o.shape,"complex64"),l=e.data.get(i.dataId);return l.complexTensorInfos={real:e.makeTensorInfo(o.shape,"float32",s),imag:e.makeTensorInfo(n.shape,"float32",a)},i}var M1={kernelName:Fs,backendName:"cpu",kernelFunc:fe};function Ml(r,t,e="float32"){if(e==="complex64"){let n=Ml(r,t,"float32"),s=Ml(r,t,"float32");return fe({inputs:{real:n,imag:s},backend:r})}let o=y.makeZerosTypedArray(y.sizeFromShape(t),e);return r.makeTensorInfo(t,e,o)}function Ee(r){let{inputs:t,backend:e}=r,{x:o}=t;return e.incRef(o.dataId),{dataId:o.dataId,shape:o.shape,dtype:o.dtype}}var L1={kernelName:yo,backendName:"cpu",kernelFunc:Ee};function vr(r){let{inputs:t,backend:e}=r,{input:o}=t,n=e.data.get(o.dataId).complexTensorInfos.real,s=e.data.get(n.dataId).values;return e.makeTensorInfo(n.shape,n.dtype,s)}var B1={kernelName:_a,backendName:"cpu",kernelFunc:vr};function Px(r,t,e,o){if(o==="int32"){let n=Int32Array.from(r);return[t,"int32",n]}if(o==="bool"){let n=y.toTypedArray([0],e),[s,a]=wt((i,l)=>i!==l?1:0)(t,[],r,n,"bool");return[a,"bool",s]}throw new Error(`Error in Cast: failed to cast ${e} to ${o}`)}function Sr(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{dtype:s}=o;if(s==="complex64"){if(n.dtype==="complex64")return Ee({inputs:{x:n},backend:e});let u=Ml(e,n.shape,n.dtype),p=Sr({inputs:{x:n},backend:e,attrs:{dtype:"float32"}}),m=fe({inputs:{real:p,imag:u},backend:e});return e.disposeIntermediateTensorInfo(u),e.disposeIntermediateTensorInfo(p),m}if(n.dtype==="complex64"){let u=vr({inputs:{input:n},backend:e}),p=Sr({inputs:{x:u},backend:e,attrs:{dtype:s}});return e.disposeIntermediateTensorInfo(u),p}if(!y.hasEncodingLoss(n.dtype,s)){let u=Ee({inputs:{x:n},backend:e});return{dataId:u.dataId,shape:u.shape,dtype:s}}let a=e.data.get(n.dataId).values,[i,l,c]=Px(a,n.shape,n.dtype,s);return e.makeTensorInfo(i,l,c)}var V1={kernelName:xo,backendName:"cpu",kernelFunc:Sr};function It(r,t,e,o){return e==null?({inputs:n,backend:s})=>{let{a,b:i}=n,l=s;U([a,i],r);let c=l.data.get(a.dataId).values,u=l.data.get(i.dataId).values,p=a.dtype==="string"?N.fromUint8ToStringArray(c):c,m=a.dtype==="string"?N.fromUint8ToStringArray(u):u,f=o||a.dtype,[d,g]=t(a.shape,i.shape,p,m,f);return l.makeTensorInfo(g,f,d)}:({inputs:n,backend:s})=>{let{a,b:i}=n,l=s;if(a.dtype==="complex64"||i.dtype==="complex64"){let c=Sr({inputs:{x:a},backend:l,attrs:{dtype:"complex64"}}),u=l.data.get(c.dataId),p=u.complexTensorInfos.real,m=u.complexTensorInfos.imag,f=l.data.get(p.dataId).values,d=l.data.get(m.dataId).values,g=Sr({inputs:{x:i},backend:l,attrs:{dtype:"complex64"}}),h=l.data.get(g.dataId),x=h.complexTensorInfos.real,b=h.complexTensorInfos.imag,C=l.data.get(x.dataId).values,S=l.data.get(b.dataId).values,[I,$,R]=e(a.shape,i.shape,f,d,C,S),A=l.makeTensorInfo(R,"float32",I),F=l.makeTensorInfo(R,"float32",$),_=fe({inputs:{real:A,imag:F},backend:l});return l.disposeIntermediateTensorInfo(c),l.disposeIntermediateTensorInfo(g),l.disposeIntermediateTensorInfo(A),l.disposeIntermediateTensorInfo(F),_}else{let c=l.data.get(a.dataId).values,u=l.data.get(i.dataId).values,p=o||a.dtype,[m,f]=t(a.shape,i.shape,c,u,p);return l.makeTensorInfo(f,p,m)}}}function Ll(r){return(t,e,o,n,s,a)=>{let i=N.assertAndGetBroadcastShape(t,e),l=y.sizeFromShape(i),c=i.length,u=y.computeStrides(i),p=y.getTypedArrayFromDType("float32",l),m=y.getTypedArrayFromDType("float32",l),f=N.getBroadcastDims(t,i),d=N.getBroadcastDims(e,i),g=N.mergeRealAndImagArrays(o,n),h=N.mergeRealAndImagArrays(s,a),x=t.length,b=y.computeStrides(t),C=e.length,S=y.computeStrides(e);if(f.length+d.length===0)for(let I=0;I<p.length;I++){let $=I%g.length,R=I%h.length,A=r(g[$*2],g[$*2+1],h[R*2],h[R*2+1]);p[I]=A.real,m[I]=A.imag}else for(let I=0;I<p.length;I++){let $=y.indexToLoc(I,c,u),R=$.slice(-x);f.forEach(M=>R[M]=0);let A=y.locToIndex(R,x,b),F=$.slice(-C);d.forEach(M=>F[M]=0);let _=y.locToIndex(F,C,S),O=r(g[A*2],g[A*2+1],h[_*2],h[_*2+1]);p[I]=O.real,m[I]=O.imag}return[p,m,i]}}var Mx=wt(((r,t)=>r+t)),OL=Ll(((r,t,e,o)=>({real:r+e,imag:t+o}))),lo=It("Add",Mx,OL),z1={kernelName:"Add",backendName:"cpu",kernelFunc:lo};function Bl(r,t,e,o,n){let s=y.sizeFromShape(o),a=y.makeZerosTypedArray(n,e);for(let i=0;i<r.length;i++){let l=r[i];if(l<0)throw new Error("Input x must be non-negative!");l>=n||(s>0?a[l]+=t[i]:a[l]+=1)}return a}function jp(r,t,e,o=!1){let n=r.shape[0],s=r.shape[1],a=ot([n,e],t.dtype);for(let i=0;i<n;i++)for(let l=0;l<s;l++){let c=r.get(i,l);if(c<0)throw new Error("Input x must be non-negative!");c>=e||(o?a.set(1,i,c):t.size>0?a.set(a.get(i,c)+t.get(i,l),i,c):a.set(a.get(i,c)+1,i,c))}return a}var Lx=wt(((r,t)=>r&t)),PL=It(en,Lx),W1={kernelName:en,backendName:"cpu",kernelFunc:PL};function ge(r){return(t,e,o)=>{let n=y.getArrayFromDType(e,t.length);for(let s=0;s<t.length;++s)n[s]=r(t[s],o);return n}}function ut(r,t,e){let o=ge(t);return Qe(r,o,e)}function Qe(r,t,e){return({inputs:o,attrs:n,backend:s})=>{let{x:a}=o;U(a,r);let i=s,l=i.data.get(a.dataId).values,c;if(a.dtype==="string"){if(!Array.isArray(l))throw new Error("String tensor's value was not an instance of Array");c=N.fromUint8ToStringArray(l)}else c=l;let u=e||a.dtype,p=t(c,u,n);return i.makeTensorInfo(a.shape,u,p)}}var Bx=ge(r=>Math.ceil(r)),ML=Qe(rn,Bx),G1={kernelName:rn,backendName:"cpu",kernelFunc:ML};function Xp(r,t,e,o){let n=y.getArrayFromDType(e,y.sizeFromShape(t));if(o&&e!=="string"){let s=0;r.forEach(a=>{let i=y.sizeFromShape(a.shape);n.set(a.vals,s),s+=i})}else{let s=0;r.forEach(a=>{let i=e==="string"?N.fromUint8ToStringArray(a.vals):a.vals,l=0;for(let c=0;c<a.shape[0];++c){let u=c*t[1]+s;for(let p=0;p<a.shape[1];++p)n[u+p]=i[l++]}s+=a.shape[1]})}return n}var Vx=wt((r,t)=>r===t?1:0),zx=It(an,Vx,null,"bool"),U1={kernelName:an,backendName:"cpu",kernelFunc:zx};var Wx=ge(r=>Math.exp(r)),Gx=Qe("Exp",Wx,"float32"),H1={kernelName:"Exp",backendName:"cpu",kernelFunc:Gx};var Ux=ge(r=>Math.expm1(r)),LL=Qe(ln,Ux),K1={kernelName:ln,backendName:"cpu",kernelFunc:LL};var Hx=ge(r=>Math.floor(r)),BL=Qe(cn,Hx),q1={kernelName:cn,backendName:"cpu",kernelFunc:BL};var Kx=wt((r,t)=>Math.floor(r/t)),VL=It(un,Kx,null,"int32"),j1={kernelName:un,backendName:"cpu",kernelFunc:VL};function Yp(r,t,e,o,n,s,a,i,l){let c=ot([o,s],e);for(let u=0;u<o;u++){let p=[],m=0;for(let f=0;f<n;f++){let d=r[u*n+f];m+=d*a[f],p.push(d)}if(m<0||m>=l/s)throw new Error(`Invalid indices: ${p} does not index into ${i}`);for(let f=0;f<s;f++)c.values[u*s+f]=t.get(...t.indexToLoc(m*s+f))}return c}function Qp(r,t,e){let o=ot(e,r.dtype);for(let n=0;n<o.size;++n){let a=o.indexToLoc(n).slice(),i=a[0],l=a[2],c=t.locToIndex([i,l]);a[2]=t.values[c];let u=r.locToIndex(a);0<=u&&u<r.values.length&&(o.values[n]=r.values[u])}return o}var qx=wt((r,t)=>r>t?1:0),zL=It(pn,qx,null,"bool"),X1={kernelName:pn,backendName:"cpu",kernelFunc:zL};var jx=wt((r,t)=>r>=t?1:0),WL=It(mn,jx,null,"bool"),Y1={kernelName:mn,backendName:"cpu",kernelFunc:WL};var Xx=wt((r,t)=>r<t?1:0),GL=It(gn,Xx,null,"bool"),Q1={kernelName:gn,backendName:"cpu",kernelFunc:GL};var Yx=wt((r,t)=>r<=t?1:0),UL=It(xn,Yx,null,"bool"),Z1={kernelName:xn,backendName:"cpu",kernelFunc:UL};function Zp(r,t,e){let o=(t-r)/(e-1),n=y.makeZerosTypedArray(e,"float32");n[0]=r;for(let s=1;s<n.length;s++)n[s]=n[s-1]+o;return n}var Qx=ge(r=>Math.log(r)),HL=Qe("Log",Qx),J1={kernelName:"Log",backendName:"cpu",kernelFunc:HL};function Jp(r,t,e,o){let n=y.getTypedArrayFromDType(o,y.sizeFromShape(e));for(let s=0;s<n.length;++s){let a=s*t,i=r[a];for(let l=0;l<t;++l){let c=r[a+l];(Number.isNaN(c)||c>i)&&(i=c)}n[s]=i}return n}var Zx=wt(((r,t)=>Math.max(r,t))),KL=It(Sn,Zx),tS={kernelName:Sn,backendName:"cpu",kernelFunc:KL};var Jx=wt(((r,t)=>Math.min(r,t))),qL=It(Cn,Jx),eS={kernelName:Cn,backendName:"cpu",kernelFunc:qL};var bu=wt(((r,t)=>r*t)),jL=Ll(((r,t,e,o)=>({real:r*e-t*o,imag:r*o+t*e}))),Li=It(Tn,bu,jL),rS={kernelName:Tn,backendName:"cpu",kernelFunc:Li};function ty(r,t,e){let o=y.createScalarValue(-1,e);return bu([],t,o,r,e)}function XL(r){let{inputs:t,backend:e}=r,{x:o}=t;U(o,"neg");let n=e.data.get(o.dataId).values,[s,a]=ty(n,o.shape,o.dtype);return e.makeTensorInfo(a,o.dtype,s)}var oS={kernelName:"Neg",backendName:"cpu",kernelFunc:XL};var ey=wt(((r,t)=>r!==t?1:0)),YL=It(Nn,ey,null,"bool"),nS={kernelName:Nn,backendName:"cpu",kernelFunc:YL};function Vl(r,t,e,o,n){let s=t.length,a=y.sizeFromShape(t),i=y.computeStrides(t),l=y.computeStrides(n),c=y.getTypedArrayFromDType(e,y.sizeFromShape(n));for(let u=0;u<a;++u){let p=y.indexToLoc(u,s,i),m=new Array(p.length);for(let d=0;d<m.length;d++)m[d]=p[o[d]];let f=y.locToIndex(m,s,l);c[f]=r[u]}return c}function Xt(r){let{inputs:t,attrs:e,backend:o}=r,{x:n}=t,{perm:s}=e;U(n,"transpose");let a=n.shape.length,i=new Array(a);for(let p=0;p<i.length;p++)i[p]=n.shape[s[p]];let l=o.data.get(n.dataId).values,c=Vl(l,n.shape,n.dtype,s,i);return{dataId:o.write(c,i,n.dtype),shape:i,dtype:n.dtype}}var sS={kernelName:wo,backendName:"cpu",kernelFunc:Xt};function ry(r,t,e,o){let[n,s]=N.computeOutAndReduceShapes(r,o),a=se(t,"int32"),i=y.makeZerosTypedArray(y.sizeFromShape(n),a),l=y.sizeFromShape(s);for(let c=0;c<i.length;++c){let u=c*l,p=1;for(let m=0;m<l;++m)p*=e[u+m];i[c]=p}return{outVals:i,outShape:n,outDtype:a}}function QL(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o;U(n,"prod");let i=n.shape.length,l=y.parseAxisParam(s,n.shape),c=N.getAxesPermutation(l,i),u=l,p=n,m=[];c!=null&&(p=Xt({inputs:{x:n},backend:e,attrs:{perm:c}}),m.push(p),u=N.getInnerMostAxes(u.length,i));let f=e.data.get(p.dataId).values,{outVals:d,outShape:g,outDtype:h}=ry(p.shape,p.dtype,f,u),x=g;return a&&(x=N.expandShapeToKeepDim(g,l)),m.forEach(b=>e.disposeIntermediateTensorInfo(b)),e.makeTensorInfo(x,h,d)}var aS={kernelName:Ea,backendName:"cpu",kernelFunc:QL};function ZL(r,t,e){r.forEach((o,n)=>{if(o<0||o>=e){let s=y.indexToLoc(n,t.length,y.computeStrides(t)).join(",");throw new Error(`indices[${s}] = ${o} is not in [0, ${e})`)}})}function JL(r,t){for(let e=0;e<r.length;++e){let o=r[e],n=e===r.length-1?t:r[e+1].length;if(o.length===0)throw new Error("Ragged splits may not be empty");if(o[0]<0)throw new Error("Ragged splits must be non-negative");if(o[o.length-1]>n)throw new Error("Ragged splits must not point past values");for(let s=1;s<o.length;++s)if(o[s-1]>o[s])throw new Error("Ragged splits must be sorted in ascending order")}}function tB(r,t,e,o){let n=[],s=0,a=t.length-1+e.length,i=new Array(a).fill(null).map(()=>[0]);JL(e,o);let l=1;for(let c=0;c<t.length-1;++c){l*=t[c];let u=t[c+1];for(let p=1;p<l+1;++p)i[c].push(p*u)}for(let c=0;c<r.length;++c){let u=r[c],p=r[c]+1;for(let m=0;m<e.length;++m){let f=e[m],d=m+t.length-1;if(d>=0){let g=i[d],h=g[g.length-1]-f[u];for(let x=u;x<p;++x)i[d].push(f[x+1]+h)}u=f[u],p=f[p]}p!==u&&(n.push([u,p]),s+=p-u)}return{outSplits:i,valueSlices:n,numValues:s}}function eB(r){let t=[];for(let e=0;e<r.length;++e){let o=r[e].length,n=y.getArrayFromDType("int32",o);t.push(n),r[e].forEach((s,a)=>n[a]=s)}return t}function iS(r,t){let e=r.slice(0,t);for(;e.length<t;)e.push(1);for(let o=t;o<r.length;o++)e[t-1]*=r[o];return e}function rB(r,t,e,o,n,s){let a=iS(t,2)[1],i=iS(s,2)[1],l=0;for(let c of e)for(let u=c[0];u<c[1];++u){for(let p=0;p<o;++p)n[l*i+p]=r[u*a+p];++l}}function oB(r,t,e,o,n){let s=t.slice();s[0]=n;let a=y.getArrayFromDType(e,y.sizeFromShape(s)),i=r.length,l=i===0?0:i/t[0];return rB(r,t,o,l,a,s),[a,s]}function tm(r,t,e,o,n,s,a,i){if(r.length===0)throw new Error("paramsNestedSplits must be non empty");if(t[0].length===0)throw new Error("Split tensors must not be scalars");let l=t[0][0]-1;if(ZL(s,a,l),o.length===0)throw new Error("params.rank must be nonzero");let c=o[0],{outSplits:u,valueSlices:p,numValues:m}=tB(s,a,r,c),f=eB(u),d=oB(e,o,n,p,m);return[f,d[0],d[1]]}var lS=2147483647;function em(r,t,e,o,n,s,a){if(t.length>1)throw new Error("starts must be a scalar or vector");if(n.length>1)throw new Error("limits must be a scalar or vector");if(a.length>1)throw new Error("deltas must be a scalar or vector");let i=t.length===0,l=n.length===0,c=a.length===0,u=[];i||u.push(t[0]),l||u.push(n[0]),c||u.push(a[0]);for(let h=1;h<u.length;++h)if(u[h]!==u[h-1])throw new Error("starts, limits, and deltas must have the same shape");let p=u.length===0?1:u[0],m=y.getArrayFromDType("int32",p+1);m[0]=0;for(let h=0;h<p;++h){let x=i?r[0]:r[h],b=l?o[0]:o[h],C=c?s[0]:s[h];if(C===0)throw new Error("Requires delta != 0");let S;if(C>0&&b<x||C<0&&b>x)S=0;else if(S=Math.ceil(Math.abs((b-x)/C)),S>lS)throw new Error(`Requires ((limit - start) / delta) <= ${lS}`);m[h+1]=m[h]+S}let f=m[p],d=y.getArrayFromDType(e,f),g=0;for(let h=0;h<p;++h){let x=m[h+1]-m[h],b=i?r[0]:r[h],C=c?s[0]:s[h];for(let S=0;S<x;++S)d[g++]=b,b+=C}return[m,d]}var Cr=N.RowPartitionType,oy=class r{constructor(t,e,o,n,s,a,i,l,c,u){this.shape=t,this.shapeShape=e,this.values=o,this.valuesShape=n,this.valuesDType=s,this.defaultValue=a,this.defaultValueShape=i,this.rowPartitionValues=l,this.rowPartitionValuesShapes=c,this.rowPartitionTypes=N.getRowPartitionTypesHelper(u),this.raggedRank=N.getRaggedRank(this.rowPartitionTypes)}getRowPartitionTypeByDimension(t){return this.rowPartitionTypes[0]===Cr.FIRST_DIM_SIZE?this.rowPartitionTypes[t+1]:this.rowPartitionTypes[t]}getRowPartitionTensor(t){return this.rowPartitionTypes[0]===Cr.FIRST_DIM_SIZE?this.rowPartitionValues[t+1]:this.rowPartitionValues[t]}getMaxWidth(t){let e=this.getRowPartitionTensor(t-1);switch(this.getRowPartitionTypeByDimension(t-1)){case Cr.VALUE_ROWIDS:return r.getMaxWidthValueRowID(e);case Cr.ROW_SPLITS:return r.getMaxWidthRowSplit(e);default:throw new Error(`Cannot handle partition type ${Cr[this.getRowPartitionTypeByDimension(t-1)]}`)}}static getMaxWidthRowSplit(t){let e=t.length;if(e===0||e===1)return 0;let o=0;for(let n=0;n<e-1;++n){let s=t[n+1]-t[n];s>o&&(o=s)}return o}static getMaxWidthValueRowID(t){let e=t.length;if(e===0)return 0;let o=0,n=t[0],s=0;for(let a=1;a<e;++a){let i=t[a];i!==n&&(n=i,s=Math.max(a-o,s),o=a)}return Math.max(e-o,s)}tensorShapeFromTensor(t,e,o=!0){if(e.length===0){if(t[0]===-1)return[];throw new Error("The only valid scalar shape tensor is the fully unknown shape specified as -1.")}return uS(t,o)}calculateOutputSize(t){let e=this.valuesShape,o=this.defaultValueShape;N.validateDefaultValueShape(o,e);let n=this.tensorShapeFromTensor(this.shape,this.shapeShape),a=N.combineRaggedTensorToTensorShapes(this.raggedRank,n,e);a[0]<0&&(a[0]=t);for(let i=1;i<=this.raggedRank;++i)a[i]<0&&(a[i]=this.getMaxWidth(i));return a}calculateFirstParentOutputIndex(t,e,o){let n=Math.min(t,o),s=[],a=0;for(let i=0;i<n;++i,a+=e)s.push(a);for(let i=n;i<t;++i)s.push(-1);return y.assert(s.length===t,()=>"Final length of result must be equal to firstDimension."),s}calculateOutputIndexRowSplit(t,e,o,n){let s=t.length,a=[];for(let i=0;i<s-1;++i){let l=t[i+1]-t[i],c=Math.min(n,l),u=e[i];u===-1&&(c=0);for(let p=0;p<c;++p)a.push(u),u+=o;for(let p=0;p<l-c;++p)a.push(-1)}if(s>0&&a.length!==t[s-1])throw new Error("Invalid row split size.");return a}calculateOutputIndexValueRowID(t,e,o,n){let s=t.length,a=[];if(s===0)return[];let i=0,l=t[0];if(l>=e.length)throw new Error(`Got currentValueRowId=${l}, which is not less than ${e.length}`);let c=e[l];a.push(c);for(let u=1;u<s;++u){let p=t[u];if(p===l)c>=0&&(++i,i<n?c+=o:c=-1);else{if(i=0,l=p,p>=e.length)throw new Error(`Got nextValueRowId=${p} which is not less than ${e.length}`);c=e[p]}a.push(c)}if(a.length!==t.length)throw new Error("Invalid row ids.");return a}calculateOutputIndex(t,e,o,n){let s=this.getRowPartitionTensor(t),a=this.getRowPartitionTypeByDimension(t);switch(a){case Cr.VALUE_ROWIDS:return this.calculateOutputIndexValueRowID(s,e,o,n);case Cr.ROW_SPLITS:if(s.length-1>e.length)throw new Error(`Row partition size is greater than output size: ${s.length-1} > ${e.length}`);return this.calculateOutputIndexRowSplit(s,e,o,n);default:throw new Error(`Unsupported partition type: ${Cr[a]}`)}}getFirstDimensionSize(){let t=this.rowPartitionValues[0];if(this.rowPartitionTypes.length===0)throw new Error("No row_partition_types given.");let e=this.rowPartitionTypes[0];switch(e){case Cr.FIRST_DIM_SIZE:return t[0];case Cr.VALUE_ROWIDS:throw new Error("Cannot handle VALUE_ROWIDS in first dimension.");case Cr.ROW_SPLITS:return this.rowPartitionValuesShapes[0][0]-1;default:throw new Error(`Cannot handle type ${Cr[e]}`)}}compute(){if(this.rowPartitionValues[0].length<=0)throw new Error("Invalid first partition input. Tensor requires at least one element.");let e=this.getFirstDimensionSize(),o=this.calculateOutputSize(e),n=new Array(this.raggedRank+1);n[n.length-1]=1;for(let l=n.length-2;l>=0;--l)n[l]=n[l+1]*o[l+1];let s=uS(o,!1),a=y.getArrayFromDType(this.valuesDType,y.sizeFromShape(s));if(n[0]*o[0]>0){let l=this.calculateFirstParentOutputIndex(e,n[0],o[0]);for(let c=1;c<=this.raggedRank;++c)l=this.calculateOutputIndex(c-1,l,n[c],o[c]);this.setOutput(this.raggedRank,l,a,s)}return[s,a]}setOutput(t,e,o,n){if(o.length===0)return;let s=this.values,a=o,i=n.slice();i=i.slice(t+1);let l=y.sizeFromShape(i),c=e.length,u=this.defaultValue;if(u.length!==l&&u.length!==1){let d=this.defaultValueShape;at(()=>{let g=L(u,d);u=ko(g,i).dataSync()})}let p=0,m=0,f=0;for(let d=0;d<=c;++d){let g=d<c?e[d]:-1;if(g===f){++f;continue}if(m<f){let h=s.subarray(p*l),x=a.subarray(m*l),b=(f-m)*l;cS(x,h,b)}if(d>=c){let h=o.length;g=Math.floor(h/l)}if(g>f)if(this.defaultValue.length===1)a.subarray(f*l,g*l).fill(this.defaultValue[0]),f=g;else for(;g>f;){let h=a.slice(f*l);cS(h,u,l),++f}g<0?(p=d+1,m=f):(p=d,m=f,f=m+1)}}};function cS(r,t,e){for(let o=0;o<e;o++)r[o]=t[o]}function uS(r,t){let e=[];for(let o of r){if(o<0){if(!t)throw new Error(`Dimension ${o} must be >= 0`);if(o<-1)throw new Error(`Dimension ${o} must be >= -1`);o=-1}e.push(o)}return e}function rm(r,t,e,o,n,s,a,i,l,c){return new oy(r,t,e,o,n,s,a,i,l,c).compute()}function om(r,t,e,o){let n=r===t,s=r<t&&e<0,a=t<r&&e>1;if(n||s||a)return y.makeZerosTypedArray(0,o);let i=Math.abs(Math.ceil((t-r)/e)),l=y.makeZerosTypedArray(i,o);t<r&&e===1&&(e=-1),l[0]=r;for(let c=1;c<l.length;c++)l[c]=l[c-1]+e;return l}var ny=ge(r=>1/Math.sqrt(r)),nB=Qe(Rn,ny),pS={kernelName:Rn,backendName:"cpu",kernelFunc:nB};function Mr(r,t,e,o,n,s,a,i,l,c){let u=[o/n,n],p=r.values,m=t.values;if(o===0)return ot(e,t.dtype);let f=l instanceof $t?l:ot(u,t.dtype);typeof l=="string"||typeof l=="number"?f.values.fill(l):typeof l=="boolean"&&f.values.fill(+l);for(let d=0;d<s;d++){let g=[],h=0;for(let x=0;x<a;x++){let b=p[d*a+x];g.push(b),h+=b*i[x]}if(h<0||h>=o/n)throw new Error(`Invalid indices: ${g} does not index into ${e}`);for(let x=0;x<n;x++)c?f.values[h*n+x]+=m[d*n+x]:f.values[h*n+x]=t.rank===0?m[0]:m[d*n+x]}return f}var mS=ge(r=>1/(1+Math.exp(-r))),sy=ut(Dn,r=>1/(1+Math.exp(-r))),fS={kernelName:Dn,backendName:"cpu",kernelFunc:sy};function ay(r,t,e,o,n){let s=me.isSliceContinous(o,t,e),a=y.sizeFromShape(e),i=y.computeStrides(o);if(s){let p=me.computeFlatOffset(t,i);return n==="string"?r.slice(p,p+a):r.subarray(p,p+a)}let l=n==="string"?N.fromUint8ToStringArray(r):r,c=ot(o,n,l),u=ot(e,n);for(let p=0;p<u.size;++p){let m=u.indexToLoc(p),f=m.map((d,g)=>d+t[g]);u.set(c.get(...f),...m)}return n==="string"?N.fromStringArrayToUint8(u.values):u.values}function Tr(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{begin:s,size:a}=o;U(n,"slice");let[i,l]=me.parseSliceParams(n,s,a);me.assertParamsValid(n,i,l);let c=e.data.get(n.dataId).values,u=ay(c,i,l,n.shape,n.dtype);return e.makeTensorInfo(l,n.dtype,u)}var dS={kernelName:Wa,backendName:"cpu",kernelFunc:Tr};function nm(r,t,e,o,n,s,a){let i=t[0],l=s[0],c=new Array(l),u=new Array(i),p=t[1];if(l===0){if(i!==0)throw new Error(N.getSparseFillEmptyRowsIndicesDenseShapeMismatch(i));let h=y.getArrayFromDType(e,0),x=y.getArrayFromDType(n,0);return[h,[0,p],x,c,u]}let m=!0,f=0,d=new Array(l).fill(0);for(let h=0;h<i;++h){let x=r[h*p];if(x<0)throw new Error(N.getSparseFillEmptyRowsNegativeIndexErrorMessage(h,x));if(x>=l)throw new Error(N.getSparseFillEmptyRowsOutOfRangeIndexErrorMessage(h,x,l));++d[x],m=m&&x>=f,f=x}let g=!0;for(let h=0;h<l;++h){let x=d[h]===0;c[h]=x,g=g&&!x,d[h]=Math.max(d[h],1),h>0&&(d[h]+=d[h-1])}if(g&&m){let h=r,x=o;for(let b=0;b<i;++b)u[b]=b;return[h,[i,p],x,c,u]}else{let h=d[l-1],x=y.getArrayFromDType(e,h*p),b=y.getArrayFromDType(n,h),C=new Array(l).fill(0);for(let S=0;S<i;++S){let I=r[S*p],$=C[I],R=(I===0?0:d[I-1])+$;C[I]++;for(let A=0;A<p;++A)x[R*p+A]=r[S*p+A];b[R]=o[S],u[S]=R}for(let S=0;S<l;++S)if(C[S]===0){let $=S===0?0:d[S-1];x[$*p+0]=S;for(let R=1;R<p;++R)x[$*p+R]=0;b[$]=a}return[x,[h,p],b,c,u]}}function sm(r,t,e,o,n){let s=y.sizeFromShape(o),a=t[0],i=n.length,l=[],c=1,u=-1;for(let h=0;h<i;++h){let x=n[h];if(x===-1){if(u!==-1)throw new Error(N.getSparseReshapeMultipleNegativeOneOutputDimErrorMessage(u,h));u=h,l.push(1)}else{if(x<0)throw new Error(N.getSparseReshapeNegativeOutputDimErrorMessage(h,x));c*=x,l.push(x)}}if(u!==-1){if(c<=0)throw new Error(N.getSparseReshapeEmptyTensorZeroOutputDimErrorMessage());let h=Math.trunc(s/c);if(c*h!==s)throw new Error(N.getSparseReshapeInputOutputMultipleErrorMessage(o,l));l[u]=h}if(y.sizeFromShape(l)!==s)throw new Error(N.getSparseReshapeInputOutputMismatchErrorMessage(o,l));let m=o.length,f=[];if(m>0){f[m-1]=1;for(let h=m-2;h>=0;--h)f[h]=f[h+1]*o[h+1]}let d=[];if(i>0){d[i-1]=1;for(let h=i-2;h>=0;--h)d[h]=d[h+1]*l[h+1]}let g=y.getArrayFromDType(e,a*i);for(let h=0;h<a;++h){let x=0;for(let b=0;b<m;++b)x+=r[h*m+b]*f[b];for(let b=0;b<i;++b)g[h*i+b]=Math.trunc(x/d[b]),x%=d[b]}return[g,[a,i],l]}function zl(r,t,e,o,n,s=!1,a=0){let i=o.length,l=[t[0],r.length/t[0]],c=l[1],p=i>0?n[i-1]+1:0;if(p<0)throw new Error(N.getSparseSegmentReductionNegativeSegmentIdsErrorMessage());let m=t.slice();m[0]=p;let f=m.reduce((C,S)=>C*S,1),d=y.getArrayFromDType(e,f);if(i===0)return p>0&&d.fill(a),[d,m];if(p<=0)throw new Error(N.getSparseSegmentReductionNegativeSegmentIdsErrorMessage());let g=0,h=1,x=0,b=n[g];for(;;){let C=0;if(h<i){if(C=n[h],b===C){++h;continue}if(b>=C)throw new Error(N.getSparseSegmentReductionNonIncreasingSegmentIdsErrorMessage())}if(b<0||b>=p)throw new Error(N.getSparseSegmentReductionSegmentIdOutOfRangeErrorMessage(b,p));b>x&&d.fill(a,x*c,b*c);for(let S=g;S<h;++S){let I=o[S];if(I<0||I>=l[0])throw new Error(N.getSparseSegmentReductionIndicesOutOfRangeErrorMessage(S,o[S],l[0]));for(let $=0;$<c;$++)d[b*c+$]+=r[I*c+$]}if(s)for(let S=0;S<c;S++)d[b*c+S]/=h-g;if(g=h,++h,x=b+1,b=C,h>i)break}return x<p&&d.fill(a,x*c,p*c),[d,m]}var hS=ge(r=>Math.sqrt(r)),sB=ut(Pn,r=>Math.sqrt(r)),gS={kernelName:Pn,backendName:"cpu",kernelFunc:sB};var iy=wt(((r,t)=>{let e=r-t;return e*e})),aB=It(Mn,iy),xS={kernelName:Mn,backendName:"cpu",kernelFunc:aB};var ly=ge((r,t)=>{let{pattern:e,replaceGlobal:o,rewrite:n}=t;return r.replace(new RegExp(e,o?"g":""),n)}),iB=Qe(Ln,ly),yS={kernelName:Ln,backendName:"cpu",kernelFunc:iB};function am(r,t,e,o){let n=ot(r,t.dtype);for(let s=0;s<n.size;s++){let a=n.indexToLoc(s),i=new Array(a.length);for(let l=0;l<i.length;l++)i[l]=a[l]*e[l]+o[l];n.set(t.get(...i),...a)}return n}var cy=class{constructor(t,e,o,n,s,a){this.separator=y.encodeString(t),this.nGramWidths=e,this.leftPad=y.encodeString(o),this.rightPad=y.encodeString(n),this.padWidth=s,this.preserveShort=a}getPadWidth(t){return Math.min(this.padWidth<0?t-1:this.padWidth,t-1)}getNumNGrams(t,e){let o=this.getPadWidth(e);return Math.max(0,t+2*o-e+1)}createNGrams(t,e,o,n,s,a){for(let i=0;i<s;++i){let l=this.getPadWidth(a),c=Math.max(0,l-i),u=Math.max(0,l-(s-(i+1))),p=a-(c+u),m=e+(c>0?0:i-l),f=0;f+=c*this.leftPad.length;for(let b=0;b<p;++b)f+=t[m+b].length;f+=u*this.rightPad.length;let d=c+u+p-1;f+=d*this.separator.length,o[n+i]=new Uint8Array(f);let g=o[n+i],h=0,x=b=>b.forEach(C=>g[h++]=C);for(let b=0;b<c;++b)x(this.leftPad),x(this.separator);for(let b=0;b<p-1;++b)x(t[m+b]),x(this.separator);if(p>0){x(t[m+p-1]);for(let b=0;b<u;++b)x(this.separator),x(this.rightPad)}else{for(let b=0;b<u-1;++b)x(this.rightPad),x(this.separator);x(this.rightPad)}}}compute(t,e){let o=t.length,n=e.length;if(n>0){let l=e[0];if(l!==0)throw new Error(`First split value must be 0, got ${l}`);for(let c=1;c<n;++c){let u=e[c]>=l;if(u=u&&e[c]<=o,!u)throw new Error(`Invalid split value ${e[c]}, must be in [${l}, ${o}]`);l=e[c]}if(l!==o)throw new Error(`Last split value must be data size. Expected ${o}, got ${l}`)}let s=n-1,a=y.getArrayFromDType("int32",n);if(o===0||n===0){let l=new Array(o);for(let c=0;c<=s;++c)a[c]=0;return[l,a]}a[0]=0;for(let l=1;l<=s;++l){let c=e[l]-e[l-1],u=0;this.nGramWidths.forEach(p=>{u+=this.getNumNGrams(c,p)}),this.preserveShort&&c>0&&u===0&&(u=1),a[l]=a[l-1]+u}let i=new Array(a[s]);for(let l=0;l<s;++l){let c=e[l],u=a[l];if(this.nGramWidths.forEach(p=>{let m=e[l+1]-e[l],f=this.getNumNGrams(m,p);this.createNGrams(t,c,i,u,f,p),u+=f}),this.preserveShort&&u===a[l]){let p=e[l+1]-e[l];if(p===0)continue;let m=p+2*this.padWidth;this.createNGrams(t,c,i,u,1,m)}}return[i,a]}};function im(r,t,e,o,n,s,a,i){return new cy(e,o,n,s,a,i).compute(r,t)}function lB(r,t,e,o){if(!r.length)return;if(t.length===0){for(let s=0;s<r.length;++s)o.push(r.subarray(s,s+1));return}if(t.length===1){let s=t[0],a=r.indexOf(s);for(;a!==-1;){let i=r.subarray(0,a);(!e||i.length!==0)&&o.push(i),r=r.subarray(a+1),a=r.indexOf(s)}(!e||r.length!==0)&&o.push(r);return}let n=0;for(let s=0;s<r.length+1;s++)if(s===r.length||t.indexOf(r[s])!==-1){let a=r.subarray(n,s);(!e||a.length!==0)&&o.push(a),n=s+1}}function lm(r,t,e){let o=r.length,n=[],s=0,a=0,i=new Array(o);for(let m=0;m<o;++m){let f=n.length;lB(r[m],t,e,n);let d=n.length-f;i[m]=d,s+=d,a=Math.max(a,d)}let l=y.getArrayFromDType("int32",s*2),c=new Array(s),u=[o,a],p=0;for(let m=0;m<o;++m)for(let f=0;f<i[m];++f)l[p*2]=m,l[p*2+1]=f,c[p]=n[p],++p;return[l,c,u]}function cm(r,t){let e=y.getArrayFromDType("int32",r.length);for(let o=0;o<r.length;++o)e[o]=y.fingerPrint64(r[o]).modulo(t).getLowBitsUnsigned();return e}var uy=wt(((r,t)=>r-t)),cB=Ll(((r,t,e,o)=>({real:r-e,imag:t-o}))),wu=It("Sub",uy,cB),bS={kernelName:"Sub",backendName:"cpu",kernelFunc:wu};function um(r,t){let e=new Array(r.rank);for(let n=0;n<e.length;n++)e[n]=r.shape[n]*t[n];let o=ot(e,r.dtype);for(let n=0;n<o.values.length;++n){let s=o.indexToLoc(n),a=new Array(r.rank);for(let l=0;l<a.length;l++)a[l]=s[l]%r.shape[l];let i=r.locToIndex(a);o.values[n]=r.values[i]}return o}var vu=(r,t)=>{let e=t.value-r.value;return e===0?r.index-t.index:e};function wS(r,t,e=0,o=r.length-1){for(;o>e;){if(o-e>600){let i=o-e+1,l=t-e+1,c=Math.log(i),u=.5*Math.exp(2*c/3),p=.5*Math.sqrt(c*u*(i-u)/i)*Math.sign(l-i/2),m=Math.max(e,Math.floor(t-l*u/i+p)),f=Math.min(o,Math.floor(t+(i-l)*u/i+p));wS(r,t,m,f)}let n=r[t],s=e,a=o;for(y.swap(r,e,t),vu(r[o],n)>0&&y.swap(r,e,o);s<a;){for(y.swap(r,s,a),s++,a--;vu(r[s],n)<0;)s=s+1;for(;vu(r[a],n)>0;)a=a-1}vu(r[e],n)===0?y.swap(r,e,a):(a=a+1,y.swap(r,a,o)),a<=t&&(e=a+1),t<=a&&(o=a-1)}}function pm(r,t,e,o,n){let s=t[t.length-1],[a,i]=[r.length/s,s],l=y.getTypedArrayFromDType(e,a*o),c=y.getTypedArrayFromDType("int32",a*o);for(let p=0;p<a;p++){let m=p*i,f=r.subarray(m,m+i),d=new Array(f.length);f.forEach((b,C)=>d[C]={value:b,index:C}),o<d.length&&(wS(d,o),d=d.slice(0,o)),n&&d.sort(vu);let g=p*o,h=l.subarray(g,g+o),x=c.subarray(g,g+o);for(let b=0;b<o;b++)h[b]=d[b].value,x[b]=d[b].index}let u=t.slice();return u[u.length-1]=o,[ot(u,e,l),ot(u,"int32",c)]}function mm(r,t,e,o){let n=y.parseAxisParam(t,e)[0],s=[1,e[0],1];for(let d=0;d<n;d++)s[0]*=e[d];s[1]=e[n];for(let d=n+1;d<e.length;d++)s[2]*=e[d];let a=new Map,i=new Int32Array(e[n]),l=new $t(s,o,r),c=[],u=s[0]===1&&s[2]===1;for(let d=0;d<e[n];d++){let g;if(u)g=r[d].toString();else{let x=[];for(let b=0;b<s[0];b++)for(let C=0;C<s[2];C++)x.push(l.get(b,d,C));g=x.join(",")}let h=a.get(g);if(h!=null)i[d]=h;else{let x=a.size;a.set(g,x),i[d]=x,c.push(d)}}let p=s.slice();p[1]=a.size;let m=new $t(p,o);c.forEach((d,g)=>{for(let h=0;h<s[0];h++)for(let x=0;x<s[2];x++)m.set(l.get(h,d,x),h,g,x)});let f=e.slice();return f[n]=p[1],{outputValues:m.values,outputShape:f,indices:i}}var{addImpl:vS,bincountImpl:fm,bincountReduceImpl:SS,bitwiseAndImpl:CS,castImpl:TS,ceilImpl:NS,concatImpl:IS,equalImpl:kS,expImpl:ES,expm1Impl:$S,floorImpl:RS,gatherNdImpl:AS,gatherV2Impl:FS,greaterImpl:_S,greaterEqualImpl:DS,lessImpl:OS,lessEqualImpl:PS,linSpaceImpl:MS,logImpl:LS,maxImpl:BS,maximumImpl:VS,minimumImpl:zS,multiplyImpl:WS,negImpl:GS,notEqualImpl:US,prodImpl:HS,raggedGatherImpl:KS,raggedRangeImpl:qS,raggedTensorToTensorImpl:jS,rangeImpl:XS,rsqrtImpl:YS,scatterImpl:QS,sigmoidImpl:ZS,simpleAbsImpl:dm,sliceImpl:JS,sparseFillEmptyRowsImpl:tC,sparseReshapeImpl:eC,sparseSegmentReductionImpl:hm,sqrtImpl:rC,staticRegexReplaceImpl:oC,stridedSliceImpl:nC,stringNGramsImpl:sC,stringSplitImpl:aC,stringToHashBucketFastImpl:iC,subImpl:lC,tileImpl:cC,topKImpl:uC,transposeImpl:Bi,uniqueImpl:pC}=py;function my(r,t){return["x","y","z","w","u","v"].slice(0,t).map(e=>`${r}.${e}`)}function ee(r,t){return t===1?[r]:my(r,t)}function mC(r,t){if(r===1)return"rc";let e="";for(let o=0;o<r;o++)e+=t[o],o<r-1&&(e+=",");return e}var gm=class{constructor(t){if(this.variableNames=["A"],this.packedInputs=!1,this.packedOutput=!0,this.outputShape=t,this.rank=t.length,this.enableShapeUniforms=Mt(this.outputShape.length),this.rank===0)this.userCode=`
        void main() {
          setOutput(vec4(getA(), 0., 0., 0.));
        }
      `;else{let e=ee("rc",this.rank),o=ht(this.rank),n=this.getOutOfBoundsCondition(e),s=this.getSetup(e),a=this.getOutput(e);this.userCode=`
        void main() {
          ${o} rc = getOutputCoords();

          if(${n}) {
            setOutput(vec4(0));
          } else {
            ${s}

            setOutput(vec4(${a}));
          }
        }
      `}}getSourceCoordsArr(t){let e=[];for(let o=0;o<=1;o++)for(let n=0;n<=1;n++){let s=`${o===0?"r":"rp1"}, ${n===0?"c":"cp1"}`;for(let a=2;a<this.rank;a++)s=`${t[t.length-1-a]},`+s;e.push(s)}return e}getOutOfBoundsCondition(t){if(this.rank===1)return`rc > ${this.enableShapeUniforms?"outShape":this.outputShape[0]}`;let e="";for(let o=this.rank-2;o<this.rank;o++)e+=`${t[o]} >= ${this.enableShapeUniforms?`outShape[${o}]`:this.outputShape[o]}`,o<this.rank-1&&(e+="||");return e}getSetup(t){if(this.rank===1)return"";let e=t.slice(-2),o=this.enableShapeUniforms?`outShape[${this.rank} - 1]`:this.outputShape[this.rank-1],n=this.enableShapeUniforms?`outShape[${this.rank} - 2]`:this.outputShape[this.rank-2];return`
      int r = ${e[0]};
      int c = ${e[1]};
      int rp1 = r + 1;
      int cp1 = c + 1;

      bool cEdge = cp1 >= ${o};
      bool rEdge = rp1 >= ${n};
    `}getOutput(t){let e=this.getSourceCoordsArr(t);return this.rank===1?`getA(rc), (rc + 1 >= ${this.enableShapeUniforms?"outShape":this.outputShape[0]} ? 0. : getA(rc + 1)), 0, 0`:`getA(${e[0]}),
            cEdge ? 0. : getA(${e[1]}),
            rEdge ? 0. : getA(${e[2]}),
            rEdge || cEdge ? 0. : getA(${e[3]})`}};var Wl=class{constructor(t,e){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"inputShape",type:"ivec3"}],this.outputShape=t,this.enableShapeUniforms=Mt(this.outputShape.length);let o="";for(let n=0;n<4;n++){let s="thisRC = rc;";n%2===1&&(s+="thisRC.z += 1;"),n>1&&(s+="thisRC.y += 1;"),o+=`
        ${s}
        ${n>0?"if(thisRC.y < rows && thisRC.z < cols){":""}
          int flatIndex = getFlatIndex(thisRC);

          ivec3 inputRC = inputCoordsFromReshapedOutCoords(flatIndex);
          vec2 inputRCInnerDims = vec2(float(inputRC.y),float(inputRC.z));

          result[${n}] =
            getChannel(getA(inputRC.x, inputRC.y, inputRC.z), inputRCInnerDims);
        ${n>0?"}":""}
      `}this.userCode=`
      ${uB(e,this.enableShapeUniforms)}
      ${this.enableShapeUniforms?Rl():$l(t)}

      void main() {
        ivec3 rc = getOutputCoords();

        vec4 result = vec4(0.);

        ivec3 thisRC;
        int rows = ${this.enableShapeUniforms?"outShape[1]":t[1]};
        int cols = ${this.enableShapeUniforms?"outShape[2]":t[2]};

        ${o}

        setOutput(result);
      }
    `}};function uB(r,t){return`
    ivec3 inputCoordsFromReshapedOutCoords(int index) {
      ${t?p1(["r","c","d"],"inputShape"):Pr(["r","c","d"],r)}
      return ivec3(r, c, d);
    }
  `}var xm=class{constructor(t){this.gpgpu=t,this.numUsedTextures=0,this.numFreeTextures=0,this._numBytesAllocated=0,this._numBytesFree=0,this.freeTextures={},this.usedTextures={},this.logEnabled=!1}acquireTexture(t,e,o){let n=dC(e,o),s=hC(t,n,o);s in this.freeTextures||(this.freeTextures[s]=[]),s in this.usedTextures||(this.usedTextures[s]=[]);let a=fC(t,n,this.gpgpu.gl,this.gpgpu.textureConfig,o);if(this.freeTextures[s].length>0){this.numFreeTextures--,this.numUsedTextures++,this._numBytesFree-=a,this.log();let l=this.freeTextures[s].pop();return this.usedTextures[s].push(l),l}let i;return n===we.PACKED_2X2_FLOAT32?i=this.gpgpu.createPackedMatrixTexture(t[0],t[1]):n===we.PACKED_2X2_FLOAT16?i=this.gpgpu.createFloat16PackedMatrixTexture(t[0],t[1]):n===we.UNPACKED_FLOAT32?i=this.gpgpu.createFloat32MatrixTexture(t[0],t[1]):n===we.UNPACKED_FLOAT16?i=this.gpgpu.createFloat16MatrixTexture(t[0],t[1]):n===we.PACKED_4X1_UNSIGNED_BYTE&&(i=this.gpgpu.createUnsignedBytesMatrixTexture(t[0],t[1])),this.usedTextures[s].push(i),this.numUsedTextures++,this._numBytesAllocated+=a,this.log(),i}releaseTexture(t,e,o,n){if(this.freeTextures==null)return;let s=dC(o,n),a=hC(e,s,n);a in this.freeTextures||(this.freeTextures[a]=[]);let i=fC(e,s,this.gpgpu.gl,this.gpgpu.textureConfig,n),l=D().getNumber("WEBGL_DELETE_TEXTURE_THRESHOLD");l!==-1&&this._numBytesAllocated>l?(this.gpgpu.deleteMatrixTexture(t.texture),this._numBytesAllocated-=i):(this.freeTextures[a].push(t),this.numFreeTextures++,this._numBytesFree+=i),this.numUsedTextures--;let c=this.usedTextures[a],u=c&&c.indexOf(t);if(u==null||u<0)throw new Error("Cannot release a texture that was never provided by this texture manager");c[u]=c[c.length-1],c.pop(),this.log()}log(){if(!this.logEnabled)return;let t=this.numFreeTextures+this.numUsedTextures;console.log("Free/Used",`${this.numFreeTextures} / ${this.numUsedTextures}`,`(${t})`);let e=this._numBytesFree/this._numBytesAllocated;console.log(`Bytes allocated: ${this._numBytesAllocated}`),console.log(`Bytes unused: ${this._numBytesFree} (${Math.round(100*e)}%)`)}get numBytesAllocated(){return this._numBytesAllocated}get numBytesFree(){return this._numBytesFree}getNumUsedTextures(){return this.numUsedTextures}getNumFreeTextures(){return this.numFreeTextures}dispose(){if(this.freeTextures!=null){for(let t in this.freeTextures)this.freeTextures[t].forEach(e=>{this.gpgpu.deleteMatrixTexture(e.texture)});for(let t in this.usedTextures)this.usedTextures[t].forEach(e=>{this.gpgpu.deleteMatrixTexture(e.texture)});this.freeTextures=null,this.usedTextures=null,this.numUsedTextures=0,this.numFreeTextures=0,this._numBytesAllocated=0,this._numBytesFree=0}}};function pB(r,t){let e=r;if(t===e.R32F)return 4;if(t===e.R16F)return 2;if(t===e.RGBA32F)return 16;if(t===r.RGBA)return 16;if(t===e.RGBA16F)return 8;if(t===e.RGBA8)return 4;throw new Error(`Unknown internal format ${t}`)}function fC(r,t,e,o,n){let s=mB(t,o),a;if(n){let[l,c]=ao(r[0],r[1]);a=l*c}else{let[l,c]=Di(r[0],r[1]);a=l*c}let i=pB(e,s);return a*i}function mB(r,t){switch(r){case we.PACKED_2X2_FLOAT32:return _x(t);case we.PACKED_2X2_FLOAT16:return Dx(t);case we.UNPACKED_FLOAT32:return Rx(t);case we.UNPACKED_FLOAT16:return Ax(t);case we.PACKED_4X1_UNSIGNED_BYTE:return Fx(t);default:throw new Error(`Unknown physical texture type ${r}`)}}function fB(r){return D().getBool("WEBGL_RENDER_FLOAT32_ENABLED")?r?we.PACKED_2X2_FLOAT32:we.UNPACKED_FLOAT32:r?we.PACKED_2X2_FLOAT16:we.UNPACKED_FLOAT16}function dC(r,t){if(r===ke.UPLOAD)return we.PACKED_2X2_FLOAT32;if(r===ke.RENDER||r==null)return fB(t);if(r===ke.DOWNLOAD||r===ke.PIXELS)return we.PACKED_4X1_UNSIGNED_BYTE;throw new Error(`Unknown logical texture type ${r}`)}function hC(r,t,e){return`${r[0]}_${r[1]}_${t}_${e}`}var ve=class{constructor(t,e){this.variableNames=["A"],this.outputShape=t,this.enableShapeUniforms=Mt(this.outputShape.length),this.userCode=`
      float unaryOperation(float x) {
        ${e}
      }

      void main() {
        float x = getAAtOutCoords();
        float y = unaryOperation(x);

        setOutput(y);
      }
    `}},pe="if (isnan(x)) return x;",gC="return x;",fy="return abs(x);";var xC="return (x >= 0.0) ? x : (exp(x) - 1.0);",yC=pe+`
  return (x < 0.0) ? 0.0 : x;
`,bC=pe+`
  return (x < 0.0) ? 0.0 : min(6.0, x);
`,co="return x;",wC="return 1.0 / (1.0 + exp(-1.0 * x));";var SC="return x;",CC=`
  vec4 result;

  result.r = (x.r >= 0.0) ? x.r : (exp(x.r) - 1.0);
  result.g = (x.g >= 0.0) ? x.g : (exp(x.g) - 1.0);
  result.b = (x.b >= 0.0) ? x.b : (exp(x.b) - 1.0);
  result.a = (x.a >= 0.0) ? x.a : (exp(x.a) - 1.0);

  return result;
`,TC=`
  vec4 result = x * vec4(greaterThanEqual(x, vec4(0.0)));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,NC=`
  vec4 result = min(x, vec4(6.)) * vec4(greaterThanEqual(x, vec4(0.0)));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,IC="return 1.0 / (1.0 + exp(-1.0 * x));",Ze=class{constructor(t,e){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=t,this.enableShapeUniforms=Mt(this.outputShape.length),this.userCode=`
      vec4 unaryOperation(vec4 x) {
        ${e}
      }

      void main() {
        vec4 x = getAAtOutCoords();
        vec4 y = unaryOperation(x);

        setOutput(y);
      }
    `}};var ym=class{constructor(t){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!1,this.outputShape=t,this.enableShapeUniforms=Mt(this.outputShape.length);let e=t.length,o=ee("rc",e),n=ht(e),s=mC(e,o),a=o.slice(-2),i=e<=1?"rc":`vec2(${a.join(",")})`;this.userCode=`
      void main() {
        ${n} rc = getOutputCoords();
        vec4 packedInput = getA(${s});

        setOutput(getChannel(packedInput, ${i}));
      }
    `}};var hB=be.whereImpl,gB=1e-7,xB=1e-4,bm={};function yB(r){return r in bm||(bm[r]={}),bm[r]}var bB=D().getNumber("CPU_HANDOFF_SIZE_THRESHOLD"),wB=600;function vB(){return D().global.screen==null?1024:D().global.screen.height*D().global.screen.width*window.devicePixelRatio*wB/1024/1024}var Su=class r extends Wr{nextDataId(){return r.nextDataId++}constructor(t){if(super(),this.pendingRead=new WeakMap,this.pendingDisposal=new WeakSet,this.dataRefCount=new WeakMap,this.numBytesInGPU=0,this.uploadWaitMs=0,this.downloadWaitMs=0,this.lastGlFlushTime=0,this.warnedAboutMemory=!1,this.pendingDeletes=0,this.disposed=!1,!D().getBool("HAS_WEBGL"))throw new Error("WebGL is not supported on this device");let e;if(t!=null){if(t instanceof Pl)e=t;else{let o=lr(D().getNumber("WEBGL_VERSION"),t);e=new Pl(o)}this.binaryCache={},this.gpgpuCreatedLocally=!1}else{let o=lr(D().getNumber("WEBGL_VERSION"));e=new Pl(o),this.binaryCache=yB(D().getNumber("WEBGL_VERSION")),this.gpgpuCreatedLocally=!0}this.gpgpu=e,this.canvas=this.gpgpu.gl.canvas,this.textureManager=new xm(this.gpgpu),this.numMBBeforeWarning=vB(),this.texData=new Ho(this,Re())}numDataIds(){return this.texData.numDataIds()-this.pendingDeletes}writeTexture(t,e,o,n,s,a){let i=this.makeTensorInfo(e,o),l=this.texData.get(i.dataId);l.isPacked=!1,l.texture={texture:t,texShape:[n,s]},l.texShape=[n,s];let c=gu(e),u=new xu(c,!1,a),p=this.runWebGLProgram(u,[i],o,[[n,s]]);return p.shape=e,l.texture=null,this.disposeIntermediateTensorInfo(i),p.dataId}write(t,e,o){if((D().getBool("WEBGL_CHECK_NUMERICAL_PROBLEMS")||D().getBool("DEBUG"))&&this.checkNumericalProblems(t),o==="complex64"&&t!=null)throw new Error("Cannot write to a complex64 dtype. Please use tf.complex(real, imag).");let n={id:this.nextDataId()};return this.texData.set(n,{shape:e,dtype:o,values:t,usage:ke.UPLOAD,refCount:1}),n}refCount(t){return this.texData.has(t)?this.texData.get(t).refCount:0}incRef(t){let e=this.texData.get(t);e.refCount++}decRef(t){if(this.texData.has(t)){let e=this.texData.get(t);e.refCount--}}move(t,e,o,n,s){if(D().getBool("DEBUG")&&this.checkNumericalProblems(e),n==="complex64")throw new Error("Cannot write to a complex64 dtype. Please use tf.complex(real, imag).");this.texData.set(t,{shape:o,dtype:n,values:e,usage:ke.UPLOAD,refCount:s})}disposeIntermediateTensorInfo(t){this.disposeData(t.dataId)}readSync(t){let e=this.texData.get(t),{values:o,dtype:n,complexTensorInfos:s,slice:a,shape:i,isPacked:l}=e;if(a!=null){let m;l?m=new Ze(i,co):m=new ve(i,co);let f=this.runWebGLProgram(m,[{dataId:t,shape:i,dtype:n}],n),d=this.readSync(f.dataId);return this.disposeIntermediateTensorInfo(f),d}if(o!=null)return this.convertAndCacheOnCPU(t);if(n==="string")return o;let c=this.activeTimers!=null,u;c&&(u=y.now());let p;if(n==="complex64"){let m=this.readSync(s.real.dataId),f=this.readSync(s.imag.dataId);p=N.mergeRealAndImagArrays(m,f)}else p=this.getValuesFromTexture(t);return c&&(this.downloadWaitMs+=y.now()-u),this.convertAndCacheOnCPU(t,p)}async read(t){if(this.pendingRead.has(t)){let d=this.pendingRead.get(t);return new Promise(g=>d.push(g))}let e=this.texData.get(t),{values:o,shape:n,slice:s,dtype:a,complexTensorInfos:i,isPacked:l}=e;if(s!=null){let d;l?d=new Ze(n,co):d=new ve(n,co);let g=this.runWebGLProgram(d,[{dataId:t,shape:n,dtype:a}],a),h=this.read(g.dataId);return this.disposeIntermediateTensorInfo(g),h}if(o!=null)return this.convertAndCacheOnCPU(t);if(D().getBool("DEBUG")&&!D().getBool("WEBGL_DOWNLOAD_FLOAT_ENABLED")&&D().getNumber("WEBGL_VERSION")===2)throw new Error("tensor.data() with WEBGL_DOWNLOAD_FLOAT_ENABLED=false and WEBGL_VERSION=2 not yet supported.");let c=null,u;if(a!=="complex64"&&D().get("WEBGL_BUFFER_SUPPORTED")){u=this.decode(t);let d=this.texData.get(u.dataId);c=this.gpgpu.createBufferFromTexture(d.texture.texture,...mu(n))}this.pendingRead.set(t,[]),a!=="complex64"&&await this.gpgpu.createAndWaitForFence();let p;if(a==="complex64"){let d=await Promise.all([this.read(i.real.dataId),this.read(i.imag.dataId)]),g=d[0],h=d[1];p=N.mergeRealAndImagArrays(g,h)}else if(c==null)p=this.getValuesFromTexture(t);else{let d=y.sizeFromShape(n);p=this.gpgpu.downloadFloat32MatrixFromBuffer(c,d)}if(u!=null&&this.disposeIntermediateTensorInfo(u),c!=null){let d=this.gpgpu.gl;rt(d,()=>d.deleteBuffer(c))}let m=this.convertAndCacheOnCPU(t,p),f=this.pendingRead.get(t);return this.pendingRead.delete(t),f.forEach(d=>d(m)),this.pendingDisposal.has(t)&&(this.pendingDisposal.delete(t),this.disposeData(t)&&Re().removeDataId(t,this),this.pendingDeletes--),m}readToGPU(t,e={}){let o=this.texData.get(t),{values:n,shape:s,slice:a,dtype:i,isPacked:l,texture:c}=o;if(i==="complex64")throw new Error("Does not support reading texture for complex64 dtype.");if(a!=null){let f;l?f=new Ze(s,co):f=new ve(s,co);let d=this.runWebGLProgram(f,[{dataId:t,shape:s,dtype:i}],i),g=this.readToGPU(d,e);return this.disposeIntermediateTensorInfo(d),g}if(c==null)throw n!=null?new Error("Data is not on GPU but on CPU."):new Error("There is no data on GPU or CPU.");let u=this.decode(t,e.customTexShape),p=Re().makeTensorFromTensorInfo(u),m=this.texData.get(u.dataId);return Object.assign({tensorRef:p},m.texture)}bufferSync(t){let e=this.readSync(t.dataId);if(t.dtype==="string")try{let o=e.map(n=>y.decodeString(n));return ot(t.shape,t.dtype,o)}catch{throw new Error("Failed to decode encoded string bytes into utf-8")}return ot(t.shape,t.dtype,e)}checkNumericalProblems(t){if(t!=null)for(let e=0;e<t.length;e++){let o=t[e];if(!Hv(o))throw D().getBool("WEBGL_RENDER_FLOAT32_CAPABLE")?Error(`The value ${o} cannot be represented with your current settings. Consider enabling float32 rendering: 'tf.env().set('WEBGL_RENDER_FLOAT32_ENABLED', true);'`):Error(`The value ${o} cannot be represented on this device.`)}}getValuesFromTexture(t){let{shape:e,dtype:o,isPacked:n}=this.texData.get(t),s=y.sizeFromShape(e);if(D().getBool("WEBGL_DOWNLOAD_FLOAT_ENABLED")){let m=this.decode(t),f=this.texData.get(m.dataId),d=this.gpgpu.downloadMatrixFromPackedTexture(f.texture.texture,...mu(e)).subarray(0,s);return this.disposeIntermediateTensorInfo(m),d}let a=D().getBool("WEBGL_PACK")&&n===!0,i=a?gu(e):e,l=a?new Kp(i):new Hp(i),c=this.runWebGLProgram(l,[{shape:i,dtype:o,dataId:t}],"float32"),u=this.texData.get(c.dataId),p=this.gpgpu.downloadByteEncodedFloatMatrixFromOutputTexture(u.texture.texture,u.texShape[0],u.texShape[1]).subarray(0,s);return this.disposeIntermediateTensorInfo(c),p}timerAvailable(){return D().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0}time(t){let e=this.activeTimers,o=[],n=!1;this.programTimersStack==null?(this.programTimersStack=o,n=!0):this.activeTimers.push(o),this.activeTimers=o,t();let s=y.flatten(this.activeTimers.map(l=>l.query)).filter(l=>l!=null),a=y.flatten(this.activeTimers.map(l=>l.name)).filter(l=>l!=null);this.activeTimers=e,n&&(this.programTimersStack=null);let i={uploadWaitMs:this.uploadWaitMs,downloadWaitMs:this.downloadWaitMs,kernelMs:null,wallMs:null};return(async()=>{if(D().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0){let l=await Promise.all(s);i.kernelMs=y.sum(l),i.getExtraProfileInfo=()=>l.map((c,u)=>({name:a[u],ms:c})).map(c=>`${c.name}: ${c.ms}`).join(", ")}else i.kernelMs={error:"WebGL query timers are not supported in this environment."};return this.uploadWaitMs=0,this.downloadWaitMs=0,i})()}memory(){return{unreliable:!1,numBytesInGPU:this.numBytesInGPU,numBytesInGPUAllocated:this.textureManager.numBytesAllocated,numBytesInGPUFree:this.textureManager.numBytesFree}}startTimer(){return D().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0?this.gpgpu.beginQuery():{startMs:y.now(),endMs:null}}endTimer(t){return D().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0?(this.gpgpu.endQuery(),t):(t.endMs=y.now(),t)}async getQueryTime(t){if(D().getNumber("WEBGL_DISJOINT_QUERY_TIMER_EXTENSION_RELIABLE")>0)return this.gpgpu.waitForQueryAndGetTime(t);let e=t;return e.endMs-e.startMs}disposeData(t,e=!1){if(this.pendingDisposal.has(t))return!1;if(!this.texData.has(t))return!0;if(e?this.texData.get(t).refCount=0:this.texData.get(t).refCount--,!e&&this.texData.get(t).refCount>0)return!1;if(this.pendingRead.has(t))return this.pendingDisposal.add(t),this.pendingDeletes++,!1;this.releaseGPUData(t);let{complexTensorInfos:o}=this.texData.get(t);return o!=null&&(this.disposeData(o.real.dataId,e),this.disposeData(o.imag.dataId,e)),this.texData.delete(t),!0}releaseGPUData(t){let{texture:e,dtype:o,texShape:n,usage:s,isPacked:a,slice:i}=this.texData.get(t),l=i&&i.origDataId||t,c=this.dataRefCount.get(l);c>1?this.dataRefCount.set(l,c-1):(this.dataRefCount.delete(l),e!=null&&(this.numBytesInGPU-=this.computeBytes(n,o),this.textureManager.releaseTexture(e,n,s,a)));let u=this.texData.get(t);u.texture=null,u.texShape=null,u.isPacked=!1,u.slice=null}getTexture(t){return this.uploadToGPU(t),this.texData.get(t).texture.texture}getDataInfo(t){return this.texData.get(t)}shouldExecuteOnCPU(t,e=bB){return D().getBool("WEBGL_CPU_FORWARD")&&t.every(o=>this.texData.get(o.dataId).texture==null&&y.sizeFromShape(o.shape)<e)}getGPGPUContext(){return this.gpgpu}where(t){N.warn("tf.where() in webgl locks the UI thread. Call tf.whereAsync() instead");let e=t.dataSync();return hB(t.shape,e)}packedUnaryOp(t,e,o){let n=new Ze(t.shape,e),s=this.compileAndRun(n,[t],o);return Re().makeTensorFromTensorInfo(s)}abs(t){if(this.shouldExecuteOnCPU([t])&&t.dtype!=="complex64"){let n=dm(this.texData.get(t.dataId).values);return this.makeOutput(t.shape,t.dtype,n)}if(D().getBool("WEBGL_PACK_UNARY_OPERATIONS"))return this.packedUnaryOp(t,fy,t.dtype);let e=new ve(t.shape,fy),o=this.compileAndRun(e,[t]);return Re().makeTensorFromTensorInfo(o)}makeTensorInfo(t,e,o){let n;if(e==="string"&&o!=null&&o.length>0&&y.isString(o[0])){let s=o.map(a=>y.encodeString(a));n=this.write(s,t,e)}else n=this.write(o,t,e);return this.texData.get(n).usage=null,{dataId:n,shape:t,dtype:e}}makeOutput(t,e,o){return Re().makeTensorFromTensorInfo(this.makeTensorInfo(t,e,o),this)}unpackTensor(t){let e=new ym(t.shape);return this.runWebGLProgram(e,[t],t.dtype)}packTensor(t){let e=new gm(t.shape);return this.runWebGLProgram(e,[t],t.dtype,null,!0)}packedReshape(t,e){let o=[ls(t.shape),...cs(t.shape)],n={dtype:t.dtype,shape:o,dataId:t.dataId},s=[ls(e),...cs(e)],a=new Wl(s,o),i=!0,l=[o],c=this.runWebGLProgram(a,[n],t.dtype,l,i);return{dataId:c.dataId,shape:e,dtype:c.dtype}}decode(t,e){let o=this.texData.get(t),{isPacked:n,shape:s,dtype:a}=o;if(e!=null){let m=y.sizeFromShape(s),f=e[0]*e[1]*4;y.assert(m<=f,()=>"customTexShape is too small. Row * Column * 4 should be equal or larger than the size of the tensor data.")}let i=gu(s),l;n?l=new Up(i):l=new Gp(i);let c=!0,u=[e??mu(i)],p=this.runWebGLProgram(l,[{shape:i,dtype:a,dataId:t}],a,u,c,e);return{dtype:a,shape:s,dataId:p.dataId}}runWebGLProgram(t,e,o,n,s=!1,a){let i=this.makeTensorInfo(t.outputShape,o),l=this.texData.get(i.dataId);if(t.packedOutput&&(l.isPacked=!0),t.outPackingScheme===is.DENSE){let x=a??mu(t.outputShape);l.texShape=x.map(b=>b*2)}if(t.outTexUsage!=null&&(l.usage=t.outTexUsage),y.sizeFromShape(i.shape)===0)return l.values=y.getTypedArrayFromDType(i.dtype,0),i;let c=[],u=e.map(x=>{if(x.dtype==="complex64")throw new Error("GPGPUProgram does not support complex64 input. For complex64 dtypes, please separate the program into real and imaginary parts.");let b=this.texData.get(x.dataId);if(b.texture==null){if(!t.packedInputs&&y.sizeFromShape(x.shape)<=D().getNumber("WEBGL_SIZE_UPLOAD_UNIFORM"))return{shape:x.shape,texData:null,isUniform:!0,uniformValues:b.values};t.packedInputs&&(b.isPacked=!0,b.shape=x.shape)}if(this.uploadToGPU(x.dataId),!!b.isPacked!=!!t.packedInputs)x=b.isPacked?this.unpackTensor(x):this.packTensor(x),c.push(x),b=this.texData.get(x.dataId);else if(b.isPacked&&!Oi(b.shape,x.shape)){let C=x,S=x.shape;x.shape=b.shape,x=this.packedReshape(x,S),c.push(x),b=this.texData.get(x.dataId),C.shape=S}return{shape:x.shape,texData:b,isUniform:!1}});this.uploadToGPU(i.dataId);let p={shape:i.shape,texData:l,isUniform:!1},m=b1(t,u,p),f=this.getAndSaveBinary(m,()=>x1(this.gpgpu,t,u,p)),d=this.activeTimers!=null,g;d&&(g=this.startTimer()),D().get("ENGINE_COMPILE_ONLY")||y1(this.gpgpu,f,u,p,n),c.forEach(x=>this.disposeIntermediateTensorInfo(x)),d&&(g=this.endTimer(g),this.activeTimers.push({name:t.constructor.name,query:this.getQueryTime(g)}));let h=D().getNumber("WEBGL_FLUSH_THRESHOLD");if(h>0){let x=y.now();x-this.lastGlFlushTime>h&&(this.gpgpu.gl.flush(),this.lastGlFlushTime=x)}if(!D().getBool("WEBGL_LAZILY_UNPACK")&&l.isPacked&&s===!1){let x=this.unpackTensor(i);return this.disposeIntermediateTensorInfo(i),x}return i}compileAndRun(t,e,o,n,s=!1){return o=o||e[0].dtype,this.runWebGLProgram(t,e,o,n,s)}getAndSaveBinary(t,e){return t in this.binaryCache||(this.binaryCache[t]=e()),this.binaryCache[t]}getTextureManager(){return this.textureManager}dispose(){this.disposed||(D().getBool("IS_TEST")||Object.keys(this.binaryCache).forEach(e=>{this.gpgpu.deleteProgram(this.binaryCache[e].webGLProgram),delete this.binaryCache[e]}),this.textureManager.dispose(),this.canvas!=null&&typeof HTMLCanvasElement<"u"&&this.canvas instanceof HTMLCanvasElement?this.canvas.remove():this.canvas=null,this.gpgpuCreatedLocally&&(this.gpgpu.program=null,this.gpgpu.dispose()),this.disposed=!0)}floatPrecision(){return this.floatPrecisionValue==null&&(this.floatPrecisionValue=at(()=>{if(!D().get("WEBGL_RENDER_FLOAT32_ENABLED")){let t=D().getBool("DEBUG");D().set("DEBUG",!1);let e=this.abs(it(1e-8)).dataSync()[0];if(D().set("DEBUG",t),e>0)return 32}return 16})),this.floatPrecisionValue}epsilon(){return this.floatPrecision()===32?gB:xB}uploadToGPU(t){let e=this.texData.get(t),{shape:o,dtype:n,values:s,texture:a,usage:i,isPacked:l}=e;if(a!=null)return;let c=this.activeTimers!=null,u;c&&(u=y.now());let p=e.texShape;if(p==null&&(p=n1(o,l),e.texShape=p),s!=null){let m=gu(o),f,d=p[1],g=p[0],h=s instanceof Uint8Array||s instanceof Uint8ClampedArray;(l||!h)&&([d,g]=ao(p[0],p[1])),l?f=new qp(m,h):f=new xu(m,h);let x=h?[g,d]:p,b=this.makeTensorInfo(x,n),C=this.texData.get(b.dataId);h?C.usage=ke.PIXELS:C.usage=ke.UPLOAD,C.texShape=x,this.gpgpu.uploadDenseMatrixToTexture(this.getTexture(b.dataId),d,g,s);let S=[[g,d]],$=this.runWebGLProgram(f,[b],n,S,!0),R=this.texData.get($.dataId);e.texShape=R.texShape,e.isPacked=R.isPacked,e.usage=R.usage,D().get("ENGINE_COMPILE_ONLY")?this.disposeData($.dataId):(e.texture=R.texture,e.values=null,this.texData.delete($.dataId)),this.disposeIntermediateTensorInfo(b),c&&(this.uploadWaitMs+=y.now()-u)}else{let m=this.acquireTexture(p,i,n,l);e.texture=m}}convertAndCacheOnCPU(t,e){let o=this.texData.get(t),{dtype:n}=o;return e!=null&&(o.values=SB(e,n)),o.values}acquireTexture(t,e,o,n){if(this.numBytesInGPU+=this.computeBytes(t,o),!this.warnedAboutMemory&&this.numBytesInGPU>this.numMBBeforeWarning*1024*1024){let s=(this.numBytesInGPU/1024/1024).toFixed(2);this.warnedAboutMemory=!0,console.warn(`High memory usage in GPU: ${s} MB, most likely due to a memory leak`)}return this.textureManager.acquireTexture(t,e,n)}computeBytes(t,e){return t[0]*t[1]*y.bytesPerElement(e)}checkCompileCompletion(){for(let[,t]of Object.entries(this.binaryCache))this.checkCompletion_(t)}async checkCompileCompletionAsync(){let t=[];if(this.gpgpu.parallelCompilationExtension){for(let[,e]of Object.entries(this.binaryCache))t.push(this.checkCompletionAsync_(e));return Promise.all(t)}else{for(let[,e]of Object.entries(this.binaryCache)){let o=new Promise(n=>{try{this.checkCompletion_(e),n(!0)}catch(s){throw s}});t.push(o)}return Promise.all(t)}}async checkCompletionAsync_(t){return this.gpgpu.gl.getProgramParameter(t.webGLProgram,this.gpgpu.parallelCompilationExtension.COMPLETION_STATUS_KHR)?this.checkCompletion_(t):(await _p(),this.checkCompletionAsync_(t))}checkCompletion_(t){if(this.gpgpu.gl.getProgramParameter(t.webGLProgram,this.gpgpu.gl.LINK_STATUS)===!1)throw console.log(this.gpgpu.gl.getProgramInfoLog(t.webGLProgram)),this.gpgpu.gl.getShaderParameter(t.fragmentShader,this.gpgpu.gl.COMPILE_STATUS)===!1?(Nx(t.source,this.gpgpu.gl.getShaderInfoLog(t.fragmentShader)),new Error("Failed to compile fragment shader.")):new Error("Failed to link vertex and fragment shaders.");return!0}getUniformLocations(){for(let t of Object.values(this.binaryCache)){this.gpgpu.buildVao(t.webGLProgram);let{variablesLocations:e,customUniformLocations:o,infLoc:n,nanLoc:s,outShapeLocation:a,outShapeStridesLocation:i,outTexShapeLocation:l}=$x(this.gpgpu,t.program,t.webGLProgram);t.variablesLocations=e,t.customUniformLocations=o,t.infLoc=n,t.nanLoc=s,t.outShapeLocation=a,t.outShapeStridesLocation=i,t.outTexShapeLocation=l}}createTensorFromGPUData(t,e,o){t.channels=t.channels||"RGBA";let{texture:n,height:s,width:a,channels:i}=t,l=Re().backend;if(!l.gpgpu.gl.isTexture(n))throw new Error("The texture is invalid. Also, please make sure the texture and the TFJS WebGL backend are using the same canvas. If you want to use your own custom canvas, you have to create and use the custom TFJS WebGL backend created from the canvas through 'new tf.MathBackendWebGL(customCanvas)'.");let c=l.writeTexture(n,e,o,s,a,i);return Re().makeTensorFromDataId(c,e,o,l)}};Su.nextDataId=0;function SB(r,t){if(t==="float32"||t==="complex64")return r;if(t==="int32"||t==="bool"){let e=t==="int32"?new Int32Array(r.length):new Uint8Array(r.length);for(let o=0;o<e.length;++o)e[o]=Math.round(r[o]);return e}else throw new Error(`Unknown dtype ${t}`)}vo.isBrowser()&&Nc("webgl",()=>new Su,2);var Gl=`
  if (isnan(a)) return a;
  if (isnan(b)) return b;
`;var Je=class{constructor(t,e,o){this.variableNames=["A","B"],this.outputShape=N.assertAndGetBroadcastShape(e,o),this.enableShapeUniforms=Mt(this.outputShape.length),this.userCode=`
      float binaryOperation(float a, float b) {
        ${t}
      }

      void main() {
        float a = getAAtOutCoords();
        float b = getBAtOutCoords();
        setOutput(binaryOperation(a, b));
      }
    `}};var ur=`
  result.r = isNaN.r ? NAN : result.r;
  result.g = isNaN.g ? NAN : result.g;
  result.b = isNaN.b ? NAN : result.b;
  result.a = isNaN.a ? NAN : result.a;
`;var cr=class{constructor(t,e,o,n=!1){this.variableNames=["A","B"],this.supportsBroadcasting=!0,this.packedInputs=!0,this.packedOutput=!0,this.outputShape=N.assertAndGetBroadcastShape(e,o);let s=this.outputShape.length;this.enableShapeUniforms=Mt(s);let a="";if(n)if(s===0||y.sizeFromShape(this.outputShape)===1)a=`
          result.y = 0.;
          result.z = 0.;
          result.w = 0.;
        `;else if(a=`
          ${ht(s)} coords = getOutputCoords();
        `,s===1)this.enableShapeUniforms?a+=`
            result.y = (coords + 1) >= outShape ? 0. : result.y;
            result.z = 0.;
            result.w = 0.;
          `:a+=`
            result.y = (coords + 1) >= ${this.outputShape[0]} ? 0. : result.y;
            result.z = 0.;
            result.w = 0.;
          `;else{let l=ee("coords",s);this.enableShapeUniforms?a+=`
            bool nextRowOutOfBounds =
              (${l[s-2]} + 1) >= outShape[${s} - 2];
            bool nextColOutOfBounds =
              (${l[s-1]} + 1) >= outShape[${s} - 1];
            result.y = nextColOutOfBounds ? 0. : result.y;
            result.z = nextRowOutOfBounds ? 0. : result.z;
            result.w = nextColOutOfBounds || nextRowOutOfBounds ? 0. : result.w;
          `:a+=`
            bool nextRowOutOfBounds =
              (${l[s-2]} + 1) >= ${this.outputShape[s-2]};
            bool nextColOutOfBounds =
              (${l[s-1]} + 1) >= ${this.outputShape[s-1]};
            result.y = nextColOutOfBounds ? 0. : result.y;
            result.z = nextRowOutOfBounds ? 0. : result.z;
            result.w = nextColOutOfBounds || nextRowOutOfBounds ? 0. : result.w;
          `}this.userCode=`
      vec4 binaryOperation(vec4 a, vec4 b) {
        ${t}
      }

      void main() {
        vec4 a = getAAtOutCoords();
        vec4 b = getBAtOutCoords();

        vec4 result = binaryOperation(a, b);
        ${a}

        setOutput(result);
      }
    `}};function re(r){let{inputs:t,backend:e}=r,{x:o}=t;return e.incRef(o.dataId),{dataId:o.dataId,shape:o.shape,dtype:o.dtype}}var kC={kernelName:yo,backendName:"webgl",kernelFunc:re};function tr(r){let{inputs:t,backend:e}=r,{real:o,imag:n}=t,s=e.makeTensorInfo(o.shape,"complex64"),a=e.texData.get(s.dataId),i=re({inputs:{x:o},backend:e}),l=re({inputs:{x:n},backend:e});return a.complexTensorInfos={real:i,imag:l},s}var EC={kernelName:Fs,backendName:"webgl",kernelFunc:tr};var dy="return (a < 0.) ? b * a : a;",hy=`
  vec4 aLessThanZero = vec4(lessThan(a, vec4(0.)));
  return (aLessThanZero * (b * a)) + ((vec4(1.0) - aLessThanZero) * a);
`;function CB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{alpha:s}=o,a=e.makeTensorInfo([],"float32",y.createScalarValue(s,"float32")),i=D().getBool("WEBGL_PACK_BINARY_OPERATIONS")?new cr(hy,n.shape,a.shape):new Je(dy,n.shape,a.shape),l=e.runWebGLProgram(i,[n,a],"float32");return e.disposeIntermediateTensorInfo(a),l}var $C={kernelName:ca,backendName:"webgl",kernelFunc:CB};var gy="return (a < 0.) ? b * a : a;",xy=`
  vec4 aLessThanZero = vec4(lessThan(a, vec4(0.)));
  return (aLessThanZero * (b * a)) + ((vec4(1.0) - aLessThanZero) * a);
`;function TB(r){let{inputs:t,backend:e}=r,{x:o,alpha:n}=t,s=D().getBool("WEBGL_PACK_BINARY_OPERATIONS")?new cr(xy,o.shape,n.shape):new Je(gy,o.shape,n.shape);return e.runWebGLProgram(s,[o,n],"float32")}var RC={kernelName:ka,backendName:"webgl",kernelFunc:TB};var Nr="if (isnan(x)) return x;";function st({opSnippet:r,packedOpSnippet:t,cpuKernelImpl:e,dtype:o}){return({inputs:n,backend:s})=>{let{x:a}=n,i=s,l=o||a.dtype;if(i.shouldExecuteOnCPU([a])&&e!=null){let p=i.texData.get(a.dataId),m=e(p.values,l);return i.makeTensorInfo(a.shape,l,m)}let c=D().getBool("WEBGL_PACK_UNARY_OPERATIONS")&&t!=null,u;return c?u=new Ze(a.shape,t):u=new ve(a.shape,r),i.runWebGLProgram(u,[a],l)}}function _t({opSnippet:r,packedOpSnippet:t,checkOutOfBounds:e=!1,supportsComplex:o=!1,cpuKernelImpl:n,dtype:s}){return({inputs:a,backend:i})=>{let{a:l,b:c}=a,u=i;if(o&&l.dtype==="complex64"){let d=u.texData.get(l.dataId),g=u.texData.get(c.dataId),[h,x]=[[d.complexTensorInfos.real,g.complexTensorInfos.real],[d.complexTensorInfos.imag,g.complexTensorInfos.imag]].map(C=>{let[S,I]=C,$={dataId:S.dataId,dtype:S.dtype,shape:l.shape},R={dataId:I.dataId,dtype:I.dtype,shape:c.shape},A=new Je(r,l.shape,c.shape);return u.runWebGLProgram(A,[$,R],se(S.dtype,I.dtype))}),b=tr({inputs:{real:h,imag:x},backend:u});return u.disposeIntermediateTensorInfo(h),u.disposeIntermediateTensorInfo(x),b}let p=s||se(l.dtype,c.dtype);if((l.dtype==="string"||c.dtype==="string"||u.shouldExecuteOnCPU([l,c]))&&n!=null){let d=u.texData.get(l.dataId).values,g=u.texData.get(c.dataId).values,h=l.dtype==="string"?N.fromUint8ToStringArray(d):d,x=l.dtype==="string"?N.fromUint8ToStringArray(g):g,[b,C]=n(l.shape,c.shape,h,x,p),S=u.makeTensorInfo(C,p),I=u.texData.get(S.dataId);return I.values=b,S}let m=D().getBool("WEBGL_PACK_BINARY_OPERATIONS")&&t!=null,f;return m?f=new cr(t,l.shape,c.shape,e):f=new Je(r,l.shape,c.shape),u.runWebGLProgram(f,[l,c],p)}}function Mo(r,t=!1){if(r==="linear")return t?SC:gC;if(r==="relu")return t?TC:yC;if(r==="elu")return t?CC:xC;if(r==="relu6")return t?NC:bC;if(r==="prelu")return t?xy:gy;if(r==="leakyrelu")return t?hy:dy;if(r==="sigmoid")return t?IC:wC;throw new Error(`Activation ${r} has not been implemented for the WebGL backend.`)}var Ul=class{constructor(t,e,o,n=!1,s=!1,a=!1,i=null,l=!1,c=!1){this.variableNames=["matrixA","matrixB"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=o,this.enableShapeUniforms=Mt(this.outputShape.length);let u=n?t[1]:t[2],p=Math.ceil(u/2),m=n?"i * 2, rc.y":"rc.y, i * 2",f=s?"rc.z, i * 2":"i * 2, rc.z",d=n?["a.xxyy","a.zzww"]:["a.xxzz","a.yyww"],g=s?["b.xzxz","b.ywyw"]:["b.xyxy","b.zwzw"],h="",x="";i&&(l?h=`vec4 activation(vec4 a) {
          vec4 b = getPreluActivationWeightsAtOutCoords();
          ${i}
        }`:c?h=`vec4 activation(vec4 a) {
          vec4 b = getLeakyreluAlphaAtOutCoords();
          ${i}
        }`:h=`vec4 activation(vec4 x) {
          ${i}
        }`,x="result = activation(result);");let b=a?"result += getBiasAtOutCoords();":"";a&&this.variableNames.push("bias"),l&&this.variableNames.push("preluActivationWeights"),c&&this.variableNames.push("leakyreluAlpha");let C="rc.x",S="rc.x";t[0]<e[0]?C=`imod(rc.x, ${t[0]})`:e[0]<t[0]&&(S=`imod(rc.x, ${e[0]})`),this.userCode=`
      ${h}
      // Don't use uniform for sharedDimensionPacked for performance.
      const float sharedDimension = ${p}.0;

      vec4 dot2x2ARowBCol(ivec3 rc) {
        vec4 result = vec4(0);
        int batchA = ${C};
        int batchB = ${S};
        for (int i = 0; i < ${p}; i++) {
          vec4 a = getMatrixA(batchA, ${m});
          vec4 b = getMatrixB(batchB, ${f});

          // These swizzled products need to be separately added.
          // See: https://github.com/tensorflow/tfjs/issues/1735
          result += (${d[0]} * ${g[0]});
          result += (${d[1]} * ${g[1]});
        }
        return result;
      }

      void main() {
        ivec3 rc = getOutputCoords();
        vec4 result = dot2x2ARowBCol(rc);

        ${b}

        ${x}

        setOutput(result);
      }
    `}};var yy={REAL:"return areal * breal - aimag * bimag;",IMAG:"return areal * bimag + aimag * breal;"},Cu=class{constructor(t,e,o){this.variableNames=["AReal","AImag","BReal","BImag"],this.outputShape=N.assertAndGetBroadcastShape(e,o),this.userCode=`
      float binaryOpComplex(
          float areal, float aimag, float breal, float bimag) {
        ${t}
      }

      void main() {
        float areal = getARealAtOutCoords();
        float aimag = getAImagAtOutCoords();
        float breal = getBRealAtOutCoords();
        float bimag = getBImagAtOutCoords();
        setOutput(binaryOpComplex(areal, aimag, breal, bimag));
      }
    `}};var AC="return a * b;";function Tu(r){let{inputs:t,backend:e}=r,{a:o,b:n}=t,s=N.upcastType(o.dtype,n.dtype);if(o.dtype==="complex64"){let i=e.texData.get(o.dataId),l=e.texData.get(n.dataId),c=new Cu(yy.REAL,o.shape,n.shape),u=new Cu(yy.IMAG,o.shape,n.shape),p=[{dataId:i.complexTensorInfos.real.dataId,dtype:i.complexTensorInfos.real.dtype,shape:o.shape},{dataId:i.complexTensorInfos.imag.dataId,dtype:i.complexTensorInfos.imag.dtype,shape:o.shape},{dataId:l.complexTensorInfos.real.dataId,dtype:l.complexTensorInfos.real.dtype,shape:n.shape},{dataId:l.complexTensorInfos.imag.dataId,dtype:l.complexTensorInfos.imag.dtype,shape:n.shape}],m=e.runWebGLProgram(c,p,"float32"),f=e.runWebGLProgram(u,p,"float32"),d=tr({inputs:{real:m,imag:f},backend:e});return e.disposeIntermediateTensorInfo(m),e.disposeIntermediateTensorInfo(f),d}if(e.shouldExecuteOnCPU([o,n])){let i=e.texData.get(o.dataId),l=e.texData.get(n.dataId),[c,u]=WS(o.shape,n.shape,i.values,l.values,s),p=e.makeTensorInfo(u,s),m=e.texData.get(p.dataId);return m.values=c,p}let a;return D().getBool("WEBGL_PACK_BINARY_OPERATIONS")?a=new cr(AC,o.shape,n.shape):a=new Je(AC,o.shape,n.shape),e.runWebGLProgram(a,[o,n],s)}var FC={kernelName:Tn,backendName:"webgl",kernelFunc:Tu};function _C(r,t,e){let o=[ls(r.shape),...cs(r.shape)],n={dtype:r.dtype,shape:o,dataId:r.dataId},s=[ls(t),...cs(t)],a=new Wl(s,o),i=!0,l=[o],c=e.runWebGLProgram(a,[n],r.dtype,l,i);return{dataId:c.dataId,shape:t,dtype:c.dtype}}function q(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{shape:s}=o,a=e,i=y.sizeFromShape(n.shape),l=y.inferFromImplicitShape(s,i),c=y.sizeFromShape(l);y.assert(i===c,()=>`The new shape (${l}) has ${c} elements and the old shape (${n.shape}) has ${i} elements. The new shape and old shape must have the same number of elements.`);let u=a.texData.get(n.dataId);return u.isPacked&&!Oi(n.shape,l)&&!(u.texture!==null&&Oi(u.shape,l))?_C(n,l,a):(a.incRef(n.dataId),{dataId:n.dataId,shape:l,dtype:n.dtype})}var DC={kernelName:Da,backendName:"webgl",kernelFunc:q};var Nu=class{constructor(t,e){this.variableNames=["x"];let{windowSize:o,batchSize:n,inSize:s,outSize:a}=t;this.outputShape=[n,a];let i=Math.floor(o/4)*4,l=o%4,c="sumValue += dot(values, ones);";if(e!=null){let p=1/e;c=`sumValue += dot(values * ${y.isInt(p)?p.toPrecision(2):p}, ones);`}let u="";s%o>0&&(u=`
        if (inIdx < 0 || inIdx >= ${s}) {
          return 0.0;
        }
      `),this.userCode=`
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float getValue(int batch, int inIdx) {
        ${u}
        return getX(batch, inIdx);
      }

      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];
        int outIdx = coords[1];
        int inOffset = outIdx * ${o};

        float sumValue = 0.0;

        for (int i = 0; i < ${i}; i += 4) {
          int inIdx = inOffset + i;
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            getValue(batch, inIdx + 3)
          );

          ${c}
        }

        int inIdx = inOffset + ${i};
        if (${l===1}) {
          vec4 values = vec4(getValue(batch, inIdx), 0.0, 0.0, 0.0);

          ${c}
        } else if (${l===2}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1), 0.0, 0.0);

          ${c}
        } else if (${l===3}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2), 0.0);

          ${c}
        }
        setOutput(sumValue);
      }
    `}};var wm=class{constructor(t,e){this.variableNames=["x"];let{windowSize:o,batchSize:n,inSize:s,outSize:a}=t;this.outputShape=[n,a];let i="0.0",l="";e==="prod"?i="1.0":e==="min"?(i="1.0 / 1e-20",l="min"):e==="max"&&(i="-1.0 / 1e-20",l="max");let c=`${e}(${e}(${e}(minMaxValue[0], minMaxValue[1]), minMaxValue[2]), minMaxValue[3])`;e==="sum"?c="sumValue":e==="prod"?c="prodValue":e==="all"?c="allValue":e==="any"&&(c="anyValue");let u=Math.floor(o/4)*4,p=o%4,m=`
      if (${e==="sum"}) {
        sumValue += dot(values, ones);
      } else if (${e==="prod"}) {
        vec2 tmp = vec2(values[0], values[1]) * vec2(values[2], values[3]);
        prodValue *= tmp[0] * tmp[1];
      } else {
        minMaxValue = ${l}(values, minMaxValue);
        if (${e==="min"} || ${e==="max"}) {
          minMaxValue = ${l}(values, minMaxValue);
          bvec4 isNaN = isnan(values);
          if (isNaN.r || isNaN.g || isNaN.b || isNaN.a) {
            minMaxValue = vec4(NAN);
          }
        }
      }
    `,f="vec4";e==="all"?(i="1.0",m=`
        bool reducedAllValue = all(values);
        float floatedReducedAllValue = float(reducedAllValue);
        allValue = float(allValue >= 1.0 && floatedReducedAllValue >= 1.0);
      `,f="bvec4"):e==="any"&&(i="0.0",m=`
        bool reducedAnyValue = any(values);
        float floatedReducedAnyValue = float(reducedAnyValue);
        anyValue = float(anyValue >= 1.0 || floatedReducedAnyValue >= 1.0);
      `,f="bvec4");let d="";s%o>0&&(d=`
        if (inIdx < 0 || inIdx >= ${s}) {
          return initializationValue;
        }
      `),this.userCode=`
      const float initializationValue = ${i};
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float getValue(int batch, int inIdx) {
        ${d}
        return getX(batch, inIdx);
      }

      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];
        int outIdx = coords[1];
        int inOffset = outIdx * ${o};

        vec4 minMaxValue = vec4(${i});
        float prodValue = 1.0;
        float sumValue = 0.0;
        float allValue = 1.0;
        float anyValue = 0.0;

        for (int i = 0; i < ${u}; i += 4) {
          int inIdx = inOffset + i;
          ${f} values = ${f}(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            getValue(batch, inIdx + 3)
          );

          ${m}
        }

        int inIdx = inOffset + ${u};
        if (${p===1}) {
          ${f} values = ${f}(
            getValue(batch, inIdx),
            initializationValue,
            initializationValue,
            initializationValue
          );

          ${m}
        } else if (${p===2}) {
          ${f} values = ${f}(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            initializationValue,
            initializationValue
          );

          ${m}
        } else if (${p===3}) {
          ${f} values = ${f}(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            initializationValue
          );

          ${m}
        }
        setOutput(${c});
      }
    `}};function IB(r){let t=[];for(;t.length===0||t[t.length-1].outSize!==1;){let e=t.length?t[t.length-1].outSize:r[1],o=N.computeOptimalWindowSize(e);t.push({inSize:e,windowSize:o,outSize:Math.ceil(e/o)})}return t}function pr(r,t,e,o){let n=IB(r.shape),s=r;for(let a=0;a<n.length;a++){let{inSize:i,windowSize:l,outSize:c}=n[a],u,p;e==="mean"?u=a===0?new Nu({windowSize:l,inSize:i,batchSize:r.shape[0],outSize:c},i):new Nu({windowSize:l,inSize:i,batchSize:r.shape[0],outSize:c}):u=new wm({windowSize:l,inSize:i,batchSize:r.shape[0],outSize:c},e),p=s,s=o.runWebGLProgram(u,[s],t),p.dataId!==r.dataId&&o.disposeIntermediateTensorInfo(p)}return s}var vm=class{constructor(t,e){this.variableNames=["A"];let o=new Array(t.length);for(let a=0;a<o.length;a++)o[a]=t[e[a]];this.outputShape=o,this.rank=o.length;let n=ht(this.rank),s=kB(e);this.userCode=`
    void main() {
      ${n} resRC = getOutputCoords();
      setOutput(getA(${s}));
    }
    `}};function kB(r){let t=r.length;if(t>6)throw Error(`Transpose for rank ${t} is not yet supported`);let e=["resRC.x","resRC.y","resRC.z","resRC.w","resRC.u","resRC.v"],o=new Array(t);for(let n=0;n<r.length;n++)o[r[n]]=e[n];return o.join()}var Sm=class{constructor(t,e){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0;let o=new Array(t.length);for(let u=0;u<o.length;u++)o[u]=t[e[u]];if(this.outputShape=o,this.rank=o.length,this.rank>6)throw Error(`Packed transpose for rank ${this.rank} is not yet supported.`);let n=ht(this.rank),s=my("rc",this.rank),a=new Array(this.rank);for(let u=0;u<e.length;u++)a[e[u]]=s[u];let i=`vec2(${a.slice(-2).join()})`,l=`++${s[this.rank-1]} < ${o[this.rank-1]}`,c=`getChannel(getA(${a.join()}), ${i})`;this.userCode=`
    void main() {
      ${n} rc = getOutputCoords();
      vec4 result = vec4(0.);
      result[0] = ${c};
      if(${l}) {
        result[1] = ${c};
      }
      --${s[this.rank-1]};
      if(++${s[this.rank-2]} < ${o[this.rank-2]}) {
        result[2] = ${c};
        if(${l}) {
          result[3] = ${c};
        }
      }
      setOutput(result);
    }
    `}};function us(r,t,e){let o=D().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new Sm(r.shape,t):new vm(r.shape,t);return e.runWebGLProgram(o,[r],r.dtype)}function OC(r,t,e,o){let n=t,s=r.shape.length,a=y.parseAxisParam(n,r.shape),i=a,l=N.getAxesPermutation(i,s),c=l!=null,u=r;c&&(u=us(r,l,o),i=N.getInnerMostAxes(i.length,s)),N.assertAxesAreInnerMostDims("sum",i,s);let[p,m]=N.computeOutAndReduceShapes(u.shape,i),f=p;e&&(f=N.expandShapeToKeepDim(p,a));let d=y.sizeFromShape(m),h=y.sizeFromShape(r.shape)/d,x=q({inputs:{x:u},attrs:{shape:[h,d]},backend:o}),b=Kn(r.dtype),C=pr(x,b,"sum",o),S=q({inputs:{x:C},attrs:{shape:f},backend:o});return o.disposeIntermediateTensorInfo(x),o.disposeIntermediateTensorInfo(C),c&&o.disposeIntermediateTensorInfo(u),S}function Vi(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o;return OC(n,s,a,e)}var PC={kernelName:"Sum",backendName:"webgl",kernelFunc:Vi};function Wt(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{perm:s}=o,a=e,i=n.shape.length,l=new Array(i);for(let u=0;u<l.length;u++)l[u]=n.shape[s[u]];let c;if(a.shouldExecuteOnCPU([n])){let p=a.texData.get(n.dataId).values,m=Bi(p,n.shape,n.dtype,s,l);c=a.makeTensorInfo(l,n.dtype);let f=a.texData.get(c.dataId);f.values=m}else c=us(n,s,a);return c}var MC={kernelName:wo,backendName:"webgl",kernelFunc:Wt};var by=1e3;function zi({a:r,b:t,transposeA:e,transposeB:o,backend:n,bias:s=null,preluActivationWeights:a=null,leakyreluAlpha:i=0,activation:l=null}){let c=r.shape.length,u=t.shape.length,p=e?r.shape[c-2]:r.shape[c-1],m=o?t.shape[u-1]:t.shape[u-2],f=e?r.shape[c-1]:r.shape[c-2],d=o?t.shape[u-2]:t.shape[u-1],g=r.shape.slice(0,-2),h=t.shape.slice(0,-2),x=y.sizeFromShape(g),b=y.sizeFromShape(h),S=_r.assertAndGetBroadcastShape(r.shape.slice(0,-2),t.shape.slice(0,-2)).concat([f,d]);y.assert(p===m,()=>`Error in matMul: inner shapes (${p}) and (${m}) of Tensors with shapes ${r.shape} and ${t.shape} and transposeA=${e} and transposeB=${o} must match.`);let I=e?[x,p,f]:[x,f,p],$=o?[b,d,m]:[b,m,d],R=q({inputs:{x:r},backend:n,attrs:{shape:I}}),A=q({inputs:{x:t},backend:n,attrs:{shape:$}}),F=[R,A],_=Math.max(x,b),O=e?R.shape[1]:R.shape[2],M=s!=null,P=a!=null,B=l==="leakyrelu",V=l!=null?Mo(l,!0):null,z=M||P||B||V!=null,G;if((f===1||d===1)&&O>by&&z===!1){let H=R,X=A;e&&(H=Wt({inputs:{x:R},backend:n,attrs:{perm:[0,2,1]}}),F.push(H)),o&&(X=Wt({inputs:{x:A},backend:n,attrs:{perm:[0,2,1]}}),F.push(X));let j=d!==1,J=d===1,Y=H;j&&(Y=q({inputs:{x:H},backend:n,attrs:{shape:[_,O,1]}}),F.push(Y));let et=d===1?2:1,Q=X;J&&(Q=q({inputs:{x:X},backend:n,attrs:{shape:[_,1,O]}}),F.push(Q));let nt=Tu({inputs:{a:Y,b:Q},backend:n});G=Vi({inputs:{x:nt},backend:n,attrs:{axis:et,keepDims:!0}}),F.push(nt)}else{let H=se(r.dtype,t.dtype),X=new Ul(I,$,[_,f,d],e,o,M,V,P,B),j=[R,A];if(s!=null&&j.push(s),P&&j.push(a),B){let J=n.makeTensorInfo([],"float32",y.createScalarValue(i,"float32"));j.push(J),F.push(J)}G=n.runWebGLProgram(X,j,H)}let W=q({inputs:{x:G},backend:n,attrs:{shape:S}});F.push(G);for(let H of F)n.disposeIntermediateTensorInfo(H);return W}function EB(r){let{inputs:t,backend:e,attrs:o}=r,{a:n,b:s,bias:a,preluActivationWeights:i}=t,{transposeA:l,transposeB:c,activation:u,leakyreluAlpha:p}=o;return zi({a:n,b:s,transposeA:l,transposeB:c,backend:e,bias:a,preluActivationWeights:i,leakyreluAlpha:p,activation:u})}var LC={kernelName:zn,backendName:"webgl",kernelFunc:EB};var BC="return abs(x);";function $B(r){let{inputs:t,backend:e}=r,{x:o}=t;if(e.shouldExecuteOnCPU([o])&&o.dtype!=="complex64"){let s=e.texData.get(o.dataId),a=dm(s.values);return e.makeTensorInfo(o.shape,o.dtype,a)}let n;return D().getBool("WEBGL_PACK_UNARY_OPERATIONS")?n=new Ze(o.shape,BC):n=new ve(o.shape,BC),e.runWebGLProgram(n,[o],o.dtype)}var VC={kernelName:"Abs",backendName:"webgl",kernelFunc:$B};var RB=pe+`
  if (abs(x) > 1.) {
    return NAN;
  }
  return acos(x);
`,AB=st({opSnippet:RB}),zC={kernelName:jo,backendName:"webgl",kernelFunc:AB};var FB=pe+`
  if (x < 1.0) return NAN;
return log(x + sqrt(x * x - 1.0));`,_B=st({opSnippet:FB}),WC={kernelName:Xo,backendName:"webgl",kernelFunc:_B};var GC="return a + b;",DB=_t({opSnippet:GC,packedOpSnippet:GC,supportsComplex:!0,cpuKernelImpl:vS}),UC={kernelName:"Add",backendName:"webgl",kernelFunc:DB};var Cm=class{constructor(t,e){this.outputShape=[],this.outputShape=t,this.variableNames=e.map((s,a)=>`T${a}`);let o=[];this.variableNames.forEach(s=>{o.push(`float v${s} = get${s}AtOutCoords();`)});let n=this.variableNames.map(s=>`v${s}`).join(" + ");this.userCode=`
      void main() {
        ${o.join(`
        `)}

        float result = ${n};
        setOutput(result);
      }
    `}};var Tm=class{constructor(t,e){this.outputShape=[],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=t,this.variableNames=e.map((s,a)=>`T${a}`);let o=[];this.variableNames.forEach(s=>{o.push(`vec4 v${s} = get${s}AtOutCoords();`)});let n=this.variableNames.map(s=>`v${s}`).join(" + ");this.userCode=`
      void main() {
        ${o.join(`
        `)}

        vec4 result = ${n};
        setOutput(result);
      }
    `}};function Nm(r){let{inputs:t,backend:e}=r,o=t;if(o.length===1)return re({inputs:{x:o[0]},backend:e});if(o.length>D().getNumber("WEBGL_MAX_TEXTURES_IN_SHADER")){let l=Math.floor(o.length/2),c=Nm({inputs:o.slice(0,l),backend:e}),u=Nm({inputs:o.slice(l),backend:e});return Nm({inputs:[c,u],backend:e})}let n=o.map(l=>l.dtype).reduce((l,c)=>se(l,c)),s=o.map(l=>l.shape),i=D().getBool("WEBGL_PACK")?new Tm(o[0].shape,s):new Cm(o[0].shape,s);return e.runWebGLProgram(i,o,n)}var HC={kernelName:Cs,backendName:"webgl",kernelFunc:Nm};function OB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o,i=n.shape.length,l=y.parseAxisParam(s,n.shape),c=l,u=N.getAxesPermutation(c,i),p=n;u!=null&&(p=Wt({inputs:{x:n},backend:e,attrs:{perm:u}}),c=N.getInnerMostAxes(c.length,i)),N.assertAxesAreInnerMostDims("all",c,i);let[m,f]=N.computeOutAndReduceShapes(p.shape,c),d=y.sizeFromShape(f),g=q({inputs:{x:p},backend:e,attrs:{shape:[-1,d]}}),h=pr(g,g.dtype,"all",e),x;if(a){let b=N.expandShapeToKeepDim(m,l);x=q({inputs:{x:h},backend:e,attrs:{shape:b}})}else x=q({inputs:{x:h},backend:e,attrs:{shape:m}});return e.disposeIntermediateTensorInfo(g),e.disposeIntermediateTensorInfo(h),u!=null&&e.disposeIntermediateTensorInfo(p),x}var KC={kernelName:"All",backendName:"webgl",kernelFunc:OB};function PB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o,i=n.shape.length,l=y.parseAxisParam(s,n.shape),c=l,u=N.getAxesPermutation(c,i),p=n;u!=null&&(p=Wt({inputs:{x:n},backend:e,attrs:{perm:u}}),c=N.getInnerMostAxes(c.length,i)),N.assertAxesAreInnerMostDims("any",c,i);let[m,f]=N.computeOutAndReduceShapes(p.shape,c),d=y.sizeFromShape(f),g=q({inputs:{x:p},backend:e,attrs:{shape:[-1,d]}}),h=pr(g,g.dtype,"any",e),x;if(a){let b=N.expandShapeToKeepDim(m,l);x=q({inputs:{x:h},backend:e,attrs:{shape:b}})}else x=q({inputs:{x:h},backend:e,attrs:{shape:m}});return e.disposeIntermediateTensorInfo(g),e.disposeIntermediateTensorInfo(h),u!=null&&e.disposeIntermediateTensorInfo(p),x}var qC={kernelName:"Any",backendName:"webgl",kernelFunc:PB};var Im=class{constructor(t,e,o){this.variableNames=["A"];let{windowSize:n,batchSize:s,outSize:a}=t;o||this.variableNames.push("bestIndicesA"),this.outputShape=[s,a];let i=e==="max"?">":"<",l=o?"inOffset + i;":"round(getBestIndicesA(batch, inOffset + i));";this.userCode=`
      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];
        int outIdx = coords[1];
        int inOffset = outIdx * ${n};

        int bestIndex = inOffset;
        float bestValue = getA(batch, bestIndex);

        for (int i = 0; i < ${n}; i++) {
          int inIdx = ${l};
          float candidate = getA(batch, inIdx);
          if (candidate ${i} bestValue) {
            bestValue = candidate;
            bestIndex = inIdx;
          }
        }
        setOutput(float(bestIndex));
      }
    `}};var km=class{constructor(t,e,o,n){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,y.assert(t.length>2,()=>`Packed arg${o.charAt(0).toUpperCase()+o.slice(1)} supports only inputs with rank above 2.`);let s=t[t.length-1],a=Math.ceil(s/e);this.outputShape=t.slice(0,-1),a>1&&this.outputShape.push(a),n||this.variableNames.push("bestIndicesA");let i=this.outputShape,l=i.length,c=ht(l),u=ee("coords",l),p,m;if(a===1){m=l+1;let A=ht(m);p=`
        ${A} sourceLocR = ${A}(${u.join()}, 0);
        ++${u[l-1]};
        ${A} sourceLocG = ${A}(${u.join()}, 0);
        ++${u[l-2]};
        ${A} sourceLocA = ${A}(${u.join()}, 0);
        --${u[l-1]};
        ${A} sourceLocB = ${A}(${u.join()}, 0);
        --${u[l-2]};`}else m=l,p=`
        ${c} sourceLocR = coords;
        ++${u[l-1]};
        ${c} sourceLocG = coords;
        ++${u[l-2]};
        ${c} sourceLocA = coords;
        --${u[l-1]};
        ${c} sourceLocB = coords;
        --${u[l-2]};`;let f=["x","y","z","w","u","v"].slice(0,m),d="."+f[m-1],g=f.map(A=>"int "+A),h=ee("sourceLocR",m-1).concat("inIdx.r"),x=ee("sourceLocG",m-1).concat("inIdx.g"),b=ee("sourceLocB",m-1).concat("inIdx.b"),C=ee("sourceLocA",m-1).concat("inIdx.a"),S=o==="max"?"greaterThan":"lessThan",I=n?"":`
          inIdx = round(vec4(getBestIndicesAChannel(${h.join()}),
                             getBestIndicesAChannel(${x.join()}),
                             getBestIndicesAChannel(${b.join()}),
                             getBestIndicesAChannel(${C.join()})));`,$=`vec4(
            getAChannel(${h.join()}),
            hasNextCol ? getAChannel(${x.join()}) : 0.,
            hasNextRow ? getAChannel(${b.join()}) : 0.,
            hasNextRow && hasNextCol ? getAChannel(${C.join()}) : 0.)`,R=n?"":`
      float getBestIndicesAChannel(${g.join()}) {
        return getChannel(getBestIndicesA(${f.join()}),
                                          vec2(${f.slice(-2).join()}));
      }`;this.userCode=`
      float getAChannel(${g.join()}) {
        return getChannel(getA(${f.join()}),
                               vec2(${f.slice(-2).join()}));
      }
      ${R}
      void main() {
        ${c} coords = getOutputCoords();
        bool hasNextCol = ${u[l-1]} < ${i[l-1]-1};
        bool hasNextRow = ${u[l-2]} < ${i[l-2]-1};
        ${p}
        ivec4 srcIdx = ivec4(sourceLocR${d}, sourceLocG${d},
          sourceLocB${d}, sourceLocA${d}) * ${e};
        ivec4 inIdx = srcIdx;
        vec4 bestIndex = vec4(inIdx);
        vec4 bestValue = ${$};

        for (int i = 0; i < ${e}; i++) {
          inIdx = srcIdx;
          ${I}
          vec4 candidate = ${$};
          bvec4 nan = isnan(candidate);
          bvec4 replace = bvec4(
            vec4(${S}(candidate, bestValue)) * (vec4(1.0) - vec4(nan)));

          bestValue = vec4(replace.x  ? candidate.x : bestValue.x,
                           replace.y  ? candidate.y : bestValue.y,
                           replace.z  ? candidate.z : bestValue.z,
                           replace.w  ? candidate.w : bestValue.w);
          bestIndex = mix(bestIndex, vec4(inIdx), vec4(replace));
          srcIdx++;
        }
        setOutput(bestIndex);
      }
    `}};function jC(r,t,e,o=null){let n=t.shape[0],s=t.shape[1];o!=null&&(n=o.shape[0],s=o.shape[1]);let a=N.computeOptimalWindowSize(s),i={windowSize:a,inSize:s,batchSize:n,outSize:Math.ceil(s/a)},l=new Im(i,e,o==null),c=[t];o!=null&&c.push(o);let u=r.runWebGLProgram(l,c,"int32");if(u.shape[1]===1)return u;let p=jC(r,t,e,u);return r.disposeIntermediateTensorInfo(u),p}function XC(r,t,e,o=null){let n=o!=null?o.shape:t.shape,s=n[n.length-1],a=N.computeOptimalWindowSize(s),i=new km(n,a,e,o==null),l=o==null?[t]:[t,o],c=r.runWebGLProgram(i,l,"int32");if(c.shape.length===t.shape.length){let u=XC(r,t,e,c);return r.disposeIntermediateTensorInfo(c),u}return c}function Em(r,t,e,o){let n=[e];if(N.assertAxesAreInnerMostDims("arg"+o.charAt(0).toUpperCase()+o.slice(1),n,t.shape.length),!D().getBool("WEBGL_PACK_REDUCE")||t.shape.length<=2){let s=[],a=r.texData.get(t.dataId),i=a!==null&&a.isPacked,l=t;i&&(l=r.unpackTensor(t),s.push(l));let[c,u]=N.computeOutAndReduceShapes(l.shape,n),p=y.sizeFromShape(u),m=q({inputs:{x:l},backend:r,attrs:{shape:[-1,p]}});s.push(m);let f=jC(r,m,o);s.push(f);let d=q({inputs:{x:f},backend:r,attrs:{shape:c}});return s.forEach(g=>r.disposeIntermediateTensorInfo(g)),d}return XC(r,t,o)}function MB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s}=o,a=y.parseAxisParam(s,n.shape),i=N.getAxesPermutation(a,n.shape.length),l=n,c=[];i!=null&&(l=Wt({inputs:{x:n},backend:e,attrs:{perm:i}}),c.push(l),a=N.getInnerMostAxes(a.length,l.shape.length)),N.assertAxesAreInnerMostDims("argMax",[a[0]],l.shape.length);let u=Em(e,l,a[0],"max");return c.forEach(p=>e.disposeIntermediateTensorInfo(p)),u}var YC={kernelName:Ts,backendName:"webgl",kernelFunc:MB};function LB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s}=o,a=y.parseAxisParam(s,n.shape),i=N.getAxesPermutation(a,n.shape.length),l=n,c=[];i!=null&&(l=Wt({inputs:{x:n},backend:e,attrs:{perm:i}}),c.push(l),a=N.getInnerMostAxes(a.length,l.shape.length)),N.assertAxesAreInnerMostDims("argMin",[a[0]],l.shape.length);let u=Em(e,l,a[0],"min");return c.forEach(p=>e.disposeIntermediateTensorInfo(p)),u}var QC={kernelName:Ns,backendName:"webgl",kernelFunc:LB};var BB=pe+`
  if (abs(x) > 1.) {
    return NAN;
  }
  return asin(x);
`,VB=st({opSnippet:BB}),ZC={kernelName:Yo,backendName:"webgl",kernelFunc:VB};var zB=pe+"return log(x + sqrt(x * x + 1.0));",WB=st({opSnippet:zB}),JC={kernelName:Qo,backendName:"webgl",kernelFunc:WB};var GB=pe+`
  return atan(x);
`,UB=st({opSnippet:GB}),tT={kernelName:Zo,backendName:"webgl",kernelFunc:UB};var HB=Gl+`
  return atan(a, b);
`,KB=`
  vec4 result = atan(a, b);
  bvec4 isNaNA = isnan(a);
  bvec4 isNaNB = isnan(b);
  bvec4 isNaN = bvec4(isNaNA.x || isNaNB.x, isNaNA.y || isNaNB.y, isNaNA.z || isNaNB.z, isNaNA.w || isNaNB.w);
  `+ur+`
  return result;
`,qB=_t({opSnippet:HB,packedOpSnippet:KB}),eT={kernelName:tn,backendName:"webgl",kernelFunc:qB};var jB=pe+`
  if ((x < -1.0) || (x > 1.0)) return NAN;
return (log(1.0 + x) - log(1.0 - x)) / 2.0;`,XB=st({opSnippet:jB}),rT={kernelName:Jo,backendName:"webgl",kernelFunc:XB};var Lr=class{constructor(t,e,o,n=!1,s=!1){if(this.variableNames=["x"],e==="avg"&&o)throw new Error("Cannot compute positions for average pool.");let a=t.filterWidth,i=t.strideHeight,l=t.strideWidth,c=t.dilationHeight,u=t.dilationWidth,p=t.effectiveFilterHeight,m=t.effectiveFilterWidth,f=t.padInfo.top,d=t.padInfo.left;this.outputShape=t.outShape;let g=e==="avg",h=`((batch  * ${t.inHeight} + xR) * ${t.inWidth} + xC) * ${t.inChannels} + d`,x=`(xR * ${t.inWidth} + xC) * ${t.inChannels} + d`,b="0.0";if(g||(b="-1.0 / 1e-20"),o){this.userCode=`
        const ivec2 strides = ivec2(${i}, ${l});
        const ivec2 pads = ivec2(${f}, ${d});

        void main() {
          ivec4 coords = getOutputCoords();
          int batch = coords[0];
          int d = coords[3];

          ivec2 xRCCorner = coords.yz * strides - pads;
          int xRCorner = xRCCorner.x;
          int xCCorner = xRCCorner.y;

          // max/min x(?, ?, d) to get y(yR, yC, d).
          // ? = to be determined
          float minMaxValue = 0.0;
          float minMaxValueFound = 0.0;
          int minMaxPosition = 0;
          float avgValue = 0.0;

          for (int wR = 0; wR < ${p};
              wR += ${c}) {
            int xR = xRCorner + wR;

            if (xR < 0 || xR >= ${t.inHeight}) {
              continue;
            }

            for (int wC = 0; wC < ${m};
                wC += ${u}) {
              int xC = xCCorner + wC;

              if (xC < 0 || xC >= ${t.inWidth}) {
                continue;
              }

              float value = getX(batch, xR, xC, d);

              // If a min / max value has already been found, use it. If not,
              // use the current value.
              float currMinMaxValue = mix(
                  value, minMaxValue, minMaxValueFound);
              if (value >= currMinMaxValue) {
                minMaxValue = value;
                minMaxValueFound = 1.0;
                minMaxPosition = ${n?s?h:x:`wR * ${m} + wC`};
              }
            }
          }
          setOutput(float(minMaxPosition));
        }
      `;return}let C="max",S=`${e}(${e}(${e}(minMaxValue[0], minMaxValue[1]), minMaxValue[2]), minMaxValue[3])`;e==="avg"&&(S="avgValue / max(count, 1.0)");let I=Math.floor(a/4)*4,$=a%4,R=`
      if (${g}) {
        avgValue += dot(values, ones);
      } else {
        minMaxValue = ${C}(values, minMaxValue);
      }
    `;this.userCode=`
      const ivec2 strides = ivec2(${i}, ${l});
      const ivec2 pads = ivec2(${f}, ${d});
      const float initializationValue = ${b};
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float count = 0.0;

      float getValue(int batch, int xR, int xC, int d) {
        if (xC < 0 || xC >= ${t.inWidth}) {
          return initializationValue;
        }
        count += 1.0;
        return getX(batch, xR, xC, d);
      }

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d = coords[3];

        ivec2 xRCCorner = coords.yz * strides - pads;
        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        // max/min x(?, ?, d) to get y(yR, yC, d).
        // ? = to be determined
        vec4 minMaxValue = vec4(${b});
        float avgValue = 0.0;
        count = 0.0;

        for (int wR = 0; wR < ${p};
            wR += ${c}) {
          int xR = xRCorner + wR;

          if (xR < 0 || xR >= ${t.inHeight}) {
            continue;
          }

          for (int wC = 0; wC < ${I}; wC += 4) {
            int xC = xCCorner + wC * ${u};

            vec4 values = vec4(
              getValue(batch, xR, xC, d),
              getValue(batch, xR, xC + ${u}, d),
              getValue(batch, xR, xC + 2 * ${u}, d),
              getValue(batch, xR, xC + 3 * ${u}, d)
            );

            ${R}
          }

          int xC = xCCorner + ${I};
          if (${$===1}) {
            vec4 values = vec4(
              getValue(batch, xR, xC, d),
              initializationValue,
              initializationValue,
              initializationValue
            );

            ${R}
          } else if (${$===2}) {
            vec4 values = vec4(
              getValue(batch, xR, xC, d),
              getValue(batch, xR, xC + ${u}, d),
              initializationValue,
              initializationValue
            );

            ${R}
          } else if (${$===3}) {
            vec4 values = vec4(
              getValue(batch, xR, xC, d),
              getValue(batch, xR, xC + ${u}, d),
              getValue(batch, xR, xC + 2 * ${u}, d),
              initializationValue
            );

            ${R}
          }
        }
        setOutput(${S});
      }
    `}},ps=class{constructor(t,e,o,n=!1,s=!1){if(this.variableNames=["x"],e==="avg"&&o)throw new Error("Cannot compute positions for average pool.");let a=t.filterWidth,i=t.strideDepth,l=t.strideHeight,c=t.strideWidth,u=t.dilationDepth,p=t.dilationHeight,m=t.dilationWidth,f=t.effectiveFilterDepth,d=t.effectiveFilterHeight,g=t.effectiveFilterWidth,h=t.padInfo.front,x=t.padInfo.top,b=t.padInfo.left;this.outputShape=t.outShape;let C=e==="avg",S="0.0";if(C||(S="-1.0 / 1e-20"),o){this.userCode=`
        const ivec3 strides =
            ivec3(${i}, ${l}, ${c});
        const ivec3 pads = ivec3(${h}, ${x}, ${b});

        void main() {
          ivec5 coords = getOutputCoords();
          int batch = coords.x;
          int ch = coords.u;

          ivec3 xCorner = ivec3(coords.y, coords.z, coords.w) * strides - pads;
          int xDCorner = xCorner.x;
          int xRCorner = xCorner.y;
          int xCCorner = xCorner.z;

          // max/min x(?, ?, ?, ch) to get y(yD, yR, yC, ch).
          // ? = to be determined
          float minMaxValue = 0.0;
          float minMaxValueFound = 0.0;
          int minMaxPosition = 0;

          for (int wD = 0; wD < ${f};
              wD += ${u}) {
            int xD = xDCorner + wD;

            if (xD < 0 || xD >= ${t.inDepth}) {
              continue;
            }

            for (int wR = 0; wR < ${d};
                wR += ${p}) {
              int xR = xRCorner + wR;

              if (xR < 0 || xR >= ${t.inHeight}) {
                continue;
              }

              for (int wC = 0; wC < ${g};
                  wC += ${m}) {
                int xC = xCCorner + wC;

                if (xC < 0 || xC >= ${t.inWidth}) {
                  continue;
                }

                float value = getX(batch, xD, xR, xC, ch);

                // If a min / max value has already been found, use it. If not,
                // use the current value.
                float currMinMaxValue = mix(
                    value, minMaxValue, minMaxValueFound);
                if (value >= currMinMaxValue) {
                  minMaxValue = value;
                  minMaxValueFound = 1.0;
                  minMaxPosition = ${n?s?`(((batch * ${t.inDepth} + xD) * ${t.inHeight} + xR) * ${t.inWidth} + xC) * ${t.inChannels} + ch`:`((xD * ${t.inHeight} + xR) * ${t.inWidth} + xC) * ${t.inChannels} + ch`:`wD * ${d} * ${g} +
                      wR * ${g} + wC`};
                }
              }
            }
          }
          setOutput(float(minMaxPosition));
        }
      `;return}let I="max",$=`${e}(${e}(${e}(minMaxValue[0], minMaxValue[1]), minMaxValue[2]), minMaxValue[3])`;e==="avg"&&($="avgValue / max(count, 1.0)");let R=Math.floor(a/4)*4,A=a%4,F=`
      if (${C}) {
        avgValue += dot(values, ones);
      } else {
        minMaxValue = ${I}(values, minMaxValue);
      }
    `;this.userCode=`
      const ivec3 strides =
        ivec3(${i}, ${l}, ${c});
      const ivec3 pads = ivec3(${h}, ${x}, ${b});
      const float initializationValue = ${S};
      const vec4 ones = vec4(1.0, 1.0, 1.0, 1.0);

      float count = 0.0;

      float getValue(int batch, int xD, int xR, int xC, int ch) {
        if (xC < 0 || xC >= ${t.inWidth}) {
          return initializationValue;
        }
        count += 1.0;
        return getX(batch, xD, xR, xC, ch);
      }

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int ch = coords.u;

        ivec3 xCorner = ivec3(coords.y, coords.z, coords.w) * strides - pads;
        int xDCorner = xCorner.x;
        int xRCorner = xCorner.y;
        int xCCorner = xCorner.z;

        // max/min x(?, ?, ?, d) to get y(yD, yR, yC, ch).
        // ? = to be determined
        vec4 minMaxValue = vec4(${S});
        float avgValue = 0.0;
        count = 0.0;

        for (int wD = 0; wD < ${f};
            wD += ${u}) {
          int xD = xDCorner + wD;

          if (xD < 0 || xD >= ${t.inDepth}) {
            continue;
          }

          for (int wR = 0; wR < ${d};
            wR += ${p}) {
            int xR = xRCorner + wR;

            if (xR < 0 || xR >= ${t.inHeight}) {
              continue;
            }

            for (int wC = 0; wC < ${R}; wC += 4) {
              int xC = xCCorner + wC * ${m};

              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                getValue(batch, xD, xR, xC + ${m}, ch),
                getValue(batch, xD, xR, xC + 2 * ${m}, ch),
                getValue(batch, xD, xR, xC + 3 * ${m}, ch)
              );

              ${F}
            }

            int xC = xCCorner + ${R};
            if (${A===1}) {
              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                initializationValue,
                initializationValue,
                initializationValue
              );

              ${F}
            } else if (${A===2}) {
              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                getValue(batch, xD, xR, xC + ${m}, ch),
                initializationValue,
                initializationValue
              );

              ${F}
            } else if (${A===3}) {
              vec4 values = vec4(
                getValue(batch, xD, xR, xC, ch),
                getValue(batch, xD, xR, xC + ${m}, ch),
                getValue(batch, xD, xR, xC + 2 * ${m}, ch),
                initializationValue
              );

              ${F}
            }
          }
        }
        setOutput(${$});
      }
    `}};function YB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t;io(n,"avgPool");let{filterSize:s,strides:a,pad:i,dimRoundingMode:l}=o,c=1;y.assert(N.eitherStridesOrDilationsAreOne(a,c),()=>`Error in avgPool: Either strides or dilations must be 1. Got strides ${a} and dilations '${c}'`);let u=N.computePool2DInfo(n.shape,s,a,c,i,l);if(u.filterWidth===1&&u.filterHeight===1&&y.arraysEqual(u.inShape,u.outShape))return re({inputs:{x:n},backend:e});let p=new Lr(u,"avg",!1);return e.runWebGLProgram(p,[n],"float32")}var oT={kernelName:Is,backendName:"webgl",kernelFunc:YB};function QB(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{filterSize:s,strides:a,pad:i,dimRoundingMode:l,dataFormat:c}=o,u=[1,1,1],p=N.computePool3DInfo(n.shape,s,a,u,i,l,c),m=new ps(p,"avg",!1);return e.runWebGLProgram(m,[n],"float32")}var nT={kernelName:ks,backendName:"webgl",kernelFunc:QB};var $m=class{constructor(t){this.variableNames=["dy"],this.outputShape=t.inShape;let e=t.filterHeight,o=t.filterWidth,n=t.strideHeight,s=t.strideWidth,a=t.dilationHeight,i=t.dilationWidth,l=t.effectiveFilterHeight,c=t.effectiveFilterWidth,u=l-1-t.padInfo.top,p=c-1-t.padInfo.left,m=1/(e*o);this.userCode=`
      const ivec2 pads = ivec2(${u}, ${p});
      const float avgMultiplier = float(${m});

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];

        ivec2 dyRCCorner = coords.yz - pads;
        int dyRCorner = dyRCCorner.x;
        int dyCCorner = dyRCCorner.y;

        // Convolve dy(?, ?, d) with pos mask(:, :, d) to get dx(xR, xC, d).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        for (int wR = 0; wR < ${l};
            wR += ${a}) {
          float dyR = float(dyRCorner + wR) / ${n}.0;

          if (dyR < 0.0 || dyR >= ${t.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);

          for (int wC = 0; wC < ${c};
            wC+= ${i}) {
            float dyC = float(dyCCorner + wC) / ${s}.0;

            if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                fract(dyC) > 0.0) {
              continue;
            }
            int idyC = int(dyC);

            float dyValue = getDy(b, idyR, idyC, d);

            dotProd += dyValue * avgMultiplier;
          }
        }
        setOutput(dotProd);
      }
    `}},Rm=class{constructor(t){this.variableNames=["dy"],this.outputShape=t.inShape;let e=t.filterDepth,o=t.filterHeight,n=t.filterWidth,s=t.strideDepth,a=t.strideHeight,i=t.strideWidth,l=t.dilationDepth,c=t.dilationHeight,u=t.dilationWidth,p=t.effectiveFilterDepth,m=t.effectiveFilterHeight,f=t.effectiveFilterWidth,d=p-1-t.padInfo.front,g=m-1-t.padInfo.top,h=f-1-t.padInfo.left,x=1/(e*o*n);this.userCode=`
      const ivec3 pads = ivec3(${d}, ${g}, ${h});
      const float avgMultiplier = float(${x});

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int ch = coords.u;

        ivec3 dyCorner = ivec3(coords.y, coords.z, coords.w) - pads;
        int dyDCorner = dyCorner.x;
        int dyRCorner = dyCorner.y;
        int dyCCorner = dyCorner.z;

        // Convolve dy(?, ?, ?, d) with pos mask(:, :, :, ch) to get
        // dx(xD, xR, xC, ch).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;

        for (int wD = 0; wD < ${p};
            wD += ${l}) {
          float dyD = float(dyDCorner + wD) / ${s}.0;

          if (dyD < 0.0 || dyD >= ${t.outDepth}.0 || fract(dyD) > 0.0) {
            continue;
          }
          int idyD = int(dyD);

          for (int wR = 0; wR < ${m};
              wR += ${c}) {
            float dyR = float(dyRCorner + wR) / ${a}.0;

            if (dyR < 0.0 || dyR >= ${t.outHeight}.0 ||
                fract(dyR) > 0.0) {
              continue;
            }
            int idyR = int(dyR);

            for (int wC = 0; wC < ${f};
                wC += ${u}) {
              float dyC = float(dyCCorner + wC) / ${i}.0;

              if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                  fract(dyC) > 0.0) {
                continue;
              }
              int idyC = int(dyC);

              float dyValue = getDy(batch, idyD, idyR, idyC, ch);

              dotProd += dyValue * avgMultiplier;
            }
          }
        }
        setOutput(dotProd);
      }
    `}};function ZB(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s}=t,a=s,{filterSize:i,strides:l,pad:c,dimRoundingMode:u}=o,p=[1,1,1],m=N.computePool3DInfo(a.shape,i,l,p,c,u),f=new Rm(m);return e.runWebGLProgram(f,[n],a.dtype)}var sT={kernelName:lc,backendName:"webgl",kernelFunc:ZB};function JB(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s}=t,a=s;io([n,s],"avgPoolGrad");let{filterSize:i,strides:l,pad:c}=o,u=N.computePool2DInfo(a.shape,i,l,1,c),p=new $m(u);return e.runWebGLProgram(p,[n],a.dtype)}var aT={kernelName:ic,backendName:"webgl",kernelFunc:JB};function tV(r){let{inputs:t,backend:e,attrs:o}=r,{a:n,b:s}=t,{transposeA:a,transposeB:i}=o;return zi({a:n,b:s,transposeA:a,transposeB:i,backend:e})}var iT={kernelName:Es,backendName:"webgl",kernelFunc:tV};var Am=class{constructor(t,e,o,n,s,a){this.outputShape=[],this.variableNames=["x","mean","variance"],N.assertAndGetBroadcastShape(t,e),N.assertAndGetBroadcastShape(t,o);let i="0.0";n!=null&&(N.assertAndGetBroadcastShape(t,n),this.variableNames.push("offset"),i="getOffsetAtOutCoords()");let l="1.0";s!=null&&(N.assertAndGetBroadcastShape(t,s),this.variableNames.push("scale"),l="getScaleAtOutCoords()"),this.outputShape=t,this.userCode=`
      void main() {
        float x = getXAtOutCoords();
        float mean = getMeanAtOutCoords();
        float variance = getVarianceAtOutCoords();
        float offset = ${i};
        float scale = ${l};
        float inv = scale * inversesqrt(variance + float(${a}));
        setOutput(dot(vec3(x, -mean, offset), vec3(inv, inv, 1)));
      }
    `}};var Fm=class{constructor(t,e,o,n,s,a){this.packedInputs=!0,this.packedOutput=!0,this.variableNames=["x","mean","variance"],N.assertAndGetBroadcastShape(t,e),N.assertAndGetBroadcastShape(t,o);let i="vec4(0.0)";n!=null&&(N.assertAndGetBroadcastShape(t,n),this.variableNames.push("offset"),i="getOffsetAtOutCoords()");let l="vec4(1.0)";s!=null&&(N.assertAndGetBroadcastShape(t,s),this.variableNames.push("scale"),l="getScaleAtOutCoords()"),this.outputShape=t,this.userCode=`
      void main() {
        vec4 offset = ${i};
        vec4 scale = ${l};

        vec4 x = getXAtOutCoords();
        vec4 mean = getMeanAtOutCoords();
        vec4 variance = getVarianceAtOutCoords();

        vec4 inv = scale * inversesqrt(variance + vec4(${a}));

        setOutput((x - mean) * inv + offset);
      }
    `}};var eV=({inputs:r,backend:t,attrs:e})=>{let{x:o,mean:n,variance:s,offset:a,scale:i}=r;y.assert(n.shape.length===s.shape.length,()=>"Batch normalization gradient requires mean and variance to have equal ranks."),y.assert(a==null||n.shape.length===a.shape.length,()=>"Batch normalization gradient requires mean and offset to have equal ranks."),y.assert(i==null||n.shape.length===i.shape.length,()=>"Batch normalization gradient requires mean and scale to have equal ranks.");let{varianceEpsilon:l}=e;l==null&&(l=.001);let c=[o,n,s],u=null;a!=null&&(u=a.shape,c.push(a));let p=null;i!=null&&(p=i.shape,c.push(i));let m=D().getBool("WEBGL_PACK_NORMALIZATION")?new Fm(o.shape,n.shape,s.shape,u,p,l):new Am(o.shape,n.shape,s.shape,u,p,l);return t.runWebGLProgram(m,c,c[0].dtype)},lT={kernelName:na,backendName:"webgl",kernelFunc:eV};var _m=class{constructor(t){this.variableNames=["source"],this.outputShape=t,this.rank=t.length;let e=ht(this.rank);this.customUniforms=[{name:"start",arrayIndex:this.rank,type:"int"}];let o=rV(this.rank),n,s=t.map((a,i)=>`sourceLoc.${wy[i]} = start[${i}] + coords.${wy[i]};`);n=`
        ${e} sourceLoc;
        ${e} coords = getOutputCoords();
        ${s.join(`
`)}
      `,this.userCode=`
      void main() {
        ${n}
        setOutput(getSource(${o}));
      }
    `}},wy=["x","y","z","w","u","v"];function rV(r){if(r===1)return"sourceLoc";if(r<=6)return wy.slice(0,r).map(t=>"sourceLoc."+t).join(",");throw Error(`Slicing for rank ${r} is not yet supported`)}var Dm=class{constructor(t){this.variableNames=["source"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=t,this.rank=t.length,this.customUniforms=[{name:"start",arrayIndex:this.rank,type:"int"}];let e=ht(this.rank),o=ee("coords",this.rank),n=ee("sourceLoc",this.rank),s=this.rank===1?"sourceLoc":`vec2(${n.slice(-2).join()})`,a=`getChannel(getSource(${n.join()}), ${s})`,i=`
      result.x = ${a};
      if (++${o[this.rank-1]} < ${t[this.rank-1]}) {
        ++${n[this.rank-1]};
        result.y = ${a};
        --${n[this.rank-1]};
      }
    `,l=this.rank===1?"":`
      --${o[this.rank-1]};
      if (++${o[this.rank-2]} < ${t[this.rank-2]}) {
        ++${n[this.rank-2]};
        result.z = ${a};
        if (++${o[this.rank-1]} < ${t[this.rank-1]}) {
          ++${n[this.rank-1]};
          result.w = ${a};
        }
      }
    `,c=this.rank<=4?`sourceLoc = coords +
            ${e}(${t.map((u,p)=>`start[${p}]`).join()});`:t.map((u,p)=>`${n[p]} = ${o[p]} + start[${p}];`).join(`
`);this.userCode=`
      void main() {
        ${e} coords = getOutputCoords();
        ${e} sourceLoc;
        ${c}
        vec4 result = vec4(0.);
        ${i}
        ${l}
        setOutput(result);
      }
    `}};function oV(r,t,e,o){let n=o.texData.get(r.dataId),s=o.makeTensorInfo(e,r.dtype),a=o.texData.get(s.dataId);Object.assign(a,n),a.refCount=1,a.shape=e,a.dtype=r.dtype;let i=me.computeFlatOffset(t,y.computeStrides(r.shape));n.slice&&(i+=n.slice.flatOffset),a.slice={flatOffset:i,origDataId:n.slice&&n.slice.origDataId||r.dataId};let l=o.dataRefCount.get(a.slice.origDataId)||1;return o.dataRefCount.set(a.slice.origDataId,l+1),s}function Br(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{begin:s,size:a}=o,[i,l]=me.parseSliceParams(n,s,a);if(me.assertParamsValid(n,i,l),y.sizeFromShape(l)===0)return e.makeTensorInfo(l,n.dtype,[]);if(e.shouldExecuteOnCPU([n])||n.dtype==="string"){let p=e.texData.get(n.dataId),m=JS(p.values,i,l,n.shape,n.dtype);return e.makeTensorInfo(l,n.dtype,m)}let{isPacked:c}=e.texData.get(n.dataId),u=me.isSliceContinous(n.shape,i,l);if(c||!u){let p=D().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new Dm(l):new _m(l),m=[i];return e.runWebGLProgram(p,[n],n.dtype,m)}return e.uploadToGPU(n.dataId),oV(n,i,l,e)}var cT={kernelName:Wa,backendName:"webgl",kernelFunc:Br};var nV=r=>{let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{blockShape:s,crops:a}=o;y.assert(n.shape.length<=4,()=>"batchToSpaceND for rank > 4 with a WebGL backend not implemented yet");let i=s.reduce((b,C)=>b*C),l=N.getReshaped(n.shape,s,i),c=N.getPermuted(l.length,s.length),u=N.getReshapedPermuted(n.shape,s,i),p=N.getSliceBeginCoords(a,s.length),m=N.getSliceSize(u,a,s.length),f=[],d=q({inputs:{x:n},backend:e,attrs:{shape:l}}),g=Wt({inputs:{x:d},backend:e,attrs:{perm:c}}),h=q({inputs:{x:g},backend:e,attrs:{shape:u}}),x=Br({inputs:{x:h},backend:e,attrs:{begin:p,size:m}});return f.push(d),f.push(g),f.push(h),f.forEach(b=>e.disposeIntermediateTensorInfo(b)),x},uT={kernelName:$s,backendName:"webgl",kernelFunc:nV};function sV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,weights:s}=t,{size:a}=o,i=e.readSync(n.dataId),l=e.readSync(s.dataId),c=fm(i,l,s.dtype,s.shape,a);return e.makeTensorInfo([a],s.dtype,c)}var pT={kernelName:Rs,backendName:"webgl",kernelFunc:sV};var aV=`
  int r = int(a.r) & int(b.r);
  int g = int(a.g) & int(b.g);
  int rb = int(a.b) & int(b.b);
  int ra = int(a.a) & int(b.a);
  return vec4(r, g, rb, ra);
`,iV=`
  return float(int(a.r) & int(b.r));
`;function lV(r){let{inputs:t,backend:e}=r,{a:o,b:n}=t,s=D().getBool("WEBGL_PACK_BINARY_OPERATIONS"),a=D().getNumber("WEBGL_VERSION");if(e.shouldExecuteOnCPU([o,n])||a===1){let l=e.texData.get(o.dataId).values,c=e.texData.get(n.dataId).values,[u,p]=CS(o.shape,n.shape,l,c,o.dtype),m=e.makeTensorInfo(p,o.dtype),f=e.texData.get(m.dataId);return f.values=u,m}let i;return s?i=new cr(aV,o.shape,n.shape,!1):i=new Je(iV,o.shape,n.shape),e.runWebGLProgram(i,[o,n],o.dtype)}var mT={kernelName:en,backendName:"webgl",kernelFunc:lV};function cV(r){let{inputs:t,backend:e}=r,{s0:o,s1:n}=t,s=e.readSync(o.dataId),a=e.readSync(n.dataId),i=N.assertAndGetBroadcastShape(Array.from(s),Array.from(a));return e.makeTensorInfo([i.length],"int32",Int32Array.from(i))}var fT={kernelName:As,backendName:"webgl",kernelFunc:cV};var uV="return float(a != b);",vy=_t({opSnippet:uV,cpuKernelImpl:US,dtype:"bool"}),dT={kernelName:Nn,backendName:"webgl",kernelFunc:vy};function Lo(r){let{inputs:t,backend:e}=r,{input:o}=t,n=e.texData.get(o.dataId);return re({inputs:{x:n.complexTensorInfos.real},backend:e})}var hT={kernelName:_a,backendName:"webgl",kernelFunc:Lo};var pV="return float(int(x));";function gT(r,t){let e=new ve(r.shape,pV),o=t.runWebGLProgram(e,[r],"int32");return{dataId:o.dataId,shape:o.shape,dtype:o.dtype}}function Sy(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{dtype:s}=o;if(s==="complex64"){if(n.dtype==="complex64")return re({inputs:{x:n},backend:e});let a=Xe(n.shape),i=Sy({inputs:{x:n},backend:e,attrs:{dtype:"float32"}}),l=tr({inputs:{real:i,imag:a},backend:e});return a.dispose(),e.disposeIntermediateTensorInfo(i),l}if(n.dtype==="complex64"){let a=Lo({inputs:{input:n},backend:e}),i=Sy({inputs:{x:a},backend:e,attrs:{dtype:s}});return e.disposeIntermediateTensorInfo(a),i}if(!y.hasEncodingLoss(n.dtype,s)){let a=re({inputs:{x:n},backend:e});return{dataId:a.dataId,shape:a.shape,dtype:s}}if(e.shouldExecuteOnCPU([n])){let a=e.texData.get(n.dataId).values,[i,l,c]=TS(a,n.shape,n.dtype,s);return e.makeTensorInfo(i,l,c)}if(s==="int32")return gT(n,e);if(s==="bool"){let a=e.makeTensorInfo([],"bool",y.getTypedArrayFromDType("bool",1)),l=vy({inputs:{a:n,b:a},backend:e});return e.disposeIntermediateTensorInfo(a),l}throw new Error(`Error in Cast: failed to cast ${n.dtype} to ${s}`)}var xT={kernelName:xo,backendName:"webgl",kernelFunc:Sy};var yT="return ceil(x);",mV=st({opSnippet:yT,packedOpSnippet:yT,cpuKernelImpl:NS}),bT={kernelName:rn,backendName:"webgl",kernelFunc:mV};var Om=class{constructor(t){this.variableNames=["A"],this.customUniforms=[{name:"minVal",type:"float"},{name:"maxVal",type:"float"}],this.outputShape=t,this.userCode=`

      void main() {
        float value = getAAtOutCoords();
        if (isnan(value)) {
          setOutput(value);
          return;
        }

        setOutput(clamp(value, minVal, maxVal));
      }
    `}};var Pm=class{constructor(t){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"minVal",type:"float"},{name:"maxVal",type:"float"}],this.outputShape=t,this.userCode=`
      void main() {
        vec4 value = getAAtOutCoords();

        if (any(isnan(value))) {
          setOutput(value);
          return;
        }

        setOutput(clamp(value, vec4(minVal), vec4(maxVal)));
      }
    `}};function fV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{clipValueMin:s,clipValueMax:a}=o,i;D().getBool("WEBGL_PACK_CLIP")?i=new Pm(n.shape):i=new Om(n.shape);let l=[[s],[a]];return e.runWebGLProgram(i,[n],n.dtype,l)}var wT={kernelName:on,backendName:"webgl",kernelFunc:fV};var Mm=class{constructor(t){this.variableNames=["real","imag"],this.outputShape=t,this.userCode=`
      void main() {
        float re = abs(getRealAtOutCoords());
        float im = abs(getImagAtOutCoords());
        float mx = max(re, im);

        // sadly the length function in glsl is not underflow-safe
        // (at least not on Intel GPUs). So the safe solution is
        // to ensure underflow-safety in all cases.
        setOutput(
          mx == 0.0 ? 0.0 : mx * length(vec2(1, min(re, im)/mx))
        );
      }
    `}};function vT(r,t){return{dataId:t.dataId,dtype:t.dtype,shape:r.shape}}function dV(r){let{inputs:t,backend:e}=r,{x:o}=t,n=e.texData.get(o.dataId),s=new Mm(o.shape),a=[vT(o,n.complexTensorInfos.real),vT(o,n.complexTensorInfos.imag)];return e.runWebGLProgram(s,a,a[0].dtype)}var ST={kernelName:_s,backendName:"webgl",kernelFunc:dV};var Lm=class{constructor(t){this.outputShape=[],this.outputShape=N.computeOutShape(t,1),this.variableNames=t.map((a,i)=>`T${i}`);let e=new Array(t.length-1);e[0]=t[0][1];for(let a=1;a<e.length;a++)e[a]=e[a-1]+t[a][1];let o=[`if (yC < ${e[0]}) setOutput(getT0(yR, yC));`];for(let a=1;a<e.length;a++){let i=e[a-1];o.push(`else if (yC < ${e[a]}) setOutput(getT${a}(yR, yC-${i}));`)}let n=e.length,s=e[e.length-1];o.push(`else setOutput(getT${n}(yR, yC-${s}));`),this.userCode=`
      void main() {
        ivec2 coords = getOutputCoords();
        int yR = coords.x;
        int yC = coords.y;

        ${o.join(`
        `)}
      }
    `}};var Vm=class{constructor(t,e){this.packedInputs=!0,this.packedOutput=!0,this.outputShape=[],this.outputShape=N.computeOutShape(t,e);let o=this.outputShape,n=o.length,s=ht(n),a=ee("coords",n),i=["x","y","z","w","u","v"].slice(0,n);this.variableNames=t.map((g,h)=>`T${h}`);let l=new Array(t.length-1);l[0]=t[0][e];for(let g=1;g<l.length;g++)l[g]=l[g-1]+t[g][e];let c=i[e],u=i.slice(-2),p=i.join(),m=`if (${c} < ${l[0]}) {
        return getChannel(
            getT0(${p}), vec2(${u.join()}));
        }`;for(let g=1;g<l.length;g++){let h=l[g-1];m+=`
        if (${c} < ${l[g]}  && ${c} >= ${l[g-1]}) {
          return getChannel(
            getT${g}(${Bm(i,c,h)}),
            vec2(${Bm(u,c,h)}));
        }`}let f=l.length,d=l[l.length-1];m+=`
        return getChannel(
          getT${f}(${Bm(i,c,d)}),
          vec2(${Bm(u,c,d)}));`,this.userCode=`
      float getValue(${i.map(g=>"int "+g)}) {
        ${m}
      }

      void main() {
        ${s} coords = getOutputCoords();
        vec4 result = vec4(getValue(${a}), 0., 0., 0.);

        ${a[n-1]} = ${a[n-1]} + 1;
        if (${a[n-1]} < ${o[n-1]}) {
          result.g = getValue(${a});
        }

        ${a[n-2]} = ${a[n-2]} + 1;
        if (${a[n-2]} < ${o[n-2]}) {
          result.a = getValue(${a});
        }

        ${a[n-1]} = ${a[n-1]} - 1;
        if (${a[n-2]} < ${o[n-2]} &&
            ${a[n-1]} < ${o[n-1]}) {
          result.b = getValue(${a});
        }
        setOutput(result);
      }
    `}};function Bm(r,t,e){let o=r.indexOf(t);return r.map((s,a)=>a===o?`${s} - ${e}`:s).join()}function Wi(r){let{inputs:t,backend:e}=r,{input:o}=t,n=e.texData.get(o.dataId);return re({inputs:{x:n.complexTensorInfos.imag},backend:e})}var CT={kernelName:la,backendName:"webgl",kernelFunc:Wi};function Hl(r,t,e){let o=r[0].dtype;if(o==="complex64"){let f=r.map(b=>Lo({inputs:{input:b},backend:e})),d=r.map(b=>Wi({inputs:{input:b},backend:e})),g=Hl(f,t,e),h=Hl(d,t,e),x=tr({inputs:{real:g,imag:h},backend:e});return f.forEach(b=>e.disposeIntermediateTensorInfo(b)),d.forEach(b=>e.disposeIntermediateTensorInfo(b)),e.disposeIntermediateTensorInfo(g),e.disposeIntermediateTensorInfo(h),x}let n=e.shouldExecuteOnCPU(r);if(o==="string"&&(n=!0),n){let f=r.map(S=>{let $=[-1,y.sizeFromShape(S.shape.slice(t))];return q({inputs:{x:S},backend:e,attrs:{shape:$}})}),d=f.map(S=>({vals:e.readSync(S.dataId),shape:S.shape})),g=N.computeOutShape(f.map(S=>S.shape),1),h=f[0].shape[0]===1,x=IS(d,g,o,h),b=N.computeOutShape(r.map(S=>S.shape),t),C=e.makeTensorInfo(b,o,x);return f.forEach(S=>e.disposeIntermediateTensorInfo(S)),C}let s=r.filter(f=>y.sizeFromShape(f.shape)>0),a=D().getBool("WEBGL_PACK_ARRAY_OPERATIONS")&&s[0].shape.length>1;if(s.length===1){let f=a?new ve(r[0].shape,co):new Ze(r[0].shape,co);return e.runWebGLProgram(f,r,o)}let i=D().getNumber("WEBGL_MAX_TEXTURES_IN_SHADER");if(s.length>i){let f=[];for(let g=0;g<s.length;g+=i){let h=s.slice(g,g+i);f.push(Hl(h,t,e))}let d=Hl(f,t,e);for(let g of f)e.disposeIntermediateTensorInfo(g);return d}if(a){let f=new Vm(s.map(d=>d.shape),t);return e.runWebGLProgram(f,s,o)}let{tensors2D:l,outShape:c}=hV(s,t,e),u=new Lm(l.map(f=>f.shape)),p=e.runWebGLProgram(u,l,o);l.forEach(f=>e.disposeIntermediateTensorInfo(f));let m=q({inputs:{x:p},attrs:{shape:c},backend:e});return e.disposeIntermediateTensorInfo(p),m}function hV(r,t,e){let o=N.computeOutShape(r.map(s=>s.shape),t);return{tensors2D:r.map(s=>q({inputs:{x:s},attrs:{shape:[-1,y.sizeFromShape(s.shape.slice(t))]},backend:e})),outShape:o}}function Cy(r){let{inputs:t,backend:e,attrs:o}=r,{axis:n}=o,s=y.parseAxisParam(n,t[0].shape)[0],a=t.map(c=>c.shape);N.assertParamsConsistent(a,s);let i=N.computeOutShape(t.map(c=>c.shape),s);if(y.sizeFromShape(i)===0)return e.makeTensorInfo(i,t[0].dtype,[]);let l=t.filter(c=>y.sizeFromShape(c.shape)>0);return l.length===1?re({inputs:{x:l[0]},backend:e}):Hl(l,s,e)}var TT={kernelName:Ds,backendName:"webgl",kernelFunc:Cy};var Kl=class{constructor(t,e=!1,o=null,n=!1,s=!1){this.variableNames=["x","W"],this.outputShape=t.outShape;let a=t.padInfo.top,i=t.padInfo.left,l=t.strideHeight,c=t.strideWidth,u=t.dilationHeight,p=t.dilationWidth,m=t.filterHeight,f=t.filterWidth,d=Math.floor(t.inChannels/4)*4,g=t.inChannels%4,h=t.dataFormat==="channelsLast",x=h?1:2,b=h?2:3,C=h?3:1,S="",I="";o&&(n?S=`float activation(float a) {
          float b = getPreluActivationWeightsAtOutCoords();
          ${o}
        }`:s?S=`float activation(float a) {
          float b = getLeakyreluAlphaAtOutCoords();
          ${o}
        }`:S=`
          float activation(float x) {
            ${o}
          }
        `,I="result = activation(result);");let $=e?"result += getBiasAtOutCoords();":"";e&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),s&&this.variableNames.push("leakyreluAlpha"),this.userCode=`
      ${S}

      const ivec2 strides = ivec2(${l}, ${c});
      const ivec2 pads = ivec2(${a}, ${i});

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d2 = coords[${C}];

        ivec2 xRCCorner =
            ivec2(coords[${x}], coords[${b}]) * strides - pads;
        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        // Convolve x(?, ?, d1) with w(:, :, d1, d2) to get y(yR, yC, d2).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        for (int wR = 0; wR < ${m}; wR++) {
          int xR = xRCorner + wR * ${u};

          if (xR < 0 || xR >= ${t.inHeight}) {
            continue;
          }

          for (int wC = 0; wC < ${f}; wC++) {
            int xC = xCCorner + wC * ${p};

            if (xC < 0 || xC >= ${t.inWidth}) {
              continue;
            }

            for (int d1 = 0; d1 < ${d}; d1 += 4) {
              vec4 wValues = vec4(
                getW(wR, wC, d1, d2),
                getW(wR, wC, d1 + 1, d2),
                getW(wR, wC, d1 + 2, d2),
                getW(wR, wC, d1 + 3, d2)
              );

              if (${h}) {
                vec4 xValues = vec4(
                  getX(batch, xR, xC, d1),
                  getX(batch, xR, xC, d1 + 1),
                  getX(batch, xR, xC, d1 + 2),
                  getX(batch, xR, xC, d1 + 3)
                );
                dotProd += dot(xValues, wValues);
              } else {
                vec4 xValues = vec4(
                  getX(batch, d1, xR, xC),
                  getX(batch, d1 + 1, xR, xC),
                  getX(batch, d1 + 2, xR, xC),
                  getX(batch, d1 + 3, xR, xC)
                );
                dotProd += dot(xValues, wValues);
              }
            }

            if (${g===1}) {

              if (${h}) {
                dotProd +=
                    getX(batch, xR, xC, ${d}) *
                    getW(wR, wC, ${d}, d2);
              } else {
                dotProd +=
                    getX(batch, ${d}, xR, xC) *
                    getW(wR, wC, ${d}, d2);
              }

            } else if (${g===2}) {
              vec2 wValues = vec2(
                getW(wR, wC, ${d}, d2),
                getW(wR, wC, ${d} + 1, d2)
              );

              if (${h}) {
                vec2 xValues = vec2(
                  getX(batch, xR, xC, ${d}),
                  getX(batch, xR, xC, ${d} + 1)
                );
                dotProd += dot(xValues, wValues);
              } else {
                vec2 xValues = vec2(
                  getX(batch, ${d}, xR, xC),
                  getX(batch, ${d} + 1, xR, xC)
                );
                dotProd += dot(xValues, wValues);
              }

            } else if (${g===3}) {
              vec3 wValues = vec3(
                getW(wR, wC, ${d}, d2),
                getW(wR, wC, ${d} + 1, d2),
                getW(wR, wC, ${d} + 2, d2)
              );

              if (${h}) {
                vec3 xValues = vec3(
                  getX(batch, xR, xC, ${d}),
                  getX(batch, xR, xC, ${d} + 1),
                  getX(batch, xR, xC, ${d} + 2)
                );
                dotProd += dot(xValues, wValues);
              } else {
                vec3 xValues = vec3(
                  getX(batch, ${d}, xR, xC),
                  getX(batch, ${d} + 1, xR, xC),
                  getX(batch, ${d} + 2, xR, xC)
                );
                dotProd += dot(xValues, wValues);
              }

            }
          }
        }

        float result = dotProd;
        ${$}
        ${I}
        setOutput(result);
      }
    `}},zm=class{constructor(t){this.variableNames=["x","W"],this.outputShape=t.outShape;let e=t.padInfo.front,o=t.padInfo.top,n=t.padInfo.left,s=t.strideDepth,a=t.strideHeight,i=t.strideWidth,l=t.dilationDepth,c=t.dilationHeight,u=t.dilationWidth,p=t.filterDepth,m=t.filterHeight,f=t.filterWidth,d=Math.floor(t.inChannels/4)*4,g=t.inChannels%4;this.userCode=`
      const ivec3 strides = ivec3(${s}, ${a}, ${i});
      const ivec3 pads = ivec3(${e}, ${o}, ${n});

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int d2 = coords.u;

        ivec3 xFRCCorner = ivec3(coords.y, coords.z, coords.w) * strides - pads;
        int xFCorner = xFRCCorner.x;
        int xRCorner = xFRCCorner.y;
        int xCCorner = xFRCCorner.z;

        // Convolve x(?, ?, ?, d1) with w(:, :, :, d1, d2) to get
        // y(yF, yR, yC, d2). ? = to be determined. : = across all
        // values in that axis.
        float dotProd = 0.0;
        for (int wF = 0; wF < ${p}; wF++) {
          int xF = xFCorner + wF * ${l};

          if (xF < 0 || xF >= ${t.inDepth}) {
            continue;
          }

          for (int wR = 0; wR < ${m}; wR++) {
            int xR = xRCorner + wR * ${c};

            if (xR < 0 || xR >= ${t.inHeight}) {
              continue;
            }

            for (int wC = 0; wC < ${f}; wC++) {
              int xC = xCCorner + wC * ${u};

              if (xC < 0 || xC >= ${t.inWidth}) {
                continue;
              }

              for (int d1 = 0; d1 < ${d}; d1 += 4) {
                vec4 xValues = vec4(
                  getX(batch, xF, xR, xC, d1),
                  getX(batch, xF, xR, xC, d1 + 1),
                  getX(batch, xF, xR, xC, d1 + 2),
                  getX(batch, xF, xR, xC, d1 + 3)
                );
                vec4 wValues = vec4(
                  getW(wF, wR, wC, d1, d2),
                  getW(wF, wR, wC, d1 + 1, d2),
                  getW(wF, wR, wC, d1 + 2, d2),
                  getW(wF, wR, wC, d1 + 3, d2)
                );

                dotProd += dot(xValues, wValues);
              }

              if (${g===1}) {
                dotProd +=
                  getX(batch, xF, xR, xC, ${d}) *
                  getW(wF, wR, wC, ${d}, d2);
              } else if (${g===2}) {
                vec2 xValues = vec2(
                  getX(batch, xF, xR, xC, ${d}),
                  getX(batch, xF, xR, xC, ${d} + 1)
                );
                vec2 wValues = vec2(
                  getW(wF, wR, wC, ${d}, d2),
                  getW(wF, wR, wC, ${d} + 1, d2)
                );
                dotProd += dot(xValues, wValues);
              } else if (${g===3}) {
                vec3 xValues = vec3(
                  getX(batch, xF, xR, xC, ${d}),
                  getX(batch, xF, xR, xC, ${d} + 1),
                  getX(batch, xF, xR, xC, ${d} + 2)
                );
                vec3 wValues = vec3(
                  getW(wF, wR, wC, ${d}, d2),
                  getW(wF, wR, wC, ${d} + 1, d2),
                  getW(wF, wR, wC, ${d} + 2, d2)
                );
                dotProd += dot(xValues, wValues);
              }
            }
          }
        }
        setOutput(dotProd);
      }
    `}};var ql=class{constructor(t,e=!1,o=null,n=!1,s=!1){this.variableNames=["x","W"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"pads",type:"ivec2"},{name:"strides",type:"ivec2"},{name:"dilations",type:"ivec2"},{name:"inDims",type:"ivec2"}],this.outputShape=t.outShape,this.enableShapeUniforms=Mt(this.outputShape.length);let a=t.padInfo.left,i=t.strideWidth,l=t.dilationWidth,c=t.filterHeight,u=t.filterWidth,p=u,m=`
       int xR; int xC; int xCOffset;
       vec4 wTexel; vec4 previous; vec4 final;`;for(let h=0;h<u;h++)m+=`
           vec4 xTexelC${h*2};
           int xTexelC${h*2}Ready;
           vec4 xTexelC${h*2+1};
           int xTexelC${h*2+1}Ready;
           vec4 xC${h};`;m+=`
     for (int r = 0; r < ${c}; r++) {
      for (int d1 = 0; d1 < ${t.inChannels}; d1 += 2) {
       `;for(let h=0;h<u;h++)m+=`
           xTexelC${h*2} = vec4(0.0);
           xTexelC${h*2}Ready = 0;
           xTexelC${h*2+1} = vec4(0.0);
           xTexelC${h*2+1}Ready = 0;
           xC${h} = vec4(0.0);`;m+=`
         xR = xRCorner + r * dilations[0];
         if (xR >=0 && xR < inDims[0]) {
       `;for(let h=0;h<(p+1)/2;h++){let x=h*2;if(m+=`
           xC = xCCorner + ${x*l};
           `,i===1){if(x<u&&(a%2===1?(m+=`
                 xCOffset = xC + 1;
                 if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${x}Ready == 0) {
                   xTexelC${x} = getX(batch, xR, xCOffset, d1);

                   // Need to manually clear unused channels in case
                   // we're reading from recycled texture.
                   if (xCOffset + 1 >= inDims[1]) {
                     xTexelC${x}.zw = vec2(0.0);
                   }
                   xTexelC${x}Ready = 1;
                 }
               `,l===1&&x>0?m+=`
                 xC${x} = vec4(xTexelC${x-2}.zw, xTexelC${x}.xy);
                 `:m+=`
                   xCOffset = xC + 1 - 2;

                   if (xCOffset >= 0 && xCOffset < inDims[1]) {
                     previous = getX(batch, xR, xCOffset, d1);

                     // Need to manually clear unused channels in case
                     // we're reading from recycled texture.
                     if (xCOffset + 1 >= inDims[1]) {
                       previous.zw = vec2(0.0);
                     }

                     xC${x} = vec4(previous.zw, xTexelC${x}.xy);
                   } else {
                     xC${x} = vec4(0.0, 0.0, xTexelC${x}.xy);
                   }
                   `):m+=`
                 if (xC >= 0 && xC < inDims[1] && xTexelC${x}Ready == 0) {
                   xTexelC${x} = getX(batch, xR, xC, d1);
                   if (xC + 1 >= inDims[1]) {
                     xTexelC${x}.zw = vec2(0.0);
                   }
                   xTexelC${x}Ready = 1;
                 }

                 xC${x} = xTexelC${x};
                 `,x+1<u)){let b=a%2===0?y.nearestLargerEven(l):l;l%2===0&&a%2===1||l%2!==0&&a%2!==1?(m+=`
                   xCOffset = xC + imod(pads[1], 2) + ${b};

                   if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${x+1}Ready == 0) {
                     xTexelC${x+1} = getX(batch, xR, xCOffset, d1);

                     // Need to manually clear unused channels in case
                     // we're reading from recycled texture.
                     if (xCOffset + 1 >= inDims[1]) {
                       xTexelC${x+1}.zw = vec2(0.0);
                     }
                     xTexelC${x+1}Ready = 1;
                   }
                   `,l>1?m+=`
                     xCOffset -= 2;
                     if (xCOffset >= 0 && xCOffset < inDims[1]) {
                      previous = getX(batch, xR, xCOffset, d1);
                      xC${x+1} = vec4(previous.zw, xTexelC${x+1}.xy);
                     } else {
                      xC${x+1} = vec4(0.0, 0.0, xTexelC${x+1}.xy);
                     }
                     `:m+=`
                     xC${x+1} = vec4(xTexelC${x}.zw, xTexelC${x+1}.xy);
                     `):b===1?m+=`
                     xC${x+1} = xTexelC${x};
                     `:m+=`
                     xCOffset = xC + ${b};

                     if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${x+1}Ready == 0) {
                       xTexelC${x+1} = getX(batch, xR, xCOffset, d1);
                       if (xCOffset + 1 >= inDims[1]) {
                         xTexelC${x+1}.zw = vec2(0.0);
                       }
                       xTexelC${x+1}Ready = 1;
                     }

                     xC${x+1} = xTexelC${x+1};
                     `}}else x<u&&(a%2===1?(m+=`
                 xCOffset = xC + 1 - strides[1];
                 if(xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${x}Ready == 0) {
                   xTexelC${x} = getX(batch, xR, xCOffset, d1);
                   // Need to manually clear unused channels in case
                   // we're reading from recycled texture.
                   if (xCOffset + 1 >= inDims[1]) {
                     xTexelC${x}.zw = vec2(0.0);
                   }
                   xTexelC${x}Ready = 1;
                 }

                 if(xC + 1 >= 0 && xC + 1 < inDims[1] && xTexelC${x+1}Ready == 0) {
                   xTexelC${x+1} = getX(batch, xR, xC + 1, d1);
                   // Need to manually clear unused channels in case
                   // we're reading from recycled texture.
                   if (xC + 2 >= inDims[1]) {
                     xTexelC${x+1}.zw = vec2(0.0);
                   }
                   xTexelC${x+1}Ready = 1;
                 }

                 xC${x} = vec4(xTexelC${x}.zw, xTexelC${x+1}.zw);
               `,x+1<u&&(m+=`
                   final = vec4(0.0);
                   xCOffset = xC + 1 + strides[1];
                   if(xCOffset >= 0 && xCOffset < inDims[1]) {
                     final = getX(batch, xR, xCOffset, d1);
                   }
                   xC${x+1} = vec4(xTexelC${x+1}.xy, final.xy);
                 `)):(m+=`
                 if(xC >= 0 && xC < inDims[1] && xTexelC${x}Ready == 0) {
                   xTexelC${x} = getX(batch, xR, xC, d1);
                   if (xC + 1 >= inDims[1]) {
                     xTexelC${x}.zw = vec2(0.0);
                   }
                   xTexelC${x}Ready = 1;
                 }

                 xCOffset = xC + strides[1];
                 if(xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${x+1}Ready == 0) {
                   xTexelC${x+1} = getX(batch, xR, xCOffset, d1);
                   if (xCOffset + 1 >= inDims[1]) {
                     xTexelC${x+1}.zw = vec2(0.);
                   }
                   xTexelC${x+1}Ready = 1;
                 }

                 xC${x} = vec4(
                   xTexelC${x}.xy, xTexelC${x+1}.xy);
               `,x+1<u&&(m+=`
                   xC${x+1} = vec4(xTexelC${x}.zw, xTexelC${x+1}.zw);
                 `)));x<u&&(m+=`
             wTexel = getW(r, ${x}, d1, d2);
             dotProd += xC${x}.xxzz * vec4(wTexel.xy, wTexel.xy);
             if(d1 + 1 < ${t.inChannels}) {
               dotProd += xC${x}.yyww * vec4(wTexel.zw, wTexel.zw);
             }
           `,x+1<u&&(m+=`
               wTexel = getW(r, ${x+1}, d1, d2);
               dotProd += xC${x+1}.xxzz * vec4(wTexel.xy, wTexel.xy);
               if(d1 + 1 < ${t.inChannels}) {
                 dotProd += xC${x+1}.yyww * vec4(wTexel.zw, wTexel.zw);
               }
             `))}m+=`
     }
   `,m+=`
     }
   `,m+=`
     }
   `;let f="",d="";o&&(n?f=`vec4 activation(vec4 a) {
           vec4 b = getPreluActivationWeightsAtOutCoords();
           ${o}
         }`:s?f=`vec4 activation(vec4 a) {
           vec4 b = getLeakyreluAlphaAtOutCoords();
           ${o}
         }`:f=`vec4 activation(vec4 x) {
           ${o}
         }`,d="result = activation(result);");let g=e?"result += getBiasAtOutCoords();":"";e&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),s&&this.variableNames.push("leakyreluAlpha"),this.userCode=`
       ${f}

       void main() {
         ivec4 coords = getOutputCoords();
         int batch = coords.x;
         ivec2 xRCCorner = coords.yz * strides - pads;
         int d2 = coords.w;
         int xRCorner = xRCCorner.x;
         int xCCorner = xRCCorner.y;

         //intialize dotProd with a small epsilon seems to reduce GPU accuracy loss.
         vec4 dotProd = vec4(0.000000000000001);

         ${m}

         vec4 result = dotProd - vec4(0.000000000000001);
         ${g}
         ${d}
         setOutput(result);
       }
     `}};var Wm=class{constructor(t,e){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"inputShape",type:"ivec4"},{name:"pad",type:"ivec2"},{name:"stride",type:"ivec2"},{name:"dilation",type:"ivec2"},{name:"inChannels",type:"int"},{name:"itemsPerBlockRow",type:"int"},{name:"outWidth",type:"int"}],this.outputShape=t,this.enableShapeUniforms=Mt(this.outputShape.length);let{dataFormat:o}=e,n=jt(),s=o==="channelsLast",a=s?1:2,i=s?2:3,l=this.enableShapeUniforms?"if(blockIndex < outShape[2] && pos < outShape[1]) {":`if(blockIndex < ${t[2]} && pos < ${t[1]}) {`,c="";for(let u=0;u<=1;u++)for(let p=0;p<=1;p++)c+=`
          blockIndex = rc.z + ${p};
          pos = rc.y + ${u};

          ${l}
            offsetY = int(blockIndex / outWidth) * stride[0] - pad[0];
            d0 = offsetY + dilation[0] * (pos / itemsPerBlockRow);

            if(d0 < inputShape[${a}] && d0 >= 0) {
              // Use custom imod instead mod. On Intel GPU, mod may generate
              // unexpected value.
              // https://github.com/tensorflow/tfjs/issues/5447
              offsetX = imod(blockIndex, outWidth) * stride[1] - pad[1];
              d1 = offsetX + dilation[1] * (imod(pos, itemsPerBlockRow) /
                  inChannels);

              if(d1 < inputShape[${i}] && d1 >= 0) {

                ch = imod(pos, inChannels);

                if (${s}) {
                  innerDims = vec2(d1, ch);
                  result[${u*2+p}] = getChannel(
                    getA(rc.x, d0, int(innerDims.x),
                    int(innerDims.y)), innerDims);
                } else {
                  innerDims = vec2(d0, d1);
                  result[${u*2+p}] = getChannel(
                    getA(rc.x, ch, int(innerDims.x),
                    int(innerDims.y)), innerDims);
                }
              }
            }
          }
        `;this.userCode=`
      void main() {
        ivec3 rc = getOutputCoords();

        vec4 result = vec4(0);

        int blockIndex, pos, offsetY, d0, offsetX, d1, ch;
        vec2 innerDims;

        ${c}

        ${n.output} = result;
      }
    `}};function Gm(r,t){let e=r.length;return e>=3?t?[...r.slice(0,-3),r[e-3]*r[e-2],r[e-1]]:[...r.slice(0,-3),r[e-3],r[e-2]*r[e-1]]:!t&&e===1&&r[0]>1?[r[0],1]:null}function Um({x:r,filter:t,convInfo:e,backend:o,bias:n=null,preluActivationWeights:s=null,leakyreluAlpha:a=0,activation:i=null}){let l=r.shape,c=o.texData.get(r.dataId),u=e.inChannels,p=l[0]*l[1]*l[2],m=e.outChannels,f=e.dataFormat==="channelsLast",d=!1,g=!1,h,x=[];if(s!=null){let S=Gm(s.shape,f);S!=null&&(s=q({inputs:{x:s},backend:o,attrs:{shape:S}}),x.push(s))}if(n!=null){let S=Gm(n.shape,f);S!=null&&(n=q({inputs:{x:n},backend:o,attrs:{shape:S}}),x.push(n))}if(!((p===1||m===1)&&u>by)&&c.isPacked&&f&&c.texture!=null&&l[2]%2!==0&&y.arraysEqual(c.shape.slice(-3),l.slice(-3))){let S=l[0]*l[1]*(l[2]+1),I={dataId:r.dataId,shape:[1,S,e.inChannels],dtype:r.dtype},$=c.shape;c.shape=c.shape.slice(),c.shape[c.shape.length-2]++,y.assert(Oi(c.shape,I.shape),()=>`packed reshape ${c.shape} to ${I.shape} isn't free`);let R=q({inputs:{x:t},backend:o,attrs:{shape:[1,e.inChannels,e.outChannels]}});x.push(R);let A=zi({a:I,b:R,backend:o,transposeA:d,transposeB:g,bias:n,activation:i,preluActivationWeights:s,leakyreluAlpha:a}),F=o.texData.get(A.dataId);y.assert(F.isPacked,()=>"batchMatMul result is expected to be packed"),c.shape=$,F.shape=e.outShape,h=re({inputs:{x:A},backend:o}),h.shape=e.outShape,x.push(A)}else{let S=e.outHeight*e.outWidth,I=q({inputs:{x:r},backend:o,attrs:{shape:f?[e.batchSize,S,e.inChannels]:[e.batchSize,e.inChannels,S]}}),$=q({inputs:{x:t},backend:o,attrs:{shape:[1,e.inChannels,e.outChannels]}}),R=zi({a:f?I:$,b:f?$:I,transposeA:!f,transposeB:g,backend:o,bias:n,activation:i,preluActivationWeights:s,leakyreluAlpha:a});h=q({inputs:{x:R},backend:o,attrs:{shape:e.outShape}}),x.push(I),x.push($),x.push(R)}for(let S of x)o.disposeIntermediateTensorInfo(S);return h}function Hm({x:r,filter:t,convInfo:e,backend:o,bias:n=null,preluActivationWeights:s=null,leakyreluAlpha:a=0,activation:i=null}){let{filterWidth:l,filterHeight:c,inChannels:u,outWidth:p,outHeight:m,dataFormat:f}=e,d=f==="channelsLast",g=l*c*u,h=m*p,x=[e.batchSize,g,h],b=!0,C=!1,S=[];if(s!=null){let W=Gm(s.shape,d);W!=null&&(s=q({inputs:{x:s},backend:o,attrs:{shape:W}}),S.push(s))}if(n!=null){let W=Gm(n.shape,d);W!=null&&(n=q({inputs:{x:n},backend:o,attrs:{shape:W}}),S.push(n))}let I=q({inputs:{x:t},backend:o,attrs:{shape:[1,g,y.sizeFromShape(t.shape)/g]}});S.push(I);let $=new Wm(x,e),R=[r.shape,[e.padInfo.top,e.padInfo.left],[e.strideHeight,e.strideWidth],[e.dilationHeight,e.dilationWidth],[e.inChannels],[e.filterWidth*e.inChannels],[e.outWidth]],A=o.runWebGLProgram($,[r],"float32",R),F=q({inputs:{x:A},backend:o,attrs:{shape:x}});S.push(A),S.push(F);let _=n!=null,O=s!=null,M=i==="leakyrelu",P=i?Mo(i,!0):null,B=new Ul(d?F.shape:I.shape,d?I.shape:F.shape,d?[e.batchSize,h,e.outChannels]:[e.batchSize,e.outChannels,h],b,C,_,P,O,M),V=d?[F,I]:[I,F];if(n&&V.push(n),O&&V.push(s),M){let W=o.makeTensorInfo([],"float32",y.createScalarValue(a,"float32"));V.push(W),S.push(W)}let z=o.runWebGLProgram(B,V,"float32"),G=q({inputs:{x:z},backend:o,attrs:{shape:e.outShape}});S.push(z);for(let W of S)o.disposeIntermediateTensorInfo(W);return G}function gV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dataFormat:l,dilations:c,dimRoundingMode:u}=o,p=N.convertConv2DDataFormat(l),m=N.computeConv2DInfo(n.shape,s.shape,a,c,i,u,!1,p),f;if(m.filterHeight===1&&m.filterWidth===1&&m.dilationHeight===1&&m.dilationWidth===1&&m.strideHeight===1&&m.strideWidth===1&&(m.padInfo.type==="SAME"||m.padInfo.type==="VALID"))f=Um({x:n,filter:s,convInfo:m,backend:e});else if(m.strideWidth<=2&&p==="channelsLast"&&D().getBool("WEBGL_EXP_CONV")){let g=new ql(m),h=[[m.padInfo.top,m.padInfo.left],[m.strideHeight,m.strideWidth],[m.dilationHeight,m.dilationWidth],[m.inHeight,m.inWidth]];f=e.runWebGLProgram(g,[n,s],"float32",h)}else if(D().getBool("WEBGL_CONV_IM2COL"))f=Hm({x:n,filter:s,convInfo:m,backend:e});else{let g=new Kl(m);f=e.runWebGLProgram(g,[n,s],"float32")}let d=q({inputs:{x:f},backend:e,attrs:{shape:m.outShape}});return e.disposeIntermediateTensorInfo(f),d}var NT={kernelName:Os,backendName:"webgl",kernelFunc:gV};var Km=class{constructor(t){this.variableNames=["x","dy"],this.outputShape=t.filterShape;let e=t.strideHeight,o=t.strideWidth,n=t.padInfo.top,s=t.padInfo.left,a=t.dataFormat==="channelsLast";this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int wR = coords.x;
        int wC = coords.y;
        int d1 = coords.z;
        int d2 = coords.w;

        // Convolve x(?, ?, d1) with dy(:, :, d2) to get dw(wR, wC, d1, d2).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;

        for (int b = 0; b < ${t.batchSize}; b++) {
          for (int yR = 0; yR < ${t.outHeight}; yR++) {
            int xR = wR + yR * ${e} - ${n};

            if (xR < 0 || xR >= ${t.inHeight}) {
              continue;
            }

            for (int yC = 0; yC < ${t.outWidth}; yC++) {
              int xC = wC + yC * ${o} - ${s};

              if (xC < 0 || xC >= ${t.inWidth}) {
                continue;
              }

              ${a?`float dyValue = getDy(b, yR, yC, d2);
              float xValue = getX(b, xR, xC, d1);
              dotProd += (xValue * dyValue);`:`float dyValue = getDy(b, d2, yR, yC);
              float xValue = getX(b, d1, xR, xC);
              dotProd += (xValue * dyValue);`}
            }
          }
        }
        setOutput(dotProd);
      }
    `}},qm=class{constructor(t){this.variableNames=["dy","W"],this.outputShape=t.inShape;let e=t.filterHeight,o=t.filterWidth,n=t.strideHeight,s=t.strideWidth,a=t.dataFormat==="channelsLast",i=e-1-t.padInfo.top,l=o-1-t.padInfo.left,c=a?1:2,u=a?2:3,p=a?3:1;this.userCode=`
      const ivec2 pads = ivec2(${i}, ${l});

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d1 = coords[${p}];

        ivec2 dyCorner = ivec2(coords[${c}], coords[${u}]) - pads;
        int dyRCorner = dyCorner.x;
        int dyCCorner = dyCorner.y;

        // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        for (int wR = 0; wR < ${e}; wR++) {
          float dyR = float(dyRCorner + wR) / ${n}.0;

          if (dyR < 0.0 || dyR >= ${t.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);

          int wRPerm = ${e} - 1 - wR;

          for (int wC = 0; wC < ${o}; wC++) {
            float dyC = float(dyCCorner + wC) / ${s}.0;

            if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                fract(dyC) > 0.0) {
              continue;
            }
            int idyC = int(dyC);

            int wCPerm = ${o} - 1 - wC;

            for (int d2 = 0; d2 < ${t.outChannels}; d2++) {

              if (${a}) {
                float xValue = getDy(batch, idyR, idyC, d2);
                float wValue = getW(wRPerm, wCPerm, d1, d2);
                dotProd += xValue * wValue;
              } else {
                float xValue = getDy(batch, d2, idyR, idyC);
                float wValue = getW(wRPerm, wCPerm, d1, d2);
                dotProd += xValue * wValue;
              }

            }
          }
        }
        setOutput(dotProd);
      }
    `}},jm=class{constructor(t){this.variableNames=["x","dy"],this.outputShape=t.filterShape;let e=t.strideDepth,o=t.strideHeight,n=t.strideWidth,s=t.padInfo.front,a=t.padInfo.top,i=t.padInfo.left;this.userCode=`
      void main() {
        ivec5 coords = getOutputCoords();
        int wF = coords.x;
        int wR = coords.y;
        int wC = coords.z;
        int d1 = coords.w;
        int d2 = coords.u;

        float dotProd = 0.0;

        for (int b = 0; b < ${t.batchSize}; b++) {
          for (int yF = 0; yF < ${t.outDepth}; yF++) {
            int xF = wF + yF * ${e} - ${s};

            if (xF < 0 || xF >= ${t.inDepth}) {
              continue;
            }

            for (int yR = 0; yR < ${t.outHeight}; yR++) {
              int xR = wR + yR * ${o} - ${a};

              if (xR < 0 || xR >= ${t.inHeight}) {
                continue;
              }

              for (int yC = 0; yC < ${t.outWidth}; yC++) {
                int xC = wC + yC * ${n} - ${i};

                if (xC < 0 || xC >= ${t.inWidth}) {
                  continue;
                }

                float dyValue = getDy(b, yF, yR, yC, d2);
                float xValue = getX(b, xF, xR, xC, d1);
                dotProd += (xValue * dyValue);
              }
            }
          }
        }
        setOutput(dotProd);
      }
    `}},Xm=class{constructor(t){this.variableNames=["dy","W"],this.outputShape=t.inShape;let e=t.filterDepth,o=t.filterHeight,n=t.filterWidth,s=t.strideDepth,a=t.strideHeight,i=t.strideWidth,l=e-1-t.padInfo.front,c=o-1-t.padInfo.top,u=n-1-t.padInfo.left;this.userCode=`
      const ivec3 pads = ivec3(${l}, ${c}, ${u});

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int d1 = coords.u;


        ivec3 dyCorner = ivec3(coords.y, coords.z, coords.w) - pads;
        int dyFCorner = dyCorner.x;
        int dyRCorner = dyCorner.y;
        int dyCCorner = dyCorner.z;

        float dotProd = 0.0;
        for (int wF = 0; wF < ${e}; wF++) {
          float dyF = float(dyFCorner + wF) / ${s}.0;

          if (dyF < 0.0 || dyF >= ${t.outDepth}.0 || fract(dyF) > 0.0) {
            continue;
          }
          int idyF = int(dyF);

          int wFPerm = ${e} - 1 - wF;

          for (int wR = 0; wR < ${o}; wR++) {
            float dyR = float(dyRCorner + wR) / ${a}.0;

            if (dyR < 0.0 || dyR >= ${t.outHeight}.0 ||
              fract(dyR) > 0.0) {
              continue;
            }
            int idyR = int(dyR);

            int wRPerm = ${o} - 1 - wR;

            for (int wC = 0; wC < ${n}; wC++) {
              float dyC = float(dyCCorner + wC) / ${i}.0;

              if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                  fract(dyC) > 0.0) {
                continue;
              }
              int idyC = int(dyC);

              int wCPerm = ${n} - 1 - wC;

              for (int d2 = 0; d2 < ${t.outChannels}; d2++) {
                float xValue = getDy(batch, idyF, idyR, idyC, d2);
                float wValue = getW(wFPerm, wRPerm, wCPerm, d1, d2);
                dotProd += xValue * wValue;
              }
            }
          }
        }
        setOutput(dotProd);
      }
    `}};function xV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,dy:s}=t,{strides:a,pad:i,dataFormat:l,dimRoundingMode:c,filterShape:u}=o,p=N.convertConv2DDataFormat(l),m=N.computeConv2DInfo(n.shape,u,a,1,i,c,!1,p),f=new Km(m);return e.runWebGLProgram(f,[n,s],"float32")}var IT={kernelName:Ps,backendName:"webgl",kernelFunc:xV};var Ym=class{constructor(t){this.variableNames=["dy","W"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"strides",type:"vec2"}],this.outputShape=t.inShape,this.enableShapeUniforms=Mt(this.outputShape.length);let e=t.filterHeight,o=t.filterWidth,n=e-1-t.padInfo.top,s=o-1-t.padInfo.left;this.userCode=`
      const ivec2 pads = ivec2(${n}, ${s});

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d1 = coords[3];

        ivec2 dyCorner = ivec2(coords[1], coords[2]) - pads;
        int dyRCorner = dyCorner.x;
        int dyCCorner = dyCorner.y;

        vec4 result = vec4(0.);
        for (int wR = 0; wR < ${e}; wR++) {
          float dyR = float(dyRCorner + wR) / strides[0];
          if (dyR < 0.0 || dyR >= ${t.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);
          int wRPerm = ${e} - 1 - wR;

          for (int wC = 0; wC < ${o}; wC++) {
            int wCPerm = ${o} - 1 - wC;

            float dyC = float(dyCCorner + wC) / strides[1];
            bool idyCVal = (dyC >= 0.0) && (dyC < ${t.outWidth}.0)
              && (fract(dyC) == 0.0);
            int idyC = int(dyC);

            float dyC2 = float(dyCCorner + wC + 1) / strides[1];
            bool idyCVal2 = (dyC2 >= 0.0) && (dyC2 < ${t.outWidth}.0)
              && (fract(dyC2) == 0.0);
            int idyC2 = int(dyC2);

            if (idyCVal && idyCVal2) {
              for (int d2 = 0; d2 < ${t.outChannels}; d2 += 2) {
                vec4 wValue = getW(wRPerm, wCPerm, d1, d2);
                vec4 dySample = getDy(batch, idyR, idyC, d2);
                vec4 dySample2 = (idyC / 2 == idyC2 / 2) ?
                  dySample : getDy(batch, idyR, idyC2, d2);

                vec2 dyValue = mod(float(idyC), 2.) == 0. ?
                  dySample.xy : dySample.zw;
                result.xy += vec2(dot(dyValue, wValue.xy),
                  dot(dyValue, wValue.zw));

                dyValue = mod(float(idyC2), 2.) == 0. ?
                  dySample2.xy : dySample2.zw;
                result.zw += vec2(dot(dyValue, wValue.xy),
                  dot(dyValue, wValue.zw));
              }
            } else if (idyCVal) {
              for (int d2 = 0; d2 < ${t.outChannels}; d2 += 2) {
                vec4 wValue = getW(wRPerm, wCPerm, d1, d2);
                vec4 dySample = getDy(batch, idyR, idyC, d2);
                vec2 dyValue = mod(float(idyC), 2.) == 0. ?
                  dySample.xy : dySample.zw;
                result.xy += vec2(dot(dyValue, wValue.xy),
                  dot(dyValue, wValue.zw));
              }
            } else if (idyCVal2) {
              for (int d2 = 0; d2 < ${t.outChannels}; d2 += 2) {
                vec4 wValue = getW(wRPerm, wCPerm, d1, d2);
                vec4 dySample = getDy(batch, idyR, idyC2, d2);
                vec2 dyValue = mod(float(idyC2), 2.) == 0. ?
                  dySample.xy : dySample.zw;
                result.zw += vec2(dot(dyValue, wValue.xy),
                  dot(dyValue, wValue.zw));
              }
            }
          }
        }
        setOutput(result);
      }
    `}};function yV(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,filter:s}=t,{inputShape:a,strides:i,pad:l,dataFormat:c,dimRoundingMode:u}=o,p=N.convertConv2DDataFormat(c),m=N.computeConv2DInfo(a,s.shape,i,1,l,u,!1,p);if(D().getBool("WEBGL_PACK_CONV2DTRANSPOSE")&&p==="channelsLast"){let f=[[m.strideHeight,m.strideWidth]],d=new Ym(m);return e.runWebGLProgram(d,[n,s],"float32",f)}else{let f=new qm(m);return e.runWebGLProgram(f,[n,s],"float32")}}var kT={kernelName:Ms,backendName:"webgl",kernelFunc:yV};function bV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dilations:l}=o,c=N.computeConv3DInfo(n.shape,s.shape,a,l,i),u=new zm(c);return e.runWebGLProgram(u,[n,s],"float32")}var ET={kernelName:Ls,backendName:"webgl",kernelFunc:bV};function wV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,dy:s}=t,{strides:a,pad:i,filterShape:l}=o,c=N.computeConv3DInfo(n.shape,l,a,1,i),u=new jm(c);return e.runWebGLProgram(u,[n,s],"float32")}var $T={kernelName:cc,backendName:"webgl",kernelFunc:wV};function vV(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,filter:s}=t,{pad:a,strides:i,inputShape:l}=o,c=N.computeConv3DInfo(l,s.shape,i,1,a),u=new Xm(c);return e.runWebGLProgram(u,[n,s],"float32")}var RT={kernelName:Bs,backendName:"webgl",kernelFunc:vV};var SV=Nr+`
  return cos(x);
`,CV=`
  vec4 result = cos(x);
  bvec4 isNaN = isnan(x);
  ${ur}
  return result;
`,TV=st({opSnippet:SV,packedOpSnippet:CV}),AT={kernelName:"Cos",backendName:"webgl",kernelFunc:TV};var NV=`
  float e2x = exp(-x);
  return (e2x + 1.0 / e2x) / 2.0;
`,IV=st({opSnippet:NV}),FT={kernelName:nn,backendName:"webgl",kernelFunc:IV};var Qm=class{constructor(t,e,o,n,s){this.variableNames=["Image","Boxes","BoxInd"],this.outputShape=[];let[a,i,l,c]=t,[u]=e,[p,m]=o;this.outputShape=[u,p,m,c];let f=n==="bilinear"?1:0,[d,g]=[`${i-1}.0`,`${l-1}.0`],[h,x,b]=p>1?[`${(i-1)/(p-1)}`,"(y2-y1) * height_ratio",`y1*${d} + float(y)*(height_scale)`]:["0.0","0.0",`0.5 * (y1+y2) * ${d}`],[C,S,I]=m>1?[`${(l-1)/(m-1)}`,"(x2-x1) * width_ratio",`x1*${g} + float(x)*(width_scale)`]:["0.0","0.0",`0.5 * (x1+x2) * ${g}`];this.userCode=`
      const float height_ratio = float(${h});
      const float width_ratio = float(${C});
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int y = coords[1];
        int x = coords[2];
        int d = coords[3];

        // get box vals
        float y1 = getBoxes(b,0);
        float x1 = getBoxes(b,1);
        float y2 = getBoxes(b,2);
        float x2 = getBoxes(b,3);

        // get image in batch index
        int bInd = round(getBoxInd(b));
        if(bInd < 0 || bInd >= ${a}) {
          return;
        }

        float height_scale = ${x};
        float width_scale = ${S};

        float in_y = ${b};
        if( in_y < 0.0 || in_y > ${d} ) {
          setOutput(float(${s}));
          return;
        }
        float in_x = ${I};
        if( in_x < 0.0 || in_x > ${g} ) {
          setOutput(float(${s}));
          return;
        }

        vec2 sourceFracIndexCR = vec2(in_x,in_y);
        if(${f} == 1) {
          // Compute the four integer indices.
          ivec2 sourceFloorCR = ivec2(sourceFracIndexCR);
          ivec2 sourceCeilCR = ivec2(ceil(sourceFracIndexCR));

          float topLeft = getImage(b, sourceFloorCR.y, sourceFloorCR.x, d);
          float bottomLeft = getImage(b, sourceCeilCR.y, sourceFloorCR.x, d);
          float topRight = getImage(b, sourceFloorCR.y, sourceCeilCR.x, d);
          float bottomRight = getImage(b, sourceCeilCR.y, sourceCeilCR.x, d);

          vec2 fracCR = sourceFracIndexCR - vec2(sourceFloorCR);

          float top = topLeft + (topRight - topLeft) * fracCR.x;
          float bottom = bottomLeft + (bottomRight - bottomLeft) * fracCR.x;
          float newValue = top + (bottom - top) * fracCR.y;
          setOutput(newValue);
        } else {
          // Compute the coordinators of nearest neighbor point.
          ivec2 sourceNearestCR = ivec2(floor(
            sourceFracIndexCR + vec2(0.5,0.5)));
          float newValue = getImage(b, sourceNearestCR.y, sourceNearestCR.x, d);
          setOutput(newValue);
        }
      }
    `}};var kV=r=>{let{inputs:t,backend:e,attrs:o}=r,{image:n,boxes:s,boxInd:a}=t,{cropSize:i,method:l,extrapolationValue:c}=o,u=new Qm(n.shape,s.shape,i,l,c);return e.runWebGLProgram(u,[n,s,a],"float32")},_T={kernelName:Gs,backendName:"webgl",kernelFunc:kV};var Gi;(function(r){r.Prod="*",r.Sum="+"})(Gi||(Gi={}));var Iu=class{constructor(t,e,o,n){this.op=t,this.outputShape=e,this.variableNames=["x"],this.customUniforms=[{name:"index",type:"float"}];let s=this.outputShape.length,a=this.op===Gi.Prod?"1.0":"0.0",i=o?a:`getX(${DT(s,"coords",this.op)})`,l=this.outputShape[this.outputShape.length-1],c="",u="";o?(c=n?`end != ${l-1}`:"end != 0",u=n?"end + 1":"end - 1"):(c=n?`end + pow2 < ${l}`:"end >= pow2",u=n?"end + pow2":"end - pow2"),this.userCode=`
      void main() {
        ${ht(s)} coords = getOutputCoords();
        int end = ${OT(s,"coords",this.op)};
        float val = ${i};
        int pow2 = int(pow(2.0, index));
        if (${c}) {
          int idx = ${u};
          ${OT(s,"coords",this.op)} = idx;
          val ${this.op}= getX(${DT(s,"coords",this.op)});
        }
        setOutput(val);
      }
    `}};function DT(r,t,e){if(r===1)return`${t}`;if(r===2)return`${t}.x, ${t}.y`;if(r===3)return`${t}.x, ${t}.y, ${t}.z`;if(r===4)return`${t}.x, ${t}.y, ${t}.z, ${t}.w`;throw new Error(`Cumulative ${e} for rank ${r} is not yet supported`)}function OT(r,t,e){if(r===1)return`${t}`;if(r===2)return`${t}.y`;if(r===3)return`${t}.z`;if(r===4)return`${t}.w`;throw new Error(`Cumulative ${e} for rank ${r} is not yet supported`)}function Zm(r,t,e,o,n,s){let a=t.shape.length,i=N.getAxesPermutation([o],a),l=t;i!=null&&(l=Wt({inputs:{x:t},backend:e,attrs:{perm:i}}));let c=N.getInnerMostAxes(1,a)[0];if(c!==a-1)throw new Error(`WebGL cumprod shader expects an inner-most axis=${t.shape.length-1} but got axis=${o}`);let u=l.shape[c],p=re({inputs:{x:l},backend:e});for(let m=0;m<=Math.ceil(Math.log2(u))-1;m++){let f=new Iu(r,l.shape,!1,s),d=[[m]],g=p;p=e.runWebGLProgram(f,[p],p.dtype,d),e.disposeIntermediateTensorInfo(g)}if(n){let m=new Iu(r,l.shape,n,s),f=p;p=e.runWebGLProgram(m,[p],p.dtype),e.disposeIntermediateTensorInfo(f)}if(i!=null){let m=N.getUndoAxesPermutation(i),f=Wt({inputs:{x:p},backend:e,attrs:{perm:m}});return e.disposeIntermediateTensorInfo(p),e.disposeIntermediateTensorInfo(l),f}return p}function EV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,exclusive:a,reverse:i}=o;return Zm(Gi.Prod,n,e,s,a,i)}var PT={kernelName:zs,backendName:"webgl",kernelFunc:EV};function $V(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,exclusive:a,reverse:i}=o;return Zm(Gi.Sum,n,e,s,a,i)}var MT={kernelName:Ws,backendName:"webgl",kernelFunc:$V};function RV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,weights:s}=t,{size:a,binaryOutput:i}=o;if(n.shape.length===1){let l=e.readSync(n.dataId),c=e.readSync(s.dataId),u=fm(l,c,s.dtype,s.shape,a);return e.makeTensorInfo([a],s.dtype,u)}else if(n.shape.length===2){let l=e.bufferSync(n),c=e.bufferSync(s),u=SS(l,c,a,i);return e.makeTensorInfo(u.shape,s.dtype,u.values)}throw new Error(`Error in denseBincount: input must be at most rank 2, but got rank${n.shape.length}.`)}var LT={kernelName:Us,backendName:"webgl",kernelFunc:RV};var Jm=class{constructor(t,e,o){this.variableNames=["x"],this.outputShape=[],this.outputShape=t,this.blockSize=e,this.dataFormat=o,this.userCode=`
    void main() {
      ivec4 coords = getOutputCoords();
      int b = coords[0];
      int h = ${this.getHeightCoordString()};
      int w = ${this.getWidthCoordString()};
      int d = ${this.getDepthCoordString()};

      int in_h = h / ${e};
      int offset_h = imod(h, ${e});
      int in_w = w / ${e};
      int offset_w = imod(w, ${e});
      int offset_d = (offset_h * ${e} + offset_w) *
        ${this.getOutputDepthSize()};
      int in_d = d + offset_d;

      float result = ${this.getInputSamplingString()};
      setOutput(result);
    }
  `}getHeightCoordString(){return this.dataFormat==="NHWC"?"coords[1]":"coords[2]"}getWidthCoordString(){return this.dataFormat==="NHWC"?"coords[2]":"coords[3]"}getDepthCoordString(){return this.dataFormat==="NHWC"?"coords[3]":"coords[1]"}getOutputDepthSize(){return this.dataFormat==="NHWC"?this.outputShape[3]:this.outputShape[1]}getInputSamplingString(){return this.dataFormat==="NHWC"?"getX(b, in_h, in_w, in_d)":"getX(b, in_d, in_h, in_w)"}};function AV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{blockSize:s,dataFormat:a}=o,i=n.shape[0],l=a==="NHWC"?n.shape[1]:n.shape[2],c=a==="NHWC"?n.shape[2]:n.shape[3],u=a==="NHWC"?n.shape[3]:n.shape[1],p=l*s,m=c*s,f=u/(s*s),d=a==="NHWC"?[i,p,m,f]:[i,f,p,m],g=new Jm(d,s,a);return e.runWebGLProgram(g,[n],n.dtype)}var BT={kernelName:Hs,backendName:"webgl",kernelFunc:AV};var jl=class{constructor(t,e=!1,o=null,n=!1,s=!1){this.variableNames=["x","W"],this.customUniforms=[{name:"pads",type:"ivec2"},{name:"strides",type:"ivec2"},{name:"dilations",type:"ivec2"},{name:"inDims",type:"ivec2"}],this.outputShape=t.outShape,this.enableShapeUniforms=Mt(this.outputShape.length);let a=t.filterHeight,i=t.filterWidth,l=t.outChannels/t.inChannels,c="",u="";o&&(n?c=`float activation(float a) {
          float b = getPreluActivationWeightsAtOutCoords();
          ${o}
        }`:s?c=`float activation(float a) {
          float b = getLeakyreluAlphaAtOutCoords();
          ${o}
        }`:c=`
          float activation(float x) {
            ${o}
          }
        `,u="result = activation(result);");let p=e?"result += getBiasAtOutCoords();":"";e&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),s&&this.variableNames.push("leakyreluAlpha"),this.userCode=`
      ${c}

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords.x;
        ivec2 xRCCorner = coords.yz * strides - pads;
        int d2 = coords.w;
        int d1 = d2 / ${l};
        int q = d2 - d1 * ${l};

        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        // Convolve x(?, ?, d1) with w(:, :, d1, q) to get y(yR, yC, d2).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        // TO DO(dsmilkov): Flatten the two for loops and vec4 the operations.
        for (int wR = 0; wR < ${a}; wR++) {
          int xR = xRCorner + wR * dilations[0];

          if (xR < 0 || xR >= inDims[0]) {
            continue;
          }

          for (int wC = 0; wC < ${i}; wC++) {
            int xC = xCCorner + wC * dilations[1];

            if (xC < 0 || xC >= inDims[1]) {
              continue;
            }

            float xVal = getX(batch, xR, xC, d1);
            float wVal = getW(wR, wC, d1, q);
            dotProd += xVal * wVal;
          }
        }

        float result = dotProd;
        ${p}
        ${u}
        setOutput(result);
      }
    `}};var Xl=class{constructor(t,e=!1,o=null,n=!1,s=!1){this.variableNames=["x","W"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"pads",type:"ivec2"},{name:"strides",type:"ivec2"},{name:"dilations",type:"ivec2"},{name:"inDims",type:"ivec2"}],this.outputShape=t.outShape,this.enableShapeUniforms=Mt(this.outputShape.length);let a=t.outChannels/t.inChannels,i=t.padInfo.left,l=t.strideWidth,c=t.dilationWidth,u=t.filterHeight,p=t.filterWidth,m=p,f=`
      int xR; int xC; int xCOffset;
      vec4 wTexel; vec4 previous; vec4 final;`;for(let x=0;x<p;x++)f+=`
          vec4 xTexelC${x*2};
          int xTexelC${x*2}Ready;
          vec4 xTexelC${x*2+1};
          int xTexelC${x*2+1}Ready;
          vec4 xC${x};`;f+=`
    for (int r = 0; r < ${u}; r++) {
      `;for(let x=0;x<p;x++)f+=`
          xTexelC${x*2} = vec4(0.0);
          xTexelC${x*2}Ready = 0;
          xTexelC${x*2+1} = vec4(0.0);
          xTexelC${x*2+1}Ready = 0;
          xC${x} = vec4(0.0);`;f+=`
        xR = xRCorner + r * dilations[0];
        if (xR >=0 && xR < inDims[0]) {
      `;for(let x=0;x<(m+1)/2;x++){let b=x*2;if(f+=`
          xC = xCCorner + ${b*c};
          `,l===1){if(b<p&&(i%2===1?(f+=`
                xCOffset = xC + 1;
                if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b}Ready == 0) {
                  xTexelC${b} = getX(batch, xR, xCOffset, d1);

                  // Need to manually clear unused channels in case
                  // we're reading from recycled texture.
                  if (xCOffset + 1 >= inDims[1]) {
                    xTexelC${b}.zw = vec2(0.0);
                  }
                  xTexelC${b}Ready = 1;
                }
              `,c===1&&b>0?f+=`
                xC${b} = vec4(xTexelC${b-2}.zw, xTexelC${b}.xy);
                `:f+=`
                  xCOffset = xC + 1 - 2;

                  if (xCOffset >= 0 && xCOffset < inDims[1]) {
                    previous = getX(batch, xR, xCOffset, d1);

                    // Need to manually clear unused channels in case
                    // we're reading from recycled texture.
                    if (xCOffset + 1 >= inDims[1]) {
                      previous.zw = vec2(0.0);
                    }

                    xC${b} = vec4(previous.zw, xTexelC${b}.xy);
                  } else {
                    xC${b} = vec4(0.0, 0.0, xTexelC${b}.xy);
                  }
                  `):f+=`
                if (xC >= 0 && xC < inDims[1] && xTexelC${b}Ready == 0) {
                  xTexelC${b} = getX(batch, xR, xC, d1);
                  if (xC + 1 >= inDims[1]) {
                    xTexelC${b}.zw = vec2(0.0);
                  }
                  xTexelC${b}Ready = 1;
                }

                xC${b} = xTexelC${b};
                `,b+1<p)){let C=i%2===0?y.nearestLargerEven(c):c;c%2===0&&i%2===1||c%2!==0&&i%2!==1?(f+=`
                  xCOffset = xC + imod(pads[1], 2) + ${C};

                  if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b+1}Ready == 0) {
                    xTexelC${b+1} = getX(batch, xR, xCOffset, d1);

                    // Need to manually clear unused channels in case
                    // we're reading from recycled texture.
                    if (xCOffset + 1 >= inDims[1]) {
                      xTexelC${b+1}.zw = vec2(0.0);
                    }
                    xTexelC${b+1}Ready = 1;
                  }
                  `,c>1?f+=`
                    xCOffset -= 2;
                    if (xCOffset >= 0 && xCOffset < inDims[1]) {
                     previous = getX(batch, xR, xCOffset, d1);
                     xC${b+1} = vec4(previous.zw, xTexelC${b+1}.xy);
                    } else {
                     xC${b+1} = vec4(0.0, 0.0, xTexelC${b+1}.xy);
                    }
                    `:f+=`
                    xC${b+1} = vec4(xTexelC${b}.zw, xTexelC${b+1}.xy);
                    `):C===1?f+=`
                    xC${b+1} = xTexelC${b};
                    `:f+=`
                    xCOffset = xC + ${C};

                    if (xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b+1}Ready == 0) {
                      xTexelC${b+1} = getX(batch, xR, xCOffset, d1);
                      if (xCOffset + 1 >= inDims[1]) {
                        xTexelC${b+1}.zw = vec2(0.0);
                      }
                      xTexelC${b+1}Ready = 1;
                    }

                    xC${b+1} = xTexelC${b+1};
                    `}}else b<p&&(i%2===1?(f+=`
                xCOffset = xC + 1 - strides[1];
                if(xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b}Ready == 0) {
                  xTexelC${b} = getX(batch, xR, xCOffset, d1);
                  // Need to manually clear unused channels in case
                  // we're reading from recycled texture.
                  if (xCOffset + 1 >= inDims[1]) {
                    xTexelC${b}.zw = vec2(0.0);
                  }
                  xTexelC${b}Ready = 1;
                }

                if(xC + 1 >= 0 && xC + 1 < inDims[1] && xTexelC${b+1}Ready == 0) {
                  xTexelC${b+1} = getX(batch, xR, xC + 1, d1);
                  // Need to manually clear unused channels in case
                  // we're reading from recycled texture.
                  if (xC + 2 >= inDims[1]) {
                    xTexelC${b+1}.zw = vec2(0.0);
                  }
                  xTexelC${b+1}Ready = 1;
                }

                xC${b} = vec4(xTexelC${b}.zw, xTexelC${b+1}.zw);
              `,b+1<p&&(f+=`
                  final = vec4(0.0);
                  xCOffset = xC + 1 + strides[1];
                  if(xCOffset >= 0 && xCOffset < inDims[1]) {
                    final = getX(batch, xR, xCOffset, d1);
                  }
                  xC${b+1} = vec4(xTexelC${b+1}.xy, final.xy);
                `)):(f+=`
                if(xC >= 0 && xC < inDims[1] && xTexelC${b}Ready == 0) {
                  xTexelC${b} = getX(batch, xR, xC, d1);
                  if (xC + 1 >= inDims[1]) {
                    xTexelC${b}.zw = vec2(0.0);
                  }
                  xTexelC${b}Ready = 1;
                }

                xCOffset = xC + strides[1];
                if(xCOffset >= 0 && xCOffset < inDims[1] && xTexelC${b+1}Ready == 0) {
                  xTexelC${b+1} = getX(batch, xR, xCOffset, d1);
                  if (xCOffset + 1 >= inDims[1]) {
                    xTexelC${b+1}.zw = vec2(0.);
                  }
                  xTexelC${b+1}Ready = 1;
                }

                xC${b} = vec4(
                  xTexelC${b}.xy, xTexelC${b+1}.xy);
              `,b+1<p&&(f+=`
                  xC${b+1} = vec4(xTexelC${b}.zw, xTexelC${b+1}.zw);
                `)));b<p&&(f+=`
            wTexel = getW(r, ${b}, d1, q);
            dotProd += xC${b} * vec4(wTexel.xz, wTexel.xz);
          `,b+1<p&&(f+=`
              wTexel = getW(r, ${b+1}, d1, q);
              dotProd += xC${b+1} * vec4(wTexel.xz, wTexel.xz);
            `))}f+=`
    }
  `,f+=`
      }
    `;let d="",g="";o&&(n?d=`vec4 activation(vec4 a) {
          vec4 b = getPreluActivationWeightsAtOutCoords();
          ${o}
        }`:s?d=`vec4 activation(vec4 a) {
          vec4 b = getLeakyreluAlphaAtOutCoords();
          ${o}
        }`:d=`vec4 activation(vec4 x) {
          ${o}
        }`,g="result = activation(result);");let h=e?"result += getBiasAtOutCoords();":"";e&&this.variableNames.push("bias"),n&&this.variableNames.push("preluActivationWeights"),s&&this.variableNames.push("leakyreluAlpha"),this.userCode=`
      ${d}

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords.x;
        ivec2 xRCCorner = coords.yz * strides - pads;
        int d2 = coords.w;
        int d1 = d2 / ${a};
        int q = d2 - d1 * ${a};
        int xRCorner = xRCCorner.x;
        int xCCorner = xRCCorner.y;

        //intialize dotProd with a small epsilon seems to reduce GPU accuracy loss.
        vec4 dotProd = vec4(0.000000000000001);

        ${f}

        vec4 result = dotProd - vec4(0.000000000000001);
        ${h}
        ${g}
        setOutput(result);
      }
    `}};function FV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dilations:l,dimRoundingMode:c}=o,u=l;u==null&&(u=[1,1]),y.assert(N.eitherStridesOrDilationsAreOne(a,u),()=>`Error in depthwiseConv2d: Either strides or dilations must be 1. Got strides ${a} and dilations '${u}'`);let p=N.computeConv2DInfo(n.shape,s.shape,a,u,i,c,!0),m;D().getBool("WEBGL_PACK_DEPTHWISECONV")&&p.strideWidth<=2&&p.outChannels/p.inChannels===1?m=new Xl(p):m=new jl(p);let f=[[p.padInfo.top,p.padInfo.left],[p.strideHeight,p.strideWidth],[p.dilationHeight,p.dilationWidth],[p.inHeight,p.inWidth]];return e.runWebGLProgram(m,[n,s],"float32",f)}var VT={kernelName:Ks,backendName:"webgl",kernelFunc:FV};var tf=class{constructor(t){this.variableNames=["x","dy"],this.outputShape=t.filterShape;let e=t.strideHeight,o=t.strideWidth,n=t.padInfo.top,s=t.padInfo.left,a=t.outChannels/t.inChannels;this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int wR = coords.x;
        int wC = coords.y;
        int d1 = coords.z;
        int dm = coords.w;
        int d2 = d1 * ${a} + dm;

        float dotProd = 0.0;

        // TO DO: Vec4 over the batch size
        for (int b = 0; b < ${t.batchSize}; b++) {
          for (int yR = 0; yR < ${t.outHeight}; yR++) {
            int xR = wR + yR * ${e} - ${n};

            if (xR < 0 || xR >= ${t.inHeight}) {
              continue;
            }

            for (int yC = 0; yC < ${t.outWidth}; yC++) {
              int xC = wC + yC * ${o} - ${s};

              if (xC < 0 || xC >= ${t.inWidth}) {
                continue;
              }

              float dyValue = getDy(b, yR, yC, d2);
              float xValue = getX(b, xR, xC, d1);
              dotProd += (xValue * dyValue);
            }
          }
        }
        setOutput(dotProd);
      }
    `}},ef=class{constructor(t){this.variableNames=["dy","W"],this.outputShape=t.inShape;let e=t.filterHeight,o=t.filterWidth,n=t.strideHeight,s=t.strideWidth,a=e-1-t.padInfo.top,i=o-1-t.padInfo.left,l=t.outChannels/t.inChannels;this.userCode=`
      const ivec2 pads = ivec2(${a}, ${i});

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords[0];
        int d1 = coords[3];
        ivec2 dyCorner = coords.yz - pads;
        int dyRCorner = dyCorner.x;
        int dyCCorner = dyCorner.y;

        float dotProd = 0.0;

        for (int wR = 0; wR < ${e}; wR++) {
          float dyR = float(dyRCorner + wR) / ${n}.0;

          if (dyR < 0.0 || dyR >= ${t.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);

          int wRPerm = ${e} - 1 - wR;

          for (int wC = 0; wC < ${o}; wC++) {
            float dyC = float(dyCCorner + wC) / ${s}.0;

            if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                fract(dyC) > 0.0) {
              continue;
            }
            int idyC = int(dyC);

            int wCPerm = ${o} - 1 - wC;

            // TO DO: Vec4 over the channelMul
            for (int dm = 0; dm < ${l}; dm++) {
              int d2 = d1 * ${l} + dm;
              float xValue = getDy(batch, idyR, idyC, d2);
              float wValue = getW(wRPerm, wCPerm, d1, dm);
              dotProd += xValue * wValue;
            }
          }
        }
        setOutput(dotProd);
      }
    `}};function _V(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,dy:s}=t,{strides:a,dilations:i,pad:l,dimRoundingMode:c,filterShape:u}=o,p=N.computeConv2DInfo(n.shape,u,a,i,l,c,!0),m=new tf(p);return e.runWebGLProgram(m,[n,s],"float32")}var zT={kernelName:qs,backendName:"webgl",kernelFunc:_V};function DV(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,filter:s}=t,{strides:a,dilations:i,pad:l,dimRoundingMode:c,inputShape:u}=o,p=N.computeConv2DInfo(u,s.shape,a,i,l,c,!0),m=new ef(p);return e.runWebGLProgram(m,[n,s],"float32")}var WT={kernelName:js,backendName:"webgl",kernelFunc:DV};var rf=class{constructor(t){this.variableNames=["X"],this.outputShape=[t,t],this.userCode=`
      void main() {
          ivec2 coords = getOutputCoords();
          float val = coords[0] == coords[1] ? getX(coords[0]) : 0.0;
          setOutput(val);
      }
    `}};function OV(r){let{inputs:t,backend:e}=r,{x:o}=t,n=[...o.shape,...o.shape],s=y.sizeFromShape(o.shape),a=q({inputs:{x:o},backend:e,attrs:{shape:[s]}}),i=new rf(s),l=e.runWebGLProgram(i,[a],a.dtype),c=q({inputs:{x:l},backend:e,attrs:{shape:n}});return e.disposeIntermediateTensorInfo(a),e.disposeIntermediateTensorInfo(l),c}var GT={kernelName:Xs,backendName:"webgl",kernelFunc:OV};var of=class{constructor(t){this.variableNames=["x","W"],this.outputShape=t.outShape;let{inHeight:e,inWidth:o,padInfo:n,strideHeight:s,strideWidth:a,filterHeight:i,filterWidth:l,dilationHeight:c,dilationWidth:u}=t,{top:p,left:m}=n;this.userCode=`
      const ivec2 strides = ivec2(${s}, ${a});
      const ivec2 pads = ivec2(${p}, ${m});
      const float neg_infinity = -3.4e38;

      void main() {
        ivec4 coords = getOutputCoords();
        int batch = coords.x;
        int d1 = coords.w;
        ivec2 outTopLeftCorner =
            coords.yz * strides - pads;
        int hBeg = outTopLeftCorner.x;
        int wBeg = outTopLeftCorner.y;

        float curVal = neg_infinity;
        for (int h = 0; h < ${i}; h++) {
          int hIn = hBeg + h * ${c};

          if (hIn >= 0 && hIn < ${e}) {
            for (int w = 0; w < ${l}; w++) {
              int wIn = wBeg + w * ${u};

              if (wIn >= 0 && wIn < ${o}) {
                float xVal = getX(batch, hIn, wIn, d1);
                float wVal = getW(h, w, d1);

                float val = xVal + wVal;
                if (val > curVal) {
                  curVal = val;
                }
              }
            }
          }
        }

        float result = curVal;
        setOutput(result);
      }
    `}};function PV(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dilations:l}=o,c=N.computeDilation2DInfo(n.shape,s.shape,a,i,"NHWC",l),u,p=new of(c);u=e.runWebGLProgram(p,[n,s],"float32");let m=q({inputs:{x:u},backend:e,attrs:{shape:c.outShape}});return e.disposeIntermediateTensorInfo(u),m}var UT={kernelName:Ys,backendName:"webgl",kernelFunc:PV};function MV(r){let{inputs:t,backend:e,attrs:o}=r,{equation:n}=o,s=t,{allDims:a,summedDims:i,idDims:l}=N.decodeEinsumEquation(n,s.length);N.checkEinsumDimSizes(a.length,l,s);let{path:c,steps:u}=N.getEinsumComputePath(i,l),p=u.length,m=null,f=a.length,d=[];for(let g=0;g<p;++g){for(let h of u[g]){let{permutationIndices:x,expandDims:b}=N.getEinsumPermutation(f,l[h]),C;N.isIdentityPermutation(x)?C=s[h]:(C=Wt({inputs:{x:s[h]},backend:e,attrs:{perm:x}}),d.push(C));let S=C.shape.slice();for(let I=0;I<b.length;++I)S.splice(b[I],0,1);y.arraysEqual(C.shape,S)||(C=q({inputs:{x:C},backend:e,attrs:{shape:S}}),d.push(C)),m===null?m=C:(m=Tu({inputs:{a:C,b:m},backend:e}),d.push(m))}g<p-1&&(c[g]>=0&&(m=Vi({inputs:{x:m},backend:e,attrs:{axis:c[g]-(a.length-f),keepDims:!1}}),d.push(m)),f--)}for(let g of d)g!==m&&e.disposeIntermediateTensorInfo(g);return m}var HT={kernelName:Qs,backendName:"webgl",kernelFunc:MV};var LV="return (x >= 0.0) ? x : (exp(x) - 1.0);",BV=`
  vec4 result;

  result.r = (x.r >= 0.0) ? x.r : (exp(x.r) - 1.0);
  result.g = (x.g >= 0.0) ? x.g : (exp(x.g) - 1.0);
  result.b = (x.b >= 0.0) ? x.b : (exp(x.b) - 1.0);
  result.a = (x.a >= 0.0) ? x.a : (exp(x.a) - 1.0);

  return result;
`,VV=st({opSnippet:LV,packedOpSnippet:BV}),KT={kernelName:"Elu",backendName:"webgl",kernelFunc:VV};var zV="return (b >= 0.0) ? a : a * (b + 1.0);",WV=`
  vec4 bGTEZero = vec4(greaterThanEqual(b, vec4(0.)));
  return (bGTEZero * a) + ((vec4(1.0) - bGTEZero) * (a * (b + vec4(1.0))));
`,GV=r=>{let{inputs:t,backend:e}=r,{dy:o,y:n}=t,s=D().getBool("WEBGL_PACK_BINARY_OPERATIONS")?new cr(WV,o.shape,n.shape):new Je(zV,o.shape,n.shape);return e.runWebGLProgram(s,[o,n],o.dtype)},qT={kernelName:uc,backendName:"webgl",kernelFunc:GV};var UV=`
  return vec4(equal(a, b));
`,HV="return float(a == b);",KV=_t({opSnippet:HV,packedOpSnippet:UV,dtype:"bool",cpuKernelImpl:kS}),jT={kernelName:an,backendName:"webgl",kernelFunc:KV};var qV=`
  // Error function is calculated approximately with elementary function.
  // See "Handbook of Mathematical Functions with Formulas,
  // Graphs, and Mathematical Tables", Abramowitz and Stegun.
  float p = ${N.ERF_P};
  float a1 = ${N.ERF_A1};
  float a2 = ${N.ERF_A2};
  float a3 = ${N.ERF_A3};
  float a4 = ${N.ERF_A4};
  float a5 = ${N.ERF_A5};

  float sign = sign(x);
  x = abs(x);
  float t = 1.0 / (1.0 + p * x);
  return sign * (1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*exp(-x*x));
`,jV=st({opSnippet:qV}),XT={kernelName:"Erf",backendName:"webgl",kernelFunc:jV};var XV=Nr+`
  return exp(x);
`,YV=`
  vec4 result = exp(x);
  bvec4 isNaN = isnan(x);
  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,Ty=st({opSnippet:XV,packedOpSnippet:YV,cpuKernelImpl:ES,dtype:"float32"}),YT={kernelName:"Exp",backendName:"webgl",kernelFunc:Ty};function nf(r){let{inputs:t,attrs:e,backend:o}=r,{dim:n}=e,{input:s}=t,a=s.shape.length,i=s.shape.slice(),l=n;return n<0&&(y.assert(-(a+1)<=n,()=>`Axis must be in the interval [${-(a+1)}, ${a}]`),l=a+n+1),i.splice(l,0,1),q({inputs:{x:s},backend:o,attrs:{shape:i}})}var QT={kernelName:ea,backendName:"webgl",kernelFunc:nf};var ZT="return exp(x) - 1.0;",QV=st({opSnippet:ZT,packedOpSnippet:ZT,cpuKernelImpl:$S}),JT={kernelName:ln,backendName:"webgl",kernelFunc:QV};var ku=class{constructor(t,e,o){this.variableNames=["real","imag"];let n=e[1];this.outputShape=e;let s=o?`2.0 * ${Math.PI}`:`-2.0 * ${Math.PI}`,a=o?`${n}.0`:"1.0",i;if(t==="real")i="return real * expR - imag * expI;";else if(t==="imag")i="return real * expI + imag * expR;";else throw new Error(`FFT component must be either "real" or "imag", got ${t}.`);this.userCode=`
      const float exponentMultiplier = ${s};

      float unaryOpComplex(float real, float expR, float imag, float expI) {
        ${i}
      }

      float mulMatDFT(int batch, int index) {
        float indexRatio = float(index) / float(${n});
        float exponentMultiplierTimesIndexRatio =
            exponentMultiplier * indexRatio;

        float result = 0.0;

        for (int i = 0; i < ${n}; i++) {
          // x = (-2|2 * PI / N) * index * i;
          float x = exponentMultiplierTimesIndexRatio * float(i);
          float expR = cos(x);
          float expI = sin(x);
          float real = getReal(batch, i);
          float imag = getImag(batch, i);

          result +=
              unaryOpComplex(real, expR, imag, expI) / ${a};
        }

        return result;
      }

      void main() {
        ivec2 coords = getOutputCoords();
        setOutput(mulMatDFT(coords[0], coords[1]));
      }
    `}};function sf(r,t,e){let o=e.texData.get(r.dataId),n=y.sizeFromShape(r.shape),s=r.shape[r.shape.length-1],a=n/s,i=q({inputs:{x:r},backend:e,attrs:{shape:[a,s]}}),l=i.shape,c=new ku("real",l,t),u=new ku("imag",l,t),p=[{dataId:o.complexTensorInfos.real.dataId,dtype:o.complexTensorInfos.real.dtype,shape:l},{dataId:o.complexTensorInfos.imag.dataId,dtype:o.complexTensorInfos.imag.dtype,shape:l}],m=e.runWebGLProgram(c,p,"float32"),f=e.runWebGLProgram(u,p,"float32"),d=tr({inputs:{real:m,imag:f},backend:e});e.disposeIntermediateTensorInfo(m),e.disposeIntermediateTensorInfo(f);let g=q({inputs:{x:d},backend:e,attrs:{shape:r.shape}});return e.disposeIntermediateTensorInfo(i),e.disposeIntermediateTensorInfo(d),g}function ZV(r){let{inputs:t,backend:e}=r,{input:o}=t;return sf(o,!1,e)}var tN={kernelName:"FFT",backendName:"webgl",kernelFunc:ZV};var af=class{constructor(t,e){this.outputShape=[],this.customUniforms=[{name:"value",type:"float"}],this.variableNames=["x"],this.outputShape=t,this.userCode=`
      void main() {
        // Input can be obtained from uniform value.
        setOutput(value);
      }
    `}};function Bo(r){let{backend:t,attrs:e}=r,{shape:o,value:n}=e,{dtype:s}=e;if(s=s||y.inferDtype(n),s==="string"){let a=y.getArrayFromDType(s,y.sizeFromShape(o));return a.fill(n),t.makeTensorInfo(o,s,a)}else{let a=new af(o,n),i=[[n]];return t.runWebGLProgram(a,[],s,i)}}var eN={kernelName:ra,backendName:"webgl",kernelFunc:Bo};var lf=class{constructor(t){this.variableNames=["Image"],this.outputShape=[];let e=t[2];this.outputShape=t,this.userCode=`
        void main() {
          ivec4 coords = getOutputCoords();
          int x = coords[2];

          int coordX = ${e} - x - 1;
          float outputValue;
          if(coordX >= 0 && coordX < ${e}) {
            outputValue = getImage(coords[0], coords[1], coordX, coords[3]);
          } else {
            outputValue = getImage(coords[0], coords[1], coords[2], coords[3]);
          }
          setOutput(outputValue);
        }
    `}};var rN={kernelName:oa,backendName:"webgl",kernelFunc:({inputs:r,backend:t})=>{let{image:e}=r,o=t,n=new lf(e.shape);return o.runWebGLProgram(n,[e],e.dtype)}};var oN="return floor(x);",JV=st({opSnippet:oN,packedOpSnippet:oN,cpuKernelImpl:RS}),nN={kernelName:cn,backendName:"webgl",kernelFunc:JV};var tz=`
  float s = sign(a) * sign(b);
  int ia = round(a);
  int ib = round(b);
  if (ib != 0) {
    // Windows (D3D) wants guaranteed non-zero int division at compile-time.
    return float(idiv(ia, ib, s));
  } else {
    return NAN;
  }
`,ez=`
  ivec4 ia = round(a);
  ivec4 ib = round(b);
  bvec4 cond = notEqual(ib, ivec4(0));
  ivec4 result = ivec4(0);
  vec4 s = sign(a) * sign(b);

  // Windows (D3D) wants guaranteed non-zero int division at compile-time.
  if (cond[0]) {
    result[0] = idiv(ia[0], ib[0], s[0]);
  }
  if (cond[1]) {
    result[1] = idiv(ia[1], ib[1], s[1]);
  }
  if (cond[2]) {
    result[2] = idiv(ia[2], ib[2], s[2]);
  }
  if (cond[3]) {
    result[3] = idiv(ia[3], ib[3], s[3]);
  }
  return vec4(result);
`,rz=_t({opSnippet:tz,packedOpSnippet:ez,dtype:"int32"}),sN={kernelName:un,backendName:"webgl",kernelFunc:rz};var cf=class{constructor(t){this.variableNames=["A"];let e=jt(),[o,n]=t;this.outputShape=t,this.userCode=`
      void main() {
        ivec3 coords = getOutputCoords();
        int texR = coords[0];
        int texC = coords[1];
        int depth = coords[2];
        vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${n}.0, ${o}.0);

        vec4 values = ${e.texture2D}(A, uv);
        float value;
        if (depth == 0) {
          value = values.r;
        } else if (depth == 1) {
          value = values.g;
        } else if (depth == 2) {
          value = values.b;
        } else if (depth == 3) {
          value = values.a;
        }

        setOutput(floor(value * 255.0 + 0.5));
      }
    `}};var uf=class{constructor(t){this.variableNames=["A"],this.packedInputs=!1,this.packedOutput=!0;let e=jt(),[o,n]=t;this.outputShape=t,this.userCode=`
      void main() {
        ivec3 coords = getOutputCoords();
        int texR = coords[0];
        int texC = coords[1];
        int depth = coords[2];

        vec4 result = vec4(0.);

        for(int row=0; row<=1; row++) {
          for(int col=0; col<=1; col++) {
            texC = coords[1] + row;
            depth = coords[2] + col;

            vec2 uv = (vec2(texC, texR) + halfCR) /
                       vec2(${n}.0, ${o}.0);
            vec4 values = ${e.texture2D}(A, uv);
            float value;
            if (depth == 0) {
              value = values.r;
            } else if (depth == 1) {
              value = values.g;
            } else if (depth == 2) {
              value = values.b;
            } else if (depth == 3) {
              value = values.a;
            }

            result[row * 2 + col] = floor(value * 255.0 + 0.5);
          }
        }

        ${e.output} = result;
      }
    `}};var aN={kernelName:il,backendName:"webgl",kernelFunc:oz},Yl,Ny=D().getBool("CANVAS2D_WILL_READ_FREQUENTLY_FOR_GPU");function oz(r){let{inputs:t,backend:e,attrs:o}=r,{pixels:n}=t,{numChannels:s}=o,a=typeof HTMLVideoElement<"u"&&n instanceof HTMLVideoElement,i=typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement,[l,c]=a?[n.videoWidth,n.videoHeight]:[n.width,n.height],u=[c,l],p=[c,l,s];if(i||a){let g=D().getBool("CANVAS2D_WILL_READ_FREQUENTLY_FOR_GPU");(Yl==null||g!==Ny)&&(Ny=g,Yl=document.createElement("canvas").getContext("2d",{willReadFrequently:Ny})),Yl.canvas.width=l,Yl.canvas.height=c,Yl.drawImage(n,0,0,l,c),n=Yl.canvas}let m=e.makeTensorInfo(u,"int32");e.texData.get(m.dataId).usage=ke.PIXELS,e.gpgpu.uploadPixelDataToTexture(e.getTexture(m.dataId),n);let f=D().getBool("WEBGL_PACK")?new uf(p):new cf(p),d=e.runWebGLProgram(f,[m],"int32");return e.disposeData(m.dataId),d}function nz(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s,bias:a,preluActivationWeights:i}=t,{strides:l,pad:c,dataFormat:u,dilations:p,dimRoundingMode:m,activation:f,leakyreluAlpha:d}=o,g=N.convertConv2DDataFormat(u),h=N.computeConv2DInfo(n.shape,s.shape,l,p,c,m,!1,g),x,b=[],C=a!=null,S=i!=null,I=f==="leakyrelu",$=()=>{let A=[n,s],F=(_,O)=>{if(O==="NCHW"&&_.shape.length===1&&_.shape[0]!==1){let M=q({inputs:{x:_},backend:e,attrs:{shape:[_.shape[0],1,1]}});return b.push(M),M}return _};if(C&&A.push(F(a,u)),S&&A.push(F(i,u)),I){let _=e.makeTensorInfo([],"float32",y.createScalarValue(d,"float32"));A.push(_),b.push(_)}return A};if(h.filterHeight===1&&h.filterWidth===1&&h.dilationHeight===1&&h.dilationWidth===1&&h.strideHeight===1&&h.strideWidth===1&&(h.padInfo.type==="SAME"||h.padInfo.type==="VALID"))x=Um({x:n,filter:s,convInfo:h,backend:e,bias:a,activation:f,preluActivationWeights:i,leakyreluAlpha:d});else if(h.strideWidth<=2&&g==="channelsLast"&&D().getBool("WEBGL_EXP_CONV")){let A=f?Mo(f,!0):null,F=new ql(h,C,A,S,I),_=[[h.padInfo.top,h.padInfo.left],[h.strideHeight,h.strideWidth],[h.dilationHeight,h.dilationWidth],[h.inHeight,h.inWidth]],O=$();x=e.runWebGLProgram(F,O,"float32",_)}else if(D().getBool("WEBGL_CONV_IM2COL"))x=Hm({x:n,filter:s,convInfo:h,backend:e,bias:a,activation:f,preluActivationWeights:i,leakyreluAlpha:d});else{let A=f?Mo(f,!1):null,F=new Kl(h,C,A,S,I),_=$();x=e.runWebGLProgram(F,_,"float32")}let R=q({inputs:{x},backend:e,attrs:{shape:h.outShape}});return b.push(x),b.forEach(A=>e.disposeIntermediateTensorInfo(A)),R}var iN={kernelName:Wn,backendName:"webgl",kernelFunc:nz};function sz(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s,bias:a,preluActivationWeights:i}=t,{strides:l,pad:c,dilations:u,dimRoundingMode:p,activation:m,leakyreluAlpha:f}=o,d=[],g=u;g==null&&(g=[1,1]),y.assert(N.eitherStridesOrDilationsAreOne(l,g),()=>`Error in depthwiseConv2d: Either strides or dilations must be 1. Got strides ${l} and dilations '${g}'`);let h=N.computeConv2DInfo(n.shape,s.shape,l,g,c,p,!0),x=D().getBool("WEBGL_PACK_DEPTHWISECONV")&&h.strideWidth<=2&&h.outChannels/h.inChannels===1,b=m?Mo(m,x):null,C=[n,s],S=a!=null,I=i!=null,$=m==="leakyrelu";if(S&&C.push(a),I&&C.push(i),$){let _=e.makeTensorInfo([],"float32",y.createScalarValue(f,"float32"));C.push(_),d.push(_)}let R;x?R=new Xl(h,S,b,I,$):R=new jl(h,S,b,I,$);let A=[[h.padInfo.top,h.padInfo.left],[h.strideHeight,h.strideWidth],[h.dilationHeight,h.dilationWidth],[h.inHeight,h.inWidth]],F=e.runWebGLProgram(R,C,"float32",A);return d.forEach(_=>e.disposeIntermediateTensorInfo(_)),F}var lN={kernelName:Gn,backendName:"webgl",kernelFunc:sz};var pf=class{constructor(t,e,o,n){this.sliceDim=t,this.strides=e,this.paramsShape=n,this.variableNames=["x","indices"],this.outputShape=o;let s=ht(o.length),a=`
    int index;`;for(let i=0;i<this.sliceDim;i++)a+=`
          index = round(getIndices(coords[0], ${i}));
          out_of_bounds = out_of_bounds || index < 0;
          out_of_bounds = out_of_bounds || index >= ${this.paramsShape[i]};
          flattenIndex += index * ${this.strides[i]};`;this.userCode=`
         void main() {
          ${s} coords = getOutputCoords();
          int flattenIndex = 0;
          bool out_of_bounds = false;

          ${a}

          setOutput(out_of_bounds ? 0.0 : getX(flattenIndex, coords[1]));
        }
      `}};function az(r){let{inputs:t,backend:e}=r,{params:o,indices:n}=t,s=n.shape,a=s[s.length-1],i=y.sizeFromShape(o.shape),[l,c,u,p]=N.prepareAndValidate(o,n),m=q({inputs:{x:n},backend:e,attrs:{shape:[c,a]}}),f=q({inputs:{x:o},backend:e,attrs:{shape:[y.sizeFromShape(o.shape)/u,u]}});if(e.shouldExecuteOnCPU([o,n])||o.dtype==="string"){let x=e.readSync(n.dataId),b=e.bufferSync(o),C=AS(x,b,o.dtype,c,a,u,p,o.shape,i);return e.makeTensorInfo(l,o.dtype,C.values)}let d=new pf(a,p,[c,u],o.shape),g=e.runWebGLProgram(d,[f,m],f.dtype),h=q({inputs:{x:g},backend:e,attrs:{shape:l}});return e.disposeIntermediateTensorInfo(m),e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(g),h}var cN={kernelName:aa,backendName:"webgl",kernelFunc:az};var mf=class{constructor(t,e){this.variableNames=["A","indices"],this.outputShape=e,this.rank=e.length;let o=ht(this.rank),n=iz(t,2);this.userCode=`
      void main() {
        ${o} resRC = getOutputCoords();
        int index = int(getIndices(resRC.x, resRC.z));
        float inBounds = (index >= 0) && (index < ${t[2]}) ? 1.0 : 0.0;
        setOutput(inBounds * getA(${n}));
      }
    `}};function iz(r,t){let e=["resRC.x","resRC.y","resRC.z","resRC.w"],o=[];for(let n=0;n<r.length;n++)n===2?o.push("index"):o.push(`${e[n]}`);return o.join()}function Iy(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,indices:s}=t,{axis:a,batchDims:i}=o,l=y.parseAxisParam(a,n.shape)[0];if(D().get("DEBUG")){let b=e.readSync(s.dataId),C=n.shape[l];for(let S=0;S<b.length;++S){let I=b[S];y.assert(I<=C-1&&I>=0,()=>`GatherV2: the index value ${I} is not in [0, ${C-1}]`)}}let c=N.segment_util.collectGatherOpShapeInfo(n,s,l,i),u=y.sizeFromShape(s.shape),p=[],m=q({inputs:{x:n},backend:e,attrs:{shape:[c.batchSize,c.outerSize,c.dimSize,c.sliceSize]}}),f=q({inputs:{x:s},backend:e,attrs:{shape:[c.batchSize,u/c.batchSize]}});p.push(m),p.push(f);let d=[c.batchSize,c.outerSize,u/c.batchSize,c.sliceSize];if(e.shouldExecuteOnCPU([n,s])||n.dtype==="string"){let b=e.bufferSync(f),C=e.bufferSync(m),S=FS(C,b,d);return p.forEach(I=>e.disposeIntermediateTensorInfo(I)),e.makeTensorInfo(c.outputShape,S.dtype,S.values)}let g=new mf(m.shape,d),h=e.runWebGLProgram(g,[m,f],m.dtype);p.push(h);let x=q({inputs:{x:h},backend:e,attrs:{shape:c.outputShape}});return p.forEach(b=>e.disposeIntermediateTensorInfo(b)),x}var uN={kernelName:sa,backendName:"webgl",kernelFunc:Iy};var lz="return float(a > b);",cz=`
  return vec4(greaterThan(a, b));
`,uz=_t({opSnippet:lz,packedOpSnippet:cz,cpuKernelImpl:_S,dtype:"bool"}),pN={kernelName:pn,backendName:"webgl",kernelFunc:uz};var pz="return float(a >= b);",mz=`
  return vec4(greaterThanEqual(a, b));
`,fz=_t({opSnippet:pz,packedOpSnippet:mz,dtype:"bool",cpuKernelImpl:DS}),mN={kernelName:mn,backendName:"webgl",kernelFunc:fz};function dz(r){let{inputs:t,backend:e}=r,{input:o}=t;return sf(o,!0,e)}var fN={kernelName:ia,backendName:"webgl",kernelFunc:dz};var hz="return float(!isnan(x) && !isinf(x));",gz=st({opSnippet:hz,dtype:"bool"}),dN={kernelName:fn,backendName:"webgl",kernelFunc:gz};var xz="return float(isinf(x));",yz=st({opSnippet:xz,dtype:"bool"}),hN={kernelName:dn,backendName:"webgl",kernelFunc:yz};var bz="return float(isnan(x));",wz=st({opSnippet:bz,dtype:"bool"}),gN={kernelName:hn,backendName:"webgl",kernelFunc:wz};var vz="return float(a < b);",Sz=`
  return vec4(lessThan(a, b));
`,Cz=_t({opSnippet:vz,packedOpSnippet:Sz,cpuKernelImpl:OS,dtype:"bool"}),xN={kernelName:gn,backendName:"webgl",kernelFunc:Cz};var Tz="return float(a <= b);",Nz=`
  return vec4(lessThanEqual(a, b));
`,Iz=_t({opSnippet:Tz,packedOpSnippet:Nz,cpuKernelImpl:PS,dtype:"bool"}),yN={kernelName:xn,backendName:"webgl",kernelFunc:Iz};function kz(r){let{backend:t,attrs:e}=r,{start:o,stop:n,num:s}=e,a=MS(o,n,s);return t.makeTensorInfo([a.length],"float32",a)}var bN={kernelName:ua,backendName:"webgl",kernelFunc:kz};var Ez=Nr+`
  return x < 0.0 ? 0./0. : log(x);
`,$z=`
  vec4 result = log(x);
  bvec4 isNaN = isnan(x);
  result.r = isNaN.r ? x.r : (x.r < 0.0 ? 0./0. : result.r);
  result.g = isNaN.g ? x.g : (x.g < 0.0 ? 0./0. : result.g);
  result.b = isNaN.b ? x.b : (x.b < 0.0 ? 0./0. : result.b);
  result.a = isNaN.a ? x.a : (x.a < 0.0 ? 0./0. : result.a);
  return result;
`,Rz=st({opSnippet:Ez,packedOpSnippet:$z,cpuKernelImpl:LS}),wN={kernelName:"Log",backendName:"webgl",kernelFunc:Rz};var Az=Nr+`
  return log(1.0 + x);
`,Fz=st({opSnippet:Az}),vN={kernelName:yn,backendName:"webgl",kernelFunc:Fz};var _z="return float(a >= 1.0 && b >= 1.0);",Dz=`
  return vec4(
    vec4(greaterThanEqual(a, vec4(1.0))) *
    vec4(greaterThanEqual(b, vec4(1.0))));
`,Oz=_t({opSnippet:_z,packedOpSnippet:Dz,dtype:"bool"}),SN={kernelName:bn,backendName:"webgl",kernelFunc:Oz};var Pz="return float(!(x >= 1.0));",Mz=st({opSnippet:Pz}),CN={kernelName:wn,backendName:"webgl",kernelFunc:Mz};var Lz="return float(a >= 1.0 || b >= 1.0);",Bz=`
  return min(
    vec4(greaterThanEqual(a, vec4(1.0))) +
    vec4(greaterThanEqual(b, vec4(1.0))),
    vec4(1.0));
`,Vz=_t({opSnippet:Lz,packedOpSnippet:Bz,dtype:"bool"}),TN={kernelName:vn,backendName:"webgl",kernelFunc:Vz};var ff=class{constructor(t,e,o,n,s){this.variableNames=["x"],this.outputShape=[];let a=e,i=t[3]-1;this.outputShape=t;let l,c=`float(${o}) + float(${n}) * sum`;s===.5?l=`inversesqrt(${c})`:s===1?l=`1.0/(${c})`:l=`exp(log(${c}) * float(-${s}));`,this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int r = coords[1];
        int c = coords[2];
        int d = coords[3];
        float x = getX(b, r, c, d);
        float sum = 0.0;
        for (int j = -${a}; j <= ${a}; j++) {
          int idx = d + j;
          if (idx >= 0 && idx <=  ${i}) {
            float z = getX(b, r, c, idx);
            sum += z * z;
          }
        }
        float val = x * ${l};
        setOutput(val);
      }
    `}};var df=class{constructor(t,e,o,n,s){this.variableNames=["x"],this.outputShape=[],this.packedInputs=!0,this.packedOutput=!0;let a=e,i=t[3]-1;this.outputShape=t;let l,c=`float(${o}) + float(${n}) * sum`;s===.5?l=`inversesqrt(${c})`:s===1?l=`1.0/(${c})`:l=`exp(log(${c}) * float(-${s}));`,this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords.x;
        int r = coords.y;
        int c = coords.z;
        int d = coords.w;

        bool hasNextCol = d < ${this.outputShape[3]};
        bool hasNextRow = c < ${this.outputShape[2]};

        vec4 sum = vec4(0.);
        vec4 xFragAtOutputCoords = getX(b, r, c, d);

        vec4 xAtOutputCoords = vec4(
          getChannel(xFragAtOutputCoords, vec2(c, d)),
          hasNextCol ?
            getChannel(xFragAtOutputCoords, vec2(c, d + 1)) : 0.0,
          hasNextRow ?
            getChannel(xFragAtOutputCoords , vec2(c + 1, d)) : 0.0,
          (hasNextRow && hasNextCol) ?
            getChannel(xFragAtOutputCoords, vec2(c + 1, d + 1)) : 0.0
        );

        int firstChannel = d - ${a};
        vec2 cache = vec2(0.);
        if(firstChannel >= 0){
          vec4 firstChannelFrag = getX(b, r, c, firstChannel);
          cache.x = getChannel(firstChannelFrag, vec2(c, firstChannel));
            if(hasNextRow){
              cache.y = getChannel(firstChannelFrag, vec2(c + 1, firstChannel));
            }
        }

        ivec2 depth = ivec2(d, d + 1);
        for (int j = - ${a}; j <= ${a}; j++) {
          ivec2 idx = depth + j;
          bvec2 aboveLowerBound = greaterThanEqual(idx, ivec2(0));
          bvec2 belowUpperBound = lessThanEqual(idx, ivec2(${i}));

          bool depthInRange = aboveLowerBound.x && belowUpperBound.x;
          bool depthPlusOneInRange = aboveLowerBound.y && belowUpperBound.y;

          if(depthInRange || depthPlusOneInRange){
            vec4 z = vec4(0.);
            vec4 xFragAtCurrentDepth;
            z.xz = cache.xy;
            if(depthPlusOneInRange && hasNextCol){
              xFragAtCurrentDepth = idx.y != d ?
                getX(b, r, c, idx.y) : xFragAtOutputCoords;
              z.y = getChannel(xFragAtCurrentDepth, vec2(c, idx.y));
              if(hasNextRow){
                z.w = getChannel(xFragAtCurrentDepth, vec2(c + 1, idx.y));
              }
            }
            cache.xy = z.yw;
            sum += z * z;
          }
        }
        vec4 result = xAtOutputCoords * ${l};
        setOutput(result);
      }
    `}};var zz=r=>{let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{depthRadius:s,bias:a,alpha:i,beta:l}=o,c=D().getBool("WEBGL_PACK_NORMALIZATION")?new df(n.shape,s,a,i,l):new ff(n.shape,s,a,i,l);return e.runWebGLProgram(c,[n],n.dtype)},NN={kernelName:"LRN",backendName:"webgl",kernelFunc:zz};var hf=class{constructor(t,e,o,n,s){this.variableNames=["inputImage","outputImage","dy"],this.outputShape=[],this.outputShape=t,this.depth=t[3],this.depthRadius=e,this.bias=o,this.alpha=n,this.beta=s,this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int r = coords[1];
        int c = coords[2];

        float result = 0.0;
        for (int d = 0; d < ${this.depth}; ++d) {
          int depthBegin = int(max(0.0, float(d - ${e})));
          int depthEnd = int(min(float(${this.depth}),
              float(d + ${e} + 1)));

          const int MIN_DEPTH_BEGIN = 0;
          const int MAX_DEPTH_END = ${this.depth};

          float norm = 0.0;
          for (int k = MIN_DEPTH_BEGIN; k < MAX_DEPTH_END; ++k) {
            if (k < depthBegin){
              continue;
            }
            else if (k >= depthBegin && k < depthEnd) {
              norm += getInputImage(b, r, c, k) * getInputImage(b, r, c, k);
            }
            else {
              break;
            }
          }

          norm = float(${n}) * norm + float(${o});

          for(int k = MIN_DEPTH_BEGIN; k < MAX_DEPTH_END; ++k){
            if (k < depthBegin){
              continue;
            }
            else if (k >= depthBegin && k < depthEnd){
              float dyi = -2.0 * float(${n})
                * float(${s})
                * getInputImage(b, r, c, k) * getOutputImage(b, r, c, d)
                / norm;
              if (k == d) {
                dyi += pow(norm, -1.0 * ${s});
              }
              if (k == coords[3]) {
                dyi *= getDy(b, r, c, d);
                result += dyi;
              }
            }
            else {
              break;
            }
          }
      }
      setOutput(result);
      }
    `}};var Wz=r=>{let{inputs:t,backend:e,attrs:o}=r,{x:n,y:s,dy:a}=t,{depthRadius:i,bias:l,alpha:c,beta:u}=o,p=new hf(n.shape,i,l,c,u);return e.runWebGLProgram(p,[n,s,a],n.dtype)},IN={kernelName:pc,backendName:"webgl",kernelFunc:Wz};function kN(r,t,e,o){let n=y.sizeFromShape(t),a=y.sizeFromShape(r.shape)/n,i=q({inputs:{x:r},attrs:{shape:[a,n]},backend:o}),l=pr(i,r.dtype,"max",o),c=q({inputs:{x:l},attrs:{shape:e},backend:o});return o.disposeIntermediateTensorInfo(i),o.disposeIntermediateTensorInfo(l),c}function ky(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{reductionIndices:s,keepDims:a}=o,i=n.shape.length,l=y.parseAxisParam(s,n.shape),c=l,u=N.getAxesPermutation(c,i),p=u!=null,m=e.shouldExecuteOnCPU([n]),f=n;if(p){if(m){let C=e.texData.get(f.dataId).values,S=new Array(i);for(let R=0;R<S.length;R++)S[R]=n.shape[u[R]];let I=Bi(C,n.shape,n.dtype,u,S);f=e.makeTensorInfo(S,n.dtype);let $=e.texData.get(f.dataId);$.values=I}else f=us(n,u,e);c=N.getInnerMostAxes(c.length,i)}N.assertAxesAreInnerMostDims("max",c,i);let[d,g]=N.computeOutAndReduceShapes(f.shape,c),h=d;a&&(h=N.expandShapeToKeepDim(d,l));let x;if(m){let C=e.texData.get(f.dataId).values,S=BS(C,y.sizeFromShape(g),h,n.dtype);x=e.makeTensorInfo(h,n.dtype);let I=e.texData.get(x.dataId);I.values=S}else x=kN(f,g,h,e);return p&&e.disposeIntermediateTensorInfo(f),x}var EN={kernelName:"Max",backendName:"webgl",kernelFunc:ky};var Gz=Gl+`
  return max(a, b);
`,Uz=`
  vec4 result = vec4(max(a, b));
  bvec4 isNaNA = isnan(a);
  bvec4 isNaNB = isnan(b);
  bvec4 isNaN = bvec4(isNaNA.x || isNaNB.x, isNaNA.y || isNaNB.y, isNaNA.z || isNaNB.z, isNaNA.w || isNaNB.w);
  `+ur+`
  return result;
`,Hz=_t({opSnippet:Gz,packedOpSnippet:Uz,cpuKernelImpl:VS}),$N={kernelName:Sn,backendName:"webgl",kernelFunc:Hz};function Kz(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t;io(n,"maxPool");let{filterSize:s,strides:a,pad:i,dimRoundingMode:l}=o,c=1;y.assert(N.eitherStridesOrDilationsAreOne(a,c),()=>`Error in maxPool: Either strides or dilations must be 1. Got strides ${a} and dilations '${c}'`);let u=N.computePool2DInfo(n.shape,s,a,c,i,l);if(u.filterWidth===1&&u.filterHeight===1&&y.arraysEqual(u.inShape,u.outShape))return re({inputs:{x:n},backend:e});let p=new Lr(u,"max",!1);return e.runWebGLProgram(p,[n],n.dtype)}var RN={kernelName:ma,backendName:"webgl",kernelFunc:Kz};function qz(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{filterSize:s,strides:a,pad:i,dataFormat:l,dimRoundingMode:c}=o,u=[1,1,1],p=N.computePool3DInfo(n.shape,s,a,u,i,c,l),m=new ps(p,"max",!1);return e.runWebGLProgram(m,[n],n.dtype)}var AN={kernelName:fa,backendName:"webgl",kernelFunc:qz};var gf=class{constructor(t){this.variableNames=["dy","maxPos"],this.outputShape=t.inShape;let e=t.strideHeight,o=t.strideWidth,n=t.dilationHeight,s=t.effectiveFilterHeight,a=t.effectiveFilterWidth,i=s-1-t.padInfo.top,l=a-1-t.padInfo.left,c=s*a-1;this.userCode=`
      const ivec2 pads = ivec2(${i}, ${l});

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];

        ivec2 dyRCCorner = coords.yz - pads;
        int dyRCorner = dyRCCorner.x;
        int dyCCorner = dyRCCorner.y;

        // Convolve dy(?, ?, d) with pos mask(:, :, d) to get dx(xR, xC, d).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;
        for (int wR = 0; wR < ${s};
          wR += ${n}) {
          float dyR = float(dyRCorner + wR) / ${e}.0;

          if (dyR < 0.0 || dyR >= ${t.outHeight}.0 || fract(dyR) > 0.0) {
            continue;
          }
          int idyR = int(dyR);

          for (int wC = 0; wC < ${a}; wC++) {
            float dyC = float(dyCCorner + wC) / ${o}.0;

            if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                fract(dyC) > 0.0) {
              continue;
            }
            int idyC = int(dyC);

            float dyValue = getDy(b, idyR, idyC, d);
            int maxPosValue = ${c} - int(getMaxPos(b, idyR, idyC, d));

            // Get the current value, check it against the value from the
            // position matrix.
            int curPosValue = wR * ${a} + wC;
            float mask = float(maxPosValue == curPosValue ? 1.0 : 0.0);

            dotProd += dyValue * mask;
          }
        }
        setOutput(dotProd);
      }
    `}},xf=class{constructor(t){this.variableNames=["dy","maxPos"],this.outputShape=t.inShape;let e=t.strideDepth,o=t.strideHeight,n=t.strideWidth,s=t.dilationDepth,a=t.dilationHeight,i=t.dilationWidth,l=t.effectiveFilterDepth,c=t.effectiveFilterHeight,u=t.effectiveFilterWidth,p=l-1-t.padInfo.front,m=c-1-t.padInfo.top,f=u-1-t.padInfo.left,d=l*c*u-1;this.userCode=`
      const ivec3 pads = ivec3(${p}, ${m}, ${f});

      void main() {
        ivec5 coords = getOutputCoords();
        int batch = coords.x;
        int ch = coords.u;

        ivec3 dyCorner = ivec3(coords.y, coords.z, coords.w) - pads;
        int dyDCorner = dyCorner.x;
        int dyRCorner = dyCorner.y;
        int dyCCorner = dyCorner.z;

        // Convolve dy(?, ?, ?, ch) with pos mask(:, :, :, d) to get
        // dx(xD, xR, xC, ch).
        // ? = to be determined. : = across all values in that axis.
        float dotProd = 0.0;

        for (int wD = 0; wD < ${l};
           wD += ${s}) {
          float dyD = float(dyDCorner + wD) / ${e}.0;

          if (dyD < 0.0 || dyD >= ${t.outDepth}.0 || fract(dyD) > 0.0) {
            continue;
          }
          int idyD = int(dyD);

          for (int wR = 0; wR < ${c};
              wR += ${a}) {
            float dyR = float(dyRCorner + wR) / ${o}.0;

            if (dyR < 0.0 || dyR >= ${t.outHeight}.0 ||
                fract(dyR) > 0.0) {
              continue;
            }
            int idyR = int(dyR);

            for (int wC = 0; wC < ${u};
                wC += ${i}) {
              float dyC = float(dyCCorner + wC) / ${n}.0;

              if (dyC < 0.0 || dyC >= ${t.outWidth}.0 ||
                  fract(dyC) > 0.0) {
                continue;
              }
              int idyC = int(dyC);

              float dyValue = getDy(batch, idyD, idyR, idyC, ch);
              int maxPosValue = ${d} -
                  int(getMaxPos(batch, idyD, idyR, idyC, ch));

              // Get the current value, check it against the value from the
              // position matrix.
              int curPosValue =
                  wD * ${c} * ${u} +
                  wR * ${u} + wC;
              float mask = float(maxPosValue == curPosValue ? 1.0 : 0.0);

              dotProd += dyValue * mask;
            }
          }
        }
        setOutput(dotProd);
      }
    `}};function jz(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s}=t,a=s,{filterSize:i,strides:l,pad:c,dimRoundingMode:u}=o,p=[1,1,1],m=N.computePool3DInfo(a.shape,i,l,p,c,u),f=new ps(m,"max",!0),d=e.runWebGLProgram(f,[a],a.dtype),g=new xf(m),h=e.runWebGLProgram(g,[n,d],a.dtype);return e.disposeIntermediateTensorInfo(d),h}var FN={kernelName:fc,backendName:"webgl",kernelFunc:jz};function Xz(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s,output:a}=t,i=s;io([s,a],"maxPoolGrad");let{filterSize:l,strides:c,pad:u,dimRoundingMode:p}=o,m=N.computePool2DInfo(i.shape,l,c,1,u,p),f=!0,d=new Lr(m,"max",f),g=e.runWebGLProgram(d,[i],i.dtype),h=new gf(m),x=e.runWebGLProgram(h,[n,g],i.dtype);return e.disposeIntermediateTensorInfo(g),x}var _N={kernelName:mc,backendName:"webgl",kernelFunc:Xz};function DN(r,t,e,o){let n=new Lr(e,"max",!1),s=o.runWebGLProgram(n,[r],"float32");n=new Lr(e,"max",!0,!0,t);let a=o.runWebGLProgram(n,[r],"float32");return[s,a]}var ON={kernelName:da,backendName:"webgl",kernelFunc:({inputs:r,attrs:t,backend:e})=>{let{x:o}=r,{filterSize:n,strides:s,pad:a,includeBatchInIndex:i}=t,l=e;y.assert(o.shape.length===4,()=>`Error in maxPool: input must be rank 4 but got rank ${o.shape.length}.`);let c=[1,1];y.assert(N.eitherStridesOrDilationsAreOne(s,c),()=>`Error in maxPool: Either strides or dilations must be 1. Got strides ${s} and dilations '${c}'`);let u=N.computePool2DInfo(o.shape,n,s,c,a),[p,m]=DN(o,i,u,l);return[p,m]}};function PN(r,t,e,o){let n=y.sizeFromShape(t),a=y.sizeFromShape(r.shape)/n,i=q({inputs:{x:r},attrs:{shape:[a,n]},backend:o}),l=pr(i,"float32","mean",o),c=q({inputs:{x:l},attrs:{shape:e},backend:o});return o.disposeIntermediateTensorInfo(i),o.disposeIntermediateTensorInfo(l),c}var MN={kernelName:ha,backendName:"webgl",kernelFunc:({inputs:r,attrs:t,backend:e})=>{let{x:o}=r,{keepDims:n,axis:s}=t,a=e,i=o.shape.length,l=y.parseAxisParam(s,o.shape),c=l,u=N.getAxesPermutation(c,i),p=u!=null,m=a.shouldExecuteOnCPU([o]),f=[],d=o;if(p){if(m){let S=a.texData.get(d.dataId).values,I=new Array(i);for(let A=0;A<I.length;A++)I[A]=o.shape[u[A]];let $=Bi(S,o.shape,o.dtype,u,I);d=a.makeTensorInfo(I,o.dtype);let R=a.texData.get(d.dataId);R.values=$}else d=us(o,u,a);f.push(d),c=N.getInnerMostAxes(c.length,i)}N.assertAxesAreInnerMostDims("sum",c,i);let[g,h]=N.computeOutAndReduceShapes(d.shape,c),x=g;n&&(x=N.expandShapeToKeepDim(g,l));let b=PN(d,h,x,a);for(let C of f)a.disposeIntermediateTensorInfo(C);return b}};function Yz(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o,i=n.shape.length,l=y.parseAxisParam(s,n.shape),c=l,u=N.getAxesPermutation(c,i),p=n;u!=null&&(p=Wt({inputs:{x:n},backend:e,attrs:{perm:u}}),c=N.getInnerMostAxes(c.length,n.shape.length)),N.assertAxesAreInnerMostDims("min",c,i);let[m,f]=N.computeOutAndReduceShapes(p.shape,c),d=y.sizeFromShape(f),g=q({inputs:{x:p},backend:e,attrs:{shape:[-1,d]}}),h=pr(g,g.dtype,"min",e),x;if(a){let b=N.expandShapeToKeepDim(m,l);x=q({inputs:{x:h},backend:e,attrs:{shape:b}})}else x=q({inputs:{x:h},backend:e,attrs:{shape:m}});return e.disposeIntermediateTensorInfo(g),e.disposeIntermediateTensorInfo(h),u!=null&&e.disposeIntermediateTensorInfo(p),x}var LN={kernelName:"Min",backendName:"webgl",kernelFunc:Yz};var Qz=Gl+`
  return min(a, b);
`,Zz=`
  vec4 result = vec4(min(a, b));
  bvec4 isNaNA = isnan(a);
  bvec4 isNaNB = isnan(b);
  bvec4 isNaN = bvec4(isNaNA.x || isNaNB.x, isNaNA.y || isNaNB.y, isNaNA.z || isNaNB.z, isNaNA.w || isNaNB.w);
  `+ur+`
  return result;
`,Jz=_t({opSnippet:Qz,packedOpSnippet:Zz,cpuKernelImpl:zS}),BN={kernelName:Cn,backendName:"webgl",kernelFunc:Jz};var yf=class{constructor(t,e,o){this.variableNames=["x"],this.outputShape=e.map((u,p)=>u[0]+t[p]+u[1]);let n=t.length,s=ht(n),a=e.map(u=>u[0]).join(","),i=e.map((u,p)=>u[0]+t[p]).join(","),l=["coords[0]","coords[1]","coords[2]","coords[3]"].slice(0,n),c=o==="reflect"?0:1;if(n===1){this.userCode=`
        int start = ${a};
        int end = ${i};

        void main() {
          int outC = getOutputCoords();
          if (outC < start) {
            outC = start * 2 - outC - ${c};
          } else if(outC >= end) {
            outC = (end - 1) * 2 - outC + ${c};
          }
          setOutput(getX(outC - start));
        }
      `;return}this.userCode=`
      ${s} start = ${s}(${a});
      ${s} end = ${s}(${i});

      void main() {
        ${s} outC = getOutputCoords();
        for (int i = 0; i < ${n}; i++) {
          if (outC[i] < start[i]) {
            outC[i] = start[i] * 2 - outC[i] - ${c};
          } else if(outC[i] >= end[i]) {
            outC[i] = (end[i] - 1) * 2 - outC[i] + ${c};
          }
        }
        ${s} coords = outC - start;
        setOutput(getX(${l}));
      }
    `}};var bf=class{constructor(t,e,o){this.variableNames=["x"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=e.map((d,g)=>d[0]+t[g]+d[1]);let n=t.length,s=ht(n),a=e.map(d=>d[0]).join(","),i=e.map((d,g)=>d[0]+t[g]).join(","),l=ee("rc",n),c=ee("source",n),u=`${l[n-1]} < ${this.outputShape[n-1]}`,p=n===1?"source":`vec2(${c.slice(-2).join()})`,m=o==="reflect"?0:1,f="";if(n===1){let d=`
        ${s} source = rc;
        if (source < start) {
          source = start * 2 - source - ${m};
        } else if (source >= end) {
          source = (end - 1) * 2 - source + ${m};
        }
        source -= start;
      `;f=`
        ${s} rc = outputLoc;
        ${d}
        result[0] = getChannel(getX(${c.join()}), ${p});
        ${l[n-1]} += 1;
        if(${u}) {
          ${d}
          result[1] = getChannel(getX(${c.join()}), ${p});
        }
      `}else{let d=`
        ${s} source = rc;
        ${s} lt = ${s}(lessThan(source, start));
        ${s} gte = ${s}(greaterThanEqual(source, end));
        ${s} orig = 1 - (lt + gte);
        source = orig * source +
                lt * (start * 2 - source - ${m}) +
                gte * ((end - 1) * 2 - source + ${m});
        source -= start;
      `;f=`
        ${s} rc = outputLoc;
        ${d}
        result[0] = getChannel(getX(${c.join()}), ${p});
        ${l[n-1]} += 1;
        if(${u}) {
          ${d}
          result[1] = getChannel(getX(${c.join()}), ${p});
        }
        rc = outputLoc;
        ${l[n-2]} += 1;
        if(${l[n-2]} < ${this.outputShape[n-2]}) {
          ${d}
          result[2] = getChannel(getX(${c.join()}), ${p});
          ${l[n-1]} += 1;
          if(${u}) {
            ${d}
            result[3] = getChannel(getX(${c.join()}), ${p});
          }
        }
      `}this.userCode=`
      const ${s} start = ${s}(${a});
      const ${s} end = ${s}(${i});

      void main() {
        ${s} outputLoc = getOutputCoords();
        vec4 result = vec4(0.);
        ${f}
        setOutput(result);
      }
    `}};var t4=({inputs:r,backend:t,attrs:e})=>{let{x:o}=r,{paddings:n,mode:s}=e,a=D().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new bf(o.shape,n,s):new yf(o.shape,n,s);return t.runWebGLProgram(a,[o],o.dtype)},VN={kernelName:ga,backendName:"webgl",kernelFunc:t4};var e4=`if (b == 0.0) return NAN;
  return mod(a, b);`,r4=`
  vec4 result = mod(a, b);
  bvec4 isNaN = equal(b, vec4(0.0));
  `+ur+`
  return result;
`,o4=_t({opSnippet:e4,packedOpSnippet:r4}),zN={kernelName:"Mod",backendName:"webgl",kernelFunc:o4};var wf=class{constructor(t,e,o){this.variableNames=["probs"],this.customUniforms=[{name:"seed",type:"float"}],this.outputShape=[t,o],this.userCode=`
      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];

        float r = random(seed);
        float cdf = 0.0;

        for (int i = 0; i < ${e-1}; i++) {
          cdf += getProbs(batch, i);

          if (r < cdf) {
            setOutput(float(i));
            return;
          }
        }

        // If no other event happened, last event happened.
        setOutput(float(${e-1}));
      }
    `}};var n4=`
if (a == b) {
  return 1.0;
};
return a / b;`,s4=`
  // vec4 one = vec4(equal(a, b));
  // return one + (vec4(1.0) - one) * a / b;
  vec4 result = a / b;
  if(a.x == b.x) {
    result.x = 1.;
  }
  if(a.y == b.y) {
    result.y = 1.;
  }
  if(a.z == b.z) {
    result.z = 1.;
  }
  if(a.w == b.w) {
    result.w = 1.;
  }

  return result;
`,Ey=_t({opSnippet:n4,packedOpSnippet:s4,checkOutOfBounds:!0}),WN={kernelName:sn,backendName:"webgl",kernelFunc:Ey};var GN="return a - b;",$y=_t({opSnippet:GN,packedOpSnippet:GN,supportsComplex:!0,cpuKernelImpl:lC}),UN={kernelName:"Sub",backendName:"webgl",kernelFunc:$y};function Ry(r){let{inputs:t,backend:e,attrs:o}=r,{logits:n}=t,{dim:s}=o,a=y.parseAxisParam([s],n.shape),i=ky({inputs:{x:n},backend:e,attrs:{reductionIndices:a,keepDims:!1}}),l=N.expandShapeToKeepDim(i.shape,a),c=q({inputs:{x:i},backend:e,attrs:{shape:l}}),u=$y({inputs:{a:n,b:c},backend:e}),p=Ty({inputs:{x:u},backend:e}),m=Vi({inputs:{x:p},backend:e,attrs:{axis:a,keepDims:!1}}),f=q({inputs:{x:m},backend:e,attrs:{shape:l}}),d=Ey({inputs:{a:p,b:f},backend:e});return e.disposeIntermediateTensorInfo(i),e.disposeIntermediateTensorInfo(c),e.disposeIntermediateTensorInfo(u),e.disposeIntermediateTensorInfo(p),e.disposeIntermediateTensorInfo(m),e.disposeIntermediateTensorInfo(f),d}var HN={kernelName:Ka,backendName:"webgl",kernelFunc:Ry};function a4(r){let{inputs:t,backend:e,attrs:o}=r,{logits:n}=t,{numSamples:s,seed:a,normalized:i}=o,l=i?n:Ry({inputs:{logits:n},backend:e,attrs:{dim:n.shape.length-1}}),c=l.shape[0],u=l.shape[1],p=new wf(c,u,s),m=[[a]],f=e.runWebGLProgram(p,[l],"int32",m);return i||e.disposeIntermediateTensorInfo(l),f}var KN={kernelName:ya,backendName:"webgl",kernelFunc:a4};var i4=pe+`
  return -x;
`,l4=`
  vec4 result = -x;
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`;function c4(r){let{inputs:t,backend:e}=r,{x:o}=t;if(e.shouldExecuteOnCPU([o])){let s=e.texData.get(o.dataId),[a,i]=GS(s.values,o.shape,o.dtype);return e.makeTensorInfo(i,o.dtype,a)}let n;return D().getBool("WEBGL_PACK_UNARY_OPERATIONS")?n=new Ze(o.shape,l4):n=new ve(o.shape,i4),e.runWebGLProgram(n,[o],o.dtype)}var qN={kernelName:"Neg",backendName:"webgl",kernelFunc:c4};var u4=be.nonMaxSuppressionV3Impl;function p4(r){N.warn("tf.nonMaxSuppression() in webgl locks the UI thread. Call tf.nonMaxSuppressionAsync() instead");let{inputs:t,backend:e,attrs:o}=r,{boxes:n,scores:s}=t,{maxOutputSize:a,iouThreshold:i,scoreThreshold:l}=o,c=e.readSync(n.dataId),u=e.readSync(s.dataId),{selectedIndices:p}=u4(c,u,a,i,l);return e.makeTensorInfo([p.length],"int32",new Int32Array(p))}var jN={kernelName:ba,backendName:"webgl",kernelFunc:p4};var m4=be.nonMaxSuppressionV4Impl;function f4(r){N.warn("tf.nonMaxSuppression() in webgl locks the UI thread. Call tf.nonMaxSuppressionAsync() instead");let{inputs:t,backend:e,attrs:o}=r,{boxes:n,scores:s}=t,{maxOutputSize:a,iouThreshold:i,scoreThreshold:l,padToMaxOutputSize:c}=o,u=e.readSync(n.dataId),p=e.readSync(s.dataId),{selectedIndices:m,validOutputs:f}=m4(u,p,a,i,l,c);return[e.makeTensorInfo([m.length],"int32",new Int32Array(m)),e.makeTensorInfo([],"int32",new Int32Array([f]))]}var XN={kernelName:wa,backendName:"webgl",kernelFunc:f4};var d4=be.nonMaxSuppressionV5Impl;function h4(r){N.warn("tf.nonMaxSuppression() in webgl locks the UI thread. Call tf.nonMaxSuppressionAsync() instead");let{inputs:t,backend:e,attrs:o}=r,{boxes:n,scores:s}=t,{maxOutputSize:a,iouThreshold:i,scoreThreshold:l,softNmsSigma:c}=o,u=e.readSync(n.dataId),p=e.readSync(s.dataId),m=a,f=i,d=l,g=c,{selectedIndices:h,selectedScores:x}=d4(u,p,m,f,d,g);return[e.makeTensorInfo([h.length],"int32",new Int32Array(h)),e.makeTensorInfo([x.length],"float32",new Float32Array(x))]}var YN={kernelName:va,backendName:"webgl",kernelFunc:h4};var vf=class{constructor(t,e,o,n){this.variableNames=["indices"],this.outputShape=[t,e],this.userCode=`
      void main() {
        ivec2 coords = getOutputCoords();
        int index = round(getIndices(coords.x));
        setOutput(mix(float(${n}), float(${o}),
                      float(index == coords.y)));
      }
    `}};var g4=r=>{let{inputs:t,backend:e,attrs:o}=r,{indices:n}=t,{dtype:s,depth:a,onValue:i,offValue:l}=o,c=y.sizeFromShape(n.shape),u=new vf(c,a,i,l),p=q({inputs:{x:n},backend:e,attrs:{shape:[c]}}),m=e.runWebGLProgram(u,[p],s);e.disposeIntermediateTensorInfo(p);let f=[...n.shape,a],d=q({inputs:{x:m},backend:e,attrs:{shape:f}});return e.disposeIntermediateTensorInfo(m),d},QN={kernelName:Ca,backendName:"webgl",kernelFunc:g4};function Eu(r){let{inputs:t,backend:e}=r,{x:o}=t;if(o.dtype==="complex64"){let n=Lo({inputs:{input:o},backend:e}),s=Eu({inputs:{x:n},backend:e}),a=Wi({inputs:{input:o},backend:e}),i=Eu({inputs:{x:a},backend:e}),l=tr({inputs:{real:s,imag:i},backend:e});return e.disposeIntermediateTensorInfo(n),e.disposeIntermediateTensorInfo(s),e.disposeIntermediateTensorInfo(a),e.disposeIntermediateTensorInfo(i),l}else return Bo({attrs:{shape:o.shape,dtype:o.dtype,value:o.dtype==="string"?"":0},backend:e})}var ZN={kernelName:ci,backendName:"webgl",kernelFunc:Eu};function JN(r){let{inputs:t,backend:e}=r,{x:o}=t;if(o.dtype==="string")throw new Error("onesLike is not supported under string dtype");if(o.dtype==="complex64"){let n=Lo({inputs:{input:o},backend:e}),s=JN({inputs:{x:n},backend:e}),a=Wi({inputs:{input:o},backend:e}),i=Eu({inputs:{x:a},backend:e}),l=tr({inputs:{real:s,imag:i},backend:e});return e.disposeIntermediateTensorInfo(n),e.disposeIntermediateTensorInfo(s),e.disposeIntermediateTensorInfo(a),e.disposeIntermediateTensorInfo(i),l}else return Bo({attrs:{shape:o.shape,dtype:o.dtype,value:1},backend:e})}var tI={kernelName:Sa,backendName:"webgl",kernelFunc:JN};function x4(r){let{inputs:t,backend:e,attrs:o}=r,{axis:n}=o;if(t.length===1)return nf({inputs:{input:t[0]},backend:e,attrs:{dim:n}});let s=t[0].shape,a=t[0].dtype;t.forEach(u=>{y.assertShapesMatch(s,u.shape,"All tensors passed to stack must have matching shapes"),y.assert(a===u.dtype,()=>"All tensors passed to stack must have matching dtypes")});let i=[],l=t.map(u=>{let p=nf({inputs:{input:u},backend:e,attrs:{dim:n}});return i.push(p),p}),c=Cy({inputs:l,backend:e,attrs:{axis:n}});return i.forEach(u=>e.disposeIntermediateTensorInfo(u)),c}var eI={kernelName:Ta,backendName:"webgl",kernelFunc:x4};var Sf=class{constructor(t,e,o){this.variableNames=["x"],this.customUniforms=[{name:"value",type:"float"}],this.outputShape=e.map((c,u)=>c[0]+t[u]+c[1]);let n=t.length,s=ht(n),a=e.map(c=>c[0]).join(","),i=e.map((c,u)=>c[0]+t[u]).join(","),l=["coords[0]","coords[1]","coords[2]","coords[3]"].slice(0,n);if(n===1){this.userCode=`
        int start = ${a};
        int end = ${i};

        void main() {
          int outC = getOutputCoords();
          if (outC < start || outC >= end) {
            setOutput(value);
          } else {
            setOutput(getX(outC - start));
          }
        }
      `;return}this.userCode=`
      ${s} start = ${s}(${a});
      ${s} end = ${s}(${i});

      void main() {
        ${s} outC = getOutputCoords();
        if (any(lessThan(outC, start)) || any(greaterThanEqual(outC, end))) {
          setOutput(value);
        } else {
          ${s} coords = outC - start;
          setOutput(getX(${l}));
        }
      }
    `}};var Cf=class{constructor(t,e,o){this.variableNames=["x"],this.packedInputs=!0,this.packedOutput=!0,this.customUniforms=[{name:"value",type:"float"}],this.outputShape=e.map((g,h)=>g[0]+t[h]+g[1]);let n=t.length,s=ht(n),a=e.map(g=>g[0]).join(","),i=e.map((g,h)=>g[0]+t[h]).join(","),l=ee("rc",n),c=ee("source",n),u=`${l[n-1]} < ${this.outputShape[n-1]}`,p=n===1?"source":`vec2(${c.slice(-2).join()})`,m=[`${s} rc = outputLoc;`,`${l[n-1]} += 1;
       if(${u}) {
      `,n===1?"":`}
       rc = outputLoc;
       ${l[n-2]} += 1;
       if(${l[n-2]} < ${this.outputShape[n-2]}) {`,n===1?"":`  ${l[n-1]} += 1;
         if(${u}) {`],f=n===1?"rc < start || rc >= end":"any(lessThan(rc, start)) || any(greaterThanEqual(rc, end))",d="";for(let g=0,h=n===1?2:4;g<h;g++)d+=`
        ${m[g]}
        if (${f}) {
          result[${g}] = float(value);
        } else {
          ${s} source = rc - start;
          result[${g}] = getChannel(getX(${c.join()}), ${p});
        }
      `;d+=n===1?"} ":"}}",this.userCode=`
      const ${s} start = ${s}(${a});
      const ${s} end = ${s}(${i});

      void main() {
        ${s} outputLoc = getOutputCoords();
        vec4 result = vec4(0.);
        ${d}
        setOutput(result);
      }
    `}};var Ay=r=>{let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{paddings:s,constantValue:a}=o;if(y.sizeFromShape(n.shape)===0){let c=s.map((u,p)=>u[0]+n.shape[p]+u[1]);return Bo({backend:e,attrs:{shape:c,value:a,dtype:n.dtype}})}let i=D().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new Cf(n.shape,s,a):new Sf(n.shape,s,a),l=[[a]];return e.runWebGLProgram(i,[n],n.dtype,l)},rI={kernelName:Na,backendName:"webgl",kernelFunc:Ay};var y4=`
  if(a < 0.0 && floor(b) < b){
    return NAN;
  }
  if (b == 0.0) {
    return 1.0;
  }
  return (round(mod(b, 2.0)) != 1) ?
      pow(abs(a), b) : sign(a) * pow(abs(a), b);
`,b4=`
  // isModRound1 has 1 for components with round(mod(b, 2.0)) == 1, 0 otherwise.
  vec4 isModRound1 = vec4(equal(round(mod(b, 2.0)), ivec4(1)));
  vec4 multiplier = sign(a) * isModRound1 + (vec4(1.0) - isModRound1);
  vec4 result = multiplier * pow(abs(a), b);

  // Ensure that a^0 = 1, including 0^0 = 1 as this correspond to TF and JS
  bvec4 isExpZero = equal(b, vec4(0.0));
  result.r = isExpZero.r ? 1.0 : result.r;
  result.g = isExpZero.g ? 1.0 : result.g;
  result.b = isExpZero.b ? 1.0 : result.b;
  result.a = isExpZero.a ? 1.0 : result.a;

  bvec4 isNaN1 = lessThan(a, vec4(0.0));
  bvec4 isNaN2 = lessThan(floor(b), b);
  bvec4 isNaN = bvec4(isNaN1.x && isNaN2.x, isNaN1.y && isNaN2.y, isNaN1.z && isNaN2.z, isNaN1.w && isNaN2.w);
  `+ur+`
  return result;
`,w4=_t({opSnippet:y4,packedOpSnippet:b4}),oI={kernelName:"Pow",backendName:"webgl",kernelFunc:w4};function v4(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o,i=n.shape.length,l=[],c=y.parseAxisParam(s,n.shape),u=c,p=N.getAxesPermutation(u,i),m=n;p!=null&&(m=Wt({inputs:{x:n},backend:e,attrs:{perm:p}}),u=N.getInnerMostAxes(u.length,i),l.push(m)),N.assertAxesAreInnerMostDims("prod",u,i);let f;if(e.shouldExecuteOnCPU([m])){let d=e.texData.get(m.dataId).values,{outVals:g,outShape:h,outDtype:x}=HS(m.shape,m.dtype,d,u);f=e.makeTensorInfo(h,x,g)}else{let[d,g]=N.computeOutAndReduceShapes(m.shape,u),h=y.sizeFromShape(g),x=q({inputs:{x:m},backend:e,attrs:{shape:[-1,h]}}),b=Kn(n.dtype),C=pr(x,b,"prod",e);f=q({inputs:{x:C},backend:e,attrs:{shape:d}}),l.push(x),l.push(C)}if(a){l.push(f);let d=N.expandShapeToKeepDim(f.shape,c);f=q({inputs:{x:f},backend:e,attrs:{shape:d}})}return l.forEach(d=>e.disposeIntermediateTensorInfo(d)),f}var nI={kernelName:Ea,backendName:"webgl",kernelFunc:v4};function S4(r){let{inputs:t,backend:e,attrs:o}=r,{paramsNestedSplits:n,paramsDenseValues:s,indices:a}=t,{outputRaggedRank:i}=o,l=n.map(x=>e.readSync(x.dataId)),c=n.map(x=>x.shape),u=e.readSync(s.dataId),p=e.readSync(a.dataId),[m,f,d]=KS(l,c,u,s.shape,s.dtype,p,a.shape,i),g=m.map(x=>e.makeTensorInfo([x.length],"int32",x)),h=e.makeTensorInfo(d,s.dtype,f);return g.concat([h])}var sI={kernelName:$a,backendName:"webgl",kernelFunc:S4};function C4(r){let{inputs:t,backend:e}=r,{starts:o,limits:n,deltas:s}=t,a=e.readSync(o.dataId),i=e.readSync(n.dataId),l=e.readSync(s.dataId),[c,u]=qS(a,o.shape,o.dtype,i,n.shape,l,s.shape),p=e.makeTensorInfo([c.length],"int32",c),m=e.makeTensorInfo([u.length],o.dtype,u);return[p,m]}var aI={kernelName:Ra,backendName:"webgl",kernelFunc:C4};function T4(r){let{inputs:t,backend:e,attrs:o}=r,{shape:n,values:s,defaultValue:a,rowPartitionTensors:i}=t,{rowPartitionTypes:l}=o,c=e.readSync(n.dataId),u=e.readSync(s.dataId),p=e.readSync(a.dataId),m=i.map(h=>e.readSync(h.dataId)),f=i.map(h=>h.shape),[d,g]=jS(c,n.shape,u,s.shape,s.dtype,p,a.shape,m,f,l);return e.makeTensorInfo(d,s.dtype,g)}var iI={kernelName:Aa,backendName:"webgl",kernelFunc:T4};var Fy=r=>{let{backend:t,attrs:e}=r,{start:o,stop:n,step:s,dtype:a}=e,i=XS(o,n,s,a);return t.makeTensorInfo([i.length],a,i)},lI={kernelName:Fa,backendName:"webgl",kernelFunc:Fy};var N4="return 1.0 / x;",I4=st({opSnippet:N4}),cI={kernelName:In,backendName:"webgl",kernelFunc:I4};var k4=pe+`
  return (x < 0.0) ? 0.0 : x;
`,E4=`
  vec4 result = x * vec4(greaterThanEqual(x, vec4(0.0)));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,$4=st({opSnippet:k4,packedOpSnippet:E4}),uI={kernelName:kn,backendName:"webgl",kernelFunc:$4};var R4=pe+`
  return (x < 0.0) ? 0.0 : min(6.0, x);
`,A4=`
  vec4 result = min(x, vec4(6.)) * vec4(greaterThanEqual(x, vec4(0.0)));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,F4=st({opSnippet:R4,packedOpSnippet:A4}),pI={kernelName:En,backendName:"webgl",kernelFunc:F4};var Tf=class{constructor(t,e,o,n,s){this.variableNames=["A"],this.outputShape=[];let[a,i,l,c]=t;this.outputShape=[a,e,o,c];let u=[n&&e>1?i-1:i,n&&o>1?l-1:l],p=[n&&e>1?e-1:e,n&&o>1?o-1:o],m;s?m="(vec2(yRC) + vec2(0.5)) * effectiveInputOverOutputRatioRC - vec2(0.5)":m="vec2(yRC) * effectiveInputOverOutputRatioRC",this.userCode=`
      const vec2 effectiveInputOverOutputRatioRC = vec2(
          ${u[0]/p[0]},
          ${u[1]/p[1]});
      const vec2 inputShapeRC = vec2(${i}.0, ${l}.0);

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        ivec2 yRC = coords.yz;

        // Fractional source index.
        vec2 sourceFracIndexRC = ${m};

        // Compute the four integer indices.
        ivec2 sourceFloorRC = ivec2(max(sourceFracIndexRC, vec2(0.0)));
        ivec2 sourceCeilRC = ivec2(
          min(inputShapeRC - 1.0, ceil(sourceFracIndexRC)));

        float topLeft = getA(b, sourceFloorRC.x, sourceFloorRC.y, d);
        float bottomLeft = getA(b, sourceCeilRC.x, sourceFloorRC.y, d);
        float topRight = getA(b, sourceFloorRC.x, sourceCeilRC.y, d);
        float bottomRight = getA(b, sourceCeilRC.x, sourceCeilRC.y, d);

        vec2 fracRC = sourceFracIndexRC - vec2(sourceFloorRC);

        float top = topLeft + (topRight - topLeft) * fracRC.y;
        float bottom = bottomLeft + (bottomRight - bottomLeft) * fracRC.y;
        float newValue = top + (bottom - top) * fracRC.x;

        setOutput(newValue);
      }
    `}};var Nf=class{constructor(t,e,o,n,s){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=[];let[a,i,l,c]=t;this.outputShape=[a,e,o,c];let u=[n&&e>1?i-1:i,n&&o>1?l-1:l],p=[n&&e>1?e-1:e,n&&o>1?o-1:o],m;s?m="(vec3(yRC) + vec3(0.5)) * effectiveInputOverOutputRatioRC - vec3(0.5)":m="vec3(yRC) * effectiveInputOverOutputRatioRC",this.userCode=`
      const vec3 effectiveInputOverOutputRatioRC = vec3(
          ${u[0]/p[0]},
          ${u[1]/p[1]},
          ${u[1]/p[1]});
      const vec3 inputShapeRC = vec3(${i}.0, ${l}.0,
                                     ${l}.0);

      float getAValue(int b, int r, int c, int d) {
        return getChannel(getA(b, r, c, d), vec2(c, d));
      }

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        // Calculate values for next column in yRC.z.
        ivec3 yRC = coords.yzz + ivec3(0, 0, 1);

        // Fractional source index.
        vec3 sourceFracIndexRC = ${m};

        // Compute the four integer indices.
        ivec3 sourceFloorRC = ivec3(max(sourceFracIndexRC, vec3(0.0)));
        ivec3 sourceCeilRC = ivec3(
          min(inputShapeRC - 1.0, ceil(sourceFracIndexRC)));

        // Should we calculate next column and row elements in 2x2 packed cell.
        bool hasNextCol = d < ${c-1};
        bool hasNextRow = coords.z < ${o-1};

        // In parallel, construct four corners for all four components in
        // packed 2x2 cell.
        vec4 topLeft = vec4(
          getAValue(b, sourceFloorRC.x, sourceFloorRC.y, d),
          hasNextCol ? getAValue(b, sourceFloorRC.x, sourceFloorRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceFloorRC.x, sourceFloorRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceFloorRC.x, sourceFloorRC.z, d + 1) : 0.0);

        vec4 bottomLeft = vec4(
          getAValue(b, sourceCeilRC.x, sourceFloorRC.y, d),
          hasNextCol ? getAValue(b, sourceCeilRC.x, sourceFloorRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceCeilRC.x, sourceFloorRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceCeilRC.x, sourceFloorRC.z, d + 1) : 0.0);

        vec4 topRight = vec4(
          getAValue(b, sourceFloorRC.x, sourceCeilRC.y, d),
          hasNextCol ? getAValue(b, sourceFloorRC.x, sourceCeilRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceFloorRC.x, sourceCeilRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceFloorRC.x, sourceCeilRC.z, d + 1) : 0.0);

        vec4 bottomRight = vec4(
          getAValue(b, sourceCeilRC.x, sourceCeilRC.y, d),
          hasNextCol ? getAValue(b, sourceCeilRC.x, sourceCeilRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceCeilRC.x, sourceCeilRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceCeilRC.x, sourceCeilRC.z, d + 1) : 0.0);

        vec3 fracRC = sourceFracIndexRC - vec3(sourceFloorRC);

        vec4 top = mix(topLeft, topRight, fracRC.yyzz);
        vec4 bottom = mix(bottomLeft, bottomRight, fracRC.yyzz);
        vec4 newValue = mix(top, bottom, fracRC.x);

        setOutput(newValue);
      }
    `}};function _4(r){let{inputs:t,backend:e,attrs:o}=r,{images:n}=t,{alignCorners:s,halfPixelCenters:a,size:i}=o,[l,c]=i,u=D().getBool("WEBGL_PACK_IMAGE_OPERATIONS")?new Nf(n.shape,l,c,s,a):new Tf(n.shape,l,c,s,a);return e.runWebGLProgram(u,[n],"float32")}var mI={kernelName:Pa,backendName:"webgl",kernelFunc:_4};var If=class{constructor(t,e,o){this.variableNames=["dy"],this.outputShape=[],this.outputShape=e;let[,n,s]=e,[,a,i]=t,l=[o&&a>1?n-1:n,o&&i>1?s-1:s],c=[o&&a>1?a-1:a,o&&i>1?i-1:i],u=l[0]/c[0],p=l[1]/c[1],m=1/u,f=1/p,d=Math.ceil(m)*2+2,g=Math.ceil(f)*2+2;this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        int r = coords[1];
        int c = coords[2];

        float accumulator = 0.0;

        const float heightScale = float(${u});
        const float widthScale = float(${p});

        const float invHeightScale = float(${m});
        const float invWidthScale = float(${f});

        const int winHeight = int(${d});
        const int winWidth = int(${g});

        // Compute bounds for where in dy we will look
        float startRLerp = floor(float(r) * invHeightScale);
        int startDyR = int(startRLerp - float(winHeight / 2));

        float startCLerp = floor(float(c) * invWidthScale);
        int startDyC = int(startCLerp - float(winWidth / 2));

        // Loop over dy
        for (int dyROffset = 0; dyROffset < winHeight; dyROffset++) {
          int dyR = dyROffset + startDyR;

          // Guard against the window exceeding the bounds of dy
          if (dyR < 0 || dyR >= ${a}) {
            continue;
          }

          for (int dyCOffset = 0; dyCOffset < winWidth; dyCOffset++) {
            int dyC = dyCOffset + startDyC;

            // Guard against the window exceeding the bounds of dy
            if (dyC < 0 || dyC >= ${i}) {
              continue;
            }

            float dxR = float(dyR) * heightScale;
            int topDxRIndex = int(floor(dxR));
            int bottomDxRIndex = int(min(ceil(dxR), ${n-1}.0));
            float dxRLerp = dxR - float(topDxRIndex);
            float inverseDxRLerp = 1.0 - dxRLerp;

            float dxC = float(dyC) * widthScale;
            int leftDxCIndex = int(floor(dxC));
            int rightDxCIndex = int(min(ceil(dxC), ${s-1}.0));
            float dxCLerp = dxC - float(leftDxCIndex);
            float inverseDxCLerp = 1.0 - dxCLerp;

            if (r == topDxRIndex && c == leftDxCIndex) {
              // topLeft
              accumulator +=
                getDy(b, dyR, dyC, d) * inverseDxRLerp * inverseDxCLerp;
            }

            if (r == topDxRIndex && c == rightDxCIndex) {
              // topRight
              accumulator += getDy(b, dyR, dyC, d) * inverseDxRLerp * dxCLerp;
            }

            if (r == bottomDxRIndex && c == leftDxCIndex) {
              // bottomLeft
              accumulator += getDy(b, dyR, dyC, d) * dxRLerp * inverseDxCLerp;
            }

            if (r == bottomDxRIndex && c == rightDxCIndex) {
              // bottomRight
              accumulator += getDy(b, dyR, dyC, d) * dxRLerp * dxCLerp;
            }
          }
        }
        // End loop over dy

        setOutput(accumulator);
      }
    `}};function D4(r){let{inputs:t,backend:e,attrs:o}=r,{images:n,dy:s}=t,{alignCorners:a}=o,i=new If(s.shape,n.shape,a);return e.runWebGLProgram(i,[s],s.dtype)}var fI={kernelName:hc,backendName:"webgl",kernelFunc:D4};var kf=class{constructor(t,e,o,n,s){this.variableNames=["A"],this.outputShape=[];let[a,i,l,c]=t;this.outputShape=[a,e,o,c];let u=[n&&e>1?i-1:i,n&&o>1?l-1:l],p=[n&&e>1?e-1:e,n&&o>1?o-1:o],m=n?"0.5":"0.0",f;s?f="max((vec2(yRC) + vec2(0.5)) * effectiveInputOverOutputRatioRC, vec2(0.0))":f="vec2(yRC) * effectiveInputOverOutputRatioRC",this.userCode=`
      const vec2 effectiveInputOverOutputRatioRC = vec2(
          ${u[0]/p[0]},
          ${u[1]/p[1]});
      const vec2 inputShapeRC = vec2(${i}.0, ${l}.0);

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        ivec2 yRC = coords.yz;

        // Fractional source index.
        vec2 sourceFracIndexRC = ${f};

        // Compute the coordinators of nearest neighbor point.
        ivec2 sourceNearestRC = ivec2(
          min(inputShapeRC - 1.0, floor(sourceFracIndexRC + ${m})));
        float newValue = getA(b, sourceNearestRC.x, sourceNearestRC.y, d);

        setOutput(newValue);
      }
    `}};var Ef=class{constructor(t,e,o,n,s){this.variableNames=["A"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=[];let[a,i,l,c]=t;this.outputShape=[a,e,o,c];let u=[n&&e>1?i-1:i,n&&o>1?l-1:l],p=[n&&e>1?e-1:e,n&&o>1?o-1:o],m=n?"0.5":"0.0",f;s?f="max((vec3(yRC) + vec3(0.5)) * effectiveInputOverOutputRatioRC, vec3(0.0))":f="vec3(yRC) * effectiveInputOverOutputRatioRC",this.userCode=`
      const vec3 effectiveInputOverOutputRatioRC = vec3(
          ${u[0]/p[0]},
          ${u[1]/p[1]},
          ${u[1]/p[1]});
      const vec3 inputShapeRC = vec3(${i}.0, ${l}.0,
                                     ${l}.0);

      float getAValue(int b, int r, int c, int d) {
        return getChannel(getA(b, r, c, d), vec2(c, d));
      }

      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        // Calculate values for next column in yRC.z.
        ivec3 yRC = coords.yzz + ivec3(0, 0, 1);

        // Fractional source index.
        vec3 sourceFracIndexRC = ${f};

        // Compute the coordinators of nearest neighbor point.
        ivec3 sourceNearestRC = ivec3(
          min(inputShapeRC - 1.0, floor(sourceFracIndexRC + ${m})));

        // Should we calculate next column and row elements in 2x2 packed cell.
        bool hasNextCol = d < ${c-1};
        bool hasNextRow = coords.z < ${o-1};

        vec4 newValue = vec4(
          getAValue(b, sourceNearestRC.x, sourceNearestRC.y, d),
          hasNextCol ? getAValue(b, sourceNearestRC.x, sourceNearestRC.y, d + 1)
                     : 0.0,
          hasNextRow ? getAValue(b, sourceNearestRC.x, sourceNearestRC.z, d)
                     : 0.0,
          (hasNextRow && hasNextCol) ?
            getAValue(b, sourceNearestRC.x, sourceNearestRC.z, d + 1) : 0.0);

        setOutput(newValue);
      }
    `}};function O4(r){let{inputs:t,backend:e,attrs:o}=r,{images:n}=t,{alignCorners:s,halfPixelCenters:a,size:i}=o,[l,c]=i,u=D().getBool("WEBGL_PACK_IMAGE_OPERATIONS")?new Ef(n.shape,l,c,s,a):new kf(n.shape,l,c,s,a);return e.runWebGLProgram(u,[n],n.dtype)}var dI={kernelName:Oa,backendName:"webgl",kernelFunc:O4};var $f=class{constructor(t,e,o){this.variableNames=["dy"],this.outputShape=[],this.outputShape=e;let[,n,s]=e,[,a,i]=t,l=[o&&a>1?n-1:n,o&&i>1?s-1:s],c=[o&&a>1?a-1:a,o&&i>1?i-1:i],u=l[0]/c[0],p=l[1]/c[1],m=1/u,f=1/p,d=Math.ceil(m)*2+2,g=Math.ceil(f)*2+2;this.userCode=`
      void main() {
        ivec4 coords = getOutputCoords();
        int b = coords[0];
        int d = coords[3];
        int r = coords[1];
        int c = coords[2];

        float accumulator = 0.0;

        const float heightScale = float(${u});
        const float widthScale = float(${p});

        const float invHeightScale = float(${m});
        const float invWidthScale = float(${f});

        const int winHeight = int(${d});
        const int winWidth = int(${g});

        // Compute bounds for where in dy we will look
        float startRLerp = floor(float(r) * invHeightScale);
        int startDyR = int(floor(startRLerp - float(winHeight / 2)));

        float startCLerp = floor(float(c) * invWidthScale);
        int startDyC = int(floor(startCLerp - float(winWidth / 2)));

        // Loop over dy
        for (int dyROffset = 0; dyROffset < winHeight; dyROffset++) {
          int dyR = dyROffset + startDyR;

          // Guard against the window exceeding the bounds of dy
          if (dyR < 0 || dyR >= ${a}) {
            continue;
          }

          for (int dyCOffset = 0; dyCOffset < winWidth; dyCOffset++) {
            int dyC = dyCOffset + startDyC;

            // Guard against the window exceeding the bounds of dy
            if (dyC < 0 || dyC >= ${i}) {
              continue;
            }

            float sourceFracRow =
              float(${l[0]}) *
                (float(dyR) / float(${c[0]}));

            float sourceFracCol =
                float(${l[1]}) *
                  (float(dyC) / float(${c[1]}));

            int sourceNearestRow = int(min(
                float(int(${n}) - 1),
                ${o} ? float(round(sourceFracRow)) :
                                  float(floor(sourceFracRow))));

            int sourceNearestCol = int(min(
                float(int(${s}) - 1),
                ${o} ? float(round(sourceFracCol)) :
                                  float(floor(sourceFracCol))));

            if (r == sourceNearestRow && c == sourceNearestCol) {
              accumulator += getDy(b, dyR, dyC, d);
            }
          }
        }
        // End loop over dy

        setOutput(accumulator);
      }
    `}};function P4(r){let{inputs:t,backend:e,attrs:o}=r,{images:n,dy:s}=t,{alignCorners:a}=o,i=new $f(s.shape,n.shape,a);return e.runWebGLProgram(i,[s],s.dtype)}var hI={kernelName:dc,backendName:"webgl",kernelFunc:P4};var Rf=class{constructor(t,e){this.variableNames=["x"];let o=t.length;if(o>4)throw new Error(`WebGL backend: Reverse of rank-${o} tensor is not yet supported`);if(this.outputShape=t,o===1){this.userCode=`
        void main() {
          int coord = getOutputCoords();
          setOutput(getX(${t[0]} - coord - 1));
        }
      `;return}let n=i=>e.indexOf(i)!==-1&&t[i]!==1?`${t[i]} - coords[${i}] - 1`:`coords[${i}]`,s=t.map((i,l)=>n(l)).join(","),a=ht(o);this.userCode=`
      void main() {
        ${a} coords = getOutputCoords();
        setOutput(getX(${s}));
      }
    `}};var Af=class{constructor(t,e){this.variableNames=["x"],this.packedInputs=!0,this.packedOutput=!0;let o=t.length;if(o>4)throw new Error(`WebGL backend: Reverse of rank-${o} tensor is not yet supported`);this.outputShape=t;let n=ee("rc",o),s=`${n[o-1]} + 1 < ${this.outputShape[o-1]}`,a=`${n[o-2]} + 1 < ${this.outputShape[o-2]}`,i=ht(o);o===1?this.userCode=`
        void main(){
          int rc = getOutputCoords();
          vec4 result = vec4(0.);
          result.r = getChannel(getX(${t[0]} - rc - 1),
            ${t[0]} - rc - 1);
          if(${s}){
              result.g = getChannel(getX(${t[0]} - (rc  + 1) - 1),
                ${t[0]} - (rc  + 1) - 1);
          }
          setOutput(result);
        }
      `:this.userCode=`
        void main() {
          ${i} rc = getOutputCoords();
          vec4 result = vec4(0.);
          result.r = ${l(n.slice())};
          if(${s}){
            result.g = ${c(n.slice())};
          }
          if(${a}) {
            result.b = ${u(n.slice())};
            if(${s}) {
              result.a = ${p(n.slice())};
            }
          }
          setOutput(result);
        }
    `;function l(d){return m(d)}function c(d){return d[o-1]="("+d[o-1]+" + 1)",m(d)}function u(d){return d[o-2]="("+d[o-2]+" + 1)",m(d)}function p(d){return d[o-1]="("+d[o-1]+" + 1)",d[o-2]="("+d[o-2]+" + 1)",m(d)}function m(d){let g=t.map((b,C)=>f(C,d)),h=g.join(","),x=g.slice(-2).join(",");return`getChannel(getX(${h}), vec2(${x}))`}function f(d,g){return e.indexOf(d)!==-1&&t[d]!==1?`${t[d]} - ${g[d]} - 1`:`${g[d]}`}}};function M4(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{dims:s}=o,a=n.shape.length,i=y.parseAxisParam(s,n.shape);if(a===0)return re({inputs:{x:n},backend:e});let l=D().getBool("WEBGL_PACK_ARRAY_OPERATIONS")?new Af(n.shape,i):new Rf(n.shape,i);return e.runWebGLProgram(l,[n],n.dtype)}var gI={kernelName:Ma,backendName:"webgl",kernelFunc:M4};var Ff=class{constructor(t,e){this.variableNames=["Image"],this.outputShape=[],this.customUniforms=[{name:"params",type:"vec4"}];let o=t[1],n=t[2];this.outputShape=t;let s="";typeof e=="number"?s=`float outputValue = ${e.toFixed(2)};`:s=`
        vec3 fill = vec3(${e.join(",")});
        float outputValue = fill[coords[3]];`,this.userCode=`
        void main() {
          ivec4 coords = getOutputCoords();
          int x = coords[2];
          int y = coords[1];
          float coordXFloat = (float(x) - params[0]) * params[3] -
            (float(y) - params[1]) * params[2];
          float coordYFloat = (float(x) - params[0]) * params[2] +
            (float(y) - params[1]) * params[3];
          int coordX = int(round(coordXFloat + params[0]));
          int coordY = int(round(coordYFloat + params[1]));
          ${s}
          if(coordX >= 0 && coordX < ${n} && coordY >= 0 && coordY < ${o}) {
            outputValue = getImage(coords[0], coordY, coordX, coords[3]);
          }
          setOutput(outputValue);
        }
    `}};var xI={kernelName:ui,backendName:"webgl",kernelFunc:({inputs:r,attrs:t,backend:e})=>{let{image:o}=r,{radians:n,fillValue:s,center:a}=t,i=e,l=new Ff(o.shape,s),[c,u]=N.getImageCenter(a,o.shape[1],o.shape[2]),p=[[c,u,Math.sin(n),Math.cos(n)]];return i.runWebGLProgram(l,[o],o.dtype,p)}};var L4=`
  // OpenGL ES does not support round function.
  // The algorithm is based on banker's rounding.
  float base = floor(x);
  if ((x - base) < 0.5) {
    return floor(x);
  } else if ((x - base) > 0.5) {
    return ceil(x);
  } else {
    if (mod(base, 2.0) == 0.0) {
      return base;
    } else {
      return base + 1.0;
    }
  }
`,B4=st({opSnippet:L4}),yI={kernelName:$n,backendName:"webgl",kernelFunc:B4};var V4="return inversesqrt(x);",z4=st({opSnippet:V4,cpuKernelImpl:YS}),bI={kernelName:Rn,backendName:"webgl",kernelFunc:z4};var ms=class{constructor(t,e,o,n,s,a,i=!0,l=!1){this.variableNames=["updates","indices","defaultValue"],this.outputShape=a;let c=ht(s.length),u=ht(a.length),p="";o===1?p="i":o===2&&(p="i, j");let m=`getIndices(${p})`,f="";n===1?f="i":n===2&&(f="i, coords[1]");let d=`getUpdates(${f})`,g="";l&&(g="coords[0], coords[1]");let h=`getDefaultValue(${g})`,x=e>1?"strides[j]":"strides";this.userCode=`
        ${c} strides = ${c}(${s});

        void main() {
          ${u} coords = getOutputCoords();
          float sum = 0.0;
          bool found = false;
          for (int i = 0; i < ${t}; i++) {
            int flattenedIndex = 0;
            for (int j = 0; j < ${e}; j++) {
              int index = round(${m});
              flattenedIndex += index * ${x};
            }
            if (flattenedIndex == coords[0]) {
              sum += ${d};
              found = true;
            }
          }
          setOutput(mix(${h}, sum, float(found)));
        }
      `}};var _f=class{constructor(t,e,o,n,s,a,i=!0,l=!1){this.variableNames=["updates","indices","defaultValue"],this.packedInputs=!0,this.packedOutput=!0,this.outputShape=a;let c=ht(s.length),u=ht(a.length),p="";o===1?p="i":o===2&&(p="i, j");let m=`getIndices(${p})`,f="";n===1?f="i":n===2&&(f="i, coords[1]");let d=`getUpdates(${f})`,g="";l&&(g="coords[0], coords[1]");let h=`getDefaultValue(${g})`,x=e>1?"strides[j]":"strides",b=e>1?"strides[j + 1]":"strides";this.userCode=`
        ${c} strides = ${c}(${s});

        void main() {
          ${u} coords = getOutputCoords();
          vec4 sum = vec4(0.);
          vec4 found = vec4(0.);
          for (int i = 0; i < ${t}; i+=2) {
            ivec2 flattenedIndex = ivec2(0);
            for (int j = 0; j < ${e}; j+=2) {
              ivec4 index = round(${m});
              flattenedIndex += index.xz * ${x};
              if (j + 1 < ${e}) {
                flattenedIndex += index.yw * ${b};
              }
            }
            if (flattenedIndex[0] == coords[0] || flattenedIndex[1] == coords[0] ||
                flattenedIndex[0] == coords[0] + 1 || flattenedIndex[1] == coords[0] + 1) {
              vec4 updVals = ${d};
              if (flattenedIndex[0] == coords[0]) {
                sum.xy += updVals.xy;
                found.xy = vec2(1.);
              } else if (flattenedIndex[0] == coords[0] + 1) {
                sum.zw += updVals.xy;
                found.zw = vec2(1.);
              }
              if (flattenedIndex[1] == coords[0]) {
                sum.xy += updVals.zw;
                found.xy = vec2(1.);
              } else if (flattenedIndex[1] == coords[0] + 1) {
                sum.zw += updVals.zw;
                found.zw = vec2(1.);
              }
            }
          }
          setOutput(mix(${h}, sum, found));
        }
      `}};function W4(r){let{inputs:t,backend:e,attrs:o}=r,{indices:n,updates:s}=t,{shape:a}=o,{sliceRank:i,numUpdates:l,sliceSize:c,strides:u,outputSize:p}=N.calculateShapes(s,n,a),m=[p/c,c];if(p===0)return e.makeTensorInfo(a,n.dtype);let f=q({inputs:{x:n},backend:e,attrs:{shape:[l,i]}}),d=q({inputs:{x:s},backend:e,attrs:{shape:[l,c]}}),g=e.makeTensorInfo([],"float32",new Float32Array([0])),h;D().getBool("WEBGL_PACK")?h=new _f(l,i,f.shape.length,d.shape.length,u,m):h=new ms(l,i,f.shape.length,d.shape.length,u,m);let x=e.runWebGLProgram(h,[d,f,g],d.dtype),b=q({inputs:{x},backend:e,attrs:{shape:a}});return e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(d),e.disposeIntermediateTensorInfo(x),e.disposeIntermediateTensorInfo(g),b}var wI={kernelName:La,backendName:"webgl",kernelFunc:W4};var Df=class{constructor(t,e,o,n){this.variableNames=["sortedSequence","values"],this.customUniforms=[{name:"numInputs",type:"int"}],this.outputShape=[t,o];let s="while (left < right) {",a=`for (int i = 0; i < ${Math.ceil(Math.log2(e+1))}; ++i) { if (left >= right) break;`,i=D().getNumber("WEBGL_VERSION")===2?s:a,l=n==="left"?"<":"<=";this.userCode=`
       int findBound(int batch, float value) {
         int left = 0;
         int right = numInputs;
         int mid;
         ${i}
           mid = (left + right) / 2;
           if (getSortedSequence(batch, mid) ${l} value) {
             left = mid + 1;
           } else {
             right = mid;
           }
         }
         return right;
       }

       void main() {
         ivec2 coords = getOutputCoords();
         int batch = coords[0];
         int valueIndex = coords[1];

         float value = getValues(batch, valueIndex);

         setOutput(float(findBound(batch, value)));
       }
     `}};function G4(r){let{inputs:t,backend:e,attrs:o}=r,{sortedSequence:n,values:s}=t,{side:a}=o,i=new Df(n.shape[0],n.shape[1],s.shape[1],a),l=[[n.shape[1]]];return e.runWebGLProgram(i,[n,s],"int32",l)}var vI={kernelName:Va,backendName:"webgl",kernelFunc:G4};var Of=class{constructor(t,e,o){this.variableNames=["c","a","b"],this.outputShape=e;let n,s;if(o>4)throw Error(`Where for rank ${o} is not yet supported`);if(o===1)s="resRC",n="resRC";else{let i=["resRC.x","resRC.y","resRC.z","resRC.w"],l=[],c=[];for(let u=0;u<e.length;u++)c.push(`${i[u]}`),u<t&&l.push(`${i[u]}`);n=l.join(),s=c.join()}let a=ht(o);this.userCode=`
      void main() {
        ${a} resRC = getOutputCoords();
        float cVal = getC(${n});
        if (cVal >= 1.0) {
          setOutput(getA(${s}));
        } else {
          setOutput(getB(${s}));
        }
      }
    `}};function U4(r){let{inputs:t,backend:e}=r,{condition:o,t:n,e:s}=t,a=new Of(o.shape.length,n.shape,n.shape.length);return e.runWebGLProgram(a,[o,n,s],se(n.dtype,s.dtype))}var SI={kernelName:za,backendName:"webgl",kernelFunc:U4};var H4=`
  // Stable and Attracting Fixed Point (0, 1) for Normalized Weights.
  // see: https://arxiv.org/abs/1706.02515
  float scaleAlpha = ${N.SELU_SCALEALPHA};
  float scale = ${N.SELU_SCALE};
  return (x >= 0.0) ? scale * x : scaleAlpha * (exp(x) - 1.0);
`,K4=st({opSnippet:H4}),CI={kernelName:An,backendName:"webgl",kernelFunc:K4};var q4=Nr+`
  return 1.0 / (1.0 + exp(-1.0 * x));
`,j4=`
  vec4 result = 1.0 / (1.0 + exp(-1.0 * x));
  bvec4 isNaN = isnan(x);

  result.r = isNaN.r ? x.r : result.r;
  result.g = isNaN.g ? x.g : result.g;
  result.b = isNaN.b ? x.b : result.b;
  result.a = isNaN.a ? x.a : result.a;

  return result;
`,X4=st({opSnippet:q4,packedOpSnippet:j4,cpuKernelImpl:ZS}),TI={kernelName:Dn,backendName:"webgl",kernelFunc:X4};var Y4=`
  if (isnan(x)) { return 0.0; }
  return sign(x);
`,Q4=st({opSnippet:Y4}),NI={kernelName:_n,backendName:"webgl",kernelFunc:Q4};var Z4=Nr+`
  return sin(x);
`,J4=`
  vec4 result = sin(x);
  bvec4 isNaN = isnan(x);
  ${ur}
  return result;
`,tW=st({opSnippet:Z4,packedOpSnippet:J4}),II={kernelName:"Sin",backendName:"webgl",kernelFunc:tW};var eW=`
  float e2x = exp(x);
  return (e2x - 1.0 / e2x) / 2.0;
`,rW=st({opSnippet:eW}),kI={kernelName:Fn,backendName:"webgl",kernelFunc:rW};var oW=`
  float epsilon = 1.1920928955078125e-7;
  float threshold = log(epsilon) + 2.0;

  bool too_large = x > -threshold;
  bool too_small = x < threshold;

  float result;
  float exp_x = exp(x);

  if (too_large){
    result = x;
  }
  else if (too_small){
    result = exp_x;
  }
  else{
    result = log(exp_x + 1.0);
  }
  return result;
`,nW=st({opSnippet:oW}),EI={kernelName:On,backendName:"webgl",kernelFunc:nW};var sW=r=>{let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{blockShape:s,paddings:a}=o;y.assert(n.shape.length<=4,()=>"spaceToBatchND for rank > 4 with a WebGL backend not implemented yet");let i=s.reduce((x,b)=>x*b),l=[[0,0]];l.push(...a);for(let x=1+s.length;x<n.shape.length;++x)l.push([0,0]);let c=[],u=Ay({inputs:{x:n},backend:e,attrs:{paddings:l,constantValue:0}}),p=N.getReshaped(u.shape,s,i,!1),m=N.getPermuted(p.length,s.length,!1),f=N.getReshapedPermuted(u.shape,s,i,!1),d=q({inputs:{x:u},backend:e,attrs:{shape:p}}),g=Wt({inputs:{x:d},backend:e,attrs:{perm:m}}),h=q({inputs:{x:g},backend:e,attrs:{shape:f}});return c.push(u),c.push(d),c.push(g),c.forEach(x=>e.disposeIntermediateTensorInfo(x)),h},$I={kernelName:Ua,backendName:"webgl",kernelFunc:sW};function aW(r){let{inputs:t,backend:e}=r,{indices:o,values:n,denseShape:s,defaultValue:a}=t;if(s.shape.length!==1)throw new Error(`Dense shape must be a vector, saw:
         ${s.shape}`);if(o.shape.length!==2)throw new Error(`Indices must be a matrix, saw:
         ${o.shape}`);if(n.shape.length!==1)throw new Error(`Values must be a vector, saw:
         ${n.shape}`);if(a.shape.length!==0)throw new Error(`Default value must be a scalar, saw:
        ${a.shape}`);let i=e.readSync(o.dataId),l=e.readSync(n.dataId),c=e.readSync(s.dataId),u=e.readSync(a.dataId)[0],[p,m,f,d,g]=tC(i,o.shape,o.dtype,l,n.dtype,c,u);return[e.makeTensorInfo(m,o.dtype,p),e.makeTensorInfo([m[0]],n.dtype,f),e.makeTensorInfo([d.length],"bool",new Uint8Array(d.map(h=>Number(h)))),e.makeTensorInfo([g.length],o.dtype,new Int32Array(g))]}var RI={kernelName:qa,backendName:"webgl",kernelFunc:aW};function iW(r){let{inputs:t,backend:e}=r,{inputIndices:o,inputShape:n,newShape:s}=t;if(o.shape.length!==2)throw new Error(`Input indices should be a matrix but received shape ${o.shape}`);if(n.shape.length!==1)throw new Error(`Input shape should be a vector but received shape ${n.shape}`);if(s.shape.length!==1)throw new Error(`Target shape should be a vector but received shape ${s.shape}`);let a=Array.from(e.readSync(n.dataId)),i=e.readSync(o.dataId),l=Array.from(e.readSync(s.dataId)),[c,u,p]=eC(i,o.shape,o.dtype,a,l);return[e.makeTensorInfo(u,o.dtype,c),e.makeTensorInfo([p.length],s.dtype,new Int32Array(p))]}var AI={kernelName:ja,backendName:"webgl",kernelFunc:iW};function lW(r){let{inputs:t,backend:e}=r,{data:o,indices:n,segmentIds:s}=t;if(o.shape.length<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.shape.length!==1)throw new Error(`Indices should be a vector but received shape
              ${n.shape}`);if(s.shape.length!==1)throw new Error(`Segment ids should be a vector but received shape
              ${s.shape}`);let a=e.readSync(o.dataId),i=e.readSync(n.dataId),l=e.readSync(s.dataId),[c,u]=hm(a,o.shape,o.dtype,i,l,!0);return e.makeTensorInfo(u,o.dtype,c)}var FI={kernelName:Xa,backendName:"webgl",kernelFunc:lW};function cW(r){let{inputs:t,backend:e}=r,{data:o,indices:n,segmentIds:s}=t;if(o.shape.length<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.shape.length!==1)throw new Error(`Indices should be a vector but received shape
             ${n.shape}`);if(s.shape.length!==1)throw new Error(`Segment ids should be a vector but received shape
             ${s.shape}`);let a=e.readSync(o.dataId),i=e.readSync(n.dataId),l=e.readSync(s.dataId),[c,u]=hm(a,o.shape,o.dtype,i,l);return e.makeTensorInfo(u,o.dtype,c)}var _I={kernelName:Ya,backendName:"webgl",kernelFunc:cW};function uW(r){let{inputs:t,backend:e,attrs:o}=r,{sparseIndices:n,sparseValues:s,defaultValue:a}=t,{outputShape:i}=o,{sliceRank:l,numUpdates:c,sliceSize:u,strides:p,outputSize:m}=N.calculateShapes(s,n,i),f=!1;if(s.dtype==="string"){let x=e.bufferSync(n),b=e.bufferSync(s),C=y.decodeString(e.readSync(a.dataId)[0]),S=QS(x,b,i,m,u,c,l,p,C,f);return e.makeTensorInfo(i,S.dtype,S.values)}let d=new ms(c,l,n.shape.length,s.shape.length,p,[m,1],f),g=e.runWebGLProgram(d,[s,n,a],s.dtype),h=q({inputs:{x:g},backend:e,attrs:{shape:i}});return e.disposeIntermediateTensorInfo(g),h}var DI={kernelName:Qa,backendName:"webgl",kernelFunc:uW};function pW(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{numOrSizeSplits:s,axis:a}=o,i=y.parseAxisParam(a,n.shape)[0],l=N.prepareSplitSize(n,s,i),c=n.shape.length,u=new Array(c).fill(0),p=n.shape.slice();return l.map(m=>{let f=[...p];f[i]=m;let d=Br({inputs:{x:n},backend:e,attrs:{begin:u,size:f}});return u[i]+=m,d})}var OI={kernelName:Ha,backendName:"webgl",kernelFunc:pW};var PI="return sqrt(x);",mW=st({opSnippet:PI,packedOpSnippet:PI,cpuKernelImpl:rC}),MI={kernelName:Pn,backendName:"webgl",kernelFunc:mW};var fW="return x * x;",dW=st({opSnippet:fW}),LI={kernelName:gc,backendName:"webgl",kernelFunc:dW};var BI="return (a - b) * (a - b);",hW=_t({opSnippet:BI,packedOpSnippet:BI}),VI={kernelName:Mn,backendName:"webgl",kernelFunc:hW};function gW(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t;if(n.dtype!=="string")throw new Error("Input must be of datatype string");let s=e.readSync(n.dataId),a=N.fromUint8ToStringArray(s),i=oC(a,"string",o);return e.makeTensorInfo(n.shape,"string",i)}var zI={kernelName:Ln,backendName:"webgl",kernelFunc:gW};function xW({inputs:r,attrs:t,backend:e}){let{x:o}=r,n=pe+`
    return x > 0.0 ? 1.0 : float(${t.alpha});
  `,s=new ve(o.shape,n);return e.runWebGLProgram(s,[o],o.dtype)}var WI={kernelName:Vn,backendName:"webgl",kernelFunc:xW};var Pf=class{constructor(t,e,o){this.variableNames=["x"],this.outputShape=o;let n=o.length,s=ht(o.length),a=ht(o.length),i="";if(n===1)i="coords * strides + begin";else{let l=0;i=o.map((c,u)=>(l++,o.length===1?`coords * strides[${u}] + begin[${u}]`:`coords[${l-1}] * strides[${u}] + begin[${u}]`)).join(",")}this.userCode=`
      ${s} begin = ${s}(${t});
      ${s} strides = ${s}(${e});

      void main() {
        ${a} coords = getOutputCoords();
        setOutput(getX(${i}));
      }
    `}};function yW(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{begin:s,end:a,strides:i,beginMask:l,endMask:c,ellipsisMask:u,newAxisMask:p,shrinkAxisMask:m}=o,{finalShapeSparse:f,finalShape:d,isIdentity:g,sliceDim0:h,isSimpleSlice:x,begin:b,end:C,strides:S}=me.sliceInfo(n.shape,s,a,i,l,c,u,p,m),I;if(g)I=q({inputs:{x:n},backend:e,attrs:{shape:d}});else if(h||x){y.assert(n.shape.length>=1,()=>`Input must have rank at least 1, got: ${n.shape.length}`);let R=me.computeOutShape(b,C,S),A=Br({inputs:{x:n},backend:e,attrs:{begin:b,size:R}});I=q({inputs:{x:A},backend:e,attrs:{shape:d}}),e.disposeIntermediateTensorInfo(A)}else if(e.shouldExecuteOnCPU([n])){let A=e.readSync(n.dataId),F=ot(n.shape,n.dtype,A),_=nC(f,F,S,b);I=e.makeTensorInfo(d,n.dtype,_.values)}else{let A=new Pf(b,S,f);I=e.runWebGLProgram(A,[n],n.dtype)}let $=q({inputs:{x:I},backend:e,attrs:{shape:d}});return e.disposeIntermediateTensorInfo(I),$}var GI={kernelName:Za,backendName:"webgl",kernelFunc:yW};function bW(r){let{inputs:t,backend:e,attrs:o}=r,{separator:n,nGramWidths:s,leftPad:a,rightPad:i,padWidth:l,preserveShortSequences:c}=o,{data:u,dataSplits:p}=t,m=e.readSync(u.dataId),f=e.readSync(p.dataId),[d,g]=sC(m,f,n,s,a,i,l,c);return[e.makeTensorInfo([d.length],"string",d),e.makeTensorInfo(p.shape,"int32",g)]}var UI={kernelName:Ja,backendName:"webgl",kernelFunc:bW};function wW(r){let{inputs:t,backend:e,attrs:o}=r,{skipEmpty:n}=o,{input:s,delimiter:a}=t;if(s.dtype!=="string")throw new Error("Input must be of datatype string");if(s.shape.length!==1)throw new Error(`Input must be a vector, got shape: ${s.shape}`);if(a.shape.length!==0)throw new Error(`Delimiter must be a scalar, got shape: ${a.shape}`);let i=e.readSync(s.dataId),l=e.readSync(a.dataId)[0],[c,u,p]=aC(i,l,n),m=u.length;return[e.makeTensorInfo([m,2],"int32",c),e.makeTensorInfo([m],"string",u),e.makeTensorInfo([2],"int32",new Int32Array(p))]}var HI={kernelName:ti,backendName:"webgl",kernelFunc:wW};function vW(r){let{inputs:t,backend:e,attrs:o}=r,{numBuckets:n}=o,{input:s}=t;if(s.dtype!=="string")throw new Error("Input must be of datatype string");if(n<=0)throw new Error("Number of buckets must be at least 1");let a=e.readSync(s.dataId),i=iC(a,n);return e.makeTensorInfo(s.shape,"int32",i)}var KI={kernelName:ei,backendName:"webgl",kernelFunc:vW};var SW="return tan(x);",CW=st({opSnippet:SW}),qI={kernelName:"Tan",backendName:"webgl",kernelFunc:CW};var TW=`
  float e2x = exp(-2.0 * abs(x));
  return sign(x) * (1.0 - e2x) / (1.0 + e2x);
`,NW=st({opSnippet:TW}),jI={kernelName:Bn,backendName:"webgl",kernelFunc:NW};function IW(r){let{inputs:t,backend:e,attrs:o}=r,{tensor:n,indices:s,updates:a}=t,{}=o,{sliceRank:i,numUpdates:l,sliceSize:c,strides:u,outputSize:p}=N.calculateShapes(a,s,n.shape),m=[p/c,c];if(p===0)return e.makeTensorInfo(n.shape,s.dtype);let f=q({inputs:{x:s},backend:e,attrs:{shape:[l,i]}}),d=q({inputs:{x:a},backend:e,attrs:{shape:[l,c]}}),g=q({inputs:{x:n},backend:e,attrs:{shape:m}}),h=new ms(l,i,f.shape.length,d.shape.length,u,m,!1,!0),x=e.runWebGLProgram(h,[d,f,g],g.dtype),b=q({inputs:{x},backend:e,attrs:{shape:n.shape}});return e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(d),e.disposeIntermediateTensorInfo(g),e.disposeIntermediateTensorInfo(x),b}var XI={kernelName:Ba,backendName:"webgl",kernelFunc:IW};var Mf=class{constructor(t,e){this.variableNames=["A"];let o=new Array(t.length);for(let a=0;a<o.length;a++)o[a]=t[a]*e[a];this.outputShape=o,this.rank=o.length;let n=ht(this.rank),s=kW(t);this.userCode=`
      void main() {
        ${n} resRC = getOutputCoords();
        setOutput(getA(${s}));
      }
    `}};function kW(r){let t=r.length;if(t>5)throw Error(`Tile for rank ${t} is not yet supported`);if(t===1)return`imod(resRC, ${r[0]})`;let e=["resRC.x","resRC.y","resRC.z","resRC.w","resRC.u"],o=[];for(let n=0;n<r.length;n++)o.push(`imod(${e[n]}, ${r[n]})`);return o.join()}function _y(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{reps:s}=o;if(n.dtype==="string"||n.shape.length>5){let l=e.readSync(n.dataId),c=n.dtype==="string"?l.map(m=>y.decodeString(m)):l,u=ot(n.shape,n.dtype,c),p=cC(u,s);return e.makeTensorInfo(p.shape,p.dtype,p.values)}let a=new Mf(n.shape,s);return e.runWebGLProgram(a,[n],n.dtype)}var YI={kernelName:bo,backendName:"webgl",kernelFunc:_y};var Lf=class{constructor(t){this.variableNames=["x","indices"],this.customUniforms=[{name:"n",type:"int"},{name:"firstPass",type:"int"},{name:"negativeInf",type:"float"},{name:"dir",type:"int"},{name:"inc",type:"int"}],this.outputShape=t,this.userCode=`
       void main() {
         ivec2 coords = getOutputCoords();
         int batch = coords[0];
         int elemIdx = coords[1];

         // We compare elements pair-wise within a group of size 2 * inc.
         // The comparing rule for each group alternates between ascending
         // and descending. Within each group, we compare each pair at
         // positions i and i+inc. To decide whether an element at position i
         // is x0 or x1, we mod it by 2 * inc, if the result is smaller than
         // inc, it is in the first half of the group, we denote it as x0,
         // otherwise we denote it as x1.
         // For example, as shown in the Bitonic top K paper referenced above,
         // Figure5(a) shows that element[1] is in the
         // second half of the group when group size is 2, but it is in the
         // first half of the group when group size is 4.

         bool isFirstInPair = imod(elemIdx, 2 * inc) < inc;
         int i = isFirstInPair ? elemIdx : elemIdx - inc;

         int i0 = firstPass == 1 ? i : int(getIndices(batch, i));
         int i1 = firstPass == 1 ? i + inc : int(getIndices(batch, i + inc));
         float x0 = i0 < n ? getX(batch, i0) : negativeInf;
         float x1 = i1 < n ? getX(batch, i1) : negativeInf;

         // Denotes which direction indices are in (ascending or descending).
         bool reverse = imod(elemIdx, 2 * dir) >= dir;
         bool isGreater = x0 > x1 || (x0 == x1 && i1 > i0);
         if (reverse == isGreater) { // Elements in opposite order of direction
           int iTemp = i0;
           i0 = i1;
           i1 = iTemp;
         }
         if (isFirstInPair) {
            setOutput(float(i0));
         } else {
            setOutput(float(i1));
         }
       }
     `}},Bf=class{constructor(t){this.variableNames=["x","indices"],this.customUniforms=[{name:"n",type:"int"},{name:"firstPass",type:"int"},{name:"k",type:"int"}],this.outputShape=t,this.userCode=`
    void main() {
         // Takes max of indices (0, k), (1, k + 1), (2, k + 2) ...
         ivec2 coords = getOutputCoords();
         int batch = coords[0];
         int elemIdx = coords[1];

         // The output size is half of the previous size.
         // If the previous sequence is | | | | _ _ _ _  | | | |  _ _ _ _ (k=4),
         // we only need to output the indices at positions |, the indices at
         // positions _ can be thrown away, see Figure5(b) After Phase 2
         // (Merge phase) in the Bitonic Top K paper referenced above.
         // For example, the paper shows we only need to output the orange bars.
         // The output sequence should look like this | | | | | | | |.
         // Because the sequence is halved, to map the output index back
         // to the previous sequence to find the corresponding value,
         // we need to double the index. When we double the index,
         // we basically interpolate a position, so 2i looks like
         // | _ | _ | _ | _ | _ | _ | _. We move the | to the first k position
         // of each 2k positions by - elemIdx % k. E.g. for output at
         // index 4,5,6,7, we want to get the corresponding element at
         // original index 8,9,10,11, for output at index 8,9,10,11,
         // we want to get the corresponding element at original index
         // 16,17,18,19, so on and so forth.

         int i = elemIdx < k ? elemIdx : (elemIdx * 2 - imod(elemIdx, k));
         int i0 = firstPass == 1 ? i : int(getIndices(batch, i));
         int i1 = firstPass == 1 ? i + k : int(getIndices(batch, i + k));

         float x0 = getX(batch, i0);
         float x1 = i1 < n ? getX(batch, i1) : x0;

         setOutput(x0 >= x1 ? float(i0) : float(i1));
       }
     `}};function Ui(r,t){t!==null&&r.disposeIntermediateTensorInfo(t)}function QI(r){let t=1;for(;t<r;)t*=2;return t}function EW(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{k:s,sorted:a}=o,i=D().getNumber("TOPK_LAST_DIM_CPU_HANDOFF_SIZE_THRESHOLD"),l=D().getNumber("TOPK_K_CPU_HANDOFF_THRESHOLD"),c=n.shape,u=c[c.length-1];if(e.shouldExecuteOnCPU([n])||u<i||s>l){let _=e.readSync(n.dataId),[O,M]=uC(_,c,n.dtype,s,a);return[e.makeTensorInfo(O.shape,O.dtype,O.values),e.makeTensorInfo(M.shape,M.dtype,M.values)]}if(s===0)return c[c.length-1]=0,[e.makeTensorInfo(c,n.dtype,[]),e.makeTensorInfo(c,"int32",[])];if(u===1)return[n,Bo({attrs:{shape:c,dtype:"int32",value:0},backend:e})];let p=e.texData.get(n.dataId),m=p!==null&&p.isPacked,f=m?e.unpackTensor(n):n,g=y.sizeFromShape(c)/u,h=q({inputs:{x:f},attrs:{shape:[g,u]},backend:e});m&&Ui(e,f);let x=QI(s),b=QI(u),C=null,S=()=>C===null?[h,h]:[h,C],I=(_,O,M)=>{let P=S(),B=new Lf(M),z=[[u],[C===null?1:0],[Number.NEGATIVE_INFINITY],[_],[O]],G=C;C=e.runWebGLProgram(B,P,"int32",z),Ui(e,G)};for(let _=1;_<x;_*=2){let O=_*2;for(let M=_;M>=1;M/=2)I(O,M,[g,b])}for(let _=b;_>x;_/=2){let O=S(),M=new Bf([g,_/2]),B=[[u],[C===null?1:0],[x]],V=C;C=e.runWebGLProgram(M,O,"int32",B),Ui(e,V);let z=x/2,G=z*2;for(let W=z;W>=1;W/=2)I(G,W,C.shape)}let $=C;C=Br({inputs:{x:C},backend:e,attrs:{begin:0,size:[g,s]}}),Ui(e,$);let R=Iy({inputs:{x:h,indices:C},backend:e,attrs:{axis:1,batchDims:1}});Ui(e,h);let A=c.slice(0,-1);A.push(s),$=C,C=q({inputs:{x:C},attrs:{shape:A},backend:e}),Ui(e,$);let F=R;return R=q({inputs:{x:R},attrs:{shape:A},backend:e}),Ui(e,F),[R,C]}var ZI={kernelName:ni,backendName:"webgl",kernelFunc:EW};var Vf=class{constructor(t,e,o,n,s,a){this.variableNames=["Image","Transforms"],this.outputShape=a;let i=o==="nearest"?1:2,l;switch(n){case"constant":l=1;break;case"reflect":l=2;break;case"wrap":l=3;break;case"nearest":l=4;break;default:l=1;break}this.userCode=`
            float mapCoord(float outCoord, float len) {
              float inCoord = outCoord;
              if(${l} == 2) {
                if (inCoord < 0.0) {
                  if (len <= 1.0) {
                    inCoord = 0.0;
                  } else {
                    float sz2 = 2.0 * len;
                    if (inCoord < sz2) {
                      inCoord = sz2 * float(int(float(-inCoord / sz2))) +
                      inCoord;
                    }
                    inCoord = inCoord < -len ? inCoord + sz2 : -inCoord - 1.0;
                  }
                } else if (inCoord > len - 1.0) {
                  if (len <= 1.0) {
                    inCoord = 0.0;
                  } else {
                    float sz2 = 2.0 * len;
                    inCoord -= sz2 * float(int(float(inCoord / sz2)));
                    if (inCoord >= len) {
                      inCoord = sz2 - inCoord - 1.0;
                    }
                  }
                }
                return clamp(inCoord, 0.0, len - 1.0);
              } else if (${l} == 3) {
                if (inCoord < 0.0) {
                  if (len <= 1.0) {
                    inCoord = 0.0;
                  } else {
                    float sz = len - 1.0;
                    inCoord += len * (float(int(float(-inCoord / sz))) + 1.0);
                  }
                } else if (inCoord > len - 1.0) {
                  if (len <= 1.0) {
                    inCoord = 0.0;
                  } else {
                    float sz = len - 1.0;
                    inCoord -= len * float(int(float(inCoord / sz)));
                  }
                }
                return clamp(inCoord, 0.0, len - 1.0);
              } else if (${l} == 4) {
                return clamp(outCoord, 0.0, len - 1.0);
              } else {
                return outCoord;
              }
            }

            float readWithFillValue(int batch, int coordY, int coordX,
              int channel) {
              float outputValue;
              if (0 <= coordY && coordY < ${t} && 0 <= coordX && coordX < ${e}) {
                  outputValue = getImage(batch, coordY, coordX, channel);
              } else {
                outputValue = float(${s});
              }
              return outputValue;
            }

            void main() {
              ivec4 coords = getOutputCoords();
              float outputValue;
              int batch = coords[0];
              int x = coords[2];
              int y = coords[1];
              int channel = coords[3];
              float xf = float(x);
              float yf = float(y);
              float a1 = getTransforms(batch, 0);
              float a2 = getTransforms(batch, 1);
              float a3 = getTransforms(batch, 2);
              float b1 = getTransforms(batch, 3);
              float b2 = getTransforms(batch, 4);
              float b3 = getTransforms(batch, 5);
              float c1 = getTransforms(batch, 6);
              float c2 = getTransforms(batch, 7);
              float projection = c1 * xf + c2 * yf + 1.0;
              if (projection == 0.0) {
                outputValue = float(${s});
              } else {
                float inX = (a1 * xf + a2 * yf + a3) / projection;
                float inY = (b1 * xf + b2 * yf + b3) / projection;
                float mapX = mapCoord(inX, float(${e}));
                float mapY = mapCoord(inY, float(${t}));

                if (${i} == 1) {
                  int coordY = int(round(mapY));
                  int coordX = int(round(mapX));
                  outputValue = readWithFillValue(batch, coordY, coordX,
                    channel);
                } else {
                  float yFloor = floor(mapY);
                  float xFloor = floor(mapX);
                  float yCeil = yFloor + 1.0;
                  float xCeil = xFloor + 1.0;
                  float valueYFloor = (xCeil - mapX) *
                  readWithFillValue(batch, int(yFloor), int(xFloor), channel) +
                  (mapX - xFloor) *
                  readWithFillValue(batch, int(yFloor), int(xCeil), channel);
                  float valueYCeil = (xCeil - mapX) *
                  readWithFillValue(batch, int(yCeil), int(xFloor), channel) +
                  (mapX - xFloor) *
                  readWithFillValue(batch, int(yCeil), int(xCeil), channel);
                  outputValue = (yCeil - mapY) * valueYFloor +
                  (mapY - yFloor) * valueYCeil;
                }
              }
              setOutput(outputValue);
            }
        `}};function $W(r){let{inputs:t,backend:e,attrs:o}=r,{image:n,transforms:s}=t,{interpolation:a,fillMode:i,fillValue:l,outputShape:c}=o,[u,p,m,f]=n.shape,[d,g]=c??[p,m],h=[u,d,g,f],x=new Vf(p,m,a,i,l,h);return e.runWebGLProgram(x,[n,s],"float32")}var JI={kernelName:si,backendName:"webgl",kernelFunc:$W};function RW(r){let{inputs:t,attrs:e,backend:o}=r,{axis:n}=e,{x:s}=t;io(s,"unique"),console.warn("WARNING: ","UI might be locked temporarily as data is being downloaded");let a=o.readSync(s.dataId),{outputValues:i,outputShape:l,indices:c}=pC(a,n,s.shape,s.dtype);return[o.makeTensorInfo(l,s.dtype,i),o.makeTensorInfo([c.length],"int32",c)]}var tk={kernelName:ai,backendName:"webgl",kernelFunc:RW};function AW(r){let{inputs:t,backend:e,attrs:o}=r,{value:n}=t,{axis:s}=o;s<0&&(s+=n.shape.length);let a=n,i=a.shape.length,l=n.shape[s],c=new Array(i-1),u=0;for(let g=0;g<i;g++)g!==s&&(c[u++]=a.shape[g]);let p=[],m=new Array(i).fill(0),f=a.shape.slice();f[s]=1;let d=new Array(l);for(let g=0;g<d.length;g++){m[s]=g;let h=Br({inputs:{x:a},backend:e,attrs:{begin:m,size:f}}),x=q({inputs:{x:h},backend:e,attrs:{shape:c}});d[g]=x,p.push(h)}return p.forEach(g=>e.disposeIntermediateTensorInfo(g)),d}var ek={kernelName:ii,backendName:"webgl",kernelFunc:AW};var zf=class{constructor(t,e){this.variableNames=["x","segmentIds"];let o=t.windowSize,n=t.batchSize,s=t.inSize,a=t.numSegments,i=a*Math.ceil(s/o);this.outputShape=[n,i];let l="0.0",c="sumValue",u=Math.floor(o/4)*4,p=o%4,m=`
        sumValue += dot(values, segFilter);
    `,f="";s%o>0&&(f=`
        if (inIdx < 0 || inIdx >= ${s}) {
          return initializationValue;
        }
      `);let d="";s%o>0&&(d=`
        if (inIdx < 0 || inIdx >= ${s}) {
          return -1.0;
        }
      `),this.userCode=`
      const float initializationValue = ${l};

      float getValue(int batch, int inIdx) {
        ${f}
        return getX(batch, inIdx);
      }

      float getSegmentIdAtIndex(int inIdx) {
        ${d}
        return getSegmentIds(inIdx);
      }

      void main() {
        ivec2 coords = getOutputCoords();
        int batch = coords[0];
        int outIdx = coords[1];
        int inOffset = int(floor(float(outIdx) / float(
          ${a})) * float(${o}));
        int currentSeg = int(mod(float(outIdx), float(${a})));

        float sumValue = 0.0;

        for (int i = 0; i < ${u}; i += 4) {
          int inIdx = inOffset + i;
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            getValue(batch, inIdx + 3)
          );

          vec4 segFilter = vec4(
            int(getSegmentIdAtIndex(inIdx)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 1)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 2)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 3)) == currentSeg ? 1 : 0
          );

          ${m}
        }

        int inIdx = inOffset + ${u};
        if (${p===1}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            initializationValue,
            initializationValue,
            initializationValue
          );

          int inIdxSeg = int(getSegmentIdAtIndex(inIdx));

          vec4 segFilter = vec4(
            int(getSegmentIdAtIndex(inIdx)) == currentSeg ? 1 : 0,
            0,
            0,
            0
          );

          ${m}
        } else if (${p===2}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            initializationValue,
            initializationValue
          );

          vec4 segFilter = vec4(
            int(getSegmentIdAtIndex(inIdx)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 1)) == currentSeg ? 1 : 0,
              0,
              0
          );

          ${m}
        } else if (${p===3}) {
          vec4 values = vec4(
            getValue(batch, inIdx),
            getValue(batch, inIdx + 1),
            getValue(batch, inIdx + 2),
            initializationValue
          );

          vec4 segFilter = vec4(
            int(getSegmentIdAtIndex(inIdx)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 1)) == currentSeg ? 1 : 0,
            int(getSegmentIdAtIndex(inIdx + 2)) == currentSeg ? 1 : 0,
            0
          );

          ${m}
        }
        setOutput(${c});
      }
    `}};function FW(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,segmentIds:s}=t,{numSegments:a}=o,i=n.shape.length,l=[],c=0,u=N.getAxesPermutation([c],i),p=n;u!=null&&(p=Wt({inputs:{x:n},backend:e,attrs:{perm:u}}),l.push(p),c=N.getInnerMostAxes(1,i)[0]);let m=N.segment_util.computeOutShape(p.shape,c,a),f=y.sizeFromShape([p.shape[c]]),d=q({inputs:{x:p},backend:e,attrs:{shape:[-1,f]}});l.push(d);let g=Kn(n.dtype),h=(S,I,$,R,A)=>{let F=S.shape[0],_=S.shape[1],O=N.segment_util.segOpComputeOptimalWindowSize(_,A),M={windowSize:O,inSize:_,batchSize:F,numSegments:A},P=new zf(M,I),B=e.compileAndRun(P,[S,$],R);if(l.push(B),B.shape[1]===A)return B;let V=Fy({backend:e,attrs:{start:0,stop:A,step:1,dtype:"float32"}}),z=_y({inputs:{x:V},backend:e,attrs:{reps:[_/O]}});return l.push(V),l.push(z),h(B,I,z,R,A)},x=h(d,"unsortedSegmentSum",s,g,a),b=q({inputs:{x},backend:e,attrs:{shape:m}}),C=b;if(u!=null){l.push(b);let S=N.getUndoAxesPermutation(u);C=Wt({inputs:{x:C},backend:e,attrs:{perm:S}})}return l.forEach(S=>e.disposeIntermediateTensorInfo(S)),C}var rk={kernelName:li,backendName:"webgl",kernelFunc:FW};var _W=[LC,VC,zC,WC,UC,HC,KC,qC,YC,QC,ZC,JC,tT,eT,rT,oT,nT,sT,aT,iT,lT,uT,pT,mT,fT,xT,bT,wT,EC,ST,TT,NT,IT,kT,ET,$T,RT,AT,FT,_T,PT,MT,LT,BT,VT,zT,WT,GT,UT,HT,KT,qT,jT,XT,YT,QT,JT,tN,eN,rN,nN,sN,aN,iN,lN,cN,uN,pN,mN,kC,fN,CT,dN,hN,gN,$C,xN,yN,bN,wN,vN,SN,CN,TN,NN,IN,EN,$N,RN,AN,FN,_N,ON,MN,LN,BN,VN,zN,KN,FC,qN,jN,XN,YN,dT,QN,tI,eI,rI,oI,RC,nI,sI,aI,iI,lI,hT,WN,cI,uI,pI,DC,mI,fI,dI,hI,gI,xI,yI,bI,wI,vI,SI,CI,TI,NI,II,kI,cT,HN,EI,$I,RI,AI,FI,_I,DI,OI,MI,LI,VI,zI,WI,GI,UI,HI,KI,UN,PC,qI,jI,XI,YI,ZI,JI,MC,tk,ek,rk,ZN];for(let r of _W)cl(r);var DW=be.whereImpl,$u=class r extends Wr{nextDataId(){return r.nextDataId++}constructor(){super(),this.blockSize=48,this.firstUse=!0,this.data=new Ho(this,Re())}write(t,e,o){this.firstUse&&(this.firstUse=!1,D().get("IS_NODE")&&N.warn(`
============================
Hi, looks like you are running TensorFlow.js in Node.js. To speed things up dramatically, install our node backend, visit https://github.com/tensorflow/tfjs-node for more details. 
============================`));let n={id:this.nextDataId()};return this.data.set(n,{values:t,dtype:o,refCount:1}),n}makeTensorInfo(t,e,o){let n;if(e==="string"&&o!=null&&o.length>0&&y.isString(o[0])){let s=o.map(a=>y.encodeString(a));n=this.write(s,t,e)}else n=this.write(o,t,e);return{dataId:n,shape:t,dtype:e}}refCount(t){return this.data.has(t)?this.data.get(t).refCount:0}incRef(t){let e=this.data.get(t);e.refCount++}decRef(t){if(this.data.has(t)){let e=this.data.get(t);e.refCount--}}move(t,e,o,n,s){this.data.set(t,{values:e,dtype:n,refCount:s})}numDataIds(){return this.data.numDataIds()}async read(t){return this.readSync(t)}readSync(t){let{dtype:e,complexTensorInfos:o}=this.data.get(t);if(e==="complex64"){let n=this.readSync(o.real.dataId),s=this.readSync(o.imag.dataId);return N.mergeRealAndImagArrays(n,s)}return y.convertBackendValuesAndArrayBuffer(this.data.get(t).values,e)}bufferSync(t){let e=this.readSync(t.dataId);if(t.dtype==="string")try{let o=e.map(n=>y.decodeString(n));return ot(t.shape,t.dtype,o)}catch{throw new Error("Failed to decode encoded string bytes into utf-8")}return ot(t.shape,t.dtype,e)}makeOutput(t,e,o){return Re().makeTensorFromTensorInfo(this.makeTensorInfo(e,o,t),this)}disposeData(t,e=!1){if(this.data.has(t)){if(this.data.get(t).refCount--,!e&&this.data.get(t).refCount>0)return!1;let{complexTensorInfos:o}=this.data.get(t);o!=null&&(this.disposeData(o.real.dataId,!0),this.disposeData(o.imag.dataId,!0)),this.data.delete(t)}return!0}disposeIntermediateTensorInfo(t){this.disposeData(t.dataId)}async time(t){let e=y.now();return t(),{kernelMs:y.now()-e}}memory(){return{unreliable:!0,reasons:["The reported memory is an upper bound. Due to automatic garbage collection, the true allocated memory may be less."]}}where(t){U([t],"where");let e=this.readSync(t.dataId);return DW(t.shape,e)}dispose(){}floatPrecision(){return 32}epsilon(){return super.epsilon()}};$u.nextDataId=0;Nc("cpu",()=>new $u,1);var Dy=ut("Elu",r=>r>=0?r:Math.exp(r)-1),ok={kernelName:"Elu",backendName:"cpu",kernelFunc:Dy};function Oy(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{alpha:s}=o;U([n],"leakyRelu");let a=y.sizeFromShape(n.shape),i=e.data.get(n.dataId).values,l=y.getTypedArrayFromDType("float32",a);for(let c=0;c<i.length;c++)l[c]=i[c]<0?s*i[c]:i[c];return e.makeTensorInfo(n.shape,"float32",l)}var nk={kernelName:ca,backendName:"cpu",kernelFunc:Oy};var OW=wt((r,t)=>r<0?t*r:r);function Py(r){let{inputs:t,backend:e}=r,{x:o,alpha:n}=t;U([o,n],"prelu");let s=e.data.get(o.dataId).values,a=e.data.get(n.dataId).values,[i,l]=OW(o.shape,n.shape,s,a,"float32");return e.makeTensorInfo(l,"float32",i)}var sk={kernelName:ka,backendName:"cpu",kernelFunc:Py};var My=ut(kn,r=>Math.max(0,r)),ak={kernelName:kn,backendName:"cpu",kernelFunc:My};var Ly=ut(En,r=>Math.min(Math.max(0,r),6)),ik={kernelName:En,backendName:"cpu",kernelFunc:Ly};function Hi(r,t,e,o,n){if(e==="linear")return Ee({inputs:{x:t},backend:r});if(e==="relu")return My({inputs:{x:t},backend:r});if(e==="elu")return Dy({inputs:{x:t},backend:r});if(e==="relu6")return Ly({inputs:{x:t},backend:r});if(e==="prelu")return Py({inputs:{x:t,alpha:o},backend:r});if(e==="leakyrelu")return Oy({inputs:{x:t},backend:r,attrs:{alpha:n}});if(e==="sigmoid")return sy({inputs:{x:t},backend:r});throw new Error(`Activation ${e} has not been implemented for the CPU backend.`)}function vt(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{shape:s}=o,a=y.sizeFromShape(n.shape),i=y.inferFromImplicitShape(s,a),l=y.sizeFromShape(i);y.assert(a===l,()=>`The new shape (${i}) has ${l} elements and the old shape (${n.shape}) has ${a} elements. The new shape and old shape must have the same number of elements.`),e.incRef(n.dataId);let c=e.data.get(n.dataId);if(c.complexTensorInfos!=null){let u=c.complexTensorInfos.real,p=c.complexTensorInfos.imag;u.shape=i,p.shape=i}return{dataId:n.dataId,shape:i,dtype:n.dtype}}var lk={kernelName:Da,backendName:"cpu",kernelFunc:vt};function By(r){let{inputs:t,backend:e,attrs:o}=r,{a:n,b:s}=t,{transposeA:a,transposeB:i}=o;U([n,s],"matMul");let l=n.shape.length,c=s.shape.length,u=a?n.shape[l-2]:n.shape[l-1],p=i?s.shape[c-1]:s.shape[c-2],m=a?n.shape[l-1]:n.shape[l-2],f=i?s.shape[c-2]:s.shape[c-1],d=n.shape.slice(0,-2),g=s.shape.slice(0,-2),h=y.sizeFromShape(d),x=y.sizeFromShape(g),C=_r.assertAndGetBroadcastShape(n.shape.slice(0,-2),s.shape.slice(0,-2)).concat([m,f]);y.assert(u===p,()=>`Error in matMul: inner shapes (${u}) and (${p}) of Tensors with shapes ${n.shape} and ${s.shape} and transposeA=${a} and transposeB=${i} must match.`);let S=a?[h,u,m]:[h,m,u],I=i?[x,f,p]:[x,p,f],$=vt({inputs:{x:n},backend:e,attrs:{shape:S}}),R=vt({inputs:{x:s},backend:e,attrs:{shape:I}}),A=a?$.shape[1]:$.shape[2],F=a?$.shape[2]:$.shape[1],_=i?R.shape[1]:R.shape[2],O=Math.max(h,x),M=e.data.get($.dataId).values,P=e.data.get(R.dataId).values,B=y.computeStrides($.shape),V=y.computeStrides(R.shape),[z,G,W]=a?[B[0],1,B[1]]:[B[0],B[1],1],[H,X,j]=i?[1,V[1],V[0]]:[V[1],1,V[0]],J=F*_,Y=ot([O,F,_],$.dtype),et=Y.values,Q=e.blockSize;for(let nt=0;nt<O;nt++){let pt=nt%h,gt=nt%x;for(let dt=0;dt<F;dt+=Q){let St=Math.min(dt+Q,F);for(let Ct=0;Ct<_;Ct+=Q){let Bt=Math.min(Ct+Q,_);for(let Ut=0;Ut<A;Ut+=Q){let ae=Math.min(Ut+Q,A);for(let Ht=dt;Ht<St;Ht++)for(let Vt=Ct;Vt<Bt;Vt++){let oe=0;for(let te=Ut;te<ae;te++){let mo=M[pt*z+Ht*G+te*W],Se=P[te*H+Vt*X+gt*j];oe+=mo*Se}et[nt*J+(Ht*_+Vt)]+=oe}}}}}return e.disposeIntermediateTensorInfo($),e.disposeIntermediateTensorInfo(R),e.makeTensorInfo(C,Y.dtype,Y.values)}var ck={kernelName:Es,backendName:"cpu",kernelFunc:By};function PW(r){let{inputs:t,backend:e,attrs:o}=r,{a:n,b:s,bias:a,preluActivationWeights:i}=t,{transposeA:l,transposeB:c,activation:u,leakyreluAlpha:p}=o,m,f,d,g=[];m=By({inputs:{a:n,b:s},attrs:{transposeA:l,transposeB:c},backend:e}),a&&(f=lo({inputs:{a:m,b:a},backend:e}),g.push(m),m=f),u&&(d=Hi(e,m,u,i,p),g.push(m),m=d);for(let x of g)e.disposeIntermediateTensorInfo(x);return m}var uk={kernelName:zn,backendName:"cpu",kernelFunc:PW};var MW=ut(jo,r=>Math.acos(r)),pk={kernelName:jo,backendName:"cpu",kernelFunc:MW};var LW=ut(Xo,r=>Math.acosh(r)),mk={kernelName:Xo,backendName:"cpu",kernelFunc:LW};function BW(r){let{inputs:t,backend:e}=r,o=t;U(t,"addN");let n=o.map(i=>e.data.get(i.dataId).values),s=ot(o[0].shape,o[0].dtype),a=s.values;for(let i=0;i<o.length;i++){let l=n[i];for(let c=0;c<a.length;c++)a[c]+=l[c]}return e.makeTensorInfo(s.shape,s.dtype,s.values)}var fk={kernelName:Cs,backendName:"cpu",kernelFunc:BW};function VW(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o;U(n,"all");let i=y.parseAxisParam(s,n.shape),l=i,c=N.getAxesPermutation(l,n.shape.length),u=n;c!=null&&(u=Xt({inputs:{x:n},backend:e,attrs:{perm:c}}),l=N.getInnerMostAxes(l.length,n.shape.length)),N.assertAxesAreInnerMostDims("all",l,u.shape.length);let[p,m]=N.computeOutAndReduceShapes(u.shape,l),f=y.sizeFromShape(m),d=y.makeZerosTypedArray(y.sizeFromShape(p),u.dtype),g=e.data.get(u.dataId).values;for(let x=0;x<d.length;++x){let b=x*f,C=g[b];for(let S=0;S<f;++S){let I=g[b+S];C=C&&I}d[x]=C}c!=null&&e.disposeIntermediateTensorInfo(u);let h=e.makeTensorInfo(p,u.dtype,d);if(a){let x=N.expandShapeToKeepDim(p,i),b=vt({inputs:{x:h},backend:e,attrs:{shape:x}});return e.disposeIntermediateTensorInfo(h),b}return h}var dk={kernelName:"All",backendName:"cpu",kernelFunc:VW};function zW(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o;U(n,"any");let i=y.parseAxisParam(s,n.shape),l=i,c=N.getAxesPermutation(l,n.shape.length),u=n;c!=null&&(u=Xt({inputs:{x:n},backend:e,attrs:{perm:c}}),l=N.getInnerMostAxes(l.length,n.shape.length)),N.assertAxesAreInnerMostDims("any",l,u.shape.length);let[p,m]=N.computeOutAndReduceShapes(u.shape,l),f=y.sizeFromShape(m),d=y.makeZerosTypedArray(y.sizeFromShape(p),u.dtype),g=e.data.get(u.dataId).values;for(let x=0;x<d.length;++x){let b=x*f,C=g[b];for(let S=0;S<f;++S){let I=g[b+S];C=C||I}d[x]=C}c!=null&&e.disposeIntermediateTensorInfo(u);let h=e.makeTensorInfo(p,u.dtype,d);if(a){let x=N.expandShapeToKeepDim(p,i),b=vt({inputs:{x:h},backend:e,attrs:{shape:x}});return e.disposeIntermediateTensorInfo(h),b}return h}var hk={kernelName:"Any",backendName:"cpu",kernelFunc:zW};function WW(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s}=o;U(n,"argMax");let a=y.parseAxisParam(s,n.shape),i=N.getAxesPermutation(a,n.shape.length),l=n,c=[];i!=null&&(l=Xt({inputs:{x:n},backend:e,attrs:{perm:i}}),c.push(l),a=N.getInnerMostAxes(a.length,l.shape.length)),a=[a[0]],N.assertAxesAreInnerMostDims("argMax",a,l.shape.length);let[u,p]=N.computeOutAndReduceShapes(l.shape,a),m=y.sizeFromShape(u),f=y.makeZerosTypedArray(m,"int32"),d=y.sizeFromShape(p),g=e.data.get(l.dataId).values;for(let h=0;h<f.length;++h){let x=h*d,b=g[x],C=0;for(let S=0;S<d;++S){let I=g[x+S];I>b&&(b=I,C=S)}f[h]=C}return c.forEach(h=>e.disposeIntermediateTensorInfo(h)),e.makeTensorInfo(u,"int32",f)}var gk={kernelName:Ts,backendName:"cpu",kernelFunc:WW};function GW(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s}=o;U(n,"argMin");let a=y.parseAxisParam(s,n.shape),i=N.getAxesPermutation(a,n.shape.length),l=n,c=[];i!=null&&(l=Xt({inputs:{x:n},backend:e,attrs:{perm:i}}),c.push(l),a=N.getInnerMostAxes(a.length,l.shape.length)),a=[a[0]],N.assertAxesAreInnerMostDims("argMin",a,l.shape.length);let[u,p]=N.computeOutAndReduceShapes(l.shape,a),m=y.sizeFromShape(u),f=y.makeZerosTypedArray(m,"int32"),d=y.sizeFromShape(p),g=e.data.get(l.dataId).values;for(let h=0;h<f.length;++h){let x=h*d,b=g[x],C=0;for(let S=0;S<d;++S){let I=g[x+S];I<b&&(b=I,C=S)}f[h]=C}return c.forEach(h=>e.disposeIntermediateTensorInfo(h)),e.makeTensorInfo(u,"int32",f)}var xk={kernelName:Ns,backendName:"cpu",kernelFunc:GW};var UW=ut(Yo,r=>Math.asin(r)),yk={kernelName:Yo,backendName:"cpu",kernelFunc:UW};var HW=ut(Qo,r=>Math.asinh(r)),bk={kernelName:Qo,backendName:"cpu",kernelFunc:HW};var KW=ut(Zo,r=>Math.atan(r)),wk={kernelName:Zo,backendName:"cpu",kernelFunc:KW};var qW=wt((r,t)=>Math.atan2(r,t)),jW=It(tn,qW),vk={kernelName:tn,backendName:"cpu",kernelFunc:jW};var XW=ut(Jo,r=>Math.atanh(r)),Sk={kernelName:Jo,backendName:"cpu",kernelFunc:XW};function Ql(r,t,e,o,n,s){let a=n.strideHeight,i=n.strideWidth,l=n.dilationHeight,c=n.dilationWidth,u=n.effectiveFilterHeight,p=n.effectiveFilterWidth,m=n.padInfo.top,f=n.padInfo.left,d=s==="max"?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY,g=ot(n.outShape,e),h=g.values,x=n.outShape[1]*n.outShape[2]*n.outShape[3],b=n.outShape[2]*n.outShape[3],C=n.outShape[3];for(let S=0;S<n.batchSize;++S){let I=S*x,$=S*o[0];for(let R=0;R<n.inChannels;++R)for(let A=0;A<n.outHeight;++A){let F=A*a-m,_=Math.max(0,F),O=Math.min(n.inHeight,u+F),M=I+A*b;for(let P=0;P<n.outWidth;++P){let B=P*i-f,V=Math.max(0,B),z=Math.min(n.inWidth,p+B),G=d,W=0,H=0;for(let j=_;j<O;j+=l){let J=$+j*o[1];for(let Y=V;Y<z;Y+=c){let et=J+Y*o[2],Q=r[et+R];s==="max"&&Q>G?G=Q:s==="avg"&&(W+=Q,H++)}if(isNaN(G))break}let X=M+P*C+R;h[X]=s==="avg"?W/H:G}}}return g}function Wf(r,t,e,o,n=!1,s=!1){let a=ot(o.outShape,"int32"),i=o.strideHeight,l=o.strideWidth,c=o.dilationHeight,u=o.dilationWidth,p=o.effectiveFilterHeight,m=o.effectiveFilterWidth,f=o.padInfo.top,d=o.padInfo.left,g=ot(t,e,r);for(let h=0;h<o.batchSize;++h)for(let x=0;x<o.inChannels;++x)for(let b=0;b<o.outHeight;++b){let C=b*i-f,S=C;for(;S<0;)S+=c;let I=Math.min(o.inHeight,p+C);for(let $=0;$<o.outWidth;++$){let R=$*l-d,A=R;for(;A<0;)A+=u;let F=Math.min(o.inWidth,m+R),_=Number.NEGATIVE_INFINITY,O=-1;for(let M=S;M<I;M+=c){let P=M-C;for(let B=A;B<F;B+=u){let V=B-R,z=g.get(h,M,B,x);z>_&&(_=z,n?O=s?((h*o.inHeight+M)*o.inWidth+B)*o.inChannels+x:(M*o.inWidth+B)*o.inChannels+x:O=P*m+V)}}a.set(O,h,b,$,x)}}return a}function Gf(r,t,e,o,n,s){let a=n.strideDepth,i=n.strideHeight,l=n.strideWidth,c=n.dilationDepth,u=n.dilationHeight,p=n.dilationWidth,m=n.effectiveFilterDepth,f=n.effectiveFilterHeight,d=n.effectiveFilterWidth,g=n.padInfo.front,h=n.padInfo.top,x=n.padInfo.left,b=s==="max"?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY,C=ot(n.outShape,e),S=C.values,I=n.outShape[1]*n.outShape[2]*n.outShape[3]*n.outShape[4],$=n.outShape[2]*n.outShape[3]*n.outShape[4],R=n.outShape[3]*n.outShape[4],A=n.outShape[4];for(let F=0;F<n.batchSize;++F){let _=F*I,O=F*o[0];for(let M=0;M<n.inChannels;++M)for(let P=0;P<n.outDepth;++P){let B=P*a-g,V=B;for(;V<0;)V+=c;let z=Math.min(n.inDepth,m+B),G=_+P*$;for(let W=0;W<n.outHeight;++W){let H=W*i-h,X=H;for(;X<0;)X+=u;let j=Math.min(n.inHeight,f+H),J=G+W*R;for(let Y=0;Y<n.outWidth;++Y){let et=Y*l-x,Q=et;for(;Q<0;)Q+=p;let nt=Math.min(n.inWidth,d+et),pt=J+Y*A,gt=b,dt=0,St=0;for(let Bt=V;Bt<z;Bt+=c){let Ut=O+Bt*o[1];for(let ae=X;ae<j;ae+=u){let Ht=Ut+ae*o[2];for(let Vt=Q;Vt<nt;Vt+=p){let oe=Ht+Vt*o[3],te=r[oe+M];if(s==="max"&&te>gt?gt=te:s==="avg"&&(dt+=te,St++),isNaN(gt))break}if(isNaN(gt))break}if(isNaN(gt))break}let Ct=pt+M;S[Ct]=s==="avg"?dt/Math.max(St,1):gt}}}}return C}function Ck(r,t){let e=ot(t.outShape,"int32"),o=t.strideDepth,n=t.strideHeight,s=t.strideWidth,a=t.dilationDepth,i=t.dilationHeight,l=t.dilationWidth,c=t.effectiveFilterDepth,u=t.effectiveFilterHeight,p=t.effectiveFilterWidth,m=t.padInfo.front,f=t.padInfo.top,d=t.padInfo.left;for(let g=0;g<t.batchSize;++g)for(let h=0;h<t.inChannels;++h)for(let x=0;x<t.outDepth;++x){let b=x*o-m,C=b;for(;C<0;)C+=a;let S=Math.min(t.inDepth,c+b);for(let I=0;I<t.outHeight;++I){let $=I*n-f,R=$;for(;R<0;)R+=i;let A=Math.min(t.inHeight,u+$);for(let F=0;F<t.outWidth;++F){let _=F*s-d,O=_;for(;O<0;)O+=l;let M=Math.min(t.inWidth,p+_),P=Number.NEGATIVE_INFINITY,B=-1;for(let V=C;V<S;V+=a){let z=V-b;for(let G=R;G<A;G+=i){let W=G-$;for(let H=O;H<M;H+=l){let X=H-_,j=r.get(g,V,G,H,h);j>=P&&(P=j,B=z*u*p+W*u+X)}}}e.set(B,g,x,I,F,h)}}}return e}function YW(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t;U(n,"avgPool");let{filterSize:s,strides:a,pad:i,dimRoundingMode:l}=o,c=1;y.assert(N.eitherStridesOrDilationsAreOne(a,c),()=>`Error in avgPool: Either strides or dilations must be 1. Got strides ${a} and dilations '${c}'`);let u=N.computePool2DInfo(n.shape,s,a,c,i,l),p;if(u.filterWidth===1&&u.filterHeight===1&&y.arraysEqual(u.inShape,u.outShape))p=Ee({inputs:{x:n},backend:e});else{let m=e.data.get(n.dataId).values,f=y.computeStrides(n.shape),d=Ql(m,n.shape,n.dtype,f,u,"avg");p=e.makeTensorInfo(u.outShape,n.dtype,d.values)}return p}var Tk={kernelName:Is,backendName:"cpu",kernelFunc:YW};function QW(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{filterSize:s,strides:a,pad:i,dimRoundingMode:l,dataFormat:c}=o;U(n,"avgPool3d");let u=N.computePool3DInfo(n.shape,s,a,1,i,l,c),p=e.data.get(n.dataId).values,m=Gf(p,n.shape,n.dtype,y.computeStrides(n.shape),u,"avg");return e.makeTensorInfo(m.shape,"float32",m.values)}var Nk={kernelName:ks,backendName:"cpu",kernelFunc:QW};function ZW(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s}=t,{filterSize:a,strides:i,pad:l,dimRoundingMode:c}=o;U([n,s],"avgPool3DGrad");let u=N.computePool3DInfo(s.shape,a,i,1,l,c),p=u.strideDepth,m=u.strideHeight,f=u.strideWidth,d=u.filterDepth,g=u.filterHeight,h=u.filterWidth,x=u.dilationDepth,b=u.dilationHeight,C=u.dilationWidth,S=u.effectiveFilterDepth,I=u.effectiveFilterHeight,$=u.effectiveFilterWidth,R=S-1-u.padInfo.front,A=$-1-u.padInfo.left,F=I-1-u.padInfo.top,_=ot(s.shape,"float32"),O=1/(d*g*h),M=e.bufferSync(n);for(let P=0;P<u.batchSize;++P)for(let B=0;B<u.inChannels;++B)for(let V=0;V<u.inDepth;++V)for(let z=0;z<u.inHeight;++z)for(let G=0;G<u.inWidth;++G){let W=V-R,H=z-F,X=G-A,j=0;for(let J=0;J<S;J+=x){let Y=(W+J)/p;if(!(Y<0||Y>=u.outDepth||Math.floor(Y)!==Y))for(let et=0;et<I;et+=b){let Q=(H+et)/m;if(!(Q<0||Q>=u.outHeight||Math.floor(Q)!==Q))for(let nt=0;nt<$;nt+=C){let pt=(X+nt)/f;if(pt<0||pt>=u.outWidth||Math.floor(pt)!==pt)continue;let gt=M.get(P,Y,Q,pt,B);j+=gt}}}_.set(j*O,P,V,z,G,B)}return e.makeTensorInfo(_.shape,_.dtype,_.values)}var Ik={kernelName:lc,backendName:"cpu",kernelFunc:ZW};function JW(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s}=t,a=s;U([n,s],"avgPoolGrad");let{filterSize:i,strides:l,pad:c}=o,u=N.computePool2DInfo(a.shape,i,l,1,c),p=u.strideHeight,m=u.strideWidth,f=u.filterHeight,d=u.filterWidth,g=u.dilationHeight,h=u.dilationWidth,x=u.effectiveFilterHeight,b=u.effectiveFilterWidth,C=b-1-u.padInfo.left,S=x-1-u.padInfo.top,I=ot(a.shape,"float32"),$=1/(f*d),R=e.data.get(n.dataId).values,A=ot(n.shape,"float32",R);for(let F=0;F<u.batchSize;++F)for(let _=0;_<u.inChannels;++_)for(let O=0;O<u.inHeight;++O)for(let M=0;M<u.inWidth;++M){let P=O-S,B=M-C,V=0;for(let z=0;z<x;z+=g){let G=(P+z)/p;if(!(G<0||G>=u.outHeight||Math.floor(G)!==G))for(let W=0;W<b;W+=h){let H=(B+W)/m;if(H<0||H>=u.outWidth||Math.floor(H)!==H)continue;let X=A.get(F,G,H,_);V+=X}}I.set(V*$,F,O,M,_)}return e.makeTensorInfo(I.shape,I.dtype,I.values)}var kk={kernelName:ic,backendName:"cpu",kernelFunc:JW};function tG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,scale:s,offset:a,mean:i,variance:l}=t;y.assert(i.shape.length===l.shape.length,()=>"Batch normalization gradient requires mean and variance to have equal ranks."),y.assert(a==null||i.shape.length===a.shape.length,()=>"Batch normalization gradient requires mean and offset to have equal ranks."),y.assert(s==null||i.shape.length===s.shape.length,()=>"Batch normalization gradient requires mean and scale to have equal ranks."),U([n,i,l,s,a],"batchNorm");let{varianceEpsilon:c}=o;c==null&&(c=.001);let u=e.data.get(n.dataId).values,p=e.data.get(i.dataId).values,m=e.data.get(l.dataId).values,f=s?e.data.get(s.dataId).values:new Float32Array([1]),d=a?e.data.get(a.dataId).values:new Float32Array([0]),g=new Float32Array(u.length),h=d.length,x=f.length,b=m.length,C=p.length,S=0,I=0,$=0,R=0;for(let A=0;A<u.length;++A)g[A]=d[S++]+(u[A]-p[I++])*f[$++]/Math.sqrt(m[R++]+c),S>=h&&(S=0),I>=C&&(I=0),$>=x&&($=0),R>=b&&(R=0);return e.makeTensorInfo(n.shape,n.dtype,g)}var Ek={kernelName:na,backendName:"cpu",kernelFunc:tG};function eG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{blockShape:s,crops:a}=o;U([n],"batchToSpaceND");let i=s.reduce((x,b)=>x*b),l=N.getReshaped(n.shape,s,i),c=N.getPermuted(l.length,s.length),u=N.getReshapedPermuted(n.shape,s,i),p=N.getSliceBeginCoords(a,s.length),m=N.getSliceSize(u,a,s.length),f=vt({inputs:{x:n},backend:e,attrs:{shape:l}}),d=Xt({inputs:{x:f},backend:e,attrs:{perm:c}}),g=vt({inputs:{x:d},backend:e,attrs:{shape:u}}),h=Tr({inputs:{x:g},backend:e,attrs:{begin:p,size:m}});return e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(d),e.disposeIntermediateTensorInfo(g),h}var $k={kernelName:$s,backendName:"cpu",kernelFunc:eG};function rG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,weights:s}=t,{size:a}=o,i=e.data.get(n.dataId).values,l=e.data.get(s.dataId).values,c=Bl(i,l,s.dtype,s.shape,a);return e.makeTensorInfo([a],s.dtype,c)}var Rk={kernelName:Rs,backendName:"cpu",kernelFunc:rG};function oG(r){let{inputs:t,backend:e}=r,{s0:o,s1:n}=t,s=e.data.get(o.dataId).values,a=e.data.get(n.dataId).values,i=N.assertAndGetBroadcastShape(Array.from(s),Array.from(a));return e.makeTensorInfo([i.length],"int32",Int32Array.from(i))}var Ak={kernelName:As,backendName:"cpu",kernelFunc:oG};var nG=ut(on,(r,t)=>{let e=t;return r>e.clipValueMax?e.clipValueMax:r<e.clipValueMin?e.clipValueMin:r}),Fk={kernelName:on,backendName:"cpu",kernelFunc:nG};var sG=r=>{let{x:t}=r.inputs,e=r.backend,o=new Float32Array(y.sizeFromShape(t.shape)),n=e.data.get(t.dataId),s=n.complexTensorInfos.real,a=n.complexTensorInfos.imag,i=e.data.get(s.dataId).values,l=e.data.get(a.dataId).values;for(let c=0;c<i.length;c++){let u=i[c],p=l[c];o[c]=Math.hypot(u,p)}return e.makeOutput(o,t.shape,"float32")},_k={kernelName:_s,backendName:"cpu",kernelFunc:sG};function uo(r){let{inputs:t,backend:e}=r,{input:o}=t,n=e.data.get(o.dataId).complexTensorInfos.imag,s=e.data.get(n.dataId).values;return e.makeTensorInfo(n.shape,n.dtype,s)}var Dk={kernelName:la,backendName:"cpu",kernelFunc:uo};function fs(r){let{inputs:t,backend:e,attrs:o}=r,{axis:n}=o,s=y.parseAxisParam(n,t[0].shape)[0],a=t.map(g=>g.shape);N.assertParamsConsistent(a,s);let i=N.computeOutShape(t.map(g=>g.shape),s);if(y.sizeFromShape(i)===0)return e.makeTensorInfo(i,t[0].dtype,[]);let l=t.filter(g=>y.sizeFromShape(g.shape)>0);if(l.length===1)return Ee({inputs:{x:l[0]},backend:e});if(l[0].dtype==="complex64"){let g=l.map(S=>vr({inputs:{input:S},backend:e})),h=l.map(S=>uo({inputs:{input:S},backend:e})),x=fs({inputs:g,backend:e,attrs:{axis:s}}),b=fs({inputs:h,backend:e,attrs:{axis:s}}),C=fe({inputs:{real:x,imag:b},backend:e});return g.forEach(S=>e.disposeIntermediateTensorInfo(S)),h.forEach(S=>e.disposeIntermediateTensorInfo(S)),e.disposeIntermediateTensorInfo(x),e.disposeIntermediateTensorInfo(b),C}let c=l.map(g=>{let x=[-1,y.sizeFromShape(g.shape.slice(s))];return vt({inputs:{x:g},backend:e,attrs:{shape:x}})}),u=c.map(g=>({vals:e.data.get(g.dataId).values,shape:g.shape}));i=N.computeOutShape(c.map(g=>g.shape),1);let p=c[0].shape[0]===1,m=Xp(u,i,t[0].dtype,p),f=N.computeOutShape(l.map(g=>g.shape),s),d=e.makeTensorInfo(f,t[0].dtype,m);return c.forEach(g=>e.disposeIntermediateTensorInfo(g)),d}var Ok={kernelName:Ds,backendName:"cpu",kernelFunc:fs};function Vy(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dataFormat:l,dilations:c,dimRoundingMode:u}=o;U([n,s],"conv2d");let p=N.convertConv2DDataFormat(l),m=N.computeConv2DInfo(n.shape,s.shape,a,c,i,u,!1,p),f=m.filterHeight,d=m.filterWidth,g=m.dilationHeight,h=m.dilationWidth,x=m.padInfo.left,b=m.padInfo.top,C=m.dataFormat==="channelsLast",S=new $t(m.outShape,n.dtype),I=y.computeStrides(n.shape),$=y.computeStrides(s.shape),R=I[0],A=C?I[1]:I[2],F=C?I[2]:1,_=C?1:I[1],O=S.strides[0],M=C?S.strides[1]:S.strides[2],P=C?S.strides[2]:1,B=C?1:S.strides[1],V=e.data.get(n.dataId).values,z=e.data.get(s.dataId).values,G=S.values;for(let W=0;W<m.batchSize;++W){let H=W*R,X=W*O;for(let j=0;j<m.outHeight;++j){let J=X+j*M,Y=j*m.strideHeight-b;for(let et=0;et<f;++et){let Q=Y+et*g;if(Q<0||Q>=m.inHeight)continue;let nt=et*$[0],pt=H+Q*A;for(let gt=0;gt<m.outWidth;++gt){let dt=J+gt*P,St=gt*m.strideWidth-x;for(let Ct=0;Ct<d;++Ct){let Bt=St+Ct*h;if(Bt<0||Bt>=m.inWidth)continue;let Ut=nt+Ct*$[1],ae=pt+Bt*F,Ht=Ut;for(let Vt=0;Vt<m.inChannels;++Vt){let oe=V[ae+Vt*_];for(let te=0;te<m.outChannels;++te)G[dt+te*B]+=oe*z[Ht+te];Ht+=m.outChannels}}}}}}return e.makeTensorInfo(S.shape,S.dtype,G)}var Pk={kernelName:Os,backendName:"cpu",kernelFunc:Vy};function aG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,dy:s}=t,{strides:a,pad:i,dataFormat:l,dimRoundingMode:c,filterShape:u}=o;U([n,s],"conv2dBackpropFilter");let p=N.convertConv2DDataFormat(l),m=N.computeConv2DInfo(n.shape,u,a,1,i,c,!1,p),{strideHeight:f,strideWidth:d,filterHeight:g,filterWidth:h}=m,x=m.dataFormat==="channelsLast",b=new $t(m.filterShape,"float32"),C=m.padInfo.left,S=m.padInfo.top,I=e.data.get(n.dataId).values,$=e.data.get(s.dataId).values,R=new $t(n.shape,n.dtype,I),A=new $t(s.shape,s.dtype,$);for(let F=0;F<g;++F){let _=Math.max(0,Math.ceil((S-F)/f)),O=Math.min(m.outHeight,(m.inHeight+S-F)/f);for(let M=0;M<h;++M){let P=Math.max(0,Math.ceil((C-M)/d)),B=Math.min(m.outWidth,(m.inWidth+C-M)/d);for(let V=0;V<m.inChannels;++V)for(let z=0;z<m.outChannels;++z){let G=0;for(let W=0;W<m.batchSize;++W)for(let H=_;H<O;++H){let X=F+H*f-S;for(let j=P;j<B;++j){let J=M+j*d-C;x?G+=R.get(W,X,J,V)*A.get(W,H,j,z):G+=R.get(W,V,X,J)*A.get(W,z,H,j)}}b.set(G,F,M,V,z)}}}return e.makeTensorInfo(b.shape,b.dtype,b.values)}var Mk={kernelName:Ps,backendName:"cpu",kernelFunc:aG};function iG(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,filter:s}=t,{inputShape:a,strides:i,pad:l,dataFormat:c,dimRoundingMode:u}=o;U([n,s],"conv2dBackpropInput");let p=y.computeStrides(s.shape),m=y.computeStrides(n.shape),f=N.convertConv2DDataFormat(c),d=N.computeConv2DInfo(a,s.shape,i,1,l,u,!1,f),g=new $t(d.inShape,"float32"),h=g.values,x=e.data.get(n.dataId).values,b=e.data.get(s.dataId).values,[C,S,I]=p,{batchSize:$,filterHeight:R,filterWidth:A,inChannels:F,inHeight:_,inWidth:O,outChannels:M,outHeight:P,outWidth:B,strideHeight:V,strideWidth:z}=d;f=d.dataFormat;let G=R-1-d.padInfo.top,W=A-1-d.padInfo.left,H=f==="channelsLast",X=g.strides[0],j=H?g.strides[1]:g.strides[2],J=H?g.strides[2]:1,Y=H?1:g.strides[1],et=m[0],Q=H?m[1]:m[2],nt=H?m[2]:1,pt=H?1:m[1];for(let gt=0;gt<$;++gt)for(let dt=0;dt<F;++dt)for(let St=0;St<_;++St){let Ct=St-G,Bt=Math.max(0,Math.ceil(Ct/V)),Ut=Math.min(P,(R+Ct)/V);for(let ae=0;ae<O;++ae){let Ht=ae-W,Vt=Math.max(0,Math.ceil(Ht/z)),oe=Math.min(B,(A+Ht)/z),te=0;for(let Se=Bt;Se<Ut;++Se){let zo=Se*V-Ct;for(let fr=Vt;fr<oe;++fr){let ys=fr*z-Ht,Ir=et*gt+Q*Se+nt*fr,fo=C*(R-1-zo)+S*(A-1-ys)+I*dt;for(let Wo=0;Wo<M;++Wo){let Go=x[Ir+pt*Wo],Uo=b[fo+Wo];te+=Go*Uo}}}let mo=X*gt+j*St+J*ae+Y*dt;h[mo]=te}}return e.makeTensorInfo(g.shape,g.dtype,g.values)}var Lk={kernelName:Ms,backendName:"cpu",kernelFunc:iG};function lG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dilations:l}=o;U([n,s],"conv3d");let c=N.computeConv3DInfo(n.shape,s.shape,a,l,i),{filterDepth:u,filterHeight:p,filterWidth:m,dilationDepth:f,dilationHeight:d,dilationWidth:g,padInfo:h}=c,x=h.front,b=h.left,C=h.top,S=new $t(c.outShape,n.dtype),I=e.data.get(n.dataId).values,$=e.data.get(s.dataId).values,R=S.values,A=y.computeStrides(n.shape),F=y.computeStrides(s.shape);for(let _=0;_<c.batchSize;++_){let O=_*A[0],M=_*S.strides[0];for(let P=0;P<c.outDepth;++P){let B=M+P*S.strides[1],V=P*c.strideDepth-x;for(let z=0;z<u;++z){let G=V+z*f;if(G<0||G>=c.inDepth)continue;let W=z*F[0],H=O+G*A[1];for(let X=0;X<c.outHeight;++X){let j=B+X*S.strides[2],J=X*c.strideHeight-C;for(let Y=0;Y<p;++Y){let et=J+Y*d;if(et<0||et>=c.inHeight)continue;let Q=W+Y*F[1],nt=H+et*A[2];for(let pt=0;pt<c.outWidth;++pt){let gt=j+pt*c.outChannels,dt=pt*c.strideWidth-b;for(let St=0;St<m;++St){let Ct=dt+St*g;if(Ct<0||Ct>=c.inWidth)continue;let Bt=Q+St*F[2],Ut=nt+Ct*c.inChannels,ae=Bt;for(let Ht=0;Ht<c.inChannels;++Ht){let Vt=I[Ut+Ht];for(let oe=0;oe<c.outChannels;++oe)R[gt+oe]+=Vt*$[ae+oe];ae+=c.outChannels}}}}}}}}return e.makeTensorInfo(S.shape,S.dtype,S.values)}var Bk={kernelName:Ls,backendName:"cpu",kernelFunc:lG};function cG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,dy:s}=t,{strides:a,pad:i,filterShape:l}=o;U([n,s],"conv3dBackpropFilterV2");let c=y.computeStrides(n.shape),u=y.computeStrides(s.shape),p=N.computeConv3DInfo(n.shape,l,a,1,i),m=p.strideDepth,f=p.strideHeight,d=p.strideWidth,g=p.filterDepth,h=p.filterHeight,x=p.filterWidth,b=new $t(p.filterShape,"float32"),C=b.values,[S,I,$,R]=b.strides,A=e.data.get(s.dataId).values,[F,_,O,M]=u,P=e.data.get(n.dataId).values,[B,V,z,G]=c,W=p.padInfo.front,H=p.padInfo.left,X=p.padInfo.top;for(let j=0;j<g;++j){let J=Math.max(0,Math.ceil((W-j)/m)),Y=Math.min(p.outDepth,(p.inDepth+W-j)/m),et=j*S;for(let Q=0;Q<h;++Q){let nt=Math.max(0,Math.ceil((X-Q)/f)),pt=Math.min(p.outHeight,(p.inHeight+X-Q)/f),gt=Q*I+et;for(let dt=0;dt<x;++dt){let St=Math.max(0,Math.ceil((H-dt)/d)),Ct=Math.min(p.outWidth,(p.inWidth+H-dt)/d),Bt=dt*$+gt;for(let Ut=0;Ut<p.inChannels;++Ut){let ae=Ut*R+Bt;for(let Ht=0;Ht<p.outChannels;++Ht){let Vt=0;for(let oe=0;oe<p.batchSize;++oe){let te=oe*B,mo=oe*F;for(let Se=J;Se<Y;++Se){let fr=(j+Se*m-W)*V+te,ys=Se*_+mo;for(let Ir=nt;Ir<pt;++Ir){let Wo=(Q+Ir*f-X)*z+fr,Go=Ir*O+ys;for(let Uo=St;Uo<Ct;++Uo){let md=(dt+Uo*d-H)*G+Wo,fd=Uo*M+Go;Vt+=P[md+Ut]*A[fd+Ht]}}}}C[ae+Ht]=Vt}}}}}return e.makeTensorInfo(b.shape,b.dtype,b.values)}var Vk={kernelName:cc,backendName:"cpu",kernelFunc:cG};function uG(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,filter:s}=t,{pad:a,strides:i,inputShape:l}=o;U([n],"conv3dBackpropInputV2");let c=y.computeStrides(n.shape),u=y.computeStrides(s.shape),p=N.computeConv3DInfo(l,s.shape,i,1,a),m=new $t(p.inShape,"float32"),f=m.values,[d,g,h,x]=m.strides,b=e.data.get(n.dataId).values,[C,S,I,$]=c,R=e.data.get(s.dataId).values,[A,F,_,O]=u,{batchSize:M,filterDepth:P,filterHeight:B,filterWidth:V,inChannels:z,inDepth:G,inHeight:W,inWidth:H,outChannels:X,outDepth:j,outHeight:J,outWidth:Y,strideDepth:et,strideHeight:Q,strideWidth:nt}=p,pt=P-1-p.padInfo.front,gt=B-1-p.padInfo.top,dt=V-1-p.padInfo.left;for(let St=0;St<M;++St)for(let Ct=0;Ct<z;++Ct)for(let Bt=0;Bt<G;++Bt){let Ut=Bt-pt,ae=Math.max(0,Math.ceil(Ut/et)),Ht=Math.min(j,(P+Ut)/et);for(let Vt=0;Vt<W;++Vt){let oe=Vt-gt,te=Math.max(0,Math.ceil(oe/Q)),mo=Math.min(J,(B+oe)/Q);for(let Se=0;Se<H;++Se){let zo=Se-dt,fr=Math.max(0,Math.ceil(zo/nt)),ys=Math.min(Y,(V+zo)/nt),Ir=0;for(let fo=ae;fo<Ht;++fo){let Wo=fo*et-Ut;for(let Go=te;Go<mo;++Go){let Uo=Go*Q-oe;for(let nc=fr;nc<ys;++nc){let md=nc*nt-zo,fd=C*St+S*fo+I*Go+$*nc,gR=A*(P-1-Wo)+F*(B-1-Uo)+_*(V-1-md)+O*Ct;for(let Gu=0;Gu<X;++Gu){let xR=b[fd+Gu],yR=R[gR+Gu];Ir+=xR*yR}}}}f[d*St+g*Bt+h*Vt+x*Se+Ct]=Ir}}}return e.makeTensorInfo(m.shape,m.dtype,m.values)}var zk={kernelName:Bs,backendName:"cpu",kernelFunc:uG};var pG=ut("Cos",r=>Math.cos(r)),Wk={kernelName:"Cos",backendName:"cpu",kernelFunc:pG};var mG=ut(nn,r=>Math.cosh(r)),Gk={kernelName:nn,backendName:"cpu",kernelFunc:mG};function fG(r){let{inputs:t,backend:e,attrs:o}=r,{image:n,boxes:s,boxInd:a}=t,{cropSize:i,method:l,extrapolationValue:c}=o,[u,p,m,f]=n.shape,d=s.shape[0],[g,h]=i,x=ot([d,g,h,f],"float32"),b=e.data.get(s.dataId).values,C=e.data.get(a.dataId).values,S=e.data.get(n.dataId).values,I=y.computeStrides(n.shape),$=y.computeStrides(x.shape);for(let R=0;R<d;R++){let A=R*4,F=b[A],_=b[A+1],O=b[A+2],M=b[A+3],P=C[R];if(P>=u)continue;let B=g>1?(O-F)*(p-1)/(g-1):0,V=h>1?(M-_)*(m-1)/(h-1):0;for(let z=0;z<g;z++){let G=g>1?F*(p-1)+z*B:.5*(F+O)*(p-1);if(G<0||G>p-1){for(let W=0;W<h;W++)for(let H=0;H<f;H++){let X=H+W*$[2]+z*$[1]+R*$[0];x.values[X]=c}continue}if(l==="bilinear"){let W=Math.floor(G),H=Math.ceil(G),X=G-W;for(let j=0;j<h;j++){let J=h>1?_*(m-1)+j*V:.5*(_+M)*(m-1);if(J<0||J>m-1){for(let nt=0;nt<f;nt++){let pt=nt+j*$[2]+z*$[1]+R*$[0];x.values[pt]=c}continue}let Y=Math.floor(J),et=Math.ceil(J),Q=J-Y;for(let nt=0;nt<f;nt++){let pt=nt+Y*I[2]+W*I[1]+P*I[0],gt=S[pt];pt=nt+et*I[2]+W*I[1]+P*I[0];let dt=S[pt];pt=nt+Y*I[2]+H*I[1]+P*I[0];let St=S[pt];pt=nt+et*I[2]+H*I[1]+P*I[0];let Ct=S[pt],Bt=gt+(dt-gt)*Q,Ut=St+(Ct-St)*Q;pt=nt+j*$[2]+z*$[1]+R*$[0],x.values[pt]=Bt+(Ut-Bt)*X}}}else for(let W=0;W<h;++W){let H=h>1?_*(m-1)+W*V:.5*(_+M)*(m-1);if(H<0||H>m-1){for(let J=0;J<f;J++){let Y=J+W*$[2]+z*$[1]+R*$[0];x.values[Y]=c}continue}let X=Math.round(H),j=Math.round(G);for(let J=0;J<f;J++){let Y=J+X*I[2]+j*I[1]+P*I[0],et=J+W*$[2]+z*$[1]+R*$[0];x.values[et]=S[Y]}}}}return e.makeTensorInfo(x.shape,x.dtype,x.values)}var Uk={kernelName:Gs,backendName:"cpu",kernelFunc:fG};function dG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,exclusive:a,reverse:i}=o;U(n,"cumprod");let l=N.getAxesPermutation([s],n.shape.length),c=n;l!=null&&(c=Xt({inputs:{x:n},backend:e,attrs:{perm:l}}));let u=N.getInnerMostAxes(1,n.shape.length)[0];if(u!==c.shape.length-1)throw new Error(`backend.cumprod in CPU expects an inner-most axis=${c.shape.length-1} but got axis=${u}`);let p=se(c.dtype,"int32"),m=y.makeOnesTypedArray(y.sizeFromShape(c.shape),p),f=e.data.get(c.dataId).values,d=c.shape[c.shape.length-1],g=i?(x,b)=>x+d-b-1:(x,b)=>x+b;for(let x=0;x<f.length;x+=d)for(let b=0;b<d;b++){let C=g(x,b);if(b===0)m[C]=a?1:f[C];else{let S=g(x,b-1);m[C]=a?f[S]*m[S]:f[C]*m[S]}}let h=e.makeTensorInfo(c.shape,p,m);if(l!=null){let x=N.getUndoAxesPermutation(l),b=Xt({inputs:{x:h},backend:e,attrs:{perm:x}});return e.disposeIntermediateTensorInfo(h),e.disposeIntermediateTensorInfo(c),b}return h}var Hk={kernelName:zs,backendName:"cpu",kernelFunc:dG};function hG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,exclusive:a,reverse:i}=o;U(n,"cumsum");let l=N.getAxesPermutation([s],n.shape.length),c=n;l!=null&&(c=Xt({inputs:{x:n},backend:e,attrs:{perm:l}}));let u=N.getInnerMostAxes(1,n.shape.length)[0];if(u!==c.shape.length-1)throw new Error(`backend.cumsum in CPU expects an inner-most axis=${c.shape.length-1} but got axis=${u}`);let p=se(c.dtype,"int32"),m=y.makeZerosTypedArray(y.sizeFromShape(c.shape),p),f=e.data.get(c.dataId).values,d=c.shape[c.shape.length-1],g=i?(x,b)=>x+d-b-1:(x,b)=>x+b;for(let x=0;x<f.length;x+=d)for(let b=0;b<d;b++){let C=g(x,b);if(b===0)m[C]=a?0:f[C];else{let S=g(x,b-1);m[C]=a?f[S]+m[S]:f[C]+m[S]}}let h=e.makeTensorInfo(c.shape,p,m);if(l!=null){let x=N.getUndoAxesPermutation(l),b=Xt({inputs:{x:h},backend:e,attrs:{perm:x}});return e.disposeIntermediateTensorInfo(h),e.disposeIntermediateTensorInfo(c),b}return h}var Kk={kernelName:Ws,backendName:"cpu",kernelFunc:hG};function gG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,weights:s}=t,{size:a,binaryOutput:i}=o;if(n.shape.length===1){let l=e.data.get(n.dataId).values,c=e.data.get(s.dataId).values,u=Bl(l,c,s.dtype,s.shape,a);return e.makeTensorInfo([a],s.dtype,u)}else if(n.shape.length===2){let l=e.bufferSync(n),c=e.bufferSync(s),u=jp(l,c,a,i);return e.makeTensorInfo(u.shape,s.dtype,u.values)}throw new Error(`Error in denseBincount: input must be at most rank 2, but got rank${n.shape.length}.`)}var qk={kernelName:Us,backendName:"cpu",kernelFunc:gG};function xG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{blockSize:s,dataFormat:a}=o;y.assert(a==="NHWC",()=>`Only NHWC dataFormat supported on CPU for depthToSpace. Got ${a}`);let i=n.shape[0],l=n.shape[1],c=n.shape[2],u=n.shape[3],p=l*s,m=c*s,f=u/(s*s),d=e.data.get(n.dataId).values,g=new Float32Array(i*p*m*f),h=0;for(let x=0;x<i;++x)for(let b=0;b<p;++b){let C=Math.floor(b/s),S=b%s;for(let I=0;I<m;++I){let $=Math.floor(I/s),R=I%s,A=(S*s+R)*f;for(let F=0;F<f;++F){let O=F+A+u*($+c*(C+l*x));g[h++]=d[O]}}}return e.makeTensorInfo([i,p,m,f],n.dtype,g)}var jk={kernelName:Hs,backendName:"cpu",kernelFunc:xG};function zy(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s}=t,{strides:a,pad:i,dilations:l,dimRoundingMode:c}=o;U([n,s],"depthwiseConv2DNative");let u=y.computeStrides(n.shape),p=y.computeStrides(s.shape),m=l;m==null&&(m=[1,1]),y.assert(N.eitherStridesOrDilationsAreOne(a,m),()=>`Error in depthwiseConv2d: Either strides or dilations must be 1. Got strides ${a} and dilations '${m}'`);let f=N.computeConv2DInfo(n.shape,s.shape,a,m,i,c,!0),{filterHeight:d,filterWidth:g,dilationHeight:h,dilationWidth:x,padInfo:b}=f,C=b.left,S=b.top,I=f.outChannels/f.inChannels,$=new $t(f.outShape,n.dtype),R=e.data.get(n.dataId).values,A=e.data.get(s.dataId).values,F=$.values;for(let _=0;_<f.batchSize;++_){let O=_*u[0],M=_*$.strides[0];for(let P=0;P<f.outHeight;++P){let B=M+P*$.strides[1],V=P*f.strideHeight-S;for(let z=0;z<d;++z){let G=V+z*h;if(G<0||G>=f.inHeight)continue;let W=z*p[0],H=O+G*u[1];for(let X=0;X<f.outWidth;++X){let j=B+X*$.strides[2],J=X*f.strideWidth-C;for(let Y=0;Y<g;++Y){let et=J+Y*x;if(et<0||et>=f.inWidth)continue;let Q=W+Y*p[1],nt=H+et*f.inChannels,pt=j,gt=Q;for(let dt=0;dt<f.inChannels;++dt){let St=R[nt+dt];for(let Ct=0;Ct<I;++Ct)F[pt+Ct]+=St*A[gt+Ct];pt+=I,gt+=I}}}}}}return e.makeTensorInfo($.shape,$.dtype,$.values)}var Xk={kernelName:Ks,backendName:"cpu",kernelFunc:zy};function yG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,dy:s}=t,{strides:a,dilations:i,pad:l,dimRoundingMode:c,filterShape:u}=o;U([n,s],"depthwiseConv2dNativeBackpropFilter");let p=N.computeConv2DInfo(n.shape,u,a,i,l,c,!0),{strideHeight:m,strideWidth:f,filterHeight:d,filterWidth:g}=p,h=new $t(p.filterShape,"float32"),x=p.padInfo.left,b=p.padInfo.top,C=p.outChannels/p.inChannels,S=e.data.get(n.dataId).values,I=new $t(n.shape,n.dtype,S),$=e.data.get(s.dataId).values,R=new $t(s.shape,s.dtype,$);for(let A=0;A<d;++A){let F=Math.max(0,Math.ceil((b-A)/m)),_=Math.min(p.outHeight,(p.inHeight+b-A)/m);for(let O=0;O<g;++O){let M=Math.max(0,Math.ceil((x-O)/f)),P=Math.min(p.outWidth,(p.inWidth+x-O)/f);for(let B=0;B<p.outChannels;++B){let V=Math.trunc(B/C),z=B%C,G=0;for(let W=0;W<p.batchSize;++W)for(let H=F;H<_;++H){let X=A+H*m-b;for(let j=M;j<P;++j){let J=O+j*f-x;G+=I.get(W,X,J,V)*R.get(W,H,j,B)}}h.set(G,A,O,V,z)}}}return e.makeTensorInfo(h.shape,h.dtype,h.values)}var Yk={kernelName:qs,backendName:"cpu",kernelFunc:yG};function bG(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,filter:s}=t,{strides:a,dilations:i,pad:l,dimRoundingMode:c,inputShape:u}=o;U([n,s],"depthwiseConv2DNativeBackpropInput");let p=y.computeStrides(n.shape),m=y.computeStrides(s.shape),f=N.computeConv2DInfo(u,s.shape,a,i,l,c,!0),d=new $t(f.inShape,"float32"),g=d.values,[h,x,b]=d.strides,C=e.data.get(n.dataId).values,[S,I,$]=p,R=e.data.get(s.dataId).values,[A,F,_]=m,{batchSize:O,filterHeight:M,filterWidth:P,inChannels:B,inHeight:V,inWidth:z,outChannels:G,outHeight:W,outWidth:H,strideHeight:X,strideWidth:j}=f,J=M-1-f.padInfo.top,Y=P-1-f.padInfo.left,et=G/B;for(let Q=0;Q<O;++Q)for(let nt=0;nt<B;++nt)for(let pt=0;pt<V;++pt){let gt=pt-J,dt=Math.max(0,Math.ceil(gt/X)),St=Math.min(W,(M+gt)/X);for(let Ct=0;Ct<z;++Ct){let Bt=Ct-Y,Ut=Math.max(0,Math.ceil(Bt/j)),ae=Math.min(H,(P+Bt)/j),Ht=0;for(let Vt=dt;Vt<St;++Vt){let oe=Vt*X-gt;for(let te=Ut;te<ae;++te){let mo=te*j-Bt,Se=S*Q+I*Vt+$*te,zo=A*(M-1-oe)+F*(P-1-mo)+_*nt;for(let fr=0;fr<et;++fr){let ys=nt*et+fr,Ir=C[Se+ys],fo=R[zo+fr];Ht+=Ir*fo}}}g[h*Q+x*pt+b*Ct+nt]=Ht}}return e.makeTensorInfo(d.shape,d.dtype,d.values)}var Qk={kernelName:js,backendName:"cpu",kernelFunc:bG};function wG(r){let{inputs:t,backend:e}=r,{x:o}=t,n=y.sizeFromShape(o.shape),s=e.data.get(o.dataId).values,a=ot([n,n],o.dtype),i=a.values;for(let c=0;c<s.length;c++)i[c*n+c]=s[c];let l=[...o.shape,...o.shape];return e.makeTensorInfo(l,a.dtype,a.values)}var Zk={kernelName:Xs,backendName:"cpu",kernelFunc:wG};var Jk={kernelName:Ys,backendName:"cpu",kernelFunc:({inputs:r,backend:t,attrs:e})=>{let{x:o,filter:n}=r,{strides:s,pad:a,dilations:i}=e,l=t,c=l.data.get(o.dataId).values,u=o.shape.length,p=l.data.get(n.dataId).values,m=n.shape.length,{batchSize:f,inHeight:d,inWidth:g,inChannels:h,outHeight:x,outWidth:b,padInfo:C,strideHeight:S,strideWidth:I,filterHeight:$,filterWidth:R,dilationHeight:A,dilationWidth:F,outShape:_}=N.computeDilation2DInfo(o.shape,n.shape,s,a,"NHWC",i),O=y.sizeFromShape(_),M=_.length,P=y.getArrayFromDType(o.dtype,O);for(let V=0;V<f;++V)for(let z=0;z<x;++z){let G=z*S-C.top;for(let W=0;W<b;++W){let H=W*I-C.left;for(let X=0;X<h;++X){let j=Number.MIN_SAFE_INTEGER;for(let Y=0;Y<$;++Y){let et=G+Y*A;if(et>=0&&et<d)for(let Q=0;Q<R;++Q){let nt=H+Q*F;if(nt>=0&&nt<g){let pt=y.locToIndex([V,et,nt,X],u,y.computeStrides(o.shape)),gt=y.locToIndex([Y,Q,X],m,y.computeStrides(n.shape)),dt=c[pt]+p[gt];dt>j&&(j=dt)}}}let J=y.locToIndex([V,z,W,X],M,y.computeStrides(_));P[J]=j}}}return{dataId:l.write(y.toTypedArray(P,o.dtype),_,o.dtype),shape:_,dtype:o.dtype}}};var t2={kernelName:ju,backendName:"cpu",kernelFunc:({inputs:r,backend:t,attrs:e})=>{let{x:o,filter:n,dy:s}=r,{strides:a,pad:i,dilations:l}=e,c=t,u=y.toNestedArray(o.shape,c.data.get(o.dataId).values),p=y.toNestedArray(n.shape,c.data.get(n.dataId).values),{batchSize:m,inHeight:f,inWidth:d,inChannels:g,outHeight:h,outWidth:x,padInfo:b,strideHeight:C,strideWidth:S,filterHeight:I,filterWidth:$,dilationHeight:R,dilationWidth:A,outShape:F}=N.computeDilation2DInfo(o.shape,n.shape,a,i,"NHWC",l);y.assert(s.rank===F.length,()=>`Error in ${ju}, dy must have the same rank as output ${F.length}, but got ${s.rank}`);let _=y.toNestedArray(F,c.data.get(s.dataId).values),O=y.makeZerosNestedTypedArray(n.shape,n.dtype);for(let P=0;P<m;++P)for(let B=0;B<h;++B){let V=B*C-b.top;for(let z=0;z<x;++z){let G=z*S-b.left;for(let W=0;W<g;++W){let H=Number.MIN_SAFE_INTEGER,X=0,j=0;for(let J=0;J<I;++J){let Y=V+J*R;if(Y>=0&&Y<f)for(let et=0;et<$;++et){let Q=G+et*A;if(Q>=0&&Q<d){let nt=u[P][Y][Q][W]+p[J][et][W];nt>H&&(H=nt,X=J,j=et)}}}O[X][j][W]+=_[P][B][z][W]}}}return{dataId:c.write(y.toTypedArray(O,o.dtype),n.shape,n.dtype),shape:n.shape,dtype:n.dtype}}};var e2={kernelName:qu,backendName:"cpu",kernelFunc:({inputs:r,backend:t,attrs:e})=>{let{x:o,filter:n,dy:s}=r,{strides:a,pad:i,dilations:l}=e,c=t,u=y.toNestedArray(o.shape,c.data.get(o.dataId).values),p=y.toNestedArray(n.shape,c.data.get(n.dataId).values),{batchSize:m,inHeight:f,inWidth:d,inChannels:g,outHeight:h,outWidth:x,padInfo:b,strideHeight:C,strideWidth:S,filterHeight:I,filterWidth:$,dilationHeight:R,dilationWidth:A,outShape:F}=N.computeDilation2DInfo(o.shape,n.shape,a,i,"NHWC",l);y.assert(s.rank===F.length,()=>`Error in ${qu}, dy must have the same rank as output ${F.length}, but got ${s.rank}`);let _=y.toNestedArray(F,c.data.get(s.dataId).values),O=y.makeZerosNestedTypedArray(o.shape,o.dtype);for(let P=0;P<m;++P)for(let B=0;B<h;++B){let V=B*C-b.top;for(let z=0;z<x;++z){let G=z*S-b.left;for(let W=0;W<g;++W){let H=Number.MIN_SAFE_INTEGER,X=V<0?0:V,j=G<0?0:G;for(let J=0;J<I;++J){let Y=V+J*R;if(Y>=0&&Y<f)for(let et=0;et<$;++et){let Q=G+et*A;if(Q>=0&&Q<d){let nt=u[P][Y][Q][W]+p[J][et][W];nt>H&&(H=nt,X=Y,j=Q)}}}O[P][X][j][W]+=_[P][B][z][W]}}}return{dataId:c.write(y.toTypedArray(O,o.dtype),o.shape,o.dtype),shape:o.shape,dtype:o.dtype}}};function vG(r){let{inputs:t,backend:e,attrs:o}=r,{image:n}=t,{canvas:s,options:a}=o,{contextOptions:i,imageOptions:l}=a||{},c=l?.alpha||1,u=i?.contextType||"2d";if(u!=="2d")throw new Error(`Context type ${i.contextType} is not supported by the CPU backend.`);let p=s.getContext(u,i?.contextAttributes||{});if(p==null)throw new Error(`Could not get the context with ${u} type.`);let[m,f]=n.shape.slice(0,2),d=n.shape.length===2?1:n.shape[2],g=e.data.get(n.dataId).values,h=n.dtype==="float32"?255:1,x=new Uint8ClampedArray(f*m*4);for(let C=0;C<m*f;++C){let S=[0,0,0,255*c];for(let $=0;$<d;$++){let R=g[C*d+$];if(n.dtype==="float32"){if(R<0||R>1)throw new Error(`Tensor values for a float32 Tensor must be in the range [0 - 1] but encountered ${R}.`)}else if(n.dtype==="int32"&&(R<0||R>255))throw new Error(`Tensor values for a int32 Tensor must be in the range [0 - 255] but encountered ${R}.`);d===1?(S[0]=R*h,S[1]=R*h,S[2]=R*h):S[$]=R*h}let I=C*4;x[I+0]=Math.round(S[0]),x[I+1]=Math.round(S[1]),x[I+2]=Math.round(S[2]),x[I+3]=Math.round(S[3])}s.width=f,s.height=m;let b=new ImageData(x,f,m);return p.putImageData(b,0,0),n}var r2={kernelName:tl,backendName:"cpu",kernelFunc:vG};function Vo(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o;U(n,"sum");let i;n.dtype==="bool"?i=Sr({inputs:{x:n},backend:e,attrs:{dtype:"int32"}}):i=Ee({inputs:{x:n},backend:e});let l=i.shape.length,c=y.parseAxisParam(s,i.shape),u=N.getAxesPermutation(c,l),p=c,m=i;u!=null&&(m=Xt({inputs:{x:i},backend:e,attrs:{perm:u}}),p=N.getInnerMostAxes(p.length,l)),N.assertAxesAreInnerMostDims("sum",p,m.shape.length);let[f,d]=N.computeOutAndReduceShapes(m.shape,p),g=N.upcastType(m.dtype,"int32"),h=Ml(e,f,g),x=y.sizeFromShape(d),b=e.data.get(h.dataId).values,C=e.data.get(m.dataId).values;for(let S=0;S<b.length;++S){let I=S*x,$=0;for(let R=0;R<x;++R)$+=C[I+R];b[S]=$}if(a){let S=N.expandShapeToKeepDim(h.shape,c),I=h;h=vt({inputs:{x:h},backend:e,attrs:{shape:S}}),e.disposeIntermediateTensorInfo(I)}return e.disposeIntermediateTensorInfo(i),u!=null&&e.disposeIntermediateTensorInfo(m),h}var o2={kernelName:"Sum",backendName:"cpu",kernelFunc:Vo};function SG(r){let{inputs:t,backend:e,attrs:o}=r,{equation:n}=o,s=t,{allDims:a,summedDims:i,idDims:l}=N.decodeEinsumEquation(n,s.length);N.checkEinsumDimSizes(a.length,l,s);let{path:c,steps:u}=N.getEinsumComputePath(i,l),p=u.length,m=null,f=a.length,d=[];for(let g=0;g<p;++g){for(let h of u[g]){let{permutationIndices:x,expandDims:b}=N.getEinsumPermutation(f,l[h]),C;N.isIdentityPermutation(x)?C=s[h]:(C=Xt({inputs:{x:s[h]},backend:e,attrs:{perm:x}}),d.push(C));let S=C.shape.slice();for(let I=0;I<b.length;++I)S.splice(b[I],0,1);y.arraysEqual(C.shape,S)||(C=vt({inputs:{x:C},backend:e,attrs:{shape:S}}),d.push(C)),m===null?m=C:(m=Li({inputs:{a:C,b:m},backend:e}),d.push(m))}g<p-1&&(c[g]>=0&&(m=Vo({inputs:{x:m},backend:e,attrs:{axis:c[g]-(a.length-f),keepDims:!1}}),d.push(m)),f--)}for(let g of d)g!==m&&e.disposeIntermediateTensorInfo(g);return m}var n2={kernelName:Qs,backendName:"cpu",kernelFunc:SG};function CG(r){let{inputs:t,backend:e}=r,{dy:o,y:n}=t;U([o,n],"eluGrad");let s=new Float32Array(y.sizeFromShape(n.shape)),a=e.data.get(n.dataId).values,i=e.data.get(o.dataId).values;for(let l=0;l<a.length;++l){let c=a[l];c>=0?s[l]=i[l]:s[l]=i[l]*(c+1)}return e.makeTensorInfo(n.shape,"float32",s)}var s2={kernelName:uc,backendName:"cpu",kernelFunc:CG};var TG=N.ERF_P,NG=N.ERF_A1,IG=N.ERF_A2,kG=N.ERF_A3,EG=N.ERF_A4,$G=N.ERF_A5,RG=ut("Erf",r=>{let t=Math.sign(r),e=Math.abs(r),o=1/(1+TG*e);return t*(1-(((($G*o+EG)*o+kG)*o+IG)*o+NG)*o*Math.exp(-e*e))}),a2={kernelName:"Erf",backendName:"cpu",kernelFunc:RG};function Zl(r){let{inputs:t,backend:e,attrs:o}=r,{input:n}=t,{dim:s}=o,a=n.shape.length,i=n.shape.slice(),l=s;return s<0&&(y.assert(-(a+1)<=s,()=>`Axis must be in the interval [${-(a+1)}, ${a}]`),l=a+s+1),i.splice(l,0,1),vt({inputs:{x:n},backend:e,attrs:{shape:i}})}var i2={kernelName:ea,backendName:"cpu",kernelFunc:Zl};var AG=wt((r,t)=>r/t),Ru=It(sn,AG),Au={kernelName:sn,backendName:"cpu",kernelFunc:Ru};function Uf(r,t,e){let o=r.shape,n=o[0],s=o[1],a=e.data.get(r.dataId),i=a.complexTensorInfos.real,l=a.complexTensorInfos.imag,c=[n,s],u=y.sizeFromShape(c),p=y.getTypedArrayFromDType("float32",u),m=y.getTypedArrayFromDType("float32",u);for(let h=0;h<n;h++){let x=Tr({inputs:{x:i},backend:e,attrs:{begin:[h,0],size:[1,s]}}),b=Tr({inputs:{x:l},backend:e,attrs:{begin:[h,0],size:[1,s]}}),C=fe({inputs:{real:x,imag:b},backend:e}),{real:S,imag:I}=FG(C,t,e),$=N.mergeRealAndImagArrays(S,I);for(let R=0;R<s;R++){let A=N.getComplexWithIndex($,R);p[h*s+R]=A.real,m[h*s+R]=A.imag}e.disposeIntermediateTensorInfo(x),e.disposeIntermediateTensorInfo(b),e.disposeIntermediateTensorInfo(C)}let f=e.makeTensorInfo(c,"float32",p),d=e.makeTensorInfo(c,"float32",m),g=fe({inputs:{real:f,imag:d},backend:e});return e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(d),g}function FG(r,t,e){let o=y.sizeFromShape(r.shape),n=e.data.get(r.dataId),s=e.data.get(n.complexTensorInfos.real.dataId).values,a=e.data.get(n.complexTensorInfos.imag.dataId).values;if(_G(o)){let i=Wy(s,a,o,t,e),l=[r.shape[0],r.shape[1]];if(t){let c=e.makeTensorInfo(l,"float32",i.real),u=e.makeTensorInfo(l,"float32",i.imag),p=e.makeTensorInfo([],"float32",y.createScalarValue(o,"float32")),m=Ee({inputs:{x:p},backend:e}),f=Au.kernelFunc({inputs:{a:c,b:p},backend:e}),d=Au.kernelFunc({inputs:{a:u,b:m},backend:e}),g=e.data.get(f.dataId).values,h=e.data.get(d.dataId).values;return e.disposeIntermediateTensorInfo(c),e.disposeIntermediateTensorInfo(u),e.disposeIntermediateTensorInfo(p),e.disposeIntermediateTensorInfo(m),e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(d),{real:g,imag:h}}return i}else{let i=N.mergeRealAndImagArrays(s,a),l=DG(i,o,t);return N.splitRealAndImagArrays(l)}}function _G(r){return(r&r-1)===0}function Wy(r,t,e,o,n){if(e===1)return{real:r,imag:t};let s=N.mergeRealAndImagArrays(r,t),a=e/2,i=N.complexWithEvenIndex(s),l=i.real,c=i.imag,u=[l.length],p=n.makeTensorInfo(u,"float32",l),m=n.makeTensorInfo(u,"float32",c),f=fe({inputs:{real:p,imag:m},backend:n}),d=N.complexWithOddIndex(s),g=d.real,h=d.imag,x=[g.length],b=n.makeTensorInfo(x,"float32",g),C=n.makeTensorInfo(x,"float32",h),S=fe({inputs:{real:b,imag:C},backend:n}),I=Wy(l,c,a,o,n),$=I.real,R=I.imag,A=[$.length],F=n.makeTensorInfo(A,"float32",$),_=n.makeTensorInfo(A,"float32",R),O=fe({inputs:{real:F,imag:_},backend:n}),M=Wy(g,h,a,o,n),P=M.real,B=M.imag,V=[P.length],z=n.makeTensorInfo(V,"float32",P),G=n.makeTensorInfo(V,"float32",B),W=fe({inputs:{real:z,imag:G},backend:n}),H=N.exponents(e,o),X=[H.real.length],j=n.makeTensorInfo(X,"float32",H.real),J=n.makeTensorInfo(X,"float32",H.imag),Y=fe({inputs:{real:j,imag:J},backend:n}),et=Li({inputs:{a:Y,b:W},backend:n}),Q=lo({inputs:{a:O,b:et},backend:n}),nt=wu({inputs:{a:O,b:et},backend:n}),pt=vr({inputs:{input:Q},backend:n}),gt=vr({inputs:{input:nt},backend:n}),dt=uo({inputs:{input:Q},backend:n}),St=uo({inputs:{input:nt},backend:n}),Ct=fs({inputs:[pt,gt],backend:n,attrs:{axis:0}}),Bt=fs({inputs:[dt,St],backend:n,attrs:{axis:0}}),Ut=n.data.get(Ct.dataId).values,ae=n.data.get(Bt.dataId).values;return n.disposeIntermediateTensorInfo(p),n.disposeIntermediateTensorInfo(m),n.disposeIntermediateTensorInfo(f),n.disposeIntermediateTensorInfo(b),n.disposeIntermediateTensorInfo(C),n.disposeIntermediateTensorInfo(S),n.disposeIntermediateTensorInfo(F),n.disposeIntermediateTensorInfo(_),n.disposeIntermediateTensorInfo(O),n.disposeIntermediateTensorInfo(z),n.disposeIntermediateTensorInfo(G),n.disposeIntermediateTensorInfo(W),n.disposeIntermediateTensorInfo(j),n.disposeIntermediateTensorInfo(J),n.disposeIntermediateTensorInfo(Y),n.disposeIntermediateTensorInfo(et),n.disposeIntermediateTensorInfo(Q),n.disposeIntermediateTensorInfo(nt),n.disposeIntermediateTensorInfo(pt),n.disposeIntermediateTensorInfo(dt),n.disposeIntermediateTensorInfo(gt),n.disposeIntermediateTensorInfo(St),n.disposeIntermediateTensorInfo(Ct),n.disposeIntermediateTensorInfo(Bt),{real:Ut,imag:ae}}function DG(r,t,e){let o=new Float32Array(t*2);for(let n=0;n<t;n++){let s=0,a=0;for(let i=0;i<t;i++){let l=N.exponent(n*i,t,e),c=N.getComplexWithIndex(r,i);s+=c.real*l.real-c.imag*l.imag,a+=c.real*l.imag+c.imag*l.real}e&&(s/=t,a/=t),N.assignToTypedArray(o,s,a,n)}return o}function OG(r){let{inputs:t,backend:e}=r,{input:o}=t,n=y.sizeFromShape(o.shape),s=o.shape[o.shape.length-1],a=n/s,i=vt({inputs:{x:o},backend:e,attrs:{shape:[a,s]}}),l=Uf(i,!1,e),c=vt({inputs:{x:l},backend:e,attrs:{shape:o.shape}});return e.disposeIntermediateTensorInfo(i),e.disposeIntermediateTensorInfo(l),c}var l2={kernelName:"FFT",backendName:"cpu",kernelFunc:OG};function Fu(r){let{backend:t,attrs:e}=r,{shape:o,value:n,dtype:s}=e,a=s||y.inferDtype(n),i=y.getArrayFromDType(a,y.sizeFromShape(o));return PG(i,n,a),t.makeTensorInfo(o,a,i)}var c2={kernelName:ra,backendName:"cpu",kernelFunc:Fu};function PG(r,t,e){r.fill(t)}var u2={kernelName:oa,backendName:"cpu",kernelFunc:({inputs:r,attrs:t,backend:e})=>{let{image:o}=r,n=e,s=y.getTypedArrayFromDType(o.dtype,y.sizeFromShape(o.shape)),[a,i,l,c]=o.shape,u=n.data.get(o.dataId).values;for(let m=0;m<a;m++){let f=m*l*i*c;for(let d=0;d<i;d++){let g=d*(l*c);for(let h=0;h<l;h++){let x=h*c;for(let b=0;b<c;b++){let C=Math.round(l-h-1),S=f+g+x+b,I=u[S];if(C>=0&&C<l){let $=C*c,R=f+g+$+b;I=u[R]}s[S]=I}}}}return{dataId:n.write(s,o.shape,o.dtype),shape:o.shape,dtype:o.dtype}}};function MG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s,bias:a,preluActivationWeights:i}=t,{strides:l,pad:c,dataFormat:u,dilations:p,dimRoundingMode:m,activation:f,leakyreluAlpha:d}=o,g=Vy({inputs:{x:n,filter:s},backend:e,attrs:{strides:l,pad:c,dataFormat:u,dilations:p,dimRoundingMode:m}});if(a){let h=g;if(u==="NCHW"&&a.shape.length===1&&a.shape[0]!==1){let x=vt({inputs:{x:a},backend:e,attrs:{shape:[a.shape[0],1,1]}});g=lo({inputs:{a:g,b:x},backend:e}),e.disposeIntermediateTensorInfo(x)}else g=lo({inputs:{a:g,b:a},backend:e});e.disposeIntermediateTensorInfo(h)}if(f){let h=g;if(u==="NCHW"&&f==="prelu"&&i.shape.length===1&&i.shape[0]!==1){let x=vt({inputs:{x:i},backend:e,attrs:{shape:[i.shape[0],1,1]}});g=Hi(e,g,f,x,d),e.disposeIntermediateTensorInfo(x)}else g=Hi(e,g,f,i,d);e.disposeIntermediateTensorInfo(h)}return g}var p2={kernelName:Wn,backendName:"cpu",kernelFunc:MG};function LG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,filter:s,bias:a,preluActivationWeights:i}=t,{strides:l,pad:c,dataFormat:u,dilations:p,dimRoundingMode:m,activation:f,leakyreluAlpha:d}=o,g=zy({inputs:{x:n,filter:s},backend:e,attrs:{strides:l,pad:c,dataFormat:u,dilations:p,dimRoundingMode:m}});if(a){let h=g;g=lo({inputs:{a:g,b:a},backend:e}),e.disposeIntermediateTensorInfo(h)}if(f){let h=g;g=Hi(e,g,f,i,d),e.disposeIntermediateTensorInfo(h)}return g}var m2={kernelName:Gn,backendName:"cpu",kernelFunc:LG};function BG(r){let{inputs:t,backend:e}=r,{params:o,indices:n}=t,s=y.sizeFromShape(o.shape),a=n.shape,i=a[a.length-1],[l,c,u,p]=N.prepareAndValidate(o,n);if(c===0)return e.makeTensorInfo(l,o.dtype,[]);let m=e.data.get(n.dataId).values,f=e.bufferSync(o),d=Yp(m,f,o.dtype,c,i,u,p,o.shape,s);return e.makeTensorInfo(l,o.dtype,d.values)}var f2={kernelName:aa,backendName:"cpu",kernelFunc:BG};function VG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,indices:s}=t,{axis:a,batchDims:i}=o;U([n,s],"gatherV2");let l=y.parseAxisParam(a,n.shape)[0],c=e.data.get(s.dataId).values,u=n.shape[l];for(let S=0;S<c.length;++S){let I=c[S];y.assert(I<=u-1&&I>=0,()=>`GatherV2: the index value ${I} is not in [0, ${u-1}]`)}let p=i;i==null&&(p=0);let m=y.sizeFromShape(s.shape),f=N.segment_util.collectGatherOpShapeInfo(n,s,l,p),d=vt({inputs:{x:n},backend:e,attrs:{shape:[f.batchSize,f.outerSize,f.dimSize,f.sliceSize]}}),g=vt({inputs:{x:s},backend:e,attrs:{shape:[f.batchSize,m/f.batchSize]}}),h=[f.batchSize,f.outerSize,m/f.batchSize,f.sliceSize],x=e.bufferSync(g),b=e.bufferSync(d),C=Qp(b,x,h);return e.disposeIntermediateTensorInfo(d),e.disposeIntermediateTensorInfo(g),e.makeTensorInfo(f.outputShape,C.dtype,C.values)}var d2={kernelName:sa,backendName:"cpu",kernelFunc:VG};function zG(r){let{inputs:t,backend:e}=r,{input:o}=t,n=y.sizeFromShape(o.shape),s=o.shape[o.shape.length-1],a=n/s,i=vt({inputs:{x:o},backend:e,attrs:{shape:[a,s]}}),l=Uf(i,!0,e),c=vt({inputs:{x:l},backend:e,attrs:{shape:o.shape}});return e.disposeIntermediateTensorInfo(i),e.disposeIntermediateTensorInfo(l),c}var h2={kernelName:ia,backendName:"cpu",kernelFunc:zG};var WG=ut(fn,r=>Number.isFinite(r)?1:0,"bool"),g2={kernelName:fn,backendName:"cpu",kernelFunc:WG};var GG=ut(dn,r=>Math.abs(r)===1/0?1:0,"bool"),x2={kernelName:dn,backendName:"cpu",kernelFunc:GG};var UG=ut(hn,r=>Number.isNaN(r)?1:0,"bool"),y2={kernelName:hn,backendName:"cpu",kernelFunc:UG};function HG(r){let{backend:t,attrs:e}=r,{start:o,stop:n,num:s}=e,a=Zp(o,n,s);return t.makeTensorInfo([a.length],"float32",a)}var b2={kernelName:ua,backendName:"cpu",kernelFunc:HG};var KG=ut(yn,r=>Math.log1p(r)),w2={kernelName:yn,backendName:"cpu",kernelFunc:KG};var qG=wt((r,t)=>r&&t),jG=It(bn,qG,null,"bool"),v2={kernelName:bn,backendName:"cpu",kernelFunc:jG};var XG=ut(wn,r=>r?0:1,"bool"),S2={kernelName:wn,backendName:"cpu",kernelFunc:XG};var YG=wt((r,t)=>r||t),QG=It(vn,YG,null,"bool"),C2={kernelName:vn,backendName:"cpu",kernelFunc:QG};function ZG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{depthRadius:s,bias:a,alpha:i,beta:l}=o;U(n,"LRN");let c=n.shape[3],u=c-1,p=e.data.get(n.dataId).values,m=y.sizeFromShape(n.shape),f=new Float32Array(m);function d(g){let h=g%c,x=g-h+Math.max(0,h-s),b=g-h+Math.min(h+s,u),C=0;for(;x<=b;x++){let S=p[x];C+=S*S}return C}for(let g=0;g<m;g++){let h=d(g),x=p[g]*Math.pow(a+i*h,-l);f[g]=x}return e.makeTensorInfo(n.shape,n.dtype,f)}var T2={kernelName:"LRN",backendName:"cpu",kernelFunc:ZG};function JG(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,y:s,dy:a}=t,{depthRadius:i,bias:l,alpha:c,beta:u}=o;U(a,"LRNGrad");let p=y.sizeFromShape(a.shape),m=a.shape[3],f=e.data.get(a.dataId).values,d=e.data.get(n.dataId).values,g=e.data.get(s.dataId).values,h=new Float32Array(p),x=p;for(let b=0;b<x;b++){let C=b%m,S=b-C+Math.max(0,C-i),I=b-C+Math.min(m,C+i+1),$=0;for(let R=S;R<I;R++)$+=Math.pow(d[R],2);$=c*$+l;for(let R=S;R<I;R++){let A=-2*c*u*d[R]*g[b]/$;b===R&&(A+=Math.pow($,-u)),A*=f[b],h[R]+=A}}return e.makeTensorInfo(a.shape,n.dtype,h)}var N2={kernelName:pc,backendName:"cpu",kernelFunc:JG};function Gy(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{reductionIndices:s,keepDims:a}=o,i=e,l=n.shape,c=l.length,u=y.parseAxisParam(s,l),p=u,m=N.getAxesPermutation(p,c),f=i.data.get(n.dataId).values;if(m!=null){let S=new Array(c);for(let I=0;I<S.length;I++)S[I]=l[m[I]];f=Vl(f,l,n.dtype,m,S),p=N.getInnerMostAxes(p.length,c),l=S}U(n,"max"),N.assertAxesAreInnerMostDims("max",p,c);let[d,g]=N.computeOutAndReduceShapes(l,p),h=y.sizeFromShape(g),x=Jp(f,h,d,n.dtype),b=i.write(x,d,n.dtype),C=d;return a&&(C=N.expandShapeToKeepDim(d,u)),{dataId:b,shape:C,dtype:n.dtype}}var I2={kernelName:"Max",backendName:"cpu",kernelFunc:Gy};function tU(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t;U(n,"maxPool");let{filterSize:s,strides:a,pad:i,dimRoundingMode:l}=o,c=1;y.assert(N.eitherStridesOrDilationsAreOne(a,c),()=>`Error in maxPool: Either strides or dilations must be 1. Got strides ${a} and dilations '${c}'`);let u=N.computePool2DInfo(n.shape,s,a,c,i,l),p;if(u.filterWidth===1&&u.filterHeight===1&&y.arraysEqual(u.inShape,u.outShape))p=Ee({inputs:{x:n},backend:e});else{let m=e.data.get(n.dataId).values,f=y.computeStrides(n.shape),d=Ql(m,n.shape,n.dtype,f,u,"max");p=e.makeTensorInfo(u.outShape,n.dtype,d.values)}return p}var k2={kernelName:ma,backendName:"cpu",kernelFunc:tU};function eU(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{filterSize:s,strides:a,pad:i,dimRoundingMode:l,dataFormat:c}=o;U(n,"maxPool3d");let u=N.computePool3DInfo(n.shape,s,a,1,i,l,c),p=e.data.get(n.dataId).values,m=Gf(p,n.shape,n.dtype,y.computeStrides(n.shape),u,"max");return e.makeTensorInfo(m.shape,"float32",m.values)}var E2={kernelName:fa,backendName:"cpu",kernelFunc:eU};function rU(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s}=t,{filterSize:a,strides:i,pad:l,dimRoundingMode:c}=o;U([n,s],"maxPool3DGrad");let u=N.computePool3DInfo(s.shape,a,i,1,l,c),p=e.bufferSync(s),m=Ck(p,u),f=u.strideDepth,d=u.strideHeight,g=u.strideWidth,h=u.dilationDepth,x=u.dilationHeight,b=u.dilationWidth,C=u.effectiveFilterDepth,S=u.effectiveFilterHeight,I=u.effectiveFilterWidth,$=C-1-u.padInfo.front,R=I-1-u.padInfo.left,A=S-1-u.padInfo.top,F=ot(s.shape,"float32"),_=e.bufferSync(n);for(let O=0;O<u.batchSize;++O)for(let M=0;M<u.inChannels;++M)for(let P=0;P<u.inDepth;++P)for(let B=0;B<u.inHeight;++B)for(let V=0;V<u.inWidth;++V){let z=P-$,G=B-A,W=V-R,H=0;for(let X=0;X<C;X+=h){let j=(z+X)/f;if(!(j<0||j>=u.outDepth||Math.floor(j)!==j))for(let J=0;J<S;J+=x){let Y=(G+J)/d;if(!(Y<0||Y>=u.outHeight||Math.floor(Y)!==Y))for(let et=0;et<I;et+=b){let Q=(W+et)/g;if(Q<0||Q>=u.outWidth||Math.floor(Q)!==Q)continue;let nt=C*S*I-1-m.get(O,j,Y,Q,M),pt=X*S*I+J*I+et,gt=nt===pt?1:0;if(gt===0)continue;let dt=_.get(O,j,Y,Q,M);H+=dt*gt}}}F.set(H,O,P,B,V,M)}return e.makeTensorInfo(F.shape,F.dtype,F.values)}var $2={kernelName:fc,backendName:"cpu",kernelFunc:rU};function oU(r){let{inputs:t,backend:e,attrs:o}=r,{dy:n,input:s,output:a}=t,i=s;U([s,a],"maxPoolGrad");let{filterSize:l,strides:c,pad:u,dimRoundingMode:p}=o,m=N.computePool2DInfo(i.shape,l,c,1,u,p),f=e.data.get(i.dataId).values,d=ot(m.outShape,i.dtype,Wf(f,i.shape,i.dtype,m).values),g=m.strideHeight,h=m.strideWidth,x=m.dilationHeight,b=m.dilationWidth,C=m.effectiveFilterHeight,S=m.effectiveFilterWidth,I=S-1-m.padInfo.left,$=C-1-m.padInfo.top,R=ot(i.shape,"float32"),A=e.data.get(n.dataId).values,F=ot(n.shape,"float32",A);for(let _=0;_<m.batchSize;++_)for(let O=0;O<m.inChannels;++O)for(let M=0;M<m.inHeight;++M)for(let P=0;P<m.inWidth;++P){let B=M-$,V=P-I,z=0;for(let G=0;G<C;G+=x){let W=(B+G)/g;if(!(W<0||W>=m.outHeight||Math.floor(W)!==W))for(let H=0;H<S;H+=b){let X=(V+H)/h;if(X<0||X>=m.outWidth||Math.floor(X)!==X)continue;let j=C*S-1-d.get(_,W,X,O),J=G*S+H,Y=j===J?1:0;if(Y===0)continue;let et=F.get(_,W,X,O);z+=et*Y}}R.set(z,_,M,P,O)}return e.makeTensorInfo(R.shape,R.dtype,R.values)}var R2={kernelName:mc,backendName:"cpu",kernelFunc:oU};function A2(r,t,e,o,n){let s=y.computeStrides(t),a=Ql(r,t,e,s,n,"max"),i=Wf(r,t,e,n,!0,o);return[a.values,i.values]}var F2={kernelName:da,backendName:"cpu",kernelFunc:({inputs:r,attrs:t,backend:e})=>{let{x:o}=r,{filterSize:n,strides:s,pad:a,includeBatchInIndex:i}=t,l=e;U(o,"MaxPoolWithArgmax");let c=l.data.get(o.dataId).values,u=N.computePool2DInfo(o.shape,n,s,[1,1],a),[p,m]=A2(c,o.shape,o.dtype,i,u),f=l.write(p,u.outShape,o.dtype),d=l.write(m,u.outShape,o.dtype);return[{dataId:f,shape:u.outShape,dtype:o.dtype},{dataId:d,shape:u.outShape,dtype:"int32"}]}};function nU(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o,i=y.parseAxisParam(s,n.shape),c=N.computeOutAndReduceShapes(n.shape,i)[1],u=y.sizeFromShape(c),p=[],m=e.makeTensorInfo([],"float32",new Float32Array([u]));p.push(m);let f=Sr({inputs:{x:n},backend:e,attrs:{dtype:"float32"}});p.push(f);let d=Ru({inputs:{a:f,b:m},backend:e});p.push(d);let g=Vo({inputs:{x:d},backend:e,attrs:{axis:s,keepDims:a}});return p.forEach(h=>e.disposeIntermediateTensorInfo(h)),g}var _2={kernelName:ha,backendName:"cpu",kernelFunc:nU};function sU(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{axis:s,keepDims:a}=o;U(n,"min");let i=y.parseAxisParam(s,n.shape),l=i,c=N.getAxesPermutation(l,n.shape.length),u=n;c!=null&&(u=Xt({inputs:{x:n},backend:e,attrs:{perm:c}}),l=N.getInnerMostAxes(l.length,n.shape.length)),N.assertAxesAreInnerMostDims("min",l,u.shape.length);let[p,m]=N.computeOutAndReduceShapes(u.shape,l),f=y.sizeFromShape(m),d=y.makeZerosTypedArray(y.sizeFromShape(p),u.dtype),g=e.data.get(u.dataId).values;for(let x=0;x<d.length;++x){let b=x*f,C=g[b];for(let S=0;S<f;++S){let I=g[b+S];(Number.isNaN(I)||I<C)&&(C=I)}d[x]=C}c!=null&&e.disposeIntermediateTensorInfo(u);let h=e.makeTensorInfo(p,u.dtype,d);if(a){let x=N.expandShapeToKeepDim(p,i),b=vt({inputs:{x:h},backend:e,attrs:{shape:x}});return e.disposeIntermediateTensorInfo(h),b}return h}var D2={kernelName:"Min",backendName:"cpu",kernelFunc:sU};function aU(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{paddings:s,mode:a}=o;U(n,"mirrorPad");let i=s.map((C,S)=>C[0]+n.shape[S]+C[1]),l=s.map(C=>C[0]),c=s.map((C,S)=>C[0]+n.shape[S]),u=a==="reflect"?0:1,p=e.data.get(n.dataId).values,m=n.shape.length,f=y.computeStrides(n.shape),d=y.sizeFromShape(i),g=i.length,h=y.computeStrides(i),x=y.getTypedArrayFromDType(n.dtype,d);for(let C=0;C<d;C++){let S=y.indexToLoc(C,g,h);for(let $=0;$<g;$++)S[$]<l[$]?S[$]=l[$]*2-S[$]-u:S[$]>=c[$]&&(S[$]=(c[$]-1)*2-S[$]+u);S=S.map(($,R)=>$-l[R]);let I=y.locToIndex(S,m,f);x[C]=p[I]}return{dataId:e.write(x,i,n.dtype),shape:i,dtype:n.dtype}}var O2={kernelName:ga,backendName:"cpu",kernelFunc:aU};var iU=wt(((r,t)=>{let e=r%t;return r<0&&t<0||r>=0&&t>=0?e:(e+t)%t})),lU=It("Mod",iU),P2={kernelName:"Mod",backendName:"cpu",kernelFunc:lU};var L2=hd(Sg());function Uy(r){let{inputs:t,backend:e,attrs:o}=r,{logits:n}=t,{dim:s}=o,a=n.shape.length,i=s;if(i===-1&&(i=a-1),i!==a-1)throw Error(`Softmax along a non-last dimension is not yet supported. Logits was rank ${a} and dim was ${i}`);let l=y.parseAxisParam([i],n.shape),c=Gy({inputs:{x:n},backend:e,attrs:{reductionIndices:l,keepDims:!1}}),u=N.expandShapeToKeepDim(c.shape,l),p=vt({inputs:{x:c},backend:e,attrs:{shape:u}}),m=wu({inputs:{a:n,b:p},backend:e}),f=Gx({inputs:{x:m},backend:e}),d=Vo({inputs:{x:f},backend:e,attrs:{axis:l,keepDims:!1}}),g=vt({inputs:{x:d},backend:e,attrs:{shape:u}}),h=Ru({inputs:{a:f,b:g},backend:e});return e.disposeIntermediateTensorInfo(c),e.disposeIntermediateTensorInfo(p),e.disposeIntermediateTensorInfo(m),e.disposeIntermediateTensorInfo(f),e.disposeIntermediateTensorInfo(d),e.disposeIntermediateTensorInfo(g),h}var M2={kernelName:Ka,backendName:"cpu",kernelFunc:Uy};function cU(r){let{inputs:t,backend:e,attrs:o}=r,{logits:n}=t,{numSamples:s,seed:a,normalized:i}=o;U(n,"multinomial");let l=i?n:Uy({inputs:{logits:n},backend:e,attrs:{dim:-1}}),c=l.shape[0],u=l.shape[1],p=e.data.get(l.dataId).values,m=[c,s],f=y.makeZerosTypedArray(y.sizeFromShape(m),"int32");for(let d=0;d<c;++d){let g=d*u,h=new Float32Array(u-1);h[0]=p[g];for(let C=1;C<h.length;++C)h[C]=h[C-1]+p[g+C];let x=L2.alea(a.toString()),b=d*s;for(let C=0;C<s;++C){let S=x();f[b+C]=h.length;for(let I=0;I<h.length;I++)if(S<h[I]){f[b+C]=I;break}}}return i||e.disposeIntermediateTensorInfo(l),e.makeTensorInfo(m,"int32",f)}var B2={kernelName:ya,backendName:"cpu",kernelFunc:cU};var uU=be.nonMaxSuppressionV3Impl;function pU(r){let{inputs:t,backend:e,attrs:o}=r,{boxes:n,scores:s}=t,{maxOutputSize:a,iouThreshold:i,scoreThreshold:l}=o;U(n,"NonMaxSuppression");let c=e.data.get(n.dataId).values,u=e.data.get(s.dataId).values,{selectedIndices:p}=uU(c,u,a,i,l);return e.makeTensorInfo([p.length],"int32",new Int32Array(p))}var V2={kernelName:ba,backendName:"cpu",kernelFunc:pU};var mU=be.nonMaxSuppressionV4Impl;function fU(r){let{inputs:t,backend:e,attrs:o}=r,{boxes:n,scores:s}=t,{maxOutputSize:a,iouThreshold:i,scoreThreshold:l,padToMaxOutputSize:c}=o;U(n,"NonMaxSuppressionPadded");let u=e.data.get(n.dataId).values,p=e.data.get(s.dataId).values,{selectedIndices:m,validOutputs:f}=mU(u,p,a,i,l,c);return[e.makeTensorInfo([m.length],"int32",new Int32Array(m)),e.makeTensorInfo([],"int32",new Int32Array([f]))]}var z2={kernelName:wa,backendName:"cpu",kernelFunc:fU};var dU=be.nonMaxSuppressionV5Impl;function hU(r){let{inputs:t,backend:e,attrs:o}=r,{boxes:n,scores:s}=t,{maxOutputSize:a,iouThreshold:i,scoreThreshold:l,softNmsSigma:c}=o;U(n,"NonMaxSuppressionWithScore");let u=e.data.get(n.dataId).values,p=e.data.get(s.dataId).values,m=a,f=i,d=l,g=c,{selectedIndices:h,selectedScores:x}=dU(u,p,m,f,d,g);return[e.makeTensorInfo([h.length],"int32",new Int32Array(h)),e.makeTensorInfo([x.length],"float32",new Float32Array(x))]}var W2={kernelName:va,backendName:"cpu",kernelFunc:hU};function gU(r){let{inputs:t,backend:e,attrs:o}=r,{indices:n}=t,{dtype:s,depth:a,onValue:i,offValue:l}=o;U(n,"oneHot");let c=y.sizeFromShape(n.shape),u=new Float32Array(c*a);u.fill(l);let p=e.data.get(n.dataId).values;for(let m=0;m<c;++m)p[m]>=0&&p[m]<a&&(u[m*a+p[m]]=i);return e.makeTensorInfo([...n.shape,a],s,u)}var G2={kernelName:Ca,backendName:"cpu",kernelFunc:gU};function _u(r){let{inputs:t,backend:e}=r,{x:o}=t;if(o.dtype==="string")throw new Error("zerosLike is not supported for string tensors");if(o.dtype==="complex64"){let n=vr({inputs:{input:o},backend:e}),s=_u({inputs:{x:n},backend:e}),a=uo({inputs:{input:o},backend:e}),i=_u({inputs:{x:a},backend:e}),l=fe({inputs:{real:s,imag:i},backend:e});return e.disposeIntermediateTensorInfo(n),e.disposeIntermediateTensorInfo(s),e.disposeIntermediateTensorInfo(a),e.disposeIntermediateTensorInfo(i),l}else return Fu({backend:e,attrs:{shape:o.shape,value:0,dtype:o.dtype}})}var U2={kernelName:ci,backendName:"cpu",kernelFunc:_u};function H2(r){let{inputs:t,backend:e}=r,{x:o}=t;if(o.dtype==="string")throw new Error("onesLike is not supported for string tensors");if(o.dtype==="complex64"){let n=vr({inputs:{input:o},backend:e}),s=H2({inputs:{x:n},backend:e}),a=uo({inputs:{input:o},backend:e}),i=_u({inputs:{x:a},backend:e}),l=fe({inputs:{real:s,imag:i},backend:e});return e.disposeIntermediateTensorInfo(n),e.disposeIntermediateTensorInfo(s),e.disposeIntermediateTensorInfo(a),e.disposeIntermediateTensorInfo(i),l}else return Fu({backend:e,attrs:{shape:o.shape,value:1,dtype:o.dtype}})}var K2={kernelName:Sa,backendName:"cpu",kernelFunc:H2};function Hy(r){let{inputs:t,backend:e,attrs:o}=r,{axis:n}=o;if(t.length===1)return Zl({inputs:{input:t[0]},backend:e,attrs:{dim:n}});let s=t[0].shape,a=t[0].dtype;t.forEach(u=>{y.assertShapesMatch(s,u.shape,"All tensors passed to stack must have matching shapes"),y.assert(a===u.dtype,()=>"All tensors passed to stack must have matching dtypes")});let i=[],l=t.map(u=>{let p=Zl({inputs:{input:u},backend:e,attrs:{dim:n}});return i.push(p),p}),c=fs({inputs:l,backend:e,attrs:{axis:n}});return i.forEach(u=>e.disposeIntermediateTensorInfo(u)),c}var q2={kernelName:Ta,backendName:"cpu",kernelFunc:Hy};function xU(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{paddings:s,constantValue:a}=o;U(n,"pad");let i=s.map((b,C)=>b[0]+n.shape[C]+b[1]),l=s.map(b=>b[0]),c=e.data.get(n.dataId).values,u=y.sizeFromShape(n.shape),p=n.shape.length,m=y.computeStrides(n.shape),f=y.sizeFromShape(i),d=i.length,g=y.computeStrides(i),h=y.getTypedArrayFromDType(n.dtype,f);a!==0&&h.fill(a);for(let b=0;b<u;b++){let S=y.indexToLoc(b,p,m).map(($,R)=>$+l[R]),I=y.locToIndex(S,d,g);h[I]=c[b]}return{dataId:e.write(h,i,n.dtype),shape:i,dtype:n.dtype}}var Hf={kernelName:Na,backendName:"cpu",kernelFunc:xU};var yU=wt((r,t)=>Math.pow(r,t)),bU=It("Pow",yU),j2={kernelName:"Pow",backendName:"cpu",kernelFunc:bU};function wU(r){let{inputs:t,backend:e,attrs:o}=r,{paramsNestedSplits:n,paramsDenseValues:s,indices:a}=t,{outputRaggedRank:i}=o,l=n.map(x=>e.data.get(x.dataId).values),c=n.map(x=>x.shape),u=e.data.get(s.dataId).values,p=e.data.get(a.dataId).values,[m,f,d]=tm(l,c,u,s.shape,s.dtype,p,a.shape,i),g=m.map(x=>e.makeTensorInfo([x.length],"int32",x)),h=e.makeTensorInfo(d,s.dtype,f);return g.concat([h])}var X2={kernelName:$a,backendName:"cpu",kernelFunc:wU};function vU(r){let{inputs:t,backend:e}=r,{starts:o,limits:n,deltas:s}=t,a=e.data.get(o.dataId).values,i=e.data.get(n.dataId).values,l=e.data.get(s.dataId).values,[c,u]=em(a,o.shape,o.dtype,i,n.shape,l,s.shape),p=e.makeTensorInfo([c.length],"int32",c),m=e.makeTensorInfo([u.length],o.dtype,u);return[p,m]}var Y2={kernelName:Ra,backendName:"cpu",kernelFunc:vU};function SU(r){let{inputs:t,backend:e,attrs:o}=r,{shape:n,values:s,defaultValue:a,rowPartitionTensors:i}=t,{rowPartitionTypes:l}=o,c=e.data.get(n.dataId).values,u=e.data.get(s.dataId).values,p=e.data.get(a.dataId).values,m=i.map(h=>e.data.get(h.dataId).values),f=i.map(h=>h.shape),[d,g]=rm(c,n.shape,u,s.shape,s.dtype,p,a.shape,m,f,l);return e.makeTensorInfo(d,s.dtype,g)}var Q2={kernelName:Aa,backendName:"cpu",kernelFunc:SU};function CU(r){let{backend:t,attrs:e}=r,{start:o,stop:n,dtype:s,step:a}=e,i=om(o,n,a,s);return t.makeTensorInfo([i.length],s,i)}var Z2={kernelName:Fa,backendName:"cpu",kernelFunc:CU};var TU=ut(In,r=>1/r),J2={kernelName:In,backendName:"cpu",kernelFunc:TU};function NU(r){let{inputs:t,backend:e,attrs:o}=r,{images:n}=t,{alignCorners:s,halfPixelCenters:a,size:i}=o;U(n,"resizeBilinear");let l=y.computeStrides(n.shape),[c,u]=i,[p,m,f,d]=n.shape,g=e.data.get(n.dataId).values,h=new Float32Array(y.sizeFromShape([p,c,u,d])),x=[s&&c>1?m-1:m,s&&u>1?f-1:f],b=[s&&c>1?c-1:c,s&&u>1?u-1:u],C=0,S=x[0]/b[0],I=x[1]/b[1];for(let $=0;$<p;$++)for(let R=0;R<c;R++){let A;a?A=S*(R+.5)-.5:A=S*R;let F=Math.max(0,Math.floor(A)),_=A-F,O=Math.min(m-1,Math.ceil(A)),M=$*l[0]+F*l[1],P=$*l[0]+O*l[1];for(let B=0;B<u;B++){let V;a?V=I*(B+.5)-.5:V=I*B;let z=Math.max(0,Math.floor(V)),G=V-z,W=Math.min(f-1,Math.ceil(V)),H=M+z*l[2],X=P+z*l[2],j=M+W*l[2],J=P+W*l[2];for(let Y=0;Y<d;Y++){let et=g[H+Y],Q=g[X+Y],nt=g[j+Y],pt=g[J+Y],gt=et+(nt-et)*G,dt=Q+(pt-Q)*G,St=gt+(dt-gt)*_;h[C++]=St}}}return e.makeTensorInfo([p,c,u,d],"float32",h)}var tE={kernelName:Pa,backendName:"cpu",kernelFunc:NU};function IU(r){let{inputs:t,backend:e,attrs:o}=r,{images:n,dy:s}=t,{alignCorners:a}=o;U([s,n],"resizeBilinearGrad");let i=y.computeStrides(n.shape),[l,c,u,p]=n.shape,[,m,f]=s.shape,d=new Float32Array(l*c*u*p),g=[a&&m>1?c-1:c,a&&f>1?u-1:u],h=[a&&m>1?m-1:m,a&&f>1?f-1:f],x=g[0]/h[0],b=g[1]/h[1],C=e.data.get(s.dataId).values,S=0;for(let I=0;I<l;I++){let $=I*i[0];for(let R=0;R<m;R++){let A=R*x,F=Math.floor(A),_=Math.min(Math.ceil(A),c-1),O=$+F*i[1],M=$+_*i[1],P=A-F,B=1-P;for(let V=0;V<f;V++){let z=V*b,G=Math.floor(z),W=Math.min(Math.ceil(z),u-1),H=z-G,X=1-H,j=O+G*i[2],J=O+W*i[2],Y=M+G*i[2],et=M+W*i[2],Q=B*X,nt=B*H,pt=P*X,gt=P*H;for(let dt=0;dt<p;dt++){let St=C[S++];d[j+dt]+=St*Q,d[J+dt]+=St*nt,d[Y+dt]+=St*pt,d[et+dt]+=St*gt}}}}return e.makeTensorInfo([l,u,c,p],"float32",d)}var eE={kernelName:hc,backendName:"cpu",kernelFunc:IU};function kU(r){let{inputs:t,backend:e,attrs:o}=r,{images:n}=t,{alignCorners:s,halfPixelCenters:a,size:i}=o;U(n,"resizeNearestNeighbor");let l=y.computeStrides(n.shape),[c,u]=i,[p,m,f,d]=n.shape,g=e.data.get(n.dataId).values,h=new Float32Array(p*c*u*d),x=[s&&c>1?m-1:m,s&&u>1?f-1:f],b=[s&&c>1?c-1:c,s&&u>1?u-1:u],C=x[0]/b[0],S=x[1]/b[1],I=0;for(let $=0;$<p;$++){let R=$*l[0];for(let A=0;A<c;A++){let F=a?C*(A+.5):C*A,_=Math.min(m-1,s?Math.round(F):Math.floor(F));a&&(_=Math.max(0,_));let O=R+_*l[1];for(let M=0;M<u;M++){let P=a?S*(M+.5):S*M,B=Math.min(f-1,s?Math.round(P):Math.floor(P));a&&(B=Math.max(0,B));let V=O+B*l[2];for(let z=0;z<d;z++){let G=g[V+z];h[I++]=G}}}}return e.makeTensorInfo([p,c,u,d],n.dtype,h)}var rE={kernelName:Oa,backendName:"cpu",kernelFunc:kU};function EU(r){let{inputs:t,backend:e,attrs:o}=r,{images:n,dy:s}=t,{alignCorners:a}=o;U([s,n],"resizeNearestNeighborGrad");let i=y.computeStrides(n.shape),l=y.computeStrides(s.shape),[c,u,p,m]=n.shape,[,f,d]=s.shape,g=new Float32Array(c*u*p*m),h=e.data.get(s.dataId).values,x=[a&&f>1?u-1:u,a&&d>1?p-1:p],b=[a&&f>1?f-1:f,a&&d>1?d-1:d],C=x[0]/b[0],S=x[1]/b[1],I=1/C,$=1/S,R=Math.ceil(I)*2+2,A=Math.ceil($)*2+2;for(let F=0;F<c;F++){let _=F*i[0];for(let O=0;O<u;O++){let M=_+O*i[1],P=Math.floor(O*I),B=Math.floor(P-R/2);for(let V=0;V<p;V++){let z=M+V*i[2],G=Math.floor(V*$),W=Math.floor(G-A/2);for(let H=0;H<m;H++){let X=0;for(let j=0;j<R;j++){let J=j+B;if(J<0||J>=f)continue;let Y=_+J*l[1],et=J*C,Q=Math.min(u-1,a?Math.round(et):Math.floor(et));if(O===Q)for(let nt=0;nt<A;nt++){let pt=nt+W;if(pt<0||pt>=d)continue;let gt=Y+pt*l[2],dt=pt*S,St=Math.min(p-1,a?Math.round(dt):Math.floor(dt));V===St&&(X+=h[gt+H])}}g[z+H]=X}}}}return e.makeTensorInfo(n.shape,n.dtype,g)}var oE={kernelName:dc,backendName:"cpu",kernelFunc:EU};function $U(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{dims:s}=o;U(n,"reverse");let a=n.shape.length,i=y.parseAxisParam(s,n.shape);if(a===0)return Ee({inputs:{x:n},backend:e});let l=new $t(n.shape,n.dtype),c=e.bufferSync(n);for(let u=0;u<l.size;u++){let p=l.indexToLoc(u),m=p.slice();i.forEach(f=>m[f]=n.shape[f]-1-m[f]),l.set(c.get(...m),...p)}return e.makeTensorInfo(l.shape,l.dtype,l.values)}var nE={kernelName:Ma,backendName:"cpu",kernelFunc:$U};var sE={kernelName:ui,backendName:"cpu",kernelFunc:({inputs:r,attrs:t,backend:e})=>{let{image:o}=r,{radians:n,fillValue:s,center:a}=t,i=e,l=y.getTypedArrayFromDType(o.dtype,y.sizeFromShape(o.shape)),[c,u,p,m]=o.shape,[f,d]=N.getImageCenter(a,u,p),g=255,h=Math.sin(n),x=Math.cos(n),b=i.data.get(o.dataId).values;for(let S=0;S<c;S++){let I=S*p*u*m;for(let $=0;$<u;$++){let R=$*(p*m);for(let A=0;A<p;A++){let F=A*m;for(let _=0;_<m;_++){let O=[c,$,A,_],M=O[2],P=O[1],B=(M-f)*x-(P-d)*h,V=(M-f)*h+(P-d)*x;B=Math.round(B+f),V=Math.round(V+d);let z=s;if(typeof s!="number"&&(_===3?z=g:z=s[_]),B>=0&&B<p&&V>=0&&V<u){let W=V*(p*m),H=B*m,X=I+W+H+_;z=b[X]}let G=I+R+F+_;l[G]=z}}}}return{dataId:i.write(l,o.shape,o.dtype),shape:o.shape,dtype:o.dtype}}};var RU=ut($n,r=>{let t=Math.floor(r);return r-t<.5?Math.floor(r):r-t>.5?Math.ceil(r):t%2===0?t:t+1}),aE={kernelName:$n,backendName:"cpu",kernelFunc:RU};function AU(r){let{inputs:t,backend:e,attrs:o}=r,{indices:n,updates:s}=t,{shape:a}=o,{sliceRank:i,numUpdates:l,sliceSize:c,strides:u,outputSize:p}=N.calculateShapes(s,n,a),m=!0,f=e.bufferSync(n),d=e.bufferSync(s),g=Mr(f,d,a,p,c,l,i,u,0,m);return e.makeTensorInfo(a,g.dtype,g.values)}var iE={kernelName:La,backendName:"cpu",kernelFunc:AU};function FU(r,t){let e=0,o=r.length,n=0;for(;e<o;)n=Math.floor((e+o)/2),r[n]<t?e=n+1:o=n;return o}function _U(r,t){let e=0,o=r.length,n=0;for(;e<o;)n=Math.floor((e+o)/2),r[n]<=t?e=n+1:o=n;return o}function lE(r,t,e,o,n,s){let a=y.getArrayFromDType("int32",e*n);for(let i=0;i<e;++i){let l=r.slice(i*o,(i+1)*o),c=i*n;for(let u=0;u<n;++u)a[c+u]=s==="left"?FU(l,t[u+c]):_U(l,t[u+c])}return a}function DU(r){let{inputs:t,backend:e,attrs:o}=r,{sortedSequence:n,values:s}=t,{side:a}=o,i=e.data.get(n.dataId).values,l=e.data.get(s.dataId).values,c=lE(i,l,n.shape[0],n.shape[1],s.shape[1],a);return e.makeTensorInfo(s.shape,"int32",c)}var cE={kernelName:Va,backendName:"cpu",kernelFunc:DU};function OU(r){let{inputs:t,backend:e}=r,{condition:o,t:n,e:s}=t;U([o,n,s],"select");let a=o.shape.length,i=e.data.get(o.dataId).values,l=e.data.get(n.dataId).values,c=e.data.get(s.dataId).values,u=se(n.dtype,s.dtype),p=y.makeZerosTypedArray(y.sizeFromShape(n.shape),u),m=0,f=a===0||a>1||n.shape.length===1?1:y.sizeFromShape(n.shape.slice(1));for(let d=0;d<i.length;d++)for(let g=0;g<f;g++)i[d]===1?p[m++]=l[d]:p[m++]=c[d];return e.makeTensorInfo(n.shape,u,p)}var uE={kernelName:za,backendName:"cpu",kernelFunc:OU};var PU=N.SELU_SCALEALPHA,MU=N.SELU_SCALE,LU=ut(An,r=>r>=0?MU*r:PU*(Math.exp(r)-1)),pE={kernelName:An,backendName:"cpu",kernelFunc:LU};var BU=ut(_n,r=>r<0?-1:r>0?1:0),mE={kernelName:_n,backendName:"cpu",kernelFunc:BU};var VU=ut("Sin",r=>Math.sin(r)),fE={kernelName:"Sin",backendName:"cpu",kernelFunc:VU};var zU=ut(Fn,r=>Math.sinh(r)),dE={kernelName:Fn,backendName:"cpu",kernelFunc:zU};var WU=11920928955078125e-23,hE=Math.log(WU)+2,GU=ut(On,r=>{let t=r>-hE,e=r<hE,o=Math.exp(r),n;return e?n=o:t?n=r:n=Math.log(1+o),n}),gE={kernelName:On,backendName:"cpu",kernelFunc:GU};function UU(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{blockShape:s,paddings:a}=o;U([n],"spaceToBatchND");let i=y.sizeFromShape(s),l=[[0,0]];l.push(...a);for(let $=1+s.length;$<n.shape.length;++$)l.push([0,0]);let c=Hf.kernelFunc({inputs:{x:n},backend:e,attrs:{paddings:l,constantValue:0}}),u=N.getReshaped(c.shape,s,i,!1),p=N.getPermuted(u.length,s.length,!1),m=N.getReshapedPermuted(c.shape,s,i,!1),g=vt({inputs:{x:c},backend:e,attrs:{shape:u}}),b=Xt({inputs:{x:g},backend:e,attrs:{perm:p}}),I=vt({inputs:{x:b},backend:e,attrs:{shape:m}});return e.disposeIntermediateTensorInfo(c),e.disposeIntermediateTensorInfo(g),e.disposeIntermediateTensorInfo(b),I}var xE={kernelName:Ua,backendName:"cpu",kernelFunc:UU};function HU(r){let{inputs:t,backend:e}=r,{indices:o,values:n,denseShape:s,defaultValue:a}=t;if(s.shape.length!==1)throw new Error(`Dense shape must be a vector, saw:
        ${s.shape}`);if(o.shape.length!==2)throw new Error(`Indices must be a matrix, saw:
        ${o.shape}`);if(n.shape.length!==1)throw new Error(`Values must be a vector, saw:
        ${n.shape}`);if(a.shape.length!==0)throw new Error(`Default value must be a scalar, saw:
        ${a.shape}`);let i=e.data.get(o.dataId).values,l=e.data.get(n.dataId).values,c=e.data.get(s.dataId).values,u=e.data.get(a.dataId).values[0],[p,m,f,d,g]=nm(i,o.shape,o.dtype,l,n.dtype,c,u);return[e.makeTensorInfo(m,o.dtype,p),e.makeTensorInfo([m[0]],n.dtype,f),e.makeTensorInfo([d.length],"bool",new Uint8Array(d.map(h=>Number(h)))),e.makeTensorInfo([g.length],o.dtype,new Int32Array(g))]}var yE={kernelName:qa,backendName:"cpu",kernelFunc:HU};function KU(r){let{inputs:t,backend:e}=r,{inputIndices:o,inputShape:n,newShape:s}=t;if(o.shape.length!==2)throw new Error(`Input indices should be a matrix but received shape
        ${o.shape}`);if(n.shape.length!==1)throw new Error(`Input shape should be a vector but received shape
        ${n.shape}`);if(s.shape.length!==1)throw new Error(`Target shape should be a vector but received shape ${s.shape}`);let a=Array.from(e.data.get(n.dataId).values),i=e.data.get(o.dataId).values,l=Array.from(e.data.get(s.dataId).values),[c,u,p]=sm(i,o.shape,o.dtype,a,l);return[e.makeTensorInfo(u,o.dtype,c),e.makeTensorInfo([p.length],s.dtype,new Int32Array(p))]}var bE={kernelName:ja,backendName:"cpu",kernelFunc:KU};function qU(r){let{inputs:t,backend:e}=r,{data:o,indices:n,segmentIds:s}=t;if(o.shape.length<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.shape.length!==1)throw new Error(`Indices should be a vector but received shape
          ${n.shape}`);if(s.shape.length!==1)throw new Error(`Segment ids should be a vector but received shape
          ${s.shape}`);if(n.shape[0]!==s.shape[0])throw new Error("segmentIds and indices should have same size.");let a=e.data.get(o.dataId).values,i=e.data.get(n.dataId).values,l=e.data.get(s.dataId).values,[c,u]=zl(a,o.shape,o.dtype,i,l,!0);return e.makeTensorInfo(u,o.dtype,c)}var wE={kernelName:Xa,backendName:"cpu",kernelFunc:qU};function jU(r){let{inputs:t,backend:e}=r,{data:o,indices:n,segmentIds:s}=t;if(o.shape.length<1)throw new Error("Data should be at least 1 dimensional but received scalar");if(n.shape.length!==1)throw new Error(`Indices should be a vector but received shape
         ${n.shape}`);if(s.shape.length!==1)throw new Error(`Segment ids should be a vector but received shape
         ${s.shape}`);if(n.shape[0]!==s.shape[0])throw new Error("segmentIds and indices should have same size.");let a=e.data.get(o.dataId).values,i=e.data.get(n.dataId).values,l=e.data.get(s.dataId).values,[c,u]=zl(a,o.shape,o.dtype,i,l);return e.makeTensorInfo(u,o.dtype,c)}var vE={kernelName:Ya,backendName:"cpu",kernelFunc:jU};function XU(r){let{inputs:t,backend:e,attrs:o}=r,{sparseIndices:n,sparseValues:s,defaultValue:a}=t,{outputShape:i}=o,{sliceRank:l,numUpdates:c,sliceSize:u,strides:p,outputSize:m}=N.calculateShapes(s,n,i),f=!1,d=e.bufferSync(n),g;switch(s.dtype){case"bool":{let h=e.bufferSync(s),x=!!e.data.get(a.dataId).values[0];g=Mr(d,h,i,m,u,c,l,p,x,f);break}case"float32":{let h=e.bufferSync(s),x=e.data.get(a.dataId).values[0];g=Mr(d,h,i,m,u,c,l,p,x,f);break}case"int32":{let h=e.bufferSync(s),x=e.data.get(a.dataId).values[0];g=Mr(d,h,i,m,u,c,l,p,x,f);break}case"string":{let h=e.bufferSync(s),x=y.decodeString(e.data.get(a.dataId).values[0]);g=Mr(d,h,i,m,u,c,l,p,x,f);break}default:throw new Error(`Unsupported type ${s.dtype}`)}return e.makeTensorInfo(i,g.dtype,g.values)}var SE={kernelName:Qa,backendName:"cpu",kernelFunc:XU};function YU(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{numOrSizeSplits:s,axis:a}=o,i=y.parseAxisParam(a,n.shape)[0],l=N.prepareSplitSize(n,s,i),c=new Array(n.shape.length).fill(0),u=n.shape.slice();return l.map(p=>{let m=[...u];m[i]=p;let f=Tr({inputs:{x:n},backend:e,attrs:{begin:c,size:m}});return c[i]+=p,f})}var CE={kernelName:Ha,backendName:"cpu",kernelFunc:YU};var TE={kernelName:gc,backendName:"cpu",kernelFunc:({inputs:r,backend:t})=>{let{x:e}=r,o=t;U(e,"square");let n=o.data.get(e.dataId).values,s=new Float32Array(n.length);for(let i=0;i<n.length;++i){let l=n[i];s[i]=l*l}return{dataId:o.write(s,e.shape,e.dtype),shape:e.shape,dtype:e.dtype}}};var QU=ut(Vn,(r,t)=>{let e=t;return isNaN(r)?NaN:r>0?1:e.alpha}),NE={kernelName:Vn,backendName:"cpu",kernelFunc:QU};function ZU(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{begin:s,end:a,strides:i,beginMask:l,endMask:c,ellipsisMask:u,newAxisMask:p,shrinkAxisMask:m}=o;U(n,"stridedSlice");let{finalShapeSparse:f,finalShape:d,isIdentity:g,sliceDim0:h,isSimpleSlice:x,begin:b,end:C,strides:S}=me.sliceInfo(n.shape,s,a,i,l,c,u,p,m),I;if(g)I=vt({inputs:{x:n},backend:e,attrs:{shape:d}});else if(h||x){y.assert(n.shape.length>=1,()=>`Input must have rank at least 1, got: ${n.shape.length}`);let $=me.computeOutShape(b,C,S),R=Tr({inputs:{x:n},backend:e,attrs:{begin:b,size:$}});I=vt({inputs:{x:R},backend:e,attrs:{shape:d}}),e.disposeIntermediateTensorInfo(R)}else{let $=e.bufferSync(n),R=am(f,$,S,b);I=e.makeTensorInfo(d,R.dtype,R.values)}return I}var IE={kernelName:Za,backendName:"cpu",kernelFunc:ZU};function JU(r){let{inputs:t,backend:e,attrs:o}=r,{separator:n,nGramWidths:s,leftPad:a,rightPad:i,padWidth:l,preserveShortSequences:c}=o,{data:u,dataSplits:p}=t,m=e.data.get(u.dataId).values,f=e.data.get(p.dataId).values,[d,g]=im(m,f,n,s,a,i,l,c);return[e.makeTensorInfo([d.length],"string",d),e.makeTensorInfo(p.shape,"int32",g)]}var kE={kernelName:Ja,backendName:"cpu",kernelFunc:JU};function tH(r){let{inputs:t,backend:e,attrs:o}=r,{skipEmpty:n}=o,{input:s,delimiter:a}=t;if(s.dtype!=="string")throw new Error("Input must be of datatype string");if(s.shape.length!==1)throw new Error(`Input must be a vector, got shape: ${s.shape}`);if(a.shape.length!==0)throw new Error(`Delimiter must be a scalar, got shape: ${a.shape}`);let i=e.data.get(s.dataId).values,l=e.data.get(a.dataId).values[0],[c,u,p]=lm(i,l,n),m=u.length;return[e.makeTensorInfo([m,2],"int32",c),e.makeTensorInfo([m],"string",u),e.makeTensorInfo([2],"int32",new Int32Array(p))]}var EE={kernelName:ti,backendName:"cpu",kernelFunc:tH};function eH(r){let{inputs:t,backend:e,attrs:o}=r,{numBuckets:n}=o,{input:s}=t;if(s.dtype!=="string")throw new Error("Input must be of datatype string");if(n<=0)throw new Error("Number of buckets must be at least 1");let a=e.data.get(s.dataId).values,i=cm(a,n);return e.makeTensorInfo(s.shape,"int32",i)}var $E={kernelName:ei,backendName:"cpu",kernelFunc:eH};var rH=ut("Tan",r=>Math.tan(r)),RE={kernelName:"Tan",backendName:"cpu",kernelFunc:rH};var oH=ut(Bn,r=>Math.tanh(r)),AE={kernelName:Bn,backendName:"cpu",kernelFunc:oH};function nH(r){let{inputs:t,backend:e}=r,{tensor:o,indices:n,updates:s}=t,{sliceRank:a,numUpdates:i,sliceSize:l,strides:c,outputSize:u}=N.calculateShapes(s,n,o.shape),p=!1,m=e.bufferSync(n),f=e.bufferSync(s),d=e.bufferSync(o),g=Mr(m,f,o.shape,u,l,i,a,c,d,p);return e.makeTensorInfo(o.shape,g.dtype,g.values)}var FE={kernelName:Ba,backendName:"cpu",kernelFunc:nH};function sH(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{reps:s}=o;U(n,"tile");let a=um(e.bufferSync(n),s);return e.makeTensorInfo(a.shape,a.dtype,a.values)}var _E={kernelName:bo,backendName:"cpu",kernelFunc:sH};function aH(r){let{inputs:t,backend:e,attrs:o}=r,{x:n}=t,{k:s,sorted:a}=o;U(n,"topk");let i=e.data.get(n.dataId).values,[l,c]=pm(i,n.shape,n.dtype,s,a);return[e.makeTensorInfo(l.shape,l.dtype,l.values),e.makeTensorInfo(c.shape,c.dtype,c.values)]}var DE={kernelName:ni,backendName:"cpu",kernelFunc:aH};function iH(r){let{inputs:t,attrs:e,backend:o}=r,{image:n,transforms:s}=t,{interpolation:a,fillMode:i,fillValue:l,outputShape:c}=e,[u,p,m,f]=n.shape,[d,g]=c??[p,m],h=[u,d,g,f],x=y.computeStrides(n.shape),b=x[0],C=x[1],S=x[2],I=y.computeStrides(h),$=I[0],R=I[1],A=I[2],F=y.getTypedArrayFromDType(n.dtype,y.sizeFromShape(h));F.fill(l);let _=o.data.get(n.dataId).values,O=o.data.get(s.dataId).values;for(let P=0;P<u;++P){let B=s.shape[0]===1?O:O.subarray(P*8,P*8+8);for(let V=0;V<d;++V)for(let z=0;z<g;++z)for(let G=0;G<f;++G){let W,H=B[6]*z+B[7]*V+1;if(H===0)continue;let X=(B[0]*z+B[1]*V+B[2])/H,j=(B[3]*z+B[4]*V+B[5])/H,J=OE(X,m,i),Y=OE(j,p,i);switch(a){case"nearest":W=mH(_,p,m,b,C,S,P,Y,J,G,l);break;case"bilinear":W=fH(_,p,m,b,C,S,P,Y,J,G,l);break;default:throw new Error(`Error in Transform: Expect 'nearest' or 'bilinear', but got ${a}`)}let et=P*$+V*R+z*A+G;F[et]=W}return o.makeTensorInfo(h,n.dtype,F)}return{dataId:o.write(F,h,n.dtype),shape:n.shape,dtype:n.dtype}}var PE={kernelName:si,backendName:"cpu",kernelFunc:iH};function OE(r,t,e){switch(e){case"reflect":return lH(r,t);case"wrap":return cH(r,t);case"nearest":return pH(r,t);default:return uH(r,t)}}function lH(r,t){let e=r;if(e<0)if(t<=1)e=0;else{let o=2*t;e<o&&(e=o*Math.trunc(-e/o)+e),e=e<-t?e+o:-e-1}else if(e>t-1)if(t<=1)e=0;else{let o=2*t;e-=o*Math.trunc(e/o),e>=t&&(e=o-e-1)}return y.clamp(0,e,t-1)}function cH(r,t){let e=r;if(e<0)if(t<=1)e=0;else{let o=t-1;e+=t*(Math.trunc(-e/o)+1)}else if(e>t-1)if(t<=1)e=0;else{let o=t-1;e-=t*Math.trunc(e/o)}return y.clamp(0,e,t-1)}function uH(r,t){return r}function pH(r,t){return y.clamp(0,r,t-1)}function Du(r,t,e,o,n,s,a,i,l,c,u){let p=a*o+i*n+l*s+c;return 0<=i&&i<t&&0<=l&&l<e?r[p]:u}function mH(r,t,e,o,n,s,a,i,l,c,u){let p=Math.round(i),m=Math.round(l);return Du(r,t,e,o,n,s,a,p,m,c,u)}function fH(r,t,e,o,n,s,a,i,l,c,u){let p=Math.floor(i),m=Math.floor(l),f=p+1,d=m+1,g=(d-l)*Du(r,t,e,o,n,s,a,p,m,c,u)+(l-m)*Du(r,t,e,o,n,s,a,p,d,c,u),h=(d-l)*Du(r,t,e,o,n,s,a,f,m,c,u)+(l-m)*Du(r,t,e,o,n,s,a,f,d,c,u);return(f-i)*g+(i-p)*h}function dH(r){let{inputs:t,attrs:e,backend:o}=r,{axis:n}=e,{x:s}=t;U(s,"unique");let a=o.data.get(s.dataId).values,{outputValues:i,outputShape:l,indices:c}=mm(a,n,s.shape,s.dtype);return[o.makeTensorInfo(l,s.dtype,i),o.makeTensorInfo([c.length],"int32",c)]}var ME={kernelName:ai,backendName:"cpu",kernelFunc:dH};function hH(r){let{inputs:t,backend:e,attrs:o}=r,{value:n}=t,{axis:s}=o;s<0&&(s+=n.shape.length);let a=n.shape.length,i=n.shape[s],l=new Array(a-1),c=0;for(let f=0;f<a;f++)f!==s&&(l[c++]=n.shape[f]);let u=new Array(a).fill(0),p=n.shape.slice();p[s]=1;let m=new Array(i);for(let f=0;f<m.length;f++){u[s]=f;let d=Tr({inputs:{x:n},backend:e,attrs:{begin:u,size:p}});m[f]=vt({inputs:{x:d},backend:e,attrs:{shape:l}}),e.disposeIntermediateTensorInfo(d)}return m}var LE={kernelName:ii,backendName:"cpu",kernelFunc:hH};function gH(r){let{inputs:t,backend:e,attrs:o}=r,{x:n,segmentIds:s}=t,{numSegments:a}=o;U(n,"unsortedSegmentSum");let i=n.shape.length,l=s.shape.length,c=[],u=[],p=i-l,m=s;for(let d=0;d<p;++d){let g=Zl({inputs:{input:m},backend:e,attrs:{dim:d+1}});m=g,u.push(g)}for(let d=0;d<a;++d){let g=y.createScalarValue(d,"int32"),h=e.makeTensorInfo([],"int32",g),x=zx({inputs:{a:h,b:m},backend:e}),b=Sr({inputs:{x},backend:e,attrs:{dtype:"float32"}}),C=Li({inputs:{a:b,b:n},backend:e}),S=Vo({inputs:{x:C},backend:e,attrs:{axis:0,keepDims:!1}});c.push(S),u.push(h),u.push(x),u.push(b),u.push(C),u.push(S)}let f=Hy({inputs:c,backend:e,attrs:{axis:0}});return u.forEach(d=>e.disposeIntermediateTensorInfo(d)),f}var BE={kernelName:li,backendName:"cpu",kernelFunc:gH};var xH=[uk,P1,pk,mk,z1,fk,dk,hk,gk,xk,yk,bk,wk,vk,Sk,Tk,Nk,Ik,kk,ck,Ek,$k,Rk,W1,Ak,V1,G1,Fk,M1,_k,Ok,Pk,Mk,Lk,Bk,Vk,zk,Wk,Gk,Uk,Hk,Kk,qk,jk,Xk,Yk,Qk,Zk,Jk,t2,e2,r2,n2,ok,s2,U1,a2,H1,i2,K1,l2,c2,u2,q1,j1,p2,m2,f2,d2,X1,Y1,L1,h2,Dk,g2,x2,y2,nk,Q1,Z1,b2,J1,w2,v2,S2,C2,T2,N2,I2,tS,k2,E2,$2,R2,F2,_2,D2,eS,O2,P2,B2,rS,oS,V2,z2,W2,nS,G2,K2,q2,Hf,j2,sk,aS,X2,Y2,Q2,Z2,B1,Au,J2,ak,ik,lk,tE,eE,rE,oE,nE,sE,aE,pS,iE,cE,uE,pE,fS,mE,fE,dE,dS,M2,gE,xE,yE,bE,wE,vE,SE,CE,gS,TE,xS,yS,NE,IE,kE,EE,$E,bS,o2,RE,AE,FE,_E,DE,PE,sS,ME,LE,BE,U2];for(let r of xH)cl(r);var hR={};kt(hR,{SupportedModels:()=>He,TrackerType:()=>xs,calculators:()=>Nq,createDetector:()=>Tq,movenet:()=>Iq,util:()=>eq});var Kf=class{constructor(){throw new Error('The MediaPipe runtime is not bundled; use runtime "tfjs".')}};var yH=D();yH.registerFlag("KEEP_INTERMEDIATE_TENSORS",()=>!1,r=>{r&&console.warn("Keep intermediate tensors is ON. This will print the values of all intermediate tensors during model inference. Not all models support this mode. For details, check e2e/benchmarks/ model_config.js. This significantly impacts performance.")});var er;(function(r){r[r.DT_INVALID=0]="DT_INVALID",r[r.DT_FLOAT=1]="DT_FLOAT",r[r.DT_DOUBLE=2]="DT_DOUBLE",r[r.DT_INT32=3]="DT_INT32",r[r.DT_UINT8=4]="DT_UINT8",r[r.DT_INT16=5]="DT_INT16",r[r.DT_INT8=6]="DT_INT8",r[r.DT_STRING=7]="DT_STRING",r[r.DT_COMPLEX64=8]="DT_COMPLEX64",r[r.DT_INT64=9]="DT_INT64",r[r.DT_BOOL=10]="DT_BOOL",r[r.DT_QINT8=11]="DT_QINT8",r[r.DT_QUINT8=12]="DT_QUINT8",r[r.DT_QINT32=13]="DT_QINT32",r[r.DT_BFLOAT16=14]="DT_BFLOAT16",r[r.DT_QINT16=15]="DT_QINT16",r[r.DT_QUINT16=16]="DT_QUINT16",r[r.DT_UINT16=17]="DT_UINT16",r[r.DT_COMPLEX128=18]="DT_COMPLEX128",r[r.DT_HALF=19]="DT_HALF",r[r.DT_RESOURCE=20]="DT_RESOURCE",r[r.DT_VARIANT=21]="DT_VARIANT",r[r.DT_UINT32=22]="DT_UINT32",r[r.DT_UINT64=23]="DT_UINT64",r[r.DT_FLOAT_REF=101]="DT_FLOAT_REF",r[r.DT_DOUBLE_REF=102]="DT_DOUBLE_REF",r[r.DT_INT32_REF=103]="DT_INT32_REF",r[r.DT_UINT8_REF=104]="DT_UINT8_REF",r[r.DT_INT16_REF=105]="DT_INT16_REF",r[r.DT_INT8_REF=106]="DT_INT8_REF",r[r.DT_STRING_REF=107]="DT_STRING_REF",r[r.DT_COMPLEX64_REF=108]="DT_COMPLEX64_REF",r[r.DT_INT64_REF=109]="DT_INT64_REF",r[r.DT_BOOL_REF=110]="DT_BOOL_REF",r[r.DT_QINT8_REF=111]="DT_QINT8_REF",r[r.DT_QUINT8_REF=112]="DT_QUINT8_REF",r[r.DT_QINT32_REF=113]="DT_QINT32_REF",r[r.DT_BFLOAT16_REF=114]="DT_BFLOAT16_REF",r[r.DT_QINT16_REF=115]="DT_QINT16_REF",r[r.DT_QUINT16_REF=116]="DT_QUINT16_REF",r[r.DT_UINT16_REF=117]="DT_UINT16_REF",r[r.DT_COMPLEX128_REF=118]="DT_COMPLEX128_REF",r[r.DT_HALF_REF=119]="DT_HALF_REF",r[r.DT_RESOURCE_REF=120]="DT_RESOURCE_REF",r[r.DT_VARIANT_REF=121]="DT_VARIANT_REF",r[r.DT_UINT32_REF=122]="DT_UINT32_REF",r[r.DT_UINT64_REF=123]="DT_UINT64_REF"})(er||(er={}));var VE;(function(r){let t;(function(e){e[e.LEGACY=0]="LEGACY",e[e.V1=1]="V1",e[e.V2=2]="V2"})(t=r.CheckpointFormatVersion||(r.CheckpointFormatVersion={}))})(VE||(VE={}));var wH={};function qf(r){return wH[r]}function w(r,t,e,o,n){let s=t.inputParams[r];if(s&&s.inputIndexStart!==void 0){let i=s.inputIndexStart,l=s.inputIndexEnd===0?void 0:s.inputIndexEnd===void 0?i+1:s.inputIndexEnd,c=i<0?t.inputNames.length+i:i;if(s.type==="tensor")return le(t.inputNames[c],e,o,n);if(s.type==="tensors"){let m=t.inputs.slice(i,l);return t.inputNames.slice(i,l).filter((d,g)=>{var h;return((h=m[g])===null||h===void 0?void 0:h.op)!=="NoOp"}).map(d=>le(d,e,o,n))}let u=le(t.inputNames[c],e,o,n),p=u.dataSync();return s.type==="number"?p[0]:y.toNestedArray(u.shape,p)}let a=t.attrParams[r];return a&&a.value}function le(r,t,e,o){let[n,s]=Ge(r,e);if(o!=null){let i=o.getHashTableHandleByName(n);if(i!=null)return i}let a=e.currentContextIds.find(i=>!!t[jf(n,i)]);return a!==void 0?t[jf(n,a)][s]:void 0}function Ky(r,t,e){return t[jf(r,e.currentContextId)]}function Vr(r,t){let[e,o,n]=Ge(r,t);return[jf(e,t&&t.currentContextId),o,n]}function jf(r,t){return t?`${r}-${t}`:r}function Ge(r,t){if(r==="")return["",0,void 0];let e=t!=null&&t.parseNodeNameCache!=null;if(e){let s=t.parseNodeNameCache.get(r);if(s!=null)return s}let o=r.split(":"),n;if(o.length===1)n=[r,0,void 0];else{let s=o[0],a=o.length===3?o[1]:void 0,i=Number(o[o.length-1]);n=[s,i,a]}return e&&t.parseNodeNameCache.set(r,n),n}function Ou(r,t,e){let o=w("pad",r,t,e);if(o==="explicit"){o=w("explicitPaddings",r,t,e);let n=[[0,0],[0,0],[0,0],[0,0]];for(let s=0;s<4;s++)n[s][0]=o[s*2],n[s][1]=o[s*2+1];return n}return o}function zr(r){return r.kept?r:qe(r)}var qy={};kt(qy,{json:()=>vH});var vH=[{tfOpName:"Add",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"AddV2",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"AddN",category:"arithmetic",inputs:[{start:0,end:0,name:"tensors",type:"tensors"}]},{tfOpName:"BiasAdd",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0}]},{tfOpName:"Sub",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"RealDiv",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Div",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"DivNoNan",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"FloorDiv",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Mul",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Maximum",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Minimum",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Pow",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"SquaredDifference",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Mod",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"FloorMod",category:"arithmetic",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]}];var jy={};kt(jy,{json:()=>SH});var SH=[{tfOpName:"Abs",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Acos",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Asin",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Atan",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Atan2",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"y",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Ceil",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"ClipByValue",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"clipValueMin",type:"number"},{start:2,name:"clipValueMax",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Complex",category:"basic_math",inputs:[{start:0,name:"real",type:"tensor"},{start:1,name:"imag",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"ComplexAbs",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Cos",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Cosh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Elu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Exp",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Floor",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Log",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Imag",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"Tout",name:"outputType",type:"dtype",notSupported:!0}]},{tfOpName:"Neg",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Real",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"Tout",name:"outputType",type:"dtype",notSupported:!0}]},{tfOpName:"Prelu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"alpha",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Relu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Relu6",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Selu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sigmoid",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sin",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sinh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sqrt",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Rsqrt",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Square",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Tan",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Tanh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Sign",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Round",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Expm1",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Log1p",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Reciprocal",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Softplus",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Asinh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Acosh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Atanh",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Erf",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LeakyRelu",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"alpha",name:"alpha",type:"number",defaultValue:.2},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"IsNan",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"IsFinite",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"IsInf",category:"basic_math",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]}];var Xy={};kt(Xy,{json:()=>CH});var CH=[{tfOpName:"EmptyTensorList",category:"control",inputs:[{start:0,name:"elementShape",type:"shape"},{start:1,name:"maxNumElements",type:"number"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"LoopCond",category:"control",inputs:[{start:0,name:"pred",type:"tensor"}]},{tfOpName:"Switch",category:"control",inputs:[{start:0,name:"data",type:"tensor"},{start:1,name:"pred",type:"tensor"}]},{tfOpName:"Merge",category:"control",inputs:[{start:0,end:0,name:"tensors",type:"tensors"}]},{tfOpName:"Enter",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"frame_name",name:"frameName",type:"string"},{tfName:"is_constant",name:"isConstant",type:"bool"}]},{tfOpName:"Exit",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"NextIteration",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"TensorArrayV3",category:"control",inputs:[{start:0,name:"size",type:"number"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"element_shape",name:"elementShape",type:"shape"},{tfName:"dynamic_size",name:"dynamicSize",type:"bool"},{tfName:"clear_after_read",name:"clearAfterRead",type:"bool"},{tfName:"identical_element_shapes",name:"identicalElementShapes",type:"bool"},{tfName:"tensor_array_name",name:"name",type:"string"}]},{tfOpName:"TensorArrayWriteV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"index",type:"number"},{start:2,name:"tensor",type:"tensor"},{start:3,name:"flowIn",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"TensorArrayReadV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"index",type:"number"},{start:2,name:"flowIn",type:"number"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"TensorArrayGatherV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"flowIn",type:"number"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"element_shape",name:"elementShape",type:"shape"}]},{tfOpName:"TensorArrayScatterV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"tensor",type:"tensor"},{start:3,name:"flowIn",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"TensorArrayConcatV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"flowIn",type:"number"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"element_shape_except0",name:"elementShapeExcept0",type:"shape",notSupported:!0}]},{tfOpName:"TensorArraySplitV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"tensor",type:"tensor"},{start:2,name:"lengths",type:"number[]"},{start:3,name:"flowIn",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"TensorArraySizeV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"},{start:1,name:"flowIn",type:"number"}]},{tfOpName:"TensorArrayCloseV3",category:"control",inputs:[{start:0,name:"tensorArrayId",type:"tensor"}]},{tfOpName:"StatelessIf",category:"control",inputs:[{start:0,name:"cond",type:"tensor"},{start:1,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"then_branch",name:"thenBranch",type:"func"},{tfName:"else_branch",name:"elseBranch",type:"func"}]},{tfOpName:"If",category:"control",inputs:[{start:0,name:"cond",type:"tensor"},{start:1,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"then_branch",name:"thenBranch",type:"func"},{tfName:"else_branch",name:"elseBranch",type:"func"}]},{tfOpName:"StatelessWhile",category:"control",inputs:[{start:0,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"cond",name:"cond",type:"func"},{tfName:"body",name:"body",type:"func"}]},{tfOpName:"While",category:"control",inputs:[{start:0,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"cond",name:"cond",type:"func"},{tfName:"body",name:"body",type:"func"}]},{tfOpName:"TensorListScatter",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListScatterV2",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"elementShape",type:"shape"},{start:3,name:"numElements",type:"number"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListGather",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"indices",type:"number[]"},{start:2,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListGetItem",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"index",type:"number"},{start:2,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListSetItem",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"index",type:"number"},{start:2,name:"tensor",type:"tensor"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListReserve",category:"control",inputs:[{start:0,name:"elementShape",type:"shape"},{start:1,name:"numElements",type:"number"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListFromTensor",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListStack",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"},{tfName:"num_elements",name:"numElements",type:"dtype"}]},{tfOpName:"TensorListSplit",category:"control",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"elementShape",type:"shape"},{start:2,name:"lengths",type:"number[]"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListConcat",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"}],attrs:[{tfName:"element_shape",name:"elementShape",type:"shape"},{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListConcatV2",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"}],attrs:[{tfName:"element_shape",name:"elementShape",type:"shape"},{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListPopBack",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"elementShape",type:"shape"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListPushBack",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"tensor",type:"tensor"}],attrs:[{tfName:"element_dtype",name:"elementDType",type:"dtype"}]},{tfOpName:"TensorListLength",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"}]},{tfOpName:"TensorListResize",category:"control",inputs:[{start:0,name:"tensorListId",type:"tensor"},{start:1,name:"size",type:"number"}]}];var Yy={};kt(Yy,{json:()=>TH});var TH=[{tfOpName:"AvgPool",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"MaxPool",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[],notSupported:!0},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"MaxPoolWithArgmax",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"include_batch_in_index",name:"includeBatchInIndex",type:"bool"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"AvgPool3D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"MaxPool3D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"ksize",name:"kernelSize",type:"number[]"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Conv1D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"stride",name:"stride",type:"number"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NWC"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"dilation",name:"dilation",type:"number",defaultValue:1}]},{tfOpName:"Conv2D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"useCudnnOnGpu",name:"useCudnnOnGpu",type:"bool"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"dilations",name:"dilations",type:"number[]"}]},{tfOpName:"_FusedConv2D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"},{start:2,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"num_args",name:"numArgs",type:"number"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"use_cudnn_on_gpu",name:"useCudnnOnGpu",type:"bool",defaultValue:!0},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"dilations",name:"dilations",type:"number[]",defaultValue:[1,1,1,1]},{tfName:"fused_ops",name:"fusedOps",type:"string[]",defaultValue:[]},{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:1e-4},{tfName:"leakyrelu_alpha",name:"leakyreluAlpha",type:"number",defaultValue:.2}]},{tfOpName:"Conv2DBackpropInput",category:"convolution",inputs:[{start:2,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"},{start:0,name:"outputShape",type:"number[]"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"dilations",name:"dilations",type:"number[]",notSupported:!0}]},{tfOpName:"DepthwiseConv2d",category:"convolution",inputs:[{start:0,name:"input",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"dilations",name:"dilations",type:"number[]"}]},{tfOpName:"DepthwiseConv2dNative",category:"convolution",inputs:[{start:0,name:"input",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]},{tfName:"dilations",name:"dilations",type:"number[]"}]},{tfOpName:"FusedDepthwiseConv2dNative",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"},{start:2,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"num_args",name:"numArgs",type:"number"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"dilations",name:"dilations",type:"number[]",defaultValue:[1,1,1,1]},{tfName:"fused_ops",name:"fusedOps",type:"string[]",defaultValue:[]},{tfName:"explicit_paddings",name:"explicitPaddings",type:"number[]",defaultValue:[]}]},{tfOpName:"Conv3D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"padding",name:"pad",type:"string"},{tfName:"data_format",name:"dataFormat",type:"string",defaultValue:"NHWC"},{tfName:"dilations",name:"dilations",type:"number[]"}]},{tfOpName:"Dilation2D",category:"convolution",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"filter",type:"tensor"}],attrs:[{tfName:"strides",name:"strides",type:"number[]"},{tfName:"rates",name:"dilations",type:"number[]"},{tfName:"padding",name:"pad",type:"string"}]}];var Qy={};kt(Qy,{json:()=>NH});var NH=[{tfOpName:"Fill",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"},{start:1,name:"value",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"LinSpace",category:"creation",inputs:[{start:0,name:"start",type:"number"},{start:1,name:"stop",type:"number"},{start:2,name:"num",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"OneHot",category:"creation",inputs:[{start:0,name:"indices",type:"tensor"},{start:1,name:"depth",type:"number"},{start:2,name:"onValue",type:"number",defaultValue:1},{start:3,name:"offValue",type:"number",defaultValue:0}],attrs:[{tfName:"axis",name:"axis",type:"number",notSupported:!0},{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"Ones",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"OnesLike",category:"creation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"dtype",name:"dtype",type:"dtype"}]},{tfOpName:"RandomStandardNormal",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"seed",name:"seed",type:"number",defaultValue:0},{tfName:"seed2",name:"seed2",type:"number",defaultValue:0,notSupported:!0},{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"T",name:"T",type:"number",notSupported:!0}]},{tfOpName:"RandomUniform",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"minval",name:"minval",type:"number",defaultValue:0},{tfName:"maxval",name:"maxval",type:"number",defaultValue:1},{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"seed",name:"seed",type:"number",defaultValue:0},{tfName:"seed2",name:"seed2",type:"number",defaultValue:0,notSupported:!0},{tfName:"T",name:"T",type:"number",notSupported:!0}]},{tfOpName:"RandomUniformInt",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"minval",name:"minval",type:"number"},{tfName:"maxval",name:"maxval",type:"number"},{tfName:"seed",name:"seed",type:"number",defaultValue:0},{tfName:"seed2",name:"seed2",type:"number",defaultValue:0,notSupported:!0}]},{tfOpName:"Range",category:"creation",inputs:[{start:0,name:"start",type:"number"},{start:1,name:"stop",type:"number"},{start:2,name:"step",type:"number",defaultValue:0}],attrs:[{tfName:"Tidx",name:"dtype",type:"dtype"}]},{tfOpName:"TruncatedNormal",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"means",name:"mean",type:"number",defaultValue:0},{tfName:"stddev",name:"stdDev",type:"number",defaultValue:1},{tfName:"seed",name:"seed",type:"number"},{tfName:"seed2",name:"seed2",type:"number",defaultValue:0,notSupported:!0},{tfName:"dtype",name:"dtype",type:"dtype"},{tfName:"T",name:"T",type:"number",notSupported:!0}]},{tfOpName:"Zeros",category:"creation",inputs:[{start:0,name:"shape",type:"number[]"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"ZerosLike",category:"creation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"Multinomial",category:"creation",inputs:[{start:0,name:"logits",type:"tensor"},{start:1,name:"numSamples",type:"number"}],attrs:[{tfName:"seed",name:"seed",type:"number"},{tfName:"seed2",name:"seed2",type:"number"},{tfName:"T",name:"dtype",type:"dtype"},{tfName:"output_dtype",name:"output_dtype",type:"dtype"}]}];var Zy={};kt(Zy,{json:()=>IH});var IH=[{tfOpName:"NonMaxSuppressionV2",category:"dynamic",inputs:[{start:0,name:"boxes",type:"tensor"},{start:1,name:"scores",type:"tensor"},{start:2,name:"maxOutputSize",type:"number"},{start:3,name:"iouThreshold",type:"number"}]},{tfOpName:"NonMaxSuppressionV3",category:"dynamic",inputs:[{start:0,name:"boxes",type:"tensor"},{start:1,name:"scores",type:"tensor"},{start:2,name:"maxOutputSize",type:"number"},{start:3,name:"iouThreshold",type:"number"},{start:4,name:"scoreThreshold",type:"number"}]},{tfOpName:"NonMaxSuppressionV4",category:"dynamic",inputs:[{start:0,name:"boxes",type:"tensor"},{start:1,name:"scores",type:"tensor"},{start:2,name:"maxOutputSize",type:"number"},{start:3,name:"iouThreshold",type:"number"},{start:4,name:"scoreThreshold",type:"number"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0},{tfName:"T_threshold",name:"threshold",type:"dtype",notSupported:!0},{tfName:"pad_to_max_output_size",name:"padToMaxOutputSize",type:"bool"}]},{tfOpName:"NonMaxSuppressionV5",category:"dynamic",inputs:[{start:0,name:"boxes",type:"tensor"},{start:1,name:"scores",type:"tensor"},{start:2,name:"maxOutputSize",type:"number"},{start:3,name:"iouThreshold",type:"number"},{start:4,name:"scoreThreshold",type:"number"},{start:5,name:"softNmsSigma",type:"number"}]},{tfOpName:"Where",category:"dynamic",inputs:[{start:0,name:"condition",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"ListDiff",category:"dynamic",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"y",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]}];var Jy={};kt(Jy,{json:()=>kH});var kH=[{tfOpName:"LowerBound",category:"evaluation",inputs:[{start:0,name:"sortedSequence",type:"tensor"},{start:1,name:"values",type:"tensor"}]},{tfOpName:"TopKV2",category:"evaluation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"k",type:"number"}],attrs:[{tfName:"sorted",name:"sorted",type:"bool"}]},{tfOpName:"UpperBound",category:"evaluation",inputs:[{start:0,name:"sortedSequence",type:"tensor"},{start:1,name:"values",type:"tensor"}]},{tfOpName:"Unique",category:"evaluation",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"UniqueV2",category:"evaluation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}]}];var tb={};kt(tb,{json:()=>EH});var EH=[{tfOpName:"PlaceholderWithDefault",category:"graph",inputs:[{start:0,name:"default",type:"tensor"}],attrs:[{tfName:"shape",name:"shape",type:"shape"},{tfName:"dtype",name:"dtype",type:"dtype"}]},{tfOpName:"Placeholder",category:"graph",attrs:[{tfName:"shape",name:"shape",type:"shape"},{tfName:"dtype",name:"dtype",type:"dtype"}]},{tfOpName:"Const",category:"graph"},{tfOpName:"Identity",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"IdentityN",category:"graph",inputs:[{start:0,end:0,name:"x",type:"tensors"}]},{tfOpName:"Snapshot",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"Rank",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"Size",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"Shape",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"ShapeN",category:"graph",inputs:[{start:0,end:0,name:"x",type:"tensors"}]},{tfOpName:"Print",category:"graph",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"data",type:"tensors"}],attrs:[{tfName:"message",name:"message",type:"string"},{tfName:"first_n",name:"firstN",type:"number",notSupported:!0},{tfName:"summarize",name:"summarize",type:"number",defaultValue:3}]},{tfOpName:"NoOp",category:"graph",inputs:[]},{tfOpName:"StopGradient",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"FakeQuantWithMinMaxVars",category:"graph",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"min",name:"min",type:"number"},{tfName:"max",name:"max",type:"number"}]}];var eb={};kt(eb,{json:()=>$H});var $H=[{tfOpName:"HashTable",category:"hash_table",inputs:[],attrs:[{tfName:"shared_name",name:"sharedName",type:"string"},{tfName:"use_node_name_sharing",name:"useNodeNameSharing",type:"bool"},{tfName:"key_dtype",name:"keyDType",type:"dtype"},{tfName:"value_dtype",name:"valueDType",type:"dtype"}]},{tfOpName:"HashTableV2",category:"hash_table",inputs:[],attrs:[{tfName:"shared_name",name:"sharedName",type:"string"},{tfName:"use_node_name_sharing",name:"useNodeNameSharing",type:"bool"},{tfName:"key_dtype",name:"keyDType",type:"dtype"},{tfName:"value_dtype",name:"valueDType",type:"dtype"}]},{tfOpName:"LookupTableImport",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"values",type:"tensor"}],attrs:[{tfName:"Tin",name:"tIn",type:"dtype",notSupported:!0},{tfName:"Tout",name:"tOut",type:"dtype",notSupported:!0}]},{tfOpName:"LookupTableImportV2",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"values",type:"tensor"}],attrs:[{tfName:"Tin",name:"tIn",type:"dtype",notSupported:!0},{tfName:"Tout",name:"tOut",type:"dtype",notSupported:!0}]},{tfOpName:"LookupTableFind",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"defaultValue",type:"tensor"}],attrs:[{tfName:"Tin",name:"tIn",type:"dtype",notSupported:!0},{tfName:"Tout",name:"tOut",type:"dtype",notSupported:!0}]},{tfOpName:"LookupTableFindV2",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"defaultValue",type:"tensor"}],attrs:[{tfName:"Tin",name:"tIn",type:"dtype",notSupported:!0},{tfName:"Tout",name:"tOut",type:"dtype",notSupported:!0}]},{tfOpName:"LookupTableSize",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"}]},{tfOpName:"LookupTableSizeV2",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"}]},{tfOpName:"InitializeTable",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"values",type:"tensor"}]},{tfOpName:"InitializeTableV2",category:"hash_table",inputs:[{start:0,name:"tableHandle",type:"tensor"},{start:1,name:"keys",type:"tensor"},{start:2,name:"values",type:"tensor"}]}];var rb={};kt(rb,{json:()=>RH});var RH=[{tfOpName:"ResizeBilinear",category:"image",inputs:[{start:0,name:"images",type:"tensor"},{start:1,name:"size",type:"number[]"}],attrs:[{tfName:"align_corners",name:"alignCorners",type:"bool"},{tfName:"half_pixel_centers",name:"halfPixelCenters",type:"bool"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"ResizeNearestNeighbor",category:"image",inputs:[{start:0,name:"images",type:"tensor"},{start:1,name:"size",type:"number[]"}],attrs:[{tfName:"align_corners",name:"alignCorners",type:"bool"},{tfName:"half_pixel_centers",name:"halfPixelCenters",type:"bool"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"CropAndResize",category:"image",inputs:[{start:0,name:"image",type:"tensor"},{start:1,name:"boxes",type:"tensor"},{start:2,name:"boxInd",type:"tensor"},{start:3,name:"cropSize",type:"number[]"}],attrs:[{tfName:"method",name:"method",type:"string"},{tfName:"extrapolation_value",name:"extrapolationValue",type:"number"}]},{tfOpName:"ImageProjectiveTransformV3",category:"image",inputs:[{start:0,name:"images",type:"tensor"},{start:1,name:"transforms",type:"tensor"},{start:2,name:"outputShape",type:"number[]"},{start:3,name:"fillValue",type:"number"}],attrs:[{tfName:"interpolation",name:"interpolation",type:"string"},{tfName:"fill_mode",name:"fillMode",type:"string"}]}];var ob={};kt(ob,{json:()=>AH});var AH=[{tfOpName:"Equal",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"NotEqual",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Greater",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"GreaterEqual",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Less",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LessEqual",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LogicalAnd",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LogicalNot",category:"logical",inputs:[{start:0,name:"a",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"LogicalOr",category:"logical",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Select",category:"logical",inputs:[{start:0,name:"condition",type:"tensor"},{start:1,name:"a",type:"tensor"},{start:2,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"SelectV2",category:"logical",inputs:[{start:0,name:"condition",type:"tensor"},{start:1,name:"a",type:"tensor"},{start:2,name:"b",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"BitwiseAnd",category:"logical",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"y",type:"tensor"}]}];var nb={};kt(nb,{json:()=>FH});var FH=[{tfOpName:"_FusedMatMul",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"},{start:2,end:0,name:"args",type:"tensors"}],attrs:[{tfName:"num_args",name:"numArgs",type:"number"},{tfName:"fused_ops",name:"fusedOps",type:"string[]",defaultValue:[]},{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:1e-4},{tfName:"transpose_a",name:"transposeA",type:"bool",defaultValue:!1},{tfName:"transpose_b",name:"transposeB",type:"bool",defaultValue:!1},{tfName:"leakyrelu_alpha",name:"leakyreluAlpha",type:"number",defaultValue:.2},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"MatMul",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"transpose_a",name:"transposeA",type:"bool",defaultValue:!1},{tfName:"transpose_b",name:"transposeB",type:"bool",defaultValue:!1},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"BatchMatMul",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"adj_x",name:"transposeA",type:"bool",defaultValue:!1},{tfName:"adj_y",name:"transposeB",type:"bool",defaultValue:!1},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"BatchMatMulV2",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"b",type:"tensor"}],attrs:[{tfName:"adj_x",name:"transposeA",type:"bool",defaultValue:!1},{tfName:"adj_y",name:"transposeB",type:"bool",defaultValue:!1},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Transpose",category:"matrices",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"perm",type:"number[]"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Einsum",category:"matrices",inputs:[{start:0,end:0,name:"tensors",type:"tensors"}],attrs:[{tfName:"equation",name:"equation",type:"string"},{tfName:"N",name:"n",type:"number",defaultValue:2},{tfName:"T",name:"dtype",type:"dtype"}]},{tfOpName:"MatrixBandPart",category:"matrices",inputs:[{start:0,name:"a",type:"tensor"},{start:1,name:"numLower",type:"tensor"},{start:1,name:"numUpper",type:"tensor"}]}];var sb={};kt(sb,{json:()=>_H});var _H=[{tfOpName:"EuclideanNorm",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool",defaultValue:!1}]},{tfOpName:"FusedBatchNorm",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"scale",type:"tensor"},{start:2,name:"offset",type:"tensor"},{start:3,name:"mean",type:"tensor"},{start:4,name:"variance",type:"tensor"}],attrs:[{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:.001},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0}]},{tfOpName:"FusedBatchNormV2",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"scale",type:"tensor"},{start:2,name:"offset",type:"tensor"},{start:3,name:"mean",type:"tensor"},{start:4,name:"variance",type:"tensor"}],attrs:[{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:.001},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0}]},{tfOpName:"FusedBatchNormV3",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"scale",type:"tensor"},{start:2,name:"offset",type:"tensor"},{start:3,name:"mean",type:"tensor"},{start:4,name:"variance",type:"tensor"}],attrs:[{tfName:"epsilon",name:"epsilon",type:"number",defaultValue:.001},{tfName:"data_format",name:"dataFormat",type:"string",notSupported:!0}]},{tfOpName:"LRN",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"depth_radius",name:"radius",type:"number",defaultValue:5},{tfName:"bias",name:"bias",type:"number",defaultValue:1},{tfName:"alpha",name:"alpha",type:"number",defaultValue:1},{tfName:"beta",name:"beta",type:"number",defaultValue:.5}]},{tfOpName:"Softmax",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"LogSoftmax",category:"normalization",inputs:[{start:0,name:"x",type:"tensor"}]}];var ab={};kt(ab,{json:()=>DH});var DH=[{tfOpName:"Bincount",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"size",type:"number"},{start:2,name:"weights",type:"tensor"}]},{tfOpName:"DenseBincount",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"size",type:"number"},{start:2,name:"weights",type:"tensor"}],attrs:[{tfName:"binary_output",name:"binaryOutput",type:"bool"}]},{tfOpName:"Max",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Mean",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Min",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Sum",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"All",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"Any",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"}]},{tfOpName:"ArgMax",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}]},{tfOpName:"ArgMin",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}]},{tfOpName:"Prod",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}],attrs:[{tfName:"keep_dims",name:"keepDims",type:"bool"},{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"Cumprod",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}],attrs:[{tfName:"exclusive",name:"exclusive",type:"bool"},{tfName:"reverse",name:"reverse",type:"bool"}]},{tfOpName:"Cumsum",category:"reduction",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}],attrs:[{tfName:"exclusive",name:"exclusive",type:"bool"},{tfName:"reverse",name:"reverse",type:"bool"}]}];var ib={};kt(ib,{json:()=>OH});var OH=[{tfOpName:"ConcatV2",category:"slice_join",inputs:[{start:0,end:-1,name:"tensors",type:"tensors"},{start:-1,name:"axis",type:"number"}],attrs:[{tfName:"N",name:"n",type:"number",defaultValue:2}]},{tfOpName:"Concat",category:"slice_join",inputs:[{start:1,end:0,name:"tensors",type:"tensors"},{start:0,name:"axis",type:"number"}],attrs:[{tfName:"N",name:"n",type:"number",defaultValue:2}]},{tfOpName:"GatherV2",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"indices",type:"tensor"},{start:2,name:"axis",type:"number",defaultValue:0}],attrs:[{tfName:"batch_dims",name:"batchDims",type:"number",defaultValue:0}]},{tfOpName:"Gather",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"indices",type:"tensor"}],attrs:[{tfName:"validate_indices",name:"validateIndices",type:"bool",notSupported:!0}]},{tfOpName:"Reverse",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"dims",type:"bool[]"}]},{tfOpName:"ReverseV2",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number[]"}]},{tfOpName:"Slice",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"begin",type:"number[]"},{start:2,name:"size",type:"number[]"}]},{tfOpName:"StridedSlice",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"begin",type:"number[]"},{start:2,name:"end",type:"number[]"},{start:3,name:"strides",type:"number[]"}],attrs:[{tfName:"begin_mask",name:"beginMask",type:"number",defaultValue:0},{tfName:"end_mask",name:"endMask",type:"number",defaultValue:0},{tfName:"new_axis_mask",name:"newAxisMask",type:"number",defaultValue:0},{tfName:"ellipsis_mask",name:"ellipsisMask",type:"number",defaultValue:0},{tfName:"shrink_axis_mask",name:"shrinkAxisMask",type:"number",defaultValue:0}]},{tfOpName:"Pack",category:"slice_join",inputs:[{start:0,end:0,name:"tensors",type:"tensors"}],attrs:[{tfName:"axis",name:"axis",type:"number",defaultValue:0}]},{tfOpName:"Unpack",category:"slice_join",inputs:[{start:0,name:"tensor",type:"tensor"}],attrs:[{tfName:"axis",name:"axis",type:"number",defaultValue:0},{tfName:"num",name:"num",type:"number",defaultValue:0,notSupported:!0}]},{tfOpName:"Tile",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"reps",type:"number[]"}]},{tfOpName:"Split",category:"slice_join",inputs:[{start:0,name:"axis",type:"number",defaultValue:0},{start:1,name:"x",type:"tensor"}],attrs:[{tfName:"num_split",name:"numOrSizeSplits",type:"number",defaultValue:1}]},{tfOpName:"SplitV",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"numOrSizeSplits",type:"number[]"},{start:2,name:"axis",type:"number",defaultValue:0}]},{tfOpName:"ScatterNd",category:"slice_join",inputs:[{start:0,name:"indices",type:"tensor"},{start:1,name:"values",type:"tensor"},{start:2,name:"shape",type:"number[]"}]},{tfOpName:"GatherNd",category:"slice_join",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"indices",type:"tensor"}]},{tfOpName:"SparseToDense",category:"slice_join",inputs:[{start:0,name:"sparseIndices",type:"tensor"},{start:1,name:"outputShape",type:"number[]"},{start:2,name:"sparseValues",type:"tensor"},{start:3,name:"defaultValue",type:"tensor"}],attrs:[{tfName:"validate_indices",name:"validateIndices",type:"bool",defaultValue:!1,notSupported:!0}]},{tfOpName:"TensorScatterUpdate",category:"slice_join",inputs:[{start:0,name:"tensor",type:"tensor"},{start:1,name:"indices",type:"tensor"},{start:2,name:"values",type:"tensor"}]}];var lb={};kt(lb,{json:()=>PH});var PH=[{tfOpName:"SparseFillEmptyRows",category:"sparse",inputs:[{start:0,name:"indices",type:"tensor"},{start:1,name:"values",type:"tensor"},{start:2,name:"denseShape",type:"tensor"},{start:3,name:"defaultValue",type:"tensor"}]},{tfOpName:"SparseReshape",category:"sparse",inputs:[{start:0,name:"inputIndices",type:"tensor"},{start:1,name:"inputShape",type:"tensor"},{start:2,name:"newShape",type:"tensor"}],attrs:[{tfName:"T",name:"dtype",type:"dtype",notSupported:!0}]},{tfOpName:"SparseSegmentMean",category:"sparse",inputs:[{start:0,name:"data",type:"tensor"},{start:1,name:"indices",type:"tensor"},{start:2,name:"segmentIds",type:"tensor"}]},{tfOpName:"SparseSegmentSum",category:"sparse",inputs:[{start:0,name:"data",type:"tensor"},{start:1,name:"indices",type:"tensor"},{start:2,name:"segmentIds",type:"tensor"}]}];var cb={};kt(cb,{json:()=>MH});var MH=[{tfOpName:"FFT",category:"spectral",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"IFFT",category:"spectral",inputs:[{start:0,name:"x",type:"tensor"}]},{tfOpName:"RFFT",category:"spectral",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"fft_length",type:"number",notSupported:!0}]},{tfOpName:"IRFFT",category:"spectral",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"fft_length",type:"number",notSupported:!0}]}];var ub={};kt(ub,{json:()=>LH});var LH=[{tfOpName:"StaticRegexReplace",category:"string",inputs:[{start:0,name:"input",type:"tensor"}],attrs:[{tfName:"pattern",name:"pattern",type:"string"},{tfName:"rewrite",name:"rewrite",type:"string"},{tfName:"replace_global",name:"replaceGlobal",type:"bool"}]},{tfOpName:"StringNGrams",category:"string",inputs:[{start:0,name:"data",type:"tensor"},{start:1,name:"dataSplits",type:"tensor"}],attrs:[{tfName:"separator",name:"separator",type:"string"},{tfName:"ngram_widths",name:"nGramWidths",type:"number[]"},{tfName:"left_pad",name:"leftPad",type:"string"},{tfName:"right_pad",name:"rightPad",type:"string"},{tfName:"pad_width",name:"padWidth",type:"number"},{tfName:"preserve_short_sequences",name:"preserveShortSequences",type:"bool"}],outputs:["ngrams","ngrams_splits"]},{tfOpName:"StringSplit",category:"string",inputs:[{start:0,name:"input",type:"tensor"},{start:1,name:"delimiter",type:"tensor"}],attrs:[{tfName:"skip_empty",name:"skipEmpty",type:"bool"}],outputs:["indices","values","shape"]},{tfOpName:"StringToHashBucketFast",category:"string",inputs:[{start:0,name:"input",type:"tensor"}],attrs:[{tfName:"num_buckets",name:"numBuckets",type:"number"}]}];var pb={};kt(pb,{json:()=>BH});var BH=[{tfOpName:"Cast",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"SrcT",name:"sdtype",type:"dtype",notSupported:!0},{tfName:"DstT",name:"dtype",type:"dtype"}]},{tfOpName:"ExpandDims",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"axis",type:"number"}]},{tfOpName:"MirrorPad",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"padding",type:"number[]"}],attrs:[{tfName:"mode",name:"mode",type:"string"}]},{tfOpName:"Pad",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"padding",type:"number[]"}],attrs:[{tfName:"constant_value",name:"constantValue",type:"number",defaultValue:0}]},{tfOpName:"PadV2",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"padding",type:"number[]"},{start:2,name:"constantValue",type:"number",defaultValue:0}]},{tfOpName:"Reshape",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"shape",type:"number[]"}]},{tfOpName:"EnsureShape",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"shape",type:"number[]"}]},{tfOpName:"Squeeze",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"axis",tfDeprecatedName:"squeeze_dims",name:"axis",type:"number[]"}]},{tfOpName:"SpaceToBatchND",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"blockShape",type:"number[]"},{start:2,name:"paddings",type:"number[]"}]},{tfOpName:"BatchToSpaceND",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"blockShape",type:"number[]"},{start:2,name:"crops",type:"number[]"}]},{tfOpName:"DepthToSpace",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"}],attrs:[{tfName:"block_size",name:"blockSize",type:"number"},{tfName:"data_format",name:"dataFormat",type:"string"}]},{tfOpName:"BroadcastTo",category:"transformation",inputs:[{start:0,name:"x",type:"tensor"},{start:1,name:"shape",type:"number[]"}],attrs:[]},{tfOpName:"BroadcastArgs",category:"transformation",inputs:[{start:0,name:"s0",type:"tensor"},{start:1,name:"s1",type:"tensor"}],attrs:[]}];var Pu=class{static get Instance(){return this._instance||(this._instance=new this)}constructor(){let t=[qy,jy,Xy,Yy,Qy,Zy,Jy,tb,eb,rb,ob,nb,sb,ab,ib,lb,cb,ub,pb],e=[].concat(...t.map(o=>o.json));this.opMappers=e.reduce((o,n)=>(o[n.tfOpName]=n,o),{})}transformGraph(t,e={}){let o=t.node,n=[],s=[],a=[],i=o.reduce((g,h)=>(g[h.name]=this.mapNode(h),h.op.startsWith("Placeholder")?n.push(g[h.name]):h.op==="Const"?s.push(g[h.name]):(h.input==null||h.input.length===0)&&a.push(g[h.name]),g),{}),l=[],c=[],u={},p={};e!=null&&(u=this.mapSignatureEntries(e.inputs),p=this.mapSignatureEntries(e.outputs));let m=Object.keys(i);m.forEach(g=>{let h=i[g];h.inputNames.forEach((x,b)=>{let[C,,S]=Vr(x),I=i[C];if(I.outputs!=null){let $=I.outputs.indexOf(S);if($!==-1){let R=`${C}:${$}`;h.inputNames[b]=R}}h.inputs.push(I),I.children.push(h)})}),Object.keys(p).length===0?m.forEach(g=>{let h=i[g];h.children.length===0&&c.push(h)}):Object.keys(p).forEach(g=>{let[h]=Vr(g),x=i[h];x!=null&&(x.signatureKey=p[g],c.push(x))}),Object.keys(u).length>0?Object.keys(u).forEach(g=>{let[h]=Vr(g),x=i[h];x&&(x.signatureKey=u[g],l.push(x))}):l=n;let f={};t.library!=null&&t.library.function!=null&&(f=t.library.function.reduce((g,h)=>(g[h.signature.name]=this.mapFunction(h),g),{}));let d={nodes:i,inputs:l,outputs:c,weights:s,placeholders:n,signature:e,functions:f};return a.length>0&&(d.initNodes=a),d}mapSignatureEntries(t){return Object.keys(t||{}).reduce((e,o)=>(e[t[o].name]=o,e),{})}mapNode(t){let e=qf(t.op)||this.opMappers[t.op]||{};t.attr==null&&(t.attr={});let o={name:t.name,op:t.op,category:e.category,inputNames:(t.input||[]).map(n=>n.startsWith("^")?n.slice(1):n),inputs:[],children:[],inputParams:{},attrParams:{},rawAttrs:t.attr,outputs:e.outputs};return e.inputs!=null&&(o.inputParams=e.inputs.reduce((n,s)=>(n[s.name]={type:s.type,inputIndexStart:s.start,inputIndexEnd:s.end},n),{})),e.attrs!=null&&(o.attrParams=e.attrs.reduce((n,s)=>{let a=s.type,i;switch(s.type){case"string":i=Xf(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=Xf(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"string[]":i=rd(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=rd(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"number":i=Qf(t.attr,s.tfName,s.defaultValue||0),i===void 0&&s.tfDeprecatedName&&(i=Qf(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"number[]":i=ed(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=ed(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"bool":i=Yf(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=Yf(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"bool[]":i=nd(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=nd(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"shape":i=td(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=td(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"shape[]":i=od(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=od(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"dtype":i=Zf(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=Zf(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"dtype[]":i=Jf(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=Jf(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"func":i=zE(t.attr,s.tfName,s.defaultValue),i===void 0&&s.tfDeprecatedName&&(i=zE(t.attr,s.tfDeprecatedName,s.defaultValue));break;case"tensor":case"tensors":break;default:throw new Error(`Unsupported param type: ${s.type} for op: ${t.op}`)}return n[s.name]={value:i,type:a},n},{})),o}mapFunction(t){let e=t.nodeDef,o=[],n=[],s={};e!=null&&(s=e.reduce((p,m)=>(p[m.name]=this.mapNode(m),m.op==="Const"&&n.push(p[m.name]),p),{}));let a=[],i=[];t.signature.inputArg.forEach(p=>{let[m]=Vr(p.name),f={name:m,op:"Placeholder",inputs:[],inputNames:[],category:"graph",inputParams:{},attrParams:{dtype:{value:mb(p.type),type:"dtype"}},children:[]};f.signatureKey=p.name,a.push(f),s[m]=f}),Object.keys(s).forEach(p=>{let m=s[p];m.inputNames.forEach((f,d)=>{let[g,,h]=Vr(f),x=s[g];if(x.outputs!=null){let b=x.outputs.indexOf(h);if(b!==-1){let C=`${g}:${b}`;m.inputNames[d]=C}}m.inputs.push(x),x.children.push(m)})});let c=t.ret;t.signature.outputArg.forEach(p=>{let[m,f]=Vr(c[p.name]),d=s[m];d!=null&&(d.defaultOutput=f,i.push(d))});let u=this.mapArgsToSignature(t);return{nodes:s,inputs:a,outputs:i,weights:n,placeholders:o,signature:u}}mapArgsToSignature(t){return{methodName:t.signature.name,inputs:t.signature.inputArg.reduce((e,o)=>(e[o.name]=this.mapArgToTensorInfo(o),e),{}),outputs:t.signature.outputArg.reduce((e,o)=>(e[o.name]=this.mapArgToTensorInfo(o,t.ret),e),{})}}mapArgToTensorInfo(t,e){let o=t.name;return e!=null&&(o=e[o]),{name:o,dtype:t.type}}};function VH(r){let t=D().global;if(typeof t.atob<"u")return t.atob(r);if(typeof Buffer<"u")return new Buffer(r,"base64").toString();throw new Error("Unable to decode base64 in this environment. Missing built-in atob() or Buffer()")}function WE(r,t){let e=Array.isArray(r)?String.fromCharCode.apply(null,r):VH(r);return t?e:e.toLowerCase()}function Xf(r,t,e,o=!1){let n=r[t];return n!=null?WE(n.s,o):e}function Yf(r,t,e){let o=r[t];return o?o.b:e}function Qf(r,t,e){let o=r[t]||{},n=o.i!=null?o.i:o.f!=null?o.f:e;return typeof n=="number"?n:parseInt(n,10)}function mb(r){switch(typeof r=="string"&&(r=er[r]),r){case er.DT_FLOAT:case er.DT_HALF:return"float32";case er.DT_INT32:case er.DT_INT64:case er.DT_INT8:case er.DT_UINT8:return"int32";case er.DT_BOOL:return"bool";case er.DT_DOUBLE:return"float32";case er.DT_STRING:return"string";case er.DT_COMPLEX64:case er.DT_COMPLEX128:return"complex64";default:return null}}function zE(r,t,e){let o=r[t];return o&&o.func?o.func.name:e}function Zf(r,t,e){let o=r[t];return o&&o.type?mb(o.type):e}function Jf(r,t,e){let o=r[t];return o&&o.list&&o.list.type?o.list.type.map(n=>mb(n)):e}function GE(r){if(!r.unknownRank)return r.dim!=null?r.dim.map(t=>typeof t.size=="number"?t.size:parseInt(t.size,10)):[]}function td(r,t,e){let o=r[t];return o&&o.shape?GE(o.shape):e}function ed(r,t,e){let o=r[t];return o?((o.list.f&&o.list.f.length?o.list.f:o.list.i)||[]).map(n=>typeof n=="number"?n:parseInt(n,10)):e}function rd(r,t,e,o=!1){let n=r[t];return n&&n.list&&n.list.s?n.list.s.map(s=>WE(s,o)):e}function od(r,t,e){let o=r[t];return o&&o.list&&o.list.shape?o.list.shape.map(n=>GE(n)):e}function nd(r,t,e){let o=r[t];return o&&o.list&&o.list.b?o.list.b:e}var sd=class{constructor(t,e,o){this.node=t,this.tensorMap=e,this.context=o,this.inputs=[],this.attrs={},this.inputs=t.inputNames.map(n=>this.getInput(n)),t.rawAttrs!=null&&(this.attrs=Object.keys(t.rawAttrs).reduce((n,s)=>(n[s]=this.getAttr(s),n),{}))}getInput(t){return le(t,this.tensorMap,this.context)}getAttr(t,e){let o=this.node.rawAttrs[t];if(o.tensor!=null)return le(t,this.tensorMap,this.context);if(o.i!=null||o.f!=null)return Qf(this.node.rawAttrs,t,e);if(o.s!=null)return Xf(this.node.rawAttrs,t,e);if(o.b!=null)return Yf(this.node.rawAttrs,t,e);if(o.shape!=null)return td(this.node.rawAttrs,t,e);if(o.type!=null)return Zf(this.node.rawAttrs,t,e);if(o.list!=null){if(o.list.i!=null||o.list.f!=null)return ed(this.node.rawAttrs,t,e);if(o.list.s!=null)return rd(this.node.rawAttrs,t,e);if(o.list.shape!=null)return od(this.node.rawAttrs,t,e);if(o.list.b!=null)return nd(this.node.rawAttrs,t,e);if(o.list.type!=null)return Jf(this.node.rawAttrs,t,e)}return e}};var Rt={};kt(Rt,{OP_SCOPE_SUFFIX:()=>sp,abs:()=>he,acos:()=>Qd,acosh:()=>Zd,add:()=>Z,addN:()=>Jd,all:()=>th,any:()=>eh,argMax:()=>$c,argMin:()=>rh,asin:()=>oh,asinh:()=>nh,atan:()=>sh,atan2:()=>ah,atanh:()=>ih,avgPool:()=>Fc,avgPool3d:()=>ph,basicLSTMCell:()=>mh,batchNorm:()=>Io,batchNorm2d:()=>fh,batchNorm3d:()=>dh,batchNorm4d:()=>hh,batchToSpaceND:()=>_c,bincount:()=>Dc,bitwiseAnd:()=>gh,booleanMaskAsync:()=>cw,broadcastArgs:()=>xh,broadcastTo:()=>ko,buffer:()=>ot,cast:()=>xt,ceil:()=>yh,clipByValue:()=>Oc,clone:()=>qe,complex:()=>Le,concat:()=>Lt,concat1d:()=>bh,concat2d:()=>wh,concat3d:()=>vh,concat4d:()=>Sh,conv1d:()=>Ch,conv2d:()=>Eo,conv2dTranspose:()=>Th,conv3d:()=>Nh,conv3dTranspose:()=>Ih,cos:()=>kh,cosh:()=>Eh,cosineWindow:()=>Nl,cumprod:()=>$h,cumsum:()=>Rh,denseBincount:()=>Ah,depthToSpace:()=>Fh,depthwiseConv2d:()=>wi,diag:()=>_h,dilation2d:()=>Dh,div:()=>mt,divNoNan:()=>Oh,dot:()=>Ph,dropout:()=>gw,einsum:()=>$o,elu:()=>Mc,enclosingPowerOfTwo:()=>Sp,ensureShape:()=>Mh,equal:()=>Pc,erf:()=>Lh,euclideanNorm:()=>Vh,exp:()=>We,expandDims:()=>Ne,expm1:()=>zh,eye:()=>Lc,fft:()=>Ni,fill:()=>Fr,floor:()=>Bc,floorDiv:()=>Ec,fused:()=>Cp,gather:()=>Vc,gatherND:()=>dw,greater:()=>Qn,greaterEqual:()=>zc,ifft:()=>ts,imag:()=>Fo,image:()=>oo,inTopKAsync:()=>xw,irfft:()=>ou,isFinite:()=>Wh,isInf:()=>Gh,isNaN:()=>Uh,leakyRelu:()=>Wc,less:()=>vl,lessEqual:()=>vi,linalg:()=>pv,linspace:()=>Hh,localResponseNormalization:()=>Kh,log:()=>Jr,log1p:()=>Gc,logSigmoid:()=>qh,logSoftmax:()=>jh,logSumExp:()=>Hc,logicalAnd:()=>Zn,logicalNot:()=>Kc,logicalOr:()=>qc,logicalXor:()=>Xh,losses:()=>mv,lowerBound:()=>Yh,matMul:()=>Et,max:()=>Dr,maxPool:()=>jc,maxPool3d:()=>Qh,maxPoolWithArgmax:()=>Zh,maximum:()=>Xc,mean:()=>Jn,meshgrid:()=>Jh,min:()=>wl,minimum:()=>to,mirrorPad:()=>Yc,mod:()=>tg,moments:()=>eg,movingAverage:()=>uw,mul:()=>K,multiRNNCell:()=>rg,multinomial:()=>og,neg:()=>ye,norm:()=>Yn,notEqual:()=>Qc,oneHot:()=>Cl,ones:()=>Or,onesLike:()=>ng,op:()=>T,outerProduct:()=>sg,pad:()=>Ye,pad1d:()=>ag,pad2d:()=>ig,pad3d:()=>lg,pad4d:()=>cg,pool:()=>ug,pow:()=>Zr,prelu:()=>Jc,print:()=>kc,prod:()=>pg,raggedGather:()=>mg,raggedRange:()=>fg,raggedTensorToTensor:()=>dg,rand:()=>hg,randomGamma:()=>kg,randomNormal:()=>tu,randomStandardNormal:()=>Eg,randomUniform:()=>Ti,randomUniformInt:()=>$g,range:()=>_o,real:()=>eo,reciprocal:()=>Rg,relu:()=>Do,relu6:()=>eu,reshape:()=>L,reverse:()=>ar,reverse1d:()=>Ag,reverse2d:()=>Fg,reverse3d:()=>_g,reverse4d:()=>Dg,rfft:()=>Ii,round:()=>ru,rsqrt:()=>Og,scalar:()=>it,scatterND:()=>pw,searchSorted:()=>Sl,selu:()=>Pg,separableConv2d:()=>Mg,setdiff1dAsync:()=>Lg,sigmoid:()=>je,sign:()=>Bg,signal:()=>uv,sin:()=>Vg,sinh:()=>zg,slice:()=>ft,slice1d:()=>Wg,slice2d:()=>Gg,slice3d:()=>Ug,slice4d:()=>Hg,softmax:()=>Kg,softplus:()=>Uc,spaceToBatchND:()=>Zc,sparse:()=>fv,sparseToDense:()=>fw,spectral:()=>cv,split:()=>ro,sqrt:()=>ze,square:()=>ue,squaredDifference:()=>nu,squeeze:()=>Pt,stack:()=>_e,step:()=>su,stridedSlice:()=>qg,string:()=>dv,sub:()=>lt,sum:()=>Ft,tan:()=>jg,tanh:()=>bl,tensor:()=>$e,tensor1d:()=>Zt,tensor2d:()=>De,tensor3d:()=>au,tensor4d:()=>Xg,tensor5d:()=>Yg,tensor6d:()=>Qg,tensorScatterUpdate:()=>Jg,tile:()=>Ao,topk:()=>tx,transpose:()=>ki,truncatedNormal:()=>ex,unique:()=>rx,unsortedSegmentSum:()=>ox,unstack:()=>ir,upperBound:()=>nx,variable:()=>sx,where:()=>sr,whereAsync:()=>lu,zeros:()=>Xe,zerosLike:()=>ce});var UE=(r,t,e,o=Rt)=>{switch(r.op){case"BiasAdd":case"AddV2":case"Add":return[o.add(w("a",r,t,e),w("b",r,t,e))];case"AddN":return[o.addN(w("tensors",r,t,e))];case"FloorMod":case"Mod":return[o.mod(w("a",r,t,e),w("b",r,t,e))];case"Mul":return[o.mul(w("a",r,t,e),w("b",r,t,e))];case"RealDiv":case"Div":return[o.div(w("a",r,t,e),w("b",r,t,e))];case"DivNoNan":return[o.divNoNan(w("a",r,t,e),w("b",r,t,e))];case"FloorDiv":return[o.floorDiv(w("a",r,t,e),w("b",r,t,e))];case"Sub":return[o.sub(w("a",r,t,e),w("b",r,t,e))];case"Minimum":return[o.minimum(w("a",r,t,e),w("b",r,t,e))];case"Maximum":return[o.maximum(w("a",r,t,e),w("b",r,t,e))];case"Pow":return[o.pow(w("a",r,t,e),w("b",r,t,e))];case"SquaredDifference":return[o.squaredDifference(w("a",r,t,e),w("b",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var HE=(r,t,e,o=Rt)=>{switch(r.op){case"Abs":case"ComplexAbs":return[o.abs(w("x",r,t,e))];case"Acos":return[o.acos(w("x",r,t,e))];case"Acosh":return[o.acosh(w("x",r,t,e))];case"Asin":return[o.asin(w("x",r,t,e))];case"Asinh":return[o.asinh(w("x",r,t,e))];case"Atan":return[o.atan(w("x",r,t,e))];case"Atan2":return[o.atan2(w("x",r,t,e),w("y",r,t,e))];case"Atanh":return[o.atanh(w("x",r,t,e))];case"Ceil":return[o.ceil(w("x",r,t,e))];case"Complex":return[o.complex(w("real",r,t,e),w("imag",r,t,e))];case"Cos":return[o.cos(w("x",r,t,e))];case"Cosh":return[o.cosh(w("x",r,t,e))];case"Elu":return[o.elu(w("x",r,t,e))];case"Erf":return[o.erf(w("x",r,t,e))];case"Exp":return[o.exp(w("x",r,t,e))];case"Expm1":return[o.expm1(w("x",r,t,e))];case"Floor":return[o.floor(w("x",r,t,e))];case"Log":return[o.log(w("x",r,t,e))];case"Log1p":return[o.log1p(w("x",r,t,e))];case"Imag":return[o.imag(w("x",r,t,e))];case"Neg":return[o.neg(w("x",r,t,e))];case"Reciprocal":return[o.reciprocal(w("x",r,t,e))];case"Real":return[o.real(w("x",r,t,e))];case"Relu":return[o.relu(w("x",r,t,e))];case"Round":return[o.round(w("x",r,t,e))];case"Selu":return[o.selu(w("x",r,t,e))];case"Sigmoid":return[o.sigmoid(w("x",r,t,e))];case"Sin":return[o.sin(w("x",r,t,e))];case"Sign":return[o.sign(w("x",r,t,e))];case"Sinh":return[o.sinh(w("x",r,t,e))];case"Softplus":return[o.softplus(w("x",r,t,e))];case"Sqrt":return[o.sqrt(w("x",r,t,e))];case"Square":return[o.square(w("x",r,t,e))];case"Tanh":return[o.tanh(w("x",r,t,e))];case"Tan":return[o.tan(w("x",r,t,e))];case"ClipByValue":return[o.clipByValue(w("x",r,t,e),w("clipValueMin",r,t,e),w("clipValueMax",r,t,e))];case"Relu6":return[o.relu6(w("x",r,t,e))];case"Rsqrt":return[o.rsqrt(le(r.inputNames[0],t,e))];case"LeakyRelu":return[o.leakyRelu(w("x",r,t,e),w("alpha",r,t,e))];case"Prelu":return[o.prelu(w("x",r,t,e),w("alpha",r,t,e))];case"IsNan":return[o.isNaN(le(r.inputNames[0],t,e))];case"IsInf":return[o.isInf(le(r.inputNames[0],t,e))];case"IsFinite":return[o.isFinite(le(r.inputNames[0],t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};function mr(r,t,e=""){if(!(typeof r=="number"||typeof t=="number")){y.assert(r.length===t.length,()=>e+` Shapes ${r} and ${t} must match`);for(let o=0;o<r.length;o++){let n=r[o],s=t[o];y.assert(n<0||s<0||n===s,()=>e+` Shapes ${r} and ${t} must match`)}}}function KE(r){return!(typeof r=="number"||r.some(t=>t<0))}function Jl(r,t,e){let o=ad(r,e),n=!KE(o);if(n&&t.length===0)throw new Error(`Tried to calculate elements of an empty list with non-fully-defined elementShape: ${o}`);if(n&&t.forEach(s=>{o=ad(s.shape,o)}),!KE(o))throw new Error(`Non-fully-defined elementShape: ${o}`);return o}function ad(r,t){if(typeof r=="number")return t;if(typeof t=="number")return r;if(r.length!==t.length)throw new Error(`Incompatible ranks during merge: ${r} vs. ${t}`);let e=[];for(let o=0;o<r.length;++o){let n=r[o],s=t[o];if(n>=0&&s>=0&&n!==s)throw new Error(`Incompatible shape during merge: ${r} vs. ${t}`);e[o]=n>=0?n:s}return e}var id=class{constructor(t,e,o,n,s,a,i){this.name=t,this.dtype=e,this.maxSize=o,this.elementShape=n,this.identicalElementShapes=s,this.dynamicSize=a,this.clearAfterRead=i,this.tensors=[],this.closed_=!1,this.idTensor=it(0),Ve(this.idTensor)}get id(){return this.idTensor.id}get closed(){return this.closed_}clearAndClose(t){this.tensors.forEach(e=>{(t==null||!t.has(e.tensor.id))&&e.tensor.dispose()}),this.tensors=[],this.closed_=!0,this.idTensor.dispose()}size(){return this.tensors.length}read(t){if(this.closed_)throw new Error(`TensorArray ${this.name} has already been closed.`);if(t<0||t>=this.size())throw new Error(`Tried to read from index ${t}, but array size is: ${this.size()}`);let e=this.tensors[t];if(e.cleared)throw new Error(`TensorArray ${this.name}: Could not read index ${t} twice because it was cleared after a previous read (perhaps try setting clear_after_read = false?).`);return this.clearAfterRead&&(e.cleared=!0),e.read=!0,e.tensor}readMany(t){return t.map(e=>this.read(e))}write(t,e){if(this.closed_)throw new Error(`TensorArray ${this.name} has already been closed.`);if(t<0||!this.dynamicSize&&t>=this.maxSize)throw new Error(`Tried to write to index ${t}, but array is not resizeable and size is: ${this.maxSize}`);let o=this.tensors[t]||{};if(e.dtype!==this.dtype)throw new Error(`TensorArray ${this.name}: Could not write to TensorArray index ${t},
          because the value dtype is ${e.dtype}, but TensorArray dtype is ${this.dtype}.`);if(this.size()===0&&(this.elementShape==null||this.elementShape.length===0)&&(this.elementShape=e.shape),mr(this.elementShape,e.shape,`TensorArray ${this.name}: Could not write to TensorArray index ${t}.`),o.read)throw new Error(`TensorArray ${this.name}: Could not write to TensorArray index ${t}, because it has already been read.`);if(o.written)throw new Error(`TensorArray ${this.name}: Could not write to TensorArray index ${t}, because it has already been written.`);o.tensor=e,Ve(e),o.written=!0,this.tensors[t]=o}writeMany(t,e){if(t.length!==e.length)throw new Error(`TensorArray ${this.name}: could not write multiple tensors,because the index size: ${t.length} is not the same as tensors size: ${e.length}.`);t.forEach((o,n)=>this.write(o,e[n]))}gather(t,e){if(e&&e!==this.dtype)throw new Error(`TensorArray dtype is ${this.dtype} but gather requested dtype ${e}`);if(t)t=t.slice(0,this.size());else{t=[];for(let n=0;n<this.size();n++)t.push(n)}if(t.length===0)return $e([],[0].concat(this.elementShape));let o=this.readMany(t);return mr(this.elementShape,o[0].shape,"TensorArray shape mismatch: "),_e(o,0)}concat(t){if(t&&t!==this.dtype)throw new Error(`TensorArray dtype is ${this.dtype} but concat requested dtype ${t}`);if(this.size()===0)return $e([],[0].concat(this.elementShape));let e=[];for(let n=0;n<this.size();n++)e.push(n);let o=this.readMany(e);return mr(this.elementShape,o[0].shape,`TensorArray shape mismatch: tensor array shape (${this.elementShape}) vs first tensor shape (${o[0].shape})`),Lt(o,0)}scatter(t,e){if(e.dtype!==this.dtype)throw new Error(`TensorArray dtype is ${this.dtype} but tensor has dtype ${e.dtype}`);if(t.length!==e.shape[0])throw new Error(`Expected len(indices) == tensor.shape[0], but saw: ${t.length} vs. ${e.shape[0]}`);let o=Math.max(...t);if(!this.dynamicSize&&o>=this.maxSize)throw new Error(`Max index must be < array size (${o}  vs. ${this.maxSize})`);this.writeMany(t,ir(e,0))}split(t,e){if(e.dtype!==this.dtype)throw new Error(`TensorArray dtype is ${this.dtype} but tensor has dtype ${e.dtype}`);let o=0,n=t.map(l=>(o+=l,o));if(o!==e.shape[0])throw new Error(`Expected sum of lengths to be equal to
          tensor.shape[0], but sum of lengths is
        ${o}, and tensor's shape is: ${e.shape}`);if(!this.dynamicSize&&t.length!==this.maxSize)throw new Error(`TensorArray's size is not equal to the size of lengths (${this.maxSize} vs. ${t.length}), and the TensorArray is not marked as dynamically resizeable`);let s=o===0?0:e.size/o,a=[];at(()=>{e=L(e,[1,o,s]);for(let l=0;l<t.length;++l){let u=[0,l===0?0:n[l-1],0],p=[1,t[l],s];a[l]=L(ft(e,u,p),this.elementShape)}return a});let i=[];for(let l=0;l<t.length;l++)i[l]=l;this.writeMany(i,a)}};var tc=class r{get id(){return this.idTensor.id}constructor(t,e,o,n=-1){this.tensors=t,this.elementShape=e,this.elementDtype=o,t?.forEach(s=>{if(o!==s.dtype)throw new Error(`Invalid data types; op elements ${o}, but list elements ${s.dtype}`);mr(e,s.shape,"TensorList shape mismatch: "),Ve(s)}),this.idTensor=it(0),this.maxNumElements=n,Ve(this.idTensor)}copy(){return new r([...this.tensors],this.elementShape,this.elementDtype)}clearAndClose(t){this.tensors.forEach(e=>{(t==null||!t.has(e.id))&&e.dispose()}),this.tensors.length=0,this.idTensor.dispose()}size(){return this.tensors.length}stack(t,e,o=-1){if(e!==this.elementDtype)throw new Error(`Invalid data types; op elements ${e}, but list elements ${this.elementDtype}`);if(o!==-1&&this.tensors.length!==o)throw new Error(`Operation expected a list with ${o} elements but got a list with ${this.tensors.length} elements.`);mr(t,this.elementShape,"TensorList shape mismatch: ");let n=Jl(this.elementShape,this.tensors,t);return at(()=>{let s=this.tensors.map(a=>L(a,n));return _e(s,0)})}popBack(t,e){if(e!==this.elementDtype)throw new Error(`Invalid data types; op elements ${e}, but list elements ${this.elementDtype}`);if(this.size()===0)throw new Error("Trying to pop from an empty list.");let o=Jl(this.elementShape,this.tensors,t),n=this.tensors.pop();return n.kept=!1,mr(n.shape,t,"TensorList shape mismatch: "),L(n,o)}pushBack(t){if(t.dtype!==this.elementDtype)throw new Error(`Invalid data types; op elements ${t.dtype}, but list elements ${this.elementDtype}`);if(mr(t.shape,this.elementShape,"TensorList shape mismatch: "),this.maxNumElements===this.size())throw new Error("Trying to push element into a full list.");Ve(t),this.tensors.push(t)}resize(t){if(t<0)throw new Error(`TensorListResize expects size to be non-negative. Got: ${t}`);if(this.maxNumElements!==-1&&t>this.maxNumElements)throw new Error(`TensorListResize input size ${t} is greater maxNumElement ${this.maxNumElements}.`);let e=new r([],this.elementShape,this.elementDtype,this.maxNumElements);e.tensors.length=t;for(let o=0;o<Math.min(this.tensors.length,t);++o)e.tensors[o]=this.tensors[o];return e}getItem(t,e,o){if(o!==this.elementDtype)throw new Error(`Invalid data types; op elements ${o}, but list elements ${this.elementDtype}`);if(t<0||t>this.tensors.length)throw new Error(`Trying to access element ${t} in a list with ${this.tensors.length} elements.`);if(this.tensors[t]==null)throw new Error(`element at index ${t} is null.`);mr(this.tensors[t].shape,e,"TensorList shape mismatch: ");let n=Jl(this.elementShape,this.tensors,e);return L(this.tensors[t],n)}setItem(t,e){if(e.dtype!==this.elementDtype)throw new Error(`Invalid data types; op elements ${e.dtype}, but list elements ${this.elementDtype}`);if(t<0||this.maxNumElements!==-1&&t>=this.maxNumElements)throw new Error(`Trying to set element ${t} in a list with max ${this.maxNumElements} elements.`);mr(this.elementShape,e.shape,"TensorList shape mismatch: "),Ve(e),this.tensors[t]!=null&&(this.tensors[t].kept=!1),this.tensors[t]=e}gather(t,e,o){if(e!==this.elementDtype)throw new Error(`Invalid data types; op elements ${e}, but list elements ${this.elementDtype}`);mr(this.elementShape,o,"TensorList shape mismatch: "),t=t.slice(0,this.size());let n=Jl(this.elementShape,this.tensors,o);return t.length===0?$e([],[0].concat(n)):at(()=>{let s=t.map(a=>L(this.tensors[a],n));return _e(s,0)})}concat(t,e){if(t&&t!==this.elementDtype)throw new Error(`TensorList dtype is ${this.elementDtype} but concat requested dtype ${t}`);mr(this.elementShape,e,"TensorList shape mismatch: ");let o=Jl(this.elementShape,this.tensors,e);return this.size()===0?$e([],[0].concat(o)):at(()=>{let n=this.tensors.map(s=>L(s,o));return Lt(n,0)})}};function qE(r,t,e){let o=r.dtype;if(r.shape.length<1)throw new Error(`Tensor must be at least a vector, but saw shape: ${r.shape}`);if(r.dtype!==e)throw new Error(`Invalid data types; op elements ${r.dtype}, but list elements ${e}`);let n=r.shape.slice(1);mr(n,t,"TensorList shape mismatch: ");let s=ir(r);return new tc(s,t,o)}function jE(r,t,e,o){return new tc([],r,t,o)}function XE(r,t,e,o){if(t.length!==r.shape[0])throw new Error(`Expected len(indices) == tensor.shape[0], but saw: ${t.length} vs. ${r.shape[0]}`);let n=Math.max(...t);if(o!=null&&o!==-1&&n>=o)throw new Error(`Max index must be < array size (${n}  vs. ${o})`);let s=new tc([],e,r.dtype,o),a=ir(r,0);return t.forEach((i,l)=>{s.setItem(i,a[l])}),s}function YE(r,t,e){let o=0,n=t.map(u=>(o+=u,o));if(o!==r.shape[0])throw new Error(`Expected sum of lengths to be equal to
          tensor.shape[0], but sum of lengths is
        ${o}, and tensor's shape is: ${r.shape}`);let s=r.shape.slice(1),a=ad(s,e),i=o===0?0:r.size/o,l=at(()=>{let u=[];r=L(r,[1,o,i]);for(let p=0;p<t.length;++p){let f=[0,p===0?0:n[p-1],0],d=[1,t[p],i];u[p]=L(ft(r,f,d),a)}return r.dispose(),u}),c=new tc([],e,r.dtype,t.length);for(let u=0;u<l.length;u++)c.setItem(u,l[u]);return c}var QE=async(r,t,e)=>{switch(r.op){case"If":case"StatelessIf":{let o=w("thenBranch",r,t,e),n=w("elseBranch",r,t,e),s=w("cond",r,t,e),a=w("args",r,t,e);return(await s.data())[0]?e.functionMap[o].executeFunctionAsync(a,e.tensorArrayMap,e.tensorListMap):e.functionMap[n].executeFunctionAsync(a,e.tensorArrayMap,e.tensorListMap)}case"While":case"StatelessWhile":{let o=w("body",r,t,e),n=w("cond",r,t,e),s=w("args",r,t,e),a=await e.functionMap[n].executeFunctionAsync(s,e.tensorArrayMap,e.tensorListMap),i=s.map(u=>u.id),l=await a[0].data();a.forEach(u=>{!u.kept&&i.indexOf(u.id)===-1&&u.dispose()});let c=s;for(;l[0];){let u=c;c=await e.functionMap[o].executeFunctionAsync(c,e.tensorArrayMap,e.tensorListMap);let p=c.map(f=>f.id);u.forEach(f=>{!f.kept&&i.indexOf(f.id)===-1&&p.indexOf(f.id)===-1&&f.dispose()});let m=await e.functionMap[n].executeFunctionAsync(c,e.tensorArrayMap,e.tensorListMap);l=await m[0].data(),m.forEach(f=>{!f.kept&&i.indexOf(f.id)===-1&&p.indexOf(f.id)===-1&&f.dispose()})}return c}case"LoopCond":{let o=w("pred",r,t,e);return[zr(o)]}case"Switch":{let o=w("pred",r,t,e),n=w("data",r,t,e);return n.kept||(n=zr(n)),(await o.data())[0]?[void 0,n]:[n,void 0]}case"Merge":{let o=r.inputNames.find(n=>le(n,t,e)!==void 0);if(o){let n=le(o,t,e);return[zr(n)]}return}case"Enter":{let o=w("frameName",r,t,e),n=w("tensor",r,t,e);return e.enterFrame(o),[zr(n)]}case"Exit":{let o=w("tensor",r,t,e);return e.exitFrame(),[zr(o)]}case"NextIteration":{let o=w("tensor",r,t,e);return e.nextIteration(),[zr(o)]}case"TensorArrayV3":{let o=w("size",r,t,e),n=w("dtype",r,t,e),s=w("elementShape",r,t,e),a=w("dynamicSize",r,t,e),i=w("clearAfterRead",r,t,e),l=w("identicalElementShapes",r,t,e),c=w("name",r,t,e),u=new id(c,n,o,s,l,a,i);return e.addTensorArray(u),[u.idTensor,it(1)]}case"TensorArrayWriteV3":{let o=w("tensorArrayId",r,t,e),n=w("index",r,t,e),s=w("tensor",r,t,e),a=e.getTensorArray(o.id);return a.write(n,s),[a.idTensor]}case"TensorArrayReadV3":{let o=w("tensorArrayId",r,t,e),n=w("index",r,t,e);return[e.getTensorArray(o.id).read(n)]}case"TensorArrayGatherV3":{let o=w("tensorArrayId",r,t,e),n=w("indices",r,t,e),s=w("dtype",r,t,e);return[e.getTensorArray(o.id).gather(n,s)]}case"TensorArrayScatterV3":{let o=w("tensorArrayId",r,t,e),n=w("indices",r,t,e),s=w("tensor",r,t,e),a=e.getTensorArray(o.id);return a.scatter(n,s),[a.idTensor]}case"TensorArrayConcatV3":{let o=w("tensorArrayId",r,t,e),n=e.getTensorArray(o.id),s=w("dtype",r,t,e);return[n.concat(s)]}case"TensorArraySplitV3":{let o=w("tensorArrayId",r,t,e),n=w("tensor",r,t,e),s=w("lengths",r,t,e),a=e.getTensorArray(o.id);return a.split(s,n),[a.idTensor]}case"TensorArraySizeV3":{let o=w("tensorArrayId",r,t,e),n=e.getTensorArray(o.id);return[it(n.size(),"int32")]}case"TensorArrayCloseV3":{let o=w("tensorArrayId",r,t,e),n=e.getTensorArray(o.id);return n.clearAndClose(),[n.idTensor]}case"TensorListSetItem":{let o=w("tensorListId",r,t,e),n=w("index",r,t,e),s=w("tensor",r,t,e),a=e.getTensorList(o.id);return a.setItem(n,s),[a.idTensor]}case"TensorListGetItem":{let o=w("tensorListId",r,t,e),n=w("index",r,t,e),s=w("elementShape",r,t,e),a=w("elementDType",r,t,e);return[e.getTensorList(o.id).getItem(n,s,a)]}case"TensorListScatterV2":case"TensorListScatter":{let o=w("indices",r,t,e),n=w("tensor",r,t,e),s=w("elementShape",r,t,e),a=w("numElements",r,t,e),i=XE(n,o,s,a);return e.addTensorList(i),[i.idTensor]}case"TensorListReserve":case"EmptyTensorList":{let o=w("elementShape",r,t,e),n=w("elementDType",r,t,e),s;r.op==="TensorListReserve"?s="numElements":s="maxNumElements";let a=w(s,r,t,e),i=r.op==="TensorListReserve"?-1:a,l=jE(o,n,a,i);return e.addTensorList(l),[l.idTensor]}case"TensorListGather":{let o=w("tensorListId",r,t,e),n=w("indices",r,t,e),s=w("elementShape",r,t,e),a=w("elementDType",r,t,e);return[e.getTensorList(o.id).gather(n,a,s)]}case"TensorListStack":{let o=w("tensorListId",r,t,e),n=w("elementShape",r,t,e),s=w("elementDType",r,t,e),a=w("numElements",r,t,e);return[e.getTensorList(o.id).stack(n,s,a)]}case"TensorListFromTensor":{let o=w("tensor",r,t,e),n=w("elementShape",r,t,e),s=w("elementDType",r,t,e),a=qE(o,n,s);return e.addTensorList(a),[a.idTensor]}case"TensorListConcat":case"TensorListConcatV2":{let o=w("tensorListId",r,t,e),n=e.getTensorList(o.id),s=w("dtype",r,t,e),a=w("elementShape",r,t,e);return[n.concat(s,a)]}case"TensorListPushBack":{let o=w("tensorListId",r,t,e),n=w("tensor",r,t,e),s=e.getTensorList(o.id);return s.pushBack(n),[s.idTensor]}case"TensorListPopBack":{let o=w("tensorListId",r,t,e),n=w("elementShape",r,t,e),s=w("elementDType",r,t,e);return[e.getTensorList(o.id).popBack(n,s)]}case"TensorListSplit":{let o=w("tensor",r,t,e),n=w("elementShape",r,t,e),s=w("lengths",r,t,e),a=YE(o,s,n);return e.addTensorList(a),[a.idTensor]}case"TensorListLength":{let o=w("tensorListId",r,t,e),n=e.getTensorList(o.id);return[it(n.size(),"int32")]}case"TensorListResize":{let o=w("tensorListId",r,t,e),n=w("size",r,t,e),a=e.getTensorList(o.id).resize(n);return e.addTensorList(a),[a.idTensor]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};function ZE(r,t,e){let[o,n]=w("fusedOps",r,t,e),s=o==="biasadd",a=!s,i=n==="prelu",l=o==="fusedbatchnorm",c=w("numArgs",r,t,e);if(s){if(i&&c!==2)throw new Error("FusedConv2d and DepthwiseConv2d with BiasAdd and Prelu must have two extra arguments: bias and alpha.");if(!i&&s&&c!==1)throw new Error("FusedConv2d and DepthwiseConv2d with BiasAdd must have one extra argument: bias.")}if(l)throw new Error("FusedConv2d and DepthwiseConv2d with FusedBatchNorm is not supported");let u=w("strides",r,t,e),p=Ou(r,t,e),m=w("dataFormat",r,t,e).toUpperCase(),f=w("dilations",r,t,e),[d,g]=w("args",r,t,e);a&&(g=d,d=void 0);let h=w("leakyreluAlpha",r,t,e);return{stride:u,pad:p,dataFormat:m,dilations:f,biasArg:d,preluArg:g,activationFunc:n,leakyreluAlpha:h}}var JE=(r,t,e,o=Rt)=>{switch(r.op){case"Conv1D":{let n=w("stride",r,t,e),s=w("pad",r,t,e),a=w("dataFormat",r,t,e).toUpperCase(),i=w("dilation",r,t,e);return[o.conv1d(w("x",r,t,e),w("filter",r,t,e),n,s,a,i)]}case"Conv2D":{let n=w("strides",r,t,e),s=Ou(r,t,e),a=w("dataFormat",r,t,e).toUpperCase(),i=w("dilations",r,t,e);return[o.conv2d(w("x",r,t,e),w("filter",r,t,e),[n[1],n[2]],s,a,[i[1],i[2]])]}case"_FusedConv2D":{let{stride:n,pad:s,dataFormat:a,dilations:i,biasArg:l,preluArg:c,activationFunc:u,leakyreluAlpha:p}=ZE(r,t,e);return[o.fused.conv2d({x:w("x",r,t,e),filter:w("filter",r,t,e),strides:[n[1],n[2]],pad:s,dataFormat:a,dilations:[i[1],i[2]],bias:l,activation:u,preluActivationWeights:c,leakyreluAlpha:p})]}case"FusedDepthwiseConv2dNative":{let{stride:n,pad:s,dataFormat:a,dilations:i,biasArg:l,preluArg:c,activationFunc:u,leakyreluAlpha:p}=ZE(r,t,e);return[o.fused.depthwiseConv2d({x:w("x",r,t,e),filter:w("filter",r,t,e),strides:[n[1],n[2]],pad:s,dataFormat:a,dilations:[i[1],i[2]],bias:l,activation:u,preluActivationWeights:c,leakyreluAlpha:p})]}case"Conv2DBackpropInput":case"Conv2dTranspose":{let n=w("outputShape",r,t,e),s=w("strides",r,t,e),a=Ou(r,t,e);return[o.conv2dTranspose(w("x",r,t,e),w("filter",r,t,e),n,[s[1],s[2]],a)]}case"DepthwiseConv2dNative":case"DepthwiseConv2d":{let n=w("strides",r,t,e),s=Ou(r,t,e),a=w("dilations",r,t,e),i=w("dataFormat",r,t,e).toUpperCase();return[o.depthwiseConv2d(w("input",r,t,e),w("filter",r,t,e),[n[1],n[2]],s,i,[a[1],a[2]])]}case"Conv3D":{let n=w("strides",r,t,e),s=w("pad",r,t,e),a=w("dataFormat",r,t,e).toUpperCase(),i=w("dilations",r,t,e);return[o.conv3d(w("x",r,t,e),w("filter",r,t,e),[n[1],n[2],n[3]],s,a,[i[1],i[2],i[3]])]}case"AvgPool":{let n=w("strides",r,t,e),s=w("pad",r,t,e),a=w("kernelSize",r,t,e);return[o.avgPool(w("x",r,t,e),[a[1],a[2]],[n[1],n[2]],s)]}case"MaxPool":{let n=w("strides",r,t,e),s=w("pad",r,t,e),a=w("kernelSize",r,t,e);return[o.maxPool(w("x",r,t,e),[a[1],a[2]],[n[1],n[2]],s)]}case"MaxPoolWithArgmax":{let n=w("strides",r,t,e),s=w("pad",r,t,e),a=w("kernelSize",r,t,e),i=w("includeBatchInIndex",r,t,e),{result:l,indexes:c}=o.maxPoolWithArgmax(w("x",r,t,e),[a[1],a[2]],[n[1],n[2]],s,i);return[l,c]}case"AvgPool3D":{let n=w("strides",r,t,e),s=w("pad",r,t,e),a=w("kernelSize",r,t,e);return[o.avgPool3d(w("x",r,t,e),[a[1],a[2],a[3]],[n[1],n[2],n[3]],s)]}case"MaxPool3D":{let n=w("strides",r,t,e),s=w("pad",r,t,e),a=w("kernelSize",r,t,e);return[o.maxPool3d(w("x",r,t,e),[a[1],a[2],a[3]],[n[1],n[2],n[3]],s)]}case"Dilation2D":{let n=w("strides",r,t,e),s=w("pad",r,t,e),a=w("dilations",r,t,e),i=n[1],l=n[2],c=a[1],u=a[2];return[o.dilation2d(w("x",r,t,e),w("filter",r,t,e),[i,l],s,[c,u],"NHWC")]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var t$=(r,t,e,o=Rt)=>{switch(r.op){case"Fill":{let n=w("shape",r,t,e),s=w("dtype",r,t,e),a=w("value",r,t,e);return[o.fill(n,a,s)]}case"LinSpace":{let n=w("start",r,t,e),s=w("stop",r,t,e),a=w("num",r,t,e);return[o.linspace(n,s,a)]}case"Multinomial":{let n=w("logits",r,t,e),s=w("numSamples",r,t,e),a=w("seed",r,t,e);return[o.multinomial(n,s,a)]}case"OneHot":{let n=w("indices",r,t,e),s=w("depth",r,t,e),a=w("onValue",r,t,e),i=w("offValue",r,t,e),l=w("dtype",r,t,e);return[o.oneHot(n,s,a,i,l)]}case"Ones":return[o.ones(w("shape",r,t,e),w("dtype",r,t,e))];case"OnesLike":return[o.onesLike(w("x",r,t,e))];case"RandomStandardNormal":return[o.randomStandardNormal(w("shape",r,t,e),w("dtype",r,t,e),w("seed",r,t,e))];case"RandomUniform":return[o.randomUniform(w("shape",r,t,e),w("minval",r,t,e),w("maxval",r,t,e),w("dtype",r,t,e))];case"RandomUniformInt":return[o.randomUniformInt(w("shape",r,t,e),w("minval",r,t,e),w("maxval",r,t,e),w("seed",r,t,e))];case"Range":{let n=w("start",r,t,e),s=w("stop",r,t,e),a=w("step",r,t,e);return[o.range(n,s,a,w("dtype",r,t,e))]}case"TruncatedNormal":{let n=w("shape",r,t,e),s=w("mean",r,t,e),a=w("stdDev",r,t,e),i=w("seed",r,t,e);return[o.truncatedNormal(n,s,a,w("dtype",r,t,e),i)]}case"Zeros":return[o.zeros(w("shape",r,t,e),w("dtype",r,t,e))];case"ZerosLike":return[o.zerosLike(w("x",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};function fb(r,t,e){let o=w("boxes",r,t,e),n=w("scores",r,t,e),s=w("maxOutputSize",r,t,e),a=w("iouThreshold",r,t,e),i=w("scoreThreshold",r,t,e),l=w("softNmsSigma",r,t,e);return{boxes:o,scores:n,maxOutputSize:s,iouThreshold:a,scoreThreshold:i,softNmsSigma:l}}var e$=async(r,t,e,o,n=Rt)=>{switch(r.op){case"NonMaxSuppressionV5":{let{boxes:s,scores:a,maxOutputSize:i,iouThreshold:l,scoreThreshold:c,softNmsSigma:u}=fb(r,t,e),p=await n.image.nonMaxSuppressionWithScoreAsync(s,a,i,l,c,u);return[p.selectedIndices,p.selectedScores]}case"NonMaxSuppressionV4":{let{boxes:s,scores:a,maxOutputSize:i,iouThreshold:l,scoreThreshold:c}=fb(r,t,e),u=w("padToMaxOutputSize",r,t,e),p=await n.image.nonMaxSuppressionPaddedAsync(s,a,i,l,c,u);return[p.selectedIndices,p.validOutputs]}case"NonMaxSuppressionV3":case"NonMaxSuppressionV2":{let{boxes:s,scores:a,maxOutputSize:i,iouThreshold:l,scoreThreshold:c}=fb(r,t,e);return[await n.image.nonMaxSuppressionAsync(s,a,i,l,c)]}case"Where":{let s=n.cast(w("condition",r,t,e),"bool"),a=[await n.whereAsync(s)];return s.dispose(),a}case"ListDiff":return n.setdiff1dAsync(w("x",r,t,e),w("y",r,t,e));default:throw TypeError(`Node type ${r.op} is not implemented`)}};var r$=(r,t,e,o=Rt)=>{switch(r.op){case"LowerBound":{let n=w("sortedSequence",r,t,e),s=w("values",r,t,e);return[o.lowerBound(n,s)]}case"TopKV2":{let n=w("x",r,t,e),s=w("k",r,t,e),a=w("sorted",r,t,e),i=o.topk(n,s,a);return[i.values,i.indices]}case"UpperBound":{let n=w("sortedSequence",r,t,e),s=w("values",r,t,e);return[o.upperBound(n,s)]}case"Unique":{let n=w("x",r,t,e),s=o.unique(n);return[s.values,s.indices]}case"UniqueV2":{let n=w("x",r,t,e),s=w("axis",r,t,e),a=o.unique(n,s);return[a.values,a.indices]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var o$=(r,t,e,o=Rt)=>{switch(r.op){case"Const":return t[r.name];case"PlaceholderWithDefault":let n=w("default",r,t,e);return[le(r.name,t,e)||n];case"Placeholder":return[le(r.name,t,e)];case"Identity":case"StopGradient":case"FakeQuantWithMinMaxVars":{let u=w("x",r,t,e);return[zr(u)]}case"IdentityN":return w("x",r,t,e).map(u=>zr(u));case"Snapshot":let s=w("x",r,t,e);return[zr(s)];case"Shape":return[o.tensor1d(w("x",r,t,e).shape,"int32")];case"ShapeN":return w("x",r,t,e).map(u=>o.tensor1d(u.shape));case"Size":return[o.scalar(w("x",r,t,e).size,"int32")];case"Rank":return[o.scalar(w("x",r,t,e).rank,"int32")];case"NoOp":return[o.scalar(1)];case"Print":let a=w("x",r,t,e),i=w("data",r,t,e),l=w("message",r,t,e),c=w("summarize",r,t,e);console.warn("The graph has a tf.print() operation,usually used for debugging, which slows down performance."),console.log(l);for(let u=0;u<i.length;u++)console.log(Array.prototype.slice.call(i[u].dataSync()).slice(0,c));return[a];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var ld=class{get id(){return this.handle.id}constructor(t,e){this.keyDType=t,this.valueDType=e,this.handle=it(0),this.tensorMap=new Map,Ve(this.handle)}clearAndClose(){this.tensorMap.forEach(t=>t.dispose()),this.tensorMap.clear(),this.handle.dispose()}size(){return this.tensorMap.size}tensorSize(){return it(this.size(),"int32")}async import(t,e){this.checkKeyAndValueTensor(t,e);let o=await t.data();return this.tensorMap.forEach(n=>n.dispose()),this.tensorMap.clear(),at(()=>{let n=ir(e),s=o.length,a=n.length;y.assert(s===a,()=>`The number of elements doesn't match, keys has ${s} elements, the values has ${a} elements.`);for(let i=0;i<s;i++){let l=o[i],c=n[i];Ve(c),this.tensorMap.set(l,c)}return this.handle})}async find(t,e){this.checkKeyAndValueTensor(t,e);let o=await t.data();return at(()=>{let n=[];for(let s=0;s<o.length;s++){let a=o[s],i=this.findWithDefault(a,e);n.push(i)}return _e(n)})}findWithDefault(t,e){let o=this.tensorMap.get(t);return o??e}checkKeyAndValueTensor(t,e){if(t.dtype!==this.keyDType)throw new Error(`Expect key dtype ${this.keyDType}, but got ${t.dtype}`);if(e.dtype!==this.valueDType)throw new Error(`Expect value dtype ${this.valueDType}, but got ${e.dtype}`)}};var n$=async(r,t,e,o)=>{switch(r.op){case"HashTable":case"HashTableV2":{let n=o.getHashTableHandleByName(r.name);if(n!=null)return[n];{let s=w("keyDType",r,t,e),a=w("valueDType",r,t,e),i=new ld(s,a);return o.addHashTable(r.name,i),[i.handle]}}case"InitializeTable":case"InitializeTableV2":case"LookupTableImport":case"LookupTableImportV2":{let n=w("tableHandle",r,t,e,o),s=w("keys",r,t,e),a=w("values",r,t,e);return[await o.getHashTableById(n.id).import(s,a)]}case"LookupTableFind":case"LookupTableFindV2":{let n=w("tableHandle",r,t,e,o),s=w("keys",r,t,e),a=w("defaultValue",r,t,e);return[await o.getHashTableById(n.id).find(s,a)]}case"LookupTableSize":case"LookupTableSizeV2":{let n=w("tableHandle",r,t,e,o);return[o.getHashTableById(n.id).tensorSize()]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var s$=(r,t,e,o=Rt)=>{switch(r.op){case"ResizeBilinear":{let n=w("images",r,t,e),s=w("size",r,t,e),a=w("alignCorners",r,t,e),i=w("halfPixelCenters",r,t,e);return[o.image.resizeBilinear(n,[s[0],s[1]],a,i)]}case"ResizeNearestNeighbor":{let n=w("images",r,t,e),s=w("size",r,t,e),a=w("alignCorners",r,t,e),i=w("halfPixelCenters",r,t,e);return[o.image.resizeNearestNeighbor(n,[s[0],s[1]],a,i)]}case"CropAndResize":{let n=w("image",r,t,e),s=w("boxes",r,t,e),a=w("boxInd",r,t,e),i=w("cropSize",r,t,e),l=w("method",r,t,e),c=w("extrapolationValue",r,t,e);return[o.image.cropAndResize(n,s,a,i,l,c)]}case"ImageProjectiveTransformV3":{let n=w("images",r,t,e),s=w("transforms",r,t,e),a=w("outputShape",r,t,e),i=w("fillValue",r,t,e),l=w("interpolation",r,t,e),c=w("fillMode",r,t,e);return[o.image.transform(n,s,l.toLowerCase(),c.toLowerCase(),i,a)]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var a$=(r,t,e,o=Rt)=>{switch(r.op){case"Equal":return[o.equal(w("a",r,t,e),w("b",r,t,e))];case"NotEqual":return[o.notEqual(w("a",r,t,e),w("b",r,t,e))];case"Greater":return[o.greater(w("a",r,t,e),w("b",r,t,e))];case"GreaterEqual":return[o.greaterEqual(w("a",r,t,e),w("b",r,t,e))];case"Less":return[o.less(w("a",r,t,e),w("b",r,t,e))];case"LessEqual":return[o.lessEqual(w("a",r,t,e),w("b",r,t,e))];case"LogicalAnd":return[o.logicalAnd(w("a",r,t,e),w("b",r,t,e))];case"LogicalNot":return[o.logicalNot(w("a",r,t,e))];case"LogicalOr":return[o.logicalOr(w("a",r,t,e),w("b",r,t,e))];case"Select":case"SelectV2":return[o.where(w("condition",r,t,e),w("a",r,t,e),w("b",r,t,e))];case"BitwiseAnd":return[o.bitwiseAnd(w("a",r,t,e),w("b",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var i$=(r,t,e,o=Rt)=>{switch(r.op){case"BatchMatMul":case"BatchMatMulV2":case"MatMul":return[o.matMul(w("a",r,t,e),w("b",r,t,e),w("transposeA",r,t,e),w("transposeB",r,t,e))];case"Einsum":return[o.einsum(w("equation",r,t,e),...w("tensors",r,t,e))];case"Transpose":return[o.transpose(w("x",r,t,e),w("perm",r,t,e))];case"_FusedMatMul":let[n,s]=w("fusedOps",r,t,e),a=n==="biasadd",i=s==="prelu",l=w("numArgs",r,t,e),c=w("leakyreluAlpha",r,t,e);if(a){if(i&&l!==2)throw new Error("Fused MatMul with BiasAdd and Prelu must have two extra arguments: bias and alpha.");if(!i&&l!==1)throw new Error("Fused MatMul with BiasAdd must have one extra argument: bias.")}let[u,p]=w("args",r,t,e);return[o.fused.matMul({a:w("a",r,t,e),b:w("b",r,t,e),transposeA:w("transposeA",r,t,e),transposeB:w("transposeB",r,t,e),bias:u,activation:s,preluActivationWeights:p,leakyreluAlpha:c})];case"MatrixBandPart":return[o.linalg.bandPart(w("a",r,t,e),w("numLower",r,t,e),w("numUpper",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var l$=(r,t,e,o=Rt)=>{switch(r.op){case"EuclideanNorm":return[o.euclideanNorm(w("x",r,t,e),w("axis",r,t,e),w("keepDims",r,t,e))];case"FusedBatchNorm":case"FusedBatchNormV2":return[o.batchNorm(w("x",r,t,e),w("mean",r,t,e),w("variance",r,t,e),w("offset",r,t,e),w("scale",r,t,e),w("epsilon",r,t,e))];case"FusedBatchNormV3":return[o.batchNorm(w("x",r,t,e),w("mean",r,t,e),w("variance",r,t,e),w("offset",r,t,e),w("scale",r,t,e),w("epsilon",r,t,e))];case"LRN":return[o.localResponseNormalization(w("x",r,t,e),w("radius",r,t,e),w("bias",r,t,e),w("alpha",r,t,e),w("beta",r,t,e))];case"Softmax":return[o.softmax(w("x",r,t,e))];case"LogSoftmax":return[o.logSoftmax(w("x",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var c$=(r,t,e,o=Rt)=>{switch(r.op){case"RaggedGather":{let{outputNestedSplits:n,outputDenseValues:s}=o.raggedGather(w("paramsNestedSplits",r,t,e),w("paramsDenseValues",r,t,e),w("indices",r,t,e),w("outputRaggedRank",r,t,e));return n.concat(s)}case"RaggedRange":{let{rtNestedSplits:n,rtDenseValues:s}=o.raggedRange(w("starts",r,t,e),w("limits",r,t,e),w("splits",r,t,e));return[n,s]}case"RaggedTensorToTensor":return[o.raggedTensorToTensor(w("shape",r,t,e),w("values",r,t,e),w("defaultValue",r,t,e),w("rowPartitionTensors",r,t,e),w("rowPartitionTypes",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var u$=(r,t,e,o=Rt)=>{switch(r.op){case"Max":{let i=w("axis",r,t,e),l=w("keepDims",r,t,e);return[o.max(w("x",r,t,e),i,l)]}case"Mean":{let i=w("axis",r,t,e),l=w("keepDims",r,t,e);return[o.mean(w("x",r,t,e),i,l)]}case"Min":{let i=w("axis",r,t,e),l=w("keepDims",r,t,e);return[o.min(w("x",r,t,e),i,l)]}case"Sum":{let i=w("axis",r,t,e),l=w("keepDims",r,t,e);return[o.sum(w("x",r,t,e),i,l)]}case"All":{let i=w("axis",r,t,e),l=w("keepDims",r,t,e);return[o.all(w("x",r,t,e),i,l)]}case"Any":{let i=w("axis",r,t,e),l=w("keepDims",r,t,e);return[o.any(w("x",r,t,e),i,l)]}case"ArgMax":{let i=w("axis",r,t,e);return[o.argMax(w("x",r,t,e),i)]}case"ArgMin":{let i=w("axis",r,t,e);return[o.argMin(w("x",r,t,e),i)]}case"Prod":{let i=w("axis",r,t,e),l=w("keepDims",r,t,e);return[o.prod(w("x",r,t,e),i,l)]}case"Cumprod":{let i=w("axis",r,t,e),l=w("exclusive",r,t,e),c=w("reverse",r,t,e);return[o.cumprod(w("x",r,t,e),i,l,c)]}case"Cumsum":{let i=w("axis",r,t,e),l=w("exclusive",r,t,e),c=w("reverse",r,t,e);return[o.cumsum(w("x",r,t,e),i,l,c)]}case"Bincount":let n=w("x",r,t,e),s=w("weights",r,t,e),a=w("size",r,t,e);return[o.bincount(n,s,a)];case"DenseBincount":{let i=w("x",r,t,e),l=w("weights",r,t,e),c=w("size",r,t,e),u=w("binaryOutput",r,t,e);return[o.denseBincount(i,l,c,u)]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var p$=(r,t,e,o=Rt)=>{switch(r.op){case"ConcatV2":case"Concat":{let n=w("n",r,t,e),s=w("axis",r,t,e),a=w("tensors",r,t,e);return a=a.slice(0,n),[o.concat(a,s)]}case"Gather":{let n=w("x",r,t,e),s=w("indices",r,t,e);return[o.gather(n,o.cast(s,"int32"),0)]}case"GatherV2":{let n=w("axis",r,t,e),s=w("batchDims",r,t,e),a=w("x",r,t,e),i=w("indices",r,t,e);return[o.gather(a,o.cast(i,"int32"),n,s)]}case"Reverse":{let n=w("dims",r,t,e),s=[];for(let i=0;i<n.length;i++)n[i]&&s.push(i);let a=w("x",r,t,e);return[o.reverse(a,s)]}case"ReverseV2":{let n=w("axis",r,t,e),s=w("x",r,t,e);return[o.reverse(s,n)]}case"Slice":{let n=w("begin",r,t,e),s=w("size",r,t,e);return[o.slice(w("x",r,t,e),n,s)]}case"StridedSlice":{let n=w("begin",r,t,e),s=w("end",r,t,e),a=w("strides",r,t,e),i=w("beginMask",r,t,e),l=w("endMask",r,t,e),c=w("ellipsisMask",r,t,e),u=w("newAxisMask",r,t,e),p=w("shrinkAxisMask",r,t,e),m=w("x",r,t,e);return[o.stridedSlice(m,n,s,a,i,l,c,u,p)]}case"Pack":return at(()=>{let n=w("axis",r,t,e),s=w("tensors",r,t,e),a=s[0].shape,i=o.squeeze(s[0]).shape,l=s.map(c=>{let u=y.arraysEqual(c.shape,a);if(!u&&!y.arraysEqual(o.squeeze(c).shape,i))throw new Error("the input tensors shape does not match");return u?c:o.reshape(c,a)});return[o.stack(l,n)]});case"Unpack":{let n=w("axis",r,t,e),s=w("tensor",r,t,e);return o.unstack(s,n)}case"Tile":{let n=w("reps",r,t,e);return[o.tile(w("x",r,t,e),n)]}case"Split":case"SplitV":{let n=w("axis",r,t,e),s=w("numOrSizeSplits",r,t,e),a=w("x",r,t,e);return o.split(a,s,n)}case"ScatterNd":{let n=w("indices",r,t,e),s=w("values",r,t,e),a=w("shape",r,t,e);return[o.scatterND(n,s,a)]}case"GatherNd":{let n=w("x",r,t,e),s=w("indices",r,t,e);return[o.gatherND(n,s)]}case"SparseToDense":{let n=w("sparseIndices",r,t,e),s=w("outputShape",r,t,e),a=w("sparseValues",r,t,e),i=w("defaultValue",r,t,e);return[o.sparseToDense(n,a,s,a.dtype===i.dtype?i:o.cast(i,a.dtype))]}case"TensorScatterUpdate":{let n=w("indices",r,t,e),s=w("values",r,t,e),a=w("tensor",r,t,e);return[o.tensorScatterUpdate(a,n,s)]}default:throw TypeError(`Node type ${r.op} is not implemented`)}};var m$=(r,t,e,o=Rt)=>{switch(r.op){case"SparseFillEmptyRows":{let{outputIndices:n,outputValues:s,emptyRowIndicator:a,reverseIndexMap:i}=o.sparse.sparseFillEmptyRows(w("indices",r,t,e),w("values",r,t,e),w("denseShape",r,t,e),w("defaultValue",r,t,e));return[n,s,a,i]}case"SparseReshape":{let{outputIndices:n,outputShape:s}=o.sparse.sparseReshape(w("inputIndices",r,t,e),w("inputShape",r,t,e),w("newShape",r,t,e));return[n,s]}case"SparseSegmentMean":return[o.sparse.sparseSegmentMean(w("data",r,t,e),w("indices",r,t,e),w("segmentIds",r,t,e))];case"SparseSegmentSum":return[o.sparse.sparseSegmentSum(w("data",r,t,e),w("indices",r,t,e),w("segmentIds",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var f$=(r,t,e,o=Rt)=>{switch(r.op){case"FFT":return[o.fft(w("x",r,t,e))];case"IFFT":return[o.ifft(w("x",r,t,e))];case"RFFT":return[o.rfft(w("x",r,t,e))];case"IRFFT":return[o.irfft(w("x",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var d$=(r,t,e,o=Rt)=>{switch(r.op){case"StaticRegexReplace":return[o.string.staticRegexReplace(w("input",r,t,e),w("pattern",r,t,e),w("rewrite",r,t,e),w("replaceGlobal",r,t,e))];case"StringNGrams":{let{nGrams:n,nGramsSplits:s}=o.string.stringNGrams(w("data",r,t,e),w("dataSplits",r,t,e),w("separator",r,t,e),w("nGramWidths",r,t,e),w("leftPad",r,t,e),w("rightPad",r,t,e),w("padWidth",r,t,e),w("preserveShortSequences",r,t,e));return[n,s]}case"StringSplit":{let{indices:n,values:s,shape:a}=o.string.stringSplit(w("input",r,t,e),w("delimiter",r,t,e),w("skipEmpty",r,t,e));return[n,s,a]}case"StringToHashBucketFast":return[o.string.stringToHashBucketFast(w("input",r,t,e),w("numBuckets",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};var h$=(r,t,e,o=Rt)=>{switch(r.op){case"Cast":return[o.cast(w("x",r,t,e),w("dtype",r,t,e))];case"ExpandDims":{let n=w("axis",r,t,e);return[o.expandDims(w("x",r,t,e),n)]}case"Squeeze":{let n=w("axis",r,t,e);return[o.squeeze(w("x",r,t,e),n)]}case"Reshape":return[o.reshape(w("x",r,t,e),w("shape",r,t,e))];case"EnsureShape":return[o.ensureShape(w("x",r,t,e),w("shape",r,t,e))];case"MirrorPad":return[o.mirrorPad(w("x",r,t,e),w("padding",r,t,e),w("mode",r,t,e))];case"PadV2":case"Pad":return[o.pad(w("x",r,t,e),w("padding",r,t,e),w("constantValue",r,t,e))];case"SpaceToBatchND":{let n=w("blockShape",r,t,e),s=w("paddings",r,t,e);return[o.spaceToBatchND(w("x",r,t,e),n,s)]}case"BatchToSpaceND":{let n=w("blockShape",r,t,e),s=w("crops",r,t,e);return[o.batchToSpaceND(w("x",r,t,e),n,s)]}case"DepthToSpace":{let n=w("blockSize",r,t,e),s=w("dataFormat",r,t,e).toUpperCase();return[o.depthToSpace(w("x",r,t,e),n,s)]}case"BroadcastTo":return[o.broadcastTo(w("x",r,t,e),w("shape",r,t,e))];case"BroadcastArgs":return[o.broadcastArgs(w("s0",r,t,e),w("s1",r,t,e))];default:throw TypeError(`Node type ${r.op} is not implemented`)}};function db(r,t,e,o,n=at){let s=((a,i,l)=>{switch(a.category){case"arithmetic":return n(()=>UE(a,i,l));case"basic_math":return n(()=>HE(a,i,l));case"control":return QE(a,i,l);case"convolution":return n(()=>JE(a,i,l));case"creation":return n(()=>t$(a,i,l));case"dynamic":return e$(a,i,l);case"evaluation":return n(()=>r$(a,i,l));case"image":return n(()=>s$(a,i,l));case"graph":return n(()=>o$(a,i,l));case"logical":return n(()=>a$(a,i,l));case"matrices":return n(()=>i$(a,i,l));case"normalization":return n(()=>l$(a,i,l));case"ragged":return n(()=>c$(a,i,l));case"reduction":return n(()=>u$(a,i,l));case"slice_join":return n(()=>p$(a,i,l));case"sparse":return n(()=>m$(a,i,l));case"spectral":return n(()=>f$(a,i,l));case"string":return n(()=>d$(a,i,l));case"transformation":return n(()=>h$(a,i,l));case"hash_table":return n$(a,i,l,o);case"custom":let c=qf(a.op);if(c&&c.customExecutor)return c.customExecutor(new sd(a,i,l));throw TypeError(`Custom op ${a.op} is not registered.`);default:throw TypeError(`Unknown op '${a.op}'. File an issue at https://github.com/tensorflow/tfjs/issues so we can add it, or register a custom execution with tf.registerOp()`)}})(r,t,e);return y.isPromise(s)?s.then(a=>[].concat(a)):[].concat(s)}var Mu=class{constructor(t={},e={},o={},n={},s){this.weightMap=t,this.tensorArrayMap=e,this.tensorListMap=o,this.functionMap=n,this.parseNodeNameCache=s,this.rootContext={id:0,frameName:"",iterationId:0},this.contexts=[this.rootContext],this.lastId=0,this.generateCurrentContextIds()}newFrame(t,e){return{id:t,frameName:e,iterationId:0}}set currentContext(t){this.contexts!==t&&(this.contexts=t,this.generateCurrentContextIds())}get currentContext(){return this.contexts}get currentContextId(){return this._currentContextIds[0]}get currentContextIds(){return this._currentContextIds}generateCurrentContextIds(){let t=[];for(let e=0;e<this.contexts.length-1;e++){let o=this.contexts.slice(0,this.contexts.length-e);t.push(this.contextIdforContexts(o))}t.push(""),this._currentContextIds=t}contextIdforContexts(t){return t?t.map(e=>e.id===0&&e.iterationId===0?"":`${e.frameName}-${e.iterationId}`).join("/"):""}enterFrame(t){this.contexts&&(this.lastId++,this.contexts=this.contexts.slice(),this.contexts.push(this.newFrame(this.lastId,t)),this._currentContextIds.unshift(this.contextIdforContexts(this.contexts)))}exitFrame(){if(this.contexts&&this.contexts.length>1)this.contexts=this.contexts.slice(),this.contexts.splice(-1),this.currentContextIds.shift();else throw new Error("Cannot exit frame, the context is empty")}nextIteration(){if(this.contexts&&this.contexts.length>0){this.contexts=this.contexts.slice(),this.lastId++;let t=Object.assign({},this.contexts[this.contexts.length-1]);t.iterationId+=1,t.id=this.lastId,this.contexts.splice(-1,1,t),this._currentContextIds.splice(0,1,this.contextIdforContexts(this.contexts))}else throw new Error("Cannot increase frame iteration, the context is empty")}getWeight(t){return this.weightMap[t]}addTensorArray(t){this.tensorArrayMap[t.id]=t}getTensorArray(t){return this.tensorArrayMap[t]}addTensorList(t){this.tensorListMap[t.id]=t}getTensorList(t){return this.tensorListMap[t]}dispose(t){for(let e in this.tensorArrayMap)this.tensorArrayMap[e].clearAndClose(t);for(let e in this.tensorListMap)this.tensorListMap[e].clearAndClose(t)}};function hb(r,t,e,o){let n=new Set,s=[],a=null,i=null,l=new Set,c=new Set(Object.keys(r).map(m=>Ge(m)[0]));o=o||[];let u=new Set(o.map(m=>Ge(m.name)[0])),p=[...t];for(;p.length>0;){let m=p.pop();if((ds(m)||mK(m)||fK(m))&&a==null&&(a=m,i=a.children.map(f=>f.name).filter(f=>n.has(f))),n.add(m.name),e[m.name]==null&&!c.has(m.name)&&!u.has(m.name)){if(m.inputs.length===0){s.push(m.name);continue}m.inputs.forEach(f=>{l.has(f.name)||(l.add(f.name),p.push(f))})}}return{inputs:r,outputs:t,usedNodes:n,missingInputs:s,dynamicNode:a,syncInputs:i}}function g$(r,t){let{usedNodes:e,inputs:o}=t,n=Object.keys(o).map(h=>Ge(h)[0]).map(h=>r.nodes[h]),s=r.initNodes||[],a=h=>e.has(typeof h=="string"?h:h.name);function i(h){return[...new Map(h.map(x=>[x.name,x])).values()]}let l=i([...n,...r.weights,...s]).filter(a),c=i([...l,...Object.values(r.nodes)]).filter(a),u=new Map(c.map(h=>[h.name,h])),p={};for(let h of c){p[h.name]=p[h.name]||0;for(let x of h.children)a(x)||(p[x.name]=Number.POSITIVE_INFINITY),p[x.name]=(p[x.name]||0)+1}let m=Object.entries(p).filter(([,h])=>h===0).map(([h])=>h),f=[...m];for(;m.length>0;){let h=m.pop(),x=u.get(h);for(let b of x.children.filter(a))--p[b.name]===0&&(f.push(b.name),m.push(b.name))}let d=f.map(h=>u.get(h)),g=iK(d,l);return lK(g,l),g}function iK(r,t){let e=new Map(r.map(a=>[a.name,a])),o=t.map(a=>a.name),n=new Set(o);for(;o.length>0;){let a=o.pop(),i=e.get(a);for(let l of i.children)!e.has(l.name)||n.has(l.name)||(n.add(l.name),o.push(l.name))}return r.filter(a=>n.has(a.name))}var ec=class extends Error{constructor(t){super(`NodesExecutionOrderError: ${t}`)}};function lK(r,t){let e=new Map(r.map((i,l)=>[i.name,l])),o=new Set(t.map(i=>i.name)),n=i=>o.has(typeof i=="string"?i:i.name),s=new Set(r.map(i=>i.name)),a=i=>s.has(typeof i=="string"?i:i.name);for(let i of r){for(let l of i.children.filter(a)){if(!e.has(l.name))throw new ec(`Child ${l.name} of node ${i.name} is unreachable.`);if(e.get(i.name)>e.get(l.name))throw new ec(`Node ${i.name} is scheduled to run after its child ${l.name}.`)}if(!n(i))for(let l of i.inputs){if(!e.has(l.name))throw new ec(`Input ${l.name} of node ${i.name} is unreachable.`);if(e.get(l.name)>e.get(i.name))throw new ec(`Node ${i.name} is scheduled to run before its input ${l.name}.`)}}}function x$(r){let t=new Map(r.map((i,l)=>[i.name,l])),e=Number.MAX_SAFE_INTEGER,o=r.map((i,l)=>ds(i)?e:l),n=i=>{let l=o[t.get(i.name)];return l??-1},s=r.map((i,l)=>i.children.map(n).reduce((c,u)=>Math.max(c,u),o[l])),a=new Map;for(let i=0;i<r.length;++i){let l=s[i];if(l===e)continue;let c=r[i],u=r[l];a.has(u.name)||a.set(u.name,[]),a.get(u.name).push(c)}return a}var cK=new Set(["Switch","Merge","Enter","Exit","NextIteration","StatelessIf","StatelessWhile","if","While"]),uK=new Set(["NonMaxSuppressionV2","NonMaxSuppressionV3","NonMaxSuppressionV5","Where"]),pK=new Set(["HashTable","HashTableV2","LookupTableImport","LookupTableImportV2","LookupTableFind","LookupTableFindV2","LookupTableSize","LookupTableSizeV2"]);function ds(r){return cK.has(r.op)}function mK(r){return uK.has(r.op)}function fK(r){return pK.has(r.op)}var Lu=class r{get weightIds(){return this.parent?this.parent.weightIds:this._weightIds}get functionExecutorMap(){return this.parent?this.parent.functionExecutorMap:this._functionExecutorMap}get weightMap(){return this.parent?this.parent.weightMap:this._weightMap}set weightMap(t){let e=Object.keys(t).map(o=>t[o].map(n=>n.id));this._weightIds=[].concat(...e),this._weightMap=t}set resourceManager(t){this._resourceManager=t}get inputs(){return this._inputs.map(t=>({name:t.name,shape:t.attrParams.shape?t.attrParams.shape.value:void 0,dtype:t.attrParams.dtype?t.attrParams.dtype.value:void 0}))}get outputs(){return this._outputs.map(t=>({name:t.name,shape:t.attrParams.shape?t.attrParams.shape.value:void 0,dtype:t.attrParams.dtype?t.attrParams.dtype.value:void 0}))}get inputNodes(){return this._inputs.map(t=>t.signatureKey||t.name)}get outputNodes(){return this._outputs.map(t=>{let e=t.signatureKey||t.name;return t.defaultOutput?`${e}:${t.defaultOutput}`:e})}get functions(){return Object.keys(this._functions).reduce((t,e)=>(t[e]=this._functions[e].signature,t),{})}constructor(t,e){this.graph=t,this.parent=e,this.compiledMap=new Map,this.parseNodeNameCache=new Map,this._weightMap={},this.SEPARATOR=",",this._functions={},this._functionExecutorMap={},this.keepIntermediateTensors=!1,this._outputs=t.outputs,this._inputs=t.inputs,this._initNodes=t.initNodes,this._signature=t.signature,this._functions=t.functions,t.functions!=null&&Object.keys(t.functions).forEach(o=>{this._functionExecutorMap[o]=new r(t.functions[o],this)})}getCompilationKey(t,e){let o=t.map(s=>s.name).sort(),n=e.map(s=>s.name).sort();return o.join(this.SEPARATOR)+"--"+n.join(this.SEPARATOR)}compile(t,e){let o=hb(t,e,this.weightMap,this._initNodes),{missingInputs:n,dynamicNode:s,syncInputs:a}=o;if(s!=null)throw new Error(`This execution contains the node '${s.name}', which has the dynamic op '${s.op}'. Please use model.executeAsync() instead. Alternatively, to avoid the dynamic ops, specify the inputs [${a}]`);if(n.length>0){let c=e.map(p=>p.name),u=Object.keys(t);throw new Error(`Cannot compute the outputs [${c}] from the provided inputs [${u}]. Missing the following inputs: [${n}]`)}let i=g$(this.graph,o),l=x$(i);return{orderedNodes:i,nodeLiveUntilMap:l}}cloneAndKeepTensor(t){if(t==null)return null;let e=t.clone();return Ve(e),e}cloneTensorList(t){return t?t.map(o=>this.cloneAndKeepTensor(o)):null}cloneTensorMap(t){return Object.fromEntries(Object.entries(t).map(([e,o])=>[e,this.cloneTensorList(o)]))}execute(t,e){this.disposeIntermediateTensors(),t=this.mapInputs(t);let o=Object.keys(t).sort();this.checkInputs(t),this.checkInputShapeAndType(t),e=this.mapOutputs(e),this.checkOutputs(e);let n=o.map(m=>this.graph.nodes[Ge(m)[0]]),s=e.map(m=>Ge(m)[0]),a=new Set(s),i=s.map(m=>this.graph.nodes[m]);i.length===0&&(i=this._outputs);let l=this.getCompilationKey(n,i),c=this.compiledMap.get(l);c==null&&(c=this.compile(t,i),this.compiledMap.set(l,c));try{this.keepIntermediateTensors=D().getBool("KEEP_INTERMEDIATE_TENSORS")}catch(m){this.keepIntermediateTensors=!1,console.warn(m.message)}let u={},p={};return at(()=>{let m=new Mu(this.weightMap,u,p,this.functionExecutorMap,this.parseNodeNameCache),f=Object.assign({},this.weightMap);this.keepIntermediateTensors&&(this.clonedTensorsMap=this.cloneTensorMap(this.weightMap)),Object.keys(t).forEach(x=>{let[b,C]=Ge(x,m),S=[];S[C]=t[x],f[b]=S,this.keepIntermediateTensors&&(this.clonedTensorsMap[b]=this.cloneTensorList(S))});let d=this.getFrozenTensorIds(f),{orderedNodes:g,nodeLiveUntilMap:h}=c;for(let x of g){if(f[x.name])continue;let b=db(x,f,m,this._resourceManager);if(y.isPromise(b))throw new Error(`The execution of the op '${x.op}' returned a promise. Please use model.executeAsync() instead.`);f[x.name]=b,this.keepIntermediateTensors&&(this.clonedTensorsMap[x.name]=this.cloneTensorList(b)),this.checkTensorForDisposalWithNodeLiveUntilInfo(x,f,m,d,a,h.get(x.name))}return this.parent==null&&m.dispose(d),e.map(x=>le(x,f,m))})}getFrozenTensorIds(t){let e=[].concat.apply([],Object.keys(t).map(o=>t[o]).map(o=>o.map(n=>n.id)));return new Set(e)}checkTensorForDisposal(t,e,o,n,s,a,i){if(!(ds(e)||a.has(t))){for(let l of o[t])l!=null&&(i[l.id]=(i[l.id]||0)+e.children.length);for(let l of e.inputs){if(ds(l))continue;let c=Ky(l.name,o,n);if(c!=null)for(let u of c){if(!u||u.kept||s.has(u.id))continue;let p=i[u.id];p===1?(u.dispose(),delete i[u.id]):p!=null&&i[u.id]--}}}}checkTensorForDisposalWithNodeLiveUntilInfo(t,e,o,n,s,a){function i(l){return ds(l)||s.has(l.name)}if(!(ds(t)||a==null))for(let l of a){if(i(l))continue;let c=Ky(l.name,e,o);for(let u of c)!u||u.kept||n.has(u.id)||u.dispose()}}async executeAsync(t,e){return this._executeAsync(t,e)}disposeIntermediateTensors(){this.clonedTensorsMap&&(Object.values(this.clonedTensorsMap).forEach(t=>{for(let e of t)e&&!e.isDisposed&&e.dispose()}),this.clonedTensorsMap=null)}getIntermediateTensors(){return this.clonedTensorsMap}async _executeAsync(t,e,o=!1,n={},s={}){this.disposeIntermediateTensors(),o||(t=this.mapInputs(t),this.checkInputs(t),this.checkInputShapeAndType(t),e=this.mapOutputs(e),this.checkOutputs(e));try{this.keepIntermediateTensors=D().getBool("KEEP_INTERMEDIATE_TENSORS")}catch(m){this.keepIntermediateTensors=!1,console.warn(m.message)}let a=new Mu(this.weightMap,n,s,this.functionExecutorMap,this.parseNodeNameCache);this.keepIntermediateTensors&&(this.clonedTensorsMap=this.cloneTensorMap(this.weightMap));let i=await this.executeWithControlFlow(t,a,e,o),l=e.map(m=>le(m,i,a)),c=l.map(m=>m.id),u=Object.keys(t).map(m=>t[m].id),p=new Set([...c,...u,...this.weightIds]);return Object.values(i).forEach(m=>{m.forEach(f=>{f&&!f.isDisposed&&!p.has(f.id)&&f.dispose()})}),this.parent==null&&a.dispose(p),l}async executeFunctionAsync(t,e,o){let n=t.reduce((s,a,i)=>(s[this.inputs[i].name]=a,s),{});return this._executeAsync(n,this.outputNodes,!0,e,o)}async executeWithControlFlow(t,e,o,n){let s=Object.keys(t),a=s.map(S=>this.graph.nodes[Ge(S)[0]]),i=o.map(S=>Ge(S)[0]),l=new Set(i),c=i.map(S=>this.graph.nodes[S]);c.length===0&&(c=this._outputs);let{usedNodes:u,missingInputs:p,dynamicNode:m,syncInputs:f}=hb(t,c,this.weightMap,this._initNodes),d=[...a,...this.graph.weights,...this._initNodes||[]].map(S=>({node:S,contexts:e.currentContext})),g=Object.assign({},this.weightMap);Object.keys(t).forEach(S=>{let[I,$]=Ge(S),R=[];R[$]=t[S],g[I]=R});let h={},x=this.getFrozenTensorIds(g),b={};for(;d.length>0;){let S=this.processStack(a,d,e,g,b,x,l,h,u);await Promise.all(S)}m==null&&!n&&console.warn("This model execution did not contain any nodes with control flow or dynamic output shapes. You can use model.execute() instead.");let C=c.filter(S=>!ds(S)&&!le(S.name,g,e)).map(S=>S.name);if(C.length>0){let S="";throw m!=null&&(S=`Alternatively, to avoid the dynamic ops, use model.execute() and specify the inputs [${f}]`),new Error(`Cannot compute the outputs [${C}] from the provided inputs [${s}]. Consider providing the following inputs: [${p}]. ${S}`)}return g}processStack(t,e,o,n,s,a,i,l,c){let u=[];for(;e.length>0;){let p=e.pop();o.currentContext=p.contexts;let m="";if(p.node.op==="Enter"&&w("isConstant",p.node,n,o)&&([m]=Vr(p.node.name,o)),n[p.node.name]==null){let f=db(p.node,n,o,this._resourceManager);m||([m]=Vr(p.node.name,o));let d=o.currentContext;y.isPromise(f)?u.push(f.then(g=>(n[m]=g,this.keepIntermediateTensors&&(this.clonedTensorsMap[m]=this.cloneTensorList(g)),o.currentContext=d,this.checkTensorForDisposal(m,p.node,n,o,a,i,l),this.processChildNodes(p.node,e,o,n,s,c),g))):(n[m]=f,this.keepIntermediateTensors&&(this.clonedTensorsMap[m]=this.cloneTensorList(f)),this.checkTensorForDisposal(m,p.node,n,o,a,i,l),this.processChildNodes(p.node,e,o,n,s,c))}else this.processChildNodes(p.node,e,o,n,s,c)}return u}processChildNodes(t,e,o,n,s,a){t.children.forEach(i=>{let[l]=Vr(i.name,o);s[l]||!a.has(i.name)||(i.op==="Merge"?i.inputNames.some(c=>!!le(c,n,o))&&(s[l]=!0,e.push({contexts:o.currentContext,node:i})):i.inputNames.every(c=>!!le(c,n,o))&&(s[l]=!0,e.push({contexts:o.currentContext,node:i})))})}dispose(){Object.keys(this.weightMap).forEach(t=>this.weightMap[t].forEach(e=>e.dispose()))}checkInputShapeAndType(t){Object.keys(t).forEach(e=>{let o=t[e],[n]=Ge(e),s=this.graph.nodes[n];if(s.attrParams.shape&&s.attrParams.shape.value){let a=s.attrParams.shape.value,i=a.length===o.shape.length&&o.shape.every((l,c)=>a[c]===-1||a[c]===l);y.assert(i,()=>`The shape of dict['${s.name}'] provided in model.execute(dict) must be [${a}], but was [${o.shape}]`)}s.attrParams.dtype&&s.attrParams.dtype.value&&y.assert(o.dtype===s.attrParams.dtype.value,()=>`The dtype of dict['${s.name}'] provided in model.execute(dict) must be ${s.attrParams.dtype.value}, but was ${o.dtype}`)})}mapInputs(t){var e,o;let n={};for(let s in t){let a=(o=(e=this._signature)===null||e===void 0?void 0:e.inputs)===null||o===void 0?void 0:o[s];a!=null?n[a.name]=t[s]:n[s]=t[s]}return n}checkInputs(t){let e=Object.keys(t).filter(o=>{let[n]=Ge(o);return this.graph.nodes[n]==null});if(e.length>0)throw new Error(`The dict provided in model.execute(dict) has keys: [${e}] that are not part of graph`)}mapOutputs(t){return t.map(e=>{var o,n;let s=(n=(o=this._signature)===null||o===void 0?void 0:o.outputs)===null||n===void 0?void 0:n[e];return s!=null?s.name:e},{})}checkOutputs(t){t.forEach(e=>{let[o]=Ge(e);if(!this.graph.nodes[o])throw new Error(`The output '${e}' is not found in the graph`)})}};var cd=class{constructor(t={},e={}){this.hashTableNameToHandle=t,this.hashTableMap=e}addHashTable(t,e){this.hashTableNameToHandle[t]=e.handle,this.hashTableMap[e.id]=e}getHashTableHandleByName(t){return this.hashTableNameToHandle[t]}getHashTableById(t){return this.hashTableMap[t]}dispose(){for(let t in this.hashTableMap)this.hashTableMap[t].clearAndClose(),delete this.hashTableMap[t];for(let t in this.hashTableNameToHandle)this.hashTableNameToHandle[t].dispose(),delete this.hashTableNameToHandle[t]}};var dK="?tfjs-format=file",hK="model.json",ud=class{get modelVersion(){return this.version}get inputNodes(){return this.executor.inputNodes}get outputNodes(){return this.executor.outputNodes}get inputs(){return this.executor.inputs}get outputs(){return this.executor.outputs}get weights(){return this.executor.weightMap}get metadata(){return this.artifacts.userDefinedMetadata}get modelSignature(){return this.signature}get modelStructuredOutputKeys(){return this.structuredOutputKeys}constructor(t,e={},o=kl){this.modelUrl=t,this.loadOptions=e,this.version="n/a",this.io=o,e==null&&(this.loadOptions={}),this.resourceManager=new cd}findIOHandler(){let t=this.modelUrl;if(t.load!=null)this.handler=t;else if(this.loadOptions.requestInit!=null)this.handler=this.io.browserHTTPRequest(t,this.loadOptions);else{let e=this.io.getLoadHandlers(t,this.loadOptions);if(e.length===0)e.push(this.io.browserHTTPRequest(t,this.loadOptions));else if(e.length>1)throw new Error(`Found more than one (${e.length}) load handlers for URL '${[t]}'`);this.handler=e[0]}}load(){if(this.findIOHandler(),this.handler.load==null)throw new Error("Cannot proceed with model loading because the IOHandler provided does not have the `load` method implemented.");let t=this.handler.load();return y.isPromise(t)?t.then(e=>e.getWeightStream==null?this.loadSync(e):this.loadStreaming(e)):this.loadSync(t)}loadSync(t){let e=this.io.decodeWeights(t.weightData,t.weightSpecs);return this.loadWithWeightMap(t,e)}async loadStreaming(t){if(t.getWeightStream==null)throw new Error("Model artifacts missing streamWeights function");let e=await ip(t.getWeightStream(),t.weightSpecs);return this.loadWithWeightMap(t,e)}loadWithWeightMap(t,e){this.artifacts=t;let o=this.artifacts.modelTopology,n=this.artifacts.signature;if(this.artifacts.userDefinedMetadata!=null){let s=this.artifacts.userDefinedMetadata;s.signature!=null&&(n=s.signature),s.structuredOutputKeys!=null&&(this.structuredOutputKeys=s.structuredOutputKeys)}if(this.signature=n,this.version=`${o.versions.producer}.${o.versions.minConsumer}`,this.executor=new Lu(Pu.Instance.transformGraph(o,this.signature)),this.executor.weightMap=this.convertTensorMapToTensorsMap(e),this.executor.resourceManager=this.resourceManager,t.modelInitializer!=null&&t.modelInitializer.node!=null){let s=Pu.Instance.transformGraph(t.modelInitializer);this.initializer=new Lu(s),this.initializer.weightMap=this.executor.weightMap,this.initializer.resourceManager=this.resourceManager,this.initializerSignature=t.initializerSignature}return!0}async save(t,e){if(typeof t=="string"){let o=this.io.getSaveHandlers(t);if(o.length===0)throw new Error(`Cannot find any save handlers for URL '${t}'`);if(o.length>1)throw new Error(`Found more than one (${o.length}) save handlers for URL '${t}'`);t=o[0]}if(t.save==null)throw new Error("GraphModel.save() cannot proceed because the IOHandler provided does not have the `save` attribute defined.");return t.save(this.artifacts)}addStructuredOutputNames(t){if(this.structuredOutputKeys){let e=t instanceof Nt?[t]:t,o={};return e.forEach((n,s)=>o[this.structuredOutputKeys[s]]=n),o}return t}predict(t,e){let o=this.execute(t,this.outputNodes);return this.addStructuredOutputNames(o)}async predictAsync(t,e){let o=await this.executeAsync(t,this.outputNodes);return this.addStructuredOutputNames(o)}normalizeInputs(t){var e;if(!(t instanceof Nt)&&!Array.isArray(t)){let s=(e=this.signature)===null||e===void 0?void 0:e.inputs;if(s!=null)for(let a in s){let i=s[a];i.resourceId!=null&&(t[a]=this.resourceIdToCapturedInput[i.resourceId])}return t}t=Array.isArray(t)?t:[t];let o=Object.keys(this.resourceIdToCapturedInput).length;if(t.length+o!==this.inputNodes.length)throw new Error(`Input tensor count mismatch, the graph model has ${this.inputNodes.length-o} non-resource placeholders, while there are ${t.length} input tensors provided.`);let n=0;return this.inputNodes.reduce((s,a)=>{var i,l,c;let u=(c=(l=(i=this.signature)===null||i===void 0?void 0:i.inputs)===null||l===void 0?void 0:l[a])===null||c===void 0?void 0:c.resourceId;return u!=null?s[a]=this.resourceIdToCapturedInput[u]:s[a]=t[n++],s},{})}normalizeOutputs(t){return t=t||this.outputNodes,Array.isArray(t)?t:[t]}executeInitializerGraph(){return this.initializer==null?[]:this.initializerSignature==null?this.initializer.execute({},[]):this.initializer.execute({},Object.keys(this.initializerSignature.outputs))}async executeInitializerGraphAsync(){return this.initializer==null?[]:this.initializerSignature==null?this.initializer.executeAsync({},[]):this.initializer.executeAsync({},Object.keys(this.initializerSignature.outputs))}setResourceIdToCapturedInput(t){if(this.resourceIdToCapturedInput={},this.initializerSignature){let e=this.initializerSignature.outputs,o=Object.keys(e);for(let n=0;n<o.length;n++){let s=o[n],a=e[s];this.resourceIdToCapturedInput[a.resourceId]=t[n]}}}execute(t,e){this.resourceIdToCapturedInput==null&&this.setResourceIdToCapturedInput(this.executeInitializerGraph()),t=this.normalizeInputs(t),e=this.normalizeOutputs(e);let o=this.executor.execute(t,e);return o.length>1?o:o[0]}async executeAsync(t,e){this.resourceIdToCapturedInput==null&&this.setResourceIdToCapturedInput(await this.executeInitializerGraphAsync()),t=this.normalizeInputs(t),e=this.normalizeOutputs(e);let o=await this.executor.executeAsync(t,e);return o.length>1?o:o[0]}getIntermediateTensors(){return this.executor.getIntermediateTensors()}disposeIntermediateTensors(){this.executor.disposeIntermediateTensors()}convertTensorMapToTensorsMap(t){return Object.keys(t).reduce((e,o)=>(e[o]=[t[o]],e),{})}dispose(){this.executor.dispose(),this.initializer&&(this.initializer.dispose(),this.resourceIdToCapturedInput&&Tt(this.resourceIdToCapturedInput)),this.resourceManager.dispose()}};async function hs(r,t={},e=kl){if(r==null)throw new Error("modelUrl in loadGraphModel() cannot be null. Please provide a url or an IOHandler that loads the model");t==null&&(t={}),t.fromTFHub&&typeof r=="string"&&(r=gK(r));let o=new ud(r,t,e);return await o.load(),o}function gK(r){return r.endsWith("/")||(r=r+"/"),`${r}${hK}${dK}`}var Bu=class{},Vu={flatDispatchLayout:()=>{throw new Error("WebGPU backend is not bundled")},computeDispatch:()=>{throw new Error("WebGPU backend is not bundled")}};var j$=function(r,t){return(j$=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,o){e.__proto__=o}||function(e,o){for(var n in o)Object.prototype.hasOwnProperty.call(o,n)&&(e[n]=o[n])})(r,t)};function X$(r,t){if(typeof t!="function"&&t!==null)throw new TypeError("Class extends value "+String(t)+" is not a constructor or null");function e(){this.constructor=r}j$(r,t),r.prototype=t===null?Object.create(t):(e.prototype=t.prototype,new e)}var Gt=function(){return(Gt=Object.assign||function(r){for(var t,e=1,o=arguments.length;e<o;e++)for(var n in t=arguments[e])Object.prototype.hasOwnProperty.call(t,n)&&(r[n]=t[n]);return r}).apply(this,arguments)};function Dt(r,t,e,o){return new(e||(e=Promise))((function(n,s){function a(c){try{l(o.next(c))}catch(u){s(u)}}function i(c){try{l(o.throw(c))}catch(u){s(u)}}function l(c){var u;c.done?n(c.value):(u=c.value,u instanceof e?u:new e((function(p){p(u)}))).then(a,i)}l((o=o.apply(r,t||[])).next())}))}function Ot(r,t){var e,o,n,s,a={label:0,sent:function(){if(1&n[0])throw n[1];return n[1]},trys:[],ops:[]};return s={next:i(0),throw:i(1),return:i(2)},typeof Symbol=="function"&&(s[Symbol.iterator]=function(){return this}),s;function i(l){return function(c){return(function(u){if(e)throw new TypeError("Generator is already executing.");for(;a;)try{if(e=1,o&&(n=2&u[0]?o.return:u[0]?o.throw||((n=o.return)&&n.call(o),0):o.next)&&!(n=n.call(o,u[1])).done)return n;switch(o=0,n&&(u=[2&u[0],n.value]),u[0]){case 0:case 1:n=u;break;case 4:return a.label++,{value:u[1],done:!1};case 5:a.label++,o=u[1],u=[0];continue;case 7:u=a.ops.pop(),a.trys.pop();continue;default:if(n=a.trys,!((n=n.length>0&&n[n.length-1])||u[0]!==6&&u[0]!==2)){a=0;continue}if(u[0]===3&&(!n||u[1]>n[0]&&u[1]<n[3])){a.label=u[1];break}if(u[0]===6&&a.label<n[1]){a.label=n[1],n=u;break}if(n&&a.label<n[2]){a.label=n[2],a.ops.push(u);break}n[2]&&a.ops.pop(),a.trys.pop();continue}u=t.call(r,a)}catch(p){u=[6,p],o=0}finally{e=n=0}if(5&u[0])throw u[1];return{value:u[0]?u[1]:void 0,done:!0}})([l,c])}}}function Ki(r,t,e){if(e||arguments.length===2)for(var o,n=0,s=t.length;n<s;n++)!o&&n in t||(o||(o=Array.prototype.slice.call(t,0,n)),o[n]=t[n]);return r.concat(o||Array.prototype.slice.call(t))}var po=["nose","left_eye","right_eye","left_ear","right_ear","left_shoulder","right_shoulder","left_elbow","right_elbow","left_wrist","right_wrist","left_hip","right_hip","left_knee","right_knee","left_ankle","right_ankle"],Wu=["nose","left_eye_inner","left_eye","left_eye_outer","right_eye_inner","right_eye","right_eye_outer","left_ear","right_ear","mouth_left","mouth_right","left_shoulder","right_shoulder","left_elbow","right_elbow","left_wrist","right_wrist","left_pinky","right_pinky","left_index","right_index","left_thumb","right_thumb","left_hip","right_hip","left_knee","right_knee","left_ankle","right_ankle","left_heel","right_heel","left_foot_index","right_foot_index"],xK={left:[1,2,3,7,9,11,13,15,17,19,21,23,25,27,29,31],right:[4,5,6,8,10,12,14,16,18,20,22,24,26,28,30,32],middle:[0]},yK={left:[1,3,5,7,9,11,13,15],right:[2,4,6,8,10,12,14,16],middle:[0]},bK=[[0,1],[0,2],[1,3],[2,4],[5,6],[5,7],[5,11],[6,8],[6,12],[7,9],[8,10],[11,12],[11,13],[12,14],[13,15],[14,16]],wK=[[0,1],[0,4],[1,2],[2,3],[3,7],[4,5],[5,6],[6,8],[9,10],[11,12],[11,13],[11,23],[12,14],[14,16],[12,24],[13,15],[15,17],[16,18],[16,20],[15,17],[15,19],[15,21],[16,22],[17,19],[18,20],[23,25],[23,24],[24,26],[25,27],[26,28],[27,29],[28,30],[27,31],[28,32],[29,31],[30,32]];function pd(r){return r instanceof SVGAnimatedLength?r.baseVal.value:r}function Y$(r){return Dt(this,void 0,void 0,(function(){var t,e;return Ot(this,(function(o){switch(o.label){case 0:return t=document.createElement("canvas"),r instanceof Nt?[4,Oo.toPixels(r,t)]:[3,2];case 1:return o.sent(),[3,3];case 2:t.width=pd(r.width),t.height=pd(r.height),e=t.getContext("2d"),r instanceof ImageData?e.putImageData(r,0,0):e.drawImage(r,0,0),o.label=3;case 3:return[2,t]}}))}))}function Q$(r){return Dt(this,void 0,void 0,(function(){var t,e,o,n,s,a;return Ot(this,(function(i){switch(i.label){case 0:return r instanceof Nt?(t=r.shape.slice(0,2),e=t[0],o=t[1],n=ImageData.bind,[4,Oo.toPixels(r)]):[3,2];case 1:return[2,new(n.apply(ImageData,[void 0,i.sent(),o,e]))];case 2:return s=document.createElement("canvas"),a=s.getContext("2d"),s.width=pd(r.width),s.height=pd(r.height),a.drawImage(r,0,0),[2,a.getImageData(0,0,s.width,s.height)]}}))}))}function vK(r){return Dt(this,void 0,void 0,(function(){var t,e;return Ot(this,(function(o){switch(o.label){case 0:return r instanceof SVGImageElement||r instanceof OffscreenCanvas?[4,Y$(r)]:[3,2];case 1:return e=o.sent(),[3,3];case 2:e=r,o.label=3;case 3:return t=e,[2,Oo.fromPixels(t,4)]}}))}))}function Z$(r){if(r<0||r>=256)throw new Error("Mask value must be in range [0, 255] but got ".concat(r));if(!Number.isInteger(r))throw new Error("Mask value must be an integer but got ".concat(r))}var zu={runtime:"mediapipe",enableSmoothing:!0,enableSegmentation:!1,smoothSegmentation:!0,modelType:"full"},SK=(function(){function r(t){this.mask=t}return r.prototype.toCanvasImageSource=function(){return Dt(this,void 0,void 0,(function(){return Ot(this,(function(t){return[2,this.mask]}))}))},r.prototype.toImageData=function(){return Dt(this,void 0,void 0,(function(){return Ot(this,(function(t){return[2,Q$(this.mask)]}))}))},r.prototype.toTensor=function(){return Dt(this,void 0,void 0,(function(){return Ot(this,(function(t){return[2,vK(this.mask)]}))}))},r.prototype.getUnderlyingType=function(){return"canvasimagesource"},r})();function CK(r){return Z$(r),"person"}var TK=(function(){function r(t){var e,o=this;switch(this.width=0,this.height=0,this.selfieMode=!1,this.poseSolution=new Kf({locateFile:function(n,s){if(t.solutionPath){var a=t.solutionPath.replace(/\/+$/,"");return"".concat(a,"/").concat(n)}return"".concat(s,"/").concat(n)}}),t.modelType){case"lite":e=0;break;case"heavy":e=2;break;default:e=1}this.poseSolution.setOptions({modelComplexity:e,smoothLandmarks:t.enableSmoothing,enableSegmentation:t.enableSegmentation,smoothSegmentation:t.smoothSegmentation,selfieMode:this.selfieMode}),this.poseSolution.onResults((function(n){if(o.height=n.image.height,o.width=n.image.width,n.poseLandmarks==null)o.poses=[];else{var s=o.translateOutput(n.poseLandmarks,n.poseWorldLandmarks);n.segmentationMask&&(s.segmentation={maskValueToLabel:CK,mask:new SK(n.segmentationMask)}),o.poses=[s]}}))}return r.prototype.translateOutput=function(t,e){var o=this,n={keypoints:t.map((function(s,a){return{x:s.x*o.width,y:s.y*o.height,z:s.z,score:s.visibility,name:Wu[a]}}))};return e!=null&&(n.keypoints3D=e.map((function(s,a){return{x:s.x,y:s.y,z:s.z,score:s.visibility,name:Wu[a]}}))),n},r.prototype.estimatePoses=function(t,e,o){return Dt(this,void 0,void 0,(function(){var n,s;return Ot(this,(function(a){switch(a.label){case 0:return e&&e.flipHorizontal&&e.flipHorizontal!==this.selfieMode&&(this.selfieMode=e.flipHorizontal,this.poseSolution.setOptions({selfieMode:this.selfieMode})),t instanceof Nt?(s=ImageData.bind,[4,Oo.toPixels(t)]):[3,2];case 1:return n=new(s.apply(ImageData,[void 0,a.sent(),t.shape[1],t.shape[0]])),[3,3];case 2:n=t,a.label=3;case 3:return t=n,[4,this.poseSolution.send({image:t},o)];case 4:return a.sent(),[2,this.poses]}}))}))},r.prototype.dispose=function(){this.poseSolution.close()},r.prototype.reset=function(){this.poseSolution.reset()},r.prototype.initialize=function(){return this.poseSolution.initialize()},r})();function NK(r){return Dt(this,void 0,void 0,(function(){var t,e;return Ot(this,(function(o){switch(o.label){case 0:return t=(function(n){if(n==null)return Gt({},zu);var s=Gt({},n);return s.runtime="mediapipe",s.enableSegmentation==null&&(s.enableSegmentation=zu.enableSegmentation),s.enableSmoothing==null&&(s.enableSmoothing=zu.enableSmoothing),s.smoothSegmentation==null&&(s.smoothSegmentation=zu.smoothSegmentation),s.modelType==null&&(s.modelType=zu.modelType),s})(r),[4,(e=new TK(t)).initialize()];case 1:return o.sent(),[2,e]}}))}))}function oc(r){return r instanceof Nt?{height:r.shape[0],width:r.shape[1]}:{height:r.height,width:r.width}}function J$(r){return r-2*Math.PI*Math.floor((r+Math.PI)/(2*Math.PI))}function $b(r){return r instanceof Nt?r:Oo.fromPixels(r)}function tR(r,t,e){return Nb(e,"inputResolution"),[1/e.width*r[0][0]*t.width,1/e.height*r[0][1]*t.width,r[0][3]*t.width,1/e.width*r[1][0]*t.height,1/e.height*r[1][1]*t.height,r[1][3]*t.height,0,0]}function Nb(r,t){y.assert(r.width!==0,(function(){return"".concat(t," width cannot be 0.")})),y.assert(r.height!==0,(function(){return"".concat(t," height cannot be 0.")}))}function gb(r,t,e){var o=e.rotationVectorStartKeypointIndex,n=e.rotationVectorEndKeypointIndex,s=r.locationData,a=s.relativeKeypoints[o].x*t.width,i=s.relativeKeypoints[o].y*t.height,l=s.relativeKeypoints[n].x*t.width,c=s.relativeKeypoints[n].y*t.height,u=2*Math.sqrt((l-a)*(l-a)+(c-i)*(c-i)),p=(function(m,f,d){var g,h=m.locationData,x=d.rotationVectorStartKeypointIndex,b=d.rotationVectorEndKeypointIndex;g=d.rotationVectorTargetAngle?d.rotationVectorTargetAngle:Math.PI*d.rotationVectorTargetAngleDegree/180;var C=h.relativeKeypoints[x].x*f.width,S=h.relativeKeypoints[x].y*f.height,I=h.relativeKeypoints[b].x*f.width,$=h.relativeKeypoints[b].y*f.height;return J$(g-Math.atan2(-($-S),I-C))})(r,t,e);return{xCenter:a/t.width,yCenter:i/t.height,width:u/t.width,height:u/t.height,rotation:p}}function eR(r){if(r.length!==16)throw new Error("Array length must be 16 but got ".concat(r.length));return[[r[0],r[1],r[2],r[3]],[r[4],r[5],r[6],r[7]],[r[8],r[9],r[10],r[11]],[r[12],r[13],r[14],r[15]]]}function xb(r,t,e,o,n,s,a){return r[t][n]*(r[e][s]*r[o][a]-r[e][a]*r[o][s])}function Ue(r,t,e){var o=(t+1)%4,n=(t+2)%4,s=(t+3)%4,a=(e+1)%4,i=(e+2)%4,l=(e+3)%4;return xb(r,o,n,s,a,i,l)+xb(r,n,s,o,a,i,l)+xb(r,s,o,n,a,i,l)}function y$(r,t,e){e===void 0&&(e={ignoreRotation:!1});for(var o=[],n=0,s=r;n<s.length;n++){var a=s[n],i=a.x-.5,l=a.y-.5,c=e.ignoreRotation?0:t.rotation,u=Math.cos(c)*i-Math.sin(c)*l,p=Math.sin(c)*i+Math.cos(c)*l;u=u*t.width+t.xCenter,p=p*t.height+t.yCenter;var m=a.z*t.width,f=Gt({},a);f.x=u,f.y=p,f.z=m,o.push(f)}return o}function rR(r,t){var e=(function(o,n,s,a){var i=n-o,l=a-s;if(i===0)throw new Error("Original min and max are both ".concat(o,", range cannot be 0."));var c=l/i;return{scale:c,offset:s-o*c}})(0,255,t[0],t[1]);return at((function(){return Z(K(r,e.scale),e.offset)}))}function Ib(r,t,e){var o,n,s,a,i,l,c,u,p,m,f,d,g,h,x=t.outputTensorSize,b=t.keepAspectRatio,C=t.borderMode,S=t.outputTensorFloatRange,I=oc(r),$=(function(F,_){return _?{xCenter:_.xCenter*F.width,yCenter:_.yCenter*F.height,width:_.width*F.width,height:_.height*F.height,rotation:_.rotation}:{xCenter:.5*F.width,yCenter:.5*F.height,width:F.width,height:F.height,rotation:0}})(I,e),R=(function(F,_,O){if(O===void 0&&(O=!1),!O)return{top:0,left:0,right:0,bottom:0};var M=_.height,P=_.width;Nb(_,"targetSize"),Nb(F,"roi");var B,V,z=M/P,G=F.height/F.width,W=0,H=0;return z>G?(B=F.width,V=F.width*z,H=(1-G/z)/2):(B=F.height/z,V=F.height,W=(1-z/G)/2),F.width=B,F.height=V,{top:H,left:W,right:W,bottom:H}})($,x,b),A=(o=$,n=I.width,s=I.height,a=!1,i=o.width,l=o.height,c=a?-1:1,u=Math.cos(o.rotation),p=Math.sin(o.rotation),m=o.xCenter,f=o.yCenter,d=1/n,g=1/s,(h=new Array(16))[0]=i*u*c*d,h[1]=-l*p*d,h[2]=0,h[3]=(-.5*i*u*c+.5*l*p+m)*d,h[4]=i*p*c*g,h[5]=l*u*g,h[6]=0,h[7]=(-.5*l*u-.5*i*p*c+f)*g,h[8]=0,h[9]=0,h[10]=i*d,h[11]=0,h[12]=0,h[13]=0,h[14]=0,h[15]=1,eR(h));return{imageTensor:at((function(){var F=$b(r),_=De(tR(A,I,x),[1,8]),O=C==="zero"?"constant":"nearest",M=oo.transform(Ne(xt(F,"float32")),_,"bilinear",O,0,[x.height,x.width]);return S!=null?rR(M,S):M})),padding:R,transformationMatrix:A}}function b$(r,t,e,o){return o===1?.5*(r+t):r+(t-r)*e/(o-1)}function IK(r){return at((function(){var t=(function(n){return at((function(){return[ft(n,[0,0,0],[1,-1,1]),ft(n,[0,0,1],[1,-1,-1])]}))})(r),e=t[0],o=t[1];return{boxes:Pt(o),logits:Pt(e)}}))}function oR(r){return r!=null&&r.currentTime!=null}function w$(r){for(var t={locationData:{relativeKeypoints:[]}},e=Number.MAX_SAFE_INTEGER,o=Number.MIN_SAFE_INTEGER,n=Number.MAX_SAFE_INTEGER,s=Number.MIN_SAFE_INTEGER,a=0;a<r.length;++a){var i=r[a];e=Math.min(e,i.x),o=Math.max(o,i.x),n=Math.min(n,i.y),s=Math.max(s,i.y),t.locationData.relativeKeypoints.push({x:i.x,y:i.y})}return t.locationData.relativeBoundingBox={xMin:e,yMin:n,xMax:o,yMax:s,width:o-e,height:s-n},t}function kK(r,t,e,o){return Dt(this,void 0,void 0,(function(){var n,s,a,i,l;return Ot(this,(function(c){switch(c.label){case 0:return r.sort((function(u,p){return Math.max.apply(Math,p.score)-Math.max.apply(Math,u.score)})),n=De(r.map((function(u){return[u.locationData.relativeBoundingBox.yMin,u.locationData.relativeBoundingBox.xMin,u.locationData.relativeBoundingBox.yMax,u.locationData.relativeBoundingBox.xMax]}))),s=Zt(r.map((function(u){return u.score[0]}))),[4,oo.nonMaxSuppressionAsync(n,s,t,e)];case 1:return[4,(a=c.sent()).array()];case 2:return i=c.sent(),l=r.filter((function(u,p){return i.indexOf(p)>-1})),Tt([n,s,a]),[2,l]}}))}))}function nR(r,t){return r.map((function(e){var o=Gt(Gt({},e),{x:e.x*t.width,y:e.y*t.height});return e.z!=null&&(o.z=e.z*t.width),o}))}function EK(r,t,e){return Dt(this,void 0,void 0,(function(){var o,n,s,a,i,l,c,u,p,m,f,d,g,h,x,b,C,S,I,$,R,A,F,_;return Ot(this,(function(O){switch(O.label){case 0:if(o=Pt(t,[0]),n=o.shape,s=n[0],a=n[1],i=n[2],r.length!==i)throw new Error("Expected heatmap to have same number of channels as the number of landmarks. But got landmarks length: "+"".concat(r.length,", heatmap length: ").concat(i));return l=[],[4,o.buffer()];case 1:for(c=O.sent(),u=0;u<r.length;u++)if(p=r[u],m=Gt({},p),l.push(m),f=Math.trunc(m.x*a),d=Math.trunc(m.y*s),!(f<0||f>=a||d<0||f>=s)){for(g=Math.trunc((e.kernelSize-1)/2),h=Math.max(0,f-g),x=Math.min(a,f+g+1),b=Math.max(0,d-g),C=Math.min(s,d+g+1),S=0,I=0,$=0,R=0,A=b;A<C;++A)for(F=h;F<x;++F)_=c.get(A,F,u),S+=_,R=Math.max(R,_),I+=F*_,$+=A*_;R>=e.minConfidenceToRefine&&S>0&&(m.x=I/a/S,m.y=$/s/S)}return o.dispose(),[2,l]}}))}))}function v$(r,t){var e=t.left,o=t.top,n=t.left+t.right,s=t.top+t.bottom;return r.map((function(a){return Gt(Gt({},a),{x:(a.x-e)/(1-n),y:(a.y-o)/(1-s),z:a.z/(1-n)})}))}function $K(r,t,e){return qn()==="webgl"?(function(o,n,s){var a=s.combineWithPreviousRatio.toFixed(2),i={variableNames:["prevMask","newMask"],outputShape:o.shape,userCode:`
  void main() {
      ivec2 coords = getOutputCoords();
      int height = coords[0];
      int width = coords[1];

      float prevMaskValue = getPrevMask(height, width);
      float newMaskValue = getNewMask(height, width);

      /*
      * Assume p := newMaskValue
      * H(p) := 1 + (p * log(p) + (1-p) * log(1-p)) / log(2)
      * uncertainty alpha(p) =
      *   Clamp(1 - (1 - H(p)) * (1 - H(p)), 0, 1) [squaring the
      * uncertainty]
      *
      * The following polynomial approximates uncertainty alpha as a
      * function of (p + 0.5):
      */
      const float c1 = 5.68842;
      const float c2 = -0.748699;
      const float c3 = -57.8051;
      const float c4 = 291.309;
      const float c5 = -624.717;
      float t = newMaskValue - 0.5;
      float x = t * t;

      float uncertainty =
        1.0 - min(1.0, x * (c1 + x * (c2 + x * (c3 + x * (c4 + x * c5)))));

      float outputValue = newMaskValue + (prevMaskValue - newMaskValue) *
                             (uncertainty * `.concat(a,`);

      setOutput(outputValue);
    }
`)},l=To();return at((function(){var c=l.compileAndRun(i,[o,n]);return Re().makeTensorFromDataId(c.dataId,c.shape,c.dtype)}))})(r,t,e):at((function(){var o=lt(t,.5),n=ue(o),s=lt(1,to(1,K(n,Z(5.68842,K(n,Z(-.748699,K(n,Z(-57.8051,K(n,Z(291.309,K(n,-624.717)))))))))));return Z(t,K(lt(r,t),K(s,e.combineWithPreviousRatio)))}))}function RK(r,t,e){return Dt(this,void 0,void 0,(function(){var o,n,s,a,i;return Ot(this,(function(l){switch(l.label){case 0:return o=r[0],n=r[1],s=(function(c,u,p){return at((function(){var m,f,d,g;p.reverseOutputOrder?(f=Pt(ft(c,[0,p.boxCoordOffset+0],[-1,1])),m=Pt(ft(c,[0,p.boxCoordOffset+1],[-1,1])),g=Pt(ft(c,[0,p.boxCoordOffset+2],[-1,1])),d=Pt(ft(c,[0,p.boxCoordOffset+3],[-1,1]))):(m=Pt(ft(c,[0,p.boxCoordOffset+0],[-1,1])),f=Pt(ft(c,[0,p.boxCoordOffset+1],[-1,1])),d=Pt(ft(c,[0,p.boxCoordOffset+2],[-1,1])),g=Pt(ft(c,[0,p.boxCoordOffset+3],[-1,1]))),f=Z(K(mt(f,p.xScale),u.w),u.x),m=Z(K(mt(m,p.yScale),u.h),u.y),p.applyExponentialOnBoxSize?(d=K(We(mt(d,p.hScale)),u.h),g=K(We(mt(g,p.wScale)),u.w)):(d=K(mt(d,p.hScale),u.h),g=K(mt(g,p.wScale),u.h));var h=lt(m,mt(d,2)),x=lt(f,mt(g,2)),b=Z(m,mt(d,2)),C=Z(f,mt(g,2)),S=Lt([L(h,[p.numBoxes,1]),L(x,[p.numBoxes,1]),L(b,[p.numBoxes,1]),L(C,[p.numBoxes,1])],1);if(p.numKeypoints)for(var I=0;I<p.numKeypoints;++I){var $=p.keypointCoordOffset+I*p.numValuesPerKeypoint,R=void 0,A=void 0;p.reverseOutputOrder?(R=Pt(ft(c,[0,$],[-1,1])),A=Pt(ft(c,[0,$+1],[-1,1]))):(A=Pt(ft(c,[0,$],[-1,1])),R=Pt(ft(c,[0,$+1],[-1,1])));var F=Z(K(mt(R,p.xScale),u.w),u.x),_=Z(K(mt(A,p.yScale),u.h),u.y);S=Lt([S,L(F,[p.numBoxes,1]),L(_,[p.numBoxes,1])],1)}return S}))})(n,t,e),a=at((function(){var c=o;return e.sigmoidScore?(e.scoreClippingThresh!=null&&(c=Oc(o,-e.scoreClippingThresh,e.scoreClippingThresh)),c=je(c)):c})),[4,AK(s,a,e)];case 1:return i=l.sent(),Tt([s,a]),[2,i]}}))}))}function AK(r,t,e){return Dt(this,void 0,void 0,(function(){var o,n,s,a,i,l,c,u,p,m,f,d;return Ot(this,(function(g){switch(g.label){case 0:return o=[],[4,r.data()];case 1:return n=g.sent(),[4,t.data()];case 2:for(s=g.sent(),a=0;a<e.numBoxes;++a)if(!(e.minScoreThresh!=null&&s[a]<e.minScoreThresh||(i=a*e.numCoords,l=FK(n[i+0],n[i+1],n[i+2],n[i+3],s[a],e.flipVertically,a),(c=l.locationData.relativeBoundingBox).width<0||c.height<0))){if(e.numKeypoints>0)for((u=l.locationData).relativeKeypoints=[],p=e.numKeypoints*e.numValuesPerKeypoint,m=0;m<p;m+=e.numValuesPerKeypoint)f=i+e.keypointCoordOffset+m,d={x:n[f+0],y:e.flipVertically?1-n[f+1]:n[f+1]},u.relativeKeypoints.push(d);o.push(l)}return[2,o]}}))}))}function FK(r,t,e,o,n,s,a){return{score:[n],ind:a,locationData:{relativeBoundingBox:{xMin:t,yMin:s?1-e:r,xMax:o,yMax:s?1-r:e,width:o-t,height:e-r}}}}function _K(r,t){return r==="none"?t:(function(e){return 1/(1+Math.exp(-e))})(t)}function S$(r,t,e,o){return Dt(this,void 0,void 0,(function(){var n,s,a,i,l,c,u,p;return Ot(this,(function(m){switch(m.label){case 0:return e=e||t.flipHorizontally||!1,o=o||t.flipVertically||!1,n=r.size,s=n/t.numLandmarks,[4,r.data()];case 1:for(a=m.sent(),i=[],l=0;l<t.numLandmarks;++l)c=l*s,(p={x:0,y:0}).x=e?t.inputImageWidth-a[c]:a[c],s>1&&(p.y=o?t.inputImageHeight-a[c+1]:a[c+1]),s>2&&(p.z=a[c+2]),s>3&&(p.score=_K(t.visibilityActivation,a[c+3])),i.push(p);for(u=0;u<i.length;++u)(p=i[u]).x=p.x/t.inputImageWidth,p.y=p.y/t.inputImageHeight,p.z=p.z/t.inputImageWidth/(t.normalizeZ||1);return[2,i]}}))}))}function C$(r,t,e){var o=r.width,n=r.height,s=r.rotation;if(e.rotation==null&&e.rotationDegree==null||(s=(function(u,p){return p.rotation!=null?u+=p.rotation:p.rotationDegree!=null&&(u+=Math.PI*p.rotationDegree/180),J$(u)})(s,e)),s===0)r.xCenter=r.xCenter+o*e.shiftX,r.yCenter=r.yCenter+n*e.shiftY;else{var a=(t.width*o*e.shiftX*Math.cos(s)-t.height*n*e.shiftY*Math.sin(s))/t.width,i=(t.width*o*e.shiftX*Math.sin(s)+t.height*n*e.shiftY*Math.cos(s))/t.height;r.xCenter=r.xCenter+a,r.yCenter=r.yCenter+i}if(e.squareLong){var l=Math.max(o*t.width,n*t.height);o=l/t.width,n=l/t.height}else if(e.squareShort){var c=Math.min(o*t.width,n*t.height);o=c/t.width,n=c/t.height}return r.width=o*e.scaleX,r.height=n*e.scaleY,r}function sR(r,t){return r.map((function(e){var o=Gt(Gt({},e),{x:e.x/t.width,y:e.y/t.height});return e.z!=null&&(e.z=e.z/t.width),o}))}var gs=(function(){function r(t){this.alpha=t,this.initialized=!1}return r.prototype.apply=function(t,e){var o;return this.initialized?o=e==null?this.storedValue+this.alpha*(t-this.storedValue):this.storedValue+this.alpha*e*Math.asinh((t-this.storedValue)/e):(o=t,this.initialized=!0),this.rawValue=t,this.storedValue=o,o},r.prototype.applyWithAlpha=function(t,e,o){return this.alpha=e,this.apply(t,o)},r.prototype.hasLastRawValue=function(){return this.initialized},r.prototype.lastRawValue=function(){return this.rawValue},r.prototype.reset=function(){this.initialized=!1},r})(),yb=(function(){function r(t){this.frequency=t.frequency,this.minCutOff=t.minCutOff,this.beta=t.beta,this.thresholdCutOff=t.thresholdCutOff,this.thresholdBeta=t.thresholdBeta,this.derivateCutOff=t.derivateCutOff,this.x=new gs(this.getAlpha(this.minCutOff)),this.dx=new gs(this.getAlpha(this.derivateCutOff)),this.lastTimestamp=0}return r.prototype.apply=function(t,e,o){if(t==null)return t;var n=Math.trunc(e);if(this.lastTimestamp>=n)return t;this.lastTimestamp!==0&&n!==0&&(this.frequency=1/(1e-6*(n-this.lastTimestamp))),this.lastTimestamp=n;var s=this.x.hasLastRawValue()?(t-this.x.lastRawValue())*o*this.frequency:0,a=this.dx.applyWithAlpha(s,this.getAlpha(this.derivateCutOff)),i=this.minCutOff+this.beta*Math.abs(a),l=this.thresholdCutOff!=null?this.thresholdCutOff+this.thresholdBeta*Math.abs(a):null;return this.x.applyWithAlpha(t,this.getAlpha(i),l)},r.prototype.getAlpha=function(t){return 1/(1+this.frequency/(2*Math.PI*t))},r})(),kb=(function(){function r(t){this.config=t}return r.prototype.apply=function(t,e,o){var n=this;if(t==null)return this.reset(),null;this.initializeFiltersIfEmpty(t);var s=1;if(!this.config.disableValueScaling){if(o<this.config.minAllowedObjectScale)return Ki([],t,!0);s=1/o}return t.map((function(a,i){var l=Gt(Gt({},a),{x:n.xFilters[i].apply(a.x,e,s),y:n.yFilters[i].apply(a.y,e,s)});return a.z!=null&&(l.z=n.zFilters[i].apply(a.z,e,s)),l}))},r.prototype.reset=function(){this.xFilters=null,this.yFilters=null,this.zFilters=null},r.prototype.initializeFiltersIfEmpty=function(t){var e=this;this.xFilters!=null&&this.xFilters.length===t.length||(this.xFilters=t.map((function(o){return new yb(e.config)})),this.yFilters=t.map((function(o){return new yb(e.config)})),this.zFilters=t.map((function(o){return new yb(e.config)})))},r})(),bb=(function(){function r(t){this.config=t,this.window=[],this.lowPassFilter=new gs(1),this.lastValue=0,this.lastValueScale=1,this.lastTimestamp=-1}return r.prototype.apply=function(t,e,o){if(t==null)return t;var n,s=Math.trunc(e);if(this.lastTimestamp>=s)return t;if(this.lastTimestamp===-1)n=1;else{for(var a=t*o-this.lastValue*this.lastValueScale,i=s-this.lastTimestamp,l=a,c=i,u=(1+this.window.length)*(1e6/30),p=0,m=this.window;p<m.length;p++){var f=m[p];if(c+f.duration>u)break;l+=f.distance,c+=f.duration}var d=l/(1e-6*c);n=1-1/(1+this.config.velocityScale*Math.abs(d)),this.window.unshift({distance:a,duration:i}),this.window.length>this.config.windowSize&&this.window.pop()}return this.lastValue=t,this.lastValueScale=o,this.lastTimestamp=s,this.lowPassFilter.applyWithAlpha(t,n)},r})(),DK=(function(){function r(t){this.config=t}return r.prototype.apply=function(t,e,o){var n=this;if(t==null)return this.reset(),null;var s=1;if(!this.config.disableValueScaling){if(o<this.config.minAllowedObjectScale)return Ki([],t,!0);s=1/o}return this.initializeFiltersIfEmpty(t),t.map((function(a,i){var l=Gt(Gt({},a),{x:n.xFilters[i].apply(a.x,e,s),y:n.yFilters[i].apply(a.y,e,s)});return a.z!=null&&(l.z=n.zFilters[i].apply(a.z,e,s)),l}))},r.prototype.reset=function(){this.xFilters=null,this.yFilters=null,this.zFilters=null},r.prototype.initializeFiltersIfEmpty=function(t){var e=this;this.xFilters!=null&&this.xFilters.length===t.length||(this.xFilters=t.map((function(o){return new bb(e.config)})),this.yFilters=t.map((function(o){return new bb(e.config)})),this.zFilters=t.map((function(o){return new bb(e.config)})))},r})(),wb=(function(){function r(t){if(t.velocityFilter!=null)this.keypointsFilter=new DK(t.velocityFilter);else{if(t.oneEuroFilter==null)throw new Error("Either configure velocityFilter or oneEuroFilter, but got "+"".concat(t,"."));this.keypointsFilter=new kb(t.oneEuroFilter)}}return r.prototype.apply=function(t,e,o,n,s){if(n===void 0&&(n=!1),t==null)return this.keypointsFilter.reset(),null;var a=s!=null?(function(c,u){return(c.width*u.width+c.height*u.height)/2})(s,o):1,i=n?nR(t,o):t,l=this.keypointsFilter.apply(i,e,a);return n?sR(l,o):l},r})(),T$=(function(){function r(t){this.alpha=t.alpha}return r.prototype.apply=function(t){var e=this;if(t==null)return this.visibilityFilters=null,null;this.visibilityFilters!=null&&this.visibilityFilters.length===t.length||(this.visibilityFilters=t.map((function(i){return new gs(e.alpha)})));for(var o=[],n=0;n<t.length;++n){var s=t[n],a=Gt({},s);a.score=this.visibilityFilters[n].apply(s.score),o.push(a)}return o},r})(),OK={reduceBoxesInLowestlayer:!1,interpolatedScaleAspectRatio:1,featureMapHeight:[],featureMapWidth:[],numLayers:5,minScale:.1484375,maxScale:.75,inputSizeHeight:224,inputSizeWidth:224,anchorOffsetX:.5,anchorOffsetY:.5,strides:[8,16,32,32,32],aspectRatios:[1],fixedAnchorSize:!0},rc={runtime:"tfjs",modelType:"full",enableSmoothing:!0,enableSegmentation:!1,smoothSegmentation:!0,detectorModelUrl:"https://tfhub.dev/mediapipe/tfjs-model/blazepose_3d/detector/1",landmarkModelUrl:"https://tfhub.dev/mediapipe/tfjs-model/blazepose_3d/landmark/full/2"},PK={maxPoses:1,flipHorizontal:!1},MK={applyExponentialOnBoxSize:!1,flipVertically:!1,ignoreClasses:[],numClasses:1,numBoxes:2254,numCoords:12,boxCoordOffset:0,keypointCoordOffset:4,numKeypoints:4,numValuesPerKeypoint:2,sigmoidScore:!0,scoreClippingThresh:100,reverseOutputOrder:!0,xScale:224,yScale:224,hScale:224,wScale:224,minScoreThresh:.5},LK=.3,N$={shiftX:0,shiftY:0,scaleX:1.25,scaleY:1.25,squareLong:!0},BK={outputTensorSize:{width:224,height:224},keepAspectRatio:!0,outputTensorFloatRange:[-1,1],borderMode:"zero"},VK={outputTensorSize:{width:256,height:256},keepAspectRatio:!0,outputTensorFloatRange:[0,1],borderMode:"zero"},zK={numLandmarks:39,inputImageWidth:256,inputImageHeight:256,visibilityActivation:"sigmoid",flipHorizontally:!1,flipVertically:!1},WK={numLandmarks:39,inputImageWidth:1,inputImageHeight:1,visibilityActivation:"sigmoid",flipHorizontally:!1,flipVertically:!1},GK={kernelSize:7,minConfidenceToRefine:.5},I$={alpha:.1},UK={oneEuroFilter:{frequency:30,minCutOff:.05,beta:80,derivateCutOff:1,minAllowedObjectScale:1e-6}},HK={oneEuroFilter:{frequency:30,minCutOff:.01,beta:10,derivateCutOff:1,minAllowedObjectScale:1e-6}},KK={oneEuroFilter:{frequency:30,minCutOff:.1,beta:40,derivateCutOff:1,minAllowedObjectScale:1e-6,disableValueScaling:!0}},qK={activation:"none"},jK={combineWithPreviousRatio:.7},XK=(function(){function r(t){this.mask=t}return r.prototype.toCanvasImageSource=function(){return Dt(this,void 0,void 0,(function(){return Ot(this,(function(t){return[2,Y$(this.mask)]}))}))},r.prototype.toImageData=function(){return Dt(this,void 0,void 0,(function(){return Ot(this,(function(t){return[2,Q$(this.mask)]}))}))},r.prototype.toTensor=function(){return Dt(this,void 0,void 0,(function(){return Ot(this,(function(t){return[2,this.mask]}))}))},r.prototype.getUnderlyingType=function(){return"tensor"},r})();function YK(r){return Z$(r),"person"}var QK=(function(){function r(t,e,o,n,s,a){this.detectorModel=t,this.landmarkModel=e,this.enableSmoothing=o,this.enableSegmentation=n,this.smoothSegmentation=s,this.modelType=a,this.regionOfInterest=null,this.prevFilteredSegmentationMask=null,this.anchors=(function(p){p.reduceBoxesInLowestLayer==null&&(p.reduceBoxesInLowestLayer=!1),p.interpolatedScaleAspectRatio==null&&(p.interpolatedScaleAspectRatio=1),p.fixedAnchorSize==null&&(p.fixedAnchorSize=!1);for(var m=[],f=0;f<p.numLayers;){for(var d=[],g=[],h=[],x=[],b=f;b<p.strides.length&&p.strides[b]===p.strides[f];){var C=b$(p.minScale,p.maxScale,b,p.strides.length);if(b===0&&p.reduceBoxesInLowestLayer)h.push(1),h.push(2),h.push(.5),x.push(.1),x.push(C),x.push(C);else{for(var S=0;S<p.aspectRatios.length;++S)h.push(p.aspectRatios[S]),x.push(C);if(p.interpolatedScaleAspectRatio>0){var I=b===p.strides.length-1?1:b$(p.minScale,p.maxScale,b+1,p.strides.length);x.push(Math.sqrt(C*I)),h.push(p.interpolatedScaleAspectRatio)}}b++}for(var $=0;$<h.length;++$){var R=Math.sqrt(h[$]);d.push(x[$]/R),g.push(x[$]*R)}var A=0,F=0;if(p.featureMapHeight.length>0)A=p.featureMapHeight[f],F=p.featureMapWidth[f];else{var _=p.strides[f];A=Math.ceil(p.inputSizeHeight/_),F=Math.ceil(p.inputSizeWidth/_)}for(var O=0;O<A;++O)for(var M=0;M<F;++M)for(var P=0;P<d.length;++P){var B={xCenter:(M+p.anchorOffsetX)/F,yCenter:(O+p.anchorOffsetY)/A,width:0,height:0};p.fixedAnchorSize?(B.width=1,B.height=1):(B.width=g[P],B.height=d[P]),m.push(B)}f=b}return m})(OK);var i=Zt(this.anchors.map((function(p){return p.width}))),l=Zt(this.anchors.map((function(p){return p.height}))),c=Zt(this.anchors.map((function(p){return p.xCenter}))),u=Zt(this.anchors.map((function(p){return p.yCenter})));this.anchorTensor={x:c,y:u,w:i,h:l},this.prevFilteredSegmentationMask=this.enableSegmentation?De([],[0,0]):null}return r.prototype.estimatePoses=function(t,e,o){return Dt(this,void 0,void 0,(function(){var n,s,a,i,l,c,u,p,m,f,d,g,h,x,b,C,S,I,$,R,A,F,_;return Ot(this,(function(O){switch(O.label){case 0:return n=(function(M){var P;if((P=M==null?PK:Gt({},M)).maxPoses==null&&(P.maxPoses=1),P.maxPoses<=0)throw new Error("Invalid maxPoses ".concat(P.maxPoses,". Should be > 0."));if(P.maxPoses>1)throw new Error("Multi-pose detection is not implemented yet. Please set maxPoses to 1.");return P})(e),t==null?(this.reset(),[2,[]]):(this.maxPoses=n.maxPoses,this.timestamp=o!=null?1e3*o:oR(t)?1e6*t.currentTime:null,s=oc(t),a=at((function(){return xt($b(t),"float32")})),(i=this.regionOfInterest)!=null?[3,2]:[4,this.detectPose(a)]);case 1:if((l=O.sent()).length===0)return this.reset(),a.dispose(),[2,[]];c=l[0],i=this.poseDetectionToRoi(c,s),O.label=2;case 2:return[4,this.poseLandmarksByRoi(i,a)];case 3:return u=O.sent(),a.dispose(),u==null?(this.reset(),[2,[]]):(p=u.landmarks,m=u.auxiliaryLandmarks,f=u.poseScore,d=u.worldLandmarks,g=u.segmentationMask,h=this.poseLandmarkFiltering(p,m,d,s),x=h.actualLandmarksFiltered,b=h.auxiliaryLandmarksFiltered,C=h.actualWorldLandmarksFiltered,S=this.poseLandmarksToRoi(b,s),this.regionOfInterest=S,I=this.smoothSegmentation&&g!=null?this.poseSegmentationFiltering(g):g,($=x!=null?nR(x,s):null)!=null&&$.forEach((function(M,P){M.name=Wu[P]})),(R=C)!=null&&R.forEach((function(M,P){M.name=Wu[P]})),A={score:f,keypoints:$,keypoints3D:R},I!==null&&(F=at((function(){var M=Ne(I,2),P=Ye(M,[[0,0],[0,0],[0,1]]);return Yc(P,[[0,0],[0,0],[0,2]],"symmetric")})),this.smoothSegmentation||Tt(I),_={maskValueToLabel:YK,mask:new XK(F)},A.segmentation=_),[2,[A]])}}))}))},r.prototype.poseSegmentationFiltering=function(t){var e=this.prevFilteredSegmentationMask;return e.size===0?this.prevFilteredSegmentationMask=t:(this.prevFilteredSegmentationMask=$K(e,t,jK),Tt(t)),Tt(e),this.prevFilteredSegmentationMask},r.prototype.dispose=function(){this.detectorModel.dispose(),this.landmarkModel.dispose(),Tt([this.anchorTensor.x,this.anchorTensor.y,this.anchorTensor.w,this.anchorTensor.h,this.prevFilteredSegmentationMask])},r.prototype.reset=function(){this.regionOfInterest=null,this.enableSegmentation&&(Tt(this.prevFilteredSegmentationMask),this.prevFilteredSegmentationMask=De([],[0,0])),this.visibilitySmoothingFilterActual=null,this.visibilitySmoothingFilterAuxiliary=null,this.landmarksSmoothingFilterActual=null,this.landmarksSmoothingFilterAuxiliary=null},r.prototype.detectPose=function(t){return Dt(this,void 0,void 0,(function(){var e,o,n,s,a,i,l,c,u,p;return Ot(this,(function(m){switch(m.label){case 0:return e=Ib(t,BK),o=e.imageTensor,n=e.padding,s=this.detectorModel.predict(o),a=IK(s),i=a.boxes,[4,RK([l=a.logits,i],this.anchorTensor,MK)];case 1:return(c=m.sent()).length===0?(Tt([o,s,l,i]),[2,c]):[4,kK(c,this.maxPoses,LK)];case 2:return u=m.sent(),p=(function(f,d){f===void 0&&(f=[]);for(var g=d.left,h=d.top,x=d.left+d.right,b=d.top+d.bottom,C=0;C<f.length;C++){var S=f[C],I=S.locationData.relativeBoundingBox,$=(I.xMin-g)/(1-x),R=(I.yMin-h)/(1-b),A=I.width/(1-x),F=I.height/(1-b);I.xMin=$,I.yMin=R,I.width=A,I.height=F,I.xMax=$+A,I.yMax=R+F;var _=S.locationData.relativeKeypoints;_&&_.forEach((function(O){var M=(O.x-g)/(1-x),P=(O.y-h)/(1-b);O.x=M,O.y=P}))}return f})(u,n),Tt([o,s,l,i]),[2,p]}}))}))},r.prototype.poseDetectionToRoi=function(t,e){return C$(gb(t,e,{rotationVectorEndKeypointIndex:1,rotationVectorStartKeypointIndex:0,rotationVectorTargetAngleDegree:90}),e,N$)},r.prototype.poseLandmarksByRoi=function(t,e){return Dt(this,void 0,void 0,(function(){var o,n,s,a,i,l,c,u,p,m,f,d,g,h;return Ot(this,(function(x){switch(x.label){case 0:if(o=oc(e),n=Ib(e,VK,t),s=n.imageTensor,a=n.padding,i=n.transformationMatrix,this.modelType!=="lite"&&this.modelType!=="full"&&this.modelType!=="heavy")throw new Error("Model type must be one of lite, full or heavy,"+"but got ".concat(this.modelType));return l=["ld_3d","output_poseflag","activation_heatmap","world_3d"],this.enableSegmentation&&l.push("activation_segmentation"),c=this.landmarkModel.execute(s,l),[4,this.tensorsToPoseLandmarksAndSegmentation(c)];case 1:return(u=x.sent())==null?(Tt(c),Tt(s),[2,null]):(p=u.landmarks,m=u.auxiliaryLandmarks,f=u.poseScore,d=u.worldLandmarks,g=u.segmentationMask,[4,this.poseLandmarksAndSegmentationInverseProjection(o,t,a,i,p,m,d,g)]);case 2:return h=x.sent(),Tt(c),Tt(s),[2,Gt({poseScore:f},h)]}}))}))},r.prototype.poseLandmarksAndSegmentationInverseProjection=function(t,e,o,n,s,a,i,l){return Dt(this,void 0,void 0,(function(){var c,u,p,m,f,d;return Ot(this,(function(g){return c=v$(s,o),u=v$(a,o),p=y$(c,e),m=y$(u,e),f=(function(h,x){for(var b=[],C=0,S=h;C<S.length;C++){var I=S[C],$=I.x,R=I.y,A=x.rotation,F=Math.cos(A)*$-Math.sin(A)*R,_=Math.sin(A)*$+Math.cos(A)*R,O=Gt({},I);O.x=F,O.y=_,b.push(O)}return b})(i,e),d=null,this.enableSegmentation&&(d=at((function(){var h=l.shape,x=h[0],b=h[1],C=(function($){var R=eR(new Array(16).fill(0));R[0][0]=Ue($,0,0),R[1][0]=-Ue($,0,1),R[2][0]=Ue($,0,2),R[3][0]=-Ue($,0,3),R[0][2]=Ue($,2,0),R[1][2]=-Ue($,2,1),R[2][2]=Ue($,2,2),R[3][2]=-Ue($,2,3),R[0][1]=-Ue($,1,0),R[1][1]=Ue($,1,1),R[2][1]=-Ue($,1,2),R[3][1]=Ue($,1,3),R[0][3]=-Ue($,3,0),R[1][3]=Ue($,3,1),R[2][3]=-Ue($,3,2),R[3][3]=Ue($,3,3);for(var A=$[0][0]*R[0][0]+$[1][0]*R[0][1]+$[2][0]*R[0][2]+$[3][0]*R[0][3],F=0;F<R.length;F++)for(var _=0;_<R.length;_++)R[F][_]/=A;return R})(n),S=De(tR(C,{width:b,height:x},t),[1,8]),I=[1,x,b,1];return Pt(oo.transform(L(l,I),S,"bilinear","constant",0,[t.height,t.width]),[0,3])})),Tt(l)),[2,{landmarks:p,auxiliaryLandmarks:m,worldLandmarks:f,segmentationMask:d}]}))}))},r.prototype.tensorsToPoseLandmarksAndSegmentation=function(t){return Dt(this,void 0,void 0,(function(){var e,o,n,s,a,i,l,c,u,p,m,f,d;return Ot(this,(function(g){switch(g.label){case 0:return e=t[0],o=t[1],n=t[2],s=t[3],a=this.enableSegmentation?t[4]:null,[4,o.data()];case 1:return(i=g.sent()[0])<.5?[2,null]:[4,S$(e,zK)];case 2:return[4,EK(g.sent(),n,GK)];case 3:return l=g.sent(),c=l.slice(0,33),u=l.slice(33,35),[4,S$(s,WK)];case 4:return p=g.sent(),m=p.slice(0,33),f=(function(h,x,b){b===void 0&&(b=!0);for(var C=[],S=0;S<h.length;S++){var I=Gt({},x[S]);b&&(I.score=h[S].score),C.push(I)}return C})(c,m,!0),d=this.enableSegmentation?(function(h,x,b){return at((function(){var C=Pt(h,[0]),S=C.shape[2];if(S===1){var I=C;switch(x.activation){case"none":break;case"sigmoid":I=je(I);break;case"softmax":throw new Error("Softmax activation requires two channels.");default:throw new Error("Activation not supported (".concat(x.activation,")"))}var $=b?oo.resizeBilinear(I,[b.height,b.width]):I;return Pt($,[2])}throw new Error("Unsupported number of tensor channels ".concat(S))}))})(a,qK):null,[2,{landmarks:c,auxiliaryLandmarks:u,poseScore:i,worldLandmarks:f,segmentationMask:d}]}}))}))},r.prototype.poseLandmarksToRoi=function(t,e){return C$(gb(w$(t),e,{rotationVectorStartKeypointIndex:0,rotationVectorEndKeypointIndex:1,rotationVectorTargetAngleDegree:90}),e,N$)},r.prototype.poseLandmarkFiltering=function(t,e,o,n){var s,a,i;if(this.timestamp!=null&&this.enableSmoothing){var l=gb(w$(e),n,{rotationVectorEndKeypointIndex:0,rotationVectorStartKeypointIndex:1,rotationVectorTargetAngleDegree:90});this.visibilitySmoothingFilterActual==null&&(this.visibilitySmoothingFilterActual=new T$(I$)),s=this.visibilitySmoothingFilterActual.apply(t),this.visibilitySmoothingFilterAuxiliary==null&&(this.visibilitySmoothingFilterAuxiliary=new T$(I$)),a=this.visibilitySmoothingFilterAuxiliary.apply(e),i=this.visibilitySmoothingFilterActual.apply(o),this.landmarksSmoothingFilterActual==null&&(this.landmarksSmoothingFilterActual=new wb(UK)),s=this.landmarksSmoothingFilterActual.apply(s,this.timestamp,n,!0,l),this.landmarksSmoothingFilterAuxiliary==null&&(this.landmarksSmoothingFilterAuxiliary=new wb(HK)),a=this.landmarksSmoothingFilterAuxiliary.apply(a,this.timestamp,n,!0,l),this.worldLandmarksSmoothingFilterActual==null&&(this.worldLandmarksSmoothingFilterActual=new wb(KK)),i=this.worldLandmarksSmoothingFilterActual.apply(o,this.timestamp)}else s=t,a=e,i=o;return{actualLandmarksFiltered:s,auxiliaryLandmarksFiltered:a,actualWorldLandmarksFiltered:i}},r})();function ZK(r){return Dt(this,void 0,void 0,(function(){var t,e,o,n,s,a;return Ot(this,(function(i){switch(i.label){case 0:return t=(function(l){var c=Gt({},l??rc);if(c.enableSmoothing==null&&(c.enableSmoothing=rc.enableSmoothing),c.enableSegmentation==null&&(c.enableSegmentation=rc.enableSegmentation),c.smoothSegmentation==null&&(c.smoothSegmentation=rc.smoothSegmentation),c.modelType==null&&(c.modelType=rc.modelType),c.detectorModelUrl==null&&(c.detectorModelUrl=rc.detectorModelUrl),c.landmarkModelUrl==null)switch(c.modelType){case"lite":c.landmarkModelUrl="https://tfhub.dev/mediapipe/tfjs-model/blazepose_3d/landmark/lite/2";break;case"heavy":c.landmarkModelUrl="https://tfhub.dev/mediapipe/tfjs-model/blazepose_3d/landmark/heavy/2";break;default:c.landmarkModelUrl="https://tfhub.dev/mediapipe/tfjs-model/blazepose_3d/landmark/full/2"}return c})(r),e=typeof t.detectorModelUrl=="string"&&t.detectorModelUrl.indexOf("https://tfhub.dev")>-1,o=typeof t.landmarkModelUrl=="string"&&t.landmarkModelUrl.indexOf("https://tfhub.dev")>-1,[4,Promise.all([hs(t.detectorModelUrl,{fromTFHub:e}),hs(t.landmarkModelUrl,{fromTFHub:o})])];case 1:return n=i.sent(),s=n[0],a=n[1],[2,new QK(s,a,t.enableSmoothing,t.enableSegmentation,t.smoothSegmentation,t.modelType)]}}))}))}var xs,He,aR=(function(){function r(t){(function(e){if(e.maxTracks<1)throw new Error("Must specify 'maxTracks' to be at least 1, but "+"encountered ".concat(e.maxTracks));if(e.maxAge<=0)throw new Error("Must specify 'maxAge' to be positive, but "+"encountered ".concat(e.maxAge));if(e.keypointTrackerParams!==void 0){if(e.keypointTrackerParams.keypointConfidenceThreshold<0||e.keypointTrackerParams.keypointConfidenceThreshold>1)throw new Error("Must specify 'keypointConfidenceThreshold' to be in the range [0, 1], but encountered "+"".concat(e.keypointTrackerParams.keypointConfidenceThreshold));if(e.keypointTrackerParams.minNumberOfKeypoints<1)throw new Error("Must specify 'minNumberOfKeypoints' to be at least 1, but "+"encountered ".concat(e.keypointTrackerParams.minNumberOfKeypoints));for(var o=0,n=e.keypointTrackerParams.keypointFalloff;o<n.length;o++){var s=n[o];if(s<=0)throw new Error("Must specify each keypoint falloff parameterto be positive "+"but encountered ".concat(s))}}})(t),this.tracks=[],this.maxTracks=t.maxTracks,this.maxAge=1e3*t.maxAge,this.minSimilarity=t.minSimilarity,this.nextID=1}return r.prototype.apply=function(t,e){this.filterOldTracks(e);var o=this.computeSimilarity(t);return this.assignTracks(t,o,e),this.updateTracks(e),t},r.prototype.getTracks=function(){return this.tracks.slice()},r.prototype.getTrackIDs=function(){return new Set(this.tracks.map((function(t){return t.id})))},r.prototype.filterOldTracks=function(t){var e=this;this.tracks=this.tracks.filter((function(o){return t-o.lastTimestamp<=e.maxAge}))},r.prototype.assignTracks=function(t,e,o){for(var n=Array.from(Array(e[0].length).keys()),s=[],a=0,i=Array.from(Array(t.length).keys());a<i.length;a++){var l=i[a];if(n.length!==0){for(var c=-1,u=-1,p=0,m=n;p<m.length;p++){var f=m[p],d=e[l][f];d>=this.minSimilarity&&d>u&&(c=f,u=d)}if(c>=0){var g=this.tracks[c];g=Object.assign(g,this.createTrack(t[l],o,g.id)),t[l].id=g.id;var h=n.indexOf(c);n.splice(h,1)}else s.push(l)}else s.push(l)}for(var x=0,b=s;x<b.length;x++){l=b[x];var C=this.createTrack(t[l],o);this.tracks.push(C),t[l].id=C.id}},r.prototype.updateTracks=function(t){this.tracks.sort((function(e,o){return o.lastTimestamp-e.lastTimestamp})),this.tracks=this.tracks.slice(0,this.maxTracks)},r.prototype.createTrack=function(t,e,o){var n={id:o||this.nextTrackID(),lastTimestamp:e,keypoints:Ki([],t.keypoints,!0).map((function(s){return Gt({},s)}))};return t.box!==void 0&&(n.box=Gt({},t.box)),n},r.prototype.nextTrackID=function(){var t=this.nextID;return this.nextID+=1,t},r.prototype.remove=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];this.tracks=this.tracks.filter((function(o){return!t.includes(o.id)}))},r.prototype.reset=function(){this.tracks=[]},r})(),JK=(function(r){function t(e){return r.call(this,e)||this}return X$(t,r),t.prototype.computeSimilarity=function(e){var o=this;return e.length===0||this.tracks.length===0?[[]]:e.map((function(n){return o.tracks.map((function(s){return o.iou(n,s)}))}))},t.prototype.iou=function(e,o){var n=Math.max(e.box.xMin,o.box.xMin),s=Math.max(e.box.yMin,o.box.yMin),a=Math.min(e.box.xMax,o.box.xMax),i=Math.min(e.box.yMax,o.box.yMax);if(n>=a||s>=i)return 0;var l=(a-n)*(i-s);return l/(e.box.width*e.box.height+o.box.width*o.box.height-l)},t})(aR),tq=(function(r){function t(e){var o=r.call(this,e)||this;return o.keypointThreshold=e.keypointTrackerParams.keypointConfidenceThreshold,o.keypointFalloff=e.keypointTrackerParams.keypointFalloff,o.minNumKeyoints=e.keypointTrackerParams.minNumberOfKeypoints,o}return X$(t,r),t.prototype.computeSimilarity=function(e){if(e.length===0||this.tracks.length===0)return[[]];for(var o=[],n=0,s=e;n<s.length;n++){for(var a=s[n],i=[],l=0,c=this.tracks;l<c.length;l++){var u=c[l];i.push(this.oks(a,u))}o.push(i)}return o},t.prototype.oks=function(e,o){for(var n=this.area(o.keypoints)+1e-6,s=0,a=0,i=0;i<e.keypoints.length;++i){var l=e.keypoints[i],c=o.keypoints[i];if(!(l.score<this.keypointThreshold||c.score<this.keypointThreshold)){a+=1;var u=Math.pow(l.x-c.x,2)+Math.pow(l.y-c.y,2),p=2*this.keypointFalloff[i];s+=Math.exp(-1*u/(2*n*Math.pow(p,2)))}}return a<this.minNumKeyoints?0:s/a},t.prototype.area=function(e){var o=this,n=e.filter((function(l){return l.score>o.keypointThreshold})),s=Math.min.apply(Math,Ki([1],n.map((function(l){return l.x})),!1)),a=Math.max.apply(Math,Ki([0],n.map((function(l){return l.x})),!1)),i=Math.min.apply(Math,Ki([1],n.map((function(l){return l.y})),!1));return(a-s)*(Math.max.apply(Math,Ki([0],n.map((function(l){return l.y})),!1))-i)},t})(aR);function iR(r){switch(r){case He.BlazePose:return Wu.reduce((function(t,e,o){return t[e]=o,t}),{});case He.PoseNet:case He.MoveNet:return po.reduce((function(t,e,o){return t[e]=o,t}),{});default:throw new Error("Model ".concat(r," is not supported."))}}(function(r){r.Keypoint="keypoint",r.BoundingBox="boundingBox"})(xs||(xs={})),(function(r){r.MoveNet="MoveNet",r.BlazePose="BlazePose",r.PoseNet="PoseNet"})(He||(He={}));var eq=Object.freeze({__proto__:null,getKeypointIndexBySide:function(r){switch(r){case He.BlazePose:return xK;case He.PoseNet:case He.MoveNet:return yK;default:throw new Error("Model ".concat(r," is not supported."))}},getAdjacentPairs:function(r){switch(r){case He.BlazePose:return wK;case He.PoseNet:case He.MoveNet:return bK;default:throw new Error("Model ".concat(r," is not supported."))}},getKeypointIndexByName:iR}),k$=["SinglePose.Lightning","SinglePose.Thunder","MultiPose.Lightning"],lR={modelType:"SinglePose.Lightning",enableSmoothing:!0},E$={},$$={frequency:30,minCutOff:2.5,beta:300,derivateCutOff:2.5,thresholdCutOff:.5,thresholdBeta:5,disableValueScaling:!0},vb={maxTracks:18,maxAge:1e3,minSimilarity:.2,keypointTrackerParams:{keypointConfidenceThreshold:.3,keypointFalloff:[.026,.025,.025,.035,.035,.079,.079,.072,.072,.062,.062,.107,.107,.087,.087,.089,.089],minNumberOfKeypoints:4}},R$={maxTracks:18,maxAge:1e3,minSimilarity:.15,trackerParams:{}};function rq(r,t,e,o){for(var n={},s=0,a=po;s<a.length;s++){var i=a[s];n[i]=[t[e[i]].y*o.height,t[e[i]].x*o.width]}if((function(b,C){return(b[C.left_hip].score>.2||b[C.right_hip].score>.2)&&(b[C.left_shoulder].score>.2||b[C.right_shoulder].score>.2)})(t,e)){var l=(n.left_hip[0]+n.right_hip[0])/2,c=(n.left_hip[1]+n.right_hip[1])/2,u=(function(b,C,S,I,$){for(var R=["left_shoulder","right_shoulder","left_hip","right_hip"],A=0,F=0,_=0;_<R.length;_++)(V=Math.abs(I-S[R[_]][0]))>A&&(A=V),(z=Math.abs($-S[R[_]][1]))>F&&(F=z);for(var O=0,M=0,P=0,B=Object.keys(S);P<B.length;P++){var V,z,G=B[P];b[C[G]].score<.2||((V=Math.abs(I-S[G][0]))>O&&(O=V),(z=Math.abs($-S[G][1]))>M&&(M=z))}return[A,F,O,M]})(t,e,n,l,c),p=u[0],m=u[1],f=u[2],d=u[3],g=Math.max(1.9*m,1.9*p,1.2*f,1.2*d),h=[l-(g=Math.min(g,Math.max(c,o.width-c,l,o.height-l))),c-g];if(g>Math.max(o.width,o.height)/2)return Eb(r==null,o);var x=2*g;return{yMin:h[0]/o.height,xMin:h[1]/o.width,yMax:(h[0]+x)/o.height,xMax:(h[1]+x)/o.width,height:(h[0]+x)/o.height-h[0]/o.height,width:(h[1]+x)/o.width-h[1]/o.width}}return Eb(r==null,o)}function Eb(r,t){var e,o,n,s;return r?t.width>t.height?(e=1,o=t.height/t.width,n=0,s=(t.width/2-t.height/2)/t.width):(e=t.width/t.height,o=1,n=(t.height/2-t.width/2)/t.height,s=0):t.width>t.height?(e=t.width/t.height,o=1,n=(t.height/2-t.width/2)/t.height,s=0):(e=1,o=t.height/t.width,n=0,s=(t.width/2-t.height/2)/t.width),{yMin:n,xMin:s,yMax:n+e,xMax:s+o,height:e,width:o}}function oq(r){var t,e=r==null?lR:Gt({},r);if(e.modelType==null)e.modelType="SinglePose.Lightning";else if(k$.indexOf(e.modelType)<0)throw new Error("Invalid architecture ".concat(e.modelType,". ")+"Should be one of ".concat(k$));if(e.enableSmoothing==null&&(e.enableSmoothing=!0),e.minPoseScore!=null&&(e.minPoseScore<0||e.minPoseScore>1))throw new Error("minPoseScore should be between 0.0 and 1.0");if(e.multiPoseMaxDimension!=null&&(e.multiPoseMaxDimension%32!=0||e.multiPoseMaxDimension<32))throw new Error("multiPoseMaxDimension must be a multiple of 32 and higher than 0");if(e.modelType==="MultiPose.Lightning"&&e.enableTracking==null&&(e.enableTracking=!0),e.modelType==="MultiPose.Lightning"&&e.enableTracking===!0)if(e.trackerType==null&&(e.trackerType=xs.BoundingBox),e.trackerType===xs.Keypoint)e.trackerConfig!=null?e.trackerConfig=(function(o){var n=A$(vb,o);return n.keypointTrackerParams=Gt({},vb.keypointTrackerParams),o.keypointTrackerParams!=null&&(o.keypointTrackerParams.keypointConfidenceThreshold!=null&&(n.keypointTrackerParams.keypointConfidenceThreshold=o.keypointTrackerParams.keypointConfidenceThreshold),o.keypointTrackerParams.keypointFalloff!=null&&(n.keypointTrackerParams.keypointFalloff=o.keypointTrackerParams.keypointFalloff),o.keypointTrackerParams.minNumberOfKeypoints!=null&&(n.keypointTrackerParams.minNumberOfKeypoints=o.keypointTrackerParams.minNumberOfKeypoints)),n})(e.trackerConfig):e.trackerConfig=vb;else{if(e.trackerType!==xs.BoundingBox)throw new Error("Tracker type not supported by MoveNet");e.trackerConfig!=null?e.trackerConfig=(t=e.trackerConfig,A$(R$,t)):e.trackerConfig=R$}return e}function A$(r,t){var e={maxTracks:r.maxTracks,maxAge:r.maxAge,minSimilarity:r.minSimilarity};return t.maxTracks!=null&&(e.maxTracks=t.maxTracks),t.maxAge!=null&&(e.maxAge=t.maxAge),t.minSimilarity!=null&&(e.minSimilarity=t.minSimilarity),e}var nq=(function(){function r(t,e){this.moveNetModel=t,this.modelInputResolution={height:0,width:0},this.keypointIndexByName=iR(He.MoveNet),e.modelType==="SinglePose.Lightning"?(this.modelInputResolution.width=192,this.modelInputResolution.height=192):e.modelType==="SinglePose.Thunder"&&(this.modelInputResolution.width=256,this.modelInputResolution.height=256),this.multiPoseModel=e.modelType==="MultiPose.Lightning",this.multiPoseModel||(this.keypointFilter=new kb($$),this.cropRegionFilterYMin=new gs(.9),this.cropRegionFilterXMin=new gs(.9),this.cropRegionFilterYMax=new gs(.9),this.cropRegionFilterXMax=new gs(.9)),this.enableSmoothing=e.enableSmoothing,e.minPoseScore?this.minPoseScore=e.minPoseScore:this.minPoseScore=.25,e.multiPoseMaxDimension?this.multiPoseMaxDimension=e.multiPoseMaxDimension:this.multiPoseMaxDimension=256,this.enableTracking=e.enableTracking,this.multiPoseModel&&this.enableTracking&&(e.trackerType===xs.Keypoint?this.tracker=new tq(e.trackerConfig):e.trackerType===xs.BoundingBox&&(this.tracker=new JK(e.trackerConfig)),this.enableSmoothing&&(this.keypointFilterMap=new Map))}return r.prototype.runSinglePersonPoseModel=function(t){return Dt(this,void 0,void 0,(function(){var e,o,n,s,a;return Ot(this,(function(i){switch(i.label){case 0:if((e=this.moveNetModel.execute(t)).shape.length!==4||e.shape[0]!==1||e.shape[1]!==1||e.shape[2]!==17||e.shape[3]!==3)throw e.dispose(),new Error("Unexpected output shape from model: [".concat(e.shape,"]"));return qn()==="webgpu"?[3,1]:(o=e.dataSync(),[3,3]);case 1:return[4,e.data()];case 2:o=i.sent(),i.label=3;case 3:for(e.dispose(),n={keypoints:[],score:0},s=0,a=0;a<17;++a)n.keypoints[a]={y:o[3*a],x:o[3*a+1],score:o[3*a+2]},n.keypoints[a].score>.2&&(++s,n.score+=n.keypoints[a].score);return s>0&&(n.score/=s),[2,n]}}))}))},r.prototype.runMultiPersonPoseModel=function(t){return Dt(this,void 0,void 0,(function(){var e,o,n,s,a,i,l,c;return Ot(this,(function(u){switch(u.label){case 0:if((e=this.moveNetModel.execute(t)).shape.length!==3||e.shape[0]!==1||e.shape[2]!==56)throw e.dispose(),new Error("Unexpected output shape from model: [".concat(e.shape,"]"));return qn()==="webgpu"?[3,1]:(o=e.dataSync(),[3,3]);case 1:return[4,e.data()];case 2:o=u.sent(),u.label=3;case 3:for(e.dispose(),n=[],s=o.length/56,a=0;a<s;++a)for(n[a]={keypoints:[]},i=56*a+51,n[a].box={yMin:o[i],xMin:o[i+1],yMax:o[i+2],xMax:o[i+3],width:o[i+3]-o[i+1],height:o[i+2]-o[i]},l=56*a+55,n[a].score=o[l],n[a].keypoints=[],c=0;c<17;++c)n[a].keypoints[c]={y:o[56*a+3*c],x:o[56*a+3*c+1],score:o[56*a+3*c+2]};return[2,n]}}))}))},r.prototype.estimatePoses=function(t,e,o){return e===void 0&&(e=E$),Dt(this,void 0,void 0,(function(){var n,s,a,i,l,c;return Ot(this,(function(u){switch(u.label){case 0:return e=(function(p){return p==null?E$:Gt({},p)})(e),t==null?(this.reset(),[2,[]]):(o==null?oR(t)&&(o=1e6*t.currentTime):o*=1e3,n=$b(t),s=oc(n),a=Ne(n,0),t instanceof Nt||n.dispose(),i=[],this.multiPoseModel?[3,2]:[4,this.estimateSinglePose(a,s,o)]);case 1:return i=u.sent(),[3,4];case 2:return[4,this.estimateMultiplePoses(a,s,o)];case 3:i=u.sent(),u.label=4;case 4:for(l=0;l<i.length;++l)for(c=0;c<i[l].keypoints.length;++c)i[l].keypoints[c].name=po[c],i[l].keypoints[c].y*=s.height,i[l].keypoints[c].x*=s.width;return[2,i]}}))}))},r.prototype.estimateSinglePose=function(t,e,o){return Dt(this,void 0,void 0,(function(){var n,s,a,i,l=this;return Ot(this,(function(c){switch(c.label){case 0:return this.cropRegion||(this.cropRegion=Eb(this.cropRegion==null,e)),n=at((function(){var u=De([[l.cropRegion.yMin,l.cropRegion.xMin,l.cropRegion.yMax,l.cropRegion.xMax]]),p=Xe([1],"int32"),m=[l.modelInputResolution.height,l.modelInputResolution.width];return xt(oo.cropAndResize(t,u,p,m,"bilinear",0),"int32")})),t.dispose(),[4,this.runSinglePersonPoseModel(n)];case 1:if(s=c.sent(),n.dispose(),s.score<this.minPoseScore)return this.reset(),[2,[]];for(a=0;a<s.keypoints.length;++a)s.keypoints[a].y=this.cropRegion.yMin+s.keypoints[a].y*this.cropRegion.height,s.keypoints[a].x=this.cropRegion.xMin+s.keypoints[a].x*this.cropRegion.width;return o!=null&&this.enableSmoothing&&(s.keypoints=this.keypointFilter.apply(s.keypoints,o,1)),i=rq(this.cropRegion,s.keypoints,this.keypointIndexByName,e),this.cropRegion=this.filterCropRegion(i),[2,[s]]}}))}))},r.prototype.estimateMultiplePoses=function(t,e,o){return Dt(this,void 0,void 0,(function(){var n,s,a,i,l,c,u,p,m,f,d,g=this;return Ot(this,(function(h){switch(h.label){case 0:return e.width>e.height?(s=this.multiPoseMaxDimension,a=Math.round(this.multiPoseMaxDimension*e.height/e.width),n=oo.resizeBilinear(t,[a,s]),l=s,c=32*Math.ceil(a/32),i=Ye(n,[[0,0],[0,c-a],[0,0],[0,0]])):(s=Math.round(this.multiPoseMaxDimension*e.width/e.height),a=this.multiPoseMaxDimension,n=oo.resizeBilinear(t,[a,s]),l=32*Math.ceil(s/32),c=a,i=Ye(n,[[0,0],[0,0],[0,l-s],[0,0]])),n.dispose(),t.dispose(),u=xt(i,"int32"),i.dispose(),[4,this.runMultiPersonPoseModel(u)];case 1:for(p=h.sent(),u.dispose(),p=p.filter((function(x){return x.score>=g.minPoseScore})),f=0;f<p.length;++f)for(m=0;m<p[f].keypoints.length;++m)p[f].keypoints[m].y*=c/a,p[f].keypoints[m].x*=l/s;if(this.enableTracking&&(this.tracker.apply(p,o),this.enableSmoothing)){for(f=0;f<p.length;++f)this.keypointFilterMap.has(p[f].id)||this.keypointFilterMap.set(p[f].id,new kb($$)),p[f].keypoints=this.keypointFilterMap.get(p[f].id).apply(p[f].keypoints,o,1);d=this.tracker.getTrackIDs(),this.keypointFilterMap.forEach((function(x,b){d.has(b)||g.keypointFilterMap.delete(b)}))}return[2,p]}}))}))},r.prototype.filterCropRegion=function(t){if(t){var e=this.cropRegionFilterYMin.apply(t.yMin),o=this.cropRegionFilterXMin.apply(t.xMin),n=this.cropRegionFilterYMax.apply(t.yMax),s=this.cropRegionFilterXMax.apply(t.xMax);return{yMin:e,xMin:o,yMax:n,xMax:s,height:n-e,width:s-o}}return this.cropRegionFilterYMin.reset(),this.cropRegionFilterXMin.reset(),this.cropRegionFilterYMax.reset(),this.cropRegionFilterXMax.reset(),null},r.prototype.dispose=function(){this.moveNetModel.dispose()},r.prototype.reset=function(){this.cropRegion=null,this.resetFilters()},r.prototype.resetFilters=function(){this.keypointFilter.reset(),this.cropRegionFilterYMin.reset(),this.cropRegionFilterXMin.reset(),this.cropRegionFilterYMax.reset(),this.cropRegionFilterXMax.reset()},r})();function sq(r){return r===void 0&&(r=lR),Dt(this,void 0,void 0,(function(){var t,e,o,n;return Ot(this,(function(s){switch(s.label){case 0:return t=oq(r),o=!0,t.modelUrl?(o=typeof t.modelUrl=="string"&&t.modelUrl.indexOf("https://tfhub.dev")>-1,[4,hs(t.modelUrl,{fromTFHub:o})]):[3,2];case 1:return e=s.sent(),[3,4];case 2:return n=void 0,t.modelType==="SinglePose.Lightning"?n="https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4":t.modelType==="SinglePose.Thunder"?n="https://tfhub.dev/google/tfjs-model/movenet/singlepose/thunder/4":t.modelType==="MultiPose.Lightning"&&(n="https://tfhub.dev/google/tfjs-model/movenet/multipose/lightning/1"),[4,hs(n,{fromTFHub:o})];case 3:e=s.sent(),s.label=4;case 4:return qn()==="webgl"&&D().set("TOPK_LAST_DIM_CPU_HANDOFF_SIZE_THRESHOLD",0),[2,new nq(e,t)]}}))}))}var F$={architecture:"MobileNetV1",outputStride:16,multiplier:.75,inputResolution:{height:257,width:257}},_$=["MobileNetV1","ResNet50"],D$={MobileNetV1:[8,16],ResNet50:[16]},aq=[8,16,32],O$={MobileNetV1:[.5,.75,1],ResNet50:[1]},P$=[1,2,4],M$={maxPoses:1,flipHorizontal:!1},iq={maxPoses:5,flipHorizontal:!1,scoreThreshold:.5,nmsRadius:20},lq=[-123.15,-115.9,-103.06];function Sb(r){return Math.floor(r/2)}var cq=(function(){function r(t,e){this.priorityQueue=new Array(t),this.numberOfElements=-1,this.getElementValue=e}return r.prototype.enqueue=function(t){this.priorityQueue[++this.numberOfElements]=t,this.swim(this.numberOfElements)},r.prototype.dequeue=function(){var t=this.priorityQueue[0];return this.exchange(0,this.numberOfElements--),this.sink(0),this.priorityQueue[this.numberOfElements+1]=null,t},r.prototype.empty=function(){return this.numberOfElements===-1},r.prototype.size=function(){return this.numberOfElements+1},r.prototype.all=function(){return this.priorityQueue.slice(0,this.numberOfElements+1)},r.prototype.max=function(){return this.priorityQueue[0]},r.prototype.swim=function(t){for(;t>0&&this.less(Sb(t),t);)this.exchange(t,Sb(t)),t=Sb(t)},r.prototype.sink=function(t){for(;2*t<=this.numberOfElements;){var e=2*t;if(e<this.numberOfElements&&this.less(e,e+1)&&e++,!this.less(t,e))break;this.exchange(t,e),t=e}},r.prototype.getValueAt=function(t){return this.getElementValue(this.priorityQueue[t])},r.prototype.less=function(t,e){return this.getValueAt(t)<this.getValueAt(e)},r.prototype.exchange=function(t,e){var o=this.priorityQueue[t];this.priorityQueue[t]=this.priorityQueue[e],this.priorityQueue[e]=o},r})();function uq(r,t,e,o,n,s){for(var a=s.shape,i=a[0],l=a[1],c=!0,u=Math.max(e-n,0),p=Math.min(e+n+1,i),m=u;m<p;++m){for(var f=Math.max(o-n,0),d=Math.min(o+n+1,l),g=f;g<d;++g)if(s.get(m,g,r)>t){c=!1;break}if(!c)break}return c}function pq(r){return Dt(this,void 0,void 0,(function(){return Ot(this,(function(t){return[2,Promise.all(r.map((function(e){return e.buffer()})))]}))}))}function cR(r,t,e,o){return{y:o.get(r,t,e),x:o.get(r,t,e+17)}}function uR(r,t,e){var o=cR(r.heatmapY,r.heatmapX,r.id,e),n=o.y,s=o.x;return{x:r.heatmapX*t+s,y:r.heatmapY*t+n}}function pR(r,t,e,o){var n=e.x,s=e.y;return r.some((function(a){var i,l,c,u,p,m,f=a.keypoints;return i=s,l=n,c=f[o].y,u=f[o].x,(p=c-i)*p+(m=u-l)*m<=t}))}var L$=po.reduce((function(r,t,e){return r[t]=e,r}),{}),mR=[["nose","left_eye"],["left_eye","left_ear"],["nose","right_eye"],["right_eye","right_ear"],["nose","left_shoulder"],["left_shoulder","left_elbow"],["left_elbow","left_wrist"],["left_shoulder","left_hip"],["left_hip","left_knee"],["left_knee","left_ankle"],["nose","right_shoulder"],["right_shoulder","right_elbow"],["right_elbow","right_wrist"],["right_shoulder","right_hip"],["right_hip","right_knee"],["right_knee","right_ankle"]].map((function(r){var t=r[0],e=r[1];return[L$[t],L$[e]]})),Cb=mR.map((function(r){return r[1]})),B$=mR.map((function(r){return r[0]}));function V$(r,t,e){return r<t?t:r>e?e:r}function Tb(r,t,e,o){return{y:V$(Math.round(r.y/t),0,e-1),x:V$(Math.round(r.x/t),0,o-1)}}function z$(r,t){return{x:r.x+t.x,y:r.y+t.y}}function W$(r,t,e,o,n,s,a,i){i===void 0&&(i=2);for(var l=o.shape,c=l[0],u=l[1],p={y:t.y,x:t.x},m=z$(p,(function(b,C,S){var I=S.shape[2]/2;return{y:S.get(C.y,C.x,b),x:S.get(C.y,C.x,I+b)}})(r,Tb(p,s,c,u),a)),f=0;f<i;f++){var d=Tb(m,s,c,u),g=cR(d.y,d.x,e,n);m=z$({x:d.x*s,y:d.y*s},{x:g.x,y:g.y})}var h=Tb(m,s,c,u),x=o.get(h.y,h.x,e);return{y:m.y,x:m.x,name:po[e],score:x}}function mq(r,t,e,o,n,s){var a=t.shape[2],i=Cb.length,l=new Array(a),c=r.part,u=r.score,p=uR(c,o,e);l[c.id]={score:u,name:po[c.id],y:p.y,x:p.x};for(var m=i-1;m>=0;--m){var f=Cb[m],d=B$[m];l[f]&&!l[d]&&(l[d]=W$(m,l[f],d,t,e,o,s))}for(m=0;m<i;++m)f=B$[m],d=Cb[m],l[f]&&!l[d]&&(l[d]=W$(m,l[f],d,t,e,o,n));return l}function fq(r,t,e){return e.reduce((function(o,n,s){var a=n.y,i=n.x,l=n.score;return pR(r,t,{y:a,x:i},s)||(o+=l),o}),0)/e.length}function dq(r,t,e,o,n,s,a,i){return a===void 0&&(a=.5),i===void 0&&(i=20),Dt(this,void 0,void 0,(function(){var l,c,u,p,m,f,d,g,h,x,b,C;return Ot(this,(function(S){switch(S.label){case 0:return[4,pq([r,t,e,o])];case 1:for(l=S.sent(),c=l[0],u=l[1],p=l[2],m=l[3],f=[],d=(function(I,$,R){for(var A=R.shape,F=A[0],_=A[1],O=A[2],M=new cq(F*_*O,(function(G){return G.score})),P=0;P<F;++P)for(var B=0;B<_;++B)for(var V=0;V<O;++V){var z=R.get(P,B,V);z<I||uq(V,z,P,B,$,R)&&M.enqueue({score:z,part:{heatmapY:P,heatmapX:B,id:V}})}return M})(a,1,c),g=i*i;f.length<s&&!d.empty();)h=d.dequeue(),x=uR(h.part,n,u),pR(f,g,x,h.part.id)||(b=mq(h,c,u,n,p,m),C=fq(f,g,b),f.push({keypoints:b,score:C}));return[2,f]}}))}))}function fR(){for(var r,t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];switch(t.length){case 0:r="fn main() ";break;case 1:r="fn main(".concat(t[0]," : i32)");break;default:throw Error("Unreachable")}return r}var hq=(function(){function r(t){this.variableNames=["A","B"],this.size=!0,this.workgroupSize=[32,1,1],this.outputShape=[t[0],1],this.dispatchLayout=Vu.flatDispatchLayout(this.outputShape),this.dispatch=Vu.computeDispatch(this.dispatchLayout,this.outputShape,this.workgroupSize),this.shaderKey="getpointsConfidenceOp"}return r.prototype.getUserCode=function(){return`
        `.concat(fR("index"),` {
          if (index < uniforms.size) {
            let y = B[index * 2];
            let x = B[index * 2 + 1];
            let outIndex = y * uniforms.aShape.x * uniforms.aShape.z + x * uniforms.aShape.z + index;
            result[index] = A[outIndex];
          }
        }
        `)},r})();function gq(r,t){if(To()instanceof Bu)return(function(e,o){var n=To(),s=new hq(o.shape),a=n.runWebGPUProgram(s,[e,o],"float32");return Re().makeTensorFromTensorInfo(a)})(r,t);throw new Error("getPointsConfidenceWebGPU is not supported in this backend!")}var xq=(function(){function r(t){if(this.variableNames=["A","B"],this.size=!0,this.supportedLastDimension=2,t.length!==2||t[1]!==this.supportedLastDimension)throw new Error("GetOffsetVectorsProgram only supports shape of [x, ".concat(this.supportedLastDimension,"], but current shape is ").concat(t));this.workgroupSize=[32,1,1],this.outputShape=t;var e=[t[0],1];this.dispatchLayout=Vu.flatDispatchLayout(e),this.dispatch=Vu.computeDispatch(this.dispatchLayout,e,this.workgroupSize),this.shaderKey="GetOffsetVectors"}return r.prototype.getUserCode=function(){return`
    fn getOffsetPoint(y: i32, x: i32, index: i32) -> vec2<i32> {
      let outIndexY = y * uniforms.bShape.x * uniforms.bShape.y + x * uniforms.bShape.y + index;
      let outIndexX = outIndexY + uniforms.bShape.z;
      let outY = i32(B[outIndexY]);
      let outX = i32(B[outIndexX]);
      return vec2<i32>(outY, outX);
    }

    `.concat(fR("index"),` {
      if (index < uniforms.size) {
        let indexY = index * `).concat(this.supportedLastDimension,`;
        let indexX = indexY + 1;
        let heatmapY = A[indexY];
        let heatmapX = A[indexX];
        let out = getOffsetPoint(i32(heatmapY), i32(heatmapX), index);
        result[indexY] = f32(out[0]);
        result[indexX] = f32(out[1]);
      }
    }
    `)},r})();function yq(r,t){if(To()instanceof Bu)return(function(e,o){var n=To(),s=new xq(e.shape),a=n.runWebGPUProgram(s,[e,o],"float32");return Re().makeTensorFromTensorInfo(a)})(r,t);throw new Error("getOffsetVectorsGPU is not supported in this backend!")}function dR(r){var t=r.shape,e=t[0],o=t[1],n=t[2];return at((function(){var s,a,i=L(r,[e*o,n]),l=$c(i,0),c=Ne(mt(l,it(o,"int32")),1),u=Ne((s=l,a=o,at((function(){var p=mt(s,it(a,"int32"));return lt(s,K(p,it(a,"int32")))}))),1);return Lt([c,u],1)}))}function bq(r,t,e){return at((function(){var o=(function(n,s){for(var a=[],i=0;i<po.length;i++){var l=n.get(i,0).valueOf(),c=n.get(i,1).valueOf(),u=wq(l,c,i,s),p=u.x,m=u.y;a.push(m),a.push(p)}return De(a,[po.length,2])})(r,e);return Z(xt(K(r.toTensor(),it(t,"int32")),"float32"),o)}))}function wq(r,t,e,o){return{y:o.get(r,t,e),x:o.get(r,t,e+po.length)}}function vq(r,t,e){return Dt(this,void 0,void 0,(function(){var o,n,s,a,i,l,c,u,p,m;return Ot(this,(function(f){switch(f.label){case 0:return o=0,n=dR(r),[4,Promise.all([r.buffer(),t.buffer(),n.buffer()])];case 1:return s=f.sent(),a=s[0],i=s[1],l=s[2],[4,(c=bq(l,e,i)).buffer()];case 2:return u=f.sent(),p=Array.from((function(d,g){for(var h=g.shape[0],x=new Float32Array(h),b=0;b<h;b++){var C=g.get(b,0),S=g.get(b,1);x[b]=d.get(C,S,b)}return x})(a,l)),m=p.map((function(d,g){return o+=d,{y:u.get(g,0),x:u.get(g,1),score:d,name:po[g]}})),n.dispose(),c.dispose(),[2,{keypoints:m,score:o/m.length}]}}))}))}function Sq(r,t,e){return Dt(this,void 0,void 0,(function(){var o,n,s;return Ot(this,(function(a){return o=dR(r),n=(function(i,l,c){return at((function(){var u=yq(i,c);return Z(xt(K(i,it(l,"int32")),"float32"),u)}))})(o,e,t),s=gq(r,o),[2,[n,s]]}))}))}function G$(r,t){return(r-1)%t==0}var U$="https://storage.googleapis.com/tfjs-models/savedmodel/posenet/mobilenet/",H$="https://storage.googleapis.com/tfjs-models/savedmodel/posenet/resnet50/";function K$(r,t){return(function(e,o){return(e-1)%o==0})(r,t)?r:Math.floor(r/t)*t+1}var q$=(function(){function r(t,e){this.posenetModel=t;var o=this.posenetModel.inputs[0].shape;y.assert(o[1]===-1&&o[2]===-1,(function(){return"Input shape [".concat(o[1],", ").concat(o[2],"] ")+"must both be equal to or -1"}));var n,s,a=(n=e.inputResolution,s=e.outputStride,{height:K$(n.height,s),width:K$(n.width,s)});(function(i){y.assert(aq.indexOf(i)>=0,(function(){return"outputStride of ".concat(i," is invalid. ")+"It must be either 8 or 16."}))})(e.outputStride),(function(i,l){y.assert(G$(i.height,l),(function(){return"height of ".concat(i.height," is invalid for output stride ")+"".concat(l,".")})),y.assert(G$(i.width,l),(function(){return"width of ".concat(i.width," is invalid for output stride ")+"".concat(l,".")}))})(a,e.outputStride),this.inputResolution=a,this.outputStride=e.outputStride,this.architecture=e.architecture}return r.prototype.estimatePoses=function(t,e){return e===void 0&&(e=M$),Dt(this,void 0,void 0,(function(){return Ot(this,(function(o){return[2,this.estimatePosesGPU(t,e,!1)]}))}))},r.prototype.estimatePosesGPU=function(t,e,o){return e===void 0&&(e=M$),o===void 0&&(o=!1),Dt(this,void 0,void 0,(function(){var n,s,a,i,l,c,u,p,m,f,d,g,h,x,b,C,S,I;return Ot(this,(function($){switch($.label){case 0:return n=(function(R){var A=R;if(A.maxPoses==null&&(A.maxPoses=1),A.maxPoses<=0)throw new Error("Invalid maxPoses ".concat(A.maxPoses,". Should be > 0."));if(A.maxPoses>1){if((A=Gt(Gt({},iq),A)).scoreThreshold<0||A.scoreThreshold>1)throw new Error("Invalid scoreThreshold ".concat(A.scoreThreshold,". ")+"Should be in range [0.0, 1.0]");if(A.nmsRadius<=0)throw new Error("Invalid nmsRadius ".concat(A.nmsRadius,"."))}return A})(e),t==null?[2,o?[[],[]]:[]]:(this.maxPoses=n.maxPoses,s=Ib(t,{outputTensorSize:this.inputResolution,keepAspectRatio:!0,borderMode:"replicate"}),a=s.imageTensor,i=s.padding,l=this.architecture==="ResNet50"?Z(a,lq):rR(a,[-1,1]),c=this.posenetModel.predict(l),this.architecture==="ResNet50"?(u=Pt(c[2],[0]),p=Pt(c[3],[0]),m=Pt(c[0],[0]),f=Pt(c[1],[0])):(u=Pt(c[0],[0]),p=Pt(c[1],[0]),m=Pt(c[2],[0]),f=Pt(c[3],[0])),d=je(p),this.maxPoses!==1?[3,5]:o?[4,Sq(d,u,this.outputStride)]:[3,2]);case 1:return h=$.sent(),b=h[0],x=h[1],g=[b,x],[3,4];case 2:return[4,vq(d,u,this.outputStride)];case 3:b=$.sent(),g=[b],$.label=4;case 4:return[3,7];case 5:if(o)throw new Error("GPU renderer only supports single pose!");return[4,dq(d,u,m,f,this.outputStride,this.maxPoses,n.scoreThreshold,n.nmsRadius)];case 6:g=$.sent(),$.label=7;case 7:if(o){if(n.flipHorizontal===!0)throw new Error("flipHorizontal is not supported!");C=this.getCanvasInfo(oc(t),this.inputResolution,i)}else I=oc(t),S=(function(R,A,F,_){var O=A.height,M=A.width,P=O/(F.height*(1-_.top-_.bottom)),B=M/(F.width*(1-_.left-_.right)),V=-_.top*F.height,z=-_.left*F.width;if(B===1&&P===1&&V===0&&z===0)return R;for(var G=0,W=R;G<W.length;G++)for(var H=0,X=W[G].keypoints;H<X.length;H++){var j=X[H];j.x=(j.x+z)*B,j.y=(j.y+V)*P}return R})(g,I,this.inputResolution,i),n.flipHorizontal&&(S=(function(R,A){for(var F=0,_=R;F<_.length;F++)for(var O=0,M=_[F].keypoints;O<M.length;O++){var P=M[O];P.x=A.width-1-P.x}return R})(S,I));return a.dispose(),l.dispose(),Tt(c),u.dispose(),p.dispose(),m.dispose(),f.dispose(),d.dispose(),[2,o?[g,C]:S]}}))}))},r.prototype.getCanvasInfo=function(t,e,o){var n=t.height,s=t.width,a=n/(e.height*(1-o.top-o.bottom)),i=s/(e.width*(1-o.left-o.right)),l=-o.top*e.height;return[-o.left*e.width,l,i,a,t.width,t.height]},r.prototype.dispose=function(){this.posenetModel.dispose()},r.prototype.reset=function(){},r})();function Cq(r){return r===void 0&&(r=F$),Dt(this,void 0,void 0,(function(){var t,e,o,n,s;return Ot(this,(function(a){switch(a.label){case 0:return(t=(function(u){var p=u||F$;if(p.architecture==null&&(p.architecture="MobileNetV1"),_$.indexOf(p.architecture)<0)throw new Error("Invalid architecture ".concat(p.architecture,". ")+"Should be one of ".concat(_$));if(p.inputResolution==null&&(p.inputResolution={height:257,width:257}),p.outputStride==null&&(p.outputStride=16),D$[p.architecture].indexOf(p.outputStride)<0)throw new Error("Invalid outputStride ".concat(p.outputStride,". ")+"Should be one of ".concat(D$[p.architecture]," ")+"for architecture ".concat(p.architecture,"."));if(p.multiplier==null&&(p.multiplier=1),O$[p.architecture].indexOf(p.multiplier)<0)throw new Error("Invalid multiplier ".concat(p.multiplier,". ")+"Should be one of ".concat(O$[p.architecture]," ")+"for architecture ".concat(p.architecture,"."));if(p.quantBytes==null&&(p.quantBytes=4),P$.indexOf(p.quantBytes)<0)throw new Error("Invalid quantBytes ".concat(p.quantBytes,". ")+"Should be one of ".concat(P$," ")+"for architecture ".concat(p.architecture,"."));if(p.architecture==="MobileNetV1"&&p.outputStride===32&&p.multiplier!==1)throw new Error("When using an output stride of 32, you must select 1 as the multiplier.");return p})(r)).architecture!=="ResNet50"?[3,2]:(i=t.outputStride,l=t.quantBytes,c="model-stride".concat(i,".json"),e=l===4?H$+"float/"+c:H$+"quant".concat(l,"/")+c,[4,hs(t.modelUrl||e)]);case 1:return o=a.sent(),[2,new q$(o,t)];case 2:return n=(function(u,p,m){var f={1:"100",.75:"075",.5:"050"},d="model-stride".concat(u,".json");return m===4?U$+"float/".concat(f[p],"/")+d:U$+"quant".concat(m,"/").concat(f[p],"/")+d})(t.outputStride,t.multiplier,t.quantBytes),[4,hs(t.modelUrl||n)];case 3:return s=a.sent(),[2,new q$(s,t)]}var i,l,c}))}))}function Tq(r,t){return Dt(this,void 0,void 0,(function(){var e,o;return Ot(this,(function(n){switch(r){case He.PoseNet:return[2,Cq(t)];case He.BlazePose:if(o=void 0,(e=t)!=null){if(e.runtime==="tfjs")return[2,ZK(t)];if(e.runtime==="mediapipe")return[2,NK(t)];o=e.runtime}throw new Error("Expect modelConfig.runtime to be either 'tfjs' "+"or 'mediapipe', but got ".concat(o));case He.MoveNet:return[2,sq(t)];default:throw new Error("".concat(r," is not a supported model name."))}}))}))}var Nq={keypointsToNormalizedKeypoints:sR},Iq={modelType:{SINGLEPOSE_LIGHTNING:"SinglePose.Lightning",SINGLEPOSE_THUNDER:"SinglePose.Thunder",MULTIPOSE_LIGHTNING:"MultiPose.Lightning"}};export{hR as poseDetection,Op as tf};








































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































