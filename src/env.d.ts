interface ImportMetaEnv {
  readonly PUBLIC_API_URL: string;
  readonly PUBLIC_MAPBOX_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
