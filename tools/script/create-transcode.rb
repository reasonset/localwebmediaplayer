#!/bin/env ruby
require 'json'
require 'fileutils'

def usage
  abort "create_transcode.rb <media_root> <cache_root> <data_root>"
end

MEDIA_EXT_AUD = %w:.mp3 .ogg .oga .opus .m4a .aac .flac .wav:
MEDIA_EXT_LOSSLESS = %w:.flac .wav:

media_root = ARGV.shift
cache_root = ARGV.shift
data_root = ARGV.shift
queue_file = File.join(data_root, "audio_decode_error_report.jsonl")
transcode_meta = File.join(data_root, "info", "transcode_meta.json")

usage unless File.directory?(media_root) && File.directory?(cache_root) && File.file?(queue_file)

jsonl = File.read queue_file
FileUtils.rm(queue_file)

meta = File.exist?(transcode_meta) ? JSON.load(File.read transcode_meta) : {}

in_this_time = Set.new

jsonl.each_line do |json|
  data = JSON.load json
  next if in_this_time.include?(data["path"])
  in_this_time.add(data["path"])
  begin
    real_path = File.realpath(File.join(media_root, data["decoded"]))
    target_path = File.absolute_path(File.join(cache_root, "media", data["decoded"]))

    ext = File.extname(real_path)
    next unless MEDIA_EXT_AUD.include?(ext)

    unless File.exist? File.dirname(target_path)
      FileUtils.mkdir_p(File.dirname(target_path))
    end

    if MEDIA_EXT_LOSSLESS.include?(ext)
      if File.exist? target_path
        meta[data["path"]] = data["path"].sub("/media/", "/transcode/media/")
        next
      end

      system("ffmpeg", "-i", real_path, "-map_metadata", "-1", "-c:a", "flac", target_path)
      meta[data["path"]] = data["path"].sub("/media/", "/transcode/media/")
    else
      level1_path = target_path
      level2_path = target_path + ".opus"

      if File.exist? level2_path
        meta[data["path"]] = data["path"].sub("/media/", "/transcode/media/") + ".opus"
        next
      elsif File.exist?(level1_path) && !meta[data["path"]]
        meta[data["path"]] = data["path"].sub("/media/", "/transcode/media/")
        next
      end

      if File.exist?(level1_path)
        system("ffmpeg", "-y", "-i", real_path, "-map_metadata", "-1", "-c:a", "libopus", "-b:a", "256k", "-vbr", "on", level2_path) && meta[data["path"]] = data["path"].sub("/media/", "/transcode/media/") + ".opus"
      else
        system("ffmpeg", "-i", real_path, "-map_metadata", "-1", "-c:a", "copy", level1_path) && meta[data["path"]] = data["path"].sub("/media/", "/transcode/media/")
      end
    end
  rescue => e
    $stderr.puts e
    $stderr.puts json
    next
  end
end

File.open(transcode_meta, "w") do |f|
  JSON.dump(meta, f)
end
