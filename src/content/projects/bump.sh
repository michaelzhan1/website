#!/usr/bin/env bash

shopt -s nullglob

files=([0-9][0-9]-*.md)

for ((i=${#files[@]}-1; i>=0; i--)); do
    file="${files[i]}"

    prefix="${file%%-*}"
    rest="${file#*-}"

    new_prefix=$(printf "%02d" "$((10#$prefix + 1))")
    new_file="${new_prefix}-${rest}"

    echo "$file -> $new_file"
    mv -- "$file" "$new_file"
done