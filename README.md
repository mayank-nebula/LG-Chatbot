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
    document.getElementById("topic-form").addEventListener("submit", async function (event) {
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
      let partialChunk = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partialChunk += decoder.decode(value, { stream: true });

        let boundary = partialChunk.indexOf('}{');

        while (boundary !== -1) {
          const completeChunk = partialChunk.slice(0, boundary + 1);
          partialChunk = partialChunk.slice(boundary + 1);

          try {
            const parsedResponse = JSON.parse(completeChunk);
            processResponse(parsedResponse, resultDiv);
          } catch (e) {
            console.error("Error parsing JSON chunk:", completeChunk, e);
          }

          boundary = partialChunk.indexOf('}{');
        }
      }

      // Handle any remaining incomplete JSON object
      if (partialChunk.trim().length > 0) {
        try {
          const parsedResponse = JSON.parse(partialChunk);
          processResponse(parsedResponse, resultDiv);
        } catch (e) {
          console.error("Error parsing remaining JSON chunk:", partialChunk, e);
        }
      }
    });

    function processResponse(parsedResponse, resultDiv) {
      if (parsedResponse.type === "text") {
        resultDiv.innerHTML += marked.parse(parsedResponse.content);
      } else if (parsedResponse.type === "sources" || parsedResponse.type === "chatId") {
        console.log(`${parsedResponse.type}:`, parsedResponse.content);
      }
    }
  </script>
</body>
</html>
