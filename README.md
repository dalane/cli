# Dalane CLI

Command line application for managing Dalane Cloud resources.

## Installation

```shell
	npm install -g @dalane/cli
```

## Authorise the application

Before managing Dalane Cloud resources the user will need to authorise the
application by running the command `dalane authorise` (or `dalane authorize`) in their terminal.

```shell
Usage: dalane authorise|authorize [options]

Authorises the app to the Dalane Cloud APIs.

Options:
  -h, --help                   display help for command
```

The user will need to have registered a client to their account. The first time
`authorise` is run they will be asked to provide the client id and the client
secret.

The application will retrieve authorisation configuration information from the
Auth server, then obtain an access token and refresh token from the token server
using the client credentials grant.

The application will remain authorised for as long as the refresh token remains
valid or until the user revokes the tokens.

```shell
Usage: dalane revoke [options]

Revokes all tokens and deauthorises the application.

Options:
  -h, --help  display help for command
```

## Loading fixtures

```shell
Usage: dalane fixtures [options] <file>

load fixtures from file

Options:
  -h, --help  display help for command
```

## Managing resources

## Managing setting

```shell
Usage: dalane config [options] [command]

Options:
  -h, --help         display help for command

Commands:
  set <key> [value]  set a new config value
  get <key>          delete the value of a setting
  list               list settings
  delete <key>
  reset [key]        Reset config to defaults
  help [command]     display help for command
```

