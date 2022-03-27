import worldNameForm from "../controls/worldNameForm";
import downloadButton from "../controls/downloadButton";
import worldNameInput from "../controls/worldNameInput";

function prepareDownload() {
  worldNameForm.style.display = "block";
  downloadButton.blur();
  worldNameInput.focus();
}

export default prepareDownload;
