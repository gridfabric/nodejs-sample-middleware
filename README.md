# Sample middleware

This is a minimal nodejs implementation of a middleware for the default Plaid plugin that will provide enough functionality for OpenADR certification, once connected to your platform.

The goal is to provide a template and/or kernel for an implementation into your platform. It does not include any security, error checking, etc. It does not have any dependencies, and can be run with `node index.js`.

It sets up a simple http server to receive POST messages from Plaid. It parses the message type and directs to a response function accordingly. The response function creates a properly formatted JSON response (where needed) and sends it back to the plugin.

By default, it will require the quicktype file (see section below) to run. 

## Reporting

Registration: registers the basic reports required for OpenADR certification

QueryIntervals: as data is required to populate a report, it is queried for by the plugin and responded using this callback. This reports values of 0.

This will not need to be updated for OpenADR certification - the values provided in the reports are not tested.

## Events

A basic implementation of receiving event interval starts and event ends is implemented. These will need to be tied into your platform to start control when the event starts, and go back to normal once the event has ended.

## Quicktype support

The default plugin is set up to provide support for [quicktype](https://quicktype.io/)

A quicktype file can be created from the schema files in the source code. This file provides functions for serializing and deserializing JSON strings into javascript objects. These functions will throw errors if your objects do not align to the schema, allowing for a faster debugging feedback loop.

Quicktype will need to be added as a command line tool - installation instructions can be found here: https://github.com/quicktype/quicktype

Once it is added, from the plugin messages schema directory (hosted in `oadr/oadrapi/oadrapi/pluginmessages`) you can run the following command in the CLI to generate the quicktype file. 

`quicktype -l javascript --src-lang schema schema/*.json > lang/quicktype.js`

Copy the quicktype file into this directory prior to running.

Quicktype functionality is imported as the `Convert` library into the index.js file. If quicktype is not desired, remove the import and replace the `toJson` functions with `JSON.stringify()` instead.
