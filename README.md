# SizeMe

This project scans a directory and reports the size of each entry.

## Go CLI

Run:

```
go run main.go -dir <path> -json
```

## Neutralino UI

A Neutralino.js desktop interface lives in `neutralino/`.
To install dependencies and start it:

```
cd neutralino
npm install
npm start
```

The UI sends the selected path to the Go backend, displays the JSON
response as a list, allows drilling into directories by clicking on them,
and includes an **Up** button to navigate to the parent directory.
