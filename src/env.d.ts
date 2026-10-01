interface ImportMetaEnv {
  /** NewsData.io key for the news section; the section hides without it. */
  readonly VITE_NEWSDATA_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
