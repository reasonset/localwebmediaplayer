#!/bin/env ruby
require 'yaml'

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

ENV["REPO_DIR"] = config["repo"]
ENV["MEDIA_ROOT"] = spec["media"] or abort "Key 'media' is not found."
ENV["MEDIA_ROOT"] = ENV["MEDIA_ROOT"].sub(%r:/$:, "") + "/"
ENV["SERVER_PORT"] = (spec["port"] or abort "Key 'port' is not found.").to_s
ENV["LWMP_INSTANCE_NAME"] = spec["name"] || profile
ENV["METADATA_DATABASE"] = spec["metadata"] || ""
ENV["FFPROBE_CMD"] = config["ffprobe"] || "ffprobe"

exec((config["lighttpd_cmd"] || "lighttpd"), "-D", "-f", [config["repo"], "tools", "lighttpd", "lwmp.lighttpd.conf"].join("/"))