import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            // Auth
            login: 'Login',
            email: 'Email',
            password: 'Password',
            logout: 'Logout',

            // Home
            appTitle: 'ActiveAging Lab',
            appSubtitle: 'Smart Healthcare Platform for Elderly',
            appDescription: 'Improving physical and cognitive abilities using AI',

            // Menu Items
            physicalScreening: 'Physical Screening',
            physicalScreeningDesc: 'Initial diagnostic assessment',
            doctorPortal: 'Doctor Portal',
            doctorPortalDesc: 'Create personalized treatment plan',
            trainingMode: 'Training Mode',
            trainingModeDesc: 'Training with skeleton and strict matching',
            dashboard: 'Dashboard',
            dashboardDesc: 'Track progress and statistics',

            // Common
            back: 'Back',
            next: 'Next',
            submit: 'Submit',
            cancel: 'Cancel',
            save: 'Save',
        },
    },
    ar: {
        translation: {
            // Auth
            login: 'تسجيل الدخول',
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            logout: 'تسجيل الخروج',

            // Home
            appTitle: 'ActiveAging Lab',
            appSubtitle: 'Smart Healthcare Platform for Elderly',
            appDescription: 'تحسين القدرات البدنية والمعرفية باستخدام الذكاء الاصطناعي',

            // Menu Items
            physicalScreening: 'الفحص البدني الأولي',
            physicalScreeningDesc: 'تقييم تشخيصي أولي',
            doctorPortal: 'بوابة الطبيب',
            doctorPortalDesc: 'إنشاء خطة علاجية مخصصة',
            trainingMode: 'وضع التدريب',
            trainingModeDesc: 'تدريب مع skeleton و strict matching',
            dashboard: 'لوحة التحكم',
            dashboardDesc: 'متابعة التقدم والإحصائيات',

            // Common
            back: 'رجوع',
            next: 'التالي',
            submit: 'إرسال',
            cancel: 'إلغاء',
            save: 'حفظ',
        },
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem('language') || 'ar',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
