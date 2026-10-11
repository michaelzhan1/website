#!/usr/bin/env bash

if [[ $# -ne 1 || ! $1 =~ ^[0-9]+$ ]]; then
    echo "Usage: $0 INSERT_INDEX" >&2
    exit 1
fi

insert_index=$((10#$1))

shopt -s nullglob

files=([0-9][0-9]-*.md)

for ((i=${#files[@]}-1; i>=0; i--)); do
    file="${files[i]}"

    prefix="${file%%-*}"
    rest="${file#*-}"

    if ((10#$prefix < insert_index)); then
        continue
    fi

    new_prefix=$(printf "%02d" "$((10#$prefix + 1))")
    new_file="${new_prefix}-${rest}"

    echo "$file -> $new_file"
    mv -- "$file" "$new_file"
done