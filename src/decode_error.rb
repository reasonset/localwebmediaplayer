#!/bin/env ruby
require 'json'
require 'yaml'

Encoding.default_external = "UTF-8"
Encoding.default_internal = "UTF-8"

$config ||= YAML.load(ENV["CONFIG_PROFILE"], symbolize_names: true)

class ReportDecodeError
  class BadRequest < StandardError
  end

  REPORT_FILE = File.join($config[:data_root], "audio_decode_error_report.jsonl")
  REPORT_FILE_LOCK = File.join($config[:data_root], "audio_decode_error_report.lock")

  def initialize
    stdin_data = $stdin.read
    body = JSON.load stdin_data
    @reported_path = body["path"]
    @path_decoded = body["decoded"]
  end

  def main
    real_path = File.realpath(File.join($config[:media_root], @path_decoded))
    if @path_decoded[0] == "/" || @path_decoded.split(/[\\\/]/).include?("..") || @reported_path[0, 7] != "/media/"
      raise BadRequest
    end

    File.open(REPORT_FILE_LOCK, "w") do |fl|
      fl.flock(File::LOCK_EX)
      begin
        File.open(REPORT_FILE, "a") do |f|
          f.puts JSON.dump({"path" => @reported_path, "source" => real_path, "decoded" => @path_decoded})
        end
      ensure
        fl.flock(File::LOCK_UN)
      end
    end

    puts "Status: 204"
    puts "Content-Type: text/plain"
    puts
  rescue Errno::ENOENT
    puts "Status: 404"
    puts "Content-Type: text/plain"
    puts
  rescue BadRequest
    puts "Status: 400"
    puts "Content-Type: text/plain"
    puts
  end
end

ReportDecodeError.new.main