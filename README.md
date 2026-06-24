# Local Web Media Player

## Synopsis

Play video and music with WebUI from other device on local network.

## Description

The software consists of a Ruby/CGI script to return file lists and a SPA front end written in Vanilla JavaScript.

The web server functionality relies on lighttpd.

![Browser View](doc/img/filebrowser.webp)

Frontend provides file browser view and video/audio player view.

The File Browser view displays only directories, audio files, and video files.
Clicking on a media file will start playback of that file.
If you click on a folder, it advances to that folder.

`..` to go one folder up.

Click `Play Audio` to put all audio files in this folder into a playlist.

Clicking `Play Video` will put all video files in this folder into a playlist.

Click `Show Player` to switch to the Player view.

![Player view](doc/img/videoplayer.webp)

Player view has a playlist.
If an item remains in the playlist, it will automatically start playing the next item when playback ends.

Clicking on an item in the playlist starts playback of that item.

This software supports `.m3u` playlist *only* has relative path.

💡hint: Player supports nexttrack/previoustrack key.

![Image viewer](doc/img/imageviewer.webp)

Clicking an image file opens the image viewer.

The viewer is divided into three zones: left, center, and right.

* Clicking the left zone shows the previous image
* Clicking the right zone shows the next image
* Clicking the center zone closes the viewer

These zones are applied to the entire viewport of the image viewer, not to the image itself.

![Book reader](doc/img/bookreader.webp)

Clicking the `Book Reader` button opens a viewer that displays all images within the current folder.

Pages are sorted in lexicographical order based on file names and cannot be rearranged.

The book reader is displayed in full-viewport mode, divided vertically with a 1:2 ratio:

* The upper section reveals reader options when clicked:
    * Toggle between single and spread (two-page) view
    * Switch page-turn direction (left-to-right or right-to-left)
    * Jump to a specific page

The lower section is split into five horizontal zones:

* Clicking the center zone closes the reader
* Clicking the left or right zones turns pages:
    * Near the center: turns 1 page
    * Near the edges: turns 2 pages
    * Note: If only 1 image is displayed, the 2-page action will result in a single page turn

Book Reader Keyboard Operation:

|Key|Turns|
|-----|-------------------|
|←|Left 2 pages|
|→|Right 2 pages|
|↓|Forward 2 pages|
|↑|Back 2 pages|
|PageDown|Forward 1 page|
|PageUp|Back 1 page|
|Home|Jump to first page|
|End|Jump to last page|
|Esc|Close Book Reader|

## Caution

This software is intended to be used to play media from other devices within a LAN.
It is not intended to be published on the Internet and such activities are dangerous and should be avoided.

## Requiement

* lighttpd
* Ruby >= 3.2
* OS uses UTF-8 based filename

When use Metadata feature:

* `gdbm` gem
* FFmpeg

## Recommendation

LWMP strongly recommends using Linux.

The software has not been tested on other platforms.

## Install

* Clone this repository to your local

## Configuration

The configuration file should be placed at `${XDG_CONFIG_HOME:-$HOME/.config}/reasonset/lwmp.yaml`.  
A sample configuration file is available at `sample/lwmp.yaml`, which you can copy and customize.

There are two global settings: `repo` and `lighttpd_cmd`.
If you use `tools/script/lwmp-start.rb` in its default location, `repo` can be omitted.
In most cases, `lighttpd_cmd` does not need to be specified. You only need to set this if the Lighttpd command name is different or if it's not in your system's PATH.

Individual instance settings should be written under the `profiles` section.  
Each key in `profiles` represents a profile name, which is used at startup.  
You must specify both the directory to browse (`media`), cache (`cache_root`), variable data (`data_root`) and the server port (`port`).

## Usage

```
lwmp-start.rb <profile_name>
```

You can start a Lighttpd instance using `tools/script/lwmp-start.rb`.  
Use the `profile_name` specified as a key in the `profiles` section of the configuration file.

You may also copy this script to a directory included in your system’s PATH for convenience.  
In that case, make sure to specify the `repo` setting in the configuration file.

# Metadata function

If the `use_metadata` parameter is set to true, metadata support is enabled.
Metadata is stored in the directory `$data_root/metadata`.

When enabled, clients will request metadata during playlist construction.
A helper script (`metadata.rb`) utilizes `ffprobe` to extract media metadata and respond to the client accordingly.

Requirements:

- `ffprobe` (FFmpeg)

Performance Considerations:

- Metadata is cached on the client side, increasing memory usage.
- Playlist generation may trigger metadata queries, resulting in slower load times due to `ffprobe` processing.
- When metadata is active, album artwork (e.g., `cover.jpg`, `front.jpg`) will also be searched in the media file's directory if not found in the current working directory.

