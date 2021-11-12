#!/usr/bin/env node

/* IMPORT */

import {program, updater} from 'specialist';
import {name, displayName, version, description} from '../package.json';
import Utils from './utils';
import GitMan from '.'

/* MAIN */

//TODO: Delete command
//TODO: Publish command
//TODO: Sync command

updater ({ name, version });

program
  .name ( displayName )
  .version ( version )
  .description ( description );

program
  .command ( 'clone' )
  .description ( 'Clone a remote repository' )
  .option ( '--no-archived', 'Ignore archived repositories' )
  .option ( '--no-forks', 'Ignore forked repositories' )
  .option ( '--no-private', 'Ignore private repositories' )
  .option ( '--no-public', 'Ignore public repositories' )
  .option ( '-i, --include <glob>', 'Include only repositories matching this glob' )
  .arguments ( '<repository>' )
  .action ( async ( argument, options ) => {
    const match = /^([a-z0-9_-]+)\/([a-z0-9_-]+|\*)$/i.exec ( argument );
    if ( !match ) throw new Error ( 'Repository excepted in the "username/repository" format' );
    if ( match[2] === '*' ) {
      await GitMan.cloneAll ( match[1], Utils.bin.makeFilter ( options ) );
    } else {
      await GitMan.clone ( match[1], match[2] );
    }
    process.exit ( 0 );
  });

program
  .command ( 'ls' )
  .description ( 'List all known repositories' )
  .option ( '--no-archived', 'Ignore archived repositories' )
  .option ( '--no-forks', 'Ignore forked repositories' )
  .option ( '--no-private', 'Ignore private repositories' )
  .option ( '--no-public', 'Ignore public repositories' )
  .option ( '-i, --include <glob>', 'Include only repositories matching this glob' )
  .option ( '-j, --json', 'Output repositories as JSON' )
  .option ( '-u, --user <username>', 'List remote repositories for this user or organization' )
  .action ( async options => {
    const {user, json, ...filter} = options;
    await GitMan.ls ( user, json, Utils.bin.makeFilter ( filter ) );
    process.exit ( 0 );
  });

program
  .command ( 'sh' )
  .description ( 'Execute a shell command in all known repositories' )
  .option ( '--no-archived', 'Ignore archived repositories' )
  .option ( '--no-forks', 'Ignore forked repositories' )
  .option ( '--no-private', 'Ignore private repositories' )
  .option ( '--no-public', 'Ignore public repositories' )
  .option ( '-i, --include <glob>', 'Include only repositories matching this glob' )
  .arguments ( '<command>' )
  .action ( async ( command, options ) => {
    await GitMan.sh ( command, Utils.bin.makeFilter ( options ) );
    process.exit ( 0 );
  });

program.parse ();
