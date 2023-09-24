
/* IMPORT */

import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {exit} from 'specialist';
import type {IEnv, IFilter} from './types';

/* MAIN */

const Utils = {

  /* BIN API */

  bin: {

    enhanceEnv: ( options: IEnv ): void => {

      if ( options.githubToken ) process.env['GITMAN_GITHUB_TOKEN'] = options.githubToken;
      if ( options.root ) process.env['GITMAN_ROOT'] = path.resolve ( options.root );

    },

    makeFilter: ( filter: IFilter ): IFilter => {

      return { // Explicitly filtering out potentially extraneous properties
        archived: filter.archived,
        clean: filter.clean,
        dirty: filter.dirty,
        forks: filter.forks,
        private: filter.private,
        public: filter.public,
        include: filter.include
      };

    },

    parseIdentifier: ( string: string, allowStar: boolean ): [string, string] => {

      const match = /^([a-z0-9_-]+)\/([a-z0-9_-]+|\*)$/i.exec ( string );

      if ( !match ) exit ( 'Repository excepted in the "username/repository" format' );

      if ( !allowStar && match[2] === '*' ) exit ( 'The "username/*" format is unsupported' );

      return [match[1], match[2]];

    }

  },

  /* FS API */

  fs: {

    getDirent: async ( filePath: string ): Promise<fs.Dirent | undefined> => {

      const realPath = await fs.promises.realpath ( filePath );
      const dirname = path.dirname ( realPath );
      const basename = path.basename ( realPath );

      const dirents = await fs.promises.readdir ( dirname, { withFileTypes: true } );
      const dirent = dirents.find ( dirent => dirent.name === basename );

      return dirent;

    }

  },

  /* LANG API */

  lang: { //TODO: Replace these with nanodash

    castArray: <T> ( value: T | T[] ): T[] => {

      return Array.isArray ( value ) ? value : [value];

    },

    identity: <T> ( value: T ): T => {

      return value;

    },

    isBoolean: ( value: unknown ): value is boolean => {

      return typeof value === 'boolean';

    },

    isString: ( value: unknown ): value is string => {

      return typeof value === 'string';

    },

    isEqual: ( a: string[], b: string[] ): boolean => {

      if ( a.length !== b.length ) return false;

      for ( let i = 0, l = a.length; i < l; i++ ) {

        if ( a[i] !== b[i] ) return false;

      }

      return true;

    },

    memoize: <T> ( fn: (() => T) ): (() => T) => {

      let cached: T;
      let isCached = false;

      return () => {

        if ( isCached ) return cached;

        cached = fn ();
        isCached = true;

        return cached;

      };

    },

    naturalSort: <T> ( values: T[], fn: ( value: T ) => string ): T[] => {

      const collator = new Intl.Collator ( undefined, { usage: 'sort', sensitivity: 'accent', numeric: true } );

      return [...values].sort ( ( a, b ) => collator.compare ( fn ( a ), fn ( b ) ) );

    }

  },

  /* API */

  exec: ( command: string, args: string[] | null, options: { cwd: string, encoding: string, shell?: true } ): Promise<string> => {

    const proc = args ? spawn ( command, args, options ) : spawn ( command, options );

    return new Promise ( ( resolve, reject ) => {

      let stdout = '';
      let stderr = '';

      proc.stdout.on ( 'data', data => stdout += data );
      proc.stderr.on ( 'data', data => stderr += data );

      proc.on ( 'error', () => {

        return reject ( stderr.trim () );

      });

      proc.on ( 'close', status => {

        if ( status !== 0 ) return reject ( stderr.trim () );

        return resolve ( stdout.trim () );

      });

    });

  },

  exists: ( targetPath: string ): Promise<boolean> => {

    return fs.promises.access ( targetPath ).then ( () => true, () => false );

  }

};

/* EXPORT */

export default Utils;
