import "../css/app.css";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { LocaleProvider, useLocale } from "@/lib/i18n";

const appName = import.meta.env.VITE_APP_NAME || "TAMS";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob("./Pages/**/*.tsx"),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        function LocalizedApp() {
            const { locale } = useLocale();
            return <App key={locale} {...props} />;
        }

        root.render(
            <LocaleProvider>
                <LocalizedApp />
            </LocaleProvider>,
        );
    },
    progress: {
        color: "#F2A900",
    },
});
