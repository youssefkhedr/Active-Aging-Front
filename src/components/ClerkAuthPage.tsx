import { SignIn } from '@clerk/clerk-react';

export function ClerkAuthPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
            {/* Hide Clerk branding only */}
            <style>{`
                .cl-internal-b3fm6y,
                .cl-badge,
                [data-localization-key="signIn.start.subtitle"],
                .cl-internal-1w8e5q6,
                .cl-footerPages,
                .cl-internal-1qqno4m,
                .cl-internal-wkkub3,
                [class*="cl-footerPages"],
                [class*="cl-internal"][class*="footer"] {
                    display: none !important;
                }
            `}</style>

            <div className="w-full max-w-md">
                {/* Clerk Sign In Component */}
                <div className="flex flex-col items-center">
                    <SignIn
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "bg-white rounded-2xl shadow-xl",
                                headerTitle: "text-2xl font-bold",
                                headerSubtitle: "text-gray-600",
                                socialButtonsBlockButton: "bg-white border border-gray-300 hover:bg-gray-50 transition-colors",
                                socialButtonsBlockButtonText: "font-medium",
                                formButtonPrimary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all",
                                footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                                formFieldInput: "border-gray-300 focus:border-blue-500",
                            },
                            layout: {
                                showOptionalFields: false,
                                privacyPageUrl: undefined,
                                termsPageUrl: undefined,
                            },
                        }}
                        routing="hash"
                        afterSignInUrl="/"
                        signUpUrl="#/sign-up"
                        afterSignUpUrl="/"
                    />

                </div>
            </div>
        </div>
    );
}
