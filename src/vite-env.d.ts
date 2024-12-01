/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_EMAILJS_SERVICE_ID: string
  readonly VITE_EMAILJS_TEMPLATE_ID: string
  readonly VITE_EMAILJS_PUBLIC_KEY: string
  readonly VITE_ADMIN_EMAIL: string
  readonly VITE_APP_TITLE: string
  // add more env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}