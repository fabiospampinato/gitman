
/* IMPORT */

import {GitHub, Local} from './providers';
import {IFilter, ILocalRepo} from './types';

/* MAIN */

const GitMan = {

  /* API */

  cd: async ( username: string, name: string ): Promise<void> => {

    return Local.repo.cd ( username, name );

  },

  clone: async ( username: string, name: string ): Promise<void> => {

    return GitHub.repo.clone ( username, name );

  },

  cloneAll: async ( username: string, filter?: IFilter ): Promise<void> => {

    return GitHub.repos.clone ( username, filter );

  },

  get: async ( minimal?: boolean, filter?: IFilter ): Promise<ILocalRepo[]> => {

    return Local.repos.getAll ( minimal, filter );

  },

  ls: async ( username?: string, minimal?: boolean, json?: boolean, filter?: IFilter ): Promise<void> => {

    if ( username ) return GitHub.repos.ls ( username, minimal, json, filter );

    return Local.repos.ls ( minimal, json, filter );

  },

  sh: async ( command: string, filter?: IFilter ): Promise<void> => {

    return Local.repos.sh ( command, filter );

  }

};

/* EXPORT */

export default GitMan;
