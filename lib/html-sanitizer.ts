/**
 * Server-side HTML Sanitizer
 *
 * Simple but effective HTML sanitization for WordPress content.
 * Removes dangerous tags and attributes while preserving safe formatting.
 */

const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'applet',
  'meta', 'link', 'style', 'base', 'form', 'input',
  'button', 'textarea', 'select', 'option'
];

const DANGEROUS_ATTRS = [
  'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
  'onmouseenter', 'onmouseleave', 'onfocus', 'onblur', 'onchange',
  'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress'
];

const DANGEROUS_PROTOCOLS = [
  'javascript:', 'data:', 'vbscript:', 'file:', 'about:'
];

/**
 * Sanitize HTML content
 *
 * This is a basic but effective sanitizer that:
 * 1. Removes dangerous tags entirely
 * 2. Removes event handlers (onerror, onclick, etc.)
 * 3. Removes dangerous protocols (javascript:, data:, etc.)
 * 4. Preserves safe HTML structure
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  let sanitized = html;

  // Remove dangerous tags (including content)
  DANGEROUS_TAGS.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis');
    sanitized = sanitized.replace(regex, '');
    // Also remove self-closing versions
    const selfClosing = new RegExp(`<${tag}[^>]*\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosing, '');
  });

  // Remove event handler attributes
  DANGEROUS_ATTRS.forEach(attr => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
    // Also remove without quotes
    const noQuotes = new RegExp(`\\s${attr}\\s*=\\s*[^\\s>]+`, 'gi');
    sanitized = sanitized.replace(noQuotes, '');
  });

  // Remove dangerous protocols from href and src
  DANGEROUS_PROTOCOLS.forEach(protocol => {
    const hrefRegex = new RegExp(`href\\s*=\\s*["']${protocol}[^"']*["']`, 'gi');
    sanitized = sanitized.replace(hrefRegex, 'href="#"');

    const srcRegex = new RegExp(`src\\s*=\\s*["']${protocol}[^"']*["']`, 'gi');
    sanitized = sanitized.replace(srcRegex, 'src=""');
  });

  // Remove any remaining on* attributes (catch-all)
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');

  return sanitized;
}

/**
 * Validate that HTML doesn't contain obviously malicious content
 *
 * This is an additional safety check before rendering.
 * Returns true if content appears safe.
 */
export function isHTMLSafe(html: string): boolean {
  if (!html) return true;

  const lower = html.toLowerCase();

  // Check for script tags (even obfuscated)
  if (lower.includes('<script') || lower.includes('</script>')) {
    return false;
  }

  // Check for javascript: protocol
  if (lower.includes('javascript:')) {
    return false;
  }

  // Check for data: protocol (can be used for XSS)
  if (lower.includes('data:text/html') || lower.includes('data:application/')) {
    return false;
  }

  // Check for common XSS patterns
  const xssPatterns = [
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /onload\s*=/i,
  ];

  return !xssPatterns.some(pattern => pattern.test(html));
}
