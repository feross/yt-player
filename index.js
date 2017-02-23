const EventEmitter = require('events').EventEmitter
const loadScript = require('load-script2')

const YOUTUBE_IFRAME_API_SRC = 'https://www.youtube.com/iframe_api'

const YOUTUBE_STATES = {
  '-1': 'unstarted',
  '0': 'ended',
  '1': 'playing',
  '2': 'paused',
  '3': 'buffering',
  '5': 'cued'
}

const YOUTUBE_ERROR = {
  // The request contains an invalid parameter value. For example, this error
  // occurs if you specify a videoId that does not have 11 characters, or if the
  // videoId contains invalid characters, such as exclamation points or asterisks.
  INVALID_PARAM: 2,

  // The requested content cannot be played in an HTML5 player or another error
  // related to the HTML5 player has occurred.
  HTML5_ERROR: 5,

  // The video requested was not found. This error occurs when a video has been
  // removed (for any reason) or has been marked as private.
  NOT_FOUND: 100,

  // The owner of the requested video does not allow it to be played in embedded
  // players.
  UNPLAYABLE_1: 101,

  // This error is the same as 101. It's just a 101 error in disguise!
  UNPLAYABLE_2: 150
}

/**
 * YouTube Player. Exposes a better API, with nicer events.
 * @param {selector|HTMLElement} node
 */
class YouTubePlayer extends EventEmitter {
  constructor (selector, opts) {
    super()

    this.node = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector

    this._opts = Object.assign({
      autoplay: false,
      captions: undefined,
      controls: true,
      keyboard: true,
      fullscreen: true,
      annotations: true,
      modestBranding: false,
      related: true,
      info: true,
      timeupdateFrequency: 1000
    }, opts)

    this.videoId = null
    this.destroyed = false

    this._api = null
    this._player = null
    this._playerReady = false
    this._queue = []

    this._interval = null

    // Setup listeners for 'timeupdate' events. The YouTube Player does not fire
    // 'timeupdate' events, so they are simulated using a setInterval().
    this._startIntervalBound = () => this._startInterval()
    this._stopIntervalBound = () => this._stopInterval()

    this.on('playing', this._startIntervalBound)
    this.on('paused', this._stopIntervalBound)
    this.on('buffering', this._stopIntervalBound)
    this.on('unstarted', this._stopIntervalBound)
    this.on('ended', this._stopIntervalBound)

    loadIframeAPI((err, api) => {
      if (err) return this._destroy(new Error('YouTube Iframe API failed to load'))
      this._api = api

      // If load(videoId) was called before Iframe API loaded, ensure it gets
      // called again now
      if (this.videoId) this.load(this.videoId)
    })
  }

  load (videoId) {
    if (this.destroyed) return

    this.videoId = videoId

    // If the Iframe API is not ready yet, do nothing. Once the Iframe API is
    // ready, `load(this.videoId)` will be called.
    if (!this._api) return

    // If there is no player instance, create one.
    if (!this._player) {
      this._createPlayer(videoId)
      return
    }

    // If the player instance is not ready yet, do nothing. Once the player
    // instance is ready, `load(this.videoId)` will be called. This ensures that
    // the last call to `load()` is the one that takes effect.
    if (!this._playerReady) return

    // If the player instance is ready, load the given `videoId`.
    this._player.loadVideoById(videoId)
  }

  play () {
    if (this.destroyed) return

    if (this._playerReady) {
      this._player.playVideo()
    } else {
      this._queueCommand('play')
    }
  }

  pause () {
    if (this.destroyed) return

    if (this._playerReady) {
      this._player.pauseVideo()
    } else {
      this._queueCommand('pause')
    }
  }

  seek (seconds, allowSeekAhead) {
    if (this.destroyed) return

    if (this._playerReady) {
      this._player.seekTo(seconds, allowSeekAhead)
    } else {
      this._queueCommand('seek', seconds, allowSeekAhead)
    }
  }

  setVolume (volume) {
    if (this.destroyed) return

    if (this._playerReady) {
      this._player.setVolume(volume)
    } else {
      this._queueCommand('setVolume', volume)
    }
  }

  getDuration () {
    if (this._playerReady) {
      return this._player.getDuration() || 0
    } else {
      return 0
    }
  }

  getCurrentTime () {
    if (this._playerReady) {
      return this._player.getCurrentTime() || 0
    } else {
      return 0
    }
  }

  getState () {
    if (this._playerReady) {
      return YOUTUBE_STATES[this._player.getPlayerState()] || 'unstarted'
    } else {
      return 'unstarted'
    }
  }

  destroy () {
    this._destroy()
  }

