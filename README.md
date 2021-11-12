<p align="center">
  <img src="./resources/logo.png" alt="GitMan logo" width="300">
</p>

# GitMan

A simple yet powerful opinionated tool for managing GitHub repositories.

## Features

- **Simple**: There's almost nothing to configure and very few commands are provided.
- **Powerful**: It allows you to clone in bulk repositories easily and execute commands on them.
- **Tiny**: The entire thing is ~40kb min+gzipped, and only dependencies I personally either maintain or trust are used.
- **Beautiful**: All of its power derives from being opinioned about the folder structure where repositories are cloned.

## Install

```sh
npm install -g @fabiospampinato/gitman
```

## Configuration

There are only two, optional, pieces of configuration:

- **GitHub token**: a GitHub personal access token, possibly with the `repo` scope enabled, can be provided to avoid rate limits and being able to manage private repositories too. You can set a token by using either the `GITMAN_GITHUB_TOKEN` or `GITHUB_TOKEN` environment variables.
- **Root path**: the folder path where repositories are cloned. By default the first folder found matching the following is used `~/{GitHub,github,Git,git,Repositories,repositories,Repos,repos,Code,code,Projects,projects}`, otherwise `~/Code` is used. You can set a custom root path via the `GITMAN_ROOT` environment variable.

The only other thing to remember is that repositories are saved according to the following schema: `$ROOT/username/reponame`, if you want GitMan to recognize manually-created repositories too you must follow that convention.

## Usage

The following interface is provided:

```
Usage: gitman [options] [command]

A simple yet powerful opinionated tool for managing GitHub repositories.

Options:
  -V, --version                 output the version number
  -h, --help                    display help for command

Commands:
  cd <repository>               CD into a local repository
  clone [options] <repository>  Clone a remote repository
  ls [options]                  List all known repositories
  sh [options] <command>        Execute a shell command in all known repositories
  help [command]                display help for command
```

The following filtering options are available for most commands:

```
--no-archived         Ignore archived repositories
--no-forks            Ignore forked repositories
--no-private          Ignore private repositories
--no-public           Ignore public repositories
-i, --include <glob>  Include only repositories matching this glob
```

## Examples

Clone a single repository:

```sh
gitman clone fabiospampinato/gitman
```

Clone all repositories from a user/org:

```
gitman clone fabiospampinato/*
```

Clone all non-archived and non-forks repositories from a user/org:

```
gitman clone --no-archived --no-forks fabiospampinato/*
```

Clone all my vscode-related repositories:

```
gitman clone -i '**/vscode-*' fabiospampinato/*
```

CD into a repository (actually this spawn a sub-shell, which you can `exit` from to go back):

```
gitman cd fabiospampinato/gitman
```

List all locally cloned repositories, this provides some useful information about the dirty status and number of commits ahead/behind origin:

```
gitman ls
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
gitman sh 'git fetch && echo "Something"'
```

## Tips

- The `include` glob is matched against the full repository identifier (e.g. username/reponame), therefor most of the times your glob should probably look something like this: `**/foo-*`.
- GitMan will generally output nothing (except in `--json` mode) if there are no targeted repositories for your command (i.e. user with no repositories, no locally cloned repositories, using filters that exclude everything etc.).

## Related

- **[GitMan for VSCode](https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-gitman)**: The official companion extension for vscode, for switching to repositories quickly.
- **[Autogit](https://github.com/fabiospampinato/autogit)**: Another similar tool I wrote, which is extendable but much less convenient to set up.
- **[Projects+](https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-projects-plus)**: A VSCode extension I wrote for switching quickly between projects, it requires some manual configuration though.

## License

MIT © Fabio Spampinato
