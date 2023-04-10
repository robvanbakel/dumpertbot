declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APPKEY: string;
      APPSECRET: string;
      ACCESSTOKEN: string;
      ACCESSSECRET: string;
    }
  }
}

export {};
