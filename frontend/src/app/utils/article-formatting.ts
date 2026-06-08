export function formatArticleBody(input: string): string {
  const html: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let quoteLines: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }

    html.push(`<p>${paragraph.map((line) => inline(line.trim())).join('<br>')}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) {
      return;
    }

    html.push(`<ul>${listItems.map((item) => `<li>${inline(item.trim())}</li>`).join('')}</ul>`);
    listItems = [];
  };

  const flushQuote = () => {
    if (!quoteLines.length) {
      return;
    }

    html.push(`<blockquote>${quoteLines.map((line) => inline(line.trim())).join('<br>')}</blockquote>`);
    quoteLines = [];
  };

  input.replace(/\r\n?/g, '\n').split('\n').forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushQuote();
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushParagraph();
      flushList();
      flushQuote();
      html.push(`<h2>${inline(trimmed.slice(3).trim())}</h2>`);
      return;
    }

    if (trimmed.startsWith('- ')) {
      flushParagraph();
      flushQuote();
      listItems.push(trimmed.slice(2));
      return;
    }

    if (trimmed.startsWith('> ')) {
      flushParagraph();
      flushList();
      quoteLines.push(trimmed.slice(2));
      return;
    }

    flushList();
    flushQuote();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();
  flushQuote();

  return html.join('');
}

function inline(input: string): string {
  return escapeHtml(input)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((https?:\/\/.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
