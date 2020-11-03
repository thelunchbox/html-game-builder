# HTML Game Maker

## Development

1. Clone this repo
2. Run `npm i`
3. Run `npm start`
4. Navigate to `localhost:4000`

## Usage

### Setup

This code block will be run at the beginning of your game. Simply set up everything you need in the supplied `game` object for use in the other blocks.

### Click Event Handler

This code block will fire every time the canvas is clicked. The event only has the `x` and `y` location of the click.

### Update Loop

This code block will fire every 30 ms on a timer. It includes an object called `keys`, which contains all of the keys that are currently pressed down and which frame they were pressed on.

For example, if `keys.a` === `36` and `frame` === `36`, the `a` key has _just_ been pressed down. If `keys.b` === `30`, it has been held down for `6` frames. If `keys.c` === `-1`, it was _released_ on the current frame, and is no longer held down. It will be automatically removed from the keys object on the next update loop.

### Draw Loop

This code block will fire repeatedly every time the browser can provide an animation frame. You need to draw _everything_ in its current state, as the previous frame will be erased.

## Functions

### Save & Run

This will save your code blocks into local storage and restart your game.

### Export

This will save your code blocks to a file.

### Import

This will allow you to select a file to import into your code blocks.