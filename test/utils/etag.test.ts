import { describe, it, expect } from 'vitest';
import { generateEtag } from '../../src/utils/etag';

describe('ETag Utility', () => {
  it('should generate consistent ETag for same content', async () => {
    const content = 'test content';
    const etag1 = await generateEtag(content);
    const etag2 = await generateEtag(content);
    
    expect(etag1).toBe(etag2);
    expect(etag1).toMatch(/^"[a-f0-9]{16}"$/); // Should be quoted 16-char hex
  });

  it('should generate different ETags for different content', async () => {
    const content1 = 'test content 1';
    const content2 = 'test content 2';
    
    const etag1 = await generateEtag(content1);
    const etag2 = await generateEtag(content2);
    
    expect(etag1).not.toBe(etag2);
  });

  it('should generate ETag in correct format', async () => {
    const content = 'sample ICS content';
    const etag = await generateEtag(content);
    
    expect(etag).toMatch(/^"[a-f0-9]{16}"$/);
    expect(etag.length).toBe(18); // 16 chars + 2 quotes
  });

  it('should handle empty string', async () => {
    const etag = await generateEtag('');
    
    expect(etag).toMatch(/^"[a-f0-9]{16}"$/);
  });

  it('should handle unicode content', async () => {
    const content = '한국교원대학교 학사 일정 📅';
    const etag = await generateEtag(content);
    
    expect(etag).toMatch(/^"[a-f0-9]{16}"$/);
  });
});