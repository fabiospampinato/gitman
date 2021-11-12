
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

      const {ahead, behind, branch, isDirty, description, keywords} = await Local.repo.parseMetadata ( repoPath );

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

    parseMetadata: async ( repoPath: string ): Promise<{ ahead: number, behind: number, branch: string, isDirty: boolean, description: string, keywords: string[] }> => {

      const {parseMetadataGit, parseMetadataNPM} = Local.repo;
      const promises = <const> [parseMetadataGit ( repoPath ), parseMetadataNPM ( repoPath )];
      const results = await Promise.allSettled ( promises );

      if ( results[0].status === 'rejected' ) throw results[0].reason;
      if ( results[1].status === 'rejected' ) throw results[1].reason;

      const git = results[0].value;
      const npm = results[1].value;

      return {...git, ...npm};

    },

    parseMetadataGitAheadBehind: async ( repoPath: string ): Promise<{ ahead: number, behind: number }> => {

      const stdout = await Local.repo.execSh ( repoPath, 'git rev-list --left-right --count $(git rev-parse --short HEAD)...$(git rev-parse --abbrev-ref --symbolic-full-name @{u})' );

      const match = /(\d+).*(\d+)/.exec ( stdout );

      if ( !match ) throw new Error ();

      const ahead = Number ( match[1] );
      const behind = Number ( match[2] );

      return { ahead, behind };

    },

    parseMetadataGitBranch: async ( repoPath: string ): Promise<string> => {

      return Local.repo.execGit ( repoPath, ['symbolic-ref', '--short', 'HEAD'] );

    },

    parseMetadataGitCommit: async ( repoPath: string ): Promise<string> => {

      return Local.repo.execGit ( repoPath, ['rev-parse', '--short', 'HEAD'] );

    },

    parseMetadataGitDirty: async ( repoPath: string ): Promise<boolean> => {

      return !!await Local.repo.execGit ( repoPath, ['status', '--porcelain', '--untracked-files'] );

    },

    parseMetadataGit: async ( repoPath: string ): Promise<{ ahead: number, behind: number, branch: string, isDirty: boolean }> => {

      const {parseMetadataGitAheadBehind, parseMetadataGitBranch, parseMetadataGitCommit, parseMetadataGitDirty} = Local.repo;
      const promises = <const> [parseMetadataGitAheadBehind ( repoPath ), parseMetadataGitBranch ( repoPath ), parseMetadataGitCommit ( repoPath ), parseMetadataGitDirty ( repoPath )];
      const results = await Promise.allSettled ( promises );

      const ahead = results[0].status === 'fulfilled' ? results[0].value.ahead : 0;
      const behind = results[0].status === 'fulfilled' ? results[0].value.behind : 0;
      const branch = results[1].status === 'fulfilled' ? results[1].value : ( results[2].status === 'fulfilled' ? `#${results[2]}` : '???' );
      const isDirty = results[3].status === 'fulfilled' ? results[3].value : false;

      return {ahead, behind, branch, isDirty};

    },

    parseMetadataNPM: async ( repoPath: string ): Promise<{ description: string, keywords: string[] }> => {

      try {

        const manifestPath = path.join ( repoPath, 'package.json' );
        const manifestContent = await fs.promises.readFile ( manifestPath, 'utf-8' );
        const manifest: IManifest | undefined = JSON.parse ( manifestContent );

        const description = manifest?.description || '';
        const keywords = manifest?.keywords || [];

        return {description, keywords};

      } catch {

        const description = '';
        const keywords = [];

        return {description, keywords};

      }

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

      await Promise.all ( usernames.map ( async username => {

        if ( !username.isDirectory () ) return;

        const usernamePath = path.join ( Env.ROOT_PATH, username.name );

        const names = await fs.promises.readdir ( usernamePath, { withFileTypes: true } );

        await Promise.all ( names.map ( async name => {

          if ( !name.isDirectory () ) return;

          if ( !await Local.repo.existsGit ( username.name, name.name ) ) return;

          const repoPath = path.join ( usernamePath, name.name );
          const repo = await Local.repo.parse ( username.name, name.name, repoPath );

          repos.push ( repo );

        }));

      }));

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
