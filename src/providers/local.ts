
/* IMPORT */

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

  /* REPO API */

  repo: {

    cd: async ( username: string, name: string ): Promise<void> => {

      const repoPath = path.join ( Env.ROOT_PATH, username, name );

      if ( !await Utils.exists ( repoPath ) ) return Utils.fail ( 'Repository not found' );

      const shell = process.env.SHELL;

      if ( !shell ) return Utils.fail ( 'Unable to find current shell in use' );

      spawnSync ( shell, { // Spawning a sub-shell at path
        cwd: repoPath,
        stdio: 'inherit',
        env: process.env
      });

    },

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

          console.log ( `${color.red ( Symbols.ERROR )} ${color.cyan ( `${username}/${name}` )} ${color.dim ( '->' )} Failed to clone!` );

          if ( error ) {

            console.log ( color.dim ( `${error}` ) );

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

    get: async ( username: string, name: string, minimal?: boolean ): Promise<ILocalRepo> => {

      if ( !await Local.repo.existsGit ( username, name ) ) Utils.fail ( 'Repository not found' );

      try {

        const repoPath = path.join ( Env.ROOT_PATH, username, name );
        const repo = await Local.repo.parse ( username, name, repoPath, minimal );

        return repo;

      } catch {

        throw Utils.fail ( 'Repository not found' );

      }

    },

    matches: ( username: string, name: string, glob: string ): boolean => {

      return micromatch.isMatch ( `${username}/${name}`, glob );

    },

    parse: ( username: string, name: string, repoPath: string, minimal?: boolean ): Promise<ILocalRepo> => {

      if ( minimal ) return Local.repo.parseMinimal ( username, name, repoPath );

      return Local.repo.parseFull ( username, name, repoPath );

    },

    parseFull: async ( username: string, name: string, repoPath: string ): Promise<ILocalRepo> => {

      const {ahead, behind, branch, isDirty, description, keywords, isPrivate} = await Local.repo.parseMetadata ( repoPath );

      return {
        id: `${username}/${name}`,
        path: repoPath,
        user: username,
        name,
        description,
        keywords,
        branch,
        isDirty,
        isPrivate,
        isPublic: !isPrivate,
        stats: {
          ahead,
          behind
        }
      };

    },

    parseMinimal: async ( username: string, name: string, repoPath: string ): Promise<ILocalRepo> => {

      const {description, keywords, isPrivate} = await Local.repo.parseMetadataNPM ( repoPath );

      return {
        id: `${username}/${name}`,
        path: repoPath,
        user: username,
        name,
        description,
        keywords,
        branch: '',
        isDirty: false,
        isPrivate,
        isPublic: !isPrivate,
        stats: {
          ahead: 0,
          behind: 0
        }
      };

    },

    parseMetadata: async ( repoPath: string ): Promise<{ ahead: number, behind: number, branch: string, isDirty: boolean, description: string, keywords: string[], isPrivate: boolean }> => {

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

    parseMetadataNPM: async ( repoPath: string ): Promise<{ description: string, keywords: string[], isPrivate: boolean }> => {

      try {

        const manifestPath = path.join ( repoPath, 'package.json' );
        const manifestContent = await fs.promises.readFile ( manifestPath, 'utf-8' );
        const manifest: IManifest | undefined = JSON.parse ( manifestContent );

        const description = manifest?.description || '';
        const keywords = manifest?.keywords || [];
        const isPrivate = manifest?.private ?? false;

        return {description, keywords, isPrivate};

      } catch {

        const description = '';
        const keywords = [];
        const isPrivate = false;

        return {description, keywords, isPrivate};

      }

    }

  },

  /* REPOS API */

  repos: {

    filter: ( repos: ILocalRepo[], filter?: IFilter ): ILocalRepo[] => {

      if ( !filter ) return repos;

      return repos.filter ( repo => {

        if ( Utils.lang.isBoolean ( filter.archived ) ) Utils.fail ( 'Unsupported local filter: "archived"' ); //TODO: Implement this filter
        if ( Utils.lang.isBoolean ( filter.forks ) ) Utils.fail ( 'Unsupported local filter: "forks"' ); //TODO: Implement this filter
        if ( Utils.lang.isBoolean ( filter.private ) && repo.isPrivate !== filter.private ) return false;
        if ( Utils.lang.isBoolean ( filter.public ) && repo.isPublic !== filter.public ) return false;
        if ( Utils.lang.isString ( filter.include ) && !Local.repo.matches ( repo.user, repo.name, filter.include ) ) return false;

        return true;

      });

    },

    getAll: async ( minimal?: boolean, filter?: IFilter ): Promise<ILocalRepo[]> => {

      if ( !await Utils.exists ( Env.ROOT_PATH ) ) return [];

      const repos: ILocalRepo[] = [];

      const usernames = await fs.promises.readdir ( Env.ROOT_PATH, { withFileTypes: true } );

      await Promise.all ( usernames.map ( async username => {

        const usernameLink = username.isSymbolicLink () ? await Utils.fs.getDirent ( path.join ( Env.ROOT_PATH, username.name ) ) || username : username;

        if ( !username.isDirectory () && !usernameLink.isDirectory () ) return;

        const usernamePath = path.join ( Env.ROOT_PATH, username.name );

        const names = await fs.promises.readdir ( usernamePath, { withFileTypes: true } );

        await Promise.all ( names.map ( async name => {

          const nameLink = name.isSymbolicLink () ? await Utils.fs.getDirent ( path.join ( usernamePath, name.name ) ) || name : name;

          if ( !name.isDirectory () && !nameLink.isDirectory () ) return;

          if ( !await Local.repo.existsGit ( username.name, name.name ) ) return;

          const repoPath = path.join ( usernamePath, name.name );
          const repo = await Local.repo.parse ( username.name, name.name, repoPath, minimal );

          repos.push ( repo );

        }));

      }));

      return Local.repos.sort ( Local.repos.filter ( repos, filter ) );

    },

    ls: async ( minimal?: boolean, json?: boolean, filter?: IFilter ): Promise<void> => {

      const repos = await Local.repos.getAll ( minimal, filter );

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
          const line = Utils.truncate ( [fullname, branch, isDirty, ahead, behind, desc].filter ( Utils.lang.identity ).join ( ' ' ) );

          console.log ( line );

        }

      }

    },

    sh: async ( command: string, filter?: IFilter ): Promise<void> => {

      const repos = await Local.repos.getAll ( true, filter );
      const promises = repos.map ( repo => Local.repo.execSh ( repo.path, command ) );
      const results = await Promise.allSettled ( promises );
      const data = results.map ( ( result, i ) => ({ repo: repos[i], result }) );

      /* ERRORS */

      data.forEach ( ({ repo, result }) => {

        if ( result.status !== 'rejected' ) return;

        console.log ( `${color.red ( Symbols.ERROR )} ${color.cyan ( `${repo.user}/${repo.name}` )}` );

        if ( result.reason ) {

          console.log ( color.dim ( `${result.reason}` ) );

        }

      });

      /* SUCCESSES */

      data.forEach ( ({ repo, result }) => {

        if ( result.status !== 'fulfilled' ) return;

        console.log ( `${color.green ( Symbols.SUCCESS )} ${color.cyan ( `${repo.user}/${repo.name}` )}` );

        if ( result.value ) {

          console.log ( color.dim ( result.value ) );

        }

      });

    },

    sort: ( repos: ILocalRepo[] ): ILocalRepo[] => {

      return [...repos].sort ( ( a, b ) => {

        if ( a.id === b.id ) return 0;

        if ( a.id > b.id ) return 1;

        return -1;

      });

    }

  }

};

/* EXPORT */

export default Local;
