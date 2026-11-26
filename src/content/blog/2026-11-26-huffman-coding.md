---
title: "Huffman Codes and Compression"
description: "Using Huffman codes to compress files."
date: 2026-11-26
---

Huffman codes are a commonly used code for lossless data compression. Each
unique unit within a file (say, a byte) is assigned a particular binary sequence
such that no binary sequence is a prefix of another. Then, the file can be
compressed by replacing each unit with its binary sequence, which should be
smaller in size (on weighted average) than each original unit.

## Huffman Trees

Everything about Huffman codes revolves around a Huffman tree, which is a binary
tree whose leaf nodes represent each unit in the original file. The binary
sequence for each unit is determined by the path to from the root to each leaf,
appending a 0 when traversing to the left child or 1 when traversing to the
right child (or vice versa, so long as the compression and decompression are
consistent).

![huffman tree](./images/huffman/tree.png)

Above is an example of a Huffman tree, for the units `a,b,c,d`, with each unit
having its own binary sequence. Notably, no binary sequence is a prefix of
another, since no path is a subpath of another; every path is from the root to a
unique leaf.

To use such a tree for compression, each instance of the units would simply be
replaced by the associated binary sequence, ignoring byte alignment. A string
like "abcd" might then be "00011011", collapsing a 4-byte string into a single
byte.

To decode a tree, we simply traverse the tree bit-by-bit, building a new unit
when a leaf node is reached, and resetting back to the root when necessary.
Following this allows us to decode something like "000011110110" to "aaddbc".

## Tree Construction

Trees do not need to be balanced. In fact, an unbalanced tree might be
preferred, since it allows for certain units to be represented by codes as short
as one bit. For best compression, it makes sense for more common units to be
represented by shorter codes.

To construct a Huffman tree following this paradigm, we can use the following
steps to build the tree from the bottom up. By using a priority queue weighted
by unit appearance count, we place the most common units at the top of the tree
(added at the end) and the least common units at the bottom of the tree (added
at the beginning). A more balanced distribution of units results in a more
balanced tree, whereas a less balanced distribution results in a less balanced
tree.

```python
# initialize priority queue
pq = []

# add units with counts as tree nodes into the priority queue
for unit, count in frequency.items():
    pq.push((count, node(unit)))

# continuously take the two least weighted subtrees
# and combine them into a new subtree
while len(pq) >= 2:
    right = pq.pop()
    left = pq.pop()

    new_node = node(left: left, right: right)
    pq.push((left.count + right.count, new_node))

# remaining node is the root
return pq[0].node
```
