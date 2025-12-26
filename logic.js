// ==========================================
// 1. ABSTRACT CLASS (ABSTRAKSI)
// ==========================================
class QuestionProvider {
    async fetchQuestion() {
        throw new Error("fetchQuestion() harus dioverride oleh subclass");
    }
}

const popup = document.getElementById("popup");
const closePopup = document.getElementById("closePopup");

function showPopup() {
  popup.classList.remove("hidden");
}

closePopup.addEventListener("click", () => {
  popup.classList.add("hidden");
  window.location.href = "index.html";
});



// ==========================================
// 2. INHERITANCE + POLYMORPHISM
// OpenTrivia Provider
// ==========================================
class OpenTriviaProvider extends QuestionProvider {
    #questions = [];  // menyimpan batch soal
    #index = 0;       // penunjuk soal saat ini

    async loadQuestions(amount = 20) {
        const res = await fetch(`https://opentdb.com/api.php?amount=${amount}&type=multiple`);
        const data = await res.json();

        // decode helper
        const decode = (str) => {
            const txt = document.createElement("textarea");
            txt.innerHTML = str;
            return txt.value;
        };

        this.#questions = data.results.map(q => {
            const answers = [...q.incorrect_answers, q.correct_answer];

            // Shuffle manual
            for (let i = answers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [answers[i], answers[j]] = [answers[j], answers[i]];
            }

            return {
                question: decode(q.question),
                correct: decode(q.correct_answer),
                answers: answers.map(a => decode(a))
            };
        });
    }

    async fetchQuestion() {
        // Jika array habis → load ulang
        if (this.#questions.length === 0 || this.#index >= this.#questions.length) {
            await this.loadQuestions(20);
            this.#index = 0;
        }

        // ambil soal lalu increment
        return this.#questions[this.#index++];
    }
}

// ==========================================
// 3. GAME CLASS (ENCAPSULATION + LOGIC GAME)
// ==========================================
class Game {
    score = 0;       
    #provider;
    #timerInterval;
    #timeLeft = 60;    // 60 detik per soal

    constructor(provider) {
        this.#provider = provider;
    }

    // -----------------------------
    // INIT GAME
    // -----------------------------
    start() {
        this.nextQuestion();
        this.startTimer();
    }
    reset() {
        clearInterval(this.#timerInterval); // stop timer lama

        this.score = 0;
        this.#timeLeft = 10;
        this.updateScoreDisplay();
        this.updateTimerDisplay();
    }
    // -----------------------------
    // TIMER
    // -----------------------------
    startTimer() {
        clearInterval(this.#timerInterval);

        this.#timerInterval = setInterval(() => {
            this.#timeLeft--;
            this.updateTimerDisplay();

            if (this.#timeLeft <= 0) {
                this.reduceLife();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        document.getElementById("time").textContent = `${this.#timeLeft}s`;
    }
    updateScoreDisplay() {
        document.getElementById("now_score").textContent = this.score;
    }
    skorakhir() {
        document.getElementById("skorTampil").textContent = this.score;
    }
    simpan() {
        const riwayat = JSON.parse(localStorage.getItem("dataGame")) || [];

        riwayat.push({
            skor: this.score,
            tanggal: new Date().toISOString()
        });

        localStorage.setItem("dataGame", JSON.stringify(riwayat)); 
    }

    // -----------------------------
    // LIFE
    // -----------------------------
    reduceLife() {
        if (this.#timeLeft <= 0) {
            clearInterval(this.#timerInterval);
            document.getElementById("time").textContent = "0";
            document.getElementById("game").classList.add("opacity-0", "pointer-events-none");
            this.skorakhir();
            showPopup();
            this.simpan();
        }else {
            this.nextQuestion();
        }
    }

    

    // -----------------------------
    // QUESTION HANDLING
    // -----------------------------
    async nextQuestion() {
        this.updateTimerDisplay();

        const q = await this.#provider.fetchQuestion();

        // tampilkan soal
        document.getElementById("soal").textContent = q.question;

        // buat tombol jawaban
        const jawabanDiv = document.getElementById("jawaban");
        jawabanDiv.innerHTML = "";

        q.answers.forEach(ans => {
            const btn = document.createElement("button");
            btn.textContent = ans;
            btn.className =
                "p-4 bg-white rounded-lg text-xl hover:bg-gray-200 transition font-semibold";

            btn.onclick = () => this.checkAnswer(ans, q.correct);

            jawabanDiv.appendChild(btn);
        });
    }

    // -----------------------------
    // CHECK ANSWER
    // -----------------------------
    checkAnswer(selected, correct) {
        const buttons = document.querySelectorAll("#jawaban button");
        
        buttons.forEach(btn => btn.disabled = true); // cegah spam klik

        buttons.forEach(btn => {
            btn.classList.remove("hover:bg-gray-200");
            if (btn.textContent === correct) {
                // jawaban benar
                btn.classList.add("!bg-green-400");
                  
            }

            if (btn.textContent === selected && selected !== correct) {
                btn.classList.add("!bg-red-400"); // jawaban salah
            }
        });

        if (selected === correct) {
            this.score += 10;
            this.updateScoreDisplay();
        }

        setTimeout(() => {
            this.nextQuestion();
        }, 1000);
    }

}



// ==========================================
// 4. START GAME
// ==========================================
const provider = new OpenTriviaProvider();
const game = new Game(provider);

window.onload = async() => {
    await provider.loadQuestions();
    game.reset();
    game.start();
};
