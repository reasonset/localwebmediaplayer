import { http } from '/httpclient.mjs'
import { audio_error_handler } from './audio-error-handler.js'
import { msg_show } from './msgwindow.js'
import { currentState } from './current_state.js'

const mediaURI = function (path) {
  const origin = "/media/" + path.split("/").map(encodeURIComponent).join("/")
  if (currentState.transcode[origin]) {
    return currentState.transcode[origin]
  } else {
    return origin
  }
}

const thumbURI = function (path) {
  return "/transcode/thumb/" + path.split("/").map(encodeURIComponent).join("/") + ".thumb.webp"
}

// Lazy image load observer
const thumbnailObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target
      if (img.dataset.thumbnail) {
        const thumb = img.dataset.thumbnail
        const temp_img = new Image()
        temp_img.onload = () => {
          img.src = thumb
          img.className = "thumbnail"
        }
        temp_img.onerror = () => {
          console.warn('Thumbnail load failed for:', thumb)
        }
        temp_img.src = thumb
      }
      observer.unobserve(img)
    }
  })
}, {})

const setupSystemInfo = function(env) {
  currentState.systemInfo = env
  document.title = env.server_name + " - Local Web Media Player"

  // Video Player setup
  switch (env.videoplayer) {
    case "vidstack":
      import("/videoplayer-vidstack.js").then(mod => {
        create_videoelem = mod.create_videoelem_vidstack
      })
      break
    case "vlitejs":
      import("/videoplayer-vlitejs.js").then(mod => {
        create_videoelem = mod.create_videoelem_vlitejs
      })
      break
    case "plyr":
      import("/videoplayer-plyr.js").then(mod => {
        create_videoelem = mod.create_videoelem_plyr
      })
      break
    case "fluid":
      import("/videoplayer-fluid.js").then(mod => {
        create_videoelem = mod.create_videoelem_fluid
      })
      break
    default:
      void 0
  }

  // Audio Player setup
  switch (env.audioplayer) {
    case "vidstack":
      import("/videoplayer-vidstack.js").then(mod => {
        create_audioelem = mod.create_audioelem_vidstack
      })
      break
    case "vlitejs":
      import("/videoplayer-vlitejs.js").then(mod => {
        create_audioelem = mod.create_audioelem_vlitejs
      })
      break
    case "plyr":
      import("/videoplayer-plyr.js").then(mod => {
        create_audioelem = mod.create_audioelem_plyr
      })
      break
    default:
      void 0
  }

  // Get transcode data list
  getTranscodeInfo()
}

const getTranscodeInfo = async function() {
  try {
    const result = await http.get("/info/transcode_meta.json")
    currentState.transcode = result
  } catch(e) {
    void 0
  }
}

