import {http} from '/httpclient.mjs'

var playlist = []
var currentState = {
  filelist: [],
  playlist_index: -1,
  mediatype: null,
  path: null,
  scroll_position: {},
  viewportX: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
  cover: null
}

const load_browser = async function(path) {
  let result
  try {
    result = await http.get("/mediaplay.rb", {query: {path}})
  } catch(e) {
    msg_show("HTTP Error")
  }
  currentState.filelist = result
  
  const filelist_div = document.createElement("div")
  filelist_div.id = "FileList"

  for (const i of result.directory) {
    const fi = document.createElement("div")
    fi.className = "file_item"
    fi.dataset.filePath = i.path
    const fii =  document.createElement("div")
    fii.className = "folder"
    const fiii = document.createElement("img")
    fiii.src = "/img/folder.svg"
    const fin = document.createElement("div")
    fin.className = "filename"
    const fint = document.createTextNode(i.path.replace(/.*\//, ""))
    fii.appendChild(fiii)
    fin.appendChild(fint)
    fi.appendChild(fii)
    fi.appendChild(fin)

    fi.addEventListener("click", e => {
      load_browser(e.currentTarget.dataset.filePath)
    })

    filelist_div.appendChild(fi)

  }

  for (const i of result.file) {
    const fi = document.createElement("div")
    fi.className = "file_item"
    fi.dataset.filePath = i.path
    fi.playlist = i.list
    fi.dataset.mediaType = i.type
    const fii =  document.createElement("div")
    fii.className = i.type
    const fiii = document.createElement("img")
    fiii.src = `/img/${i.type}.svg`
    const fin = document.createElement("div")
    fin.className = "filename"
    const fint = document.createTextNode(i.path.replace(/.*\//, ""))
    fii.appendChild(fiii)
    fin.appendChild(fint)
    fi.appendChild(fii)
    fi.appendChild(fin)

    fi.addEventListener("click", e => {
      file_click(e.currentTarget, i.type)
    })

    filelist_div.appendChild(fi)
  }

  const pathview = document.getElementById("CurrentPath")
  pathview.value = path

  if (currentState.path) {
    const current_position = window.scrollY
    currentState.scroll_position[currentState.path] = current_position
  }

  const l = document.getElementById("FileList")
  l.replaceWith(filelist_div)

  if (currentState.scroll_position[path] != null) {
    window.scrollTo({top: currentState.scroll_position[path]})
  }

  currentState.path = path

  currentState.cover = result.cover
}

const get_type_from_ext = function(path) {
  const ext = path.replace(/.*\./, "")
  if (["mp4", "mkv", "mov", "webm", "ogv"].includes(ext)) {
    return "video"
  } else if (["mp3", "ogg", "oga", "opus", "m4a", "aac", "flac", "wav"].includes(ext)) {
    return "music"
  } else {
    return "unknown"
  }
}

const set_playlist = function(type, pathes) {
  playlist = []
  const ple = document.createElement("div")
  ple.id = "PlayList"
  for (let i=0; i < pathes.length; i++) {
    let acttype = type || get_type_from_ext(pathes[i].replace(/.*\./, ""))
    playlist.push({
      path: pathes[i],
      index: i,
      type: acttype
    })
    const li = document.createElement("div")
    li.dataset.filePath = pathes[i]
    li.dataset.index = i
    const lit = document.createTextNode(pathes[i].replace(/.*\//, ""))
    li.appendChild(lit)
    ple.appendChild(li)

    li.addEventListener("click", e => {
      if (!type) {
        if (acttype === "video" || acttype === "music") {
          load_player(playlist[i], {keep_cover: true})
        } else {
          // skip playlist
          return
        }
      } else {
        load_player(playlist[i], {keep_cover: true})
      }
    })
  }

  const playlist_div = document.getElementById("PlayList")
  playlist_div.replaceWith(ple)
}

const load_player = function(playlist_item, options={}) {
  console.log(options)
  const type = playlist_item.type
  if (type === "unknown" ) {return}
  let media_div
  const sametype = currentState.mediatype == type
  if (sametype) {
    media_div = document.getElementById("MediaPlayer")
  } else {
    if (type === "music") {
      media_div = document.createElement("audio")
      media_div.id = "MediaPlayer"
      media_div.src = "/media/" + encodeURIComponent(playlist_item.path)
      media_div.controls = true
      media_div.preload = "auto"
      media_div.autoplay = "autoplay"

      // Set cover
      if (options.cover) {
        const imgdiv = document.createElement("div")
        imgdiv.id = "CoverImage"
        const coverimg = document.createElement("img")
        coverimg.src = "/media/" + options.cover
        imgdiv.appendChild(coverimg)
        document.getElementById("CoverImage").replaceWith(imgdiv)
      }
    } else if (type === "video") {
      media_div = document.createElement("video")
      media_div.id = "MediaPlayer"
      media_div.src = "/media/" + encodeURIComponent(playlist_item.path)
      media_div.controls = true
      media_div.preload = "auto"
      media_div.autoplay = "autoplay"
    }
  }
  currentState.playlist_index = playlist_item.index
  currentState.mediatype = type

  // Reset cover
  if (!options.keep_cover && !options.cover) {
    const imgdiv = document.createElement("div")
    imgdiv.id = "CoverImage"
    document.getElementById("CoverImage").replaceWith(imgdiv)
  }

  const listitems = document.getElementById("PlayList").getElementsByTagName("div")
  for (let i=0; i < listitems.length; i++) {
    if (i === playlist_item.index) {
      listitems[i].className = "current_playitem"
    } else {
      listitems[i].className = "noncurrent_playitem"
    }
  }



  if (sametype) {
    media_div.src = "/media/" + encodeURIComponent(playlist_item.path)
  } else {
    const player_div = document.getElementById("MediaPlayer")
    media_div.addEventListener("ended", e => {
      if (currentState.playlist_index + 1 < playlist.length) {
        load_player(playlist[currentState.playlist_index + 1], {keep_cover: true})
      } else {
        msg_show("Playback complete.")
      }
    })
    player_div.replaceWith(media_div)
  }
}

const file_click = function(target, type) {
  if (type === "list") {
    set_playlist(null, target.playlist)
    load_player(playlist[0])
    switch_player()
  } else {
    single_play(target.dataset.filePath, type)
  }
}

const single_play = function(path, type) {
  set_playlist(type, [path])
  load_player(playlist[0])
  switch_player()
}

const play_all_videos = function() {
  const list = []
  for (const i of currentState.filelist.file) {
    if (i.type === "video") {
      list.push(i.path)
    }
  }
  if (list.length < 1) {
    msg_show("No video on this directory.")
    return
  }
  set_playlist("video", list)
  load_player(playlist[0])
  switch_player()
}

const play_all_audio = function() {
  const list = []
  for (const i of currentState.filelist.file) {
    if (i.type === "music") {
      list.push(i.path)
    }
  }
  if (list.length < 1) {
    msg_show("No audio on this directory.")
    return
  }
  set_playlist("music", list)
  load_player(playlist[0], {cover: currentState.cover})
  switch_player()
}

const playlist_prev = function(e) {
  if (currentState.playlist_index > 0) {
    load_player(playlist[currentState.playlist_index - 1], {keep_cover: true})
  }
}

const playlist_next = function(e) {
  if (currentState.playlist_index < playlist.length) {
    load_player(playlist[currentState.playlist_index + 1], {keep_cover: true})
  }
}

const switch_player = function() {
  const browser = document.getElementById("Browser")
  const player = document.getElementById("Player")
  browser.style.display = "none"
  player.style.display = "block"
}

const switch_browser = function() {
  const browser = document.getElementById("Browser")
  const player = document.getElementById("Player")
  browser.style.display = "block"
  player.style.display = "none"
}

const msg_show = function(text) {
  const box = document.getElementById("MsgBox")
  box.innerText = text
  box.className = "msgshow"

  window.setTimeout(()=> {box.className = "msgtrans"}, 3000)
}

/**
 * Load initial location.
 */
window.addEventListener("load", e => {
  let initial_path = window.location.search.replace(/^\?/, "") || ""
  initial_path = decodeURIComponent(initial_path)
  load_browser(initial_path)
})

// Setup navigation button events

document.getElementById("ShowPlayer").addEventListener("click", e => { switch_player() })
document.getElementById("BackToBrowser").addEventListener("click", e => { switch_browser() })
document.getElementById("PlayAllVideos").addEventListener("click", e => { play_all_videos() })
document.getElementById("PlayAllAudio").addEventListener("click", e => { play_all_audio() })

document.getElementById("PlaylistNext").addEventListener("click", playlist_next)
document.getElementById("PlaylistPrev").addEventListener("click", playlist_prev)

const upelem = document.getElementById("UpParent")
upelem.addEventListener("click", e => {
  const pathview = document.getElementById("CurrentPath")
  const path = pathview.value.replace(/\/[^/]*$/, "")
  load_browser(path.includes("/") ? path : "")
})

//

// Setup resize event
window.addEventListener("resize", e => {
  const vpx = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  if (vpx != currentState.viewportX) {
    currentState.scroll_position = {}
    currentState.viewportX = vpx
  }
})
