# Version 2

## v2.1.0 (2026-06-25)

* Improve mediaSession action handler
  * It might also help alleviate the issue of apps being force-closed on mobile devices to some extent.
  * The `play()` and `pause()` methods have also been implemented, but they do not work if you are using vLiteJS.
* Favicon is added

## v2.0.1 (2026-06-23)

* Fix bug: Error on thumbnailable media in root

## v2.0.0 (2026-06-22)

**IMCOMPATIBLE CHANGES**

* Settings are now passed to environment variables as YAML strings via `lwmp-start.rb`.
  * As a result, `config.rb` is no longer needed.
  * The way some settings are specified has changed; values that should be Boolean are now passed as actual Boolean values rather than strings like “no”.
  * Instead of specifying `exclude` as a string, you must now pass an array as the `exclude_exts` entry.
  * It is now effectively mandatory to use `lwmp-start.rb` to start the service.
  * You no longer need to update the Lighttpd configuration file when new configuration values are added.
* Add report decoding error and batch cli.
* The `thumb` setting has been removed.
  * It has been merged into `cache_root`, and `$cache_root/thumb` is now used instead. Clients now use `/transcode/thumb` instead.
* The `metadata` setting has been removed.
  * It has been merged into `data_root`, and `$data_root/metadata` is now used.
* Determine whether a thumbnail exists in the server application and suppress thumbnail requests that result in a "Not Found" error
* Added a fallback mechanism for when audio files cannot be played
  * If `report_decode_error` is true, the client sends a notification to the server when it fails to play an audio file
  * The sent notification is added to the fallback list. This list is used by `create-transcode.rb` during batch processing.
  * `create-transcode.rb` generates fallback audio files and records the fallback information in `transcode_meta.json`. If the original audio file is lossy, it generates two versions: one with the metadata removed and one re-encoded in Opus.
  * The client retrieves `transcode_meta.json` and, if listed there, fetches the fallback audio file instead. This occurs even if `report_decode_error` is disabled.
* Included the rscgi library

# Version 1

## v1.4.3 (2026-06-07)

* Revert to 1.4.1

## v1.4.2 (2026-06-07)

* Update CSS for video players

## v1.4.1 (2026-05-28)

* Update thumbnail util

## v1.4.0 (2026-05-26)

* Add player library support (Vidstack, vLiteJS, Plyr, Fluid Player)

## v1.3.1 (2026-05-17)

* Add extension excluding

## v1.3.0 (2026-05-17)

* Add thumbnail support

## v1.2.1(2026-04-16)

* Use home made CGI class instead of standard library CGI

## v1.2.0 (2026-02-19)

* Backport from Kolmics

## v1.1.1 (2025-09-03)

* Fix force single bug

## v1.1.0 (2025-09-03)

* Add Book reader shortcut: `Home`, `End`, `Esc`
* Open PDF in external

## v1.0.0 (2025-08-01)

* Add metadata support
* Add loading splash screen when getting metadata
* Update message OSD
* Update fetchwrapper library
* Show JSON file as text file
* Getting server infomation
* Update cover image support

# Development alpha

## v0.2.1 (2025-07-30)

* Add text viewer

## v0.2.0 (2025-07-29)

* Change startup way
* Add windows support to README
* ! Incompatible changes!
* ! metadata function is not ready yet.

## v0.1.2 (2025-07-25)

* Add Back nagivation support

## v0.1.1 (2025-07-25)

* Add keyboard navigation
* Fix best fit logic

## v0.1.0 (2025-07-24)

* Add Book reader feature
* Add Image viewer
