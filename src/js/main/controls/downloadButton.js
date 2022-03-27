import prepareDownload from "../functions/prepareDownload";

const downloadButton = document.getElementById("downloadButton");
downloadButton.onclick = prepareDownload;

export default downloadButton;
