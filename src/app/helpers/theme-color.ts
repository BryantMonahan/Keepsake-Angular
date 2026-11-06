// Read a colour token from the stylesheet so canvas drawing (wavesurfer) matches the theme
export function themeColor(token: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim()
}
