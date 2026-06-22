$config = {
  use_metadata: !["false", "no", "disable"].include?(ENV["USE_METADATA"]),
  use_thumbnail: !["false", "no", "disable"].include?(ENV["USE_THUMBNAIL"]),
  report_decode_error: !["false", "no", "disable"].include?(ENV["REPORT_DECORD_ERROR"]),
  ffprobe_cmd: "ffprobe",
  videoplayer: ENV["VIDEOPLAYER"] || "default", # vidstack, vlitejs, plyr, fluid, default
  audioplayer: ENV["AUDIOPLAYER"] || "default", # vidstack, vlitejs, plyr, default

  # Generally, these settings should not be changed.
  media_root: ENV["MEDIA_ROOT"].sub(%r:/$:, ""),
  thumb_root: ENV["THUMB_ROOT"]&.sub(%r:/$:, "") || ENV["MEDIA_ROOT"].sub(%r:media/?$:, "thumb"),
  meta_root: ENV["METADATA_ROOT"]&.sub(%r:/$:, "") || ENV["MEDIA_ROOT"].sub(%r:media/?$:, "meta"),
  instance_name: ENV["LWMP_INSTANCE_NAME"]
}