Additionally, metadata integration enhances compatibility with OS-level mediaSession features. Enable this feature if rich metadata integration is essential. Disable it for faster response and lower resource usage.

# Thumbnail function

If the `use_thumbnail` parameter is set to true, the metadata feature is enabled.
Metadata is stored in the directory `$cache_root/thumb`.

This thumbnail directory must be accessible to clients via `/thumb/`.

Thumbnails must be built in advance using `create-thumbnail.rb`.

```
create-thumbnail.rb <media_dir> <thumb_dir>
```

If `use_thumbnail` is true, the client uses a intersection observer to monitor the file browser and replaces the icon with a thumbnail when the target entry is displayed on the screen.

While this alleviates some of the pressure on the rate limit, a large number of requests may still be expected depending on the environment, so you may need to set a more lenient rate limit for the number of requests.

# Audio file fallback

Audio playback in web browsers can fail for various reasons. This can occur even when there are no issues with standard audio player applications, and it is particularly common in mobile environments.

LWMP uses batch processing to provide fallback audio files that can be used instead.

If `report_decode_error` is enabled, the client notifies the server of any files that failed to play. The server stores this information in a list, and `create-transcode.rb` can be used to generate fallback files.

```
create-transcode.rb <media_root> <cache_root> <data_root>
```

Fallback files are loaded even if `report_decode_error` is disabled.

# Video Player / Audio Player with Library

By changing the `videoplayer` value in `config.rb`, you can replace the plain `video` element with a video player that uses a library.

Similarly, by configuring the `audioplayer` property, you can set the system to use the audio player functionality of the video player library instead of the plain `audio` element.

Since the library is loaded dynamically, leaving this value at its default setting will prevent the external library from being loaded.

## vidstack

Use vidstack. The library is loaded from a CDN.

vidstack enables users to fast-forward and rewind videos using the keyboard.

Vidstack sometimes has trouble loading content from the CDN.
Since this is an issue on Vidstack's end, LWMP cannot resolve it.

## vlitejs

Use vLiteJS. The library is loaded from a CDN.

The volume bar and hotkey plugins are enabled.

vLiteJS is more likely than other players to have issues with autoplay.

Media key controls for play and pause are disabled in vLiteJS. This is because enabling them causes the player to malfunction and triggers other issues.

## plyr

Use Plyr. The library is loaded from a CDN.

I'm aware of an issue where resizing the video player in Plyr does not work properly, causing the video to be cropped.
However, since we have not found a universal solution, this issue has been left unresolved.
Plyr has other issues as well, so it may no longer be supported in the future.

## fluid

Use Fluid Player. The library is loaded from a CDN.

Since Fluid Player does not provide an interface for use in place of the `audio` element, you cannot specify `fluid` as the value for `audioplayer`.

Fluid Player ensures that even landscape-oriented videos maintain their maximum height (70vh). This is a known issue, but since fixing it could cause the video to be cut off depending on the video and viewport sizes, there are no plans to fix it.

# Manual Deployment of the Web Application

LWMP can operate on any web server that supports CGI execution.
Use of Lighttpd or the `start-lwmp.rb` launcher is not strictly required.

To run LWMP manually, the following conditions must be met:

* The `src/` directory is served as the document root, with `*.rb` files executable as CGI scripts
* Access to `/media/` must be mapped to the directory specified by `$MEDIA_ROOT`
* Ruby scripts must be able to access filesystem paths as expected on Linux
* The following environment variables must be propagated to CGI scripts:
  * `$MEDIA_ROOT`
  * `$THUMB_ROOT` (optional)
  * `$METADATA_ROOT` (optional)
  * `$LWMP_INSTANCE_NAME` (optional)
  * `$FFPROBE_CMD` (optional)

Compatibility Note:
CGI behavior varies between web servers. For example, `metadata.rb` reads from `$stdin` until EOF, which may cause issues on servers (such as Hiawatha) that keep CGI input streams open indefinitely.

As a result, the officially supported deployment method remains:
Linux environment using Lighttpd.

# How to use mise

Even if you use `mise exec` to launch the process, simply leaving the CGI handler empty will not allow `mise` to launch it properly. Furthermore, since Lighttpd’s CGI handler cannot accept arguments, you cannot use `mise` to launch the CGI interpreter as-is.

To execute a CGI script via `mise`, prepare a script like the one below so that you can pass arguments using a single command:

```bash
#!/bin/bash
exec mise exec ruby@4.0 -- ruby "$@"
```

