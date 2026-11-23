import { i18n } from 'next-i18next';

type Vars = Record<string, string | number | undefined | null>;

// fills {{name}} placeholders when no translation instance is loaded yet
const fill = (text: string, vars?: Vars) =>
	vars ? text.replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars[name] ?? '')) : text;

// translation outside React components (toasts, dialogs, enum labels); the key is the English text,
// so a missing translation simply shows the English sentence
export const tr = (key: string, vars?: Vars): string => {
	if (!key) return key;
	if (!i18n?.t) return fill(key, vars);
	return String(i18n.t(key, { ...vars, defaultValue: fill(key, vars) }));
};

// BCP 47 tag of the current language for Intl / toLocaleDateString
export const localeTag = (): string => {
	const lang = i18n?.language;
	return lang === 'kr' ? 'ko-KR' : lang === 'uz' ? 'uz-Latn-UZ' : 'en-US';
};
