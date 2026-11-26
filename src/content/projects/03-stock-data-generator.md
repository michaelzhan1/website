---
title: Stock Data Generator
link: https://github.com/michaelzhan1/stock-data-generator
---

This was inspired by an interview question from a friend's team: given a stream
of stock data, design a system to query the max price in a recent time range. I
thought it would be fun to build a simple version of this and visualize it. The
Go backend simulates stock data with geometric brownian motion and serves it to
the frontend through SSE. The frontend uses a sliding-window max algorithm to
track the min and max prices in real time, with
[ChartGPU](https://github.com/ChartGPU/ChartGPU) for visualization.
