# yt-player [![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url] [![javascript style guide][standard-image]][standard-url]

[travis-image]: https://img.shields.io/travis/feross/yt-player/master.svg
[travis-url]: https://travis-ci.org/feross/yt-player
[npm-image]: https://img.shields.io/npm/v/yt-player.svg
[npm-url]: https://npmjs.org/package/yt-player
[downloads-image]: https://img.shields.io/npm/dm/yt-player.svg
[downloads-url]: https://npmjs.org/package/yt-player
[standard-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standard-url]: https://standardjs.com

### Simple, robust, blazing-fast YouTube Player API

This package is used on [Play.cash](https://play.cash).

## Install

```
npm install yt-player
```

If you do not use a bundler, you can use the [standalone script](https://bundle.run/yt-player) directly in a `<script>` tag.

## Why this package?

Most of the existing YouTube API packages on npm are incomplete or overcomplicated.

Note: It is irresponsible to publish a package that requires all of
`babel-runtime`, `lodash`, and 20KB of other nonsense to do a simple task. Using
fancy dependencies doesn't make you a better programmer, and it's certainly not a
"best practice" to ship tons of extra code to your website visitors. Less is more.
🔥

## Features

  - Powered by the [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
  - Lightweight - only 3.14kb gzipped and minified!
  - Extremely fast time-to-first-frame
    - YouTube IFrame API `<script>` is automatically loaded on first use
    - For even faster start time, add `<script src='https://www.youtube.com/iframe_api' async></script>` to your page
    - Automatically detects the presence of the API `<script>` so API is never loaded twice
  - API commands are automatically queued (until both the Iframe API and Player instance are ready)
  - Differentiate between *fatal* errors and *unplayable video* errors
  - Adds the all-important 'timeupdate' event, which the YouTube API lacks
  - Well-commented codebase makes it easy to understand what's going on
  - No large dependencies or unused code
  - Note: no support for old browsers (e.g. IE11 and below)

## Usage

```js
const YTPlayer = require('yt-player')
const player = new YTPlayer('#player')

player.load('GKSRyLdjsPA')
player.setVolume(100)

player.on('playing', () => {
  console.log(player.getDuration()) // => 351.521
})
```

## API

### `player = new YTPlayer(element, [opts])`

Create a new YouTube player. The player will take the place of the HTML element
`element`. Alternatively, `element` can be a selector string, which will be passed
to `document.querySelector()`.

Examples: `#player`, `.youtube-player`, or a DOM node.

Optionally, provide an options object `opts` to customize the player.

#### `opts.width` (number)

This parameter indicates the width of the player.

#### `opts.height` (number)

This parameter indicates the height of the player.

#### `opts.autoplay` (boolean)

This parameter indicates whether the initial video will automatically start to play
when the player loads. The default value is `false`.

#### `opts.captions` (string/boolean)

This parameter indicates the language of the closed captions that should be
shown. The default behavior is based on user preference. The parameter value is
an [ISO 639-1 two-letter language
code](http://www.loc.gov/standards/iso639-2/php/code_list.php) or a fully
specified locale. Or, set to `false` to force captions to be disabled, ignoring
the user preference.

#### `opts.controls` (boolean)

This parameter indicates whether the video player controls are displayed. The
default value is `true`.

#### `opts.keyboard` (boolean)

This parameter indicates whether the player will respond to keyboard shortcuts. The
default value is `true`.

#### `opts.fullscreen` (boolean)

This parameter indicates whether the player will show a fullscreen button. The
default value is `true`.

#### `opts.annotations` (boolean)

This parameter indicates whether the player will show video annotations. The
default value is `true`.

#### `opts.modestBranding` (boolean)

This parameter lets you use a YouTube player that does not show a YouTube logo.
Even when this option is enabled, a small YouTube text label will still display in
the upper-right corner of a paused video when the user's mouse pointer hovers over
the player. The default value is `false`.

#### `opts.related` (boolean)

This parameter indicates whether the player should show related videos from the
same channel (`false`) or from any channel (`true`) when playback of the video
ends. The default value is `true`.

#### `opts.timeupdateFrequency` (number)

The time between `onTimeupdate` callbacks, in milliseconds. Default is `1000`.

See:
[`YT.Player` parameters](https://developers.google.com/youtube/iframe_api_reference#Loading_a_Video_Player)
and
[`playerVars` parameters](https://developers.google.com/youtube/player_parameters#Parameters)
for additional documentation about these parameters.

#### `opts.playsInline` (boolean)

This parameter controls whether videos play inline or fullscreen in an HTML5 player on iOS. Default is `true`.

#### `opts.start` (number)

This parameter causes the player to begin playing the video at the given number
of seconds from the start of the video. The parameter value is a positive integer.
Note that the player will look for the closest keyframe to the time you specify.
This means that sometimes the play head may seek to just before the requested time,
usually no more than around two seconds. Default is `0`.

#### `opts.host` (string)

This parameter controls the hostname that videos are loaded from. Set to `'https://www.youtube-nocookie.com'` for enhanced privacy. The default value is `'https://youtube.com'`.

### `player.load(videoId, [autoplay, [start]])`

This function loads the specified `videoId`. An example of a `videoId` is
`'GKSRyLdjsPA'`.

Optionally, specify an `autoplay` parameter to indicate whether the video should
begin playing immediately, or wait for a call to `player.play()`. Default is
`false`. The optional `start` parameter accepts a float/integer. If it is specified,
then the video will start from the closest keyframe to the specified time.

This should be the first function called on a new `Player` instance.

### `player.play()`

Plays the currently loaded video.

### `player.pause()`

Pauses the currently loaded video.

### `player.stop()`

Stops and cancels loading of the current video. This function should be reserved
for rare situations when you know that the user will not be watching additional
video in the player. If your intent is to pause the video, you should just call
`pause()`. If you want to change the video that the player is playing,
you can call `load()` without calling `stop()` first.

### `player.seek(seconds)`

Seeks to a specified time in the video. If the player is paused when the function
is called, it will remain paused. If the function is called from another state
(playing, video cued, etc.), the player will play the video. The player will
advance to the closest keyframe before that time unless the player has already
downloaded the portion of the video to which the user is seeking.

### `player.setVolume(volume)`

Sets the volume. Accepts an integer between `0` and `100`.

### `player.getVolume()`

Returns the player's current volume, an integer between `0` and `100`. Note that
`getVolume()` will return the volume even if the player is muted.

### `player.mute()`

Mutes the player.

### `player.unMute()`

Unmutes the player.

### `player.isMuted()`

Returns true if the player is muted, false if not.

### `player.setSize(width, height)`

Sets the size in pixels of the `<iframe>` that contains the player.

### `player.setPlaybackRate(rate)`

This function sets the suggested playback rate for the current video. If the
playback rate changes, it will only change for the video that is already being
played. Calling `load()` will reset the playback rate to 1.

### `player.setPlaybackQuality(suggestedQuality)`

This function sets the suggested video quality for the current video. The function causes the video to reload at its current position in the new quality. If the playback quality does change, it will only change for the video being played. Calling this function does not guarantee that the playback quality will actually change. However, if the playback quality does change, the `'playbackqualitychange'` event will fire, and your code should respond to the event rather than the fact that it called the `setPlaybackQuality` function.

The `suggestedQuality` parameter value can be `'small'`, `'medium'`, `'large'`, `'hd720'`, `'hd1080'`, `'highres'` or `'default'`. We recommend that you set the parameter value to `'default'`, which instructs YouTube to select the most appropriate playback quality, which will vary for different users, videos, systems and other playback conditions.

If you call the `setPlaybackQuality` function with a `suggestedQuality` level that is not available for the video, then the quality will be set to the next lowest level that is available. In addition, setting `suggestedQuality` to a value that is not a recognized quality level is equivalent to setting `suggestedQuality` to `'default'`.

### `player.getPlaybackRate()`

This function retrieves the playback rate of the currently playing video. The
default playback rate is `1`, which indicates that the video is playing at normal
speed. Playback rates may include values like `0.25`, `0.5`, `1`, `1.5`, and `2`.

### `player.getAvailablePlaybackRates()`

This function returns the set of playback rates in which the current video is
available. The default value is `1`, which indicates that the video is playing in
normal speed.

The function returns an array of numbers ordered from slowest to fastest playback
speed. Even if the player does not support variable playback speeds, the array
should always contain at least one value (`1`).

### `player.getDuration()`

Returns the duration in seconds of the currently playing video. Note that
`getDuration()` will return 0 until the video's metadata is loaded, which normally
happens just before the video starts playing.

### `player.getProgress()`

Returns a number between `0` and `1` that specifies the percentage of the video
that the player shows as buffered.

### `player.getState()`

Returns the state of the player. Possible values are: `'unstarted'`, `'ended'`,
`'playing'`, `'paused'`, `'buffering'`, or `'cued'`.

### `player.getCurrentTime()`

Returns the elapsed time in seconds since the video started playing.

### `player.destroy()`

Removes the `<iframe>` containing the player and cleans up all resources.

### `player.destroyed` (boolean)

Returns `true` if `destroy()` has been called on the player.

### `player.videoId` (string)

Returns the currently loaded video ID, i.e. what was passed to `load()`.

### `player.on('error', (err) => {})`

This event fires if a fatal error occurs in the player. This does not include
videos that fail to play, for whatever reason.

### `player.on('unplayable', (videoId) => {})`

This event fires if the YouTube player cannot play the given video. This is not a
fatal error. This event is reported separately from the `'error'` event so
there is an opportunity to play another video gracefully.

Possible reasons for this error:

- The video requested was not found. This error occurs when a video has been
  removed (for any reason) or has been marked as private.

- The owner of the requested video does not allow it to be played in embedded
  players.

- The request contains an invalid parameter value. For example, this error occurs
  if you specify a videoId that does not have 11 characters, or if the videoId contains invalid characters, such as exclamation points or asterisks.

### `player.on('timeupdate', (seconds) => {})`

This event fires when the time indicated by the `getCurrentTime()` method has been
updated.

### `player.on('unstarted', () => {})`
### `player.on('ended', () => {})`
### `player.on('playing', () => {})`
### `player.on('paused', () => {})`
### `player.on('buffering', () => {})`
### `player.on('cued', () => {})`

These events fire when the player enters the respective state. These event names
are the same as the possible return values from `player.getState()`.

When the player first loads a video, it will broadcast an `unstarted` event. When a
video is cued and ready to play, the player will broadcast a `cued` event.

### `player.on('playbackQualityChange', (quality) => {})`

This event fires whenever the video playback quality changes. Possible
values are: 'small', 'medium', 'large', 'hd720', 'hd1080', 'highres'.

### `player.on('playbackRateChange', (playbackRate) => {})`

This event fires whenever the video playback rate changes.

## License

MIT. Copyright (c) [Feross Aboukhadijeh](https://feross.org).
