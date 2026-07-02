import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function useLanguage() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ar' ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);

        // Update document direction
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = newLang;
    };

    const setLanguage = (lang: 'ar' | 'en') => {
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    };

    useEffect(() => {
        // Set initial direction
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return {
        language: i18n.language as 'ar' | 'en',
        toggleLanguage,
        setLanguage,
        isRTL: i18n.language === 'ar',
    };
}
