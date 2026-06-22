import 'https://cdn.plyr.io/3.8.4/plyr.js'
import { audio_error_handler } from './audio-error-handler.js'

const plyr_css = document.createElement("link")
plyr_css.rel = "stylesheet"
plyr_css.crossOrigin = true
plyr_css.href = 'https://cdn.plyr.io/3.8.4/plyr.css'
document.head.appendChild(plyr_css)

const create_videoelem_plyr = function(src, tags=null) {
  const player_raw = document.createElement("video")
  const dummy = document.createElement("div")
  dummy.appendChild(player_raw)

  const media_div = new Plyr(player_raw, {
    autoplay: true,
    title: (tags?.title || ""),
    keyboard: {focused: true}
  })
  player_raw.src = src
  player_raw.preload = "auto"
  
  const fec = dummy.firstElementChild
  fec.classList.add("video_player_box")
  fec.letsPlay = async () => { media_div.play() }
  fec.updateSrc = (src, tags) => { player_raw.src = src }
  fec.id = "MediaPlayer"

  return fec
}

const create_audioelem_plyr = function(src, tags=null) {
  const player_raw = document.createElement("audio")
  player_raw.addEventListener("error", audio_error_handler)
  const dummy = document.createElement("div")
  dummy.appendChild(player_raw)

  const media_div = new Plyr(player_raw, {
    autoplay: true,
    title: (tags?.title || ""),
    keyboard: {focused: true}
  })
  player_raw.src = src
  player_raw.preload = "auto"
  
  const fec = dummy.firstElementChild
  fec.letsPlay = async () => { media_div.play() }
  fec.updateSrc = (src, tags) => { player_raw.src = src }
  fec.id = "MediaPlayer"

  return fec
}

export {create_videoelem_plyr, create_audioelem_plyr}