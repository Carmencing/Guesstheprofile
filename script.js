/* Kahoot music */
const backgroundMusic = new Audio('lobby-classic-game.mp3')
backgroundMusic.loop = true;

document.addEventListener("click", () => {
  backgroundMusic.play();
}, { once: true });

/* Fields players answer by typing. */
const FIELDS = ["gender", "sexuality", "age", "continent", "major"];

/* Add accepted variants here, keyed by field and lowercase canonical answer. */
const ACCEPTED_RESPONSES = {
  gender: {
    "non-binary": ["nonbinary", "non binary"],
  },
  sexuality: {
    bisexual: ["bi"],
    pansexual: ["pan"],
    heterosexual: ["straight"],
    homosexual: ["lesbian, gay"],
  },
  continent: {
    "north america": ["NA"],
  },
  major: {
    "art & design: games + playable media": ["AGPM"],
  },
};

/* Add one Profile object per slide. The image is optional. */
class Profile {
  constructor({ category, image = "", gender, sexuality, age, continent, major }) {
    Object.assign(this, {
      category, image, gender, sexuality, age, continent, major,
    });
  }
}

const PROFILES = [
  new Profile({
    category: "Desk",
    gender: "Female", sexuality: "Unlabeled", age: "20", continent: "North America",major: "Bioengineering",
    image: "A.jpg"
  }),
  new Profile({
    category: "Dinner",
    gender: "Male", sexuality: "Heterosexual", age: "25", continent: "North America", major: "Biology",
    image: "IMG_9375.png",
  }),
  new Profile({
    category: "Bedroom",
    gender: "Male", sexuality: "Bisexual", age: "20", continent: "North America",major: "Art & Design: Games + Playable Media",
    image: "W.jpg",
  }),
];

/* Build the questions and slides from FIELDS and PROFILES. */
// Make the first letter uppercase so names like "gender" look like "Gender".
const capitalize = text => text[0].toUpperCase() + text.slice(1);
const fields = FIELDS;

// Create one typing row for a profile field, such as Gender or Age.
function renderField(profile, name, slideIndex) {
  const answer = profile[name];
  const inputId = `guess-${slideIndex}-${name}`;
  return `
    <div class="field" data-field="${name}" data-answer="${answer}">
      <label for="${inputId}">${capitalize(name)}:</label>
      <input id="${inputId}" class="guess" type="text" placeholder="Type your answer">
      <span class="mark"><b class="icon"></b> Answer: ${answer}</span>
    </div>`;
}

// Create one complete slide. index is its position (starting at 0);
// allProfiles is the full list, which is used to make the navigation.
function renderSlide(profile, index, allProfiles) {
  // The % operator wraps around: the first slide's previous slide is the last.
  const previous = (index - 1 + allProfiles.length) % allProfiles.length;
  const next = (index + 1) % allProfiles.length;

  // Make one clickable dot per slide, and mark this slide's dot as selected.
  const dots = allProfiles.map((_, dotIndex) =>
    `<label for="s${dotIndex}"${dotIndex === index ? ' class="on"' : ""}></label>`
  ).join("");

  // Show the profile image when provided. Leave the picture area empty when it is not.
  const picture = profile.image
    ? `<img src="${profile.image}" alt="${profile.category}">`
    : "";

  // Return the HTML for the picture, arrows, dots, questions, and Submit control.
  return `
    <!-- Selecting this radio displays this slide. The first slide starts selected. -->
    <input type="radio" name="slide" class="slide-radio" id="s${index}"${index === 0 ? " checked" : ""}>
    <section class="slide">
      <!-- Submit is a label for this checkbox; checking it reveals answers and score. -->
      <input type="checkbox" class="reveal" id="r${index}">
      <div class="carousel">
        ${picture}
        <label class="arrow prev" for="s${previous}">◀</label>
        <label class="arrow next" for="s${next}">▶</label>
        <div class="dots">${dots}</div>
      </div>
      <div class="form">
        <div class="category">Category: <span class="category-name">${profile.category}</span></div>
        <!-- Build one typing row for each question name in fields. -->
        ${fields.map(field => renderField(profile, field, index)).join("")}
        <div class="score"></div>
        <label class="submit" for="r${index}">SUBMIT</label>
      </div>
    </section>`;
}

// Run renderSlide once for every profile, join the HTML together, and add it to the page.
const game = document.getElementById("game");
game.insertAdjacentHTML(
  "beforeend", PROFILES.map(renderSlide).join("")
);

function gradeSlide(slide) {
  const fieldRows = [...slide.querySelectorAll(".field")];
  let score = 0;

  fieldRows.forEach(row => {
    const guess = normalizeResponse(row.querySelector(".guess").value);
    const answer = normalizeResponse(row.dataset.answer);
    const acceptedVariants = ACCEPTED_RESPONSES[row.dataset.field]?.[answer] ?? [];
    const isCorrect = [answer, ...acceptedVariants.map(normalizeResponse)].includes(guess);

    row.classList.toggle("correct", isCorrect);
    row.classList.toggle("incorrect", !isCorrect);
    if (isCorrect) score += 1;
  });

  slide.querySelector(".score").textContent = `Score: ${score} / ${fieldRows.length}`;
}

function normalizeResponse(response) {
  return response.trim().toLowerCase();
}

function clearSlideFeedback(slide) {
  slide.querySelectorAll(".field").forEach(row => {
    row.classList.remove("correct", "incorrect");
  });
  slide.querySelector(".score").textContent = "";
}

game.addEventListener("change", event => {
  if (!event.target.matches(".reveal")) return;

  const slide = event.target.closest(".slide");
  if (event.target.checked) {
    gradeSlide(slide);
  } else {
    clearSlideFeedback(slide);
  }
});

// Keep feedback and score current if a player edits an answer after submitting.
game.addEventListener("input", event => {
  if (!event.target.matches(".guess")) return;

  const slide = event.target.closest(".slide");
  if (slide.querySelector(".reveal").checked) gradeSlide(slide);
});