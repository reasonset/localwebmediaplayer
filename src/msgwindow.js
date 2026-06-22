const msg_show = function(text, type="info") {
  const box = document.getElementById("MsgBox")
  box.innerText = text
  if (type === "err") {
    box.className = "msgshow_err"
  } else {
    box.className = "msgshow_info"
  }

  setTimeout(
    ()=> {
      box.className = "msghide"
    }, 3000
  )
}

export {msg_show}