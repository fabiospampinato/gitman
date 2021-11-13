
/* IMPORT */

import {spawn} from 'child_process';
import truncate from 'cli-truncate';
import width from 'cli-width';
import fs from 'fs';
import get from 'simple-get';
import {color} from 'specialist';
import {IFilter} from './types';

/* MAIN */

const Utils = {

  /* BIN API */

  bin: {

    makeFilter: ( filter: IFilter ): IFilter => { // Commander pre-initializes these to true, which are interepreted differently by the app

      if ( filter.archived ) delete filter.archived;
      if ( filter.forks ) delete filter.forks;
      if ( filter.private ) delete filter.private;
      if ( filter.public ) delete filter.public;

      return filter;

    },

    parseIdentifier: ( string: string, allowStar: boolean ): [string, string] => {

      const match = /^([a-z0-9_-]+)\/([a-z0-9_-]+|\*)$/i.exec ( string );

      if ( !match ) throw Utils.fail ( 'Repository excepted in the "username/repository" format' );

      if ( !allowStar && match[2] === '*' ) throw Utils.fail ( 'The "username/*" format is unsupported' );

      return [match[1], match[2]];

    }

  },

  /* LANG API */

  lang: { //TODO: Replace these with nanodash

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

      let cached;
      let isCached = false;

      return () => {

        if ( isCached ) return cached;

        cached = fn ();
        isCached = true;

        return cached;

      };

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

  },

  fail: ( error: string ): never => {

    console.log ( color.red ( error ) );

    process.exit ( 1 );

  },

  fetch: ( options: { method: string, url: string, body?: string, headers?: Record<string, string> } ): Promise<any> => {

    return new Promise ( ( resolve, reject ) => {

      get.concat ( options, ( error, response, data ) => {

        if ( error ) return reject ( error );

        if ( !/^2\d\d$/.test ( `${response.statusCode}` ) ) return reject ( data.toString () );

        return resolve ( JSON.parse ( data.toString () ) );

      });

    });

  },

  truncate: ( str: string ): string => {

    return truncate ( str, width () );

  }

};

/* EXPORT */

export default Utils;