Then, grant this file execute permissions and specify it using the absolute path in `ruby` setting.

# Windows Support

To run this on Windows, you’ll need [WSL (Windows Subsystem for Linux)](https://learn.microsoft.com/en-us/windows/wsl/).  
If you're not already using WSL, we recommend [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) for better compatibility and performance.

Once WSL is set up and a Linux distribution is installed, you can use the tool as described above.  
Make sure your configuration file and script paths are accessible from within your WSL environment.

## Setting Up on Windows with WSL

Which allows you to run Linux distributions directly inside Windows.

As an example, here’s how to set up the environment using the official Arch Linux image:

```powershell
wsl --install archlinux
```

After launching Arch Linux for the first time, update the system:

```bash
sudo pacman -Syu
```

Then, install the required packages:

```bash
sudo pacman -S ruby lighttpd
```

Prepare the project directory and configuration folder:

```bash
mkdir -p ~/.local/opt
cd ~/.local/opt
git clone https://github.com/reasonset/localwebmediaplayer.git
cd
mkdir -p ~/.config/reasonset
```

Once this setup is complete, you're ready to configure and start the server using the provided script.  
Make sure your configuration file (`lwmp.yaml`) is placed under `~/.config/reasonset/`.

## Prepare media folders

### How to Specify Media for Distribution (For Windows Users)

To distribute folders (like music or videos) with LWMP, they must be accessible from your WSL instance.

#### How WSL Can See Windows Folders

In WSL, your Windows folders are mounted under `/mnt/`.

| Location on Windows               | Path in WSL                          |
|-----------------------------------|--------------------------------------|
| `C:\Users\username\Music`         | `/mnt/c/Users/username/Music`        |
| `D:\Videos`                       | `/mnt/d/Videos`                      |

#### Grouping Multiple Folders into One Directory

If you'd like to distribute several folders at once, you can use symbolic links to combine them inside a single directory in WSL:

```bash
mkdir ~/media
ln -s /mnt/c/Users/<username>/Music ~/media/Music
ln -s /mnt/c/Users/<username>/Videos ~/media/Videos
```

Now you can specify `~/media` as your LWMP source directory, and both Music and Videos will be available.

## Editing the Configuration File (`lwmp.yaml`)

If you're using WSL on Windows, it's recommended to edit the configuration file using a text editor you're familiar with.

You can either:

* Use a graphical editor on Windows by accessing the WSL file system via the path:  
  `\\wsl.localhost\<DistroName>\home\<username>\.config\reasonset\lwmp.yaml`  
  (Note: `<DistroName>` is typically something like `Arch`, `Ubuntu`, etc.)
* Or, use a basic editor inside WSL, such as `nano`, which is easier for beginners than `vim`:  
  ```bash
  sudo pacman -S nano   # If nano is not installed
  nano ~/.config/reasonset/lwmp.yaml
  ```

Choose whichever method you find more comfortable. Just make sure to save the changes correctly before starting the server.

## Start server

### Start the LWMP Server

Now that everything is set up, you can start the LWMP server using the following command:

```bash
~/.local/opt/localwebmediaplayer/tools/script/lwmp-start.rb <profile_name>
```

If you find this command too long, there are two main ways to simplify it:

#### Option 1: Use an alias

You can define an alias in your `.bashrc` file like this:

```bash
alias lwmp-start="$HOME/.local/opt/localwebmediaplayer/tools/script/lwmp-start.rb"
```

This allows you to run the server simply by typing:

```bash
lwmp-start <profile_name>
```

This is the recommended method as it's easy to manage and update.

#### Option 2: Copy the script to a directory in your PATH

```bash
sudo cp ~/.local/opt/localwebmediaplayer/tools/script/lwmp-start.rb /usr/local/bin/
```

After this, you can start the server using:

```bash
lwmp-start.rb <profile_name>
```

**Note:** If you update the script later, you'll need to copy it again to `/usr/local/bin/`.

# Resources Used

This project includes the following external icon set:

Feather Icons A clean and elegant SVG icon library <https://feathericons.com/> © 2013–2023 Cole Bemis — Licensed under the MIT License

Icon files are located in the `src/img` directory. The corresponding Feather Icons license file is included in that directory.

# Other softwares

* `httpclient.mjs` from [fetchwrapper](https://github.com/reasonset/fetchwrapper) ([Apache License 2.0](https://github.com/reasonset/fetchwrapper/blob/master/LICENSE))
* `rscgi.rb` from [rscgi](https://github.com/reasonset/rscgi) ([MIT LICENSE](https://github.com/reasonset/rscgi/blob/master/LICENSE))
