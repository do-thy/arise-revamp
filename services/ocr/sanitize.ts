/**
 * OCR string sanitization (Phase C pipeline step 1, blueprint §8.2).
 *
 * PaddleOCR returns raw placard text that may include casing, spaces, punctuation and
 * stray glyphs. Before querying Firestore `room_metadata.ocrSearchTerms` (which indexes
 * pre-sanitized lookups), we reduce the string to the exact character set the database
 * uses: lowercase letters, numbers, hyphens/dashes and ampersands. Everything else —
 * spaces, periods, wild characters — is stripped.
 */
export function sanitizeOcrText(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9\-&]/g, '');
}
