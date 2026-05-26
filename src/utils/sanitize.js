const ALLOWED_TAGS = new Set([
  'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'em', 
  'strong', 'figure', 'figcaption', 'table', 'thead', 
  'tbody', 'tr', 'td', 'th', 'br', 'span', 'div', 'i', 'b'
]);

const ALLOWED_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'target', 'rel'
]);

export function sanitizeHTML(dirtyHTML) {
  if (!dirtyHTML) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirtyHTML, 'text/html');
    const root = doc.body;

    // Recursive sanitization of nodes
    function cleanNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        // If tag is not in whitelist, remove it but keep its children
        if (!ALLOWED_TAGS.has(tagName)) {
          // If it's a dangerous tag like script/style/iframe/frame, destroy children too
          if (['script', 'style', 'iframe', 'frame', 'object', 'embed'].includes(tagName)) {
            node.remove();
            return;
          }

          // Otherwise merge children into parent
          while (node.firstChild) {
            node.parentNode.insertBefore(node.firstChild, node);
          }
          node.remove();
          return;
        }

        // Clean attributes
        const attrs = Array.from(node.attributes);
        for (const attr of attrs) {
          const attrName = attr.name.toLowerCase();
          const val = attr.value.trim().toLowerCase();
          
          // Strict URI validation: only allow http, https, mailto, and relative paths
          let isDangerousLink = false;
          if (attrName === 'href' || attrName === 'src') {
            if (!/^(https?:\/\/|mailto:|\/)/i.test(val)) {
              isDangerousLink = true;
            }
          }
          
          if (!ALLOWED_ATTRS.has(attrName) || isDangerousLink) {
            // Whitelist specific classes
            if (attrName === 'class' && val.includes('gutenberg-first-letter')) {
              // Only allow this specific class and strip any others
              node.setAttribute('class', 'gutenberg-first-letter');
            } else {
              node.removeAttribute(attr.name);
            }
          }
        }

        // Security reinforcement: force rel="noopener noreferrer" and target="_blank" for outside links
        if (tagName === 'a') {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }

        // Clean all children recursively
        // Use Array.from because children array is live and will shrink if we remove nodes
        const children = Array.from(node.childNodes);
        for (const child of children) {
          cleanNode(child);
        }
      }
    }

    // Process all children of the root body
    const topChildren = Array.from(root.childNodes);
    for (const child of topChildren) {
      cleanNode(child);
    }

    return root.innerHTML;
  } catch (error) {
    console.error('HTML Sanitization failed:', error);
    // Fallback to text content in case of severe DOMParser failures
    return dirtyHTML.replace(/<[^>]*>?/gm, '');
  }
}

export function injectDropCap(html) {
  if (!html) return html;
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const firstP = doc.querySelector('p');
    
    if (firstP && firstP.textContent.trim().length > 0) {
      // Find the first text node with alphanumeric characters
      const walk = doc.createTreeWalker(firstP, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walk.nextNode())) {
        const text = node.nodeValue;
        const match = text.match(/[a-zA-Z0-9]/);
        if (match) {
          const index = match.index;
          const before = text.substring(0, index);
          const letter = text.substring(index, index + 1);
          const after = text.substring(index + 1);
          
          const wrapper = doc.createElement('span');
          wrapper.className = 'gutenberg-first-letter';
          wrapper.textContent = letter;
          
          const fragment = doc.createDocumentFragment();
          if (before) fragment.appendChild(doc.createTextNode(before));
          fragment.appendChild(wrapper);
          if (after) fragment.appendChild(doc.createTextNode(after));
          
          node.parentNode.replaceChild(fragment, node);
          break;
        }
      }
      return doc.body.innerHTML;
    }
  } catch (err) {
    console.error('Failed to inject drop cap', err);
  }
  
  return html;
}
