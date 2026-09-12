---
title: "Monotonic Stacks and Queues"
description: "Some commentary on monotonic data structures."
date: 2026-09-12
---

Monotonic stacks and queues were two concepts that I first encountered through
Leetcode and had never heard of prior. I thought them confusing at first, but
have since become more accustomed to their patterns and use cases. I wanted to
write this as (1) my first blog post and (2) an actual explanation for the
random person who stumbles across this.

## Monotonicity

The concept of monotonicity (being monotonic) spawned from math, where it was
used to define functions that were uni-directional: namely, non-increasing or
non-decreasing. We can apply that to stacks and queues (which can be thought of
as "1-D" data structures), so that the top of a monotonically increasing stack
might always represent the largest item in the stack, and the back of a
monotonically decreasing queue might always represent the smallest item in the
queue.

## The Core Pattern

The core pattern for monotonic data structures is almost identical between
stacks and queues, differing almost only in the main data structure itself.
Other modifications might be necessary on a per-problem basis, but the skeleton
remains the same.

In principle, the monotonic invariant (increasing or decreasing) must be held.
We do this by popping violating items off of the top or back (deques are very
useful here) whenever considering a new item to push onto the data structure.
The key to holding the invariant is that we always add a new item to the data
structure, and prune the existing values to make the new one fit.

An example with a monotonically increasing stack is shown below. In the example,
the nested `while` loop handles the invariant enforcement.

```python
# example: monotonically increasing stack
for item in items:
  while not stack.empty() and item < stack.top():
    stack.pop()

  stack.push(item)
```

By doing computation while visiting each item, this grants us a linear-time
algorithm to traverse an array while maintaining the monotonic data structure,
since each item is only visited once.

Additionally, the items that the data structure directly stores do not
necessarily need to be monotonic themselves, but rather only need to represent
the monotonic values. A common pattern is tracking the indices of monotonic
values within the data structure.

## Monotonic Stacks

Monotonic stacks are most applicable (in my opinion) to problems where you
repeatedly need to find the next greater or smaller element across an array. One
example of a problem that can be solved with a monotonic stack is the
[Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/description/)
problem.

Essentially, this problem is a set of comparisons of next-greater and
next-smaller to calculate the areas of pools of water. This can be done naively
in O(n<sup>2</sup>), but reduces down to O(n) with a decreasing monotonic stack.
For this particular problem, the stack tracks the next wall to the left of the
current block. Popping an item from the stack represents completing the right
wall of a hole, and the water's area can be added to the final answer. In
essence, it uses the stack to sum up the rectangular areas of water.

```python
def trap(self, height: List[int]) -> int:
  # stack containing the indices of a monotonic-decreasing set of heights. the "left wall" of each pool
  stack = []

  res = 0
  for i in range(len(height)):
    # monotonic condition
    while stack and height[i] >= height[stack[-1]]:
      # treat the most recent violator of the invariant as the bottom of a pool
      bottom = height[stack.pop()]
      if len(stack) >= 1:
        layer_h = min(height[stack[-1]], height[i]) - bottom
        layer_w = i - stack[-1] - 1
        res += layer_h * layer_w

    # always append to the stack, which is guaranteed to follow monotonicity
    stack.append(i)

  return res
```

## Monotonic Queues (Deques)

Monotonic queues (usually deques) are very useful for types of problems that
require you to track a maximum or minimum of an n-most-recent set of values. The
classic example of this is
[Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/description/).

In this problem, you are required to find the maximum of a k-size sliding window
across the whole array. This can be done in O(n<sup>2</sup>) by brute force, but
can be done in O(n) with an intuitive monotonic deque solution. The motivation
for using a monotonic deque is that we can track the maximum in the current
window in O(1) time, which we can achieve by keeping the maximum value of the
window at the front of the deque (hence, monotonically decreasing). The key to
adhering to the sliding window concept is that at each iteration, we also prune
the front of the queue for any "expired" values.

```python
def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
  # monotonic decreasing deque
  dq = deque()
  res = []

  for i in range(len(nums)):
    # standard monotonic invariant
    while dq and nums[i] > nums[dq[-1]]:
      dq.pop()
    dq.append(i)

    # prune out-of-window elements
    if i - dq[0] >= k:
      dq.popleft()
    
    # incomplete window condition
    if i >= k - 1:
      res.append(nums[dq[0]])

  return res
```
