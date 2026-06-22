#!/bin/env ruby
require 'yaml'
require 'json'
require 'gdbm'
require 'fileutils'

$config ||= YAML.load(ENV["CONFIG_PROFILE"], symbolize_names: true)

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
    @root = $config[:media_root]
    @ffprobe = $config[:ffprobe_cmd] || "ffprobe"
    Encoding.default_external = "UTF-8"
  end

  def get list
    rv = {}

    list.each do |path|
      begin
        File.realpath(path, $config[:media_root])
      rescue
        next
      end
      metapath = File.expand_path(path + ".info.json", $config[:meta_root])

      if File.exist?(metapath)
        rv[path] = JSON.load File.read metapath
      else
        meta = load_meta path
        FileUtils.mkdir_p(File.dirname metapath) unless File.exist? File.dirname metapath
        File.open(metapath, "w") {|f| JSON.dump meta, f }
        rv[path] = meta
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
    @db_dir = $config[:meta_root]
    raise MetadataDisabledError unless @db_dir && !@db_dir.empty?
    stdin_data = $stdin.read
    body = JSON.load stdin_data

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
