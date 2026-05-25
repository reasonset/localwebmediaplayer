import { VidstackPlayer, VidstackPlayerLayout } from 'https://cdn.vidstack.io/player'

const create_videoelem_vidstack = function(src, tags=null) {
  const player = document.createElement("media-player")
  player.title = tags?.title
  player.src = src
  const provider = document.createElement("media-provider")
  const layout = document.createElement("media-video-layout")
  player.appendChild(provider)
  player.appendChild(layout)
  player.id = "MediaPlayer"
  player.classList.add("video_player_box")

  player.letsPlay = async function() {
    if (!player.setAttribute.canPlay) {
      await new Promise(resolve => {
        player.addEventListener("can-play", resolve, {once: true})
      })
    }
    return player.play()
  }
  player.updateSrc = function(src, tags=null) {
    player.title = tags?.title
    player.src = src
  }
  return player
}

export {create_videoelem_vidstack}