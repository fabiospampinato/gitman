
/* IMPORT */

import {GitHub, Local} from './providers';
import {IFilter} from './types';

/* MAIN */

const GitMan = {

  /* API */

  clone: async ( username: string, name: string ): Promise<void> => {

    return GitHub.repo.clone ( username, name );

  },

  cloneAll: async ( username: string, filter?: IFilter ): Promise<void> => {

    return GitHub.repos.clone ( username, filter );

  },

  ls: async ( username?: string, json?: boolean, filter?: IFilter ): Promise<void> => {

    if ( username ) return GitHub.repos.ls ( username, json, filter );

    return Local.repos.ls ( json, filter );

  },

  sh: async ( command: string, filter?: IFilter ): Promise<void> => {

    return Local.repos.sh ( command, filter );

  }

};

/* EXPORT */

export default GitMan;
