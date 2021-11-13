
/* MAIN */

type IFilter = {
  archived?: boolean,
  forks?: boolean,
  private?: boolean,
  public?: boolean,
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
  isPrivate: boolean,
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

export {IFilter, IGitHubRepoRaw, IGitHubRepo, ILocalRepo, IManifest};
