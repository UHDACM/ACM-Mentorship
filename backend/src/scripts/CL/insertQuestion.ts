import readline from "readline";
import { DBCreate } from "../../db";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


function getQuestion() {
  rl.question("Question: ", async (q) => {
    if (typeof q != "string" || q.length < 8) {
      console.log("Question is not a string, or not long enough");
      getQuestion();
      return;
    }

    try {
      await DBCreate("assessmentQuestion", {
        inputType: "text",
        question: q,
      });
    } catch (err) {
      console.error(err);
    }
    getQuestion();
  });
}

// getQuestion();
