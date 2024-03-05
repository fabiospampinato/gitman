
<p align="center">
  <img src="./resources/banner.png" alt="GitMan's Banner" width="640px" height="320px">
</p>

# GitMan

A simple yet powerful opinionated tool for managing GitHub repositories.

## Features

- **Simple**: There's almost nothing to configure and very few commands are provided.
- **Powerful**: It allows you to clone in bulk repositories easily and execute commands on them.
- **Tiny**: The entire thing is ~40kb min+gzipped, and only dependencies I personally maintain are used.
- **Beautiful**: All of its power derives from being opinioned about the folder structure where repositories are cloned.

## Install

```sh
npm install -g gitman
```

## Configuration

There are only two, optional, pieces of configuration:

- **GitHub token**: a GitHub personal access token, possibly with the `repo` scope enabled, can be provided to avoid rate limits and being able to manage private repositories too. You can set a token by using either the `GITMAN_GITHUB_TOKEN` or `GITHUB_TOKEN` environment variables, or with the `--github-token` option.
- **Root path**: the folder path where repositories are cloned. By default the first folder found matching the following is used `~/{GitHub,github,Git,git,Repositories,repositories,Repos,repos,Code,code,Projects,projects,Developer,developer,Dev,dev}`, otherwise `~/Code` is used. You can set a custom root path via the `GITMAN_ROOT` environment variable, or with the `--root` option.

The only other thing to remember is that repositories are saved according to the following schema: `$ROOT/username/reponame`, if you want GitMan to recognize manually-created repositories too you must follow that convention.

## Usage

The following interface is provided:

```
gitman 2.0.0

USAGE

  gitman [command]

OPTIONS

  --help                  Display help for the command
  --version, -v           Display the version number
  --github-token <token>  GitHub personal access token
  --root <path>           The folder path where repositories are cloned

COMMANDS

  help [command]        Display help for the command
  backup <users...>     Backup all repositories of the provided users
  cd <repository>       CD into a local repository
  clone <repository>    Clone a remote repository
  ls                    List all known repositories
  publish <repository>  Publish a local repository to GitHub
  sh <command>          Execute a shell command in all known repositories
  sync <repository>     Synchronize all known repositories with GitHub (fetch, description, keywords)
  whoami                Output the user associated with the provided GitHub token, if any
```

The following filtering options are available for most commands:

```
--no-archived         Ignore archived repositories
--no-clean            Ignore clean repositories
--no-dirty            Ignore dirty repositories
--no-forks            Ignore forked repositories
--no-private          Ignore private repositories
--no-public           Ignore public repositories
--include, -i <glob>  Include only repositories matching this glob
```

## Examples

Clone a single repository:

```sh
gitman clone fabiospampinato/gitman
```

Clone all repositories from a user/org:

```
gitman clone 'fabiospampinato/*'
```

Clone all non-archived and non-forks repositories from a user/org:

```
gitman clone --no-archived --no-forks 'fabiospampinato/*'
```

Clone all my vscode-related repositories:

```
gitman clone -i '**/vscode-*' 'fabiospampinato/*'
```

CD into a repository (actually this spawn a sub-shell, which you can `exit` from to go back):

```
gitman cd fabiospampinato/gitman
```

List all locally cloned repositories, this provides some useful information about the dirty status and number of commits ahead/behind origin:

```
gitman ls
```

List all locally cloned repositories that have uncommitted changes:

```
gitman --no-clean
```

List all locally cloned repositories that don't have uncommitted changes:

```
gitman --no-dirty
```

List all locally cloned repositories as JSON, useful for third-party tools integrations:

```
gitman ls --json
```

List minimal data about all locally cloned repositories as JSON, this is much quicker but omits git-specific data:

```
gitman ls --json --minimal
```

List all remote repositories available on GitHub for a user/org:

```
gitman ls --user fabiospampinato
```

List all non-archived and non-forks repositories for a user/org:

```
gitman ls --no-archived --no-forks --user fabiospampinato
```

Execute a command on all locally cloned repositories:

```
gitman sh 'cat package.json | grep typescript'
```

Execute a command on a subset of locally cloned repositories:

```
gitman sh -i '**/vscode-*' 'git fetch && echo "Something"'
```

Execute a command and get the output as JSON:

```
gitman sh 'cat package.json | grep typescript' --json
```

Execute a command, listing the unpacked size of NPM dependencies, and get a sorted output:

```
gitman sh 'npm view --json | jq .dist.unpackedSize' --sort
```

Publish a repository:

```
gitman publish fabiospampinato/gitman
```

Publish all my vscode-related repositories:

```
gitman publish -i '**/vscode-*' 'fabiospampinato/*'
```

Sync a repository:

```
gitman sync fabiospampinato/gitman
```

Sync all repositories for a user/org:

```
gitman sync 'fabiospampinato/*'
```

Get the user handle associated with the provided GitHub token:

```
gitman whoami
```

## Tips

- The `include` glob is matched against the full repository identifier (e.g. username/reponame), therefor most of the times your glob should probably look something like this: `**/foo-*`.
- GitMan will generally output nothing (except in `--json` mode) if there are no targeted repositories for your command (i.e. user with no repositories, no locally cloned repositories, using filters that exclude everything etc.).
- GitMan works with any kind of git repository, but it's especially suited for NPM packages, since it's able to extract a description, keywords, and private status from them.

## Related

- **[GitMan for VSCode](https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-gitman)**: The official companion extension for vscode, for switching to repositories quickly.
- **[Projects+](https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-projects-plus)**: A VSCode extension I wrote for switching quickly between projects, it requires some manual configuration though.

## License

MIT © Fabio Spampinato
