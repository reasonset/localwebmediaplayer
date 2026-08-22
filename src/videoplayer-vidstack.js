import { VidstackPlayer, VidstackPlayerLayout } from 'https://cdn.vidstack.io/player'
import { audio_error_handler } from './audio-error-handler.js'

const css1 = document.createElement("link")
css1.rel = "stylesheet"
css1.href = "https://cdn.vidstack.io/player/theme.css"
const css2 = document.createElement("link")
css2.rel = "stylesheet"
css2.href = "https://cdn.vidstack.io/player/video.css"
const css3 = document.createElement("link")
css3.rel = "stylesheet"
css3.href = "https://cdn.vidstack.io/player/audio.css"
document.head.appendChild(css1)
document.head.appendChild(css2)
document.head.appendChild(css3)

const create_videoelem_vidstack = function(src, tags=null) {
  const player = document.createElement("media-player")
  player.setAttribute("keyTarget", "player")
  player.title = tags?.title
  player.src = src
  player.viewType = "video"
  const provider = document.createElement("media-provider")
  const layout = document.createElement("media-video-layout")
  player.appendChild(provider)
  player.appendChild(layout)
  player.id = "MediaPlayer"
  player.classList.add("video_player_box")

  let canPlay = false
  player.addEventListener("can-play", () => {
    canPlay = true
  })

  player.letsPlay = async function() {
    if (!canPlay) {
      await new Promise(resolve => {
        player.addEventListener("can-play", resolve, {once: true})
      })
    }
    return player.play()
  }
  player.handlePlay = player.play
  player.handlePause = player.pause
  player.updateSrc = function(src, tags=null) {
    canPlay = false
    player.title = tags?.title

    // Vidstack's bug: Vidstack don't remove src when src type is already known.
    provider.querySelector("audio")?.removeAttribute("src")

    player.src = src
  }
  player.call_ended = callback => {
    player.addEventListener("ended", callback)
  }
  return player
}

const create_audioelem_vidstack = function(src, tags=null) {
  const player = document.createElement("media-player")
  player.title = tags?.title
  player.src = src
  player.viewType = "audio"
  const provider = document.createElement("media-provider")
  const layout = document.createElement("media-audio-layout")
  player.appendChild(provider)
  player.appendChild(layout)
  player.id = "MediaPlayer"
  player.addEventListener("error", e => {
    const currentSrc = player.currentSrc?.src ?? (typeof player.src === "string" ? player.src : player.src?.src)
    audio_error_handler({target: {error: e.detail, src: currentSrc }})
  })

  let canPlay = false
  player.addEventListener("can-play", () => {
    canPlay = true
  })

  player.letsPlay = async function() {
    if (!canPlay) {
      await new Promise(resolve => {
        player.addEventListener("can-play", resolve, {once: true})
      })
    }
    return player.play()
  }
  player.handlePlay = player.play
  player.handlePause = player.pause
  player.updateSrc = function(src, tags=null) {
    canPlay = false
    player.title = tags?.title

    // Vidstack's bug: Vidstack don't remove src when src type is already known.
    provider.querySelector("audio")?.removeAttribute("src")

    player.src = src
  }
  player.call_ended = callback => {
    player.addEventListener("ended", callback)
  }
  return player
}

export {create_videoelem_vidstack, create_audioelem_vidstack}
