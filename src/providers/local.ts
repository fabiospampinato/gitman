
/* IMPORT */

import _ from 'lodash';
import {spawnSync} from 'child_process';
import fs from 'fs';
import micromatch from 'micromatch';
import path from 'path';
import {color} from 'specialist';
import Env from '../env';
import Symbols from '../symbols';
import Utils from '../utils';
import {IFilter, ILocalRepo, IManifest} from '../types';

/* MAIN */

const Local = {

  /* API */

  repo: {

    clone: async ( username: string, name: string, endpoint: string ): Promise<void> => {

      const repoPath = path.join ( Env.ROOT_PATH, username, name );

      if ( Local.repo.existsGit ( username, name ) ) {

        console.log ( `${color.green ( Symbols.SUCCESS )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} Cloned already!` );

      } else if ( Local.repo.existsPath ( username, name ) ) {

        console.log ( `${color.red ( Symbols.ERROR )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} Folder already in use!` );

      } else {

        try {

          fs.mkdirSync ( repoPath, { recursive: true } );

          await Local.repo.exec ( repoPath, `git clone ${endpoint} .` );

          console.log ( `${color.green ( Symbols.SUCCESS )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} ${repoPath}` );

        } catch ( error: unknown ) {

          const stderr = `${error}`;

          console.log ( `${color.red ( Symbols.ERROR )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} Failed to clone!` );

          if ( stderr ) {

            console.log ( color.dim ( stderr ) );

          }

        }

      }

    },

    exec: ( repoPath: string, command: string ): string => {

      const {status, stderr, stdout} = spawnSync ( command, {
        cwd: repoPath,
        encoding: 'utf-8',
        shell: true
      });

      if ( status !== 0 ) throw stderr.trim ();

      return stdout.trim ();

    },

    existsGit: ( username: string, name: string ): boolean => {

      const gitPath = path.join ( Env.ROOT_PATH, username, name, '.git' );

      return fs.existsSync ( gitPath );

    },

    existsPath: ( username: string, name: string ): boolean => {

      const repoPath = path.join ( Env.ROOT_PATH, username, name );

      return fs.existsSync ( repoPath );

    },

    matches: ( username: string, name: string, glob: string ): boolean => {

      return micromatch.isMatch ( `${username}/${name}`, glob );

    },

    parse: ( username: string, name: string, repoPath: string ): ILocalRepo => {

      const manifest = Local.repo.parseManifest ( repoPath );

      return {
        id: `${username}/${name}`,
        path: repoPath,
        user: username,
        name,
        description: Local.repo.parseDescription ( repoPath, manifest ),
        keywords: Local.repo.parseKeywords ( repoPath, manifest ),
        branch: Local.repo.parseBranch ( repoPath, manifest ),
        isDirty: Local.repo.parseIsDirty ( repoPath, manifest ),
        stats: {
          ahead: Local.repo.parseAhead ( repoPath, manifest ),
          behind: Local.repo.parseBehind ( repoPath, manifest )
        }
      };

    },

    parseAhead: ( repoPath: string, manifest?: IManifest ): number => {

      try {

        const stdout = Local.repo.exec ( repoPath, 'git rev-list --left-right --count $(git symbolic-ref --short HEAD)...$(git rev-parse --abbrev-ref --symbolic-full-name @{u})' );

        const match = /(\d+)/.exec ( stdout );

        return match ? Number ( match[1] ) : 0;

      } catch {}

      return 0;

    },

    parseBehind: ( repoPath: string, manifest?: IManifest ): number => {

      try {

        const stdout = Local.repo.exec ( repoPath, 'git rev-list --left-right --count $(git symbolic-ref --short HEAD)...$(git rev-parse --abbrev-ref --symbolic-full-name @{u})' );

        const match = /\d+.*(\d+)/.exec ( stdout );

        return match ? Number ( match[1] ) : 0;

      } catch {}

      return 0;

    },

    parseBranch: ( repoPath: string, manifest?: IManifest ): string => {

      try {

        const stdout = Local.repo.exec ( repoPath, 'git symbolic-ref --short HEAD' );

        return stdout || '???';

      } catch {

        try {

          const stdout = Local.repo.exec ( repoPath, 'git symbolic-ref --short HEAD' );

          return stdout ? `#${stdout}` : '???';

        } catch {}

      }

      return '???';

    },

    parseDescription: ( repoPath: string, manifest?: IManifest ): string => {

      return manifest?.description || '';

    },

    parseIsDirty: ( repoPath: string, manifest?: IManifest ): boolean => {

      try {

        return !!Local.repo.exec ( repoPath, 'git status --porcelain --untracked-files' );

      } catch {}

      return false;

    },

    parseKeywords: ( repoPath: string, manifest?: IManifest ): string[] => {

      return manifest?.keywords || [];

    },

    parseManifest: ( repoPath: string ): IManifest | undefined => {

      const manifestPath = path.join ( repoPath, 'package.json' );

      try {

        const manifestContent = fs.readFileSync ( manifestPath, 'utf-8' );
        const manifest = JSON.parse ( manifestContent );

        return manifest;

      } catch {}

    }

  },

  repos: {

    filter: ( repos: ILocalRepo[], filter?: IFilter ): ILocalRepo[] => {

      if ( !filter ) return repos;

      return repos.filter ( repo => {

        if ( _.isBoolean ( filter.archived ) ) Utils.fail ( 'Unsupported local filter: "archived"' ); //TODO: Implement this filter
        if ( _.isBoolean ( filter.forks ) ) Utils.fail ( 'Unsupported local filter: "forks"' ); //TODO: Implement this filter
        if ( _.isBoolean ( filter.private ) ) Utils.fail ( 'Unsupported local filter: "private"' ); //TODO: Implement this filter
        if ( _.isBoolean ( filter.public ) ) Utils.fail ( 'Unsupported local filter: "public"' ); //TODO: Implement this filter
        if ( _.isString ( filter.include ) && !Local.repo.matches ( repo.user, repo.name, filter.include ) ) return false;

        return true;

      });

    },

    getAll: ( filter?: IFilter ): ILocalRepo[] => {

      if ( !fs.existsSync ( Env.ROOT_PATH ) ) return [];

      const repos: ILocalRepo[] = [];

      const usernames = fs.readdirSync ( Env.ROOT_PATH, { withFileTypes: true } );

      for ( const username of usernames ) {

        if ( !username.isDirectory () ) continue;

        const usernamePath = path.join ( Env.ROOT_PATH, username.name );

        const names = fs.readdirSync ( usernamePath, { withFileTypes: true } );

        for ( const name of names ) {

          if ( !name.isDirectory () ) continue;

          const namePath = path.join ( usernamePath, name.name );
          const gitPath = path.join ( namePath, '.git' );

          if ( !fs.existsSync ( gitPath ) ) continue;

          const repo = Local.repo.parse ( username.name, name.name, namePath );

          repos.push ( repo );

        }

      }

      return Local.repos.filter ( repos, filter );

    },

    ls: async ( json?: boolean, filter?: IFilter ): Promise<void> => {

      const repos = Local.repos.getAll ( filter );

      if ( json ) {

        console.log ( JSON.stringify ( repos ) );

      } else {

        for ( const repo of repos ) {

          const fullname = color.cyan ( `${repo.user}/${repo.name}` );
          const desc = repo.description ? color.dim ( repo.description ) : '';
          const branch = repo.branch ? color.magenta ( repo.branch ) : '';
          const isDirty = repo.isDirty ? color.yellow ( Symbols.DIRTY ) : '';
          const ahead = repo.stats.ahead ? color.yellow ( `${repo.stats.ahead}${Symbols.AHEAD}` ) : '';
          const behind = repo.stats.behind ? color.yellow ( `${repo.stats.behind}${Symbols.BEHIND}` ) : '';
          const line = Utils.truncate ( [fullname, branch, isDirty, ahead, behind, desc].filter ( _.identity ).join ( ' ' ) );

          console.log ( line );

        }

      }

    },

    sh: async ( command: string, filter?: IFilter ): Promise<void> => {

      const repos = Local.repos.getAll ( filter );

      for ( const repo of repos ) {

        try {

          const stdout = await Local.repo.exec ( repo.path, command );

          console.log ( `${color.green ( Symbols.SUCCESS )} ${color.cyan ( `${repo.user}/${repo.name}` )}` );

          if ( stdout ) {

            console.log ( color.dim ( stdout ) );

          }

        } catch ( error: unknown ) {

          const stderr = `${error}`;

          console.log ( `${color.red ( Symbols.ERROR )} ${color.cyan ( `${repo.user}/${repo.name}` )}` );

          if ( stderr ) {

            console.log ( color.dim ( stderr ) );

          }

        }

      }

    }

  }

};

/* EXPORT */

export default Local;
