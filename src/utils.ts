
/* IMPORT */

import truncate from 'cli-truncate';
import width from 'cli-width';
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

    }

  },

  /* API */

  fail: ( error: string ): void => {

    console.log ( color.red ( error ) );

    process.exit ( 1 );

  },

  truncate: ( str: string ): string => {

    return truncate ( str, width () );

  }

};

/* EXPORT */

export default Utils;
