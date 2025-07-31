#!/bin/env ruby
require 'cgi'
require 'json'
require 'gdbm'

class LWMPMetadata
  IMAGE_MIME = {
    ".jpeg" => "jpeg",
    ".jpg" => "jpeg",
    ".png" => "png",
    ".webp" => "webp"
  }

  class MetadataDisabledError < StandardError
  end

  def initialize
    @root = ENV["MEDIA_ROOT"]
    @ffprobe = ENV["FFPROBE_CMD"] || "ffprobe"
    Encoding.default_external = "UTF-8"
  end

  def get list
    rv = {}

    GDBM.open([ENV["METADATA_DATABASE"], "meta.db"].join("/"), 0644, GDBM::WRCREAT) do |dbm|
      list.each do |path|
        if dbm[path]
          rv[path] = Marshal.load dbm[path]
        else
          meta = load_meta path
          dbm[path] = Marshal.dump meta
          rv[path] = meta
        end
      end
    end

    rv
  end

  def load_meta path
    result = nil
    filepath = [@root, path].join("/")
    return nil unless File.exist? filepath
    IO.popen([@ffprobe, "-of", "json", "-show_format", "-show_streams", filepath], external_encoding: "UTF-8") do |io|
      idata = io.read
      data = JSON.load idata
      meta = data["format"]["tags"]
      return nil unless meta

      result = {
        "tags" => {
          "title" => meta["title"] || meta["Title"] || meta["TITLE"],
          "artist" => meta["artist"] || meta["Artist"] || meta ["ARTIST"],
          "album" => meta["album"] || meta["Album"] || meta["ALBUM"]
        }
      }

      dir = File.dirname filepath
      if File.directory? dir
        dir_files = Dir.children(dir)
        image_files = dir_files.select {|i| File.fnmatch("{cover,front}.{jpeg,jpg,png,webp}", i, File::FNM_EXTGLOB)}
        result["tags"]["artwork"] = [] unless image_files.empty?
        image_files.each do |i|
          cover = {
            "src" => "/media/#{File.dirname path}/#{i}",
            "type" => "image/#{IMAGE_MIME[File.extname(i).downcase]}"
          }
          result["tags"]["artwork"].push cover
        end
      end
    end
    result
  end

  def create_list data
    result = {}
    data.each do |k,v|
    end
  end

  def cgi
    @db_dir = ENV["METADATA_DATABASE"]
    raise MetadataDisabledError unless @db_dir && !@db_dir.empty?
    stdin_data = $stdin.read
    body = JSON.load stdin_data
    @cgi = CGI.new

    response = get body

    puts "Status: 200"
    puts "Content-Type: application/json"
    puts
    puts JSON.dump response
  rescue MetadataDisabledError
    puts "Status: 404"
    puts "Content-Type: text/plain"
    puts
  end
end

mt = LWMPMetadata.new
mt.cgi
