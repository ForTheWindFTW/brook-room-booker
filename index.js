"use strict";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000; // 86,400,000
const NO_STUDENT_TEXT = "";
let students, beginDay;
updateBeginDay();
getStudentData();

window.onload = () => {
  document.getElementById("prevWeekButton").addEventListener("click", changeToPreviousWeek);
  document.getElementById("nextWeekButton").addEventListener("click", changeToNextWeek);
  window.addEventListener("keydown", keyPressEventListener);

  const timePeriods = document.getElementsByClassName("studentData");
  for(let i = 0; i < timePeriods.length; i++) {
    timePeriods[i].addEventListener("click", function(event) {
      setDateAndPeriod(this, i);
      if(event.ctrlKey) {
        showStudentDetails(i);
      }
    });
    timePeriods[i].expanded = false;
  }

  document.getElementById("studentSubmit").addEventListener("click", validateForm);
  document.getElementById("helpIconBackground").addEventListener("click", toggleHelpMenu);
  document.getElementById("helpIcon").addEventListener("click", toggleHelpMenu);
}

function keyPressEventListener(event) {
  switch(event.code) {
    case "ArrowLeft":
      if(event.ctrlKey) {
        changeToPreviousWeek();
      }
      break;
    case "ArrowRight":
      if(event.ctrlKey) {
        changeToNextWeek();
      }
      break;
  }
}

function updateBeginDay(time = new Date().getTime()) {
  var tomorrow = new Date(time + ONE_DAY_IN_MS);
  beginDay = new Date(tomorrow.getTime() - (tomorrow.getDay() - 1) * ONE_DAY_IN_MS)
}

function updateDays() {
  const dates = document.getElementsByClassName("dateHeader");
  dates[0].innerHTML = beginDay.toDateString().substr(4);
  dates[1].innerHTML = new Date(beginDay.getTime() + ONE_DAY_IN_MS).toDateString().substr(4);
  dates[2].innerHTML = new Date(beginDay.getTime() + ONE_DAY_IN_MS * 2).toDateString().substr(4);
  dates[3].innerHTML = new Date(beginDay.getTime() + ONE_DAY_IN_MS * 3).toDateString().substr(4);
  dates[4].innerHTML = new Date(beginDay.getTime() + ONE_DAY_IN_MS * 4).toDateString().substr(4);

  const today = new Date().toDateString().substr(4);
  for(let date of dates) {
    today === date.textContent ? date.setAttribute("id", "today") : date.removeAttribute("id");
  }

  const timePeriods = document.getElementsByClassName("studentData");
  for(let timePeriod of timePeriods){
    if("studentData" !== timePeriod.getAttribute("class")) {
      timePeriod.setAttribute("class", "studentData");
    }
    if(timePeriod.expanded) {
      timePeriod.expanded = false;
    }
  }
}

function updateStudents() {
  const elStudentTimes = document.getElementsByClassName("studentData");
  const elDates = document.getElementsByClassName("dateHeader");

  for(let dayOfWeek = 0; dayOfWeek < 5; dayOfWeek++) {
    const yymmdd = new Date(elDates[dayOfWeek].textContent).toISOString().split("T")[0].split("-");
    for(let period = 0; period < 4; period++) {
      if(elStudentTimes[dayOfWeek + period * 5].expanded === true) {
        continue;
      }
      elStudentTimes[dayOfWeek + period * 5].textContent = "";
      for(let studentIndex = 0; studentIndex < 8; studentIndex++) {
        try {
          var student = students[yymmdd[0]][yymmdd[1]][yymmdd[2]][period + 1][studentIndex];
          if(student === undefined) {
            throw new Error(`students[${yymmdd[0]}][${yymmdd[1]}][${yymmdd[2]}][${period + 1}][${studentIndex}] is undefined`);
          }
          elStudentTimes[dayOfWeek + period * 5].innerText += `${studentIndex + 1} ${student.name}\n`;
          if(7 === studentIndex) {
            elStudentTimes[dayOfWeek + period * 5].setAttribute("class", "studentData full");
            elStudentTimes[dayOfWeek + period * 5].title = "This day is fully booked.";
          }
        } catch(error) {
          break;
        }
      }
    }
  }
}

function getStudentData() {
  const xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = () => {
    if(4 === xmlhttp.readyState && 200 === xmlhttp.status) {
      const data = xmlhttp.responseText;
      console.log("Data Recieved:");
      console.log(data);
      students = 0 === data.length ? {} : JSON.parse(data);
      updateDays();
      updateStudents();
    }
  }
  xmlhttp.open("get", "/studentData", true)
  xmlhttp.send();
}

function changeToPreviousWeek() {
  updateBeginDay(beginDay.getTime() - ONE_DAY_IN_MS * 7);
  updateDays();
  updateStudents();
}

function changeToNextWeek() {
  updateBeginDay(beginDay.getTime() + ONE_DAY_IN_MS * 7);
  updateDays();
  updateStudents();
}

function setDate(date) {
  document.getElementById("studentDateInput").valueAsDate = date;
}

function setPeriod(index) {
  document.getElementById("studentPeriodInput").selectedIndex = index;
}

function setDateAndPeriod(element, index) {
  if("studentData" === element.getAttribute("class")) {
    setDate(new Date(document.getElementsByClassName("dateHeader")[index % 5].textContent));
    setPeriod(index / 5 + 1);
  } else {
    alert("The day clicked is fully booked.");
  }
}

function validateForm() {
  const dayIndex = document.getElementById("studentDateInput").valueAsDate.getDay();
  const periodIndex = document.getElementById("studentPeriodInput").value - 1;
  const timePeriod = document.getElementsByClassName("studentData")[dayIndex + periodIndex * 5];
  const submit = document.getElementById("studentSubmit");
  if("studentData full" === timePeriod.getAttribute("class")) {
    submit.setCustomValidity("Warning: Full");
  } else if(false === submit.checkValidity()) {
    submit.setCustomValidity("");
  }
}

function toggleHelpMenu() {
  const sideBar = document.getElementById("sideBar");
  const sideBarPosition = parseFloat(getComputedStyle(sideBar).left);
  if(0 !== sideBarPosition) {
    sideBar.setAttribute("style", "left: 0; box-shadow: 0 0 0 10000vw rgba(0, 0, 0, 0.5);");
    document.getElementsByTagName("body")[0].addEventListener("click", toggleHelpMenu);
  } else {
    sideBar.removeAttribute("style");
    document.getElementsByTagName("body")[0].removeEventListener("click", toggleHelpMenu);
  }
}

function showStudentDetails(timePeriod) {
  const el = document.getElementsByClassName("studentData")[timePeriod];
  const elDates = document.getElementsByClassName("dateHeader")[timePeriod % 5];

  const yymmdd = new Date(elDates.textContent).toISOString().split("T")[0].split("-");
  const period = Math.floor(timePeriod / 5);

  if(el.expanded === false) {
    el.expanded = true;
  } else {
    el.expanded = false;
    updateStudents();
    return;
  }
  el.textContent = "";
  for(let studentIndex = 0; studentIndex < 8; studentIndex++) {
    try {
      var student = students[yymmdd[0]][yymmdd[1]][yymmdd[2]][period + 1][studentIndex];
      if(student === undefined) {
        throw new Error(`students[${yymmdd[0]}][${yymmdd[1]}][${yymmdd[2]}][${period + 1}][${studentIndex}] is undefined`);
      }
      el.innerText += `${studentIndex + 1} ${student.name}
       >${student.teacher}
       >${student.course}
       >${student.room}\n`;
    } catch(error) {
      break;
    }
  }
}
