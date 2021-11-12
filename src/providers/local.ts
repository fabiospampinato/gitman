
/* IMPORT */

import _ from 'lodash';
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

      if ( await Local.repo.existsGit ( username, name ) ) {

        console.log ( `${color.green ( Symbols.SUCCESS )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} Cloned already!` );

      } else if ( await Local.repo.existsPath ( username, name ) ) {

        console.log ( `${color.red ( Symbols.ERROR )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} Folder already in use!` );

      } else {

        try {

          await fs.promises.mkdir ( repoPath, { recursive: true } );

          await Local.repo.execGit ( repoPath, ['clone', endpoint, '.'] );

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

    execGit: ( repoPath: string, args: string[] ): Promise<string> => {

      return Utils.exec ( 'git', args, {
        cwd: repoPath,
        encoding: 'utf-8',
      });

    },

    execSh: ( repoPath: string, command: string ): Promise<string> => {

      return Utils.exec ( command, null, {
        cwd: repoPath,
        encoding: 'utf-8',
        shell: true
      });

    },

    existsGit: ( username: string, name: string ): Promise<boolean> => {

      const gitPath = path.join ( Env.ROOT_PATH, username, name, '.git' );

      return Utils.exists ( gitPath );

    },

    existsPath: ( username: string, name: string ): Promise<boolean> => {

      const repoPath = path.join ( Env.ROOT_PATH, username, name );

      return Utils.exists ( repoPath );

    },

    matches: ( username: string, name: string, glob: string ): boolean => {

      return micromatch.isMatch ( `${username}/${name}`, glob );

    },

    parse: async ( username: string, name: string, repoPath: string ): Promise<ILocalRepo> => {

      const manifest = await Local.repo.parseManifest ( repoPath );
      const description = Local.repo.parseDescription ( repoPath, manifest );
      const keywords = Local.repo.parseKeywords ( repoPath, manifest );
      const branch = await Local.repo.parseBranch ( repoPath, manifest );
      const isDirty = await Local.repo.parseIsDirty ( repoPath, manifest );
      const [ahead, behind] = await Local.repo.parseAheadBehind ( repoPath, manifest );

      return {
        id: `${username}/${name}`,
        path: repoPath,
        user: username,
        name,
        description,
        keywords,
        branch,
        isDirty,
        stats: {
          ahead,
          behind
        }
      };

    },

    parseAheadBehind: async ( repoPath: string, manifest?: IManifest ): Promise<[number, number]> => {

      try {

        const stdout = await Local.repo.execSh ( repoPath, 'git rev-list --left-right --count $(git rev-parse --short HEAD)...$(git rev-parse --abbrev-ref --symbolic-full-name @{u})' );

        const match = /(\d+).*(\d+)/.exec ( stdout );

        return match ? [Number ( match[1] ), Number ( match[2] )] : [0, 0];

      } catch {}

      return [0, 0];

    },

    parseBranch: async ( repoPath: string, manifest?: IManifest ): Promise<string> => {

      try {

        const stdout = await Local.repo.execGit ( repoPath, ['symbolic-ref', '--short', 'HEAD'] );

        return stdout || '???';

      } catch {

        try {

          const stdout = await Local.repo.execGit ( repoPath, ['rev-parse', '--short', 'HEAD'] );

          return stdout ? `#${stdout}` : '???';

        } catch {}

      }

      return '???';

    },

    parseDescription: ( repoPath: string, manifest?: IManifest ): string => {

      return manifest?.description || '';

    },

    parseIsDirty: async ( repoPath: string, manifest?: IManifest ): Promise<boolean> => {

      try {

        return !!await Local.repo.execGit ( repoPath, ['status', '--porcelain', '--untracked-files'] );

      } catch {}

      return false;

    },

    parseKeywords: ( repoPath: string, manifest?: IManifest ): string[] => {

      return manifest?.keywords || [];

    },

    parseManifest: async ( repoPath: string ): Promise<IManifest | undefined> => {

      const manifestPath = path.join ( repoPath, 'package.json' );

      try {

        const manifestContent = await fs.promises.readFile ( manifestPath, 'utf-8' );
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

    getAll: async ( filter?: IFilter ): Promise<ILocalRepo[]> => {

      if ( !await Utils.exists ( Env.ROOT_PATH ) ) return [];

      const repos: ILocalRepo[] = [];

      const usernames = await fs.promises.readdir ( Env.ROOT_PATH, { withFileTypes: true } );

      for ( const username of usernames ) {

        if ( !username.isDirectory () ) continue;

        const usernamePath = path.join ( Env.ROOT_PATH, username.name );

        const names = await fs.promises.readdir ( usernamePath, { withFileTypes: true } );

        for ( const name of names ) {

          if ( !name.isDirectory () ) continue;

          const namePath = path.join ( usernamePath, name.name );
          const gitPath = path.join ( namePath, '.git' );

          if ( !await Utils.exists ( gitPath ) ) continue;

          const repo = await Local.repo.parse ( username.name, name.name, namePath );

          repos.push ( repo );

        }

      }

      return Local.repos.filter ( repos, filter );

    },

    ls: async ( json?: boolean, filter?: IFilter ): Promise<void> => {

      const repos = await Local.repos.getAll ( filter );

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

      const repos = await Local.repos.getAll ( filter );

      for ( const repo of repos ) {

        try {

          const stdout = await Local.repo.execSh ( repo.path, command );

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
