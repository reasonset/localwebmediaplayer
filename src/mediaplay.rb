#!/bin/env ruby
require 'cgi'
require 'json'

Encoding.default_external = "UTF-8"
Encoding.default_internal = "UTF-8"

module DirList
  class BadRequest < StandardError
  end

  MEDIA_EXT_VID = %w:.mp4 .mkv .mov .webm .ogv:
  MEDIA_EXT_AUD = %w:.mp3 .ogg .oga .opus .m4a .aac .flac .wav:

  def dir path
    path = nil if path && path.empty?
    if path && (path =~ %r!(?:^|/)\.\.(?:$|/)! || path[0] == "/")
      raise BadRequest
    end

    dirpath = path ? File.join(@root, path) : @root
    files = {
      "directory" => [],
      "file" => [],
      "cover" => nil
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
      elsif File.fnmatch("{cover,front}.{jpg,png}", fn, File::FNM_EXTGLOB)
        files["cover"] ||= (path ? File.join(path, fn) : fn)
      elsif stat.file? || File.file?(File.realpath(File.join(dirpath, fn)))
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
        elsif ext.downcase == ".m3u"
          begin
            list = File.read(path ? File.join(@root, path, fn) : File.join(@root, fn)).each_line.reject {|i| i =~ /^\s*#/ || i =~ /^\s*$/ }.map {|i| i.chomp }

            unless list.any? {|i| i[0] == "/" || i =~ %r!(?:^|/)\.\.(?:$|/)! }
              files["file"].push({
                "type" => "list",
                "path" => (path ? File.join(path, fn) : fn),
                "list" => list.map {|i| path ? File.join(path, i) : i }
              })
            end
          rescue
            # Invalid playlist item
            nil
          end
        end
      end
    end

    # Re-sorting with UTF-8 Filename
    files["directory"].sort_by! {|i| File.basename i["path"] }
    files["file"].sort_by! {|i| File.basename i["path"] }

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