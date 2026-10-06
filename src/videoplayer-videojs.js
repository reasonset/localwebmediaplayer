import 'https://cdn.jsdelivr.net/npm/@videojs/cdn@10.0.1/video.js'
import 'https://cdn.jsdelivr.net/npm/@videojs/cdn@10.0.1/audio.js'
import { audio_error_handler } from './audio-error-handler.js'

const create_videoelem_videojs = function(src, tags=null) {
  const player = document.createElement("video-player")
  const skin = document.createElement("video-skin")
  const video = document.createElement("video")
  video.src = src
  video.playsInline = true
  // skin.style = 'display: block; width: 100%; aspect-ratio: 16 / 9;'
  skin.classList.add("video_player_box")
  skin.appendChild(video)
  player.appendChild(skin)
  player.id = "MediaPlayer"
  player.classList.add("video_player_box")

  player.call_ended = callback => {
    video.addEventListener("ended", callback)
  }

  player.letsPlay = async function() {
    return video.play()
  }

  player.updateSrc = function(src, tags=null) {
    video.src = src
  }

  video.style = 'max-height: 70vh;'
  return player
}

const create_audioelem_videojs = function(src, tags=null) {
  const player = document.createElement("audio-player")
  const skin = document.createElement("audio-skin")
  const audio = document.createElement("audio")
  audio.src = src
  audio.playsInline = true
  audio.addEventListener("error", audio_error_handler)
  skin.appendChild(audio)
  player.appendChild(skin)
  player.id = "MediaPlayer"

  player.call_ended = callback => {
    audio.addEventListener("ended", callback)
  }

  player.letsPlay = async function() {
    return audio.play()
  }

  player.updateSrc = function(src, tags=null) {
    audio.src = src
  }

  return player
}

export {create_videoelem_videojs, create_audioelem_videojs}
