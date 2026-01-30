import { MDProfile } from '@iqb/metadata';

/**
 * Configuration options for the MetadataResolver
 */
export interface LoaderOptions {
  /**
   * CORS proxy URL (e.g., 'https://corsproxy.io/?')
   * If provided, all fetch requests will be proxied through this URL
   */
  corsProxy?: string;

  /**
   * Enable caching of loaded resources
   * @default true
   */
  cache?: boolean;

  /**
   * Preferred language for vocabulary labels
   * @default 'de'
   */
  preferredLanguage?: string;

  /**
   * Request timeout in milliseconds
   * @default 10000
   */
  requestTimeout?: number;
}

/**
 * Vocabulary concept node structure
 */
export interface VocabConcept {
  id: string;
  notation?: string[];
  prefLabel?: {
    de?: string;
    en?: string;
    [key: string]: string | undefined;
  };
  description?: string;
  narrower?: VocabConcept[];
}

/**
 * Raw vocabulary data structure from vocabulary JSON files
 */
export interface VocabularyData {
  id?: string;
  type?: string;
  title?: Record<string, string>;
  hasTopConcept?: VocabConcept[];
}

export interface VocabularyEntry {
  id: string;
  name: string;
  notation: string[];
  description?: string;
  text: TextWithLanguage[];
}

/**
 * Resolved vocabulary with data and lookup dictionary
 */
export interface ResolvedVocabulary {
  url: string;
  data: VocabularyData;
  dictionary: Record<string, VocabularyEntry>;
  error?: string;
}

/**
 * Profile loaded with all its vocabularies
 */
export interface ProfileWithVocabularies {
  profile: MDProfile;
  vocabularies: ResolvedVocabulary[];
}

/**
 * Complete metadata package with profile, metadata, and vocabularies
 */
export interface MetadataWithProfile {
  profile: MDProfile;
  metadata: unknown;
  vocabularies: ResolvedVocabulary[];
}

/**
 * Multilingual text structure
 */
export interface TextWithLanguage {
  lang: string;
  value: string;
}

/**
 * Text with language and ID (for vocabulary references)
 */
export interface TextWithLanguageAndId {
  id: string;
  text: TextWithLanguage[];
}
