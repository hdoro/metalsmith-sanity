export interface IClientConfig {
  projectId: string
  dataset?: string
  token?: string
  useCdn?: boolean
}

export interface IMetalsmithSanity {
  clientConfig: IClientConfig
  useCache?: boolean
  cacheFilePath?: string
  filesKey?: string
}

declare const metalsmithSanity: (props: IMetalsmithSanity) => void

export default metalsmithSanity
