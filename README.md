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
          let resultText = "";
          let sources = null;
          let chatId = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const jsonChunk = JSON.parse(chunk);

            if (jsonChunk.type === "text") {
              resultText += jsonChunk.content;
              resultDiv.innerHTML = marked.parse(resultText);
            } else if (jsonChunk.type === "sources") {
              sources = jsonChunk.content;
              const sourcesDiv = document.createElement("div");
              sourcesDiv.innerHTML = `<h2>Sources</h2><pre>${JSON.stringify(sources, null, 2)}</pre>`;
              resultDiv.appendChild(sourcesDiv);
            } else if (jsonChunk.type === "chatId") {
              chatId = jsonChunk.content;
              const chatIdDiv = document.createElement("div");
              chatIdDiv.innerHTML = `<h2>Chat ID</h2><p>${chatId}</p>`;
              resultDiv.appendChild(chatIdDiv);
            }
          }
        });
    </script>
  </body>
</html>
