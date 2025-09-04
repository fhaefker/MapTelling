// Simple text sanitizer for overlay content (SEC-01)
export function safeText(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] as string));
}

export function safeHtmlLineBreaks(input: string): string {
  return safeText(input).replace(/\n/g, '<br/>');
}