  _destroy (err) {
    this.destroyed = true

    if (this._player) {
      this._player.stopVideo()
      this._player.destroy()
    }

    this._opts = null

    this.node = null
    this.videoId = null

    this._api = null
    this._player = null
    this._playerReady = false
    this._queue = null

    this._stopInterval()
    this._interval = false

    this.removeListener('playing', this._startIntervalBound)
    this.removeListener('paused', this._stopIntervalBound)
    this.removeListener('buffering', this._stopIntervalBound)
    this.removeListener('unstarted', this._stopIntervalBound)
    this.removeListener('ended', this._stopIntervalBound)

    this._startIntervalBound = null
    this._stopIntervalBound = null

    if (err) this.emit('error', err)
  }

  _queueCommand (command, ...args) {
    this._queue.push([command, args])
  }

  _flushQueue () {
    while (this._queue.length) {
      const command = this._queue.shift()
      this[command[0]].apply(this, command[1])
    }
  }

  _createPlayer (videoId) {
    if (this.destroyed) return

    const opts = this._opts

    this._player = new this._api.Player(this.node, {
      width: opts.width || 640,
      height: opts.height || 360,
      videoId: videoId,
      playerVars: {
        // This parameter specifies whether the initial video will automatically
        // start to play when the player loads. Supported values are 0 or 1. The
        // default value is 0.
        autoplay: opts.autoplay ? 1 : 0,

        // Setting the parameter's value to 1 causes closed captions to be shown
        // by default, even if the user has turned captions off. The default
        // behavior is based on user preference.
        cc_load_policy: opts.captions != null
          ? opts.captions ? 1 : 0
          : undefined, // default to not setting this option

        // This parameter indicates whether the video player controls are
        // displayed. For IFrame embeds that load a Flash player, it also defines
        // when the controls display in the player as well as when the player
        // will load. Supported values are:
        //   - controls=0 – Player controls do not display in the player. For
        //                  IFrame embeds, the Flash player loads immediately.
        //   - controls=1 – (default) Player controls display in the player. For
        //                  IFrame embeds, the controls display immediately and
        //                  the Flash player also loads immediately.
        //   - controls=2 – Player controls display in the player. For IFrame
        //                  embeds, the controls display and the Flash player
        //                  loads after the user initiates the video playback.
        controls: opts.controls ? 2 : 0,

        // Setting the parameter's value to 1 causes the player to not respond to
        // keyboard controls. The default value is 0, which means that keyboard
        // controls are enabled.
        disablekb: opts.keyboard ? 0 : 1,

        //  Setting the parameter's value to 1 enables the player to be
        //  controlled via IFrame or JavaScript Player API calls. The default
        //  value is 0, which means that the player cannot be controlled using
        //  those APIs.
        enablejsapi: 1,

        // Setting this parameter to 0 prevents the fullscreen button from
        // displaying in the player. The default value is 1, which causes the
        // fullscreen button to display.
        fs: opts.fullscreen ? 1 : 0,

        // Setting the parameter's value to 1 causes video annotations to be
        // shown by default, whereas setting to 3 causes video annotations to not
        // be shown by default. The default value is 1.
        iv_load_policy: opts.annotations ? 1 : 3,

        // This parameter lets you use a YouTube player that does not show a
        // YouTube logo. Set the parameter value to 1 to prevent the YouTube logo
        // from displaying in the control bar. Note that a small YouTube text
        // label will still display in the upper-right corner of a paused video
        // when the user's mouse pointer hovers over the player.
        modestbranding: 1,

        // This parameter provides an extra security measure for the IFrame API
        // and is only supported for IFrame embeds. If you are using the IFrame
        // API, which means you are setting the enablejsapi parameter value to 1,
        // you should always specify your domain as the origin parameter value.
        origin: window.location.host,

        // This parameter controls whether videos play inline or fullscreen in an
        // HTML5 player on iOS. Valid values are:
        //   - 0: This value causes fullscreen playback. This is currently the
        //        default value, though the default is subject to change.
        //   - 1: This value causes inline playback for UIWebViews created with
        //        the allowsInlineMediaPlayback property set to TRUE.
        playsinline: 1,

        // This parameter indicates whether the player should show related videos
        // when playback of the initial video ends. Supported values are 0 and 1.
        // The default value is 1.
        rel: opts.related ? 1 : 0,

        // Supported values are 0 and 1. Setting the parameter's value to 0
        // causes the player to not display information like the video title and
        // uploader before the video starts playing. If the player is loading a
        // playlist, and you explicitly set the parameter value to 1, then, upon
        // loading, the player will also display thumbnail images for the videos
        // in the playlist. Note that this functionality is only supported for
        // the AS3 player.
        showinfo: opts.info ? 1 : 0,

        // (Not part of documented API) Allow html elements with higher z-index
        // to be shown on top of the YouTube player.
        wmode: 'opaque'
      },
      events: {
        onReady: () => this._onReady(videoId),
        onStateChange: (data) => this._onStateChange(data),
        onPlaybackQualityChange: (data) => this._onPlaybackQualityChange(data),
        onPlaybackRateChange: (data) => this._onPlaybackRateChange(data),
        onError: (data) => this._onError(data)
      }
    })
  }

