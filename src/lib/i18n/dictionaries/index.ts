import type { Locale } from '../config';
import type { Dictionary } from './types';
import ru from './ru';
import en from './en';
import he from './he';
import ar from './ar';

export type { Dictionary } from './types';

export const dictionaries: Record<Locale, Dictionary> = { ru, en, he, ar };
