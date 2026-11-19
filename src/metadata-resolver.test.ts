import { once } from 'node:events';
import { createServer } from 'node:http';
import {
  describe, it, expect, beforeEach, afterEach, vi
} from 'vitest';
import { MDProfile } from '@iqbspecs/metadata-profile';
import { MetadataResolver } from './metadata-resolver';

const profileUrl = 'https://example.test/profile.json';
const vocabularyUrl = 'https://example.test/vocabulary';
const conceptId = 'https://example.test/concept';
const vocabulary = { hasTopConcept: [{ id: conceptId, prefLabel: { de: 'Eintrag' } }] };

function jsonResponse(data: unknown, url: string): Response {
  const response = Response.json(data);
  Object.defineProperty(response, 'url', { value: url });
  return response;
}

const waitForAbort: typeof fetch = (_url, init) => {
  const signal = init?.signal;
  if (!signal) {
    return Promise.reject(new Error('Expected an abort signal'));
  }
  return new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
};

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
});

describe('MetadataResolver network requests', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const profile = {
    groups: [{ entries: [{ type: 'VOCABULARY', parameters: { url: vocabularyUrl } }] }]
  };
  let resolver: MetadataResolver;

  beforeEach(() => {
    resolver = new MetadataResolver();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([true, false])('loads and tracks vocabularies with cache: %s', async cache => {
    resolver = new MetadataResolver({ cache });
    let label = 'Eintrag';
    fetchMock.mockImplementation(async url => {
      if (url === profileUrl) {
        return jsonResponse(profile, profileUrl);
      }
      expect(url).toBe(vocabularyUrl);
      return jsonResponse({
        hasTopConcept: [{ id: conceptId, prefLabel: { de: label } }]
      }, vocabularyUrl);
    });

    const firstResult = await resolver.loadProfileWithVocabularies(profileUrl);
    expect(firstResult.profile).toEqual(profile);
    expect(firstResult.vocabularies).toHaveLength(1);
    const [loadedVocabulary] = firstResult.vocabularies;
    expect(loadedVocabulary.error).toBeUndefined();
    expect(resolver.getVocabulary(vocabularyUrl)).toBe(loadedVocabulary);
    expect(resolver.getVocabularies()).toEqual(firstResult.vocabularies);
    expect(resolver.getVocabularyDictionary()[conceptId]?.name).toBe('Eintrag');

    const requestsAfterFirstLoad = fetchMock.mock.calls.length;
    expect(requestsAfterFirstLoad).toBeGreaterThan(1);
    label = 'Aktualisiert';
    const secondResult = await resolver.loadProfileWithVocabularies(profileUrl);
    expect(fetchMock).toHaveBeenCalledTimes(
      cache ? requestsAfterFirstLoad : 2 * requestsAfterFirstLoad
    );
    expect(resolver.getVocabularies()).toEqual(secondResult.vocabularies);
    expect(resolver.getVocabulary(vocabularyUrl)).toBe(secondResult.vocabularies[0]);
    expect(resolver.getVocabularyDictionary()[conceptId]?.name).toBe(cache ? 'Eintrag' : label);

    resolver.clearCache();
    expect(resolver.getVocabularies()).toEqual([]);
    expect(resolver.getVocabularyDictionary()).toEqual({});
    fetchMock.mockClear();
    const reloaded = await resolver.loadProfileWithVocabularies(profileUrl);
    expect(fetchMock).toHaveBeenCalledTimes(requestsAfterFirstLoad);
    expect(reloaded.vocabularies[0].dictionary[conceptId]?.name).toBe(label);
  });

  it.each([404, 500])('rejects a profile request with HTTP %s', async status => {
    fetchMock.mockResolvedValue(new Response(null, { status }));
    await expect(resolver.loadProfileWithVocabularies(profileUrl)).rejects.toThrow(
      `Error loading profile from ${profileUrl}: ${status}`
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([404, 500])('returns an error for a vocabulary request with HTTP %s', async status => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(vocabulary, vocabularyUrl))
      .mockResolvedValueOnce(new Response(null, { status }));

    await expect(resolver.loadVocabulary(vocabularyUrl)).resolves.toMatchObject({
      url: vocabularyUrl,
      error: expect.stringContaining(`HTTP ${status}`),
      dictionary: {}
    });
    expect(resolver.getVocabularies()).toEqual([]);
  });

  it('rejects malformed profile JSON', async () => {
    fetchMock.mockResolvedValue(new Response('invalid json'));
    await expect(resolver.loadProfile(profileUrl)).rejects.toThrow('Error parsing profile');
  });

  it('returns an error when a vocabulary has no hasTopConcept array', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}, vocabularyUrl));
    await expect(resolver.loadVocabulary(vocabularyUrl)).resolves.toMatchObject({
      error: 'Invalid structure: missing hasTopConcept',
      dictionary: {}
    });
    expect(resolver.getVocabulary(vocabularyUrl)).toBeUndefined();
  });

  it('aborts a pending profile fetch at the configured timeout', async () => {
    const requestTimeout = 10;
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    resolver = new MetadataResolver({ requestTimeout });
    fetchMock.mockImplementation(waitForAbort);

    await expect(resolver.loadProfile(profileUrl)).rejects.toThrow(/timeout/i);
    expect(timeout.mock.calls).toEqual([[requestTimeout]]);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it('returns a timeout error when the vocabulary fetch is aborted', async () => {
    const requestTimeout = 25;
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    resolver = new MetadataResolver({ requestTimeout });
    fetchMock
      .mockResolvedValueOnce(jsonResponse(vocabulary, vocabularyUrl))
      .mockImplementationOnce(waitForAbort);

    await expect(resolver.loadVocabulary(vocabularyUrl)).resolves.toMatchObject({
      url: vocabularyUrl,
      error: expect.stringMatching(/timeout/i),
      dictionary: {}
    });
    expect(timeout.mock.calls).toEqual([[requestTimeout], [requestTimeout]]);
    expect(fetchMock.mock.calls[1][1]?.signal?.aborted).toBe(true);
  });

  it('falls back to the original URL when endpoint discovery fails', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce(jsonResponse(vocabulary, vocabularyUrl));

    const result = await resolver.loadVocabulary(vocabularyUrl);
    expect(result.error).toBeUndefined();
    expect(result.dictionary[conceptId]?.name).toBe('Eintrag');
    expect(fetchMock).toHaveBeenNthCalledWith(2, vocabularyUrl, expect.any(Object));
  });

  it('uses the configured CORS proxy for profiles and can clear it', async () => {
    const proxy = 'https://proxy.example.test/?url=';
    const proxyUrl = `${proxy}${encodeURIComponent(profileUrl)}`;
    resolver = new MetadataResolver({ cache: false });
    fetchMock.mockImplementation(async url => jsonResponse(profile, String(url)));

    resolver.setCorsProxy(proxy);
    await expect(resolver.loadProfile(profileUrl)).resolves.toEqual(profile);
    expect(fetchMock).toHaveBeenNthCalledWith(1, proxyUrl, expect.any(Object));

    resolver.setCorsProxy(undefined);
    await expect(resolver.loadProfile(profileUrl)).resolves.toEqual(profile);
    expect(fetchMock).toHaveBeenNthCalledWith(2, profileUrl, expect.any(Object));
  });
});

