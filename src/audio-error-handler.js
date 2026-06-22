import { http } from '/httpclient.mjs'
import { msg_show } from './msgwindow.js'
import { currentState } from './current_state.js'

const report_endpoint = "decode_error.rb"

const audio_error_handler = async function(e) {
  const target = e.target
  const error_state = target.error
  const error_code = error_state.code
  msg_show(`Playback failed (Code: ${error_code})`, "err")

  if (currentState.systemInfo.report_decode_error && (error_code === 3 || error_code === 4)) {
    const url = new URL(target.src, location.href)
    const path = url.pathname
    const decoded = url.pathname.replace(new RegExp("^/media/"), "").split("/").map(decodeURIComponent).join("/")
    const report_object = {path, decoded}
    try {
      const result = await http.post(report_endpoint, report_object)
      msg_show("Corrupted song reported.")
    } catch(e) {
      msg_show("Report failed.", "err")
    }
  }
}

export {audio_error_handler}