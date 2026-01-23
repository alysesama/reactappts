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
    description: 'Home',
  },
  {
    name: 'Movies',
    link: 'MoviesPage',
    iconClass: 'fa-solid fa-film',
    description: 'Tương tác với TMDB',
  },
  {
    name: 'Todo App',
    link: 'TodoAppPage',
    iconClass: 'fa-solid fa-clipboard-list',
    description: 'Quản lý công việc',
  },
  {
    name: 'GitHub Search',
    link: 'GitHubUserSearchPage',
    iconClass: 'fa-brands fa-github',
    description: 'Tìm user và repo trên GitHub',
  },
  {
    name: 'Dummy',
    link: 'DummyPage',
    iconClass: 'fa-solid fa-flask',
    description: 'Sandbox training page',
  },
]
