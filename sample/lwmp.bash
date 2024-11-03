#!/bin/zsh

# lighttpd config file path
declare lighttpd_conf=$HOME/.config/reasonset/lwmp/lighttpd.conf

# Path to repository + /src
export REPOSRC=$HOME/.local/opt/localwebmediaplayer/src

# Media file library directory
export MEDIA_ROOT=$(xdg-user-dir VIDEOS)

lighttpd -D -f "$lighttpd_conf"