#!/bin/env ruby
require 'yaml'
require 'json'

config_dir = ENV["XDG_CONFIG_HOME"] || "#{ENV["HOME"]}/.config"
config_file = [config_dir, "reasonset", "lwmp.yaml"].join("/")

unless File.exist?(config_file)
  abort "#{config_file} is not exist."
end

profile = ARGV.shift

unless profile
  abort "lwmp-start.rb <profile_name>"
end

config = YAML.load File.read config_file

unless config["repo"] && File.exist?([config["repo"], "src", "mediaplay.rb"].join("/")) && File.exist?([config["repo"], "tools", "lighttpd", "lwmp.lighttpd.conf"].join("/"))
  config["repo"] = File.expand_path([File.dirname(__FILE__), "..", ".."].join("/"))
  unless config["repo"] && File.exist?([config["repo"], "src", "mediaplay.rb"].join("/")) && File.exist?([config["repo"], "tools", "lighttpd", "lwmp.lighttpd.conf"].join("/"))
    abort "LWMP Repository path is not set."
  end
end

spec = config["profiles"][profile]
unless spec
  abort "Profile #{profile} is not defined."
end

spec["videoplayer"] ||= config["videoplayer"] || "default"
spec["audioplayer"] ||= config["audioplayer"] || "default"
spec["media"] or abort "Key 'media' is not found."
spec["media_root"] = spec["media"].sub(%r:/$:, "") + "/"
spec["data_root"] or abort "Key 'data_root' is not found."
spec["data_root"] = spec["data_root"].sub(%r:/$:, "") + "/"
spec["cache_root"] or abort "Key 'cache_root' is not found."
spec["cache_root"] = spec["cache_root"].sub(%r:/$:, "") + "/"
spec["thumb_root"] = File.join(spec["cache_root"], "thumb") # For compatibility.
spec["meta_root"] = spec["metadata"] && (spec["metadata"].sub(%r:/$:, "") + "/")
spec["instance_name"] = spec["name"] || profile
spec["ffprobe"] = config["ffprobe"] || "ffprobe"

ENV["REPO_DIR"] = config["repo"]
ENV["MEDIA_ROOT"] = spec["media"]
ENV["DATA_ROOT"] = spec["data_root"]
ENV["CACHE_ROOT"] = spec["cache_root"]
ENV["SERVER_PORT"] = (spec["port"] or abort "Key 'port' is not found.").to_s
ENV["RUBY_BIN_PATH"] = config["ruby"] || "/usr/bin/ruby"
ENV["CONFIG_PROFILE"] = YAML.dump(spec)

exec((config["lighttpd_cmd"] || "lighttpd"), "-D", "-f", [config["repo"], "tools", "lighttpd", "lwmp.lighttpd.conf"].join("/"))