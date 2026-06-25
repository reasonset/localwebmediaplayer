import 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js'

const create_videoelem_fluid = function(src, tags=null) {
  const player_raw = document.createElement("video")
  player_raw.src = src
  const dummy = document.createElement("div")
  dummy.appendChild(player_raw)

  const media_div = fluidPlayer(
    player_raw,	{
    "layoutControls": {
      "controlBar": {
        "autoHideTimeout": 3,
        "animated": true,
        "autoHide": true
      },
      "htmlOnPauseBlock": {
        "html": null,
        "height": null,
        "width": null
      },
      "autoPlay": true,
      "mute": false,
      "allowTheatre": false,
      "playPauseAnimation": true,
      "playbackRateEnabled": true,
      "allowDownload": false,
      "playButtonShowing": true,
      "fillToContainer": true,
      "posterImage": ""
    },
    "vastOptions": {
      "adList": [],
      "adCTAText": false,
      "adCTATextPosition": ""
    }
  })
  
  const fec = dummy.firstElementChild
  fec.classList.add("video_player_box")
  fec.letsPlay = async () => { media_div.play() }
  fec.handlePlay = async () => { media_div.play() }
  fec.handlePause = async () => { media_div.pause() }
  fec.updateSrc = (src, tags) => { player_raw.src = src }
  fec.id = "MediaPlayer"

  return fec
}

export {create_videoelem_fluid}