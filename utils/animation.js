// utils/animation.js
// Retro-style animation utilities for terminal/typewriter effects

class RetroAnimator {
  constructor(options = {}) {
    this.defaultSpeed = options.defaultSpeed || 50;
    this.cursorChar = options.cursorChar || "█";
    this.cursorClass = options.cursorClass || "retro-cursor";
    this.lineDelay = options.lineDelay || 100;
  }

  // Create blinking cursor CSS if it doesn't exist
  ensureCursorCSS() {
    if (!document.querySelector("#retro-cursor-style")) {
      const style = document.createElement("style");
      style.id = "retro-cursor-style";
      style.textContent = `
        .${this.cursorClass} {
          animation: retro-blink 1s infinite;
          color: #9acd32;
        }
        @keyframes retro-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Hide element initially
  hideElement(element) {
    if (typeof element === "string") {
      element = document.getElementById(element);
    }
    if (element) {
      element.style.visibility = "hidden";
    }
    return element;
  }

  // Show element
  showElement(element) {
    if (typeof element === "string") {
      element = document.getElementById(element);
    }
    if (element) {
      element.style.visibility = "visible";
    }
    return element;
  }

  // Typewriter effect for single line text
  typewriterText(element, text, speed = this.defaultSpeed) {
    return new Promise((resolve) => {
      if (typeof element === "string") {
        element = document.getElementById(element);
      }

      this.ensureCursorCSS();
      this.showElement(element);
      element.innerHTML = "";

      let currentChar = 0;

      const typeNext = () => {
        if (currentChar >= text.length) {
          element.innerHTML = text;
          resolve();
          return;
        }

        element.innerHTML =
          text.substring(0, currentChar + 1) +
          `<span class="${this.cursorClass}">${this.cursorChar}</span>`;
        currentChar++;
        setTimeout(typeNext, speed);
      };

      typeNext();
    });
  }

  // Typewriter effect for multi-line ASCII art
  typewriterASCII(element, asciiText, speed = 15) {
    return new Promise((resolve) => {
      if (typeof element === "string") {
        element = document.getElementById(element);
      }

      this.ensureCursorCSS();
      this.showElement(element);

      const lines = asciiText.trim().split("\n");
      let currentLine = 0;
      let currentChar = 0;
      let displayText = "";

      const typeNext = () => {
        if (currentLine >= lines.length) {
          element.innerHTML = displayText;
          resolve();
          return;
        }

        const line = lines[currentLine];

        if (currentChar < line.length) {
          displayText =
            lines.slice(0, currentLine).join("\n") +
            (currentLine > 0 ? "\n" : "") +
            line.substring(0, currentChar + 1);

          element.innerHTML =
            displayText +
            `<span class="${this.cursorClass}">${this.cursorChar}</span>`;
          currentChar++;
          setTimeout(typeNext, speed);
        } else {
          currentLine++;
          currentChar = 0;

          if (currentLine < lines.length) {
            displayText += "\n";
          }

          setTimeout(typeNext, this.lineDelay);
        }
      };

      typeNext();
    });
  }

  // Typewriter effect for structured content (like tech specs)
  typewriterStructured(element, structure, speed = this.defaultSpeed) {
    return new Promise(async (resolve) => {
      if (typeof element === "string") {
        element = document.getElementById(element);
      }

      this.showElement(element);
      element.innerHTML = "";

      // Type title if provided
      if (structure.title) {
        const titleEl = document.createElement("div");
        titleEl.className = structure.titleClass || "";
        element.appendChild(titleEl);
        await this.typewriterText(titleEl, structure.title, speed);

        if (structure.titleDelay) {
          await this.delay(structure.titleDelay);
        }
      }

      // Type list items if provided
      if (structure.items && Array.isArray(structure.items)) {
        const listEl = document.createElement("ul");
        if (structure.listClass) {
          listEl.className = structure.listClass;
        }
        element.appendChild(listEl);

        for (let i = 0; i < structure.items.length; i++) {
          const li = document.createElement("li");
          if (structure.itemClass) {
            li.className = structure.itemClass;
          }
          listEl.appendChild(li);

          await this.typewriterText(li, structure.items[i], speed);

          if (i < structure.items.length - 1 && structure.itemDelay) {
            await this.delay(structure.itemDelay);
          }
        }
      }

      resolve();
    });
  }

  // Simple delay utility
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Show element instantly (no animation)
  showInstantly(element) {
    if (typeof element === "string") {
      element = document.getElementById(element);
    }
    if (element) {
      element.style.display = "block";
      element.style.visibility = "visible";
    }
  }

  // Animation sequence runner
  async runSequence(animations) {
    for (const animation of animations) {
      if (animation.delay) {
        await this.delay(animation.delay);
      }

      switch (animation.type) {
        case "typewriter-text":
          await this.typewriterText(
            animation.element,
            animation.text,
            animation.speed
          );
          break;
        case "typewriter-ascii":
          await this.typewriterASCII(
            animation.element,
            animation.text,
            animation.speed
          );
          break;
        case "typewriter-structured":
          await this.typewriterStructured(
            animation.element,
            animation.structure,
            animation.speed
          );
          break;
        case "show-instantly":
          this.showInstantly(animation.element);
          break;
        case "custom":
          if (animation.callback) {
            await animation.callback();
          }
          break;
      }

      if (animation.postDelay) {
        await this.delay(animation.postDelay);
      }
    }
  }
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = RetroAnimator;
}

// Make available globally
window.RetroAnimator = RetroAnimator;
