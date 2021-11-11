
/* IMPORT */

import _ from 'lodash';
import {Octokit} from '@octokit/core';
import micromatch from 'micromatch';
import {color} from 'specialist';
import {displayName, version} from '../../package.json';
import {GITHUB_REPOS_PER_PAGE, GITHUB_REPOS_SORT_DIMENSION, GITHUB_REPOS_SORT_DIRECTION, GITHUB_REPOS_TYPE} from '../constants';
import Env from '../env';
import Symbols from '../symbols';
import Utils from '../utils';
import {IFilter, IGitHubRepoRaw, IGitHubRepo} from '../types';
import Local from './local'

/* MAIN */

const GitHub = {

  /* STATE */

  octokit: new Octokit ({
    auth: Env.GITHUB_TOKEN,
    userAgent: `${displayName}/v${version}`
  }),

  /* API */

  repo: {

    clone: async ( username: string, name: string ): Promise<void> => {

      const endpoint = `https://github.com/${username}/${name}.git`;

      await Local.repo.clone ( username, name, endpoint );

    },

    matches: ( username: string, name: string, glob: string ): boolean => {

      return micromatch.isMatch ( `${username}/${name}`, glob );

    },

    parse: ( repo: IGitHubRepoRaw ): IGitHubRepo => {

      return {
        id: `${repo.id}`,
        user: repo.owner.login,
        name: repo.name,
        description: repo.description,
        keywords: repo.topics,
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

    }

  },

  repos: {

    clone: async ( username: string, filter?: IFilter ): Promise<void> => {

      const names = await GitHub.repos.getNames ( username, filter );

      for ( const name of names ) {

        await GitHub.repo.clone ( username, name );

      }

    },

    filter: ( repos: IGitHubRepo[], filter?: IFilter ): IGitHubRepo[] => {

      if ( !filter ) return repos;

      return repos.filter ( repo => {

        if ( _.isBoolean ( filter.archived ) && repo.isArchived !== filter.archived ) return false;
        if ( _.isBoolean ( filter.forks ) && repo.isFork !== filter.forks ) return false;
        if ( _.isBoolean ( filter.private ) && repo.isPrivate !== filter.private ) return false;
        if ( _.isBoolean ( filter.public ) && repo.isPublic !== filter.public ) return false;
        if ( _.isString ( filter.include ) && !GitHub.repo.matches ( repo.user, repo.name, filter.include ) ) return false;

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

      return GitHub.repos.filter ( _.flatten ( pages ), filter );

    },

    getNames: async ( username: string, filter?: IFilter ): Promise<string[]> => {

      const repos = await GitHub.repos.getAll ( username, filter );
      const names = repos.map ( repo => repo.name );

      return names;

    },

    getPage: async ( username: string, page: number ): Promise<IGitHubRepo[]> => {

      const endpoint = Env.GITHUB_TOKEN ? '/user/repos' : '/users/{username}/repos';

      const {data} = await GitHub.octokit.request ( `GET ${endpoint}`, {
        username,
        page,
        per_page: GITHUB_REPOS_PER_PAGE,
        sort: GITHUB_REPOS_SORT_DIMENSION,
        direction: GITHUB_REPOS_SORT_DIRECTION,
        type: GITHUB_REPOS_TYPE
      });

      return data.map ( GitHub.repo.parse );

    },

    ls: async ( username: string, json?: boolean, filter?: IFilter ): Promise<void> => {

      const repos = await GitHub.repos.getAll ( username, filter );

      if ( json ) {

        console.log ( JSON.stringify ( repos ) );

      } else {

        for ( const repo of repos ) {

          const name = color.cyan ( repo.name );
          const desc = color.dim ( repo.description );
          const isArchived = repo.isArchived ? color.yellow ( Symbols.ARCHIVED ) : '';
          const isFork = repo.isFork ? color.magenta ( Symbols.FORK ) : '';
          const isPrivate = repo.isPrivate ? color.red ( Symbols.PRIVATE ) : '';
          const line = Utils.truncate ( [name, isFork, isArchived, isPrivate, desc].filter ( _.identity ).join ( ' ' ) );

          console.log ( line );

        }

      }

    }

  }

};

/* EXPORT */

export default GitHub;
