#!/bin/env ruby
require 'cgi'
require 'gdbm'

class LWMPMetadata
  def get list
    rv = {}

    GDBM.open([ENV["METADATA_DATABASE"], "meta.db"].join("/"), GDBM::WRCREAT) do |dbm|
      list.each do |path|
        if dbm[path]
          rv[path] = Marshal.load dbm[path]
        else
          meta = nil
        end
      end
    end

  end
end