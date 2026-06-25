import Vlitejs from 'https://cdn.jsdelivr.net/npm/vlitejs@8'
import VlitejsVolumeBar from 'https://cdn.jsdelivr.net/npm/vlitejs@8/dist/plugins/volume-bar.js'
import VlitejsHotkeys from 'https://cdn.jsdelivr.net/npm/vlitejs@8/dist/plugins/hotkeys.js'
import { audio_error_handler } from './audio-error-handler.js'

const css3 = document.createElement("link")
css3.rel = "stylesheet"
css3.href = "https://cdn.jsdelivr.net/npm/vlitejs@6/dist/vlite.css"
css3.crossOrigin = true
document.head.appendChild(css3)

Vlitejs.registerPlugin("volume-bar", VlitejsVolumeBar)
Vlitejs.registerPlugin('hotkeys', VlitejsHotkeys, {
	seekStep: 5,
	volumeStep: 0.2
})

const volume_bar_css = document.createElement("link")
volume_bar_css.rel = "stylesheet"
volume_bar_css.crossOrigin = true
volume_bar_css.href = 'https://cdn.jsdelivr.net/npm/vlitejs@8/dist/plugins/volume-bar.css'

document.head.appendChild(volume_bar_css)

const create_videoelem_vlitejs = function(src, tags=null) {
  const player_raw = document.createElement("video")
  const dummy = document.createElement("div")
  dummy.appendChild(player_raw)

  const media_div = new Vlitejs(player_raw, {
    options: {
      volume: true,
      autoHide: true,
    },
    plugins: ["volume-bar", "hotkeys"]
  })
  player_raw.src = src
  player_raw.preload = "auto"
  
  const fec = dummy.firstElementChild
  fec.classList.add("video_player_box")
  fec.letsPlay = async () => { void 0 } // Not good work script control play
  fec.handlePlay = async () => { void 0 }
  fec.handlePause = async () => { void 0 }
  fec.updateSrc = (src, tags) => { player_raw.src = src }
  fec.id = "MediaPlayer"

  return fec
}

const create_audioelem_vlitejs = function(src, tags=null) {
  const player_raw = document.createElement("audio")
  player_raw.addEventListener("error", audio_error_handler)
  const dummy = document.createElement("div")
  dummy.appendChild(player_raw)

  const media_div = new Vlitejs(player_raw, {
    options: {
      volume: true,
      autoHide: false,
    },
    plugins: ["volume-bar"]
  })
  player_raw.src = src
  player_raw.preload = "auto"
  
  const fec = dummy.firstElementChild
  fec.letsPlay = async () => { void 0 } // Not good work script control play
  fec.handlePlay = async () => { void 0 }
  fec.handlePause = async () => { void 0 }
  fec.updateSrc = (src, tags) => { player_raw.src = src }
  fec.id = "MediaPlayer"
  fec.classList.add("vlitejs-audio-box")

  return fec
}

export {create_videoelem_vlitejs, create_audioelem_vlitejs}