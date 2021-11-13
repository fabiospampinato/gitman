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
  .command ( 'cd' )
  .description ( 'CD into a local repository' )
  .arguments ( '<repository>' )
  .action ( async argument => {
    const [username, name] = Utils.bin.parseIdentifier ( argument, false );
    await GitMan.cd ( username, name );
    process.exit ( 0 );
  });

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
    const [username, name] = Utils.bin.parseIdentifier ( argument, true );
    if ( name === '*' ) {
      await GitMan.cloneAll ( username, Utils.bin.makeFilter ( options ) );
    } else {
      await GitMan.clone ( username, name );
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
  .option ( '-m, --minimal', 'Include only minimal, quick to retrieve, data for each repository' )
  .option ( '-u, --user <username>', 'List remote repositories for this user or organization' )
  .action ( async options => {
    const {user, json, minimal, ...filter} = options;
    await GitMan.ls ( user, minimal, json, Utils.bin.makeFilter ( filter ) );
    process.exit ( 0 );
  });

program
  .command ( 'publish' )
  .description ( 'Publish a local repository to GitHub' )
  .option ( '--no-archived', 'Ignore archived repositories' )
  .option ( '--no-forks', 'Ignore forked repositories' )
  .option ( '--no-private', 'Ignore private repositories' )
  .option ( '--no-public', 'Ignore public repositories' )
  .option ( '-i, --include <glob>', 'Include only repositories matching this glob' )
  .arguments ( '<repository>' )
  .action ( async ( argument, options ) => {
    const [username, name] = Utils.bin.parseIdentifier ( argument, true );
    if ( name === '*' ) {
      await GitMan.publishAll ( username, Utils.bin.makeFilter ( options ) );
    } else {
      await GitMan.publish ( username, name );
    }
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

program
  .command ( 'sync' )
  .description ( 'Synchronize all known repositories with GitHub (fetch, description, keywords)' )
  .option ( '--no-archived', 'Ignore archived repositories' )
  .option ( '--no-forks', 'Ignore forked repositories' )
  .option ( '--no-private', 'Ignore private repositories' )
  .option ( '--no-public', 'Ignore public repositories' )
  .option ( '-i, --include <glob>', 'Include only repositories matching this glob' )
  .arguments ( '<command>' )
  .action ( async ( argument, options ) => {
    const [username, name] = Utils.bin.parseIdentifier ( argument, true );
    if ( name === '*' ) {
      await GitMan.syncAll ( username, Utils.bin.makeFilter ( options ) );
    } else {
      await GitMan.sync ( username, name );
    }
    process.exit ( 0 );
  });

program.parse ();
