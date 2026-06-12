/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
import { MDProfile } from '@iqbspecs/metadata-profile';
import {
  VocabularyData,
  VocabularyEntry,
  ResolvedVocabulary,
  LoaderOptions,
  ProfileWithVocabularies,
  MetadataWithProfile,
  VocabConcept
} from './types';

export class MetadataResolver {
  private corsProxy: string | undefined;
  private cache: Map<string, MDProfile | unknown> = new Map(); // For profiles and metadata only
  private vocabulariesStore: Map<string, ResolvedVocabulary> = new Map(); // Source of truth for vocabularies
  private useCache: boolean;
  private preferredLanguage: string;
  private requestTimeout: number;

  constructor(options?: LoaderOptions) {
    this.corsProxy = options?.corsProxy;
    this.useCache = options?.cache ?? true;
    this.preferredLanguage = options?.preferredLanguage || 'de';
    this.requestTimeout = options?.requestTimeout || 10000; // 10s default
  }

  setCorsProxy(proxy: string | undefined): void {
    this.corsProxy = proxy;
  }

  /**
   * Load a profile from a URL
   */
  async loadProfile(url: string): Promise<MDProfile> {
    const cacheKey = `profile:${url}`;

    if (this.useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as MDProfile;
    }

    const fetchUrl = this.corsProxy ? `${this.corsProxy}${encodeURIComponent(url)}` : url;

    let response: Response;
    try {
      response = await fetch(fetchUrl, {
        signal: AbortSignal.timeout(this.requestTimeout)
      });
    } catch (error) {
      throw new Error(
        `Error loading profile from ${url}: ${error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }

    if (!response.ok) {
      throw new Error(
        `Error loading profile from ${url}: ${response.status} ${response.statusText}`
      );
    }

    try {
      const profile: MDProfile = await response.json();

      if (this.useCache) {
        this.cache.set(cacheKey, profile);
      }

      return profile;
    } catch (error) {
      throw new Error(
        `Error parsing profile from ${url}: ${error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Load metadata from a URL
   */
  async loadMetadata(url: string): Promise<unknown> {
    const cacheKey = `metadata:${url}`;

    if (this.useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const fetchUrl = this.corsProxy ? `${this.corsProxy}${encodeURIComponent(url)}` : url;

    let response: Response;
    try {
      response = await fetch(fetchUrl, {
        signal: AbortSignal.timeout(this.requestTimeout)
      });
    } catch (error) {
      throw new Error(
        `Error loading metadata from ${url}: ${error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }

    if (!response.ok) {
      throw new Error(
        `Error loading metadata from ${url}: ${response.status} ${response.statusText}`
      );
    }

    try {
      const metadata = await response.json();

      if (this.useCache) {
        this.cache.set(cacheKey, metadata);
      }

      return metadata;
    } catch (error) {
      throw new Error(
        `Error parsing metadata from ${url}: ${error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Extract vocabulary URLs from a profile
   */
  // eslint-disable-next-line class-methods-use-this
  extractVocabularyUrls(profile: MDProfile): string[] {
    const urls = new Set<string>();

    profile.groups?.forEach(group => {
      group.entries?.forEach(entry => {
        if (entry.type.toUpperCase() === 'VOCABULARY' && entry.parameters) {
          const params = entry.parameters as { url?: string };
          if (params.url) {
            urls.add(params.url);
          }
        }
      });
    });

    return Array.from(urls);
  }

  /**
   * Load a single vocabulary from URL
   * Uses vocabulariesStore as the cache
   */
  async loadVocabulary(url: string): Promise<ResolvedVocabulary> {
    // Check vocabulariesStore (not general cache)
    if (this.useCache && this.vocabulariesStore.has(url)) {
      return this.vocabulariesStore.get(url)!;
    }

    try {
      console.log(`Loading vocabulary: ${url}`);

      // Resolve correct JSON-LD endpoint
      const jsonLdUrl = await this.resolveJsonLdUrl(url);

      if (jsonLdUrl !== url) {
        console.log(`  Resolved to: ${jsonLdUrl}`);
      }

      const fetchUrl = this.corsProxy ?
        `${this.corsProxy}${encodeURIComponent(jsonLdUrl)}` :
        jsonLdUrl;

      if (this.corsProxy) {
        console.log('  Using CORS proxy');
      }

      let response: Response;
      try {
        response = await fetch(fetchUrl, {
          signal: AbortSignal.timeout(this.requestTimeout)
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`  Failed to load vocabulary: ${errorMsg}`);
        return {
          url,
          data: { hasTopConcept: [] },
          dictionary: {},
          error: errorMsg
        };
      }

      if (!response.ok) {
        const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        console.error(`  Failed to load vocabulary: ${errorMsg}`);
        return {
          url,
          data: { hasTopConcept: [] },
          dictionary: {},
          error: errorMsg
        };
      }

      let data: VocabularyData;
      try {
        data = await response.json();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`  Failed to parse vocabulary JSON: ${errorMsg}`);
        return {
          url,
          data: { hasTopConcept: [] },
          dictionary: {},
          error: errorMsg
        };
      }

      if (!data.hasTopConcept || !Array.isArray(data.hasTopConcept)) {
        const errorMsg = 'Invalid structure: missing hasTopConcept';
        console.error(`  Failed to load vocabulary: ${errorMsg}`);
        return {
          url,
          data: { hasTopConcept: [] },
          dictionary: {},
          error: errorMsg
        };
      }

      const dictionary = this.buildVocabularyDictionary(data);
      const resolved: ResolvedVocabulary = {
        url,
        data,
        dictionary
      };

      // Store in vocabulariesStore (single source of truth)
      if (this.useCache) {
        this.vocabulariesStore.set(url, resolved);
      }

      console.log(
        `  Loaded: ${data.hasTopConcept.length} concepts, ${Object.keys(dictionary).length
        } entries`
      );
      return resolved;
    } catch (error) {
      // Catch any other unexpected errors
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`  Failed to load vocabulary: ${errorMsg}`);
      return {
        url,
        data: { hasTopConcept: [] },
        dictionary: {},
        error: errorMsg
      };
    }
  }

  /**
   * Load all vocabularies referenced in a profile
   */
  async loadVocabularies(profile: MDProfile): Promise<ResolvedVocabulary[]> {
    const urls = this.extractVocabularyUrls(profile);

    const results = await Promise.allSettled(urls.map(url => this.loadVocabulary(url)));

    const vocabularies = results
      .filter(
        (result): result is PromiseFulfilledResult<ResolvedVocabulary> => result.status === 'fulfilled'
      )
      .map(result => result.value);

    console.log(
      `Loaded ${vocabularies.length} vocabularies (${this.vocabulariesStore.size} total in store)`
    );

    return vocabularies;
  }

  /**
   * Build a dictionary from vocabulary data
   */
  private buildVocabularyDictionary(vocabData: VocabularyData): Record<string, VocabularyEntry> {
    const dictionary: Record<string, VocabularyEntry> = {};

    const processNode = (node: VocabConcept, parentNotation: string[] = []) => {
      const notation = node.notation || parentNotation;
      const label =
          node.prefLabel?.[this.preferredLanguage] || node.prefLabel?.de || node.prefLabel?.en || '';

      dictionary[node.id] = {
        id: node.id,
        notation,
        name: label,
        description: node.description || '',
        text: [{ lang: this.preferredLanguage, value: label }]
      };

      if (node.narrower && Array.isArray(node.narrower)) {
        node.narrower.forEach((child: VocabConcept) => processNode(child, notation));
      }
    };

    vocabData.hasTopConcept?.forEach(topConcept => processNode(topConcept));

    return dictionary;
  }

  /**
   * Load a profile and all its vocabularies
   */
  async loadProfileWithVocabularies(profileUrl: string): Promise<ProfileWithVocabularies> {
    const profile = await this.loadProfile(profileUrl);
    const vocabularies = await this.loadVocabularies(profile);

    return {
      profile,
      vocabularies
    };
  }

  /**
   * Resolve a URL to its JSON-LD representation
   */
  private async resolveJsonLdUrl(originalUrl: string): Promise<string> {
    try {
      console.log(`Resolving URL: ${originalUrl}`);
      console.log(`  CORS proxy: ${this.corsProxy || 'disabled'}`);

      const fetchUrl = this.corsProxy ?
        `${this.corsProxy}${encodeURIComponent(originalUrl)}` :
        originalUrl;

      console.log(`  Fetching: ${fetchUrl}`);
      const res = await fetch(fetchUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(this.requestTimeout)
      });
      const finalUrl = res.url;
      const contentType = res.headers.get('content-type');

      if (
        contentType?.includes('application/json') ||
          contentType?.includes('application/ld+json')
      ) {
        return finalUrl;
      }

      if (contentType?.includes('text/html')) {
        if (finalUrl.endsWith('.html')) {
          // Try .jsonld
          const jsonldUrl = finalUrl.replace(/\.html$/, '.jsonld');
          try {
            const resp = await fetch(
              this.corsProxy ? `${this.corsProxy}${encodeURIComponent(jsonldUrl)}` : jsonldUrl,
              {
                method: 'HEAD',
                signal: AbortSignal.timeout(this.requestTimeout)
              }
            );
            if (resp.ok) {
              console.log(` Found JSON-LD: ${jsonldUrl}`);
              return jsonldUrl;
            }
          } catch (err) {
            console.log(
              ` JSON-LD not available: ${err instanceof Error ? err.message : String(err)}`
            );
          }

          // Try .json
          const jsonUrl = finalUrl.replace(/\.html$/, '.json');
          try {
            const resp = await fetch(
              this.corsProxy ? `${this.corsProxy}${encodeURIComponent(jsonUrl)}` : jsonUrl,
              {
                method: 'HEAD',
                signal: AbortSignal.timeout(this.requestTimeout)
              }
            );
            if (resp.ok) {
              console.log(` Found JSON: ${jsonUrl}`);
              return jsonUrl;
            }
          } catch (err) {
            console.log(` JSON not available: ${err instanceof Error ? err.message : String(err)}`);
          }
        }

        // Try index.json / index.jsonld
        const jsonCandidates = [
          finalUrl.endsWith('/') ? `${finalUrl}index.json` : `${finalUrl}/index.json`,
          finalUrl.endsWith('/') ? `${finalUrl}index.jsonld` : `${finalUrl}/index.jsonld`
        ];

        for (const candidate of jsonCandidates) {
          try {
            const resp = await fetch(
              this.corsProxy ? `${this.corsProxy}${encodeURIComponent(candidate)}` : candidate,
              {
                method: 'HEAD',
                signal: AbortSignal.timeout(this.requestTimeout)
              }
            );
            if (resp.ok) {
              console.log(`  Found: ${candidate}`);
              return candidate;
            }
          } catch (err) {
            console.log(
              `  Not available: ${candidate} - ${err instanceof Error ? err.message : String(err)}`
            );
          }
        }

        console.warn('No JSON file found at HTML URL:', finalUrl);
        return finalUrl;
      }

      return finalUrl;
    } catch (err) {
      console.warn('Failed to resolve JSON-LD URL, falling back to original:', originalUrl, err);
      return originalUrl;
    }
  }

  /**
   * Load both profile with vocabularies and metadata
   */
  async loadAll(profileUrl: string, metadataUrl: string): Promise<MetadataWithProfile> {
    const [profileWithVocabs, metadata] = await Promise.all([
      this.loadProfileWithVocabularies(profileUrl),
      this.loadMetadata(metadataUrl)
    ]);

    return {
      profile: profileWithVocabs.profile,
      metadata,
      vocabularies: profileWithVocabs.vocabularies
    };
  }

  /**
   * Extract text from a label (string or multilingual array)
   */
  static extractLabelText(
    label: string | Array<{ lang: string; value: string }>,
    preferredLanguage: string = 'de'
  ): string {
    if (typeof label === 'string') {
      return label;
    }

    if (Array.isArray(label)) {
      // Try preferred language
      const preferred = label.find(l => l.lang === preferredLanguage);
      if (preferred) {
        return preferred.value;
      }

      // Fallback to first item
      if (label.length > 0) {
        return label[0].value;
      }
    }

    return '';
  }

  /**
   * Clear all caches (profiles, metadata, and vocabularies)
   */
  clearCache(): void {
    this.cache.clear();
    this.vocabulariesStore.clear();
  }

  /**
   * Get all loaded vocabularies
   */
  getVocabularies(): ResolvedVocabulary[] {
    return Array.from(this.vocabulariesStore.values());
  }

  /**
   * Get a specific vocabulary by URL
   */
  getVocabulary(url: string): ResolvedVocabulary | undefined {
    return this.vocabulariesStore.get(url);
  }

  /**
   * Get combined dictionary of all vocabulary entries
   */
  getVocabularyDictionary(): Record<string, VocabularyEntry> {
    const combinedDict: Record<string, VocabularyEntry> = {};

    this.vocabulariesStore.forEach(vocab => {
      Object.assign(combinedDict, vocab.dictionary);
    });

    return combinedDict;
  }
}
