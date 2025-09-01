package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
)

type Item struct {
	Path  string `json:"path"`
	Name  string `json:"name"`
	Size  int64  `json:"size"`
	IsDir bool   `json:"isDir"`
}

func dirSize(path string) (int64, error) {
	var size int64
	err := filepath.WalkDir(path, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() {
			info, err := d.Info()
			if err != nil {
				return err
			}
			size += info.Size()
		}
		return nil
	})
	return size, err
}

func main() {
	target := flag.String("dir", ".", "target directory to scan")
	jsonOutput := flag.Bool("json", false, "output results in JSON")
	flag.Parse()

	absTarget, err := filepath.Abs(*target)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error resolving path: %v\n", err)
		os.Exit(1)
	}
	*target = absTarget

	entries, err := os.ReadDir(*target)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error reading directory: %v\n", err)
		os.Exit(1)
	}

	var items []Item
	total := len(entries)
	for i, entry := range entries {
		p := filepath.Join(*target, entry.Name())
		var size int64
		if entry.IsDir() {
			size, err = dirSize(p)
			if err != nil {
				fmt.Fprintf(os.Stderr, "error scanning %s: %v\n", p, err)
				continue
			}
		} else {
			info, err := entry.Info()
			if err != nil {
				fmt.Fprintf(os.Stderr, "error reading %s: %v\n", p, err)
				continue
			}
			size = info.Size()
		}
		items = append(items, Item{Path: p, Name: entry.Name(), Size: size, IsDir: entry.IsDir()})
		fmt.Fprintf(os.Stderr, "PROGRESS %d %d\n", i+1, total)
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Size > items[j].Size
	})

	if *jsonOutput {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		if err := enc.Encode(items); err != nil {
			fmt.Fprintf(os.Stderr, "error encoding json: %v\n", err)
			os.Exit(1)
		}
	} else {
		for _, item := range items {
			fmt.Printf("%d\t%s\n", item.Size, item.Path)
		}
	}
}
