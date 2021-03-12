declare global {
  namespace NodeJS {
    interface ProcessEnv {
      WEBHOOK_SECRET: string
      PERSONAL_ACCESS_TOKEN: string
      LOG_LEVEL?: string
    }
  }
}
