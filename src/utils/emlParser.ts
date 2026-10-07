import { Transaction, ExchangeSource } from '../types';
import { parseKrakenEmailReceipts, parseKrakenText, isKrakenText } from './krakenParser';
import { parseCryptoComText, isCryptoComText } from './cryptoComParser';

export interface EmlParseResult {
  transactions: Transaction[];
  detectedExchange: ExchangeSource | 'unknown';
  subject?: string;
  from?: string;
  date?: string;
  rawPlainText: string;
}

/**
 * Universal base64 to UTF-8 decoder (works in browser and Node.js environments)
 */
export function decodeBase64Utf8(base64Str: string): string {
  try {
    const clean = base64Str.replace(/\s+/g, '');
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(clean, 'base64').toString('utf8');
    }
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(bytes);
    }
    return binary;
  } catch (err) {
    console.warn('[emlParser] Base64 decode fallback error:', err);
    return base64Str;
  }
}

/**
 * Universal quoted-printable decoder supporting UTF-8 multi-byte sequences
 */
export function decodeQuotedPrintableUtf8(qpStr: string): string {
  try {
    // 1. Remove soft line breaks (equals sign at end of line)
    const normalized = qpStr.replace(/=\r?\n/g, '');

    // 2. Decode hex escapes to byte array
    const bytes: number[] = [];
    for (let i = 0; i < normalized.length; i++) {
      if (normalized[i] === '=' && i + 2 < normalized.length && /^[0-9A-Fa-f]{2}$/.test(normalized.substring(i + 1, i + 3))) {
        bytes.push(parseInt(normalized.substring(i + 1, i + 3), 16));
        i += 2;
      } else {
        bytes.push(normalized.charCodeAt(i));
      }
    }

    const u8 = new Uint8Array(bytes);
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(u8);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(u8).toString('utf8');
    }
    return String.fromCharCode(...bytes);
  } catch (err) {
    console.warn('[emlParser] Quoted-Printable decode fallback error:', err);
    return qpStr;
  }
}

/**
 * Strips HTML tags and styles, transforming email HTML into clean plain text
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    // Remove scripts and style sheets
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Replace block-level boundaries with newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|table|h[1-6]|li|blockquote)>/gi, '\n')
    // Strip remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Replace common HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&euro;/gi, '€')
    .replace(/&#8364;/g, '€')
    .replace(/&#8202;/g, ' ')
    .replace(/&bull;/gi, '•')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    // Normalize spacing
    .replace(/[ \t]+/g, ' ')
    .replace(/\r?\n\s*\r?\n/g, '\n')
    .trim();
}

/**
 * Checks if raw content or file name represents an RFC 2822 / 822 email (.eml)
 */
export function isEmlContent(content: string, fileName?: string): boolean {
  if (fileName && fileName.toLowerCase().endsWith('.eml')) {
    return true;
  }
  if (!content) return false;
  const sample = content.substring(0, 3000);
  const hasFrom = /^(?:from|von):/im.test(sample);
  const hasSubject = /^(?:subject|betreff):/im.test(sample);
  const hasMime = /^mime-version:/im.test(sample) || /^content-type:/im.test(sample);
  const hasDate = /^(?:date|datum):/im.test(sample);

  return (hasFrom && (hasSubject || hasMime || hasDate)) || (hasMime && hasSubject);
}

/**
 * Parses raw EML content, unfolding RFC 2822 headers and extracting plain text body
 */
