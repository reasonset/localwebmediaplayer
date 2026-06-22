const currentState = {
  filelist: [],
  playlist_index: -1,
  mediatype: null,
  path: null,
  scroll_position: {},
  viewportX: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
  viewportX: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
  cover: null,
  imglist: [],
  bookreader: {
    spread: true,
    rtl: false,
    current_page: null,
    shown: false,
    force_single: false,
    preload_strategy: {fetch: "ahead", cache: "once"},
    prefetched_urls: new Set(),
    prefetched_images: new Map(),
  },
  currentView: null,
  systemInfo: null,
  metadata: {},
  transcode: {}
}

export {currentState}