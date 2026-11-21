/**
 * Resolves localized text. Prefers enText when available, otherwise falls back to mainText.
 */
export function getLocalizedText(
    mainText?: string | null,
    enText?: string | null,
    language: 'en' | 'bn' = 'en'
): string {
    if (enText && enText.trim()) {
        return enText.trim();
    }
    if (mainText && mainText.trim()) {
        return mainText.trim();
    }
    return '';
}
