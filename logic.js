// ==========================================
// 1. ABSTRACT CLASS (ABSTRAKSI)
// ==========================================
class QuestionProvider {
    async fetchQuestion() {
        throw new Error("fetchQuestion() harus dioverride oleh subclass");
    }
}


// ==========================================
// 2. INHERITANCE + POLYMORPHISM
// OpenTrivia Provider
// ==========================================
class OpenTriviaProvider extends QuestionProvider {

    async fetchQuestion() {
        const res = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");
        const data = await res.json();
        const q = data.results[0];

        const decode = (str) => {
            const txt = document.createElement("textarea");
            txt.innerHTML = str;
            return txt.value;
        };

        const answers = [...q.incorrect_answers, q.correct_answer];

        // Shuffle manual (lebih terkontrol)
        for (let i = answers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [answers[i], answers[j]] = [answers[j], answers[i]];
        }

        return {
            question: decode(q.question),
            correct: decode(q.correct_answer),
            answers: answers.map(a => decode(a))
        };
    }
}



// ==========================================
// 3. GAME CLASS (ENCAPSULATION + LOGIC GAME)
// ==========================================
class Game {
    #nyawa = 3;        // private
    #username = "PLAYER"; 
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
        document.getElementById("username").textContent = this.#username;
        this.updateNyawaDisplay();
        this.nextQuestion();
        this.startTimer();
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
                this.nextQuestion();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        document.getElementById("time").textContent = `${this.#timeLeft}s`;
    }

    // -----------------------------
    // LIFE
    // -----------------------------
    reduceLife() {
        this.#nyawa--;
        this.updateNyawaDisplay();

        if (this.#nyawa <= 0) {
            alert("Game Over 😭");
            // location.reload();
            window.location.href = "index.html";
        }else {
            this.nextQuestion();
        }
    }

    updateNyawaDisplay() {
        document.getElementById("nyawa").textContent = "❤".repeat(this.#nyawa);
    }

    // -----------------------------
    // QUESTION HANDLING
    // -----------------------------
    async nextQuestion() {
        this.#timeLeft = 60;
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
        if (selected === correct) {
            alert("ANDA BENAR");
            this.nextQuestion();
        } else {
            alert("SALAH YANG BENAR: " + correct);
            this.reduceLife();
        }

        
    }
}



// ==========================================
// 4. START GAME
// ==========================================
const provider = new OpenTriviaProvider();
const game = new Game(provider);

window.onload = () => {
    game.start();
};
