
/* IMPORT */

import fs from 'fs';
import path from 'path';
import os from 'os';

/* HELPERS */

const {GITHUB_TOKEN, GITMAN_GITHUB_TOKEN, GITMAN_ROOT} = process.env;

/* MAIN */

const Env = {

  GITHUB_TOKEN: GITMAN_GITHUB_TOKEN || GITHUB_TOKEN,

  ROOT_PATH: (() => {

    if ( GITMAN_ROOT ) return GITMAN_ROOT;

    const home = os.homedir ();
    const targets = ['GitHub', 'github', 'Code', 'code', 'Projects', 'projects'];

    for ( const target of targets ) {

      const targetPath = path.join ( home, target );

      if ( !fs.existsSync ( targetPath ) ) continue;
      if ( !fs.lstatSync ( targetPath ).isDirectory () ) continue;

      return targetPath;

    }

    return path.join ( home, 'Code' );

  })()

};

/* EXPORT */

export default Env;

