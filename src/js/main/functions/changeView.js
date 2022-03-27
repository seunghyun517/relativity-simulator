import viewButton from "./viewButton.js";

function changeView() {
  viewButton.blur();
  if (usingRelativity == 0) {
    viewButton.value = "Weak Relativity";
    viewButton.style.background = "orange";
    usingRelativity = 1;
  } else if (usingRelativity == 1) {
    viewButton.value = "Strong Relativity";
    viewButton.style.background = "red";
    usingRelativity = 2;
  } else {
    viewButton.value = "Relativity OFF";
    viewButton.style.background = "white";
    usingRelativity = 0;
  }
}

export default changeView;