  /**
   * This event fires when the player has finished loading and is ready to begin
   * receiving API calls.
   */
  _onReady (videoId) {
    if (this.destroyed) return

    this._playerReady = true

    // If the videoId that was loaded is not the same as `this.videoId`, then
    // `load()` was called twice before `onReady` fired. Just call
    // `load(this.videoId)` to load the right videoId.
    if (videoId !== this.videoId) {
      this.load(this.videoId)
    }

    this._flushQueue()
  }

  /**
   * Called when the player's state changes. We emit friendly events so the user
   * doesn't need to use YouTube's YT.PlayerState.* event constants.
   */
  _onStateChange (data) {
    if (this.destroyed) return

    const state = YOUTUBE_STATES[data.data]

    if (state) {
      this.emit(state)
    } else {
      console.error('Unrecognized state change', data)
    }
  }

  /**
   * This event fires whenever the video playback quality changes. Possible
   * values are: 'small', 'medium', 'large', 'hd720', 'hd1080', 'highres'.
   */
  _onPlaybackQualityChange (data) {
    if (this.destroyed) return
    this.emit('playbackQualityChange', data.data)
  }

  /**
   * This event fires whenever the video playback rate changes.
   */
  _onPlaybackRateChange (data) {
    if (this.destroyed) return
    this.emit('playbackRateChange', data.data)
  }

  /**
   * This event fires if an error occurs in the player.
   */
  _onError (data) {
    if (this.destroyed) return

    const code = data.data

    // The HTML5_ERROR error occurs when the YouTube player needs to switch from
    // HTML5 to Flash to show an ad. Ignore it.
    if (code === YOUTUBE_ERROR.HTML5_ERROR) return

    // The remaining error types occur when the YouTube player cannot play the
    // given video. This is not a fatal error. Report it as unplayable so the user
    // has an opportunity to play another video.
    if (code === YOUTUBE_ERROR.UNPLAYABLE_1 ||
        code === YOUTUBE_ERROR.UNPLAYABLE_2 ||
        code === YOUTUBE_ERROR.NOT_FOUND ||
        code === YOUTUBE_ERROR.INVALID_PARAM) {
      return this.emit('unplayable', this.videoId)
    }

    // Unexpected error, does not match any known type
    this._destroy(new Error('YouTube Player Error. Unknown error code: ' + code))
  }

  /**
   * This event fires when the time indicated by the `getCurrentTime()` method
   * has been updated.
   */
  _onTimeupdate () {
    this.emit('timeupdate', this.getCurrentTime())
  }

  _startInterval () {
    this._interval = setInterval(() => this._onTimeupdate(), this._opts.timeupdateFrequency)
    this._onTimeupdate()
  }

  _stopInterval () {
    clearInterval(this._interval)
    this._interval = null
  }
}

const loadIframeAPICallbacks = []

function loadIframeAPI (cb) {
  // If API is loaded, there is nothing else to do
  if (window.YT && typeof window.YT.Player === 'function') {
    return cb(null, window.YT)
  }

  // Otherwise, queue callback until API is loaded
  loadIframeAPICallbacks.push(cb)

  const scripts = Array.from(document.getElementsByTagName('script'))
  const isLoading = scripts.some(script => script.src === YOUTUBE_IFRAME_API_SRC)

  // If API <script> tag is not present in the page, inject it. Ensures that
  // if user includes a hardcoded <script> tag in HTML for performance, another
  // one will not be added
  if (!isLoading) {
    loadScript(YOUTUBE_IFRAME_API_SRC, (err) => {
      if (err) {
        while (loadIframeAPICallbacks.length) {
          const loadCb = loadIframeAPICallbacks.shift()
          loadCb(err)
        }
      }
    })
  }

  // If ready function is not present, create it
  if (typeof window.onYouTubeIframeAPIReady !== 'function') {
    window.onYouTubeIframeAPIReady = () => {
      while (loadIframeAPICallbacks.length) {
        const loadCb = loadIframeAPICallbacks.shift()
        loadCb(null, window.YT)
      }
    }
  }
}

module.exports = YouTubePlayer
