export const cleanString = (s) => {
  if (!s) return null;
  if (typeof s !== 'string') {
    s = String(s);
  }
  s = s.replace(/\\"/g, '"');
  s = s.replace(/\n/g, ' ');
  s = s.replace(/(?<!\\)\\(?!")/g, '');
  s = s.replace(/&amp;/g, '&');
  s = s.replace(/&lt;/g, '<');
  s = s.replace(/&gt;/g, '>');
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'"); // or '&apos;'
  s = s.replace(/&nbsp;/g, ' ');
  s = s.replace(/&#160;/g, ' '); //non-breaking space
  s = s.replace(/&copy;/g, '©');
  s = s.replace(/&reg;/g, '®');
  s = s.replace(/\u2014/g, "-");
  s = s.normalize("NFKC").trim();

  return s;
};