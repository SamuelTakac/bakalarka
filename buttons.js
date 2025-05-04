function myFunction() {
  document.getElementById("priklady").classList.toggle("show");
}

function myFunction2() {
  document.getElementById("export").classList.toggle("show");
}

document.addEventListener('DOMContentLoaded', function() {

  document.querySelector(".prikladbtn").addEventListener("click", myFunction);
  
  window.onclick = function(event) {
    if (!event.target.matches('.prikladbtn')) {
      var dropdowns = document.getElementsByClassName("priklady-content");
      for (var i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  };

  document.querySelectorAll(".exportbtn").forEach(button => {
    button.addEventListener("click", function (event) {
      event.stopPropagation(); // Prevent window click from firing
      closeAllDropdowns(); // Close others first
  
      // Toggle this button's corresponding dropdown
      const dropdown = this.nextElementSibling;
      if (dropdown && dropdown.classList.contains("export-content")) {
        dropdown.classList.toggle("show");
      }
    });
  });
  
  // Close dropdowns if clicking outside
  window.addEventListener("click", function () {
    closeAllDropdowns();
  });
  
  // Helper to close all dropdowns
  function closeAllDropdowns() {
    document.querySelectorAll(".export-content.show").forEach(dropdown => {
      dropdown.classList.remove("show");
    });
  }

});


const openModalButtons = document.querySelectorAll('[data-modal-target]')
const closeModalButtons = document.querySelectorAll('[data-close-button]')
const overlay = document.getElementById('overlay')

openModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = document.querySelector(button.dataset.modalTarget)
    openModal(modal)
  })
})

overlay.addEventListener('click', () => {
  const modals = document.querySelectorAll('.modal.active')
  modals.forEach(modal => {
    closeModal(modal)
  })
})

closeModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal')
    closeModal(modal)
  })
})

function openModal(modal) {
  if (modal == null) return
  modal.classList.add('active')
  overlay.classList.add('active')
}

function closeModal(modal) {
  if (modal == null) return
  modal.classList.remove('active')
  overlay.classList.remove('active')
}



window.copyLatex = function(div) {
  const text = window[div];
  const content = text.slice(7, -4); // 8th character is at index 7
  if (!content || content.trim() === "") {
    return;
  }
  let finalText = "";
  if(div !== "tree"){
    // Find the first '%' and slice up to that
    const percentIndex = content.indexOf('%');
    const cleanContent = (percentIndex !== -1 ? content.slice(0, percentIndex) : content).trim();

    // Check if it already ends with \end{align}, if not, append it
    const endAlign = '\\end{align}';
    finalText = cleanContent.endsWith(endAlign) ? cleanContent : cleanContent + ' ' + endAlign;
  }
  else{
    // For tree, just use the content as is
    finalText = content;
  }
  navigator.clipboard.writeText(finalText)
    .then(() => {
      alert("LaTeX kód bol úspešne skopírovaný.!");
    })
    .catch((error) => {
      alert("Nastala chyba pri kopírovaní.", error);
    });
};

document.getElementById("darkModeToggle").addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");
  document.querySelector(".navbar").classList.toggle("dark-mode");
  document.querySelectorAll(".resizer").forEach(function(resizer) {
    resizer.classList.toggle("dark-mode");
  });
  document.querySelector(".checkbox-label").classList.toggle("dark-mode");
  document.querySelector(".prikladbtn").classList.toggle("dark-mode");
  document.querySelectorAll(".cute-button").forEach(function(button) {
    button.classList.toggle("dark-mode");
  });
  document.querySelectorAll(".fullscreen-button").forEach(function(button) {
    button.classList.toggle("dark-mode");
  });
  document.querySelector("#increaseFontSizeAndLineHeight").classList.toggle("dark-mode");
  document.querySelector("#decreaseFontSizeAndLineHeight").classList.toggle("dark-mode");
  document.querySelector(".results-container").classList.toggle("dark-mode");
  document.querySelector(".size-container").classList.toggle("dark-mode");
  document.querySelector(".constants-container").classList.toggle("dark-mode");
  document.querySelector(".evaluate-container").classList.toggle("dark-mode");
  document.querySelector(".depth-container").classList.toggle("dark-mode");
  document.querySelector(".error_container").classList.toggle("dark-mode");
  window.editor.updateOptions({ theme: document.body.classList.contains("dark-mode") ? "vs-dark" : "vs" });
  document.querySelector(".modal").classList.toggle("dark-mode");
  const icon = document.getElementById("icon");
  if (icon.textContent === "🌞") {
    icon.textContent = "🌙";
  } else {
    icon.textContent = "🌞";
  }
});

