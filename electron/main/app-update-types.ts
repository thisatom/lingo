export type GitHubAsset = {
  name: string
  browser_download_url: string
  size: number
}

export type GitHubRelease = {
  tag_name: string
  name: string
  body: string | null
  html_url: string
  published_at: string
  draft: boolean
  prerelease: boolean
  assets: GitHubAsset[]
}
