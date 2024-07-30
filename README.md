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
          let result = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });
            // Update result with streaming content
            resultDiv.innerHTML = marked.parse(result);
          }

          // Handle the final accumulated result
          const parsedResponse = JSON.parse(result);
          const { content, chatId, sources } = parsedResponse;
          
          // Display the content
          resultDiv.innerHTML = marked.parse(content);
          
          // Log chatId and sources for now (you can handle it as needed)
          console.log("Chat ID:", chatId);
          console.log("Sources:", sources);
        });
    </script>
  </body>
</html>
