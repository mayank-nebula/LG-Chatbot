document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("topic-form")
    .addEventListener("submit", async function (event) {
      event.preventDefault();
      const topic = document.getElementById("topic").value;
      const resultDiv = document.getElementById("result");
      let result = "";

      try {
        const response = await fetch("https://20.191.112.232/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: topic }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          console.log("Chunk received:", chunk);

          result += chunk;
          // Update result with streaming content
          resultDiv.innerHTML = marked.parse(result);
        }

        console.log("Final accumulated result:", result);

        // Parse the final accumulated result
        const parsedResponse = JSON.parse(result);
        const { content, chatId, sources } = parsedResponse;

        // Display the content
        resultDiv.innerHTML = marked.parse(content);

        // Log chatId and sources
        console.log("Chat ID:", chatId);
        console.log("Sources:", sources);

      } catch (error) {
        console.error('Error:', error);
      }
    });
});
