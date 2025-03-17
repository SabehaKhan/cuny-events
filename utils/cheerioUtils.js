export const cleanString = (s)=> {
    if (!s) return null;
    return s.replace(/\u2014/g, "-").normalize("NFKC").trim();
};
