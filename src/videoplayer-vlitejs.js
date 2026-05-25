import Vlitejs from 'https://cdn.jsdelivr.net/npm/vlitejs@8'
import VlitejsVolumeBar from 'https://cdn.jsdelivr.net/npm/vlitejs@8/dist/plugins/volume-bar.js'
import VlitejsHotkeys from 'https://cdn.jsdelivr.net/npm/vlitejs@8/dist/plugins/hotkeys.js'

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
  fec.updateSrc = (src, tags) => { player_raw.src = src }
  fec.id = "MediaPlayer"

  return fec
}

export {create_videoelem_vlitejs}