
/* IMPORT */

import path from 'node:path';
import Env from './env';
import {GitHub, Local} from './providers';
import type {IFilter, ILocalRepo} from './types';

/* MAIN */

const GitMan = {

  /* API */

  backup: async ( usernames: string[], filter?: IFilter ): Promise<void> => {

    const timestamp = new Date ().toISOString ().slice ( 0, 10 );
    const folder = `gitman-backup_${timestamp}`;

    Env.ROOT_PATH = path.join ( Env.ROOT_PATH, folder );

    await GitHub.repos.clone ( usernames, filter );

  },

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

  publish: async ( username: string, name: string ): Promise<void> => {

    return GitHub.repo.publish ( username, name );

  },

  publishAll: async ( username: string, filter?: IFilter ): Promise<void> => {

    return GitHub.repos.publish ( username, filter );

  },

  sh: async ( command: string, filter?: IFilter ): Promise<void> => {

    return Local.repos.sh ( command, filter );

  },

  sync: async ( username: string, name: string ): Promise<void> => {

    return GitHub.repo.sync ( username, name );

  },

  syncAll: async ( username: string, filter?: IFilter ): Promise<void> => {

    return GitHub.repos.sync ( username, filter );

  },

  whoami: async (): Promise<void> => {

    return GitHub.user.whoami ();

  }

};

/* EXPORT */

export default GitMan;