export function extractEmlData(rawEml: string): {
  headers: Record<string, string>;
  plainText: string;
  subject: string;
  date: string;
  from: string;
  to: string;
} {
  // 1. Separate headers from body at first blank line
  const splitIndex = rawEml.search(/\r?\n\r?\n/);
  let headerBlock = '';
  let rawBody = '';

  if (splitIndex > -1) {
    headerBlock = rawEml.substring(0, splitIndex);
    rawBody = rawEml.substring(splitIndex).replace(/^\r?\n\r?\n/, '');
  } else {
    headerBlock = rawEml;
  }

  // 2. Unfold headers (RFC 2822: continuation lines start with space or tab)
  const unfoldedHeaders = headerBlock.replace(/\r?\n[ \t]+/g, ' ');
  const headerLines = unfoldedHeaders.split(/\r?\n/);
  const headers: Record<string, string> = {};

  for (const line of headerLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim().toLowerCase();
      const val = line.substring(colonIdx + 1).trim();
      headers[key] = val;
    }
  }

  const contentType = headers['content-type'] || '';
  const encoding = (headers['content-transfer-encoding'] || '').toLowerCase();

  let bodyContent = rawBody;

  // 3. Handle multipart MIME if boundary is present
  const boundaryMatch = contentType.match(/boundary=["']?([^"';]+)["']?/i);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = rawBody.split('--' + boundary);
    let candidateHtml = '';
    let candidatePlain = '';

    for (const part of parts) {
      if (part.trim() === '' || part.trim() === '--') continue;
      const partSplit = part.search(/\r?\n\r?\n/);
      if (partSplit > -1) {
        const partHeaders = part.substring(0, partSplit);
        const partBody = part.substring(partSplit).replace(/^\r?\n\r?\n/, '').trim();
        const partCT = (partHeaders.match(/content-type:\s*([^;\r\n]+)/i) || [])[1] || '';
        const partEnc = (partHeaders.match(/content-transfer-encoding:\s*([A-Za-z0-9_-]+)/i) || [])[1] || '';

        let decodedPart = partBody;
        if (partEnc.toLowerCase() === 'base64') {
          decodedPart = decodeBase64Utf8(partBody);
        } else if (partEnc.toLowerCase() === 'quoted-printable') {
          decodedPart = decodeQuotedPrintableUtf8(partBody);
        }

        if (/text\/plain/i.test(partCT)) {
          candidatePlain = decodedPart;
        } else if (/text\/html/i.test(partCT)) {
          candidateHtml = decodedPart;
        }
      }
    }

    if (candidatePlain) {
      bodyContent = candidatePlain;
    } else if (candidateHtml) {
      bodyContent = candidateHtml;
    }
  } else {
    // Single part
    if (encoding === 'base64') {
      bodyContent = decodeBase64Utf8(rawBody);
    } else if (encoding === 'quoted-printable') {
      bodyContent = decodeQuotedPrintableUtf8(rawBody);
    }
  }

  // 4. HTML to Plain Text conversion if needed
  const isHtml = /<[a-z][\s\S]*>/i.test(bodyContent);
  const plainText = isHtml ? htmlToPlainText(bodyContent) : bodyContent;

  return {
    headers,
    plainText,
    subject: headers['subject'] || '',
    date: headers['date'] || '',
    from: headers['from'] || '',
    to: headers['to'] || '',
  };
}

/**
 * Main parser entry point: transforms an .eml email string into structured Transactions
 */
export function parseEmlFile(rawEml: string, fileName?: string): EmlParseResult {
  if (!rawEml || !rawEml.trim()) {
    return {
      transactions: [],
      detectedExchange: 'unknown',
      rawPlainText: '',
    };
  }

  const { headers, plainText, subject, date, from } = extractEmlData(rawEml);

  // Construct an enriched text block that contains headers and plain text body
  // to maximize compatibility with regexes that inspect Date, Betreff/Subject, or From
  const headerEnrichment = [
    from ? `From: ${from}` : '',
    subject ? `Subject: ${subject}` : '',
    date ? `Date: ${date}` : '',
  ].filter(Boolean).join('\n');

  const combinedText = headerEnrichment ? `${headerEnrichment}\n\n${plainText}` : plainText;

  // Determine exchange source
  let detectedExchange: ExchangeSource | 'unknown' = 'unknown';
  const metaLower = `${from} ${subject} ${fileName || ''}`.toLowerCase();

  const isKraken = metaLower.includes('kraken') || isKrakenText(combinedText);
  const isCdc = metaLower.includes('crypto.com') || isCryptoComText(combinedText);

  let transactions: Transaction[] = [];

  if (isKraken && !isCdc) {
    transactions = parseKrakenEmailReceipts(combinedText);
    if (transactions.length === 0) {
      transactions = parseKrakenText(combinedText);
    }
    detectedExchange = 'kraken';
  } else if (isCdc && !isKraken) {
    transactions = parseCryptoComText(combinedText);
    detectedExchange = 'crypto_com';
  } else {
    // Try both
    const krakenAttempt = parseKrakenEmailReceipts(combinedText);
    const cdcAttempt = parseCryptoComText(combinedText);

    if (krakenAttempt.length > 0 && cdcAttempt.length === 0) {
      transactions = krakenAttempt;
      detectedExchange = 'kraken';
    } else if (cdcAttempt.length > 0 && krakenAttempt.length === 0) {
      transactions = cdcAttempt;
      detectedExchange = 'crypto_com';
    } else if (krakenAttempt.length > 0) {
      transactions = krakenAttempt;
      detectedExchange = 'kraken';
    } else if (cdcAttempt.length > 0) {
      transactions = cdcAttempt;
      detectedExchange = 'crypto_com';
    }
  }

  // Set exact RFC date from email header on all parsed transactions
  if (date) {
    try {
      const headerDate = new Date(date);
      if (!isNaN(headerDate.getTime())) {
        const isoHeaderTime = headerDate.toISOString();
        transactions = transactions.map(tx => ({
          ...tx,
          timestamp: isoHeaderTime,
        }));
      }
    } catch {}
  }

  return {
    transactions,
    detectedExchange,
    subject,
    from,
    date,
    rawPlainText: plainText,
  };
}