const load_browser = async function(path) {
  let result
  try {
    const query = {path}
    if (!currentState.systemInfo) {
      query.info = "true"
    }
    result = await http.get("/mediaplay.rb", {query})
  } catch(e) {
    msg_show("HTTP Error", "err")
    return
  }
  currentState.filelist = result
  build_imglist()
  thumbnailObserver.disconnect()

  if (result.environment) {
    setupSystemInfo(result.environment)
  }

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
    fiii.className = "svgicon"
    const fin = document.createElement("div")
    fin.className = "filename"
    const fint = document.createTextNode(i.path.replace(/.*\//, ""))
    fii.appendChild(fiii)
    fin.appendChild(fint)
    fi.appendChild(fii)
    fi.appendChild(fin)

    fi.addEventListener("click", e => {
      load_browser_with_state(e.currentTarget.dataset.filePath)
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
    if (currentState.systemInfo.use_thumbnail && i.thumbnail && ["video", "music", "image"].includes(i.type)) {
      fiii.dataset.thumbnail = thumbURI(i.path)
      fiii.className = "svgicon lazy-thumb"
    } else {
      fiii.className = "svgicon"
    }
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

  filelist_div.querySelectorAll('.lazy-thumb').forEach(el => {
    thumbnailObserver.observe(el)
  })

  if (currentState.scroll_position[path] != null) {
    window.scrollTo({top: currentState.scroll_position[path]})
  }

  currentState.path = path

  currentState.cover = result.cover
}

const load_browser_with_state = function(path) {
  history.pushState({
    lwmp: true,
    type: "browser",
    path
  }, "")
  load_browser(path)
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

const create_videoelem_vanilla = function(src, tags=null) {
  const media_div = document.createElement("video")
  media_div.id = "MediaPlayer"
  media_div.classList.add("video_player_box")
  media_div.src = src
  media_div.controls = true
  media_div.preload = "auto"
  media_div.letsPlay = media_div.play
  media_div.handlePlay = media_div.play
  media_div.handlePause = media_div.pause
  media_div.updateSrc = (src, tags) => { media_div.src = src }
  media_div.call_ended = callback => {
    media_div.addEventListener("ended", callback)
  }
  return media_div
}

const create_audioelem_vanilla = function(src, tags=null) {
  const media_div = document.createElement("audio")
  media_div.id = "MediaPlayer"
  media_div.src = src
  media_div.controls = true
  media_div.preload = "auto"
  media_div.letsPlay = media_div.play
  media_div.handlePlay = media_div.play
  media_div.handlePause = media_div.pause
  media_div.updateSrc = (src, tags) => { media_div.src = src }
  media_div.addEventListener("error", audio_error_handler)
  media_div.call_ended = callback => {
    media_div.addEventListener("ended", callback)
  }
  return media_div
}

var create_videoelem = create_videoelem_vanilla
var create_audioelem = create_audioelem_vanilla

const update_trackcontrol = function() {
  navigator.mediaSession?.setActionHandler('nexttrack', (currentState.playlist[currentState.playlist_index + 1]) ? (e => {
    playlist_next()
  }) : null)

  navigator.mediaSession?.setActionHandler('previoustrack', (currentState.playlist_index > 0) ? (e => {
    playlist_prev()
  }) : null)
}

const enblae_playcontrol = function() {
  navigator.mediaSession?.setActionHandler('play', e => {
    const media_div = document.getElementById("MediaPlayer")
    media_div.handlePlay()
  })

  navigator.mediaSession?.setActionHandler('pause', e => {
    const media_div = document.getElementById("MediaPlayer")
    media_div.handlePause()
  })
}

const disable_playcontrol = function() {
  navigator.mediaSession?.setActionHandler('play', null)
  navigator.mediaSession?.setActionHandler('pause', null)
  navigator.mediaSession?.setActionHandler('nexttrack', null)
  navigator.mediaSession?.setActionHandler('previoustrack', null)
}

const set_playlist = async function(type, pathes) {
  currentState.playlist = []
  const ple = document.createElement("div")
  ple.id = "PlayList"
  if (currentState.systemInfo.use_metadata) {
    const missing_metadata = []
    for (let i=0; i < pathes.length; i++) {
      if (!currentState.metadata[pathes[i]]) {
        missing_metadata.push(pathes[i])
      }
    }
    if (missing_metadata.length > 0) {
      show_progress()
      const meta_result = await http.post("/metadata.rb", missing_metadata)
      for (const k in meta_result) {
        currentState.metadata[k] = meta_result[k]
      }
    }
  }
  for (let i=0; i < pathes.length; i++) {
    let acttype = type || get_type_from_ext(pathes[i].replace(/.*\./, ""))
    currentState.playlist.push({
      path: pathes[i],
      index: i,
      type: acttype,
      metadata: currentState.metadata[pathes[i]]
    })
    const li = document.createElement("div")
    li.dataset.filePath = pathes[i]
    li.dataset.index = i
    const lit = document.createTextNode(
      currentState.metadata[pathes[i]]?.tags?.title ? (currentState.metadata[pathes[i]].tags.title + (currentState.metadata[pathes[i]]?.tags?.artist ? ` - ${currentState.metadata[pathes[i]].tags.artist}` : "")) : pathes[i].replace(/.*\//, "")
    )
    li.appendChild(lit)
    ple.appendChild(li)

    li.addEventListener("click", e => {
      if (!type) {
        if (acttype === "video" || acttype === "music") {
          load_player(currentState.playlist[i], {keep_cover: true})
        } else {
          // skip playlist
          return
        }
      } else {
        load_player(currentState.playlist[i], {keep_cover: true})
      }
    })
  }

  const playlist_div = document.getElementById("PlayList")
  playlist_div.replaceWith(ple)
}

const load_player = function(playlist_item, options={}) {
  const type = playlist_item.type
  let cover_url
  if (type === "unknown" ) {return}
  let media_div
  const sametype = currentState.mediatype == type
  if (sametype) {
    media_div = document.getElementById("MediaPlayer")
  } else {
    if (type === "music") {
      media_div = create_audioelem(mediaURI(playlist_item.path), currentState.metadata[playlist_item.path]?.tags)
      // media_div.autoplay = "autoplay"
    } else if (type === "video") {
      media_div = create_videoelem(mediaURI(playlist_item.path), currentState.metadata[playlist_item.path]?.tags)
      // media_div.autoplay = "autoplay"
    }
  }
  currentState.playlist_index = playlist_item.index
  currentState.mediatype = type

  // Set cover
  cover_url = currentState.metadata[playlist_item.path]?.tags?.artwork?.[0]?.src || (options.cover && mediaURI(options.cover))
  if (cover_url) {
    const imgdiv = document.createElement("div")
    imgdiv.id = "CoverImage"
    const coverimg = document.createElement("img")
    coverimg.src = cover_url
    imgdiv.appendChild(coverimg)
    document.getElementById("CoverImage").replaceWith(imgdiv)
    // document.getElementById("CoverImage").appendChild(imgdiv)
  } else {
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
    media_div.updateSrc(mediaURI(playlist_item.path), (currentState.metadata[playlist_item.path]?.tags || {}))
  } else {
    const player_div = document.getElementById("MediaPlayer")
    media_div.call_ended(e => {
      if (currentState.playlist_index + 1 < currentState.playlist.length) {
        load_player(currentState.playlist[currentState.playlist_index + 1], {cover: options.cover})
      } else {
        disable_playcontrol()
        msg_show("Playback complete.")
      }
    })
    player_div.replaceWith(media_div)
  }

  media_div.letsPlay().then(() => {
    if (currentState.metadata[playlist_item.path]) {
      navigator.mediaSession.metadata = new MediaMetadata(currentState.metadata[playlist_item.path].tags)
    }
  })

  // Handle mediaSession.setActionHandler()
  update_trackcontrol()
  if (!currentState.player_exist) {
    enblae_playcontrol()
    currentState.player_exist = true
  }
}

const file_click = async function(target, type) {
  if (type === "list") {
    await set_playlist(null, target.playlist)
    load_player(currentState.playlist[0])
    switch_player_with_state()
  } else {
    single_play(target.dataset.filePath, type)
  }
}

const single_play = async function(path, type) {
  if (type === "image") {
    show_imgview_with_state(path)
  } else if (type === "plain") {
    show_textview_with_state(path)
  } else if (type === "external-link") {
    open(mediaURI(path))
  } else if (type === "music" || type === "video") {
    await set_playlist(type, [path])
    load_player(currentState.playlist[0])
    switch_player_with_state()
  }
}

const play_all_videos = async function() {
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
  await set_playlist("video", list)
  load_player(currentState.playlist[0])
  switch_player_with_state()
}

const play_all_audio = async function() {
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
  await set_playlist("music", list)
  load_player(currentState.playlist[0], {cover: currentState.cover})
  switch_player_with_state()
}

const playlist_prev = function(e) {
  if (currentState.playlist_index > 0) {
    load_player(currentState.playlist[currentState.playlist_index - 1], {keep_cover: true})
  }
}

const playlist_next = function(e) {
  if (currentState.playlist_index < currentState.playlist.length) {
    load_player(currentState.playlist[currentState.playlist_index + 1], {keep_cover: true})
  }
}

const switch_player = function() {
  const browser = document.getElementById("Browser")
  const player = document.getElementById("Player")
  browser.style.display = "none"
  player.style.display = "block"
  currentState.currentView = "player"
  hide_progress()
}

const switch_player_with_state = function() {
  switch_player()
  history.pushState({
    lwmp: true,
    type: "player"
  }, "")
}

const switch_browser = function() {
  const browser = document.getElementById("Browser")
  const player = document.getElementById("Player")
  browser.style.display = "block"
  player.style.display = "none"
}


const show_textview = async function(path) {
  const box = document.getElementById("TextViewerBox")
  const area = document.getElementById("TextViewer")
  box.style.height = window.innerHeight + "px"
  box.style.width = window.innerWidth + "px"
  const body = await http.get(mediaURI(path), {disable_parse_json: true})
  area.value = body
  box.style.display = "grid"
  currentState.currentView = "textview"
}

const show_textview_with_state = function(path) {
  show_textview(path)
  history.pushState({
    lwmp: true,
    type: "textview",
    path
  }, "")
}

const hide_textview = function(e) {
  const box = document.getElementById("TextViewerBox")
  box.style.display = "none"
}

const show_imgview = function(path) {
  const box = document.getElementById("ImgViewerFigure")
  const container = document.getElementById("ImgViewer")
  const img = document.createElement("img")
  img.src = mediaURI(path)
  img.dataset.path = path
  box.firstChild.replaceWith(img)
  container.style.display = "block"
  currentState.currentView = "imgview"
}

const show_imgview_with_state = function(path) {
  show_imgview(path)
  history.pushState({
    lwmp: true,
    type: "imgview",
    path
  }, "")
}

const switch_imgview = function(path) {
  const img = document.getElementById("ImgViewerFigure").firstChild
  img.src = mediaURI(path)
  img.dataset.path = path
}

const hide_imgview = function(e) {
  const container = document.getElementById("ImgViewer")
  container.style.display = "none"
}

const hide_imgview_callback = function(e) {
  const img = document.getElementById("ImgViewerFigure").firstChild
  const rect = img.getBoundingClientRect()
  const x = e.clientX - rect.left
  const zone_width = rect.width / 3

  if (x < zone_width) {
    const index = currentState.imglist.indexOf(img.dataset.path)
    if (index > 0) {
      switch_imgview(currentState.imglist[index - 1])
    }
  } else if (x < zone_width * 2) {
    history.back()
  } else {
    const index = currentState.imglist.indexOf(img.dataset.path)
    if (index < currentState.imglist.length - 1) {
      switch_imgview(currentState.imglist[index + 1])
    }
  }
  e.stopPropagation()
}

const build_imglist = function() {
  currentState.imglist = []
  for (const i of currentState.filelist.file) {
    if (i.type === "image") {
      currentState.imglist.push(i.path)
    }
  }
}

const bookreader = {
  prefetch_once(prefetch_offset_begin, prefetch_offset_end) {
    for (let prefetch_offset=prefetch_offset_begin; prefetch_offset<=prefetch_offset_end; prefetch_offset++) {
      const url = currentState.imglist[prefetch_offset]
      if (!url) { return }
      if (!currentState.bookreader.prefetched_urls.has(url)) {
        const img = document.createElement("img")
        img.src = mediaURI(url)
        currentState.bookreader.prefetched_urls.add(url)
      }
    }
  },

  prefetch_cache(prefetch_offset_begin, prefetch_offset_end) {
    for (let prefetch_offset=prefetch_offset_begin; prefetch_offset<=prefetch_offset_end; prefetch_offset++) {
      const url = currentState.imglist[prefetch_offset]
      if (!url) { return }
      if (!currentState.bookreader.prefetched_images.has(url)) {
        const img = document.createElement("img")
        img.src = mediaURI(url)
        currentState.bookreader.prefetched_images.set(url, img)
      }
    }
  },

  /**
   * Preload all images
   */
  async prefetch_cache_greedy() {
    if (!currentState.bookreader.preload_strategy.fetch == "greedy") { return }
    this.prefetch_cache(0, (currentState.imglist.length - 1))
    for (const i of currentState.bookreader.prefetched_images) {
      await i[1].decode()
    }
  },

  /**
   * Free all image cache and reset map.
   */
  discard_cache() {
    for (const i of currentState.bookreader.prefetched_images) {
      i[1].src = ""
    }
    currentState.bookreader.prefetched_images = new Map()
    currentState.bookreader.prefetched_urls = new Set()
  },

  /**
   * Returns page img element.
   * @param {number} page
   * @returns {HTMLImageElement}
   */
  img(page) {
    const url = currentState.imglist[page]
    if (!url) { return }
    let img
    switch (currentState.bookreader.preload_strategy.cache) {
      case "cache":
        if (!currentState.bookreader.prefetched_images.has(url)) {
          this.prefetch_cache(page, page)
        }
        return currentState.bookreader.prefetched_images.get(url)
        break
      default:
        img = document.createElement("img")
        img.src = mediaURI(url)
        return img
    }
  },

  async prefetch(page_index) {
    if (currentState.bookreader.preload_strategy.fetch === "none") { return }
    let prefetch_offset_begin, prefetch_offset_end
    switch (currentState.bookreader.preload_strategy.fetch) {
      case "ahead":
        prefetch_offset_begin = page_index + 1
        prefetch_offset_end = page_index + 2
        break
      case "greedy":
        return   // greedy mode already read all images.
    }

    switch (currentState.bookreader.preload_strategy.cache) {
      case "once":
        this.prefetch_once(prefetch_offset_begin, prefetch_offset_end)
        break
      case "cache":
        this.prefetch_cache(prefetch_offset_begin, prefetch_offset_end)
        break
    }

  },

  async show({greedy_load=false, at=0} = {}) {
    if (greedy_load && currentState.bookreader.preload_strategy.fetch == "greedy") {
      show_progress()
      await this.prefetch_cache_greedy()
      hide_progress()
    }

    currentState.currentView = "book"
    const br_box = document.getElementById("BookReaderBox")
    br_box.style.display = "block"
    br_box.style.height = window.innerHeight + "px"
    br_box.style.width = window.innerWidth + "px"
    currentState.bookreader.shown = true
    br_box.focus()
    this.draw(at)
  },

  show_with_state() {
    history.pushState({
      lwmp: true,
      type: "book"
    }, "")
    this.show({greedy_load: true})
  },

  hide({discard_cache=true} = {}) {
    const br_box = document.getElementById("BookReaderBox")
    br_box.style.display = "none"
    currentState.bookreader.shown = false
    if (discard_cache) { this.discard_cache() }
  },

  show_options() {
    const bro_box = document.getElementById("BookReaderOptionModalBox")
    bro_box.style.display = "block"
  },

  hide_options(e) {
    const bro_box = document.getElementById("BookReaderOptionModalBox")
    bro_box.style.display = "none"
    e.stopPropagation()
  },

  touch_callback(e) {
    const br_box = document.getElementById("BookReaderBox")
    const rect = br_box.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const zone_width = rect.width / 5
    const zone_height = rect.height / 3

    if (y < zone_height) {
      this.show_options()
    } else {
      if (x < zone_width) {
        currentState.bookreader.rtl ? this.next2() : this.prev2()
      } else if (x < zone_width * 2) {
        currentState.bookreader.rtl ? this.next1() : this.prev1()
      } else if (x < zone_width * 3) {
        history.back()
      } else if (x < zone_width * 4) {
        currentState.bookreader.rtl ? this.prev1() : this.next1()
      } else {
        currentState.bookreader.rtl ? this.prev2() : this.next2()
      }
    }
  },

  async draw_page_spread({pagenum, container, page}) {
    if (page > currentState.imglist.length - 2) { page = currentState.imglist.length - 2 }
    const img1 = this.img(page)
    const img2 = this.img(page + 1)

    this.prefetch(page + 1)

    await img1.decode()
    await img2.decode()

    const aspect1 = img1.naturalWidth / img1.naturalHeight
    const aspect2 = img2.naturalWidth / img2.naturalHeight

    if (aspect1 > 1 || aspect2 > 1) {
      currentState.bookreader.force_single = true
      this.draw_page_single({pagenum, container, page})
      return
    } else {
      currentState.bookreader.force_single = false
    }

    container.replaceChildren()
    container.className = "book-spread"

    const wrapper = document.createElement("div")
    wrapper.className = "book-spread-wrapper"
    wrapper.style.flexDirection = currentState.bookreader.rtl ? "row-reverse" : "row"

    img1.style = ""
    img2.style = ""

    wrapper.appendChild(img1)
    wrapper.appendChild(img2)
    container.appendChild(wrapper)

    currentState.bookreader.page = page
    pagenum.value = page + 1
  },

  async draw_page_single({pagenum, container, page}) {
    if (page > currentState.imglist.length - 1) { page = currentState.imglist.length - 1 }
    const img = this.img(page)

    this.prefetch(page)

    img.decode().then(() => {
      container.replaceChildren()
      container.className = ""
  
      container.appendChild(img)
  
      currentState.bookreader.page = page
      pagenum.value = page + 1
    })
  },

  draw(page=0) {
    const pagenum = document.getElementById("BookReaderPageNumber")
    const container = document.getElementById("BookReaderImages")

    if (page < 0) { page = 0 }

    currentState.force_single = false
    if (currentState.bookreader.spread) {
      this.draw_page_spread({pagenum, container, page})
    } else {
      this.draw_page_single({pagenum, container, page})
    }
  },

  next1() {
    this.draw(currentState.bookreader.page + 1)
  },

  next2() {
    const pages = (currentState.bookreader.spread && !currentState.bookreader.force_single) ? 2 : 1
    this.draw(currentState.bookreader.page + pages)
  },

  prev1() {
    this.draw(currentState.bookreader.page - 1)
  },

  prev2() {
    const pages = (currentState.bookreader.spread && !currentState.bookreader.force_single) ? 2 : 1
    this.draw(currentState.bookreader.page - pages)
  },

  opt_spread(e) {
    currentState.bookreader.spread = !currentState.bookreader.spread
    this.draw(currentState.bookreader.page)
    e.preventDefault()
  },

  opt_rtl(e) {
    currentState.bookreader.rtl = !currentState.bookreader.rtl
    this.draw(currentState.bookreader.page)
    e.preventDefault()
  },

  opt_jump(e) {
    const pagenum = document.getElementById("BookReaderPageNumber")
    const target_page = pagenum.value || 1
    this.draw(Number(target_page) - 1)
    e.preventDefault()
  }
}

const show_progress = function() {
  const pb = document.getElementById("ProgressWrapper")
  pb.style.height = window.innerHeight + "px"
  pb.style.width = window.innerWidth + "px"
  pb.style.display = "block"
  pb.offsetHeight
}

const hide_progress = function() {
  const pb = document.getElementById("ProgressWrapper")
  pb.style.display = "none"
}


/**
 * Load initial location.
 */
const app_initialize = async () => {
  let initial_path = window.location.search.replace(/^\?/, "") || ""
  initial_path = decodeURIComponent(initial_path)
  history.replaceState({
    lwmp: true,
    type: "browser",
    path: initial_path
  }, "")
  load_browser_with_state(initial_path)
}

// Setup navigation button events

document.getElementById("ShowPlayer").addEventListener("click", e => { switch_player_with_state() })
document.getElementById("BackToBrowser").addEventListener("click", e => { history.back() })
document.getElementById("PlayAllVideos").addEventListener("click", e => { play_all_videos() })
document.getElementById("PlayAllAudio").addEventListener("click", e => { play_all_audio() })

document.getElementById("PlaylistNext").addEventListener("click", playlist_next)
document.getElementById("PlaylistPrev").addEventListener("click", playlist_prev)

document.getElementById("TextViewerCloseBtn").addEventListener("click", e => { history.back() })

document.getElementById("BookReader").addEventListener("click", e => {bookreader.show_with_state(e)})

document.getElementById("ImgViewer").addEventListener("click", hide_imgview_callback)
document.getElementById("BookReaderBox").addEventListener("click", e => {bookreader.touch_callback(e)})
document.getElementById("BookReaderBox").addEventListener("click", e => { e.stopPropagation() })
document.getElementById("BookReaderOptionModalBox").addEventListener("click", e => {bookreader.hide_options(e)})
document.getElementById("BookReaderOptionModal").addEventListener("click", e => { e.stopPropagation() })
document.getElementById("BookReaderOptionSpread").addEventListener("click", e => {bookreader.opt_spread(e)})
document.getElementById("BookReaderOptionOrder").addEventListener("click", e => {bookreader.opt_rtl(e)})
document.getElementById("BookReaderPageJump").addEventListener("click", e => {bookreader.opt_jump(e)})

const upelem = document.getElementById("UpParent")
upelem.addEventListener("click", e => {
  const pathview = document.getElementById("CurrentPath")
  if (!pathview.value) { return }
  const path = pathview.value.replace(/\/[^/]*$/, "")
  load_browser_with_state(path.includes("/") ? path : "")
})

//

// Setup resize event
window.addEventListener("resize", e => {
  const vpx = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  if (vpx != currentState.viewportX) {
    currentState.scroll_position = {}
    currentState.viewportX = vpx
  }

  const pw = document.getElementById("ProgressWrapper")
  pw.style.height = window.innerHeight + "px"
  pw.style.width = window.innerWidth + "px"

  if (currentState.bookreader.shown) {
    bookreader.hide({discard_cache: false})

    setTimeout(() => {
      bookreader.show({at: currentState.bookreader.page})
    }, 300)
  }
})

// Setup keyboard event
document.getElementById("BookReaderBox").addEventListener("keydown", e => {
  if (e.code === "ArrowDown") {
    bookreader.next2()
    e.preventDefault()
  } else if (e.code === "ArrowUp") {
    bookreader.prev2()
    e.preventDefault()
  } else if (e.code === "ArrowLeft") {
    currentState.bookreader.rtl ? bookreader.next2() : bookreader.prev2()
    e.preventDefault()
  } else if (e.code === "ArrowRight") {
    currentState.bookreader.rtl ? bookreader.prev2() : bookreader.next2()
    e.preventDefault()
  } else if (e.code === "PageDown") {
    bookreader.next1()
    e.preventDefault()
  } else if (e.code === "PageUp") {
    bookreader.prev1()
    e.preventDefault()
  } else if (e.code === "Home") {
    const pagenum = document.getElementById("BookReaderPageNumber")
    pagenum.value = 1
    bookreader.opt_jump(e)
  } else if (e.code === "End") {
    const pagenum = document.getElementById("BookReaderPageNumber")
    pagenum.value = currentState.imglist.length // Adjust last page in draw.
    bookreader.opt_jump(e)
  } else if (e.key === "s" || e.key === "d") {
    bookreader.opt_spread(e)
  } else if (e.key === "r" || e.key === "m") {
    bookreader.opt_rtl(e)
  } else if (e.code === "Escape") {
    history.back()
    e.preventDefault()
  }
})

document.getElementById("BookReaderBox").addEventListener("wheel", ev => {
  if (ev.deltaY > 0) {
    bookreader.next2()
  } else if (ev.deltaY < 0) {
    bookreader.prev2()
  }
  ev.preventDefault()
})

document.getElementById("BookReaderOptionModal").addEventListener("wheel", ev => {
  ev.stopPropagation()
})

document.getElementById("BookReaderOptionPreloadPageSubmit").addEventListener("click", async ev => {
  const options = document.getElementById("BookReaderOptionPreloadPage")
  const value = options.value.split(":")
  currentState.bookreader.preload_strategy.fetch = value[0]
  currentState.bookreader.preload_strategy.cache = value[1] || null
  ev.preventDefault()
  ev.stopPropagation()

  if (value[0] == "greedy") {
    await bookreader.prefetch_cache_greedy()
  }
})

// Back navigation
window.addEventListener("popstate", e => {
  const state = e.state
  if (!state.lwmp) { return }
  if (currentState.currentView) {
    switch (currentState.currentView) {
      case "player":
        switch_browser()
        break
      case "textview":
        hide_textview()
        break
      case "imgview":
        hide_imgview()
        break
      case "book":
        bookreader.hide()
        break
    }
    currentState.currentView = null
  } else {
    switch (state.type) {
      case "player":
        switch_player()
        break
      case "textview":
        show_textview(state.path)
        break
      case "imgview":
        show_imgview(state.path)
        break
      case "book":
        bookreader.show()
        break
      default:
        load_browser(state.path)
    }
  }
})

app_initialize()
