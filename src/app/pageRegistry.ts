export type AppPage = {
  name: string
  link: string
  iconClass: string
  description: string
}

export function linkToPath(link: string) {
  const withoutSuffix = link.replace(/Page$/, '')
  return withoutSuffix
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

export function getPagePath(page: AppPage) {
  return linkToPath(page.link)
}

export const APP_PAGES: AppPage[] = [
  {
    name: 'Home',
    link: 'HomePage',
    iconClass: 'fa-solid fa-house',
    description: 'Trang Home (tạm)',
  },
  {
    name: 'Todo App',
    link: 'TodoAppPage',
    iconClass: 'fa-solid fa-clipboard-list',
    description: 'Todo App (tạm)',
  },
  {
    name: 'GitHub Search',
    link: 'GitHubUserSearchPage',
    iconClass: 'fa-brands fa-github',
    description: 'Tìm user và repo trên GitHub',
  },
]
