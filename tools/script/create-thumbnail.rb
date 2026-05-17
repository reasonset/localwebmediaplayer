#!/bin/env ruby
require 'fileutils'
require 'find'
require 'json'

media_dir = ARGV.shift
thumb_dir = ARGV.shift

MEDIA_EXT_VID = %w:.mp4 .mkv .mov .webm .ogv:
MEDIA_EXT_AUD = %w:.mp3 .ogg .oga .opus .m4a .aac .flac .wav:
MEDIA_EXT_IMG = %w:.jpg .jpeg .jfif .pjpeg .pjp .png .webp .avif .bmp .gif:
TARGET_EXT = Set.new(MEDIA_EXT_VID + MEDIA_EXT_AUD + MEDIA_EXT_IMG)

unless media_dir && File.exist?(media_dir) && thumb_dir && File.exist?(thumb_dir)
  abort "create-thumbnail.rb <media_dir> <thumb_dir>"
end

Find.find(media_dir) do |fp|
  rfp = fp[media_dir.length..].sub(%r:^/:, "")
  ext = File.extname(fp)&.downcase
  next unless TARGET_EXT.include?(ext)
  efp = File.expand_path(rfp + ".thumb.webp", thumb_dir)
  next if File.exist?(efp)
  mime = nil
  IO.popen(["file", "-b", "--mime-type", fp]) {|io| mime = io.read.strip.split("/", 2)[0] }
  FileUtils.mkdir_p(File.dirname efp) unless File.exist? File.dirname efp
  case
  when MEDIA_EXT_VID.include?(ext)
    next unless mime == "video"
    system("ffmpeg", "-i", fp, "-vf", "thumbnail=1800", "-frames:v", "1", efp)
  when MEDIA_EXT_AUD.include?(ext)
    next unless mime == "audio"
    # Album art exists?
    IO.popen(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,codec_type,disposition=attached_pic", "-of", "json", fp]) do |io|
      res = JSON.parse io.read
      next res["streams"][0]
    end or next
    system("ffmpeg", "-i", fp, "-vf", "scale=300:300:force_original_aspect_ratio=decrease", efp)
  when MEDIA_EXT_IMG.include?(ext)
    next unless mime == "image"
    system("magick", fp, "-resize", "300x300>", "-strip", efp)
  end
end
