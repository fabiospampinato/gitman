#!/usr/bin/env node

/* IMPORT */

import {bin} from 'specialist';
import Utils from './utils';
import GitMan from '.'

/* MAIN */

bin ( 'gitman', 'A simple yet powerful opinionated tool for managing GitHub repositories' )
  /* DEFAULT OPTIONS */
  .option ( '--github-token <token>', 'GitHub personal access token' )
  .option ( '--root <path>', 'The folder path where repositories are cloned' )
  /* BACKUP */
  .command ( 'backup', 'Backup all repositories of the provided users' )
  .option ( '--no-archived', 'Ignore archived repositories' )
  .option ( '--no-forks', 'Ignore forked repositories' )
  .option ( '--no-private', 'Ignore private repositories' )
  .option ( '--no-public', 'Ignore public repositories' )
  .option ( '-i, --include <glob>', 'Include only repositories matching this glob' )
  .argument ( '<users...>', 'The users to clone repositories from' )
  .action ( ( options, args ) => {
    Utils.bin.enhanceEnv ( options );
    return GitMan.backup ( args, Utils.bin.makeFilter ( options ) );
  })
  /* CD */
  .command ( 'cd', 'CD into a local repository' )
  .argument ( '<repository>', 'The repository to CD into' )
  .action ( ( options, args ) => {
    Utils.bin.enhanceEnv ( options );
    const [username, name] = Utils.bin.parseIdentifier ( args[0], false );
    return GitMan.cd ( username, name );
  })
  /* CLONE */
  .command ( 'clone', 'Clone a remote repository' )
  .option ( '--no-archived', 'Ignore archived repositories' )
  .option ( '--no-forks', 'Ignore forked repositories' )
  .option ( '--no-private', 'Ignore private repositories' )
  .option ( '--no-public', 'Ignore public repositories' )
  .option ( '-i, --include <glob>', 'Include only repositories matching this glob' )
  .argument ( '<repository>', 'The repository to CD into' )
  .action ( ( options, args ) => {
    Utils.bin.enhanceEnv ( options );
    const [username, name] = Utils.bin.parseIdentifier ( args[0], true );
    if ( name === '*' ) {
      return GitMan.cloneAll ( username, Utils.bin.makeFilter ( options ) );
    } else {
      return GitMan.clone ( username, name );
    }
  })
  /* LS */
  .command ( 'ls', 'List all known repositories' )
  .option ( '--no-archived', 'Ignore archived repositories' )
  .option ( '--no-forks', 'Ignore forked repositories' )
  .option ( '--no-private', 'Ignore private repositories' )
  .option ( '--no-public', 'Ignore public repositories' )
  .option ( '-i, --include <glob>', 'Include only repositories matching this glob' )
  .option ( '-j, --json', 'Output repositories as JSON' )
  .option ( '-m, --minimal', 'Include only minimal, quick to retrieve, data for each repository' )
  .option ( '-u, --user <username>', 'List remote repositories for this user or organization' )
  .action ( options => {
    Utils.bin.enhanceEnv ( options );
    const {user, json, minimal, ...filter} = options;
    return GitMan.ls ( user, minimal, json, Utils.bin.makeFilter ( filter ) );
  })
  /* PUBLISH */
  .command ( 'publish', 'Publish a local repository to GitHub' )
  .option ( '--no-archived', 'Ignore archived repositories' )
  .option ( '--no-forks', 'Ignore forked repositories' )
  .option ( '--no-private', 'Ignore private repositories' )
  .option ( '--no-public', 'Ignore public repositories' )
  .option ( '-i, --include <glob>', 'Include only repositories matching this glob' )
  .argument ( '<repository>', 'The repository to CD into' )
  .action ( ( options, args ) => {
    Utils.bin.enhanceEnv ( options );
    const [username, name] = Utils.bin.parseIdentifier ( args[0], true );
    if ( name === '*' ) {
      return GitMan.publishAll ( username, Utils.bin.makeFilter ( options ) );
    } else {
      return GitMan.publish ( username, name );
    }
  })
  /* SH */
  .command ( 'sh', 'Execute a shell command in all known repositories' )
  .option ( '--no-archived', 'Ignore archived repositories' )
  .option ( '--no-forks', 'Ignore forked repositories' )
  .option ( '--no-private', 'Ignore private repositories' )
  .option ( '--no-public', 'Ignore public repositories' )
  .option ( '-i, --include <glob>', 'Include only repositories matching this glob' )
  .argument ( '<command>', 'The shell command to execute' )
  .action ( ( options, commands ) => {
    Utils.bin.enhanceEnv ( options );
    return GitMan.sh ( commands[0], Utils.bin.makeFilter ( options ) );
  })
  /* SYNC */
  .command ( 'sync', 'Synchronize all known repositories with GitHub (fetch, description, keywords)' )
  .option ( '--no-archived', 'Ignore archived repositories' )
  .option ( '--no-forks', 'Ignore forked repositories' )
  .option ( '--no-private', 'Ignore private repositories' )
  .option ( '--no-public', 'Ignore public repositories' )
  .option ( '-i, --include <glob>', 'Include only repositories matching this glob' )
  .argument ( '<repository>', 'The repository to CD into' )
  .action ( ( options, args ) => {
    Utils.bin.enhanceEnv ( options );
    const [username, name] = Utils.bin.parseIdentifier ( args[0], true );
    if ( name === '*' ) {
      return GitMan.syncAll ( username, Utils.bin.makeFilter ( options ) );
    } else {
      return GitMan.sync ( username, name );
    }
  })
  /* WHOAMI */
  .command ( 'whoami', 'Output the user associated with the provided GitHub token, if any' )
  .action ( options => {
    Utils.bin.enhanceEnv ( options );
    return GitMan.whoami ();
  })
  /* RUN */
  .run ();
