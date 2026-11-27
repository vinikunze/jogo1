// Rostos dos contatos, desenhados em SVG a partir do nome, do papel e do modo.
const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const SKIN = ['#f1c7a5', '#e0a982', '#c98a62', '#a86b45', '#8a5433', '#6b3f26'];
const HAIR = ['#1b1512', '#2c1d14', '#4a3020', '#6b4a2b', '#2a2a2a', '#7a7a7a'];
const BG = ['#1f6f5c', '#7a5a1d', '#4b3d8f', '#8a2f33', '#24508f', '#8a4a22', '#1d6b5f', '#7a1f4a'];

// opções: { id, name, role, mode, group, rival, size }
export function face(o) {
  const s = o.size || 38, h = hash((o.mode || '') + (o.id || '') + (o.name || ''));
  const r = k => (h >>> (k * 3)) % 997;
  if (o.group) return groupFace(o, s, h);
  const fem = /^(Dona|Tia|Signora|Nonna|la signora|Sra)/i.test(o.name || '') || (o.id === 'morador' && r(1) % 3 === 0);
  const older = /Seu|Dona|Coroa|Don |Nonna|Coronel|Dr\.|Avvocato|Padre|Tia/i.test(o.name || '') || ['chefe', 'advogado', 'politico'].includes(o.id);
  const skin = SKIN[r(2) % SKIN.length], hair = older && r(3) % 2 ? '#8d8d8d' : HAIR[r(4) % 4];
  const bg = o.rival != null ? '#3a1414' : BG[r(5) % BG.length];
  const m = o.mode, id = o.id || '';
  // roupa
  let shirt = ['#2f6fb2', '#c2433b', '#2b2b2b', '#e9e9e9', '#3d8f4f', '#d7a21f'][r(6) % 6], collar = '', extra = '';
  if (m === 'policia' && !['morador', 'politico', 'comprador', 'advogado'].includes(id)) { shirt = '#1f2f4d'; collar = '<path d="M16 30l4 4 4-4" fill="none" stroke="#c9b26b" stroke-width="1.2"/>'; }
  if (m === 'mafia' || ['advogado', 'politico'].includes(id)) { shirt = '#1a1a1d'; collar = '<path d="M17 29l3 6 3-6z" fill="#f2f2f2"/><path d="M19.4 31h1.2l.6 6h-2.4z" fill="' + (m === 'mafia' ? '#7a1020' : '#24508f') + '"/>'; }
  if (m === 'milicia' && ['chefe', 'braco', 'olheiro'].includes(id)) { shirt = '#20241f'; extra = '<rect x="13" y="32" width="14" height="6" rx="1" fill="#2f3a2a"/>'; }
  if (m === 'faccao' && ['braco', 'olheiro', 'chefe'].includes(id) || o.crew) extra += '<path d="M15 30q5 5 10 0" fill="none" stroke="#e3c04f" stroke-width="1.3"/>';
  // cabelo / chapéu
  let top = '';
  const hs = r(7) % 4;
  if (fem) top = `<path d="M11 19q0-11 9-11t9 11v9h-3v-7q-6-1-10-5-1 6-2 12h-3z" fill="${hair}"/>`;
  else if (hs === 0 && !older) top = `<path d="M12.5 16q0-7.5 7.5-7.5t7.5 7.5q-3-3-7.5-3t-7.5 3z" fill="${hair}"/>`;
  else if (hs === 1) top = `<path d="M12.5 15q1-6.5 7.5-6.5t7.5 6.5l-1 1q-2-3-6.5-3t-6.5 3z" fill="${hair}"/>`;
  else if (hs === 2 && older) top = `<path d="M12.6 16q.4-4 2.4-5.5M27.4 16q-.4-4-2.4-5.5" stroke="${hair}" stroke-width="2.2" fill="none"/>`;
  else top = `<path d="M12.5 15.5q0-7 7.5-7t7.5 7q-4-1.5-7.5-1.5t-7.5 1.5z" fill="${hair}"/>`;
  let hat = '';
  if (m === 'policia' && !['morador', 'politico', 'comprador', 'advogado', 'olheiro'].includes(id) && !fem) hat = '<path d="M11 13.5q9-7 18 0v2H11z" fill="#14203a"/><rect x="10" y="14.6" width="20" height="2" rx="1" fill="#0d1526"/><circle cx="20" cy="11.8" r="1.4" fill="#d9b44a"/>';
  else if (m === 'faccao' && !older && !fem && r(8) % 2) hat = `<path d="M12 14q8-8 16 0v1.5H12z" fill="${['#c2433b', '#1f1f1f', '#2f6fb2', '#e9e9e9'][r(9) % 4]}"/><path d="M27 14.6h5.5q-.5 1.4-5.5 1.4z" fill="#111"/>`;
  else if (m === 'milicia' && ['chefe', 'braco'].includes(id)) hat = '<path d="M12 14q8-8 16 0v1.5H12z" fill="#262a24"/><path d="M12 14.6H6.5q.5 1.4 5.5 1.4z" fill="#1a1d18"/>';
  else if (m === 'mafia' && ['chefe', 'braco', 'fornecedor'].includes(id) && !fem) hat = '<path d="M9 15.2h22q-1 1.4-11 1.4T9 15.2z" fill="#121214"/><path d="M13 15q0-7 7-7t7 7z" fill="#1d1d21"/><rect x="13" y="12.6" width="14" height="1.6" fill="#5a1a22"/>';
  // rosto
  const eyes = `<circle cx="17.2" cy="18.6" r=".95" fill="#1a1410"/><circle cx="22.8" cy="18.6" r=".95" fill="#1a1410"/>`;
  const mouth = r(10) % 3 === 0 ? '<path d="M18 23.2q2 1.3 4 0" stroke="#5a2e22" stroke-width=".9" fill="none" stroke-linecap="round"/>' : '<path d="M18.2 23.4h3.6" stroke="#5a2e22" stroke-width=".9" stroke-linecap="round"/>';
  let face2 = '';
  if (!fem && (m === 'milicia' || m === 'mafia' || older) && r(11) % 2) face2 += `<path d="M16.8 21.6q3.2-1.4 6.4 0q-1 1-3.2.7-2.2.3-3.2-.7z" fill="${hair === '#8d8d8d' ? '#9a9a9a' : hair}"/>`;
  if (!fem && !older && r(12) % 4 === 0) face2 += `<path d="M14.2 20q.5 6 5.8 6.5 5.3-.5 5.8-6.5-.8 3.2-5.8 3.6-5-.4-5.8-3.6z" fill="${hair}" opacity=".85"/>`;
  if (['advogado', 'politico'].includes(id) || (older && r(13) % 3 === 0)) face2 += '<g fill="none" stroke="#d9d4c7" stroke-width=".8"><circle cx="17.2" cy="18.6" r="2.1"/><circle cx="22.8" cy="18.6" r="2.1"/><path d="M19.3 18.6h1.4"/></g>';
  if (m === 'faccao' && id === 'olheiro') face2 += '<rect x="14.6" y="17.3" width="10.8" height="2.6" rx="1.3" fill="#0d0d0d"/>';
  const ring = o.rival != null ? '<circle cx="20" cy="20" r="19" fill="none" stroke="#e5484d" stroke-width="2"/>' : '';
  return `<svg class="face" viewBox="0 0 40 40" width="${s}" height="${s}" aria-hidden="true"><clipPath id="fc${h}"><circle cx="20" cy="20" r="20"/></clipPath><g clip-path="url(#fc${h})"><rect width="40" height="40" fill="${bg}"/>
    <path d="M6 42q1-12 14-12t14 12z" fill="${shirt}"/>${extra}${collar}<rect x="17.6" y="24" width="4.8" height="6" fill="${skin}"/>
    <ellipse cx="20" cy="18.5" rx="7.4" ry="8.6" fill="${skin}"/><ellipse cx="12.7" cy="19" rx="1.3" ry="2" fill="${skin}"/><ellipse cx="27.3" cy="19" rx="1.3" ry="2" fill="${skin}"/>
    ${top}${eyes}<path d="M19.6 20.2q.4 1.6 1 1.6" stroke="#00000033" stroke-width=".8" fill="none"/>${mouth}${face2}${hat}</g>${ring}</svg>`;
}
function groupFace(o, s, h) {
  const c = ['#3d8f4f', '#2f6fb2', '#c2433b'];
  const p = (x, k) => `<g transform="translate(${x} ${k ? 4 : 2}) scale(${k ? .62 : .72})"><path d="M6 42q1-12 14-12t14 12z" fill="${c[(h + x) % 3]}"/><ellipse cx="20" cy="19" rx="7" ry="8" fill="${SKIN[(h >> x) % 5]}"/><path d="M13 16q0-7 7-7t7 7q-3-2-7-2t-7 2z" fill="#1b1512"/></g>`;
  return `<svg class="face" viewBox="0 0 40 40" width="${s}" height="${s}" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#1f3b33"/>${p(-4, 1)}${p(16, 1)}${p(6, 0)}</svg>`;
}
