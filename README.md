<!DOCTYPE html>
<html>
  <head>
    <title>Markdown Generator</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  </head>

  <body>
    <h1>Markdown Generator</h1>
    <form id="topic-form">
      <label for="topic">Enter a topic:</label>
      <input type="text" id="topic" name="topic" />
      <button type="submit">Generate</button>
    </form>
    <div id="result"></div>
    <script>
      document
        .getElementById("topic-form")
        .addEventListener("submit", async function (event) {
          event.preventDefault();
          const topic = document.getElementById("topic").value;
          const response = await fetch("http://localhost:8000/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ question: topic }),
          });
          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          const resultDiv = document.getElementById("result");
          let accumulatedContent = "";
          let chatId = null;
          let sources = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // Accumulate chunks
            accumulatedContent += chunk;

            // Process the accumulated content
            try {
              // Try to parse the accumulated content
              const parsed = JSON.parse(accumulatedContent);
              
              // Extract content
              if (parsed.type === "text") {
                resultDiv.innerHTML = marked.parse(parsed.content);
              }

              // Extract additional fields if present
              if (parsed.chatId) chatId = parsed.chatId;
              if (parsed.sources) sources = parsed.sources;
              
              // Reset accumulatedContent if full response is parsed
              accumulatedContent = ""; 
            } catch (error) {
              // Handle JSON parsing error
              console.error("Error parsing JSON:", error);
            }
          }

          // Handle the final data
          console.log("Chat ID:", chatId);
          console.log("Sources:", sources);
        });
    </script>
  </body>
</html>
