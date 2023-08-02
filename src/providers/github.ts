
/* IMPORT */

import {color} from 'specialist';
import truncate from 'tiny-truncate';
import zeptomatch from 'zeptomatch';
import {GITHUB_DOMAIN, GITHUB_REPOS_PER_PAGE, GITHUB_REPOS_SORT_DIMENSION, GITHUB_REPOS_SORT_DIRECTION, GITHUB_REPOS_TYPE} from '../constants';
import Env from '../env';
import Symbols from '../symbols';
import Utils from '../utils';
import type {IFilter, IGitHubRepoRaw, IGitHubRepo} from '../types';
import Local from './local'

/* MAIN */

const GitHub = {

  /* REPO API */

  repo: {

    clone: async ( username: string, name: string ): Promise<void> => {

      const endpoint = GitHub.repo.getEndpoint ( username, name );

      await Local.repo.clone ( username, name, endpoint );

    },

    get: async ( username: string, name: string ): Promise<IGitHubRepo | undefined> => {

      try {

        const url = `https://api.${GITHUB_DOMAIN}/repos/${username}/${name}`;
        const response = await GitHub.rest.fetch ( 'GET', url );
        const json = await response.json ();
        const repo = GitHub.repo.parse ( json );

        return repo;

      } catch {

        return;

      }

    },

    getEndpoint: ( username: string, name: string ): string => {

      return `https://${GITHUB_DOMAIN}/${username}/${name}.git`;

    },

    matches: ( username: string, name: string, glob: string ): boolean => {

      return zeptomatch ( glob, `${username}/${name}` );

    },

    parse: ( repo: IGitHubRepoRaw ): IGitHubRepo => {

      return {
        id: `${repo.id}`,
        user: repo.owner.login,
        name: repo.name,
        description: repo.description || '',
        keywords: repo.topics || [],
        branch: repo.default_branch,
        isArchived: repo.archived,
        isDisabled: repo.disabled,
        isFork: repo.fork,
        isPrivate: repo.private,
        isPublic: !repo.private,
        stats: {
          forks: repo.forks_count,
          issues: repo.open_issues_count,
          stargazers: repo.stargazers_count,
          created: new Date ( repo.created_at ),
          pushed: new Date ( repo.pushed_at ),
          updated: new Date ( repo.updated_at )
        }
      };

    },

    publish: async ( username: string, name: string ): Promise<void> => {

      const local = await Local.repo.get ( username, name, true );
      const remote = await GitHub.repo.get ( username, name );

      if ( remote ) {

        console.log ( `${color.green ( Symbols.SUCCESS )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} Published already!` );

      } else {

        try {

          try {

            await Local.repo.execGit ( local.path, ['log'] );

          } catch {

            await Local.repo.execGit ( local.path, ['add', '--all'] );
            await Local.repo.execGit ( local.path, ['commit', '-m', 'Initial commit'] );

          }

          const url = `https://api.${GITHUB_DOMAIN}/user/repos`;
          const body = JSON.stringify ({ name: local.name, private: local.isPrivate });
          await GitHub.rest.fetch ( 'POST', url, body );

          const endpoint = GitHub.repo.getEndpoint ( username, name );
          await Local.repo.execGit ( local.path, ['remote', 'add', 'origin', endpoint] );
          await Local.repo.execGit ( local.path, ['push', 'origin', '--all'] );
          await Local.repo.execGit ( local.path, ['push', 'origin', '--tags'] );

          console.log ( `${color.green ( Symbols.SUCCESS )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} ${endpoint}` );

          await GitHub.repo.sync ( username, name );

        } catch ( error: unknown ) {

          console.log ( `${color.red ( Symbols.ERROR )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} Failed to publish!` );

          if ( error ) {

            console.log ( color.dim ( `${error}` ) );

          }

        }

      }

    },

    sync: async ( username: string, name: string ): Promise<void> => {

      const local = await Local.repo.get ( username, name, true );
      const remote = await GitHub.repo.get ( username, name );

      if ( !remote ) {

        console.log ( `${color.red ( Symbols.ERROR )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} Remote repository not found!` );

      } else {

        try {

          try {

            await Local.repo.execGit ( local.path, ['fetch', '--all'] );

          } catch ( error: unknown ) {

            console.log ( `${color.red ( Symbols.ERROR )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} Failed to fetch!` );

            if ( error ) {

              console.log ( color.dim ( `${error}` ) );

            }

            throw new Error ();

          }

          const areKeywordsEqual = Utils.lang.isEqual ( local.keywords.sort (), remote.keywords.sort () );

          if ( !areKeywordsEqual && local.keywords.length ) {

            try {

              const url = `https://api.${GITHUB_DOMAIN}/repos/${username}/${name}/topics`;
              const body = JSON.stringify ({ names: local.keywords });
              await GitHub.rest.fetch ( 'PUT', url, body );

            } catch ( error: unknown ) {

              console.log ( `${color.red ( Symbols.ERROR )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} Failed to update the keywords!` );

              if ( error ) {

                console.log ( color.dim ( `${error}` ) );

              }

              throw new Error ();

            }

          }

          const areDescriptionsEqual = local.description === remote.description;

          if ( !areDescriptionsEqual && local.description.length ) {

            try {

              const url = `https://api.${GITHUB_DOMAIN}/repos/${username}/${name}`;
              const body = JSON.stringify ({ description: local.description });
              await GitHub.rest.fetch ( 'PATCH', url, body );

            } catch ( error: unknown ) {

              console.log ( `${color.red ( Symbols.ERROR )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} Failed to update the description!` );

              if ( error ) {

                console.log ( color.dim ( `${error}` ) );

              }

              throw new Error ();

            }

          }

          const labelFetch = 'Fetched';
          const labelDescription = !areDescriptionsEqual ? ', updated description' : '';
          const labelKeywords = !areKeywordsEqual ? ', updated keywords' : '';
          const label = `${labelFetch}${labelDescription}${labelKeywords}!`;

          console.log ( `${color.green ( Symbols.SUCCESS )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} ${label}` );

        } catch {}

      }

    }

  },

  /* REPOS API */

  repos: {

    clone: async ( username: string | string[], filter?: IFilter ): Promise<void> => {

      const usernames = Utils.lang.castArray ( username );

      for ( const username of usernames ) {

        const names = await GitHub.repos.getNames ( username, filter );

        await Promise.all ( names.map ( async name => {

          await GitHub.repo.clone ( username, name );

        }));

      }

    },

    filter: ( repos: IGitHubRepo[], filter?: IFilter ): IGitHubRepo[] => {

      if ( !filter ) return repos;

      return repos.filter ( repo => {

        if ( Utils.lang.isBoolean ( filter.archived ) && repo.isArchived !== filter.archived ) return false;
        if ( Utils.lang.isBoolean ( filter.clean ) ) Utils.fail ( 'Unsupported remote filter: "clean"' );
        if ( Utils.lang.isBoolean ( filter.dirty ) ) Utils.fail ( 'Unsupported remote filter: "dirty"' );
        if ( Utils.lang.isBoolean ( filter.forks ) && repo.isFork !== filter.forks ) return false;
        if ( Utils.lang.isBoolean ( filter.private ) && repo.isPrivate !== filter.private ) return false;
        if ( Utils.lang.isBoolean ( filter.public ) && repo.isPublic !== filter.public ) return false;
        if ( Utils.lang.isString ( filter.include ) && !GitHub.repo.matches ( repo.user, repo.name, filter.include ) ) return false;

        return true;

      });

    },

    getAll: async ( username: string, filter?: IFilter ): Promise<IGitHubRepo[]> => {

      const pages: IGitHubRepo[][] = [];

      for ( let i = 1; i < Infinity; i++ ) {

        const page = await GitHub.repos.getPage ( username, i );

        pages.push ( page );

        if ( page.length < GITHUB_REPOS_PER_PAGE ) break;

      }

      return GitHub.repos.filter ( pages.flat (), filter );

    },

    getNames: async ( username: string, filter?: IFilter ): Promise<string[]> => {

      const repos = await GitHub.repos.getAll ( username, filter );
      const names = repos.map ( repo => repo.name );

      return names;

    },

    getPage: async ( username: string, page: number ): Promise<IGitHubRepo[]> => {

      const whoami = await GitHub.user.getUsername ();
      const endpoint = ( whoami === username ) ? '/user/repos' : `/users/${username}/repos`;
      const url = `https://api.${GITHUB_DOMAIN}${endpoint}?page=${page}&per_page=${GITHUB_REPOS_PER_PAGE}&sort=${GITHUB_REPOS_SORT_DIMENSION}&direction=${GITHUB_REPOS_SORT_DIRECTION}&type=${GITHUB_REPOS_TYPE}`;
      const response = await GitHub.rest.fetch ( 'GET', url );
      const json = await response.json ();

      return json.map ( GitHub.repo.parse );

    },

    ls: async ( username: string, minimal?: boolean, json?: boolean, filter?: IFilter ): Promise<void> => {

      const repos = await GitHub.repos.getAll ( username, filter );

      if ( json ) {

        console.log ( JSON.stringify ( repos ) );

      } else {

        for ( const repo of repos ) {

          const name = color.cyan ( `${username}/${repo.name}` );
          const desc = color.dim ( repo.description );
          const isArchived = repo.isArchived ? color.yellow ( Symbols.ARCHIVED ) : '';
          const isFork = repo.isFork ? color.magenta ( Symbols.FORK ) : '';
          const isPrivate = repo.isPrivate ? color.red ( Symbols.PRIVATE ) : '';
          const line = truncate ( [name, isFork, isArchived, isPrivate, desc].filter ( Utils.lang.identity ).join ( ' ' ) );

          console.log ( line );

        }

      }

    },

    publish: async ( username: string, filter?: IFilter ): Promise<void> => {

      const names = await GitHub.repos.getNames ( username, filter );

      for ( const name of names ) {

        await GitHub.repo.publish ( username, name );

      }

    },

    sync: async ( username: string, filter?: IFilter ): Promise<void> => {

      const names = await GitHub.repos.getNames ( username, filter );

      await Promise.all ( names.map ( async name => {

        await GitHub.repo.sync ( username, name );

      }));

    }

  },

  /* REST API */

  rest: {

    fetch: async ( method: string, url: string, body: string | null = null ): Promise<Response> => {

      return fetch ( url, {
        method,
        body,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${Env.GITHUB_TOKEN}`,
          'User-Agent': `Secret/v2`
        }
      });

    }

  },

  /* USER API */

  user: {

    getUsername: Utils.lang.memoize ( async (): Promise<string | undefined> => {

      if ( !Env.GITHUB_TOKEN ) return;

      try {

        const url = `https://api.${GITHUB_DOMAIN}/user`;
        const response = await GitHub.rest.fetch ( 'GET', url );
        const json = await response.json ();

        return json.login;

      } catch {

        return;

      }

    }),

    whoami: async (): Promise<void> => {

      if ( !Env.GITHUB_TOKEN ) throw Utils.fail ( 'No "GITMAN_GITHUB_TOKEN" nor "GITHUB_TOKEN" environment variables provided!' );

      const username = await GitHub.user.getUsername ();

      if ( username ) {

        console.log ( username );

      } else {

        Utils.fail ( 'Token not associated with any user, it\'s probably invalid!' );

      }

    }

  }

};

/* EXPORT */

export default GitHub;
