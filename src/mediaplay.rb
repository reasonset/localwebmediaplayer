#!/bin/env ruby
require 'uri'
require 'json'
require 'yaml'
require_relative 'rscgi'

Encoding.default_external = "UTF-8"
Encoding.default_internal = "UTF-8"

$config ||= YAML.load(ENV["CONFIG_PROFILE"], symbolize_names: true)

module DirList
  class BadRequest < StandardError
  end

  class LackEnvironment < StandardError
  end

  MEDIA_EXT_VID = %w:.mp4 .mkv .mov .webm .ogv:
  MEDIA_EXT_AUD = %w:.mp3 .ogg .oga .opus .m4a .aac .flac .wav:
  MEDIA_EXT_IMG = %w:.jpg .jpeg .jfif .pjpeg .pjp .png .webp .avif .bmp .gif:
  # .heif .jxl
  MEDIA_EXT_TXT = %w:.txt .xml .html .xhtml .css .json .yaml .yml .toml .md .rst .t2t .wiki:
  MEDIA_EXT_EXT = %w:.pdf:

  def thumbnail_exist? path, fn
    path_elem = [$config[:thumb_root]]
    path_elem.push(path) if path
    path_elem.push(fn + ".thumb.webp")
    File.exist? File.join(*path_elem)
  end

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
        next if $config[:exclude_exts].any? {|xext| fn[-(xext.length)..] == xext}
        if MEDIA_EXT_VID.include? ext.downcase
          files["file"].push({
            "type" => "video",
            "path" => (path ? File.join(path, fn) : fn),
            "ext" => ext,
            "thumbnail" => thumbnail_exist?(path, fn)
          })
        elsif MEDIA_EXT_AUD.include? ext.downcase
          files["file"].push({
            "type" => "music",
            "path" => (path ? File.join(path, fn) : fn),
            "ext" => ext,
            "thumbnail" => thumbnail_exist?(path, fn)
          })
        elsif MEDIA_EXT_IMG.include? ext.downcase
          files["file"].push({
            "type" => "image",
            "path" => (path ? File.join(path, fn) : fn),
            "ext" => ext,
            "thumbnail" => thumbnail_exist?(path, fn)
          })
        elsif MEDIA_EXT_TXT.include? ext.downcase
          files["file"].push({
            "type" => "plain",
            "path" => (path ? File.join(path, fn) : fn),
            "ext" => ext
          })
        elsif MEDIA_EXT_EXT.include? ext.downcase
          files["file"].push({
            "type" => "external-link",
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
    @root = $config[:media_root]
  end

  def cgi
    @cgi = RsCgi.new
    ready?
    val = dir(@cgi["path"])
    addons val

    puts "Content-Type: application/json; charset=utf-8"
    puts
    puts JSON.dump(val)
  rescue LackEnvironment
    puts "Status: 503"
    puts "Content-Type: text/plain"
    puts
    puts "Some environment variables are missing."
  rescue BadRequest
    puts "Status: 400"
    puts "Content-Type: text/plain"
    puts
  end

  def ready?
    unless @root
      raise LackEnvironment
    end
  end

  def addons val
    if @cgi["info"] == "true"
      val["environment"] = {
        "root" => $config[:media_root],
        "server_name" => $config[:instance_name],
        "use_metadata" => $config[:use_metadata],
        "use_thumbnail" => $config[:use_thumbnail],
        "videoplayer" => $config[:videoplayer],
        "audioplayer" => $config[:audioplayer],
        "report_decode_error" => $config[:report_decode_error]
      }
    end
  end
end

mp = MediaPlayer.new
mp.cgi
