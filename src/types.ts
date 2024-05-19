
/* MAIN */

type IEnv = {
  githubToken?: string,
  root?: string,
};

type IFilter = {
  archived?: boolean,
  clean?: boolean,
  dirty?: boolean,
  errors?: boolean,
  forks?: boolean,
  private?: boolean,
  public?: boolean,
  successes?: boolean,
  exclude?: string,
  include?: string
};

type IGitHubRepoRaw = any;

type IGitHubRepo = {
  id: string,
  user: string,
  name: string,
  description: string,
  keywords: string[],
  branch: string,
  isArchived: boolean,
  isDisabled: boolean,
  isFork: boolean,
  isPrivate: boolean,
  isPublic: boolean,
  stats: {
    forks: number,
    issues: number,
    stargazers: number,
    watchers: number,
    created: Date,
    pushed: Date,
    updated: Date
  }
};

type ILocalRepo = {
  id: string,
  path: string,
  user: string,
  name: string,
  description: string,
  keywords: string[],
  branch: string,
  isDirty: boolean,
  isSynced: boolean,
  isPrivate: boolean,
  isPublic: boolean,
  stats: {
    ahead: number,
    behind: number
  }
};

type IManifest = {
  private?: boolean,
  description?: string,
  keywords?: string[]
};

/* EXPORT */

export type {IEnv, IFilter, IGitHubRepoRaw, IGitHubRepo, ILocalRepo, IManifest};
