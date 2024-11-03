#!/bin/env ruby
require 'cgi'
require 'json'

module DirList
  class BadRequest < StandardError
  end

  MEDIA_EXT_VID = %w:.mp4 .mkv .mov .webm .ogv:
  MEDIA_EXT_AUD = %w:.mp3 .ogg .oga .opus .m4a .aac .flac .wav:

  def dir path
    path = nil if path && path.empty?
    STDERR.puts path
    if path && (path =~ %r!(?:^|/)\.\.(?:$|/)! || path[0] == "/")
      raise BadRequest
    end

    dirpath = path ? File.join(@root, path) : @root
    files = {
      "directory" => [],
      "file" => [],
    }
    Dir.children(dirpath).each do |fn|
      fn.force_encoding("UTF-8")
      next if fn[0] == "."
      stat = File::Stat.new(File.join(dirpath, fn))

      if stat.directory?
        files["directory"].push({
          "type" => "directory",
          "path" => path ? File.join(path, fn) : fn
        })
      elsif stat.file?
        ext = File.extname(fn)
        if MEDIA_EXT_VID.include? ext.downcase
          files["file"].push({
            "type" => "video",
            "path" => (path ? File.join(path, fn) : fn),
            "ext" => ext
          })
        elsif MEDIA_EXT_AUD.include? ext.downcase
          files["file"].push({
            "type" => "music",
            "path" => (path ? File.join(path, fn) : fn),
            "ext" => ext
          })
        end
      end
    end

    files
  end
end

class MediaPlayer
  class IllegalPath < StandardError
  end

  include DirList

  def initialize
    @root = ENV["MEDIA_ROOT"]
  end

  def cgi
    @cgi = CGI.new
    val = dir(@cgi["path"])

    puts "Content-Type: application/json; charset=utf-8"
    puts
    puts JSON.dump(val)
  rescue BadRequest
    puts "Status: 400"
    puts "Content-Type: text/plain"
    puts
  end
end

mp = MediaPlayer.new
mp.cgi