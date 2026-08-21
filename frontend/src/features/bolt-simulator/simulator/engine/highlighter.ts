export function getLanguageFromName(name: string): string {
  const ext = name.includes('.') ? name.split('.').pop()! : '';
  const map: Record<string, string> = {
    py: 'python',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    txt: 'text',
  };
  return map[ext] ?? 'text';
}

interface Token {
  type: string;
  value: string;
}

const KEYWORDS: Record<string, string[]> = {
  python: ['def', 'class', 'if', 'else', 'elif', 'return', 'import', 'from', 'as', 'for', 'while', 'try', 'except', 'with', 'lambda', 'True', 'False', 'None', 'async', 'await', 'yield', 'pass', 'break', 'continue', 'in', 'not', 'and', 'or', 'is'],
  javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'import', 'from', 'export', 'default', 'async', 'await', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'try', 'catch', 'finally', 'throw', 'switch', 'case', 'break', 'continue', 'do', 'in', 'of', 'yield'],
  typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'import', 'from', 'export', 'default', 'async', 'await', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'try', 'catch', 'finally', 'throw', 'switch', 'case', 'break', 'continue', 'do', 'in', 'of', 'yield', 'interface', 'type', 'enum', 'namespace', 'public', 'private', 'protected', 'readonly'],
};

export function tokenize(code: string, language: string): Token[][] {
  const lines = code.split('\n');
  const kw = KEYWORDS[language] ?? KEYWORDS.javascript;

  return lines.map((line) => {
    const tokens: Token[] = [];
    let i = 0;

    while (i < line.length) {
      const ch = line[i];
      const rest = line.slice(i);

      // Comments
      if (language === 'python' && ch === '#') {
        tokens.push({ type: 'comment', value: rest });
        break;
      }
      if ((language === 'javascript' || language === 'typescript') && ch === '/' && line[i + 1] === '/') {
        tokens.push({ type: 'comment', value: rest });
        break;
      }
      if ((language === 'css' || language === 'json') && ch === '/' && line[i + 1] === '*') {
        const end = line.indexOf('*/', i + 2);
        const val = end >= 0 ? line.slice(i, end + 2) : rest;
        tokens.push({ type: 'comment', value: val });
        i += val.length;
        continue;
      }
      if (language === 'html' && ch === '<' && line[i + 1] === '!' && line[i + 2] === '-' && line[i + 3] === '-') {
        const end = line.indexOf('-->', i + 4);
        const val = end >= 0 ? line.slice(i, end + 3) : rest;
        tokens.push({ type: 'comment', value: val });
        i += val.length;
        continue;
      }

      // Strings
      if (ch === '"' || ch === "'" || ch === '`') {
        const quote = ch;
        let j = i + 1;
        while (j < line.length && line[j] !== quote) {
          if (line[j] === '\\') j++;
          j++;
        }
        tokens.push({ type: 'string', value: line.slice(i, Math.min(j + 1, line.length)) });
        i = j + 1;
        continue;
      }

      // Numbers
      if (/\d/.test(ch)) {
        let j = i;
        while (j < line.length && /[\d.]/.test(line[j])) j++;
        tokens.push({ type: 'number', value: line.slice(i, j) });
        i = j;
        continue;
      }

      // Identifiers / keywords
      if (/[a-zA-Z_$]/.test(ch)) {
        let j = i;
        while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
        const word = line.slice(i, j);
        if (kw.includes(word)) {
          tokens.push({ type: 'keyword', value: word });
        } else if (line[j] === '(') {
          tokens.push({ type: 'fn', value: word });
        } else {
          tokens.push({ type: 'plain', value: word });
        }
        i = j;
        continue;
      }

      // HTML tags
      if (language === 'html' && ch === '<') {
        let j = i + 1;
        if (line[j] === '/') j++;
        while (j < line.length && /[a-zA-Z0-9]/.test(line[j])) j++;
        tokens.push({ type: 'tag', value: line.slice(i, j) });
        i = j;
        continue;
      }

      // Punctuation
      if (/[{}()\[\].,;:=+\-*/<>!?&|]/.test(ch)) {
        tokens.push({ type: 'punct', value: ch });
        i++;
        continue;
      }

      tokens.push({ type: 'plain', value: ch });
      i++;
    }

    return tokens;
  });
}

export function tokenClass(type: string): string {
  const map: Record<string, string> = {
    keyword: 'tok-keyword',
    string: 'tok-string',
    comment: 'tok-comment',
    number: 'tok-number',
    fn: 'tok-fn',
    tag: 'tok-tag',
    attr: 'tok-attr',
    punct: 'tok-punct',
    plain: 'tok-plain',
  };
  return map[type] ?? 'tok-plain';
}
