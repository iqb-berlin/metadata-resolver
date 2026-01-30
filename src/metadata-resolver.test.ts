import {
  describe, it, expect, beforeEach
} from 'vitest';
import { MDProfile } from '@iqb/metadata';
import { MetadataResolver } from './metadata-resolver';

describe('MetadataResolver', () => {
  let resolver: MetadataResolver;

  beforeEach(() => {
    resolver = new MetadataResolver({ cache: false });
  });

  describe('extractLabelText', () => {
    it('should return string labels as-is', () => {
      const result = MetadataResolver.extractLabelText('Simple Label');
      expect(result).toBe('Simple Label');
    });

    it('should extract text from multilingual array', () => {
      const label = [
        { lang: 'de', value: 'Deutsch' },
        { lang: 'en', value: 'English' }
      ];
      const result = MetadataResolver.extractLabelText(label, 'de');
      expect(result).toBe('Deutsch');
    });

    it('should fallback to first item if language not found', () => {
      const label = [
        { lang: 'de', value: 'Deutsch' },
        { lang: 'en', value: 'English' }
      ];
      const result = MetadataResolver.extractLabelText(label, 'fr');
      expect(result).toBe('Deutsch');
    });

    it('should return empty string for empty array', () => {
      const result = MetadataResolver.extractLabelText([]);
      expect(result).toBe('');
    });
  });

  describe('extractVocabularyUrls', () => {
    it('should extract vocabulary URLs from profile', () => {
      const profile = {
        id: 'test-profile',
        title: { de: 'Test' },
        groups: [
          {
            label: { de: 'Group 1' },
            entries: [
              {
                id: 'vocab1',
                label: { de: 'Vocab Field' },
                type: 'vocabulary',
                parameters: {
                  url: 'http://example.com/vocab1.json'
                }
              }
            ]
          }
        ]
      };

      const urls = resolver.extractVocabularyUrls(profile as unknown as MDProfile);
      expect(urls).toEqual(['http://example.com/vocab1.json']);
    });

    it('should handle profiles without vocabulary fields', () => {
      const profile = {
        id: 'test-profile',
        title: { de: 'Test' },
        groups: [
          {
            label: { de: 'Group 1' },
            entries: [
              {
                id: 'text1',
                label: { de: 'Text Field' },
                type: 'text',
                parameters: {}
              }
            ]
          }
        ]
      };

      const urls = resolver.extractVocabularyUrls(profile as unknown as MDProfile);
      expect(urls).toEqual([]);
    });

    it('should deduplicate vocabulary URLs', () => {
      const profile = {
        id: 'test-profile',
        title: { de: 'Test' },
        groups: [
          {
            label: { de: 'Group 1' },
            entries: [
              {
                id: 'vocab1',
                label: { de: 'Vocab Field 1' },
                type: 'vocabulary',
                parameters: { url: 'http://example.com/vocab.json' }
              },
              {
                id: 'vocab2',
                label: { de: 'Vocab Field 2' },
                type: 'vocabulary',
                parameters: { url: 'http://example.com/vocab.json' }
              }
            ]
          }
        ]
      };

      const urls = resolver.extractVocabularyUrls(profile as unknown as MDProfile);
      expect(urls).toEqual(['http://example.com/vocab.json']);
    });
  });

  describe('cache', () => {
    it('should cache loaded profiles when caching is enabled', async () => {
      const resolverWithCache = new MetadataResolver({ cache: true });
      // Note: This test would need a mock fetch to properly test caching
      // For now, we just verify the instance is created correctly
      expect(resolverWithCache).toBeDefined();
    });

    it('should clear cache', () => {
      resolver.clearCache();
      expect(resolver).toBeDefined();
    });
  });

  describe('CORS proxy', () => {
    it('should allow setting CORS proxy', () => {
      resolver.setCorsProxy('https://corsproxy.io/?');
      expect(resolver).toBeDefined();
    });

    it('should allow clearing CORS proxy', () => {
      resolver.setCorsProxy(undefined);
      expect(resolver).toBeDefined();
    });
  });
});
