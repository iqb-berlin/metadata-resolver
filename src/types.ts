import {
  MDProfile,
  MDProfileGroup,
  MDProfileEntry,
  LanguageCodedText
} from '@iqbspecs/metadata-profile';

export type {
  MDProfile, MDProfileGroup, MDProfileEntry, LanguageCodedText
};

export interface LoaderOptions {
  corsProxy?: string;
  cache?: boolean;
  preferredLanguage?: string;
  requestTimeout?: number;
}

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
  text: LanguageCodedText[];
}

export interface ResolvedVocabulary {
  url: string;
  data: VocabularyData;
  dictionary: Record<string, VocabularyEntry>;
  error?: string;
}

export interface ProfileWithVocabularies {
  profile: MDProfile;
  vocabularies: ResolvedVocabulary[];
}

export interface MetadataWithProfile {
  profile: MDProfile;
  metadata: unknown;
  vocabularies: ResolvedVocabulary[];
}

/**
 * @deprecated Use LanguageCodedText instead.
 */
export type TextWithLanguage = LanguageCodedText;

/**
 * @deprecated Will be removed when values spec is adopted.
 */
export interface TextWithLanguageAndId {
  id: string;
  text: LanguageCodedText[];
}
