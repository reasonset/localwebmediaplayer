import {http} from '/httpclient.mjs'

var playlist = []
var currentState = {
  filelist: [],
  playlist_index: -1,
  mediatype: null
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
      single_play(e.currentTarget.dataset.filePath, i.type)
    })

    filelist_div.appendChild(fi)
  }

  const pathview = document.getElementById("CurrentPath")
  pathview.value = path

  const l = document.getElementById("FileList")
  l.replaceWith(filelist_div)
}

const set_playlist = function(pathes) {
  playlist = []
  const ple = document.createElement("div")
  ple.id = "PlayList"
  for (let i=0; i < pathes.length; i++) {
    playlist.push({
      path: pathes[i],
      index: i
    })
    const li = document.createElement("div")
    li.dataset.filePath = pathes[i]
    li.dataset.index = i
    const lit = document.createTextNode(pathes[i].replace(/.*\//, ""))
    li.appendChild(lit)
    ple.appendChild(li)

    li.addEventListener("click", e => {
      load_player(currentState.mediatype, playlist[i])
    })
  }

  const playlist_div = document.getElementById("PlayList")
  playlist_div.replaceWith(ple)
}

const load_player = function(type, path) {
  let media_div
  if (type === "music") {
    media_div = document.createElement("audio")
    media_div.id = "MediaPlayer"
    media_div.src = "/media/" + path.path
    media_div.controls = true
    media_div.preload = "auto"
    media_div.autoplay = "true"
  } else if (type === "video") {
    media_div = document.createElement("video")
    media_div.id = "MediaPlayer"
    media_div.src = "/media/" + path.path
    media_div.controls = true
    media_div.preload = "auto"
    media_div.autoplay = "true"
  }
  currentState.playlist_index = path.index
  currentState.mediatype = type

  const listitems = document.getElementById("PlayList").getElementsByTagName("div")
  for (let i=0; i < listitems.length; i++) {
    if (i === path.index) {
      listitems[i].className = "current_playitem"
    } else {
      listitems[i].className = "noncurrent_playitem"
    }
  }

  media_div.addEventListener("ended", e => {
    if (path.index < playlist.length) {
      load_player(type, playlist[path.index + 1])
    }
  })

  const player_div = document.getElementById("MediaPlayer")
  player_div.replaceWith(media_div)
}

const single_play = function(path, type) {
  set_playlist([path])
  load_player(type, playlist[0])
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
  set_playlist(list)
  load_player("video", playlist[0])
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
  set_playlist(list)
  load_player("music", playlist[0])
  switch_player()
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

window.addEventListener("load", e => {
  load_browser(".")
})

document.getElementById("ShowPlayer").addEventListener("click", e => { switch_player() })
document.getElementById("BackToBrowser").addEventListener("click", e => { switch_browser() })
document.getElementById("PlayAllVideos").addEventListener("click", e => { play_all_videos() })
document.getElementById("PlayAllAudio").addEventListener("click", e => { play_all_audio() })

const upelem = document.getElementById("UpParent")
upelem.addEventListener("click", e => {
  const pathview = document.getElementById("CurrentPath")
  const path = pathview.value.replace(/\/[^/]*$/, "")
  load_browser(path)
})