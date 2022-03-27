import loadFileButton from "../controls/loadFileButton";

function openFile() {
  loadFileButton.blur();
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "text/plain";
  input.onchange = function (event) {
    processFile(event.target.files[0]);
  };
  input.click();
}

export default openFile;
