export function extractEpgUrl(header = '') {
  const match = header.match(/(?:url-tvg|x-tvg-url)\s*=\s*["']([^"']+)["']/i);
  return match?.[1] || null;
}

function decodeXml(value = '') {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function xmlTime(value) {
  const match = String(value).match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-])(\d{2})(\d{2})?/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s, sign, oh, om = '00'] = match;
  const utc = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  const offset = (Number(oh) * 60 + Number(om)) * 60000 * (sign === '+' ? 1 : -1);
  return new Date(utc - offset).toISOString();
}

export function parseXmltv(xml = '') {
  const programmes = [];
  const re = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/gi;
  let match;
  while ((match = re.exec(xml))) {
    const attrs = Object.fromEntries([...match[1].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(x => [x[1], x[2]]));
    const body = match[2];
    const title = body.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i)?.[1];
    const description = body.match(/<desc(?:\s[^>]*)?>([\s\S]*?)<\/desc>/i)?.[1] || '';
    if (!attrs.channel || !attrs.start || !attrs.stop || !title) continue;
    programmes.push({ channelId: attrs.channel, start: xmlTime(attrs.start), stop: xmlTime(attrs.stop), title: decodeXml(title), description: decodeXml(description) });
  }
  return programmes;
}