it('loads JSON-LD after following a redirect to an HTML page', async () => {
  const requests: string[] = [];
  const server = createServer((request, response) => {
    requests.push(`${request.method} ${request.url}`);
    switch (request.url) {
      case '/vocabulary':
        response.writeHead(302, { Location: '/redirected.html' }).end();
        break;
      case '/redirected.html':
        response.writeHead(200, { 'Content-Type': 'text/html' }).end('<html></html>');
        break;
      case '/redirected.jsonld':
        response.writeHead(200, { 'Content-Type': 'application/ld+json' })
          .end(JSON.stringify(vocabulary));
        break;
      default:
        response.writeHead(404).end();
    }
  });

  const listening = once(server, 'listening');
  server.listen(0, '127.0.0.1');
  try {
    await listening;
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Expected a TCP address for the vocabulary server');
    }

    const resolver = new MetadataResolver();
    const result = await resolver.loadVocabulary(`http://127.0.0.1:${address.port}/vocabulary`);
    expect(result.error).toBeUndefined();
    expect(result.dictionary[conceptId]?.name).toBe('Eintrag');
    expect(requests).toEqual([
      'GET /vocabulary',
      'GET /redirected.html',
      'HEAD /redirected.jsonld',
      'GET /redirected.jsonld'
    ]);
  } finally {
    await new Promise<void>(resolve => {
      server.close(() => resolve());
    });
  }
});
